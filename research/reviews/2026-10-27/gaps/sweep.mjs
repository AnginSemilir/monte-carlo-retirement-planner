/*
 * THE GAPS SWEEP (EXPLORATORY; research/reviews/2026-10-27/GAPS-SWEEP.md). V2's state check (research/tests/state-check.test.mjs)
 * run across plan options its five households never use. A case is a base household and one change to its plan. The light
 * candidate (the state check's LIGHT) is solved on it; the engine and the solver's forward run (runPolicy) then step through
 * the same paths taking the same moves (the engine takes the forward run's move each year), and their states are compared
 * slot by slot at the top of every year, with the wealth at the end where the forward run survives, as the state check does.
 * Two guards against a pass that ran on nothing:
 *   - live: each case counts the household-years its change acted in (read from the engine's context and rows, in the years
 *     the forward run was still running); a case with none fails;
 *   - planted: each case perturbs the forward run's copy of its feature (the compiled household r.c, after the solve) and runs
 *     the lockstep again: the two must part by more than a pound, or the case fails.
 *   node <this file> [all | case-name substring] [--paths N] [--list]      (from the root of the code under test)
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js');
const { runPolicy } = await imp('src/solver/solve.js');
const { vecOf } = await imp('src/solver/grid.js');
const { modelStateOf, withTable } = await imp('src/solver/bridge.js');
const { solveCandidate } = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');

const codeHash = (() => { const h = createHash('sha256'); for (const f of readdirSync('src/solver').filter(x => x.endsWith('.js')).sort()) h.update(f).update(readFileSync(`src/solver/${f}`)); h.update(readFileSync('research/solver/candidate.json')); h.update(readFileSync('research/engine.mjs')); return h.digest('hex').slice(0, 12); })();
const args = process.argv.slice(2), at = args.indexOf('--paths');
const NP = at >= 0 ? Number(args[at + 1]) : 20, SEED = 99001, ONLY = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--paths') || 'all';
// the state check's light candidate: the candidate's moves, tiers, switch charge and lump sums; its table crude
const LIGHT = { lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } };
const Y0 = 2026;

// ---------------------------------------------------------------- the households
const acc = (id, owner, category, balance, risk, extra = {}) => ({ id, owner, category, balance, contrib: 0, growth: 0, risk, ...extra });
// the state check's taxable household (solver-carry.test.mjs): 66, retired, £400k in the GIA holding £240k of gain
const CARRY = {
  demographics: { planningMode: 'single', currentAgeSelf: 66, retireAgeSelf: 66, terminalAge: 95, statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976 },
  spending: { targetSpend: 30000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [acc('pen_self', 'Myself', 'Pensions', 200000, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', 100000, 'Medium/High Risk'),
    acc('other_self', 'Myself', 'Other Investments (e.g. GIA)', 400000, 'Medium Risk', { unrealisedGain: 240000 }), acc('cash_self', 'Myself', 'Cash Savings', 15000, 'Cash Equivalents')],
  config: { valuationDate: '2026-01-01' }
};
const LIB = buildScenarios();
const lib = id => JSON.parse(JSON.stringify(LIB.find(s => s.id === id).plan));
// a FIRE household as Phase 4 builds one (phase4-panel.mjs: the library household retiring at 52), its target set off the
// pot it reaches at 52 at a 4% draw, since the library's was set for retiring at 65
const fire = id => {
  const p = lib(id); p.demographics.retireAgeSelf = 52;
  const rows = E.simulateDeterministic(E.buildContext(p), 'expected'), r52 = rows.find(r => r.ageSelf >= 52);
  p.spending.targetSpend = Math.round(0.04 * r52.totalCombined / 500) * 500;
  return p;
};
const BASES = { carry: () => JSON.parse(JSON.stringify(CARRY)), S370: () => lib('S370'), S380: () => lib('S380'), S224: () => lib('S224'), S008: () => lib('S008'), S330F: () => fire('S330') };
// as the state check: guardrails and the lookahead off (a table refuses both), the floor at 80% of the target
// (a case may ask for the floor at the target: no flexible spending)
const planOf = p => { const h = JSON.parse(JSON.stringify(p)), f = h.spending.floorAtTarget ? 1 : 0.8; delete h.spending.floorAtTarget; return E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.spending, floorSpend: Math.round(f * E.num(h.spending.targetSpend, 0)) } })); };

// ---------------------------------------------------------------- the cases
const dep = (id, off, category, amount, extra = {}) => ({ id, date: `${Y0 + off}-03-01`, year: Y0 + off, owner: 'Myself', category, amount, desc: id, transferredFrom: 'External', ...extra });
const GIA = 'Other Investments (e.g. GIA)';
const totalOf = p => p.accounts.filter(a => a.owner === 'Myself').reduce((s, a) => s + E.num(a.balance, 0), 0);
const inc = (name, type, amount, startAge, endAge = '') => ({ id: name, name, owner: 'Myself', incomeType: type, amount, startAge, endAge });
const CASES = [];
const add = (name, base, edit, live, plant) => CASES.push({ name, base, edit, live, plant });
for (const b of Object.keys(BASES)) add(`control ${b}`, b, () => {}, 'years', 'spend');
for (const k of Object.keys(E.DECUMULATION_POLICIES)) add(`policy ${k}, an Auto deposit routed by it`, 'S370', p => { p.spending.decumulationPolicy = k; }, 'deposit', 'dep');
add('policy Windfall to ISA, an Auto deposit while working', 'S224', p => { p.spending.decumulationPolicy = 'Windfall to ISA'; p.oneOffContributions = [dep('dW', 2, E.AUTO_DEPOSIT, 150000)]; }, 'deposit', 'dep');
add('deposit into the ISA, the surplus staged into it', 'S380', p => { p.oneOffContributions = [dep('dI', 2, 'S&S ISAs', 100000)]; }, 'drip', 'drip');
add('deposit into the ISA, staged, taxable household', 'carry', p => { p.oneOffContributions = [dep('dI', 1, 'S&S ISAs', 90000)]; }, 'drip', 'drip');
add('deposit into the pension while working, the surplus staged into it', 'S224', p => { p.oneOffContributions = [dep('dP', 1, 'Pensions', 150000)]; }, 'drip', 'drip');
add('deposit into the pension after retiring, staged at the no-earnings limit', 'S380', p => { p.oneOffContributions = [dep('dP', 2, 'Pensions', 20000)]; }, 'drip', 'drip');
add('deposit into cash', 'S380', p => { p.oneOffContributions = [dep('dC', 2, 'Cash Savings', 60000)]; }, 'deposit', 'dep');
add('deposit into the GIA', 'S370', p => { p.oneOffContributions = [dep('dG', 3, GIA, 80000)]; }, 'deposit', 'dep');
add('Bed and ISA: the GIA into the ISA, three years', 'carry', p => { p.oneOffContributions = [0, 1, 2].map(k => dep(`bI${k}`, k + 1, 'S&S ISAs', 20000, { transferredFrom: GIA })); }, 'deduction', 'ded');
add('recycle: cash into the pension', 'S008', p => { p.oneOffContributions = [dep('rP', 1, 'Pensions', 2880, { transferredFrom: 'Cash Savings' }), dep('rR', 1, 'Pensions', 720)]; }, 'deduction', 'ded');
add('the ISA into cash', 'S380', p => { p.oneOffContributions = [dep('iC', 3, 'Cash Savings', 30000, { transferredFrom: 'S&S ISAs' })]; }, 'deduction', 'ded');
for (const b of ['carry', 'S370', 'S380']) add(`a one-off cost of a tenth of wealth in year 3 (${b})`, b, p => { p.oneOffCosts = [{ id: 'c1', date: `${Y0 + 3}-06-01`, year: Y0 + 3, owner: 'Myself', amount: Math.round(0.1 * totalOf(p)) }]; }, 'cost', 'cost');
add('a gift in year 4', 'S380', p => { p.inheritance = { ...(p.inheritance || {}), gifts: [{ id: 'g1', year: Y0 + 4, amount: 25000, recipient: 'child' }] }; }, 'cost', 'cost');
add('a regular gift out of surplus income', 'carry', p => { p.inheritance = { ...(p.inheritance || {}), surplusGift: { annual: 3000, fromYear: Y0 + 1, toYear: Y0 + 10 } }; }, 'cost', 'cost');
add('spend bands: 20% more to 75, 20% less after', 'carry', p => { const t = E.num(p.spending.targetSpend, 0); p.spending.spendBands = [{ fromAge: 66, toAge: 75, amount: Math.round(1.2 * t) }, { fromAge: 76, toAge: '', amount: Math.round(0.8 * t) }]; }, 'band', 'band');
add('spend bands across the bridge', 'S370', p => { const t = E.num(p.spending.targetSpend, 0); p.spending.spendBands = [{ fromAge: 50, toAge: 57, amount: Math.round(0.9 * t) }, { fromAge: 58, toAge: 79, amount: Math.round(1.1 * t) }]; }, 'band', 'band');
add('a DB pension from 60', 'S370', p => { p.otherIncomes = [inc('db', 'otherTaxable', 12000, 60)]; }, 'income', 'income');
add('rental income, tax-free income and an income that ends', 'S380', p => { p.otherIncomes = [inc('rent', 'otherTaxable', 8000, 50, 70), inc('tf', 'taxFree', 3000, 55, 65)]; }, 'income', 'income');
add('part-time earnings after retiring', 'S370', p => { p.otherIncomes = [inc('pt', 'earnings', 15000, 50, 55)]; }, 'income', 'income');
add('guaranteed income above the spend: the surplus swept to cash and the ISA', 'carry', p => { p.otherIncomes = [inc('db', 'otherTaxable', 45000, 66)]; }, 'surplus', 'income');
for (const [mo, b] of [[0, 'S370'], [0, 'carry'], [24, 'S380'], [24, 'carry'], [3, 'S224']]) add(`a cash buffer of ${mo} months (${b})`, b, p => { p.config.cashBufferMonths = mo; }, 'years', 'buffer');
for (const b of ['S370', 'S380', 'carry']) add(`the full 25% lump sum (${b})`, b, p => { p.spending.drawdownStrategy = 'Full 25% Lump Sum'; }, 'lump', 'lump');
for (const b of ['S370', 'S224', 'carry']) add(`a part first year: valued on 27 October (${b})`, b, p => { p.config.valuationDate = '2026-10-27'; }, 'year0', 'frac');
add('CGT gains already used this tax year, with a sale in year 0', 'carry', p => { p.demographics.cgtGainsUsedSelf = 2500; p.oneOffContributions = [dep('bI', 0, 'S&S ISAs', 20000, { transferredFrom: GIA })]; }, 'gain0', 'cgt0');
add('carry-forward of the annual allowance, with a pension deposit', 'S224', p => { p.demographics.cfBroughtForwardSelf = 60000; p.oneOffContributions = [dep('dP', 0, 'Pensions', 120000)]; }, 'deposit', 'dep');
add('a cash ISA paid into while working', 'S224', p => { const a = p.accounts.find(x => x.id === 'cashIsa_self'); a.contrib = 4000; }, 'cashisa', 'cashisa');
add('a contribution schedule (contribByYear)', 'S224', p => { const a = p.accounts.find(x => x.id === 'pen_self'); a.contribByYear = [3000, 6000, 20000, 9000, 40000]; }, 'working', 'con');
add('salary growth, self-employed, with a pension deposit', 'S224', p => { p.demographics.salaryGrowthSelf = 3; p.demographics.employmentSelf = 'self-employed'; p.oneOffContributions = [dep('dP', 2, 'Pensions', 60000)]; }, 'deposit', 'dep');
add('FIRE: contributions while working, then a bridge', 'S330F', () => {}, 'working', 'con');
add('FIRE with an Auto deposit under Windfall to ISA', 'S330F', p => { p.spending.decumulationPolicy = 'Windfall to ISA'; p.oneOffContributions = [dep('dW', 10, E.AUTO_DEPOSIT, 120000)]; }, 'deposit', 'dep');
add('inflation at 4%, the GIA paying 3.5% in dividends', 'carry', p => { p.config.inflation = 4; p.config.giaDividendYield = 3.5; }, 'years', 'spend');
add('CGT off and cash interest untaxed', 'carry', p => { p.config.cgtEnabled = false; p.config.cashInterestTaxed = false; }, 'years', 'spend');
add('the pension at Medium/Low Risk, the ISA at Low Risk', 'S380', p => { p.accounts.find(x => x.id === 'pen_self').risk = 'Medium/Low Risk'; p.accounts.find(x => x.id === 'isa_self').risk = 'Low Risk'; }, 'years', 'spend');
add('cash held at Low Risk', 'S370', p => { p.accounts.find(x => x.id === 'cash_self').risk = 'Low Risk'; }, 'years', 'spend');
add('no flexible spending (the floor at the target)', 'S380', p => { p.spending.floorAtTarget = true; }, 'years', 'spend');
add('a horizon to 100', 'S008', p => { p.demographics.terminalAge = 100; }, 'years', 'spend');
add('rUK tax for a Scottish household', 'S008', p => { p.config.taxRegion = 'ruk'; }, 'years', 'spend');
add('Welsh tax', 'S370', p => { p.config.taxRegion = 'wales'; }, 'years', 'spend');

// ---------------------------------------------------------------- the plants: the forward run's copy of a feature, perturbed
const fill = (arr, f) => { const old = Float64Array.from(arr); for (let t = 0; t < arr.length; t++) arr[t] = f(arr[t], t); return () => arr.set(old); };
const PLANTS = {
  // a year's deposit moved one pot along (pension to ISA, ISA to the taxable pot, taxable to cash, cash to the pension)
  dep: c => { const old = c.yr.dep.map(a => Float64Array.from(a)); for (let t = 0; t <= c.T; t++) { const v = old.map(a => a[t]); for (let i = 0; i < 4; i++) c.yr.dep[(i + 1) % 4][t] = v[i]; } return () => old.forEach((a, i) => c.yr.dep[i].set(a)); },
  drip: c => { const undo = c.yr.drip.map(a => fill(a, () => 0)); return () => undo.forEach(u => u()); },
  ded: c => { const undo = c.yr.ded.map(a => fill(a, () => 0)); return () => undo.forEach(u => u()); },
  cost: c => fill(c.yr.cost, () => 0),
  // the spend bands ignored: every spending year at the plan's headline target
  band: c => { const u1 = fill(c.yr.scheduled, (v) => (v > 0 ? c.ctx.targetSpend : 0)), u2 = fill(c.yr.spend, (v, t) => (v > 0 ? c.ctx.targetSpend * c.yr.frac[t] : 0)); return () => { u1(); u2(); }; },
  // the other incomes dropped: only the state pension left in the year's guaranteed income
  income: c => { const sp = t => (c.ctx.ageSelf0 + t >= c.ctx.spa ? c.o.statePension * c.yr.frac[t] : 0); const u1 = fill(c.yr.taxable0, (v, t) => sp(t)), u2 = fill(c.yr.taxFree0, () => 0); return () => { u1(); u2(); }; },
  // a six-month buffer whatever the plan says (a buffer of six months is planted as twelve)
  buffer: c => { const m = Math.abs(c.ctx.cashBufferYears - 0.5) < 1e-9 ? 1 : 0.5; return fill(c.yr.buffer, (v, t) => E.spendTargetAtAge(c.ctx, c.ctx.ageSelf0 + t) * m); },
  lump: c => { const old = c.acts.map(a => a.lump); c.acts.forEach(a => { a.lump = 0; }); return () => c.acts.forEach((a, i) => { a.lump = old[i]; }); },
  frac: c => { const f0 = c.yr.frac[0]; c.yr.frac[0] = 1; return () => { c.yr.frac[0] = f0; }; },
  cgt0: c => { const v = c.yr.cgtExempt[0]; c.yr.cgtExempt[0] = c.P.cgtAnnualExempt; return () => { c.yr.cgtExempt[0] = v; }; },
  cashisa: c => { const v = c.cashIsaContrib; c.cashIsaContrib = 0; return () => { c.cashIsaContrib = v; }; },
  con: c => fill(c.yr.con[0], v => v * 0.5),
  // the generic plant (controls and settings with no data of their own): every spending year 5% dearer
  spend: c => { const u1 = fill(c.yr.spend, v => v * 1.05), u2 = fill(c.yr.scheduled, v => v * 1.05); return () => { u1(); u2(); }; }
};

// ---------------------------------------------------------------- live: the household-years a case's change acts in
const LIVE = {
  years: () => true,
  deposit: (ctx, row) => ctx.oneOffContribs.has(row.year),
  drip: (ctx, row) => ctx.stagedTransfers.has(row.year),
  deduction: (ctx, row) => ctx.oneOffDeductions.has(row.year),
  cost: (ctx, row) => row.oneOffCost > 0,
  band: (ctx, row) => ctx.spendBands.some(b => row.ageSelf >= b.fromAge && row.ageSelf <= b.toAge) && row.targetSpend > 0,
  income: (ctx, row) => ctx.otherIncomes.some(i => row.ageSelf >= i.startAge && row.ageSelf <= i.endAge),
  surplus: (ctx, row) => row.targetSpend > 0 && row.netGuaranteed >= row.targetSpend,
  lump: (ctx, row, prev, st) => !!(st && st.lumpSumTaken.self) && !(prev && prev.lumpTaken),
  year0: (ctx, row) => row.t === 0,
  gain0: (ctx, row) => row.t === 0 && row.realisedGains > 0,
  cashisa: (ctx, row) => row.workingSelf === 1,
  working: (ctx, row) => row.workingSelf === 1
};

// ---------------------------------------------------------------- the lockstep (the state check's, one household)
const MONEY = [0, 1, 2, 4, 6, 11, 12, 13];
const NAMES = { 0: 'pension', 1: 'ISA', 2: 'taxable and cash', 4: 'tax-free cash taken', 6: 'cash ISA', 11: 'gains carried', 12: 'cash', 13: 'basis of an emptied account', gain: 'gain held', 5: 'lump sum taken', held: 'tiers held', end: 'wealth at the end' };
const gainOf = v => v[3] * (v[2] - v[12]);
const gapsOf = (e, f, he, hf) => {
  const g = {};
  for (const k of MONEY) g[k] = Math.abs((e[k] || 0) - (f[k] || 0));
  g.gain = Math.abs(gainOf(e) - gainOf(f)); g[5] = e[5] === f[5] ? 0 : Infinity;
  g.held = he && hf && he.pen === hf.pen && he.isa === hf.isa ? 0 : Infinity;
  return g;
};
const moveOf = (r, ai, code) => {
  const a = r.actions[ai], ca = r.c.acts[ai];
  return { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', lump: !!a.lump, sweepCash: a.sweepCash !== false,
    spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, ...(a.cgtSale ? { cgtSale: true } : {}), tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0, index: ai, code,
    tierPenName: r.c.tiers.pen[ca.tierPen || 0].name, tierIsaName: r.c.tiers.isa[ca.tierIsa || 0].name };
};

function runCase(cs) {
  const raw = BASES[cs.base](); cs.edit(raw);
  const plan = planOf(raw), t0 = Date.now();
  const r = solveCandidate(E, M, plan, LIGHT);
  const solveSecs = (Date.now() - t0) / 1000;
  if (r.c.tiers.gia) throw new Error('sweep: the taxable account carries a tier, which moveOf does not hand to the engine');
  const T = r.m.ctx.totalYears, paths = E.pathsForSeed(SEED, NP, T).map(z => Float64Array.from(z));
  const base = withTable(r.m.ctx.plan, r), real = base.spending.policyOverride;
  let cur = null;
  const pol = { ...real, choose(st, t, held) {
    const want = real.choose(st, t, held), rec = cur.recs[t];
    if (!rec) return want;   // after the forward run stopped (it failed): the engine goes on, nothing to compare
    const forced = moveOf(r, rec.ai, want.index === rec.ai ? want.code : 'forced');
    if (cur.sink.lock) {
      cur.sink.years++;
      if (want.index !== rec.ai) { cur.sink.differ++; const gp = r._sc ? r._sc[want.index] - r._sc[rec.ai] : NaN; if (!(gp <= cur.sink.pickGap)) cur.sink.pickGap = gp; }
      if (want.index === rec.ai && JSON.stringify(forced) !== JSON.stringify(want)) cur.sink.mapMismatch++;
    }
    const g = gapsOf(vecOf(r.m, modelStateOf(st)), rec.s, held, rec.held);
    for (const [k, v] of Object.entries(g)) if (!(v <= (cur.sink.worst[k] ?? -1))) { cur.sink.worst[k] = v; cur.sink.at[k] = `path ${cur.i} year ${t}`; }
    return forced;
  } };
  const ctx = E.buildContext({ ...base, spending: { ...base.spending, policyOverride: pol } });
  const zPathOf = zs => (zs.length > T + 1 ? zs[T + 1] : 0);
  const forward = zs => { const recs = []; const out = runPolicy(r, zs, { visit: (t, s, held, ai) => { recs[t] = { s: Float64Array.from(s), held: { pen: held.pen, isa: held.isa }, ai }; } }); return { out, recs }; };
  const sinkOf = lock => ({ lock, worst: {}, at: {}, years: 0, differ: 0, pickGap: -Infinity, mapMismatch: 0, live: 0, survived: 0, liveYears: 0 });
  const runAll = (sink) => {
    for (let i = 0; i < paths.length; i++) {
      const { out, recs } = forward(paths[i]);
      cur = { recs, i, sink };
      const st = E.freshState(ctx);
      let row = null, prev = null;
      for (let t = 0; t <= T; t++) {
        const lumpBefore = st.lumpSumTaken.self;
        cur = { recs, i, sink };
        row = E.stepYear(ctx, st, t, { z: paths[i][t], zPath: zPathOf(paths[i]) });
        if (recs[t] && LIVE[cs.live](ctx, row, { lumpTaken: lumpBefore }, st)) sink.live++;
      }
      if (out.survived) {
        sink.survived++;
        const d = Math.abs(out.terminal - row.totalCombined);
        if (!(d <= (sink.worst.end ?? -1))) { sink.worst.end = d; sink.at.end = `path ${i}`; }
      }
    }
    return sink;
  };
  const lock = runAll(sinkOf(true));
  const undo = PLANTS[cs.plant](r.c);
  let planted;
  try { planted = runAll(sinkOf(false)); } finally { undo(); }
  // the plant undone: the forward run is as solved again (the first path's record the same as before)
  const again = forward(paths[0]).out, first = runPolicy(r, paths[0]);
  if (again.survived !== first.survived || again.terminal !== first.terminal) throw new Error(`sweep: the plant ${cs.plant} was not undone`);
  const keys = [...MONEY, 'gain', 5, 'held', 'end'];
  const worstMoney = Math.max(...keys.filter(k => k !== 5 && k !== 'held').map(k => lock.worst[k] ?? 0));
  const exact = (lock.worst[5] ?? 0) === 0 && (lock.worst.held ?? 0) === 0;
  const plantGap = Math.max(...keys.map(k => planted.worst[k] ?? 0));
  const tol = Math.max(r.eps || 0, r.tieMargin || 0, 1e-12);
  const ties = lock.differ === 0 || lock.pickGap <= tol + 1e-9;
  const pass = worstMoney <= 1 && exact && lock.live > 0 && plantGap > 1 && lock.years > 0 && lock.mapMismatch === 0;
  const worstKey = keys.reduce((b, k) => ((lock.worst[k] ?? 0) > (lock.worst[b] ?? 0) ? k : b), keys[0]);
  return { name: cs.name, base: cs.base, T, solveSecs, survived: lock.survived, years: lock.years, live: lock.live, worstMoney, worstSlot: NAMES[worstKey] || worstKey, worstAt: lock.at[worstKey] || '', exact,
    differ: lock.differ, pickGap: lock.pickGap, ties, mapMismatch: lock.mapMismatch, plant: cs.plant, plantGap, pass, actions: r.actions.length };
}

if (args.includes('--list')) { CASES.forEach((c, i) => console.log(`${String(i + 1).padStart(2)}. ${c.name} [${c.base}; live ${c.live}; plant ${c.plant}]`)); process.exit(0); }
const todo = ONLY === 'all' ? CASES : CASES.filter(c => c.name.includes(ONLY));
if (!todo.length) throw new Error(`sweep: no case matches ${ONLY}`);
console.log(`THE GAPS SWEEP (EXPLORATORY): code ${codeHash}, the light candidate, ${NP} paths each of seed ${SEED}; ${todo.length} cases`);
let fails = 0;
for (const cs of todo) {
  const o = runCase(cs);
  if (!o.pass) fails++;
  const f = x => (x < 1e-3 ? x.toExponential(1) : x.toFixed(2));
  console.log(`${o.pass ? 'PASS' : 'FAIL'}  ${o.name} [${o.base}, ${o.T + 1} years, solve ${o.solveSecs.toFixed(0)} s]: ${o.years} household-years in step, the change live in ${o.live}; ` +
    `worst gap £${f(o.worstMoney)} (${o.worstSlot}${o.worstMoney > 1e-6 ? `, ${o.worstAt}` : ''}), lump flag and tiers ${o.exact ? 'exact' : 'DIFFER'}; ` +
    `picks differ in ${o.differ} years (the largest score gap ${o.differ ? o.pickGap.toExponential(1) : 'none'}${o.ties ? ', ties' : ', NOT TIES'}); mismatched moves ${o.mapMismatch}; ` +
    `planted (${o.plant}): parts by £${f(o.plantGap)}; the forward run survives ${o.survived} of ${NP}`);
}
console.log(fails ? `SWEEP: ${fails} of ${todo.length} cases FAIL` : `SWEEP: ALL ${todo.length} cases PASS`);
