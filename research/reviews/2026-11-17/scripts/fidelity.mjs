/*
 * THE HOUSEHOLD PLAN'S FIDELITY, TAKEN APART (the review, 17 Nov; EXPLORATORY, deciding nothing; seed 99002). No solve: every
 * run is the engine under the app's own rules (arm A's policy), as research/tests/household.test.mjs check 3 runs it.
 *   1. THE TWIN IDENTITY. A couple made of the first person twice (the same age, pay, pots, state pension and incomes) is
 *      the one case in which design A's merge should be exact under an even split: the household plan against the couple,
 *      path by path, to the pound. Any difference is the construction's, not the rule's.
 *   2. ONE DEPARTURE AT A TIME from the twin, on the same paths: a one-off deposit (an inheritance) left whole with the first
 *      person; the partner three years younger (retiring at the same age, so three years later); the pots held 90/10 (the
 *      same total by wrapper); the partner's state pension at 60%.
 *   3. THE TWO GAPS of check 3 (S227-90, S061-dbpart) on more paths, with what the end wealth's gap is made of (lifetime tax,
 *      spending delivered) and each of a few allowances left single in turn.
 *   node research/reviews/2026-11-17/scripts/fidelity.mjs [paths 400]
 */
import * as E from '../../../engine.mjs';
import { householdPlanFor } from '../../../solver/household.mjs';
import { readPanel, appPlan } from '../../../solver/couple-panel.mjs';
import { readSharePanel } from '../../../solver/share-rules-panel.mjs';
import { PANEL_FILE } from '../../../solver/audit-couples.mjs';
import { armA } from '../../../solver/select-phase4.mjs';
import { runPath } from '../../../solver/audit-phase4.mjs';

