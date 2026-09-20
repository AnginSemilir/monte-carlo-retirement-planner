/*
 * TAX ON SAVINGS INTEREST (plan phase 2e.1). The allowance rules, exact to the pound, and the engine
 * charging the tax as a cost the year funds.
 */
import * as E from '../engine.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const near = (a, b, tol = 0.5) => Math.abs(a - b) <= tol;

const P = E.taxParams(E.DEFAULT_CONFIG);
console.log('=========== A. THE ALLOWANCES, EXACT ===========');
// starting rate: no other income, £3,980 of interest is inside the £5,000 band
ok('A1  no other income: interest inside the starting rate band is untaxed', P.savingsTax(0, 3980) === 0);
// £30,000 of pension income leaves no starting-rate room; £1,000 PSA; the rest at 20%
ok('A2  basic-rate taxpayer: £1,000 allowance then 20%', near(P.savingsTax(30000, 3980), (3980 - 1000) * 0.20), `${P.savingsTax(30000, 3980).toFixed(2)}`);
// £60,000: £500 PSA; the rest at 40%
ok('A3  higher-rate taxpayer: £500 allowance then 40%', near(P.savingsTax(60000, 3980), (3980 - 500) * 0.40), `${P.savingsTax(60000, 3980).toFixed(2)}`);
// £130,000: nil allowance, 45% (and the personal allowance is gone)
ok('A4  additional-rate taxpayer: no allowance, 45%', near(P.savingsTax(130000, 3980), 3980 * 0.45), `${P.savingsTax(130000, 3980).toFixed(2)}`);
// partial starting-rate room: £15,000 of income leaves £2,570 of the band, then the PSA, then 20%
ok('A5  partial starting-rate room is used first', near(P.savingsTax(15000, 3980), (3980 - 2570 - 1000) * 0.20), `${P.savingsTax(15000, 3980).toFixed(2)}`);
// interest that straddles the basic/higher boundary pays 20% on the part below and 40% above
{
  const ns = P.basicLimit - 1500, i = 3980; // £1,500 of band left; the PSA at this total is the higher-rate £500
  const expect = (1500 - 500) * 0.20 + (i - 1500) * 0.40;
  ok('A6  interest straddling the higher-rate line is split at the line', near(P.savingsTax(ns, i), expect), `${P.savingsTax(ns, i).toFixed(2)} vs ${expect.toFixed(2)}`);
}
ok('A7  switched off, nothing is charged', E.taxParams({ ...E.DEFAULT_CONFIG, cashInterestTaxed: false }).savingsTax(30000, 3980) === 0);

console.log('=========== C. DIVIDENDS IN THE GIA, EXACT ===========');
ok('C1  basic-rate taxpayer: £500 allowance then 8.75%', near(P.dividendTax(30000, 0, 4000), (4000 - 500) * 0.0875), `${P.dividendTax(30000, 0, 4000).toFixed(2)}`);
ok('C2  higher-rate taxpayer: £500 allowance then 33.75%', near(P.dividendTax(60000, 0, 4000), (4000 - 500) * 0.3375), `${P.dividendTax(60000, 0, 4000).toFixed(2)}`);
ok('C3  additional-rate taxpayer: 39.35%', near(P.dividendTax(140000, 0, 4000), (4000 - 500) * 0.3935), `${P.dividendTax(140000, 0, 4000).toFixed(2)}`);
{
  const ns = P.basicLimit - 1500, d = 4000; // £1,500 of basic band left: £500 allowance, £1,000 at 8.75%, the rest at 33.75%
  const expect = 1000 * 0.0875 + (d - 1500) * 0.3375;
  ok('C4  dividends straddling the higher-rate line are split at the line', near(P.dividendTax(ns, 0, d), expect), `${P.dividendTax(ns, 0, d).toFixed(2)} vs ${expect.toFixed(2)}`);
}
ok('C5  interest sits below the dividends and pushes them up', P.dividendTax(P.basicLimit - 3000, 2500, 4000) > P.dividendTax(P.basicLimit - 3000, 0, 4000));
ok('C6  a zero yield or no dividends charges nothing', P.dividendTax(30000, 0, 0) === 0);

