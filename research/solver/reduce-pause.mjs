/*
 * PAUSE'S REDUCER (PLAN.md O103's gate; audit-pause.mjs; predictions/measure-pause.md, Kind: measurement). It settles
 * nothing: per arm of EDGE-SPLIT's eight on S130, where the arm pauses (its flat years' used allowance u) against the shape of
 * its own read over u at those states (the chooser's best score at u = 0, 0.05, ..., 1, every other coordinate held).
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs); a plant line refuses the logs; every arm once and done, each ran line
 *   EDGE-SPLIT's unit (30 points, seed 7005, the estate weight 0.02, no reader, switch margin 0.001, buckets 0,0.5,1, mix 3, tie
 *   margin 0, death tax 0) with the arm's tables, read and segment; one access line and one pathsum; the sweep's self-check
 *   (the score through the setter at the state's own u equals the chooser's score of its move) passed on every flat year and
 *   run on more than nothing; every file present, stamped as the logs, its flat years the sweep line's count;
 *   THE IDENTITY (rule 3, a re-use of EDGE-SPLIT's and HYB's files): each arm's u, pension pot and other pots, every year of
 *   the first N paths, equal EDGE-SPLIT's file for the arm (HYB: HYB's own HYB arm), those files first passing their own gate.
 * THE READING (described in predictions/measure-pause.md; a measurement, no verdict): the read is the score of the move the
 *   run took that year, read at each u (the fixed move: no move change or stay rule in it; the plan-auditor's BLOCKING 2 of
 *   6 Oct on 1fde232), the envelope (the chooser's own move at each u) beside it. Per arm: the flat years by u's band and how
 *   often the chooser's move changes over the sweep; THE REGISTERED FIGURES in each arm's main pause band (MAIN) - of the
 *   flat years with a fall ahead, the share whose steepest fall ahead (the most negative step between grid points above u,
 *   its midpoint) lies within 0.1 above u, and the share with it in [0.4, 0.6] (their BLOCKING 1); the same per band for every
 *   arm, with the commonest midpoint ahead; the steepest fall over the whole axis.
 *   node research/solver/reduce-pause.mjs [dir] [paths] [points] > research/solver/results-pause.txt   (--preflight: preflight-pause.sh's)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { stampOf } from './reduce-adoptpi.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/measure-pause.md';
export const PTS = '30', SEED = '7005', NPW = 1000, W = '0.02', NEAR = 0.1;
// audit-pause.mjs's ARM, as the ran line prints it (its module runs on import)
export const ARMS = ['SNAP', 'S-LO', 'S-HI', 'S-INT', 'PCLSI', 'P-LO', 'P-HI', 'HYB'];
export const ARM = { SNAP: { tables: 'SNAP', read: 'false', seg: 'none' }, 'S-LO': { tables: 'SNAP', read: 'true', seg: 'lo' }, 'S-HI': { tables: 'SNAP', read: 'true', seg: 'hi' }, 'S-INT': { tables: 'SNAP', read: 'true', seg: 'none' },
  PCLSI: { tables: 'PCLSI', read: 'true', seg: 'none' }, 'P-LO': { tables: 'PCLSI', read: 'true', seg: 'lo' }, 'P-HI': { tables: 'PCLSI', read: 'true', seg: 'hi' }, HYB: { tables: 'PCLSI', read: 'false', seg: 'none' } };
export const BANDS = [['u<0.15', 0, 0.15], ['[0.15,0.25)', 0.15, 0.25], ['[0.25,0.6)', 0.25, 0.6], ['[0.6,0.75)', 0.6, 0.75], ['[0.75,0.99)', 0.75, 0.99]];
const bandOf = u => (BANDS.find(([, lo, hi]) => u >= lo && u < hi) || ['-'])[0];
const BASE = `OFF/PRODUCT/W${W}`;
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`), LBL = `(${esc(BASE)}\\/(?:${ARMS.map(esc).join('|')}))`;
const CASEL = new RegExp(`^S130\\s+case \\| unit ${LBL} \\| lambda (\\S+)$`);
const LINE = new RegExp(`^\\s+(ran|access|sum|sweep|trace) ${LBL}: (.*)$`), DONEL = new RegExp(`^\\s+done ${LBL}$`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const num = (s, k) => { const v = field(s, k); return v === null || v === '-' ? NaN : Number(v); };

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if (/^plant: /.test(line)) us.push({ plant: line });
    if ((m = CASEL.exec(line))) { cur = { arm: m[1].slice(m[1].lastIndexOf('/') + 1), label: m[1], done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = DONEL.exec(line))) { if (m[1] === cur.label) cur.done = true; continue; }
    if (!(m = LINE.exec(line)) || m[2] !== cur.label) continue;
    const [, kind, , s] = m;
    if (kind === 'ran') cur.ran = s;
    else if (kind === 'access') cur.access = s;
    else if (kind === 'sum') cur.sum = { paths: num(s, 'paths'), pathsum: field(s, 'pathsum') };
    else if (kind === 'sweep') { const x = /^flat (\d+) points (\d+) repro (\d+)\/(\d+) secs \d+$/.exec(s); cur.sweep = x ? { flat: +x[1], points: +x[2], ok: +x[3], n: +x[4] } : { bad: s }; }
    else if (kind === 'trace') { const x = /^file (\S+) paths (\d+) years (\d+)$/.exec(s); cur.trace = x ? { file: x[1], paths: +x[2], years: +x[3] } : { bad: s }; }
  }
  return us;
}

export function gate(units, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const u of units) if (u.plant) bad.push(`a planted fault in the logs (${u.plant})`);
  const real = units.filter(u => !u.plant);
  for (const a of ARMS) { const n = real.filter(u => u.arm === a).length; if (n !== 1) bad.push(`${a}: ${n} unit lines, not 1`); }
  for (const u of real) {
    if (!ARMS.includes(u.arm)) { bad.push(`${u.arm}: not a registered arm`); continue; }
    if (!u.done) bad.push(`${u.arm}: not done`);
    if (!u.ran || !u.access || !u.sum || !u.sweep || !u.trace) { bad.push(`${u.arm}: a ran, access, sum, sweep or trace line missing`); continue; }
    const A = ARM[u.arm], want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, bridgeRead: 'false', switchMargin: '0.001', pcls: '0,0.5,1', mix: '3', tables: A.tables, read: A.read, seg: A.seg, deathTax: '0' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${u.arm}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    if (num(u.ran, 'tieMargin') !== 0) bad.push(`${u.arm}: ran tieMargin ${field(u.ran, 'tieMargin')}, not 0`);
    if (u.sum.paths !== npw || !u.sum.pathsum) bad.push(`${u.arm}: sum paths ${u.sum.paths} pathsum ${u.sum.pathsum}`);
    const s = u.sweep;
    if (s.bad) bad.push(`${u.arm}: sweep line ${s.bad}`);
    else {
      if (!(s.n > 0)) bad.push(`${u.arm}: the sweep's self-check ran on nothing`);
      if (s.ok !== s.n) bad.push(`${u.arm}: the sweep's self-check failed on ${s.n - s.ok} of ${s.n} flat years (the score at the state's own u is not the chooser's)`);
      if (s.flat !== s.n || s.points !== 21) bad.push(`${u.arm}: sweep flat ${s.flat} points ${s.points}, self-checked ${s.n}`);
    }
    if (u.trace.bad || u.trace.paths !== npw) bad.push(`${u.arm}: trace line ${u.trace.bad || `paths ${u.trace.paths}`}`);
  }
  if (new Set(real.filter(u => u.access).map(u => u.access)).size > 1) bad.push('the arms\' access lines differ');
  if (new Set(real.filter(u => u.sum).map(u => u.sum.pathsum)).size > 1) bad.push('the arms ran different paths');
  return bad;
}

const bytes = s => { const x = Buffer.from(s, 'base64'); return x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength); };
const f32 = x => (x instanceof Float32Array ? x : new Float32Array(bytes(x)));   // a reference loader may have decoded u already
export const decodeP = t => ({ ...t, u: f32(t.u), pen: f32(t.pen), non: f32(t.non), fv: t.fv == null ? null : new Float64Array(bytes(t.fv)), fx: t.fx == null ? null : new Float64Array(bytes(t.fx)), fc: t.fc == null ? null : new Uint8Array(bytes(t.fc)) });
export function checkFile(t, u, st) {
  const tag = `${u.arm} file`;
  if (!t) return [`${tag}: missing`];
  const bad = [], A = ARM[u.arm], years = Number((/ years (\d+) /.exec(u.access) || [])[1]) + 1;
  if (!st || !t.stamp || ['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])) bad.push(`${tag}: its stamp is not the logs'`);
  if (t.plant) bad.push(`${tag}: carries the plant ${t.plant}`);
  if (t.arm !== u.arm || t.N !== u.sum.paths || t.Y !== years || t.tables !== A.tables || String(t.read) !== A.read || String(t.seg ?? 'none') !== A.seg) bad.push(`${tag}: arm ${t.arm} tables ${t.tables} read ${t.read} seg ${t.seg} paths ${t.N} years ${t.Y}, not the unit's`);
  if (t.u.length !== t.N * t.Y || t.pen.length !== t.N * t.Y || t.non.length !== t.N * t.Y) bad.push(`${tag}: per-path-year arrays of the wrong length`);
  if (t.fp.length !== u.sweep.flat || t.ft.length !== t.fp.length || t.fu.length !== t.fp.length || !t.fv || t.fv.length !== t.fp.length * t.ugrid.length || !t.fx || t.fx.length !== t.fv.length || !t.fc || t.fc.length !== t.fv.length || t.ugrid.length !== 21) bad.push(`${tag}: ${t.fp.length} flat years in the file, ${u.sweep.flat} on the sweep line, or the read's arrays the wrong length`);
  return bad;
}
/* THE IDENTITY: this run's first N paths against the reference file's, every year (Float32 as both store them) */
export function identity(t, ref, tag) {
  if (!ref) return [`identity ${tag}: the reference file missing`];
  if (!(ref.N >= t.N) || ref.Y !== t.Y) return [`identity ${tag}: ${ref.N} paths and ${ref.Y} years in the reference, ${t.N} and ${t.Y} here`];
  let n = 0, cells = 0;
  for (let i = 0; i < t.N * t.Y; i++) {
    const a = [t.u[i], t.pen[i], t.non[i]], b = [ref.u[i], ref.pen[i], ref.non[i]];
    for (let k = 0; k < 3; k++) { if (Number.isNaN(a[k]) && Number.isNaN(b[k])) continue; cells++; if (a[k] !== b[k]) n++; }
  }
  if (!(cells > 0)) return [`identity ${tag}: compared nothing`];
  return n ? [`identity ${tag}: ${n} of ${cells} path-year values differ from the reference`] : [];
}

