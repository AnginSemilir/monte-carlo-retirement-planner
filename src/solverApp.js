/*
 * THE SOLVER IN THE APP (Part C Phase 7, research/solver/PHASE-7.md step 7a): the research candidate's settings and the one
 * solve the app makes with them.
 *
 * The app's own copy of research/solver/candidate.json (the candidate the maintainer decided, D40 (1), D43) and of O60's tier
 * returns (results-o60.txt's blend medians, which candidatePlan sets on the plan's tiers). research/tests/solver-app.test.mjs
 * pins both to the research files and the copy's hash to CANDIDATE_HASH, so the candidate cannot change in one place and not
 * the other. No `node:` imports: the page's workers load this.
 *
 * e3pcls guard: e3pcls is exact only on the code its identity test passed on. The research solves check the pin before each
 * solve (e3pcls-pin.mjs reads files a browser cannot); the app runs only committed code, and the fast suite's e3pcls-guard
 * test fails any commit whose pin does not match the solver's code.
 */
import { solvePlan } from './solver/solve.js';

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

/*
 * The candidate's solve of a plan, as the app holds it (prepared here). `e2` splits it across workers (src/solverPool.js), `progress` feeds the bar; `research`
 * is for the tests and harnesses alone (a lighter adaptive lattice, say), spread after the candidate so it overrides it.
 */
export function solveForApp(E, M, plan, { lambda = APP_LAMBDA, points = APP_POINTS, e2 = null, progress = null, research = null } = {}) {
  return solvePlan(E, M, appPlan(E, prepareForSolve(E, plan)), { ...APP_CANDIDATE, ...research, lambda, points, ...(e2 ? { e2 } : {}), ...(progress ? { progress } : {}) });
}
