/*
 * FORCE-X'S REDUCER (PLAN.md's FORCE-X; audit-forcex.mjs; predictions/diag-forcex.md). Five forced arms a household on S130
 * (deciding), S128 and S370 (reported), forward only, each against its unforced partner from EDGE-SPLIT's files (SNAP, S-INT,
 * P-LO, PCLSI) or HYB's (HYB), and PCLSI's unforced survival as the gap's far end.
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs); a plant line refuses the logs; 15 units once and done, each ran line
 *   EDGE-SPLIT's unit with the arm's tables, read, segment and price points; one access line and one pathsum a household; every
 *   file present, stamped as the logs, its survivors the sum line's; every force carried u to its price point or past it;
 *   ACTING: on S130 each deciding arm's force acts on half or more of its pause years (u in [0.15, 0.99)), else the run is
 *   refused (the deep review after PAUSE: "printed first and refused below half");
 *   THE IDENTITY (rule 3, a re-use of EDGE-SPLIT's and HYB's files): every path's u, pension pot and other pots equal its
 *   partner's in every year up to and including its first force (all years on a path never forced), and a path never forced
 *   ends as its partner did (survived, tax, net); the partner files first through their own gates.
 * ITEM 1 (primary; S130): per deciding arm a in SNAP, P-LO, HYB, paired by path: D = (a+X) - a and P = PCLSI - a in survival;
 *   R = sum D / sum P, the share of a's gap to PCLSI the force recovers. Two sign-flip tests (flipP, B 20,000, fixed seeds):
 *   LO, mean(D - 0.3 P) above 0 (R above 0.3); HI, mean(0.7 P - D) above 0 (R below 0.7); Holm over the six. An arm RECOVERS
 *   when LO shows and R >= 0.7, KEEPS when HI shows and R <= 0.3, else PARTIAL; NO GAP when sum P <= 0. HELD (LOSS-PAUSE) when
 *   all three RECOVER; FALSIFIED (LOSS-TABLES) when all three KEEP; else INCONCLUSIVE.
 * REPORTED (deciding nothing): the same on S128 and S370 at raw p; each forced arm's change against its partner in survival,
 *   tax and net (OPT: survival up and net down on every forced arm); S-INT+X's pause years after its first force within 0.05
 *   past 0.5 (HOLD-PRICE's own prediction: a slope still prices) against the edge arms' within 0.05 past their price point;
 *   PCLSI+X's acting share (the control).
 *   node research/solver/reduce-forcex.mjs [dir] [paths] [points] > research/solver/results-forcex.txt   (--preflight, --planted)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import { flipP } from './reduce-7ar.mjs';
import { decode, stampOf } from './reduce-adoptpi.mjs';
import { decodeP } from './reduce-pause.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-forcex.md';
export const PTS = '30', SEED = '7005', NPW = 6000, W = '0.02', B = 20000, ALPHA = 0.05;
export const PANEL = ['S130', 'S128', 'S370'], DECIDE = 'S130', DECIDING = ['SNAP+X', 'P-LO+X', 'HYB+X'];
export const ARMS = ['SNAP+X', 'S-INT+X', 'P-LO+X', 'HYB+X', 'PCLSI+X'];
// audit-forcex.mjs's ARM and PRICE, as the ran line prints them (its module runs on import)
export const ARM = { 'SNAP+X': { tables: 'SNAP', read: 'false', seg: 'none', price: '0.75', partner: 'SNAP' }, 'S-INT+X': { tables: 'SNAP', read: 'true', seg: 'none', price: '0.5', partner: 'S-INT' },
  'P-LO+X': { tables: 'PCLSI', read: 'true', seg: 'lo', price: '0.75', partner: 'P-LO' }, 'HYB+X': { tables: 'PCLSI', read: 'false', seg: 'none', price: '0.25,0.75', partner: 'HYB' }, 'PCLSI+X': { tables: 'PCLSI', read: 'true', seg: 'none', price: '0.25,0.75', partner: 'PCLSI' } };
export const LO = 0.3, HI = 0.7, ACT = 0.5, PAST = 0.05;
const BASE = `OFF/PRODUCT/W${W}`;
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`), LBL = `(${esc(BASE)}\\/(?:${ARMS.map(esc).join('|')}))`;
const CASEL = new RegExp(`^(${PANEL.join('|')})\\s+case \\| unit ${LBL} \\| lambda (\\S+)$`);
const LINE = new RegExp(`^\\s+(ran|access|sum|force|trace) ${LBL}: (.*)$`), DONEL = new RegExp(`^\\s+done ${LBL}$`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const num = (s, k) => { const v = field(s, k); return v === null || v === '-' ? NaN : Number(v); };
export const keyOf = u => `${u.id} ${u.arm}`;

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if (/^plant: /.test(line)) us.push({ plant: line });
    if ((m = CASEL.exec(line))) { cur = { id: m[1], arm: m[2].slice(m[2].lastIndexOf('/') + 1), label: m[2], done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = DONEL.exec(line))) { if (m[1] === cur.label) cur.done = true; continue; }
    if (!(m = LINE.exec(line)) || m[2] !== cur.label) continue;
    const [, kind, , s] = m;
    if (kind === 'ran') cur.ran = s;
    else if (kind === 'access') cur.access = s;
    else if (kind === 'sum') cur.sum = { paths: num(s, 'paths'), survived: num(s, 'survived'), tax: num(s, 'tax'), net: num(s, 'net'), pathsum: field(s, 'pathsum') };
    else if (kind === 'force') { const x = /^forced (\d+) carried (\d+) paths (\d+) pauses (\d+) acting (\d+)$/.exec(s); cur.force = x ? { forced: +x[1], carried: +x[2], paths: +x[3], pauses: +x[4], acting: +x[5] } : { bad: s }; }
    else if (kind === 'trace') { const x = /^file (\S+) paths (\d+) years (\d+)$/.exec(s); cur.trace = x ? { file: x[1], paths: +x[2], years: +x[3] } : { bad: s }; }
  }
  return us;
}

export function gate(units, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const u of units) if (u.plant) bad.push(`a planted fault in the logs (${u.plant})`);
  const real = units.filter(u => !u.plant);
  for (const id of PANEL) for (const a of ARMS) { const n = real.filter(u => u.id === id && u.arm === a).length; if (n !== 1) bad.push(`${id} ${a}: ${n} unit lines, not 1`); }
  for (const u of real) {
    const k = keyOf(u);
    if (!u.done) bad.push(`${k}: not done`);
    if (!u.ran || !u.access || !u.sum || !u.force || !u.trace) { bad.push(`${k}: a ran, access, sum, force or trace line missing`); continue; }
    const A = ARM[u.arm], want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, bridgeRead: 'false', switchMargin: '0.001', pcls: '0,0.5,1', mix: '3', tables: A.tables, read: A.read, seg: A.seg, deathTax: '0', price: A.price, cell: '0.05', past: '0.01' };
    for (const [f, v] of Object.entries(want)) if (field(u.ran, f) !== v) bad.push(`${k}: ran ${f} ${field(u.ran, f)}, not ${v}`);
    if (num(u.ran, 'tieMargin') !== 0) bad.push(`${k}: ran tieMargin ${field(u.ran, 'tieMargin')}, not 0`);
    if (u.sum.paths !== npw || !u.sum.pathsum) bad.push(`${k}: sum paths ${u.sum.paths} pathsum ${u.sum.pathsum}`);
    if (u.force.bad) bad.push(`${k}: force line ${u.force.bad}`);
    if (u.trace.bad || u.trace.paths !== npw) bad.push(`${k}: trace line ${u.trace.bad || `paths ${u.trace.paths}`}`);
  }
  for (const id of PANEL) {
    const h = real.filter(u => u.id === id);
    if (new Set(h.filter(u => u.access).map(u => u.access)).size > 1) bad.push(`${id}: the arms' access lines differ`);
    if (new Set(h.filter(u => u.sum).map(u => u.sum.pathsum)).size > 1) bad.push(`${id}: the arms ran different paths`);
  }
  // ACTING: the force must act on half or more of each deciding arm's pause years on S130
  for (const u of real.filter(x => x.id === DECIDE && DECIDING.includes(x.arm) && x.force && !x.force.bad)) {
    const f = u.force;
    if (!(f.pauses > 0)) bad.push(`${keyOf(u)}: no pause years (u 0.15 or more): the force has nothing to act on`);
    else if (f.acting / f.pauses < ACT) bad.push(`${keyOf(u)}: the force acts on ${f.acting} of ${f.pauses} pause years, under ${ACT} (refused)`);
  }
  return bad;
}

const bytes = s => { const x = Buffer.from(s, 'base64'); return x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength); };
const i16 = s => (s instanceof Int16Array ? s : new Int16Array(bytes(s)));
export const decodeX = t => ({ ...decodeP({ ...decode(t), fv: null, fx: null, fc: null }), first: i16(t.first) });
export function checkFile(t, u, st) {
  const k = `${keyOf(u)} file`;
  if (!t) return [`${k}: missing`];
  const bad = [], A = ARM[u.arm], years = Number((/ years (\d+) /.exec(u.access) || [])[1]) + 1;
  if (!st || !t.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => t.stamp[f] !== st[f])) bad.push(`${k}: its stamp is not the logs'`);
  if (t.plant) bad.push(`${k}: carries the plant ${t.plant}`);
  if (t.id !== u.id || t.arm !== u.arm || t.N !== u.sum.paths || t.Y !== years || t.tables !== A.tables || String(t.read) !== A.read || String(t.seg ?? 'none') !== A.seg || (t.price || []).join(',') !== A.price) bad.push(`${k}: id ${t.id} arm ${t.arm} tables ${t.tables} paths ${t.N} years ${t.Y}, not the unit's`);
  if (t.survived.length !== t.N || t.u.length !== t.N * t.Y || t.first.length !== t.N) { bad.push(`${k}: arrays of the wrong length`); return bad; }
  let s = 0; for (let j = 0; j < t.N; j++) s += t.survived[j];
  if (s !== u.sum.survived) bad.push(`${k}: ${s} survivors in the file, ${u.sum.survived} on the sum line`);
  if (t.xp.length !== u.force.forced || [t.xt, t.xu, t.xq, t.xn].some(a => a.length !== t.xp.length)) bad.push(`${k}: ${t.xp.length} forced years in the file, ${u.force.forced} on the force line`);
  const carried = t.xn.filter((v, i) => v !== null && v >= t.xq[i] - 1e-9).length, landed = t.xn.filter(v => v !== null).length;
  if (carried !== u.force.carried) bad.push(`${k}: ${carried} carried forces in the file, ${u.force.carried} on the force line`);
  if (carried !== landed) bad.push(`${k}: ${landed - carried} forces did not carry u to the price point`);
  return bad;
}
/* THE IDENTITY: the forced run against its partner, every year up to each path's first force, and never-forced paths' ends */
export function identity(t, ref, tag) {
  if (!ref) return [`identity ${tag}: the partner file missing`];
  if (ref.N !== t.N || ref.Y !== t.Y) return [`identity ${tag}: ${ref.N} paths and ${ref.Y} years in the partner, ${t.N} and ${t.Y} here`];
  let n = 0, cells = 0, ends = 0, endsBad = 0;
  for (let j = 0; j < t.N; j++) {
    const last = t.first[j] >= 0 ? t.first[j] : t.Y - 1;
    for (let y = 0; y <= last; y++) {
      const i = j * t.Y + y, a = [t.u[i], t.pen[i], t.non[i]], b = [ref.u[i], ref.pen[i], ref.non[i]];
      for (let q = 0; q < 3; q++) { if (Number.isNaN(a[q]) && Number.isNaN(b[q])) continue; cells++; if (a[q] !== b[q]) n++; }
    }
    if (t.first[j] < 0) { ends++; if (t.survived[j] !== ref.survived[j] || t.tax[j] !== ref.tax[j] || t.net[j] !== ref.net[j]) endsBad++; }
  }
  const bad = [];
  if (!(cells > 0)) bad.push(`identity ${tag}: compared nothing`);
  if (n) bad.push(`identity ${tag}: ${n} of ${cells} path-year values before the first force differ from the partner`);
  if (endsBad) bad.push(`identity ${tag}: ${endsBad} of ${ends} never-forced paths end differently from the partner`);
  return bad;
}

