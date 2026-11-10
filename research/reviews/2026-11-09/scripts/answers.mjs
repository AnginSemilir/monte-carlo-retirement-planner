// The plan inputs behind ANSWERS-2026-11-10.md (the external review's answers to the agent's questions of 10 Nov).
// Inputs and the app's own rules on the expected path only: no solve, no Monte Carlo, no result of any run.
//   node answers.mjs            (the branch as it is; needs no patch)
import { readFileSync } from 'node:fs';
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const all = buildScenarios(), AUTO = 'Auto (policy decides)';
const planOf = id => E.normalizePlan(all.find(s => s.id === id).plan);
const yearOf = p => Number(String((p.config && p.config.valuationDate) || '2026').slice(0, 4));

console.log('1. The households the questions name: their pay, their ages and their one-off deposits');
for (const id of ['S210', 'S370', 'S224', 'S116']) {
  const p = planOf(id), d = p.demographics;
  console.log(`  ${id}: ${d.planningMode}, aged ${d.currentAgeSelf}, retires at ${d.retireAgeSelf}, salary ${d.salarySelf || 0}, pension access ${d.privatePensionAge || 57}, policy ${p.spending.decumulationPolicy}`);
  for (const x of p.oneOffContributions || []) console.log(`      deposit: ${x.amount} in ${x.year} (aged ${Number(d.currentAgeSelf) + Number(x.year) - yearOf(p)}), "${x.category}", staged to "${x.stagedTargetWrapper}"`);
  if (!(p.oneOffContributions || []).length) console.log('      no one-off deposit');
}

console.log('\n2. A working single under the app\'s rules, the expected path: is anything but interest and dividends taxed beside pay?');
for (const id of ['S224', 'S210']) {
  const p = planOf(id), d = p.demographics, rows = E.simulateDeterministic(E.buildContext(E.resolveMpaa(p)), 'expected');
  const work = rows.filter(r => r.ageSelf < Number(d.retireAgeSelf));
  const draw = work.reduce((t, r) => t + (r.taxablePensionSelf || 0), 0), gains = work.reduce((t, r) => t + (r.realisedGains || 0), 0), cgt = work.reduce((t, r) => t + (r.cgtPaid || 0), 0);
  console.log(`  ${id}: ${work.length} working years (aged ${work[0].ageSelf} to ${work[work.length - 1].ageSelf}): taxable pension drawn ${Math.round(draw)}, gains realised ${Math.round(gains)}, CGT ${Math.round(cgt)}; interest ${Math.round(work.reduce((t, r) => t + (r.savingsInterest || 0), 0))}, dividends ${Math.round(work.reduce((t, r) => t + (r.giaDividends || 0), 0))}`);
}

console.log('\n3. The library\'s Auto deposits (a deposit the policy routes: the default order is the pension first)');
{ let n = 0, auto = 0, old = 0, working = 0; const ages = {};
  for (const s of all) { const p = E.normalizePlan(s.plan), d = p.demographics;
    for (const x of p.oneOffContributions || []) { n++; if (x.category !== AUTO) continue; auto++;
      const part = x.owner === 'Partner', age = Number(part ? d.currentAgePart : d.currentAgeSelf) + Number(x.year) - yearOf(p), ret = Number(part ? d.retireAgePart : d.retireAgeSelf);
      ages[age] = (ages[age] || 0) + 1; if (age >= 75) old++; if (age < ret) working++; } }
  console.log(`  ${all.length} plans; ${n} one-off deposits, ${auto} of them Auto; the owner still working when it arrives: ${working}; aged 75 or over: ${old}`);
  console.log(`  the owner's age when it arrives: ${Object.keys(ages).sort((a, b) => a - b).map(a => `${a} (${ages[a]})`).join(', ')}`); }

console.log('\n4. The singles of phase4-orders.json\'s touched list by cash ISA money');
{ const touched = new Set(JSON.parse(readFileSync(R + '/research/solver/phase4-orders.json', 'utf8')).touched.ids), rows = [];
  for (const s of all) { if (!touched.has(s.id)) continue; const p = E.normalizePlan(s.plan), d = p.demographics; if (d.planningMode === 'couple') continue;
    const bal = id => p.accounts.filter(a => a.id === id).reduce((t, a) => t + (Number(a.balance) || 0), 0), tot = p.accounts.reduce((t, a) => t + (Number(a.balance) || 0), 0);
    rows.push({ id: s.id, ci: bal('cashIsa_self'), tot, d }); }
  rows.sort((a, b) => b.ci - a.ci);
  console.log(`  ${rows.length} singles, ${rows.filter(r => r.ci > 0).length} with cash ISA money`);
  for (const r of rows.slice(0, 11)) console.log(`  ${r.id}: ${Math.round(r.ci)} of ${Math.round(r.tot)} (${(100 * r.ci / r.tot).toFixed(0)}%); aged ${r.d.currentAgeSelf}, retires at ${r.d.retireAgeSelf}, salary ${r.d.salarySelf || 0}`); }
