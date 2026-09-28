/*
 * 7AA'S POWER (predictions/diag-7aa.md, Power; its output hashed in the prediction and re-run by the launcher). Items 1, 2, 3,
 * 5 and 6 read paired paths (TS+J against PRODUCT or TS at one estate weight, 8,000 paths of seed 7002); item 4 reads the
 * whole score within the survival limit. Each story fixes the true saved and lost counts, draws them as Poisson counts with a
 * background of b paths each way (b = 0.5 and 5), and for item 4 draws the rest of the whole score (estate, cuts and raises)
 * as a normal mean at its recorded standard error, 20,000 draws a story, read by reduce-7aa.mjs's own rule (reduce-7v.mjs's
 * gain and harm families, Holm over each item's legs; the whole-score interval by reduce-7aa.mjs wholeFrom itself: the
 * survival part unconditional and guarded, the survival limit by the unconditional lower end; item 5 on the paths the
 * product survives at the pooled margin 0.1 - the plan-auditor on the 7aa registration, 28 Sep, BLOCKINGs 1 and 2).
 * THE SIZES, from the records (grade C: TS+J is expected to act as the freed opening does, not measured - O41's tables-only
 * measurement shows it opening in pair 2 at the product's margin on S126 and S194, results-o41.txt):
 *   - the freed opening against the product at 0.001 on 7w's 3,000 paths (7aa's first 3,000), S126 with the reader and S194
 *     under off, scaled to 8,000: its survival cells and the rest of its whole score (mean and standard error, the error
 *     scaled by the square root of 3,000/8,000), through reduce-7w.mjs's gates;
 *   - TS against PRODUCT at 0.02 on S126, S194 and bridge 4 (results/diag7y, through reduce-7y.mjs's gates): the tier state's
 *     own losses (paths the product survives and TS fails), which TS+J removes if O42 is the per-world rule, for item 5; the
 *     product's failures there fix item 5's path count (the product's survivors). The opening's saves fall on paths the
 *     product fails (a save against the product is one), so no item-5 story carries them; that TS+J's opening does not
 *     itself rescue TS's losses is a premise (grade D), stated in the prediction.
 *   - the weight 0: no record at all (every run so far is at 0.02, O43); items 1 to 3 are drawn at the 0.02 sizes, a declared
 *     assumption (grade D).
 *   node research/solver/derive-7aa.mjs > research/solver/results-derive-7aa.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { marginFor, MARGINS } from './stats.mjs';
import * as V from './reduce-7v.mjs';
import * as W from './reduce-7w.mjs';
import * as Y from './reduce-7y.mjs';
import { N, wholeLeg, wholeFrom } from './reduce-7aa.mjs';

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
  rec[id] = { saved: w.k.saved * f, lost: w.k.lost * f, both: Math.round(w.k.d * f), rest: w.rest, restSe: w.restSe * Math.sqrt(W.N / N), raw: `${w.k.saved}/${w.k.lost} of ${W.N} (${w.k.d} failing in both), the rest ${w.rest.toFixed(3)} +/- ${w.restSe.toFixed(3)}` };
}
// 7y: TS against PRODUCT at 0.02 (the tier state's own losses) on S126, S194 and bridge 4
const g7y = gated('diag7y', Y);
const s7y = (id, arm, l) => { const u = g7y.units.find(x => x.id === id && x.arm === arm && x.runs[l]); const j = JSON.parse(gunzipSync(readFileSync(join(g7y.D, Y.traceName(id, arm, l)))).toString()); if (!Y.traceAgrees(j, g7y.ST, arm, l, u.runs[l].sim)) { console.log(`7y: the trace ${id} ${l} is not the log's`); process.exit(1); } return decode(j).survived; };
const tsLoss = {}, mar = {}, pFail = {};
for (const [id, arm] of [['S126', 'READER'], ['S194', 'OFF'], ['bridge 4', 'READER'], ['S360', 'READER'], ['S360', 'OFF']]) {
  const P = s7y(id, arm, 'PRODUCT'), k = V.cells(P, s7y(id, arm, 'TS'));
  tsLoss[`${id}|${arm}`] = k; mar[`${id}|${arm}`] = marginFor(V.survivedShare(P)); pFail[`${id}|${arm}`] = P.length - P.reduce((t, x) => t + x, 0);
}
console.log(`7AA'S POWER: ${N} paths; 20000 draws a story (seed 7002); read by reduce-7aa.mjs's rule\n`);
console.log('THE SIZES (grade C; see the header)');
for (const [id, v] of Object.entries(rec)) console.log(`  the freed opening against the product, ${id.padEnd(5)} ${v.raw} -> ${v.saved.toFixed(1)}/${v.lost.toFixed(1)} of ${N}, the rest's error ${v.restSe.toFixed(3)} at ${N}`);
for (const [k, v] of Object.entries(tsLoss)) console.log(`  7y TS against PRODUCT, ${k.padEnd(15)} ${v.saved}/${v.lost}  margin ${mar[k]}  the product fails ${pFail[k]}`);
console.log('');

const DRAWS = 20000;
let sd = 7002 >>> 0;
const rnd = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; if (m > 60) { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return Math.max(0, Math.round(m + (u - 6) * Math.sqrt(m))); } const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const gauss = () => { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return u - 6; };
const drawK = (saved, lost, b, n = N, both = 200) => { const l = pois(lost + b), s = pois(saved + b); return { a: n - l - s - both, lost: l, saved: s, d: both, N: n }; };
function tally(name, b, one) {
  const t = {};
  for (let d = 0; d < DRAWS; d++) { const o = one(b); t[o] = (t[o] || 0) + 1; }
  console.log(`  ${name.padEnd(86)} b ${String(b).padEnd(4)} ${Object.keys(t).sort().map(k => `${k} ${(t[k] / DRAWS).toFixed(3)}`).join('  ')}`);
}
const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
const two = [['S126', 'READER'], ['S194', 'OFF']], harms = [['bridge 4', 'READER'], ['S360', 'READER'], ['S360', 'OFF']];
// items 1 and 2: a gain family of two at the freed opening's sizes times f
const gain2 = f => b => tri(V.gainFamily(two.map(([id, arm]) => ({ label: id, k: drawK(f * rec[id].saved, f * rec[id].lost, b), margin: mar[`${id}|${arm}`] }))), x => x.o === 'gain', x => x.o === 'no material gain');
// items 3 and 6: a harm family of three, each leg losing `loss` paths
const harm3 = losses => b => { const h = V.harmFamily(harms.map(([id, arm], j) => ({ label: id, k: drawK(0, losses[j], b), margin: mar[`${id}|${arm}`] }))); return h.every(x => x.o === 'no material harm') ? 'HELD' : h.some(x => x.o === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE'; };
// item 4: the whole-score rule within the survival limit, Bonferroni over the two legs; `at` puts the true whole change
// exactly at the margin (the survival part the margin less the rest): the calibration's story
const item4 = (f, fr, at = false) => b => {
  const a = 0.05 / 2, ks = two.map(([id, arm]) => (at ? drawK((mar[`${id}|${arm}`] - rec[id].rest) * N / 100, 0, b, N, rec[id].both) : drawK(f * rec[id].saved, f * rec[id].lost, b, N, rec[id].both)));
  const s = V.harmFamily(two.map(([id, arm], j) => ({ label: id, k: ks[j], margin: mar[`${id}|${arm}`] })));
  const legs = two.map(([id, arm], j) => {
    const m = mar[`${id}|${arm}`], w = wholeFrom(ks[j], (at ? 1 : fr) * rec[id].rest + rec[id].restSe * gauss(), rec[id].restSe, a);
    const surv = s[j].o === 'harm' ? 'harm' : s[j].un.lo > -m ? 'no material harm' : 'inconclusive';
    return surv === 'harm' ? 'harm' : w.lo > 0 && surv === 'no material harm' ? 'gain' : w.hi < m ? 'no material gain' : 'inconclusive';
  });
  return tri(legs, x => x === 'gain', x => x === 'no material gain' || x === 'harm');
};
// item 5: pooled over S126, S194 and bridge 4 on the paths the product survives, TS+J against TS at the pooled margin 0.1:
// TS+J removes the share g of TS's own losses and loses `own` paths of its own (spread evenly over the three)
const item5 = (g, own) => b => {
  const ks = [['S126', 'READER'], ['S194', 'OFF'], ['bridge 4', 'READER']].map(([id, arm]) => { const t = tsLoss[`${id}|${arm}`], kept = Math.round((1 - g) * t.lost); return drawK(g * t.lost, own / 3, b, N - pFail[`${id}|${arm}`], kept); });
  const kp = ks.reduce((t, k) => ({ a: t.a + k.a, lost: t.lost + k.lost, saved: t.saved + k.saved, d: t.d + k.d, N: t.N + k.N }), { a: 0, lost: 0, saved: 0, d: 0, N: 0 });
  const x = V.gainFamily([{ label: 'pooled', k: kp, margin: MARGINS.pooled }])[0];
  return x.o === 'gain' ? 'HELD' : x.o === 'no material gain' ? 'FALSIFIED' : 'INCONCLUSIVE';
};
for (const b of [0.5, 5]) {
  console.log(`BACKGROUND ${b} PATHS EACH WAY ON EVERY LEG`);
  for (const [nm, f] of [['TS+J as the freed opening', 1], ['half of it', 0.5], ['a quarter of it', 0.25], ['TS+J doing nothing', 0]]) tally(`items 1 and 2 (W0; the 0.02 sizes assumed), ${nm}`, b, gain2(f));
  for (const [nm, l] of [['all level', [0, 0, 0]], ['bridge 4 loses 30 paths (0.375 points)', [30, 0, 0]], ['S360 with the reader loses 80 (1 point)', [0, 80, 0]], ['S360 under off loses 80', [0, 0, 80]]]) tally(`items 3 and 6, ${nm}`, b, harm3(l));
  for (const [nm, f, fr] of [['TS+J as the freed opening, survival and the rest', 1, 1], ['its survival only, the rest level', 1, 0], ['half of both', 0.5, 0.5], ['TS+J doing nothing', 0, 0]]) tally(`item 4 (W0.02), ${nm}`, b, item4(f, fr));
  tally('item 4 (W0.02), the calibration: the true whole change exactly at the margin on both legs', b, item4(0, 0, true));
  for (const [nm, g, own] of [['removing TS\'s losses', 1, 0], ['removing half of them', 0.5, 0], ['keeping them (TS+J as TS, or as the freed opening only)', 0, 0], ['keeping them and losing 10 of its own', 0, 10]]) tally(`item 5 (W0.02, the product's survivors, against TS), ${nm}`, b, item5(g, own));
  console.log('');
}
