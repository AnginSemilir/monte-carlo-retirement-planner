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
  ok('every lever is reported, including the ones worth nothing', r.levers.length === 4,
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
  const rebuilt = E.normalizePlan({
    ...tight,
    spending: { ...tight.spending, decumulationPolicy: r.best.policy, drawdownStrategy: r.best.drawdown },
    config: { ...tight.config, harvestPersonalAllowance: r.best.harvest },
    oneOffContributions: [...(tight.oneOffContributions || []), ...(r.best.recycle || [])],
    inheritance: { ...tight.inheritance,
      gifts: r.best.gift > 0 ? [{ id: 'g', amount: r.best.gift, year: r.giftYear }] : [] }
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

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
