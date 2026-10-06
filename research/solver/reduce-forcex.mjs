/*
 * FORCE-X'S REDUCER (PLAN.md's FORCE-X; audit-forcex.mjs; predictions/diag-forcex.md), amended before launch on the deep
 * review after PAUSE-S128 (deep-review-log.md 6 Oct 04:34 UK). Four forced arms a household on S130 (deciding), S128 and S370
 * (reported), forward only, each against its unforced partner from EDGE-SPLIT's files (SNAP, P-LO, PCLSI) or HYB's (HYB), and
 * PCLSI's unforced survival as the gap's far end.
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs); a plant line refuses the logs; 12 units once and done, each ran line
 *   EDGE-SPLIT's unit with the arm's tables, read, segment and price points; one access line and one pathsum a household; every
 *   file present, stamped as the logs, its survivors the sum line's; every force carried u to its price point or past it;
 *   ACTING (from the unforced partners' files, FLAG 4: inside the forced run the force removes the holds it targets): of each
 *   deciding arm's S130 hold years (pension live, u in [0.15, 0.99), u growing by under 0.02), the share inside a force cell
 *   ([p - 0.10, p) with next year's u under p) - refused under a half;
 *   THE IDENTITY (rule 3, a re-use of EDGE-SPLIT's and HYB's files): every path's u, pension pot and other pots equal its
 *   partner's in every year up to and including its first force (all years on a path never forced), and a path never forced
 *   ends as its partner did (survived, tax, net); the partner files first through their own gates.
 * ITEM 1 (primary; S130): per deciding arm a in P-LO, HYB (PCLSI's tables: their gaps are the read's, FLAG 2), paired by
 *   path: D = (a+X) - a and P = PCLSI - a in survival; R = sum D / sum P, the share of a's gap to PCLSI the force recovers.
 *   Two sign-flip tests (flipP, B 20,000, fixed seeds): LO, mean(D - 0.3 P) above 0 (R above 0.3); HI, mean(0.7 P - D) above 0
 *   (R below 0.7); Holm over the four. An arm RECOVERS when LO shows and R >= 0.7, KEEPS when HI shows and R <= 0.3, else
 *   PARTIAL; NO GAP when sum P <= 0. HELD (LOSS-HOLD) when both RECOVER; FALSIFIED (LOSS-READ or the force's own cost - never
 *   the tables) when both KEEP; else INCONCLUSIVE.
 * REPORTED (deciding nothing): SNAP+X's R on every household at raw p (the tables' share); P-LO and HYB on S128 and S370 at raw
 *   p; each forced arm against its partner in survival, tax and net (OPT: survival up and net down on every forced arm but
 *   the control); on S130's saved paths (P = 1) the year each arm leaves PCLSI, its first force year and the other pots' gap
 *   to PCLSI at the force (FLAG 3); hold years after a path's first force within 0.05 past the price point it crossed.
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
export const PANEL = ['S130', 'S128', 'S370'], DECIDE = 'S130', DECIDING = ['P-LO+X', 'HYB+X'];
export const ARMS = ['SNAP+X', 'P-LO+X', 'HYB+X', 'PCLSI+X'];
// audit-forcex.mjs's ARM and PRICE, as the ran line prints them (its module runs on import)
export const ARM = { 'SNAP+X': { tables: 'SNAP', read: 'false', seg: 'none', price: '0.75', partner: 'SNAP' },
  'P-LO+X': { tables: 'PCLSI', read: 'true', seg: 'lo', price: '0.75', partner: 'P-LO' }, 'HYB+X': { tables: 'PCLSI', read: 'false', seg: 'none', price: '0.25,0.75', partner: 'HYB' }, 'PCLSI+X': { tables: 'PCLSI', read: 'true', seg: 'none', price: '0.25,0.75', partner: 'PCLSI' } };
export const LO = 0.3, HI = 0.7, ACT = 0.5, PAST = 0.05, CELL = 0.10, FLAT = 0.02, LIVE = 1e4;
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
    const A = ARM[u.arm], want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, bridgeRead: 'false', switchMargin: '0.001', pcls: '0,0.5,1', mix: '3', tables: A.tables, read: A.read, seg: A.seg, deathTax: '0', price: A.price, cell: '0.1', past: '0.01', flat: '0.02' };
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
  return bad;
}
/* ACTING, from an unforced partner's file: its hold years (pension live, u in [0.15, 0.99), next year's u growing by under
   FLAT) and those inside a force cell ([p - CELL, p) with next year's u still under p) */
