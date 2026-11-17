/*
 * THE TWIN IDENTITY, TRACED (the review, 17 Nov; EXPLORATORY, deciding nothing; seed 99002; no solve). A couple made of the
 * first person twice (the same age, pay, pots, state pension and incomes, a one-off deposit of theirs landing half with
 * each) is the one couple design A's merge should state exactly: under the app's own rules, with their even split, the
 * household plan (research/solver/household.mjs householdPlanFor) and the couple should pay the same tax and hold the same
 * money in every year of every path. For each unit named: the first plan year in which the two part by more than a pound
 * in any wrapper, which of the year's figures part there, and over every path and year the tax each pays by kind.
 *   node research/reviews/2026-11-17/scripts/twin-trace.mjs <unit id> ... [--paths 100]
 */
import * as E from '../../../engine.mjs';
import { householdPlanFor } from '../../../solver/household.mjs';
import { readPanel, appPlan } from '../../../solver/couple-panel.mjs';
import { readSharePanel } from '../../../solver/share-rules-panel.mjs';
import { PANEL_FILE } from '../../../solver/audit-couples.mjs';
import { armA } from '../../../solver/select-phase4.mjs';

const args = process.argv.slice(2), at = args.indexOf('--paths'), N = at >= 0 ? Number(args[at + 1]) : 100;
const ids = args.filter((x, i) => !x.startsWith('--') && !(at >= 0 && i === at + 1));
const P0 = readPanel(PANEL_FILE), S0 = readSharePanel();
const gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`;
const AGG = ['targetSpend', 'netGuaranteed', 'netDrawdown', 'drawdownPensions', 'harvested', 'taxPaid', 'cgtPaid', 'savingsTax', 'dividendTax', 'realisedGains', 'sweptToGia', 'sweptFromGia', 'sweptToIsa'];
console.log(`THE TWIN IDENTITY, TRACED (the review, 17 Nov; EXPLORATORY, deciding nothing): the first person twice, under the app's own rules, the couple against design A's household plan; ${N} paths of seed 99002`);
for (const id of ids) {
  const base = JSON.parse(JSON.stringify((P0.find(x => x.id === id) || S0.find(x => x.id === id)).plan)), d = base.demographics;
  for (const k of ['currentAge', 'retireAge', 'salary', 'salaryGrowth', 'employment', 'cgtGainsUsed', 'cfBroughtForward', 'mpaaAge', 'statePension']) d[`${k}Part`] = d[`${k}Self`];
  const mine = base.accounts.filter(a => a.owner === 'Myself');
  base.accounts = [...mine, ...mine.map(a => ({ ...a, id: String(a.id).replace(/_self$/, '_part'), owner: 'Partner' }))];
  const inc = (base.otherIncomes || []).filter(i => i.owner === 'Myself');
  base.otherIncomes = [...inc, ...inc.map(i => ({ ...i, id: `${i.id}_p`, owner: 'Partner' }))];
  const dep = (base.oneOffContributions || []).filter(c => (c.owner || 'Myself') === 'Myself');
  base.oneOffContributions = dep.flatMap(c => [{ ...c, amount: Number(c.amount) / 2 }, { ...c, id: `${c.id}_p`, owner: 'Partner', amount: Number(c.amount) / 2 }]);
  const a = armA(appPlan(base), { tournament: false }), cpl = E.resolveMpaa(a.planState);
  const cC = E.buildContext(cpl), cH = E.buildContext(E.resolveMpaa(E.normalizePlan(householdPlanFor(E, cpl)))), T = cC.totalYears;
  const cats = (ctx, st) => { const o = { pen: 0, isa: 0, other: 0, cash: 0 }; for (const x of ctx.accounts) o[x.cat] = (o[x.cat] || 0) + (st.pots[x.id] || 0); return o; };
  const firstAt = {}, firstOn = {}, tot = { C: { income: 0, cgt: 0 }, H: { income: 0, cgt: 0 } };
  let apart = 0, endGap = 0;
  for (const zs of E.pathsForSeed(99002, N, T)) {
    const sC = E.freshState(cC), sH = E.freshState(cH), zPath = zs.length > T + 1 ? zs[T + 1] : 0;
    let seen = false, rC, rH;
    for (let t = 0; t <= T; t++) {
      rC = E.stepYear(cC, sC, t, { z: zs[t], zPath }); rH = E.stepYear(cH, sH, t, { z: zs[t], zPath });
      tot.C.income += rC.taxPaid; tot.C.cgt += rC.cgtPaid || 0; tot.H.income += rH.taxPaid; tot.H.cgt += rH.cgtPaid || 0;
      if (seen) continue;
      const a1 = cats(cC, sC), a2 = cats(cH, sH);
      if (Object.keys(a1).some(k => Math.abs(a1[k] - a2[k]) > 1)) {
        seen = true; apart++; firstAt[t] = (firstAt[t] || 0) + 1;
        for (const k of AGG) if (typeof rC[k] === 'number' && Math.abs(rC[k] - rH[k]) > 1) firstOn[k] = (firstOn[k] || 0) + 1;
      }
    }
    endGap = Math.max(endGap, Math.abs(rC.totalCombined - rH.totalCombined));
  }
  console.log(`${id} as a twin (arm A: ${a.label}; ${T} years): the basic-rate band for capital gains, a person's in the couple ${gbp(cC.P.cgtBandWidth)} (two people's ${gbp(2 * cC.P.cgtBandWidth)}), the household plan's ${gbp(cH.P.cgtBandWidth)}`);
  console.log(`  the wrappers part by more than a pound on ${apart} of ${N} paths${apart ? `; the first year apart: ${Object.entries(firstAt).map(([t, c]) => `plan year ${t} on ${c}`).join(', ')}; the year's figures apart there: ${Object.entries(firstOn).sort((x, y) => y[1] - x[1]).map(([k, c]) => `${k} on ${c}`).join(', ') || 'none of those listed'}` : ''}; the largest gap in end wealth on a path ${gbp(endGap)}`);
  console.log(`  a path's tax over the plan, the couple and the household plan: income tax and the tax on interest and dividends ${gbp(tot.C.income / N)} and ${gbp(tot.H.income / N)}; capital gains tax ${gbp(tot.C.cgt / N)} and ${gbp(tot.H.cgt / N)}`);
}