const N = Number(process.argv[2]) || 400, SEED = 99002;
const P = readPanel(PANEL_FILE), S = readSharePanel();
const planOf = id => JSON.parse(JSON.stringify((P.find(x => x.id === id) || {}).plan || (S.find(x => x.id === id) || {}).plan));
const med = xs => { const s = [...xs].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const gbp = x => `${x < 0 ? '-' : ''}£${Math.round(Math.abs(x)).toLocaleString('en-GB')}`;

/* the couple under the app's rules and the household plan under the same rules, on the same paths; `tweak` changes the
   household plan after it is built (an allowance left single) */
function compare(plan, { tweak = null, n = N } = {}) {
  const a = armA(appPlan(plan), { tournament: false }), cpl = E.resolveMpaa(a.planState);
  let hp = householdPlanFor(E, cpl);
  if (tweak) hp = tweak(hp, cpl);
  const cC = E.buildContext(cpl), cH = E.buildContext(E.resolveMpaa(E.normalizePlan(hp))), T = cC.totalYears;
  if (cH.totalYears !== T) throw new Error('another horizon');
  const C = [], H = [];
  for (const zs of E.pathsForSeed(SEED, n, T)) { C.push(runPath(cC, zs, false)); H.push(runPath(cH, zs, false)); }
  const surv = xs => 100 * xs.filter(r => r.survived).length / n;
  const d = k => H.map((h, i) => h[k] - C[i][k]);
  return {
    label: a.label, n, T, survC: surv(C), survH: surv(H), flips: H.filter((h, i) => h.survived !== C[i].survived).length,
    medC: med(C.map(r => r.wealth)), medH: med(H.map(r => r.wealth)), meanC: mean(C.map(r => r.wealth)), meanH: mean(H.map(r => r.wealth)),
    maxAbsWealth: Math.max(...d('wealth').map(Math.abs)), maxAbsTax: Math.max(...d('tax').map(Math.abs)), maxAbsDelivered: Math.max(...d('delivered').map(Math.abs)),
    dTax: mean(d('tax')), dDelivered: mean(d('delivered')), dWealth: mean(d('wealth')), taxC: mean(C.map(r => r.tax)), medRatio: med(H.map((h, i) => (C[i].wealth > 0 ? h.wealth / C[i].wealth : 1)))
  };
}
const line = (name, r) => `  ${name.padEnd(34)} survival ${r.survC.toFixed(1)}% -> ${r.survH.toFixed(1)}% (${r.flips} paths differ); median end wealth ${gbp(r.medC)} -> ${gbp(r.medH)} (${(100 * (r.medH / r.medC - 1)).toFixed(1)}%), by path ${(100 * (r.medRatio - 1)).toFixed(1)}%; mean lifetime tax ${gbp(r.taxC)} ${r.dTax >= 0 ? '+' : '-'} ${gbp(Math.abs(r.dTax))}; spending delivered ${r.dDelivered >= 0 ? '+' : '-'} ${gbp(Math.abs(r.dDelivered))}; the largest difference on a path: wealth ${gbp(r.maxAbsWealth)}, tax ${gbp(r.maxAbsTax)}`;

/* the first person twice */
function twin(plan, keepWindfall = false) {
  const p = JSON.parse(JSON.stringify(plan)), d = p.demographics;
  for (const k of ['currentAge', 'retireAge', 'salary', 'salaryGrowth', 'employment', 'cgtGainsUsed', 'cfBroughtForward', 'mpaaAge', 'statePension']) d[`${k}Part`] = d[`${k}Self`];
  const mine = p.accounts.filter(a => a.owner === 'Myself');
  p.accounts = [...mine, ...mine.map(a => ({ ...a, id: String(a.id).replace(/_self$/, '_part'), owner: 'Partner' }))];
  const inc = (p.otherIncomes || []).filter(i => i.owner === 'Myself');
  p.otherIncomes = [...inc, ...inc.map(i => ({ ...i, id: `${i.id}_p`, owner: 'Partner' }))];
  // a one-off deposit of the first person's (an inheritance) lands half with each, unless `keepWindfall` leaves it whole with the first
  const dep = (p.oneOffContributions || []).filter(c => (c.owner || 'Myself') === 'Myself');
  p.oneOffContributions = keepWindfall ? dep : dep.flatMap(c => [{ ...c, amount: Number(c.amount) / 2 }, { ...c, id: `${c.id}_p`, owner: 'Partner', amount: Number(c.amount) / 2 }]);
  return p;
}
const younger = (plan, by = 3) => { const p = JSON.parse(JSON.stringify(plan)); p.demographics.currentAgePart = Number(p.demographics.currentAgeSelf) - by; return p; };
const uneven = (plan, f = 0.9) => { const p = JSON.parse(JSON.stringify(plan)); for (const a of p.accounts) { const tot = 2 * Number(a.balance); a.balance = a.owner === 'Myself' ? tot * f : tot * (1 - f); a.contrib = a.owner === 'Myself' ? 2 * Number(a.contrib || 0) * f : 2 * Number(a.contrib || 0) * (1 - f); } return p; };
const lowSp = (plan, f = 0.6) => { const p = JSON.parse(JSON.stringify(plan)); p.demographics.statePensionPart = Math.round(Number(p.demographics.statePensionSelf) * f); return p; };

console.log(`THE HOUSEHOLD PLAN'S FIDELITY, TAKEN APART (the review, 17 Nov; EXPLORATORY, deciding nothing): the couple under the app's rules against design A's household plan under the same rules, ${N} paths of seed ${SEED}`);
console.log('\n1. THE TWIN IDENTITY (the first person twice: the merge should be exact) and 2. ONE DEPARTURE AT A TIME');
for (const id of ['S205', 'S061-dbpart', 'S227-90', 'S023-db', 'S327F']) {
  const base = planOf(id), t = twin(base);
  console.log(`${id}:`);
  const run = (name, plan) => { try { const r = compare(plan); console.log(line(name, r) + (name === 'the twin' ? ` [arm A: ${r.label}]` : '')); } catch (e) { console.log(`  ${name.padEnd(34)} refused or failed: ${e.message}`); } };
  run('the twin', t);
  if ((base.oneOffContributions || []).length) run('a windfall left with the first person', twin(base, true));
  run('the partner three years younger', younger(t));
  run('the pots held 90/10', uneven(t));
  run('the partner\'s state pension at 60%', lowSp(t));
  run('the unit as it is', base);
}

console.log('\n3. THE TWO GAPS, WITH AN ALLOWANCE LEFT SINGLE IN TURN');
const single = keys => (hp, cpl) => { const cfg = { ...E.DEFAULT_CONFIG, ...(cpl.config || {}) }, config = { ...hp.config }; for (const k of keys) config[k] = E.num(cfg[k], E.DEFAULT_CONFIG[k]); return { ...hp, config }; };
const TWEAKS = [
  ['as built', null],
  ['the ISA allowances single', single(['isaAnnualAllowance', 'cashIsaAllowance', 'cashIsaAllowanceUnder65'])],
  ['the tax-free cash cap single', single(['pclsMaxCap'])],
  ['CGT, savings and dividend single', single(['cgtAnnualExempt', 'savingsAllowanceBasic', 'savingsAllowanceHigher', 'startingRateSavingsBand', 'dividendAllowance'])],
  ['the income bands single', single(['personalAllowance', 'paTaperThreshold', 'basicBandLimit', 'higherBandLimit', 'scotStarterLimit', 'scotBasicLimit', 'scotIntermediateLimit', 'scotHigherLimit', 'scotAdvancedLimit'])]
];
for (const id of ['S227-90', 'S061-dbpart', 'S205', 'S149']) {
  console.log(`${id}:`);
  for (const [name, tweak] of TWEAKS) { try { console.log(line(name, compare(planOf(id), { tweak }))); } catch (e) { console.log(`  ${name.padEnd(34)} refused or failed: ${e.message}`); } }
}
