/*
 * READ BESIDE 7AC (the deep review after 7ab, deep-review-log.md 28 Sep 13:56 UK: "read beside it OPEN0's lost paths' first
 * de-risk year and year-0 draw, the paired interaction (TS+J-OPEN0)-(FREED-PRODUCT) by survival on the four units and the
 * world-price sum"). Written before any 7ac figure was read (7ac launched 13:35 UK, runs.log; this script committed in
 * 2a0475d at 28 Sep 14:07 UK, git log; the case logs' world lines existed from about 13:49 UK but were not printed),
 * reported beside 7ac's registered items, never one of them: grade C. Every run is read only through its reducer's gates:
 * 7aa's (reduce-7aa.mjs gate and trace agreement), 7ab's (reduce-7ab.mjs gate, trace agreement and PRODUCT's identity with
 * 7aa's) and 7ac's (reduce-7ac.mjs gate against 7aa's TS+J and PRODUCT, trace agreement and TS+J's identity with 7aa's).
 * On 7ac's four units (S126 reader W0 and W0.02, bridge 4 reader W0, S194 off W0.02):
 *   1. THE TWO-BY-TWO BY SURVIVAL (paths of 8,000): PRODUCT (the product's tables and opening), FREED (the product's tables,
 *      the de-risked opening; 7ab), OPEN0 (TS+J's tables, the plan's-tier opening; 7ac) and TS+J (TS+J's tables and opening;
 *      7aa); the opening's effect on each table set (FREED less PRODUCT; TS+J less OPEN0), the tables' effect at each opening
 *      (OPEN0 less PRODUCT; TS+J less FREED), and the interaction (TS+J less OPEN0) less (FREED less PRODUCT): the review
 *      expects about 0 under cause 1' and about -30 paths at W0 under cause 2;
 *   2. OPEN0'S LOST PATHS against TS+J (TS+J survives, OPEN0 fails): how many, the year OPEN0 first leaves the plan's pension
 *      tier on them (never = n), their year-0 draw (quartiles; how many below -1) and long-run shift (quartiles);
 *   3. THE WORLD-PRICE SUM: the weighted sum of the three world prices against the mixture's price (the gap in points); the
 *      world lines price each world by its own best move less its own best plan's-tier move, so a sum far from the mixture's
 *      price means the world lines are not a decomposition of the gap (the review's caution b).
 *   node research/solver/read-7ac-beside.mjs > research/solver/results-7ac-beside.txt
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import * as A from './reduce-7aa.mjs';
import * as B from './reduce-7ab.mjs';
import * as C from './reduce-7ac.mjs';
import { pathsForSeed } from '../engine.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DA = join(HERE, 'results', 'diag7aa'), DB = join(HERE, 'results', 'diag7ab'), DC = join(HERE, 'results', 'diag7ac');
const logsOf = D => (existsSync(D) ? Object.fromEntries(readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D, f), 'utf8')])) : {});
const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
const readTrace = f => { if (!existsSync(f)) { console.log(`GATE: no trace ${f}`); process.exit(1); } return JSON.parse(gunzipSync(readFileSync(f)).toString()); };
const T = {}, RAW = {};
// 7aa
const logsA = logsOf(DA), unitsA = Object.values(logsA).flatMap(A.parse);
requireFairLogs(logsA, A.PRED);
{ const bad = A.gate(unitsA); if (bad.length) { console.log(`GATE 7aa FAILED\n  ${bad.join('\n  ')}`); process.exit(1); } }
const STA = stampOf(logsA);
for (const u of unitsA) {
  const j = readTrace(join(DA, A.traceName(u.id, u.arm, u.label)));
  if (!A.traceAgrees(j, STA, u.arm, u.label, u.run.sim)) { console.log(`GATE 7aa: ${u.id} ${u.label}: the trace is not the log's`); process.exit(1); }
  const [rule, w] = u.label.split('/W');
  RAW[`${u.id}|${u.arm}|${rule}|${w}`] = j; T[`${u.id}|${u.arm}|${rule}|${w}`] = decode(j);
}
const refOf = tag => (id, arm, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === A.label(tag, w));
// 7ab: FREED
const logsB = logsOf(DB), unitsB = Object.values(logsB).flatMap(B.parse);
requireFairLogs(logsB, B.PRED);
{ const bad = B.gate(unitsB, refOf('PRODUCT')); if (bad.length) { console.log(`GATE 7ab FAILED\n  ${bad.join('\n  ')}`); process.exit(1); } }
const STB = stampOf(logsB);
for (const u of unitsB) for (const rule of B.RULES) {
  const j = readTrace(join(DB, B.traceName(u.id, u.arm, rule, u.w)));
  if (!A.traceAgrees(j, STB, u.arm, A.label(rule, u.w), u.runs[rule].sim)) { console.log(`GATE 7ab: ${u.id} ${rule}/W${u.w}: the trace is not the log's`); process.exit(1); }
  if (rule === 'PRODUCT') { if (!B.sameTrace(j, RAW[`${u.id}|${u.arm}|PRODUCT|${u.w}`])) { console.log(`GATE 7ab: ${u.id} W${u.w}: PRODUCT is not 7aa's`); process.exit(1); } continue; }
  T[`${u.id}|${u.arm}|FREED|${u.w}`] = decode(j);
}
// 7ac: OPEN0
const logsC = logsOf(DC), unitsC = Object.values(logsC).flatMap(C.parse);
if (C.UNITS.some(([id, a, w]) => !unitsC.some(u => u.id === id && u.arm === a && u.w === w && u.done))) { console.log(`INCOMPLETE - 7ac: ${unitsC.filter(u => u.done).length} of ${C.UNITS.length} units done`); process.exit(1); }
requireFairLogs(logsC, C.PRED);
{ const bad = C.gate(unitsC, refOf('TS+J'), refOf('PRODUCT')); if (bad.length) { console.log(`GATE 7ac FAILED\n  ${bad.join('\n  ')}`); process.exit(1); } }
const STC = stampOf(logsC);
for (const u of unitsC) for (const rule of C.RULES) {
  const j = readTrace(join(DC, C.traceName(u.id, u.arm, rule, u.w)));
  if (!A.traceAgrees(j, STC, u.arm, C.label(rule, u.w), u.runs[rule].sim)) { console.log(`GATE 7ac: ${u.id} ${rule}/W${u.w}: the trace is not the log's`); process.exit(1); }
  if (rule === 'TS+J') { if (!B.sameTrace(j, RAW[`${u.id}|${u.arm}|TS+J|${u.w}`])) { console.log(`GATE 7ac: ${u.id} W${u.w}: TS+J is not 7aa's`); process.exit(1); } continue; }
  T[`${u.id}|${u.arm}|OPEN0|${u.w}`] = decode(j);
}
console.log('READ BESIDE 7AC (reported, not registered; grade C): the gates passed - 7aa (its gate, every trace), 7ab (its gate, every trace, PRODUCT identical to 7aa\'s), 7ac (its gate against 7aa, every trace, TS+J identical to 7aa\'s)\n');

const alive = X => X.survived.reduce((s, x) => s + x, 0);
const sgn = x => `${x >= 0 ? '+' : ''}${x}`;
console.log('1. THE TWO-BY-TWO BY SURVIVAL (paths surviving of 8,000; differences in paths)');
for (const [id, arm, w] of C.UNITS) {
  const [P, F, O, J] = ['PRODUCT', 'FREED', 'OPEN0', 'TS+J'].map(r => alive(T[`${id}|${arm}|${r}|${w}`]));
  console.log(`  ${`${id} (${arm.toLowerCase()}) W${w}`.padEnd(24)} PRODUCT ${P}  FREED ${F}  OPEN0 ${O}  TS+J ${J} | the opening: on the product's tables ${sgn(F - P)}, on TS+J's ${sgn(J - O)} | the tables: at the plan's-tier opening ${sgn(O - P)}, at the de-risked opening ${sgn(J - F)} | interaction (TS+J-OPEN0)-(FREED-PRODUCT) ${sgn((J - O) - (F - P))}`);
}
const q = a => { if (!a.length) return '-'; const s = [...a].sort((x, y) => x - y); return [0.25, 0.5, 0.75].map(p => s[Math.floor(p * (s.length - 1))].toFixed(2)).join('/'); };
console.log('\n2. OPEN0\'S LOST PATHS AGAINST TS+J (TS+J survives, OPEN0 fails): the year OPEN0 first leaves the plan\'s pension tier (never = n), the year-0 draw z0 and the long-run shift (quartiles)');
// the seed as a number: reduce-7aa.mjs's SEED is the string '7002', and pathsForSeed's `seed + i * 7919` would concatenate
// it (the deep review after 7ac, 28 Sep 14:47 UK, found section 2 read from unrelated paths that way). PLANT_STRING_SEED=1
// passes the string, to show the check below fail on that fault (rule 6).
const SEED_N = process.env.PLANT_STRING_SEED ? A.SEED : Number(A.SEED);
const zsCache = {};
// THE SEED CHECK: OPEN0 and TS+J differ only in the year-0 pension tier, so their year-0 wealth gap moves with the year-0
// draw; on the right paths the two correlate strongly on every unit (0.977 to 0.982 by the deep review's check), on the
// wrong ones not at all (0.007)
const corr = (a, b) => { const n = a.length, ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; } return sab / Math.sqrt(saa * sbb); };
for (const [id, arm, w] of C.UNITS) {
  const O = T[`${id}|${arm}|OPEN0|${w}`], J = T[`${id}|${arm}|TS+J|${w}`];
  const zs = zsCache[O.Y] || (zsCache[O.Y] = pathsForSeed(SEED_N, O.N, O.Y - 1));
  const r = corr(zs.map(z => z[0]), Array.from({ length: O.N }, (_, i) => O.wealth[i * O.Y] - J.wealth[i * J.Y]));
  if (!(Math.abs(r) > 0.9)) { console.log(`SEED CHECK FAILED: ${id} W${w}: the year-0 draw and OPEN0's year-0 wealth gap to TS+J correlate ${r.toFixed(3)}, not beyond 0.9 - the paths are not the runs' paths`); process.exit(1); }
}
for (const [id, arm, w] of C.UNITS) {
  const O = T[`${id}|${arm}|OPEN0|${w}`], J = T[`${id}|${arm}|TS+J|${w}`];
  const zs = zsCache[O.Y];
  const idx = []; for (let i = 0; i < O.N; i++) if (J.survived[i] && !O.survived[i]) idx.push(i);
  const hist = {};
  for (const i of idx) { let y = 'n'; for (let t = 0; t < O.Y; t++) if ((O.tier[i * O.Y + t] >> 2) > 0) { y = t; break; } const k = y === 'n' ? 'n' : y <= 1 ? '1' : y <= 2 ? '2' : y <= 5 ? '3-5' : y <= 10 ? '6-10' : '11+'; hist[k] = (hist[k] || 0) + 1; }
  const d0 = idx.map(i => zs[i][0]), sh = idx.map(i => zs[i][O.Y]);
  console.log(`  ${`${id} (${arm.toLowerCase()}) W${w}`.padEnd(24)} lost ${idx.length}: first de-risk ${['1', '2', '3-5', '6-10', '11+', 'n'].map(k => `${k}:${hist[k] || 0}`).join(' ')}; z0 quartiles ${q(d0)}, below -1 on ${d0.filter(x => x < -1).length}; shift quartiles ${q(sh)}`);
}
console.log('\n3. THE WORLD-PRICE SUM: the weighted sum of the three world prices (points) against the mixture\'s price (the year-0 gap in points)');
for (const [id, arm, w] of C.UNITS) {
  const u = unitsC.find(x => x.id === id && x.arm === arm && x.w === w);
  const sum = u.worlds.reduce((s, x) => s + x.w * x.price, 0);
  console.log(`  ${`${id} (${arm.toLowerCase()}) W${w}`.padEnd(24)} weighted world prices ${sum.toFixed(4)} (${u.worlds.map(x => `${x.w.toFixed(4)} x ${x.price.toFixed(4)}`).join(' + ')}) | the mixture's price ${u.price.mixture.toFixed(4)} | ratio ${(sum / u.price.mixture).toFixed(2)}`);
}
