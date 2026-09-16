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

console.log('\n=========== J. BALANCED MODE ===========');
{
  /*
   * Ranking cannot express "a modest gain in three things beats a small loss in one" - whatever sits
   * first decides and the rest only tidy up. Balanced blends every metric, which needs them on a common
   * scale first: survival is in points and pots are in pounds, and adding those directly would let
   * whichever has bigger numbers win by accident rather than by merit.
   */
  /*
   * The survival gap is 2.5 points, not 1: at exactly 1 point the two are declared tied by the default
   * tolerance and the ranked walk falls through to the next priority, so the fixture would have been
   * testing the tie-break rather than the ranking.
   */
  const allRound = mk('all-round', 88.5, 300000, 300000, { medianLifetimeTax: 40000 });
  const oneTrick = mk('one-trick', 91, 100000, 100000, { medianLifetimeTax: 200000 });
  ok('ranking by survival takes the narrow winner', E.pickBest([allRound, oneTrick], { priorities: ['survive'] }).id === 'one-trick');
  ok('balancing takes the all-rounder', E.pickBest([allRound, oneTrick], { mode: 'balanced' }).id === 'all-round');

  // scaling is within the field, so a metric measured in millions cannot outvote one measured in points
  const scores = E.balancedScore([allRound, oneTrick]);
  ok('scores are bounded between 0 and 1', scores.every(x => x >= 0 && x <= 1), scores.map(x => x.toFixed(2)).join(', '));
  ok('the better all-round candidate scores higher', scores[0] > scores[1], `${scores[0].toFixed(2)} vs ${scores[1].toFixed(2)}`);

  // a metric on which everything ties must contribute nothing rather than dividing by zero
  const tied = [mk('a', 90, 100000, 100000), mk('b', 90, 100000, 200000)];
  const ts = E.balancedScore(tied);
  ok('a metric where every candidate ties does not divide by zero', ts.every(Number.isFinite), ts.join(', '));
  ok('and the metric that does differ still decides', E.pickBest(tied, { mode: 'balanced' }).id === 'b');

  // the survival guard is not bypassed by switching mode
  const reckless = [mk('safe', 92, 100000, 500000), mk('fragile', 77, 100000, 9000000)];
  ok('balanced still respects the survival limit', E.pickBest(reckless, { mode: 'balanced' }).id === 'safe');

  ok('a single candidate is returned unchanged', E.pickBest([allRound], { mode: 'balanced' }).id === 'all-round');
  ok('saved plans default to ranked', E.normalizePlan({}).spending.priorityMode === 'ranked');
  ok('and a stored balanced choice survives', E.normalizePlan({ spending: { priorityMode: 'balanced' } }).spending.priorityMode === 'balanced');
  ok('junk falls back to ranked', E.normalizePlan({ spending: { priorityMode: 'nonsense' } }).spending.priorityMode === 'ranked');
}

