/*
 * PROPERTY SWEEP: things that must be true of every plan, checked on hundreds of random ones.
 *
 * The unit tests check answers that were worked out by hand. This checks PROPERTIES - money is conserved,
 * a relief never exceeds the bill, a search never returns something worse than what it started with -
 * across households nobody designed. Every bug found in this model so far was of that shape: a metric
 * measured on two different bases, money that vanished between two totals, a lever that could not fire.
 * None of them would have been caught by another hand-worked example.
 *
 * Deterministic: a fixed seed, so a failure can be reproduced by its case number.
 */
import * as E from '../engine.mjs';

let checked = 0, failed = 0;
const fails = new Map();
const bad = (rule, detail) => {
  failed++;
  if (!fails.has(rule)) fails.set(rule, []);
  if (fails.get(rule).length < 3) fails.get(rule).push(detail);
};
const must = (rule, cond, detail) => { checked++; if (!cond) bad(rule, detail); };
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;
const f = (x) => '£' + Math.round(x).toLocaleString();

// a small deterministic generator, so case 137 is always case 137
let seed = 20260913;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const money = (lo, hi) => Math.round((lo + rnd() * (hi - lo)) / 1000) * 1000;
const GIA = E.CATEGORY_LABEL.other;

const makePlan = (i) => {
  const age = 55 + Math.floor(rnd() * 30);
  const term = age + 5 + Math.floor(rnd() * 35);
  const couple = rnd() < 0.3;
  const heirs = 1 + Math.floor(rnd() * 3);
  const rels = ['descendant', 'descendant', 'descendant', 'other', 'spouse', 'charity'];
  const bens = [...Array(heirs)].map((_, k) => ({
    id: 'b' + k, name: 'H' + k, relationship: k === 0 ? 'descendant' : pick(rels),
    sharePct: Math.round(100 / heirs), income: pick([0, 0, 15000, 45000, 60000, 90000, 150000]),
    age: pick(['', 4, 22, 45, 55, 70]),
    pensionSharePct: rnd() < 0.25 ? Math.round(100 / heirs) : '',
    spreadYears: rnd() < 0.2 ? pick([1, 5, 10, 20]) : ''
  }));
  return {
    demographics: {
      planningMode: couple ? 'couple' : 'single', currentAgeSelf: age, currentAgePart: couple ? age - 2 : '',
      retireAgeSelf: Math.max(age, 55 + Math.floor(rnd() * 12)), retireAgePart: couple ? 62 : '',
      salarySelf: rnd() < 0.4 ? money(20000, 120000) : '', salaryPart: couple && rnd() < 0.4 ? money(20000, 80000) : '',
      employmentSelf: 'employed', employmentPart: 'employed',
      statePensionAge: 68, privatePensionAge: 58,
      statePensionSelf: pick([0, 11500, 11976]), statePensionPart: couple ? 11500 : '',
      terminalAge: term
    },
    spending: { targetSpend: money(15000, 90000), spendBands: [],
      drawdownStrategy: pick(['Phased Drawdown', 'Full 25% Lump Sum']),
      decumulationPolicy: pick(Object.keys(E.DECUMULATION_POLICIES)) },
    accounts: [
      { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: money(0, 1500000), contrib: rnd() < 0.4 ? money(0, 20000) : 0, growth: '', risk: pick(['High Risk', 'Medium Risk', 'Low Risk']) },
      { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: money(0, 600000), contrib: rnd() < 0.3 ? money(0, 20000) : 0, growth: '', risk: 'Medium Risk' },
      { id: 'other_self', owner: 'Myself', category: GIA, balance: money(0, 500000), contrib: 0, growth: '', risk: 'Medium Risk', unrealisedGain: rnd() < 0.5 ? money(0, 100000) : '' },
      { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: money(0, 300000), contrib: 0, growth: '', risk: 'Cash Equivalents' },
      ...(couple ? [
        { id: 'pen_part', owner: 'Partner', category: 'Pensions', balance: money(0, 800000), contrib: 0, growth: '', risk: 'Medium Risk' },
        { id: 'isa_part', owner: 'Partner', category: 'S&S ISAs', balance: money(0, 300000), contrib: 0, growth: '', risk: 'Medium Risk' }] : [])
    ],
    otherIncomes: rnd() < 0.3 ? [{ id: 'i1', name: 'DB', owner: 'Myself', startAge: 65, endAge: '', amount: money(3000, 30000), incomeType: pick(['otherTaxable', 'taxFree', 'earnings']) }] : [],
    oneOffContributions: [], oneOffCosts: [],
    config: { valuationDate: '2026-01-01', harvestCeiling: pick(['pa', 'basic']) },
    inheritance: {
      deathAge: Math.min(term, age + Math.floor(rnd() * (term - age + 1))),
      homeValue: rnd() < 0.7 ? money(0, 1200000) : '',
      homeToDescendants: rnd() < 0.85, homeSold: rnd() < 0.15, homeSaleAge: age + 5,
      transferredNrbPct: rnd() < 0.3 ? 100 : '', transferredRnrbPct: rnd() < 0.3 ? 100 : '',
      qsrInheritedValue: rnd() < 0.2 ? money(10000, 200000) : '', qsrTaxPaid: rnd() < 0.2 ? money(1000, 60000) : '',
      qsrYearsBefore: pick(['', 0, 2, 4]),
      compensationPayment: rnd() < 0.25 ? money(10000, 900000) : '',
      compensationDate: pick(['', '2026-02-01', '2019-05-01']),
      activeServiceExempt: rnd() < 0.05,
      gifts: rnd() < 0.3 ? [{ id: 'g1', amount: money(1000, 300000), year: 2020 + Math.floor(rnd() * 20), exemptCompensation: rnd() < 0.3 }] : [],
      surplusGift: rnd() < 0.2 ? { annual: money(500, 8000), fromYear: '', toYear: '' } : { annual: '', fromYear: '', toYear: '' },
      beneficiaries: bens
    }
  };
};

