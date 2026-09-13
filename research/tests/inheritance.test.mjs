/*
 * Inheritance tax, checked against figures worked by hand from the published rules.
 *
 * The cases are chosen to catch the readings of the rules that are WRONG but plausible: a residence
 * band granted without a home, one granted larger than the home it relates to, a taper that keeps
 * going below zero, a charity test measured against the wrong base, and - the one that matters most
 * for this app - a pension treated the same either side of 6 April 2027.
 */
import * as E from '../engine.mjs';
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;
const cfg = { ...E.DEFAULT_CONFIG };
const kid = (income = 0, share = 100) => ({ id: 'k', name: 'Child', relationship: 'descendant', sharePct: share, income });

console.log('=========== A. THE BANDS ===========');
{
  // £500k, no home, all to a child. NRB 325k -> chargeable 175k -> 40% = £70,000
  const r = E.estateAtDeath(cfg, { isa: 500000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [kid()] });
  ok('NRB only: £500k estate pays £70,000', near(r.iht, 70000), `£${Math.round(r.iht).toLocaleString()}`);
  ok('no home means no residence band', r.rnrb === 0, String(r.rnrb));
}
{
  // same estate but £300k of it is a home passing to the child: NRB 325k + RNRB 175k = 500k -> nil
  const r = E.estateAtDeath(cfg, { isa: 200000 }, { deathAge: 80, deathYear: 2030, homeValue: 300000, homeToDescendants: true, beneficiaries: [kid()] });
  ok('home to a child unlocks the residence band', near(r.rnrb, 175000), `£${Math.round(r.rnrb).toLocaleString()}`);
  ok('£500k with a home pays nothing', near(r.iht, 0), `£${Math.round(r.iht).toLocaleString()}`);
}
{
  // the band can never exceed the home it relates to
  const r = E.estateAtDeath(cfg, { isa: 400000 }, { deathAge: 80, deathYear: 2030, homeValue: 90000, homeToDescendants: true, beneficiaries: [kid()] });
  ok('residence band is capped at the value of the home', near(r.rnrb, 90000), `£${Math.round(r.rnrb).toLocaleString()}`);
}
{
  // taper: £2.2m estate is £200k over, so the band loses £100k -> £75k left
  const r = E.estateAtDeath(cfg, { isa: 1900000 }, { deathAge: 80, deathYear: 2030, homeValue: 300000, homeToDescendants: true, beneficiaries: [kid()] });
  ok('residence band tapers £1 per £2 over £2m', near(r.rnrb, 75000), `£${Math.round(r.rnrb).toLocaleString()}`);
  const gone = E.estateAtDeath(cfg, { isa: 2400000 }, { deathAge: 80, deathYear: 2030, homeValue: 300000, homeToDescendants: true, beneficiaries: [kid()] });
  ok('and is fully gone by £2.35m, never negative', gone.rnrb === 0, String(gone.rnrb));
}
{
  const r = E.estateAtDeath(cfg, { isa: 500000 }, { deathAge: 80, deathYear: 2030, homeValue: 300000, homeToDescendants: true,
    beneficiaries: [{ id: 'f', name: 'Friend', relationship: 'other', sharePct: 100, income: 0 }] });
  ok('a home left to someone who is NOT a descendant gets no residence band', r.rnrb === 0, String(r.rnrb));
}

