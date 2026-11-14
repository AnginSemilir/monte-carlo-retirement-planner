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
import { solvePlan, coarseWhereFits } from './solver/solve.js';
import { APP_CANDIDATE, APP_COARSE, APP_POINTS, APP_DIAL_VARIANT, appPlan, prepareForSolve, lockedPlan, aimsOptions, dialBase, speedOptions } from './solverSettings.js';

export const PLANT = { rule: '' };   // research/tests/restore-memory.test.mjs: 'holdrecord' keeps a restored solve's record; solve-coarse.test.mjs: 'lockcoarse' hands `coarse` to a locked position, 'restoreany' restores a stored solve whatever menu it was made on

export { APP_CANDIDATE, APP_COARSE, APP_TIER_REALS, APP_LAMBDA, APP_POINTS, APP_DIAL, APP_FLOOR, APP_DIAL_VARIANT, APP_AGE_WEIGHT, appPlan, prepareForSolve, lockedPlan, aimsOptions, dialBase, dialOf, dialSettings } from './solverSettings.js';

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
export function solveForApp(E, M, plan, { lambda = undefined, points = APP_POINTS, e2 = null, progress = null, research = null, restore = null, base = null, variant = APP_DIAL_VARIANT, ageWith = undefined } = {}) {
  // a tier ceiling (a lock) switches the tier above off; a restore solves the way its stored solve was chosen
  const norm = E.normalizePlan(plan), aims0 = aimsOptions(norm, variant);
  // `ageWith` (Part D, D3): one person's table in a couple, the other's age today: B3a's age weights then read the chance that
  // at least one of the two is alive (solve.js ageWeighted). Unset, a single's, as before
  const aims = ageWith !== undefined && aims0.ageWeight ? { ...aims0, ageWeight: { ...aims0.ageWeight, with: ageWith } } : aims0;
  const locked = lockedPlan(E, norm).riskAbove === false ? { riskAbove: false } : {};
  let lock = {};
  const bp = dialBase(norm);
  if (bp) {
    const b = base || solveForApp(E, M, bp, { points, research, variant });
    // step P1 (b): the position's adaptive reference taken from its base's (solve.js refFromOf), not built again
    if (b.meta.tierState) lock = { lockTiers: b, riskAbove: aboveOf(b), refFrom: b };
  }
  // the record's reference handed over in a wrapper of its own: adaptive.js keeps what it is given (its `rebuild` holds its input)
  const ref = restore && restore.ref ? { ...restore.ref } : null;
  // a part of a restored solve split (Part D, D5.6; src/solverCache.js followRecord) follows part 0, which copies the record in
  const again = restore ? { riskAbove: restore.riskAbove, restore: { layers: restore.layers, ref, ...(restore.follow ? { follow: true } : {}) } } : {};
  // `coarse` goes only to a solve that can take it (solve.js coarseFits, the conditions of the solve's own refusal): a locked
  // dial position (tsOnce false, the layer loop) and a plan with no joint tier state (consent to change risk withdrawn, or
  // one tier pair) keep the whole menu, at the speed before D73, and meta.coarse says so (D73; D74)
  const solved = appPlan(E, prepareForSolve(E, plan)), off = {};
  // the speed mode (D97 (3); src/solverSettings.js speedOptions): the chooser's shortlist, from the plan, as its key names it
  const asked = { ...APP_CANDIDATE, ...aims, ...speedOptions(norm), ...research, lambda: lambda !== undefined ? lambda : aims.lambda, points, ...(e2 ? { e2 } : {}), ...(progress ? { progress } : {}), ...locked, ...lock, ...again };
  const fitted = PLANT.rule === 'lockcoarse' ? asked : coarseWhereFits(E, M, solved, asked, off);
  // a stored solve made on the whole menu is never restored as one on anchors and shortlists, nor the reverse (the port's step
  // 8, D74): what names a stored solve (src/solverKey.js: the candidate with `coarse`, the plan, the dial's position, the code)
  // settles which this solve is, so a record that disagrees is another solve's and is refused, loudly
  if (restore && restore.meta && PLANT.rule !== 'restoreany') {
    const was = !!(restore.meta.coarse && !restore.meta.coarse.off), now = fitted.coarse !== undefined && !!fitted.coarse;
    if (was !== now) throw new Error(`solveForApp: the stored solve was made on ${was ? 'anchors and shortlists' : 'the whole menu'} and this solve is on ${now ? 'anchors and shortlists' : 'the whole menu'}: not restored`);
  }
  const r = solvePlan(E, M, solved, fitted);
  if (off.why && !restore) r.meta.coarse = { off: off.why };
  // the stored record's tables and reference are copied into the solve's own as it runs (solve.js `opts.restore`, adaptive.js
  // `restore`), and the solve keeps its options and the reference its input: let the record go once the solve is done, so a
  // restored solve holds its tables once and not beside the record (Phase 11, phone-memory.cjs; restore-memory.test.mjs). The
  // caller's record is left as it was (a test restores from it again).
  if (restore) {
    if (PLANT.rule !== 'holdrecord') { again.restore.layers = null; if (ref) for (const k of Object.keys(ref)) ref[k] = null; }
    Object.assign(r.meta, restore.meta, { restored: true });
  }
  return r;
}
