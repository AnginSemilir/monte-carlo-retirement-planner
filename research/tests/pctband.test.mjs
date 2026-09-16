/*
 * luckyBand: the 90th and 10th percentile of the annualised return, derived from the tier's sigma and
 * the plan's horizon rather than typed in as a fixed margin around the mean.
 *
 * These rates no longer drive any chart. They survive because the Config risk matrix reports them, where
 * the claim is about the *rate* and is true: over T years the annualised return lands inside this band
 * eight times in ten. It was the leap from that rate to a *pot* that failed, once withdrawals gave
 * sequence-of-returns risk something to bite on, and the pot question now belongs to the Monte Carlo
 * fan chart (see mcfan.test.mjs) which reads its percentiles off the simulated paths themselves.
 */
import * as E from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const near = (n, a, b, tol, extra = '') => ok(n, Math.abs(a - b) <= tol, extra || `got ${a.toFixed(4)}, expected ${b.toFixed(4)} (tol ${tol})`);

const pct = (n) => (n * 100).toFixed(3) + '%';

console.log('=== shape ===');
{
  const b = E.luckyBand(0.0444, 0.155, 45);
  ok('lucky is above the expected rate', b.lucky > 0.0444, pct(b.lucky));
  ok('unlucky is below the expected rate', b.unlucky < 0.0444, pct(b.unlucky));
  // symmetric in log space, which is where the distribution is normal
  const up = Math.log(1 + b.lucky) - Math.log(1.0444);
  const dn = Math.log(1.0444) - Math.log(1 + b.unlucky);
  near('symmetric about the median in log space', up, dn, 1e-12);
  ok('but asymmetric in simple percentage terms', (b.lucky - 0.0444) > (0.0444 - b.unlucky), `${pct(b.lucky - 0.0444)} up vs ${pct(0.0444 - b.unlucky)} down`);
}

console.log('\n=== the band narrows with the horizon ===');
{
  const t5 = E.luckyBand(0.03, 0.08, 5);
  const t20 = E.luckyBand(0.03, 0.08, 20);
  const t45 = E.luckyBand(0.03, 0.08, 45);
  ok('45 years is tighter than 20', (t45.lucky - t45.unlucky) < (t20.lucky - t20.unlucky), `${pct(t45.lucky - t45.unlucky)} vs ${pct(t20.lucky - t20.unlucky)}`);
  ok('20 years is tighter than 5', (t20.lucky - t20.unlucky) < (t5.lucky - t5.unlucky), `${pct(t20.lucky - t20.unlucky)} vs ${pct(t5.lucky - t5.unlucky)}`);
  // the spread scales as 1/sqrt(T): quadrupling the horizon halves it, in log terms
  const spread = (b) => Math.log(1 + b.lucky) - Math.log(1 + b.unlucky);
  near('quadrupling the horizon halves the log spread', spread(E.luckyBand(0.03, 0.08, 20)), spread(E.luckyBand(0.03, 0.08, 5)) / 2, 1e-12);
}

console.log('\n=== degenerate inputs ===');
{
  const flat = E.luckyBand(0.03, 0, 30);
  near('zero volatility collapses the band onto the expected rate (lucky)', flat.lucky, 0.03, 1e-12);
  near('zero volatility collapses the band onto the expected rate (unlucky)', flat.unlucky, 0.03, 1e-12);
  const one = E.luckyBand(0.0444, 0.155, 1);
  near('a one-year horizon gives the one-year 90th percentile', one.lucky, Math.exp(Math.log(1.0444) + 1.2815515655446004 * 0.155) - 1, 1e-12);
  const zeroT = E.luckyBand(0.03, 0.08, 0);
  near('a zero horizon is floored at one year', zeroT.lucky, E.luckyBand(0.03, 0.08, 1).lucky, 1e-12);
  const neg = E.luckyBand(-0.005, 0.005, 30);
  ok('a negative expected rate still brackets correctly', neg.unlucky < -0.005 && neg.lucky > -0.005, `${pct(neg.unlucky)} .. ${pct(neg.lucky)}`);
}

console.log('\n=== agrees with the simulation it claims to summarise ===');
// Compound a unit pot for T years using the engine's own per-year draw, then check the 10th and 90th
// percentile of the result against the band rate compounded over the same horizon.
{
  const quantile = (arr, q) => { const s = arr.slice().sort((a, b) => a - b); const i = (s.length - 1) * q; const lo = Math.floor(i), hi = Math.ceil(i); return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo); };
  for (const [name, real, vol, T] of [['Highest / 45yr', 0.0444, 0.155, 45], ['Medium / 30yr', 0.03, 0.08, 30], ['Low / 20yr', 0.0156, 0.03, 20]]) {
    const TRIALS = 60000;
    const pots = new Array(TRIALS);
    for (let i = 0; i < TRIALS; i++) {
      const zs = E.gaussianPath((7001 + i * 7919) >>> 0, T);
      let v = 1;
      for (let t = 0; t < T; t++) v *= 1 + (Math.exp(Math.log(1 + real) + vol * zs[t]) - 1);
      pots[i] = v;
    }
    const b = E.luckyBand(real, vol, T);
    // compare annualised, so the tolerance reads in the same units the chart shows
    const annP90 = Math.pow(quantile(pots, 0.90), 1 / T) - 1;
    const annP10 = Math.pow(quantile(pots, 0.10), 1 / T) - 1;
    near(`${name}: lucky matches the simulated 90th percentile`, b.lucky, annP90, 0.0015, `band ${pct(b.lucky)} vs sim ${pct(annP90)}`);
    near(`${name}: unlucky matches the simulated 10th percentile`, b.unlucky, annP10, 0.0015, `band ${pct(b.unlucky)} vs sim ${pct(annP10)}`);
  }
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
