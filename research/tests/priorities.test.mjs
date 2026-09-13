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
ok('breaks a near-tie on the downside pot', E.pickBest([mk('a', 92.0, 10, 10), mk('b', 91.7, 900, 10)]).id === 'b');
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
  const field2 = [mk('a', 99, 100, 1000000), mk('b', 90, 100, 1300000)];
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

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