console.log('\n=========== J. WHICH PRIORITIES ACTUALLY DECIDED IT ===========');
{
  /*
   * `steps` says what chose the winner. It cannot say why the rest did not, and the two ways a
   * priority fails to matter mean opposite things to somebody reading their own result: TIED says
   * their plan does not differ on it, NOT REACHED says only that what they ranked above had already
   * settled the answer. `consulted` and `settledAfter` are what tell them apart.
   */
  const ORDER = ['survive', 'downside', 'bequest', 'bridge', 'pot', 'tax'];

  // survival identical, downside materially apart: the first ties, the second decides
  const a = mk('a', 90, 100000, 400000);
  const b = mk('b', 90, 300000, 200000);
  const r = E.explainPick([a, b], { priorities: ORDER });
  const byKey = Object.fromEntries(r.consulted.map(c => [c.key, c]));

  ok('consulted records a priority that tied', !!byKey.survive && byKey.survive.decided === false);
  ok('and its spread is zero when every candidate scores the same', byKey.survive.spread === 0, String(byKey.survive.spread));
  ok('the one that narrowed is marked as deciding', !!byKey.downside && byKey.downside.decided === true);
  ok('steps keeps only the deciding ones', r.steps.length === 1 && r.steps[0].key === 'downside',
    r.steps.map(x => x.key).join(','));
  ok('and steps is still a subset of consulted', r.steps.every(st => byKey[st.key] && byKey[st.key].decided));

  // once one candidate is left the loop stops, and the rest were never reached
  ok('settledAfter marks where the field closed', r.settledAfter === 2, String(r.settledAfter));
  const reached = new Set(r.consulted.map(c => c.key));
  ok('so the priorities below it are absent from consulted',
    ORDER.slice(2).every(k => !reached.has(k)), [...reached].join(','));
  ok('and the order it consulted them in is the order given',
    r.consulted.map(c => c.key).join(',') === 'survive,downside');

  // a spread just under the tolerance still counts as a tie, and says how close it came
  const near = E.explainPick([mk('x', 90, 100000, 500000), mk('y', 90.5, 100000, 200000)], { priorities: ORDER });
  const nearSurvive = near.consulted.find(c => c.key === 'survive');
  ok('a near-tie is reported as tied', nearSurvive.decided === false);
  ok('with a spread below one tolerance', nearSurvive.spread > 0 && nearSurvive.spread < 1, nearSurvive.spread.toFixed(2));

  // every priority consulted, none deciding, means the whole order was inert
  const flat = E.explainPick([mk('p', 90, 100000, 200000), mk('q', 90, 100000, 200000)], { priorities: ORDER });
  ok('an entirely tied field consults every priority', flat.consulted.length === ORDER.length, String(flat.consulted.length));
  ok('and none of them decided anything', flat.consulted.every(c => !c.decided) && flat.steps.length === 0);
  ok('and a winner is still returned', !!flat.winner);

  // the winner is untouched by any of this
  ok('recording changes nothing about who wins', E.explainPick([a, b], { priorities: ORDER }).winner.id === 'b');
}

console.log('\n=========== K. THE LAST TIE, AND A BAD CASE THAT SURVIVES FAILURE ===========');
{
  const ORDER = ['survive', 'downside', 'bequest', 'bridge', 'pot', 'tax'];

  /*
   * WHEN EVERY PRIORITY HAS DECLARED THEM EQUIVALENT, NOTHING SUB-TOLERANCE MAY DECIDE.
   *
   * These two differ by 0.4 of a point on survival and £400 on tax - inside the 1.0-point and £1,000
   * tolerances respectively, so both gaps are ones the ranking has already called immaterial. An
   * earlier version of this section asserted the opposite: that the largest sub-tolerance value should
   * win, and that the answer should flip when a different priority was ranked first. That is reading
   * sampling noise as a preference. Measured on a real plan, it made the recommended policy flip
   * between 1,500 and 8,000 paths on identical inputs, moving safe spend by £1,750 a year.
   *
   * So the winner is now the model's own preference order, and the properties worth having are that it
   * is STABLE - not moved by a sub-tolerance gap, not moved by which priority sits first - and still
   * independent of the order the candidates arrived in.
   */
  const a = mk('a', 90.4, 100000, 200000, { medianLifetimeTax: 5000 });
  const b = mk('b', 90.0, 100000, 200000, { medianLifetimeTax: 4600 });
  const byOrder = E.explainPick([b, a], { priorities: ORDER }).winner.id;
  ok('a sub-tolerance gap does not decide the last tie',
    E.explainPick([a, b], { priorities: ORDER }).winner.id === byOrder);
  ok('and ranking a different priority first does not move it either',
    E.explainPick([a, b], { priorities: ['tax', ...ORDER.filter(k => k !== 'tax')] }).winner.id === byOrder,
    'both within tolerance, so neither ordering has anything to act on');
  ok('neither answer depends on the order the candidates arrived in',
    E.explainPick([a, b], { priorities: ORDER }).winner.id === E.explainPick([b, a], { priorities: ORDER }).winner.id);

  /*
   * ...and a gap that IS material still decides, or the guard above would have turned the ranking off.
   * Six points of survival is six times the tolerance.
   */
  const weak = mk('weak', 84.0, 100000, 200000, { medianLifetimeTax: 4600 });
  const strong = mk('strong', 90.0, 100000, 200000, { medianLifetimeTax: 5000 });
  ok('a gap wider than the tolerance still decides', E.explainPick([weak, strong], { priorities: ORDER }).winner.id === 'strong');
  ok('...whichever order they arrive in', E.explainPick([strong, weak], { priorities: ORDER }).winner.id === 'strong');

  /*
   * The bad-case metric. A pot floors at zero, so once the tenth-percentile lifetime runs dry every
   * policy scores an identical zero and the priority goes blind exactly when the bad case is real.
   * Netting off the spending that was never afforded puts the failures back in order.
   */
  const dead = [mk('early', 70, 0, 900000, { p10TerminalAdj: -500000 }),
                mk('late',  70, 0, 500000, { p10TerminalAdj: -200000 })];
  ok('two plans that both run dry are no longer indistinguishable',
    E.explainPick(dead, { priorities: ['downside', ...ORDER.filter(k => k !== 'downside')] }).winner.id === 'late');
  const consulted = E.explainPick(dead, { priorities: ['downside'] }).consulted[0];
  ok('and the bad-case priority now reports a real spread', consulted.spread > 1, consulted.spread.toFixed(2));
  ok('where on the old measure it saw nothing',
    Math.abs(E.PRIORITY_METRICS.downside.get({ p10TerminalNet: 0 })) === 0);

  // a plan that never falls short must be scored exactly as before, or every robust household moves
  const solvent = { p10TerminalAdj: 250000, p10TerminalNet: 250000, p10Terminal: 250000 };
  ok('a plan that always met its spending is unchanged by the adjustment',
    E.PRIORITY_METRICS.downside.get(solvent) === 250000);
  ok('and stats from before the field existed still rank', E.PRIORITY_METRICS.downside.get({ p10TerminalNet: 180000 }) === 180000);
}


