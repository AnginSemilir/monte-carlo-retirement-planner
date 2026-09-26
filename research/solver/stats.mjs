/*
 * THE PAIRED STATISTICS (the outside review of 25 Sep, "Solver research: review, new findings and the updated regimen",
 * section 16; adopted by the maintainer 25 Sep 20:47 UK). Replaces "beyond two standard errors" for new tests:
 *   - exact conditional McNemar on the discordant paths (one-sided, for harm); mid-p only where a prediction declares it
 *   - a 95% exact interval for the survival change: Clopper-Pearson on the lost share, mapped to points
 *   - Holm's correction across the households of one comparison
 *   - three outcomes per household against a pre-registered margin: no material harm, harm, inconclusive
 *   - the paths needed to resolve a margin: N > 1.96^2 d / delta^2
 * All survival changes are in POINTS (percentage points); margins too. b = paths lost (arm A survives, arm B fails),
 * c = paths saved, N = paths in all.
 */

/* the regimen's margins, in points (the review's section 16 item 3; adopted by the maintainer 25 Sep 20:47 UK): 0.25
   where the comparison arm survives 95% or more, 0.5 below, 0.1 for a pooled mean. PLAN.md's decided-defaults block
   carries the same numbers ("margins"). */
export const MARGINS = Object.freeze({ high: 0.25, low: 0.5, pooled: 0.1, highAt: 95 });
export const marginFor = offSim => (offSim >= MARGINS.highAt ? MARGINS.high : MARGINS.low);

/* P(X >= k) for X ~ Bin(n, 1/2), exactly. Up to about 1,000 tosses the direct sum, as it always ran; above that 2^-n
 * underflows to 0 and the direct sum read 1 for every k (found 26 Sep building 7r, where n is 3,000 paths; no earlier
 * caller passed more than a few hundred: every one passes a McNemar discordant count or a household count), so the terms
 * are built in logs there, and the smaller tail is summed so a tiny p is not lost to 1 minus a sum near 1. */
export function binomUpperHalf(k, n) {
  if (k <= 0) return 1;
  if (k > n) return 0;
  if (n * Math.LN2 < 700) {
    let lp = -n * Math.LN2, term = Math.exp(lp), cdfBelow = 0;   // term = C(n, i) / 2^n, i from 0
    for (let i = 0; i < k; i++) { cdfBelow += term; term *= (n - i) / (i + 1); }
    return Math.max(0, 1 - cdfBelow);
  }
  let lp = -n * Math.LN2, below = 0, above = 0;   // lp = log C(n, i) - n log 2, i from 0
  for (let i = 0; i <= n; i++) { if (i < k) below += Math.exp(lp); else above += Math.exp(lp); lp += Math.log((n - i) / (i + 1)); }
  return k > n / 2 ? above : Math.max(0, 1 - below);
}
/* the one-sided exact McNemar p-value for harm: the chance of at least b losses in n = b + c fair tosses */
export function mcnemarHarmP(b, c, { midP = false } = {}) {
  const n = b + c;
  if (n === 0) return 1;
  const p = binomUpperHalf(b, n);
  return midP ? p - 0.5 * (binomUpperHalf(b, n) - binomUpperHalf(b + 1, n)) : p;
}

