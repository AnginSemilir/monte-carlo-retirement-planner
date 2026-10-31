// THE POOLED FLOOR SIMULATED (the forty-eighth review, MINOR 2; rebuilt 26 Sep after the forty-ninth review's BLOCKING 1:
// the first version's generator, (seed * 1103515245 + 12345) % 2^31 in doubles, lost its low bits past 2^53 and cycled
// every 10,466 draws, so its "4,000 runs" were a few dozen repeated). Now mulberry32, a sound 32-bit generator.
//   node research/solver/sim-pooled-floor.mjs > research/solver/results-pooled-floor.txt
// What it simulates: 7e's primary read over its pool (reduce-7e.mjs POOL), look 1 at 1,000 paths and look 2 at the
// registered counts (8,000 for bridge 4, wealth x0.5, S130 and S128; 3,000 for the rest), per-case outcomes by the exact
// rule (stats.mjs outcome, Holm across all 24 wave-1 cases as registered - since the fiftieth review, 26 Sep; the first rebuild ran
// Holm across the 16 pool cases, which the fiftieth review showed overstates harm by 4 to 8 points), and the pooled
// floor both ways: random effects (the regimen's) and fixed effect (the maintainer's
// choice of 25 Sep 22:45 UK). Discordance and off survival per case from 7c's records (results-derive-7e.txt); S162,
// S172 and S168, with no record, at 2 discordant and 99%. Reported per scenario: how often the floor fires, and how often
// the whole primary falsifier fires (harm on any of the 24 wave-1 cases, or the floor).
import { pooledRE, pooledFE, mcnemarHarmP, holm, outcome, marginFor } from './stats.mjs';

