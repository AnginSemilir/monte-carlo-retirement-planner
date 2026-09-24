/*
 * REDUCER FOR O19 (predictions/o19-final.md): the final year integrated exactly against the 5-node rule, each with and
 * without one tier above the plan (plan held at Medium, M14b's settings), four arms paired on the same 3,000 paths:
 *   o19-d5  no tier above, 5 nodes      o19-u5  tier above, 5 nodes      (M14b's two arms, re-run on this code)
 *   o19-dx  no tier above, exact        o19-ux  tier above, exact
 * The fair-test gate is run on each pairing, with its one tested variable: 13 (the tiers allowed) within each final-year
 * rule, 8 (how the final year is averaged) within each tier setting. Per household: survival in each arm, the paired
 * difference and its se (discordant paths); paths that ever hold the tier above; the median estate on paths both arms
 * of a pairing survive; the solve's time. Then each item of the prediction.
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
requireFair([['o19-d5', 'o19-u5', { tested: [13] }], ['o19-dx', 'o19-ux', { tested: [13] }], ['o19-u5', 'o19-ux', { tested: [8] }], ['o19-d5', 'o19-dx', { tested: [8] }]]);
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
  res[id] = { up5, upx, exD, exU, b5, bx };
  console.log(`  ${id}   ${ARMS.map(a => f(S[a])).join(' / ')}    ${sg(up5.d)} +/- ${f(up5.se)} | ${sg(upx.d)} +/- ${f(upx.se)}    ${sg(exD.d)} +/- ${f(exD.se)} | ${sg(exU.d)} +/- ${f(exU.se)}    ${b5} -> ${bx}    ${k(e5)} vs ${k(ex)}    ${f(ms('o19-u5') / 1000, 0)} / ${f(ms('o19-ux') / 1000, 0)}`);
}
const pool = (ids, key) => { const r = ids.filter(id => res[id]).map(id => res[id][key]); const n = r.length; return { n, d: r.reduce((a, x) => a + x.d, 0) / n, se: Math.sqrt(r.reduce((a, x) => a + x.se * x.se, 0)) / n }; };
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
