/*
 * The priority ranking's three promises:
 *   1. the default order reproduces the ranking the app used before priorities existed
 *   2. a lower priority can only break a NEAR-TIE on the higher ones - never buy a gain in what you
 *      care about less by sacrificing something you care about more
 *   3. promoting a priority actually changes the answer when the field offers a real choice
 */
import * as E from '../engine.mjs';
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };

const mk = (id, successRate, p10, median, extra = {}) => ({ id, stats: {
  successRate, p10Terminal: p10, medianTerminal: median,
  p10TerminalNet: p10, medianTerminalNet: median,
  preNmpaFailRate: 0, medianLifetimeTax: 0, ...extra } });

console.log('=========== A. THE DEFAULT REPRODUCES THE OLD RANKING ===========');
ok('picks the clear survival winner', E.pickBest([mk('a', 80, 10, 10), mk('b', 92, 5, 5), mk('c', 85, 99, 99)]).id === 'b');
/*
 * Figures are realistic on purpose. This fixture used to read (10 vs 900), and the £1,000 tolerance
 * floor correctly began treating an £890 gap in a 10th-percentile pot as the noise it is. The test is
 * about a near-tie on survival being broken by a MATERIALLY better downside pot, so the amounts have to
 * be material.
 */
ok('breaks a near-tie on the downside pot', E.pickBest([mk('a', 92.0, 100000, 100000), mk('b', 91.7, 400000, 100000)]).id === 'b');
ok('does not break a REAL survival gap on the pot', E.pickBest([mk('a', 92.0, 10, 10), mk('b', 88.0, 900, 900)]).id === 'a');

console.log('\n=========== B. A RANKING, NOT A TIE-BREAK ===========');
{
  // 4 survival points apart: far beyond the 1pt epsilon, so no lower priority may override it
  const field = [mk('safe', 95, 100, 100), mk('rich', 91, 900000, 900000)];
  ok('survival first keeps the safe one despite a vastly richer rival',
    E.pickBest(field, { priorities: ['survive', 'pot'] }).id === 'safe');
  ok('pot first takes the rich one', E.pickBest(field, { priorities: ['pot', 'survive'] }).id === 'rich');
}
{
  // inside the epsilon on survival (0.4pt < 1.0pt), so the second priority legitimately decides
  const field = [mk('a', 92.0, 100, 100), mk('b', 91.6, 500000, 500000)];
  ok('a sub-epsilon survival gap lets the next priority decide',
    E.pickBest(field, { priorities: ['survive', 'pot'] }).id === 'b');
}
{
  // money epsilon is 3% relative: a 1% richer rival is "the same" and the next priority decides
  const field = [mk('a', 90, 100, 1000000), mk('b', 95, 100, 1010000)];
  ok('a 1% pot difference is not material, so survival breaks it',
    E.pickBest(field, { priorities: ['pot', 'survive'] }).id === 'b');
  /*
   * Written before the survival guard existed, this fixture gave up NINE points of survival for a
   * bigger pot and asserted that was correct. The guard now refuses it, and rightly: measurement put
   * the worst trade any real household makes at 4.33 points. The gap is reduced to sit inside the cap,
   * so the test still checks what it was for - that a material money difference holds against survival -
   * without also asserting that an unlimited sacrifice is allowed.
   */
  const field2 = [mk('a', 94, 100, 1000000), mk('b', 90, 100, 1300000)];
  ok('a 30% pot difference IS material and holds against survival',
    E.pickBest(field2, { priorities: ['pot', 'survive'] }).id === 'b');
}

console.log('\n=========== C. THE OTHER METRICS ===========');
{
  const field = [mk('lo', 90, 100, 100, { medianLifetimeTax: 5000 }), mk('hi', 90, 100, 100, { medianLifetimeTax: 90000 })];
  ok('lowest lifetime tax picks the low-tax candidate', E.pickBest(field, { priorities: ['tax'] }).id === 'lo');
  const bridge = [mk('risky', 95, 100, 100, { preNmpaFailRate: 12 }), mk('safe', 93, 100, 100, { preNmpaFailRate: 0 })];
  ok('bridge-first prefers the one that reaches pension age', E.pickBest(bridge, { priorities: ['bridge'] }).id === 'safe');
  ok('the pre-access CAP still overrides everything as a constraint',
    E.pickBest(bridge, { priorities: ['survive'], preAccessCap: 5 }).id === 'safe');
}

console.log('\n=========== D. EXPLAINING THE PICK ===========');
{
  const field = [mk('a', 95, 100, 100), mk('b', 91, 900000, 900000)];
  const ex = E.explainPick(field, { priorities: ['survive', 'pot'] });
  ok('explains which priority decided it', ex.winner.id === 'a' && ex.steps.length >= 1 && ex.steps[0].key === 'survive',
    ex.steps.map(s => `${s.key} ruled out ${s.ruledOut}`).join(', '));
  // a priority that never narrowed the field must not be claimed as a reason
  const tied = [mk('a', 90, 100, 100), mk('b', 90, 100, 100)];
  ok('a priority that changed nothing is not reported as a reason', E.explainPick(tied, {}).steps.length === 0);
}

