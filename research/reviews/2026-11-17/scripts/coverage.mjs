/*
 * WHAT DESIGN A'S MERGE TAKES AND REFUSES (the review, 17 Nov; EXPLORATORY; plan arithmetic only). Every couple of the
 * household library (research/policy-study/scenarios.mjs, as couple-panel.mjs couplesOf lists them) through
 * research/solver/household.mjs householdPlanFor: taken, or refused and why; and the shapes the library's couples have (the
 * age gap, who holds more), which is what any panel drawn from it can test.
 *   node research/reviews/2026-11-17/scripts/coverage.mjs
 */
import * as E from '../../../engine.mjs';
import { householdPlanFor } from '../../../solver/household.mjs';
import { couplesOf, appPlan } from '../../../solver/couple-panel.mjs';

const cs = couplesOf(), why = {}, gaps = {}, hold = { 'the first person more': 0, even: 0, 'the partner more': 0 }, retire = {};
let taken = 0;
for (const s of cs) {
  const plan = appPlan(s.plan), d = plan.demographics;
  const gap = Number(d.currentAgeSelf) - Number(d.currentAgePart);
  gaps[gap] = (gaps[gap] || 0) + 1;
  const of = w => plan.accounts.filter(a => a.owner === w).reduce((t, a) => t + (Number(a.balance) || 0), 0), a = of('Myself'), b = of('Partner');
  hold[a > b * 1.001 ? 'the first person more' : b > a * 1.001 ? 'the partner more' : 'even']++;
  const rg = Number(d.retireAgeSelf) - Number(d.retireAgePart);
  retire[rg] = (retire[rg] || 0) + 1;
  try { householdPlanFor(E, E.resolveMpaa(E.normalizePlan(plan))); taken++; } catch (e) { const k = e.message.replace(/\(.*\)/, '').replace(/^householdPlanFor: /, '').trim(); why[k] = (why[k] || 0) + 1; }
}
console.log('WHAT DESIGN A\'S MERGE TAKES AND REFUSES (the review, 17 Nov; EXPLORATORY; plan arithmetic only)');
console.log(`the library's couples: ${cs.length}; the household plan built for ${taken}; refused ${cs.length - taken}`);
for (const [k, v] of Object.entries(why).sort((x, y) => y[1] - x[1])) console.log(`  refused, ${v}: ${k}`);
console.log(`the first person's age less the partner's, by couple: ${Object.entries(gaps).map(([g, v]) => `${g} years: ${v}`).join(', ')}`);
console.log(`the first person's retirement age less the partner's: ${Object.entries(retire).map(([g, v]) => `${g}: ${v}`).join(', ')}`);
console.log(`who holds more of the pots: ${Object.entries(hold).map(([g, v]) => `${g}: ${v}`).join(', ')}`);
