/*
 * O19's item 1 and falsifier UNROUNDED (reduce-o19.mjs prints 2 decimals; two readings sit at the two-se line). Reads the
 * same o19-dx / o19-ux records reduce-o19.mjs read behind its fair-test gate (results-o19.txt), pairs survival exactly as
 * it does (difference and se = sqrt(discordant)/N, in points), and pools the three as it does (mean; root sum of squares
 * over three). Planted: two made-up arms differing on one path of four must give +25 +/- 25 points.
 *
 *   node research/solver/o19-exact.mjs > research/solver/results-o19-exact.txt
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRecord } from './record.mjs';
const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const pair = (a, b) => { let disc = 0, d = 0; for (let i = 0; i < a.N; i++) { const x = a.paths.survived[i], y = b.paths.survived[i]; if (x !== y) { disc++; d += y ? 1 : -1; } } return { d: 100 * d / a.N, se: 100 * Math.sqrt(disc) / a.N }; };
{ const P = pair({ N: 4, paths: { survived: [0, 1, 1, 0] } }, { N: 4, paths: { survived: [1, 1, 1, 0] } }); if (P.d !== 25 || P.se !== 25) { console.log('PLANTED CHECK FAILED'); process.exit(1); } }
console.log('# O19 item 1 and its falsifier, unrounded (the same records and pairing as results-o19.txt)');
const rows = [];
for (const id of ['S194', 'S162', 'S252']) {
  const r = t => readRecord(join(R, t, `${id}.solver.record.json.gz`));
  const x = pair(r('o19-dx'), r('o19-ux')), f = pair(r('o19-d5'), r('o19-u5'));
  rows.push(x);
  console.log(`  ${id}  tier above, exact final year: ${x.d.toFixed(4)} +/- ${x.se.toFixed(4)}  z ${(x.d / x.se).toFixed(3)}  beyond two se: ${x.d < -2 * x.se ? 'YES' : 'no'}   (5 nodes: ${f.d.toFixed(4)} +/- ${f.se.toFixed(4)}, z ${(f.d / f.se).toFixed(3)})`);
}
const d = rows.reduce((a, x) => a + x.d, 0) / 3, se = Math.sqrt(rows.reduce((a, x) => a + x.se * x.se, 0)) / 3;
console.log(`  pooled, exact final year: ${d.toFixed(4)} +/- ${se.toFixed(4)}  z ${(d / se).toFixed(3)}  falsifier (beyond -2 se): ${d < -2 * se ? 'FIRED' : 'not fired'}`);
// beside the registered reading (not registered statistics): the same pool with 5 nodes, and the exact final year's effect
// with the tier above allowed (ux - u5), over the three and over all six
const poolOf = xs => ({ d: xs.reduce((a, x) => a + x.d, 0) / xs.length, se: Math.sqrt(xs.reduce((a, x) => a + x.se * x.se, 0)) / xs.length });
const rec = (t, id) => readRecord(join(R, t, `${id}.solver.record.json.gz`));
const three = ['S194', 'S162', 'S252'], six = [...three, 'S172', 'S330', 'S354'];
const P5 = poolOf(three.map(id => pair(rec('o19-d5', id), rec('o19-u5', id))));
console.log(`  beside it, not registered: the three pooled with 5 nodes: ${P5.d.toFixed(4)} +/- ${P5.se.toFixed(4)}  z ${(P5.d / P5.se).toFixed(3)}`);
for (const [lab, ids] of [['the three', three], ['all six', six]]) {
  const Q = poolOf(ids.map(id => pair(rec('o19-u5', id), rec('o19-ux', id)))), Z = poolOf(ids.map(id => pair(rec('o19-d5', id), rec('o19-dx', id))));
  console.log(`  beside it, not registered: exact - 5 nodes, pooled over ${lab}: tier above allowed ${Q.d.toFixed(4)} +/- ${Q.se.toFixed(4)} (z ${(Q.d / Q.se).toFixed(3)}); no tier above ${Z.d.toFixed(4)} +/- ${Z.se.toFixed(4)} (z ${(Z.d / Z.se).toFixed(3)})`);
}
// the change in the tier above's cost from 5 nodes to exact, per path: (ux - dx) - (u5 - d5), mean and sample se over the
// paths (not registered; it sizes what a later test must detect - the thirtieth review)
const did = (d5, u5, dx, ux) => { const n = d5.N; let m = 0; const v = new Float64Array(n); for (let i = 0; i < n; i++) { v[i] = 100 * ((ux.paths.survived[i] - dx.paths.survived[i]) - (u5.paths.survived[i] - d5.paths.survived[i])); m += v[i]; } m /= n; let s = 0; for (const x of v) s += (x - m) ** 2; return { d: m, se: Math.sqrt(s / (n - 1) / n) }; };
{ const mk = a => ({ N: 4, paths: { survived: a } }), P = did(mk([1, 1, 1, 1]), mk([0, 1, 1, 1]), mk([1, 1, 1, 0]), mk([1, 1, 1, 0])); if (Math.abs(P.d - 25) > 1e-9 || Math.abs(P.se - 25) > 1e-9) { console.log('PLANTED CHECK FAILED: the difference-in-differences'); process.exit(1); } }
const DD = three.map(id => [id, did(rec('o19-d5', id), rec('o19-u5', id), rec('o19-dx', id), rec('o19-ux', id))]);
for (const [id, x] of DD) console.log(`  beside it, not registered: ${id} the tier above's cost, exact minus 5 nodes, per path: ${x.d.toFixed(4)} +/- ${x.se.toFixed(4)}  z ${(x.d / x.se).toFixed(3)}`);
const PD = poolOf(DD.map(([, x]) => x));
console.log(`  beside it, not registered: the same, pooled over the three: ${PD.d.toFixed(4)} +/- ${PD.se.toFixed(4)}  z ${(PD.d / PD.se).toFixed(3)}`);
