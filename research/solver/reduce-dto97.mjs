/*
 * DT-O97'S REDUCER (PLAN.md DT-O97; audit-dto97.mjs; predictions/diag-dto97.md). A TEST: is O97's lucky-tail loss under
 * PCLSI death tax 0's? ADOPT-PI's unit at a pension death tax of 40% on O97's seven loss households, both allowance axes,
 * each path paired with ADOPT-PI's death-tax-0 files for the same household (the same seed, the same paths).
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs against predictions/diag-dto97.md); 14 units (7 households x 2 arms)
 *   each once and done; each ran line the shipping default's (no reader, 30 points, seed 7005, 6,000 paths, the estate
 *   weight 0.02, the switch margin 0.001, buckets 0,0.5,1) with its arm's interpolation and the death tax 0.4; a household's
 *   two units one access line and one pathsum; every per-path file present, stamped as the logs, its paths, years, survivors
 *   and means the sum line's (reduce-adoptpi.mjs checkTrace);
 *   THE PAIRING WITH ADOPT-PI (rule 3, a re-use of ADOPT-PI's files): ADOPT-PI's files first through their own gate; each
 *   household's DT-O97 units carry the pathsum and the access line of its ADOPT-PI units, and its files the same paths and
 *   years.
 * ITEM 1 (primary; survival at 0.4): ADOPT-PI's rule - per household the paired change PCLSI less SNAP, b lost and c saved,
 *   stats.mjs outcome() at the household's margin (marginFor), harm's exact McNemar p Holm over the 7; the floor, the cells
 *   summed over the 7, by the unconditional interval (pooledSummed) against MARGINS.pooled (0.1 points). HELD when no
 *   household reads harm and the floor's lower end is above minus the margin; FALSIFIED when any household reads harm or
 *   the floor's upper end is below minus the margin; else INCONCLUSIVE.
 * ITEM 2 (primary; the net loss at 0.4 against 0): per household and path, d0 = PCLSI - SNAP in terminal net at death tax 0
 *   (ADOPT-PI's files) and d4 the same at 0.4 (this run's); the kept share k = mean(d4) / mean(d0). A household with
 *   mean(d0) >= 0 reads NO LOSS. Two sign-flip tests a household (reduce-7ar.mjs flipP, B 20,000, fixed seeds), Holm over
 *   the 14: DT, mean(d4 - 0.25 d0) above 0 (k under a quarter, a sign flip included); TAIL, mean(0.5 d0 - d4) above 0
 *   (k over a half). HELD (DT: the loss is death tax 0's) when 5 or more of the 7 read DT; FALSIFIED (TAIL: the loss
 *   survives the death tax) when 5 or more read TAIL; else INCONCLUSIVE.
 * REPORTED (deciding nothing): per household the tax change at 0 and 0.4 and at 0.4 with the death charge (0.4 x the
 *   pension at a path's last year); the review's revaluation of the 0 files at 0.4 with the policy held (net less 0.4 x the
 *   last pension) against the re-solved change; the hold (reduce-adoptpi.mjs hold) in both arms at both rates.
 *   node research/solver/reduce-dto97.mjs [dir] [paths] [points] > research/solver/results-dto97.txt   (--preflight, --planted)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { outcome, mcnemarHarmP, holm, marginFor, survivalChange, pooledSummed, MARGINS } from './stats.mjs';
import { flipP } from './reduce-7ar.mjs';
import * as RA from './reduce-adoptpi.mjs';
import { decodeP } from './reduce-pause.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-dto97.md';
export const PTS = '30', SEED = '7005', NPW = 6000, W = '0.02', DT_RATE = '0.4', DT = 0.4;
export const PANEL = ['share 0.70', 'share 0.90', 'share 0.95', 'bridge 0', 'bridge 1', 'bridge 4+cost', 'S366'];
export const ARMS = { SNAP: 'false', PCLSI: 'true' };
export const KEEP_DT = 0.25, KEEP_TAIL = 0.5, NEED = 5, B = 20000, ALPHA = 0.05;
export const UNIT_KEYS = PANEL.flatMap(id => Object.keys(ARMS).map(a => `${id} DT ${a}`));
const { parse, keyOf, paired, hold } = RA;
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };

export function gate(units, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const k of UNIT_KEYS) { const n = units.filter(u => keyOf(u) === k).length; if (n !== 1) bad.push(`${k}: ${n} unit lines, not 1`); }
  for (const u of units) {
    const tag = keyOf(u);
    if (!UNIT_KEYS.includes(tag)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${tag}: not done`);
    if (!u.ran || !u.access || !u.sum || !u.trace) { bad.push(`${tag}: a ran, access, sum or trace line missing`); continue; }
    const want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, bridgeRead: 'false', switchMargin: '0.001', pcls: '0,0.5,1', pclsInterp: ARMS[u.arm], mix: '3', deathTax: DT_RATE };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    const s = u.sum;
    if (s.paths !== npw || !(Number.isInteger(s.survived) && s.survived >= 0 && s.survived <= s.paths) || !Number.isFinite(s.tax) || !Number.isFinite(s.net) || !s.pathsum) bad.push(`${tag}: sum paths ${s.paths} survived ${s.survived} tax ${s.tax} net ${s.net} pathsum ${s.pathsum}`);
    if (u.trace.bad || u.trace.paths !== npw) bad.push(`${tag}: trace line ${u.trace.bad || `paths ${u.trace.paths}`}`);
  }
  for (const id of PANEL) {
    const us = units.filter(u => u.id === id && u.sum);
    if (new Set(us.map(u => u.access)).size > 1) bad.push(`${id}: its units' access lines differ`);
    if (new Set(us.map(u => u.sum.pathsum)).size > 1) bad.push(`${id}: its units ran different paths`);
  }
  return bad;
}
/* THE PAIRING WITH ADOPT-PI: each household's units against ADOPT-PI's death-tax-0 units (refUnits) and files */
export function pairing(units, refUnits, files = null, refFiles = null, { paths = true } = {}) {
  const bad = [];
  for (const id of PANEL) {
    const mine = units.filter(u => u.id === id && u.sum), ref = refUnits.filter(u => u.id === id && !u.dt && u.sum);
    if (ref.length !== 2) { bad.push(`${id}: ${ref.length} ADOPT-PI death-tax-0 units, not 2`); continue; }
    const ps = new Set([...mine, ...ref].map(u => u.sum.pathsum)), ac = new Set([...mine, ...ref].map(u => u.access));
    if (paths && ps.size !== 1) bad.push(`${id}: not ADOPT-PI's paths (pathsum ${[...ps].join(', ')})`);
    if (ac.size !== 1) bad.push(`${id}: its access line is not ADOPT-PI's`);
    if (files && refFiles) for (const a of Object.keys(ARMS)) {
      const t = files[`${id} DT ${a}`], r = refFiles[`${id} ${a}`];
      if (!t || !r) bad.push(`${id} ${a}: a file missing for the pairing`);
      else if (t.N !== r.N || t.Y !== r.Y) bad.push(`${id} ${a}: ${t.N} paths and ${t.Y} years, ADOPT-PI's ${r.N} and ${r.Y}`);
    }
  }
  return bad;
}

