/*
 * THE PAIRED STATISTICS (research/solver/stats.mjs), on the outside review's own worked figures (its Appendix A and
 * section 19's planted checks). Planted: the old "beyond two se" reading must disagree with the exact outcome on at
 * least one of the worked cases (O19's 4 lost and 0 saved read "at the line"; exactly it is no material harm).
 *   node research/tests/stats.test.mjs
 */
import assert from 'node:assert/strict';
import { mcnemarHarmP, clopperPearson, survivalChange, holm, outcome, pathsNeeded, binomUpperHalf, pooledRE, pooledFE, signTest } from '../solver/stats.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// A2: exact one-sided p-values
for (const [b, c, want] of [[3, 0, 1 / 8], [4, 0, 1 / 16], [7, 1, 9 / 256], [9, 1, 11 / 1024], [8, 0, 1 / 256], [23, 0, 2 ** -23]])
  ok(near(mcnemarHarmP(b, c), want, 1e-12 + want * 1e-9), `exact p for ${b} lost, ${c} saved: ${mcnemarHarmP(b, c).toPrecision(4)} (A2: ${want.toPrecision(4)})`);
ok(mcnemarHarmP(0, 0) === 1 && binomUpperHalf(0, 5) === 1, 'no discordant paths: p = 1');
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
// the fixed-effect pool (7e's floor, the maintainer 25 Sep 22:47 UK): equal cases give the random-effects answer (tau^2 0);
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
console.log(`\nstats: ${n} passed`);
