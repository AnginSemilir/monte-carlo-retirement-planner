/*
 * PAUSE-S128'S REDUCER (predictions/measure-pause-s128.md, Kind: measurement; the deep review after PAUSE, deep-review-log.md
 * 6 Oct 01:52 UK: "Out of sample before it: a PAUSE sweep of SNAP, HYB and P-LO on S128's first 1000 paths with the
 * cell-inclusive first-fall figure registered unseen"). audit-pause.mjs with PAUSE_HH=S128, three parts of one arm each.
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs); a plant line refuses the logs; SNAP, P-LO and HYB once and done on
 *   S128, each ran line EDGE-SPLIT's unit with the arm's tables, read and segment (reduce-pause.mjs's ARM); one access line and
 *   one pathsum; the sweep's self-check passed on every flat year and run on more than nothing; every file present, stamped as
 *   the logs (reduce-pause.mjs checkFile); THE IDENTITY (rule 3): each arm's u, pension pot and other pots, every year of the
 *   first N paths, equal EDGE-SPLIT's S128 file for the arm (HYB: HYB's own S128 HYB arm), those files first through their gates.
 * THE REGISTERED FIGURES (HOLD-PRICE, the deep review's reading: each arm pauses just below the first point where its own read
 *   prices the allowance), per arm over its POST-ACCESS FLAT YEARS (u in [0.15, 0.99); no band is chosen):
 *   LOC   the share with u in the cell just below one of the arm's price points, [p - 0.05, p): SNAP and P-LO p = 0.75; HYB
 *         p = 0.25 or 0.75 (the snapped read's two edges on PCLSI's tables, which price the first half);
 *   FIRST the share whose first fall past the switch margin (1e-3), counted from u's own grid cell up, lies within 0.1 of u (the
 *         fixed move's read; derive-pause-review.mjs fallsFrom, copied).
 *   An arm with under 100 post-access flat years is not read. HELD: LOC and FIRST 0.75 or more on all three; FALSIFIED: either
 *   under 0.5 on any arm read; otherwise INCONCLUSIVE (a measurement: logged in the register, no default moves).
 *   node research/solver/reduce-pause128.mjs [dir] [paths] [points] > research/solver/results-pause128.txt   (--preflight, --planted)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { stampOf } from './reduce-adoptpi.mjs';
import { ARM, decodeP, checkFile, identity, BANDS } from './reduce-pause.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/measure-pause-s128.md';
export const HH = 'S128', ARMS = ['SNAP', 'P-LO', 'HYB'], PTS = '30', SEED = '7005', NPW = 1000, W = '0.02';
export const MARGIN = 1e-3, NEAR = 0.1, LO_U = 0.15, HI_U = 0.99, MIN_N = 100, HOLD = 0.75, FALL = 0.5;
export const PRICE = { SNAP: [0.75], 'P-LO': [0.75], HYB: [0.25, 0.75] };
const BASE = `OFF/PRODUCT/W${W}`;
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`), LBL = `(${esc(BASE)}\\/(?:${ARMS.map(esc).join('|')}))`;
const CASEL = new RegExp(`^${HH}\\s+case \\| unit ${LBL} \\| lambda (\\S+)$`);
const LINE = new RegExp(`^\\s+(ran|access|sum|sweep|trace) ${LBL}: (.*)$`), DONEL = new RegExp(`^\\s+done ${LBL}$`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const num = (s, k) => { const v = field(s, k); return v === null || v === '-' ? NaN : Number(v); };

// reduce-pause.mjs's parse, on S128's case lines and the three arms
export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if (/^plant: /.test(line)) us.push({ plant: line });
    if (/^S\d+\s+case \| /.test(line) && !CASEL.test(line)) { us.push({ stray: line.trim() }); cur = null; continue; }
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
  for (const u of units) if (u.stray) bad.push(`a case line that is not S128's three arms (${u.stray})`);
  const real = units.filter(u => !u.plant && !u.stray);
  for (const a of ARMS) { const n = real.filter(u => u.arm === a).length; if (n !== 1) bad.push(`${a}: ${n} unit lines, not 1`); }
  for (const u of real) {
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
      if (s.ok !== s.n) bad.push(`${u.arm}: the sweep's self-check failed on ${s.n - s.ok} of ${s.n} flat years`);
      if (s.flat !== s.n || s.points !== 21) bad.push(`${u.arm}: sweep flat ${s.flat} points ${s.points}, self-checked ${s.n}`);
    }
    if (u.trace.bad || u.trace.paths !== npw) bad.push(`${u.arm}: trace line ${u.trace.bad || `paths ${u.trace.paths}`}`);
  }
  if (new Set(real.filter(u => u.access).map(u => u.access)).size > 1) bad.push('the arms\' access lines differ');
  if (new Set(real.filter(u => u.sum).map(u => u.sum.pathsum)).size > 1) bad.push('the arms ran different paths');
  return bad;
}

// derive-pause-review.mjs's fallsFrom, copied (that script runs on import): the steps from u's own cell up - the steepest
// fall (its far end) and the first fall past the margin (its far end)
export function fallsFrom(row, G, u) {
  const ib = G.findIndex(g => g > u) - 1;
  let best = 0, bi = -1, fi = -1;
  for (let i = Math.max(0, ib); i + 1 < G.length; i++) { const d = row[i + 1] - row[i]; if (d < best) { best = d; bi = i; } if (fi < 0 && d < -MARGIN) fi = i; }
  return { ib, steep: bi < 0 ? NaN : G[bi + 1], first: fi < 0 ? NaN : G[fi + 1] };
}
export const inLoc = (a, u) => PRICE[a].some(p => u >= p - 0.05 - 1e-12 && u < p);
/* the registered figures of one arm's file: its post-access flat years, LOC and FIRST */
export function figures(t, a) {
  const G = t.ugrid, K = G.length; let n = 0, loc = 0, first = 0, found = 0;
  for (let k = 0; k < t.fu.length; k++) {
    const u = t.fu[k]; if (!(u >= LO_U && u < HI_U)) continue;
    n++; if (inLoc(a, u)) loc++;
    const r = fallsFrom(t.fx.subarray(k * K, (k + 1) * K), G, u);
    if (Number.isFinite(r.first)) { found++; if (r.first - u <= NEAR + 1e-12) first++; }
  }
  return { n, read: n >= MIN_N, loc: n ? loc / n : NaN, first: n ? first / n : NaN, found: n ? found / n : NaN };
}
export function verdict(F) {
  const rd = ARMS.filter(a => F[a].read);
  if (rd.some(a => F[a].loc < FALL || F[a].first < FALL)) return 'FALSIFIED';
  if (rd.length === ARMS.length && rd.every(a => F[a].loc >= HOLD && F[a].first >= HOLD)) return 'HELD';
  return 'INCONCLUSIVE';
}
export function reading(files, out = console.log) {
  const f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-');
  out(`PAUSE-S128 (S128, EDGE-SPLIT's unit, the first ${files[ARMS[0]].N} paths; registered unseen, predictions/measure-pause-s128.md): where SNAP, P-LO and HYB pause against the first point where their own read prices the allowance. A measurement: read against its registered figures and logged.`);
  out(`\n1. FLAT YEARS BY u'S BAND (pension live, u under 0.99), a path's mean: ${BANDS.map(b => b[0]).join(' / ')}`);
  for (const a of ARMS) { const t = files[a]; out(`  ${a.padEnd(6)} ${BANDS.map(([, lo, hi]) => (t.fu.filter(u => u >= lo && u < hi).length / t.N).toFixed(2)).join(' / ')}   all ${(t.fu.length / t.N).toFixed(2)}`); }
  out(`\n2. THE REGISTERED FIGURES, each arm's post-access flat years (u in [${LO_U}, ${HI_U})): LOC (u in the cell below a price point: SNAP and P-LO 0.75, HYB 0.25 or 0.75), FIRST (the first fall past ${MARGIN}, from u's own cell, within ${NEAR} of u; the fixed move)`);
  const F = {};
  for (const a of ARMS) { F[a] = figures(files[a], a); out(`  ${a.padEnd(6)} n ${String(F[a].n).padStart(5)}   LOC ${f3(F[a].loc)}   FIRST ${f3(F[a].first)}   (a first fall found on ${f3(F[a].found)})${F[a].read ? '' : `   NOT READ (under ${MIN_N} years)`}`); }
  out(`\nREADING (HELD: LOC and FIRST ${HOLD} or more on all three; FALSIFIED: either under ${FALL} on any arm read; else INCONCLUSIVE): ${verdict(F)}`);
  return F;
}

