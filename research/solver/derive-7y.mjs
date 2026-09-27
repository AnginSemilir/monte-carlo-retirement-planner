/*
 * 7Y'S POWER (predictions/diag-7y.md, Power; its output hashed in the prediction and re-run by the launcher). Items 1, 2, 4 and 5
 * read paired paths (each arm against PRODUCT at the product's margin, 8,000 paths of seed 7002); item 3 reads two solves'
 * gap lines and has no path power. Each story fixes the true saved and lost counts and draws them as Poisson counts with a
 * background of b paths each way (b = 0.5 and 5), 20,000 draws a story, read by reduce-7y.mjs's own families (reduce-7v.mjs's
 * gain and harm families, Holm over each item's legs).
 * THE SIZES, from the records (the ledger's 22:32 row takes 7y's sizes from 7w's freed opening against the product; O38: not
 * from 7x's held-for-life runs): on 7w's 3,000 paths (the first 3,000 of 7y's 8,000), the year-0 move freed (margin 0 in year
 * 0, 0.001 after) against the product at 0.001 - S126 with the reader, S194 and share 0.95 as 7w ran them - scaled to 8,000;
 * S360 under off: 7v's OFF/3e-4 against OFF/1e-3 on the 8,000 (it opens in tier 2 and holds it, O37). Each case's margin
 * from 7v's product run (READER/1e-3 or OFF/1e-3). Grade C: the tier state is expected to de-risk where the freed opening
 * did, not measured; bridge 4 and S360 with the reader have no record and are drawn level or under a harm story.
 *   node research/solver/derive-7y.mjs > research/solver/results-derive-7y.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { marginFor } from './stats.mjs';
import * as V from './reduce-7v.mjs';
import * as W from './reduce-7w.mjs';
import { N } from './reduce-7y.mjs';

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
    return decode(j).survived;
  };
};
const S7w = load('diag7w', W, (units, id, label) => { const [l, run] = label.split('/'); return units.find(u => u.id === id && u.label === l).runs[run].sim; });
const S7v = load('diag7v', V, (units, id, label) => units.find(u => u.id === id).runs[label].sim);
const scale = N / W.N;
const rec = {};
for (const [id, l] of [['S126', 'READER@5'], ['S194', 'OFF@5'], ['share 0.95', 'READER@5']]) { const k = V.cells(S7w(id, `${l}/1e-3`), S7w(id, `${l}/1e-3+open`)); rec[id] = { saved: k.saved * scale, lost: k.lost * scale, raw: `${k.saved}/${k.lost} of ${W.N} (${l})` }; }
{ const k = V.cells(S7v('S360', 'OFF/1e-3'), S7v('S360', 'OFF/3e-4')); rec['S360 off'] = { saved: k.saved, lost: k.lost, raw: `${k.saved}/${k.lost} of ${N} (7v OFF/3e-4)` }; }
const mar = Object.fromEntries([['S126', 'READER/1e-3'], ['S194', 'OFF/1e-3'], ['share 0.95', 'READER/1e-3'], ['bridge 4', 'READER/1e-3'], ['S360', 'READER/1e-3'], ['S360 off', 'OFF/1e-3']].map(([k, l]) => [k, marginFor(V.survivedShare(S7v(k === 'S360 off' ? 'S360' : k, l)))]));
console.log(`7Y'S POWER: ${N} paths; 20000 draws a story (seed 7002); read by reduce-7y.mjs's families\n`);
console.log('THE SIZES (grade C, see the header), and each case\'s margin (7v\'s product run)');
for (const [k, v] of Object.entries(rec)) console.log(`  ${k.padEnd(11)} ${v.raw} -> ${v.saved.toFixed(1)}/${v.lost.toFixed(1)} of ${N}  margin ${mar[k]}`);
for (const k of ['bridge 4', 'S360']) console.log(`  ${k.padEnd(11)} no record  margin ${mar[k]}`);
console.log('');

const DRAWS = 20000;
let sd = 7002 >>> 0;
const rnd = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; if (m > 60) { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return Math.max(0, Math.round(m + (u - 6) * Math.sqrt(m))); } const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const drawLeg = (saved, lost, b, margin, label) => { const l = pois(lost + b), s = pois(saved + b); return { label, k: { a: N - l - s - 200, lost: l, saved: s, d: 200, N }, margin }; };
function tally(name, b, one) {
  const t = {};
  for (let d = 0; d < DRAWS; d++) { const o = one(b); t[o] = (t[o] || 0) + 1; }
  console.log(`  ${name.padEnd(80)} b ${String(b).padEnd(4)} ${Object.keys(t).sort().map(k => `${k} ${(t[k] / DRAWS).toFixed(3)}`).join('  ')}`);
}
const two = ['S126', 'S194'];
const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
// item 1: TS against PRODUCT on S126 and S194, a gain family of two
const item1 = f => b => tri(V.gainFamily(two.map(id => drawLeg(f * rec[id].saved, f * rec[id].lost, b, mar[id], id))), x => x.o === 'gain', x => x.o === 'no material gain');
// item 2: TS-TIER and TS-REST each against PRODUCT, a gain family of two each; ft and fr the shares each carries
const item2 = (ft, fr) => b => { const t = V.gainFamily(two.map(id => drawLeg(ft * rec[id].saved, 0, b, mar[id], id))), r = V.gainFamily(two.map(id => drawLeg(fr * rec[id].saved, 0, b, mar[id], id))); return t.every(x => x.o === 'gain') && r.every(x => x.o === 'no material gain') ? 'HELD' : r.every(x => x.o === 'gain') && t.every(x => x.o === 'no material gain') ? 'FALSIFIED' : 'INCONCLUSIVE'; };
// item 4: TS against PRODUCT with the reader on share 0.95, bridge 4 and S360, a harm family of three
const item4 = legs => b => { const h = V.harmFamily(legs.map(([id, s, l]) => drawLeg(s, l, b, mar[id], id))); return h.every(x => x.o === 'no material harm') ? 'HELD' : h.some(x => x.o === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE'; };
// item 5: S360 under off, one harm leg
const item5 = f => b => { const x = V.harmFamily([drawLeg(f * rec['S360 off'].saved, f * rec['S360 off'].lost, b, mar['S360 off'], 'S360 off')])[0]; return x.o === 'harm' ? 'HELD' : x.o === 'no material harm' ? 'FALSIFIED' : 'INCONCLUSIVE'; };
const s95 = rec['share 0.95'];
for (const b of [0.5, 5]) {
  console.log(`BACKGROUND ${b} PATHS EACH WAY ON EVERY LEG`);
  for (const [nm, f] of [['the tier state as the freed opening', 1], ['half of it', 0.5], ['a quarter of it', 0.25], ['the tier state doing nothing', 0]]) tally(`item 1, ${nm}`, b, item1(f));
  for (const [nm, ft, fr] of [['the tier carries it all', 1, 0], ['the rest carries it all', 0, 1], ['each carries half', 0.5, 0.5]]) tally(`item 2, ${nm}`, b, item2(ft, fr));
  for (const [nm, legs] of [['all level', [['share 0.95', 0, 0], ['bridge 4', 0, 0], ['S360', 0, 0]]], ['share 0.95 as the freed opening, the rest level', [['share 0.95', s95.saved, s95.lost], ['bridge 4', 0, 0], ['S360', 0, 0]]], ['bridge 4 loses 40 paths (0.5 points)', [['share 0.95', 0, 0], ['bridge 4', 0, 40], ['S360', 0, 0]]], ['S360 with the reader loses 80 paths (1 point)', [['share 0.95', 0, 0], ['bridge 4', 0, 0], ['S360', 0, 80]]]]) tally(`item 4, ${nm}`, b, item4(legs));
  for (const [nm, f] of [['the tier state opens S360 in tier 2 under off (7v OFF/3e-4)', 1], ['a quarter of it', 0.25], ['the tier state leaves S360 alone', 0]]) tally(`item 5, ${nm}`, b, item5(f));
  console.log('');
}