console.log('\n=========== B. THE 2027 PENSION SWITCH ===========');
{
  const before = E.estateAtDeath(cfg, { pen: 600000, isa: 200000 }, { deathAge: 80, deathYear: 2026, beneficiaries: [kid()] });
  const after = E.estateAtDeath(cfg, { pen: 600000, isa: 200000 }, { deathAge: 80, deathYear: 2027, beneficiaries: [kid()] });
  ok('before 2027 the pension is outside the estate', !before.pensionCounts && near(before.grossEstate, 200000), `£${Math.round(before.grossEstate).toLocaleString()}`);
  ok('from 2027 it is inside', after.pensionCounts && near(after.grossEstate, 800000), `£${Math.round(after.grossEstate).toLocaleString()}`);
  // hand-checked: £800k gross - £325k NRB = £475k chargeable at 40% = £190,000, against nil before
  ok('and the bill goes from nothing to £190,000', near(before.iht, 0) && near(after.iht, 190000),
    `£${Math.round(before.iht).toLocaleString()} -> £${Math.round(after.iht).toLocaleString()}`);
}
{
  // death at 74 vs 76: the beneficiary's income tax on the inherited pension appears from 75
  const at74 = E.estateAtDeath(cfg, { pen: 600000 }, { deathAge: 74, deathYear: 2030, beneficiaries: [kid(60000)] });
  const at76 = E.estateAtDeath(cfg, { pen: 600000 }, { deathAge: 76, deathYear: 2030, beneficiaries: [kid(60000)] });
  ok('death before 75: no income tax for the beneficiary', at74.incomeTaxOnPensions === 0, `£${Math.round(at74.incomeTaxOnPensions)}`);
  ok('death at 76: income tax at the beneficiary\'s marginal rate', at76.incomeTaxOnPensions > 0, `£${Math.round(at76.incomeTaxOnPensions).toLocaleString()}`);
  ok('the same estate is worth materially less two years later', at76.netToBeneficiaries < at74.netToBeneficiaries,
    `£${Math.round(at74.netToBeneficiaries).toLocaleString()} vs £${Math.round(at76.netToBeneficiaries).toLocaleString()}`);
  ok('the 75 cliff costs more than 10% of the estate here',
    (at74.netToBeneficiaries - at76.netToBeneficiaries) / at74.netToBeneficiaries > 0.10,
    `${(100 * (at74.netToBeneficiaries - at76.netToBeneficiaries) / at74.netToBeneficiaries).toFixed(1)}%`);
}
{
  // the headline claim: a pension pound is worth far less than an ISA pound to a taxed beneficiary
  const inPension = E.estateAtDeath(cfg, { pen: 1000000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [kid(160000)] });
  const inIsa = E.estateAtDeath(cfg, { isa: 1000000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [kid(160000)] });
  ok('same £1m: the ISA delivers more than the pension', inIsa.netToBeneficiaries > inPension.netToBeneficiaries,
    `ISA £${Math.round(inIsa.netToBeneficiaries).toLocaleString()} vs pension £${Math.round(inPension.netToBeneficiaries).toLocaleString()}`);
  ok('pension effective rate exceeds 55% for an additional-rate heir', inPension.effectiveRatePct > 55, `${inPension.effectiveRatePct.toFixed(1)}%`);
  ok('ISA effective rate stays at or below the headline 40%', inIsa.effectiveRatePct <= 40.01, `${inIsa.effectiveRatePct.toFixed(1)}%`);
}

console.log('\n=========== C. WHO INHERITS CHANGES THE TAX ===========');
{
  const toSpouse = E.estateAtDeath(cfg, { pen: 800000, isa: 400000 }, { deathAge: 80, deathYear: 2030,
    beneficiaries: [{ id: 's', name: 'Spouse', relationship: 'spouse', sharePct: 100, income: 0 }] });
  ok('everything to a spouse is exempt', near(toSpouse.iht, 0) && near(toSpouse.totalTax, 0), `£${Math.round(toSpouse.totalTax).toLocaleString()}`);
  const basic = E.estateAtDeath(cfg, { pen: 800000, isa: 400000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [kid(20000)] });
  const addl = E.estateAtDeath(cfg, { pen: 800000, isa: 400000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [kid(180000)] });
  ok('a basic-rate heir keeps more than an additional-rate heir', basic.netToBeneficiaries > addl.netToBeneficiaries,
    `£${Math.round(basic.netToBeneficiaries).toLocaleString()} vs £${Math.round(addl.netToBeneficiaries).toLocaleString()}`);
  ok('IHT itself is identical either way - only the income tax differs', near(basic.iht, addl.iht),
    `£${Math.round(basic.iht).toLocaleString()} / £${Math.round(addl.iht).toLocaleString()}`);
}
{
  // a spouse bears none of the bill: the taxable heirs carry all of it
  const mixed = E.estateAtDeath(cfg, { isa: 1000000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [
    { id: 's', name: 'Spouse', relationship: 'spouse', sharePct: 50, income: 0 }, kid(0, 50)] });
  const sp = mixed.beneficiaries.find(b => b.relationship === 'spouse');
  const ch = mixed.beneficiaries.find(b => b.relationship === 'descendant');
  ok('the spouse bears none of the inheritance tax', sp.ihtBorne === 0, `£${Math.round(sp.ihtBorne)}`);
  ok('the child bears all of it', near(ch.ihtBorne, mixed.iht), `£${Math.round(ch.ihtBorne).toLocaleString()} of £${Math.round(mixed.iht).toLocaleString()}`);
}

