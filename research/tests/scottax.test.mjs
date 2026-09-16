/*
 * Scottish and Welsh income tax bands.
 *
 * Expected values are computed from the 2025/26 Scottish statute, not from the model: starter 19% on
 * £12,571-£15,397, basic 20% to £27,491, intermediate 21% to £43,662, higher 42% to £75,000, advanced
 * 45% to £125,140 and top 48% above that.
 *
 * The properties that matter most here are the ones about what must *not* change. Income tax bands are
 * devolved; National Insurance, capital gains tax, the personal allowance and its taper are not, and
 * relief at source is given at the statutory 20% to everyone. Each of those is a place where following
 * the region would be a silent wrong answer rather than a crash, so each gets an assertion.
 */
import * as E from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const near = (n, a, b, tol = 0.51, extra = '') => ok(n, Math.abs(a - b) <= tol, extra || `got ${a.toFixed(2)}, expected ${b.toFixed(2)}`);

const cfg = (region) => ({ ...E.DEFAULT_CONFIG, taxRegion: region });
const RUK = E.taxParams(cfg('ruk'));
const SCO = E.taxParams(cfg('scotland'));
const WAL = E.taxParams(cfg('wales'));
const GIA = 'Other Investments (e.g. GIA)';

console.log('=== the ladder is built as declared ===');
{
  ok('rUK has three bands', RUK.ladder.length === 3, String(RUK.ladder.length));
  ok('Scotland has six', SCO.ladder.length === 6, String(SCO.ladder.length));
  ok('every band top is non-decreasing', SCO.ladder.every((b, i) => i === 0 || b.top >= SCO.ladder[i - 1].top));
  ok('the last band is unbounded', SCO.ladder[5].top === Infinity && RUK.ladder[2].top === Infinity);
  // taxable-space tops, i.e. gross limit less the allowance surviving at that income
  near('starter band ends at £2,827 of taxable income', SCO.ladder[0].top, 15397 - 12570, 1e-9);
  near('basic band ends at £14,921', SCO.ladder[1].top, 27491 - 12570, 1e-9);
  near('intermediate band ends at £31,092', SCO.ladder[2].top, 43662 - 12570, 1e-9);
  near('higher band ends at £62,430', SCO.ladder[3].top, 75000 - 12570, 1e-9);
  // the allowance is fully tapered away by £125,140, so the advanced band top is the gross figure itself
  near('advanced band ends at £125,140', SCO.ladder[4].top, 125140, 1e-9);
  ok('rates are 19/20/21/42/45/48', SCO.ladder.map(b => Math.round(b.rate * 100)).join('/') === '19/20/21/42/45/48',
    SCO.ladder.map(b => Math.round(b.rate * 100)).join('/'));
}

console.log('\n=== income tax at each Scottish band edge, against statute ===');
{
  near('no tax at the personal allowance', E.incomeTax(12570, SCO), 0);
  near('top of the starter band', E.incomeTax(15397, SCO), 2827 * 0.19);
  near('top of the basic band', E.incomeTax(27491, SCO), 2827 * 0.19 + 12094 * 0.20);
  near('top of the intermediate band', E.incomeTax(43662, SCO), 2827 * 0.19 + 12094 * 0.20 + 16171 * 0.21);
  near('top of the higher band', E.incomeTax(75000, SCO), 2827 * 0.19 + 12094 * 0.20 + 16171 * 0.21 + 31338 * 0.42);
  // the allowance tapers away between £100,000 and £125,140, so taxable income at £125,140 is the whole of it
  near('top of the advanced band', E.incomeTax(125140, SCO),
    2827 * 0.19 + 12094 * 0.20 + 16171 * 0.21 + 31338 * 0.42 + (125140 - 62430) * 0.45);
  near('into the top rate', E.incomeTax(150000, SCO),
    2827 * 0.19 + 12094 * 0.20 + 16171 * 0.21 + 31338 * 0.42 + (125140 - 62430) * 0.45 + 24860 * 0.48);
  // The allowance taper is reserved, so it applies in Scotland too - but at £100,000 the Scottish band is
  // the 45% advanced rate, not the 42% higher rate, so the effective marginal rate there is 67.5%, not 63%.
  near('the taper bites at the advanced rate, giving 67.5% effective', E.incomeTax(101000, SCO) - E.incomeTax(100000, SCO), 1500 * 0.45);
  near('against 60% in rUK', E.incomeTax(101000, RUK) - E.incomeTax(100000, RUK), 1500 * 0.40);
}

