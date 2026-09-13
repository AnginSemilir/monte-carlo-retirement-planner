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
  ok('every lever is reported, including the ones worth nothing', r.levers.length === 5,
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
  ok('and rebuilding it reproduces the figure the optimiser quoted',
    Math.abs(E.postTaxInheritanceFor(rebuilt, ctx) - r.best.net) < 2,
    `${gbp(E.postTaxInheritanceFor(rebuilt, ctx))} against ${gbp(r.best.net)}`);
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

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
