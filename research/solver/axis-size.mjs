/*
 * THE AXIS'S COST IN TABLE SIZE (EXPLORATORY, for AXIS.md, PRESCRIPTIVE-PLAN.md step 6, D121; nothing built, deciding
 * nothing). The axis ANSWERS.md section 3 sets out: the smaller pension's share of the two carried on three points (0, the
 * plan's opening share, 0.5) from the household's first retirement to the younger person's state pension age, dropped at
 * both ends. In those years the household table holds three copies of a single's state, elsewhere one, so with a year's
 * table the same size in every year it is 1 + 2 x (the window's years) / (the plan's years) times a single's (the plan's
 * years counted 0 to its last, as ANSWERS.md counts them). For each unit named: the plan's years, the first plan year
 * anyone retires (householdPlanFor's), the plan year the younger person reaches the state pension age, the window's years
 * and the factor; and, as a check on this reading of section 3, the same for the units section 3 names (S023, S149, the
 * younger couples, S377: "3 of 28", "15 of 40", "19 of 61", "21 of 46").
 *   node research/solver/axis-size.mjs <unit id> ...
 */
import * as E from '../engine.mjs';
import { UNITS, unitPlans } from './audit-household.mjs';

const ids = process.argv.slice(2);
const rowOf = id => {
  const u = UNITS.find(x => x.id === id);
  if (!u) return `${id}: not one of the lead test's units`;
  const { hp } = unitPlans(u), ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(hp)));
  const own = { self: ctx.owners.find(o => o.key === 'self'), part: ctx.owners.find(o => o.key === 'part') }, T = ctx.totalYears;
  const ageOf = (k, t) => (k === 'self' ? ctx.ageSelf0 : ctx.agePart0) + t, working = (k, t) => ageOf(k, t) < own[k].retireAge;
  let tR = 0; while (tR <= T && working('self', tR) && working('part', tR)) tR++;
  const young = ctx.ageSelf0 <= ctx.agePart0 ? 'self' : 'part';
  let tS = 0; while (tS <= T && ageOf(young, tS) < ctx.spa) tS++;
  const years = T + 1, win = Math.max(0, Math.min(tS, years) - tR), f = 1 + 2 * win / years;
  return `${id.padEnd(12)} the plan's years ${years} (0 to ${T}); the first retirement in plan year ${tR}; the younger (${young === 'self' ? 'the first person' : 'the partner'}) at the state pension age (${ctx.spa}) in plan year ${tS}; the window ${win} of ${years} years; the table ${f.toFixed(2)} times a single's`;
};
console.log('THE AXIS\'S COST IN TABLE SIZE (EXPLORATORY, for AXIS.md; nothing built): the smaller pension\'s share on three points from the first retirement to the younger person\'s state pension age (ANSWERS.md section 3)');
console.log('  the units named:');
for (const id of ids) console.log(`    ${rowOf(id)}`);
console.log('  the check, ANSWERS.md section 3\'s units ("3 of 28 plan years on S023, 15 of 40 on S149, 19 of 61 on the younger couples and 21 of 46 on S377"):');
for (const id of ['S023-90', 'S149', 'S327F', 'S377-90']) console.log(`    ${rowOf(id)}`);