// PLANTED CHECKS (rule 6)
const EDGES = [];
function builtLog(o = {}) {
  const L = ['stamp: code abc audit def prediction none sha -'];
  if (o.plant) L.push('plant: scale');
  for (const a of ARMS) {
    if (o.drop === a) continue;
    const A = ARM[a], lb = `${BASE}/${a}`;
    L.push(`${o.hh === a ? 'S130' : HH}             case | unit ${lb} | lambda 0.02`);
    L.push(`                 ran ${lb}: mix 3 pts 30 seed 7005 paths 1000 grid total30x6x6 lambda 0.02 bequestWeight 0.02 finalIntegral true bridgeRead false switchMargin 0.001 pcls 0,0.5,1 tables ${A.tables} read ${A.read} seg ${o.seg === a ? 'hi' : A.seg} tieMargin 0 deathTax 0`);
    L.push(`                 access ${lb}: year 2 years 39 lsa 268275 open 2400000`);
    L.push(`                 sum ${lb}: paths 1000 survived 900 tax 1 net 2 pathsum ${o.paths === a ? 9 : 8}`);
    L.push(`                 sweep ${lb}: flat ${o.zero === a ? 0 : 5} points 21 repro ${o.fail === a ? 4 : o.zero === a ? 0 : 5}/${o.zero === a ? 0 : 5} secs 1`);
    L.push(`                 trace ${lb}: file x paths 1000 years 40`);
    L.push(`                 done ${lb}`);
  }
  return L.join('\n');
}
function planted() {
  const cases = [], G = Array.from({ length: 21 }, (_, i) => i / 20), K = G.length;
  const g = o => gate(parse(builtLog(o)));
  cases.push(['a clean log passes', g({}).length, 0]);
  cases.push(['a plant line refuses the logs', g({ plant: true }).some(x => /planted fault/.test(x)), true]);
  cases.push(['a missing arm refuses', g({ drop: 'HYB' }).some(x => /HYB: 0 unit lines/.test(x)), true]);
  cases.push(['an arm run on S130 refuses', g({ hh: 'P-LO' }).some(x => /not S128's three arms/.test(x)) && g({ hh: 'P-LO' }).some(x => /P-LO: 0 unit lines/.test(x)), true]);
  EDGES.push('an arm run on the wrong household');
  cases.push(['a wrong segment refuses', g({ seg: 'P-LO' }).some(x => /P-LO: ran seg hi/.test(x)), true]);
  cases.push(['a failed self-check refuses', g({ fail: 'SNAP' }).some(x => /self-check failed on 1 of 5/.test(x)), true]);
  cases.push(['a self-check run on nothing refuses', g({ zero: 'HYB' }).some(x => /ran on nothing/.test(x)), true]);
  EDGES.push('a self-check run on nothing');
  cases.push(['different paths refuse', g({ paths: 'SNAP' }).some(x => /different paths/.test(x)), true]);
  // fallsFrom: an edge in u's own cell is found; a gentle slope is no fall
  const edge = G.map(x => (x < 0.74 ? 1 - 1e-4 * x : 0.5)), a1 = fallsFrom(edge, G, 0.73), b1 = fallsFrom(G.map(x => 1 - 1e-4 * x), G, 0.3);
  cases.push(['an edge in u\'s own cell is the first fall; a gentle slope is none', `${a1.first} ${Number.isNaN(b1.first)}`, '0.75 true']);
  // LOC's bounds: 0.70 in, 0.75 out; HYB's lower cell
  cases.push(['LOC: 0.70 in, 0.6999 out, 0.75 out (SNAP); 0.2 in for HYB, not for P-LO', [inLoc('SNAP', 0.7), inLoc('SNAP', 0.6999), inLoc('SNAP', 0.75), inLoc('HYB', 0.2), inLoc('P-LO', 0.2)].join(' '), 'true false false true false']);
  EDGES.push('u exactly at a cell bound (0.70 in, 0.75 out)');
  // figures over a built file: four post-access years and one pre-access (not counted); the read falls at 0.75 by 0.5
  const mk = (fu, rows, N = 1) => ({ N, ugrid: G, fu, fx: Float64Array.from(rows.flat()) });
  const step = p => G.map(x => (x < p - 1e-9 ? 1 : 0.5));
  const T = mk([0.72, 0.65, 0.4, 0.62, 0.1], [step(0.75), step(0.75), step(0.75), G.map(() => 1), step(0.25)]);
  const F = figures(T, 'SNAP');
  cases.push(['figures: n 4 (u 0.1 not counted), LOC 1 of 4, FIRST 2 of 4 (0.72 and 0.65 within 0.1; 0.4 too far; a flat read none)', `${F.n} ${F.loc} ${F.first} ${F.found}`, '4 0.25 0.5 0.75']);
  EDGES.push('a pre-access year (not counted)', 'a flat read (no first fall)');
  const T2 = mk([0.6499999999999999], [step(0.75)]), T3 = mk([0.64], [step(0.75)]);   // 0.75 - 0.6499999999999999 is 0.1 plus a rounding error
  cases.push(['FIRST: a fall 0.1 ahead counts, to a rounding error (u 0.65 less one ulp, edge 0.75); 0.11 ahead does not', `${figures(T2, 'SNAP').first} ${figures(T3, 'SNAP').first}`, '1 0']);
  EDGES.push('a fall exactly 0.1 ahead');
  const tiny = mk([0.72], [G.map(x => (x < 0.75 ? 1 : 1 - 5e-4))]);
  cases.push(['a step under the margin is no first fall', figures(tiny, 'SNAP').found, 0]);
  // the verdict: all three 0.8 -> HELD; one under 0.5 -> FALSIFIED; an unread arm -> INCONCLUSIVE unless another falsifies
  const V = (x, y, z) => verdict({ SNAP: x, 'P-LO': y, HYB: z }), ok = { read: true, loc: 0.8, first: 0.8 };
  cases.push(['the verdict: all at 0.8 HELD', V(ok, ok, ok), 'HELD']);
  cases.push(['the verdict: FIRST 0.49 on one FALSIFIED', V(ok, { ...ok, first: 0.49 }, ok), 'FALSIFIED']);
  cases.push(['the verdict: LOC 0.6 on one INCONCLUSIVE', V(ok, ok, { ...ok, loc: 0.6 }), 'INCONCLUSIVE']);
  cases.push(['the verdict: LOC 0.49 on one FALSIFIED', V(ok, ok, { ...ok, loc: 0.49 }), 'FALSIFIED']);
  cases.push(['the verdict: exactly 0.75 HELD, exactly 0.5 not FALSIFIED', `${V({ ...ok, loc: 0.75 }, ok, ok)} ${V({ ...ok, loc: 0.5 }, ok, ok)}`, 'HELD INCONCLUSIVE']);
  cases.push(['the verdict: an arm not read (under 100 years) cannot be HELD and does not falsify', V(ok, { read: false, loc: 0, first: 0 }, ok), 'INCONCLUSIVE']);
  EDGES.push('a threshold value exactly (0.75, 0.5)', 'an arm under 100 years (not read)');
  const pre = figures(mk([], []), 'HYB');
  cases.push(['an arm with no post-access years: n 0, not read', `${pre.n} ${pre.read}`, '0 false']);
  // the reading's registered line and verdict line
  const files = { SNAP: { ...mk(Array(120).fill(0.72), Array(120).fill(step(0.75))) }, 'P-LO': mk(Array(120).fill(0.72), Array(120).fill(step(0.75))), HYB: mk([...Array(60).fill(0.22), ...Array(60).fill(0.66)], [...Array(60).fill(step(0.25)), ...Array(60).fill(step(0.75))]) };   // HYB: LOC 0.5 (0.66 is not in a cell below a price point), FIRST 1
  const lines = []; reading(files, x => lines.push(x));
  cases.push(['the reading: HYB\'s registered line and the verdict', `${lines.some(x => /^ {2}HYB +n {3}120 +LOC 0\.500 +FIRST 1\.000/.test(x))} ${lines.some(x => /^\nREADING .*: INCONCLUSIVE$/.test(x))}`, 'true true']);
  const fails = cases.filter(([, got, want]) => String(got) !== String(want));
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}

const logsIn = dir => (existsSync(dir) ? Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(dir, f), 'utf8')])) : {});
const readGz = f => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null);
/* EDGE-SPLIT's S128 files and HYB's S128 HYB arm, through their own gates (rule 3) */
async function references() {
  const RE = await import('./reduce-edge.mjs'), dir = join(HERE, 'results', 'diagedge'), logs = logsIn(dir), units = Object.values(logs).flatMap(RE.parse);
  requireFairLogs(logs, RE.PRED);
  const bad = RE.gate(units), refs = {};
  if (bad.length) return { bad: bad.map(x => `EDGE-SPLIT's files: ${x}`), refs };
  const tr = RE.loadTraces(units, dir, stampOf(Object.values(logs)[0]));
  if (tr.bad.length) return { bad: tr.bad.map(x => `EDGE-SPLIT's files: ${x}`), refs };
  for (const a of ['SNAP', 'P-LO']) { const t = tr.files[`${HH} ${a}`]; refs[a] = t ? decodeP({ ...t.raw, fv: null, fx: null, fc: null }) : null; }
  const H = RE.hybFiles();
  if (H.bad.length) return { bad: H.bad, refs };
  const h = H.files[`${HH} HYB`];
  refs.HYB = h ? decodeP({ ...h, fv: null, fx: null, fc: null }) : null;
  return { bad: [], refs };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagpause128'), npw = Number(args[1] || NPW), pts = args[2] || PTS;
  const logs = logsIn(DIR), units = Object.values(logs).flatMap(parse);
  if (!Object.keys(logs).length) { console.log(`GATE: FAILED - no logs in ${DIR}`); process.exit(1); }
  const PRE = process.argv.includes('--preflight');   // preflight-pause128.sh: the gate, the files and the identity on a preflight's logs, stamped none; no figure is read
  if (!PRE) requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw }), files = {}, st = stampOf(Object.values(logs)[0]);
  if (!bad.length) for (const u of units.filter(x => !x.plant)) { const raw = readGz(join(DIR, u.trace.file)), t = raw ? decodeP(raw) : null; bad.push(...checkFile(t, u, st)); if (t && t.id !== HH) bad.push(`${u.arm} file: household ${t.id}, not ${HH}`); files[u.arm] = t; }
  if (!bad.length) {
    const R = await references();
    bad.push(...R.bad);
    if (!R.bad.length) for (const a of ARMS) bad.push(...identity(files[a], R.refs[a], a === 'HYB' ? 'HYB against HYB\'s S128 file' : `${a} against EDGE-SPLIT's S128 file`));
  }
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - SNAP, P-LO and HYB once and done on S128 at EDGE-SPLIT's unit; the sweep's self-check on every flat year; the identity, every year of the first ${npw} paths, against EDGE-SPLIT's S128 files and HYB's (each through its own gate); planted: ${np} passed\n`);
  if (PRE) { console.log('PREFLIGHT: the stamp check skipped; no figure is read'); process.exit(0); }
  reading(files);
}