export function actingFrom(ref, prices) {
  let holds = 0, inCell = 0;
  for (let j = 0; j < ref.N; j++) for (let y = 0; y + 1 < ref.Y; y++) {
    const i = j * ref.Y + y, u = ref.u[i], u1 = ref.u[i + 1];
    if (!(ref.pen[i] > LIVE) || !(u >= 0.15 && u < 0.99) || !(u1 - u < FLAT)) continue;
    holds++; if (prices.some(p => u >= p - CELL - 1e-6 && u < p && u1 < p)) inCell++;   // 1e-6: the files store u in Float32
  }
  return { holds, inCell, share: holds ? inCell / holds : NaN };
}
export function actingProblems(refs) {
  const bad = [];
  for (const a of DECIDING) {
    const ref = refs[`${DECIDE} ${ARM[a].partner}`]; if (!ref) { bad.push(`${DECIDE} ${a}: the partner file missing for the acting share`); continue; }
    const s = actingFrom(ref, ARM[a].price.split(',').map(Number));
    if (!(s.holds > 0)) bad.push(`${DECIDE} ${a}: no hold years in the partner's file: the force has nothing to act on`);
    else if (s.share < ACT) bad.push(`${DECIDE} ${a}: the force cells hold ${s.inCell} of the partner's ${s.holds} hold years, under ${ACT} (refused)`);
  }
  return bad;
}
/* on the paths PCLSI saves (P = 1): the year the arm's partner first differs from PCLSI, the forced arm's first force year, and
   the other pots' gap to PCLSI at that force (FLAG 3) - medians, and how many saved paths are forced at all */
export function divergence(t, ref, pc) {
  const med = a => { if (!a.length) return NaN; const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; };
  const lv = [], fy = [], gap = []; let saved = 0;
  for (let j = 0; j < t.N; j++) {
    if (!(pc.survived[j] === 1 && ref.survived[j] === 0)) continue;
    saved++;
    let d = -1; for (let y = 0; y < t.Y; y++) { const i = j * t.Y + y; if (ref.u[i] !== pc.u[i] || ref.pen[i] !== pc.pen[i] || ref.non[i] !== pc.non[i]) { d = y; break; } }
    if (d >= 0) lv.push(d);
    const f = t.first[j]; if (f >= 0) { fy.push(f); const i = j * t.Y + f; gap.push(t.non[i] - pc.non[i]); }
  }
  return { saved, forced: fy.length, leaves: med(lv), force: med(fy), gap: med(gap) };
}

const bytes = s => { const x = Buffer.from(s, 'base64'); return x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength); };
const i16 = s => (s instanceof Int16Array ? s : new Int16Array(bytes(s)));
export const decodeX = t => ({ ...decodeP({ ...decode(t), fv: null, fx: null, fc: null }), first: i16(t.first) });
/* the carry: a force carried u to its price point, or stopped short because it drew the whole pension pot (the next year's
   pension 0: no draw could carry it; a declared correction after launch, made on the gate's lines alone - predictions/diag-forcex.md,
   Changes after seeing results); any other force short of its point is a fault */
export function carry(t) {
  let carried = 0, emptied = 0, short = 0;
  t.xn.forEach((v, i) => {
    if (v === null) return;
    if (v >= t.xq[i] - 1e-9) { carried++; return; }
    const o = t.xp[i] * t.Y + t.xt[i] + 1;
    if (t.xt[i] + 1 < t.Y && t.pen[o] < 1) emptied++; else short++;
  });
  return { carried, emptied, short };
}
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
  const c = carry(t);
  if (c.carried !== u.force.carried) bad.push(`${k}: ${c.carried} carried forces in the file, ${u.force.carried} on the force line`);
  if (c.short) bad.push(`${k}: ${c.short} forces did not carry u to the price point with pension left to draw`);
  return bad;
}
/* the first n paths of a reference file (the preflight runs 20 paths against EDGE-SPLIT's 6,000: the plan-auditor's MINOR 7 of
   6 Oct on 39b2184); a file already n paths or fewer is returned as it is, so the real run's check stays exact */
