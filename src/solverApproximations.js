/*
 * THE SOLVER'S APPROXIMATIONS (Phase 12 item 1, the launch plan: "the coverage card lists the solver's approximations";
 * research/solver/PHASE-12.md). One list for the new planner's coverage card (src/PlannerCards.jsx DocsSolver) and its
 * documentation (src/Docs.jsx, "How the solver decides"), so the two cannot part. Each line is a fact of the code:
 *   - the wealth grid: src/solverSettings.js APP_POINTS (45, B10), between its points the tables interpolate;
 *   - the tiers' returns: each at the median of its blend (the candidate's tiers, O60 in research/solver/STATE.md), the spread
 *     of a year's returns read at the tables' quadrature nodes;
 *   - the gain held in other investments: read at 5%, 25% or 55% of their value (src/solver/grid.js gainBuckets);
 *   - the solver's forecast against the simulation: every figure shown is the engine's run of the solved plan (D2);
 *   - the plan's end age: survival is counted to it; the dial's higher settings weigh a cut by the chance of being alive (B3a,
 *     D54, src/solverSettings.js dialSettings), the horizon unmoved;
 *   - who it plans for (src/couplesSwitch.js): one person, and since D99 a couple inside the guard (40% to 60% each, or the
 *     elder holding up to 90%: entered first, or since D104 (1) either way, SWAP_ELDER), but since D128 not a couple more than
 *     three years apart with other taxable income such as a DB pension (DB_GAP_UP_TO), any other couple's plan keeping the
 *     app's own rules; with couples off (the rollback) a couple's plan keeps the app's own rules, as since D42; the line follows
 *     both switches (research/tests/couple-default.test.mjs check 4);
 *   - the tax-free lump sum: as the plan or the Limits lock sets it, never chosen by the solver (B12; src/SolverConfig.jsx);
 *   - the paths: the headline's and the comparison's simulated markets, so a sampling error.
 */
import { COUPLES, SWAP_ELDER } from './couplesSwitch.js';

// research/tests/couple-default.test.mjs only: 'oldcouples' says a couple's plan keeps the app's rules with couples on, as before
// D99; 'nogapline' leaves out the couples more than three years apart with other taxable income, as before D128
export const PLANT = { rule: '' };
// `on` with couples on and the swap on (D104 (1)); `onFirst` with the swap off, the elder entered first alone (D99); `off` with
// couples off; since D128 `on` and `onFirst` name the couples kept on the app's rules by the age gap with other taxable income
// (src/couplesSwitch.js DB_GAP_UP_TO, three years: couple-default.test.mjs check 4 holds the words to it); `onBeforeGap` and
// `onFirstBeforeGap` the lines before D128, for the plant alone
const GAP_CLAUSE = ', except a couple more than three years apart in age who have other taxable income, such as a DB (final salary) pension or an annuity';
const BEFORE = Object.freeze({
  on: 'It plans for one person, or for a couple who hold their money about evenly (40% to 60% each) or whose older partner holds up to 90% of it. Any other couple\'s plan keeps the app\'s own rules.',
  onFirst: 'It plans for one person, or for a couple who hold their money about evenly (40% to 60% each) or whose older partner is entered first and holds up to 90% of it. Any other couple\'s plan keeps the app\'s own rules.'
});
const withGap = line => line.replace(' of it. Any other', ` of it${GAP_CLAUSE}. Any other`);
export const COUPLES_LINE = Object.freeze({
  on: withGap(BEFORE.on),
  onFirst: withGap(BEFORE.onFirst),
  off: 'It solves for one person. A couple\'s plan keeps the app\'s own rules.',
  onBeforeGap: BEFORE.on,
  onFirstBeforeGap: BEFORE.onFirst
});
export const solverApproximations = ({ points = 45, paths = 5000, comparePaths = 2000, couples = COUPLES, swap = SWAP_ELDER } = {}) => [
  `Your wealth is read on a grid of ${points} levels, and the share in each pot on a grid of its own; between their points the solver interpolates.`,
  'When the solver weighs a choice, each risk level\'s expected return is set at the middle of its blend of investments, and the spread of markets is read at a few points rather than in full. The simulation then draws every market.',
  'The gain built up in your other investments (GIA) is read at one of three levels, 5%, 25% or 55% of their value, not exactly.',
  'The solver\'s own forecast of a choice can differ from what happens when the plan is simulated. Every figure you see comes from simulating the solved plan with the app\'s own engine, not from that forecast.',
  'Survival is counted to the age your plan ends at. The higher settings of "How much do you dislike cuts?" weigh a cut later in life by the chance of being alive then; the plan\'s end does not move.',
  couples && PLANT.rule !== 'oldcouples' ? (PLANT.rule === 'nogapline' ? (swap ? COUPLES_LINE.onBeforeGap : COUPLES_LINE.onFirstBeforeGap) : swap ? COUPLES_LINE.on : COUPLES_LINE.onFirst) : COUPLES_LINE.off,
  'It does not choose when to take the tax-free lump sum: that stays as your plan or your limits set it.',
  `The figures come from ${paths.toLocaleString('en-GB')} simulated markets (the comparison of the four settings from ${comparePaths.toLocaleString('en-GB')}), so each carries a small sampling error.`,
];