console.log('\n=========== D. THE CHARITY RATE ===========');
{
  const none = E.estateAtDeath(cfg, { isa: 1000000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [kid()] });
  ok('no charity: 40%', near(none.ratePct, 40), `${none.ratePct}%`);
  // 10% of the baseline (1,000,000 - 325,000 = 675,000) is 67,500; give 7% and it should NOT qualify
  const small = E.estateAtDeath(cfg, { isa: 1000000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [
    { id: 'c', name: 'Charity', relationship: 'charity', sharePct: 3, income: 0 }, kid(0, 97)] });
  ok('a token charitable gift does not earn the reduced rate', !small.charityQualifies && near(small.ratePct, 40), `${small.ratePct}%`);
  const big = E.estateAtDeath(cfg, { isa: 1000000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [
    { id: 'c', name: 'Charity', relationship: 'charity', sharePct: 10, income: 0 }, kid(0, 90)] });
  ok('10% to charity earns 36% on the rest', big.charityQualifies && near(big.ratePct, 36), `${big.ratePct}%`);
  ok('the charitable gift itself is exempt', near(big.charityValue, 100000), `£${Math.round(big.charityValue).toLocaleString()}`);
}

console.log('\n=========== E. COUPLES ===========');
{
  const w = { pen: 700000, isa: 500000 };
  const single = E.estateAtDeath(cfg, w, { deathAge: 80, deathYear: 2030, homeValue: 400000, homeToDescendants: true, beneficiaries: [kid()] });
  const couple = E.estateForCouple(cfg, w, { deathAge: 80, deathYear: 2030, homeValue: 400000, homeToDescendants: true, beneficiaries: [kid()] });
  ok('the first death is tax-free', near(couple.first.iht, 0), `£${Math.round(couple.first.iht).toLocaleString()}`);
  ok('a couple pays less than a single person on the same estate', couple.iht < single.iht,
    `couple £${Math.round(couple.iht).toLocaleString()} vs single £${Math.round(single.iht).toLocaleString()}`);
  ok('because both bands are doubled', near(couple.second.nrb, 650000) && near(couple.second.rnrb, 350000),
    `NRB £${Math.round(couple.second.nrb).toLocaleString()}, RNRB £${Math.round(couple.second.rnrb).toLocaleString()}`);
}

console.log('\n=========== F. DEGENERATE INPUTS ===========');
{
  ok('an empty estate does not divide by zero', E.estateAtDeath(cfg, {}, { beneficiaries: [] }).iht === 0);
  ok('no beneficiaries yields no net and no crash', E.estateAtDeath(cfg, { isa: 500000 }, { beneficiaries: [] }).netToBeneficiaries === 0);
  const lop = E.estateAtDeath(cfg, { isa: 600000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [kid(0, 30), { id: 'b', name: 'B', relationship: 'other', sharePct: 30, income: 0 }] });
  ok('shares that do not total 100 are normalised, and reported', near(lop.sharesDeclaredPct, 60) &&
    near(lop.beneficiaries.reduce((t, b) => t + b.sharePct, 0), 100), `declared ${lop.sharesDeclaredPct}%`);
  ok('junk beneficiary rows are repaired rather than thrown', E.normalizeBeneficiaries([{ relationship: 'nonsense', sharePct: 900 }])[0].relationship === 'descendant');
  ok('every relationship carries the copy the UI needs',
    Object.values(E.IHT_RELATIONSHIPS).every(r => r.label && r.note));
}

