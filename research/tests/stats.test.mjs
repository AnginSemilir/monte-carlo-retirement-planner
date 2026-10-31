/*
 * THE PAIRED STATISTICS (research/solver/stats.mjs), on the outside review's own worked figures (its Appendix A and
 * section 19's planted checks). Planted: the old "beyond two se" reading must disagree with the exact outcome on at
 * least one of the worked cases (O19's 4 lost and 0 saved read "at the line"; exactly it is no material harm).
 *   node research/tests/stats.test.mjs
 */
import assert from 'node:assert/strict';
import { mcnemarHarmP, clopperPearson, survivalChange, holm, outcome, pathsNeeded, binomUpperHalf, pooledRE, pooledFE, pooledSummed, signTest,
  normUpper, zFor, wilson, survivalChangeU } from '../solver/stats.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// A2: exact one-sided p-values
for (const [b, c, want] of [[3, 0, 1 / 8], [4, 0, 1 / 16], [7, 1, 9 / 256], [9, 1, 11 / 1024], [8, 0, 1 / 256], [23, 0, 2 ** -23]])
  ok(near(mcnemarHarmP(b, c), want, 1e-12 + want * 1e-9), `exact p for ${b} lost, ${c} saved: ${mcnemarHarmP(b, c).toPrecision(4)} (A2: ${want.toPrecision(4)})`);
ok(mcnemarHarmP(0, 0) === 1 && binomUpperHalf(0, 5) === 1, 'no discordant paths: p = 1');
// above about 1,075 tosses 2^-n underflows: the tail once read 1 for every k (found 26 Sep, building 7r's median interval
// at 3,000 paths). The references are exact, from Python's integers: sum(comb(3000, i) for i >= k) / 2**3000
{ const p1 = binomUpperHalf(1540, 3000), p2 = binomUpperHalf(1600, 3000), p3 = binomUpperHalf(1460, 3000);
  ok(near(p1, 0.07459769349731893, 1e-9) && near(p2, 1.3928198051961686e-4, 1e-12) && near(p3, 0.930416433308436, 1e-9), `3,000 tosses: P(X >= 1540) ${p1.toFixed(6)} (0.074598), P(X >= 1600) ${p2.toExponential(4)} (1.3928e-4), P(X >= 1460) ${p3.toFixed(6)} (0.930416)`); }
