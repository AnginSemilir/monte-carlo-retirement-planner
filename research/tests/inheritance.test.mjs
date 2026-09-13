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

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
