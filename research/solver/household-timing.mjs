/*
 * THE HOUSEHOLD PLAN'S YEARS OF A MOVED INCOME, THE PATTERN SEARCH (research/tests/household-pricing.test.mjs check 4; found
 * by that test's class on 23 Nov, building the form 'pensionsPAown' of research/solver/PRICING-FIX.md). The engine counts an
 * income from its owner's retirement at the earliest (research/engine.mjs buildContext, incomeFloor); the household plan
 * (src/solver/household.js householdPlanFor) moved each income onto the household person with its own ages, which the
 * household person's floor, its first retirement, counted from earlier where the other person retires first. The fix floors
 * each moved income at its owner's retirement, as the engine does; its plant 'incfloor' is the move before it.
 * This reads, for every couple run on the household route and the library's couples, each as handed over and on its mirror
 * (the app hands a couple elder first), the household plan as the app builds it ('pensionsPA', the couples' default) on the
 * code before the fix (the plant) and on the fix: in each plan year its fixed income less the later retiree's take-home
 * against the engine's two people's fixed incomes (each state pension and other income, on the year's fraction), and counts
 * the plans with a year apart. No path is run and no outcome is read.
 *   node research/solver/household-timing.mjs > research/solver/results-household-timing.txt
 */
import * as E from '../engine.mjs';
import { householdPlanFor, HOUSE } from '../../src/solver/household.js';
import { householdPlan } from '../../src/solverCouple.js';
import { otherOrder } from '../../src/coupleOrder.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readOpenPanel } from './couples-open-panel.mjs';
import { readHspPanel } from './household-hsp-panel.mjs';
import { readShapesPanel } from './shapes-panel.mjs';
import { readSharePanel } from './share-rules-panel.mjs';
import { readPanel } from './couple-panel.mjs';
import { codeId } from './code-id.mjs';

const ctxOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p)));
const allOf = (ctx, key, t) => {
  const age = (key === 'self' ? ctx.ageSelf0 : ctx.agePart0) + t, o = ctx.owners.find(x => x.key === key), f = t === 0 ? ctx.yf : 1;
  let s = age >= ctx.spa ? o.statePension : 0;
  for (const i of ctx.otherIncomes) if (i.owner === key && age >= i.startAge && age <= i.endAge) s += i.amount;
  return s * f;
};
/* the plan years in which the household plan's fixed income, less the take-home, is not the engine's (null where refused) */
function yearsApart(plan) {
  let hp, now;
  try { hp = householdPlan(E, plan); now = householdPlanFor(E, hp, { scale: 'pensionsPA' }); } catch (e) { if (/^householdPlanFor: /.test(e.message)) return null; throw e; }
  const cctx = ctxOf(hp), nctx = ctxOf(now), ageA = cctx.ageSelf0, apart = [];
  const takeHome = t => now.otherIncomes.filter(i => /^inc_house_takehome_/.test(i.id) && Number(i.startAge) === ageA + t).reduce((s, i) => s + Number(i.amount), 0) * (t === 0 ? nctx.yf : 1);
  for (let t = 0; t <= cctx.totalYears; t++) {
    const eng = allOf(cctx, 'self', t) + allOf(cctx, 'part', t), hh = allOf(nctx, 'self', t) - takeHome(t);
    if (Math.abs(eng - hh) > 0.005) apart.push({ t, eng, hh });
  }
  return apart;
}
const SETS = [
  ['the registered couples panel (D141; couples-open-registered-panel.json)', () => readOpenPanel(new URL('./couples-open-registered-panel.json', import.meta.url).pathname).map(u => [u.id, u.plan])],
  ['the dress rehearsal\'s panel (D139; couples-open-panel.json; the reviewer at the pricing read, MINOR 3)', () => readOpenPanel(new URL('./couples-open-panel.json', import.meta.url).pathname).map(u => [u.id, u.plan])],
  ['step 8\'s panel (household-hsp-panel.json)', () => readHspPanel().map(u => [u.id, u.plan])],
  ['step 5\'s shapes (shapes-panel.json)', () => readShapesPanel().map(u => [u.id, u.plan])],
  ['the share rules\' panel, the lead test\'s units among them (share-rules-panel.json)', () => readSharePanel().map(u => [u.id, u.plan])],
  ['the couples\' re-run panel (couples-panel-d4b.json)', () => readPanel().map(u => [u.id, u.plan])],
  ['the library\'s couples', () => buildScenarios().filter(s => s.plan.demographics.planningMode === 'couple').map(s => [s.id, s.plan])]
];
const cid = codeId();
console.log(`THE HOUSEHOLD PLAN'S YEARS OF A MOVED INCOME (household-pricing.test.mjs check 4's pattern search; code ${cid ? cid.hash : 'unknown'}). No path run, no outcome read.`);
console.log('Each couple as handed over and on its mirror; the household plan as the app builds it (\'pensionsPA\'); a plan the household plan refuses for its shape is not counted.\n');
let total = 0, hitBefore = 0, hitNow = 0;
for (const [name, unitsOf] of SETS) {
  const units = unitsOf();
  let built = 0, withIncome = 0, before = 0, now = 0; const named = [];
  for (const [id, plan] of units) for (const [order, p] of [['as handed over', plan], ['its mirror', otherOrder(E, plan)]]) {
    HOUSE.plant = 'incfloor'; const b = yearsApart(p); HOUSE.plant = ''; const a = yearsApart(p);
    if (a === null) continue;
    built++; if ((p.otherIncomes || []).length) withIncome++;
    if (b && b.length) { before++; if (named.length < 6) named.push(`${id} (${order}): ${b.length} years, the first plan year ${b[0].t} (the engine ${Math.round(b[0].eng)}, the household plan ${Math.round(b[0].hh)})`); }
    if (a.length) now++;
  }
  total += built; hitBefore += before; hitNow += now;
  console.log(`${name}: ${units.length} couples, ${built} household plans built (both orders), ${withIncome} with other incomes; a year apart before the fix ${before}, on the fix ${now}`);
  for (const s of named) console.log(`  ${s}`);
}
console.log(`\nIN ALL: ${total} household plans; a year apart before the fix ${hitBefore}, on the fix ${hitNow}: ${hitBefore === 0 ? 'THE FIX MOVES NONE OF THEM' : 'THE FIX MOVES THE PLANS NAMED'}${hitNow ? '; SOME STILL APART' : ''}`);