const sum = a => a.reduce((x, y) => x + y, 0), mean = a => (a.length ? sum(a) / a.length : NaN);
const se = a => { const m = mean(a); return a.length > 1 ? Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1) / a.length) : NaN; };
/* one arm's recovery on one household: X the forced arm's survived, A its partner's, P PCLSI's (per path) */
export function recovery(X, A, P) {
  const n = X.length, D = new Array(n), G = new Array(n);
  for (let j = 0; j < n; j++) { D[j] = X[j] - A[j]; G[j] = P[j] - A[j]; }
  const sD = sum(D), sG = sum(G);
  return { n, sD, sG, R: sG > 0 ? sD / sG : NaN, lo: D.map((d, j) => d - LO * G[j]), hi: D.map((d, j) => HI * G[j] - d) };
}
export const readArm = (r, pLo, pHi) => (!(r.sG > 0) ? 'NO GAP' : pLo < ALPHA && r.R >= HI ? 'RECOVERS' : pHi < ALPHA && r.R <= LO ? 'KEEPS' : 'PARTIAL');
export function item1(rs, { b = B } = {}) {
  const ps = rs.flatMap((r, i) => (r.sG > 0 ? [flipP(r.lo, b, 7301 + 2 * i), flipP(r.hi, b, 7302 + 2 * i)] : [1, 1]));
  const h = holm(ps);
  const reads = rs.map((r, i) => ({ ...r, pLo: h[2 * i], pHi: h[2 * i + 1], read: readArm(r, h[2 * i], h[2 * i + 1]) }));
  const v = reads.every(r => r.read === 'RECOVERS') ? 'HELD' : reads.every(r => r.read === 'KEEPS') ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { reads, v };
}
/* pause years after a path's first force, within PAST past the price point that force crossed */
export function rePause(t) {
  const byPath = new Map(); t.xp.forEach((j, i) => { if (!byPath.has(j)) byPath.set(j, { t: t.xt[i], p: t.xq[i] }); });
  let after = 0, near = 0;
  for (let i = 0; i < t.pp.length; i++) { const f = byPath.get(t.pp[i]); if (!f || t.pt[i] <= f.t) continue; after++; if (t.pu[i] >= f.p - 1e-12 && t.pu[i] < f.p + PAST) near++; }
  return { after, near, share: after ? near / after : NaN };
}

