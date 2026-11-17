/*
 * DESIGN A'S BIASES, UNIT BY UNIT (the review, 17 Nov; EXPLORATORY; plan arithmetic only, no solve and no path). For each of
 * the lead test's 28 units, what the household plan (research/solver/household.mjs householdPlanFor) states differently from
 * the couple:
 *   locked     the plan years one pension is open and the other locked while the household spends (the audit's biasesOf);
 *   pen share  the first person's share of the two pensions (the audit's);
 *   income     the income tax the household plan leaves out on the two people's guaranteed incomes alone (the state pensions
 *              and other taxable incomes, each taxed on its owner's own bands in the couple and on the doubled bands in the
 *              household plan): a year, once every such income is in payment, and over the plan as a share of the plan's
 *              spending; it is there whatever the pensions hold, and lasts the plan;
 *   windfall   a one-off deposit owned by one person (it lands in one person's wrappers; the household plan has two sets of
 *              allowances to shelter it with);
 *   cgt band   the basic-rate band for capital gains the household plan is given, against the two people's.
 *   node research/reviews/2026-11-17/scripts/bias-table.mjs
 */
import * as E from '../../../engine.mjs';
import * as M from '../../../../src/solver/model.js';
import { householdPlanFor } from '../../../solver/household.mjs';
import { readPanel, appPlan } from '../../../solver/couple-panel.mjs';
import { readSharePanel } from '../../../solver/share-rules-panel.mjs';
import { armA } from '../../../solver/select-phase4.mjs';
import { PANEL_FILE, solverPlan } from '../../../solver/audit-couples.mjs';
import { UNITS, biasesOf } from '../../../solver/audit-household.mjs';

const P0 = readPanel(PANEL_FILE), S0 = readSharePanel();
const gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`;
console.log('DESIGN A\'S BIASES, UNIT BY UNIT (the review, 17 Nov; EXPLORATORY; plan arithmetic only)');
console.log('unit         group    locked  pen share  nearest exact (the amended rule)  income tax left out: a year, over the plan (% of spending)  one person\'s windfall  cgt basic band (household / two people)');
let nNear = 0, nNearBiased = 0;
for (const u of UNITS) {
  const plan = (u.panel === 'd4b' ? P0.find(x => x.id === u.id) : S0.find(x => x.id === u.id)).plan;
  const a = armA(appPlan(plan), { tournament: false });
  const hp = solverPlan('CANDC', plan, { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy }, 0.02);
  const m = M.prepare(E, hp), c = m.ctx, b = biasesOf(m), T = c.totalYears;
  const cH = E.buildContext(E.resolveMpaa(E.normalizePlan(householdPlanFor(E, hp))));
  const age = (k, t) => (k === 'self' ? c.ageSelf0 : c.agePart0) + t;
  let over = 0, last = 0, spend = 0;
  for (let t = 0; t <= T; t++) {
    const g = { self: 0, part: 0 };
    for (const o of c.owners) if (age(o.key, t) >= c.spa) g[o.key] += o.statePension || 0;
    for (const i of c.otherIncomes || []) { const ag = age(i.owner, t); if (!i.taxFree && ag >= i.startAge && ag <= i.endAge) g[i.owner] += i.amount; }
    const couple = E.incomeTax(g.self, c.P) + E.incomeTax(g.part, c.P), house = E.incomeTax(g.self + g.part, cH.P);
    over += couple - house; last = couple - house;
    spend += E.spendTargetAtAge(c, age('self', t)) || 0;
  }
  const wind = (plan.oneOffContributions || []).filter(x => Number(x.amount) > 0).map(x => `${gbp(x.amount)} (${x.owner})`).join(', ') || 'none';
  const near = b.lockedYears <= 1 && b.penShareSelf >= 0.25 && b.penShareSelf <= 0.75;
  if (near) { nNear++; if (last > 100) nNearBiased++; }
  console.log(`${u.id.padEnd(12)} ${u.group.padEnd(8)} ${String(b.lockedYears).padStart(4)}    ${b.penShareSelf.toFixed(2)}       ${(near ? 'yes' : 'no').padEnd(32)} ${gbp(last).padStart(8)} a year, ${gbp(over).padStart(9)} (${(100 * over / spend).toFixed(2)}%)`.padEnd(128) + ` ${wind.padEnd(22)} ${gbp(cH.P.cgtBandWidth)} / ${gbp(2 * c.P.cgtBandWidth)}`);
}
console.log(`\nOf the ${nNear} units the amended rule reads as nearest exact, ${nNearBiased} leave out more than £100 a year of income tax on guaranteed incomes alone.`);