/* ADOPT-PI's loader decodes survival, tax, net and u only; the pension and other-pots traces are decoded here (the same pattern
   as EDGE-SPLIT's undecoded HYB pension trace, deep-review-log.md 5 Oct 16:36 UK), and a file whose pension trace is not a whole
   decoded array is refused */
export const full = t => (t ? decodeP({ ...t, fv: null, fx: null, fc: null }) : t);
export function decodedProblems(files) {
  const bad = [];
  for (const [k, t] of Object.entries(files)) if (!t || !(t.pen instanceof Float32Array) || t.pen.length !== t.N * t.Y) bad.push(`${k}: its pension trace is not a whole decoded array`);
  return bad;
}
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
/* ITEM 1: survival at 0.4, ADOPT-PI's rule over the 7 (pairs: id -> paired(SNAP, PCLSI)) */
export function item1(pairs) {
  const ids = PANEL.filter(id => pairs[id]);
  const ph = holm(ids.map(id => mcnemarHarmP(pairs[id].b, pairs[id].c)));
  const one = ids.map((id, i) => { const p = pairs[id], margin = marginFor(100 * p.snap); return { id, margin, pHolm: ph[i], ...outcome({ b: p.b, c: p.c, N: p.N, margin, pHolm: ph[i] }) }; });
  const ps = pooledSummed(ids.map(id => ({ a: pairs[id].a, lost: pairs[id].b, saved: pairs[id].c, d: pairs[id].d })));
  const pool = { b: ps.cells.lost, c: ps.cells.saved, N: ps.N, k: ids.length, margin: MARGINS.pooled, d: ps.d, lo: ps.lo, hi: ps.hi, x: survivalChange(ps.cells.lost, ps.cells.saved, ps.N) };
  const v = ids.length !== PANEL.length ? 'NOT READ' : one.some(r => r.outcome === 'harm') || pool.hi < -pool.margin ? 'FALSIFIED' : pool.lo > -pool.margin ? 'HELD' : 'INCONCLUSIVE';
  return { one, pool, v };
}
/* ITEM 2: rows [{ id, d0, d4 }] (per-path PCLSI - SNAP in terminal net at 0 and at 0.4) */
export function item2(rows, { b = B } = {}) {
  const ps = rows.flatMap((r, i) => {
    if (!(mean(r.d0) < 0)) return [1, 1];
    return [flipP(r.d4.map((x, j) => x - KEEP_DT * r.d0[j]), b, 7701 + 2 * i), flipP(r.d0.map((x, j) => KEEP_TAIL * x - r.d4[j]), b, 7702 + 2 * i)];
  });
  const h = holm(ps);
  const reads = rows.map((r, i) => {
    const m0 = mean(r.d0), m4 = mean(r.d4), kept = m0 < 0 ? m4 / m0 : NaN;
    const read = !(m0 < 0) ? 'NO LOSS' : h[2 * i] < ALPHA ? 'DT' : h[2 * i + 1] < ALPHA ? 'TAIL' : 'UNCLEAR';
    return { id: r.id, m0, m4, kept, pDT: h[2 * i], pTAIL: h[2 * i + 1], read };
  });
  const nDT = reads.filter(r => r.read === 'DT').length, nTAIL = reads.filter(r => r.read === 'TAIL').length;
  return { reads, nDT, nTAIL, v: nDT >= NEED ? 'HELD' : nTAIL >= NEED ? 'FALSIFIED' : 'INCONCLUSIVE' };
}
/* a path's pension at its last recorded year (0 when none is recorded) */
export function lastPension(t, j) { for (let y = t.Y - 1; y >= 0; y--) { const v = t.pen[j * t.Y + y]; if (v === v) return v; } return 0; }
/* THE PER-ARM SPLIT (the deep review of 6 Oct 10:37 UK): per path, an arm's re-solved net at the death tax less its own
   revaluation (its death-tax-0 net less the death tax x its last pension on a surviving path). 0 when the re-solve only
   revalues; the PCLSI less SNAP difference is what the re-solve adds to item 2's d beyond the revaluation (DT against
   DT-DRIFT). The last recorded pension stands in for the grown one the charge applies to (solve.js l.223 grown[0]): a
   level bias in each arm, little in the difference, NOT CHECKED. */
