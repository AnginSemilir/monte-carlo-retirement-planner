// 7an's solve cost from 7av's measured solves (results/diag7av): per household, the PCLSI unit's solve seconds at 6 and at
// 12 share points (a and b tied, grid.js l.118-119: the share cells grow by (n/6)^2), their ratio, its exponent in the cell
// count, and the 11-point solve scaled by the cell count alone (exponent 1) and by each household's measured exponent.
// The units ran in one batch on four cores, so load is shared but not matched (NOT CHECKED against a quiet host).
//   node research/solver/derive-7an-cost.mjs > research/solver/results-derive-7an-cost.txt
import { readFileSync, readdirSync } from 'node:fs';
const D = new URL('./results/diag7av/', import.meta.url);
const solves = {};
for (const f of readdirSync(D).filter(x => /^case\d+\.txt$/.test(x)).sort()) {
  const t = readFileSync(new URL(f, D), 'utf8');
  const h = /^(\S+)\s+case \| unit (\S+)/m.exec(t), s = /^\s+solve \S+: table \S+ secs (\d+)$/m.exec(t);
  if (!h || !s) { console.error(`derive-7an-cost: ${f} has no case or solve line`); process.exit(1); }
  (solves[h[1]] = solves[h[1]] || {})[h[2]] = +s[1];
}
const C6 = 'READER/TS+J/W0.02/PCLSI', C12 = C6 + '/S12', cells = n => (n / 6) ** 2;
console.log(`7an's solve cost from 7av's solves (results/diag7av); the share cells at n points over 6: 11 ${cells(11).toFixed(4)}, 12 ${cells(12).toFixed(4)}`);
let n = 0;
for (const [id, u] of Object.entries(solves)) {
  if (!(u[C6] > 0 && u[C12] > 0)) continue;
  n++;
  const r = u[C12] / u[C6], k = Math.log(r) / Math.log(cells(12));
  console.log(`  ${id.padEnd(6)} 6 points ${u[C6]} s, 12 points ${u[C12]} s: ratio x${r.toFixed(2)}, exponent in the cells ${k.toFixed(3)}; 11 points by the cells x${cells(11).toFixed(2)} (${Math.round(u[C6] * cells(11))} s), by its exponent x${(cells(11) ** k).toFixed(2)} (${Math.round(u[C6] * cells(11) ** k)} s)`);
}
if (!n) { console.error('derive-7an-cost: no household with both solves (a script that ran on nothing)'); process.exit(1); }
