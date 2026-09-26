/*
 * HOW OFTEN EACH SURVIVAL INTERVAL READS "NO MATERIAL HARM" AT A TRUE LOSS EXACTLY AT THE MARGIN (the eighty-fourth and
 * eighty-fifth reviews, 26 Sep). The registered exact interval (stats.mjs survivalChange) conditions on the number of
 * paths that differ; the unconditional one (survivalChangeU, Newcombe 1998 method 10) does not. Across the comparison arm's
 * survival (95% to 99.8%), the path count (1,000 to 8,000) and the look's level (0.05; 0.005 at 1,000 paths, the regimen's
 * first look), each arm's reading of "no material harm" (the interval's lower end above -0.25) is counted over 20,000
 * simulated draws of one-sided losses: arm A's failures drawn as Poisson(N (1 - survival)), and B losing Poisson(N x 0.0025)
 * more of A's survivors, saving none (the pattern of every harm in 7r, 7s and O23). The nominal rate is level / 2.
 * Poisson draws stand in for binomial ones (declared: at 95% survival they slightly overstate the spread of A's failures).
 * mulberry32, seed 7002.
 *   node research/solver/sim-unconditional.mjs > research/solver/results-sim-unconditional.txt
 */
import { survivalChange, survivalChangeU } from './stats.mjs';

let st = 7002 >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; if (m > 60) { let u = 0, v = 0; while (u === 0) u = rnd(); v = rnd(); return Math.max(0, Math.round(m + Math.sqrt(m) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))); } const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const R = 20000, MARGIN = 0.25;
console.log(`HOW OFTEN A TRUE LOSS OF EXACTLY ${MARGIN} POINTS READS "NO MATERIAL HARM" (one-sided losses, ${R} draws a row; the nominal rate is level / 2)\n`);
console.log('survival  paths  level  | unconditional  conditional  nominal');
for (const [surv, N, level] of [[0.998, 1000, 0.005], [0.998, 3000, 0.05], [0.998, 8000, 0.05], [0.99, 1000, 0.005], [0.99, 3000, 0.05], [0.99, 8000, 0.05], [0.95, 1000, 0.005], [0.95, 3000, 0.05], [0.95, 8000, 0.05]]) {
  let u = 0, c = 0;
  for (let r = 0; r < R; r++) {
    const failA = Math.min(N, pois(N * (1 - surv))), survA = N - failA, b = Math.min(survA, pois(N * MARGIN / 100));
    if (survivalChangeU(survA - b, b, 0, failA, level).lo > -MARGIN) u++;
    if (survivalChange(b, 0, N, level).lo > -MARGIN) c++;
  }
  console.log(`${(100 * surv).toFixed(1).padStart(6)}%  ${String(N).padStart(5)}  ${level.toFixed(3)}  | ${(100 * u / R).toFixed(1).padStart(10)}%  ${(100 * c / R).toFixed(1).padStart(10)}%  ${(100 * level / 2).toFixed(2).padStart(6)}%`);
}
