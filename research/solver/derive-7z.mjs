/*
 * 7Z'S POWER (predictions/diag-7z.md, Power; its output hashed in the prediction and re-run by the launcher). Items 1 and 3
 * read paired paths (READER+STEP against READER at the product's margin, 8,000 paths of seed 7002); items 2 and 4 read one
 * solve's gap line and an identity, and have no path power. Each story fixes the true saved and lost counts and draws them
 * as Poisson counts with a background of b paths each way (b = 0.5 and 5), 20,000 draws a story, read by reduce-7z.mjs's
 * own families (reduce-7v.mjs's gain and harm families, Holm over item 3's two legs).
 * THE SIZES, from the records (as the PLAN.md ledger's 22:32 row takes 7y's sizes from 7w's freed opening against the
 * product; the plan-auditor's review of 7z's registration, MINOR 1): on 7w's 3,000 paths (the first 3,000 of 7v's 8,000 and of 7z's), the reader at 5 points
 * with the year-0 move freed (margin 0 in year 0, 0.001 after) against the reader at 0.001 - share 0.95 and S126 - scaled to
 * 8,000 paths; each case's margin from 7v's READER/1e-3 survival on the 8,000. Grade C: the fix frees the opening to the
 * move the exact integral prefers, which need not be margin 0's; bridge 4 has no freed-opening record and is drawn level
 * (no true change) or under a harm story.
 *   node research/solver/derive-7z.mjs > research/solver/results-derive-7z.txt
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
import { N } from './reduce-7z.mjs';

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
for (const id of ['share 0.95', 'S126']) { const k = V.cells(S7w(id, 'READER@5/1e-3'), S7w(id, 'READER@5/1e-3+open')); rec[id] = { saved: k.saved * scale, lost: k.lost * scale, raw: `${k.saved}/${k.lost} of ${W.N}` }; }
const mar = Object.fromEntries(['share 0.95', 'S126', 'bridge 4'].map(id => [id, marginFor(V.survivedShare(S7v(id, 'READER/1e-3')))]));
console.log(`7Z'S POWER: ${N} paths; 20000 draws a story (seed 7002); read by reduce-7z.mjs's families\n`);
console.log('THE SIZES (the freed opening against the reader at 0.001 on 7w\'s paths, scaled to 8,000; grade C, see the header), and each case\'s margin (7v\'s READER/1e-3)');
for (const [k, v] of Object.entries(rec)) console.log(`  ${k.padEnd(11)} ${v.raw} -> ${v.saved.toFixed(1)}/${v.lost.toFixed(1)} of ${N}  margin ${mar[k]}`);
console.log(`  bridge 4    no record  margin ${mar['bridge 4']}\n`);

const DRAWS = 20000;
let sd = 7002 >>> 0;
const rnd = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; if (m > 60) { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return Math.max(0, Math.round(m + (u - 6) * Math.sqrt(m))); } const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const drawLeg = (saved, lost, b, margin, label) => { const l = pois(lost + b), s = pois(saved + b); return { label, k: { a: N - l - s - 200, lost: l, saved: s, d: 200, N }, margin }; };
function tally(name, b, one) {
  const t = {};
  for (let d = 0; d < DRAWS; d++) { const o = one(b); t[o] = (t[o] || 0) + 1; }
  console.log(`  ${name.padEnd(78)} b ${String(b).padEnd(4)} ${Object.keys(t).sort().map(k => `${k} ${(t[k] / DRAWS).toFixed(3)}`).join('  ')}`);
}
// item 1: reduce-7z's rule on one gain leg
const item1 = f => b => { const x = V.gainFamily([drawLeg(f * rec['share 0.95'].saved, f * rec['share 0.95'].lost, b, mar['share 0.95'], 'share 0.95')])[0]; return x.o === 'gain' ? 'HELD' : x.o === 'no material gain' ? 'FALSIFIED' : 'INCONCLUSIVE'; };
// item 3: reduce-7z's rule on two harm legs, Holm over them
const item3 = (s126, b4) => b => { const legs = V.harmFamily([drawLeg(s126[0], s126[1], b, mar.S126, 'S126'), drawLeg(b4[0], b4[1], b, mar['bridge 4'], 'bridge 4')]); return legs.every(x => x.o === 'no material harm') ? 'HELD' : legs.some(x => x.o === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE'; };
for (const b of [0.5, 5]) {
  console.log(`BACKGROUND ${b} PATHS EACH WAY ON EVERY LEG`);
  for (const [nm, f] of [['the fix as the freed opening', 1], ['half of it', 0.5], ['a quarter of it', 0.25], ['the fix doing nothing', 0]]) tally(`item 1, ${nm}`, b, item1(f));
  const s = rec.S126;
  for (const [nm, a, c] of [['S126 as the freed opening, bridge 4 level', [s.saved, s.lost], [0, 0]], ['both level', [0, 0], [0, 0]], ['bridge 4 loses 40 paths (0.5 points)', [0, 0], [0, 40]], ['bridge 4 loses 20 paths (0.25 points)', [0, 0], [0, 20]], ['S126 loses 20 paths (0.25 points)', [0, 20], [0, 0]]]) tally(`item 3, ${nm}`, b, item3(a, c));
  console.log('');
}