/* the read's steepest fall over u: the most negative step between grid points (its midpoint), overall and ahead of u0 */
export function shape(v, grid, u0) {
  let all = { s: Infinity, m: NaN }, ahead = { s: Infinity, m: NaN };
  for (let i = 0; i + 1 < grid.length; i++) {
    const s = (v[i + 1] - v[i]) / (grid[i + 1] - grid[i]), m = (grid[i] + grid[i + 1]) / 2;
    if (!Number.isFinite(s)) continue;
    if (s < all.s) all = { s, m };
    if (m > u0 && s < ahead.s) ahead = { s, m };
  }
  return { all, ahead };
}
const med = a => { if (!a.length) return NaN; const b = [...a].sort((x, y) => x - y), h = b.length >> 1; return b.length % 2 ? b[h] : (b[h - 1] + b[h]) / 2; };
const mode = a => { const c = new Map(); for (const x of a) c.set(x, (c.get(x) || 0) + 1); let best = null, n = 0; for (const [k, v] of c) if (v > n || (v === n && k < best)) { best = k; n = v; } return { m: best, n }; };

// each arm's main pause band (EDGE-SPLIT's flat years, results-edge.txt REPORTED; predictions/measure-pause.md)
export const MAIN = { SNAP: '[0.6,0.75)', 'S-LO': '[0.6,0.75)', 'P-LO': '[0.6,0.75)', 'P-HI': '[0.15,0.25)', HYB: '[0.15,0.25)', 'S-HI': '[0.25,0.6)', 'S-INT': '[0.25,0.6)', PCLSI: null };
export const MID = [0.4, 0.6];
/* per flat year: the shape of the fixed move's score (the read along the move the run took: the primary measure) and of the
   envelope (the chooser's own move at each u, its stay rule included), and the share of grid points where the move changed */
