/*
 * THE DEEP REVIEW AFTER XAS, ITS FIGURES FROM COMMITTED CODE (deep-review-log.md 5 Oct 18:48 UK; its scratch reads re-derived
 * here so the plan cites a script's output, CHECKLIST item 4). A re-use of XAS's gated files for new questions, so XAS's own
 * gate, its identity against COV-B-STEP's reads and its draw check run first (CHECKLIST item 3). Unregistered and read after
 * the fact: grade C, deciding nothing.
 *   1. PASS-THROUGH: on S370 and bridge 4, the slope of COV's change in the read on its change in the 5-point one-step value
 *      (ex5) at the same states, by year and straddle - how much of the step-year correction each year's read passes back.
 *   2. THE STRADDLE, BY WORLD: S370's year-before reads (years 2 and 6), rep by world for straddling and other reads.
 *   3. COV'S MOVES: S370's year-before rep under COV split by whether COV's chooser kept BASE's move (COV-B-STEP's `same`).
 *   4. THE BRIDGE TOTAL: S370's mean D (read less claim) summed over years 1-3 and 4-7, per arm; year 1's rep (O81).
 *   5. S126'S OPENING: both arms' mixture scores of both opening moves and the swap (results/diagxas/case3.txt).
 *   6. S126 UNDER COV: the opening scores' rise against the change in the survival reads, by year.
 *   node research/solver/derive-xas-review.mjs > research/solver/results-derive-xas-review.txt
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { parse, gate, checkFile, drawCheck, covbFiles, logsOf, stampOf, PRED, UNITS } from './reduce-xas.mjs';
import { requireFairLogs } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diagxas');
const fileOf = id => `${id.replace(/\s+/g, '_')}.json.gz`;
const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
requireFairLogs(logs, PRED);
const bad = gate(units), files = {};
const C = bad.length ? null : covbFiles();
if (C && C.bad.length) bad.push(...C.bad.map(x => `COV-B-STEP's own gate: ${x}`));
if (!bad.length) {
  const st = stampOf(Object.values(logs)[0]);
  for (const u of units) { const f = join(DIR, fileOf(u.id)), t = existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; bad.push(...checkFile(t, u, st, C.files[u.id])); files[u.id] = t; }
  if (!bad.length) bad.push(...drawCheck(files));
}
if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log(`GATE: passed - XAS's ${UNITS.length} households through reduce-xas.mjs's gate, the identity against COV-B-STEP's reads and the draw check`);

const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const e = x => (Number.isFinite(x) ? x.toExponential(2) : '-');
const idx = (t, f) => t.t.map((_, j) => j).filter(f);
function slope(t, J) {
  const B = t.arms.BASE, V = t.arms.COV, x = J.map(j => V.ex5[j] - B.ex5[j]), y = J.map(j => V.read[j] - B.read[j]), mx = mean(x), my = mean(y);
  let sxy = 0, sxx = 0; for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; }
  return { n: J.length, dx: mx, dy: my, b: sxx > 0 ? sxy / sxx : NaN };
}
console.log('\n1. PASS-THROUGH (COV less BASE: the read on ex5 at the same states; slope 1 passes the whole correction back)');
for (const [id, years] of [['S370', [1, 2, 4, 5, 6]], ['bridge 4', [1, 2]]]) {
  const t = files[id];
  for (const yr of years) for (const s of [0, 1]) {
    const J = idx(t, j => t.t[j] === yr && t.strad[j] === s); if (J.length < 2) continue;
    const r = slope(t, J);
    console.log(`  ${id.padEnd(8)} year ${yr} ${s ? 'straddling' : 'other     '} reads ${String(r.n).padStart(5)}: slope ${Number.isFinite(r.b) ? r.b.toFixed(2) : '-'} (mean change in ex5 ${e(r.dx)}, in the read ${e(r.dy)})`);
  }
}
console.log('\n2. THE STRADDLE, BY WORLD (S370, the years before each step: rep = read less ex5)');
{
  const t = files.S370;
  for (const yr of [2, 6]) for (const a of ['BASE', 'COV']) {
    const A = t.arms[a], parts = [];
    for (const s of [1, 0]) for (const k of [0, 1, 2]) { const J = idx(t, j => t.t[j] === yr && t.k[j] === k && t.strad[j] === s); if (J.length) parts.push(`${s ? 'straddling' : 'other'} w${k} ${J.length}: ${e(mean(J.map(j => A.read[j] - A.ex5[j])))}`); }
    console.log(`  year ${yr} ${a.padEnd(4)}: ${parts.join('; ')}`);
  }
  for (const yr of [2, 6]) { const A = t.arms.COV; for (const s of [0, 1]) { const J = idx(t, j => t.t[j] === yr && t.strad[j] === s); console.log(`  year ${yr} COV ${s ? 'straddling' : 'other'} all worlds ${J.length}: rep ${e(mean(J.map(j => A.read[j] - A.ex5[j])))}`); } }
}
console.log('\n3. COV\'S MOVES (S370, the years before each step: COV\'s rep where its chooser kept BASE\'s move and where it did not)');
{
  const t = files.S370, same = C.files.S370.fixed.arms.COV.same, A = t.arms.COV;
  if (!Array.isArray(same) || same.length !== t.t.length) { console.log('  COV-B-STEP\'s `same` column is missing or of the wrong length'); process.exit(1); }
  for (const yr of [2, 6]) {
    const all = idx(t, j => t.t[j] === yr);
    for (const s of [1, 0]) { const J = all.filter(j => same[j] === s); console.log(`  year ${yr} ${s ? 'same move   ' : 'changed move'} reads ${String(J.length).padStart(5)}: rep ${e(mean(J.map(j => A.read[j] - A.ex5[j])))}, adding ${e(J.reduce((q, j) => q + A.read[j] - A.ex5[j], 0) / all.length)} to the year's mean rep`); }
  }
}
console.log('\n4. THE BRIDGE TOTAL (S370: mean D = read less claim per year, summed; year 1\'s rep)');
{
  const t = files.S370;
  for (const a of ['BASE', 'COV']) {
    const A = t.arms[a], D = yr => mean(idx(t, j => t.t[j] === yr).map(j => A.read[j] - A.claim[j]));
    const sum = ys => ys.reduce((s, y) => s + (Number.isFinite(D(y)) ? D(y) : 0), 0);
    console.log(`  ${a.padEnd(4)}: years 1-3 ${e(sum([1, 2, 3]))}; years 4-7 ${e(sum([4, 5, 6, 7]))}; year 1 rep ${e(mean(idx(t, j => t.t[j] === 1).map(j => A.read[j] - A.ex5[j])))}`);
  }
}
console.log('\n5. S126\'S OPENING (results/diagxas/case3.txt, as printed by audit-xas.mjs)');
{
  const f = Object.entries(logs).find(([, v]) => /^S126\s/m.test(v) && / open BASE:/.test(v));
  if (!f) { console.log('  S126\'s open lines not found'); process.exit(1); }
  for (const l of f[1].split('\n').filter(l => / (open|swap) (BASE|COV):/.test(l))) console.log(`  ${l.trim()}`);
}
console.log('\n6. S126 UNDER COV: how far the opening scores rise against how far the survival reads move');
{
  const f = Object.values(logs).find(v => /^S126\s/m.test(v)), sc = {};
  for (const m of f.matchAll(/ open (BASE|COV): move (\d+) scores BASE-move (\S+) COV-move (\S+)/g)) sc[m[1]] = { mv: m[2], b: Number(m[3]), c: Number(m[4]) };
  if (!sc.BASE || !sc.COV) { console.log('  S126\'s scores not found'); process.exit(1); }
  console.log(`  BASE's opening (move ${sc.BASE.mv}): ${e(sc.BASE.b)} under BASE, ${e(sc.COV.b)} under COV, a rise of ${e(sc.COV.b - sc.BASE.b)}`);
  console.log(`  COV's opening (move ${sc.COV.mv}): ${e(sc.BASE.c)} under BASE, ${e(sc.COV.c)} under COV, a rise of ${e(sc.COV.c - sc.BASE.c)}`);
  const t = files.S126;
  for (const yr of [...new Set(t.t)].sort((x, y) => x - y)) { const J = idx(t, j => t.t[j] === yr); const B = mean(J.map(j => t.arms.BASE.read[j])), V = mean(J.map(j => t.arms.COV.read[j])); console.log(`  year ${yr} reads ${J.length}: the survival read ${e(B)} under BASE, ${e(V)} under COV, COV less BASE ${e(V - B)}`); }
}
