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
  /*
   * This asserted that a spouse's TOTAL tax was zero, which encoded the very bug section J now covers:
   * the inheritance tax exemption does not reach the beneficiary's own income tax on an inherited
   * pension. The estate pays nothing; the widow still pays income tax as she draws it.
   */
  ok('everything to a spouse is free of INHERITANCE tax', near(toSpouse.iht, 0), `£${Math.round(toSpouse.iht).toLocaleString()}`);
  ok('though income tax on the inherited pension still applies to them', toSpouse.incomeTaxOnPensions > 0,
    `£${Math.round(toSpouse.incomeTaxOnPensions).toLocaleString()}`);
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

console.log('\n=========== I. WHAT AN INHERITED PENSION COSTS THE PERSON WHO GETS IT ===========');
{
  /*
   * The old model charged the pot times the beneficiary's CURRENT marginal rate, which is wrong in both
   * directions. Someone with no income was charged nothing on any size of pot - their marginal rate at
   * zero income is zero - when the withdrawal itself is what creates the income. Someone on £70,000 was
   * charged a flat 40% on the whole lot, when spreading it keeps much of it in the basic band.
   */
  const yrs = cfg.inheritedPensionSpreadYears;
  ok('a non-earner is NOT charged nothing on a large pot', E.inheritedPensionTax(400000, 0, cfg, yrs) > 50000,
    `£${Math.round(E.inheritedPensionTax(400000, 0, cfg, yrs)).toLocaleString()}`);
  ok('but pays far less than a higher-rate taxpayer on the same pot',
    E.inheritedPensionTax(400000, 0, cfg, yrs) < E.inheritedPensionTax(400000, 70000, cfg, yrs),
    `£${Math.round(E.inheritedPensionTax(400000, 0, cfg, yrs)).toLocaleString()} vs £${Math.round(E.inheritedPensionTax(400000, 70000, cfg, yrs)).toLocaleString()}`);
  ok('spreading it costs less than taking it in one year',
    E.inheritedPensionTax(400000, 0, cfg, 5) < E.inheritedPensionTax(400000, 0, cfg, 1),
    `5yr £${Math.round(E.inheritedPensionTax(400000, 0, cfg, 5)).toLocaleString()} vs 1yr £${Math.round(E.inheritedPensionTax(400000, 0, cfg, 1)).toLocaleString()}`);
  // the personal allowance is granted each year, which is the whole point
  const small = E.inheritedPensionTax(cfg.personalAllowance * 5 * 0.9, 0, cfg, 5);
  ok('a pot inside five personal allowances is tax-free to a non-earner', small === 0, `£${Math.round(small)}`);
  ok('the same pot costs a higher earner real money', E.inheritedPensionTax(cfg.personalAllowance * 5 * 0.9, 70000, cfg, 5) > 20000);
  ok('no pension means no tax', E.inheritedPensionTax(0, 50000, cfg, 5) === 0);

  // a beneficiary already drawing a state pension has less allowance left to shelter the drawdown
  const young = E.estateAtDeath(cfg, { pen: 400000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [{ id: 'a', relationship: 'descendant', sharePct: 100, income: 0, age: 40 }] });
  const old = E.estateAtDeath(cfg, { pen: 400000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [{ id: 'b', relationship: 'descendant', sharePct: 100, income: 0, age: 70 }] });
  ok('an heir at state pension age pays more than one without that income', old.incomeTaxOnPensions > young.incomeTaxOnPensions,
    `£${Math.round(old.incomeTaxOnPensions).toLocaleString()} vs £${Math.round(young.incomeTaxOnPensions).toLocaleString()}`);
}

console.log('\n=========== J. A SPOUSE PAYS INCOME TAX EVEN THOUGH THEY PAY NO IHT ===========');
{
  /*
   * The regression that prompted all of this. Income tax was skipped for every IHT-exempt relationship,
   * so a widow inheriting a pension was shown it as entirely tax-free. The inheritance tax exemption
   * does not reach the beneficiary's own income tax on what they draw.
   */
  const sp = E.estateAtDeath(cfg, { pen: 400000 }, { deathAge: 80, deathYear: 2030,
    beneficiaries: [{ id: 's', relationship: 'spouse', sharePct: 100, income: 0 }] });
  ok('the spouse pays no inheritance tax', sp.iht === 0);
  ok('but DOES pay income tax on the inherited pension', sp.incomeTaxOnPensions > 0, `£${Math.round(sp.incomeTaxOnPensions).toLocaleString()}`);
  ok('and it is less than a working heir would pay', sp.incomeTaxOnPensions <
    E.estateAtDeath(cfg, { pen: 400000 }, { deathAge: 80, deathYear: 2030, beneficiaries: [{ id: 'w', relationship: 'spouse', sharePct: 100, income: 80000 }] }).incomeTaxOnPensions);
  // a charity pays neither, and that distinction has to survive
  const ch = E.estateAtDeath(cfg, { pen: 400000 }, { deathAge: 80, deathYear: 2030,
    beneficiaries: [{ id: 'c', relationship: 'charity', sharePct: 100, income: 0 }] });
  ok('a charity pays neither tax', ch.iht === 0 && ch.incomeTaxOnPensions === 0);
  ok('death before 75 still leaves the pension untaxed for the heir',
    E.estateAtDeath(cfg, { pen: 400000 }, { deathAge: 70, deathYear: 2030, beneficiaries: [kid(60000)] }).incomeTaxOnPensions === 0);
}