console.log('\n=== rUK is untouched, and Wales is rUK ===');
{
  near('rUK at £50,270 is still 20% on £37,700', E.incomeTax(50270, RUK), 37700 * 0.20);
  near('rUK at £150,000 is unchanged', E.incomeTax(150000, RUK), 37700 * 0.20 + 87440 * 0.40 + 24860 * 0.45);
  let same = true;
  for (let g = 0; g <= 200000; g += 250) if (Math.abs(E.incomeTax(g, WAL) - E.incomeTax(g, RUK)) > 1e-9) { same = false; break; }
  ok('Wales equals rUK at every income from £0 to £200,000', same);
  ok('and declares itself a distinct region all the same', WAL.region === 'wales' && RUK.region === 'ruk');
}

console.log('\n=== a Scottish taxpayer pays more in the middle, and at the top ===');
{
  ok('more tax at £45,000', E.incomeTax(45000, SCO) > E.incomeTax(45000, RUK),
    `£${E.incomeTax(45000, SCO).toFixed(0)} vs £${E.incomeTax(45000, RUK).toFixed(0)}`);
  ok('more tax at £150,000', E.incomeTax(150000, SCO) > E.incomeTax(150000, RUK),
    `£${E.incomeTax(150000, SCO).toFixed(0)} vs £${E.incomeTax(150000, RUK).toFixed(0)}`);
  // below the intermediate threshold the starter rate makes a Scottish taxpayer very slightly better off
  ok('slightly less tax at £15,000', E.incomeTax(15000, SCO) < E.incomeTax(15000, RUK),
    `£${E.incomeTax(15000, SCO).toFixed(2)} vs £${E.incomeTax(15000, RUK).toFixed(2)}`);
}

console.log('\n=== reserved taxes must not follow the region ===');
{
  let nicSame = true;
  for (let g = 0; g <= 150000; g += 500) if (E.nicFor(g, SCO) !== E.nicFor(g, RUK) || E.nicFor(g, SCO, true) !== E.nicFor(g, RUK, true)) { nicSame = false; break; }
  ok('National Insurance is identical, employed and self-employed', nicSame);
  near('the personal allowance is identical', SCO.pa, RUK.pa, 1e-9);
  near('and its taper ends at the same income', SCO.taperEnd, RUK.taperEnd, 1e-9);
  near('CGT uses the UK basic-rate band under both', SCO.cgtBandWidth, RUK.cgtBandWidth, 1e-9, `${SCO.cgtBandWidth} vs ${RUK.cgtBandWidth}`);
  near('which is £37,700, not the Scottish basic band', SCO.cgtBandWidth, 37700, 1e-9);
  ok('the Scottish basic band is narrower than that, so the two are genuinely different',
    SCO.ladder[1].top < 37700, `${SCO.ladder[1].top} vs 37700`);
  near('relief at source is 20% under both', SCO.reliefAtSource, 0.20, 1e-9);
  near('and rUK agrees', RUK.reliefAtSource, 0.20, 1e-9);
}

console.log('\n=== the bracket-fill ceiling follows the higher rate, not a band name ===');
{
  near('rUK fills to £50,270 as before', RUK.higherRateStartsAt, 50270, 1e-9);
  near('Scotland fills to £43,662, where 42% starts', SCO.higherRateStartsAt, 43662, 1e-9);
  ok('not to the top of the 20% band', SCO.higherRateStartsAt !== 27491);
  near('the marginal rate just below it is 21%', E.marginalRateAt(43000, SCO), 0.21, 1e-9);
  near('and just above it is 42%', E.marginalRateAt(44000, SCO), 0.42, 1e-9);
  near('marginalRateAt is 0 inside the allowance', E.marginalRateAt(10000, SCO), 0, 1e-9);
  near('19% in the starter band', E.marginalRateAt(14000, SCO), 0.19, 1e-9);
  near('48% at the top', E.marginalRateAt(200000, SCO), 0.48, 1e-9);
  near('rUK marginal rate at £60,000 is still 40%', E.marginalRateAt(60000, RUK), 0.40, 1e-9);
}

