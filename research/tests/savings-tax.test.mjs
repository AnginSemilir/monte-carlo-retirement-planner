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
  // the canonical ids: normalizePlan keeps a row only under the id it knows
  accounts: [{ id: 'pen_self', owner: 'Myself', balance: 300000, risk: 'Low Risk' }, { id: 'cash_self', owner: 'Myself', balance: 200000, risk: 'Cash Equivalents' }],
  // a DB pension on top of the state pension, so there is no starting-rate room and the allowance is the basic-rate £1,000
  otherIncomes: [{ id: 'db', name: 'DB pension', owner: 'Myself', startAge: 60, endAge: '', amount: 25000, incomeType: 'otherTaxable' }],
  spending: { targetSpend: 40000, decumulationPolicy: 'Bracket Fill Basic' },
  config: { ...E.DEFAULT_CONFIG, cashBufferMonths: 0 }
});
// a plan is normalised to its canonical rows, so a test changes a row in place rather than appending one
const withRows = (plan, edits) => E.resolveMpaa(E.normalizePlan({ ...plan, accounts: plan.accounts.map(a => edits[a.id] ? { ...a, ...edits[a.id] } : a) }));
const on = E.resolveMpaa(base);
const off = E.resolveMpaa(E.normalizePlan({ ...base, config: { ...base.config, cashInterestTaxed: false } }));
// year 0 is a part-year (its income is pro-rated below the thresholds), so the tax assertions read year 1
const rowsOn = E.simulateDeterministic(on), rowsOff = E.simulateDeterministic(off);
const rowOn = rowsOn[0], rowOff = rowsOff[0], yOn = rowsOn[1], yOff = rowsOff[1];
const cashAcc = E.buildContext(on).acc['cash_self'];
const nominal = (1 + cashAcc.real) * (1 + E.buildContext(on).inflation) - 1;
ok('B1  the row reports the year\'s interest on the cash held', near(rowOn.savingsInterest, 200000 * nominal * E.buildContext(on).yf, 1), `${rowOn.savingsInterest.toFixed(0)}`);
ok('B2  ...and the tax on it, the DB pension leaving no starting-rate room and the basic-rate allowance', yOn.savingsTax > 0 && near(yOn.savingsTax, P.savingsTax(yOn.otherTaxableSelf, yOn.savingsInterest), 0.01), `${yOn.savingsTax.toFixed(2)} on ${yOn.savingsInterest.toFixed(0)} of interest`);
ok('B3  the tax is a cost the year funds: the drawdown rises by it', near(yOn.netDrawdown - yOff.netDrawdown, yOn.savingsTax, 1), `${(yOn.netDrawdown - yOff.netDrawdown).toFixed(2)} vs ${yOn.savingsTax.toFixed(2)}`);
// the year's tax rises by the savings tax AND the income tax on the extra pension drawn to fund it
ok('B4  ...and the year\'s tax carries it, plus the tax on the draw that funds it', yOn.taxPaid - yOff.taxPaid >= yOn.savingsTax - 1 && yOn.taxPaid - yOff.taxPaid <= yOn.savingsTax * 1.6, `+${(yOn.taxPaid - yOff.taxPaid).toFixed(2)} for ${yOn.savingsTax.toFixed(2)} of savings tax`);
ok('B5  switched off the year is what it was before', rowOff.savingsTax === 0 && rowOff.savingsInterest === 0);
{
  const gia = withRows({ ...base, config: { ...base.config, cashInterestTaxed: false } }, { other_self: { balance: 150000, risk: 'Medium Risk' } });
  const giaOff = withRows({ ...base, config: { ...base.config, cashInterestTaxed: false, giaDividendYield: 0 } }, { other_self: { balance: 150000, risk: 'Medium Risk' } });
  const r1 = E.simulateDeterministic(gia)[1], r0 = E.simulateDeterministic(giaOff)[1];
  ok('B6  the row reports the GIA\'s dividends at the configured yield', r1.giaDividends > 0.015 * r0.other && r1.giaDividends < 0.025 * r0.other, `${r1.giaDividends.toFixed(0)}`);
  ok('B7  ...and the dividend tax on them, funded by the year', r1.dividendTax > 0 && near(r1.dividendTax, P.dividendTax(r1.otherTaxableSelf, 0, r1.giaDividends), 0.01) && near(r1.netDrawdown - r0.netDrawdown, r1.dividendTax, 1), `${r1.dividendTax.toFixed(2)}`);
  ok('B8  the GIA grows exactly as before: the yield comes out of the return, not on top', near(r1.other, r0.other, 0.01));
}

console.log('=========== D. THE CASH ISA WRAPPER, MERGED INTO THE CASH POT ===========');
{
  const withIsa = withRows(base, { cashIsa_self: { balance: 120000 } });
  const ctxI = E.buildContext(withIsa);
  const rows = E.simulateDeterministic(withIsa);
  ok('D1  the cash ISA balance joins the cash pot', near(ctxI.acc['cash_self'].balance, 320000, 0.01), `${ctxI.acc['cash_self'].balance}`);
  ok('D2  ...and only the taxable part earns taxable interest', near(rows[0].savingsInterest, 200000 * nominal * ctxI.yf, 1), `${rows[0].savingsInterest.toFixed(0)}`);
  ok('D3  the sheltered part is reported', rows[0].cashIsa > 0 && rows[0].cashIsa <= rows[0].cash + 0.01);
  // leftover allowance shelters up to the cap a year: after the first full year the sheltered part has grown by about the cap
  const capY1 = E.taxParams(withIsa.config).cashIsaCapAt(69, 2027);
  // the difference between two year-ends is a full year's subscription plus the sheltered part's own growth
  ok('D4  each year the leftover allowance shelters more cash, up to the cash ISA cap', rows[1].cashIsa - rows[0].cashIsa > 0.9 * capY1 && rows[1].cashIsa - rows[0].cashIsa <= capY1 + 0.05 * rows[0].cashIsa, `${(rows[1].cashIsa - rows[0].cashIsa).toFixed(0)} vs cap ${capY1}`);
  const Pc = E.taxParams(E.DEFAULT_CONFIG);
  ok('D5  the under-65 cap applies from the configured year', Pc.cashIsaCapAt(60, 2026) === 20000 && Pc.cashIsaCapAt(60, 2027) === 12000 && Pc.cashIsaCapAt(66, 2027) === 20000);
  const allIsa = withRows(base, { cash_self: { balance: 0 }, cashIsa_self: { balance: 200000 } });
  const rA = E.simulateDeterministic(allIsa)[0];
  ok('D6  all cash in the ISA pays no interest tax, same as the switch off', rA.savingsTax === 0 && near(rA.netDrawdown, rowOff.netDrawdown, 1));
}

console.log(`\n=========== ${passed} passed, ${failed} failed ===========`);
process.exit(failed ? 1 : 0);