const CASES = Number(process.argv[2] || 250);
console.log(`sweeping ${CASES} random households\n`);

for (let i = 0; i < CASES; i++) {
  const raw = makePlan(i);
  const id = `case ${i}`;
  let plan, ctx, rows, ev, est;
  try {
    plan = E.normalizePlan(raw);
    ctx = E.buildContext(E.resolveMpaa(plan));
    rows = E.simulateDeterministic(ctx, 'expected');
    ev = E.evaluateRows(ctx, rows);
  } catch (err) { bad('the projection must not throw', `${id}: ${err.message}`); continue; }

  // ---- the projection
  must('no wrapper goes negative', rows.every(r => r.pensions >= -0.01 && r.isas >= -0.01 && r.other >= -0.01 && r.cash >= -0.01),
    `${id}: ${JSON.stringify(rows.find(r => r.pensions < -0.01 || r.isas < -0.01 || r.other < -0.01 || r.cash < -0.01) || {}).slice(0, 120)}`);
  must('the wrappers add up to the reported total', rows.every(r => near(r.pensions + r.isas + r.other + r.cash, r.totalCombined, 2)),
    `${id}`);
  must('every year is finite', rows.every(r => Number.isFinite(r.totalCombined) && Number.isFinite(r.taxPaid)), id);
  must('tax paid is never negative', rows.every(r => r.taxPaid >= -0.01 && r.cgtPaid >= -0.01), id);

  // ---- the estate
  const r = E.estateForPlanAt(plan, ctx, rows);
  if (!r) continue;
  est = r.est;
  const cfg = { ...E.DEFAULT_CONFIG, ...plan.config };
  must('inheritance tax is never negative', est.iht >= -0.01, `${id}: ${f(est.iht)}`);
  must('nor is the income tax on it', est.incomeTaxOnPensions >= -0.01, id);
  must('nor is what the heirs keep', est.netToBeneficiaries >= -0.01, `${id}: ${f(est.netToBeneficiaries)}`);
  must('the reliefs cannot exceed the bill', est.qsrRelief + est.compensationCredit <= est.ihtBeforeRelief + 0.5,
    `${id}: reliefs ${f(est.qsrRelief + est.compensationCredit)} against a bill of ${f(est.ihtBeforeRelief)}`);
  must('the bands are never negative', est.nrb >= -0.01 && est.rnrb >= -0.01, id);
  must('the residence band never exceeds its maximum',
    est.rnrb <= E.num(cfg.ihtRnrb, 175000) * 2 + 0.5, `${id}: ${f(est.rnrb)}`);
  must('the effective rate is a rate', est.effectiveRatePct >= -0.01 && est.effectiveRatePct <= 100.01,
    `${id}: ${est.effectiveRatePct.toFixed(1)}%`);
  /*
   * Conservation: everything the heirs are shown, plus every tax charged on it, has to add back to what
   * was there. This is the check that catches money quietly appearing or vanishing between two totals.
   */
  const shares = est.beneficiaries.reduce((t, b) => t + b.sharePct, 0);
  if (Math.abs(shares - 100) < 0.01) {
    must('what the heirs receive plus the tax equals the estate',
      near(est.netToBeneficiaries + est.iht + est.incomeTaxOnPensions, est.inheritedTotal, 2),
      `${id}: ${f(est.netToBeneficiaries)} + ${f(est.iht)} + ${f(est.incomeTaxOnPensions)} against ${f(est.inheritedTotal)}`);
    must('each beneficiary keeps what they got less their tax',
      est.beneficiaries.every(b => near(b.net, b.gross - b.ihtBorne - b.incomeTaxOnPension, 1)), id);
    must('the shares of the pension add to the pension',
      near(est.beneficiaries.reduce((t, b) => t + b.pensionPart, 0), est.pension - (est.pensionCounts ? est.iht * (est.pension / Math.max(1e-9, est.grossEstate)) : 0), Math.max(50, est.pension * 0.02)),
      `${id}`);
  }
  must('the inclusive total is the estate plus the lifetime gifts',
    near(est.netIncludingLifetimeGifts, est.netToBeneficiaries + est.giftsToHeirs, 1), id);
}
/*
 * PHASE 2: THE SEARCH. A search that returns something worse than it started with, or claims a gain it
 * cannot reproduce, is worse than no search. Fewer cases because each one runs sixty-odd projections.
 */
