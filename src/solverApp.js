/*
 * THE SOLVER IN THE APP (Part C Phase 7, research/solver/PHASE-7.md step 7a): the research candidate's settings and the one
 * solve the app makes with them.
 *
 * The settings themselves are src/solverSettings.js's (re-exported here); this file adds the solve, so only the solver's worker
 * loads it. No `node:` imports.
 *
 * e3pcls guard: e3pcls is exact only on the code its identity test passed on. The research solves check the pin before each
 * solve (e3pcls-pin.mjs reads files a browser cannot); the app runs only committed code, and the fast suite's e3pcls-guard
 * test fails any commit whose pin does not match the solver's code.
 */
import { solvePlan } from './solver/solve.js';
import { APP_CANDIDATE, APP_POINTS, APP_DIAL_VARIANT, appPlan, prepareForSolve, lockedPlan, aimsOptions, dialBase } from './solverSettings.js';

export { APP_CANDIDATE, APP_TIER_REALS, APP_LAMBDA, APP_POINTS, APP_DIAL, APP_FLOOR, APP_DIAL_VARIANT, APP_AGE_WEIGHT, appPlan, prepareForSolve, lockedPlan, aimsOptions, dialBase, dialOf, dialSettings } from './solverSettings.js';

/*
 * The candidate's solve of a plan, as the app holds it (prepared here). `e2` splits it across workers (src/solverPool.js),
 * `progress` feeds the bar; `research` is for the tests and harnesses alone (a lighter adaptive lattice, say), spread after the
 * candidate so it overrides it. `restore` (Phase 7b) is a stored solve of the same key (src/solverCache.js cacheOf): solved
 * the way the 'auto' risk rule chose, its tables copied in rather than solved, its meta the stored one's.
 * What the solver aims for (Phase 8) comes from the plan (aimsOptions: the dial's lambda, the estate's weight, raises,
 * consent to change risk); an explicit `lambda`, the research's and the tests', overrides the dial.
 * A dial position above 1 (step L2, B3) is solved on its base's tiers: `base` is the base's solve (dialBase: the same plan at
 * position 1, solved or restored by the caller, e.g. the worker that keeps it in the cache), or, where none is given, solved
 * here first. Where the base has a tier state the position runs `lockTiers` on it with the base's decision on the tier above.
 * `variant` is the dial's (APP_DIAL_VARIANT unless a test or L4 names the other).
 */
const aboveOf = r => { const d = r.meta.riskAbove && r.meta.riskAbove.decision; return typeof d === 'string' && d.startsWith('on'); };
export function solveForApp(E, M, plan, { lambda = undefined, points = APP_POINTS, e2 = null, progress = null, research = null, restore = null, base = null, variant = APP_DIAL_VARIANT } = {}) {
  // a tier ceiling (a lock) switches the tier above off; a restore solves the way its stored solve was chosen
  const norm = E.normalizePlan(plan), aims = aimsOptions(norm, variant);
  const locked = lockedPlan(E, norm).riskAbove === false ? { riskAbove: false } : {};
  let lock = {};
  const bp = dialBase(norm);
  if (bp) {
    const b = base || solveForApp(E, M, bp, { points, research, variant });
    // step P1 (b): the position's adaptive reference taken from its base's (solve.js refFromOf), not built again
    if (b.meta.tierState) lock = { lockTiers: b, riskAbove: aboveOf(b), refFrom: b };
  }
  const again = restore ? { riskAbove: restore.riskAbove, restore: { layers: restore.layers, ref: restore.ref } } : {};
  const r = solvePlan(E, M, appPlan(E, prepareForSolve(E, plan)), { ...APP_CANDIDATE, ...aims, ...research, lambda: lambda !== undefined ? lambda : aims.lambda, points, ...(e2 ? { e2 } : {}), ...(progress ? { progress } : {}), ...locked, ...lock, ...again });
  if (restore) Object.assign(r.meta, restore.meta, { restored: true });
  return r;
}