console.log('\n=========== K. THE RELATIONSHIP CATEGORIES ===========');
{
  /*
   * Four categories, not more, because the rules genuinely do not distinguish further: a child and a
   * grandchild are both direct descendants and either unlocks the residence band. What DOES need saying
   * is who falls outside each row, since picking wrongly is worth the whole residence band one way and
   * the whole spousal exemption the other, and neither mistake surfaces as an error.
   */
  const R = E.IHT_RELATIONSHIPS;
  ok('every category explains who it covers', Object.values(R).every(r => r.who && r.who.length > 30));
  ok('the descendant row names the excluded relatives explicitly',
    /nieces|nephews|siblings/i.test(R.descendant.who), R.descendant.who.slice(0, 60));
  ok('it includes step, adopted and foster children', /step-|adopted|foster/i.test(R.descendant.who));
  ok('the spouse row warns that an unmarried partner does not count',
    /unmarried partner does not count/i.test(R.spouse.who), R.spouse.who.slice(0, 60));
  ok('and "someone else" names the unmarried partner as belonging there', /unmarried partner/i.test(R.other.who));

  // the substance behind the labels: a child and a grandchild must be treated identically
  const base = { deathAge: 80, deathYear: 2030, homeValue: 300000, homeToDescendants: true };
  const asChild = E.estateAtDeath(cfg, { isa: 400000 }, { ...base, beneficiaries: [{ id: 'c', relationship: 'descendant', sharePct: 100, income: 0, age: 50 }] });
  const asGrandchild = E.estateAtDeath(cfg, { isa: 400000 }, { ...base, beneficiaries: [{ id: 'g', relationship: 'descendant', sharePct: 100, income: 0, age: 25 }] });
  ok('a child and a grandchild get the same residence band', near(asChild.rnrb, asGrandchild.rnrb) && asChild.rnrb > 0,
    `£${Math.round(asChild.rnrb).toLocaleString()}`);
  // an unmarried partner is taxed, which is the trap the copy warns about
  const partner = E.estateAtDeath(cfg, { isa: 400000 }, { ...base, beneficiaries: [{ id: 'p', relationship: 'other', sharePct: 100, income: 0 }] });
  ok('an unmarried partner gets no exemption and no residence band', partner.rnrb === 0 && partner.iht > 0,
    `IHT £${Math.round(partner.iht).toLocaleString()}`);
  ok('while a spouse pays nothing on the same estate',
    E.estateAtDeath(cfg, { isa: 400000 }, { ...base, beneficiaries: [{ id: 's', relationship: 'spouse', sharePct: 100, income: 0 }] }).iht === 0);
}

