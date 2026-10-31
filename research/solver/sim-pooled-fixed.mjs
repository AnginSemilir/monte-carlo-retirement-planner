/*
 * THE POOLED FLOOR AT A FIXED PATH COUNT (the eighty-fifth and eighty-sixth reviews, 26 Sep; O28). results-pooled-floor.txt
 * reads the floor through 7e's two looks (1,000 paths, then 3,000 or 8,000) with Holm across 24 cases; this reads it at one
 * fixed count, the way a later test would. Every one of 7e's 16 pool cases loses 0.1 points, one-sided (its losses drawn
 * over its recorded discordance, half each way, as sim-pooled-floor.mjs draws them; "no background": nothing but the loss).
 * How often each pooled form HOLDS (its lower end above -0.1) - the nominal rate is 2.5%:
 *   fixed effect and random effects (stats.mjs pooledFE, pooledRE: each case weighted by its own counts);
 *   summed: the 16 cases' paired cells added into one table, read by stats.mjs survivalChangeU (weights by paths, not by
 *   counts; each case's off survival from 7c's records, as sim-pooled-floor.mjs has them) - the draft's candidate.
 * 20,000 draws a row, mulberry32 seed 7002.
 *   node research/solver/sim-pooled-fixed.mjs > research/solver/results-pooled-fixed.txt
 */
import { pooledRE, pooledFE, survivalChangeU } from './stats.mjs';

// 7e's pool: discordant paths per 1,000 and off's survival (%), from sim-pooled-floor.mjs (7c's records)
const rec = { S126: [3, 99.6], 'share 0.90': [0, 99.3], 'bridge 1': [0, 98.8], 'bridge 4': [10, 99.2], 'wealth x0.5': [10, 95.5], 'wealth x2': [1, 100], S120: [0, 100], S122: [1, 99.6], S124: [2, 94.7], S128: [50, 68.8], S130: [27, 83.1], 'bridge 6': [1, 99.3], S366: [4, 98.6], S162: [2, 99], S172: [2, 99], S168: [2, 99] };
let st = 7002 >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const poisson = l => { if (l <= 0) return 0; if (l > 30) { let u = 0; while (u === 0) u = rnd(); const v = rnd(); return Math.max(0, Math.round(l + Math.sqrt(l) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))); } const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const R = 20000, LOSS = 0.1, FLOOR = -0.1;
console.log(`THE POOLED FLOOR AT A FIXED PATH COUNT: every one of 7e's 16 pool cases loses ${LOSS} points, one-sided; how often each pooled form HOLDS (lower end above ${FLOOR}); nominal 2.5%; ${R} draws a row\n`);
console.log('paths  background  | fixed effect  random effects  summed (unconditional) | fixed effect mean');
for (const [N, bg] of [[3000, true], [8000, true], [3000, false], [8000, false]]) {
  let fe = 0, re = 0, su = 0, feMean = 0;
  for (let r = 0; r < R; r++) {
    const cases = Object.entries(rec).map(([, [disc, sim]]) => {
      const lam = bg ? disc * N / 1000 : 0, net = LOSS * N / 100;
      return { b: poisson(lam / 2 + net), c: poisson(lam / 2), N, survA: Math.round(N * sim / 100) };
    });
    const f = pooledFE(cases), rr = pooledRE(cases);
    feMean += f.mean / R;
    if (f.lo > FLOOR) fe++;
    if (rr.lo > FLOOR) re++;
    let a = 0, b = 0, c = 0, d = 0;
    for (const x of cases) { const bb = Math.min(x.b, x.survA), cc = Math.min(x.c, x.N - x.survA); a += x.survA - bb; b += bb; c += cc; d += x.N - x.survA - cc; }
    if (survivalChangeU(a, b, c, d).lo > FLOOR) su++;
  }
  const pc = x => `${(100 * x / R).toFixed(1).padStart(5)}%`;
  console.log(`${String(N).padStart(5)}  ${(bg ? "7e's" : 'none').padEnd(10)}  | ${pc(fe).padStart(12)}  ${pc(re).padStart(14)}  ${pc(su).padStart(21)} | ${feMean.toFixed(3)}`);
}
