/*
 * WHAT A YEAR'S SPENDING IS WORTH TO EACH OBJECTIVE (EXPLORATORY; SPENDING-CURVE.md, question 1): the prices the solver's own
 * cost functions put on a year at each level, read from light solves on S090 (the deep review's household), and a few
 * two- and three-year patterns with the same total spending, so the shape of each curve can be seen. CAND's prices are in
 * survival points (its score's unit: one point is 0.01); UTIL's in its own units (a year at the floor 0.25 at gamma 2).
 *   node kink-check.mjs        (from the root of the code under test)
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js');
const C = await imp('research/solver/candidate.mjs');
const { readPanel } = await imp('research/solver/phase4-panel.mjs');
const LIGHT = { lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } };
const h = readPanel().find(x => x.id === 'S090');
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 } }));
const cand = C.solveCandidate(E, M, plan, LIGHT);
const util = C.solveCandidate(E, M, plan, { ...LIGHT, spendUtility: { gamma: 2, kappa: 1, beta: 1, mortality: { mode: 90, disp: 9 }, ruinMin: 0.1 } });
const zero = C.solveCandidate(E, M, plan, { ...LIGHT, failureShortfall: 'zero' });
const pts = x => `${(100 * x >= 0 ? '+' : '')}${(100 * x).toFixed(3)} points`;
console.log(`S090 (age ${cand.m.ctx.ageSelf0}, target £${cand.m.ctx.targetSpend}); CAND's menu ${[...new Set(cand.levelOf)].sort((a, b) => a - b).join(', ')}`);
console.log('A year at each level, its cost (a negative cost is a credit):');
for (const l of [0.8, 0.9, 0.95, 1, 1.1]) console.log(`  ${(100 * l).toFixed(0)}%: CAND ${pts(cand.costOf(l))}${cand.raiseSurvival && l > 1 ? ' (times the survival it leads to)' : ''};  UTIL ${util.costOf(l, 0).toFixed(4)} in year 0, ${util.costOf(l, 25).toFixed(4)} in year 25 (alive then with chance ${util.spendUtility.w[25].toFixed(3)})`);
console.log('Patterns of the same total spending, their summed cost (CAND, a raise credited in full; UTIL, in year 0 prices):');
for (const p of [[1, 1], [0.9, 1.1], [0.95, 1.05], [0.8, 1.1, 1.1], [0.9, 0.9, 1.1, 1.1]]) {
  const c = p.reduce((a, l) => a + cand.costOf(l), 0), u = p.reduce((a, l) => a + util.costOf(l, 0), 0);
  console.log(`  ${p.map(l => `${Math.round(100 * l)}%`).join(', ').padEnd(22)} CAND ${pts(c)};  UTIL ${u.toFixed(4)}`);
}
const T = cand.m.ctx.totalYears, F = cand.c.yr.spend.findIndex((s, t) => s > 0);
const perYear = arr => (arr[F] - arr[F + 1]);
console.log(`A year with no money (the first retired year, ${F}): CAND (floor) ${pts(cand.failureShortfall ? 0.0223606797749979 * 0.04 : 0)}; ZERO ${pts(0.0223606797749979)}; UTIL ${perYear(util.spendUtility.failCost).toFixed(4)} (lived on ${(100 * util.spendUtility.ruinLevel[F]).toFixed(0)}% of target, the guaranteed income)`);
const sp = util.spendUtility.ruinLevel.findIndex((x, t) => t > F && x > util.spendUtility.ruinLevel[F] + 0.05);
if (sp > 0) console.log(`  from year ${sp} (the State Pension): UTIL ${(util.spendUtility.failCost[sp] - util.spendUtility.failCost[sp + 1]).toFixed(4)} a year (lived on ${(100 * util.spendUtility.ruinLevel[sp]).toFixed(0)}% of target)`);
console.log(`CAND: a year at the floor costs ${pts(cand.costOf(0.8))}; a year at 110% earns ${pts(-cand.costOf(1.1))} times the survival it leads to; ruin at the floor's price makes running out a year sooner cost one floor year.`);