export function readArm(t) {
  const G = t.ugrid, K = G.length, rows = [];
  for (let i = 0; i < t.fp.length; i++) {
    const u0 = t.fu[i], fx = t.fx.subarray(i * K, (i + 1) * K), fv = t.fv.subarray(i * K, (i + 1) * K);
    let ch = 0; for (let k = 0; k < K; k++) ch += t.fc[i * K + k];
    rows.push({ u0, band: bandOf(u0), fix: shape(fx, G, u0), env: shape(fv, G, u0), changed: ch / K });
  }
  return rows;
}
/* the registered figures of one set of rows (an arm's main band): n, the share with the steepest fall ahead within NEAR above
   u, the share with it in MID - on the fixed move's score (key 'fix') or the envelope ('env') */
export function figures(rows, key) {
  if (key !== 'fix' && key !== 'env') throw new Error(`figures: key ${key}`);
  // a year counts only where its read falls ahead of u (the steepest step ahead negative): a flat or rising read has no steep
  // point to pause below (the plan-auditor's MINOR 1 of 6 Oct on 3c21081); those years are counted apart (none)
  const rs = rows.filter(r => Number.isFinite(r[key].ahead.m) && r[key].ahead.s < 0);
  return { n: rows.length, read: rs.length, none: rows.length - rs.length, within: rs.length ? rs.filter(r => r[key].ahead.m - r.u0 <= NEAR + 1e-12).length / rs.length : NaN, mid: rs.length ? rs.filter(r => r[key].ahead.m >= MID[0] - 1e-12 && r[key].ahead.m <= MID[1] + 1e-12).length / rs.length : NaN };
}
export function reading(files, out = console.log) {
  const f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-'), e = x => (Number.isFinite(x) ? x.toExponential(3) : '-');
  out(`PAUSE (S130, EDGE-SPLIT's unit, the first ${files[ARMS[0]].N} paths): where each arm pauses against the steepest fall of its own read over u. A measurement: no verdict. The read is the score of the move the run took, read at each u (the fixed move); the envelope (the chooser's own move at each u, its switch-margin stay rule included) is the second line.`);
  out(`\n1. FLAT YEARS BY u'S BAND (pension live, u under 0.99), a path's mean: ${BANDS.map(b => b[0]).join(' / ')}`);
  const R = {};
  for (const a of ARMS) { R[a] = readArm(files[a]); out(`  ${a.padEnd(6)} ${BANDS.map(([nm]) => (R[a].filter(r => r.band === nm).length / files[a].N).toFixed(2)).join(' / ')}   all ${(R[a].length / files[a].N).toFixed(2)}   the chooser's move changes on ${f3(R[a].reduce((x, r) => x + r.changed, 0) / Math.max(1, R[a].length))} of the grid points`); }
  out(`\n2. THE REGISTERED FIGURES, each arm's main pause band (predictions/measure-pause.md): flat years n; of those with a fall ahead, the share with the steepest fall ahead within ${NEAR} above u, and the share with it in [${MID.join(', ')}] - the fixed move | the envelope`);
  for (const a of ARMS) {
    if (!MAIN[a]) { out(`  ${a.padEnd(6)} no main band (EDGE-SPLIT: no flat years in the three bands)`); continue; }
    const b = R[a].filter(r => r.band === MAIN[a]), F = figures(b, 'fix'), V = figures(b, 'env');
    out(`  ${a.padEnd(6)} ${MAIN[a].padEnd(12)} n ${F.n}   within ${f3(F.within)} of ${F.read}   in the middle ${f3(F.mid)}   no fall ahead ${F.none}   | envelope within ${f3(V.within)} of ${V.read}   in the middle ${f3(V.mid)}`);
  }
  out(`\n3. PER BAND, every arm (the fixed move): n, within ${NEAR}, in the middle, the commonest midpoint ahead (its share), the median slope ahead (score per unit u)`);
  for (const a of ARMS) for (const [nm] of BANDS) {
    const b = R[a].filter(r => r.band === nm); if (!b.length) continue;
    const F = figures(b, 'fix'), md = mode(b.filter(r => Number.isFinite(r.fix.ahead.m) && r.fix.ahead.s < 0).map(r => r.fix.ahead.m));
    out(`  ${a.padEnd(6)} ${nm.padEnd(12)} n ${String(F.n).padStart(6)}   within ${f3(F.within)}   in the middle ${f3(F.mid)}   no fall ahead ${F.none}   commonest ${f3(md.m)} (${f3(md.n / Math.max(1, F.read))})   slope ${e(med(b.map(r => r.fix.ahead.s).filter(Number.isFinite)))}`);
  }
  out(`\n4. THE STEEPEST FALL OVER THE WHOLE AXIS (the fixed move): its commonest midpoint (share), the median slope`);
  for (const a of ARMS) { const md = mode(R[a].map(r => r.fix.all.m).filter(Number.isFinite)); out(`  ${a.padEnd(6)} at ${f3(md.m)} (${f3(md.n / Math.max(1, R[a].length))})   median slope ${e(med(R[a].map(r => r.fix.all.s).filter(Number.isFinite)))}`); }
  return R;
}

