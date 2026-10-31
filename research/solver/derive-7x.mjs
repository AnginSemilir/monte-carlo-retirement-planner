/*
 * 7X'S POWER (predictions/diag-7x.md, Power; its output hashed in the prediction and re-run by the launcher). Items 1, 3
 * and 4 read a realised difference on 8,000 paths (dS) against the held tables' difference (dT, a table property with no
 * path noise); item 2 reads tables alone and has no path power. Each story fixes dT and draws dS as Poisson counts (saved,
 * lost) with a background of b paths each way (b = 0.5 and 5), 20,000 draws a story, read by reduce-7x.mjs's own rules
 * (reduce-7v.mjs's gain and harm families, the ratio bounds).
 * THE SIZES, from the records on 7x's own paths (seed 7002's 8,000, 7v's): holding 2/2 for life is taken to realise what
 * opening in tier 2 realised against the product in 7v - margin 0 against 0.001 for the reader on S126 and share 0.95 and
 * for off on S194, and off at 1e-4 against 0.001 on S360, each of which opens in tier 2 (results-7v.txt; 7v's traces,
 * through 7v's own gate). Grade C: margin 0 churns after the opening (about 4 to 5 switches a path) where the hold does not;
 * 7w's freed opening, which holds, realised about the same on its 3,000 paths (results-7w.txt: 15/0, 16/0 and 72/0).
 *   node research/solver/derive-7x.mjs > research/solver/results-derive-7x.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { marginFor } from './stats.mjs';
import * as V from './reduce-7v.mjs';
import { N, HI, LO, SIGN_MIN } from './reduce-7x.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const load = (dir, mod, pick) => {
  const D = join(HERE, 'results', dir);
  const logs = Object.fromEntries(readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D, f), 'utf8')]));
  requireFairLogs(logs, mod.PRED);
  const units = Object.values(logs).flatMap(mod.parse), bad = mod.gate(units);
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
  if (bad.length) { console.log(`FAIR-TEST GATE (${dir}): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  return (id, label) => {
    const j = JSON.parse(gunzipSync(readFileSync(join(D, mod.traceName(id, label)))).toString());
    if (!mod.traceAgrees(j, ST, label, pick(units, id, label))) { console.log(`${dir}: the trace ${id} ${label} is not the log's`); process.exit(1); }
    return decode(j).survived.slice(0, N);
  };
};
const S7v = load('diag7v', V, (units, id, label) => units.find(u => u.id === id).runs[label].sim);
const rec = {
  S126: V.cells(S7v('S126', 'READER/1e-3'), S7v('S126', 'READER/0')),
  S194: V.cells(S7v('S194', 'OFF/1e-3'), S7v('S194', 'OFF/0')),
  'share 0.95': V.cells(S7v('share 0.95', 'READER/1e-3'), S7v('share 0.95', 'READER/0')),
  S360: V.cells(S7v('S360', 'OFF/1e-3'), S7v('S360', 'OFF/1e-4')) };
const mar = { S126: marginFor(V.survivedShare(S7v('S126', 'READER/1e-3'))), S194: marginFor(V.survivedShare(S7v('S194', 'OFF/1e-3'))), 'share 0.95': marginFor(V.survivedShare(S7v('share 0.95', 'READER/1e-3'))), S360: marginFor(V.survivedShare(S7v('S360', 'OFF/1e-3'))) };
console.log(`7X'S POWER: ${N} paths; 20000 draws a story (seed 7002); read by reduce-7x.mjs's rules\n`);
console.log('THE SIZES (saved/lost of the de-risked run against the plan\'s tier on 7x\'s paths; grade C, see the header), and each case\'s margin');
for (const [k, v] of Object.entries(rec)) console.log(`  ${k.padEnd(11)} ${v.saved}/${v.lost}  dS ${(100 * (v.saved - v.lost) / N).toFixed(4)}  margin ${mar[k]}`);
console.log('');

const DRAWS = 20000;
let sd = 7002 >>> 0;
const rnd = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; if (m > 60) { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return Math.max(0, Math.round(m + (u - 6) * Math.sqrt(m))); } const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const drawLeg = (v, b, margin) => { const l = pois(v.lost + b), s = pois(v.saved + b); return { label: 'x', k: { a: N - l - s - 200, lost: l, saved: s, d: 200, N }, margin }; };
const within = R => R >= 1 / HI && R <= HI;
const trueDS = v => 100 * (v.saved - v.lost) / N;
function tally(name, b, one) {
  const t = {};
  for (let d = 0; d < DRAWS; d++) { const o = one(b); t[o] = (t[o] || 0) + 1; }
  console.log(`  ${name.padEnd(86)} b ${String(b).padEnd(4)} ${Object.keys(t).sort().map(k => `${k} ${(t[k] / DRAWS).toFixed(3)}`).join('  ')}`);
}
// item 1: dT = f x the true dS on S126 and S194
const item1 = f => bb => {
  const legs = ['S126', 'S194'].map(id => drawLeg(rec[id], bb, mar[id])), g = V.gainFamily(legs);
  const R = legs.map((x, j) => (f * trueDS(rec[['S126', 'S194'][j]])) / (100 * (x.k.saved - x.k.lost) / N));
  return R.every((r, j) => g[j].o === 'gain' && within(r)) ? 'HELD' : R.every((r, j) => g[j].o === 'gain' && r < LO) ? 'FALSIFIED' : 'INCONCLUSIVE';
};
const item3 = f => bb => { const x = drawLeg(rec['share 0.95'], bb, mar['share 0.95']), g = V.gainFamily([x])[0], R = f * trueDS(rec['share 0.95']) / (100 * (x.k.saved - x.k.lost) / N); return g.o === 'gain' && R < LO ? 'HELD' : g.o === 'gain' && within(R) ? 'FALSIFIED' : 'INCONCLUSIVE'; };
const item4 = dT => bb => { const x = drawLeg(rec.S360, bb, mar.S360), dS = 100 * (x.k.saved - x.k.lost) / N, mat = V.harmFamily([x])[0].o === 'harm' || V.gainFamily([x])[0].o === 'gain', big = Math.abs(dT) >= SIGN_MIN && Math.abs(dS) >= SIGN_MIN; return mat && big && Math.sign(dT) === Math.sign(dS) ? 'HELD' : mat && big && Math.sign(dT) === -Math.sign(dS) ? 'FALSIFIED' : 'INCONCLUSIVE'; };
for (const b of [0.5, 5]) {
  console.log(`BACKGROUND ${b} PATHS EACH WAY ON EVERY LEG`);
  for (const [nm, f] of [['FS: the held tables see the whole realised gain (dT = dS)', 1], ['FS, the tables a fifth low (dT = 0.8 dS)', 0.8], ['W: the held tables see 0.3 of it', 0.3], ['between: 0.6 of it', 0.6]]) tally(`item 1, ${nm}`, b, item1(f));
  for (const [nm, f] of [['Q: the held tables see 0.05 of it', 0.05], ['Q absent: they see all of it', 1]]) tally(`item 3, ${nm}`, b, item3(f));
  for (const [nm, dT] of [['the tables lose 1 point, as the realised run does', -1], ['the tables flat (off\'s misread: 0.05 points)', -0.05], ['the tables gain 1 point', 1]]) tally(`item 4, ${nm}`, b, item4(dT));
  console.log('');
}
