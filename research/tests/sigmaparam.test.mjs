/*
 * The per-path expected-return shock.
 *
 * The load-bearing test here is the external one: feed a tier BlackRock's own published figures for a
 * single asset, simulate, and check the engine reproduces the 25th and 75th percentiles BlackRock
 * themselves published at 5, 10, 20 and 30 years. If a model cannot reproduce the table it was handed,
 * nothing else it says is worth much. Every other assertion in this file is scaffolding around that one.
 *
 * The second property, asserted first because everything rests on it: at sigmaParam = 0 the engine must
 * be unchanged. That is what makes the whole change auditable - survival rates can then only move for
 * one reason, and we can attribute the movement.
 */
import * as E from '../engine.mjs';
import { readFileSync } from 'node:fs';

const CMA = JSON.parse(readFileSync(new URL('./cma-gbp.json', import.meta.url)));
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const near = (n, a, b, tol, extra = '') => ok(n, Math.abs(a - b) <= tol, extra || `got ${a.toFixed(3)}, expected ${b.toFixed(3)} (tol ${tol})`);
const quantile = (s, p) => s[Math.min(s.length - 1, Math.floor(s.length * p))];

console.log('=== sigmaParam = 0 leaves the model exactly where it was ===');
{
  const band0 = E.luckyBand(0.0444, 0.155, 45);
  const bandU = E.luckyBand(0.0444, 0.155, 45, 0);
  ok('luckyBand with the argument omitted equals passing zero', band0.lucky === bandU.lucky && band0.unlucky === bandU.unlucky);
  near('and still reduces to the sigma/sqrt(T) form', band0.lucky,
    Math.exp(Math.log(1.0444) + 1.2815515655446004 * 0.155 / Math.sqrt(45)) - 1, 1e-12);
  ok('every shipped tier defaults to zero', Object.values(E.DEFAULT_RISK_PROFILES).every(t => t.sigmaParam === 0),
    JSON.stringify(Object.fromEntries(Object.entries(E.DEFAULT_RISK_PROFILES).map(([k, v]) => [k, v.sigmaParam]))));
}

console.log('\n=== the extra draw does not disturb the per-year draws ===');
{
  // the mechanical reason the no-op above holds: gaussianPath fills sequentially, so asking for one
  // more normal cannot change the ones already drawn
  let same = true;
  for (const seed of [1, 12345, 999983]) for (const n of [1, 5, 46, 71]) {
    const a = E.gaussianPath(seed, n), b = E.gaussianPath(seed, n + 1);
    for (let i = 0; i < n; i++) if (a[i] !== b[i]) same = false;
  }
  ok('gaussianPath is prefix-stable', same);
  const paths = E.pathsForSeed(4242, 3, 40);
  ok('pathsForSeed carries one entry beyond the projection', paths[0].length === 42, `${paths[0].length} for a 40-year plan`);
}

const GIA = 'Other Investments (e.g. GIA)';
// A single-asset, single-wrapper, no-cash-flow plan: a pure compounding test bed, so the only thing
// shaping the outcome is the return model itself.
const solo = (tier, years) => E.normalizePlan({
  demographics: { planningMode: 'single', currentAgeSelf: 40, retireAgeSelf: 40 + years, salarySelf: 0,
    employmentSelf: 'employed', statePensionAge: 99, privatePensionAge: 58, statePensionSelf: 0, terminalAge: 40 + years },
  spending: { targetSpend: 0, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Sequential' },
  accounts: [
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 1000000, contrib: 0, growth: 0, risk: 'High Risk' },
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 0, contrib: 0, growth: 0, risk: 'High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: 0, contrib: 0, growth: 0, risk: 'High Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 0, contrib: 0, growth: 0, risk: 'High Risk' }
  ],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' },
  riskProfiles: { 'High Risk': tier }
});

/*
 * Annualised return implied by a terminal pot, which is the space BlackRock quote in.
 *
 * The exponent is totalYears + 1, not totalYears: stepYear runs for t = 0..totalYears inclusive, so a
 * plan whose context reports 30 years compounds thirty-one times. Dividing by 30 instead understates
 * every rate by about 3% of itself, which is small enough to look like model error rather than an
 * off-by-one - verified by running a zero-volatility plan and reading the exponent straight off the pot.
 */
const annualised = (terminal, ctx) => (Math.pow(terminal / 1000000, 1 / (ctx.totalYears + 1)) - 1) * 100;