seed = 20260913;
const OPT_CASES = Number(process.argv[3] || 30);
console.log(`sweeping ${OPT_CASES} households through the optimiser`);
for (let i = 0; i < OPT_CASES; i++) {
  const raw = makePlan(i);
  let r;
  try { r = E.optimizeInheritance(raw); } catch (err) { bad('the optimiser must not throw', `case ${i}: ${err.message}`); continue; }
  if (!r) continue;
  const id = `case ${i}`;
  must('the search never returns something worse', r.best.net >= r.baseline.net - 1,
    `${id}: ${f(r.baseline.net)} -> ${f(r.best.net)}`);
  must('the gain is the difference it quotes', near(r.gain, r.best.net - r.baseline.net, 1), id);
  must('no lever is worth less than nothing', r.levers.every(l => l.gain >= -0.5),
    `${id}: ${r.levers.map(l => `${l.key}:${Math.round(l.gain)}`).join(' ')}`);
  must('no lever alone beats all of them together', r.levers.every(l => l.gain <= r.gain + 1),
    `${id}: ${r.levers.map(l => `${l.key}:${Math.round(l.gain)}`).join(' ')} against ${f(r.gain)}`);
  must('the ranking is in order', r.ranked.every((c, k) => k === 0 || r.ranked[k - 1].net >= c.net - 0.5), id);
  must('the winner tops the ranking', r.ranked.length === 0 || near(r.ranked[0].net, r.best.net, 1),
    `${id}: ${f(r.ranked[0] && r.ranked[0].net)} against ${f(r.best.net)}`);
  must('every lever says what it picked', r.levers.every(l => typeof l.pick === 'string' && l.pick.length > 0), id);

  /*
   * The round trip, which is the one that matters: rebuild the plan exactly as the Apply button does and
   * the figure quoted has to come back. A tab that promises a number the plan cannot reproduce is worse
   * than one that promises less.
   */
  const b = r.best;
  const rebuilt = E.normalizePlan({
    ...raw,
    spending: { ...raw.spending, decumulationPolicy: b.policy, drawdownStrategy: b.drawdown },
    config: { ...raw.config, harvestPersonalAllowance: b.harvest, harvestCeiling: b.ceiling || 'pa' },
    oneOffContributions: [...(raw.oneOffContributions || []), ...(b.recycle || [])],
    inheritance: {
      ...raw.inheritance,
      gifts: [...(raw.inheritance.gifts || []),
        ...(b.gift > 0 ? [{ id: 'gopt', amount: b.gift, year: r.giftYear }] : []),
        ...(b.compGift ? [b.compGift] : [])],
      beneficiaries: b.split
        ? E.normalizeBeneficiaries(raw.inheritance.beneficiaries).map((x, k) => ({ ...x, pensionSharePct: b.split[k] }))
        : raw.inheritance.beneficiaries
    }
  });
  const rctx = E.buildContext(E.resolveMpaa(rebuilt));
  const back = E.estateForPlanAt(rebuilt, rctx, E.simulateDeterministic(rctx, 'expected'));
  must('applying the winner reproduces the figure quoted', back && near(back.netWithGifts, b.net, 2),
    `${id}: rebuilt ${f(back && back.netWithGifts)} against quoted ${f(b.net)}`);
  const baseEv = E.evaluateRows(E.buildContext(E.resolveMpaa(E.normalizePlan(raw))), E.simulateDeterministic(E.buildContext(E.resolveMpaa(E.normalizePlan(raw))), 'expected'));
  if (baseEv.survived) {
    must('and never recommends a plan that runs dry',
      E.evaluateRows(rctx, E.simulateDeterministic(rctx, 'expected')).survived,
      `${id}: the winner fails where the plan as it stands does not`);
  }
  // the same plan twice must give the same answer
  const again = E.optimizeInheritance(raw);
  must('the search is deterministic', near(again.best.net, r.best.net, 0.01), id);
  // and the actions describe something
  const acts = E.estateActionPlan(E.normalizePlan(raw), r);
  must('there is always something to say', acts.length > 0 && acts.every(a => a.title && a.body), id);
}

