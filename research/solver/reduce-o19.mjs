/*
 * REDUCER FOR O19 (predictions/o19-final.md): the final year integrated exactly against the 5-node rule, each with and
 * without one tier above the plan (plan held at Medium, M14b's settings), four arms paired on the same 3,000 paths:
 *   o19-d5  no tier above, 5 nodes      o19-u5  tier above, 5 nodes      (M14b's two arms, re-run on this code)
 *   o19-dx  no tier above, exact        o19-ux  tier above, exact
 * The fair-test gate is run on each pairing, with its one tested variable: 13 (the tiers allowed) within each final-year
 * rule, 8 (how the final year is averaged) within each tier setting. Per household: survival in each arm, the paired
 * difference and its se (discordant paths); paths that ever hold the tier above; the median estate on paths both arms
 * of a pairing survive; the solve's time. Then each item of the prediction. SUPPLEMENTARY, added before any O19 result was
 * read (committed 22:28 UK in 2785931, the first O19 file 22:29 UK; the paired se and the score-unit cost written 22:38 UK and
 * committed 22:39 UK in 68978f7, after the twenty-seventh review): the tier above's effect on cuts in each final-year rule - years below target, the total cut
 * (target-years short) and the cut cost the score charges (lambda x sum (1 - level)^2, in survival points), each paired with
 * its se. They are NOT a registered statistic and do not decide any item: item 1 is read by its registered falsifier alone,
 * and whether a survival cost is the score's trade or a table error stays NOT CHECKED (the quadrature reference's Part A
 * scores the full objective). Dead years are recorded as level 0 and so count as no cut: an arm that fails more shows
 * fewer cut years, a bias toward the trade reading.
 *
 *   node research/solver/reduce-o19.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRecord } from './record.mjs';
import { requireFair } from './fair-gate.mjs';

const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const ARMS = ['o19-d5', 'o19-u5', 'o19-dx', 'o19-ux'];
const LOST = ['S194', 'S162', 'S252'], THIN = ['S330', 'S354'], TRADE = 'S172';
const ABOVE = 15;   // tier code: pension and ISA both one above the plan (index 3), as reduce-m14.mjs
// each pairing is gated on its one LINE (a row number would let its whole group through: row 8 also holds quadNodes, row 13 PLANTIER)
requireFair([['o19-d5', 'o19-u5', { tested: ['risk tiers allowed'] }], ['o19-dx', 'o19-ux', { tested: ['risk tiers allowed'] }], ['o19-u5', 'o19-ux', { tested: ['final-year integration'] }], ['o19-d5', 'o19-dx', { tested: ['final-year integration'] }]]);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '-');
const sg = x => (x >= 0 ? '+' : '') + f(x);
const med = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
const k = x => (Number.isFinite(x) ? `${Math.round(x / 1000)}k` : '-');

const data = {};
for (const id of [...LOST, TRADE, ...THIN]) {
  const rec = {}, json = {};
  for (const a of ARMS) {
    const p = join(R, a, `${id}.solver.record.json.gz`), q = join(R, a, `${id}.json`);
    if (existsSync(p) && existsSync(q)) { rec[a] = readRecord(p); json[a] = JSON.parse(readFileSync(q, 'utf8')); }
  }
  if (Object.keys(rec).length === ARMS.length) data[id] = { rec, json };
  else console.log(`  ${id}: ${Object.keys(rec).length} of 4 arms - not reported`);
}
const surv = r => { let s = 0; for (let i = 0; i < r.N; i++) if (r.paths.survived[i]) s++; return 100 * s / r.N; };
const pair = (a, b) => {   // b - a, paired; se from the discordant paths
  let disc = 0, d = 0; for (let i = 0; i < a.N; i++) { const x = a.paths.survived[i], y = b.paths.survived[i]; if (x !== y) { disc++; d += y ? 1 : -1; } }
  return { d: 100 * d / a.N, se: 100 * Math.sqrt(disc) / a.N };
};
const betPaths = r => { let n = 0; for (let i = 0; i < r.N; i++) for (let t = 0; t < r.Y; t++) { const j = i * r.Y + t; if (r.trace.level[j] && r.trace.tier[j] === ABOVE) { n++; break; } } return n; };
const cuts = (r, lam) => { const b = new Float64Array(r.N), c = new Float64Array(r.N), k = new Float64Array(r.N); for (let i = 0; i < r.N; i++) for (let t = 0; t < r.Y; t++) { const l = r.trace.level[i * r.Y + t]; if (l > 0 && l < 100) { b[i]++; c[i] += (100 - l) / 100; k[i] += 100 * lam * ((100 - l) / 100) ** 2; } } return { b, c, k }; };
{ // planted at lambda 2: two years at 80% must cost 2 x 2 x 0.04 x 100 = 16 survival points, or nothing is printed
  const p = cuts({ N: 1, Y: 3, trace: { level: new Uint8Array([80, 80, 100]) } }, 2), z = cuts({ N: 1, Y: 3, trace: { level: new Uint8Array([0, 80, 100]) } }, 2);   // a level-0 year is no cut
  if (p.b[0] !== 2 || Math.abs(p.c[0] - 0.4) > 1e-12 || Math.abs(p.k[0] - 16) > 1e-9 || z.b[0] !== 1 || Math.abs(z.k[0] - 8) > 1e-9) { console.log('PLANTED CHECK FAILED: the cut measures'); process.exit(1); }
}
const pdiff = (x, y) => { const n = x.length; let m = 0; for (let i = 0; i < n; i++) m += y[i] - x[i]; m /= n; let v = 0; for (let i = 0; i < n; i++) v += (y[i] - x[i] - m) ** 2; return { d: m, se: Math.sqrt(v / (n - 1) / n) }; };
const estate = (a, b) => { const x = [], y = []; for (let i = 0; i < a.N; i++) if (a.paths.survived[i] && b.paths.survived[i]) { x.push(a.paths.terminalNet[i]); y.push(b.paths.terminalNet[i]); } return [med(x), med(y)]; };

console.log('O19 - the final year exact against 5 nodes, with and without one tier above the plan (plan at Medium), paired on 3,000 paths');
console.log('  id     survival: d5 / u5 / dx / ux       tier above costs (u - d): 5 nodes | exact         exact - 5 nodes: no tier above | tier above     paths that bet u5 -> ux    median estate u5 vs ux (both survive)   solve s: 5 nodes / exact (u arms)');
const res = {};
for (const [id, { rec, json }] of Object.entries(data)) {
  const S = Object.fromEntries(ARMS.map(a => [a, surv(rec[a])]));
  const up5 = pair(rec['o19-d5'], rec['o19-u5']), upx = pair(rec['o19-dx'], rec['o19-ux']);
  const exD = pair(rec['o19-d5'], rec['o19-dx']), exU = pair(rec['o19-u5'], rec['o19-ux']);
  const b5 = betPaths(rec['o19-u5']), bx = betPaths(rec['o19-ux']);
  const [e5, ex] = estate(rec['o19-u5'], rec['o19-ux']);
  const ms = a => (json[a].knobs && json[a].knobs.solveMs) || NaN;
  const lam = json['o19-u5'].solver && json['o19-u5'].solver.lambda;
  const C = Object.fromEntries(ARMS.map(a => [a, cuts(rec[a], lam)]));
  res[id] = { up5, upx, exD, exU, b5, bx, C };
  console.log(`  ${id}   ${ARMS.map(a => f(S[a])).join(' / ')}    ${sg(up5.d)} +/- ${f(up5.se)} | ${sg(upx.d)} +/- ${f(upx.se)}    ${sg(exD.d)} +/- ${f(exD.se)} | ${sg(exU.d)} +/- ${f(exU.se)}    ${b5} -> ${bx}    ${k(e5)} vs ${k(ex)}    ${f(ms('o19-u5') / 1000, 0)} / ${f(ms('o19-ux') / 1000, 0)}`);
}
const pool = (ids, key) => { const r = ids.filter(id => res[id]).map(id => res[id][key]); const n = r.length; return { n, d: r.reduce((a, x) => a + x.d, 0) / n, se: Math.sqrt(r.reduce((a, x) => a + x.se * x.se, 0)) / n }; };
console.log('\nSUPPLEMENTARY - the tier above\'s effect on cuts (u - d, paired +/- se, per path): years below target | total cut (target-years) | cut cost in the score (survival points); decides nothing, see the header');
const cutLine = (x, y) => [x.b, x.c, x.k].map((_, j) => { const P = pdiff([x.b, x.c, x.k][j], [y.b, y.c, y.k][j]); return `${sg(P.d)} +/- ${f(P.se, 3)}`; }).join(' | ');
for (const [id, r] of Object.entries(res)) console.log(`  ${id}   5 nodes: ${cutLine(r.C['o19-d5'], r.C['o19-u5'])}     exact: ${cutLine(r.C['o19-dx'], r.C['o19-ux'])}`);
console.log('\nPREDICTION CHECK (predictions/o19-final.md)');
const lostHere = LOST.filter(id => res[id]);
const within = lostHere.filter(id => res[id].upx.d > -2 * res[id].upx.se).length;
console.log(`  1. with the final year exact, the tier above costs no survival beyond two se on S194, S162 and S252: ${within} of ${lostHere.length} -> ${within === 3 ? 'HELD' : 'MISSED'}`);
const P = pool(LOST, 'upx');
console.log(`     FALSIFIER - the three pooled, tier above with the final year exact: ${sg(P.d)} +/- ${f(P.se)}: ${P.d < -2 * P.se ? 'FALSIFIED (it still costs survival beyond two se)' : 'not fired'}`);
const thinHeld = THIN.filter(id => res[id] && res[id].upx.d > 2 * res[id].upx.se).length;
console.log(`  2. the thin S330 and S354 still gain from the tier above beyond two se with the final year exact: ${thinHeld} of ${THIN.filter(id => res[id]).length} -> ${thinHeld === 2 ? 'HELD' : 'MISSED'}`);
const fewer = lostHere.filter(id => res[id].bx <= (2 / 3) * res[id].b5).length;
console.log(`  3. on S194, S162 and S252 the paths that ever hold the tier above fall by a third or more: ${fewer} of ${lostHere.length} -> ${fewer === 3 ? 'HELD' : 'MISSED'}`);
if (res[TRADE]) console.log(`  4. S172's survival cost of the tier above shrinks with the final year exact: ${sg(res[TRADE].up5.d)} -> ${sg(res[TRADE].upx.d)} -> ${res[TRADE].upx.d > res[TRADE].up5.d ? 'HELD' : 'MISSED'}`);
const losers = Object.entries(res).flatMap(([id, r]) => [['no tier above', r.exD], ['tier above', r.exU]].filter(([, x]) => x.d < -2 * x.se).map(([lab, x]) => `${id} (${lab}) ${sg(x.d)} +/- ${f(x.se)}`));
console.log(`  5. the exact final year loses survival beyond two se nowhere: ${losers.length ? 'MISSED - ' + losers.join('; ') : 'HELD'}`);
console.log(`     FALSIFIER - any such loss (the exact final year is then not carried forward): ${losers.length ? 'FIRED' : 'not fired'}`);