export function reading(files, refs, out = console.log, { b = B } = {}) {
  const f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-'), e = x => (Number.isFinite(x) ? x.toExponential(4) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
  const arr = x => Array.from(x);
  out(`FORCE-X (EDGE-SPLIT's unit, seed 7005, ${files[`${DECIDE} ${ARMS[0]}`].N} paths a household): each arm with the draw forced past its read's first price point, against the same arm unforced (EDGE-SPLIT's and HYB's files) and PCLSI unforced.`);
  out('\nTHE FORCE (each arm: forced years, the paths forced, the pause years with u 0.15 or more, the share the force acts on)');
  for (const id of PANEL) for (const a of ARMS) { const t = files[`${id} ${a}`], act = t.pf.filter((v, i) => v && t.pu[i] >= 0.15).length, pz = t.pu.filter(v => v >= 0.15).length; out(`  ${id.padEnd(5)} ${a.padEnd(8)} forced ${String(t.xp.length).padStart(6)}   paths ${String(arr(t.first).filter(v => v >= 0).length).padStart(5)}   pause years ${String(pz).padStart(6)}   acting ${f3(pz ? act / pz : NaN)}`); }
  const R = {};
  for (const id of PANEL) {
    const P = arr(refs[`${id} PCLSI`].survived), rs = DECIDING.map(a => recovery(arr(files[`${id} ${a}`].survived), arr(refs[`${id} ${ARM[a].partner}`].survived), P));
    R[id] = id === DECIDE ? item1(rs, { b }) : { reads: rs.map((r, i) => { const pLo = r.sG > 0 ? flipP(r.lo, b, 7401 + 2 * i) : 1, pHi = r.sG > 0 ? flipP(r.hi, b, 7402 + 2 * i) : 1; return { ...r, pLo, pHi, read: readArm(r, pLo, pHi) }; }) };
  }
  out(`\nITEM 1 (primary; ${DECIDE}): the share of each arm's survival gap to PCLSI the force recovers, R = sum((a+X) - a) / sum(PCLSI - a); LO mean(D - ${LO} P) above 0, HI mean(${HI} P - D) above 0, Holm over the six`);
  R[DECIDE].reads.forEach((r, i) => out(`  ${DECIDING[i].padEnd(8)} R ${f3(r.R)} (recovered ${r.sD} of a ${r.sG}-path gap)   Holm p LO ${r.pLo.toFixed(4)} HI ${r.pHi.toFixed(4)} -> ${r.read}`));
  out(`  -> ${R[DECIDE].v} (HELD, LOSS-PAUSE: all three RECOVER; FALSIFIED, LOSS-TABLES: all three KEEP; else INCONCLUSIVE)`);
  out('\nREPORTED (raw p, deciding nothing): the same on S128 and S370');
  for (const id of PANEL.filter(x => x !== DECIDE)) R[id].reads.forEach((r, i) => out(`  ${id.padEnd(5)} ${DECIDING[i].padEnd(8)} R ${f3(r.R)} (recovered ${r.sD} of a ${r.sG}-path gap)   p LO ${r.pLo.toFixed(4)} HI ${r.pHi.toFixed(4)} -> ${r.read}`));
  out('\nREPORTED: each forced arm against its partner, a path - survival (points), tax and net (se)');
  const opt = {};
  for (const id of PANEL) for (const a of ARMS) {
    const t = files[`${id} ${a}`], r = refs[`${id} ${ARM[a].partner}`], ds = arr(t.survived).map((v, j) => 100 * (v - r.survived[j])), dt = arr(t.tax).map((v, j) => v - r.tax[j]), dn = arr(t.net).map((v, j) => v - r.net[j]);
    out(`  ${id.padEnd(5)} ${a.padEnd(8)} survival ${f3(mean(ds))}   tax ${f2(mean(dt))} (${f2(se(dt))})   net ${f2(mean(dn))} (${f2(se(dn))})`);
    if (a !== 'PCLSI+X') (opt[id] = opt[id] || []).push(mean(ds) > 0 && mean(dn) < 0);
  }
  out(`  OPT (survival up and net down on every forced arm but the control): ${PANEL.map(id => `${id} ${opt[id].every(Boolean) ? 'yes' : 'no'}`).join(', ')}`);
  out(`\nREPORTED: pause years after a path's first force, the share within ${PAST} past the price point it crossed (HOLD-PRICE: S-INT+X re-pauses there, the edge arms draw on)`);
  for (const id of PANEL) out(`  ${id.padEnd(5)} ${ARMS.filter(a => a !== 'PCLSI+X').map(a => { const q = rePause(files[`${id} ${a}`]); return `${a} ${f3(q.share)} of ${q.after}`; }).join('   ')}`);
  out(`\nOUTCOME: 1 ${R[DECIDE].v}`);
  return R;
}

