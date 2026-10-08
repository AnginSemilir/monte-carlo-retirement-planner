/*
 * NSB'S REDUCER (PLAN.md NSB; predictions/diag-nsb.md; the deep review after XAS-R2, deep-review-log.md 6 Oct 03:10 UK).
 * Reads results/diagnsb (audit-nsb.mjs: S370, bridge 4 and S126 deciding, S130 and S128 for incidence) and, behind the
 * gate, decides:
 *   ITEM 1 (F3-NSBLEND: the dead node's blend carries the bequest read's error in every bridge year). A CELL is a
 *     deciding household's reads in one arm and class - BASE in every reader year, COV in its non-step years (COV's step
 *     years carry the coverage node) - over the reads touching a dead node (wd > 0) whose arm's own move has a one-step
 *     bequest above 0; a cell COUNTS where its mean wd is above WD_MIN. Per path, r = the mean over the path's reads of
 *     |eb/bE + wd| (eb = bR - bE), and, in BASE's non-step reads, e = the mean of |eb/bE| and w = the mean of wd. Paired
 *     sign-flip tests (reduce-7ar.mjs flipP, B 20,000 from fixed seeds), one-sided: TOL (each counting cell): mean(TOL1 -
 *     r) above 0; QUART (each counting BASE non-step cell): mean(QUART1 w - e) above 0; Holm over all of them. HELD when
 *     every counting cell's TOL shows; FALSIFIED when every counting BASE non-step cell's QUART shows; else INCONCLUSIVE
 *     (and INCONCLUSIVE when no cell counts).
 *   ITEM 2 (decisions): under BASE, the share of states whose chosen move changes when the next year's dead nodes take the
 *     nearest live node's non-survival values, a census over the states the paths reach, per deciding household and year.
 *     HELD when S126's opening changes, or the share is CHANGE_HELD or more in some year with at least MIN_STATES states;
 *     FALSIFIED when S126's opening stays and every deciding household's every year is below CHANGE_FALS; else INCONCLUSIVE.
 *   ITEM 3 (YB2-REF against YB2-NODEQ): BASE on S370 in each year before a step (XAS-R2's years 2 and 6): per path D = the
 *     sum over the year's reads of (rr - ro) (what the menu-order reference removes) and P = the sum of (rr - ex5), each
 *     signed so that the year's sum of P is above 0; s = sum D / sum P. Tests LO, mean(D - LO3 P) above 0, and HI, mean(HI3
 *     P - D) above 0, Holm over the four. A year reads CONSTRUCT when s lies outside [S_MIN, S_MAX] (XAS-R's bounds), REF
 *     when LO shows and s >= HI3, NOTREF when HI shows and s <= LO3, else MID. HELD when both years read REF, FALSIFIED
 *     when both read NOTREF, else INCONCLUSIVE. Reported: the share NODEQ's 41-point nodes remove beyond vb ((vb - vb41) /
 *     P) and vb's own share (XAS-R2's); bridge 4 the same.
 *   THE GATE (NOT SETTLED if any fails): the fair-test gate on the logs (fair-gate.mjs requireFairLogs); the stamps (one
 *     code and audit across the run, the prediction the registered one, each file its log's); a plant line; a household
 *     missing, repeated or not done; an arm's settings not taking; a ran line off XAS's unit; a self-check failed, or run
 *     on nothing where it must run; a file missing, short or off its log's counts; and THE IDENTITY: on S370 and bridge 4,
 *     every item-3 read rr, ex5 and vb equal to XAS-R2's BASE read, ex5 and vb at the same path, world and year (XAS-R2's
 *     files through their own fair-test gate), so the derivation's records and NSB's reads are one construction.
 *   node research/solver/reduce-nsb.mjs [dir] [paths a world] [points] > research/solver/results-nsb.txt
 *   node research/solver/reduce-nsb.mjs --planted   the planted checks alone, the outcomes they reach and the EDGES
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import { flipP } from './reduce-7ar.mjs';
import { perPath, S_MIN, S_MAX } from './reduce-xasr.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-nsb.md', XPRED = 'research/solver/predictions/diag-xasr2.md';
export const PTS = '30', SEED = '7002', NPW = 2000, B = 20000, ALPHA = 0.05;
export const WD_MIN = 0.1, TOL1 = 0.05, QUART1 = 0.25, CHANGE_HELD = 0.01, CHANGE_FALS = 0.001, MIN_STATES = 100, LO3 = 0.2, HI3 = 0.5, IDT = 2e-12;
export const UNITS = ['S370', 'bridge 4', 'S126', 'S130', 'S128'], DECIDING = ['S370', 'bridge 4', 'S126'], IDENT = ['S370', 'bridge 4'], ARMS = ['BASE', 'COV'];
const L = 'READER/TS+J/W0.02/PCLSI';
const CHECKS = ['replicaNS', 'wdRead', 'deadTop', 'restore', 'replica', 'rebuild', 'nodes', 'fine'], MUST = ['replicaNS', 'wdRead', 'deadTop', 'restore'], MUST3 = ['replica', 'rebuild', 'nodes', 'fine'];
const fileOf = id => `${id.replace(/\s+/g, '_')}.json.gz`;
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const esc = s => s.replace(/[/+.]/g, m => `\\${m}`);
const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const f4 = x => (Number.isFinite(x) ? x.toExponential(4) : 'NaN');
const f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-');
const frac = s => { const m = /^(\d+)\/(\d+)$/.exec(s || ''); return m ? [Number(m[1]), Number(m[2])] : null; };

export function parse(text) {
  const us = []; let cur = null, stamp = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = /^stamp: (.*)$/.exec(line))) stamp = m[1];
    if (/^plant: /.test(line)) us.push({ plant: line });
    if ((m = /^(\S.*?)\s+case \| unit (\S+) \| /.exec(line))) { cur = { id: m[1].trim(), unit: m[2], stamp, solve: {}, item1: {}, item2: {}, checks: {}, done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = /^\s+solve (BASE|COV): (.*)$/.exec(line))) cur.solve[m[1]] = m[2];
    else if ((m = new RegExp(`^\\s+ran ${esc(L)}: (.*)$`).exec(line))) cur.ran = m[1];
    else if ((m = /^\s+item1 (BASE|COV): reads (\d+) withDead (\d+) /.exec(line))) cur.item1[m[1]] = { reads: Number(m[2]), dead: Number(m[3]) };
    else if ((m = /^\s+item2 (BASE|COV): states (\d+) changed (\d+) /.exec(line))) cur.item2[m[1]] = { states: Number(m[2]), changed: Number(m[3]) };
    else if ((m = /^\s+item3 BASE: reads (\d+) /.exec(line))) cur.item3 = { reads: Number(m[1]) };
    else if ((m = /^\s+checks (BASE|COV): (.*)$/.exec(line))) { const c = {}; for (const q of CHECKS) c[q] = frac(field(m[2], q)); cur.checks[m[1]] = c; }
    else if (new RegExp(`^\\s+done ${esc(L)} `).test(line)) cur.done = true;
  }
  return us;
}
const stampParts = s => ({ code: field(s || '', 'code'), audit: field(s || '', 'audit'), prediction: field(s || '', 'prediction') });
const okFrac = f => f && f[0] === f[1];
export function gate(units, { pts = PTS, npw = NPW, pred = PRED } = {}) {
  const bad = [];
  for (const u of units) if (u.plant) bad.push(`a planted fault in the logs (${u.plant})`);
  const real = units.filter(u => !u.plant);
  for (const id of UNITS) { const n = real.filter(u => u.id === id).length; if (n !== 1) bad.push(`${id}: ${n} unit lines, not 1`); }
  const st = real.map(u => stampParts(u.stamp));
  if (new Set(st.map(s => s.code)).size > 1 || new Set(st.map(s => s.audit)).size > 1) bad.push(`more than one code or audit version across the run (${[...new Set(st.map(s => `${s.code}/${s.audit}`))].join(', ')})`);
  for (const [i, u] of real.entries()) {
    const tag = u.id;
    if (!UNITS.includes(u.id)) { bad.push(`${tag}: not a registered household`); continue; }
    if (st[i].prediction !== pred) bad.push(`${tag}: stamped ${st[i].prediction}, not ${pred}`);
    if (u.unit !== L) bad.push(`${tag}: unit ${u.unit}, not ${L}`);
    if (!u.done) bad.push(`${tag}: not done`);
    for (const a of ARMS) if (!u.solve[a]) bad.push(`${tag}: no solve line for ${a}`);
    if (u.solve.BASE && (field(u.solve.BASE, 'readerTax') !== '-' || field(u.solve.BASE, 'coverage') !== '-')) bad.push(`${tag}: BASE ran with the reader's tax or coverage`);
    if (u.solve.COV && (field(u.solve.COV, 'readerTax') === '-' || field(u.solve.COV, 'coverage') === '-')) bad.push(`${tag}: COV ran without the reader's tax or coverage`);
    if (!u.ran) { bad.push(`${tag}: no ran line`); continue; }
    const want = { mix: '3', pts, seed: SEED, paths: String(3 * npw), worlds: '3' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    const before = (field(u.ran, 'before') || 'none').split(',').filter(x => x !== 'none').map(Number), want3 = before.some(t => t > 0);
    for (const a of ARMS) {
      const c = u.checks[a];
      if (!c || CHECKS.some(q => !c[q])) { bad.push(`${tag}: no checks line for ${a}`); continue; }
      for (const q of CHECKS) if (!okFrac(c[q])) bad.push(`${tag}: ${a}'s ${q} check failed (${c[q][1] - c[q][0]} of ${c[q][1]})`);
      for (const q of MUST) if (!(c[q][1] > 0)) bad.push(`${tag}: ${a}'s ${q} check ran on nothing`);
      if (a === 'BASE' && want3) for (const q of MUST3) if (!(c[q][1] > 0)) bad.push(`${tag}: BASE's ${q} check ran on nothing`);
      if (!u.item1[a] || !(u.item1[a].reads > 0)) bad.push(`${tag}: ${a}'s item1 line missing or on no reads`);
      if (!u.item2[a] || !(u.item2[a].states > 0)) bad.push(`${tag}: ${a}'s item2 line missing or on no states`);
    }
    if (want3 && !(u.item3 && u.item3.reads > 0)) bad.push(`${tag}: a year before a step after year 0, and no item3 reads`);
  }
  return bad;
}
// one household's file against its log
export function checkFile(t, u, npw = NPW) {
  const tag = `${u.id} file`, bad = [];
  if (!t) return [`${tag}: missing`];
  if (t.id !== u.id) bad.push(`${tag}: its id is ${t.id}`);
  if (!t.stamp || `code ${t.stamp.code} audit ${t.stamp.audit} prediction ${t.stamp.prediction} sha ${t.stamp.sha}` !== u.stamp) bad.push(`${tag}: its stamp is not its log's`);
  if (String(t.seed) !== SEED || t.npw !== npw) bad.push(`${tag}: seed ${t.seed} paths ${t.npw}`);
  const I1 = t.item1, n1 = I1 && Array.isArray(I1.t) ? I1.t.length : -1;
  if (!(n1 > 0) || ['k', 'p', 'step'].some(q => !Array.isArray(I1[q]) || I1[q].length !== n1)) bad.push(`${tag}: item 1's reads missing, empty or of unequal length`);
  else for (const a of ARMS) {
    const A = I1.arms && I1.arms[a];
    if (!A || ['top', 'wd', 'bR', 'bE', 'hR', 'hE', 'hD', 'agree'].some(q => !Array.isArray(A[q]) || A[q].length !== n1)) { bad.push(`${tag}: ${a}'s item 1 columns missing or of the wrong length`); continue; }
    if (A.bR.some(x => !Number.isFinite(x)) || A.hR.some(x => !Number.isFinite(x)) || A.wd.some(x => !(x >= 0 && x <= 1 + 1e-12))) bad.push(`${tag}: ${a}'s item 1 reads not all finite, or a dead weight outside [0, 1]`);
    if (u.item1[a] && u.item1[a].reads !== n1) bad.push(`${tag}: ${a}'s item1 line counts ${u.item1[a].reads}, the file ${n1}`);
  }
  const I2 = t.item2, n2 = I2 && Array.isArray(I2.s) ? I2.s.length : -1;
  if (!(n2 > 0)) bad.push(`${tag}: item 2's states missing`);
  else for (const a of ARMS) {
    const A = I2.arms && I2.arms[a];
    if (!A || !Array.isArray(A.a0) || !Array.isArray(A.a1) || A.a0.length !== n2 || A.a1.length !== n2) { bad.push(`${tag}: ${a}'s item 2 columns missing or of the wrong length`); continue; }
    const ch = A.a0.filter((x, j) => x !== A.a1[j]).length;
    if (u.item2[a] && (u.item2[a].states !== n2 || u.item2[a].changed !== ch)) bad.push(`${tag}: ${a}'s item2 line off the file`);
  }
  const I3 = t.item3, n3 = I3 && Array.isArray(I3.t) ? I3.t.length : 0;
  if (n3 && ['k', 'p', 'top', 'rr', 'ex5', 'ro', 'vb', 'vb41'].some(q => !Array.isArray(I3[q]) || I3[q].length !== n3)) bad.push(`${tag}: item 3's columns of unequal length`);
  if ((u.item3 ? u.item3.reads : 0) !== n3) bad.push(`${tag}: item 3's reads ${n3}, its log's ${u.item3 ? u.item3.reads : 0}`);
  return bad;
}
// THE IDENTITY: NSB's item-3 reads against XAS-R2's BASE reads, read for read
export function identity(t, x, tag) {
  const I = t && t.item3, X = x && x.arms && x.arms.BASE;
  if (!I || !X) return [`${tag}: no item-3 reads or no XAS-R2 file`];
  const n = I.t.length;
  if (n !== x.t.length) return [`${tag}: ${n} item-3 reads, XAS-R2's ${x.t.length}`];
  let off = 0, first = '';
  for (let j = 0; j < n; j++) {
    const same = I.p[j] === x.p[j] && I.t[j] === x.t[j] && I.k[j] === x.k[j] && Math.abs(I.rr[j] - X.read[j]) <= IDT && Math.abs(I.ex5[j] - X.ex5[j]) <= IDT && Math.abs(I.vb[j] - X.vb[j]) <= IDT;
    if (!same) { off++; if (!first) first = `read ${j}: path ${I.p[j]}/${x.p[j]} year ${I.t[j]}/${x.t[j]} rr ${I.rr[j]}/${X.read[j]} ex5 ${I.ex5[j]}/${X.ex5[j]} vb ${I.vb[j]}/${X.vb[j]}`; }
  }
  return off ? [`${tag}: ${off} of ${n} item-3 reads off XAS-R2's (${first})`] : [];
}

// ITEM 1
export function cellsOf(files) {
  const out = [];
  for (const id of DECIDING) {
    const t = files[id]; if (!t) continue;
    const I = t.item1;
    for (const [a, cls] of [['BASE', 'all'], ['BASE', 'nonstep'], ['COV', 'nonstep']]) {
      const A = I.arms[a], J = I.t.map((_, j) => j).filter(j => A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && (cls === 'all' || I.step[j] === 0));
      const mwd = mean(J.map(j => A.wd[j])), counts = J.length > 0 && mwd > WD_MIN;
      const cnt = perPath(I, J, () => 1), rel = j => (A.bR[j] - A.bE[j]) / A.bE[j];
      const r = perPath(I, J, j => Math.abs(rel(j) + A.wd[j])).map((x, i) => x / cnt[i]);
      const e = perPath(I, J, j => Math.abs(rel(j))).map((x, i) => x / cnt[i]), w = perPath(I, J, j => A.wd[j]).map((x, i) => x / cnt[i]);
      out.push({ id, a, cls, n: J.length, paths: cnt.length, counts, mwd, mr: mean(J.map(j => Math.abs(rel(j) + A.wd[j]))), me: mean(J.map(j => Math.abs(rel(j)))), mrel: mean(J.map(rel)),
        tol: r.map(x => TOL1 - x), quart: e.map((x, i) => QUART1 * w[i] - x), dropped: I.t.filter((_, j) => A.wd[j] > 0).length - J.length });
    }
  }
  return out;
}
export function item1(files) {
  // the BASE 'all' cells and COV's non-step cells decide HELD; BASE's non-step cells decide FALSIFIED
  const cells = cellsOf(files), heldCells = cells.filter(c => c.counts && (c.a === 'BASE' ? c.cls === 'all' : true)), falsCells = cells.filter(c => c.counts && c.a === 'BASE' && c.cls === 'nonstep');
  const tests = [...heldCells.map((c, i) => ({ c, k: 'tol', p: flipP(c.tol, B, 7201 + i) })), ...falsCells.map((c, i) => ({ c, k: 'quart', p: flipP(c.quart, B, 7301 + i) }))];
  const h = holm(tests.map(x => x.p)); tests.forEach((x, i) => { x.h = h[i]; x.c[`${x.k}P`] = h[i]; });
  const v = !heldCells.length ? 'INCONCLUSIVE' : heldCells.every(c => c.tolP < ALPHA) ? 'HELD' : falsCells.length && falsCells.every(c => c.quartP < ALPHA) ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { cells, v };
}
// ITEM 2
export function item2(files) {
  const rows = [];
  let opening = null;
  for (const id of DECIDING) {
    const t = files[id]; if (!t) continue;
    const I = t.item2, A = I.arms.BASE;
    for (const s of [...new Set(I.s)].sort((x, y) => x - y)) {
      const J = I.s.map((_, j) => j).filter(j => I.s[j] === s), ch = J.filter(j => A.a0[j] !== A.a1[j]).length;
      rows.push({ id, s, n: J.length, ch, share: J.length ? ch / J.length : 0, cov: J.filter(j => I.arms.COV.a0[j] !== I.arms.COV.a1[j]).length });
      if (id === 'S126' && s === 0) opening = { from: [...new Set(J.map(j => A.a0[j]))], to: [...new Set(J.map(j => A.a1[j]))], changed: ch > 0 };
    }
  }
  const held = (opening && opening.changed) || rows.some(r => r.n >= MIN_STATES && r.share >= CHANGE_HELD - 1e-12);
  const fals = opening && !opening.changed && rows.length > 0 && rows.every(r => r.share < CHANGE_FALS);
  return { rows, opening, v: held ? 'HELD' : fals ? 'FALSIFIED' : 'INCONCLUSIVE' };
}
// ITEM 3
export function yearsOf(t, x = 'ro') {
  const I = t.item3, years = [...new Set(I.t)].sort((a, b) => a - b);
  return years.map(y => {
    const J = I.t.map((_, j) => j).filter(j => I.t[j] === y);
    const D0 = perPath(I, J, j => I.rr[j] - I[x][j]), P0 = perPath(I, J, j => I.rr[j] - I.ex5[j]), sg = Math.sign(P0.reduce((s, v) => s + v, 0)) || 1;
    const D = D0.map(v => sg * v), P = P0.map(v => sg * v), sP = P.reduce((s, v) => s + v, 0), s = sP !== 0 ? D.reduce((q, v) => q + v, 0) / sP : NaN;
    const share = q => { const d = perPath(I, J, q).reduce((a, b) => a + b, 0); return sP !== 0 ? sg * d / sP : NaN; };
    return { y, n: J.length, paths: P.length, s, rep: mean(J.map(j => I.rr[j] - I.ex5[j])), lo: D.map((d, i) => d - LO3 * P[i]), hi: D.map((d, i) => HI3 * P[i] - d),
      sVb: share(j => I.rr[j] - I.vb[j]), sNq: share(j => I.vb[j] - I.vb41[j]), sVb41: share(j => I.rr[j] - I.vb41[j]) };
  });
}
export function item3(files) {
  const S = files.S370;
  if (!S || !S.item3 || !S.item3.t.length) return { per: [], v: 'INCONCLUSIVE' };
  const per = yearsOf(S), h = holm(per.flatMap((r, i) => [flipP(r.lo, B, 7401 + 2 * i), flipP(r.hi, B, 7402 + 2 * i)]));
  per.forEach((r, i) => { r.pLo = h[2 * i]; r.pHi = h[2 * i + 1]; r.read = !(r.s >= S_MIN && r.s <= S_MAX) ? 'CONSTRUCT' : r.pLo < ALPHA && r.s >= HI3 - 1e-12 ? 'REF' : r.pHi < ALPHA && r.s <= LO3 + 1e-12 ? 'NOTREF' : 'MID'; });
  return { per, v: per.length && per.every(r => r.read === 'REF') ? 'HELD' : per.length && per.every(r => r.read === 'NOTREF') ? 'FALSIFIED' : 'INCONCLUSIVE' };
}
export function reading(files, out = console.log) {
  const one = item1(files), two = item2(files), three = item3(files);
  out('\nITEM 1: THE DEAD NODE\'S BLEND IN THE BEQUEST READ (cells: a deciding household\'s reads touching a dead node, an arm and a class; counts when mean wd > ' + WD_MIN + '; r = |eb/bE + wd|, e = |eb/bE|)');
  for (const c of one.cells) out(`  ${c.id.padEnd(9)} ${c.a.padEnd(4)} ${c.cls.padEnd(7)} reads ${c.n} paths ${c.paths} mean wd ${f3(c.mwd)} mean eb/bE ${f3(c.mrel)} mean r ${f4(c.mr)} mean e ${f4(c.me)}${c.counts ? '' : ' (does not count)'}${c.tolP !== undefined ? ` TOL p ${c.tolP.toFixed(4)}` : ''}${c.quartP !== undefined ? ` QUART p ${c.quartP.toFixed(4)}` : ''}; failing moves left out ${c.dropped}`);
  for (const id of UNITS.filter(x => !DECIDING.includes(x))) { const t = files[id]; if (!t) continue; const I = t.item1; for (const a of ARMS) { const A = I.arms[a], J = I.t.map((_, j) => j).filter(j => A.wd[j] > 0); out(`  ${id.padEnd(9)} ${a.padEnd(4)} incidence: reads ${I.t.length}, touching a dead node ${J.length}, mean wd there ${f3(mean(J.map(j => A.wd[j])))}`); } }
  out('\nITEM 2: THE MOVES THE SWAP CHANGES (BASE; COV beside; a census over the states the paths reach)');
  for (const r of two.rows) out(`  ${r.id.padEnd(9)} year ${String(r.s).padStart(2)}: states ${r.n} changed ${r.ch} (${(100 * r.share).toFixed(2)}%); COV changed ${r.cov}`);
  out(`  S126's opening under BASE: ${two.opening ? `${two.opening.from.join(',')} -> ${two.opening.to.join(',')} (${two.opening.changed ? 'changed' : 'unchanged'})` : 'not read'}`);
  out('\nITEM 3: THE YEAR BEFORE A STEP, BASE (s: the share of rep the menu-order reference removes; vb, NODEQ and vb41 the same for the midpoint construct, its 41-point nodes beyond it, and both)');
  for (const id of ['S370', 'bridge 4']) { const t = files[id]; if (!t || !t.item3.t.length) continue; for (const r of yearsOf(t)) out(`  ${id.padEnd(9)} year ${r.y}: reads ${r.n} rep ${f4(r.rep)} s ${f3(r.s)} vb ${f3(r.sVb)} NODEQ ${f3(r.sNq)} vb41 ${f3(r.sVb41)}`); }
  for (const r of three.per) out(`  S370 year ${r.y}: LO p ${r.pLo.toFixed(4)} HI p ${r.pHi.toFixed(4)} -> ${r.read}`);
  out(`\nOUTCOME: 1 ${one.v}; 2 ${two.v}; 3 ${three.v}`);
  return { one, two, three };
}

// ---------- the planted checks ----------
function planted() {
  const msgs = [], reach = { 1: new Set(), 2: new Set(), 3: new Set() };
  const ok = (c, m) => { if (!c) throw new Error(m); msgs.push(m); };
  // a synthetic household: nP paths, reads at years ys, rel = eb/bE as a function of wd
  const rnd = (() => { let x = 12345; return () => ((x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 4294967296); })();
  const fake = (id, { wd = 0.3, rel = w => -w, cov = null, nP = 40, ys = [1, 2, 3], step = [2], ch = 0, chS = null, open = false, item3 = null } = {}) => {
    const I1 = { k: [], p: [], t: [], step: [], arms: { BASE: { top: [], wd: [], bR: [], bE: [], hR: [], hE: [], hD: [], agree: [] }, COV: { top: [], wd: [], bR: [], bE: [], hR: [], hE: [], hD: [], agree: [] } } };
    for (let p = 0; p < nP; p++) for (const y of ys) {
      I1.k.push(0); I1.p.push(p); I1.t.push(y); I1.step.push(step.includes(y) ? 1 : 0);
      for (const [a, f] of [['BASE', rel], ['COV', cov || rel]]) { const w = typeof wd === 'function' ? wd(y, a) : wd, bE = 100 + rnd(), A = I1.arms[a]; A.top.push(1); A.wd.push(w); A.bE.push(bE); A.bR.push(bE * (1 + f(w, y, p))); A.hR.push(1); A.hE.push(1); A.hD.push(0); A.agree.push(1); }
    }
    const I2 = { k: [], p: [], s: [], arms: { BASE: { a0: [], a1: [] }, COV: { a0: [], a1: [] } } };
    for (const s of [0, ...ys.slice(0, -1)]) for (let p = 0; p < 200; p++) {
      I2.k.push(0); I2.p.push(p); I2.s.push(s);
      const change = s === 0 ? open && id === 'S126' : p < Math.round((chS !== null && s === chS ? ch : 0) * 200);
      I2.arms.BASE.a0.push(2); I2.arms.BASE.a1.push(change ? 0 : 2); I2.arms.COV.a0.push(2); I2.arms.COV.a1.push(2);
    }
    const I3 = item3 || { k: [], p: [], t: [], top: [], rr: [], ex5: [], ro: [], vb: [], vb41: [] };
    return { id, stamp: { code: 'c', audit: 'a', prediction: PRED, sha: 's' }, seed: 7002, npw: NPW, item1: I1, item2: I2, item3: I3 };
  };
  // exact: every value a binary fraction (rep -2^-7 about 0.75, 64 paths), so a share at a threshold is exactly the threshold
  const y3 = (sOf, n = 60, exact = false) => { const I = { k: [], p: [], t: [], top: [], rr: [], ex5: [], ro: [], vb: [], vb41: [] }; const e0 = exact ? 0.75 : 0.9; for (const y of [2, 6]) for (let p = 0; p < (exact ? 64 : n); p++) { const rep = exact ? -0.0078125 : -0.006 * (0.5 + rnd()), s = sOf(y); I.k.push(0); I.p.push(p); I.t.push(y); I.top.push(1); I.ex5.push(e0); I.rr.push(e0 + rep); I.ro.push(e0 + rep - s * rep); I.vb.push(e0 + 0.875 * rep); I.vb41.push(e0 + 0.75 * rep); } return I; };
  const y3n = s0 => { const I = { k: [], p: [], t: [], top: [], rr: [], ex5: [], ro: [], vb: [], vb41: [] }; for (const y of [2, 6]) for (let p = 0; p < 60; p++) { const rep = -0.006, nz = p % 2 ? 0.05 : -0.05; I.k.push(0); I.p.push(p); I.t.push(y); I.top.push(1); I.ex5.push(0.9); I.rr.push(0.9 + rep); I.ro.push(0.9 + rep - s0 * rep + nz); I.vb.push(0.9 + 0.87 * rep); I.vb41.push(0.9 + 0.8 * rep); } return I; };
  const set = (o = {}) => Object.fromEntries(DECIDING.map(id => [id, fake(id, { ...o, ...(o.byId && o.byId[id] ? o.byId[id] : {}), item3: id === 'S370' ? (o.noisy3 !== undefined ? y3n(o.noisy3) : y3(o.s3 || (() => 0.6), 60, !!o.exact3)) : null })]));
  // item 1
  { const r = item1(set({ rel: w => -w + 0.01 })); ok(r.v === 'HELD', `item 1: the error -wd within 0.01 on every cell reads HELD (${r.v})`); reach[1].add(r.v); }
  { const r = item1(set({ rel: w => -0.02 * w, wd: (y, a) => (a === 'COV' && y === 2 ? 0 : 0.4) })); ok(r.v === 'FALSIFIED', `item 1: non-step errors a fiftieth of wd read FALSIFIED (${r.v})`); reach[1].add(r.v); }
  { const r = item1(set({ rel: w => -0.6 * w })); ok(r.v === 'INCONCLUSIVE', `item 1: errors 0.6 of wd read INCONCLUSIVE (${r.v})`); reach[1].add(r.v); }
  { const F = set({ wd: 0.1, rel: w => -w, nP: 4, ys: [1] }), c = cellsOf(F); ok(c.every(x => x.mwd === WD_MIN) && c.every(x => !x.counts) && item1(F).v === 'INCONCLUSIVE', `EDGE item 1: a mean wd of exactly ${WD_MIN} (exact in the plant: ${c.every(x => x.mwd === WD_MIN)}) does not count, and no counting cell reads INCONCLUSIVE (${item1(F).v})`); }
  { const r = item1(set({ rel: (w, y) => (y === 2 ? -w : -0.02 * w) })); ok(r.v === 'FALSIFIED', `item 1: the blend in the step year only (non-step errors a fiftieth of wd) reads FALSIFIED: the non-step cells read apart (${r.v})`); }
  { const r = item1(set({ rel: w => -0.4 * w })); ok(r.v === 'INCONCLUSIVE', `item 1: errors 0.4 of wd, between a quarter of wd and the blend, read INCONCLUSIVE (${r.v})`); }
  { const r = item1(set({ rel: w => -0.02 * w, byId: { 'bridge 4': { rel: w => -0.5 * w } } })); ok(r.v === 'INCONCLUSIVE', `item 1: one household's non-step errors half of wd keep the rest from FALSIFIED (${r.v})`); }
  { const r = item1(set({ rel: w => -w + TOL1 })); ok(r.v !== 'HELD', `EDGE item 1: r exactly at ${TOL1} on every read cannot read HELD (${r.v})`); }
  { const F = set({ rel: w => -w + 0.01 }); F.S370.item1.arms.BASE.bE[0] = NaN; F.S370.item1.arms.BASE.bE[1] = 0; const c = cellsOf(F).find(x => x.id === 'S370' && x.a === 'BASE' && x.cls === 'all'); ok(c.dropped === 2 && item1(F).v === 'HELD', `EDGE item 1: a failing move (NaN) and a one-step bequest of 0 are left out and counted (${c.dropped})`); }
  { const r = item1(set({ rel: w => -w + 0.01, cov: w => -0.6 * w })); ok(r.v === 'INCONCLUSIVE', `item 1: COV's non-step cells off the blend keep it from HELD (${r.v})`); }
  // item 2
  { const F = set({ open: true }), I = F.S126.item2, J = I.s.map((_, j) => j).filter(j => I.s[j] !== 0 || I.p[j] < 50); for (const q of ['k', 'p', 's']) I[q] = J.map(j => I[q][j]); for (const a of ARMS) for (const q of ['a0', 'a1']) I.arms[a][q] = J.map(j => I.arms[a][q][j]); const r = item2(F); ok(r.v === 'HELD' && r.opening.changed && r.rows.every(x => x.n < MIN_STATES || x.share < CHANGE_HELD), `item 2: S126's opening changed reads HELD on the opening alone (its 50 states under ${MIN_STATES}, every other share 0) (${r.v})`); reach[2].add(r.v); }
  { const r = item2(set({ ch: CHANGE_HELD, chS: 2 })); ok(r.v === 'HELD', `EDGE item 2: a share of exactly ${CHANGE_HELD} over 200 states reads HELD (${r.v})`); }
  { const r = item2(set({})); ok(r.v === 'FALSIFIED', `item 2: no change anywhere reads FALSIFIED (${r.v})`); reach[2].add(r.v); }
  { const r = item2(set({ ch: 0.005, chS: 2 })); ok(r.v === 'INCONCLUSIVE', `item 2: a share of 0.5% reads INCONCLUSIVE (${r.v})`); reach[2].add(r.v); }
  { const F = set({ ch: CHANGE_HELD, chS: 2 }); for (const id of DECIDING) { const I = F[id].item2, J = I.s.map((_, j) => j).filter(j => I.s[j] !== 2 || I.p[j] < 50); for (const q of ['k', 'p', 's']) I[q] = J.map(j => I[q][j]); for (const a of ARMS) for (const q of ['a0', 'a1']) I.arms[a][q] = J.map(j => I.arms[a][q][j]); } const r = item2(F); ok(r.v !== 'HELD', `EDGE item 2: a 1% share over fewer than ${MIN_STATES} states does not read HELD (${r.v})`); }
  // item 3
  { const r = item3(set({ s3: () => 0.7 })); ok(r.v === 'HELD', `item 3: the reference removing 0.7 of rep in both years reads HELD (${r.v})`); reach[3].add(r.v); }
  { const r = item3(set({ s3: () => 0.05 })); ok(r.v === 'FALSIFIED', `item 3: removing 0.05 in both years reads FALSIFIED (${r.v})`); reach[3].add(r.v); }
  { const r = item3(set({ s3: y => (y === 2 ? 0.7 : 0.05) })); ok(r.v === 'INCONCLUSIVE', `item 3: the years split reads INCONCLUSIVE (${r.v})`); reach[3].add(r.v); }
  { const r = item3(set({ noisy3: 0.15 })); ok(r.v === 'INCONCLUSIVE' && r.per.every(x => x.read === 'MID' && Math.abs(x.s - 0.15) < 1e-9), `item 3: s at 0.15 with noise the HI test cannot see past reads MID, not NOTREF (${r.per.map(x => `${x.read} ${f3(x.s)} p ${x.pHi.toFixed(3)}`).join(', ')})`); }
  { const r = item3(set({ s3: () => 1.5 })); ok(r.per.every(x => x.read === 'CONSTRUCT') && r.v === 'INCONCLUSIVE', `item 3: a share of 1.5, past S_MAX, reads CONSTRUCT (${r.per.map(x => x.read).join(',')})`); }
  { const r = item3(set({ s3: () => HI3, exact3: true })); ok(r.per.every(x => x.s === HI3 && x.read === 'REF'), `EDGE item 3: a share of exactly ${HI3} (exact in the plant: ${r.per.every(x => x.s === HI3)}) with LO shown reads REF (${r.per.map(x => x.read).join(',')})`); }
  { const r = item3(set({ s3: () => LO3, exact3: true })); ok(r.per.every(x => Math.abs(x.s - LO3) < 1e-13 && x.read === 'NOTREF'), `EDGE item 3: a share at ${LO3} to within 1e-13 (0.2 is no binary fraction; the rule's 1e-12 holds it at the line) with HI shown reads NOTREF (${r.per.map(x => x.read).join(',')})`); }
  { const F = set({ s3: () => 0.7 }), I = F.S370.item3; for (let j = 0; j < I.rr.length; j++) { const rep = I.rr[j] - I.ex5[j]; I.rr[j] = I.ex5[j] - rep; I.ro[j] = I.rr[j] - 0.7 * (-rep); } const r = item3(F); ok(r.v === 'HELD' && r.per.every(x => Math.abs(x.s - 0.7) < 1e-9), `EDGE item 3: an optimistic rep (above 0) reads by its own sign (${r.per.map(x => f3(x.s)).join(',')})`); }
  // the gate on the logs
  const log = (id, o = {}) => [`stamp: code ${o.code || 'c'} audit a prediction ${o.pred || PRED} sha s`, ...(o.plant ? ['plant: deadshift'] : []), `${id.padEnd(16)} case | unit ${o.unit || L} | lambda x`,
    `  solve BASE: secs 1 pts 30 shares 6 readerYears 3 readerTax - coverage -`, `  solve COV: secs 1 pts 30 shares 6 readerYears 3 readerTax ${o.tax || '1:2'} coverage {"nodes":1}`,
    `  ran ${L}: mix 3 pts ${o.pts || 30} seed 7002 paths 6000 worlds 3 steps 3 before ${o.before || '2'} readerYears 1,2,3`,
    ...ARMS.map(a => `  item1 ${a}: reads 10 withDead 5 top 5 across 0 wd x`), ...ARMS.map(a => `  item2 ${a}: states 10 changed 0 opening -`), ...(o.no3 ? [] : ['  item3 BASE: reads 6 top 6 rep x']),
    ...ARMS.map(a => `  checks ${a}: ${CHECKS.map(q => `${q} ${o.bad === `${a}.${q}` ? '4/5' : o.none === `${a}.${q}` ? '0/0' : '5/5'}`).join(' ')}`), ...(o.undone ? [] : [`  done ${L} rss 1MB`])].join('\n');
  const G = (o = {}, drop = null) => gate(UNITS.filter(id => id !== drop).flatMap(id => parse(log(id, o[id] || {}))));
  ok(G().length === 0, 'the gate passes five clean logs');
  const planted1 = [
    ['a household missing', G({}, 'S128')], ['a plant line', G({ S370: { plant: 1 } })], ['a household not done', G({ S126: { undone: 1 } })],
    ['another code in one log', G({ S130: { code: 'd' } })], ['another prediction', G({ S370: { pred: 'x.md' } })], ['another unit', G({ S370: { unit: 'X/Y' } })],
    ['COV without the reader\'s tax', G({ S370: { tax: '-' } })], ['a ran line at 20 points', G({ S370: { pts: 20 } })],
    ['a failed restore check', G({ S370: { bad: 'COV.restore' } })], ['a wdRead check on nothing', G({ S370: { none: 'BASE.wdRead' } })],
    ['a rebuild check on nothing where a year before a step follows year 0', G({ S370: { none: 'BASE.rebuild' } })], ['no item 3 reads where they are due', G({ S370: { no3: 1 } })]];
  for (const [m, b] of planted1) ok(b.length > 0, `planted: the gate refuses ${m}`);
  ok(G({ S126: { before: '0', no3: 1, none: 'BASE.rebuild' } }).length === 0, 'EDGE: a year before a step at year 0 alone (S126) needs no item 3 reads and no rebuild check');
  // the file checks and the identity
  const F = set({ rel: w => -w }), u = parse(log('S370'))[0], f0 = { ...F.S370, item1: { ...F.S370.item1 } };
  f0.stamp = { code: 'c', audit: 'a', prediction: PRED, sha: 's' };
  const uF = { ...u, item1: { BASE: { reads: f0.item1.t.length }, COV: { reads: f0.item1.t.length } }, item2: { BASE: { states: f0.item2.s.length, changed: 0 }, COV: { states: f0.item2.s.length, changed: 0 } }, item3: { reads: f0.item3.t.length } };
  ok(checkFile(f0, uF).length === 0, 'the file check passes a file that matches its log');
  ok(checkFile({ ...f0, stamp: { ...f0.stamp, audit: 'b' } }, uF).length > 0, 'planted: the file check refuses a file stamped by another audit');
  ok(checkFile(f0, { ...uF, item2: { ...uF.item2, BASE: { states: f0.item2.s.length, changed: 3 } } }).length > 0, 'planted: the file check refuses an item2 line off the file');
  { const g = JSON.parse(JSON.stringify(f0)); g.item1.arms.COV.wd[0] = 1.5; ok(checkFile(g, uF).length > 0, 'planted: the file check refuses a dead weight above 1'); }
  const X = { p: f0.item3.p, t: f0.item3.t, k: f0.item3.k, arms: { BASE: { read: f0.item3.rr.slice(), ex5: f0.item3.ex5.slice(), vb: f0.item3.vb.slice() } } };
  ok(identity(f0, X, 'S370').length === 0, 'the identity passes NSB\'s reads equal to XAS-R2\'s');
  { const Y = JSON.parse(JSON.stringify(X)); Y.arms.BASE.vb[3] += 1e-9; ok(identity(f0, Y, 'S370').length > 0, 'planted: the identity refuses one vb off by 1e-9'); }
  { const Y = JSON.parse(JSON.stringify(X)); Y.p = Y.p.slice(); [Y.p[0], Y.p[1]] = [Y.p[1], Y.p[0]]; ok(identity(f0, Y, 'S370').length > 0, 'planted: the identity refuses two reads swapped'); }
  { const Y = JSON.parse(JSON.stringify(X)); Y.arms.BASE.ex5[0] += 1.5 * IDT; ok(identity(f0, Y, 'S370').length > 0, `planted: the identity refuses one ex5 off by ${1.5 * IDT}, past its tolerance`); }
  { const Y = JSON.parse(JSON.stringify(X)); Y.arms.BASE.ex5[0] += IDT / 2; ok(identity(f0, Y, 'S370').length === 0, `EDGE: the identity allows ${IDT / 2}, half its tolerance (the files' 1e-12 rounding)`); }
  return Object.assign(msgs, { reach });
}

// ---------- the real read ----------
const logsOf = dir => Object.fromEntries((existsSync(dir) ? readdirSync(dir) : []).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(dir, f), 'utf8')]));
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let P0;
  try { P0 = planted(); } catch (e) { console.log(`PLANTED CHECK FAILED: ${e.message}`); process.exit(1); }
  if (process.argv.includes('--planted')) {
    P0.forEach(m => console.log(`ok   ${m}`));
    for (const k of [1, 2, 3]) console.log(`OUTCOMES REACHED: item ${k}: ${[...P0.reach[k]].sort().join(', ')}`);
    console.log(`EDGES: a mean dead weight of exactly ${WD_MIN}, r exactly at ${TOL1}, a failing move and a zero one-step bequest left out, a change share of exactly ${CHANGE_HELD} and the same over too few states, a share of exactly ${HI3}, an optimistic rep, a year before a step at year 0 alone, the identity at half its tolerance`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const dir = args[0] || join(HERE, 'results', 'diagnsb'), npw = args[1] ? Number(args[1]) : NPW, pts = args[2] || PTS, pre = process.argv.includes('--preflight');
  const logs = logsOf(dir);
  if (!Object.keys(logs).length) { console.log(`FAIR-TEST GATE: FAILED\n  no logs in ${dir}`); process.exit(1); }
  if (!pre) requireFairLogs(logs, PRED);
  const units = Object.values(logs).flatMap(parse), bad = gate(units, { pts, npw, pred: pre ? (stampParts(units[0] && units[0].stamp).prediction || PRED) : PRED });
  const files = {};
  for (const u of units.filter(x => !x.plant && UNITS.includes(x.id))) { const f = join(dir, fileOf(u.id)); files[u.id] = existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; bad.push(...checkFile(files[u.id], u, npw)); }
  if (!pre) {
    const xdir = join(HERE, 'results', 'diagxasr2'), xlogs = logsOf(xdir);
    try { requireFairLogs(xlogs, XPRED); } catch (e) { bad.push(`XAS-R2's files fail their own fair-test gate (${e.message})`); }
    for (const id of IDENT) { const f = join(xdir, fileOf(id)), x = existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; if (!x || !x.stamp || x.stamp.prediction !== XPRED) bad.push(`${id}: XAS-R2's file missing or not stamped by ${XPRED}`); else bad.push(...identity(files[id], x, id)); }
  }
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${UNITS.length} households once and done at XAS's unit, one code and audit, each file its log's; every self-check passed, and ran where it must, per arm${pre ? ' (the preflight: no identity, no outcome)' : `; THE IDENTITY: every item-3 read, ex5 and vb on ${IDENT.join(' and ')} is XAS-R2's at the same path, world and year (XAS-R2's files through their own gate)`}`);
  console.log(`planted checks: ${P0.length}`);
  if (pre) { console.log('the preflight reads no figure'); process.exit(0); }
  reading(files);
}
