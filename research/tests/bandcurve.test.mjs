/*
 * The lucky/unlucky curve, restored to the trajectory chart.
 *
 * These lines were removed from the app once for being wrong, and the diagnosis at the time was wrong
 * too: it blamed sequence-of-returns risk, which only exists during drawdown, for an error that was
 * visible in pure accumulation. The real cause was the construction. A band drawn at ONE rate cannot be
 * right at more than one age, because quantileRate's spread is sqrt(sp^2 + sigma^2/T) and that narrows as
 * T grows -- compounding a 45-year rate over the first five years understates the early spread threefold.
 *
 * So the load-bearing assertions here are the two that separate the constructions:
 *
 *   1. A FIXED-rate band is badly wrong in accumulation (this reproduces the original defect, so nobody
 *      can quietly reintroduce it).
 *   2. The horizon-varying curve is within a few percent of the simulation, in accumulation AND drawdown.
 *
 * Plus the one honest limitation, pinned so the UI copy stays true: the lower edge cannot run dry, so on
 * a stressed plan it sits ABOVE the simulation's lower quantile, and the error grows as survival falls.
 */
import * as E from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const GIA = 'Other Investments (e.g. GIA)';
const pctErr = (a, b) => b > 0 ? (a - b) / b * 100 : NaN;

const mk = (o = {}, profiles) => E.normalizePlan({
  demographics: {
    planningMode: 'single', currentAgeSelf: o.age ?? 45, retireAgeSelf: o.ret ?? 60, salarySelf: 65000,
    employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500, terminalAge: o.term ?? 90
  },
  spending: { targetSpend: o.spend ?? 32000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
  accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: o.pen ?? 350000, contrib: o.penC ?? 12000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: o.isa ?? 120000, contrib: o.isaC ?? 6000, growth: 3, risk: 'Medium/High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: o.gia ?? 40000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: o.cash ?? 25000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
  ],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' },
  ...(profiles ? { riskProfiles: profiles } : {})
});

// the simulation's own band at the same age and quantile: the thing the curve has to match
const mcBand = (plan, trials = 20000, seed = 12345) => {
  const ctx = E.buildContext(plan);
  const paths = E.pathsForSeed(seed, trials, ctx.totalYears).map(zs => E.runTrial(ctx, zs, null, true).path);
  return (t, p) => { const v = Float64Array.from(paths.map(pp => pp[t])); v.sort(); return v[Math.min(v.length - 1, Math.floor(v.length * p))]; };
};

console.log('=========== A. THE DEFECT THAT GOT THESE LINES REMOVED ===========');
{
  // one rate for the whole chart, which is what the original implementation did
  const plan = mk({ pen: 600000, isa: 250000, gia: 80000, cash: 40000, spend: 34000 });
  const ctx = E.buildContext(plan), T = ctx.totalYears + 1;
  const fixed = (z) => {
    const flat = {};
    Object.entries(plan.riskProfiles).forEach(([k, v]) => {
      flat[k] = { ...v, real: E.quantileRate(v.real / 100, v.volatility / 100, T, (v.sigmaParam || 0) / 100, z) * 100, volatility: 0, sigmaParam: 0 };
    });
    const c = E.buildContext({ ...E.resolveMpaa(plan), riskProfiles: flat });
    return E.simulateDeterministic(c, 'expected').map(r => r.totalCombined);
  };
  const band = mcBand(plan);
  const z = E.BAND_QUANTILES.decile.z;
  const lo = fixed(-z), hi = fixed(z);
  const t = 5; // age 50, fifteen years before this plan retires: pure accumulation
  const eLo = pctErr(lo[t], band(t, 0.10)), eHi = pctErr(hi[t], band(t, 0.90));
  ok('a fixed-rate band is badly wrong early, in ACCUMULATION', Math.abs(eLo) > 20 && Math.abs(eHi) > 20,
    `age 50: lower ${eLo.toFixed(1)}%, upper ${eHi.toFixed(1)}% -- sequence risk cannot be the cause here`);
  const tEnd = ctx.totalYears;
  ok('and is right only at the horizon it was derived for', Math.abs(pctErr(hi[tEnd], band(tEnd, 0.90))) < 5,
    `age ${ctx.terminalAge}: upper ${pctErr(hi[tEnd], band(tEnd, 0.90)).toFixed(1)}%`);
}

