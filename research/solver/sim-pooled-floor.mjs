// THE POOLED FLOOR SIMULATED (the forty-eighth review, MINOR 2, 25 Sep 22:40 UK): node research/solver/sim-pooled-floor.mjs > research/solver/results-pooled-floor.txt
// the pooled floor: random effects (the regimen's DerSimonian-Laird) against fixed effect (inverse variance), fire rate
// of "lower end at or below -0.1" over 7e's POOL, with look 1 (1,000 paths) and look 2 (3,000) as registered. Discordance
// and off survival from 7c's records (results-derive-7e.txt; S162, S172, S168 at 2 and 99 as the forty-eighth review took)
import { pooledRE, mcnemarHarmP, holm, outcome, marginFor } from './stats.mjs';
const rec = { S126:[3,99.6], 'share 0.90':[0,99.3], 'bridge 1':[0,98.8], 'bridge 4':[10,99.2], 'wealth x0.5':[10,95.5], 'wealth x2':[1,100], S120:[0,100], S122:[1,99.6], S124:[2,94.7], S128:[50,68.8], S130:[27,83.1], 'bridge 6':[1,99.3], S366:[4,98.6], S162:[2,99], S172:[2,99], S168:[2,99] };
let seed = 424242; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
function poisson(l) { if (l <= 0) return 0; let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; }
function draw(id, g, N) { const lam = rec[id][0] * N / 1000, net = g * N / 100; return { c: poisson(lam / 2 + Math.max(0, net)), b: poisson(lam / 2 + Math.max(0, -net)) }; }
function pooledFE(cases) {
  const d = cases.map(x => 100 * (x.c - x.b) / x.N), v = cases.map(x => { const n = x.b + x.c, net = x.c - x.b; return 1e4 * Math.max(1, n - net * net / x.N) / (x.N * x.N); });
  const w = v.map(x => 1 / x), sw = w.reduce((a, b) => a + b, 0), mean = w.reduce((a, x, i) => a + x * d[i], 0) / sw, se = Math.sqrt(1 / sw);
  return { mean, lo: mean - 1.96 * se };
}
function run(gains = {}, trials = 4000) {
  let re = 0, fe = 0;
  for (let t = 0; t < trials; t++) {
    const ids = Object.keys(rec);
    const l1 = ids.map(id => { const g = typeof gains === 'number' ? gains : (gains[id] || 0); const d = draw(id, g, 1000); return { id, g, ...d, N: 1000, margin: marginFor(rec[id][1]) }; });
    l1.forEach(x => x.p = mcnemarHarmP(x.b, x.c)); const adj = holm(l1.map(x => x.p));
    const rows = l1.map((x, i) => { const o = outcome({ b: x.b, c: x.c, N: 1000, margin: x.margin, pHolm: adj[i], level: 0.005 });
      if (o.outcome !== 'inconclusive') return x; const e = draw(x.id, x.g, 2000); return { ...x, b: x.b + e.b, c: x.c + e.c, N: 3000 }; });
    if (!(pooledRE(rows).lo > -0.1)) re++;
    if (!(pooledFE(rows).lo > -0.1)) fe++;
  }
  return `RE ${(100 * re / trials).toFixed(1)}%  FE ${(100 * fe / trials).toFixed(1)}%`;
}
console.log('fire rate of the pooled floor (lower end <= -0.1), 4,000 simulated runs each');
console.log('  no change on any pool case          ', run());
for (const id of ['S128', 'S130', 'S124', 'bridge 4']) console.log(`  ${id.padEnd(9)} gains 3 points, the rest none `, run({ [id]: 3 }));
console.log('  S128 and S130 gain 1 point each      ', run({ S128: 1, S130: 1 }));
for (const g of [-0.1, -0.2, -0.3]) console.log(`  every pool case loses ${Math.abs(g)} points        `, run(g));