/*
 * PHASE 3: THE TAX ENGINE. Cheap properties that would catch a band edit going in wrong.
 */
{
  const cfg = { ...E.DEFAULT_CONFIG };
  let prev = -1;
  for (let inc = 0; inc <= 300000; inc += 2500) {
    const t = E.incomeTax(inc, cfg);
    must('income tax never falls as income rises', t >= prev - 0.01, `at £${inc}: ${f(t)} after ${f(prev)}`);
    must('income tax never exceeds the income', t <= inc + 0.01, `at £${inc}: ${f(t)}`);
    must('income tax is never negative', t >= -0.01, `at £${inc}`);
    const m = E.marginalRateAt(inc, cfg);
    must('the marginal rate is a rate', m >= -0.01 && m <= 100.01, `at £${inc}: ${m}`);
    prev = t;
  }
  must('no tax on no income', E.incomeTax(0, cfg) === 0);
  must('no tax inside the personal allowance', E.incomeTax(E.num(cfg.personalAllowance, 12570), cfg) === 0);
  /*
   * Grossing up a pension contribution has to invert the relief it assumes: hand back the credit that
   * costs this much out of pocket. Checked at several salaries because the answer runs through the
   * personal-allowance taper, where the marginal rate is 60% and a naive inversion goes wrong.
   */
  const P = E.taxParams(cfg);
  for (const salary of [30000, 60000, 110000, 180000]) {
    for (const net of [1000, 8000, 25000]) {
      const credit = E.grossUpNet(net, salary, cfg);
      const cost = E.calculateMarginalRelief(salary, credit, P).netCost;
      must('grossing a contribution up inverts its net cost', near(cost, net, Math.max(2, net * 0.01)),
        `salary ${f(salary)}, wanted ${f(net)} of cost, got ${f(cost)} for a ${f(credit)} contribution`);
    }
  }
  // an inherited pension: more income never means less tax, and never more tax than the pot
  for (const inc of [0, 20000, 60000, 150000]) {
    for (const pot of [10000, 100000, 500000]) {
      const t = E.inheritedPensionTax(pot, inc, cfg, 5);
      must('an inherited pension is never taxed above its own value', t <= pot + 0.01, `${f(pot)} at ${f(inc)}: ${f(t)}`);
      must('and never negatively', t >= -0.01, `${f(pot)} at ${f(inc)}`);
      must('a longer draw-down never costs more', E.inheritedPensionTax(pot, inc, cfg, 20) <= t + 0.01,
        `${f(pot)} at ${f(inc)}: 20y ${f(E.inheritedPensionTax(pot, inc, cfg, 20))} against 5y ${f(t)}`);
    }
  }
}

