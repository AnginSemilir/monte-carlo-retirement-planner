/*
 * THE SOLVER'S SETTINGS IN THE APP (Part C Phase 7, research/solver/PHASE-7.md): the research candidate's settings and the plan
 * as the solver takes it, without the solver itself, so the page's own code (src/solverKey.js) can name a solve without
 * loading it. src/solverApp.js re-exports them beside its solve.
 *
 * The app's own copy of research/solver/candidate.json (the candidate the maintainer decided, D40 (1), D43) and of O60's tier
 * returns (results-o60.txt's blend medians, which candidatePlan sets on the plan's tiers). research/tests/solver-app.test.mjs
 * pins both to the research files and the copy's hash to CANDIDATE_HASH, so the candidate cannot change in one place and not
 * the other. No `node:` imports.
 */
export const APP_CANDIDATE = Object.freeze({
  bridgeRead: 'reader', tierState: true, jointWorlds: true, bequestWeight: 0.02, bridgeStep: 'exact', switchCharge: 0.001,
  switchMargin: 0, e3: true, pclsInterp: true, e3pcls: true, readerRef: 'adaptive',
  adaptiveLattice: Object.freeze({ na: 160, nb: 41, nz: 128, foot: true, stepAll: true }), readerSplit: 'rs', tiersBelow: 3,
  menuPlus: Object.freeze(['hr']), tableDealing: false, failDelivered: true
});
/* the tiers' real returns at the medians of their blends (O60, D13) */
export const APP_TIER_REALS = Object.freeze({ 'High Risk': 4.97, 'Medium/High Risk': 4.65, 'Medium Risk': 4.18, 'Medium/Low Risk': 3.55, 'Low Risk': 2.76 });
/* today's dislike of spending cuts, the default (D44 (1)); Phase 4's */
export const APP_LAMBDA = 0.0223606797749979;
/* the candidate's wealth points (D26) */
export const APP_POINTS = 45;
/* the dislike of cuts' positions on Phase 8's dial, as multiples of APP_LAMBDA, the first the default (D46) */
export const APP_DIAL = Object.freeze([1, 3, 6, 10]);

/* the plan with each blended tier's real at its blend median; riskSource '' so normalizePlan keeps them (candidate.mjs) */
export function appPlan(E, plan) {
  const base = E.normalizePlan(plan), rp = {};
  for (const [k, p] of Object.entries(base.riskProfiles)) rp[k] = k in APP_TIER_REALS ? { ...p, real: APP_TIER_REALS[k] } : { ...p };
  return { ...plan, riskProfiles: rp, riskSource: '' };
}

/*
 * The plan as the solver takes it: guardrails and the one-off cost lookahead off (a solved table is the spending rule, and
 * the engine refuses a table with either on; src/solver/bridge.js withTable), normalised, the MPAA resolved. Twice is once:
 * the same plan back on every one of the library's 420 households (30 Oct).
 */
export function prepareForSolve(E, plan) {
  return E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
}

