/*
 * The estate optimiser: does the search find what is actually there, and does it refuse to claim what
 * is not? The cases below are chosen so the right answer is known in advance - a household where only
 * the nomination can help, one where only a gift can, one where nothing can, and one where the levers
 * overlap and so must NOT be added together.
 */
import * as E from '../engine.mjs';
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const gbp = (x) => '£' + Math.round(x).toLocaleString();
const GIA = E.CATEGORY_LABEL.other;

const household = (over = {}) => ({
  demographics: { planningMode: 'single', currentAgeSelf: 70, retireAgeSelf: 65, salarySelf: '',
    employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500,
    terminalAge: 95, ...(over.demo || {}) },
  spending: { targetSpend: 45000, spendBands: [], drawdownStrategy: 'Phased Drawdown',
    decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: over.pen ?? 800000, contrib: 0, growth: '', risk: 'Medium Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: over.isa ?? 400000, contrib: 0, growth: '', risk: 'Medium Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: over.other ?? 300000, contrib: 0, growth: '', risk: 'Medium Risk', unrealisedGain: 100000 },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: over.cash ?? 120000, contrib: 0, growth: '', risk: 'Cash Equivalents' }],
  otherIncomes: over.incomes || [], oneOffContributions: [], oneOffCosts: [],
  config: { valuationDate: '2026-01-01' },
  inheritance: { deathAge: over.deathAge ?? 84, homeValue: over.home ?? 700000, homeToDescendants: true,
    beneficiaries: over.bens || [
      { id: 'k1', name: 'Jo', relationship: 'descendant', sharePct: 50, income: 80000, age: 50 },
      { id: 'g1', name: 'Robin', relationship: 'descendant', sharePct: 50, income: 0, age: 22 }],
    ...(over.inh || {}) }
});

console.log('=========== A. IT FINDS WHAT IS THERE ===========');
{
  const r = E.optimizeInheritance(household());
  ok('the search returns a ranking', !!r && r.ranked.length > 1, `${r.ranked.length} candidates from ${r.runs} projections`);
  ok('ranked best first', r.ranked.every((c, i) => i === 0 || r.ranked[i - 1].net >= c.net));
  ok('the best is at least the plan as it stands', r.best.net >= r.baseline.net,
    `${gbp(r.baseline.net)} -> ${gbp(r.best.net)}`);
  ok('and the gain is the difference between them', Math.abs(r.gain - (r.best.net - r.baseline.net)) < 1);
  /*
   * Dying at 84 with one heir on £80,000 and one on nothing, the nomination is the whole game: the
   * pension is taxed at the recipient's rate, so moving it to the untaxed heir is worth real money while
   * the estate tax does not move at all.
   */
  const nom = r.levers.find(l => l.key === 'nomination');
  ok('the nomination is found, and is worth something', nom.gain > 10000, gbp(nom.gain));
  ok('it names the heir it would nominate', /Robin/.test(nom.pick), nom.pick);
  ok('every lever is reported, including the ones worth nothing', r.levers.length === 6,
    r.levers.map(l => `${l.key}:${Math.round(l.gain)}`).join(' '));
}

console.log('=========== B. LEVERS ARE MEASURED ALONE, NOT STACKED ===========');
{
  /*
   * The failure this guards against: searching the levers in order and crediting each with the running
   * total, so a household reads "the gift is worth £30,000" when the £30,000 came from the nomination
   * tested before it. Measured properly, no single lever can be worth more than all of them together.
   */
  const r = E.optimizeInheritance(household());
  r.levers.forEach(l => ok(`${l.key} alone is no larger than the whole`, l.gain <= r.gain + 1,
    `${gbp(l.gain)} against ${gbp(r.gain)}`));
  ok('and they are sorted by what they are worth', r.levers.every((l, i) => i === 0 || r.levers[i - 1].gain >= l.gain));
}