console.log('\n=== variance splits into the two terms, as designed ===');
{
  const T = 30, TRIALS = 40000;
  /*
   * Measured in LOG space, because that is where the model's sigmas are defined. The simple annualised
   * return is exp(X) - 1 for X normal, whose standard deviation is about exp(m) times that of X - a 5%
   * inflation at these rates, which is exactly large enough to look like a modelling error rather than
   * a units mismatch if you compare it against a log-space target.
   */
  const run = (vol, sp) => {
    const ctx = E.buildContext(solo({ label: 'x', real: 5, nominal: 5, volatility: vol, sigmaParam: sp }, T));
    const rs = E.pathsForSeed(606001, TRIALS, ctx.totalYears)
      .map(zs => Math.log(1 + annualised(E.runTrial(ctx, zs).terminalPot, ctx) / 100) * 100);
    const m = rs.reduce((a, b) => a + b, 0) / rs.length;
    return Math.sqrt(rs.reduce((a, b) => a + (b - m) ** 2, 0) / rs.length);
  };
  const N = T + 1;   // compounding periods, per the note on `annualised`
  const volOnly = run(15, 0), spOnly = run(0, 3), both = run(15, 3);
  near('volatility alone gives sigma/sqrt(T)', volOnly, 15 / Math.sqrt(N), 0.12, `${volOnly.toFixed(3)} vs ${(15 / Math.sqrt(N)).toFixed(3)}`);
  near('sigmaParam alone is horizon-independent', spOnly, 3, 0.06, `${spOnly.toFixed(3)} vs 3.000`);
  near('together they add in quadrature', both, Math.sqrt(9 + 225 / N), 0.12,
    `${both.toFixed(3)} vs ${Math.sqrt(9 + 225 / N).toFixed(3)}`);
  // and the part that matters for a retirement horizon: it does NOT wash out
  ok('at 30 years the sigmaParam term dominates the volatility term',
    3 > 15 / Math.sqrt(N), `${3} vs ${(15 / Math.sqrt(N)).toFixed(2)}`);
}

console.log('\n=== EXTERNAL VALIDATION: reproduce BlackRock\'s published percentiles ===');
console.log(`    source: ${CMA.source}, ${CMA.currency}, as of ${CMA.asOf}`);
console.log('    Each asset is fed to the engine as a tier; the engine is asked for the 25th and 75th');
console.log('    percentile of the annualised return; the target is what BlackRock printed.\n');
{
  const TRIALS = 40000;
  for (const [name, a] of Object.entries(CMA.assets)) {
    for (const T of [5, 10, 20, 30]) {
      const want = a.band[T];
      if (!want) continue;
      // The fit AT this horizon, not an average across seven of them. Averaging is only defensible
      // where the fit is flat, and the separate test below is what establishes where that holds.
      const tier = { label: name, real: a.expected[T], nominal: a.expected[T], volatility: a.volatility, sigmaParam: a.sigmaParamByHorizon[T] };
      const ctx = E.buildContext(solo(tier, T));
      const rs = E.pathsForSeed(818001, TRIALS, ctx.totalYears)
        .map(zs => annualised(E.runTrial(ctx, zs).terminalPot, ctx)).sort((x, y) => x - y);
      const p25 = quantile(rs, 0.25), p75 = quantile(rs, 0.75);
      /*
       * 0.25pp from ten years out, 0.55pp at five. The looser short-horizon bound is a real limitation,
       * not a fudge: the engine's annualised return is lognormal, BlackRock's published band is close to
       * symmetric, and the two disagree most where the spread is largest relative to the mean - which is
       * the short end. By ten years the skew is small enough that the shapes agree to a quarter point.
       * A retirement plan is priced over twenty to sixty years, so the model is being asked to be
       * accurate exactly where it is, and the five-year row is kept as an honest record of where it is
       * weakest rather than dropped.
       */
      const tol = T <= 5 ? 0.55 : 0.25;
      near(`${name.slice(0, 30).padEnd(31)} ${String(T).padStart(2)}yr p25`, p25, want.p25, tol, `engine ${p25.toFixed(2)}%  published ${want.p25.toFixed(2)}%`);
      near(`${name.slice(0, 30).padEnd(31)} ${String(T).padStart(2)}yr p75`, p75, want.p75, tol, `engine ${p75.toFixed(2)}%  published ${want.p75.toFixed(2)}%`);
    }
  }
}