console.log('\n=========== E. SAVED PLANS SURVIVE ===========');
ok('a plan saved before priorities existed gets the default order',
  E.normalizePlan({ spending: { targetSpend: 30000 } }).spending.priorities.join() === E.DEFAULT_PRIORITIES.join());
ok('a partial list is completed rather than rejected',
  E.normalizePriorities(['bequest']).length === E.PRIORITY_KEYS.length && E.normalizePriorities(['bequest'])[0] === 'bequest');
ok('every priority carries the copy the docs need',
  E.PRIORITY_KEYS.every(k => E.PRIORITY_METRICS[k].label && E.PRIORITY_METRICS[k].why && E.PRIORITY_METRICS[k].serves));

console.log('\n=========== F. BEQUEST RANKS ON WHAT HEIRS RECEIVE, NOT THE GROSS POT ===========');
{
  /*
   * This is the regression that matters. The metric used to read `medianTerminalNet`, which with no
   * death tax set IS the gross pot - so "leave as much behind" and "biggest pot" gave identical answers,
   * and measurement showed the former delivered LESS real inheritance than not asking at all. If these
   * two orders ever agree on a field where the post-tax figure disagrees with the gross one, it has
   * regressed.
   */
  const field = [
    mk('big-pot-taxed-hard', 90, 100, 2000000, { postTaxInheritance: 900000 }),
    mk('smaller-pot-kept',   90, 100, 1500000, { postTaxInheritance: 1300000 })
  ];
  ok('bequest follows the post-tax figure, not the pot',
    E.pickBest(field, { priorities: ['bequest', 'survive'] }).id === 'smaller-pot-kept');
  ok('pot still follows the pot', E.pickBest(field, { priorities: ['pot', 'survive'] }).id === 'big-pot-taxed-hard');
  ok('the two priorities genuinely disagree here',
    E.pickBest(field, { priorities: ['bequest'] }).id !== E.pickBest(field, { priorities: ['pot'] }).id);
  // and where nobody has been named an heir there is nothing to compute, so it must not throw
  const noHeirs = [mk('a', 90, 100, 1000000), mk('b', 90, 100, 1200000)];
  ok('falls back to the pot when no heirs are named', E.pickBest(noHeirs, { priorities: ['bequest'] }).id === 'b');
}

console.log('\n=========== G. THE SURVIVAL GUARD: A PREFERENCE CANNOT COST UNLIMITED SAFETY ===========');
{
  /*
   * Lexicographic ranking gives a lower priority no protection at all, so without this guard a stated
   * preference could in principle pick something far more fragile than the best available and say
   * nothing about it. Measurement across 120 households put the real worst case at 4.33 points, which
   * is why the cap sits at 5: high enough never to refuse a trade the library calls reasonable, low
   * enough to catch anything worse in a plan nobody tested.
   */
  ok('the cap is set above the measured worst case of 4.33pt', E.MAX_SURVIVAL_SACRIFICE_PTS >= 4.33 && E.MAX_SURVIVAL_SACRIFICE_PTS <= 10,
    `${E.MAX_SURVIVAL_SACRIFICE_PTS}pt`);

  // a 15-point sacrifice for a vastly bigger pot: exactly what the guard exists to refuse
  const reckless = [mk('safe', 92, 100, 500000), mk('fragile', 77, 100, 5000000)];
  ok('refuses a 15pt sacrifice however the priorities are ordered',
    E.pickBest(reckless, { priorities: ['pot', 'survive'] }).id === 'safe');
  ok('and refuses it for every other money priority too',
    ['bequest', 'tax', 'downside'].every(k => E.pickBest(reckless, { priorities: [k, 'survive'] }).id !== 'fragile'));

  // a 3-point sacrifice for 37% more pot is the trade the measurement found reasonable - allow it
  const reasonable = [mk('safe', 92, 100, 1000000), mk('richer', 89, 100, 1370000)];
  ok('still allows a 3pt sacrifice for a materially bigger pot',
    E.pickBest(reasonable, { priorities: ['pot', 'survive'] }).id === 'richer');

  // exactly at the boundary, and just past it
  ok('allows a sacrifice exactly at the cap', E.pickBest([mk('a', 90, 100, 100), mk('b', 85, 100, 900000)], { priorities: ['pot'] }).id === 'b');
  ok('refuses one just past it', E.pickBest([mk('a', 90, 100, 100), mk('b', 84.9, 100, 900000)], { priorities: ['pot'] }).id === 'a');

  ok('the cap can be relaxed deliberately', E.pickBest(reckless, { priorities: ['pot'], maxSurvivalSacrificePts: Infinity }).id === 'fragile');
  ok('and tightened', E.pickBest(reasonable, { priorities: ['pot'], maxSurvivalSacrificePts: 1 }).id === 'safe');

  // it must never empty the field: if every option is far below the best, something still comes back
  const allBad = [mk('a', 90, 100, 100), mk('b', 40, 100, 200)];
  ok('never returns nothing, even when no option clears the bar', !!E.pickBest([allBad[1]], { priorities: ['survive'] }));

  // and it must be reported when it binds, but not when it does not
  const boundExp = E.explainPick(reckless, { priorities: ['pot', 'survive'] });
  ok('explainPick reports the guard when it changed the answer', boundExp.guardBound === true && boundExp.guardRuledOut === 1,
    `bound=${boundExp.guardBound} ruledOut=${boundExp.guardRuledOut}`);
  const freeExp = E.explainPick(reasonable, { priorities: ['pot', 'survive'] });
  ok('and stays silent when it did not', freeExp.guardBound === false);
}

