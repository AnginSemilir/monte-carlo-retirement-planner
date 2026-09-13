import * as E from '../engine.mjs';

const P = E.taxParams(E.DEFAULT_CONFIG);
const PASS_CFG = E.taxParams({ ...E.DEFAULT_CONFIG, employerNicPassThrough: 100 });
let pass = 0, fail = 0;
const check = (id, d, a, e, tol = 0.5, note = '') => {
  const ok = Math.abs(a - e) <= tol; ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${d}`);
  if (!ok) console.log(`        expected ${Math.round(e * 100) / 100}, got ${Math.round(a * 100) / 100}  ${note}`);
};
const ok = (id, d, cond, note = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${id}  ${d}`); if (!cond) console.log(`        ${note}`); };

// ---------------------------------------------------------------- Class 4 NIC
console.log('=== CLASS 4 NIC ===');
// 6% between the lower and upper profits limits (£12,570–£50,270), 2% above. Confirmed against current
// HMRC guidance for 2026/27; the limits currently coincide with the Class 1 PT and UEL.
check('C4-1', 'no Class 4 at the lower profits limit (£12,570)', E.nicFor(12570, P, true), 0);
check('C4-2', 'mid-band profit (£30,000)', E.nicFor(30000, P, true), (30000 - 12570) * 0.06);
check('C4-3', 'at the upper profits limit (£50,270)', E.nicFor(50270, P, true), 37700 * 0.06);
check('C4-4', 'above the upper profits limit (£80,000)', E.nicFor(80000, P, true), 37700 * 0.06 + 29730 * 0.02);
check('C4-5', 'Class 4 is lower than Class 1 by the 2pp rate gap', E.nicFor(50270, P, false) - E.nicFor(50270, P, true), 37700 * 0.02);
check('C4-6', 'default (no flag) is still Class 1', E.nicFor(30000, P), (30000 - 12570) * 0.08);

// ---------------------------------------------------------------- pension relief
console.log('\n=== PENSION RELIEF: INCOME TAX ONLY ===');
// A £10,000 gross contribution. An employee sacrifices salary and saves tax AND NIC; the self-employed
// contribute out of taxed profit and get income tax relief only.
const relief = (gross, salary, se) => gross - E.netCostOfPensionContrib(gross, salary, P, se);
check('REL-1', 'higher-rate self-employed gets exactly 40% relief', relief(10000, 80000, true), 4000);
check('REL-2', 'higher-rate employee gets 40% + 2% NIC', relief(10000, 80000, false), 4200);
check('REL-3', 'basic-rate self-employed gets exactly 20% relief', relief(5000, 40000, true), 1000);
check('REL-4', 'basic-rate employee gets 20% + 8% NIC', relief(5000, 40000, false), 1400);
check('REL-5', 'net cost to a basic-rate self-employed earner is the 80% they pay over', E.netCostOfPensionContrib(5000, 40000, P, true), 4000);
// the personal allowance taper is still picked up, because it comes through the income tax charge
check('REL-6', 'PA taper restored: 60% effective relief at £110k profit', relief(10000, 110000, true), 6000);

console.log('\n=== EMPLOYER NIC PASS-THROUGH IS INERT WHEN SELF-EMPLOYED ===');
// With 100% pass-through an employee's £10k contribution costs less, because the employer's 15% NIC saving
// tops it up. A self-employed person has no employer, so the setting must change nothing for them.
check('PASS-1', 'pass-through lowers the employed net cost',
  E.netCostOfPensionContrib(10000, 80000, PASS_CFG, false) < E.netCostOfPensionContrib(10000, 80000, P, false) - 100 ? 0 : 1, 0, 0.5,
  `${Math.round(E.netCostOfPensionContrib(10000, 80000, PASS_CFG, false))} vs ${Math.round(E.netCostOfPensionContrib(10000, 80000, P, false))}`);
check('PASS-2', 'pass-through leaves the self-employed net cost untouched',
  E.netCostOfPensionContrib(10000, 80000, PASS_CFG, true), E.netCostOfPensionContrib(10000, 80000, P, true));