// the log-space branch, both of its tails (1,200 tosses is over the switch): P(X >= n - j + 1) = P(X <= j - 1)
ok(near(binomUpperHalf(621, 1200) + binomUpperHalf(580, 1200), 1, 1e-12) && near(binomUpperHalf(600, 1200) + binomUpperHalf(601, 1200), 1, 1e-12), 'the log-space tail is symmetric about n/2 at 1,200 tosses: P(X >= 621) + P(X >= 580) = 1, and both tails agree');
// A4: exact intervals
{ const [lo, hi] = clopperPearson(4, 4); ok(near(lo, 0.398, 0.001) && hi === 1, `Clopper-Pearson 4 of 4: ${lo.toFixed(3)} to ${hi} (A4: 0.398 to 1)`); }
{ const [lo, hi] = clopperPearson(9, 10); ok(near(lo, 0.555, 0.001) && near(hi, 0.997, 0.001), `Clopper-Pearson 9 of 10: ${lo.toFixed(3)} to ${hi.toFixed(3)} (A4: 0.555 to 0.997)`); }
{ const s = survivalChange(4, 0, 3000); ok(near(s.lo, -0.13, 0.005) && near(s.hi, 0.03, 0.005), `4 lost of 3,000: change ${s.d.toFixed(2)}, interval ${s.lo.toFixed(2)} to +${s.hi.toFixed(2)} points (A4: -0.13 to +0.03)`); }
{ const s = survivalChange(9, 1, 1000); ok(near(s.lo, -0.99, 0.005) && near(s.hi, -0.11, 0.005), `9 lost, 1 saved of 1,000: interval ${s.lo.toFixed(2)} to ${s.hi.toFixed(2)} (A4: -0.99 to -0.11)`); }
// Holm: A3's first threshold, 0.05/21
{ const ps = Array(21).fill(0.5); ps[3] = 0.0024; const adj = holm(ps); ok(near(adj[3], 0.0504, 1e-9) && adj.every(p => p <= 1), `Holm over 21: the smallest p 0.0024 adjusts to ${adj[3].toFixed(4)} (0.05/21 = 0.00238 is the threshold)`); }
{ const adj = holm([0.01, 0.04, 0.03]); ok(near(adj[0], 0.03, 1e-12) && near(adj[2], 0.06, 1e-12) && near(adj[1], 0.06, 1e-12), `Holm step-down with monotonicity: [0.01, 0.04, 0.03] -> [${adj.map(x => x.toFixed(2)).join(', ')}]`); }
// section 19's planted cases, the three outcomes
const o1 = outcome({ b: 4, c: 0, N: 3000, margin: 0.25, pHolm: 0.0625 });
ok(o1.outcome === 'no material harm', `4 lost, 0 saved of 3,000 at a 0.25-point margin: ${o1.outcome}`);
const o2 = outcome({ b: 9, c: 1, N: 1000, margin: 0.5, pHolm: Math.min(1, 23 * mcnemarHarmP(9, 1)) });
ok(o2.outcome === 'inconclusive', `9 lost, 1 saved of 1,000 at a 0.5-point margin, Holm over 23: ${o2.outcome}`);
const o3 = outcome({ b: 30, c: 2, N: 3000, margin: 0.5, pHolm: Math.min(1, 23 * mcnemarHarmP(30, 2)) });
ok(o3.outcome === 'harm', `30 lost, 2 saved of 3,000: ${o3.outcome} (p ${mcnemarHarmP(30, 2).toExponential(1)})`);
const o4 = outcome({ b: 0, c: 0, N: 1000, margin: 0.25, pHolm: 1 });
ok(o4.outcome === 'no material harm', `0 of 0 discordant: ${o4.outcome}, never "at the line"`);
// A8: paths needed
ok(near(pathsNeeded(0.003, 0.0025), 1844, 5) && near(pathsNeeded(0.023, 0.0025), 14137, 20) && near(pathsNeeded(0.023, 0.005), 3534, 5), `paths needed: ${pathsNeeded(0.003, 0.0025)}, ${pathsNeeded(0.023, 0.0025)}, ${pathsNeeded(0.023, 0.005)} (A8: about 1,840, 14,100 and 3,530)`);
// the look's error rate: 9 lost, 1 saved of 1,000 alone (no Holm) is harm at 0.05 and inconclusive at the first look's 0.005
{ const p = mcnemarHarmP(9, 1); ok(outcome({ b: 9, c: 1, N: 1000, margin: 0.5, pHolm: p }).outcome === 'harm' && outcome({ b: 9, c: 1, N: 1000, margin: 0.5, pHolm: p, level: 0.005 }).outcome === 'inconclusive', 'the look\'s error rate: harm at 0.05, inconclusive at 0.005 (p 0.011)'); }
// the pooled mean: equal households give their common change and no heterogeneity; a mix gives a wider interval
{ const eq = pooledRE([{ b: 2, c: 12, N: 1000 }, { b: 2, c: 12, N: 1000 }, { b: 2, c: 12, N: 1000 }]);
  ok(Math.abs(eq.mean - 1.0) < 1e-12 && eq.tau2 === 0 && eq.lo < 1 && eq.hi > 1, `pooled over three equal households: ${eq.mean.toFixed(2)} (${eq.lo.toFixed(2)} to ${eq.hi.toFixed(2)}), tau^2 ${eq.tau2}`);
  const mix = pooledRE([{ b: 0, c: 40, N: 1000 }, { b: 40, c: 0, N: 1000 }, { b: 0, c: 0, N: 1000 }]);
  ok(mix.tau2 > 0 && mix.lo < 0 && mix.hi > 0, `pooled over +4, -4 and 0 points: ${mix.mean.toFixed(2)} (${mix.lo.toFixed(2)} to ${mix.hi.toFixed(2)}), tau^2 ${mix.tau2.toFixed(2)} > 0`); }
{ const st = signTest([1, 2, 3, 4, 5, 6, 7, 8, 0, -1]); ok(st.pos === 8 && st.neg === 1 && Math.abs(st.p - 2 * 10 / 512) < 1e-12, `sign test 8 up, 1 down: p ${st.p.toFixed(4)}`); }
// the fixed-effect pool (7e's floor, the maintainer 25 Sep 22:45 UK): equal cases give the random-effects answer (tau^2 0);
// a large gain on one case raises its mean and cannot lower its lower end, where the random-effects lower end falls
{ const eq = [{ b: 2, c: 12, N: 1000 }, { b: 2, c: 12, N: 1000 }, { b: 2, c: 12, N: 1000 }], fe = pooledFE(eq), re = pooledRE(eq);
  ok(Math.abs(fe.mean - re.mean) < 1e-12 && Math.abs(fe.lo - re.lo) < 1e-12 && fe.k === 3, `fixed effect equals random effects when the cases agree: ${fe.mean.toFixed(3)} (${fe.lo.toFixed(3)} to ${fe.hi.toFixed(3)})`);
  const calm = Array.from({ length: 15 }, () => ({ b: 1, c: 1, N: 1000 })), gain = [...calm, { b: 0, c: 30, N: 1000 }];
  const f0 = pooledFE(calm), f1 = pooledFE(gain), r0 = pooledRE(calm), r1 = pooledRE(gain);
  ok(f1.mean > f0.mean && f1.lo > f0.lo, `fixed effect: one case gaining 3 points lifts the mean and the lower end (${f0.lo.toFixed(3)} -> ${f1.lo.toFixed(3)})`);
  ok(r1.lo < f1.lo, `planted: random effects over the same cases puts the lower end lower (${r1.lo.toFixed(3)} against ${f1.lo.toFixed(3)}), the widening a gain causes`);
  const loss = pooledFE(Array.from({ length: 16 }, () => ({ b: 3, c: 1, N: 1000 })));
  ok(Math.abs(loss.mean + 0.2) < 1e-12 && loss.lo < -0.1, `fixed effect: a 0.2-point loss on every case reads ${loss.mean.toFixed(3)} (${loss.lo.toFixed(3)} to ${loss.hi.toFixed(3)}), below -0.1`);
  ok(pooledFE([]) === null, 'fixed effect: no cases, no pool'); }