console.log('\n=== breakpoints cover every band, which the analytic solver depends on ===');
{
  const bpS = E.taxBreakpoints(SCO), bpR = E.taxBreakpoints(RUK);
  for (const x of [12570, 15397, 27491, 43662, 75000, 100000, 125140]) ok(`Scottish breakpoints include £${x.toLocaleString()}`, bpS.some(b => Math.abs(b - x) < 1e-6));
  ok('rUK breakpoints are unchanged', bpR.filter((v, i, a) => a.indexOf(v) === i).join(',') === '12570,50270,100000,125140', bpR.join(','));
  ok('sorted ascending', bpS.every((v, i) => i === 0 || v >= bpS[i - 1]));

  /*
   * The property the solver actually relies on: between consecutive breakpoints the net-income function
   * is a straight line. Sampling the midpoint of each interval and comparing against the chord through
   * its endpoints catches a band whose breakpoint was left out — the failure mode that would otherwise
   * be silent.
   */
  const net = (g, P) => g - E.incomeTax(g, P);
  let linear = true, worst = 0;
  const pts = [0, ...bpS, 200000];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (b - a < 1) continue;
    const mid = (a + b) / 2;
    const chord = net(a, SCO) + (net(b, SCO) - net(a, SCO)) * 0.5;
    worst = Math.max(worst, Math.abs(net(mid, SCO) - chord));
  }
  linear = worst < 0.01;
  ok('net income is linear between consecutive Scottish breakpoints', linear, `worst deviation £${worst.toFixed(4)}`);
}

console.log('\n=== the solver and relief machinery still invert correctly under Scottish bands ===');
{
  // grossPensionNeededForNet is the analytic solver the breakpoints exist for: check it round-trips
  for (const target of [5000, 12000, 20000, 35000, 60000]) {
    const g = E.grossPensionNeededForNet(target, 0, SCO, true);   // fully crystallised: all of it is taxable
    const got = g - E.incomeTax(g, SCO);
    near(`gross for £${target.toLocaleString()} net round-trips`, got, target, 1.0, `needed £${g.toFixed(0)} gross, gives £${got.toFixed(2)}`);
  }
  // and it respects a ceiling, which is what bracket filling uses it for
  const capped = E.grossPensionNeededForNet(60000, 0, SCO, true, Infinity, SCO.higherRateStartsAt);
  ok('a ceiling caps the gross drawn', capped <= SCO.higherRateStartsAt + 0.01, `£${capped.toFixed(0)} vs ceiling £${SCO.higherRateStartsAt}`);

  // marginal relief is computed by differencing incomeTax, so it inherits the ladder
  const relSco = E.calculateMarginalRelief(60000, 1000, SCO, true);
  near('a Scottish higher-rate earner gets 42% relief', relSco.reliefRate, 42, 0.01, `${relSco.reliefRate.toFixed(2)}%`);
  const relRuk = E.calculateMarginalRelief(60000, 1000, RUK, true);
  near('an rUK one still gets 40%', relRuk.reliefRate, 40, 0.01, `${relRuk.reliefRate.toFixed(2)}%`);
  const relInt = E.calculateMarginalRelief(40000, 1000, SCO, true);
  near('a Scottish intermediate-rate earner gets 21%', relInt.reliefRate, 21, 0.01, `${relInt.reliefRate.toFixed(2)}%`);
}

