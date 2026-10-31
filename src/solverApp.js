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
import { APP_CANDIDATE, APP_LAMBDA, APP_POINTS, appPlan, prepareForSolve, lockedPlan } from './solverSettings.js';

export { APP_CANDIDATE, APP_TIER_REALS, APP_LAMBDA, APP_POINTS, APP_DIAL, appPlan, prepareForSolve, lockedPlan } from './solverSettings.js';

/*
 * The candidate's solve of a plan, as the app holds it (prepared here). `e2` splits it across workers (src/solverPool.js),
 * `progress` feeds the bar; `research` is for the tests and harnesses alone (a lighter adaptive lattice, say), spread after the
 * candidate so it overrides it. `restore` (Phase 7b) is a stored solve of the same key (src/solverCache.js cacheOf): solved
 * the way the 'auto' risk rule chose, its tables copied in rather than solved, its meta the stored one's.
 */
export function solveForApp(E, M, plan, { lambda = APP_LAMBDA, points = APP_POINTS, e2 = null, progress = null, research = null, restore = null } = {}) {
  // a tier ceiling (a lock) switches the tier above off; a restore solves the way its stored solve was chosen
  const locked = lockedPlan(E, E.normalizePlan(plan)).riskAbove === false ? { riskAbove: false } : {};
  const again = restore ? { riskAbove: restore.riskAbove, restore: { layers: restore.layers, ref: restore.ref } } : {};
  const r = solvePlan(E, M, appPlan(E, prepareForSolve(E, plan)), { ...APP_CANDIDATE, ...research, lambda, points, ...(e2 ? { e2 } : {}), ...(progress ? { progress } : {}), ...locked, ...again });
  if (restore) Object.assign(r.meta, restore.meta, { restored: true });
  return r;
}
