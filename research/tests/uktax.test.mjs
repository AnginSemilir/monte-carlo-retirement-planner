// UK tax conformance probes. Expected values derived from 2025/26 statute, not from the model.
import * as E from '../engine.mjs';

const P = E.taxParams(E.DEFAULT_CONFIG);
const gbp = (n) => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 });
let pass = 0, fail = 0;
const results = [];

const check = (id, desc, actual, expected, tol = 0.51, note = '') => {
  const ok = Math.abs(actual - expected) <= tol;
  ok ? pass++ : fail++;
  results.push({ id, desc, actual, expected, ok, note });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}`);
  if (!ok) console.log(`        expected ${gbp(expected)}, got ${gbp(actual)}   ${note}`);
};

const ZERO = { real: 0, unlucky: 0, lucky: 0, nominal: 0, volatility: 0, label: 'flat' };

// Build a retired single person with a controllable GIA disposal and income stream.
function scenario({ gia = 0, gain = 0, sell = 0, income = 0, incomeType = 'otherTaxable', gainsUsed = '', cash = 0, pen = 0, isa = 0, cfg = {}, terminalAge = 63, retireAge = 60, currentAge = 60, salary = '' } = {}) {
  return {
    demographics: {
      planningMode: 'single', currentAgeSelf: currentAge, retireAgeSelf: retireAge, salarySelf: salary,
      statePensionAge: 99, privatePensionAge: 58, statePensionSelf: 0, terminalAge, cgtGainsUsedSelf: gainsUsed
    },
    spending: { targetSpend: 0, drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
    accounts: [
      { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: pen, contrib: 0, growth: 0, risk: 'Cash Equivalents' },
      { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: isa, contrib: 0, growth: 0, risk: 'Cash Equivalents' },
      { id: 'other_self', owner: 'Myself', category: E.CATEGORY_LABEL.other, balance: gia, unrealisedGain: gain, contrib: 0, growth: 0, risk: 'Cash Equivalents' },
      { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: cash, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
    ],
    riskProfiles: { 'Cash Equivalents': ZERO },
    otherIncomes: income > 0 ? [{ id: 'i1', name: 'inc', owner: 'Myself', startAge: 0, endAge: 120, amount: income, incomeType }] : [],
    oneOffContributions: [],
    oneOffCosts: sell > 0 ? [{ id: 'c1', date: '2026-06-01', year: 2026, owner: 'Myself', amount: sell, desc: 'sale' }] : [],
    config: { valuationDate: '2026-01-01', cgtEnabled: true, giaDividendYield: 0, cashInterestTaxed: false, ...cfg }   // income tax and CGT mechanics only: no dividend or interest tax unless a case asks
  };
}
const year0 = (plan) => E.simulateDeterministic(E.buildContext(plan), 'expected')[0];

console.log('\n=========== A. INCOME TAX ===========');
check('A1', 'PA exactly covered (£12,570)', E.incomeTax(12570, P), 0);
check('A2', 'Top of basic rate (£50,270)', E.incomeTax(50270, P), 37700 * 0.20);
check('A3', '£60,000 salary', E.incomeTax(60000, P), 37700 * 0.20 + 9730 * 0.40);
check('A4', '£100,000 (PA still intact)', E.incomeTax(100000, P), 37700 * 0.20 + 49730 * 0.40);
check('A5', '£125,140 (PA fully tapered)', E.incomeTax(125140, P), 37700 * 0.20 + 87440 * 0.40);
check('A6', '£150,000 (additional rate)', E.incomeTax(150000, P), 37700 * 0.20 + 87440 * 0.40 + 24860 * 0.45);
check('A7', '60% effective band: £1k over £100k', E.incomeTax(101000, P) - E.incomeTax(100000, P), 600,
  0.51, 'PA taper should make the marginal rate 60%');

console.log('\n=========== B. NATIONAL INSURANCE ===========');
check('B1', 'NIC at UEL (£50,270)', E.nicFor(50270, P), 37700 * 0.08);
check('B2', 'NIC above UEL (£60,000)', E.nicFor(60000, P), 37700 * 0.08 + 9730 * 0.02);
check('B3', 'No NIC below PT (£12,570)', E.nicFor(12570, P), 0);

console.log('\n=========== C. CAPITAL GAINS TAX ===========');
// Unused personal allowance CANNOT be set against capital gains (TCGA 1992). The basic-rate
// band available to gains is £37,700 less TAXABLE income (income after PA), floored at zero.
{
  const r = year0(scenario({ gia: 100000, gain: 100000, sell: 50000, income: 0 }));
  check('C1', 'Nil income, £47k taxable gain — unused PA must NOT shelter gains',
    r.cgtPaid, 37700 * 0.18 + 9300 * 0.24, 1,
    'basic-rate room for gains is £37,700, not £37,700 + unused PA');
}
{
  const r = year0(scenario({ gia: 100000, gain: 100000, sell: 50000, income: 5000 }));
  check('C2', '£5,000 income (below PA), £47k taxable gain',
    r.cgtPaid, 37700 * 0.18 + 9300 * 0.24, 1,
    'income below PA still leaves the full £37,700 band, no more');
}
{
  const r = year0(scenario({ gia: 100000, gain: 100000, sell: 50000, income: 20000 }));
  // taxable income 20,000-12,570 = 7,430 -> room 37,700-7,430 = 30,270
  check('C3', '£20,000 income, £47k taxable gain', r.cgtPaid, 30270 * 0.18 + 16730 * 0.24, 1);
}
{
  const r = year0(scenario({ gia: 200000, gain: 200000, sell: 100000, income: 45000, pen: 300000 }));
  // taxable income 32,430 -> room 5,270; gain 100,000 - 3,000 = 97,000
  check('C4', '£45,000 income, £97k taxable gain (band split)', r.cgtPaid, 5270 * 0.18 + 91730 * 0.24, 1);
}
{
  const r = year0(scenario({ gia: 100000, gain: 100000, sell: 50000, income: 0, gainsUsed: 3000 }));
  check('C5', 'Exemption already used → whole gain taxable', r.cgtPaid, 37700 * 0.18 + 12300 * 0.24, 1);
}
{
  const r = year0(scenario({ gia: 100000, gain: 40000, sell: 10000, income: 0 }));
  check('C6', 'Pro-rata disposal (40% gain fraction)', r.cgtPaid, 1000 * 0.18, 1);
}
{
  const r = year0(scenario({ gia: 100000, gain: 0, sell: 10000, income: 0 }));
  check('C7', 'No embedded gain → no CGT', r.cgtPaid, 0, 0.01);
}
{
  // Gains are not part of adjusted net income, so they must not taper the personal allowance.
  const withGain = year0(scenario({ gia: 200000, gain: 200000, sell: 100000, income: 95000, pen: 400000 }));
  const noGain = year0(scenario({ gia: 0, gain: 0, sell: 0, income: 95000 }));
  check('C8', 'Gains must not trigger PA taper (income tax unchanged)',
    withGain.taxPaid, noGain.taxPaid, 1, 'capital gains are outside adjusted net income');
}
{
  // AEA is use-it-or-lose-it; an unused year must not enlarge a later year's exemption.
  const plan = scenario({ gia: 100000, gain: 100000, income: 0, terminalAge: 64 });
  plan.oneOffCosts = [{ id: 'c2', date: '2027-06-01', year: 2027, owner: 'Myself', amount: 5000, desc: 'yr2 sale' }];
  const rows = E.simulateDeterministic(E.buildContext(plan), 'expected');
  const r1 = rows.find(r => r.year === 2027);
  check('C9', 'Unused exemption does not carry forward', r1.cgtPaid, (5000 - 3000) * 0.18, 1);
}
{
  // ISA disposals are outside CGT entirely.
  const plan = scenario({ isa: 100000, gia: 0, income: 0 });
  plan.oneOffCosts = [{ id: 'c3', date: '2026-06-01', year: 2026, owner: 'Myself', amount: 50000, desc: 'isa sale' }];
  check('C10', 'ISA withdrawal incurs no CGT', year0(plan).cgtPaid, 0, 0.01);
}

console.log('\n=========== D. PENSION RULES ===========');
{
  // PCLS is 25% but capped at the Lump Sum Allowance (£268,275).
  const plan = scenario({ pen: 1500000, currentAge: 60, retireAge: 59, terminalAge: 62 });
  plan.spending.drawdownStrategy = 'Full 25% Lump Sum';
  const r = year0(plan);
  check('D1', 'PCLS capped at the Lump Sum Allowance', r.cash, Math.min(1500000 * 0.25, 268275), 1,
    '25% of £1.5m is £375,000 but the LSA caps it at £268,275');
}
{
  // MPAA is now DERIVED from the projection, not declared. Couple: self retires 60 and draws;
  // partner works to 68 contributing £25k and gets raided at NMPA 58.
  const couple = {
    demographics: { planningMode:'couple', currentAgeSelf:59, currentAgePart:55, retireAgeSelf:60, retireAgePart:68,
      salarySelf:'', salaryPart:70000, statePensionAge:67, privatePensionAge:58,
      statePensionSelf:11500, statePensionPart:11500, terminalAge:72 },
    spending: { targetSpend:55000, drawdownStrategy:'Phased Drawdown', decumulationPolicy:'Bracket Fill Basic' },
    accounts: [
      { id:'pen_self', owner:'Myself', category:'Pensions', balance:500000, contrib:0, growth:0, risk:'Medium Risk' },
      { id:'isa_self', owner:'Myself', category:'S&S ISAs', balance:0, contrib:0, growth:0, risk:'Medium Risk' },
      { id:'other_self', owner:'Myself', category:E.CATEGORY_LABEL.other, balance:0, contrib:0, growth:0, risk:'Medium Risk' },
      { id:'cash_self', owner:'Myself', category:'Cash Savings', balance:0, contrib:0, growth:0, risk:'Cash Equivalents' },
      { id:'pen_part', owner:'Partner', category:'Pensions', balance:200000, contrib:25000, growth:0, risk:'Medium Risk' },
      { id:'isa_part', owner:'Partner', category:'S&S ISAs', balance:0, contrib:0, growth:0, risk:'Medium Risk' },
      { id:'other_part', owner:'Partner', category:E.CATEGORY_LABEL.other, balance:0, contrib:0, growth:0, risk:'Medium Risk' },
      { id:'cash_part', owner:'Partner', category:'Cash Savings', balance:0, contrib:0, growth:0, risk:'Cash Equivalents' }],
    otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate:'2026-01-01' }
  };
  const resolved = E.resolveMpaa(couple);
  check('D2', 'MPAA trigger derived for the raided partner (age 58)', Number(resolved.demographics.mpaaAgePart === "" ? -1 : resolved.demographics.mpaaAgePart), 58, 0.51);
  const rc = E.buildContext(resolved);
  const tPart = 58 - 55; // partner age 55 at t=0
  check('D2b', 'Partner headroom cut to the MPAA once triggered', E.wrapperHeadroomAtYear(rc, 'part', 'pen', tPart), 10000 - 25000 < 0 ? 0 : 10000 - 25000, 1);
  check('D2c', 'Partner headroom full before the trigger', E.wrapperHeadroomAtYear(rc, 'part', 'pen', 0), 60000 + E.carryForwardAtYear(rc, rc.owners.find(o=>o.key==='part'), 0) - 25000, 1);

  // Single mode: contributing and drawing are mutually exclusive, so a derived trigger can never
  // land before retirement, and headroom while still working must be untouched by the MPAA.
  const solo = scenario({ pen: 300000, salary: 60000, currentAge: 50, retireAge: 60, terminalAge: 62 });
  const soloR = E.resolveMpaa(solo);
  const soloAge = soloR.demographics.mpaaAgeSelf;
  check('D2s', 'Single mode: trigger never precedes retirement', soloAge === '' || soloAge >= 60 ? 1 : 0, 1, 0.01,
    `derived trigger age ${soloAge || 'none'} vs retirement 60`);
  const soloCtx = E.buildContext(soloR);
  check('D2t', 'Single mode: headroom while working unaffected by MPAA',
    E.wrapperHeadroomAtYear(soloCtx, 'self', 'pen', 0), 60000, 1);

  const p3 = scenario({ salary: 6000, currentAge: 60, retireAge: 70 });
  p3.demographics.mpaaAgeSelf = 60;
  check('D2d', 'Earnings below MPAA still bind (£6,000 salary)', E.wrapperHeadroomAtYear(E.buildContext(p3), 'self', 'pen', 0), 6000, 1);

  const p4 = scenario({ currentAge: 65, retireAge: 60 });
  p4.demographics.mpaaAgeSelf = 60;
  check('D2e', 'Retired, no earnings, MPAA on → £3,600 still binds', E.wrapperHeadroomAtYear(E.buildContext(p4), 'self', 'pen', 0), 3600, 1);

  const p5 = scenario({ currentAge: 60, retireAge: 70, salary: '' });
  p5.demographics.mpaaAgeSelf = 60;
  check('D2f', 'Blank salary (unconstrained) still capped by MPAA', E.wrapperHeadroomAtYear(E.buildContext(p5), 'self', 'pen', 0), 10000, 1);
}
{
  // Contributions are capped at relevant earnings.
  const ctx = E.buildContext(scenario({ salary: 20000, currentAge: 40, retireAge: 70 }));
  check('D3', 'Pension headroom capped at salary', E.wrapperHeadroomAtYear(ctx, 'self', 'pen', 0), 20000, 1);
}
{
  // No relevant earnings -> £3,600 gross.
  const ctx = E.buildContext(scenario({ currentAge: 60, retireAge: 59 }));
  check('D4', 'No relevant earnings → £3,600', E.wrapperHeadroomAtYear(ctx, 'self', 'pen', 0), 3600, 1);
}

console.log('\n=========== E. CROSS-CHECKS ===========');
{
  // Pension income bears income tax but never National Insurance.
  const plan = scenario({ pen: 500000, currentAge: 60, retireAge: 59, terminalAge: 62 });
  plan.spending.targetSpend = 30000;
  const r = year0(plan);
  const impliedNIC = E.nicFor(r.drawdownPensions, P);
  check('E1', 'No NIC on pension drawdown', r.taxPaid <= E.incomeTax(r.drawdownPensions, P) + 1 ? 0 : 1, 0, 0.01,
    `drawdown ${gbp(r.drawdownPensions)}, tax ${gbp(r.taxPaid)}, NIC would have been ${gbp(impliedNIC)}`);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
console.log(JSON.stringify(results.filter(r => !r.ok).map(r => r.id + ': ' + r.desc), null, 1));