console.log('\n=========== L. GIFTS AND THE SEVEN-YEAR RULE ===========');
{
  const base = { deathAge: 85, deathYear: 2040, beneficiaries: [kid()] };
  const run = (gifts) => E.estateAtDeath(cfg, { isa: 800000 }, { ...base, gifts });
  const none = run([]);
  ok('with no gifts the full allowance is available', near(none.nrb, 325000) && near(none.iht, 190000),
    `NRB £${Math.round(none.nrb).toLocaleString()}, IHT £${Math.round(none.iht).toLocaleString()}`);

  /*
   * The part people miss. A gift inside the allowance creates NO tax of its own - and still costs a
   * great deal, because it consumes the allowance the estate needed. The bill moves from the gift to
   * the estate, which is why "it was under £325,000 so it was fine" is wrong.
   */
  const g2 = run([{ amount: 300000, year: 2038 }]);
  ok('a £300k gift two years before death is itself untaxed', g2.gifts[0].tax === 0, `£${Math.round(g2.gifts[0].tax)}`);
  ok('but it eats the allowance', g2.nrb < 30000, `£${Math.round(g2.nrb).toLocaleString()} left`);
  ok('and the estate pays far more as a result', g2.iht > none.iht + 100000,
    `£${Math.round(none.iht).toLocaleString()} -> £${Math.round(g2.iht).toLocaleString()}`);

  // the seven-year cliff
  const g6 = run([{ amount: 300000, year: 2034 }]), g7 = run([{ amount: 300000, year: 2033 }]);
  ok('at six years it still counts', !g6.gifts[0].survived && g6.nrb < 30000);
  ok('at seven it drops out entirely', g7.gifts[0].survived && near(g7.nrb, 325000), `£${Math.round(g7.nrb).toLocaleString()}`);
  ok('and the bill returns to what it would have been', near(g7.iht, none.iht));

  // taper relief applies only ABOVE the allowance, which is the second misunderstanding
  const big4 = run([{ amount: 500000, year: 2036 }]);
  ok('a gift above the allowance is taxed on the excess only', near(big4.gifts[0].taxed, 500000 - 3000 - 325000),
    `£${Math.round(big4.gifts[0].taxed).toLocaleString()}`);
  ok('and taper reduces the rate by years elapsed', big4.gifts[0].ratePct === 24, `${big4.gifts[0].ratePct}%`);
  const big1 = run([{ amount: 500000, year: 2039 }]);
  ok('under three years there is no taper at all', big1.gifts[0].ratePct === 40, `${big1.gifts[0].ratePct}%`);
  ok('so a more recent gift of the same size costs more', big1.gifts[0].tax > big4.gifts[0].tax,
    `£${Math.round(big1.gifts[0].tax).toLocaleString()} vs £${Math.round(big4.gifts[0].tax).toLocaleString()}`);

  // allowance is consumed in the order the gifts were made
  const two = run([{ amount: 200000, year: 2035 }, { amount: 200000, year: 2039 }]);
  ok('the earlier gift takes the allowance first', two.gifts[0].year === 2035 && two.gifts[0].againstNrb > two.gifts[1].againstNrb,
    `£${Math.round(two.gifts[0].againstNrb).toLocaleString()} then £${Math.round(two.gifts[1].againstNrb).toLocaleString()}`);
  ok('and only the later one is taxed', two.gifts[0].tax === 0 && two.gifts[1].tax > 0);

  ok('the annual exemption is applied per gift', near(run([{ amount: 10000, year: 2038 }]).gifts[0].againstNrb, 7000));
  ok('a gift dated after death is ignored', run([{ amount: 100000, year: 2045 }]).gifts.length === 0);
  ok('a gift with no year is ignored rather than guessed', run([{ amount: 100000, year: '' }]).gifts.length === 0);
  ok('junk gift rows are repaired', E.normalizeGifts([{ amount: -5, year: 'x' }]).length === 1);

  // the death age drives the clock, which is the reason the tab prices several ages
  const early = E.estateAtDeath(cfg, { isa: 800000 }, { ...base, deathYear: 2036, gifts: [{ amount: 300000, year: 2034 }] });
  const late = E.estateAtDeath(cfg, { isa: 800000 }, { ...base, deathYear: 2042, gifts: [{ amount: 300000, year: 2034 }] });
  ok('the same gift costs nothing if you live long enough after it', late.gifts[0].survived && !early.gifts[0].survived);
  ok('and the difference in tax is the whole point', early.iht > late.iht,
    `£${Math.round(early.iht).toLocaleString()} vs £${Math.round(late.iht).toLocaleString()}`);
}

