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

/* the risk tiers, riskiest first (Cash Equivalents last) */
const RISK = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk', 'Cash Equivalents'];
/*
 * THE LOCKS (Part C Phase 7c, research/solver/PHASE-7.md): `plan.solver.locks` (App.jsx normalizeSolverLocks) applied to the plan
 * the solver solves, so the engine that runs the solved plan holds to them too. Each shrinks what the solver may do:
 *   pensionBefore  the plan's pension access age raised to it (never lowered): no pension, nor lump sum, before that age;
 *   tierCeiling    the pension's or ISA's tier lowered to it where riskier (single households: the wrappers of 'self'), and
 *                  the tier above switched off (`riskAbove: false`), so no tier the solver may choose is riskier;
 *   lumpSum        'never' phased drawdown, 'now' the full tax-free lump at first access, 'free' the plan's own choice (the
 *                  solver does not choose the lump yet: the lump sum's route is the maintainer's call, D41 (5)).
 * Applied twice is applied once.
 */
export function lockedPlan(E, plan) {
  const L = plan.solver && plan.solver.locks;
  if (!L) return { plan, riskAbove: undefined };
  let p = plan, binds = false;
  if (L.pensionBefore !== null && L.pensionBefore !== undefined) {
    const d = p.demographics || {}, now = E.num(d.privatePensionAge, 58);
    if (L.pensionBefore > now) p = { ...p, demographics: { ...d, privatePensionAge: L.pensionBefore } };
  }
  if (L.lumpSum === 'never' || L.lumpSum === 'now') p = { ...p, spending: { ...p.spending, drawdownStrategy: L.lumpSum === 'now' ? 'Full 25% Lump Sum' : 'Phased Drawdown' } };
  const tc = L.tierCeiling || {};
  for (const [w, prefix] of [['pen', 'pen_'], ['isa', 'isa_']]) {
    const ceil = tc[w];
    if (!ceil || !RISK.includes(ceil)) continue;
    binds = true;
    p = { ...p, accounts: (p.accounts || []).map(a => (a.id && a.id.startsWith(prefix) && RISK.indexOf(a.risk) < RISK.indexOf(ceil) ? { ...a, risk: ceil } : a)) };
  }
  return { plan: p, riskAbove: binds ? false : undefined };
}

/*
 * The plan as the solver takes it: the locks applied (lockedPlan), guardrails and the one-off cost lookahead off (a solved table is the spending rule, and
 * the engine refuses a table with either on; src/solver/bridge.js withTable), normalised, the MPAA resolved. Twice is once:
 * the same plan back on every one of the library's 420 households (30 Oct).
 */
export function prepareForSolve(E, plan) {
  const p = lockedPlan(E, E.normalizePlan(plan)).plan;
  return E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
}