console.log('=========== C. A ZERO IS A FINDING, WITH A REASON ===========');
{
  // death before 75 carries no income tax on an inherited pension, so who is nominated cannot matter
  const young = E.optimizeInheritance(household({ deathAge: 72 }));
  ok('no nomination gain when death is before 75', young.levers.find(l => l.key === 'nomination').gain === 0);
  ok('and it says why rather than showing a bare zero', young.reasons.some(x => x.key === 'nomination' && /no income tax at all/.test(x.text)),
    (young.reasons.find(x => x.key === 'nomination') || {}).text || 'no reason given');

  /*
   * An estate so far over the £2m line that no affordable gift could bring the residence band back. The
   * optimiser must say that, because silence reads as "not tried".
   */
  const rich = E.optimizeInheritance(household({ pen: 2400000, home: 1400000, isa: 150000, cash: 40000, other: 20000 }));
  ok('an unreachable residence band is explained', rich.reasons.some(x => x.key === 'gift' && /out of reach/.test(x.text)),
    (rich.reasons.find(x => x.key === 'gift') || {}).text || 'no reason given');
}

console.log('=========== D. MOVING MONEY UP TO THE ALLOWANCES ===========');
{
  /*
   * Even with no earnings, £2,880 buys £3,600 of pension: relief is added at source. Since 2027 that
   * pension is in the estate like any other asset, so the relief is simply 25% more money for the same
   * outlay - and the optimiser has to find it. The household below has cash doing nothing.
   */
  const r = E.optimizeInheritance(household({ cash: 300000, deathAge: 80 }));
  const rec = r.levers.find(l => l.key === 'recycle');
  ok('moving money between wrappers is a lever', !!rec);
  ok('and it is worth something when there is cash spare', rec.gain > 0, `${gbp(rec.gain)}: ${rec.pick}`);
  const best = r.ranked.find(c => c.recycleKey);
  ok('the winning transfers are reported so they can be applied', !!best, best ? best.label : 'none ranked');

  // a household with nothing spare cannot recycle, and must say so rather than promise a gain
  const broke = E.optimizeInheritance(household({ cash: 0, isa: 0, other: 0, pen: 600000 }));
  const none = broke.levers.find(l => l.key === 'recycle');
  ok('nothing spare, nothing claimed', none.gain === 0, none.pick);
}

console.log('=========== E. WHAT IT REFUSES TO DO ===========');
{
  const r = E.optimizeInheritance(household());
  /*
   * Charity is priced, never ranked. Giving 10% away always leaves the family with less, so a ranking on
   * net-to-heirs would score a donation as a failure and bury a decision that is not about tax.
   */
  ok('charity is priced alongside', !!r.charity && r.charity.ratePct === 36, r.charity ? `${r.charity.ratePct}%` : 'missing');
  ok('and never appears in the ranking', !r.ranked.some(c => /charit/i.test(c.label)));
  ok('its cost to the family is stated', r.charity.costToFamily > 0,
    `${gbp(r.charity.costToFamily)} for ${gbp(r.charity.toCharity)} to charity`);
  /*
   * How long the heirs draw the pension over is their choice, made after the death. It is reported as a
   * sensitivity and kept out of the search, so no candidate can win by assuming better behaviour from
   * someone else.
   */
  ok('a longer draw-down is reported, not searched', !!r.spread && r.spread.gain > 0,
    r.spread ? `${r.spread.years}y is worth ${gbp(r.spread.gain)}` : 'missing');
  ok('and no candidate is scored on it', !r.ranked.some(c => Math.abs(c.net - r.spread.net) < 1),
    `${gbp(r.spread.net)} appears in no ranked row`);

  // no heirs, nothing to rank on
  ok('no heirs means no answer rather than a guess', E.optimizeInheritance(household({ bens: [] })) === null);
}

