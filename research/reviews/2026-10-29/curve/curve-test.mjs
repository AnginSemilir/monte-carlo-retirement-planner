/*
 * THE SPENDING-UTILITY OPTION'S TESTS (EXPLORATORY; research/reviews/2026-10-29/SPENDING-CURVE.md). Run from the root of the
 * code under test, the patched solve.js beside a copy of the original as src/solver/_orig_solve.js (written by this script
 * from git's HEAD and removed after).
 *   1. identity: with `spendUtility` unset, every table (each world's survival, bequest, resilience, policy and shortfall
 *      tables and the tier layers) the same bit for bit as the original code's, on S090 and S328F at the light settings and
 *      S090 at the candidate's own at 6 wealth points; planted: the original solved at lambda times (1 + 1e-9) must differ;
 *   2. the curve: with it set, a move's cost is w(t) (u(1) - u(level)), u the CRRA curve, w(t) kappa times the Gompertz
 *      survival; each remaining year's ruin price w(t) (u(1) - u(the guaranteed income's level)); planted: the same checks
 *      against gamma 3 must fail;
 *   3. the weights reach the solve: the tables with mortality differ from those without, and both from the candidate's.
 *   node <this file>
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { readPanel } = await imp('research/solver/phase4-panel.mjs');
const { solverPlanOf } = await imp('research/solver/audit-phase4.mjs');
writeFileSync('src/solver/_orig_solve.js', execSync('git show HEAD:src/solver/solve.js'));
let O;
try { O = await imp('src/solver/_orig_solve.js'); } finally { unlinkSync('src/solver/_orig_solve.js'); }

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const LIGHT = { lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } };
const FULL6 = { lambda: 0.0223606797749979, points: 6, bequestWeight: 0.02 };
const P = Object.fromEntries(readPanel().map(h => [h.id, h]));
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const planOf = id => prep(solverPlanOf(P[id].plan, { decumulationPolicy: P[id].plan.spending.decumulationPolicy }));
const hashOf = r => {
  const h = createHash('sha256'), seen = new Set(); let arrays = 0;
  const walk = o => { if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o); if (ArrayBuffer.isView(o)) { arrays++; h.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); return; } if (Array.isArray(o)) { o.forEach(walk); return; } for (const k of Object.keys(o).sort()) walk(o[k]); };
  walk(r.tablesW); return { hash: h.digest('hex').slice(0, 16), arrays };
};
const solveNew = (id, extra) => C.solveCandidate(E, M, planOf(id), extra);
const solveOld = (id, extra) => O.solvePlan(E, M, C.candidatePlan(E, planOf(id)), { ...C.CANDIDATE_OPTS, ...extra });

// 1. identity with the option unset, and the planted perturbation
for (const [id, extra, label] of [['S090', LIGHT, 'light'], ['S328F', LIGHT, 'light'], ['S090', FULL6, "the candidate's own lattice, 6 points"]]) {
  const a = hashOf(solveNew(id, extra)), b = hashOf(solveOld(id, extra));
  ok(a.hash === b.hash && a.arrays > 0, `1. ${id} (${label}): with spendUtility unset the patched code's ${a.arrays} tables hash ${a.hash}, the original's ${b.hash}`);
}
{ const a = hashOf(solveNew('S090', LIGHT)), b = hashOf(solveOld('S090', { ...LIGHT, lambda: LIGHT.lambda * (1 + 1e-9) }));
  ok(a.hash !== b.hash, `1. planted: the original at lambda x (1 + 1e-9) hashes ${b.hash}, not ${a.hash}: the comparison sees a change that small`); }

// 2. the curve and the ruin prices
const MORT = { mode: 90, disp: 9 }, SU = { gamma: 2, kappa: 1, beta: 1, mortality: MORT, ruinMin: 0.1 };
const checkCurve = (r, su, plan) => {
  const g = su.gamma, u = l => (Math.abs(g - 1) < 1e-12 ? Math.log(l) : (Math.pow(l, 1 - g) - 1) / (1 - g));
  const a0 = r.m.ctx.ageSelf0, T = r.m.ctx.totalYears, W = r.spendUtility.w, R = r.spendUtility.ruinLevel, F = r.spendUtility.failCost;
  let worst = 0;
  for (let t = 0; t <= T; t++) {
    const w = su.kappa * Math.exp(-Math.exp((a0 - MORT.mode) / MORT.disp) * (Math.exp(t / MORT.disp) - 1)) * Math.pow(su.beta, t);
    worst = Math.max(worst, Math.abs(W[t] - w));
    for (const l of [0.8, 0.9, 0.95, 1, 1.1]) worst = Math.max(worst, Math.abs(r.costOf(l, t) - w * (u(1) - u(l))));
    const sp = r.c.yr.spend[t];
    if (sp > 0) {
      const lv = Math.min(1, Math.max(su.ruinMin, (r.c.yr.taxFree0[t] + E.calculateUKNetIncome(r.c.yr.taxable0[t], r.c.P)) / sp));
      worst = Math.max(worst, Math.abs(R[t] - lv), Math.abs((F[t] - F[t + 1]) - w * (u(1) - u(lv))));
    } else worst = Math.max(worst, Math.abs(F[t] - F[t + 1]));
  }
  return worst;
};
const rU = solveNew('S090', { ...LIGHT, spendUtility: SU });
const w2 = checkCurve(rU, SU);
ok(w2 < 1e-12 && rU.meta.spendUtility && rU.meta.spendUtility.gamma === 2, `2. S090: every weight, cost and ruin price as the formula gives (the largest gap ${w2.toExponential(1)}); meta records ${JSON.stringify(rU.meta.spendUtility)}`);
ok(rU.costOf(0.8, 0) > 0 && rU.costOf(1.1, 0) < 0 && rU.costOf(1, 5) === 0 && rU.costOf(0.8, 0) - rU.costOf(0.9, 0) > rU.costOf(0.9, 0) - rU.costOf(1, 0), `2. a cut costs (${rU.costOf(0.8, 0).toFixed(4)} at 80%), a raise earns (${rU.costOf(1.1, 0).toFixed(4)} at 110%), the target costs nothing, and the second 10% cut costs more than the first`);
{ const w3 = checkCurve(rU, { ...SU, gamma: 3 }); ok(w3 > 1e-3, `2. planted: the same checks against gamma 3 fail (the largest gap ${w3.toExponential(1)})`); }

// 3. the weights reach the solve
const hU = hashOf(rU).hash, hNM = hashOf(solveNew('S090', { ...LIGHT, spendUtility: { ...SU, mortality: null } })).hash, hC = hashOf(solveNew('S090', LIGHT)).hash;
ok(hU !== hNM && hU !== hC && hNM !== hC, `3. S090: the tables with mortality (${hU}), without (${hNM}) and the candidate's (${hC}) all differ`);

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