/*
 * PHASE 4: THE SIMULATION AND THE OTHER SEARCHES. Percentiles that cross over, a safe spend that misses
 * the rate it was solved for, or a tournament that quietly hands one strategy more money than another
 * are all failures nobody would spot by reading a number on screen.
 */
seed = 987654321;
const MC_CASES = Number(process.argv[4] || 12);
console.log(`sweeping ${MC_CASES} households through the simulation`);
for (let i = 0; i < MC_CASES; i++) {
  const raw = makePlan(i);
  const id = `case ${i}`;
  let plan, ctx, stats;
  try {
    plan = E.normalizePlan(raw);
    ctx = E.buildContext(E.resolveMpaa(plan));
    stats = E.monteCarlo(ctx, { trials: 300, seed: 42 });
  } catch (err) { bad('the simulation must not throw', `${id}: ${err.message}`); continue; }

  must('the survival rate is a rate', stats.successRate >= -0.01 && stats.successRate <= 100.01,
    `${id}: ${stats.successRate}`);
  must('the percentiles are in order', stats.p10Terminal <= stats.medianTerminal + 1 && stats.medianTerminal <= stats.p90Terminal + 1,
    `${id}: ${f(stats.p10Terminal)} / ${f(stats.medianTerminal)} / ${f(stats.p90Terminal)}`);
  must('no percentile is negative', stats.p10Terminal >= -0.01, `${id}: ${f(stats.p10Terminal)}`);
  must('the same seed gives the same answer',
    near(E.monteCarlo(ctx, { trials: 300, seed: 42 }).successRate, stats.successRate, 0.001), id);
  /*
   * Spending more can never improve survival. This is the property that would catch a drawdown order
   * quietly funding a shortfall from somewhere it should not.
   */
  const richer = E.buildContext(E.resolveMpaa(E.normalizePlan({ ...raw,
    spending: { ...raw.spending, targetSpend: E.num(raw.spending.targetSpend, 0) * 1.5 } })));
  must('spending half as much again never survives better',
    E.monteCarlo(richer, { trials: 300, seed: 42 }).successRate <= stats.successRate + 0.01,
    `${id}: ${stats.successRate}% -> ${E.monteCarlo(richer, { trials: 300, seed: 42 }).successRate}%`);
  // and more money can never survive worse
  const wealthier = E.buildContext(E.resolveMpaa(E.normalizePlan({ ...raw,
    accounts: raw.accounts.map(a => ({ ...a, balance: E.num(a.balance, 0) * 1.5 })) })));
  must('half as much again in the bank never survives worse',
    E.monteCarlo(wealthier, { trials: 300, seed: 42 }).successRate >= stats.successRate - 0.01,
    `${id}: ${stats.successRate}% -> ${E.monteCarlo(wealthier, { trials: 300, seed: 42 }).successRate}%`);
}

