/*
 * 7AC'S POWER (predictions/diag-7ac.md, Power; its output hashed in the prediction and re-run by the launcher). Item 1 reads
 * OPEN0 against TS+J at W0 by survival (reduce-7v.mjs harmFamily; no material harm read by both intervals, reduce-7ab.mjs
 * bothReads); item 2 reads the whole score at W0.02 for a loss (reduce-7ab.mjs lossRead on reduce-7aa.mjs wholeFrom); item 3
 * is a pooled gain against TS on the paths the product survives (reduce-7aa.mjs cellsWhere, the pooled margin 0.1). Each
 * story fixes the true saved and lost counts, draws them as Poisson counts with a background of b paths each way (b = 0.5, 5
 * and 15: two policies from the same tables differing in one move may still differ on a few paths either way), and for item
 * 2 draws the rest of the whole score as a normal mean at its recorded standard error; 20,000 draws a story, read by
 * reduce-7ac.mjs's rule.
 * THE SIZES, from 7aa's traces through reduce-7aa.mjs's gates (results/diag7aa):
 *   - TS+J against PRODUCT on the four units (S126 reader and bridge 4 reader at W0, S126 reader and S194 off at W0.02):
 *     its saved and lost paths, and at W0.02 the rest of its whole score and that rest's standard error;
 *   - each unit's margin (marginFor() of PRODUCT's survival) and PRODUCT's failures (the background of paths failing in both);
 *   - at W0.02 on S126 and S194, on the paths PRODUCT survives: TS's losses there, and TS+J's saved and lost against TS.
 * THE STORIES: cause 1 (the opening carries TS+J's gain; OPEN0 as the product: OPEN0 against TS+J the reverse of TS+J against
 * PRODUCT, times f = 1, 0.5 or 0.25); cause 2 (the continuation carries it; OPEN0 as TS+J, f = 0); for item 3, OPEN0 as the
 * product on the product's survivors (it saves TS's losses there), as TS+J (TS+J's cells against TS), or as TS (nothing).
 *   node research/solver/derive-7ac.mjs > research/solver/results-derive-7ac.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { marginFor, MARGINS } from './stats.mjs';
import * as V from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';
import { bothReads, lossRead } from './reduce-7ab.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const N = A.N;
const D = join(HERE, 'results', 'diag7aa');
const logs = Object.fromEntries(readdirSync(D).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D, f), 'utf8')]));
requireFairLogs(logs, A.PRED);
const units = Object.values(logs).flatMap(A.parse), bad = A.gate(units);
if (bad.length) { console.log(`FAIR-TEST GATE (7aa): FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
const ST = { code: st[1], audit: st[2], prediction: st[3], sha: st[4] };
const T = (id, arm, tag, w) => {
  const l = A.label(tag, w), u = units.find(x => x.id === id && x.arm === arm && x.label === l);
  const j = JSON.parse(gunzipSync(readFileSync(join(D, A.traceName(id, arm, l)))).toString());
  if (!A.traceAgrees(j, ST, arm, l, u.run.sim)) { console.log(`7aa: the trace ${id} ${l} is not the log's`); process.exit(1); }
  return { X: decode(j), u };
};
const cfgOf = (P, w) => {
  const cfg = { lambda: Number(A.field(P.u.ran, 'lambda')), floor: Math.min(...A.field(P.u.ran, 'levels').split(',').map(Number)), scale: P.u.joint.scale, cap: P.u.joint.cap, wb: Number(w) };
  cfg.spendYears = Array.from({ length: P.X.Y }, (_, t) => { for (let i = 0; i < P.X.N; i++) if (P.X.level[i * P.X.Y + t] > 0) return true; return false; });
  return cfg;
};
const U = [['S126', 'READER', '0'], ['bridge 4', 'READER', '0'], ['S126', 'READER', '0.02'], ['S194', 'OFF', '0.02']];
const rec = {};
for (const [id, arm, w] of U) {
  const P = T(id, arm, 'PRODUCT', w), J = T(id, arm, 'TS+J', w), k = V.cells(P.X.survived, J.X.survived);
  const r = { saved: k.saved, lost: k.lost, margin: marginFor(V.survivedShare(P.X.survived)), pFail: N - P.X.survived.reduce((t, x) => t + x, 0) };
  if (w === '0.02') {
    const wl = A.wholeLeg(P.X, J.X, cfgOf(P, w), 0.05), TS = T(id, arm, 'TS', w);
    Object.assign(r, { rest: wl.rest, restSe: wl.restSe, tsOnSurv: A.cellsWhere(P.X.survived, P.X.survived, TS.X.survived), jOnSurv: A.cellsWhere(P.X.survived, TS.X.survived, J.X.survived) });
  }
  rec[`${id}|${w}`] = r;
}
console.log(`7AC'S POWER: ${N} paths; 20000 draws a story (seed 7002); read by reduce-7ac.mjs's rule\n`);
console.log('THE SIZES (7aa, through reduce-7aa.mjs\'s gates)');
for (const [id, arm, w] of U) {
  const r = rec[`${id}|${w}`];
  console.log(`  ${`${id} (${arm.toLowerCase()}) W${w}`.padEnd(22)} TS+J against PRODUCT ${r.saved}/${r.lost}; margin ${r.margin}; PRODUCT fails ${r.pFail}${r.rest !== undefined ? `; the rest ${r.rest.toFixed(3)} +/- ${r.restSe.toFixed(3)}; on PRODUCT's survivors (${r.tsOnSurv.N}) TS loses ${r.tsOnSurv.lost}, TS+J against TS ${r.jOnSurv.saved}/${r.jOnSurv.lost}` : ''}`);
}
console.log('');

const DRAWS = 20000;
let sd = 7002 >>> 0;
const rnd = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = m => { if (m <= 0) return 0; if (m > 60) { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return Math.max(0, Math.round(m + (u - 6) * Math.sqrt(m))); } const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const gauss = () => { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return u - 6; };
const drawK = (saved, lost, b, both, n = N) => { const l = pois(lost + b), s = pois(saved + b); return { a: n - l - s - both, lost: l, saved: s, d: both, N: n }; };
function tally(name, b, one) {
  const t = {};
  for (let d = 0; d < DRAWS; d++) { const o = one(b); t[o] = (t[o] || 0) + 1; }
  console.log(`  ${name.padEnd(96)} b ${String(b).padEnd(4)} ${Object.keys(t).sort().map(k => `${k} ${(t[k] / DRAWS).toFixed(3)}`).join('  ')}`);
}
const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
// OPEN0 against TS+J: cause 1 at share f is the reverse of TS+J against PRODUCT, times f (both failing: PRODUCT's failures
// less TS+J's saves)
const legK = (r, f, b) => drawK(f * r.lost, f * r.saved, b, Math.max(0, r.pFail - r.saved));
// item 1: W0, S126 and bridge 4; f1 on S126, f2 on bridge 4
const item1 = (f1, f2) => b => { const h = bothReads(V.harmFamily([['S126|0', f1], ['bridge 4|0', f2]].map(([key, f]) => ({ label: key, k: legK(rec[key], f, b), margin: rec[key].margin })))); return tri(h, x => x.o === 'harm', x => x.o === 'no material harm'); };
// item 2: W0.02, S126 and S194; the rest of OPEN0 against TS+J is minus f times TS+J's against PRODUCT
const item2 = f => b => {
  const a = 0.05 / 2, keys = ['S126|0.02', 'S194|0.02'], ks = keys.map(key => legK(rec[key], f, b));
  const s = V.harmFamily(keys.map((key, j) => ({ label: key, k: ks[j], margin: rec[key].margin })));
  const legs = keys.map((key, j) => { const r = rec[key], w = A.wholeFrom(ks[j], -f * r.rest + r.restSe * gauss(), r.restSe, a); return lossRead(w, s[j].o, s[j].un.lo, r.margin); });
  return tri(legs, x => x === 'loss', x => x === 'no material loss');
};
// item 3: pooled on PRODUCT's survivors, OPEN0 against TS: as the product (saves TS's losses), as TS+J (TS+J's cells), as TS
const item3 = mode => b => {
  const keys = ['S126|0.02', 'S194|0.02'];
  const ks = keys.map(key => { const r = rec[key], n = r.tsOnSurv.N; return mode === 'product' ? drawK(r.tsOnSurv.lost, 0, b, 0, n) : mode === 'tsj' ? drawK(r.jOnSurv.saved, r.jOnSurv.lost, b, 0, n) : drawK(0, 0, b, 0, n); });
  const kp = ks.reduce((s, k) => ({ a: s.a + k.a, lost: s.lost + k.lost, saved: s.saved + k.saved, d: s.d + k.d, N: s.N + k.N }), { a: 0, lost: 0, saved: 0, d: 0, N: 0 });
  const o = V.gainFamily([{ label: 'pooled', k: kp, margin: MARGINS.pooled }])[0].o;
  return o === 'gain' ? 'HELD' : o === 'no material gain' ? 'FALSIFIED' : 'INCONCLUSIVE';
};
for (const b of [0.5, 5, 15]) {
  console.log(`BACKGROUND ${b} PATHS EACH WAY ON EVERY LEG`);
  for (const [nm, f1, f2] of [['cause 1: OPEN0 as the product (f 1)', 1, 1], ['half of TS+J\'s gain lost (f 0.5)', 0.5, 0.5], ['a quarter lost (f 0.25)', 0.25, 0.25], ['cause 2: OPEN0 as TS+J (f 0)', 0, 0], ['cause 1 on S126 only', 1, 0]]) tally(`item 1 (W0, OPEN0 against TS+J), ${nm}`, b, item1(f1, f2));
  for (const [nm, f] of [['cause 1: OPEN0 as the product (f 1)', 1], ['half (f 0.5)', 0.5], ['a quarter (f 0.25)', 0.25], ['cause 2: OPEN0 as TS+J (f 0)', 0]]) tally(`item 2 (W0.02, the whole score), ${nm}`, b, item2(f));
  for (const [nm, mode] of [['OPEN0 as the product on its survivors (saves TS\'s losses)', 'product'], ['OPEN0 as TS+J (TS+J\'s cells against TS)', 'tsj'], ['OPEN0 as TS (the opening carried 7aa\'s item 5)', 'ts']]) tally(`item 3 (W0.02, pooled against TS on PRODUCT's survivors), ${nm}`, b, item3(mode));
  console.log('');
}