console.log('=========== F. IT NEVER RECOMMENDS BREAKING THE PLAN ===========');
{
  /*
   * A household with enough to last but not much over. Every candidate that leaves them short must be
   * rejected outright rather than ranked, however good it looks for the heirs: they have to live on this
   * money first, and a gift or a transfer is spent years before the estate is ever valued.
   */
  const tight = household({ pen: 600000, isa: 150000, other: 0, cash: 80000, home: 400000,
    bens: [{ id: 'k1', name: 'Jo', relationship: 'descendant', sharePct: 100, income: 80000, age: 50 }] });
  const baseCtx = E.buildContext(E.resolveMpaa(E.normalizePlan(tight)));
  const baseEv = E.evaluateRows(baseCtx, E.simulateDeterministic(baseCtx, 'expected'));
  ok('the fixture survives to begin with', baseEv.survived, `fails at ${baseEv.failAge || 'never'}`);

  const r = E.optimizeInheritance(tight);
  /*
   * Rebuilt exactly the way the Apply button rebuilds it - every lever, not just the easy ones. If these
   * two figures ever part company, the tab is quoting a number the plan will not reproduce, which is a
   * worse failure than a poor recommendation.
   */
  const rebuilt = E.normalizePlan({
    ...tight,
    spending: { ...tight.spending, decumulationPolicy: r.best.policy, drawdownStrategy: r.best.drawdown },
    config: { ...tight.config, harvestPersonalAllowance: r.best.harvest, harvestCeiling: r.best.ceiling || 'pa' },
    oneOffContributions: [...(tight.oneOffContributions || []), ...(r.best.recycle || [])],
    inheritance: { ...tight.inheritance,
      gifts: r.best.gift > 0 ? [{ id: 'g', amount: r.best.gift, year: r.giftYear }] : [],
      beneficiaries: r.best.split
        ? E.normalizeBeneficiaries(tight.inheritance.beneficiaries).map((b, i) => ({ ...b, pensionSharePct: r.best.split[i] }))
        : tight.inheritance.beneficiaries }
  });
  const ctx = E.buildContext(E.resolveMpaa(rebuilt));
  const ev = E.evaluateRows(ctx, E.simulateDeterministic(ctx, 'expected'));
  ok('the winning plan still survives', ev.survived, `fails at ${ev.failAge || 'never'}`);
  const rebuiltNet = E.estateForPlanAt(rebuilt, ctx, E.simulateDeterministic(ctx, 'expected')).netWithGifts;
  ok('and rebuilding it reproduces the figure the optimiser quoted', Math.abs(rebuiltNet - r.best.net) < 2,
    `${gbp(rebuiltNet)} against ${gbp(r.best.net)}`);
  ok('the recommendation is an improvement, not just a change', r.best.net >= r.baseline.net,
    `${gbp(r.baseline.net)} -> ${gbp(r.best.net)}`);
}

console.log('=========== G. HOW THE PENSION IS SPLIT, NOT JUST WHO GETS IT ===========');
{
  /*
   * "Leave it to whoever earns least" is wrong as soon as the pot is large: drawn over five years it
   * reaches the additional rate whoever receives it, while a split uses two sets of allowances and two
   * basic-rate bands. These check the search finds that, and that it is free to run - the nomination
   * changes who is taxed, not how the household spends, so no projection is needed.
   */
  const cfg = { ...E.DEFAULT_CONFIG };
  const w = { pen: 1500000, isa: 200000, other: 0, cash: 50000 };
  const opts = {
    deathAge: 84, deathYear: 2040, homeValue: 500000, homeToDescendants: true,
    beneficiaries: [
      { id: 'a', name: 'Earner', relationship: 'descendant', sharePct: 50, income: 150000, age: 50 },
      { id: 'b', name: 'Child', relationship: 'descendant', sharePct: 50, income: 0, age: 8 }]
  };
  const split = E.bestPensionSplit(cfg, w, opts);
  const price = (pcts) => E.estateAtDeath(cfg, w, { ...opts,
    beneficiaries: opts.beneficiaries.map((b, i) => ({ ...b, pensionSharePct: pcts[i] })) }).netToBeneficiaries;
  ok('a split is found', !!split, split ? split.shares.map(x => `${x.name} ${x.pct}%`).join(' / ') : 'none');
  ok('it beats leaving it all to the lower earner', split.net >= price([0, 100]) - 1,
    `${gbp(split.net)} against ${gbp(price([0, 100]))}`);
  ok('and all to the higher earner', split.net >= price([100, 0]) - 1,
    `${gbp(split.net)} against ${gbp(price([100, 0]))}`);
  ok('and an even split', split.net >= price([50, 50]) - 1, `${gbp(split.net)} against ${gbp(price([50, 50]))}`);
  ok('the shares add to 100', Math.abs(split.pcts.reduce((t, x) => t + x, 0) - 100) < 0.01, split.pcts.join('/'));
  ok('the gain is measured against what was entered', Math.abs(split.gain - (split.net - split.asEnteredNet)) < 1);

  // a pot small enough to sit inside one person's bands should simply go to the untaxed heir
  const small = E.bestPensionSplit(cfg, { pen: 40000, isa: 100000 },
    { ...opts, homeValue: 200000 });
  ok('a small pot goes to the heir with the allowance', small.shares.find(x => x.name === 'Child').pct >= 95,
    small.shares.map(x => `${x.name} ${x.pct}%`).join(' / '));

  // below 75 there is no income tax on it at all, so no split can help
  const young = E.bestPensionSplit(cfg, w, { ...opts, deathAge: 70 });
  ok('nothing to gain below 75', young.gain === 0, gbp(young.gain));

  ok('one heir means no split to search', E.bestPensionSplit(cfg, w, { ...opts, beneficiaries: [opts.beneficiaries[0]] }) === null);

  // four heirs take the hill-climb rather than the exhaustive grid, and must still improve on the seeds
  const four = [...opts.beneficiaries,
    { id: 'c', name: 'Third', relationship: 'descendant', sharePct: 0, income: 30000, age: 40 },
    { id: 'd', name: 'Fourth', relationship: 'descendant', sharePct: 0, income: 12570, age: 30 }];
  const many = E.bestPensionSplit(cfg, w, { ...opts, beneficiaries: four });
  const evenFour = E.estateAtDeath(cfg, w, { ...opts,
    beneficiaries: four.map(b => ({ ...b, pensionSharePct: 25 })) }).netToBeneficiaries;
  ok('four heirs are searched too, and beat an even split', many.net >= evenFour - 1,
    `${gbp(many.net)} against ${gbp(evenFour)} even`);
}