console.log('=========== H. THE GIFT THE APP SUGGESTS ===========');
{
  /*
   * The suggestion exists for one specific trap: above £2m the residence band is withdrawn £1 for every
   * £2, and the £2m test looks at what was OWNED AT DEATH - so a gift escapes that test immediately,
   * years before it escapes the estate itself. These check that the app only ever suggests the gift when
   * that mechanism is actually in play, and that it sizes it by what the gift does to THIS plan.
   */
  const base = { deathAge: 80, deathYear: 2040, homeValue: 400000, homeToDescendants: true, beneficiaries: [kid()] };

  const under = E.suggestGift(cfg, { isa: 1000000, cash: 200000 }, base);
  ok('no suggestion for an estate under £2m', under === null, String(under));

  const noHome = E.suggestGift(cfg, { isa: 2500000, cash: 200000 }, { ...base, homeValue: 0 });
  ok('no suggestion without a residence band to save', noHome === null, String(noHome));

  // £2.1m estate: £100k over, so £50k of band is being withdrawn. With no projection supplied the gift
  // simply leaves the estate, so the sum to give is the excess itself.
  const over = E.suggestGift(cfg, { isa: 1500000, cash: 200000 }, base);
  ok('gifts the excess when the gift is all that leaves', near(over.amount, 100000, 600), `£${Math.round(over.amount).toLocaleString()}`);
  ok('which restores half of it as allowance', near(over.bandRestored, 50000, 300), `£${Math.round(over.bandRestored).toLocaleString()}`);
  ok('and brings the estate back to the line', over.clearsLine === true && near(over.estateAfter, 2000000, 600),
    `£${Math.round(over.estateAfter).toLocaleString()}`);
  ok('the bill falls', over.taxAfter < over.taxBefore,
    `£${Math.round(over.taxBefore).toLocaleString()} -> £${Math.round(over.taxAfter).toLocaleString()}`);
  ok('the saving reported is the difference in tax', near(over.saving, over.taxBefore - over.taxAfter));
  ok('and it is flagged worthwhile', over.worthwhile === true);
  /*
   * The saving must survive the gift's OWN cost. Priced at the death year the gift has survived nothing,
   * so it eats £97k of the nil-rate band (£100k less the annual exemption) at 40% = £38,800 - against
   * £50k of restored band at 40% = £20,000. The net must therefore be the difference, not the gross.
   */
  ok('the gift is priced after it has eaten the nil-rate band', near(over.saving, 21200, 600),
    `£${Math.round(over.saving).toLocaleString()}`);

  /*
   * With a projection supplied the sizing changes completely: money given away also stops growing, and
   * spending that would have come from it comes out of the pension instead. Here each £1 given takes £2
   * off the estate by the death age, so half the excess does the job - and the app must find that by
   * searching the projection, not by subtracting the excess.
   */
  const wrappers = { isa: 1700000, cash: 400000 };            // £2.1m liquid + £400k home = £2.5m
  const doubles = (g) => {                                     // £1 given = £2 gone by death
    let drop = 2 * g; const w = { ...wrappers };
    for (const k of ['cash', 'other', 'isa']) {
      const take = Math.min(drop, w[k] || 0); w[k] = (w[k] || 0) - take; drop -= take;
    }
    return { ...w, survived: true };
  };
  const early = E.suggestGift(cfg, wrappers, { ...base, giftYear: 2030, liquidToday: { cash: 300000 }, project: doubles });
  ok('a gift that costs the estate £2 per £1 given is halved', near(early.amount, 250000, 100), `£${Math.round(early.amount).toLocaleString()}`);
  ok('and the rate it costs the estate is reported', near(early.costPerPound, 2, 0.01), early.costPerPound.toFixed(3));
  ok('that is enough to bring the whole band back', near(early.bandRestored, 175000, 200), `£${Math.round(early.bandRestored).toLocaleString()}`);
  ok('estate tax before: £2.5m less the £325k band at 40%', near(early.taxBefore, 870000), `£${Math.round(early.taxBefore).toLocaleString()}`);
  ok('estate tax after: £2m less £325k and £175k at 40%', near(early.taxAfter, 600000, 500), `£${Math.round(early.taxAfter).toLocaleString()}`);
  ok('ten years before death the gift is outside the estate', early.outsideEstate === true);

  /*
   * The same gift made two years before death is worth much less: it has not escaped the estate, so it
   * eats the nil-rate band. It still restores the residence band in full, because the £2m test looks at
   * what was owned at death and gifted money is not - which is the entire reason this is suggested.
   * And it is charged on the £250k given, never on the £500k the estate lost.
   */
  const late = E.suggestGift(cfg, wrappers, { ...base, giftYear: 2038, liquidToday: { cash: 300000 }, project: doubles });
  ok('a gift inside seven years still restores the band', near(late.bandRestored, 175000, 200), `£${Math.round(late.bandRestored).toLocaleString()}`);
  ok('but it consumes the allowance, so it saves less', late.saving < early.saving,
    `£${Math.round(late.saving).toLocaleString()} vs £${Math.round(early.saving).toLocaleString()}`);
  ok('and it is charged on what was given, not what it grew into', near(late.taxAfter, 698800, 800),
    `£${Math.round(late.taxAfter).toLocaleString()}`);
  ok('it is not treated as outside the estate', late.outsideEstate === false);

  // the cap is what is liquid TODAY, since that is when the money has to be handed over
  // £150k is all there is: £300k off the estate, which is not enough to clear the line but does bring
  // back £75k of the band (£2.2m is £200k over, so £100k of the £175k is still withdrawn)
  const capped = E.suggestGift(cfg, wrappers, { ...base, giftYear: 2030, liquidToday: { cash: 150000 }, project: doubles });
  ok('a gift is capped by today\'s liquid wealth', near(capped.amount, 150000), `£${Math.round(capped.amount).toLocaleString()}`);
  ok('and it says the line was not cleared', capped.clearsLine === false && capped.limitedBy === 'liquid', String(capped.limitedBy));
  ok('a partial gift restores part of the band, not all of it', near(capped.bandRestored, 75000, 200),
    `£${Math.round(capped.bandRestored).toLocaleString()}`);
  ok('and the certain part of the saving is separated out', near(capped.bandSaving, capped.bandRestored * 0.4, 1),
    `£${Math.round(capped.bandSaving).toLocaleString()} of £${Math.round(capped.saving).toLocaleString()}`);

  /*
   * A gift too small to bring any band back is not suggested at all. The estate is smaller for it, and
   * on these figures that scores as a saving - but that is the ordinary gift effect, it needs the seven
   * years, and presenting it as advice is the overreach this whole function is written to avoid.
   */
  const tiny = E.suggestGift(cfg, wrappers, { ...base, giftYear: 2030, liquidToday: { cash: 20000 }, project: doubles });
  ok('a gift that brings no band back is not suggested', tiny === null, String(tiny));

  /*
   * The constraint that matters more than the tax: a gift that leaves the household short is not worth
   * an allowance. Anything above £120k breaks this plan, so the suggestion must stop there and say why,
   * rather than recommending the £250k the tax arithmetic would like.
   */
  const fragile = (g) => ({ ...doubles(g), survived: g <= 120000 });
  const safe = E.suggestGift(cfg, wrappers, { ...base, giftYear: 2030, liquidToday: { cash: 300000 }, project: fragile });
  ok('a gift is never suggested past the point the plan breaks', safe.amount <= 120000 && safe.amount > 100000,
    `£${Math.round(safe.amount).toLocaleString()}`);
  ok('and solvency is named as the limit', safe.limitedBy === 'solvency' && safe.clearsLine === false, String(safe.limitedBy));

  // and if no affordable gift helps at all, there is no suggestion rather than a token one
  const broke = E.suggestGift(cfg, wrappers, { ...base, giftYear: 2030, liquidToday: { cash: 300000 }, project: (g) => ({ ...doubles(g), survived: g < 500 }) });
  ok('nothing is suggested when nothing is affordable', broke === null, String(broke));
}