console.log('=========== B. IN THE ENGINE ===========');
const base = E.normalizePlan({
  demographics: { planningMode: 'single', currentAgeSelf: 68, retireAgeSelf: 60, statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976, terminalAge: 70, salarySelf: 0 },
  accounts: [{ id: 'p', type: 'pension', owner: 'Myself', balance: 300000, risk: 'Low Risk' }, { id: 'c', type: 'cash', owner: 'Myself', balance: 200000, risk: 'Cash Equivalents' }],
  spending: { targetSpend: 30000, decumulationPolicy: 'Bracket Fill Basic' },
  config: { ...E.DEFAULT_CONFIG, cashBufferMonths: 0 }
});
const on = E.resolveMpaa(base);
const off = E.resolveMpaa(E.normalizePlan({ ...base, config: { ...base.config, cashInterestTaxed: false } }));
const rowOn = E.simulateDeterministic(on).rows[0], rowOff = E.simulateDeterministic(off).rows[0];
const cashAcc = E.buildContext(on).acc['c'];
const nominal = (1 + cashAcc.real) * (1 + E.buildContext(on).inflation) - 1;
ok('B1  the row reports the year\'s interest on the cash held', near(rowOn.savingsInterest, 200000 * nominal * E.buildContext(on).yf, 1), `${rowOn.savingsInterest.toFixed(0)}`);
ok('B2  ...and the tax on it, state pension leaving no starting-rate room and the basic-rate allowance', near(rowOn.savingsTax, P.savingsTax(rowOn.spSelf, rowOn.savingsInterest), 0.01), `${rowOn.savingsTax.toFixed(2)}`);
ok('B3  the tax is a cost the year funds: the drawdown rises by it', near(rowOn.netDrawdown - rowOff.netDrawdown, rowOn.savingsTax, 1), `${(rowOn.netDrawdown - rowOff.netDrawdown).toFixed(2)} vs ${rowOn.savingsTax.toFixed(2)}`);
ok('B4  ...and lifetime tax carries it', rowOn.taxPaid > rowOff.taxPaid && near(rowOn.taxPaid - rowOff.taxPaid, rowOn.savingsTax, 1));
ok('B5  switched off the year is what it was before', rowOff.savingsTax === 0 && rowOff.savingsInterest === 0);
{
  const gia = E.resolveMpaa(E.normalizePlan({ ...base, accounts: [...base.accounts, { id: 'g', type: 'other', owner: 'Myself', balance: 150000, risk: 'Medium Risk' }], config: { ...base.config, cashInterestTaxed: false } }));
  const giaOff = E.resolveMpaa(E.normalizePlan({ ...base, accounts: [...base.accounts, { id: 'g', type: 'other', owner: 'Myself', balance: 150000, risk: 'Medium Risk' }], config: { ...base.config, cashInterestTaxed: false, giaDividendYield: 0 } }));
  const r1 = E.simulateDeterministic(gia).rows[0], r0 = E.simulateDeterministic(giaOff).rows[0];
  ok('B6  the row reports the GIA\'s dividends at the configured yield', near(r1.giaDividends, 150000 * 0.02 * E.buildContext(gia).yf, 1), `${r1.giaDividends.toFixed(0)}`);
  ok('B7  ...and the dividend tax on them, funded by the year', near(r1.dividendTax, P.dividendTax(r1.spSelf, 0, r1.giaDividends), 0.01) && near(r1.netDrawdown - r0.netDrawdown, r1.dividendTax, 1), `${r1.dividendTax.toFixed(2)}`);
  ok('B8  the GIA grows exactly as before: the yield comes out of the return, not on top', near(r1.other, r0.other, 0.01));
}

console.log(`\n=========== ${passed} passed, ${failed} failed ===========`);
process.exit(failed ? 1 : 0);
