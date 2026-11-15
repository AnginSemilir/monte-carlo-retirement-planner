/*
 * THE ALLOWANCE'S STEP AT BOTH PLACES (D98; research/solver/ALLOWANCE-BOTH.md). Research only, off in code: `menuPlus` 'paraw'
 * adds a pension draw step 'penPAr' and a re-wrap ceiling 'paraw', each to the personal allowance as given, on the year's
 * non-savings income alone (the engine's pensionCeiling not applied), beside 'penPA' and 'pa', which stop where the year's
 * whole bill would first rise (the harvest ceiling, ANSWERS.md section 5). The engine (src/App.jsx N4_PEN, N4_HARVEST, N4_RAW and
 * drawPension's raw flag), the exact model (model.js) and the forward run (fast.js) carry both alike:
 *   1. identity: without 'paraw' the menu is as before, move for move (the product's, the candidate's and the candidate's with
 *      its levels and tiers, each hashed on the code before D98), and S090's light solve by the app's route, its tables and
 *      20 engine runs, the code before's bit for bit; the new menus' sizes; an unknown kind refused;
 *   2. by hand, a year with interest and dividends (the year's bill would first rise below the allowance): a draw first to
 *      penPA stops where pensionCeiling says, a draw first through penPAr stops at the allowance itself, and a re-wrap to 'pa'
 *      and to 'paraw' the same, the forward run and the engine alike;
 *   3. with no interest and no dividends the two places are the same to the bit: penPAr's year is penPA's, paraw's is pa's,
 *      in the forward run and in the engine;
 *   4. lockstep, a single: on the menu with 'hr' and 'paraw' the engine and a forward run take the same seeded random move
 *      every year of every path, and at the top of each year the engine's state, mapped into the solver's vector, matches the
 *      forward run's slot by slot within a pound; the new parts change the year's flow in some years taken (against the same
 *      move with them taken out), so the check is not vacuous;
 *   5. lockstep, a couple: the engine and the exact model's year (model.js step) under random joint moves whose people draw
 *      through penPAr and re-wrap to 'paraw' now and then, every pot and flow within a pound; the new parts taken;
 *   6. S2, the chooser's shared year, on under the new menu: its check mode over every decision of the solver's own runs;
 *   7. planted (fast.js's N4.plant 'noraw': the forward run applies pensionCeiling to the raw steps too): check 4's lockstep
 *      parts the forward run from the engine;
 *   8. planted (model.js's MODEL.plant 'noraw', the same in the exact model): check 5's lockstep parts a couple's model year
 *      from the engine.
 *   node research/tests/allowance-both.test.mjs
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { buildActions, solvePlan, runPolicy, CHOOSER, SHARE_CHECKED } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { modelStateOf, withTable } from '../../src/solver/bridge.js';
import { solveForApp } from '../../src/solverApp.js';
import { solvedContext, runPath } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { readPanel } from '../solver/phase4-panel.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { productLevels } from '../../src/solver/solve.js';
import { ratesAt } from '../../src/solver/couple.js';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);
const near = (x, y, tol = 1e-6) => Math.abs(x - y) <= tol;
const SEED = 99004, NP = 4;

// 1. identity, on the code before D98 (f82fec86)
for (const [o, h, len] of [[{}, 'f900315db7a08e08', 24], [{ menuPlus: ['hr'] }, '73dc65ef19bf1398', 40], [{ menuPlus: ['hr'], spendLevels: [1, 0.95, 0.9, 0.8], tiers: [[0, 0], [1, 0], [2, 2], [3, 3]] }, 'f1a658989555ffe9', 640]]) {
  const A = buildActions(o);
  ok(hash(A) === h && A.length === len, `1  without 'paraw' the menu is as before, move for move: ${JSON.stringify(o)} ${A.length} moves, ${hash(A)}`);
}
{
  const sizes = [['paraw'], ['hr', 'paraw']].map(k => buildActions({ menuPlus: k }).length);
  let threw = false; try { buildActions({ menuPlus: ['pa-raw'] }); } catch { threw = true; }
  ok(sizes.join(',') === '40,60' && threw, `1  the new menus have 40 and 60 moves (${sizes.join(', ')}), and an unknown kind is refused`);
}
{
  const plan = readPanel().find(h => h.id === 'S090').plan;
  const r = solveForApp(E, M, plan, { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } });
  const sc = solvedContext(E, r), runs = E.pathsForSeed(99003, 20, sc.totalYears).map(zs => { const o = runPath(E, sc, zs); return [o.survived, o.terminalPot, o.lifetimeTax, o.delivered]; });
  const d = await digestOf(tablesOf(r));
  ok(d === 'b31058354aa5679fae63b7243f59aa757dea7575aaafbcf0d23e67d165aeccf7' && hash(runs) === 'dff4bbab3a6bdbc5' && r.actions.length === 800,
    `1  S090's light solve by the app's route, the option unset: its tables and 20 engine runs the code before's bit for bit (${d.slice(0, 16)}, ${hash(runs)}, ${r.actions.length} moves)`);
}

// the households: solver-carry's taxable household (£400k holding £240k of gain, £15k of cash), its dividends at a yield that
// puts the year's bill above nought inside the allowance, and the same with no cash and no dividends
const acc = (id, owner, category, balance, risk, extra = {}) => ({ id, owner, category, balance, contrib: 0, growth: 0, risk, ...extra });
const CARRY = {
  demographics: { planningMode: 'single', currentAgeSelf: 66, retireAgeSelf: 66, terminalAge: 95, statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976 },
  spending: { targetSpend: 30000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [acc('pen_self', 'Myself', 'Pensions', 200000, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', 100000, 'Medium/High Risk'),
    acc('other_self', 'Myself', 'Other Investments (e.g. GIA)', 400000, 'Medium Risk', { unrealisedGain: 240000 }), acc('cash_self', 'Myself', 'Cash Savings', 15000, 'Cash Equivalents')],
  config: { valuationDate: '2026-01-01' }
};
const DRY = { ...CARRY, accounts: CARRY.accounts.filter(a => a.id !== 'cash_self') };
const planOf = (p, cfg = {}) => { const h = JSON.parse(JSON.stringify(p)); return E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0, ...cfg }, spending: { ...h.spending, floorSpend: Math.round(0.8 * E.num(h.spending.targetSpend, 0)) } })); };
const move = (steps, extra = {}) => ({ steps, costSteps: steps, harvest: false, harvestCeil: 'pa', sweepCash: true, lump: false, contrib: null, spendLevel: 1, tierPen: 0, tierIsa: 0, ...extra });
const engineYear = (plan, mv) => {
  const ctx = E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose: () => ({ ...mv, code: 'D98' }), switchCost: 0 } } });
  const st = E.freshState(ctx), row = E.stepYear(ctx, st, 1, 'expected');
  return { row, st, ctx };
};
const fastYear = (plan, mv) => {
  const m = M.prepare(E, plan), c = F.compile(m, [mv]), s = vecOf(m, M.initialState(m)), s0 = Float64Array.from(s);
  F.flow(c, 1, 0, s);
  return { s0, s, c, last: c.last, taxable: c.yr.taxable0[1] + (s0[0] - s[0]) - (s[4] - s0[4]) };
};
const PRE = ['cash', 'other', 'isa'];

// 2. by hand, year 1 (age 67, no state pension until 68: no other non-savings income), the dividends at 2% a year
{
  const plan = planOf(CARRY, { giaDividendYield: 2 }), P = E.buildContext(plan).P;
  const e0 = engineYear(plan, move(['penPA', ...PRE, 'penPAr', 'penBasic', 'penAny'])), I = e0.row.savingsInterestSelf, D = e0.row.giaDividendsSelf;
  const capNow = E.pensionCeiling(P, P.pa, 0, I, D);
  ok(I > 0 && D > 0 && capNow < P.pa - 1, `2  the year holds £${I.toFixed(2)} of interest and £${D.toFixed(2)} of dividends, so the allowance's ceiling as now is £${capNow.toFixed(2)}, below the allowance's £${P.pa}`);
  const fA = fastYear(plan, move(['penPA', ...PRE, 'penPAr', 'penBasic', 'penAny'])), eA = e0;
  const fB = fastYear(plan, move(['penPA', 'penPAr', ...PRE, 'penBasic', 'penAny'])), eB = engineYear(plan, move(['penPA', 'penPAr', ...PRE, 'penBasic', 'penAny']));
  const gross = x => 0.75 * x.row.drawdownPensions;   // the taxable part of a draw a quarter tax free
  ok(near(fA.taxable, capNow) && near(gross(eA), capNow) && near(fB.taxable, P.pa) && near(gross(eB), P.pa),
    `2  a draw first to penPA stops at £${fA.taxable.toFixed(2)} (the engine £${gross(eA).toFixed(2)}); through penPAr it goes on to the allowance itself, £${fB.taxable.toFixed(2)} (the engine £${gross(eB).toFixed(2)})`);
  const small = planOf({ ...CARRY, spending: { ...CARRY.spending, targetSpend: 5000 } }, { giaDividendYield: 2 });
  const hv = c => move([...PRE, 'penPA', 'penBasic', 'penAny'], { harvest: true, harvestCeil: c });
  const fp = fastYear(small, hv('pa')), ep = engineYear(small, hv('pa')), fr = fastYear(small, hv('paraw')), er = engineYear(small, hv('paraw'));
  const capS = E.pensionCeiling(P, P.pa, 0, ep.row.savingsInterestSelf, ep.row.giaDividendsSelf);
  ok(near(fp.taxable, capS) && near(gross(ep), capS) && near(fr.taxable, P.pa) && near(gross(er), P.pa) && er.row.harvested > ep.row.harvested,
    `2  a re-wrap to 'pa' on a need the cash meets stops at £${fp.taxable.toFixed(2)} (the engine £${gross(ep).toFixed(2)}); to 'paraw' at the allowance, £${fr.taxable.toFixed(2)} (the engine £${gross(er).toFixed(2)}), re-wrapping £${er.row.harvested.toFixed(2)} against £${ep.row.harvested.toFixed(2)}`);
}

// 3. no interest and no dividends: the two places the same to the bit
{
  const plan = planOf(DRY, { giaDividendYield: 0 });
  const same = (a, b) => a.s.every((v, k) => Object.is(v, b.s[k]));
  // the engine's year: every pot, the basis and the tax-free cash after it, and the year's money (the row's own move fields aside)
  const KEYS = ['totalCombined', 'taxPaid', 'cgtPaid', 'drawdownPensions', 'harvested', 'netDrawdown', 'unmetDemand', 'savingsInterestSelf', 'giaDividendsSelf'];
  const rowSame = (a, b) => JSON.stringify([a.st.pots, a.st.giaBasis, a.st.cumPcls, KEYS.map(k => a.row[k])]) === JSON.stringify([b.st.pots, b.st.giaBasis, b.st.cumPcls, KEYS.map(k => b.row[k])]);
  const d1 = [move(['penPA', ...PRE, 'penBasic', 'penAny']), move(['penPAr', ...PRE, 'penBasic', 'penAny'])];
  const h1 = [move([...PRE, 'penPA', 'penBasic', 'penAny'], { harvest: true, harvestCeil: 'pa' }), move([...PRE, 'penPA', 'penBasic', 'penAny'], { harvest: true, harvestCeil: 'paraw' })];
  const e = engineYear(plan, d1[0]);
  ok(e.row.savingsInterestSelf === 0 && e.row.giaDividendsSelf === 0 && same(fastYear(plan, d1[0]), fastYear(plan, d1[1])) && same(fastYear(plan, h1[0]), fastYear(plan, h1[1]))
    && rowSame(engineYear(plan, d1[0]), engineYear(plan, d1[1])) && rowSame(engineYear(plan, h1[0]), engineYear(plan, h1[1])),
    `3  with no interest and no dividends penPAr's year is penPA's and 'paraw' is 'pa', bit for bit, in the forward run and in the engine`);
}

// 4 and 7. a single's lockstep on the menu with 'hr' and 'paraw'
const all = buildScenarios();
const HH = [['carry', planOf(CARRY, { giaDividendYield: 2 })], ...['S330', 'S090'].map(id => [id, planOf(all.find(s => s.id === id).plan)])];
const MONEY = [0, 1, 2, 4, 6, 11, 12, 13];
const gainOf = v => v[3] * (v[2] - v[12]);
const moveOf = (r, ai, code) => {
  const a = r.actions[ai], ca = r.c.acts[ai];
  return { steps: a.steps, costSteps: a.costSteps || a.steps, harvest: !!a.harvest, harvestCeil: a.harvestCeil || 'pa', lump: !!a.lump, sweepCash: a.sweepCash !== false,
    spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, ...(a.sweepIsa ? { sweepIsa: true } : {}), tierPen: ca.tierPen || 0, tierIsa: ca.tierIsa || 0, index: ai, code,
    tierPenName: r.c.tiers.pen[ca.tierPen || 0].name, tierIsaName: r.c.tiers.isa[ca.tierIsa || 0].name };
};
const usesRaw = a => a.steps.includes('penPAr') || (a.harvest && a.harvestCeil === 'paraw');
const twinOf = a => ({ ...a, steps: a.steps.filter(x => x !== 'penPAr'), costSteps: (a.costSteps || a.steps).filter(x => x !== 'penPAr'), harvestCeil: a.harvestCeil === 'paraw' ? 'pa' : a.harvestCeil });
const rng = seed => { let x = seed >>> 0; return () => { x = (x + 0x6D2B79F5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const lockstep = (id, plan, plant = '') => {
  F.N4.plant = plant;
  const r = solvePlan(E, M, plan, { lambda: 0.0223606797749979, bequestWeight: 0.02, menuPlus: ['hr', 'paraw'], riskAbove: false, points: 4, riskConsent: false });
  const T = r.m.ctx.totalYears, paths = E.pathsForSeed(SEED, NP, T).map(z => Float64Array.from(z));
  const pool = r.actions.map((a, ai) => ai), newer = pool.filter(ai => usesRaw(r.actions[ai]));
  const c0 = F.compile(r.m, r.actions.map(twinOf));
  const base = withTable(r.m.ctx.plan, r), real = base.spending.policyOverride;
  let recs = null, worst = 0, worstAt = '', years = 0, taken = 0, changed = 0;
  const pol = { ...real, choose(st, t, held) {
    const want = real.choose(st, t, held), rec = recs[t];
    if (!rec) return want;
    const e = vecOf(r.m, modelStateOf(st));
    for (const k of MONEY) { const gap = Math.abs((e[k] || 0) - (rec.s[k] || 0)); if (!(gap <= worst)) { worst = gap; worstAt = `${id} year ${t} slot ${k}`; } }
    const gg = Math.abs(gainOf(e) - gainOf(rec.s)); if (!(gg <= worst)) { worst = gg; worstAt = `${id} year ${t} gain held`; }
    years++;
    return moveOf(r, rec.ai, want.index === rec.ai ? want.code : 'forced');
  } };
  const ctx = E.buildContext({ ...base, spending: { ...base.spending, policyOverride: pol } });
  for (let i = 0; i < paths.length; i++) {
    const R = rng(SEED + 7919 * i + id.length), seq = [];
    for (let t = 0; t <= T; t++) seq[t] = R() < 0.5 && newer.length ? newer[Math.floor(R() * newer.length)] : pool[Math.floor(R() * pool.length)];
    recs = [];
    runPolicy(r, paths[i], { choose: t => seq[t], visit: (t, s, held, ai) => {
      recs[t] = { s: Float64Array.from(s), ai };
      if (usesRaw(r.actions[ai])) { taken++; const a1 = Float64Array.from(s), a0 = Float64Array.from(s); F.flow(r.c, t, ai, a1); F.flow(c0, t, ai, a0); if (a1.some((v, q) => Math.abs(v - a0[q]) > 1e-6)) changed++; }
    } });
    const st = E.freshState(ctx);
    for (let t = 0; t <= T; t++) E.stepYear(ctx, st, t, { z: paths[i][t], zPath: paths[i].length > T + 1 ? paths[i][T + 1] : 0 });
  }
  F.N4.plant = '';
  return { worst, worstAt, years, taken, changed };
};
{
  let worst = 0, worstAt = '', years = 0, taken = 0, changed = 0;
  for (const [id, plan] of HH) { const o = lockstep(id, plan); if (!(o.worst <= worst)) { worst = o.worst; worstAt = o.worstAt; } years += o.years; taken += o.taken; changed += o.changed; }
  ok(worst <= 1 && taken > 0 && changed > 0, `4  lockstep on the menu with 'hr' and 'paraw': ${HH.length} households x ${NP} paths, ${years} household-years, the largest gap £${worst.toExponential(2)} (${worstAt || 'none'}); the new parts in ${taken} moves taken, changing the year in ${changed}`);
  const p = lockstep('carry', HH[0][1], 'noraw');
  ok(p.worst > 1, `7  planted 'noraw' (the forward run applies pensionCeiling to the raw steps too): it parts from the engine by £${p.worst.toFixed(2)} (${p.worstAt})`);
}

// 5 and 8. a couple: the engine and the exact model's year under random joint moves with the new parts
const coupleLockstep = (plant = '') => {
  M.MODEL.plant = plant;
  const couples = all.filter(s => s.plan.demographics && s.plan.demographics.planningMode === 'couple').slice(0, 2);
  const MENU = buildActions({ menuPlus: ['hr', 'paraw'], spendLevels: productLevels(0.8) }), CEILS = ['pa', 'paraw', 'basic', 'hr'];
  let worst = 0, worstAt = '', years = 0, raw = 0;
  for (const sc of couples) {
    const plan = planOf(sc.plan), m = M.prepare(E, plan), T = m.ctx.totalYears;
    for (const [i, zs] of E.pathsForSeed(99001, 2, T).entries()) {
      const rnd = E.mulberry32(1000 * Number(sc.id.slice(1, 4)) + i), pick = xs => xs[Math.floor(rnd() * xs.length)], moves = [];
      for (let t = 0; t <= T; t++) {
        const a = pick(MENU), b = pick(MENU), ca = pick(CEILS), cb = pick(CEILS), ha = rnd() < 0.5, hb = rnd() < 0.5;
        moves.push({ steps: a.steps, costSteps: a.costSteps || a.steps, harvest: ha, harvestCeil: ca, sweepCash: true, lump: false, contrib: null, spendLevel: a.spendLevel !== undefined ? a.spendLevel : 1, split: pick([0.5, 0.7]), switchCost: 0,
          perOwner: { self: { steps: a.steps, harvest: ha, harvestCeil: ca }, part: { steps: b.steps, harvest: hb, harvestCeil: cb } } });
      }
      const ctx = E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose: (st, t) => moves[t], switchCost: 0 } } });
      const eng = E.freshState(ctx), mod = M.initialState(m);
      try { for (let t = 0; t <= T; t++) {
        const j = moves[t];
        for (const id of Object.keys(eng.pots)) { const g = Math.abs((eng.pots[id] || 0) - (mod.pots[id] || 0)); if (!(g <= worst)) { worst = g; worstAt = `${sc.id} path ${i} year ${t}: pot ${id}`; } }
        const re = E.stepYear(ctx, eng, t, { z: zs[t], zPath: zs.length > T + 1 ? zs[T + 1] : 0 });
        const rm = M.step(m, mod, j, t, ratesAt(m, zs, t));
        for (const k of ['totalCombined', 'taxPaid', 'cgtPaid', 'drawdownPensions', 'harvested', 'netDrawdown', 'unmetDemand']) { const g = Math.abs(E.num(re[k], 0) - E.num(rm[k], 0)); if (!(g <= worst)) { worst = g; worstAt = `${sc.id} path ${i} year ${t}: ${k}`; } }
        if (re.netDrawdown > 0 && [...j.perOwner.self.steps, ...j.perOwner.part.steps].includes('penPAr')) raw++;
        if ((j.perOwner.self.harvest && j.perOwner.self.harvestCeil === 'paraw') || (j.perOwner.part.harvest && j.perOwner.part.harvestCeil === 'paraw')) raw++;
        years++;
      } } catch (e) { worst = Infinity; worstAt = `${sc.id} path ${i}: threw ${e.message.split('\n')[0]}`; }
    }
  }
  M.MODEL.plant = '';
  return { worst, worstAt, years, raw, couples: couples.length };
};
{
  const o = coupleLockstep();
  ok(o.worst <= 1 && o.raw > 0, `5  a couple's years, the engine and the exact model in step under joint moves with penPAr and 'paraw': ${o.couples} couples x 2 paths, ${o.years} household-years, the largest gap £${o.worst.toExponential(2)}${o.worst > 1 ? ` at ${o.worstAt}` : ''}; the new parts in ${o.raw} years`);
  const p = coupleLockstep('noraw');
  ok(p.worst > 1, `8  planted 'noraw' in the exact model (pensionCeiling applied to the raw steps too): a couple's model year parts from the engine by £${p.worst.toFixed(2)} (${p.worstAt})`);
}

// 6. S2's check mode under the new menu, on the solver's own picks
{
  const r = solvePlan(E, M, HH[0][1], { lambda: 0.0223606797749979, points: 6, bequestWeight: 0.02, menuPlus: ['hr', 'paraw'], riskAbove: false });
  const before = SHARE_CHECKED.n; let picked = 0, threw = '';
  CHOOSER.check = true;
  try { for (const zs of E.pathsForSeed(SEED + 1, 5, r.m.ctx.totalYears)) runPolicy(r, Float64Array.from(zs), { visit: (t, s, held, ai) => { if (usesRaw(r.actions[ai])) picked++; } }); } catch (e) { threw = e.message; }
  CHOOSER.check = false;
  ok(!threw && SHARE_CHECKED.n > before && picked > 0, `6  S2's shared scores equal scoreMoves' under the menu with 'paraw': ${SHARE_CHECKED.n - before} scores checked, the solver taking a new part ${picked} times${threw ? `; THREW ${threw}` : ''}`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