// PLANTED CHECKS (rule 6)
const EDGES = [];
function builtLog(o = {}) {
  const L = ['stamp: code abc audit def prediction none sha -'];
  if (o.plant) L.push('plant: leak');
  for (const id of PANEL) for (const a of ARMS) {
    if (o.drop === `${id} ${a}`) continue;
    const A = ARM[a], lb = `${BASE}/${a}`, k = `${id} ${a}`;
    L.push(`${id.padEnd(16)} case | unit ${lb} | lambda 0.02`);
    L.push(`                 ran ${lb}: mix 3 pts 30 seed 7005 paths 6000 grid total30x6x6 lambda 0.02 bequestWeight 0.02 finalIntegral true bridgeRead false switchMargin 0.001 pcls 0,0.5,1 tables ${A.tables} read ${A.read} seg ${A.seg} tieMargin 0 deathTax 0 price ${o.price === k ? '0.7' : A.price} cell 0.05 past 0.01`);
    L.push(`                 access ${lb}: year 2 years 39 lsa 268275 open 2400000`);
    L.push(`                 sum ${lb}: paths 6000 survived 5000 tax 1 net 2 pathsum ${o.paths === k ? 9 : 8}`);
    L.push(`                 force ${lb}: forced 100 carried 100 paths 90 pauses ${o.zero === k ? 0 : 200} acting ${o.act === k ? 99 : o.act100 === k ? 100 : 150}`);
    L.push(`                 trace ${lb}: file x paths 6000 years 40`);
    L.push(`                 done ${lb}`);
  }
  return L.join('\n');
}
function planted() {
  const cases = [], g = o => gate(parse(builtLog(o)));
  cases.push(['a clean log passes', g({}).length, 0]);
  cases.push(['a plant line refuses the logs', g({ plant: true }).some(x => /planted fault/.test(x)), true]);
  cases.push(['a missing unit refuses', g({ drop: 'S370 HYB+X' }).some(x => /S370 HYB\+X: 0 unit lines/.test(x)), true]);
  cases.push(['a wrong price point refuses', g({ price: 'S128 SNAP+X' }).some(x => /S128 SNAP\+X: ran price 0\.7, not 0\.75/.test(x)), true]);
  cases.push(['different paths on a household refuse', g({ paths: 'S128 P-LO+X' }).some(x => /S128: the arms ran different paths/.test(x)), true]);
  cases.push(['acting under half on S130 refuses', g({ act: 'S130 HYB+X' }).some(x => /acts on 99 of 200/.test(x)), true]);
  cases.push(['acting exactly half passes', g({ act100: 'S130 SNAP+X' }).length, 0]);
  cases.push(['acting under half off S130 or on the control is only reported', g({ act: 'S128 HYB+X' }).length + g({ act: 'S130 PCLSI+X' }).length, 0]);
  cases.push(['no pause years on a deciding arm refuses', g({ zero: 'S130 P-LO+X' }).some(x => /no pause years/.test(x)), true]);
  EDGES.push('acting exactly at the half', 'a deciding arm with no pause years');
  // the identity: equal up to the first force passes; a difference before it refuses; after it is allowed; a never-forced path's end must match
  const mk = (u, first, sv = [1, 1], N = 2, Y = 3) => ({ N, Y, u: Float32Array.from(u), pen: Float32Array.from(u), non: Float32Array.from(u), first: Int16Array.from(first), survived: Uint8Array.from(sv), tax: Float32Array.from([1, 1]), net: Float32Array.from([1, 1]) });
  const ref = mk([0.1, 0.2, 0.3, 0.1, 0.2, 0.3], [-1, -1]);
  cases.push(['the identity: equal arrays pass', identity(mk([0.1, 0.2, 0.3, 0.1, 0.2, 0.3], [-1, -1]), ref, 'x').length, 0]);
  cases.push(['the identity: a change after the first force is allowed', identity(mk([0.1, 0.2, 0.9, 0.1, 0.2, 0.3], [1, -1], [0, 1]), ref, 'x').length, 0]);
  cases.push(['the identity: a change at the first force\'s own year refuses (the state then is before the force)', identity(mk([0.1, 0.9, 0.3, 0.1, 0.2, 0.3], [1, -1]), ref, 'x').some(x => /3 of 15/.test(x)), true]);
  cases.push(['the identity: a never-forced path that ends differently refuses', identity(mk([0.1, 0.2, 0.3, 0.1, 0.2, 0.3], [-1, -1], [1, 0]), ref, 'x').some(x => /1 of 2 never-forced/.test(x)), true]);
  cases.push(['the identity: all NaN compares nothing and refuses', identity(mk(Array(6).fill(NaN), [-1, -1]), mk(Array(6).fill(NaN), [-1, -1]), 'x').some(x => /compared nothing/.test(x)), true]);
  EDGES.push('a difference in the first force\'s own year', 'an identity with every value missing');
  // recovery and the reading: full recovery, none, half; no gap
  const n = 400, A0 = Array(n).fill(0), Pg = Array.from({ length: n }, (_, j) => (j < 100 ? 1 : 0));
  const full = recovery(Pg, A0, Pg), none = recovery(A0, A0, Pg), half = recovery(Array.from({ length: n }, (_, j) => (j < 50 ? 1 : 0)), A0, Pg), nogap = recovery(A0, A0, A0);
  cases.push(['recovery: full 1, none 0, half 0.5, no gap NaN', `${full.R} ${none.R} ${half.R} ${Number.isNaN(nogap.R)}`, '1 0 0.5 true']);
  const I = item1([full, full, full], { b: 2000 }), K = item1([none, none, none], { b: 2000 }), M = item1([full, half, none], { b: 2000 }), Z = item1([full, full, nogap], { b: 2000 });
  cases.push(['item 1: all full HELD, all none FALSIFIED, mixed INCONCLUSIVE', `${I.v} ${K.v} ${M.v}`, 'HELD FALSIFIED INCONCLUSIVE']);
  cases.push(['item 1: the arms read RECOVERS, PARTIAL, KEEPS', M.reads.map(r => r.read).join(' '), 'RECOVERS PARTIAL KEEPS']);
  cases.push(['item 1: an arm with no gap reads NO GAP and blocks HELD', `${Z.reads[2].read} ${Z.v}`, 'NO GAP INCONCLUSIVE']);
  const neg = recovery(Pg, A0, A0.map((_, j) => (j < 100 ? -1 : 0)));
  cases.push(['recovery: PCLSI worse than the arm (a negative gap) gives no R', Number.isNaN(neg.R), true]);
  // R 0.75 on a 40-path gap: 30 recovered; significant against 0.3, not against 0.7 - the LO test is against 0.3
  const G40 = Array.from({ length: n }, (_, j) => (j < 40 ? 1 : 0)), X30 = Array.from({ length: n }, (_, j) => (j < 30 ? 1 : 0));
  cases.push(['item 1: R 0.75 on a 40-path gap RECOVERS (LO is tested against 0.3, the point against 0.7)', item1([recovery(X30, A0, G40), full, full], { b: 2000 }).reads[0].read, 'RECOVERS']);
  EDGES.push('a negative gap', 'R just above 0.7 on a small gap');
  cases.push(['readArm: R exactly 0.7 with LO shown RECOVERS; exactly 0.3 with HI shown KEEPS', `${readArm({ sG: 10, R: 0.7 }, 0.01, 0.5)} ${readArm({ sG: 10, R: 0.3 }, 0.5, 0.01)}`, 'RECOVERS KEEPS']);
  cases.push(['readArm: R 0.8 without LO shown is PARTIAL', readArm({ sG: 10, R: 0.8 }, 0.06, 0.5), 'PARTIAL']);
  EDGES.push('an arm with no gap to PCLSI', 'R exactly at 0.7 and 0.3');
  // re-pause: one path forced at year 5 across 0.5; later pauses at 0.52 (near) and 0.6 (not); one before the force not counted
  const T = { xp: [0], xt: [5], xq: [0.5], pp: [0, 0, 0, 1], pt: [3, 6, 7, 6], pu: [0.47, 0.52, 0.6, 0.52] };
  cases.push(['re-pause: of two pauses after the force, one within 0.05 past 0.5; a pause before it and an unforced path not counted', JSON.stringify(rePause(T)), '{"after":2,"near":1,"share":0.5}']);
  EDGES.push('a pause exactly at the price point (counted near)');
  cases.push(['re-pause: exactly at p counts, p + 0.05 does not', JSON.stringify(rePause({ xp: [0], xt: [1], xq: [0.75], pp: [0, 0], pt: [2, 3], pu: [0.75, 0.8] })), '{"after":2,"near":1,"share":0.5}']);
  const fails = cases.filter(([, got, want]) => String(got) !== String(want));
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}

