/*
 * WHY TWINS PART ONCE THE BAND IS RIGHT, AND S149'S TWIN (PRESCRIPTIVE-PLAN.md step 3's two traces; EXPLORATORY, deciding
 * nothing; no solve; the review's seed 99002, the twin-trace's). The twin is household.test.mjs section 8's (the first person
 * twice, arm A's policy). In the engine's year of a couple (App.jsx stepYear, read in research/engine.mjs) every step but a
 * few splits a household amount evenly or runs each person on their own pots in turn; the steps that take a household amount
 * person by person, the first person first, are the candidates. Printed, for each twin:
 *   1. the plan years of its one-off costs; the share of path-years in which the two twins hold or draw unequal amounts (the
 *      review's measure: taxable income or total wealth apart by more than a pound); the first plan year the two twins'
 *      total wealth parts on each path;
 *   2. the same with the plan's one-off costs taken out of the plan arm A's policy was picked on, the policy held, to show
 *      whether the cost is the step that parts them;
 *   3. on S149, the first path on which the couple and the household plan part in the year of its one-off cost (plan year
 *      3): the year before and that year, the year's figures (the couple's, the household plan's), and each twin's pots;
 *      and over every path the plan year in which they first part.
 *   node research/solver/twin-why.mjs [paths 100]
 */
import * as E from '../engine.mjs';
import { householdPlanFor, householdContext } from './household.mjs';
import { readPanel, appPlan } from './couple-panel.mjs';
import { readSharePanel } from './share-rules-panel.mjs';
import { PANEL_FILE } from './audit-couples.mjs';
import { armA } from './select-phase4.mjs';