console.log('\n=========== B. THE HORIZON-VARYING CURVE TRACKS THE SIMULATION ===========');
const FIX = [
  ['Normal retirement (£34k)', { pen: 600000, isa: 250000, gia: 80000, cash: 40000, spend: 34000 }],
  ['Younger saver (40→65)', { age: 40, ret: 65, pen: 250000, isa: 90000, gia: 20000, cash: 20000, spend: 32000 }],
  ['Accumulation only (35→65)', { age: 35, ret: 65, term: 65, spend: 0 }]
];
for (const [mode, qs] of [['quartile', [0.25, 0.75]], ['decile', [0.10, 0.90]]]) {
  const z = E.BAND_QUANTILES[mode].z;
  for (const [name, o] of FIX) {
    for (const preset of [null, E.applyCmaPreset('blackrock2026', 2.5)]) {
      const plan = mk(o, preset), ctx = E.buildContext(plan);
      const lo = E.quantileCurve(plan, -z), hi = E.quantileCurve(plan, z);
      const band = mcBand(plan);
      const errs = [];
      for (let t = 5; t <= ctx.totalYears; t += 5) {
        const ml = band(t, qs[0]), mh = band(t, qs[1]);
        if (ml > 0) errs.push(Math.abs(pctErr(lo.pot[t].totalCombined, ml)));
        if (mh > 0) errs.push(Math.abs(pctErr(hi.pot[t].totalCombined, mh)));
      }
      const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
      const tag = `${mode} · ${name} · ${preset ? 'BlackRock' : 'house'}`;
      ok(`within 8% mean: ${tag}`, mean < 8, `mean |err| ${mean.toFixed(1)}%, worst ${Math.max(...errs).toFixed(1)}%`);
    }
  }
}

console.log('\n=========== C. THE LIMITATION THE UI CLAIMS ===========');
{
  // the lower edge cannot run dry, so it sits above the truth, and more so the more stressed the plan
  const z = E.BAND_QUANTILES.decile.z;
  const rows = [];
  for (const [name, o] of [
    ['Light draw', { pen: 700000, isa: 300000, gia: 80000, cash: 40000, spend: 26000 }],
    ['Normal', { pen: 600000, isa: 250000, gia: 80000, cash: 40000, spend: 34000 }],
    ['Heavy', { pen: 600000, isa: 250000, gia: 80000, cash: 40000, spend: 46000 }]
  ]) {
    const plan = mk(o), ctx = E.buildContext(plan);
    const lo = E.quantileCurve(plan, -z), band = mcBand(plan);
    const t = ctx.totalYears, ml = band(t, 0.10);
    const sim = E.monteCarlo(plan, { trials: 5000, seed: 12345 });
    rows.push({ name, survival: sim.successRate, err: ml > 0 ? pctErr(lo.pot[t].totalCombined, ml) : NaN });
    console.log(`      ${name.padEnd(12)} survival ${sim.successRate.toFixed(1)}%   terminal lower-edge error ${(ml > 0 ? pctErr(lo.pot[t].totalCombined, ml).toFixed(1) + '%' : 'n/a (ruin)')}`);
  }
  ok('the lower edge is optimistic, never pessimistic, at the horizon', rows.every(r => isNaN(r.err) || r.err >= -1),
    rows.map(r => `${r.name} ${isNaN(r.err) ? 'ruin' : r.err.toFixed(1) + '%'}`).join(', '));
  ok('and its error grows as survival falls', rows[0].err < rows[2].err,
    `${rows[0].survival.toFixed(1)}% survival -> ${rows[0].err.toFixed(1)}% err, ${rows[2].survival.toFixed(1)}% -> ${rows[2].err.toFixed(1)}%`);
  // a plan whose unlucky line actually reaches zero must report it, since that is the UI's cue
  const lean = mk({ pen: 150000, isa: 40000, gia: 10000, cash: 10000, penC: 5000, isaC: 1500, spend: 32000 });
  const leanLo = E.quantileCurve(lean, -z);
  ok('failAge is reported when the drawn line hits zero', leanLo.failAge !== null, `broke at ${leanLo.failAge}`);
  ok('failAge is null on a plan that holds', E.quantileCurve(mk({ pen: 700000, isa: 300000, gia: 80000, cash: 40000, spend: 26000 }), -z).failAge === null);
}

