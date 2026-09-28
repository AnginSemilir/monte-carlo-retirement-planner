/*
 * READ BESIDE 7AD (reported, not registered; grade C; written after 7ad was read at 28 Sep 18:4x UK, results-7ad.txt). Where
 * does the under-pricing of the opening that 7ac found (TS+J's mixture price against its realised gain over OPEN0) sit: at
 * the world nodes the tables price (7ad's node runs), or on the paths between and beyond them (7ac's own 8,000 paths, whose
 * long-run shifts are continuous)? Every run is read only through its reducer's gates: 7aa's (reduce-7aa.mjs), 7ac's
 * (reduce-7ac.mjs against 7aa, every trace) and 7ad's (reduce-7ad.mjs against both, every node trace).
 * On 7ad's three 30x5 units (bridge 4 reader W0, S194 off W0.02, S126 reader W0):
 *   1. THE PRICE AGAINST THE NODES: the mixture's like-for-like survival price of the opening (points; 7ad's price line)
 *      against the node-weighted realised gain, the sum over the three worlds of each world's weight times TS+J's survival
 *      over OPEN0 at that world's node (4,000 paths a node): what the mixture would realise if every path sat on a node;
 *   2. THE PRICE AGAINST THE PATHS: 7ac's realised gain on its 8,000 paths (TS+J over OPEN0, saved/lost), and those changed
 *      paths by their long-run shift (below -sqrt3, the lowest node's value; -sqrt3 to -1; -1 to 0; 0 and above), with the
 *      share of all 8,000 paths in each band. The shifts come from engine.mjs pathsForSeed with the seed as a number,
 *      checked as read-7ac-beside.mjs checks it (the year-0 draw against OPEN0's year-0 wealth gap to TS+J, beyond 0.9).
 *   node research/solver/read-7ad-beside.mjs > research/solver/results-7ad-beside.txt
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './reduce-7v.mjs';
import { survivalChange } from './stats.mjs';
import * as A from './reduce-7aa.mjs';
import * as C from './reduce-7ac.mjs';
import * as D from './reduce-7ad.mjs';
import { pathsForSeed } from '../engine.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DA = join(HERE, 'results', 'diag7aa'), DC = join(HERE, 'results', 'diag7ac'), DD = join(HERE, 'results', 'diag7ad');
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
const fail = m => { console.log(m); process.exit(1); };
// 7aa
const logsA = logsOf(DA), unitsA = Object.values(logsA).flatMap(A.parse);
requireFairLogs(logsA, A.PRED);
{ const b = A.gate(unitsA); if (b.length) fail(`GATE 7aa FAILED\n  ${b.join('\n  ')}`); }
const refA = (id, arm, tag, w) => unitsA.find(u => u.id === id && u.arm === arm && u.label === A.label(tag, w));
// 7ac, both runs' traces
const logsC = logsOf(DC), unitsC = Object.values(logsC).flatMap(C.parse);
requireFairLogs(logsC, C.PRED);
{ const b = C.gate(unitsC, (i, a, w) => refA(i, a, 'TS+J', w), (i, a, w) => refA(i, a, 'PRODUCT', w)); if (b.length) fail(`GATE 7ac FAILED\n  ${b.join('\n  ')}`); }
const refC = (id, arm, w) => unitsC.find(u => u.id === id && u.arm === arm && u.w === w) || null;
const STC = stampOf(logsC), TC = {};
for (const u of unitsC) for (const rule of C.RULES) {
  const f = join(DC, C.traceName(u.id, u.arm, rule, u.w));
  if (!existsSync(f)) fail(`GATE 7ac: no trace ${f}`);
  const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
  if (!A.traceAgrees(j, STC, u.arm, C.label(rule, u.w), u.runs[rule].sim)) fail(`GATE 7ac: ${u.id} ${rule}/W${u.w}: the trace is not the log's`);
  TC[`${u.id}|${rule}|${u.w}`] = decode(j);
}
// 7ad, every node trace
const logsD = logsOf(DD), jobs = Object.values(logsD).flatMap(D.parse);
if (D.JOBS.some(([id, a, w, g]) => !jobs.some(j => j.id === id && j.arm === a && j.w === w && j.grid === g && j.done))) fail('INCOMPLETE - 7ad');
requireFairLogs(logsD, D.PRED);
const bad = D.gate(jobs, refA, refC), TD = bad.length ? {} : D.loadTraces(jobs, DD, stampOf(logsD), bad);
if (bad.length) fail(`GATE 7ad FAILED\n  ${bad.join('\n  ')}`);
console.log('READ BESIDE 7AD (reported, not registered; grade C): the gates passed - 7aa (its gate), 7ac (its gate against 7aa, every trace), 7ad (its gate against both, every node trace)\n');

// the shifts, with read-7ac-beside.mjs's seed check
const SEED_N = Number(A.SEED), zsCache = {};
const corr = (a, b) => { const n = a.length, ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; } return sab / Math.sqrt(saa * sbb); };
const UNITS = [['bridge 4', 'READER', '0'], ['S194', 'OFF', '0.02'], ['S126', 'READER', '0']];
const BANDS = [['below -sqrt3', z => z < -Math.sqrt(3)], ['-sqrt3 to -1', z => z >= -Math.sqrt(3) && z < -1], ['-1 to 0', z => z >= -1 && z < 0], ['0 and above', z => z >= 0]];
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
console.log('1. THE PRICE AGAINST THE NODES (points): the mixture\'s like-for-like survival price of the opening (7ad, 30x5) against the node-weighted realised gain of TS+J over OPEN0 (each world\'s weight times its node run\'s gain, 4,000 paths a node)');
const node = {};
for (const [id, arm, w] of UNITS) {
  const u = jobs.find(j => j.id === id && j.grid === '30x5').tags['TS+J'];
  const parts = [0, 1, 2].map(k => { const kk = cells(TD[`${id}|30x5|OPEN0|${k}`].survived, TD[`${id}|30x5|TS+J|${k}`].survived); return { w: u.worlds[k].w, d: survivalChange(kk.lost, kk.saved, kk.N, D.ALPHA1).d }; });
  node[id] = parts.reduce((t, x) => t + x.w * x.d, 0);
  console.log(`  ${`${id} (${arm.toLowerCase()}) W${w}`.padEnd(24)} price ${u.price.surv.toFixed(3)} | node-weighted realised ${node[id].toFixed(3)} (${parts.map((x, k) => `world ${k} ${x.w.toFixed(4)} x ${f3(x.d)}`).join(', ')}) | ratio ${(node[id] / u.price.surv).toFixed(2)}`);
}
console.log('\n2. THE PRICE AGAINST THE PATHS: 7ac\'s realised gain of TS+J over OPEN0 on its 8,000 paths (points), and its changed paths by long-run shift (saved/lost, and the share of all paths in the band)');
for (const [id, arm, w] of UNITS) {
  const O = TC[`${id}|OPEN0|${w}`], J = TC[`${id}|TS+J|${w}`];
  const zs = zsCache[O.Y] || (zsCache[O.Y] = pathsForSeed(SEED_N, O.N, O.Y - 1));
  const r = corr(zs.map(z => z[0]), Array.from({ length: O.N }, (_, i) => O.wealth[i * O.Y] - J.wealth[i * J.Y]));
  if (!(Math.abs(r) > 0.9)) fail(`SEED CHECK FAILED: ${id} W${w}: the year-0 draw and OPEN0's year-0 wealth gap to TS+J correlate ${r.toFixed(3)}, not beyond 0.9`);
  const kk = cells(O.survived, J.survived), d = survivalChange(kk.lost, kk.saved, kk.N, 0.05).d, price = jobs.find(j => j.id === id && j.grid === '30x5').tags['TS+J'].price.surv;
  const band = BANDS.map(([name, f]) => { let s = 0, l = 0, n = 0; for (let i = 0; i < O.N; i++) { const z = zs[i][O.Y]; if (!f(z)) continue; n++; if (J.survived[i] && !O.survived[i]) s++; else if (O.survived[i] && !J.survived[i]) l++; } return `${name} ${s}/${l} (${(100 * n / O.N).toFixed(1)}% of paths)`; });
  console.log(`  ${`${id} (${arm.toLowerCase()}) W${w}`.padEnd(24)} ${kk.saved}/${kk.lost} ${f3(d)} against the price ${price.toFixed(3)} (ratio ${(d / price).toFixed(2)}) and the node-weighted ${node[id].toFixed(3)} | by shift: ${band.join('; ')} | seed check ${r.toFixed(3)}`);
}
// 3. O47's figures from a committed script (its gate: "its figures from a committed script over 7ac's OPEN0 traces"; done
// after 7ad was read, the order recorded in the ledger): the share of 7ac's 8,000 OPEN0 paths first leaving the plan's tiers
// in each year 0 to 9 (reduce-7ad.mjs firstLeave), and the yearly hazard (those leaving in year t over those still in the
// plan's tiers at its start, failed paths counted as staying until their failure year)
console.log('\n3. O47: 7AC\'S OPEN0 ON ITS 8,000 PATHS - the per cent first leaving the plan\'s tiers in years 0 to 9, then the yearly hazard (per cent of those still in the plan\'s tiers)');
for (const [id, arm, w] of UNITS) {
  const O = TC[`${id}|OPEN0|${w}`], f = D.firstLeave(O, 10);
  let atRisk = O.N; const hz = f.map(x => { const h = atRisk ? 100 * x / atRisk : 0; atRisk -= x; return h; });
  console.log(`  ${`${id} (${arm.toLowerCase()}) W${w}`.padEnd(24)} share ${f.map(x => (100 * x / O.N).toFixed(1).padStart(5)).join(' ')} | hazard ${hz.map(x => x.toFixed(1).padStart(5)).join(' ')}`);
}
