/*
 * WHY THE POT LEFT DIFFERS (the review, 17 Nov; EXPLORATORY, deciding nothing; the review's seeds only). The pilot found that
 * design A leaves a smaller pot than today's default on most units. That read stored each path's totals, which cannot say
 * why. Here one unit is solved both ways, as pilot.mjs solves it, and run by the engine on the first paths of the same seed
 * with each arm's policy wrapped to record, at every decision of every path:
 *   - the spending level the move takes (1 the plan's target; below it a cut, above it a raise);
 *   - the risk held coming into the decision: the mean real return of the tiers each pension and ISA is held at, weighted by
 *     the money in them (model.js profileOf; the plan's own profile for the taxable account and cash), so a fall is a step
 *     down in risk;
 *   - the year's tax.
 * Printed for each arm: those three over the years the household spends, by third of those years, and what each path ends
 * with. A measurement of what differs, not of how much of the pot each part accounts for.
 *   node research/reviews/2026-11-17/scripts/why-pot.mjs <unit id> [seed 99003] [paths 300] [points 45]
 */
import * as E from '../../../engine.mjs';
import * as M from '../../../../src/solver/model.js';
import * as CPL from '../../../../src/solver/couple.js';
import { solveHousehold, withHousehold } from '../../../solver/household.mjs';
import { solveForApp } from '../../../../src/solverApp.js';
import { APP_COUPLE, appJoint } from '../../../../src/solverSettings.js';
import { readPanel, appPlan } from '../../../solver/couple-panel.mjs';
import { readSharePanel } from '../../../solver/share-rules-panel.mjs';
import { armA } from '../../../solver/select-phase4.mjs';
import { PANEL_FILE, solverPlan } from '../../../solver/audit-couples.mjs';
import { UNITS } from '../../../solver/audit-household.mjs';

const SEEDS = [99001, 99002, 99003, 99004, 99005];
const [id, seedArg, nArg, ptsArg] = process.argv.slice(2);
const seed = Number(seedArg) || 99003, n = Number(nArg) || 300, pts = Number(ptsArg) || 45, W = 0.02;
if (!SEEDS.includes(seed)) { console.error(`why-pot: seed ${seed} is not one of the review's`); process.exit(2); }
const u = UNITS.find(x => x.id === id);
if (!u) { console.error(`why-pot: ${id} is not a unit of the lead test's panel`); process.exit(2); }
const U = u.panel === 'd4b' ? readPanel(PANEL_FILE).find(x => x.id === id) : readSharePanel().find(x => x.id === id);
const a = armA(appPlan(U.plan), { tournament: false });
const hp = solverPlan('CANDC', U.plan, { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy }, W), aDemo = E.resolveMpaa(a.planState).demographics;
const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
const memo = new Map();
const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: pts, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } })); return memo.get(k); };
const JOINT = { shareRule: APP_COUPLE.shareRule, ...appJoint() };
const k2 = CPL.solveCouple(E, M, hp, { solveOne, ...JOINT }), house = solveHousehold(E, M, hp, { solveOne, topK: 3, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast });
const withAges = plan => ({ ...plan, demographics: { ...plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } });
const T = k2.m.ctx.totalYears, paths = E.pathsForSeed(seed, n, T).map(zs => Float64Array.from(zs));
const mean = xs => (xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : NaN), gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`;

/* an arm's policy wrapped: the level its move takes and the risk held coming into each decision */
function run(arm, cp, plan) {
  const m = cp.m, rec = { level: [], risk: [], spendYear: [] };
  for (let t = 0; t <= T; t++) { rec.level.push([]); rec.risk.push([]); }
  const base = plan.spending.policyOverride;
  const wrapped = { ...base, choose(st, t) {
    const j = base.choose(st, t);
    const tierHeld = {};
    for (const o of m.ctx.owners) { const h = st.tierHeld && st.tierHeld[o.key]; tierHeld[o.key] = { pen: h ? h.pen || 0 : 0, isa: h ? h.isa || 0 : 0 }; }
    const ms = { pots: st.pots, tierHeld };
    let w = 0, r = 0;
    for (const acc of m.ctx.accounts) { const v = st.pots[acc.id] || 0; if (v > 0) { w += v; r += v * M.profileOf(m, ms, acc).real; } }
    if (w > 0) rec.risk[t].push(100 * r / w);
    rec.level[t].push(j.spendLevel !== undefined ? j.spendLevel : 1);
    return j;
  } };
  const ctx = E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: wrapped } });
  const out = { wealth: [], tax: [], delivered: [], survived: 0 };
  for (const zs of paths) {
    const state = E.freshState(ctx), zPath = zs.length > T + 1 ? zs[T + 1] : 0;
    let failed = false, tax = 0, delivered = 0, last = null;
    for (let t = 0; t <= T; t++) {
      const row = E.stepYear(ctx, state, t, { z: zs[t], zPath });
      tax += row.taxPaid + (row.cgtPaid || 0);
      if (row.targetSpend > 0) { delivered += Math.max(0, row.targetSpend - Math.max(0, row.unmetDemand || 0)); rec.spendYear[t] = true; }
      if (!failed && (row.unmetDemand > E.FAIL_TOLERANCE || row.preNmpaInsolvent)) failed = true;
      last = row;
    }
    const wealth = Math.max(0, last.totalCombined);
    if (!failed && ctx.solvencyFloor > 0 && wealth < ctx.solvencyFloor) failed = true;
    out.wealth.push(wealth); out.tax.push(tax); out.delivered.push(delivered); if (!failed) out.survived++;
  }
  return { arm, rec, out };
}
const R = [run('K2', k2, CPL.withCouple(withAges(k2.plan), k2)), run('HOUSE', house, withHousehold(withAges(house.plan), house))];
const years = []; for (let t = 0; t <= T; t++) if (R[0].rec.spendYear[t]) years.push(t);
const thirds = [0, 1, 2].map(i => years.slice(Math.floor(i * years.length / 3), Math.floor((i + 1) * years.length / 3)));
const cap = (k2.tables.self.estateCap || 0) + (k2.tables.part.estateCap || 0);
console.log(`WHY THE POT LEFT DIFFERS (the review, 17 Nov; EXPLORATORY, deciding nothing): ${id} (${u.group}), the first ${n} paths of seed ${seed}, ${pts} points; the household spends in plan years ${years[0]} to ${years[years.length - 1]}; the estate cap ${gbp(cap)}`);
for (const r of R) {
  const lv = ys => ys.flatMap(t => r.rec.level[t]), rk = ys => ys.flatMap(t => r.rec.risk[t]);
  const part = ys => { const L = lv(ys); return `the level ${mean(L).toFixed(4)} (a raise at ${(100 * L.filter(x => x > 1 + 1e-9).length / L.length).toFixed(1)}% of decisions, a cut at ${(100 * L.filter(x => x < 1 - 1e-9).length / L.length).toFixed(1)}%), the risk held ${mean(rk(ys)).toFixed(3)}% a year`; };
  console.log(`  ${r.arm.padEnd(5)} survival ${(100 * r.out.survived / n).toFixed(1)}%; over the spending years: ${part(years)}`);
  console.log(`        by third of those years: first, ${part(thirds[0])}; middle, ${part(thirds[1])}; last, ${part(thirds[2])}`);
  console.log(`        a path's totals: spending delivered ${gbp(mean(r.out.delivered))}, lifetime tax ${gbp(mean(r.out.tax))}, the pot left ${gbp(mean(r.out.wealth))}, counted up to the cap ${gbp(mean(r.out.wealth.map(v => Math.min(v, cap))))}`);
}
