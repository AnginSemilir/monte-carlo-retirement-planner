/*
 * THE SIMPLE PAGE'S SEARCHES OVER SOLVES (Part C Phase 10, item 5; src/solverSearch.js). The full tier.
 *
 * On evaluators whose answer is known (survival falling a point every £400 of target and passing 90% at exactly £24,000;
 * rising five points a year of retirement age and passing at exactly 60):
 *   1. the highest target from below (up a fifth, then halving) and from above (down a fifth, then halving): £24,000 both
 *      ways, a target at exactly the goal counted as passing, within the solves allowed;
 *   2. the cap: three solves allowed, the highest pass found so far, marked capped; nothing passing gives none;
 *   3. the earliest age from a passing age (a year earlier at a time) and from a failing one (a year later): 60 both ways;
 *      never at or before today's age; none past the last age;
 *   4. each solve reported as it lands (onStep), in order.
 * Plants (the module's PLANT): 'gt' (a survival at exactly the goal counted as failing) is caught on both searches;
 * 'nohalve' (the bracket not halved) is caught from above.
 *   node research/tests/solver-search.test.mjs
 */
import { highestTarget, earliestAge, PLANT, SEARCH_MOST } from '../../src/solverSearch.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log(`  ok  ${msg}`); } else { fail++; console.log(`  FAIL ${msg}`); } };
const byTarget = async x => 100 - (x - 20000) / 400;          // 90 at exactly 24,000
const byAge = async a => 70 + 5 * (a - 56);                    // 90 at exactly 60
const xs = r => r.tried.map(t => t.x).join(', ');

async function checks(label = '') {
  const before = fail;
  const up = await highestTarget(byTarget, { from: 20000 });
  ok(up.spend === 24000 && !up.capped && up.tried.length <= SEARCH_MOST.target, `1${label}. from below: £${up.spend} in ${up.tried.length} solves (${xs(up)}), the bracket ${up.bracket.join(' to ')}`);
  const down = await highestTarget(byTarget, { from: 30000 });
  ok(down.spend === 24000 && !down.capped && down.tried.length <= SEARCH_MOST.target, `1${label}. from above: £${down.spend} in ${down.tried.length} solves (${xs(down)})`);
  const early = await earliestAge(byAge, { from: 62, after: 50, last: 75 });
  ok(early.age === 60 && !early.capped, `3${label}. from a passing age: ${early.age} (${xs(early)})`);
  const late = await earliestAge(byAge, { from: 58, after: 50, last: 75 });
  ok(late.age === 60 && !late.capped, `3${label}. from a failing age: ${late.age} (${xs(late)})`);
  return fail - before;
}

console.log('=========== 1 AND 3. THE ANSWERS ===========');
await checks();
console.log('=========== 2. THE CAP ===========');
{
  const c = await highestTarget(byTarget, { from: 20000, most: 3 });
  ok(c.spend === 24000 && c.capped && c.tried.length === 3, `2. three solves allowed: the highest pass so far £${c.spend}, capped (${xs(c)}, the bracket ${c.bracket.join(' to ')})`);
  const none = await highestTarget(async () => 50, { from: 20000 });
  ok(none.spend === null && none.tried.length <= SEARCH_MOST.target, `2. nothing passing: no answer (${none.tried.length} solves, down to £${none.tried[none.tried.length - 1].x})`);
}
console.log('=========== 3. THE AGE\'S BOUNDS ===========');
{
  const today = await earliestAge(byAge, { from: 62, after: 60.5, last: 75 });
  ok(today.age === 61 && !today.tried.some(t => t.x <= 60.5), `3. aged 60.5: 61, never at or before today's age (${xs(today)})`);
  const past = await earliestAge(byAge, { from: 55, after: 50, last: 58 });
  ok(past.age === null && !past.tried.some(t => t.x > 58), `3. none passing by the last age: none (${xs(past)})`);
}
console.log('=========== 4. EACH SOLVE REPORTED ===========');
{
  const seen = [];
  const r = await highestTarget(byTarget, { from: 20000, onStep: s => seen.push(s) });
  ok(seen.length === r.tried.length && seen.every((s, i) => s.n === i + 1 && s.x === r.tried[i].x && s.survival === r.tried[i].survival), `4. onStep: ${seen.length} reports, in order, each solve's own figures`);
}
console.log('=========== THE PLANTS ===========');
for (const [rule, what] of [['gt', 'a survival at exactly the goal counted as failing'], ['nohalve', 'the bracket not halved']]) {
  const keep = { pass, fail };
  PLANT.rule = rule;
  console.log(`  -- planted: ${what} (expected to FAIL) --`);
  const caught = await checks(` [${rule}]`);
  PLANT.rule = '';
  pass = keep.pass; fail = keep.fail;
  ok(caught > 0, `the plant '${rule}' (${what}) is caught: ${caught} check${caught === 1 ? '' : 's'} failed`);
}
console.log('EDGES: a survival at exactly the goal, a search out of solves, nothing passing, today\'s age between two whole ages, the last age');
console.log(fail ? `\nFAILED: ${fail} of ${pass + fail}` : `\nALL PASS: ${pass}`);
process.exit(fail ? 1 : 0);