console.log('\n=========== L. TRADE-OFF CARDS: A CHOICE ONLY WHERE THERE IS ONE ===========');
{
  const ORDER = E.DEFAULT_PRIORITIES;
  // a survival-first winner, a richer rival within the guard, a rival outside it, and a near-clone
  const field = [
    mk('safe',  96.0, 200000, 400000, { medianLifetimeTax: 90000 }),
    mk('rich',  94.5, 196000, 520000, { medianLifetimeTax: 95000 }),   // +30% pot for 1.5 pts
    mk('wild',  88.0, 100000, 900000, { medianLifetimeTax: 20000 }),   // beyond the 5pt guard
    mk('zclone', 95.8, 201000, 402000, { medianLifetimeTax: 89500 })   // inside every tolerance
  ];
  const t = E.buildTradeoffs(field);
  ok('the recommendation is the survival-first winner', t.recommended.id === 'safe');
  ok('the clone earns no card: every difference is inside a tolerance', !t.cards.some(c => c.candidate.id === 'zclone'));
  ok('the guarded-out candidate is never offered, however rich', !t.cards.some(c => c.candidate.id === 'wild'));
  ok('the richer rival is offered', t.cards.length === 1 && t.cards[0].candidate.id === 'rich');
  const card = t.cards[0];
  ok('its gain is the pot, priced against the recommendation', card.gains.length === 1 && card.gains[0].key === 'pot' && card.gains[0].delta === 120000);
  ok('its survival cost is stated in points', Math.abs(card.survivePts - 1.5) < 1e-9);
  ok('a tax loss above tolerance is listed as a cost', card.costs.some(c => c.key === 'tax' && c.delta === 5000));
  ok('a downside loss below tolerance is not', !card.costs.some(c => c.key === 'downside'));
  ok('the recommendation never appears as a card', !t.cards.some(c => c.candidate.id === t.recommended.id));

  const shuffled = E.buildTradeoffs([...field].reverse());
  ok('cards do not depend on the order the candidates arrived in',
    JSON.stringify(shuffled.cards.map(c => c.candidate.id)) === JSON.stringify(t.cards.map(c => c.candidate.id)) && shuffled.recommended.id === t.recommended.id);

  // one candidate best on two priorities is ONE card with two gains, not two cards
  const both = [mk('a', 96, 200000, 400000, { medianLifetimeTax: 90000 }), mk('b', 94.8, 300000, 520000, { medianLifetimeTax: 90000 })];
  const tb = E.buildTradeoffs(both);
  ok('a candidate best on several priorities is one card', tb.cards.length === 1);
  ok('...carrying every gain it offers', tb.cards[0].gains.map(g => g.key).sort().join() === 'downside,pot');
  ok('bequest is not listed separately when nobody inherits (it is the pot)', !tb.cards[0].gains.some(g => g.key === 'bequest'));

  // when the heirs are named, bequest is its own measurement and can earn its own gain
  const heirs = [mk('a', 96, 200000, 400000, { postTaxInheritance: 300000 }), mk('b', 94.8, 200500, 401000, { postTaxInheritance: 360000 })];
  const th = E.buildTradeoffs(heirs);
  ok('with heirs named, a bequest-only difference earns a card', th.cards.length === 1 && th.cards[0].gains.map(g => g.key).join() === 'bequest');

  ok('an all-tied field yields no cards', E.buildTradeoffs([mk('x', 96, 100, 100), mk('y', 95.9, 100, 100)]).cards.length === 0);
  ok('an empty field yields nothing and does not throw', E.buildTradeoffs([]).cards.length === 0 && E.buildTradeoffs([]).recommended === null);

  // a household's own thresholds widen or narrow what counts as a real difference
  const strict = E.buildTradeoffs(field, { tolerances: { pot: 40 } });
  ok('a wider pot threshold can swallow the card', strict.cards.length === 0);
  // ordering: the free lunch first. b costs no survival - the default order simply ranked downside
  // above pot and so did not choose it - while c buys a better bad case with two points of survival
  const free = [mk('a', 96, 200000, 400000), mk('b', 96, 180000, 470000), mk('c', 94, 320000, 400000)];
  const tf = E.buildTradeoffs(free);
  ok('a card that costs no survival sorts ahead of one that does', tf.cards.map(c => c.candidate.id).join() === 'b,c');
  ok('and its survival cost reads as zero', tf.cards[0].survivePts === 0);
  void ORDER;
}


