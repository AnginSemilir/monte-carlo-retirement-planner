/*
 * THE GENERATORS (27 Oct; the pattern search for the sizing check's fault, CHECKLIST 7; EXPLORATORY, no seed of Phase 4's).
 * The sizing's simulation check (size-phase4.mjs) drew one long mulberry32 stream and read the false-alarm rate 3.7 se above
 * the exact sum, which a brute-force sum confirms; its generator is now xoshiro128**. mulberry32 is also the engine's (App.jsx
 * gaussianPath, each path from seed + 7919 i) and that of many research scripts. Two checks:
 *   1. one long stream (d 10.5%, N 16,000, 20,000 replicates, 3.2e8 draws): the share of observed losses above the threshold
 *      under mulberry32, xoshiro128** and Math.random, against the exact sum;
 *   2. the engine's own path draws (16,000 paths of 61 years on each of four seeds that are not held out) against N(0, 1):
 *      the mean, the variance and the two lower tails, in standard errors.
 *   node research/solver/prng-check.mjs > research/solver/results-prng-check.txt
 */
import * as E from '../engine.mjs';
import { harmRate, thresholdFor, simulateRate, mulberry, xoshiro, FP_LOSS } from './size-phase4.mjs';

const d = 0.105, N = 16000, R = 20000, t = thresholdFor(d, N), ex = harmRate(d, N, t, FP_LOSS), se = Math.sqrt(ex * (1 - ex) / R);
console.log(`THE GENERATORS (EXPLORATORY)\n1. one stream of ${(R * N / 1e8).toFixed(1)}e8 draws: d ${100 * d}% N ${N} t ${t} at a true loss of ${FP_LOSS}, the exact rate ${ex.toFixed(5)} (se ${se.toFixed(5)} at ${R} replicates)`);
for (const [name, g] of [['mulberry32', mulberry(12345)], ['xoshiro128**', xoshiro(12345)], ['Math.random', Math.random]]) {
  const sim = simulateRate(g, d, N, t, FP_LOSS, R);
  console.log(`  ${name.padEnd(13)} ${sim.toFixed(5)} (${((sim - ex) / se).toFixed(2)} se)`);
}
console.log('2. the engine\'s path draws against N(0, 1), in se (16,000 paths of 61 years a seed)');
for (const seed of [7001, 7002, 7005, 99001]) {
  let n = 0, m = 0, v = 0, t1 = 0, t2 = 0;
  for (const zs of E.pathsForSeed(seed, 16000, 59)) for (let k = 0; k < 61; k++) { const z = zs[k]; n++; m += z; v += z * z; if (z < -1.6449) t1++; if (z < -2.3263) t2++; }
  m /= n; v = v / n - m * m;
  const tail = (x, p) => ((x / n - p) / Math.sqrt(p * (1 - p) / n)).toFixed(2);
  console.log(`  seed ${seed}: ${n} draws; mean ${(m * Math.sqrt(n)).toFixed(2)}, variance ${((v - 1) / Math.sqrt(2 / n)).toFixed(2)}, below -1.645 ${tail(t1, 0.05)}, below -2.326 ${tail(t2, 0.01)}`);
}