/*
 * pickBest: the ranking the whole tournament rests on. It must return one of the candidates it was given,
 * and it must never hand back a big pot bought with a survival sacrifice the guard is there to refuse.
 */
{
  seed = 5150;
  for (let i = 0; i < 200; i++) {
    const n = 2 + Math.floor(rnd() * 5);
    const cands = [...Array(n)].map((_, k) => ({
      id: 'c' + k,
      stats: { successRate: Math.round(rnd() * 1000) / 10, p10Terminal: money(0, 2000000),
        medianTerminal: money(0, 4000000), preNmpaFailRate: Math.round(rnd() * 100) / 10 }
    }));
    const best = E.pickBest(cands);
    must('the pick is one of the candidates', cands.some(c => c.id === best.id), `case ${i}`);
    const top = Math.max(...cands.map(c => c.stats.successRate));
    must('the survival guard is respected',
      best.stats.successRate >= top - E.MAX_SURVIVAL_SACRIFICE_PTS - 0.001,
      `case ${i}: picked ${best.stats.successRate}% when ${top}% was available`);
  }
}

/*
 * PHASE 5: THE SAFE SPEND, AND THE BACKTEST. The safe spend is solved for a target survival rate, so the
 * one thing it must never do is come back below it - a plan that says "spend this and you have a 90%
 * chance" when the answer is 84% is worse than no answer. The backtest has to survive every start year
 * in the record without throwing or inventing money.
 */
seed = 31415926;
const SS_CASES = Number(process.argv[5] || 6);
console.log(`sweeping ${SS_CASES} households through the safe-spend solver and the backtest`);
for (let i = 0; i < SS_CASES; i++) {
  const raw = makePlan(i);
  const id = `case ${i}`;
  let ctx;
  try { ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(raw))); }
  catch (err) { bad('the context must build', `${id}: ${err.message}`); continue; }

  for (const target of [80, 90]) {
    let out;
    try { out = E.optimizeSpend(ctx, { targetRate: target, seed: 7, searchTrials: 200, finalTrials: 600 }); }
    catch (err) { bad('the safe-spend solver must not throw', `${id}: ${err.message}`); continue; }
    must('the safe spend is never negative', out.spend >= -0.01, `${id}: ${f(out.spend)}`);
    /*
     * Solved on one set of paths and reported on another, so a small miss is sampling rather than error.
     * Two points of slack on 600 trials is about one standard error; a real failure is far bigger.
     */
    must('the safe spend meets the rate it was solved for',
      out.spend === 0 || out.successRate >= target - 2.5,
      `${id}: asked for ${target}%, got ${out.successRate}% at ${f(out.spend)}`);
    must('and spending more than it would do worse', out.spend === 0 ||
      E.monteCarlo(ctx, { trials: 600, seed: 7, spendOverride: out.spend * 1.25 }).successRate <= out.successRate + 0.01,
      `${id} at ${target}%`);
  }

  for (const start of [E.HISTORICAL_FIRST_YEAR, 1972, 1999, E.HISTORICAL_LAST_YEAR - 1]) {
    let hrows;
    try { hrows = E.simulateHistorical(ctx, start); }
    catch (err) { bad('the backtest must not throw', `${id} from ${start}: ${err.message}`); continue; }
    must('the backtest runs the whole plan', hrows.length === ctx.totalYears + 1, `${id} from ${start}: ${hrows.length}`);
    must('no wrapper goes negative in the backtest',
      hrows.every(r => r.pensions >= -0.01 && r.isas >= -0.01 && r.other >= -0.01 && r.cash >= -0.01), `${id} from ${start}`);
    must('and every year is a number', hrows.every(r => Number.isFinite(r.totalCombined)), `${id} from ${start}`);
    const hv = E.evaluateRows(ctx, hrows);
    must('a backtest that fails names the year it failed',
      hv.survived || (Number.isFinite(hv.failAge) && hv.failAge > 0), `${id} from ${start}`);
  }
}

console.log(`${checked} checks, ${failed} failures\n`);
for (const [rule, examples] of fails) console.log(`FAIL  ${rule}\n      ${examples.join('\n      ')}`);
process.exit(failed ? 1 : 0);