console.log('=========== I. A PLANNED GIFT IS MONEY THAT LEAVES THE PLAN ===========');
{
  /*
   * A gift you have not made yet is spent twice over in the arithmetic if it only ever appears in the
   * estate: the projection would keep growing money that has gone. These check the year drives it, and
   * that a gift already made does NOT reduce a projection whose opening balances already exclude it.
   */
  const ZERO = { real: 0, unlucky: 0, lucky: 0, nominal: 0, volatility: 0, label: 'flat' };
  const mk = (gifts) => ({
    demographics: { planningMode: 'single', currentAgeSelf: 60, retireAgeSelf: 60, salarySelf: 0,
      statePensionAge: 99, privatePensionAge: 55, statePensionSelf: 0, terminalAge: 70 },
    spending: { targetSpend: 0, drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
    accounts: [
      { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 0, contrib: 0, growth: 0, risk: 'Cash Equivalents' },
      { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 0, contrib: 0, growth: 0, risk: 'Cash Equivalents' },
      { id: 'other_self', owner: 'Myself', category: E.CATEGORY_LABEL.other, balance: 0, contrib: 0, growth: 0, risk: 'Cash Equivalents' },
      { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 1000000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }],
    riskProfiles: { 'Cash Equivalents': ZERO },
    otherIncomes: [], oneOffContributions: [], oneOffCosts: [],
    config: { valuationDate: '2026-01-01' },
    inheritance: { gifts }
  });
  const terminal = (gifts) => {
    const c = E.buildContext(E.resolveMpaa(mk(gifts)));
    return E.evaluateRows(c, E.simulateDeterministic(c, 'expected')).terminalPot;
  };
  const none = terminal([]);
  ok('a flat plan with no gift keeps its £1m', near(none, 1000000, 5), `£${Math.round(none).toLocaleString()}`);
  const planned = terminal([{ id: 'g', amount: 200000, year: 2030 }]);
  ok('a planned gift leaves the plan in its year', near(planned, 800000, 5), `£${Math.round(planned).toLocaleString()}`);
  const past = terminal([{ id: 'g', amount: 200000, year: 2020 }]);
  ok('a gift already made does not reduce the projection again', near(past, 1000000, 5), `£${Math.round(past).toLocaleString()}`);
  const thisYear = terminal([{ id: 'g', amount: 200000, year: 2026 }]);
  ok('nor does one dated this year, whose money has already gone', near(thisYear, 1000000, 5), `£${Math.round(thisYear).toLocaleString()}`);
  const afterEnd = terminal([{ id: 'g', amount: 200000, year: 2099 }]);
  ok('a gift beyond the plan cannot be spent inside it', near(afterEnd, 1000000, 5), `£${Math.round(afterEnd).toLocaleString()}`);
}

console.log('=========== J. THE WILL AND THE NOMINATION ARE TWO DOCUMENTS ===========');
{
  /*
   * A pension does not pass under a will: it goes to whoever is on the scheme's nomination form. Since an
   * inherited pension is taxed at the RECIPIENT's rate, splitting the two is worth more than any other
   * choice on the tab - and a model that applied one set of shares to every wrapper could not say it.
   */
  const w = { pen: 600000, isa: 265000, other: 212000, cash: 60000 };
  const base = { deathAge: 84, deathYear: 2028, homeValue: 500000, homeToDescendants: true,
    transferredNrbPct: 100, transferredRnrbPct: 100 };
  const people = (over = {}) => ([
    { id: 'k1', name: 'Child A', relationship: 'descendant', sharePct: 40, income: 60000, ...(over.k1 || {}) },
    { id: 'k2', name: 'Child B', relationship: 'descendant', sharePct: 40, income: 45000, ...(over.k2 || {}) },
    { id: 'g1', name: 'Grandchild', relationship: 'descendant', sharePct: 20, income: 0, ...(over.g1 || {}) }
  ]);
  const flat = E.estateAtDeath(cfg, w, { ...base, beneficiaries: people() });
  ok('a blank pension share follows the will share', flat.beneficiaries.every(b => near(b.penSharePct, b.sharePct, 0.01)),
    flat.beneficiaries.map(b => `${Math.round(b.penSharePct)}%`).join('/'));

  const nominated = E.estateAtDeath(cfg, w, { ...base, beneficiaries: people({
    k1: { pensionSharePct: 0 }, k2: { pensionSharePct: 0 }, g1: { pensionSharePct: 100, spreadYears: 20 } }) });
  ok('the nomination moves the pension without moving the house', near(nominated.beneficiaries[2].penSharePct, 100) && near(nominated.beneficiaries[2].sharePct, 20),
    `${Math.round(nominated.beneficiaries[2].sharePct)}% of the will, ${Math.round(nominated.beneficiaries[2].penSharePct)}% of the pension`);
  ok('inheritance tax is unchanged by who gets what', near(nominated.iht, flat.iht, 1),
    `£${Math.round(flat.iht).toLocaleString()} vs £${Math.round(nominated.iht).toLocaleString()}`);
  ok('but the heirs keep more', nominated.netToBeneficiaries > flat.netToBeneficiaries,
    `£${Math.round(flat.netToBeneficiaries).toLocaleString()} -> £${Math.round(nominated.netToBeneficiaries).toLocaleString()} (+£${Math.round(nominated.netToBeneficiaries - flat.netToBeneficiaries).toLocaleString()})`);
  ok('because the income tax falls, not the estate tax', nominated.incomeTaxOnPensions < flat.incomeTaxOnPensions,
    `£${Math.round(flat.incomeTaxOnPensions).toLocaleString()} -> £${Math.round(nominated.incomeTaxOnPensions).toLocaleString()}`);
  ok('the children who gave up the pension still get their share of everything else',
    nominated.beneficiaries[0].gross > 0 && near(nominated.beneficiaries[0].pensionPart, 0),
    `£${Math.round(nominated.beneficiaries[0].gross).toLocaleString()} with £${Math.round(nominated.beneficiaries[0].pensionPart).toLocaleString()} of pension`);
  // on an estate too small to pay any tax the pension shares must add back to exactly the pension
  const small = E.estateAtDeath(cfg, { pen: 200000, cash: 50000 }, { ...base, homeValue: 0, beneficiaries: people({
    k1: { pensionSharePct: 70 }, k2: { pensionSharePct: 30 }, g1: { pensionSharePct: 0 } }) });
  ok('no tax due: the pension shares add back to the pension', near(small.iht, 0) &&
    near(small.beneficiaries.reduce((t, b) => t + b.pensionPart, 0), 200000, 1),
    `£${Math.round(small.beneficiaries.reduce((t, b) => t + b.pensionPart, 0)).toLocaleString()} shared out`);
  ok('and nobody who was not nominated receives any of it', near(small.beneficiaries[2].pensionPart, 0));

  // how long they draw it over is the other half of the same lever
  const slow = E.estateAtDeath(cfg, w, { ...base, beneficiaries: people({ g1: { spreadYears: 20 } }) });
  ok('a longer draw-down costs less tax', slow.beneficiaries[2].incomeTaxOnPension < flat.beneficiaries[2].incomeTaxOnPension,
    `£${Math.round(flat.beneficiaries[2].incomeTaxOnPension).toLocaleString()} over 5y -> £${Math.round(slow.beneficiaries[2].incomeTaxOnPension).toLocaleString()} over 20y`);
  ok('and the period is reported per person', slow.beneficiaries[2].spreadYears === 20 && slow.beneficiaries[0].spreadYears === cfg.inheritedPensionSpreadYears,
    `${slow.beneficiaries[2].spreadYears}y and ${slow.beneficiaries[0].spreadYears}y`);

  /*
   * The pre-2027 branch. A pension outside the estate for inheritance tax is still INHERITED, and still
   * taxed on the heir if death is at 75 or over - gating that on the 2027 date handed those heirs a
   * tax-free pot they never had.
   */
  const early = E.estateAtDeath(cfg, w, { ...base, deathYear: 2026, beneficiaries: people() });
  ok('a pre-2027 pension is outside the estate', early.pensionCounts === false && near(early.grossEstate, 1037000),
    `£${Math.round(early.grossEstate).toLocaleString()}`);
  ok('but the heirs still receive it', near(early.inheritedTotal, 1637000), `£${Math.round(early.inheritedTotal).toLocaleString()}`);
  ok('and still pay income tax on it at 75 or over', early.incomeTaxOnPensions > 0,
    `£${Math.round(early.incomeTaxOnPensions).toLocaleString()}`);
  const young = E.estateAtDeath(cfg, w, { ...base, deathAge: 70, deathYear: 2026, beneficiaries: people() });
  ok('death before 75 is free of it either way', young.incomeTaxOnPensions === 0);
  ok('dying before 2027 leaves more than dying after', early.netToBeneficiaries > flat.netToBeneficiaries,
    `£${Math.round(early.netToBeneficiaries).toLocaleString()} vs £${Math.round(flat.netToBeneficiaries).toLocaleString()}`);
}

console.log('=========== K. SELLING THE HOME, AND THE ANNUAL EXEMPTION ===========');
{
  const base = { deathAge: 84, deathYear: 2040, homeToDescendants: true, beneficiaries: [kid()] };
  const kept = E.estateAtDeath(cfg, { isa: 537000 }, { ...base, homeValue: 500000 });
  // the same wealth, with the house sold and the proceeds in the bank
  const sold = E.estateAtDeath(cfg, { isa: 537000, cash: 500000 }, { ...base, homeValue: 0 });
  ok('selling the home with no addition would lose the band', sold.rnrb === 0, String(sold.rnrb));
  const downsized = E.estateAtDeath(cfg, { isa: 537000, cash: 500000 }, { ...base, homeValue: 0, formerHomeValue: 500000 });
  ok('the downsizing addition keeps it', near(downsized.rnrb, 175000), `£${Math.round(downsized.rnrb).toLocaleString()}`);
  ok('and it is reported as an addition, not a home', near(downsized.rnrbFromDownsizing, 175000) && kept.rnrbFromDownsizing === 0);
  ok('so selling up to pay for care costs nothing in tax', near(downsized.iht, kept.iht),
    `£${Math.round(kept.iht).toLocaleString()} kept vs £${Math.round(downsized.iht).toLocaleString()} sold`);
  ok('the addition can never exceed the home that was sold',
    near(E.estateAtDeath(cfg, { isa: 537000, cash: 90000 }, { ...base, homeValue: 0, formerHomeValue: 90000 }).rnrb, 90000));
  /*
   * And it needs descendants to receive that much. A charity taking the whole estate cannot unlock a
   * band that exists only for direct descendants.
   */
  const toCharity = E.estateAtDeath(cfg, { isa: 537000, cash: 500000 },
    { ...base, homeValue: 0, formerHomeValue: 500000, beneficiaries: [{ id: 'c', name: 'Charity', relationship: 'charity', sharePct: 100 }] });
  ok('no descendants, no addition', toCharity.rnrb === 0, String(toCharity.rnrb));

  /*
   * The annual exemption is ONE allowance per tax year taken by the earliest gift, not a discount on
   * every gift. Applying it per gift quietly hands a household £3,000 of extra allowance per child.
   */
  const oneBig = E.estateAtDeath(cfg, { isa: 800000 }, { ...base, homeValue: 0, gifts: [{ amount: 30000, year: 2038 }] });
  const three = E.estateAtDeath(cfg, { isa: 800000 }, { ...base, homeValue: 0,
    gifts: [{ amount: 10000, year: 2038 }, { amount: 10000, year: 2038 }, { amount: 10000, year: 2038 }] });
  ok('three gifts in one year share one exemption', near(three.nrbUsedByGifts, oneBig.nrbUsedByGifts),
    `£${Math.round(three.nrbUsedByGifts).toLocaleString()} vs £${Math.round(oneBig.nrbUsedByGifts).toLocaleString()} for one gift of the same size`);
  ok('the earliest gift in the year takes it', near(three.gifts[0].exemptAmount, 3000) && three.gifts[1].exemptAmount === 0,
    `£${Math.round(three.gifts[0].exemptAmount).toLocaleString()} then £${Math.round(three.gifts[1].exemptAmount).toLocaleString()}`);
  const twoYears = E.estateAtDeath(cfg, { isa: 800000 }, { ...base, homeValue: 0,
    gifts: [{ amount: 10000, year: 2037 }, { amount: 10000, year: 2038 }] });
  ok('a new tax year brings a new exemption', near(twoYears.nrbUsedByGifts, 14000),
    `£${Math.round(twoYears.nrbUsedByGifts).toLocaleString()}`);
}

console.log('=========== L. GIFTS OUT OF INCOME ===========');
{
  /*
   * s.21: habitual, out of income, standard of living intact - exempt immediately, no seven years and no
   * allowance used. The arithmetic half of the test is what can be checked, and the binding year is the
   * leanest one, because the question is whether the gift could be repeated every year.
   */
  const ZERO = { real: 0, unlucky: 0, lucky: 0, nominal: 0, volatility: 0, label: 'flat' };
  const mk = (surplusGift) => E.normalizePlan({
    demographics: { planningMode: 'single', currentAgeSelf: 70, retireAgeSelf: 70, salarySelf: 0,
      statePensionAge: 66, privatePensionAge: 55, statePensionSelf: 12000, terminalAge: 75 },
    spending: { targetSpend: 20000, drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
    accounts: [
      { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 0, contrib: 0, growth: 0, risk: 'Cash Equivalents' },
      { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 0, contrib: 0, growth: 0, risk: 'Cash Equivalents' },
      { id: 'other_self', owner: 'Myself', category: E.CATEGORY_LABEL.other, balance: 0, contrib: 0, growth: 0, risk: 'Cash Equivalents' },
      { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 500000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }],
    riskProfiles: { 'Cash Equivalents': ZERO },
    // starts partway through, so the surplus genuinely varies and the leanest year is not the average
    otherIncomes: [{ id: 'db', name: 'DB pension', owner: 'Myself', startAge: 72, endAge: '', amount: 30000, incomeType: 'otherTaxable' }],
    oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' },
    inheritance: { surplusGift }
  });
  const terminal = (sg) => {
    const c = E.buildContext(E.resolveMpaa(mk(sg)));
    return E.evaluateRows(c, E.simulateDeterministic(c, 'expected')).terminalPot;
  };
  const none = terminal({ annual: '', fromYear: '', toYear: '' });
  const giving = terminal({ annual: 5000, fromYear: '', toYear: '' });
  ok('a regular gift leaves the plan every year it runs', near(none - giving, 5 * 5000, 5),
    `£${Math.round(none - giving).toLocaleString()} over five years`);
  const windowed = terminal({ annual: 5000, fromYear: 2029, toYear: 2030 });
  ok('and only in the years it runs', near(none - windowed, 2 * 5000, 5),
    `£${Math.round(none - windowed).toLocaleString()}`);
  ok('a gift dated in the past cannot be spent now', near(terminal({ annual: 5000, fromYear: 2000, toYear: 2020 }), none, 5));

  // it never enters the estate and never touches an allowance: that is the whole point of s.21
  const ctx = E.buildContext(E.resolveMpaa(mk({ annual: 5000, fromYear: '', toYear: '' })));
  const rows = E.simulateDeterministic(ctx, 'expected');
  const est = E.estateAtDeath(cfg, { cash: rows[rows.length - 1].cash },
    { deathAge: 75, deathYear: 2031, beneficiaries: [kid()], gifts: ctx.plan?.inheritance?.gifts });
  ok('and it uses no nil-rate band', est.nrbUsedByGifts === 0 && est.gifts.length === 0);

  const s = E.surplusIncome(rows);
  ok('the surplus is income less living costs', s && near(s.median, 16114, 200), `£${Math.round(s.median).toLocaleString()} at the median`);
  /*
   * The early years here are funded from capital, not income - the DB pension has not started - so there
   * is no surplus to give away out of income at all, however much is in the bank. Reporting a positive
   * figure from the good years would be the exact mistake the exemption is designed to catch.
   */
  ok('a year funded from capital has nothing to give', s.min < 0 && s.sustainable === 0,
    `£${Math.round(s.min).toLocaleString()} in the leanest year, sustainable £${s.sustainable}`);
  ok('measured on the leanest year, not the average', s.min < s.median, `£${Math.round(s.min).toLocaleString()} against a median of £${Math.round(s.median).toLocaleString()}`);
  ok('drawdown is not counted as income', s.median < 30000, `£${Math.round(s.median).toLocaleString()} against a £30,000 DB pension`);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