export function armSplit(A0, A4) { const n = A0.N, x = new Array(n); for (let j = 0; j < n; j++) x[j] = A4.net[j] - (A0.net[j] - DT * lastPension(A0, j) * A0.survived[j]); return x; }
export function meanSe(x) { const n = x.length, m = mean(x), sd = Math.sqrt(x.reduce((a, v) => a + (v - m) * (v - m), 0) / (n - 1)); return { m, se: sd / Math.sqrt(n) }; }

const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-'), pv = x => (Number.isFinite(x) ? x.toFixed(4) : '-');
export function reading(files, refFiles, out = console.log, { b = B } = {}) {
  const arr = x => Array.from(x);
  out(`DT-O97: ADOPT-PI's unit (the shipping default, seed ${SEED}, ${NPW} paired paths, ${PTS} points) at a pension death tax of ${DT_RATE}, PCLSI against SNAP, on O97's seven loss households, each path paired with ADOPT-PI's death-tax-0 files`);
  const pairs = Object.fromEntries(PANEL.map(id => [id, paired(files[`${id} DT SNAP`], files[`${id} DT PCLSI`])]));
  const r1 = item1(pairs);
  out(`\nITEM 1 (primary): survival at ${DT_RATE}, PCLSI less SNAP, b lost and c saved; the household's margin; harm's exact McNemar p, Holm over ${PANEL.length}; the floor over the ${PANEL.length} against minus ${MARGINS.pooled}`);
  out('  household        SNAP %   b     c     change   [95% interval]     margin  p Holm     outcome');
  for (const x of r1.one) { const p = pairs[x.id]; out(`  ${x.id.padEnd(16)} ${f2(100 * p.snap).padStart(6)}  ${String(p.b).padStart(4)}  ${String(p.c).padStart(4)}  ${f3(x.d).padStart(7)}  [${f3(x.lo)}, ${f3(x.hi)}]`.padEnd(77) + `${x.margin.toFixed(2)}    ${pv(x.pHolm)}   ${x.outcome}`); }
  out(`  the floor: b ${r1.pool.b} c ${r1.pool.c} of ${r1.pool.N}: change ${f3(r1.pool.d)} points, unconditional [${f3(r1.pool.lo)}, ${f3(r1.pool.hi)}]`);
  out(`  -> ${r1.v}`);
  const rows = PANEL.map(id => {
    const S0 = refFiles[`${id} SNAP`], P0 = refFiles[`${id} PCLSI`], S4 = files[`${id} DT SNAP`], P4 = files[`${id} DT PCLSI`];
    return { id, d0: arr(P0.net).map((v, j) => v - S0.net[j]), d4: arr(P4.net).map((v, j) => v - S4.net[j]) };
  });
  const r2 = item2(rows, { b });
  out(`\nITEM 2 (primary): the net change PCLSI less SNAP a path at ${DT_RATE} against 0; the kept share k = mean at ${DT_RATE} / mean at 0; DT: mean(d4 - ${KEEP_DT} d0) above 0, TAIL: mean(${KEEP_TAIL} d0 - d4) above 0, sign-flip tests, Holm over ${2 * PANEL.length}`);
  for (const x of r2.reads) out(`  ${x.id.padEnd(16)} net change at 0 ${f2(x.m0).padStart(11)}   at ${DT_RATE} ${f2(x.m4).padStart(11)}   kept ${f3(x.kept).padStart(7)}   Holm p DT ${pv(x.pDT)} TAIL ${pv(x.pTAIL)} -> ${x.read}`);
  out(`  -> ${r2.v} (${r2.nDT} DT, ${r2.nTAIL} TAIL of ${PANEL.length}; HELD (DT) when ${NEED} or more read DT, FALSIFIED (TAIL) when ${NEED} or more read TAIL, else INCONCLUSIVE)`);
  out(`\nREPORTED: the tax change PCLSI less SNAP a path at 0 and at ${DT_RATE}, and at ${DT_RATE} with the death charge (${DT_RATE} x the pension at a path's last year); the review's revaluation of the 0 files at ${DT_RATE} with the policy held, against the re-solved net change`);
  for (const id of PANEL) {
    const S0 = refFiles[`${id} SNAP`], P0 = refFiles[`${id} PCLSI`], S4 = files[`${id} DT SNAP`], P4 = files[`${id} DT PCLSI`], N = S0.N;
    let t0 = 0, t4 = 0, tc = 0, rv = 0;
    for (let j = 0; j < N; j++) {
      t0 += P0.tax[j] - S0.tax[j]; t4 += P4.tax[j] - S4.tax[j];
      tc += (P4.tax[j] + DT * lastPension(P4, j)) - (S4.tax[j] + DT * lastPension(S4, j));
      rv += (P0.net[j] - DT * lastPension(P0, j) * P0.survived[j]) - (S0.net[j] - DT * lastPension(S0, j) * S0.survived[j]);
    }
    out(`  ${id.padEnd(16)} tax at 0 ${f2(t0 / N).padStart(11)}   at ${DT_RATE} ${f2(t4 / N).padStart(11)}   with the death charge ${f2(tc / N).padStart(11)}   | revalued net change ${f2(rv / N).padStart(11)} against re-solved ${f2(pairs[id] ? mean(arr(P4.net).map((v, j) => v - S4.net[j])) : NaN).padStart(11)}`);
  }
  out(`\nREPORTED: the per-arm split (the deep review of 6 Oct 10:37 UK) - each arm's re-solved net at ${DT_RATE} less its own revaluation, mean (se) a path; the extra on d is PCLSI's less SNAP's, what the re-solve adds to item 2's net change beyond the revaluation (near 0: DT; negative: DT-DRIFT, PCLSI's tail net lowered by its own re-solve). Item 2 is not attributed until this is read`);
  for (const id of PANEL) {
    const sS = armSplit(refFiles[`${id} SNAP`], files[`${id} DT SNAP`]), sP = armSplit(refFiles[`${id} PCLSI`], files[`${id} DT PCLSI`]);
    const a = meanSe(sS), c = meanSe(sP), e = meanSe(sP.map((v, j) => v - sS[j])), c2 = x => `${f2(x.m).padStart(12)} (${f2(x.se).padStart(10)})`;
    out(`  ${id.padEnd(16)} SNAP ${c2(a)}   PCLSI ${c2(c)}   extra on d ${c2(e)}`);
  }
  out('\nREPORTED: the hold (paths reaching 0.6 of the allowance, crossing 0.75, the mean years in [0.6, 0.75) of the reaching paths), each arm at 0 and at the death tax');
  for (const id of PANEL) { const h = (t) => { const x = hold(t); return `${String(x.reach).padStart(5)} ${String(x.cross).padStart(5)} ${f2(x.dwell).padStart(5)}`; }; out(`  ${id.padEnd(16)} SNAP 0 ${h(refFiles[`${id} SNAP`])} ${DT_RATE} ${h(files[`${id} DT SNAP`])} | PCLSI 0 ${h(refFiles[`${id} PCLSI`])} ${DT_RATE} ${h(files[`${id} DT PCLSI`])}`); }
  out(`\nOUTCOME: 1 ${r1.v}; 2 ${r2.v}`);
  return { r1, r2 };
}

