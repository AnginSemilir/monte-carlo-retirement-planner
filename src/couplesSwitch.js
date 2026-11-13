/*
 * COUPLES IN THE NEW PLANNER (Part D, D5; research/solver/PART-D.md): the switch and the band, in a module with no imports, so
 * the page's first load can ask them without loading the solver.
 *   COUPLES     whether a couple's plan runs the solver in the new planner. Off: D6, couples on, is the maintainer's word
 *               (D91); until then a couple's plan keeps the app's rules and the couples card, exactly as before D5. The
 *               harnesses' light build turns it on (vite.config.js solverHarness, with COUPLES_ON=1).
 *   coupleSolverOn(plan, on)   { on, share, why }: on only with the switch on and the household inside 40% to 60% of the pots
 *               with its first person, until item 6's stage C reads (M4 in D66); `share` the first person's share of the
 *               pots; `why` 'off' (the switch) or 'uneven' (outside the band), null when on.
 * The band is couple.js's SHARE_BAND and the share its shareFor's (each account of each person's, its id ending _self or
 * _part), held equal by research/tests/couple-solve-client.test.mjs.
 */
// a harness's build with COUPLES_ON=1 reads it true (vite.config.js solverHarness: this line moved stops that build)
export const COUPLES = false;
export const COUPLE_BAND = [0.4, 0.6];
export function coupleSolverOn(plan, on = COUPLES) {
  const of = w => ((plan && plan.accounts) || []).filter(a => String(a.id).endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0);
  const a = of('self'), b = of('part'), share = a + b > 0 ? a / (a + b) : 0.5;
  if (!on) return { on: false, share, why: 'off' };
  const inside = share >= COUPLE_BAND[0] - 1e-9 && share <= COUPLE_BAND[1] + 1e-9;
  return inside ? { on: true, share, why: null } : { on: false, share, why: 'uneven' };
}