// planted: the old two-se reading disagrees with the exact outcome on O19's 4 lost, 0 saved
{ const b = 4, c = 0, N = 3000, net = c - b, disc = b + c; const oldBeyondOrLine = net * net >= 4 * disc;
  ok(oldBeyondOrLine && o1.outcome === 'no material harm', 'planted: the old rule reads 4 lost, 0 saved as at or beyond two se; the exact outcome is no material harm, so the two disagree'); }
// THE UNCONDITIONAL PAIRED INTERVAL (the eighty-fourth review, 26 Sep, BLOCKING 2): survivalChange conditions on the
// discordant count, so with every discordant path lost its lower end is the point estimate; survivalChangeU (Newcombe 1998,
// method 10) counts the chance in that count too. Reference values for the normal tail and Wilson's interval; the planted
// fault shown in the old interval; and the calibration that matters, by simulation: at a true one-sided loss exactly at
// the 0.25 margin, how often each reads "no material harm" (nominal 2.5%). Newcombe's worked example (36, 12, 2, 0) reads
// 0.0569 to 0.3404 here; its published figures are NOT CHECKED (no reference implementation in reach).
ok(near(normUpper(1.96), 0.0249979, 2e-7) && near(normUpper(5), 2.8665e-7, 1e-10) && near(zFor(0.05), 1.95996, 1e-4) && near(zFor(0.005), 2.80703, 1e-4), `the normal tail and z: P(Z > 1.96) ${normUpper(1.96).toFixed(7)}, z ${zFor(0.05).toFixed(4)} at 0.05 and ${zFor(0.005).toFixed(4)} at 0.005`);
{ const [l0, u0] = wilson(0, 10, zFor(0.05)); ok(near(l0, 0, 1e-12) && near(u0, 0.2775, 1e-4), `Wilson's interval for 0 of 10: 0 to ${u0.toFixed(4)} (0.2775)`); }
{ const old = survivalChange(7, 0, 3000), u = survivalChangeU(2986, 7, 0, 7);
  ok(near(old.lo, old.d, 1e-9) && u.lo < old.d - 0.2, `planted: 7 lost, 0 saved of 3,000 - the conditional lower end is the point estimate (${old.lo.toFixed(3)}), the unconditional one below it (${u.lo.toFixed(3)} to ${u.hi.toFixed(3)})`);
  ok(outcome({ b: 7, c: 0, N: 3000, margin: 0.25, pHolm: 0.01 }).outcome === 'no material harm' && !(u.lo > -0.25), 'planted: a 0.233-point loss reads "no material harm" on the conditional interval and not on the unconditional one'); }
{ let st = 7002 >>> 0; const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };   // mulberry32 (the old LCG cycled every 10,466 calls: the eighty-fifth review, MINOR 2)
  const pois = m => { const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
  const R = 10000, N = 3000; let nmhU = 0, nmhC = 0;
  for (let r = 0; r < R; r++) { const failA = pois(N * 0.002), b = pois(N * 0.0025), survA = N - failA;   // A survives 99.8%; B loses 0.25 points more, none saved
    if (survivalChangeU(survA - b, b, 0, failA).lo > -0.25) nmhU++;
    if (survivalChange(b, 0, N).lo > -0.25) nmhC++; }
  ok(nmhU / R < 0.035 && nmhC / R > 0.4, `calibration at a true one-sided loss at the margin, ${R} draws at 3,000 paths: the unconditional interval reads "no material harm" ${(100 * nmhU / R).toFixed(1)}% of the time, the conditional ${(100 * nmhC / R).toFixed(1)}% (nominal 2.5%)`); }