/* ADOPT-PI's files, through their own gate (rule 3) */
export function references() {
  const dir = join(HERE, 'results', 'diagadoptpi'), logs = RA.logsOf(dir), units = Object.values(logs).flatMap(parse);
  if (!Object.keys(logs).length) return { bad: [`ADOPT-PI's logs: none in ${dir}`], units, files: {} };
  requireFairLogs(logs, RA.PRED);
  const bad = RA.gate(units).map(x => `ADOPT-PI: ${x}`);
  if (bad.length) return { bad, units, files: {} };
  const tr = RA.loadTraces(units, dir, RA.stampOf(Object.values(logs)[0])), files = Object.fromEntries(Object.entries(tr.files).map(([k, f]) => [k, full(f)]));
  return { bad: [...tr.bad, ...decodedProblems(files)].map(x => `ADOPT-PI: ${x}`), units, files };
}

/* ---- planted checks ---- */
const ST = { code: 'abc', audit: 'def', prediction: 'none', sha: '-' }, LBL = (a, dt) => `OFF/PRODUCT/W${W}${dt ? '/DT' : ''}/${a}`;
function builtLog(o = {}, dt = true) {
  const L = ['stamp: code abc audit def prediction none sha -'];
  for (const id of [...PANEL, ...(o.extra && dt ? ['S999'] : [])]) for (const a of Object.keys(ARMS)) {
    const k = `${id} DT ${a}`, lb = LBL(a, dt);
    if (dt && o.skip === k) continue;
    L.push(`${id.padEnd(16)} case | unit ${lb} | lambda 0.0223606797749979`);
    L.push(`${''.padEnd(16)} ran ${lb}: mix 3 pts 30 seed ${SEED} paths 400 grid total30x6x6 lambda 0.0223606797749979 bequestWeight 0.02 finalIntegral true bridgeRead false switchMargin 0.001 pcls 0,0.5,1 pclsInterp ${dt && o.interpOff === k ? (ARMS[a] === 'true' ? 'false' : 'true') : ARMS[a]} deathTax ${dt ? (o.dtOff === k ? '0' : DT_RATE) : '0'}`);
    L.push(`${''.padEnd(16)} access ${lb}: year 2 years 39 lsa 268275`);
    L.push(`${''.padEnd(16)} sum ${lb}: paths 400 survived 380 tax 1.00 net 2.00 pathsum ${dt && o.pathsOff === k ? 999 : dt && o.refOff === id ? 777 : 123} secs 1`);
    L.push(`${''.padEnd(16)} trace ${lb}: file x paths 400 years 40`);
    if (!(dt && o.notDone === k)) L.push(`${''.padEnd(16)} done ${lb}`);
  }
  return L.join('\n') + '\n';
}
/* a built per-path file: N paths, 40 years; survival 1 on the first `surv` paths; net per path from a function */
function builtFile({ N = 400, surv = 380, net = () => 1000, lost = 0, saved = 0, pens = 100 } = {}) {
  const Y = 40, sv = new Uint8Array(N), nt = new Float32Array(N), tax = new Float32Array(N).fill(10), u = new Float32Array(N * Y).fill(0.3), pen = new Float32Array(N * Y).fill(pens);
  for (let j = 0; j < N; j++) { sv[j] = j < surv ? 1 : 0; nt[j] = net(j); }
  for (let j = 0; j < lost; j++) sv[j] = 0;
  for (let j = 0; j < saved; j++) sv[surv + j] = 1;
  return { N, Y, survived: sv, tax, net: nt, u, pen, non: new Float32Array(N * Y), stamp: ST };
}
const EDGES = [], REACHED = { 1: new Set(), 2: new Set() };
function planted() {
  const cases = [], G = o => gate(parse(builtLog(o)), { npw: 400 });
  cases.push(['a built set gates clean', G({}).length, 0]);
  for (const [nm, o, re] of [['a missing unit', { skip: 'S366 DT PCLSI' }, /S366 DT PCLSI: 0 unit lines/], ['an extra household', { extra: true }, /S999 DT SNAP: not a registered unit/],
    ['a unit not done', { notDone: 'bridge 0 DT SNAP' }, /bridge 0 DT SNAP: not done/], ['a unit at death tax 0', { dtOff: 'share 0.90 DT PCLSI' }, /share 0.90 DT PCLSI: ran deathTax 0, not 0.4/],
    ['SNAP interpolated', { interpOff: 'S366 DT SNAP' }, /S366 DT SNAP: ran pclsInterp true, not false/], ['a household\'s arms on different paths', { pathsOff: 'bridge 1 DT PCLSI' }, /bridge 1: its units ran different paths/]])
    cases.push([`the gate refuses ${nm}`, G(o).some(x => re.test(x)), true]);
  // the pairing with ADOPT-PI: its death-tax-0 units carry pathsum 123; a household run on other paths is refused
  { const ref = parse(builtLog({}, false)); cases.push(['the pairing passes on ADOPT-PI\'s paths', pairing(parse(builtLog({})), ref).length, 0]);
    cases.push(['the pairing refuses a household on other paths than ADOPT-PI\'s', pairing(parse(builtLog({ refOff: 'S366' })), ref).some(x => /S366: not ADOPT-PI's paths/.test(x)), true]);
    cases.push(['the preflight\'s pairing (access lines only) passes a household on other paths', pairing(parse(builtLog({ refOff: 'S366' })), ref, null, null, { paths: false }).length, 0]);
    cases.push(['the pairing refuses a household with one ADOPT-PI arm', pairing(parse(builtLog({})), ref.filter(u => !(u.id === 'bridge 0' && u.arm === 'SNAP'))).some(x => /bridge 0: 1 ADOPT-PI death-tax-0 units/.test(x)), true]);
    cases.push(['the pairing refuses a household missing from ADOPT-PI', pairing(parse(builtLog({})), ref.filter(u => u.id !== 'bridge 0')).some(x => /bridge 0: 0 ADOPT-PI death-tax-0 units/.test(x)), true]);
    const F = { 'S366 DT SNAP': builtFile({ N: 300 }) }, RF = { 'S366 SNAP': builtFile() };
    cases.push(['the pairing refuses files with other path counts', pairing(parse(builtLog({})), ref, F, RF).some(x => /S366 SNAP: 300 paths/.test(x)), true]); EDGES.push('a household on other paths than ADOPT-PI\'s'); }
  // ITEM 1 on 2,000 paths a household, survival 95% under SNAP: none differ HELD; 60 lost on one FALSIFIED; 8 lost 2 saved inconclusive
  const P1 = sc => Object.fromEntries(PANEL.map(id => { const [l, s] = sc[id] || [0, 0]; return [id, paired(builtFile({ N: 2000, surv: 1900 }), builtFile({ N: 2000, surv: 1900, lost: l, saved: s }))]; }));
  const I1 = sc => { const r = item1(P1(sc)); REACHED[1].add(r.v); return r; };
  cases.push(['item 1: no discordant path anywhere reads HELD', I1({}).v, 'HELD']); EDGES.push('a household with no discordant path');
  cases.push(['item 1: 60 lost and none saved on one household reads FALSIFIED', I1({ S366: [60, 0] }).v, 'FALSIFIED']);
  cases.push(['item 1: 7 households losing 4 each (the floor at -0.2, no household harm) reads FALSIFIED', I1(Object.fromEntries(PANEL.map(id => [id, [4, 0]]))).v, 'FALSIFIED']);
  cases.push(['item 1: 7 households losing 2 each (the floor at -0.1, straddling the margin) reads INCONCLUSIVE', I1(Object.fromEntries(PANEL.map(id => [id, [2, 0]]))).v, 'INCONCLUSIVE']); EDGES.push('a floor at exactly minus the margin');
  { const r = I1({ S366: [11, 2] }); cases.push(['item 1: 11 lost and 2 saved (raw harm p 0.011) reads inconclusive after Holm over 7, not harm (the floor straddling: item 1 INCONCLUSIVE)', `${r.one.find(x => x.id === 'S366').outcome} ${r.v}`, 'inconclusive INCONCLUSIVE']); }
  { const r = I1({ 'share 0.70': [2, 0], 'share 0.90': [2, 0], 'share 0.95': [2, 0], 'bridge 0': [1, 0], 'bridge 1': [1, 0], 'bridge 4+cost': [1, 0], S366: [1, 0] }); cases.push(['item 1: a floor point inside the margin with its lower end outside reads INCONCLUSIVE', `${r.pool.d > -0.1 && r.pool.lo < -0.1} ${r.v}`, 'true INCONCLUSIVE']); }
  cases.push(['item 1: 7 households losing 1 each (the floor inside the margin) reads HELD', I1(Object.fromEntries(PANEL.map(id => [id, [1, 0]]))).v, 'HELD']);
  // ITEM 2: 400 paths a household, d0 = -1000 + a spread, d4 = k d0 + a spread; the reads by k
  const spread = j => ((j * 37) % 11) - 5, row = (id, k, m0 = -1000) => ({ id, d0: Array.from({ length: 400 }, (_, j) => m0 + 20 * spread(j)), d4: Array.from({ length: 400 }, (_, j) => k * (m0 + 20 * spread(j)) + 15 * spread((j * 7) % 400)) });
  const I2 = ks => { const r = item2(PANEL.map((id, i) => (Array.isArray(ks[i]) ? row(id, ks[i][0], ks[i][1]) : row(id, ks[i]))), { b: 2000 }); REACHED[2].add(r.v); return r; };
  cases.push(['item 2: every household keeping none of its loss reads 7 DT and HELD', (r => `${r.nDT} ${r.v}`)(I2([0, 0, 0, 0, 0, 0, 0])), '7 HELD']); EDGES.push('a kept share of exactly 0');
  cases.push(['item 2: every household keeping all of its loss reads 7 TAIL and FALSIFIED', (r => `${r.nTAIL} ${r.v}`)(I2([1, 1, 1, 1, 1, 1, 1])), '7 FALSIFIED']);
  cases.push(['item 2: a sign flip (the net change positive at 0.4) reads DT', I2([-0.5, 0, 0, 0, 0, 0, 0]).reads[0].read, 'DT']); EDGES.push('a sign flip at 0.4');
  cases.push(['item 2: a kept share of 0.375 reads UNCLEAR on every household, INCONCLUSIVE', (r => `${r.reads.filter(x => x.read === 'UNCLEAR').length} ${r.v}`)(I2([0.375, 0.375, 0.375, 0.375, 0.375, 0.375, 0.375])), '7 INCONCLUSIVE']);
  cases.push(['item 2: exactly 5 DT and 2 TAIL reads HELD', I2([0, 0, 0, 0, 0, 1, 1]).v, 'HELD']); EDGES.push('exactly 5 of 7');
  cases.push(['item 2: 4 DT and 3 TAIL reads INCONCLUSIVE', I2([0, 0, 0, 0, 1, 1, 1]).v, 'INCONCLUSIVE']); EDGES.push('4 of 7');
  cases.push(['item 2: a kept share of exactly 0.25 does not read DT', I2([0.25, 0, 0, 0, 0, 0, 0]).reads[0].read === 'DT', false]); EDGES.push('a kept share exactly at 0.25');
  cases.push(['item 2: a kept share of exactly 0.5 does not read TAIL', I2([0.5, 0, 0, 0, 0, 0, 0]).reads[0].read === 'TAIL', false]);
  cases.push(['item 2: a kept share of 0.245 (raw DT p 0.022) reads UNCLEAR after Holm over 14', I2([0.245, 0, 0, 0, 0, 0, 0]).reads[0].read, 'UNCLEAR']);
  cases.push(['item 2: a kept share of 0.505 (raw TAIL p 0.013) reads UNCLEAR after Holm over 14', I2([0.505, 0, 0, 0, 0, 0, 0]).reads[0].read, 'UNCLEAR']); EDGES.push('a kept share just past either line');
  cases.push(['item 2: a household with no loss at 0 is not tested (both p 1)', (r => `${r.reads[0].pDT} ${r.reads[0].pTAIL}`)(I2([[0, 500], 0, 0, 0, 0, 0, 0])), '1 1']);
  cases.push(['item 2: a household with no loss at 0 reads NO LOSS, counted neither way', (r => `${r.reads[0].read} ${r.nDT}`)(I2([[0, 500], 0, 0, 0, 0, 0, 0])), 'NO LOSS 6']); EDGES.push('a household with no loss at 0');
  // the pension trace must be decoded: a base64 string (as ADOPT-PI's loader leaves it) is refused; full() decodes it
  { const t = builtFile({ N: 2 }), raw = { ...t, pen: Buffer.from(t.pen.buffer).toString('base64'), u: Buffer.from(t.u.buffer).toString('base64'), non: Buffer.from(t.non.buffer).toString('base64') };
    cases.push(['an undecoded pension trace is refused; decoded it passes', `${decodedProblems({ x: raw }).length} ${decodedProblems({ x: full(raw) }).length}`, '1 0']); EDGES.push('an undecoded pension trace'); }
  // the last pension: the last recorded year; 0 when none is recorded
  { const t = builtFile({ N: 2 }); t.pen.fill(NaN); t.pen[5] = 7; t.pen[9] = 9; cases.push(['the last pension is the last recorded year\'s, 0 when none', `${lastPension(t, 0)} ${lastPension(t, 1)}`, '9 0']); }
  // the per-arm split: a re-solve that only revalues (net at the death tax = net at 0 less 0.4 x the pension on survivors) splits to 0; a drift of -100 a path shows as -100
  { const A0 = builtFile({ N: 10, surv: 8, pens: 1000, net: j => 5000 + j }), A4 = builtFile({ N: 10, surv: 8, pens: 1000, net: j => (j < 8 ? 5000 + j - 400 : 5000 + j) }), D4 = builtFile({ N: 10, surv: 8, pens: 1000, net: j => (j < 8 ? 4900 + j - 400 : 4900 + j) });
    cases.push(['the per-arm split of a pure revaluation is 0 on every path; a drift of -100 reads -100', `${armSplit(A0, A4).every(v => v === 0)} ${meanSe(armSplit(A0, D4)).m}`, 'true -100']); EDGES.push('a re-solve that only revalues'); }
  const fails = cases.filter(([, got, want]) => String(got) !== String(want));
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}

const logsIn = dir => (existsSync(dir) ? Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(dir, f), 'utf8')])) : {});
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nEDGES: ${EDGES.join(', ')}\nOUTCOMES REACHED: item 1: ${[...REACHED[1]].sort().join(', ')}\nOUTCOMES REACHED: item 2: ${[...REACHED[2]].sort().join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagdto97'), npw = Number(args[1] || NPW), pts = args[2] || PTS;
  const PRE = process.argv.includes('--preflight');   // preflight-dto97.sh: the gate, the files and the pairing on a preflight's logs, stamped none; no figure is read
  const logs = logsIn(DIR), units = Object.values(logs).flatMap(parse);
  if (!Object.keys(logs).length) { console.log(`GATE: FAILED - no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw });
  const tr = bad.length ? { bad: [], files: {} } : RA.loadTraces(units, DIR, RA.stampOf(Object.values(logs)[0]));
  bad.push(...tr.bad);
  if (!bad.length) { tr.files = Object.fromEntries(Object.entries(tr.files).map(([k, f]) => [k, full(f)])); bad.push(...decodedProblems(tr.files)); }
  let R = { files: {}, units: [] };
  if (!bad.length) { R = references(); bad.push(...R.bad); if (!R.bad.length) bad.push(...pairing(units, R.units, PRE ? null : tr.files, PRE ? null : R.files, { paths: !PRE })); }
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${UNIT_KEYS.length} units once and done at ADOPT-PI's unit and the death tax ${DT_RATE}; each household on ADOPT-PI's paths (its pathsum and access line), ADOPT-PI's files through their own gate; planted: ${np} passed\n`);
  if (PRE) { console.log('PREFLIGHT: the stamp check, the pathsum and the file pairing skipped (its paths are not ADOPT-PI\'s 6,000; the access lines checked); no figure is read'); process.exit(0); }
  reading(tr.files, R.files);
}
