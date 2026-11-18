/*
 * THE TWIN, AS household.test.mjs SECTION 8 BUILDS AND RUNS IT, ON ANY OF THE REVIEW'S SEEDS (PRESCRIPTIVE-PLAN.md step 3;
 * EXPLORATORY, deciding nothing; no solve). The couple made of the first person twice, under arm A's policy, the household
 * plan through householdContext (its capital gains band two people's) against the couple, year by year: each kind of tax
 * over the plan, the paths on which a wrapper first parts by more than a pound, that year and which of the year's figures
 * part there (the review's scripts/twin-trace.mjs's measures), and on each such path the wrappers' gaps that year.
 * On seed 99002 it is the review's --mend run (results-twin-trace-mended.txt), so it checks this code against that.
 * With --nocost the twin's one-off costs are taken out of the plan arm A's policy was picked on, the policy held (twin-why.mjs:
 * the cost, taken person by person, the first person first, is the step that parts the twins).
 *   node research/solver/twin-trace-step3.mjs <seed> [unit id ...] [--nocost]
 */
import * as E from '../engine.mjs';
import { householdPlanFor, householdContext } from './household.mjs';
import { readPanel, appPlan } from './couple-panel.mjs';
import { readSharePanel } from './share-rules-panel.mjs';
import { PANEL_FILE } from './audit-couples.mjs';
import { armA } from './select-phase4.mjs';

const argv = process.argv.slice(2), NOCOST = argv.includes('--nocost'), [seedArg, ...rest] = argv.filter(x => x !== '--nocost'), seed = Number(seedArg), N = 100;
if (![99001, 99002, 99003, 99004, 99005].includes(seed)) { console.error('twin-trace-step3: one of the review\'s seeds'); process.exit(2); }
const ids = rest.length ? rest : ['S205', 'S061-dbpart', 'S327F', 'S227-90', 'S023-db', 'S149'];
const P0 = readPanel(PANEL_FILE), S0 = readSharePanel();
const gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`;
const AGG = ['targetSpend', 'netGuaranteed', 'netDrawdown', 'drawdownPensions', 'harvested', 'taxPaid', 'cgtPaid', 'savingsTax', 'dividendTax', 'realisedGains', 'sweptToGia', 'sweptFromGia', 'sweptToIsa'];
console.log(`THE TWIN (EXPLORATORY): the first person twice, under arm A's policy, the household plan (its capital gains band two people's) against the couple; ${N} paths of seed ${seed}${NOCOST ? '; the one-off costs taken out' : ''}`);
for (const id of ids) {
  const base = JSON.parse(JSON.stringify((P0.find(x => x.id === id) || S0.find(x => x.id === id)).plan)), d = base.demographics;
  for (const k of ['currentAge', 'retireAge', 'salary', 'salaryGrowth', 'employment', 'cgtGainsUsed', 'cfBroughtForward', 'mpaaAge', 'statePension']) d[`${k}Part`] = d[`${k}Self`];
  const mine = base.accounts.filter(a => a.owner === 'Myself');
  base.accounts = [...mine, ...mine.map(a => ({ ...a, id: String(a.id).replace(/_self$/, '_part'), owner: 'Partner' }))];
  const inc = (base.otherIncomes || []).filter(i => i.owner === 'Myself');
  base.otherIncomes = [...inc, ...inc.map(i => ({ ...i, id: `${i.id}_p`, owner: 'Partner' }))];
  const dep = (base.oneOffContributions || []).filter(c => (c.owner || 'Myself') === 'Myself');
  base.oneOffContributions = dep.flatMap(c => [{ ...c, amount: Number(c.amount) / 2 }, { ...c, id: `${c.id}_p`, owner: 'Partner', amount: Number(c.amount) / 2 }]);
  const a = armA(appPlan(base), { tournament: false }), cpl = E.resolveMpaa(NOCOST ? { ...a.planState, oneOffCosts: [] } : a.planState);
  const cC = E.buildContext(cpl), cH = householdContext(E, E.resolveMpaa(E.normalizePlan(householdPlanFor(E, cpl)))), T = cC.totalYears;
  const cats = (ctx, st) => { const o = { pen: 0, isa: 0, other: 0, cash: 0 }; for (const x of ctx.accounts) o[x.cat] = (o[x.cat] || 0) + (st.pots[x.id] || 0); return o; };
  const tot = { C: { income: 0, cgt: 0 }, H: { income: 0, cgt: 0 } }, firstAt = {}, firstOn = {}, where = [];
  let apart = 0, endGap = 0, k = -1;
  for (const zs of E.pathsForSeed(seed, N, T)) {
    k++;
    const sC = E.freshState(cC), sH = E.freshState(cH), zPath = zs.length > T + 1 ? zs[T + 1] : 0;
    let seen = false, rC, rH;
    for (let t = 0; t <= T; t++) {
      rC = E.stepYear(cC, sC, t, { z: zs[t], zPath }); rH = E.stepYear(cH, sH, t, { z: zs[t], zPath });
      tot.C.income += rC.taxPaid; tot.C.cgt += rC.cgtPaid || 0; tot.H.income += rH.taxPaid; tot.H.cgt += rH.cgtPaid || 0;
      if (seen) continue;
      const a1 = cats(cC, sC), a2 = cats(cH, sH);
      if (Object.keys(a1).some(c => Math.abs(a1[c] - a2[c]) > 1)) {
        seen = true; apart++; firstAt[t] = (firstAt[t] || 0) + 1;
        const on = AGG.filter(f => typeof rC[f] === 'number' && Math.abs(rC[f] - rH[f]) > 1);
        for (const f of on) firstOn[f] = (firstOn[f] || 0) + 1;
        if (where.length < 6) where.push(`path ${k} plan year ${t}: wrappers ${Object.keys(a1).filter(c => Math.abs(a1[c] - a2[c]) > 1).map(c => `${c} ${gbp(a2[c] - a1[c])}`).join(', ')}; the year's figures ${on.map(f => `${f} ${gbp(rH[f])} against ${gbp(rC[f])}`).join(', ') || 'none listed apart'}`);
      }
    }
    endGap = Math.max(endGap, Math.abs(rC.totalCombined - rH.totalCombined));
  }
  console.log(`${id} as a twin (arm A: ${a.label}; ${T} years): the capital gains band, the household plan's ${gbp(cH.P.cgtBandWidth)}, a person's ${gbp(cC.P.cgtBandWidth)}`);
  console.log(`  a path's tax over the plan, the couple and the household plan: income tax and the tax on interest and dividends ${gbp(tot.C.income / N)} and ${gbp(tot.H.income / N)}; capital gains tax ${gbp(tot.C.cgt / N)} and ${gbp(tot.H.cgt / N)}`);
  console.log(`  the wrappers part by more than a pound on ${apart} of ${N} paths${apart ? `; the first year apart: ${Object.entries(firstAt).map(([t, c]) => `plan year ${t} on ${c}`).join(', ')}; the year's figures apart there: ${Object.entries(firstOn).sort((x, y) => y[1] - x[1]).map(([f, c]) => `${f} on ${c}`).join(', ') || 'none of those listed'}` : ''}; the largest gap in end wealth on a path ${gbp(endGap)}`);
  for (const w of where) console.log(`    ${w}`);
}
