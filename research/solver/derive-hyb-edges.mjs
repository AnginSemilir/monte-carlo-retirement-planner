/*
 * THE SNAP'S TWO EDGES OVER HYB'S GATED TRACES (the deep review after HYB, deep-review-log.md 5 Oct 11:50 UK: HYB does not end
 * the hold, it moves it to the snapped read's other edge; the measures it read by scratch, committed here so the plan can
 * cite them). reduce-hyb.mjs's gate (the fair-gate stamp check, the units, the traces' stamps and sums) runs first (rule 3);
 * the identity against ADOPT-PI's files is results-hyb.txt's. Per household and arm:
 *   1. flat years with the pension live: years with the pension pot above 10,000 and the used share of the allowance u growing
 *      by under 0.01 to the next year, by u's band - [0.15, 0.25) (the snap's 0.25 edge, the bucket at 0), [0.25, 0.6) and
 *      [0.6, 0.75) (the 0.75 edge, DP's band) - a path's mean;
 *   2. zero-tax years with a live pension in years 2 to 19 (tax paid under 100, the pension pot above 10,000), a path's mean,
 *      with the lifetime tax (thousands a path) and the survivors;
 *   3. the first year any state differs (u by over 1e-4, either pot by over 1, the spend level or the tier) per arm pair,
 *      over the discordant paths and over all paths, with u's band in the first arm the year before (the decision year) -
 *      reduce-hyb.mjs's divergence() compares level and tier only, so it reads the year a pot runs out, not the decision.
 *   node research/solver/derive-hyb-edges.mjs > research/solver/results-derive-hyb-edges.txt
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { parse, gate, loadTraces, PRED, UNIT_KEYS } from './reduce-hyb.mjs';
import { stampOf } from './reduce-adoptpi.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diaghyb');
const buf = s => { const x = Buffer.from(s, 'base64'); return x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength); };
export function full(raw) {
  const o = { N: raw.N, Y: raw.Y };
  for (const k of ['survived', 'level', 'tier']) o[k] = new Uint8Array(buf(raw[k]));
  for (const k of ['tax', 'u', 'pen', 'non', 'taxPaid']) { if (!raw[k]) throw new Error(`the trace has no ${k}`); o[k] = new Float32Array(buf(raw[k])); }
  return o;
}
export const BANDS = [['[0.15, 0.25)', 0.15, 0.25], ['[0.25, 0.6)', 0.25, 0.6], ['[0.6, 0.75)', 0.6, 0.75]];
export function flatYears(T) {
  const n = BANDS.map(() => 0);
  for (let j = 0; j < T.N; j++) for (let k = 0; k + 1 < T.Y; k++) {
    const o = j * T.Y + k, x = T.u[o];
    if (!(T.pen[o] > 1e4) || !(T.u[o + 1] - x < 0.01)) continue;
    BANDS.forEach(([, lo, hi], b) => { if (x >= lo && x < hi) n[b]++; });
  }
  return n.map(v => v / T.N);
}
export function zeroTax(T) {
  let z = 0, tx = 0, s = 0;
  for (let j = 0; j < T.N; j++) { tx += T.tax[j]; s += T.survived[j]; for (let k = 2; k < Math.min(20, T.Y); k++) { const o = j * T.Y + k; if (T.taxPaid[o] < 100 && T.pen[o] > 1e4) z++; } }
  return { zero: z / T.N, tax: tx / T.N / 1e3, surv: s };
}
const bandOf = u => (u < 0.15 ? 'u<0.15' : u < 0.25 ? '[0.15,0.25)' : u < 0.6 ? '[0.25,0.6)' : u < 0.75 ? '[0.6,0.75)' : 'u>=0.75');
export function firstState(A, C) {
  const disc = new Map(), all = new Map(), at = new Map(); let n = 0;
  for (let j = 0; j < A.N; j++) {
    let t = -1;
    for (let k = 0; k < A.Y; k++) { const o = j * A.Y + k; if (Math.abs(A.u[o] - C.u[o]) > 1e-4 || Math.abs(A.pen[o] - C.pen[o]) > 1 || Math.abs(A.non[o] - C.non[o]) > 1 || A.level[o] !== C.level[o] || A.tier[o] !== C.tier[o]) { t = k; break; } }
    all.set(t, (all.get(t) || 0) + 1);
    if (A.survived[j] === C.survived[j]) continue;
    n++; disc.set(t, (disc.get(t) || 0) + 1);
    const b = bandOf(A.u[j * A.Y + Math.max(0, t - 1)]); at.set(b, (at.get(b) || 0) + 1);
  }
  return { n, disc, all, at };
}

// PLANTED (rule 6): two built paths, three years
{
  const mk = o => ({ N: 2, Y: 3, ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, ['survived', 'level', 'tier'].includes(k) ? Uint8Array.from(v) : Float32Array.from(v)])) });
  // path 0 sits flat at u 0.2 with a pension for years 0-1, pays no tax in year 2; path 1 has no pension
  const A = mk({ u: [0.2, 0.2, 0.2, 0.1, 0.5, 0.9], pen: [5e4, 5e4, 5e4, 0, 0, 0], non: [1, 1, 1, 1, 1, 1], level: [1, 1, 1, 1, 1, 1], tier: [0, 0, 0, 0, 0, 0], taxPaid: [0, 0, 0, 0, 0, 0], tax: [1000, 3000], survived: [0, 1] });
  const C = mk({ u: [0.2, 0.4, 0.6, 0.1, 0.5, 0.9], pen: [5e4, 4e4, 3e4, 0, 0, 0], non: [1, 1, 1, 1, 1, 1], level: [1, 1, 1, 1, 1, 1], tier: [0, 0, 0, 0, 0, 0], taxPaid: [0, 500, 500, 0, 0, 0], tax: [2000, 3000], survived: [1, 1] });
  const f = flatYears(A), z = zeroTax(A), d = firstState(A, C);
  const ok = f[0] === 1 && f[1] === 0 && f[2] === 0 && z.zero === 0.5 && z.tax === 2 && z.surv === 1 && d.n === 1 && d.disc.get(1) === 1 && d.all.get(-1) === 1 && d.at.get('[0.15,0.25)') === 1;
  if (!ok) { console.log(`PLANTED CHECK FAILED: ${JSON.stringify({ f, z, d: { n: d.n, disc: [...d.disc], all: [...d.all], at: [...d.at] } })}`); process.exit(1); }
}

const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
const units = Object.values(logs).flatMap(parse);
if (units.filter(x => x.done).length < UNIT_KEYS.length) { console.log(`INCOMPLETE - ${units.filter(x => x.done).length} of ${UNIT_KEYS.length} units`); process.exit(1); }
requireFairLogs(logs, PRED);
const bad = gate(units);
const tr = bad.length ? { bad: [] } : loadTraces(units, DIR, stampOf(Object.values(logs)[0]));
if (bad.length || tr.bad.length) { console.log(`GATE: FAILED\n  ${[...bad, ...tr.bad].join('\n  ')}`); process.exit(1); }
const F = {};
for (const id of ['S130', 'S128', 'S370']) for (const a of ['snap', 'hyb', 'pclsi']) F[`${id} ${a}`] = full(JSON.parse(gunzipSync(readFileSync(join(DIR, `${id}-${a}.json.gz`))).toString()));
console.log('GATE: passed (reduce-hyb.mjs\'s gate and the fair-gate stamp check over results/diaghyb; the identity against ADOPT-PI\'s files is results-hyb.txt\'s); planted: passed\n');
console.log('1. FLAT YEARS WITH THE PENSION LIVE (pension pot over 10,000, u growing under 0.01), a path\'s mean, by u\'s band: SNAP / HYB / PCLSI');
for (const id of ['S130', 'S128', 'S370']) { const r = ['snap', 'hyb', 'pclsi'].map(a => flatYears(F[`${id} ${a}`])); console.log(`  ${id.padEnd(5)} ${BANDS.map(([nm], b) => `${nm} ${r.map(x => x[b].toFixed(2)).join(' / ')}`).join('   ')}`); }
console.log('\n2. ZERO-TAX YEARS WITH A LIVE PENSION, years 2 to 19 (a path\'s mean); lifetime tax (thousands a path); survivors of the paths: SNAP / HYB / PCLSI');
for (const id of ['S130', 'S128', 'S370']) { const r = ['snap', 'hyb', 'pclsi'].map(a => zeroTax(F[`${id} ${a}`])); console.log(`  ${id.padEnd(5)} zero-tax years ${r.map(x => x.zero.toFixed(2)).join(' / ')}   tax ${r.map(x => x.tax.toFixed(0)).join(' / ')}   survivors ${r.map(x => x.surv).join(' / ')}`); }
console.log('\n3. THE FIRST YEAR ANY STATE DIFFERS (u, either pot, level, tier): over the discordant paths (year:paths), u\'s band in the first arm the year before, and over all paths');
const s = m => [...m.entries()].sort((x, y) => (typeof x[0] === 'number' ? x[0] - y[0] : String(x[0]).localeCompare(String(y[0])))).map(([k, v]) => `${k}:${v}`).join(' ');
for (const id of ['S130', 'S128', 'S370']) for (const [a, c] of [['hyb', 'pclsi'], ['snap', 'hyb'], ['snap', 'pclsi']]) {
  const r = firstState(F[`${id} ${a}`], F[`${id} ${c}`]);
  console.log(`  ${id.padEnd(5)} ${c.toUpperCase()} against ${a.toUpperCase()}: discordant ${r.n}, first year ${s(r.disc)}\n        u band the year before: ${s(r.at)}\n        all paths, first year (-1 none): ${s(r.all)}`);
}