console.log('\n=========== D. SHAPE, ORDERING AND VIEWS ===========');
{
  const plan = mk({ pen: 600000, isa: 250000, gia: 80000, cash: 40000, spend: 34000 });
  const ctx = E.buildContext(plan);
  const z = E.BAND_QUANTILES.quartile.z;
  const lo = E.quantileCurve(plan, -z), hi = E.quantileCurve(plan, z);
  const mid = E.simulateDeterministic(ctx, 'expected').map(r => r.totalCombined);
  ok('one entry per plan year', lo.pot.length === ctx.totalYears + 1 && hi.pot.length === ctx.totalYears + 1);
  ok('lower <= expected <= upper at every age', lo.pot.every((d, i) => d.totalCombined <= mid[i] + 1) && hi.pot.every((d, i) => d.totalCombined >= mid[i] - 1));
  ok('the band widens with age', (hi.pot[40].totalCombined - lo.pot[40].totalCombined) > (hi.pot[5].totalCombined - lo.pot[5].totalCombined));
  ok('every row carries its age', lo.pot.every((d, i) => d.ageSelf === ctx.ageSelf0 + i));
  ok('all three household totals are present', lo.pot.every(d => ['totalCombined', 'totalSelf', 'totalPart'].every(k => Number.isFinite(d[k]))));
  // a couple: the band must be able to follow the per-person view, not just the household one
  // normalizePlan rebuilds accounts from the eight canonical wrappers and matches by id, so the partner
  // pension has to be EDITED rather than appended -- an appended duplicate is simply never found.
  const couple = E.normalizePlan({ ...plan, demographics: { ...plan.demographics, planningMode: 'couple', currentAgePart: 43, retireAgePart: 60 },
    accounts: plan.accounts.map(a => a.id === 'pen_part' ? { ...a, balance: 200000, contrib: 8000, risk: 'High Risk' } : a) });
  const cLo = E.quantileCurve(couple, -z);
  ok('a couple splits into self and partner', cLo.pot.some(d => d.totalPart > 0) && cLo.pot.every(d => Math.abs(d.totalCombined - (d.totalSelf + d.totalPart)) < 1));
  // the quartile band must sit inside the decile band, or the labels are lying
  const qLo = E.quantileCurve(plan, -E.BAND_QUANTILES.quartile.z), dLo = E.quantileCurve(plan, -E.BAND_QUANTILES.decile.z);
  ok('quartiles sit inside deciles', qLo.pot.every((d, i) => d.totalCombined >= dLo.pot[i].totalCombined - 1));
  ok('the quoted rate is the whole-plan horizon', Math.abs(qLo.rate['High Risk'] - E.quantileRate(plan.riskProfiles['High Risk'].real / 100, plan.riskProfiles['High Risk'].volatility / 100, ctx.totalYears + 1, (plan.riskProfiles['High Risk'].sigmaParam || 0) / 100, -E.BAND_QUANTILES.quartile.z) * 100) < 1e-9);
}

console.log('\n=========== E. luckyBand IS UNCHANGED BY THE quantileRate REFACTOR ===========');
{
  let same = true;
  for (const [, v] of Object.entries(E.DEFAULT_RISK_PROFILES)) {
    for (const T of [1, 5, 12, 30, 46, 60]) {
      const b = E.luckyBand(v.real / 100, v.volatility / 100, T, (v.sigmaParam || 0) / 100);
      const m = Math.log(1 + v.real / 100), s = Math.sqrt(((v.sigmaParam || 0) / 100) ** 2 + ((v.volatility / 100) ** 2) / T);
      if (Math.abs(b.lucky - (Math.exp(m + 1.2815515655446004 * s) - 1)) > 1e-15) same = false;
      if (Math.abs(b.unlucky - (Math.exp(m - 1.2815515655446004 * s) - 1)) > 1e-15) same = false;
    }
  }
  ok('identical to the closed form, all tiers, six horizons', same);
  ok('quantileRate at +Z90 is luckyBand.lucky', Math.abs(E.quantileRate(0.05, 0.15, 20, 0.02, 1.2815515655446004) - E.luckyBand(0.05, 0.15, 20, 0.02).lucky) < 1e-15);
}