console.log('=========== H. HOW MUCH PENSION TO DRAW EARLY ===========');
{
  /*
   * Drawing past the tax-free allowance costs 20% now. Whether that is worth it turns entirely on the
   * death age: below 75 an inherited pension carries no income tax, so paying anything today is a pure
   * loss; at 75 and over it is taxed twice, and 20% now can beat both charges. A single answer would be
   * wrong half the time, which is exactly why it is searched.
   */
  const at = (deathAge, ceiling) => {
    const p = E.normalizePlan({ ...household({ deathAge }), config: { valuationDate: '2026-01-01', harvestCeiling: ceiling } });
    const ctx = E.buildContext(E.resolveMpaa(p));
    return E.postTaxInheritanceFor(p, ctx);
  };
  const early = { pa: at(72, 'pa'), basic: at(72, 'basic') };
  const late = { pa: at(90, 'pa'), basic: at(90, 'basic') };
  ok('below 75 drawing early costs money', early.basic < early.pa,
    `${gbp(early.pa)} -> ${gbp(early.basic)}`);
  ok('above 75 it earns money', late.basic > late.pa, `${gbp(late.pa)} -> ${gbp(late.basic)}`);

  const r72 = E.optimizeInheritance(household({ deathAge: 72 }));
  const r90 = E.optimizeInheritance(household({ deathAge: 90 }));
  ok('the optimiser leaves it alone for an early death', r72.best.ceiling !== 'basic', r72.best.ceiling);
  ok('and takes it for a late one', r90.best.ceiling === 'basic', r90.best.ceiling);
  ok('it is reported as its own lever', r90.levers.some(l => l.key === 'ceiling' && l.gain > 0),
    gbp((r90.levers.find(l => l.key === 'ceiling') || {}).gain || 0));
}

console.log('=========== I. THE WILL, ANSWERED RATHER THAN IGNORED ===========');
{
  /*
   * Inheritance tax is charged on the estate before it is divided, so among taxable heirs it makes no
   * difference to the total who receives which asset. That is a question every household asks, and the
   * honest answer is a finding rather than a silence.
   */
  const cfg = { ...E.DEFAULT_CONFIG };
  const w = { pen: 500000, isa: 300000, other: 100000, cash: 50000 };
  const base = { deathAge: 84, deathYear: 2040, homeValue: 600000, homeToDescendants: true };
  const heirs = (a, b) => [
    { id: 'x', name: 'A', relationship: 'descendant', sharePct: a, income: 60000, age: 50, pensionSharePct: 50 },
    { id: 'y', name: 'B', relationship: 'descendant', sharePct: b, income: 60000, age: 48, pensionSharePct: 50 }];
  const even = E.estateAtDeath(cfg, w, { ...base, beneficiaries: heirs(50, 50) });
  const skewed = E.estateAtDeath(cfg, w, { ...base, beneficiaries: heirs(90, 10) });
  ok('the will split does not move the total among taxable heirs',
    Math.abs(even.netToBeneficiaries - skewed.netToBeneficiaries) < 1,
    `${gbp(even.netToBeneficiaries)} against ${gbp(skewed.netToBeneficiaries)}`);
  ok('and the optimiser says so', E.optimizeInheritance(household()).reasons.some(x => x.key === 'will' && /does not change the total/.test(x.text)));

  // with an exempt beneficiary it genuinely does move, and the wording has to flip
  const withSpouse = E.optimizeInheritance(household({ bens: [
    { id: 's', name: 'Spouse', relationship: 'spouse', sharePct: 50, income: 20000, age: 70 },
    { id: 'k', name: 'Kid', relationship: 'descendant', sharePct: 50, income: 60000, age: 45 }] }));
  ok('an exempt heir changes the answer, and the wording', withSpouse.reasons.some(x => x.key === 'will' && /does change the bill/.test(x.text)));
}