export const headOf = (r, n) => (!r || !(r.N > n) ? r : { ...r, N: n, u: r.u.subarray(0, n * r.Y), pen: r.pen.subarray(0, n * r.Y), non: r.non.subarray(0, n * r.Y), survived: r.survived.subarray(0, n), tax: r.tax.subarray(0, n), net: r.net.subarray(0, n) });
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
  out(`FORCE-X (EDGE-SPLIT's unit, seed 7005, ${files[`${DECIDE} ${ARMS[0]}`].N} paths a household): each arm with the draw forced past its read's first price point at a would-be hold, against the same arm unforced (EDGE-SPLIT's and HYB's files) and PCLSI unforced.`);
  out(`\nTHE FORCE (each arm: forced years, the paths forced; ACTING from the unforced partner: its hold years, the share inside a force cell; the forced run's own hold years)`);
  for (const id of PANEL) for (const a of ARMS) { const t = files[`${id} ${a}`], s = actingFrom(refs[`${id} ${ARM[a].partner}`], ARM[a].price.split(',').map(Number)), pz = t.pu.filter(v => v >= 0.15).length; out(`  ${id.padEnd(5)} ${a.padEnd(8)} forced ${String(t.xp.length).padStart(6)}   paths ${String(arr(t.first).filter(v => v >= 0).length).padStart(5)}   partner holds ${String(s.holds).padStart(6)}   acting ${f3(s.share)}   forced run's holds ${String(pz).padStart(6)}   stopped by an emptied pot ${carry(t).emptied}`); }
  const R = {}, rec = (id, a) => recovery(arr(files[`${id} ${a}`].survived), arr(refs[`${id} ${ARM[a].partner}`].survived), arr(refs[`${id} PCLSI`].survived));
  const raw = (r, i, s) => { const pLo = r.sG > 0 ? flipP(r.lo, b, s + 2 * i) : 1, pHi = r.sG > 0 ? flipP(r.hi, b, s + 1 + 2 * i) : 1; return { ...r, pLo, pHi, read: readArm(r, pLo, pHi) }; };
  for (const id of PANEL) { const rs = DECIDING.map(a => rec(id, a)); R[id] = id === DECIDE ? item1(rs, { b }) : { reads: rs.map((r, i) => raw(r, i, 7401)) }; }
  out(`\nITEM 1 (primary; ${DECIDE}; P-LO and HYB, PCLSI's tables): the share of each arm's survival gap to PCLSI the force recovers, R = sum((a+X) - a) / sum(PCLSI - a); LO mean(D - ${LO} P) above 0, HI mean(${HI} P - D) above 0, Holm over the four`);
  R[DECIDE].reads.forEach((r, i) => out(`  ${DECIDING[i].padEnd(8)} R ${f3(r.R)} (recovered ${r.sD} of a ${r.sG}-path gap)   Holm p LO ${r.pLo.toFixed(4)} HI ${r.pHi.toFixed(4)} -> ${r.read}`));
  out(`  -> ${R[DECIDE].v} (HELD, LOSS-HOLD: both RECOVER; FALSIFIED, LOSS-READ or the force's own cost: both KEEP; else INCONCLUSIVE)`);
  out('\nREPORTED (raw p, deciding nothing): P-LO and HYB on S128 and S370; SNAP+X on every household (the tables\' share)');
  for (const id of PANEL.filter(x => x !== DECIDE)) R[id].reads.forEach((r, i) => out(`  ${id.padEnd(5)} ${DECIDING[i].padEnd(8)} R ${f3(r.R)} (recovered ${r.sD} of a ${r.sG}-path gap)   p LO ${r.pLo.toFixed(4)} HI ${r.pHi.toFixed(4)} -> ${r.read}`));
  for (const id of PANEL) { const r = raw(rec(id, 'SNAP+X'), 0, 7501); out(`  ${id.padEnd(5)} SNAP+X   R ${f3(r.R)} (recovered ${r.sD} of a ${r.sG}-path gap)   p LO ${r.pLo.toFixed(4)} HI ${r.pHi.toFixed(4)} -> ${r.read}`); }
  out('\nREPORTED: on S130\'s saved paths (PCLSI survives, the arm does not), the median year the arm leaves PCLSI, its median first force year, and the other pots\' median gap to PCLSI at the force');
  for (const a of ['SNAP+X', ...DECIDING]) { const d = divergence(files[`${DECIDE} ${a}`], refs[`${DECIDE} ${ARM[a].partner}`], refs[`${DECIDE} PCLSI`]); out(`  ${a.padEnd(8)} saved ${d.saved}, forced ${d.forced}   leaves PCLSI at year ${d.leaves}   first force at year ${d.force}   other pots' gap at the force ${f2(d.gap)}`); }
  out('\nREPORTED: each forced arm against its partner, a path - survival (points), tax and net (se)');
  const opt = {};
  for (const id of PANEL) for (const a of ARMS) {
    const t = files[`${id} ${a}`], r = refs[`${id} ${ARM[a].partner}`], ds = arr(t.survived).map((v, j) => 100 * (v - r.survived[j])), dt = arr(t.tax).map((v, j) => v - r.tax[j]), dn = arr(t.net).map((v, j) => v - r.net[j]);
    out(`  ${id.padEnd(5)} ${a.padEnd(8)} survival ${f3(mean(ds))}   tax ${f2(mean(dt))} (${f2(se(dt))})   net ${f2(mean(dn))} (${f2(se(dn))})`);
    if (a !== 'PCLSI+X') (opt[id] = opt[id] || []).push(mean(ds) > 0 && mean(dn) < 0);
  }
  out(`  OPT (survival up and net down on every forced arm but the control): ${PANEL.map(id => `${id} ${opt[id].every(Boolean) ? 'yes' : 'no'}`).join(', ')}`);
  out(`\nREPORTED: hold years after a path's first force, the share within ${PAST} past the price point it crossed (the edge arms should draw on)`);
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
    L.push(`                 ran ${lb}: mix 3 pts 30 seed 7005 paths 6000 grid total30x6x6 lambda 0.02 bequestWeight 0.02 finalIntegral true bridgeRead false switchMargin 0.001 pcls 0,0.5,1 tables ${A.tables} read ${A.read} seg ${A.seg} tieMargin 0 deathTax 0 price ${o.price === k ? '0.7' : A.price} cell 0.1 past 0.01 flat 0.02`);
    L.push(`                 access ${lb}: year 2 years 39 lsa 268275 open 2400000`);
    L.push(`                 sum ${lb}: paths 6000 survived 5000 tax 1 net 2 pathsum ${o.paths === k ? 9 : 8}`);
    L.push(`                 force ${lb}: forced 100 carried 100 paths 90 pauses 200 acting 150`);
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
  // ACTING from a partner's file: one path, years of u with the pension live; holds are years whose u grows by under 0.02
  const mkp = (u, pen = 5e4) => ({ N: 1, Y: u.length, u: Float32Array.from(u), pen: Float32Array.from(u.map(() => pen)), non: Float32Array.from(u.map(() => 0)) });
  // u 0.66 -> 0.6756 (an allowance-only draw, 0.0156: a hold) -> 0.6912 (a hold) -> 0.74 (growth 0.049: no hold) -> 0.755 (a hold, but it crosses 0.75: outside the cell)
  const A1 = actingFrom(mkp([0.66, 0.6756, 0.6912, 0.74, 0.755]), [0.75]);
  cases.push(['acting: an allowance-only year (u + 0.0156) is a hold; a hold whose next u crosses the price point is outside the cell', `${A1.holds} ${A1.inCell}`, '3 2']);
  const A2 = actingFrom(mkp([0.64, 0.645, 0.65]), [0.75]), A3 = actingFrom(mkp([0.65, 0.655, 0.66]), [0.75]);
  cases.push(['acting: u 0.65 (stored in Float32) is in the cell, 0.10 below 0.75; u 0.64 and 0.645 are not', `${A2.inCell} ${A3.inCell}`, '0 2']);
  const A4 = actingFrom(mkp([0.66, 0.665, 0.67], 5000), [0.75]), A5 = actingFrom(mkp([0.1, 0.105, 0.11]), [0.25]);
  cases.push(['acting: no hold with the pension under 10,000 or u under 0.15', `${A4.holds} ${A5.holds}`, '0 0']);
  const refOf = (u) => ({ [`S130 P-LO`]: mkp(u), [`S130 HYB`]: mkp(u) });
  cases.push(['acting a third refuses; exactly a half passes; no holds refuses', `${actingProblems(refOf([0.5, 0.505, 0.51, 0.66, 0.665])).length} ${actingProblems(refOf([0.5, 0.505, 0.66, 0.665])).length} ${actingProblems(refOf([0.2, 0.4, 0.6])).length}`, '2 0 2']);
  EDGES.push('an allowance-only hold (u growing 0.0156)', 'a hold exactly 0.10 below the price point', 'acting exactly at the half', 'a deciding arm with no hold years');
  // divergence: a path PCLSI saves and the arm loses, leaving PCLSI at year 1, forced at year 2 with the other pots 10 below PCLSI's
  {
    const P = { N: 2, Y: 3, survived: Uint8Array.from([1, 1]), u: Float32Array.from([0.1, 0.2, 0.3, 0.1, 0.2, 0.3]), pen: Float32Array.from([5, 5, 5, 5, 5, 5]), non: Float32Array.from([100, 100, 100, 100, 100, 100]) };
    const Rf = { ...P, survived: Uint8Array.from([0, 1]), u: Float32Array.from([0.1, 0.25, 0.3, 0.1, 0.2, 0.3]) };
    const T = { N: 2, Y: 3, first: Int16Array.from([2, -1]), non: Float32Array.from([100, 100, 90, 100, 100, 100]) };
    cases.push(['divergence: one saved path, leaving at year 1, forced at year 2, the other pots 10 behind; the path both survive not counted', JSON.stringify(divergence(T, Rf, P)), '{"saved":1,"forced":1,"leaves":1,"force":2,"gap":-10}']);
    EDGES.push('a saved path never forced (counted in saved, not forced)');
  }
  // the identity: equal up to the first force passes; a difference before it refuses; after it is allowed; a never-forced path's end must match
  const mk = (u, first, sv = [1, 1], N = 2, Y = 3) => ({ N, Y, u: Float32Array.from(u), pen: Float32Array.from(u), non: Float32Array.from(u), first: Int16Array.from(first), survived: Uint8Array.from(sv), tax: Float32Array.from([1, 1]), net: Float32Array.from([1, 1]) });
  const ref = mk([0.1, 0.2, 0.3, 0.1, 0.2, 0.3], [-1, -1]);
  cases.push(['the identity: equal arrays pass', identity(mk([0.1, 0.2, 0.3, 0.1, 0.2, 0.3], [-1, -1]), ref, 'x').length, 0]);
  cases.push(['the identity: a change after the first force is allowed', identity(mk([0.1, 0.2, 0.9, 0.1, 0.2, 0.3], [1, -1], [0, 1]), ref, 'x').length, 0]);
  cases.push(['the identity: a change at the first force\'s own year refuses (the state then is before the force)', identity(mk([0.1, 0.9, 0.3, 0.1, 0.2, 0.3], [1, -1]), ref, 'x').some(x => /3 of 15/.test(x)), true]);
  cases.push(['the identity: a never-forced path that ends differently refuses', identity(mk([0.1, 0.2, 0.3, 0.1, 0.2, 0.3], [-1, -1], [1, 0]), ref, 'x').some(x => /1 of 2 never-forced/.test(x)), true]);
  cases.push(['the identity: all NaN compares nothing and refuses', identity(mk(Array(6).fill(NaN), [-1, -1]), mk(Array(6).fill(NaN), [-1, -1]), 'x').some(x => /compared nothing/.test(x)), true]);
  const ref3 = mk([0.1, 0.2, 0.3, 0.1, 0.2, 0.3, 0.5, 0.5, 0.5], [-1, -1, -1], [1, 1, 0], 3); ref3.tax = Float32Array.from([1, 1, 7]); ref3.net = Float32Array.from([1, 1, 7]);
  cases.push(['the identity: a 2-path run against a 3-path reference refuses; against its first 2 paths (headOf) it passes; headOf leaves a 2-path file as it is', `${identity(ref, ref3, 'x').some(x => /3 paths/.test(x))} ${identity(ref, headOf(ref3, 2), 'x').length} ${headOf(ref, 2) === ref}`, 'true 0 true']);
  EDGES.push('a difference in the first force\'s own year', 'an identity with every value missing', 'a preflight run shorter than its reference');
  // the carry: path 0's force at year 0 reaches 0.75; path 1's stops at 0.70 with the pension emptied (0 the next year); path 0's
  // second force at year 1 stops at 0.72 with pension left (a fault); a force in the last year has no next value (not counted)
  {
    const C = carry({ Y: 3, xp: [0, 1, 0, 1], xt: [0, 0, 1, 2], xq: [0.75, 0.75, 0.75, 0.75], xn: [0.76, 0.70, 0.72, null], pen: Float32Array.from([9, 9, 5, 9, 0, 0]) });
    cases.push(['the carry: one carried, one stopped by an emptied pension pot, one short with pension left', JSON.stringify(C), '{"carried":1,"emptied":1,"short":1}']);
    EDGES.push('a force that empties the pension pot short of its price point');
  }
  // recovery and the reading: full recovery, none, half; no gap
  const n = 400, A0 = Array(n).fill(0), Pg = Array.from({ length: n }, (_, j) => (j < 100 ? 1 : 0));
  const full = recovery(Pg, A0, Pg), none = recovery(A0, A0, Pg), half = recovery(Array.from({ length: n }, (_, j) => (j < 50 ? 1 : 0)), A0, Pg), nogap = recovery(A0, A0, A0);
  cases.push(['recovery: full 1, none 0, half 0.5, no gap NaN', `${full.R} ${none.R} ${half.R} ${Number.isNaN(nogap.R)}`, '1 0 0.5 true']);
  const I = item1([full, full], { b: 2000 }), K = item1([none, none], { b: 2000 }), M = item1([full, half], { b: 2000 }), M2 = item1([half, none], { b: 2000 }), Z = item1([full, nogap], { b: 2000 });
  cases.push(['item 1 (two arms): both full HELD, both none FALSIFIED, one full one half INCONCLUSIVE', `${I.v} ${K.v} ${M.v}`, 'HELD FALSIFIED INCONCLUSIVE']);
  cases.push(['item 1: the arms read RECOVERS, PARTIAL; then PARTIAL, KEEPS (INCONCLUSIVE: one KEEPS does not falsify)', `${M.reads.map(r => r.read).join(' ')}; ${M2.reads.map(r => r.read).join(' ')} ${M2.v}`, 'RECOVERS PARTIAL; PARTIAL KEEPS INCONCLUSIVE']);
  cases.push(['item 1: an arm with no gap reads NO GAP and blocks HELD', `${Z.reads[1].read} ${Z.v}`, 'NO GAP INCONCLUSIVE']);
  const neg = recovery(Pg, A0, A0.map((_, j) => (j < 100 ? -1 : 0)));
  cases.push(['recovery: PCLSI worse than the arm (a negative gap) gives no R', Number.isNaN(neg.R), true]);
  // R 0.75 on a 40-path gap: 30 recovered; significant against 0.3, not against 0.7 - the LO test is against 0.3
  const G40 = Array.from({ length: n }, (_, j) => (j < 40 ? 1 : 0)), X30 = Array.from({ length: n }, (_, j) => (j < 30 ? 1 : 0));
  cases.push(['item 1: R 0.75 on a 40-path gap RECOVERS (LO is tested against 0.3, the point against 0.7)', item1([recovery(X30, A0, G40), full], { b: 2000 }).reads[0].read, 'RECOVERS']);
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
export async function references() {
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
    if (!R.bad.length) { for (const id of PANEL) for (const a of ARMS) { const t = files[`${id} ${a}`], r = refs[`${id} ${ARM[a].partner}`]; bad.push(...identity(t, PRE && t ? headOf(r, t.N) : r, `${id} ${a} against ${ARM[a].partner}'s file${PRE ? ' (its first paths)' : ''}`)); } bad.push(...actingProblems(refs)); }
  }
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - 12 units once and done at EDGE-SPLIT's unit; every force carried u past its price point or drew the whole pension pot; the force cells hold half or more of each deciding arm's S130 hold years (from its unforced partner); the identity, every year to each path's first force, against EDGE-SPLIT's and HYB's files (each through its own gate); planted: ${np} passed\n`);
  if (PRE) { console.log('PREFLIGHT: the stamp check skipped; no figure is read'); process.exit(0); }
  reading(files, refs);
}
