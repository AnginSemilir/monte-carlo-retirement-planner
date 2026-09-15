/*
 * The safe-spend solver's one promise: the survival rate it PRINTS clears the target it was asked for.
 *
 * It used not to. The search bisected on 400 paths with `seed` and the reported figure came from 5,000
 * paths with `seed + 1` - a different draw entirely - so a "95% safe spend" was routinely a 92.6% one.
 * All twelve fixtures tested came back below target, every time, by 0.5 to 2.4 points.
 *
 * The bias is systematic rather than random, and that is the part worth keeping a test on. Bisecting on a
 * small sample picks, from the spends near the boundary, whichever one that sample happened to flatter.
 * Re-measure on a fresh sample and it regresses - always downward, because the selection was upward. So
 * the assertion here is one-sided on purpose: landing ABOVE target is fine (the £250 rounding guarantees
 * some overshoot), landing below is the defect.
 */
import * as E from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const GIA = 'Other Investments (e.g. GIA)';

const mk = (o = {}) => E.normalizePlan({
  demographics: {
    planningMode: 'single', currentAgeSelf: o.age ?? 45, retireAgeSelf: o.ret ?? 60, salarySelf: 65000,
    employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500, terminalAge: o.term ?? 90
  },
  spending: { targetSpend: o.spend ?? 34000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: o.pen ?? 600000, contrib: o.penC ?? 12000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: o.isa ?? 250000, contrib: o.isaC ?? 6000, growth: 3, risk: 'Medium/High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: o.gia ?? 80000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: o.cash ?? 40000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
  ],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' }
});

const FIX = [
  ['Normal', {}],
  ['Lean', { pen: 280000, isa: 90000, gia: 20000, cash: 20000, penC: 8000, isaC: 3000 }],
  ['Rich', { pen: 1200000, isa: 500000, gia: 200000, cash: 80000 }],
  ['Young saver', { age: 35, ret: 62, pen: 200000, isa: 80000, gia: 10000, cash: 20000 }]
];
const TARGETS = [85, 90, 95, 99];

console.log('=========== A. THE PROMISE: THE PRINTED RATE CLEARS THE TARGET ===========');
const solved = {};
for (const [name, o] of FIX) {
  for (const t of TARGETS) {
    const r = E.optimizeSpend(mk(o), { targetRate: t, seed: 12345 });
    solved[`${name}|${t}`] = r;
    // a zero answer is allowed only when the plan genuinely cannot clear the target at any spend
    const honest = r.spend > 0 ? r.successRate >= t : true;
    ok(`${name} @ ${t}%`, honest, `£${r.spend.toLocaleString()} -> ${r.successRate.toFixed(1)}%`);
  }
}

console.log('\n=========== B. THE ANSWER IS SELF-CONSISTENT ===========');
{
  // re-running the reported spend on the reported settings must reproduce the reported rate exactly:
  // that is what it means for the figure to have been measured on the sample it is quoted from
  for (const [name, o] of FIX) {
    const t = 90, r = solved[`${name}|${t}`];
    const check = E.monteCarlo(mk(o), { trials: 5000, seed: 12345, spendOverride: r.spend });
    ok(`${name}: quoted rate is reproducible`, Math.abs(check.successRate - r.successRate) < 1e-9,
      `quoted ${r.successRate.toFixed(2)}%, recomputed ${check.successRate.toFixed(2)}%`);
  }
}

console.log('\n=========== C. IT STILL FINDS A USEFUL ANSWER, NOT JUST A SAFE ONE ===========');
{
  // the guarantee would be trivially satisfiable by returning £0 every time, so check the spend is
  // substantial and that a harder target genuinely buys less income
  for (const [name] of FIX) {
    const s = TARGETS.map(t => solved[`${name}|${t}`].spend);
    ok(`${name}: a stricter target returns a lower spend`, s.every((v, i) => i === 0 || v <= s[i - 1]),
      TARGETS.map((t, i) => `${t}% £${s[i].toLocaleString()}`).join('  >=  '));
    ok(`${name}: the answer is non-trivial`, solved[`${name}|90`].spend > 5000, `£${solved[`${name}|90`].spend.toLocaleString()}`);
  }
  // and it should not be wildly conservative: within £250-rounding plus a little, not miles under
  for (const [name] of FIX) {
    const r = solved[`${name}|90`];
    ok(`${name}: not overshooting wildly at 90%`, r.successRate < 94, `${r.successRate.toFixed(1)}%`);
  }
}

console.log('\n=========== D. THE UNWINNABLE CASES ===========');
{
  const broke = E.optimizeSpend(mk({ pen: 0, isa: 0, gia: 0, cash: 0, penC: 0, isaC: 0 }), { targetRate: 95, seed: 12345 });
  ok('a plan with nothing saved returns zero spend', broke.spend === 0, `£${broke.spend}`);
  // a plan that cannot even fund a pre-access bridge at zero spend must say so rather than return a figure
  const bridge = E.optimizeSpend(mk({ ret: 45, pen: 400000, isa: 0, gia: 0, cash: 0, spend: 40000, oneOff: true }), { targetRate: 95, seed: 12345 });
  ok('an impossible bridge returns zero and explains itself', bridge.spend === 0 ? !!bridge.note : true,
    bridge.spend === 0 ? String(bridge.note) : `solved £${bridge.spend.toLocaleString()} at ${bridge.successRate.toFixed(1)}%`);
  ok('targetRate is echoed back for the UI to label with', solved['Normal|95'].targetRate === 95);
}