// PLANTED CHECKS (rule 6)
const EDGES = [];
function builtLog(o = {}) {
  const L = ['stamp: code abc audit def prediction none sha -'];
  if (o.plant) L.push('plant: scale');
  for (const a of ARMS) {
    if (o.drop === a) continue;
    const A = ARM[a], lb = `${BASE}/${a}`;
    L.push(`S130             case | unit ${lb} | lambda 0.02`);
    L.push(`                 ran ${lb}: mix 3 pts 30 seed 7005 paths 1000 grid total30x6x6 lambda 0.02 bequestWeight 0.02 finalIntegral true bridgeRead false switchMargin 0.001 pcls 0,0.5,1 tables ${A.tables} read ${A.read} seg ${o.seg === a ? 'lo' : A.seg} tieMargin 0 deathTax 0`);
    L.push(`                 access ${lb}: year 2 years 39 lsa 268275 open 2400000`);
    L.push(`                 sum ${lb}: paths 1000 survived 900 tax 1 net 2 pathsum ${o.paths === a ? 9 : 8}`);
    L.push(`                 sweep ${lb}: flat ${o.zero === a ? 0 : 5} points 21 repro ${o.fail === a ? 4 : o.zero === a ? 0 : 5}/${o.zero === a ? 0 : 5} secs 1`);
    L.push(`                 trace ${lb}: file x paths 1000 years 40`);
    L.push(`                 done ${lb}`);
  }
  return L.join('\n');
}
function planted() {
  const cases = [], G = Array.from({ length: 21 }, (_, i) => i / 20);
  const g = o => gate(parse(builtLog(o)));
  cases.push(['a clean log passes', g({}).length, 0]);
  cases.push(['a plant line refuses the logs', g({ plant: true }).some(x => /planted fault/.test(x)), true]);
  cases.push(['a missing arm refuses', g({ drop: 'HYB' }).some(x => /HYB: 0 unit lines/.test(x)), true]);
  cases.push(['a wrong segment refuses', g({ seg: 'P-HI' }).some(x => /P-HI: ran seg lo/.test(x)), true]);
  cases.push(['a failed self-check refuses', g({ fail: 'PCLSI' }).some(x => /self-check failed on 1 of 5/.test(x)), true]);
  cases.push(['a self-check run on nothing refuses', g({ zero: 'S-LO' }).some(x => /ran on nothing/.test(x)), true]);
  cases.push(['different paths refuse', g({ paths: 'SNAP' }).some(x => /different paths/.test(x)), true]);
  // the shape: a cliff between 0.70 and 0.75, the year at 0.6 - the steepest fall ahead at 0.725, within 0.1? no (0.125)
  const v = G.map(u => (u < 0.72 ? 1 - 0.01 * u : 0.5 - 0.01 * u)), s1 = shape(v, G, 0.6);
  cases.push(['a cliff at 0.70-0.75 is the steepest fall, ahead of u 0.6', `${s1.all.m.toFixed(3)} ${s1.ahead.m.toFixed(3)}`, '0.725 0.725']);
  const s2 = shape(v, G, 0.8);
  cases.push(['nothing behind u is ahead: at u 0.8 the steepest fall ahead is the gentle slope', `${s2.ahead.m > 0.8} ${s2.ahead.s.toFixed(3)}`, 'true -0.010']);
  EDGES.push('a cliff exactly one grid step wide, a year past the cliff (only the gentle slope ahead)');
  const s3 = shape(G.map(() => 1), G, 0.99);
  cases.push(['at u 0.99 nothing lies ahead (no midpoint above it)', Number.isNaN(s3.ahead.m), true]);
  EDGES.push('a year with no midpoint ahead (u 0.99)');
  const flat = shape(G.map(() => 2), G, 0);
  cases.push(['a flat read: slope 0, the first midpoint', `${flat.all.s} ${flat.all.m}`, '0 0.025']);
  EDGES.push('a flat read (every step 0)');
  // the identity: equal passes, one value off refuses, NaN in both skipped, nothing compared refuses
  const mk = (u, N = 1, Y = 2) => ({ N, Y, u: Float32Array.from(u), pen: Float32Array.from(u), non: Float32Array.from(u) });
  cases.push(['the identity: equal arrays pass', identity(mk([0.1, 0.2]), mk([0.1, 0.2]), 'x').length, 0]);
  cases.push(['the identity: one value off refuses', identity(mk([0.1, 0.2]), mk([0.1, 0.3]), 'x').some(x => /3 of 6/.test(x)), true]);
  cases.push(['the identity: a longer reference is read on its first N', identity(mk([0.1, 0.2]), mk([0.1, 0.2, 0.5, 0.6], 2), 'x').length, 0]);
  cases.push(['the identity: all NaN compares nothing and refuses', identity(mk([NaN, NaN]), mk([NaN, NaN]), 'x').some(x => /compared nothing/.test(x)), true]);
  EDGES.push('an identity with every value missing (compared nothing)');
  // the registered figures: a built file of three flat years in [0.15, 0.25) - the fixed move falls at 0.225 (within 0.1) on two
  // and at 0.525 on the third (in the middle); the envelope adds a stay-rule drop at 0.325 on all three
  {
    const K = G.length, fu = [0.2, 0.2, 0.2], fall = [0.225, 0.225, 0.525];
    const fx = [], fv = [], fc = [];
    fu.forEach((u0, i) => G.forEach((u, k) => { const x = 1 - 0.01 * u - (u > fall[i] ? 0.5 : 0); fx.push(x); fv.push(x - (u > 0.325 ? 0.9 : 0)); fc.push(u > 0.325 ? 1 : 0); }));
    const T = { ugrid: G, fp: [0, 1, 2], fu, fx: Float64Array.from(fx), fv: Float64Array.from(fv), fc: Uint8Array.from(fc) }, rows = readArm(T);
    const F = figures(rows, 'fix'), V = figures(rows, 'env');
    cases.push(['the fixed move: two of three within 0.1, one of three in the middle', `${F.n} ${F.within.toFixed(3)} ${F.mid.toFixed(3)}`, '3 0.667 0.333']);
    cases.push(['the envelope reads the stay-rule drop at 0.325 instead: none within 0.1, none in the middle', `${V.within.toFixed(3)} ${V.mid.toFixed(3)}`, '0.000 0.000']);
    cases.push(['the move changes on the grid points above 0.325', rows[0].changed.toFixed(3), (14 / 21).toFixed(3)]);
    EDGES.push('a stay-rule drop the envelope reads and the fixed move does not');
    // the reading itself: P-HI's main band carries the built years (and one year outside it), every other arm none; its registered line reads the fixed move
    const empty = { ugrid: G, N: 1, fp: [], fu: [], fx: new Float64Array(0), fv: new Float64Array(0), fc: new Uint8Array(0) };
    const T4 = { ...T, N: 4, fp: [0, 1, 2, 3], fu: [...fu, 0.5], fx: Float64Array.from([...fx, ...G.map(() => 1)]), fv: Float64Array.from([...fv, ...G.map(() => 1)]), fc: Uint8Array.from([...fc, ...G.map(() => 0)]) };   // a fourth year outside the band
    const files = Object.fromEntries(ARMS.map(a => [a, a === 'P-HI' ? T4 : empty])), lines = [];
    reading(files, x => lines.push(x));
    const ph = lines.find(x => /^ {2}P-HI +\[0\.15,0\.25\) +n 3 /.test(x)) || '';
    cases.push(['the reading\'s registered line for P-HI: the fixed move first, the envelope second', /within 0\.667 of 3 +in the middle 0\.333 +no fall ahead 0 +\| envelope within 0\.000 of 3 +in the middle 0\.000/.test(ph), true]);
    const B = readArm({ ugrid: G, fp: [0], fu: [0.5], fx: Float64Array.from(G.map(u => (u > 0.6 ? 0 : 1))), fv: Float64Array.from(G.map(u => (u > 0.6 ? 0 : 1))), fc: new Uint8Array(K) });
    cases.push(['a fall at the 0.6-0.65 step from u 0.5: 0.125 ahead, outside 0.1 and outside the middle', `${figures(B, 'fix').within} ${figures(B, 'fix').mid}`, '0 0']);
    const C = readArm({ ugrid: G, fp: [0], fu: [0.5], fx: Float64Array.from(G.map(u => (u > 0.58 ? 0 : 1))), fv: Float64Array.from(G.map(u => (u > 0.58 ? 0 : 1))), fc: new Uint8Array(K) });
    cases.push(['a fall at the 0.55-0.6 step from u 0.5: 0.075 ahead, within 0.1 and in the middle', `${figures(C, 'fix').within} ${figures(C, 'fix').mid}`, '1 1']);
    EDGES.push('a fall exactly past the 0.1 and the middle bounds');
    cases.push(['an empty band reads n 0 and no shares', JSON.stringify(figures([], 'fix')), '{"n":0,"read":0,"none":0,"within":null,"mid":null}']);
    const flatR = readArm({ ugrid: G, fp: [0, 1], fu: [0.2, 0.2], fx: Float64Array.from([...G.map(() => 1), ...G.map(u => 1 + u)]), fv: Float64Array.from([...G.map(() => 1), ...G.map(u => 1 + u)]), fc: new Uint8Array(2 * K) });
    cases.push(['a flat and a rising read have no fall ahead: counted apart, never within', JSON.stringify(figures(flatR, 'fix')), '{"n":2,"read":0,"none":2,"within":null,"mid":null}']);
    EDGES.push('a flat or rising read (no fall ahead)');
    EDGES.push('an empty band');
  }
  const fails = cases.filter(([, got, want]) => String(got) !== String(want));
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
export { builtLog };

const logsIn = dir => (existsSync(dir) ? Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(dir, f), 'utf8')])) : {});
const readGz = f => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null);
/* EDGE-SPLIT's files for S130 and HYB's HYB arm, through their own gates (rule 3) */
async function references() {
  const RE = await import('./reduce-edge.mjs'), dir = join(HERE, 'results', 'diagedge'), logs = logsIn(dir), units = Object.values(logs).flatMap(RE.parse);
  requireFairLogs(logs, RE.PRED);
  const bad = RE.gate(units), refs = {};
  if (bad.length) return { bad: bad.map(x => `EDGE-SPLIT's files: ${x}`), refs };
  const tr = RE.loadTraces(units, dir, stampOf(Object.values(logs)[0]));
  if (tr.bad.length) return { bad: tr.bad.map(x => `EDGE-SPLIT's files: ${x}`), refs };
  for (const a of ARMS.filter(x => x !== 'HYB')) { const t = tr.files[`S130 ${a}`]; refs[a] = t ? decodeP({ ...t.raw, fv: null, fx: null, fc: null }) : null; }
  const H = RE.hybFiles();
  if (H.bad.length) return { bad: H.bad, refs };
  const h = H.files['S130 HYB'];
  refs.HYB = h ? decodeP({ ...h, fv: null, fx: null, fc: null }) : null;
  return { bad: [], refs };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagpause'), npw = Number(args[1] || NPW), pts = args[2] || PTS;
  const logs = logsIn(DIR), units = Object.values(logs).flatMap(parse);
  if (!Object.keys(logs).length) { console.log(`GATE: FAILED - no logs in ${DIR}`); process.exit(1); }
  const PRE = process.argv.includes('--preflight');   // preflight-pause.sh: the gate, the files and the identity on a preflight's logs, stamped none; no figure is read
  if (!PRE) requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw }), files = {}, st = stampOf(Object.values(logs)[0]);
  if (!bad.length) for (const u of units.filter(x => !x.plant)) { const raw = readGz(join(DIR, u.trace.file)), t = raw ? decodeP(raw) : null; bad.push(...checkFile(t, u, st)); files[u.arm] = t; }
  if (!bad.length) {
    const R = await references();
    bad.push(...R.bad);
    if (!R.bad.length) for (const a of ARMS) bad.push(...identity(files[a], R.refs[a], a === 'HYB' ? 'HYB against HYB\'s file' : `${a} against EDGE-SPLIT's file`));
  }
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - 8 arms once and done at EDGE-SPLIT's unit; the sweep's self-check on every flat year; the identity, every year of the first ${npw} paths, against EDGE-SPLIT's files and HYB's (each through its own gate); planted: ${np} passed\n`);
  if (PRE) console.log('PREFLIGHT: the stamp check skipped; the reading below runs the code only - no figure is read\n');
  reading(files);
}