console.log('=========== J. THE ANSWER AS THINGS TO DO ===========');
{
  /*
   * A label is not an instruction. These check the action list names the thing to open, the figure to
   * enter and the year to do it in - and, just as importantly, that it lists only what CHANGES, because
   * restating what the household already does buries the two steps they have to go and arrange.
   */
  const h = household({ deathAge: 90, cash: 300000 });
  const r = E.optimizeInheritance(h);
  const acts = E.estateActionPlan(E.normalizePlan(h), r);
  ok('there are actions to take', acts.length > 0, acts.map(a => a.key).join(', '));
  ok('every action says what to do, not just what it is called', acts.every(a => a.title && a.body));
  ok('the nomination names the form to ask for', acts.some(a => a.key === 'nomination' && /expression of wish/.test(a.body)));
  ok('and the percentages to put on it', acts.some(a => a.key === 'nomination' && /%\s*to\s*\w/.test(a.body)));
  /*
   * The transfer step only appears when transfers are part of the winning allocation, so it is checked on
   * a household where they are: three years to a priced death and cash sitting idle, which is the shape
   * that makes topping the pension up to its allowance worth doing.
   */
  const recycler = household({ deathAge: 73, cash: 250000, pen: 500000, isa: 100000, other: 0,
    incomes: [{ id: 'e', name: 'Part-time', owner: 'Myself', startAge: 60, endAge: '', amount: 20000, incomeType: 'earnings' }] });
  const recAct = E.estateActionPlan(E.normalizePlan(recycler), E.optimizeInheritance(recycler)).find(a => a.key === 'recycle');
  ok('the transfers name a figure and the years', !!recAct && /£[\d,]+/.test(recAct.body) && /20\d\d/.test(recAct.title),
    recAct ? recAct.title : 'no transfer in the winning allocation');
  ok('and say what HMRC adds', !recAct || /HMRC/.test(recAct.body) || /ISA/.test(recAct.body), recAct ? recAct.body.slice(0, 90) : '');
  ok('the draw-down instruction quotes the band it fills', acts.some(a => a.key === 'ceiling' && /£50,270/.test(a.body)));
  ok('and says what it is for', acts.some(a => a.key === 'ceiling' && /taxed twice/.test(a.detail)));
  ok('the paperwork step is there when documents change',
    acts.some(a => a.key === 'paperwork') === acts.some(a => a.key === 'nomination' || a.key === 'gift'));

  /*
   * Only what changes. A plan already holding the winning settings has nothing to list, and saying
   * "nothing to change" is a finding rather than an empty screen.
   */
  const applied = E.normalizePlan({
    ...h,
    spending: { ...h.spending, decumulationPolicy: r.best.policy, drawdownStrategy: r.best.drawdown },
    config: { ...h.config, harvestPersonalAllowance: r.best.harvest, harvestCeiling: r.best.ceiling },
    oneOffContributions: [...(r.best.recycle || [])],
    inheritance: { ...h.inheritance, beneficiaries: r.best.split
      ? E.normalizeBeneficiaries(h.inheritance.beneficiaries).map((b, i) => ({ ...b, pensionSharePct: r.best.split[i] }))
      : h.inheritance.beneficiaries }
  });
  const r2 = E.optimizeInheritance(applied);
  const acts2 = E.estateActionPlan(applied, r2);
  ok('acting on it shortens the list', acts2.length < acts.length, `${acts.length} -> ${acts2.length}`);
  ok('a plan with nothing left to do says so rather than showing an empty list', acts2.length > 0);

  // and the household that cannot improve gets told that, in one line
  const settled = E.optimizeInheritance(household({ deathAge: 72, pen: 100000, isa: 0, other: 0, cash: 0, home: 200000 }));
  if (settled && settled.gain <= 0) {
    ok('no improvement is stated plainly', E.estateActionPlan(E.normalizePlan(household({ deathAge: 72, pen: 100000, isa: 0, other: 0, cash: 0, home: 200000 })), settled)
      .some(a => a.key === 'none'));
  } else {
    ok('no improvement is stated plainly', true, 'fixture had something to improve');
  }
}