console.log('\n=========== M. TWO RUNS AVERAGED, AND A CARD FOR ANY PAIR ===========');
{
  const a = { trials: 2000, successRate: 96, medianTerminal: 400000, p10TerminalAdj: 200000, preNmpaFailRate: 0, medianLifetimeTax: 90000, medianFailAge: null, bands: [1, 2, 3], postTaxInheritance: 300000, standardError: 0.44 };
  const b = { trials: 2000, successRate: 94, medianTerminal: 420000, p10TerminalAdj: 180000, preNmpaFailRate: 1, medianLifetimeTax: 92000, medianFailAge: 88, bands: [9, 9, 9], postTaxInheritance: 300000, standardError: 0.53 };
  const m = E.averageStats([a, b]);
  ok('scalars are averaged', m.successRate === 95 && m.medianTerminal === 410000 && m.preNmpaFailRate === 0.5);
  ok('the path count is pooled and the standard error recomputed from it', m.trials === 4000 && Math.abs(m.standardError - Math.sqrt(95 * 5 / 4000)) < 1e-9);
  ok('a curve keeps the first run\'s values', JSON.stringify(m.bands) === JSON.stringify([1, 2, 3]));
  ok('a field null in one run keeps the first run\'s value', m.medianFailAge === null);
  ok('a deterministic field averages to itself', m.postTaxInheritance === 300000);
  ok('one run averages to itself, none to null', E.averageStats([a]) === a && E.averageStats([]) === null);

  const rec = mk('rec', 96, 200000, 400000, { medianLifetimeTax: 90000 });
  const alt = mk('alt', 94.5, 196000, 520000, { medianLifetimeTax: 80000 });
  const card = E.tradeoffCard([rec, alt], rec, alt);
  ok('a card lists every gain beyond tolerance', card.gains.map(g => g.key).sort().join() === 'pot,tax');
  ok('survival beyond tolerance is listed as a cost and as points', card.costs[0].key === 'survive' && Math.abs(card.survivePts - 1.5) < 1e-9);
  ok('a downside loss inside tolerance is neither', !card.costs.some(c => c.key === 'downside') && !card.gains.some(g => g.key === 'downside'));
  const twinRow = mk('twin', 95.8, 201000, 402000, { medianLifetimeTax: 89500 });
  const twin = E.tradeoffCard([rec, twinRow], rec, twinRow);
  ok('two candidates inside every tolerance produce an empty card, not a missing one', twin.gains.length === 0 && twin.costs.length === 0);
  ok('buildTradeoffs prices its cards with the same builder', JSON.stringify(E.buildTradeoffs([rec, alt]).cards[0].gains) === JSON.stringify(card.gains));
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