const rec = { S126: [3, 99.6], 'share 0.90': [0, 99.3], 'bridge 1': [0, 98.8], 'bridge 4': [10, 99.2], 'wealth x0.5': [10, 95.5], 'wealth x2': [1, 100], S120: [0, 100], S122: [1, 99.6], S124: [2, 94.7], S128: [50, 68.8], S130: [27, 83.1], 'bridge 6': [1, 99.3], S366: [4, 98.6], S162: [2, 99], S172: [2, 99], S168: [2, 99] };
// the eight wave-1 cases outside the pool: in Holm's family and the harm test, not in the floor; their 7c discordance
// (results-derive-7e.txt) and the prediction's expected change (Point and interval: share 0.95 +15, S360 +8, S370 +4,
// bridge 4+cost +2, the rest 0)
const other = { 'share 0.50': [0, 99.3, 0], 'share 0.70': [0, 99.3, 0], 'share 0.78': [4, 99.7, 0], 'share 0.95': [222, 72.7, 15], 'bridge 0': [0, 99.2, 0], S360: [114, 34.4, 8], S370: [112, 68.9, 4], 'bridge 4+cost': [49, 93.7, 2] };
for (const [id, [n, sim]] of Object.entries(other)) rec[id] = [n, sim];
const POOL = ['S126', 'share 0.90', 'bridge 1', 'bridge 4', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S124', 'S128', 'S130', 'bridge 6', 'S366', 'S162', 'S172', 'S168'];
const LONG = ['bridge 4', 'wealth x0.5', 'S130', 'S128'], L2 = id => (LONG.includes(id) ? 8000 : 3000);
function mulberry32(a) { return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let rnd = mulberry32(424242);
function poisson(l) { if (l <= 0) return 0; if (l > 30) { let u = 0, v = 0; while (u === 0) u = rnd(); v = rnd(); return Math.max(0, Math.round(l + Math.sqrt(l) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))); } let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; }
// a case's discordant draws at N paths under a true change of g points: half the recorded discordance each way, plus the net
function draw(id, g, N) { const lam = rec[id][0] * N / 1000, net = g * N / 100; return { c: poisson(lam / 2 + Math.max(0, net)), b: poisson(lam / 2 + Math.max(0, -net)) }; }
function run(gains = {}, trials = 4000, seed = 424242) {
  rnd = mulberry32(seed);
  let re = 0, fe = 0, allRE = 0, allFE = 0, harmN = 0;
  const gOf = id => (id in other ? other[id][2] : typeof gains === 'number' ? gains : (gains[id] || 0));
  for (let t = 0; t < trials; t++) {
    const ids = Object.keys(rec);
    const l1 = ids.map(id => { const d = draw(id, gOf(id), 1000); return { id, ...d, N: 1000, margin: marginFor(rec[id][1]), level: 0.005 }; });
    l1.forEach(x => (x.p = mcnemarHarmP(x.b, x.c))); const a1 = holm(l1.map(x => x.p));
    let rows = l1.map((x, i) => {
      const o = outcome({ b: x.b, c: x.c, N: 1000, margin: x.margin, pHolm: a1[i], level: 0.005 });
      if (o.outcome !== 'inconclusive') return x;
      const N2 = L2(x.id), e = draw(x.id, gOf(x.id), N2 - 1000);   // the first 1,000 are look 1's paths
      return { ...x, b: x.b + e.b, c: x.c + e.c, N: N2, level: 0.045 };
    });
    rows.forEach(x => (x.p = mcnemarHarmP(x.b, x.c))); const a2 = holm(rows.map(x => x.p));
    const harm = rows.some((x, i) => outcome({ b: x.b, c: x.c, N: x.N, margin: x.margin, pHolm: a2[i], level: x.level }).outcome === 'harm');
    const pool = rows.filter(x => POOL.includes(x.id)), fr = !(pooledRE(pool).lo > -0.1), ff = !(pooledFE(pool).lo > -0.1);
    re += fr; fe += ff; allRE += fr || harm; allFE += ff || harm; harmN += harm;
  }
  const pc = x => `${(100 * x / trials).toFixed(1).padStart(5)}%`;
  return `floor RE ${pc(re)}  FE ${pc(fe)}  | harm alone ${pc(harmN)} | falsifier RE ${pc(allRE)}  FE ${pc(allFE)}  gap ${(100 * (allRE - allFE) / trials).toFixed(1).padStart(5)}`;
}
console.log('7e\'s pool, look 1 at 1,000 paths and look 2 at the registered counts (8,000 on the four long cases, 3,000 on the rest);');
console.log('4,000 simulated runs per scenario, mulberry32 seed 424242 (and 7 and 99 for no change). The floor fires when its lower end is at or below -0.1.');
console.log('Holm across all 24 wave-1 cases; the 8 outside the pool at the prediction\'s expected change. "harm alone" = the per-case tests; "falsifier" = harm or the floor; "gap" = RE minus FE, in points.');
console.log(`  no change on any pool case                ${run()}`);
console.log(`  no change, seed 7                         ${run({}, 4000, 7)}`);
console.log(`  no change, seed 99                        ${run({}, 4000, 99)}`);
for (const id of ['S124', 'bridge 4', 'S130', 'S128']) console.log(`  ${id.padEnd(9)} gains 3 points, the rest none  ${run({ [id]: 3 })}`);
console.log(`  every pool case loses 0.1 points          ${run(-0.1)}`);
console.log(`  every pool case loses 0.2 points          ${run(-0.2)}`);
console.log(`  S128 and S130 each lose 1 point           ${run({ S128: -1, S130: -1 })}`);
console.log(`  S128 and S130 each lose 0.5 points        ${run({ S128: -0.5, S130: -0.5 })}`);
console.log(`  bridge 4 and wealth x0.5 each lose 0.3    ${run({ 'bridge 4': -0.3, 'wealth x0.5': -0.3 })}`);
console.log(`  S128 loses 1.5 points                     ${run({ S128: -1.5 })}`);
console.log(`  S124, S122 and S366 each lose 0.3         ${run({ S124: -0.3, S122: -0.3, S366: -0.3 })}`);
console.log(`  the four long cases each lose 0.3         ${run({ 'bridge 4': -0.3, 'wealth x0.5': -0.3, S130: -0.3, S128: -0.3 })}`);
console.log(`  the four long cases each lose 0.5         ${run({ 'bridge 4': -0.5, 'wealth x0.5': -0.5, S130: -0.5, S128: -0.5 })}`);
console.log(`  six covered cases each lose 0.2           ${run({ S126: -0.2, 'bridge 4': -0.2, 'wealth x0.5': -0.2, S122: -0.2, S124: -0.2, S366: -0.2 })}`);
console.log(`  eight covered cases each lose 0.15        ${run({ S126: -0.15, 'bridge 4': -0.15, 'wealth x0.5': -0.15, S122: -0.15, S124: -0.15, S366: -0.15, 'bridge 1': -0.15, 'share 0.90': -0.15 })}`);