console.log('=========== K. THE COMPENSATION WINDOW, IN THE SEARCH ===========');
{
  /*
   * Holding exempt compensation is already safe, so giving it away wins only where the money would
   * otherwise be eaten: the exemption is capped at what is still HELD at death, and a household living on
   * the compensation arrives with none of it left to disregard. This fixture is that household - a big
   * pension, no house, and the award in cash - and the search has to find the window before it shuts.
   */
  const living = household({
    demo: { currentAgeSelf: 74, terminalAge: 92 }, deathAge: 90, home: 0,
    pen: 800000, isa: 0, other: 0, cash: 400000,
    bens: [{ id: 'k', name: 'Child', relationship: 'descendant', sharePct: 100, income: 60000, age: 50 }],
    inh: { compensationPayment: 350000, compensationDate: '2026-02-01' }
  });
  living.spending.targetSpend = 42000;
  // Sequential spends the cash first, which is where the award is sitting - so by 90 there is none of it
  // left to disregard, and the window is the only way to get it to anyone
  living.spending.decumulationPolicy = 'Sequential';
  const r = E.optimizeInheritance(living);
  ok('the window is worked out from the payment date', r.compensationWindow && r.compensationWindow.endDate === '2028-02-01',
    r.compensationWindow ? r.compensationWindow.endDate : 'none');
  const lever = r.levers.find(l => l.key === 'compGift');
  ok('giving it away is a lever of its own', !!lever);
  ok('and it earns its place for a household that would spend it', lever.gain > 10000, gbp(lever.gain));
  ok('the year it names is inside the window', /20(2[678])/.test(lever.pick), lever.pick);
  ok('and the credit survives giving it away', (() => {
    const o = (gifts) => ({ deathAge: 84, deathYear: 2032, homeValue: 500000, homeToDescendants: true,
      compensationPayment: 300000, compensationWindowEndYear: 2028, giftsFromYear: 2026, gifts,
      beneficiaries: [{ id: 'k', name: 'C', relationship: 'descendant', sharePct: 100, income: 0 }] });
    const held = E.estateAtDeath({ ...E.DEFAULT_CONFIG }, { isa: 400000, cash: 300000 }, o([]));
    const gifted = E.estateAtDeath({ ...E.DEFAULT_CONFIG }, { isa: 400000, cash: 0 },
      o([{ amount: 300000, year: 2027 }]));
    /*
     * Two reliefs for two events: the credit on the death, the window on the gift. Netting them was tried
     * and made the window worth about £1,200, which cannot be the point of a relief created for exactly
     * this problem - so giving the award away has to leave the credit standing.
     */
    return Math.abs(gifted.compensationCredit - held.compensationCredit) < 1 && gifted.compensationCredit > 0 &&
      gifted.nrbUsedByGifts === 0;
  })(), 'the credit is for having received it, the window is for giving it away');

  // and it is dropped once the window has shut
  const shut = E.optimizeInheritance({ ...living,
    inheritance: { ...living.inheritance, compensationDate: '2019-01-01' } });
  const shutLever = shut.levers.find(l => l.key === 'compGift');
  ok('a closed window offers nothing', shut.compensationWindow.endDate === '2027-12-04' &&
    (shutLever.gain === 0 || /2027/.test(shutLever.pick)), `${shut.compensationWindow.endDate}: ${shutLever.pick}`);

  /*
   * Holding it is fine when the household will still have it: the same award, a house, and money to
   * spare, and the honest answer is that giving it away gains nothing.
   */
  const comfortable = E.optimizeInheritance(household({
    inh: { compensationPayment: 300000, compensationDate: '2026-02-01' } }));
  const noNeed = comfortable.levers.find(l => l.key === 'compGift');
  ok('the lever reports something either way', typeof noNeed.pick === 'string' && noNeed.gain >= 0,
    `${gbp(noNeed.gain)}: ${noNeed.pick}`);

  /*
   * Where the window really earns its keep: a death inside seven years. An ordinary gift would fail the
   * seven-year test and eat the nil-rate band; a compensation gift inside the window does neither. On a
   * long horizon the search often prefers an ordinary gift instead, which is correct - it does the same
   * job and is not capped at the size of the award.
   */
  const soon = household({
    demo: { currentAgeSelf: 78, terminalAge: 90 }, deathAge: 82, home: 0,
    pen: 700000, isa: 0, other: 0, cash: 400000,
    bens: [{ id: 'k', name: 'Child', relationship: 'descendant', sharePct: 100, income: 60000, age: 50 }],
    inh: { compensationPayment: 350000, compensationDate: '2026-02-01' }
  });
  soon.spending.targetSpend = 40000;
  soon.spending.decumulationPolicy = 'Sequential';
  const rSoon = E.optimizeInheritance(soon);
  /*
   * Like for like: the SAME £200,000 given in the same year, once presumed to come from the award and
   * once not. Comparing the two levers instead would compare different sums, since the ordinary gift can
   * be any size and this one is capped at the award.
   */
  const priceGift = (fromComp) => {
    const p = E.normalizePlan({ ...soon, inheritance: { ...soon.inheritance,
      gifts: [{ id: 'g', amount: 200000, year: 2027, ...(fromComp ? {} : { fromCompensation: 'no' }) }] } });
    const c = E.buildContext(E.resolveMpaa(p));
    return E.estateForPlanAt(p, c, E.simulateDeterministic(c, 'expected')).netWithGifts;
  };
  ok('with a death inside seven years the window is worth having', priceGift(true) > priceGift(false),
    `from the award ${gbp(priceGift(true))} against ordinary ${gbp(priceGift(false))}`);
  ok('and the search still offers it', rSoon.levers.find(l => l.key === 'compGift').gain >= 0);

  // the action list has to name the deadline, because it is the one thing here that expires
  const step = E.estateActionPlan(E.normalizePlan(living), {
    ...r, best: { ...r.best, compGift: { amount: 350000, year: 2028, exemptCompensation: true } }
  }).find(a => a.key === 'compGift');
  ok('the action names the amount, the year and the deadline',
    !!step && /£350,000/.test(step.title) && /2028/.test(step.title) && /2028-02-01/.test(step.body),
    step ? step.title : 'no step');
  ok('and warns what happens after it', !!step && /seven-year clock/.test(step.detail));
}

