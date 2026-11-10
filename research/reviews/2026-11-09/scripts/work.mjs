import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const all = buildScenarios();
const f = v => Math.round(v);
const P = E.taxParams(undefined);
for (const id of ['S214', 'S210']) {
  const plan = E.resolveMpaa(E.normalizePlan(all.find(s => s.id === id).plan));
  const rows = E.simulateDeterministic(plan, 'expected');
  const d = plan.demographics;
  const x = rows[1];
  const sal = Number(d.salarySelf);
  console.log(id, 'salary', sal, 'year1: dividends', f(x.giaDividends), 'engine divTax', f(x.dividendTax), '| with salary stacked beneath:', f(P.dividendTax(sal, x.savingsInterest, x.giaDividends)), '| interest', f(x.savingsInterest), 'engine intTax', f(x.savingsTax), 'with salary:', f(P.savingsTax(sal, x.savingsInterest)), '| gains', f(x.realisedGains), 'cgt', f(x.cgtPaid), 'otherTaxable', f(x.otherTaxableSelf));
}
// a couple: self retired at 68, partner 60 still working on 60,000 with pension access
const base = E.normalizePlan(all.find(s => s.id === 'S021').plan);
const d0 = base.demographics;
console.log('S021 demo', JSON.stringify({ a: d0.currentAgeSelf, ap: d0.currentAgePart, r: d0.retireAgeSelf, rp: d0.retireAgePart, nmpa: d0.privatePensionAge, spend: base.spending.targetSpend, pol: base.spending.decumulationPolicy }), base.accounts.filter(a => Number(a.balance) > 0).map(a => a.id + ':' + a.balance).join(' '));
const mod = E.normalizePlan({ ...base, demographics: { ...d0, currentAgePart: 60, retireAgePart: 66, salaryPart: 60000 },
  accounts: base.accounts.map(a => (a.id === 'pen_self' ? { ...a, balance: 0 } : a.id === 'pen_part' ? { ...a, balance: 600000, contrib: 0 } : /^(isa|other|cash|cashIsa)_/.test(a.id) ? { ...a, balance: 0 } : a)) });
const rows = E.simulateDeterministic(E.resolveMpaa(mod), 'expected');
for (const x of rows.slice(1, 3)) console.log('couple year', x.t, 'ages', x.ageSelf, x.agePart, 'workingPart', x.workingPart, 'spend', f(x.targetSpend), 'workingTakeHome', f(x.workingTakeHome), 'netG', f(x.netGuaranteed), 'penDrawn', f(x.drawdownPensions), 'taxablePenPart', f(x.taxablePensionPart), 'taxPaid', f(x.taxPaid), 'unmet', f(x.unmetDemand));
const tp = rows[1].taxablePensionPart;
console.log('hand: tax on the partner\'s pension income stacked on a 60,000 salary =', f(E.incomeTax(60000 + tp) - E.incomeTax(60000)), 'engine charged', f(E.incomeTax(tp)), '(pension alone)');