const logsIn = dir => (existsSync(dir) ? Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(dir, f), 'utf8')])) : {});
const readGz = f => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null);
/* EDGE-SPLIT's files and HYB's, through their own gates (rule 3), decoded */
async function references() {
  const RE = await import('./reduce-edge.mjs'), dir = join(HERE, 'results', 'diagedge'), logs = logsIn(dir), units = Object.values(logs).flatMap(RE.parse);
  requireFairLogs(logs, RE.PRED);
  const bad = RE.gate(units), refs = {};
  if (bad.length) return { bad: bad.map(x => `EDGE-SPLIT's files: ${x}`), refs };
  const tr = RE.loadTraces(units, dir, stampOf(Object.values(logs)[0]));
  if (tr.bad.length) return { bad: tr.bad.map(x => `EDGE-SPLIT's files: ${x}`), refs };
  for (const id of PANEL) for (const a of ['SNAP', 'S-INT', 'P-LO', 'PCLSI']) { const t = tr.files[`${id} ${a}`]; refs[`${id} ${a}`] = t ? decodeP({ ...decode(t.raw), fv: null, fx: null, fc: null }) : null; }
  const H = RE.hybFiles();
  if (H.bad.length) return { bad: H.bad, refs };
  for (const id of PANEL) { const h = H.files[`${id} HYB`]; refs[`${id} HYB`] = h ? decodeP({ ...decode(h.raw || h), fv: null, fx: null, fc: null }) : null; }
  return { bad: [], refs };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nEDGES: ${EDGES.join(', ')}\nOUTCOMES REACHED: item 1: FALSIFIED, HELD, INCONCLUSIVE`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagforcex'), npw = Number(args[1] || NPW), pts = args[2] || PTS;
  const logs = logsIn(DIR), units = Object.values(logs).flatMap(parse);
  if (!Object.keys(logs).length) { console.log(`GATE: FAILED - no logs in ${DIR}`); process.exit(1); }
  const PRE = process.argv.includes('--preflight');   // preflight-forcex.sh: the gate, the files and the identity on a preflight's logs, stamped none; no figure is read
  if (!PRE) requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw }), files = {}, st = stampOf(Object.values(logs)[0]);
  if (!bad.length) for (const u of units.filter(x => !x.plant)) { const raw = readGz(join(DIR, u.trace.file)), t = raw ? decodeX(raw) : null; bad.push(...checkFile(t, u, st)); files[keyOf(u)] = t; }
  let refs = {};
  if (!bad.length) {
    const R = await references(); refs = R.refs;
    bad.push(...R.bad);
    if (!R.bad.length) for (const id of PANEL) for (const a of ARMS) bad.push(...identity(files[`${id} ${a}`], refs[`${id} ${ARM[a].partner}`], `${id} ${a} against ${ARM[a].partner}'s file`));
  }
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - 15 units once and done at EDGE-SPLIT's unit; every force carried u past its price point; the force acts on half or more of each deciding arm's pause years on S130; the identity, every year to each path's first force, against EDGE-SPLIT's and HYB's files (each through its own gate); planted: ${np} passed\n`);
  if (PRE) { console.log('PREFLIGHT: the stamp check skipped; no figure is read'); process.exit(0); }
  reading(files, refs);
}