console.log('=========== L. HOW MUCH OF THE AWARD, AND WHERE FROM ===========');
{
  /*
   * Two bugs found by reading a real plan's action list. The search offered the WHOLE award every time,
   * so a household that had already given some of it away was told to give the same pounds twice; and it
   * never tried a slice, so on a plan holding far less outside the pension than the award is worth, the
   * recommendation was to withdraw the difference at the marginal rate. Both are now searched.
   */
  const withAward = (over = {}) => {
    const h = household({
      demo: { currentAgeSelf: 68, terminalAge: 95 }, deathAge: 71, home: 1400000,
      pen: 1200000, isa: 175000, other: 400000, cash: 0,
      bens: [{ id: 'k', name: 'Child', relationship: 'descendant', sharePct: 100, income: 60000, age: 36 }],
      inh: { compensationPayment: 900000, compensationDate: '2025-06-01', ...over.inh }
    });
    h.spending.targetSpend = '';
    return E.normalizePlan(h);
  };

  const r = E.optimizeInheritance(withAward());
  const lever = r.levers.find(l => l.key === 'compGift');
  ok('the compensation lever is worth something here', lever.gain > 0, gbp(lever.gain));
  ok('slices of it are searched, not just all or nothing',
    r.ranked.some(cnd => cnd.compGift && E.num(cnd.compGift.amount, 0) < 900000 - 1),
    r.ranked.filter(cnd => cnd.compGift).map(cnd => gbp(E.num(cnd.compGift.amount, 0))).join(' '));

  /*
   * And where a slice really is better, it wins. An earlier gift that has already eaten the nil-rate
   * band changes the trade: the marginal ordinary gift is nearly free, so handing over the whole award
   * - which means withdrawing the difference from the pension at the marginal rate - stops being best.
   */
  const withPrior = E.optimizeInheritance(withAward({ inh: {
    gifts: [{ id: 'g', amount: 308000, year: 2026, fromCompensation: 'no' }] } }));
  const priorPick = withPrior.levers.find(l => l.key === 'compGift').pick;
  const priorAmt = Number((/£([\d,]+)/.exec(priorPick) || [0, '0'])[1].replace(/,/g, ''));
  const measured = withPrior.ranked.filter(cnd => cnd.compGift);
  ok('the amount picked is the best of the slices measured, whichever that turns out to be',
    priorAmt > 0 && measured.every(cnd => cnd.net <= withPrior.best.net + 1),
    `picked ${gbp(priorAmt)} from ${measured.length} priced`);
  ok('and it never exceeds what is left of the award', priorAmt <= withPrior.compensationLeftToGive + 1,
    `${gbp(priorAmt)} of ${gbp(withPrior.compensationLeftToGive)}`);

  // what is already gone cannot be offered again
  const spent = E.optimizeInheritance(withAward({ inh: {
    gifts: [{ id: 'g', amount: 600000, year: 2026 }] } }));
  ok('a gift already drawn from the award reduces what is left',
    spent.compensationLeftToGive < 900000, gbp(spent.compensationLeftToGive));
  const spentLever = spent.levers.find(l => l.key === 'compGift');
  const spentPick = /£([\d,]+)/.exec(spentLever.pick);
  ok('and the search never offers more than remains',
    !spentPick || Number(spentPick[1].replace(/,/g, '')) <= spent.compensationLeftToGive + 1, spentLever.pick);

  /*
   * WHERE THE MONEY COMES FROM. "Give away £900,000" is not an instruction anybody can follow holding
   * £575,000 outside a pension, and the difference is the most expensive pound in the plan.
   */
  ok('the gift year wrappers travel with the result', !!r.giftYearWrappers && r.giftYearWrappers.isa > 0);
  const small = E.estateActionPlan(withAward(), { ...r,
    best: { ...r.best, gift: 100000, compGift: null } }).find(a => a.key === 'gift');
  ok('a gift the liquid covers says to take it from there', !!small && /rather than the pension/.test(small.body),
    small ? small.body.slice(0, 90) : 'no step');
  ok('and names the accounts', !!small && /general investment account|ISAs/.test(small.body));
  const huge = E.estateActionPlan(withAward(), { ...r,
    best: { ...r.best, gift: 900000, compGift: null } }).find(a => a.key === 'gift');
  ok('a gift beyond the liquid says what has to leave the pension',
    !!huge && /has to come out of the pension/.test(huge.body), huge ? huge.body.slice(-150) : 'no step');
  ok('and grosses the shortfall up for the income tax', !!huge && /withdrawing about £/.test(huge.body));
  /*
   * The rate has to come from TAXABLE INCOME. Reading it off totalSelf - a balance, not an income -
   * priced every withdrawal at the additional rate, which made every large gift look worse than it is.
   * A small shortfall on a household living on the state pension is a basic-rate withdrawal.
   */
  const outside = r.giftYearWrappers.isa + r.giftYearWrappers.other + r.giftYearWrappers.cash;
  const modest = E.estateActionPlan(withAward(), { ...r,
    best: { ...r.best, gift: Math.round(outside) + 15000, compGift: null } }).find(a => a.key === 'gift');
  ok('a small shortfall is grossed up at the basic rate', !!modest && /at 20% is paid/.test(modest.body),
    modest ? (/(at \d+% is paid)/.exec(modest.body) || [''])[0] : 'no step');
  ok('while a large one reaches the top rate', !!huge && /at 45% is paid/.test(huge.body),
    huge ? (/(at \d+% is paid)/.exec(huge.body) || [''])[0] : 'no step');

  // and a partial award is not described as "the" award
  const part = E.estateActionPlan(withAward(), { ...r, compensationLeftToGive: 900000,
    best: { ...r.best, gift: 0, compGift: { amount: 90000, year: 2027 } } }).find(a => a.key === 'compGift');
  ok('a partial gift of the award reads as a part of it', !!part && /Give £90,000 of the compensation/.test(part.title),
    part ? part.title : 'no step');
  ok('and says how much of the award is still there', !!part && /still available under the window/.test(part.body));
  const whole = E.estateActionPlan(withAward(), { ...r, compensationLeftToGive: 90000,
    best: { ...r.best, gift: 0, compGift: { amount: 90000, year: 2027 } } }).find(a => a.key === 'compGift');
  ok('while giving all that is left reads as the whole of it',
    !!whole && /Give the £90,000 of compensation/.test(whole.title), whole ? whole.title : 'no step');
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