// THE POOLED FLOOR, SUMMED (O28; the maintainer, 29 Sep 22:12 UK): the cells add, and the interval is survivalChangeU's
// over the sum; planted - the fixed-effect pool, weighting a household that lost fewer by chance more, reads a loss spread
// unevenly as smaller than the summed one does
{ const cases = [{ a: 7900, lost: 30, saved: 0, d: 70 }, { a: 7950, lost: 2, saved: 0, d: 48 }, { a: 7950, lost: 2, saved: 0, d: 48 }];
  const p = pooledSummed(cases), u = survivalChangeU(23800, 34, 0, 166);
  ok(p.cells.lost === 34 && p.N === 24000 && p.k === 3 && near(p.lo, u.lo, 1e-12) && near(p.d, u.d, 1e-12), `the summed pool is survivalChangeU over the added cells (${p.cells.lost} lost of ${p.N}; ${p.d.toFixed(3)}, ${p.lo.toFixed(3)} to ${p.hi.toFixed(3)})`);
  const fe = pooledFE(cases.map(x => ({ b: x.lost, c: x.saved, N: x.a + x.lost + x.saved + x.d })));
  ok(fe.mean > p.d, `planted: the fixed-effect pool reads the uneven loss as smaller (${fe.mean.toFixed(3)}) than the summed one (${p.d.toFixed(3)}) - the bias O28 found`);
  ok(pooledSummed([]) === null, 'an empty pool is null, not a pass'); }
console.log(`\nstats: ${n} passed`);