console.log('\n=== end to end: a full projection responds to the region, and CGT does not ===');
/*
 * Where the region can and cannot show up in a projection.
 *
 * It bites on taxable income the model actually routes through incomeTax: pension drawdown, the state
 * pension, and other taxable income. It does *not* show up in salary during pure accumulation, because
 * stepYear only counts working take-home once someone in the household has retired (the `anyRetired`
 * guard) - before that the model assumes pay covers living costs and contributions and sweeps no
 * surplus. That is a pre-existing modelling choice, unrelated to this change, but it is why these
 * fixtures test a retiree drawing a large pension rather than a high earner still working.
 */
{
  const mk = (region, o = {}) => E.normalizePlan({
    demographics: { planningMode: 'single', currentAgeSelf: o.age ?? 62, retireAgeSelf: o.ret ?? 62, salarySelf: 0, employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500, terminalAge: 90 },
    spending: { targetSpend: o.spend ?? 55000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: o.policy ?? 'Bracket Fill Basic' },
    accounts: [
      { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: o.pen ?? 1400000, contrib: 0, growth: 3, risk: 'High Risk' },
      { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: o.isa ?? 60000, contrib: 0, growth: 3, risk: 'High Risk' },
      { id: 'other_self', owner: 'Myself', category: GIA, balance: o.gia ?? 40000, unrealisedGain: o.gain ?? 0, contrib: 0, growth: 3, risk: 'Medium Risk' },
      { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: o.cash ?? 20000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
    ],
    otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01', taxRegion: region, cgtEnabled: true }
  });
  const run = (region, o) => { const c = E.buildContext(mk(region, o)); const rows = E.simulateDeterministic(c, 'expected'); return { c, rows, ev: E.evaluateRows(c, rows) }; };

  const r = run('ruk'), s = run('scotland'), w = run('wales');
  ok('the region survives normalizePlan and reaches the context', s.c.P.region === 'scotland', s.c.P.region);
  ok('Wales is byte-identical to rUK across the whole projection',
    w.rows.length === r.rows.length && w.rows.every((row, i) => Math.abs(row.totalCombined - r.rows[i].totalCombined) < 1e-9 && Math.abs(row.taxPaid - r.rows[i].taxPaid) < 1e-9));

  /*
   * Like for like: a pension-only retiree has no tax-free wrapper to shift into, so both regions fund the
   * same net spend out of the same pot and the only difference is the rate. Scotland must draw *more*
   * gross to clear the same net, pay more tax, and finish smaller.
   */
  const only = { pen: 1400000, isa: 0, gia: 0, cash: 5000, spend: 55000, policy: 'Sequential' };
  const ro = run('ruk', only), so = run('scotland', only);
  const draw70 = (x) => x.rows.find(row => row.ageSelf === 70)?.drawdownPensions ?? 0;
  ok('a Scottish retiree draws more gross to reach the same net spend', draw70(so) > draw70(ro),
    `£${Math.round(draw70(so)).toLocaleString()} vs £${Math.round(draw70(ro)).toLocaleString()}`);
  ok('pays more lifetime tax for it', so.ev.lifetimeTax > ro.ev.lifetimeTax,
    `£${Math.round(so.ev.lifetimeTax).toLocaleString()} vs £${Math.round(ro.ev.lifetimeTax).toLocaleString()}`);
  ok('and ends with a smaller pot', so.ev.terminalPot < ro.ev.terminalPot,
    `£${Math.round(so.ev.terminalPot).toLocaleString()} vs £${Math.round(ro.ev.terminalPot).toLocaleString()}`);

  /*
   * The opposite result, pinned deliberately because it looks wrong and is not. Give the same household
   * ISAs and a GIA under a bracket-aware policy and the Scottish plan pays *less* income tax: bracket
   * filling stops at £43,662 rather than £50,270, so it pulls less into taxable income each year and
   * takes the balance from tax-free wrappers instead. That is the policy doing its job against a
   * different band, not the bands being applied wrongly - the like-for-like case above is what proves
   * the rates themselves are higher.
   */
  ok('with tax-free wrappers available, bracket filling draws less in Scotland', s.ev.lifetimeTax < r.ev.lifetimeTax,
    `£${Math.round(s.ev.lifetimeTax).toLocaleString()} vs £${Math.round(r.ev.lifetimeTax).toLocaleString()}`);
  const modest = { spend: 26000, pen: 500000 };
  const rm = run('ruk', modest), sm = run('scotland', modest);
  ok('and never draws more pension than the rUK plan at the same spend', draw70(sm) <= draw70(rm) + 1,
    `£${Math.round(draw70(sm)).toLocaleString()} vs £${Math.round(draw70(rm)).toLocaleString()}`);

  // CGT is reserved: a GIA sitting on a large gain must be charged the same either side of the border.
  // Sequential draws cash, then the GIA, so the disposals actually happen.
  const gains = { policy: 'Sequential', gia: 500000, gain: 380000, pen: 200000, isa: 20000, cash: 20000, spend: 48000 };
  const rg = run('ruk', gains), sg = run('scotland', gains);
  const cgt = (x) => x.rows.reduce((t, row) => t + (row.cgtPaid || 0), 0);
  ok('the fixture actually realises gains', cgt(rg) > 0, `£${Math.round(cgt(rg)).toLocaleString()} lifetime CGT`);
  near('lifetime CGT is identical under both regions', cgt(sg), cgt(rg), 0.01,
    `£${Math.round(cgt(sg)).toLocaleString()} vs £${Math.round(cgt(rg)).toLocaleString()}`);
  ok('even though income tax over the same projection is not', Math.abs(sg.ev.lifetimeTax - rg.ev.lifetimeTax) > 1,
    `£${Math.round(sg.ev.lifetimeTax).toLocaleString()} vs £${Math.round(rg.ev.lifetimeTax).toLocaleString()}`);

  // an unknown region must fall back rather than compounding undefined
  const junk = E.normalizePlan({ ...mk('ruk'), config: { valuationDate: '2026-01-01', taxRegion: 'narnia' } });
  ok('an unrecognised region falls back to rUK', E.buildContext(junk).P.region === 'ruk', E.buildContext(junk).P.region);
  ok('and normalizePlan rewrites the stored value too', junk.config.taxRegion === 'ruk', junk.config.taxRegion);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