/* the regularised incomplete beta by continued fraction (Numerical Recipes betacf), for the binomial's exact bounds */
function lgamma(x) { const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const c of g) s += c / ++y; return -t + Math.log(2.5066282746310005 * s / x); }
function betacf(a, b, x) {
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return h;
}
export function betaInc(a, b, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}
function betaQuantile(p, a, b) { let lo = 0, hi = 1; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (betaInc(a, b, m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
/* Clopper-Pearson 95% (by default) interval for a binomial share: k of n */
export function clopperPearson(k, n, alpha = 0.05) {
  if (n === 0) return [0, 1];
  const lo = k === 0 ? 0 : betaQuantile(alpha / 2, k, n - k + 1);
  const hi = k === n ? 1 : betaQuantile(1 - alpha / 2, k + 1, n - k);
  return [lo, hi];
}
/* the survival change B - A in points, with its exact interval: Delta = (c - b)/N = n(1 - 2 pi)/N, pi = b/n.
   CONDITIONAL ON n (the eighty-fourth review, 26 Sep, BLOCKING 2): Clopper-Pearson on b of n treats the discordant count as
   fixed, so when every discordant path is lost (or every one saved) the interval's end on that side is the point estimate,
   and a true loss exactly at the margin reads "no material harm" about half the time with one-sided losses (P(n <= 7) =
   0.525 at 3,000 paths). The harm test (the exact McNemar p and the point loss) is sound; the no-material-harm and
   no-material-gain ends are not. survivalChangeU below counts the chance in n too, and is reported beside it. */
export function survivalChange(b, c, N, alpha = 0.05) {
  const n = b + c, d = 100 * (c - b) / N;
  if (n === 0) return { d: 0, lo: 0, hi: 0, n };
  const [pL, pU] = clopperPearson(b, n, alpha);
  return { d, lo: 100 * n * (1 - 2 * pU) / N, hi: 100 * n * (1 - 2 * pL) / N, n };
}
/* the standard normal's upper tail P(Z > z), by the complementary error function (Numerical Recipes erfcc, fractional
   error below 1.2e-7), and the z leaving level/2 in each tail (1.96 at 0.05, 2.81 at 0.005) */
export function normUpper(z) {
  const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.5 * x);
  const erfc = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return z >= 0 ? erfc / 2 : 1 - erfc / 2;
}
export function zFor(level) { let lo = 0, hi = 10; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (normUpper(m) > level / 2) lo = m; else hi = m; } return (lo + hi) / 2; }
/* Wilson's score interval for x of n at z */
export function wilson(x, n, z) {
  const p = x / n, z2 = z * z, den = 1 + z2 / n, mid = (p + z2 / (2 * n)) / den, h = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / den;
  return [mid - h, mid + h];
}
/*
 * THE PAIRED SURVIVAL CHANGE, UNCONDITIONALLY (Newcombe 1998, "Improved confidence intervals for the difference between
 * binomial proportions based on paired data", method 10: each arm's survival by Wilson's interval, combined through the
 * paired correlation phi). Cells: a both survive, b arm A survives and B fails (lost), c B survives and A fails (saved),
 * d both fail; the change B - A in points at 1 - level. Unlike survivalChange it counts the chance in how many paths
 * differ: at a true one-sided loss exactly at the 0.25 margin it reads "no material harm" at or below the nominal rate on
 * nearly every row of results-sim-unconditional.txt (sim-unconditional.mjs: survival 95% to 99.8%, 1,000 to 8,000 paths),
 * where survivalChange reads it about half the time - but 4.1% at 95% survival and 8,000 paths (nominal 2.5%), so it is not
 * exact either (the eighty-fifth review, MINOR 2). Reported beside the registered exact interval; it replaces it only by
 * the maintainer's decision (the regimen's item 1).
 */
export function survivalChangeU(a, b, c, d, level = 0.05) {
  const N = a + b + c + d, z = zFor(level), pB = (a + c) / N, pA = (a + b) / N, dl = pB - pA;
  const [lB, uB] = wilson(a + c, N, z), [lA, uA] = wilson(a + b, N, z);
  const den = Math.sqrt((a + c) * (b + d) * (a + b) * (c + d)), phi = den > 0 ? (a * d - b * c) / den : 0;
  const lo = dl - Math.sqrt(Math.max(0, (pB - lB) ** 2 - 2 * phi * (pB - lB) * (uA - pA) + (uA - pA) ** 2));
  const hi = dl + Math.sqrt(Math.max(0, (uB - pB) ** 2 - 2 * phi * (uB - pB) * (pA - lA) + (pA - lA) ** 2));
  return { d: 100 * dl, lo: 100 * lo, hi: 100 * hi, N };
}
/* Holm's step-down adjusted p-values, in the input order */
export function holm(ps) {
  const m = ps.length, idx = ps.map((p, i) => [p, i]).sort((x, y) => x[0] - y[0]), adj = new Array(m);
  let run = 0;
  idx.forEach(([p, i], r) => { run = Math.max(run, Math.min(1, (m - r) * p)); adj[i] = run; });
  return adj;
}
/*
 * The three outcomes for one household (section 16, item 4): no material harm when the interval's lower end is above
 * minus the margin; harm when the Holm-adjusted p is below 0.05 AND the point loss is at least the margin; otherwise
 * inconclusive. 0 of 0 discordant is no material harm (the interval is the point 0), never "at the line".
 */
export function outcome({ b, c, N, margin, pHolm, level = 0.05 }) {
  // `level` is the look's error rate: the interval is at 1 - level and harm needs pHolm below it (section 16 item 8:
  // two looks at 0.005 then 0.045; a single look at 0.05)
  const iv = survivalChange(b, c, N, level);
  if (iv.lo > -margin) return { ...iv, outcome: 'no material harm' };
  if (pHolm < level && -iv.d >= margin) return { ...iv, outcome: 'harm' };
  return { ...iv, outcome: 'inconclusive' };
}
/*
 * A random-effects pooled mean change (DerSimonian-Laird) with its 95% interval, over households' paired changes in
 * points. Each household's variance is (discordant - net^2 / N) / N^2, in points^2, floored at one discordant path so a
 * household with none still carries weight (declared: the floor is a choice, not part of the method).
 */
export function pooledRE(cases) {
  const k = cases.length; if (!k) return null;
  const d = cases.map(x => 100 * (x.c - x.b) / x.N), v = cases.map(x => { const n = x.b + x.c, net = x.c - x.b; return 1e4 * Math.max(1, n - net * net / x.N) / (x.N * x.N); });
  const w = v.map(x => 1 / x), sw = w.reduce((a, b) => a + b, 0), mw = w.reduce((a, x, i) => a + x * d[i], 0) / sw;
  const Q = w.reduce((a, x, i) => a + x * (d[i] - mw) ** 2, 0), sw2 = w.reduce((a, x) => a + x * x, 0);
  const tau2 = k > 1 ? Math.max(0, (Q - (k - 1)) / (sw - sw2 / sw)) : 0;
  const ws = v.map(x => 1 / (x + tau2)), sws = ws.reduce((a, b) => a + b, 0), mean = ws.reduce((a, x, i) => a + x * d[i], 0) / sws, se = Math.sqrt(1 / sws);
  return { mean, lo: mean - 1.96 * se, hi: mean + 1.96 * se, tau2, k };
}
/*
 * A fixed-effect (inverse-variance) pooled mean change with its 95% interval, over the same per-household variances as
 * pooledRE. Its interval does not widen with the spread between households, so a gain on one household cannot pull the
 * lower end down: the floor for a registered set of cases expected unchanged (the forty-eighth review's MINOR 2; the
 * maintainer chose it for 7e's pooled floor, 25 Sep 22:45 UK; results-pooled-floor.txt).
 */
export function pooledFE(cases) {
  const k = cases.length; if (!k) return null;
  const d = cases.map(x => 100 * (x.c - x.b) / x.N), v = cases.map(x => { const n = x.b + x.c, net = x.c - x.b; return 1e4 * Math.max(1, n - net * net / x.N) / (x.N * x.N); });
  const w = v.map(x => 1 / x), sw = w.reduce((a, b) => a + b, 0), mean = w.reduce((a, x, i) => a + x * d[i], 0) / sw, se = Math.sqrt(1 / sw);
  return { mean, lo: mean - 1.96 * se, hi: mean + 1.96 * se, k };
}
/* the two-sided sign test over households' changes (zeros dropped) */
export function signTest(ds) {
  const pos = ds.filter(x => x > 0).length, neg = ds.filter(x => x < 0).length, n = pos + neg;
  if (!n) return { pos, neg, p: 1 };
  return { pos, neg, p: Math.min(1, 2 * binomUpperHalf(Math.max(pos, neg), n)) };
}
/* the paths needed so the interval's half-width fits the margin at discordance d (both as fractions) */
export const pathsNeeded = (d, delta) => Math.ceil(1.96 * 1.96 * d / (delta * delta));