const N = Number(process.argv[2]) || 100, SEED = 99002;
const P0 = readPanel(PANEL_FILE), S0 = readSharePanel();
const gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`;
export function twinOf(id) {
  const base = JSON.parse(JSON.stringify((P0.find(x => x.id === id) || S0.find(x => x.id === id)).plan)), d = base.demographics;
  for (const k of ['currentAge', 'retireAge', 'salary', 'salaryGrowth', 'employment', 'cgtGainsUsed', 'cfBroughtForward', 'mpaaAge', 'statePension']) d[`${k}Part`] = d[`${k}Self`];
  const mine = base.accounts.filter(a => a.owner === 'Myself');
  base.accounts = [...mine, ...mine.map(a => ({ ...a, id: String(a.id).replace(/_self$/, '_part'), owner: 'Partner' }))];
  const inc = (base.otherIncomes || []).filter(i => i.owner === 'Myself');
  base.otherIncomes = [...inc, ...inc.map(i => ({ ...i, id: `${i.id}_p`, owner: 'Partner' }))];
  const dep = (base.oneOffContributions || []).filter(c => (c.owner || 'Myself') === 'Myself');
  base.oneOffContributions = dep.flatMap(c => [{ ...c, amount: Number(c.amount) / 2 }, { ...c, id: `${c.id}_p`, owner: 'Partner', amount: Number(c.amount) / 2 }]);
  return base;
}
const contexts = (base, noCost = false) => { const a = armA(appPlan(base), { tournament: false }), cpl = E.resolveMpaa(noCost ? { ...a.planState, oneOffCosts: [] } : a.planState); return { a, cC: E.buildContext(cpl), cH: householdContext(E, E.resolveMpaa(E.normalizePlan(householdPlanFor(E, cpl)))) }; };
function apartness(cC) {
  const T = cC.totalYears;
  let uneven = 0, years = 0; const first = {};
  for (const zs of E.pathsForSeed(SEED, N, T)) {
    const s = E.freshState(cC), zPath = zs.length > T + 1 ? zs[T + 1] : 0;
    let f = -1;
    for (let t = 0; t <= T; t++) {
      const r = E.stepYear(cC, s, t, { z: zs[t], zPath });
      years++;
      if (Math.abs((r.otherTaxableSelf + r.taxablePensionSelf) - (r.otherTaxablePart + r.taxablePensionPart)) > 1 || Math.abs(r.totalSelf - r.totalPart) > 1) uneven++;
      if (f < 0 && Math.abs(r.totalSelf - r.totalPart) > 1) f = t;
    }
    first[f] = (first[f] || 0) + 1;
  }
  return { share: uneven / years, first };
}
const showFirst = f => Object.entries(f).sort((x, y) => Number(x[0]) - Number(y[0])).map(([t, c]) => (t === '-1' ? `never on ${c}` : `plan year ${t} on ${c}`)).join(', ');
console.log(`WHY TWINS PART ONCE THE BAND IS RIGHT (EXPLORATORY, deciding nothing): the twin of each unit, under arm A's policy, ${N} paths of seed ${SEED}`);
for (const id of ['S205', 'S061-dbpart', 'S327F', 'S227-90', 'S023-db', 'S149']) {
  const base = twinOf(id), { a, cC } = contexts(base), costs = (base.oneOffCosts || []).map(c => `${gbp(c.amount)} in plan year ${Number(c.year) - cC.baseYear}`);
  const w = apartness(cC);
  const wn = apartness(contexts(base, true).cC);
  console.log(`${id} (arm A: ${a.label}; one-off costs: ${costs.join(', ') || 'none'})`);
  console.log(`  the twins apart in ${(100 * w.share).toFixed(1)}% of path-years; their wealth first parts: ${showFirst(w.first)}`);
  console.log(`  with the one-off costs taken out: apart in ${(100 * wn.share).toFixed(1)}% of path-years; their wealth first parts: ${showFirst(wn.first)}`);
}
// 3. S149: the couple against the household plan, on the first path they part, around the year they part
{
  const base = twinOf('S149'), { cC, cH } = contexts(base), T = cC.totalYears;
  const F = ['annualLivingTarget', 'spendLevel', 'targetSpend', 'netGuaranteed', 'netDrawdown', 'drawdownPensions', 'taxPaid', 'dividendTax', 'savingsTax', 'cgtPaid', 'realisedGains', 'oneOffCost', 'unmetCost', 'harvested', 'sweptToGia', 'sweptFromGia', 'sweptToIsa'];
  const cats = (ctx, st) => { const o = { pen: 0, isa: 0, other: 0, cash: 0 }; for (const x of ctx.accounts) o[x.cat] = (o[x.cat] || 0) + (st.pots[x.id] || 0); return o; };
  const per = (ctx, st, who) => { const o = {}; for (const x of ctx.accounts) if (x.owner === who) o[x.cat] = (o[x.cat] || 0) + (st.pots[x.id] || 0); return Object.entries(o).map(([c, v]) => `${c} ${gbp(v)}`).join(' '); };
  let k = -1, shown = false; const firstAt = {};
  for (const zs of E.pathsForSeed(SEED, N, T)) {
    k++;
    const sC = E.freshState(cC), sH = E.freshState(cH), zPath = zs.length > T + 1 ? zs[T + 1] : 0, rows = [];
    let at = -1;
    for (let t = 0; t <= T && at < 0; t++) {
      const rC = E.stepYear(cC, sC, t, { z: zs[t], zPath }), rH = E.stepYear(cH, sH, t, { z: zs[t], zPath });
      rows.push({ t, rC, rH, wC: cats(cC, sC), wH: cats(cH, sH), self: per(cC, sC, 'self'), part: per(cC, sC, 'part') });
      if (Object.keys(rows[t].wC).some(c => Math.abs(rows[t].wC[c] - rows[t].wH[c]) > 1)) at = t;
    }
    firstAt[at] = (firstAt[at] || 0) + 1;
    if (at !== 3 || shown) continue;
    shown = true;
    console.log(`S149's twin, path ${k} (the first on which the couple and the household plan part in the cost's year), plan years ${Math.max(0, at - 1)} to ${at}, the couple's figure then the household plan's:`);
    for (const r of rows.slice(Math.max(0, at - 1))) {
      console.log(`  plan year ${r.t}: ${F.filter(f => typeof r.rC[f] === 'number' || typeof r.rH[f] === 'number').map(f => `${f} ${gbp(r.rC[f] || 0)} / ${gbp(r.rH[f] || 0)}${Math.abs((r.rC[f] || 0) - (r.rH[f] || 0)) > 1 ? ' APART' : ''}`).join('; ')}`);
      console.log(`    the wrappers at the year's end, the couple / the household plan: ${Object.keys(r.wC).map(c => `${c} ${gbp(r.wC[c])} / ${gbp(r.wH[c])}`).join('; ')}; each twin: first ${r.self} | second ${r.part}`);
    }
  }
  console.log(`  S149's twin, the plan year in which the couple and the household plan first part, over ${N} paths: ${showFirst(firstAt)}`);
}
