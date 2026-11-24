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
 *     and, where the couples' default names the household plan (src/solverSettings.js APP_COUPLE.household; step 8's port,
 *     research/solver/HSP-PORT.md step 4; D134 (1)), how it plans a couple: one plan for the money the two hold, as if one
 *     person held it all (src/solver/household.js householdPlanFor), its tax bands and allowances k times one person's, k
 *     from how their pensions are split (pensionsSplit, the form 'pensionsPA'); each year both people take its move with
 *     their own money (chooseHouseholdSingle at the even split); every figure the engine's run of each person with their own
 *     tax;
 *   - the tax-free lump sum: as the plan or the Limits lock sets it, never chosen by the solver (B12; src/SolverConfig.jsx);
 *   - the paths: the headline's and the comparison's simulated markets, so a sampling error.
 */
import { COUPLES, SWAP_ELDER, HOUSEHOLD_OPEN, HOUSEHOLD_TAKES } from './couplesSwitch.js';
import { APP_COUPLE } from './solverSettings.js';

// research/tests/couple-default.test.mjs only: 'oldcouples' says a couple's plan keeps the app's rules with couples on, as before
// D99; 'nogapline' leaves out the couples more than three years apart with other taxable income, as before D128; 'nohouseline'
// leaves out how a couple is planned, as before the household default (D135); 'beforeopen' the line before D143, the household
// route's classes not open; 'beforetake' the line before step 4's change of default (D145), naming the three shapes it takes
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
// how it plans a couple, where the couples' default names the household plan (APP_COUPLE.household; the words the agent's draft
// and the maintainer's to change, as M3's and M6's were)
export const HOUSEHOLD_SENTENCE = ' For a couple, it works out one plan for the money you hold between you, as if one person held it all, with its tax bands set by how your pensions are split between you; each year you both take its steps, each with your own money, and every figure you see comes from simulating each of you with your own tax. Where your plan has something one plan cannot hold, such as the two of you keeping one kind of account at different risk levels, it plans each of you separately and puts the two together.';
const withHousehold = line => (APP_COUPLE.household ? `${line}${HOUSEHOLD_SENTENCE}` : line);
// D143 (the household route's classes open: src/couplesSwitch.js HOUSEHOLD_OPEN): who it plans for, every couple but one whose
// plan's shape the household plan cannot take yet (householdShapeOf's seven refusals, in its order) and that the guard before
// D143 kept off; `open` with the swap on, `openFirst` with it off, a couple whose elder is entered second then kept to the guard
// before D143 (the words the agent's draft and the maintainer's to change; couple-default.test.mjs check 4 holds them to the guard)
// Since step 4's change of default (D145; src/couplesSwitch.js HOUSEHOLD_TAKES) the household plan takes three of the seven
// shapes, so the line names the four it still refuses; the plant 'beforetake' the line before it, naming all seven
const SHAPE_PHRASES = Object.freeze([
  ['risks', 'the two of you holding the same kind of account at different risk levels'],
  ['growth', 'both paying into one kind of account with your payments growing at different rates'],
  ['cashisa', 'a cash ISA being paid into'],
  ['salaries', 'both being paid with your pay growing at different rates'],
  ['limits', 'your partner\'s own risk limits differing from yours'],
  ['year0', 'one of you retired while the other is still paid or saving this year'],
  ['noretire', 'neither of you retiring within the plan']
]);
const shapesOf = taken => { const xs = SHAPE_PHRASES.filter(([w]) => !taken[w]).map(([, t]) => t); return `(${xs.length > 1 ? `${xs.slice(0, -1).join(', ')}, or ${xs[xs.length - 1]}` : xs.join('')})`; };
const SHAPES = shapesOf(HOUSEHOLD_TAKES), SHAPES_BEFORE_TAKE = shapesOf({});
const OPEN_GAP = 'and you are not a couple more than three years apart in age who have other taxable income, such as a DB (final salary) pension or an annuity';
const openOf = shapes => Object.freeze({
  on: `It plans for one person or for a couple. The one exception is a couple whose plan it cannot yet plan as one household ${shapes}: that plan keeps`
    + ` the app's own rules, unless the two of you hold your money about evenly (40% to 60% each) or the older of you holds up to 90% of it, ${OPEN_GAP}.`,
  first: `It plans for one person or for a couple whose older partner is entered first, or who are the same age. The one exception is a couple whose plan`
    + ` it cannot yet plan as one household ${shapes}: that plan keeps the app's own rules, unless the two of you hold your money about evenly (40% to 60%`
    + ` each) or the older of you holds up to 90% of it, ${OPEN_GAP}. A couple whose older partner is entered second is planned only if the two of you`
    + ` hold your money about evenly (40% to 60% each), ${OPEN_GAP}; any other keeps the app's own rules.`
});
const OPEN = openOf(SHAPES), OPEN_BEFORE_TAKE = openOf(SHAPES_BEFORE_TAKE);
// all four classes open or none: the words say one or the other (couple-default.test.mjs check 4 refuses a mixture); the plant
// 'beforeopen' the line before D143
const allOpen = () => ['Y', 'E', 'S', 'G'].every(c => HOUSEHOLD_OPEN[c]) && PLANT.rule !== 'beforeopen';
export const COUPLES_LINE = Object.freeze({
  open: withHousehold(OPEN.on),
  openFirst: withHousehold(OPEN.first),
  openBeforeTake: withHousehold(OPEN_BEFORE_TAKE.on),
  openFirstBeforeTake: withHousehold(OPEN_BEFORE_TAKE.first),
  on: withHousehold(withGap(BEFORE.on)),
  onFirst: withHousehold(withGap(BEFORE.onFirst)),
  off: 'It solves for one person. A couple\'s plan keeps the app\'s own rules.',
  onBeforeGap: BEFORE.on,
  onFirstBeforeGap: BEFORE.onFirst
});
// the couples' line with couples on: D143's where its classes are open, else the line before it; the plants 'nogapline' and
// 'nohouseline' each leave their clause out of the line shown (before D128, before D135)
const coverageLine = swap => {
  const line = allOpen() ? (PLANT.rule === 'beforetake' ? (swap ? COUPLES_LINE.openBeforeTake : COUPLES_LINE.openFirstBeforeTake) : (swap ? COUPLES_LINE.open : COUPLES_LINE.openFirst)) : PLANT.rule === 'nogapline' ? (swap ? COUPLES_LINE.onBeforeGap : COUPLES_LINE.onFirstBeforeGap) : (swap ? COUPLES_LINE.on : COUPLES_LINE.onFirst);
  if (PLANT.rule === 'nohouseline') return line.replace(HOUSEHOLD_SENTENCE, '');
  if (PLANT.rule === 'nogapline' && allOpen()) return line.split(`, ${OPEN_GAP}`).join('');
  return line;
};
export const solverApproximations = ({ points = 45, paths = 5000, comparePaths = 2000, couples = COUPLES, swap = SWAP_ELDER } = {}) => [
  `Your wealth is read on a grid of ${points} levels, and the share in each pot on a grid of its own; between their points the solver interpolates.`,
  'When the solver weighs a choice, each risk level\'s expected return is set at the middle of its blend of investments, and the spread of markets is read at a few points rather than in full. The simulation then draws every market.',
  'The gain built up in your other investments (GIA) is read at one of three levels, 5%, 25% or 55% of their value, not exactly.',
  'The solver\'s own forecast of a choice can differ from what happens when the plan is simulated. Every figure you see comes from simulating the solved plan with the app\'s own engine, not from that forecast.',
  'Survival is counted to the age your plan ends at. The higher settings of "How much do you dislike cuts?" weigh a cut later in life by the chance of being alive then; the plan\'s end does not move.',
  couples && PLANT.rule !== 'oldcouples' ? coverageLine(swap) : COUPLES_LINE.off,
  'It does not choose when to take the tax-free lump sum: that stays as your plan or your limits set it.',
  `The figures come from ${paths.toLocaleString('en-GB')} simulated markets (the comparison of the four settings from ${comparePaths.toLocaleString('en-GB')}), so each carries a small sampling error.`,
];