console.log('\n=== GROSS-UP IS THE INVERSE OF NET COST ===');
[[3000, 40000], [8000, 80000], [15000, 150000]].forEach(([net, salary]) => {
  const credit = E.grossUpNet(net, salary, P, Infinity, true);
  check('INV', `£${net.toLocaleString()} net at £${salary.toLocaleString()} profit round-trips`, E.netCostOfPensionContrib(credit, salary, P, true), net, 1);
});
{
  // incremental pricing must agree with pricing the whole contribution at once
  const base = 6000, extraNet = 2000, salary = 80000;
  const extra = E.grossUpNetIncremental(extraNet, salary, P, base, Infinity, true);
  const costBase = E.netCostOfPensionContrib(base, salary, P, true);
  check('INV-4', 'incremental gross-up prices the top-up at the marginal rate',
    E.netCostOfPensionContrib(base + extra, salary, P, true) - costBase, extraNet, 1);
}

console.log('\n=== BUILDCONTEXT AND THE PROJECTION ===');
const H = { real: 4, unlucky: 0, lucky: 8, nominal: 6, volatility: 12, label: 'H' };
const mk = (employment) => ({
  demographics: {
    planningMode: 'single', currentAgeSelf: 45, retireAgeSelf: 65, salarySelf: 80000, employmentSelf: employment,
    statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500, terminalAge: 90
  },
  spending: { targetSpend: 35000, drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 200000, contrib: 10000, growth: 0, risk: 'H' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 100000, contrib: 10000, growth: 0, risk: 'H' },
    { id: 'other_self', owner: 'Myself', category: 'Other Investments (e.g. GIA)', balance: 0, contrib: 0, growth: 0, risk: 'H' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 30000, contrib: 0, growth: 0, risk: 'H' }
  ],
  riskProfiles: { H }, otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' }
});
const seCtx = E.buildContext(E.normalizePlan(mk('self-employed')));
const emCtx = E.buildContext(E.normalizePlan(mk('employed')));
ok('CTX-1', 'the self-employed flag reaches the owner', seCtx.owners[0].selfEmployed === true);
ok('CTX-2', 'employed is the default reading', emCtx.owners[0].selfEmployed === false);
ok('CTX-3', 'a plan with no employment field at all defaults to employed', (() => {
  const p = E.normalizePlan(mk('employed'));
  delete p.demographics.employmentSelf;
  return E.buildContext(p).owners[0].selfEmployed === false;
})());

// the same contribution schedule costs a self-employed person more take-home, because they get less relief
const seOutlay = E.accumulationOutlay(seCtx);
const emOutlay = E.accumulationOutlay(emCtx);
ok('OUT-1', 'self-employed accumulation costs more take-home than employed',
  seOutlay > emOutlay, `${Math.round(seOutlay)} vs ${Math.round(emOutlay)}`);
check('OUT-2', 'the gap is exactly the NIC relief on 20 years of £10k pension contributions',
  seOutlay - emOutlay, 20 * 10000 * P.nicUpper, 1);

// the tournament's derived budget follows the same pricing, so a self-employed plan reports a larger budget
const seT = E.buildTournament(E.normalizePlan(mk('self-employed')), {});
const emT = E.buildTournament(E.normalizePlan(mk('employed')), {});
ok('TOUR-1', 'the tournament budget reflects the smaller relief', seT.meta.derivedBudget > emT.meta.derivedBudget,
  `${Math.round(seT.meta.derivedBudget)} vs ${Math.round(emT.meta.derivedBudget)}`);
ok('TOUR-2', 'every self-employed strategy still normalises to the baseline outlay', (() => {
  const target = seT.meta.baselineOutlay;
  return seT.strategies.filter(s => s.id !== 'baseline').every(s => {
    const ps = s.planState || (s.candidates && s.candidates[Math.floor(s.candidates.length / 2)].planState);
    return Math.abs(E.accumulationOutlay(ps) - target) / target < 0.001;
  });
})());
ok('TOUR-3', 'Relief-First reports less relief for the self-employed than the employed', (() => {
  const r = (t) => t.strategies.find(s => s.id === 'relief').taxReliefSaved;
  return r(seT) < r(emT);
})(), `${Math.round(seT.strategies.find(s => s.id === 'relief').taxReliefSaved)} vs ${Math.round(emT.strategies.find(s => s.id === 'relief').taxReliefSaved)}`);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