console.log('\n=========== G. QUICK SUCCESSION RELIEF ===========');
{
  const base = { deathAge: 80, deathYear: 2030, beneficiaries: [kid()] };
  const plain = E.estateAtDeath(cfg, { isa: 1000000 }, base);
  // £1m - £325k NRB = £675k at 40% = £270,000
  ok('the unrelieved bill is £270,000', near(plain.iht, 270000), `£${Math.round(plain.iht).toLocaleString()}`);

  // the statutory taper: 100/80/60/40/20 by whole years, nothing from five
  const at = (y) => E.estateAtDeath(cfg, { isa: 1000000 }, { ...base, qsrInheritedValue: 300000, qsrTaxPaid: 120000, qsrYearsBefore: y });
  ok('under a year: the whole £120,000 is credited', near(at(0).qsrRelief, 120000), `£${Math.round(at(0).qsrRelief).toLocaleString()}`);
  ok('one to two years: 80%', near(at(1).qsrRelief, 96000));
  ok('two to three: 60%', near(at(2).qsrRelief, 72000));
  ok('three to four: 40%', near(at(3).qsrRelief, 48000));
  ok('four to five: 20%', near(at(4).qsrRelief, 24000));
  ok('five or more: nothing', at(5).qsrRelief === 0 && near(at(5).iht, 270000), `£${Math.round(at(5).iht).toLocaleString()}`);
  ok('the relief reduces the tax, not the estate', near(at(0).grossEstate, plain.grossEstate) && at(0).iht < plain.iht);

  // it must never exceed the bill: a relief reduces what is owed, it does not create a refund
  const huge = E.estateAtDeath(cfg, { isa: 400000 }, { ...base, qsrInheritedValue: 900000, qsrTaxPaid: 900000, qsrYearsBefore: 0 });
  ok('a credit larger than the bill cannot make the tax negative', huge.iht === 0, `£${Math.round(huge.iht)}`);
  ok('and the relief is capped at the bill rather than the credit', near(huge.qsrRelief, huge.ihtBeforeRelief), `£${Math.round(huge.qsrRelief).toLocaleString()} of £${Math.round(huge.ihtBeforeRelief).toLocaleString()}`);

  ok('no inheritance means no relief', E.estateAtDeath(cfg, { isa: 1000000 }, { ...base, qsrYearsBefore: 1 }).qsrRelief === 0);
  ok('an inheritance on which no tax was paid gives no credit',
    E.estateAtDeath(cfg, { isa: 1000000 }, { ...base, qsrInheritedValue: 300000, qsrTaxPaid: 0, qsrYearsBefore: 1 }).qsrRelief === 0);
}

console.log('\n=========== H. DEATH ON ACTIVE SERVICE ===========');
{
  const base = { deathAge: 80, deathYear: 2030, beneficiaries: [kid(60000)] };
  const big = E.estateAtDeath(cfg, { pen: 2000000, isa: 800000 }, base);
  const svc = E.estateAtDeath(cfg, { pen: 2000000, isa: 800000 }, { ...base, activeServiceExempt: true });
  ok('a large estate normally pays a large bill', big.iht > 900000, `£${Math.round(big.iht).toLocaleString()}`);
  ok('on active service it pays nothing, whatever its size', svc.iht === 0 && svc.activeServiceExempt);
  ok('the estate itself is unchanged - it is an exemption, not a valuation trick', near(svc.grossEstate, big.grossEstate));
  /*
   * The beneficiary's own income tax on an inherited pension is a charge on THEM, not on the estate, so
   * the estate's exemption does not remove it. Getting this wrong would overstate the exemption.
   */
  ok('the heir still pays their own income tax on an inherited pension', svc.incomeTaxOnPensions > 0,
    `£${Math.round(svc.incomeTaxOnPensions).toLocaleString()}`);
  ok('and quick succession relief is moot when nothing is owed',
    E.estateAtDeath(cfg, { isa: 1000000 }, { ...base, activeServiceExempt: true, qsrInheritedValue: 300000, qsrTaxPaid: 120000, qsrYearsBefore: 0 }).qsrRelief === 0);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
