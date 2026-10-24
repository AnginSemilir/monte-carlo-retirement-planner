/*
 * N4'S MOVES ARE CARRIED THE SAME WAY BY THE ENGINE AND THE SOLVER (Part B Step 6 N4; research/solver/n4-design.md). Three
 * research move kinds behind `menuPlus` ('hr' a pension ceiling at the taper threshold, 'mid' the allowance's and the basic
 * band's midpoints, each as a draw-first and a re-wrap ceiling, 'cgt' selling the taxable account up to the exemption):
 *   1. identity: without `menuPlus` the menu is the product's, move for move (its JSON hashed on the code before N4);
 *   2. by hand: one year of the forward run (fast.flow) and of the engine (stepYear) under each new move, against a hand
 *      calculation: a draw that stops at the taper threshold and at each midpoint, a re-wrap to the basic band's midpoint,
 *      and a CGT sale with the ISA's room whole, part used, with no gain to take and with the exemption already used;
 *   3. lockstep: on each new menu (each kind, and all three) the engine and a forward run take the same seeded random move
 *      every year of every path, and at the top of each year the engine's state, mapped into the solver's vector, matches the
 *      forward run's slot by slot within a pound (V2's state check, its slots); each kind's own part changes the year's flow
 *      in some years taken (counted against the same move with that part removed), so the check is not vacuous;
 *   4. planted (fast.js's N4.plant): the taper ceiling read as the higher band's top, the basic band's midpoint read as the
 *      higher band's, and the CGT sale's buy-back left at no cost, each parts the forward run from the engine;
 *   5. S2, the chooser's shared year, stays on under the new menus: its check mode (CHOOSER.check: every shared score, tax
 *      and estate against scoreMoves', bit for bit, or it throws) over every decision of the solver's own runs, which pick
 *      the new moves (quick: S330 on all three kinds, 5 paths; --full: S224 and S330 on each kind, 20 paths).
 * Singles only (solvePlan refuses a couple). By default the quick form: the lockstep on the menu with all three kinds, on the
 * taxable household, the rich one and S330, 4 paths each, each table without tiers (the moves are forced, so the table gives
 * only structure), and each plant on the taxable household; --full each kind alone as well, all five households at 20
 * paths, the tables with their tiers, and the plants on two households each.
 *   node research/tests/n4-menu.test.mjs [--full]
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { buildActions, solvePlan, runPolicy, CHOOSER, SHARE_CHECKED } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { modelStateOf, withTable } from '../../src/solver/bridge.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const FULL = process.argv.includes('--full'), NP = FULL ? 20 : 4, SEED = 99002;
// the table only gives the lockstep its structure (every move is forced), so the quick form solves it without tiers
const SOLVE = FULL ? { points: 4 } : { points: 4, riskConsent: false };
const near = (x, y, tol = 1e-6) => Math.abs(x - y) <= tol;

// 1. identity: the product's menu, hashed on the code before N4 (c51eec3)
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);
const IDENT = [[{}, 'f900315db7a08e08', 24], [{ spendLevels: [1, 0.95, 0.9, 0.8] }, '22790f87bd819b2c', 96], [{ spendLevels: [0.9, 1, 1.1], tiers: [[0, 0], [1, 0], [2, 2], [3, 3]] }, '89dbe7502f7973b8', 288]];
for (const [o, h, len] of IDENT) {
  const A = buildActions(o), B = buildActions({ ...o, menuPlus: [] });
  ok(hash(A) === h && hash(B) === h && A.length === len, `1  without menuPlus (and with it empty) the menu is the product's, move for move: ${JSON.stringify(o)} ${len} moves, ${hash(A)}`);
}
{
  const sizes = ['hr', 'mid', 'cgt'].map(k => buildActions({ menuPlus: [k] }).length);
  let threw = false; try { buildActions({ menuPlus: ['probit'] }); } catch { threw = true; }
  ok(sizes.join(',') === '40,60,48' && threw, `1  the new menus have 40, 60 and 48 moves (${sizes.join(', ')}), and an unknown kind is refused`);
}

// the households: the taxable household of solver-carry (£400k holding £240k of gain), a rich variant that spends £120k (so a
// draw reaches the taper threshold), and three of V3's (S224, S330 the taxable-heavy one, S370 with a bridge)
const acc = (id, owner, category, balance, risk, extra = {}) => ({ id, owner, category, balance, contrib: 0, growth: 0, risk, ...extra });
const CARRY = {
  demographics: { planningMode: 'single', currentAgeSelf: 66, retireAgeSelf: 66, terminalAge: 95, statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976 },
  spending: { targetSpend: 30000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [acc('pen_self', 'Myself', 'Pensions', 200000, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', 100000, 'Medium/High Risk'),
    acc('other_self', 'Myself', 'Other Investments (e.g. GIA)', 400000, 'Medium Risk', { unrealisedGain: 240000 }), acc('cash_self', 'Myself', 'Cash Savings', 15000, 'Cash Equivalents')],
  config: { valuationDate: '2026-01-01' }
};
const RICH = { ...CARRY, spending: { ...CARRY.spending, targetSpend: 120000 }, accounts: CARRY.accounts.map(a => (a.id === 'pen_self' ? { ...a, balance: 1500000 } : a)) };
const planOf = (p, cfg = {}) => { const h = JSON.parse(JSON.stringify(p)); return E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0, ...cfg }, spending: { ...h.spending, floorSpend: Math.round(0.8 * E.num(h.spending.targetSpend, 0)) } })); };

// 2. by hand, year 1 (a full year, age 67: no state pension until 68, so no other taxable income), from the opening state
const P = E.buildContext(planOf(CARRY)).P, MIDB = (P.pa + P.higherRateStartsAt) / 2;
const move = (steps, extra = {}) => ({ steps, costSteps: steps, harvest: false, harvestCeil: 'pa', sweepCash: true, lump: false, contrib: null, spendLevel: 1, tierPen: 0, tierIsa: 0, ...extra });
const PRE = ['cash', 'other', 'isa'], ISA1 = ['isa', 'cash', 'other'];
const engineYear = (plan, mv) => {
  const ctx = E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose: () => ({ ...mv, code: 'N4' }), switchCost: 0 } } });
  const st = E.freshState(ctx), row = E.stepYear(ctx, st, 1, 'expected');
  return { row, st };
};
const fastYear = (plan, mv) => {
  const m = M.prepare(E, plan), c = F.compile(m, [mv]), s = vecOf(m, M.initialState(m)), s0 = Float64Array.from(s);
  F.flow(c, 1, 0, s);
  const gia = x => x[2] - x[12];
  return { s0, s, c, last: c.last, taxable: c.yr.taxable0[1] + (s0[0] - s[0]) - (s[4] - s0[4]), basis: x => gia(x) * (1 - x[3]), gia };
};
{
  // the taper threshold: a need of £120k drawn pension first up to the taper threshold stops there, the rest from the other pots
  const plan = planOf(RICH, { giaDividendYield: 0 }), mv = move(['penPA', 'penBasic', 'penHR', ...PRE, 'penAny']);
  const f = fastYear(plan, mv), e = engineYear(plan, mv), eTax = 0.75 * e.row.drawdownPensions;
  ok(near(f.taxable, P.thr) && near(eTax, P.thr) && f.s[2] < f.s0[2], `2  a draw first up to the taper threshold stops at it (gross income £${f.taxable.toFixed(2)} in the forward run, £${eTax.toFixed(2)} in the engine; £${P.thr}), and the rest of the need comes from the other pots`);
  const fb = fastYear(plan, move(['penPA', 'penBasic', ...PRE, 'penAny']));
  ok(near(fb.taxable, P.higherRateStartsAt), `2  the product's basic-rate ceiling, beside it, stops at £${fb.taxable.toFixed(2)} (£${P.higherRateStartsAt})`);
  for (const [tok, cap, steps] of [['penPAm', P.pa / 2, ['penPAm', ...PRE, 'penPA', 'penBm', 'penBasic', 'penAny']], ['penBm', MIDB, ['penPAm', 'penPA', 'penBm', ...PRE, 'penBasic', 'penAny']]]) {
    const fm = fastYear(plan, move(steps)), em = engineYear(plan, move(steps));
    ok(near(fm.taxable, cap) && near(0.75 * em.row.drawdownPensions, cap), `2  a draw first up to ${tok} stops at its midpoint (£${fm.taxable.toFixed(2)} and £${(0.75 * em.row.drawdownPensions).toFixed(2)}; £${cap})`);
  }
}
{
  // a re-wrap to the basic band's midpoint on a need the cash meets: gross income ends at the midpoint, the net fills the ISA's
  // £20,000 and the rest goes to the taxable account at cost
  const plan = planOf({ ...CARRY, spending: { ...CARRY.spending, targetSpend: 5000 } }, { giaDividendYield: 0 });
  const mv = move(['cash', 'other', 'isa', 'penPA', 'penBasic', 'penAny'], { harvest: true, harvestCeil: 'bm' });
  const f = fastYear(plan, mv), e = engineYear(plan, mv), f0 = fastYear(plan, { ...mv, harvest: false }), e0 = engineYear(plan, { ...mv, harvest: false });
  const gross = MIDB / 0.75, net = gross - (MIDB - P.pa) * P.basicRate;
  ok(near(f.taxable, MIDB) && near(f.s0[0] - f.s[0], gross) && near(e.row.drawdownPensions, gross), `2  a re-wrap to the basic band's midpoint draws £${gross.toFixed(2)} gross (forward run £${(f.s0[0] - f.s[0]).toFixed(2)}, engine £${e.row.drawdownPensions.toFixed(2)}), gross income ending at £${MIDB}`);
  const dIsa = f.s[1] - f0.s[1], dGia = f.gia(f.s) - f0.gia(f0.s), dBasis = f.basis(f.s) - f0.basis(f0.s), dBasisE = e.st.giaBasis.self - e0.st.giaBasis.self;
  ok(near(dIsa, P.isaAllowance) && near(dGia, net - P.isaAllowance) && near(dBasis, net - P.isaAllowance) && near(dBasisE, net - P.isaAllowance),
    `2  its net £${net.toFixed(2)} fills the ISA's £${P.isaAllowance} (up £${dIsa.toFixed(2)} on the same move without it) and the rest, £${(net - P.isaAllowance).toFixed(2)}, goes to the taxable account at cost (its basis up £${dBasis.toFixed(2)}, the engine's £${dBasisE.toFixed(2)})`);
}
{
  // the CGT sale: £400k holding £240k of gain (a gain share of 0.6), the year's need from the ISA so nothing else is sold
  const plan = planOf({ ...CARRY, spending: { ...CARRY.spending, targetSpend: 5000 } }, { giaDividendYield: 0 }), X = P.cgtAnnualExempt;
  const sold = X / 0.6;
  const mv1 = move(ISA1.concat(['penPA', 'penBasic', 'penAny']), { cgtSale: true }), mv0 = move(ISA1.concat(['penPA', 'penBasic', 'penAny']));
  const f = fastYear(plan, mv1), e = engineYear(plan, mv1), f0 = fastYear(plan, mv0), e0 = engineYear(plan, mv0);
  ok(near(f.last.cgtPaid, 0) && near(e.row.realisedGains, X) && near(e0.row.realisedGains, 0) && near(e.row.cgtPaid, 0), `2  the sale realises the exempt £${X} and no more (the engine's gains £${e.row.realisedGains.toFixed(2)}, £${e0.row.realisedGains.toFixed(2)} without it; tax £${e.row.cgtPaid.toFixed(2)}, the forward run's £${f.last.cgtPaid.toFixed(2)})`);
  const dB = f.basis(f.s) - f0.basis(f0.s), dBE = e.st.giaBasis.self - e0.st.giaBasis.self;
  ok(near(f.s[1] - f0.s[1], sold) && near(f0.gia(f0.s) - f.gia(f.s), sold) && near(dB, -(sold - X)) && near(dBE, -(sold - X)),
    `2  with the ISA's room whole the £${sold.toFixed(2)} sold goes to the ISA (up £${(f.s[1] - f0.s[1]).toFixed(2)}) and the basis falls by its cost, £${(sold - X).toFixed(2)} (forward run £${(-dB).toFixed(2)}, engine £${(-dBE).toFixed(2)})`);
  // the room part used by a re-wrap to the allowance (£16,760 net, the allowance's draw a quarter tax free): the sale fills the
  // ISA's last £3,240 and the rest is bought back at cost
  const mv2 = move(ISA1.concat(['penPA', 'penBasic', 'penAny']), { harvest: true, harvestCeil: 'pa', cgtSale: true });
  const mv20 = { ...mv2, cgtSale: undefined }, f2 = fastYear(plan, mv2), e2 = engineYear(plan, mv2), f20 = fastYear(plan, mv20), e20 = engineYear(plan, mv20), hv = P.pa / 0.75, toIsa = P.isaAllowance - hv;
  const dB2 = f2.basis(f2.s) - f20.basis(f20.s), dB2E = e2.st.giaBasis.self - e20.st.giaBasis.self, want2 = -(sold - X) + (sold - toIsa);
  ok(near(f2.s[1] - f20.s[1], toIsa) && near(f20.gia(f20.s) - f2.gia(f2.s), toIsa) && near(dB2, want2) && near(dB2E, want2),
    `2  with £${hv.toFixed(2)} of the room used by a re-wrap, £${toIsa.toFixed(2)} of the sale fills the ISA and £${(sold - toIsa).toFixed(2)} is bought back at cost: the basis ends £${dB2.toFixed(2)} from the same year without the sale (engine £${dB2E.toFixed(2)}; by hand £${want2.toFixed(2)})`);
  // no gain to take, and the exemption already used: nothing is sold, the year as under the same move without the sale
  const noGain = planOf({ ...CARRY, spending: { ...CARRY.spending, targetSpend: 5000 }, accounts: CARRY.accounts.map(a => (a.id === 'other_self' ? { ...a, unrealisedGain: 0 } : a)) }, { giaDividendYield: 0 });
  const g1 = fastYear(noGain, move(ISA1.concat(['penPA', 'penBasic', 'penAny']), { cgtSale: true })), g0 = fastYear(noGain, move(ISA1.concat(['penPA', 'penBasic', 'penAny'])));
  const used = planOf(CARRY, { giaDividendYield: 0 }), u1 = fastYear(used, move(['other', 'cash', 'isa', 'penPA', 'penBasic', 'penAny'], { cgtSale: true })), u0 = fastYear(used, move(['other', 'cash', 'isa', 'penPA', 'penBasic', 'penAny']));
  ok(g1.s.every((v, k) => v === g0.s[k]) && u1.s.every((v, k) => v === u0.s[k]) && u0.last.cgtPaid > 0, `2  with no gain to take, and with the exemption already used by the year's sales, the sale does nothing (both years the same bit for bit as without it)`);
}

// 3 and 4. lockstep on each new menu, and the plants
const all = buildScenarios();
const HH = [['carry', CARRY], ['rich', RICH], ...(FULL ? ['S224', 'S330', 'S370'] : ['S330']).map(id => [id, all.find(s => s.id === id).plan])];
const MONEY = [0, 1, 2, 4, 6, 11, 12, 13];
const gainOf = v => v[3] * (v[2] - v[12]);
// the move as tablePolicy hands it to the engine (checked against tablePolicy whenever the table's own pick is the same)
const moveOf = (r, ai, code) => {
  const a = r.actions[ai], ca = r.c.acts[ai];
  return { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', lump: !!a.lump, sweepCash: a.sweepCash !== false,
    spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, ...(a.cgtSale ? { cgtSale: true } : {}), tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0, index: ai, code,
    tierPenName: r.c.tiers.pen[ca.tierPen || 0].name, tierIsaName: r.c.tiers.isa[ca.tierIsa || 0].name };
};
// the same move with the kind's own part removed: its N4 tokens, its N4 re-wrap, its sale
const OWN = { hr: [['penHR'], ['hr']], mid: [['penPAm', 'penBm'], ['pam', 'bm']], cgt: [[], []] };
const twinOf = (a, kind) => {
  const [tok, hv] = OWN[kind], h = a.harvest && hv.includes(a.harvestCeil);
  return { ...a, steps: a.steps.filter(x => !tok.includes(x)), costSteps: (a.costSteps || a.steps).filter(x => !tok.includes(x)), harvest: a.harvest && !h, harvestCeil: h ? 'pa' : a.harvestCeil, cgtSale: kind === 'cgt' ? undefined : a.cgtSale };
};
// a move whose new kind acts first: its sale, its re-wrap to a new ceiling, or a new ceiling among the pension draws taken first
const lead = a => { const i = a.steps.findIndex(x => !x.startsWith('pen')); return a.steps.slice(0, i < 0 ? a.steps.length : i); };
const leadsWith = (a, kind) => (kind === 'cgt' ? !!a.cgtSale : kind === 'hr' ? lead(a).includes('penHR') || (a.harvest && a.harvestCeil === 'hr') : lead(a).some(x => x === 'penPAm' || x === 'penBm') || (a.harvest && (a.harvestCeil === 'pam' || a.harvestCeil === 'bm')));
// a move holding a new kind anywhere (a new ceiling later in its order can act once the pots before it are empty)
const usesKind = (a, kind) => (kind === 'cgt' ? !!a.cgtSale : kind === 'hr' ? a.steps.includes('penHR') || (a.harvest && a.harvestCeil === 'hr') : a.steps.some(x => x === 'penPAm' || x === 'penBm') || (a.harvest && (a.harvestCeil === 'pam' || a.harvestCeil === 'bm')));
const rng = seed => { let x = seed >>> 0; return () => { x = (x + 0x6D2B79F5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

const lockstep = (id, p, menuPlus, plant = '') => {
  F.N4.plant = plant;   // read at compile ('hrtop', 'midband') and in the forward run ('nobasis'): set for the whole lockstep
  const r = solvePlan(E, M, planOf(p), { lambda: 0.0223606797749979, bequestWeight: 0.02, menuPlus, riskAbove: false, ...SOLVE });
  if (r.c.tiers.gia) throw new Error('n4-menu: the taxable account carries a tier, which moveOf does not hand to the engine');
  const T = r.m.ctx.totalYears, paths = E.pathsForSeed(SEED, NP, T).map(z => Float64Array.from(z));
  const pool = r.actions.map((a, ai) => ai).filter(ai => !(r.c.acts[ai].tierPen > 0) && !(r.c.acts[ai].tierIsa > 0));
  // half the picks from the moves that use a new kind, so each kind is taken often
  const newer = pool.filter(ai => menuPlus.some(k => usesKind(r.actions[ai], k)));
  const kinds = menuPlus.length > 1 ? ['hr', 'mid', 'cgt'] : menuPlus;
  const c0 = Object.fromEntries(kinds.map(k => [k, F.compile(r.m, r.actions.map(a => twinOf(a, k)))]));
  const base = withTable(r.m.ctx.plan, r), real = base.spending.policyOverride;
  let recs = null, worst = 0, worstAt = '', mismatch = 0, years = 0;
  const taken = Object.fromEntries(kinds.map(k => [k, 0])), changed = Object.fromEntries(kinds.map(k => [k, 0]));
  const pol = { ...real, choose(st, t, held) {
    const want = real.choose(st, t, held), rec = recs[t];
    if (!rec) return want;
    const forced = moveOf(r, rec.ai, want.index === rec.ai ? want.code : 'forced');
    if (want.index === rec.ai && JSON.stringify(forced) !== JSON.stringify(want)) mismatch++;
    const e = vecOf(r.m, modelStateOf(st));
    for (const k of MONEY) { const gap = Math.abs((e[k] || 0) - (rec.s[k] || 0)); if (!(gap <= worst)) { worst = gap; worstAt = `${id} year ${t} slot ${k}`; } }
    const gg = Math.abs(gainOf(e) - gainOf(rec.s)); if (!(gg <= worst)) { worst = gg; worstAt = `${id} year ${t} gain held`; }
    years++;
    return forced;
  } };
  const ctx = E.buildContext({ ...base, spending: { ...base.spending, policyOverride: pol } });
  const zPathOf = zs => (zs.length > T + 1 ? zs[T + 1] : 0);
  for (let i = 0; i < paths.length; i++) {
    const R = rng(SEED + 7919 * i + id.length), seq = [];
    for (let t = 0; t <= T; t++) seq[t] = R() < 0.5 && newer.length ? newer[Math.floor(R() * newer.length)] : pool[Math.floor(R() * pool.length)];
    recs = [];
    runPolicy(r, paths[i], { choose: t => seq[t], visit: (t, s, held, ai) => {
      recs[t] = { s: Float64Array.from(s), ai };
      for (const k of kinds) if (usesKind(r.actions[ai], k)) {
        taken[k]++;
        const a1 = Float64Array.from(s), a0 = Float64Array.from(s);
        F.flow(r.c, t, ai, a1); F.flow(c0[k], t, ai, a0);
        if (a1.some((v, q) => Math.abs(v - a0[q]) > 1e-6)) changed[k]++;
      }
    } });
    const st = E.freshState(ctx);
    for (let t = 0; t <= T; t++) E.stepYear(ctx, st, t, { z: paths[i][t], zPath: zPathOf(paths[i]) });
  }
  F.N4.plant = '';
  return { worst, worstAt, mismatch, years, taken, changed };
};

// the quick form runs the three kinds on one menu (it carries every new token, re-wrap and the sale); --full each alone as well
const KINDS = FULL ? [['hr'], ['mid'], ['cgt'], ['hr', 'mid', 'cgt']] : [['hr', 'mid', 'cgt']];
for (const menuPlus of KINDS) {
  let worst = 0, worstAt = '', mismatch = 0, years = 0;
  const taken = {}, changed = {};
  for (const [id, p] of HH) {
    const o = lockstep(id, p, menuPlus);
    if (!(o.worst <= worst)) { worst = o.worst; worstAt = o.worstAt; }
    mismatch += o.mismatch; years += o.years;
    for (const k of Object.keys(o.taken)) { taken[k] = (taken[k] || 0) + o.taken[k]; changed[k] = (changed[k] || 0) + o.changed[k]; }
  }
  const counts = Object.keys(taken).map(k => `${k} held by ${taken[k]} moves taken, changing the year in ${changed[k]}`).join('; ');
  ok(worst <= 1 && mismatch === 0 && Object.keys(changed).every(k => changed[k] > 0),
    `3  lockstep on menu ${menuPlus.join('+')}: ${HH.length} households x ${NP} paths, ${years} household-years, the largest gap £${worst.toExponential(2)} (${worstAt || 'none'}); ${counts}; tablePolicy's move = moveOf's where both pick it (${mismatch} differ)`);
}
for (const [plant, menuPlus, ids] of [['hrtop', ['hr'], FULL ? ['carry', 'rich'] : ['carry']], ['midband', ['mid'], FULL ? ['carry', 'rich'] : ['carry']], ['nobasis', ['cgt'], FULL ? ['carry', 'S330'] : ['carry']]]) {
  let worst = 0;
  for (const [id, p] of HH.filter(([x]) => ids.includes(x))) worst = Math.max(worst, lockstep(id, p, menuPlus, plant).worst);
  ok(worst > 1, `4  planted '${plant}' (the forward run only): the forward run parts from the engine by £${worst.toFixed(2)} on menu ${menuPlus.join('+')}`);
}

// 5. S2's check mode under the new menus, on the solver's own picks
for (const [id, menuPlus] of FULL ? ['S224', 'S330'].flatMap(id => [['hr'], ['mid'], ['cgt']].map(k => [id, k])) : [['S330', ['hr', 'mid', 'cgt']]]) {
  const r = solvePlan(E, M, planOf(all.find(s => s.id === id).plan), { lambda: 0.0223606797749979, points: 6, bequestWeight: 0.02, menuPlus, riskAbove: false });
  const before = SHARE_CHECKED.n;
  let picked = 0, threw = '';
  CHOOSER.check = true;
  try {
    for (const zs of E.pathsForSeed(SEED + 1, FULL ? 20 : 5, r.m.ctx.totalYears)) runPolicy(r, Float64Array.from(zs), { visit: (t, s, held, ai) => { if (menuPlus.some(k => leadsWith(r.actions[ai], k))) picked++; } });
  } catch (e) { threw = e.message; }
  CHOOSER.check = false;
  ok(!threw && SHARE_CHECKED.n > before && picked > 0, `5  S2's shared scores equal scoreMoves' on ${id} under menu ${menuPlus.join('+')}: ${SHARE_CHECKED.n - before} scores checked, the solver picking a move whose new kind acts first ${picked} times${threw ? `; THREW ${threw}` : ''}`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
