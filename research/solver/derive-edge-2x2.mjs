/*
 * THE TABLES-BY-READ 2x2 OVER EDGE-SPLIT'S GATED FILES (the deep review after EDGE-SPLIT, deep-review-log.md 5 Oct 16:36 UK,
 * flag 2; a re-use of a test's files for a new question, so their gate runs first: CHECKLIST item 3). SNAP (snapped tables,
 * snapped read), HYB (PCLSI's tables, snapped read), S-INT (SNAP's tables, interpolated read) and PCLSI (both) on the same
 * paths: each household's survivors, each part alone over SNAP, both together, and the per-path interaction
 * PCLSI - HYB - S-INT + SNAP with its two-sided sign-flip p (reduce-7ar.mjs flipP). Unregistered and read after the fact:
 * grade C, deciding nothing. Also each arm's zero-tax years with the pension live in the 18 years from access, and its mean
 * lifetime tax, so the order of the arms can be read against survival.
 *   node research/solver/derive-edge-2x2.mjs > research/solver/results-derive-edge-2x2.txt
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, loadTraces, identity, hybFiles, stampOf, PANEL, ARMS, UNIT_KEYS, PRED } from './reduce-edge.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { flipP } from './reduce-7ar.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diagedge');
const logs = Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
const units = Object.values(logs).flatMap(parse);
requireFairLogs(logs, PRED);
const bad = gate(units);
const tr = bad.length ? { bad: [], files: {} } : loadTraces(units, DIR, stampOf(Object.values(logs)[0]));
bad.push(...tr.bad);
const hy = hybFiles(); bad.push(...hy.bad);
if (!bad.length) bad.push(...identity(tr.files, hy.files));
if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
for (const id of PANEL) tr.files[`${id} HYB`] = hy.files[`${id} HYB`];
console.log(`GATE: passed - EDGE-SPLIT's ${UNIT_KEYS.length} units through reduce-edge.mjs's gate and THE IDENTITY against HYB's files (HYB's HYB arm joins)`);

const buf = s => { const x = Buffer.from(s, 'base64'); return x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength); };
const arr = (T, k) => { const v = T.raw && T.raw[k] !== undefined ? T.raw[k] : T[k]; return typeof v === 'string' ? new Float32Array(buf(v)) : v; };
// zero-tax years with the pension live (over 10,000) in the 18 years from access, a path's mean
const accessOf = id => { const u = units.find(x => x.id === id && /year \d+/.test(x.access || '')); return u ? Number(/year (\d+)/.exec(u.access)[1]) : null; };
function zeroTax(T, id) {
  const pen = arr(T, 'pen'), tp = arr(T, 'taxPaid'), a = accessOf(id);
  if (!(pen instanceof Float32Array) || !(tp instanceof Float32Array) || a === null) return NaN;
  let n = 0;
  for (let j = 0; j < T.N; j++) for (let k = a; k < Math.min(T.Y, a + 18); k++) { const o = j * T.Y + k; if (pen[o] > 1e4 && tp[o] <= 0) n++; }
  return n / T.N;
}
const surv = T => T.survived.reduce((s, x) => s + x, 0), meanTax = T => T.tax.reduce((s, x) => s + x, 0) / T.N;
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '-');
console.log('\nTHE 2x2 (survivors of the paths; each part alone over SNAP; the per-path interaction PCLSI - HYB - S-INT + SNAP, two-sided sign-flip p)');
for (const id of PANEL) {
  const F = a => tr.files[`${id} ${a}`], S = F('SNAP'), H = F('HYB'), I = F('S-INT'), P = F('PCLSI'), N = S.N;
  const y = Array.from({ length: N }, (_, j) => P.survived[j] - H.survived[j] - I.survived[j] + S.survived[j]);
  const sum = y.reduce((s, x) => s + x, 0), pU = flipP(y), pD = flipP(y.map(x => -x)), p2 = Math.min(1, 2 * Math.min(pU, pD));
  console.log(`  ${id.padEnd(5)} SNAP ${surv(S)} HYB ${surv(H)} S-INT ${surv(I)} PCLSI ${surv(P)} of ${N} | tables alone (HYB less SNAP) ${surv(H) - surv(S)} | read alone (S-INT less SNAP) ${surv(I) - surv(S)} | both (PCLSI less SNAP) ${surv(P) - surv(S)} | interaction ${sum > 0 ? '+' : ''}${sum} paths, p ${p2.toExponential(1)}`);
}
console.log('\nEVERY ARM IN ORDER OF SURVIVAL (survivors, zero-tax years with the pension live in the 18 years from access, mean lifetime tax)');
for (const id of PANEL) {
  const rows = [...ARMS, 'HYB'].map(a => { const T = tr.files[`${id} ${a}`]; return { a, s: surv(T), z: zeroTax(T, id), t: meanTax(T) }; }).sort((x, y) => y.s - x.s);
  console.log(`  ${id}: ${rows.map(r => `${r.a} ${r.s} / ${f(r.z)} / ${f(r.t / 1000, 0)}k`).join('; ')}`);
}
