/*
 * COUPLES IN THE NEW PLANNER (Part D, D5 and D6; research/solver/PART-D.md): the switch and the guard, in a module with no imports,
 * so the page's first load can ask them without loading the solver.
 *   COUPLES     whether a couple's plan runs the solver in the new planner: on since D99 (14 Nov; the maintainer's D97 (1), by
 *               item 6's stage C's PASS, research/solver/results-couples-share.txt). Off, a couple's plan keeps the app's rules
 *               and the couples card, exactly as before D5: the rollback, one deploy turning it off for everyone (a harness's
 *               build with COUPLES_OFF=1 reads it false, vite.config.js solverHarness).
 *   coupleSolverOn(plan, on)   { on, share, why }: on only with the switch on and the household inside the guard: its first
 *               person holding 40% to 60% of the pots (couple.js's SHARE_BAND, where each person's table is solved on half the
 *               household's spending), or its first person the elder by age and holding more than 60% and at most 90%
 *               (ELDER_UP_TO, ELDER_FIRST), the holdings stage C tested, the elder entered first holding 75% and 90%
 *               (registrations/couples-share.md: what a PASS reaches is by inference from 60% to 75%, and a couple uneven in
 *               some wrappers only). A couple whose younger partner holds more, whose elder is entered second and holds more,
 *               whose elder holds over 90%, or whose two people are the same age and hold their money outside the band keeps
 *               the app's rules until a test of those reads. `share` the first person's share of the pots; `why` 'off' (the
 *               switch) or 'uneven' (outside the guard), null when on.
 *   elderOf(plan)  'self', 'part' or null (the same age): each person's age today read as the engine reads it (App.jsx
 *               buildContext: a blank age the default, 40 for the first person and the first person's for the partner;
 *               clamped to 0 to 120), held to the engine's own context by research/tests/couple-default.test.mjs.
 * The band is couple.js's SHARE_BAND and the share its shareFor's (each account of each person's, its id ending _self or
 * _part), held equal by research/tests/couple-solve-client.test.mjs; the guard and the switch are pinned to STATE.md's
 * decided-defaults block by research/tests/couple-default.test.mjs.
 */
// a harness's build with COUPLES_OFF=1 reads it false (vite.config.js solverHarness: this line moved stops that build)
export const COUPLES = true;
export const COUPLE_BAND = [0.4, 0.6];
export const ELDER_UP_TO = 0.9;
// the elder entered first, the first person ('Myself'), as every couple stage C tested (D99; the deep review of 14 Nov: the
// joint move weighs both people's estates at the first person's table's weight, 0.02 of that person's own opening wealth, so a
// couple whose elder is entered second and holds most would be solved at an estate weight several times any tested)
export const ELDER_FIRST = true;
// research/tests/couple-default.test.mjs only: 'firstnotelder' takes the first person for the elder, whatever the ages;
// 'eldereither' lifts the guard for an elder entered second too, as the first draft of D99 did
export const PLANT = { rule: '' };
const ageOf = (v, fallback) => {
  if (v === '' || v === null || v === undefined || typeof v === 'boolean' || (typeof v === 'number' && !Number.isFinite(v))) return fallback;
  const n = Number(v);
  return Math.min(120, Math.max(0, Number.isFinite(n) ? n : fallback));
};
export function elderOf(plan) {
  const d = (plan && plan.demographics) || {}, self = ageOf(d.currentAgeSelf, 40), part = ageOf(d.currentAgePart, self);
  return self > part ? 'self' : part > self ? 'part' : null;
}
export function coupleSolverOn(plan, on = COUPLES) {
  const of = w => ((plan && plan.accounts) || []).filter(a => String(a.id).endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0);
  const a = of('self'), b = of('part'), share = a + b > 0 ? a / (a + b) : 0.5;
  if (!on) return { on: false, share, why: 'off' };
  const inside = share >= COUPLE_BAND[0] - 1e-9 && share <= COUPLE_BAND[1] + 1e-9;
  const elder = PLANT.rule === 'firstnotelder' ? 'self' : elderOf(plan);
  const held = elder === 'self' ? share : elder === 'part' && (!ELDER_FIRST || PLANT.rule === 'eldereither') ? 1 - share : null;
  const elderMore = held !== null && held > COUPLE_BAND[1] + 1e-9 && held <= ELDER_UP_TO + 1e-9;
  return inside || elderMore ? { on: true, share, why: null } : { on: false, share, why: 'uneven' };
}
