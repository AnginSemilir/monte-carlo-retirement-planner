/*
 * 7AB'S POWER (predictions/diag-7ab.md, Power; its output hashed in the prediction and re-run by the launcher). Items 1 and 3
 * read paired paths by survival with no material harm read by both intervals (reduce-7ab.mjs bothReads over reduce-7v.mjs's
 * harm family; items 3 and 5 two readings of one six-leg family, split before launch for the plan-auditor's MINOR 1 on 7ab's
 * registration); item 2 reads the whole score for a loss (reduce-7ab.mjs lossRead on reduce-7aa.mjs wholeFrom); item 4 is a
 * gain family. Each story fixes the true saved and lost counts, draws them as Poisson counts with a background of b paths
 * each way (b = 0.5 and 5, and 15 for items 1 and 2: two policies with different tables may differ on more paths than one
 * policy against its own freed opening), and for item 2 draws the rest of the whole score as a normal mean at its recorded
 * standard error; 20,000 draws a story, read by reduce-7ab.mjs's own rule.
 * THE SIZES, from the records:
 *   - the freed opening against the product at 0.001 on 7w's 3,000 paths (7ab's first 3,000), S126 with the reader and S194
 *     under off, scaled to 8,000 (item 4; its survival cells, the paths failing in both, the rest's standard error, through
 *     reduce-7w.mjs's gates) - at the weight 0.02; at 0 no record (O43), the same sizes assumed (grade D);
 *   - the product at 0.02 on 7aa's five cases in 7y (results/diag7y, through reduce-7y.mjs's gates): each case's margin and
 *     how many paths the product fails (items 1 to 3's background of paths failing in both) - assumed the same at 0 (grade D);
 *   - FREED against TS+J: no record (TS+J has never been run forward; 7aa is running). The stories are declared: FREED as
 *     TS+J; TS+J saving 10, 20 (the margin 0.25 of 8,000) or 40 more; for item 2 the rest level or 0.25 points below.
 *   node research/solver/derive-7ab.mjs > research/solver/results-derive-7ab.txt
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
import * as Y from './reduce-7y.mjs';
import { N, wholeLeg, wholeFrom } from './reduce-7aa.mjs';
import { bothReads, lossRead } from './reduce-7ab.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
function gated(dir, mod) {
  const D = join(HERE, 'results', dir);
  const logs = Object.fromEntries(readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D, f), 'utf8')]));
  requireFairLogs(logs, mod.PRED);
  const units = Object.values(logs).flatMap(mod.parse), bad = mod.gate(units);
  if (bad.length) { console.log(`FAIR-TEST GATE (${dir}): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  return { D, units, ST: { code: st[1], audit: st[2], prediction: st[3], sha: st[4] }, logs };
}
// 7w: the freed opening against the product, S126 (reader) and S194 (off)
const g7w = gated('diag7w', W);
const t7w = (id, l) => {
  const [lab, run] = [l.split('/')[0], l.split('/').slice(1).join('/')], u = g7w.units.find(x => x.id === id && x.label === lab);
  const j = JSON.parse(gunzipSync(readFileSync(join(g7w.D, W.traceName(id, l)))).toString());
  if (!W.traceAgrees(j, g7w.ST, l, u.runs[run].sim)) { console.log(`7w: the trace ${id} ${l} is not the log's`); process.exit(1); }
  return { X: decode(j), u };
};
const scaleOf = (logs, id, label) => { for (const text of Object.values(logs)) { let cur = null; for (const line of text.split('\n')) { const c = /^(\S.*?)\s+case \| unit (\S+) \|/.exec(line); if (c) { cur = `${c[1].trim()}|${c[2]}`; continue; } const j = /^\s+joint (\S+): \S+ switchMargin \S+ scale (\S+) cap (\S+)/.exec(line); if (j && cur === `${id}|${label}`) return { scale: Number(j[2]), cap: Number(j[3]) }; } } return null; };
const rec = {};
for (const [id, lab] of [['S126', 'READER@5'], ['S194', 'OFF@5']]) {
  const A = t7w(id, `${lab}/1e-3`), B = t7w(id, `${lab}/1e-3+open`), sc = scaleOf(g7w.logs, id, lab);
  const cfg = { lambda: Number(W.field(A.u.ran, 'lambda')), floor: Math.min(...W.field(A.u.ran, 'levels').split(',').map(Number)), scale: sc.scale, cap: sc.cap, wb: 0.02 };
  cfg.spendYears = Array.from({ length: A.X.Y }, (_, t) => { for (let i = 0; i < A.X.N; i++) if (A.X.level[i * A.X.Y + t] > 0) return true; return false; });
  const w = wholeLeg(A.X, B.X, cfg, 0.05), f = N / W.N;
  rec[id] = { saved: w.k.saved * f, lost: w.k.lost * f, restSe: w.restSe * Math.sqrt(W.N / N), raw: `${w.k.saved}/${w.k.lost} of ${W.N}, the rest ${w.rest.toFixed(3)} +/- ${w.restSe.toFixed(3)}` };
}
// 7y: the product at 0.02 on 7aa's five cases: the margin and the product's failures
const g7y = gated('diag7y', Y);
const s7y = (id, arm, l) => { const u = g7y.units.find(x => x.id === id && x.arm === arm && x.runs[l]); const j = JSON.parse(gunzipSync(readFileSync(join(g7y.D, Y.traceName(id, arm, l)))).toString()); if (!Y.traceAgrees(j, g7y.ST, arm, l, u.runs[l].sim)) { console.log(`7y: the trace ${id} ${l} is not the log's`); process.exit(1); } return decode(j).survived; };
const mar = {}, pFail = {};
for (const [id, arm] of [['S126', 'READER'], ['S194', 'OFF'], ['bridge 4', 'READER'], ['S360', 'READER'], ['S360', 'OFF']]) {
  const P = s7y(id, arm, 'PRODUCT');
  mar[`${id}|${arm}`] = marginFor(V.survivedShare(P)); pFail[`${id}|${arm}`] = P.length - P.reduce((t, x) => t + x, 0);
}
console.log(`7AB'S POWER: ${N} paths; 20000 draws a story (seed 7002); read by reduce-7ab.mjs's rule\n`);
console.log('THE SIZES (see the header)');
for (const [id, v] of Object.entries(rec)) console.log(`  the freed opening against the product, ${id.padEnd(5)} ${v.raw} -> ${v.saved.toFixed(1)}/${v.lost.toFixed(1)} of ${N}, the rest's error ${v.restSe.toFixed(3)} at ${N}`);
for (const k of Object.keys(mar)) console.log(`  7y's product at 0.02, ${k.padEnd(15)} margin ${mar[k]}  fails ${pFail[k]} of ${N}`);
console.log('');

const DRAWS = 20000;
let sd = 7002 >>> 0;
const rnd = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; if (m > 60) { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return Math.max(0, Math.round(m + (u - 6) * Math.sqrt(m))); } const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const gauss = () => { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return u - 6; };
const drawK = (saved, lost, b, both) => { const l = pois(lost + b), s = pois(saved + b); return { a: N - l - s - both, lost: l, saved: s, d: both, N }; };
function tally(name, b, one) {
  const t = {};
  for (let d = 0; d < DRAWS; d++) { const o = one(b); t[o] = (t[o] || 0) + 1; }
  console.log(`  ${name.padEnd(92)} b ${String(b).padEnd(4)} ${Object.keys(t).sort().map(k => `${k} ${(t[k] / DRAWS).toFixed(3)}`).join('  ')}`);
}
const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
const two = [['S126', 'READER'], ['S194', 'OFF']], harms = [['bridge 4', 'READER'], ['S360', 'READER'], ['S360', 'OFF']];
// both fail, FREED against TS+J: the product's failures less the opening's saves (both arms taken to save them)
const bothFJ = id => Math.max(0, Math.round(pFail[`${id}|${id === 'S126' ? 'READER' : 'OFF'}`] - rec[id].saved));
// item 1: FREED against TS+J at W0; TS+J saves `more` paths FREED does not, on S126 alone (`one`) or on both
const item1 = (more, one = false) => b => { const h = bothReads(V.harmFamily(two.map(([id, arm], j) => ({ label: id, k: drawK(0, one && j ? 0 : more, b, bothFJ(id)), margin: mar[`${id}|${arm}`] })))); return h.every(x => x.o === 'no material harm') ? 'HELD' : h.some(x => x.o === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE'; };
// item 2: FREED against TS+J at W0.02 by the whole score; survival as item 1, the rest's true mean `rest`
const item2 = (more, rest) => b => {
  const a = 0.05 / 2, ks = two.map(([id]) => drawK(0, more, b, bothFJ(id))), s = V.harmFamily(two.map(([id, arm], j) => ({ label: id, k: ks[j], margin: mar[`${id}|${arm}`] })));
  const legs = two.map(([id, arm], j) => { const m = mar[`${id}|${arm}`], w = wholeFrom(ks[j], rest + rec[id].restSe * gauss(), rec[id].restSe, a); return lossRead(w, s[j].o, s[j].un.lo, m); });
  return legs.every(x => x === 'no material loss') ? 'HELD' : legs.some(x => x === 'loss') ? 'FALSIFIED' : 'INCONCLUSIVE';
};
// items 3 and 5: FREED against PRODUCT on the harm legs at both weights (six legs, one family: W0 bridge 4, S360 reader,
// S360 off, then W0.02 the same), each leg losing `loss` paths; item 3 reads S360 under off at W0.02 (HELD on harm), item 5
// the four legs of bridge 4 and S360 with the reader (HELD on no material harm on all four)
const item35 = losses => b => {
  const h = bothReads(V.harmFamily(['0', '0.02'].flatMap((w, wi) => harms.map(([id, arm], j) => ({ label: `${id} ${w}`, k: drawK(0, losses[wi * 3 + j], b, pFail[`${id}|${arm}`]), margin: mar[`${id}|${arm}`] })))));
  const o3 = h[5].o === 'harm' ? 'HELD' : h[5].o === 'no material harm' ? 'FALSIFIED' : 'INCONCLUSIVE', f = [h[0], h[1], h[3], h[4]];
  const o5 = f.every(x => x.o === 'no material harm') ? 'HELD' : f.some(x => x.o === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE';
  return `3 ${o3} / 5 ${o5}`;
};
// item 4: FREED against PRODUCT at W0, a gain family of two at the freed opening's sizes times f
const item4 = f => b => tri(V.gainFamily(two.map(([id, arm]) => ({ label: id, k: drawK(f * rec[id].saved, f * rec[id].lost, b, pFail[`${id}|${arm}`]), margin: mar[`${id}|${arm}`] }))), x => x.o === 'gain', x => x.o === 'no material gain');
for (const b of [0.5, 5, 15]) {
  console.log(`BACKGROUND ${b} PATHS EACH WAY ON EVERY LEG`);
  for (const [nm, more, one] of [['FREED as TS+J', 0, false], ['TS+J saving 10 more on both (0.125 points)', 10, false], ['TS+J saving 20 more on both (0.25, the margin)', 20, false], ['TS+J saving 40 more on S126 only (0.5)', 40, true], ['TS+J saving 40 more on both (0.5)', 40, false]]) tally(`item 1 (W0, FREED against TS+J), ${nm}`, b, item1(more, one));
  for (const [nm, more, rest] of [['level', 0, 0], ['TS+J saving 20 more on both (the whole 0.25 below, the margin)', 20, 0], ['TS+J saving 40 more on both', 40, 0], ['survival level, the rest 0.25 below (the margin)', 0, -0.25], ['survival level, the rest 0.1 below', 0, -0.1]]) tally(`item 2 (W0.02, the whole score), ${nm}`, b, item2(more, rest));
  if (b === 15) { console.log(''); continue; }
  for (const [nm, l] of [['the expected: S360 under off loses 480 at W0.02, the rest level', [0, 0, 0, 0, 0, 480]], ['all level', [0, 0, 0, 0, 0, 0]], ['S360 under off loses 80 at W0.02 (1 point, margin 0.5)', [0, 0, 0, 0, 0, 80]], ['the expected, and bridge 4 loses 30 at W0.02 (0.375, margin 0.25)', [0, 0, 0, 30, 0, 480]], ['the expected, and S360 with the reader loses 80 at W0', [0, 80, 0, 0, 0, 480]]]) tally(`items 3 and 5 (against PRODUCT, one family), ${nm}`, b, item35(l));
  for (const [nm, f] of [['FREED as the freed opening at 0.02', 1], ['half of it', 0.5], ['a quarter of it', 0.25], ['FREED doing nothing', 0]]) tally(`item 4 (W0, against PRODUCT; the 0.02 sizes assumed), ${nm}`, b, item4(f));
  console.log('');
}
