/*
 * O191'S DECOMPOSING READ (PLAN.md O191 and REF-STEP; the deep review after REF-B, deep-review-log.md 20 Oct 02:53 UK, its
 * answer to Q1; RULES.md section 9 rule 2(c)): over two arms' saved files on one household, behind each source test's own gate
 * (CHECKLIST item 3: reused files are fair-tested first), on the paths whose moves first differ at a bridge year:
 *   - by world and by the first-differing cell (the year, each arm's draw order and tier there), each arm's survival and its
 *     own-move read error from the year after the first difference (the sum of the arm's residual from that year on, with GA:
 *     its read of the move it took against that move's own outcome);
 *   - the year-1 switch from a taxable-first move (arm A) to an ISA-first move (arm B) apart: its paired survival change B less A
 *     by world and on the mixture (weights 1/6, 2/3, 1/6), and each arm's own-move read error on the mixture;
 *   - the mixture's paired survival and whole-score change over all paths.
 * A read-only script: no solve, no run. READ_PLANT=y3 raises arm B's year-3 residual by a point on the year-1 cell's paths; the
 * cell's own-move read error under B must then move by exactly a point (--planted shows it, with the rest of the planted set).
 *   node research/solver/read-o191.mjs <household> <arm A> <results dir A> <arm B> <results dir B> [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
export const W = Object.freeze([1 / 6, 2 / 3, 1 / 6]), NOM = 65535;
// each results directory's own reducer, whose gate must pass over its files before they are read
export const GATES = Object.freeze({ diagrefb: 'reduce-refb.mjs', diagcopyb: 'reduce-copyb.mjs', diagcopyx: 'reduce-copyx.mjs', diaghodep: 'reduce-hodep.mjs' });
// a move's draw order and tier (the action index: tier ai % 3, then level, then harvest, ISA-first and pension groups)
export const isaFirst = ai => Math.floor(Math.floor(ai / 15) / 3) % 2 === 1;
export const cellOf = ai => (ai === NOM ? '-' : `${isaFirst(ai) ? 'I' : 'T'}t${ai % 3}`);
export const firstDiff = (mA, mB, Y, i) => { for (let t = 0; t < Y; t++) if (mA[i * Y + t] !== mB[i * Y + t]) return t; return -1; };
// an arm's own-move read error from the year after t0: its residual at every later bridge year, with GA, in points
export const ownErr = (F, k, i, t0) => { let s = F.per[`GA${k}`][i]; for (const t of F.bridge) if (t > t0) s += F.per[`Y${t}${k}`][i]; return 100 * s; };
const st = a => { const n = a.length; if (!n) return { m: NaN, se: NaN, n }; const m = a.reduce((t, x) => t + x, 0) / n; const v = n > 1 ? a.reduce((t, x) => t + (x - m) ** 2, 0) / (n - 1) / n : 0; return { m, se: Math.sqrt(v), n }; };

export function read(A, B, plant = '') {
  const Y = A.years, N = A.NPW, br = A.bridge, out = { worlds: [], cell: [], mix: {} };
  if (plant === 'y3') B = { ...B, per: { ...B.per } };
  let cS = 0, cSV = 0, eA = 0, eAV = 0, eB = 0, eBV = 0, mS = 0, mSV = 0, mW = 0, mWV = 0;
  for (const k of [0, 1, 2]) {
    const bA = A.bits[`OWN${k}`], bB = B.bits[`OWN${k}`], mA = A.mv[`MV${k}`], mB = B.mv[`MV${k}`];
    const cellPaths = [];
    for (let i = 0; i < N; i++) { const t0 = firstDiff(mA, mB, Y, i); if (t0 === 1 && !isaFirst(mA[i * Y + 1]) && isaFirst(mB[i * Y + 1])) cellPaths.push(i); }
    if (plant === 'y3' && br.includes(3)) { const y = Float64Array.from(B.per[`Y3${k}`]); for (const i of cellPaths) y[i] += 0.01; B.per[`Y3${k}`] = y; }
    const cells = {}, all = { a: [], b: [], sa: 0, sb: 0, n: 0 };
    for (let i = 0; i < N; i++) {
      const t0 = firstDiff(mA, mB, Y, i); if (t0 < 0 || !br.includes(t0)) continue;
      const key = `y${t0} ${cellOf(mA[i * Y + t0])}->${cellOf(mB[i * Y + t0])}`, c = cells[key] || (cells[key] = { a: [], b: [], sa: 0, sb: 0, n: 0 });
      for (const x of [all, c]) { x.a.push(ownErr(A, k, i, t0)); x.b.push(ownErr(B, k, i, t0)); x.sa += bA[i]; x.sb += bB[i]; x.n++; }
    }
    out.worlds.push({ k, all: { n: all.n, aliveA: all.sa, aliveB: all.sb, eA: st(all.a), eB: st(all.b) }, cells: Object.fromEntries(Object.entries(cells).map(([key, c]) => [key, { n: c.n, aliveA: c.sa, aliveB: c.sb, eA: st(c.a), eB: st(c.b) }])) });
    const d = st(cellPaths.map(i => 100 * (bB[i] - bA[i]))), ea = st(cellPaths.map(i => ownErr(A, k, i, 1))), eb = st(cellPaths.map(i => ownErr(B, k, i, 1)));
    out.cell.push({ k, n: cellPaths.length, d, ea, eb });
    if (cellPaths.length) { cS += W[k] * d.m; cSV += W[k] ** 2 * d.se ** 2; eA += W[k] * ea.m; eAV += W[k] ** 2 * ea.se ** 2; eB += W[k] * eb.m; eBV += W[k] ** 2 * eb.se ** 2; }
    const ds = st(Array.from(bB, (v, i) => 100 * (v - bA[i]))), dw = st(Array.from(B.per[`WS${k}`], (v, i) => v - A.per[`WS${k}`][i]));
    mS += W[k] * ds.m; mSV += W[k] ** 2 * ds.se ** 2; mW += W[k] * dw.m; mWV += W[k] ** 2 * dw.se ** 2;
  }
  out.mix = { cell: { d: cS, se: Math.sqrt(cSV), eA, seA: Math.sqrt(eAV), eB, seB: Math.sqrt(eBV) }, all: { s: mS, se: Math.sqrt(mSV), w: mW, seW: Math.sqrt(mWV) } };
  return out;
}

export function load(path) {
  const j = JSON.parse(gunzipSync(readFileSync(path)).toString());
  const view = (s, T) => { const b = Buffer.from(s, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
  const map = (o, T) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, view(v, T)]));
  return { id: j.id, job: j.job, NPW: j.NPW, seed: j.seed, years: j.years, bridge: j.bridge, stamp: j.stamp, bits: map(j.bits, Uint8Array), per: map(j.per, Float64Array), mv: map(j.moves, Uint16Array) };
}

// THE PLANTED CHECKS: synthetic arms with known answers, and the plant
function planted() {
  const cases = [], put = (what, got, want) => cases.push([what, got, want]);
  const N = 6, Y = 4, br = [1, 2, 3], f = a => Float64Array.from(a), u16 = a => Uint16Array.from(a), u8 = a => Uint8Array.from(a);
  // arm A: every path taxable-first at every year (ai 1: T, tier 1); arm B: paths 0-2 switch to ISA-first at year 1 (ai 46: I,
  // tier 1), path 3 differs at year 0 (not a bridge year) and switches at year 1 too, paths 4-5 equal
  const mvA = u16([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const mvB = u16([1, 46, 1, 1, 1, 46, 1, 1, 1, 46, 1, 1, 2, 46, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const mk = (bits, y2, y3, ga) => { const per = {}, b = {}, mv = {}; for (const k of [0, 1, 2]) { per[`Y1${k}`] = f([0.05, 0.05, 0.05, 0, 0, 0]); per[`Y2${k}`] = f(y2); per[`Y3${k}`] = f(y3); per[`GA${k}`] = f(ga); per[`WS${k}`] = f(bits.map(v => 100 * v)); b[`OWN${k}`] = u8(bits); } return { per, bits: b }; };
  const A = { NPW: N, years: Y, bridge: br, ...mk([1, 1, 0, 1, 1, 0], [0.01, 0.01, 0.01, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]), mv: {} };
  const B = { NPW: N, years: Y, bridge: br, ...mk([0, 1, 0, 1, 1, 0], [0.02, 0.02, 0.02, 0, 0, 0], [0.01, 0.01, 0.01, 0, 0, 0], [0, 0, 0, 0, 0, 0]), mv: {} };
  for (const k of [0, 1, 2]) { A.mv[`MV${k}`] = mvA; B.mv[`MV${k}`] = mvB; }
  B.bits.OWN1 = u8([1, 1, 0, 1, 1, 0]);   // world 1: no path lost, so the mixture's weights show
  put('isaFirst reads ai 46 as ISA-first and ai 1 and 16 as taxable-first', `${isaFirst(46)} ${isaFirst(1)} ${isaFirst(16)}`, 'true false false');
  put('firstDiff finds year 1 for path 0 and year 0 for path 3', `${firstDiff(mvA, mvB, Y, 0)} ${firstDiff(mvA, mvB, Y, 3)} ${firstDiff(mvA, mvB, Y, 4)}`, '1 0 -1');
  const r = read(A, B);
  put('the year-1 cell holds paths 0-2 alone (path 3 differs at year 0)', r.cell.map(c => c.n).join(','), '3,3,3');
  put('the cell\'s survival change B less A: one of three lost', r.cell[0].d.m.toFixed(4), (-100 / 3).toFixed(4));
  put('A\'s own-move read error from year 2: years 2 and 3 with GA, not year 1', r.cell[0].ea.m.toFixed(4), '1.0000');
  put('B\'s own-move read error from year 2', r.cell[0].eb.m.toFixed(4), '3.0000');
  put('the bridge-year first differences count the cell only', r.worlds[0].all.n, 3);
  put('the mixture\'s survival change over all paths, by the worlds\' weights', r.mix.all.s.toFixed(4), (-100 / 18).toFixed(4));
  const rp = read(A, B, 'y3');
  put('the plant moves B\'s cell read by exactly a point', (rp.cell[1].eb.m - r.cell[1].eb.m).toFixed(4), '1.0000');
  put('the plant leaves A\'s read', (rp.cell[1].ea.m - r.cell[1].ea.m).toFixed(4), '0.0000');
  put('the plant leaves the files as they were', B.per.Y31[0].toFixed(4), '0.0100');
  let bad = 0;
  for (const [w, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${w}: ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`); }
  if (bad) { console.log(`PLANTED CHECK FAILED (${bad})`); process.exit(1); }
  return cases.length;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const np_ = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np_}): all read as they should`); process.exit(0); }
  const [hh, armA, dirA, armB, dirB] = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (!hh || !dirB) { console.error('usage: read-o191.mjs <household> <arm A> <dir A> <arm B> <dir B>'); process.exit(2); }
  for (const d of [...new Set([dirA, dirB])]) {
    const g = GATES[d]; if (!g) { console.log(`GATE FAILED: no gate known for results/${d}`); process.exit(1); }
    const r = spawnSync('node', [join(HERE, g), join(HERE, 'results', d)], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (r.status !== 0 || !/^GATE: passed/m.test(r.stdout || '')) { console.log(`GATE FAILED: ${g} over results/${d}`); process.exit(1); }
  }
  const fileOf = (d, arm) => { const ds = join(HERE, 'results', d), f = readdirSync(ds).find(x => x.startsWith(`${hh}-${arm}-`) && x.endsWith('.json.gz')); if (!f) { console.log(`no file for ${hh} ${arm} in results/${d}`); process.exit(1); } return join(ds, f); };
  const A = load(fileOf(dirA, armA)), B = load(fileOf(dirB, armB));
  if (A.NPW !== B.NPW || A.seed !== B.seed || A.years !== B.years || A.bridge.join(',') !== B.bridge.join(',')) { console.log('GATE FAILED: the two arms are not on the same paths, seed, years and bridge years'); process.exit(1); }
  const plant = process.env.READ_PLANT || '';
  const r = read(A, B, plant), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : String(x)), iv = s => `${f2(s.m)} (se ${f2(s.se)})`;
  console.log(`planted (${np_}): all read as they should\nGATE: passed - ${[...new Set([dirA, dirB])].map(d => `${GATES[d]} over results/${d}`).join('; ')}; the arms on the same ${A.NPW} paths a world, seed ${A.seed}${plant ? `; PLANT ${plant}` : ''}`);
  console.log(`\nO191'S READ: ${hh}, ${armA} (results/${dirA}) against ${armB} (results/${dirB})`);
  for (const w of r.worlds) {
    console.log(`world ${w.k}, the bridge-year first differences: n ${w.all.n}; alive ${armA} ${w.all.aliveA}, ${armB} ${w.all.aliveB}; own-move read error ${armA} ${iv(w.all.eA)}, ${armB} ${iv(w.all.eB)}`);
    for (const [key, c] of Object.entries(w.cells).sort((a, b) => b[1].n - a[1].n)) if (c.n >= 20) console.log(`   ${key.padEnd(14)} n ${c.n}; alive ${armA} ${c.aliveA}, ${armB} ${c.aliveB}; own-move read error ${armA} ${iv(c.eA)}, ${armB} ${iv(c.eB)}`);
  }
  for (const c of r.cell) console.log(`CELL year 1, taxable-first to ISA-first, world ${c.k}: n ${c.n}; survival ${armB} less ${armA} ${iv(c.d)}; own-move read error from year 2 ${armA} ${iv(c.ea)}, ${armB} ${iv(c.eb)}`);
  console.log(`CELL MIXTURE: survival ${armB} less ${armA} ${f2(r.mix.cell.d)} (se ${f2(r.mix.cell.se)}); own-move read error ${armA} ${f2(r.mix.cell.eA)} (se ${f2(r.mix.cell.seA)}), ${armB} ${f2(r.mix.cell.eB)} (se ${f2(r.mix.cell.seB)})`);
  console.log(`ALL PATHS, THE MIXTURE: survival ${armB} less ${armA} ${r.mix.all.s.toFixed(4)} (95%: ${(r.mix.all.s - 1.96 * r.mix.all.se).toFixed(4)} to ${(r.mix.all.s + 1.96 * r.mix.all.se).toFixed(4)}); whole score ${r.mix.all.w.toFixed(4)} (95%: ${(r.mix.all.w - 1.96 * r.mix.all.seW).toFixed(4)} to ${(r.mix.all.w + 1.96 * r.mix.all.seW).toFixed(4)})`);
}
