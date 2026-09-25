/*
 * 7h (predictions/quad-ref.md) UNROUNDED, with the whole path counts behind each paired reading (reduce-quadref.mjs prints
 * 2 decimals and judges the tie rule on the counts without printing them). Reads the same qr-* records reduce-quadref.mjs
 * read behind its fair-test gate (results-quadref.txt) and pairs survival exactly as it does (difference and
 * se = sqrt(discordant)/N, in points; pooled as the mean with the root sum of squares over the count). Beside the
 * registered reading, not registered: the three's tier-above cost pooled with 5 and with 15 points, and how far item 2's
 * difference-in-differences sits from the value full removal of the 5-point remainder would give.
 * Planted: two made-up arms differing on one path of four must give +25 +/- 25 points, net 1 of 1; two pooled must sum
 * the counts.
 *
 *   node research/solver/quadref-exact.mjs > research/solver/results-quadref-exact.txt
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRecord } from './record.mjs';
const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const pair = (a, b) => { let disc = 0, net = 0; for (let i = 0; i < a.N; i++) { const x = a.paths.survived[i], y = b.paths.survived[i]; if (x !== y) { disc++; net += y ? 1 : -1; } } return { d: 100 * net / a.N, se: 100 * Math.sqrt(disc) / a.N, net, disc }; };
const pool = xs => ({ d: xs.reduce((a, x) => a + x.d, 0) / xs.length, se: Math.sqrt(xs.reduce((a, x) => a + x.se * x.se, 0)) / xs.length,
  ...(xs.every(x => x.net !== undefined) ? { net: xs.reduce((a, x) => a + x.net, 0), disc: xs.reduce((a, x) => a + x.disc, 0) } : {}) });
const did = (d5, u5, d15, u15) => { const n = d5.N; const v = new Float64Array(n); for (let i = 0; i < n; i++) v[i] = 100 * ((u15.paths.survived[i] - d15.paths.survived[i]) - (u5.paths.survived[i] - d5.paths.survived[i])); let m = 0; for (const x of v) m += x; m /= n; let s = 0; for (const x of v) s += (x - m) ** 2; return { d: m, se: Math.sqrt(s / (n - 1) / n) }; };
{
  const mk = a => ({ N: 4, paths: { survived: a } }), P = pair(mk([0, 1, 1, 0]), mk([1, 1, 1, 0])), Q = pool([P, pair(mk([1, 1, 1, 1]), mk([0, 0, 1, 1]))]);
  const D = did(mk([1, 1, 1, 1]), mk([0, 1, 1, 1]), mk([1, 1, 1, 0]), mk([1, 1, 1, 0]));
  if (P.d !== 25 || P.se !== 25 || P.net !== 1 || P.disc !== 1 || Q.net !== -1 || Q.disc !== 3 || Math.abs(D.d - 25) > 1e-9 || Math.abs(D.se - 25) > 1e-9) { console.log('PLANTED CHECK FAILED'); process.exit(1); }
}
const rec = (t, id) => readRecord(join(R, t, `${id}.solver.record.json.gz`));
const z = x => (x.se > 0 ? (x.d / x.se).toFixed(3) : '-');
const cnt = x => (x.net !== undefined ? `  net ${x.net} of ${x.disc} discordant (net^2 ${x.net * x.net} against 4 x discordant ${4 * x.disc})` : '');
const line = (lab, x) => console.log(`  ${lab}: ${x.d >= 0 ? '+' : ''}${x.d.toFixed(4)} +/- ${x.se.toFixed(4)}  z ${z(x)}${cnt(x)}`);
const THREE = ['S194', 'S162', 'S252'], ALL = [...THREE, 'S330'];
console.log('# 7h (quad-ref) unrounded, with the whole path counts (the same records and pairing as results-quadref.txt)');
const r = {};
for (const id of ALL) {
  const A = { d5: rec('qr-d5', id), u5: rec('qr-u5', id), d15: rec('qr-d15', id), u15: rec('qr-u15', id) };
  r[id] = { dq: pair(A.d5, A.d15), uq: pair(A.u5, A.u15), c5: pair(A.d5, A.u5), c15: pair(A.d15, A.u15), dd: did(A.d5, A.u5, A.d15, A.u15) };
  console.log(`${id}`);
  line('item 1, 15 - 5 points, no tier above', r[id].dq);
  line('item 1, 15 - 5 points, tier above', r[id].uq);
  line('the tier above\'s cost, 5 points', r[id].c5);
  line('the tier above\'s cost, 15 points', r[id].c15);
  line('item 2\'s difference-in-differences (15 - 5), per path', r[id].dd);
}
console.log('pooled over S194, S162 and S252');
const DD = pool(THREE.map(id => r[id].dd)), U = pool(THREE.map(id => r[id].uq));
line('item 2, the difference-in-differences', DD);
line('the falsifier, 15 - 5 points with the tier above', U);
const C5 = pool(THREE.map(id => r[id].c5)), C15 = pool(THREE.map(id => r[id].c15));
line('beside it, not registered: the tier above\'s cost, 5 points', C5);
line('beside it, not registered: the tier above\'s cost, 15 points', C15);
console.log(`  beside it, not registered: were the 5-point remainder fully removed at 15 points, the difference-in-differences would be ${(-C5.d).toFixed(4)}; it is ${DD.d.toFixed(4)}, ${((DD.d + C5.d) / DD.se).toFixed(3)} of its se from that`);
console.log('five worlds against three (tier above, 5 points)');
for (const id of ['S194', 'S330']) line(`${id}`, pair(rec('qr-u5', id), rec('qr-u5m5', id)));