console.log('\n=========== F. NEW PLANS TAKE THE PUBLISHED DEFAULT, SAVED PLANS DO NOT ===========');
{
  const fresh = E.normalizePlan({});
  ok('a new plan names the published set', fresh.riskSource === E.DEFAULT_RISK_SOURCE, fresh.riskSource);
  ok('and carries its forecast-uncertainty term', fresh.riskProfiles['High Risk'].sigmaParam > 0, `sigmaParam ${fresh.riskProfiles['High Risk'].sigmaParam}`);
  ok('real is the published nominal deflated at the inflation setting',
    Math.abs(fresh.riskProfiles['High Risk'].real - E.realFromNominal(E.CMA_PRESETS.blackrock2026.nominal['High Risk'].nominal, 2.5)) < 0.01);
  const saved = E.normalizePlan({ riskProfiles: { 'High Risk': { real: 4.44, nominal: 7.05, volatility: 15.5, sigmaParam: 0 } } });
  ok('an existing plan keeps its own figures', saved.riskProfiles['High Risk'].real === 4.44 && saved.riskProfiles['High Risk'].sigmaParam === 0);
  ok('and is not relabelled as a preset', saved.riskSource === '');
  const named = E.normalizePlan({ riskSource: 'blackrock2026', riskProfiles: { 'High Risk': { real: 1.11 } } });
  ok('a plan naming a preset keeps the name and its edits', named.riskSource === 'blackrock2026' && named.riskProfiles['High Risk'].real === 1.11);
  const handEdited = E.normalizePlan({ riskSource: '', riskProfiles: { 'High Risk': { real: 9.99 } } });
  ok('a hand-edited plan stays unsourced', handEdited.riskSource === '' && handEdited.riskProfiles['High Risk'].real === 9.99);
}

console.log('\n=========== G. SMOOTH SURVIVAL AS A PERCENTAGE ===========');
{
  /*
   * The side-by-side table needs the rate-based column stated as a share of outcomes, not as a count of
   * however many lines happen to be drawn. Every quantile curve either lasts or runs dry and worse
   * quantiles fail first, so there is one crossing: bisect for the unluckiest rate that still survives,
   * then read off how much of the distribution sits at or above it.
   */
  const closeTo = (a, b, tol) => Math.abs(a - b) <= tol;
  ok('normalCdf is right at the landmarks',
    closeTo(E.normalCdf(0), 0.5, 1e-6) && closeTo(E.normalCdf(1.2815515655446004), 0.9, 1e-4) &&
    closeTo(E.normalCdf(-1.2815515655446004), 0.1, 1e-4) && closeTo(E.normalCdf(1.959963985), 0.975, 1e-4));

  const cases = [
    ['Comfortable', { spend: 26000, pen: 700000, isa: 300000 }],
    ['Normal', {}],
    ['Stretched', { spend: 46000 }],
    ['Lean', { pen: 200000, isa: 60000, gia: 10000, cash: 15000, penC: 6000, isaC: 2000, spend: 30000 }]
  ];
  const got = [];
  for (const [name, o] of cases) {
    const plan = mk(o);
    const smooth = E.smoothSurvivalRate(plan);
    const sim = E.monteCarlo(plan, { trials: 4000, seed: 12345 }).successRate;
    got.push({ name, smooth, sim });
    ok(`${name}: a percentage in range`, smooth >= 0 && smooth <= 100, `${smooth.toFixed(1)}% vs simulated ${sim.toFixed(1)}%`);
  }
  // the point of putting them side by side: the smooth one flatters, because it cannot run dry mid-way
  ok('the smooth figure never understates the simulation', got.every(g => g.smooth >= g.sim - 0.5),
    got.map(g => `${g.name} ${(g.smooth - g.sim >= 0 ? '+' : '')}${(g.smooth - g.sim).toFixed(1)}`).join(', '));
  ok('and it flatters more as the plan weakens', (got[2].smooth - got[2].sim) > (got[0].smooth - got[0].sim),
    `comfortable +${(got[0].smooth - got[0].sim).toFixed(1)} vs stretched +${(got[2].smooth - got[2].sim).toFixed(1)}`);
  ok('a stronger plan survives more than a weaker one', got[0].smooth > got[1].smooth && got[1].smooth > got[3].smooth,
    got.map(g => `${g.name} ${g.smooth.toFixed(1)}%`).join(' > '));
  // the unwinnable and the unlosable ends
  ok('a plan with nothing saved survives nothing', E.smoothSurvivalRate(mk({ pen: 0, isa: 0, gia: 0, cash: 0, penC: 0, isaC: 0, spend: 40000 })) === 0);
  ok('a plan that never draws survives everything', E.smoothSurvivalRate(mk({ age: 35, ret: 65, term: 65, spend: 0 })) === 100);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