console.log('\n=== is sigmaParam actually horizon-free? (this is what licenses 45 and 60 years) ===');
console.log('    A flat fit across the seven published horizons means one number describes the asset and');
console.log('    can be evaluated anywhere. Where it is not flat, the decomposition still holds at each');
console.log('    horizon but a single summary figure does not, and the preset must say which it is.\n');
{
  for (const [name, a] of Object.entries(CMA.assets)) {
    const vals = Object.values(a.sigmaParamByHorizon);
    const spread = Math.max(...vals) - Math.min(...vals);
    const flat = spread < 1.0;
    console.log(`    ${name.slice(0, 34).padEnd(36)} mean ${a.sigmaParam.toFixed(2)}pp  spread ${spread.toFixed(2)}pp  ${flat ? 'FLAT — safe to extrapolate' : 'not flat — quote per horizon'}`);
  }
  const core = ['UK large cap equities', 'UK cash'];
  for (const n of core) {
    const vals = Object.values(CMA.assets[n].sigmaParamByHorizon);
    ok(`${n} has a horizon-free sigmaParam`, Math.max(...vals) - Math.min(...vals) < 1.0,
      `spread ${(Math.max(...vals) - Math.min(...vals)).toFixed(2)}pp across 5–30yr`);
  }
  // the preset ships a single number per tier, so it must be built at a stated horizon
  ok('the preset records the horizon its figures were fitted at', CMA.horizonYears === 30, String(CMA.horizonYears));
}

console.log('\n=== without sigmaParam the same test fails, which is the point ===');
{
  const TRIALS = 40000, T = 30, name = 'UK large cap equities';
  const a = CMA.assets[name];
  const tier = { label: name, real: a.expected[T], nominal: a.expected[T], volatility: a.volatility, sigmaParam: 0 };
  const ctx = E.buildContext(solo(tier, T));
  const rs = E.pathsForSeed(818001, TRIALS, ctx.totalYears)
    .map(zs => annualised(E.runTrial(ctx, zs).terminalPot, ctx)).sort((x, y) => x - y);
  const p25 = quantile(rs, 0.25), p75 = quantile(rs, 0.75);
  const engineWidth = p75 - p25, publishedWidth = a.band[T].p75 - a.band[T].p25;
  ok('the old model is materially too narrow at 30 years', engineWidth < publishedWidth - 1.0,
    `engine ${engineWidth.toFixed(2)}pp vs published ${publishedWidth.toFixed(2)}pp — ${(publishedWidth / engineWidth).toFixed(2)}x too narrow`);
}

console.log('\n=== luckyBand agrees with the simulation it describes ===');
{
  const TRIALS = 40000;
  for (const [T, vol, sp] of [[30, 15, 3], [45, 17.1, 2.74], [10, 8, 1.5]]) {
    const tier = { label: 'x', real: 4, nominal: 4, volatility: vol, sigmaParam: sp };
    const ctx = E.buildContext(solo(tier, T));
    const rs = E.pathsForSeed(717001, TRIALS, ctx.totalYears)
      .map(zs => annualised(E.runTrial(ctx, zs).terminalPot, ctx)).sort((x, y) => x - y);
    const band = E.luckyBand(0.04, vol / 100, ctx.totalYears + 1, sp / 100);
    near(`T=${T} sp=${sp}: lucky matches the simulated 90th percentile`, band.lucky * 100, quantile(rs, 0.90), 0.20,
      `band ${(band.lucky * 100).toFixed(2)}%  sim ${quantile(rs, 0.90).toFixed(2)}%`);
    near(`T=${T} sp=${sp}: unlucky matches the simulated 10th percentile`, band.unlucky * 100, quantile(rs, 0.10), 0.20,
      `band ${(band.unlucky * 100).toFixed(2)}%  sim ${quantile(rs, 0.10).toFixed(2)}%`);
  }
}

console.log('\n=== the CMA tier table is coherent ===');
{
  const t = CMA.tiers;
  ok('volatility falls as the bond weight rises', CMA.monotonicVolatility);
  const keys = ['High Risk', 'Medium/High Risk', 'Medium Risk', 'Medium/Low Risk', 'Low Risk'];
  ok('real return falls with risk too', keys.every((k, i) => i === 0 || t[k].real < t[keys[i - 1]].real),
    keys.map(k => t[k].real).join(' > '));
  ok('every tier carries a non-zero sigmaParam', Object.values(t).every(x => x.sigmaParam > 0),
    Object.entries(t).map(([k, v]) => `${k.split(' ')[0]}:${v.sigmaParam}`).join(' '));
  ok('cash has zero volatility but non-zero forecast uncertainty',
    t['Cash Equivalents'].volatility === 0 && t['Cash Equivalents'].sigmaParam > 1,
    `vol ${t['Cash Equivalents'].volatility}, sigmaParam ${t['Cash Equivalents'].sigmaParam}`);
  // the deflation is the step most likely to be silently skipped
  const i = CMA.inflationUsed / 100;
  ok('real is the Fisher deflation of nominal at the stated inflation',
    Object.values(t).every(x => Math.abs(((1 + x.nominal / 100) / (1 + i) - 1) * 100 - x.real) < 0.02),
    `checked at ${CMA.inflationUsed}%`);
  ok('and real is therefore below nominal everywhere', Object.values(t).every(x => x.real < x.nominal));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
