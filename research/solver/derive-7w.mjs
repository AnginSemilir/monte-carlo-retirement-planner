/*
 * 7W'S POWER (predictions/diag-7w.md, Power; its output hashed in the prediction and re-run by the launcher). Item 2 and
 * item 4 are read by reduce-7w.mjs's families (reduce-7v.mjs's gainFamily and harmFamily: the regimen's exact rule, Holm
 * over the item's legs, the case's margin) on Poisson counts drawn under each story, 20,000 draws a story, with a background
 * of b paths each way on every leg (b = 0.5, 7s's half a path a 3,000, and b = 5).
 * THE SIZES, from the records: 7w runs seed 7002's first 3,000 paths, which are 7v's first 3,000 (pathsForSeed builds each
 * path from the seed alone: checked below), so 7v's traces restricted to those paths give the 5-point sizes on 7w's own
 * paths (results/diag7v, the stamp gate and every trace's check run first, as reduce-7v.mjs runs them):
 *   - item 2 (Q's survival): if 15 points moves the reader's opening as a smaller margin does at 5 points, its gain is 7v's
 *     READER/1e-4 and READER/0 against READER/1e-3 on share 0.95 (and READER+J's); drawn at that size, at half and at none;
 *   - item 4 (the freed opening against margin 0): on S126 the reader at 1e-3 against itself at 0, and on S194 off's; the
 *     freed opening is drawn level with margin 0 (it takes margin 0's opening and holds it), at half and at the whole of
 *     1e-3's loss (freeing the opening does nothing).
 * The gap items (1, 3 and 5) are one solve each and read by a registered ratio, not by paths: no power is drawn for them.
 * Their point comes from Q'S ARITHMETIC, printed first: the sixth deep review's year-1 thresholds on share 0.95 (a path
 * fails in year 1 when z0 + 0.4 x its shift falls below -1.52 at the plan's tier and -1.69 at tier 2; deep-review-log.md,
 * 27 Sep 18:19 UK, from its read-only scripts over 7v's traces, grade C) set against the solver's own return points
 * (solve.js NODES and gaussHermite(15)) and the mixture's worlds (solve.js MIX3): the share of the de-risk's year-1 value
 * each rule can see, against the continuous one.
 *   node research/solver/derive-7w.mjs > research/solver/results-derive-7w.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { pathsForSeed } from '../engine.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { marginFor } from './stats.mjs';
import * as V from './reduce-7v.mjs';
import { N } from './reduce-7w.mjs';
import { NODES, gaussHermite } from '../../src/solver/solve.js';

const HERE = dirname(fileURLToPath(import.meta.url));
// 7w's paths are 7v's first N (a planted fault shown to fail: a different seed's first path differs)
{ const a = pathsForSeed(7002, V.N, 40), b = pathsForSeed(7002, N, 40), c = pathsForSeed(7003, N, 40);
  const same = (x, y) => x.every((z, i) => z === y[i]);
  if (!b.every((zs, i) => same(zs, a[i])) || same(c[0], a[0])) { console.log('PLANTED CHECK FAILED: 7w\'s paths are not 7v\'s first ' + N); process.exit(1); } }
// 7v's records, through its own gate
const DIR = join(HERE, 'results', 'diag7v');
const logs = Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
requireFairLogs(logs, V.PRED);
const cases = Object.values(logs).flatMap(V.parse), bad = V.gate(cases);
const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
const S = (id, l) => {
  const c = cases.find(x => x.id === id), j = JSON.parse(gunzipSync(readFileSync(join(DIR, V.traceName(id, l)))).toString());
  if (!V.traceAgrees(j, ST, l, c.runs[l].sim)) bad.push(`${id} ${l}: the trace is not the log's`);
  return decode(j).survived.slice(0, N);
};
const rec = {};
for (const [id, a, b] of [['share 0.95', 'READER/1e-3', 'READER/1e-4'], ['share 0.95', 'READER/1e-3', 'READER/0'], ['share 0.95', 'READER+J/1e-3', 'READER+J/1e-4'], ['share 0.95', 'READER+J/1e-3', 'READER+J/0'],
  ['S126', 'READER/0', 'READER/1e-3'], ['S194', 'OFF/0', 'OFF/1e-3']]) rec[`${id} ${a} ${b}`] = V.cells(S(id, a), S(id, b));
const mar = { 'share 0.95': marginFor(V.survivedShare(S('share 0.95', 'OFF/1e-3'))), S126: marginFor(V.survivedShare(S('S126', 'READER/1e-3'))), S194: marginFor(V.survivedShare(S('S194', 'OFF/1e-3'))) };
if (bad.length) { console.log(`FAIR-TEST GATE (7v's records): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
// Q'S ARITHMETIC
{ const W = { z: [-Math.sqrt(3), 0, Math.sqrt(3)], w: [1 / 6, 2 / 3, 1 / 6] }, TP = -1.52, T2 = -1.69, LOAD = 0.4;
  const erf = x => { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const Phi = x => 0.5 * (1 + erf(x / Math.SQRT2));
  const g15 = gaussHermite(15), g5 = gaussHermite(5);
  if (NODES.some((x, i) => Math.abs(x - g5.nodes[i]) > 1e-5)) { console.log('PLANTED CHECK FAILED: gaussHermite(5) is not the solver\'s five points'); process.exit(1); }
  const seen = q => W.z.map((sh, k) => ({ sh, w: W.w[k], lo: T2 - LOAD * sh, hi: TP - LOAD * sh, mass: q.nodes.reduce((t, x, i) => t + (x >= T2 - LOAD * sh && x < TP - LOAD * sh ? q.weights[i] : 0), 0), nodes: q.nodes.filter(x => x >= T2 - LOAD * sh && x < TP - LOAD * sh) }));
  const whole = r => r.reduce((t, x) => t + x.w * x.mass, 0);
  const cont = W.z.reduce((t, sh, k) => t + W.w[k] * (Phi(TP - LOAD * sh) - Phi(T2 - LOAD * sh)), 0);
  console.log("Q'S ARITHMETIC: the chance a path fails in year 1 at the plan's tier but not at tier 2, as each rule sees it (the sixth deep review's thresholds, grade C)");
  for (const [nm, q] of [['5 points (the product)', { nodes: NODES, weights: g5.weights }], ['15 points', g15]]) {
    const r = seen(q);
    console.log(`  ${nm.padEnd(24)} ${whole(r).toFixed(4)}  (${r.map(x => `world ${x.sh.toFixed(2)}: z0 in [${x.lo.toFixed(3)}, ${x.hi.toFixed(3)}) holds ${x.nodes.length ? x.nodes.map(v => v.toFixed(3)).join(', ') : 'no point'}`).join('; ')})`);
  }
  console.log(`  the continuous chance     ${cont.toFixed(4)} (${(cont * 8000).toFixed(0)} of 8,000 paths; 7v's realised year-1 excess, 175, from the sixth deep review)\n`); }
console.log(`7W'S POWER: ${N} paths; 20000 draws a story (seed 7002); read by reduce-7w.mjs's families with Holm over the item's legs\n`);
console.log(`THE SIZES: 7v's traces on 7w's own paths (the first ${N} of seed 7002; 7v's stamp gate and trace checks passed), saved/lost of the second run against the first`);
for (const [k, v] of Object.entries(rec)) console.log(`  ${k.padEnd(44)} ${v.saved}/${v.lost}`);
console.log(`  the margins (marginFor of the reference run's survival on these paths): ${Object.entries(mar).map(([k, v]) => `${k} ${v}`).join(', ')}\n`);

const DRAWS = 20000;
let sd = 7002 >>> 0;
const rnd = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; if (m > 60) { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return Math.max(0, Math.round(m + (u - 6) * Math.sqrt(m))); } const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const draw = (lost, saved, b, margin) => { const l = pois(lost + b), s = pois(saved + b); return { label: 'x', k: { a: N - l - s - 200, lost: l, saved: s, d: 200, N }, margin }; };
const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
function tally(name, b, one) {
  const t = {};
  for (let d = 0; d < DRAWS; d++) { const o = one(b); t[o] = (t[o] || 0) + 1; }
  console.log(`  ${name.padEnd(78)} b ${String(b).padEnd(4)} ${Object.keys(t).sort().map(k => `${k} ${(t[k] / DRAWS).toFixed(3)}`).join('  ')}`);
}
const g2 = (x, y) => [x.saved - x.lost, y.saved - y.lost];
const [r1e4, rj1e4] = g2(rec['share 0.95 READER/1e-3 READER/1e-4'], rec['share 0.95 READER+J/1e-3 READER+J/1e-4']);
const l126 = rec['S126 READER/0 READER/1e-3'], l194 = rec['S194 OFF/0 OFF/1e-3'];
for (const b of [0.5, 5]) {
  console.log(`BACKGROUND ${b} PATHS EACH WAY ON EVERY LEG`);
  // item 2: the reader at 15 points against itself at 5, share 0.95 (margin as above), READER and READER+J
  for (const [nm, f] of [['1e-4\'s size', 1], ['half of it', 0.5], ['a quarter', 0.25], ['none', 0]])
    tally(`item 2, Q's survival at ${nm} (${Math.round(f * r1e4)} and ${Math.round(f * rj1e4)} saved)`, b, bb => tri(V.gainFamily([draw(0, f * r1e4, bb, mar['share 0.95']), draw(0, f * rj1e4, bb, mar['share 0.95'])]), x => x.o === 'gain', x => x.o === 'no material gain'));
  // item 4: the freed opening against margin 0 on S126 (reader) and S194 (off); the switch count is not drawn
  for (const [nm, f] of [['level with margin 0', 0], ['half of 1e-3\'s loss kept', 0.5], ['all of 1e-3\'s loss kept', 1]])
    tally(`item 4's paths, ${nm} (S126 ${f * l126.lost}/${f * l126.saved}, S194 ${f * l194.lost}/${f * l194.saved} lost/saved)`, b, bb => { const r = V.harmFamily([draw(f * l126.lost, f * l126.saved, bb, mar.S126), draw(f * l194.lost, f * l194.saved, bb, mar.S194)]); return r.every(x => x.o === 'no material harm') ? 'no material harm on both' : r.every(x => x.o === 'harm') ? 'harm on both' : 'mixed'; });
  console.log('');
}
