/*
 * REDUCER FOR THE QUADRATURE REFERENCE (predictions/quad-ref.md; PLAN.md 7h): 5 against 15 return points every year, the
 * final year exact in both, with and without one tier above the plan (plan at Medium, M14b's settings), paired on the
 * same 3,000 paths; plus five worlds against three on S194 and S330. Arms:
 *   qr-d5 / qr-u5    no tier above / tier above, 5 points      qr-d15 / qr-u15   the same, 15 points
 *   qr-u5m5          tier above, 5 points, five worlds (S194, S330)
 * The fair-test gate runs on each pairing with its one tested LINE (a row number would pass its whole group). Per
 * household: survival in each arm and the paired differences (se = sqrt(discordant)/N); the tier above's cost with 5 and
 * with 15 points, and their paired difference-in-differences per path; five worlds against three. Then a reproduction
 * check (qr-d5 / qr-u5 against O19's o19-dx / o19-ux, path for path) and each item and the falsifier.
 * The tie rule: "beyond two se" is strictly more; exactly two se is AT THE LINE (predictions/quad-ref.md).
 *
 *   node research/solver/reduce-quadref.mjs
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRecord } from './record.mjs';
import { requireFair } from './fair-gate.mjs';

const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const THREE = ['S194', 'S162', 'S252'], ALL = [...THREE, 'S330'], M5 = ['S194', 'S330'];
requireFair([['qr-d5', 'qr-d15', { tested: ['return points a year'] }], ['qr-u5', 'qr-u15', { tested: ['return points a year'] }],
  ['qr-d5', 'qr-u5', { tested: ['risk tiers allowed'] }], ['qr-d15', 'qr-u15', { tested: ['risk tiers allowed'] }],
  ['qr-u5', 'qr-u5m5', { tested: ['market world'] }]]);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '-'), sg = x => (x >= 0 ? '+' : '') + f(x);
const EPS = 1e-9;
// the tie rule: on whole path counts where they exist (|net| = 2 x sqrt(discordant) exactly is a tie: net^2 = 4 disc),
// otherwise on the figures (the per-path difference-in-differences, whose se is a sample se)
const verdict = (d, se, net, disc) => (net !== undefined ? (net !== 0 && net * net === 4 * disc ? 'AT THE LINE' : net * net > 4 * disc ? 'beyond two se' : 'within')
  : Math.abs(Math.abs(d) - 2 * se) < EPS ? 'AT THE LINE' : Math.abs(d) > 2 * se ? 'beyond two se' : 'within');
const V = x => verdict(x.d, x.se, x.net, x.disc);
const pair = (a, b) => { let disc = 0, d = 0; for (let i = 0; i < a.N; i++) { const x = a.paths.survived[i], y = b.paths.survived[i]; if (x !== y) { disc++; d += y ? 1 : -1; } } return { d: 100 * d / a.N, se: 100 * Math.sqrt(disc) / a.N, net: d, disc }; };
// the tier above's cost with 15 points minus with 5, per path: (u15 - d15) - (u5 - d5), mean and se over the paths
const did = (d5, u5, d15, u15) => { const n = d5.N; const v = new Float64Array(n); for (let i = 0; i < n; i++) v[i] = 100 * ((u15.paths.survived[i] - d15.paths.survived[i]) - (u5.paths.survived[i] - d5.paths.survived[i])); let m = 0; for (const x of v) m += x; m /= n; let s = 0; for (const x of v) s += (x - m) ** 2; return { d: m, se: Math.sqrt(s / (n - 1) / n) }; };
{ // planted, with d15 unlike d5 so a copy that drops d15, or uses d5 for it, or leaves /n out of the se, fails:
  // per path (u15 - d15) - (u5 - d5) = [+100, 0, 0, 0] -> mean 25, sample sd 50, se 25
  const mk = a => ({ N: 4, paths: { survived: a } }), P = did(mk([1, 1, 1, 1]), mk([0, 1, 1, 1]), mk([1, 1, 1, 0]), mk([1, 1, 1, 0]));
  if (Math.abs(P.d - 25) > EPS || Math.abs(P.se - 25) > EPS) { console.log('PLANTED CHECK FAILED: the difference-in-differences'); process.exit(1); }
  if (verdict(0, 0, -4, 4) !== 'AT THE LINE' || verdict(0, 0, -22, 120) !== 'beyond two se' || verdict(0, 0, -21, 120) !== 'within' || verdict(-2, 1) !== 'AT THE LINE' || verdict(-2.01, 1) !== 'beyond two se') { console.log('PLANTED CHECK FAILED: the tie rule'); process.exit(1); }
}
const rec = (tag, id) => { const p = join(R, tag, `${id}.solver.record.json.gz`); return existsSync(p) ? readRecord(p) : null; };
const surv = r => { let s = 0; for (let i = 0; i < r.N; i++) if (r.paths.survived[i]) s++; return 100 * s / r.N; };
// pooled paired pairs keep whole counts: the pooled d and se are 100 x sum(net) / (kN) and 100 x sqrt(sum(disc)) / (kN)
const pool = xs => ({ d: xs.reduce((a, x) => a + x.d, 0) / xs.length, se: Math.sqrt(xs.reduce((a, x) => a + x.se * x.se, 0)) / xs.length,
  ...(xs.every(x => x.net !== undefined) ? { net: xs.reduce((a, x) => a + x.net, 0), disc: xs.reduce((a, x) => a + x.disc, 0) } : {}) });

console.log('QUADRATURE REFERENCE - 5 against 15 return points every year, the final year exact, paired on 3,000 paths');
console.log('  id     survival d5 / u5 / d15 / u15      15 - 5: no tier above | tier above            tier above costs: 5 points | 15 points     difference-in-differences (15 - 5)');
const res = {};
for (const id of ALL) {
  const A = { d5: rec('qr-d5', id), u5: rec('qr-u5', id), d15: rec('qr-d15', id), u15: rec('qr-u15', id) };
  if (Object.values(A).some(x => !x)) { console.log(`  ${id}: an arm is missing - not reported`); continue; }
  const q = { dq: pair(A.d5, A.d15), uq: pair(A.u5, A.u15), c5: pair(A.d5, A.u5), c15: pair(A.d15, A.u15), dd: did(A.d5, A.u5, A.d15, A.u15) };
  res[id] = { A, ...q };
  console.log(`  ${id}   ${['d5', 'u5', 'd15', 'u15'].map(k => f(surv(A[k]))).join(' / ')}    ${sg(q.dq.d)} +/- ${f(q.dq.se)} (${V(q.dq)}) | ${sg(q.uq.d)} +/- ${f(q.uq.se)} (${V(q.uq)})    ${sg(q.c5.d)} +/- ${f(q.c5.se)} | ${sg(q.c15.d)} +/- ${f(q.c15.se)}    ${sg(q.dd.d)} +/- ${f(q.dd.se)}`);
}
console.log('\n  five worlds against three (tier above, 5 points):');
const m5 = {};
for (const id of M5) {
  const a = rec('qr-u5', id), b = rec('qr-u5m5', id);
  if (!a || !b) { console.log(`    ${id}: missing`); continue; }
  m5[id] = pair(a, b);
  console.log(`    ${id}   ${f(surv(a))} -> ${f(surv(b))}   ${sg(m5[id].d)} +/- ${f(m5[id].se)} (${V(m5[id])})`);
}
console.log('\nCHECK - qr-d5 / qr-u5 reproduce O19\'s o19-dx / o19-ux path for path (same settings; the solver change between them is comments only):');
for (const id of ALL) for (const [a, b] of [['qr-d5', 'o19-dx'], ['qr-u5', 'o19-ux']]) {
  const x = rec(a, id), y = rec(b, id);
  if (!x || !y) { console.log(`  ${id} ${a}: missing`); continue; }
  let diff = 0; for (let i = 0; i < x.N; i++) if (x.paths.survived[i] !== y.paths.survived[i]) diff++;
  let tdiff = 0; for (let k = 0; k < x.trace.tier.length; k++) if (x.trace.tier[k] !== y.trace.tier[k] || x.trace.level[k] !== y.trace.level[k]) tdiff++;
  console.log(`  ${id} ${a} vs ${b}: ${diff} paths and ${tdiff} path-years differ -> ${diff || tdiff ? 'DIFFERS' : 'reproduced'}`);
}
console.log('\nPREDICTION CHECK (predictions/quad-ref.md)');
const eight = Object.entries(res).flatMap(([id, r]) => [[`${id} no tier above`, r.dq], [`${id} tier above`, r.uq]]);
const beyond = eight.filter(([, x]) => V(x) === 'beyond two se'), line = eight.filter(([, x]) => V(x) === 'AT THE LINE');
console.log(`  1. 15 points changes survival by no more than two se, ${eight.length} comparisons: ${beyond.length ? 'MISSED - ' + beyond.map(([l, x]) => `${l} ${sg(x.d)} +/- ${f(x.se)}`).join('; ') : line.length ? 'AT THE LINE - ' + line.map(([l]) => l).join('; ') : 'HELD'}`);
const DD = pool(THREE.filter(id => res[id]).map(id => res[id].dd));
console.log(`  2. the three's tier-above cost with 15 points within two se of it with 5 (pooled difference-in-differences): ${sg(DD.d)} +/- ${f(DD.se)} -> ${V(DD) === 'within' ? 'HELD' : V(DD) === 'AT THE LINE' ? 'AT THE LINE' : 'MISSED'}`);
const m5v = M5.filter(id => m5[id]).map(id => [id, V(m5[id])]);
console.log(`  3. five worlds within two se of three on S194 and S330: ${m5v.map(([id, v]) => `${id} ${v}`).join(', ')} -> ${m5v.length === 2 && m5v.every(([, v]) => v === 'within') ? 'HELD' : m5v.some(([, v]) => v === 'beyond two se') ? 'MISSED' : 'AT THE LINE / incomplete'}`);
const U = pool(THREE.filter(id => res[id]).map(id => res[id].uq));
console.log(`\nFALSIFIER - with the tier above, 15 points raises survival beyond two se, pooled over the three: ${sg(U.d)} +/- ${f(U.se)} -> ${U.d > 0 && V(U) === 'beyond two se' ? 'FALSIFIED (the earlier years\' averaging matters)' : U.d > 0 && V(U) === 'AT THE LINE' ? 'AT THE LINE' : 'not fired'}`);
const lower = eight.filter(([, x]) => x.d < 0 && V(x) === 'beyond two se');
console.log(`  SEPARATELY - 15 points lowers survival beyond two se: ${lower.length ? 'YES - ' + lower.map(([l, x]) => `${l} ${sg(x.d)}`).join('; ') + ' (investigate before reading further)' : 'nowhere'}`);