console.log('\n=========== SAFE RETIREMENT AGE ===========');
{
  const acct = (id, cat, bal, contrib, risk) => ({ id, owner: 'Myself', category: cat, balance: String(bal), contrib: String(contrib), growth: '', risk });
  const basePlan = {
    demographics: { planningMode: 'single', currentAgeSelf: '52', retireAgeSelf: '62', salarySelf: '70000',
      statePensionAge: 67, privatePensionAge: 58, statePensionSelf: '12548', terminalAge: 92, employmentSelf: 'employed' },
    spending: { targetSpend: '38000', decumulationPolicy: 'Bracket Fill Basic', drawdownStrategy: 'Phased Drawdown' },
    accounts: [acct('pen_self', 'Pensions', 480000, 9000, 'High Risk'), acct('isa_self', 'S&S ISAs', 160000, 4000, 'Medium/High Risk'),
      acct('other_self', 'Other Investments (e.g. GIA)', 70000, 0, 'Medium Risk'), acct('cash_self', 'Cash Savings', 30000, 0, 'Cash Equivalents')],
    otherIncomes: [
      { id: 'w', owner: 'Myself', startAge: '62', endAge: '65', amount: '15000', incomeType: 'earnings' },
      { id: 'db', owner: 'Myself', startAge: '65', endAge: '', amount: '9000', incomeType: 'otherTaxable' },
      { id: 'tf', owner: 'Myself', startAge: '70', endAge: '', amount: '3000', incomeType: 'taxFree' }
    ]
  };
  const norm = E.normalizePlan(basePlan);
  const inc = (p, id) => p.otherIncomes.find(x => x.id === id);

  // work travels with the retirement age; anything with a date of its own does not
  const later = E.shiftRetirement(norm, 3);
  ok('retiring later moves the retirement age', E.num(later.demographics.retireAgeSelf, 0) === 65);
  ok('and carries the earnings stream with it', E.num(inc(later, 'w').startAge, 0) === 65 && E.num(inc(later, 'w').endAge, 0) === 68);
  ok('but leaves a DB pension exactly where it was', E.num(inc(later, 'db').startAge, 0) === 65);
  ok('and leaves tax-free income alone too', E.num(inc(later, 'tf').startAge, 0) === 70);

  const earlier = E.shiftRetirement(norm, -4);
  ok('retiring earlier moves the earnings stream earlier', E.num(inc(earlier, 'w').startAge, 0) === 58 && E.num(inc(earlier, 'w').endAge, 0) === 61);
  ok('and still does not drag the DB pension earlier', E.num(inc(earlier, 'db').startAge, 0) === 65);

  // work already under way cannot be pushed back before today
  const running = E.normalizePlan({ ...basePlan,
    otherIncomes: [{ id: 'w', owner: 'Myself', startAge: '50', endAge: '62', amount: '15000', incomeType: 'earnings' }] });
  ok('a stream already running is not dragged before the owner\'s current age',
    E.num(inc(E.shiftRetirement(running, -6), 'w').startAge, 0) === 52);

  // a couple moves together, and the gap they planned between them survives
  const couple = E.normalizePlan({ ...basePlan,
    demographics: { ...basePlan.demographics, planningMode: 'couple', currentAgePart: '49', retireAgePart: '60', salaryPart: '40000' } });
  const shifted = E.shiftRetirement(couple, 4);
  ok('both retirement ages move by the same number of years',
    E.num(shifted.demographics.retireAgeSelf, 0) === 66 && E.num(shifted.demographics.retireAgePart, 0) === 64);
  ok('so the gap the household planned between them is preserved',
    E.num(shifted.demographics.retireAgeSelf, 0) - E.num(shifted.demographics.retireAgePart, 0) === 2);

  ok('a shift of zero returns the plan untouched', E.shiftRetirement(norm, 0) === norm);

  /*
   * The answer has to survive its own target. A few hundred paths pick the bracket and a full run has
   * to agree, or this repeats the defect the safe-spend solver once had - a "90%" answer that came
   * back at 88.4% when re-run. On this fixture the search says 91.0% at 58 and 2,000 paths say 88.75%,
   * so the answer must not be 58.
   */
  const r = E.safeRetirementAge(basePlan, { targetRate: 90, searchTrials: 400, finalTrials: 2000 });
  ok('an answer is found', r && r.age !== null, r && String(r.age));
  ok('and it holds the target when re-run at full precision', r.rate >= 90, r.rate.toFixed(2) + '%');
  ok('it is reported as verified', r.verified === true);
  ok('it is no later than the planned age', r.age <= 62, `${r.age} vs planned 62`);
  ok('and the curve rises with age', r.curve[r.curve.length - 1].rate >= r.curve[0].rate,
    `${r.curve[0].rate.toFixed(1)} -> ${r.curve[r.curve.length - 1].rate.toFixed(1)}`);
  ok('the binding constraint is named', typeof r.boundBy === 'string' && r.boundBy.length > 0, r.boundBy);

  // somebody already past their retirement age is told so rather than given a solve
  const done = E.safeRetirementAge({ ...basePlan,
    demographics: { ...basePlan.demographics, currentAgeSelf: '68', retireAgeSelf: '65' } }, { targetRate: 90, searchTrials: 200, finalTrials: 400 });
  ok('an already-retired plan says so instead of solving', done.alreadyRetired === true && done.age === null);

  // a target nothing can reach reports the best available rather than a false answer
  const impossible = E.safeRetirementAge({ ...basePlan, spending: { ...basePlan.spending, targetSpend: '250000' } },
    { targetRate: 99, searchTrials: 200, finalTrials: 400, maxYearsLater: 6 });
  ok('an unreachable target returns no age and says why', impossible.age === null && typeof impossible.note === 'string');
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