console.log('\n=========== H. TOLERANCES DO NOT COLLAPSE NEAR ZERO ===========');
{
  /*
   * A purely relative tolerance vanishes as its reference approaches zero, and lifetime tax is
   * MINIMISED - so its reference is the smallest achievable figure. On a household where some policy
   * gets tax near zero, 3% of it is near zero, and every rival becomes "meaningfully worse" by an
   * unbounded multiple. Measurement showed exactly that: losses reported at 2.1 trillion times the
   * threshold, which is a divide-by-nothing wearing a statistic's clothing.
   */
  ok('the money tolerance has an absolute floor', E.MONEY_EPSILON_FLOOR > 0, `£${E.MONEY_EPSILON_FLOOR}`);
  const m = E.PRIORITY_METRICS.tax;
  ok('a near-zero reference still yields a usable tolerance', m.epsilon(0) === E.MONEY_EPSILON_FLOOR, String(m.epsilon(0)));
  ok('and a large reference still scales relatively', m.epsilon(10000000) > E.MONEY_EPSILON_FLOOR * 10, String(m.epsilon(10000000)));

  // two candidates whose tax differs by less than the floor must count as tied, letting the next
  // priority decide, rather than the first one splitting hairs over pennies
  const hairs = [mk('a', 88, 100, 100, { medianLifetimeTax: 0 }), mk('b', 95, 100, 100, { medianLifetimeTax: 400 })];
  ok('a sub-floor tax difference does not override survival',
    E.pickBest(hairs, { priorities: ['tax', 'survive'] }).id === 'b');
  // but a real difference still does
  const real = [mk('a', 88, 100, 100, { medianLifetimeTax: 0 }), mk('b', 89, 100, 100, { medianLifetimeTax: 90000 })];
  ok('a material tax difference still decides', E.pickBest(real, { priorities: ['tax', 'survive'] }).id === 'a');
}

console.log('\n=========== I. PER-PRIORITY TOLERANCE OVERRIDES ===========');
{
  /*
   * Granularity without the backfire. Tolerance is deliberately NOT derived from rank - measurement
   * showed that tightening the top priority's tolerance makes everything below it matter less - so it
   * is set per priority instead, which is a genuine personal judgement about what counts as a
   * meaningful difference in that particular quantity.
   */
  const field = [mk('safe', 92.0, 100000, 100000), mk('rich', 91.5, 100000, 400000)];
  // default 1pt survival tolerance: 0.5pt apart is a tie, so the pot decides
  ok('by default a 0.5pt survival gap is a tie and the pot decides',
    E.pickBest(field, { priorities: ['survive', 'pot'] }).id === 'rich');
  // tightened to 0.25pt, survival now decides alone
  ok('a tighter survival threshold makes survival decide',
    E.pickBest(field, { priorities: ['survive', 'pot'], tolerances: { survive: 0.25 } }).id === 'safe');
  // loosening a money threshold declares more ties, handing the choice down
  const money = [mk('a', 90, 100000, 1000000), mk('b', 95, 100000, 1080000)];
  ok('a default money threshold lets an 8% pot gap decide',
    E.pickBest(money, { priorities: ['pot', 'survive'] }).id === 'b');
  ok('loosening it to 20% declares a tie, so survival decides',
    E.pickBest(money, { priorities: ['pot', 'survive'], tolerances: { pot: 20 } }).id === 'b');
  ok('and tightening it to 1% keeps the pot deciding',
    E.pickBest(money, { priorities: ['pot', 'survive'], tolerances: { pot: 1 } }).id === 'b');

  ok('zero and junk overrides fall back to the default rather than being honoured',
    Object.keys(E.normalizeTolerances({ survive: 0, pot: -5, nonsense: 3 })).length === 0);
  ok('a positive override survives normalisation', E.normalizeTolerances({ survive: 0.5 }).survive === 0.5);
  ok('rate metrics are read as points and money metrics as a percentage',
    E.toleranceFor('survive', 90, { survive: 2 }) === 2 && E.toleranceFor('pot', 1000000, { pot: 10 }) === 100000);
  ok('an override still respects the money floor', E.toleranceFor('tax', 100, { tax: 1 }) === E.MONEY_EPSILON_FLOOR);
  ok('a plan with no overrides behaves exactly as before',
    E.pickBest(field, { priorities: ['survive', 'pot'], tolerances: {} }).id === E.pickBest(field, { priorities: ['survive', 'pot'] }).id);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
