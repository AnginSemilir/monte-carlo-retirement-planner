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

/*
 * WHAT THE SOLVER AIMS FOR (Part C Phase 8, research/solver/PHASE-8.md): `plan.solver.aims` (App.jsx normalizeSolverAims) as the
 * solve's options. Each lever's default is the candidate's, so a plan without aims, or with every aim at its default, solves as
 * the candidate with today's lambda, bit for bit:
 *   cuts         the dislike of spending cuts, `lambda` that many times APP_LAMBDA (the dial, D46);
 *   estate       'lower': `bequestWeight` 0.01 (Phase 4's second weight) in place of the candidate's 0.02;
 *   raises       'blocked': `raiseCap` 1, no year above target (the default caps raises at 110%, solvePlan's);
 *   riskConsent  false: the plan's own tiers, no tier move (D39).
 * The minimum pot is the plan's own field (`config.solvencyFloor`), read by solvePlan as before. research/tests/solver-aims.test.mjs.
 */
/*
 * THE DIAL'S POSITIONS ABOVE THE DEFAULT (the launch plan's step L2, B3, D54): positions 3, 6 and 10 are lambda times the
 * position, solved on the tiers of the base (the same plan at position 1, every other aim the same: dialBase) through
 * `lockTiers` (the layer loop, `tsOnce: false`, and the base's own decision on the tier above), so the dial changes how
 * spending moves and not the risk taken (LOCK.md section 4). Variant 'B3a' adds the age weights (`ageWeight`, a cut's cost
 * weighed by a Gompertz chance of being alive; survival still counted to the plan's fixed age: D54); 'B3b' is the lock
 * alone. L4 measured both and R1 (D52) decided on its read of 2 Nov (results-levers.txt): B3a ships at 3, 6 and 10, and R2
 * keeps all four positions. Where the base has no
 * tier state (consent withdrawn, or a ceiling that leaves one pair) there is nothing to lock, and lambda and the weights
 * still apply. Position 1 is the candidate unchanged. src/solverApp.js solveForApp solves the base first where none is given.
 */
export const APP_DIAL_VARIANT = 'B3a';
export const APP_AGE_WEIGHT = Object.freeze({ mode: 90, disp: 9 });
export const dialOf = plan => { const a = (plan && plan.solver && plan.solver.aims) || {}; return APP_DIAL.includes(a.cuts) ? a.cuts : 1; };
export function aimsOptions(plan, variant = APP_DIAL_VARIANT) {
  const a = (plan && plan.solver && plan.solver.aims) || {}, pos = dialOf(plan);
  if (pos > 1 && variant !== 'B3a' && variant !== 'B3b') throw new Error(`aimsOptions: the dial's variant is B3a or B3b, not ${variant}`);
  return {
    lambda: APP_LAMBDA * pos,
    ...(pos > 1 ? { tsOnce: false, ...(variant === 'B3a' ? { ageWeight: APP_AGE_WEIGHT } : {}) } : {}),
    ...(a.estate === 'lower' ? { bequestWeight: 0.01 } : {}),
    ...(a.raises === 'blocked' ? { raiseCap: 1 } : {}),
    ...(a.riskConsent === false ? { riskConsent: false } : {})
  };
}
/* the base a dial position is locked to: the same plan at position 1, every other aim the same; null at position 1 */
export function dialBase(plan) {
  if (dialOf(plan) === 1) return null;
  return { ...plan, solver: { ...plan.solver, aims: { ...plan.solver.aims, cuts: 1 } } };
}
/* the dial's other positions in the order the live line solves them (Phase 10, item 3: "nearest first"): by their distance
   along the dial from the plan's own, the lower first where two are as near */
export const dialOrder = current => {
  const i = Math.max(0, APP_DIAL.indexOf(current));
  return APP_DIAL.map((x, j) => [x, Math.abs(j - i), j]).filter(([, d]) => d > 0).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(([x]) => x);
};
/* the plan at another of the dial's positions, every other aim its own */
export const atDial = (plan, x) => ({ ...plan, solver: { ...(plan.solver || {}), aims: { ...((plan.solver && plan.solver.aims) || {}), cuts: x } } });
/* the retirement-age dial (Phase 10, item 4; B11): the ages either side of the plan's own, the nearest first, the earlier first
   where two are as near; none at or before today's age, and none for a household already retired */
export const AGE_SPAN = 3;
export function ageOptions(plan, ageNow) {
  const own = Number(plan && plan.demographics && plan.demographics.retireAgeSelf);
  if (!Number.isFinite(own) || own <= ageNow) return null;
  const ages = [];
  for (let a = own - AGE_SPAN; a <= own + AGE_SPAN; a++) if (a > ageNow) ages.push(a);
  const order = ages.filter(a => a !== own).sort((a, b) => Math.abs(a - own) - Math.abs(b - own) || a - b);
  return { own, ages, order };
}
/* the plan retiring at another age, every other input its own */
export const atAge = (plan, a) => ({ ...plan, demographics: { ...plan.demographics, retireAgeSelf: a } });
/* what a dial position adds to the solve's key beyond lambda (src/solverKey.js): nothing at position 1 */
export const dialSettings = (plan, variant = APP_DIAL_VARIANT) => (dialOf(plan) > 1 ? { dial: { variant, lock: 'base', ...(variant === 'B3a' ? { ageWeight: APP_AGE_WEIGHT } : {}) } } : {});

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

/* the solver's spending floor where the plan sets none, as a share of the target (B2, D51): every test of the candidate set it */
export const APP_FLOOR = 0.8;
/*
 * The plan as the solver takes it: the locks applied (lockedPlan), guardrails and the one-off cost lookahead off (a solved table is the spending rule, and
 * the engine refuses a table with either on; src/solver/bridge.js withTable), the floor at APP_FLOOR of the target where the
 * plan's is 0 (rounded as research/solver/phase4-panel.mjs rounds it; without it the menu's levels are the target and the
 * raise alone, and the solve cannot cut: the launch plan's F1), normalised, the MPAA resolved. The engine that runs the
 * solved plan reads this plan; "your plan" under the app's rules keeps its own. Twice is once: the same plan back on every
 * one of the library's 420 households (30 Oct; research/tests/solver-floor.test.mjs).
 */
export function prepareForSolve(E, plan) {
  const p = lockedPlan(E, E.normalizePlan(plan)).plan, sp = p.spending || {};
  const spending = E.num(sp.floorSpend, 0) > 0 ? sp : { ...sp, floorSpend: Math.round(APP_FLOOR * E.num(sp.targetSpend, 0)) };
  return E.resolveMpaa(E.normalizePlan({ ...p, spending, config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
}

