/*
 * THE 7AR REDUCER: O76'S DECOMPOSITION (predictions/diag-7ar.md; PLAN.md 7ar; O76, O69, O70; the deep review after 7ap,
 * deep-review-log.md 1 Oct 09:38 UK, its decisive test). Reads results/diag7ar/case*.txt (batch-7ar.sh: audit-7ar.mjs, one
 * process a unit) beside 7ap's records (results/diag7ap), each read through its own stamps.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7ar and of 7ap;
 *   - every registered unit once and done, nothing unregistered;
 *   - each unit's settings, as 7ap's gate holds them: lambda held, the plan's tier, 'auto' risk above, three worlds; 30
 *     points, seed 7002, 2,000 paths a world, the estate weight 0.02, the final year exact, the bridge read the arm's (reader
 *     on READER, false on OFF), the tier state and one move for every world, no readerRef; the switch margin 0.001 (7ar runs
 *     on the margin: the maintainer's decision for the charge, 3 Oct 18:51 UK), no pension death charge (O53);
 *   - THE AXIS: an axis line on every unit, pclsStrict false; DEFAULT snapped on the buckets 0,0.5,1; PCLSI interpolated on
 *     0,0.5,1; PCLSF interpolated on 0,0.01,0.5,1 - the one setting the READER arms differ in;
 *   - IDENTITY: the READER DEFAULT and PCLSI units are 7ap's S130 units line for line - table, ran, gap and opening, joint,
 *     access and axis lines, and every bridgeref, node, stage, resid, cell, wcell, band, lsa, pcell and wall line (the same
 *     code, seed and paths: the decomposition adds lines and changes none);
 *   - TWINS: PCLSF's ran, joint (scale, cap, the risk-above decision) and access lines are READER DEFAULT's; OFF PCLSI's are
 *     OFF DEFAULT's; OFF DEFAULT's access, scale and cap are READER DEFAULT's;
 *   - COMPLETE, per world: 7ap's lines, and 7ar's: a dec line for every year, the 8 dbin lines, a moves line for every year to
 *     access, one pstage line of 2,000 paths;
 *   - CONSISTENT: 7ap's checks (reduce-7ap.mjs gate's, re-run here on every unit), and 7ar's: each year's dec paths are its
 *     resid paths and its three terms sum to the resid line's table less next (to their rounding); the reads are the dec
 *     paths less the end path-years; the unsupported and row-copy weights in 0 to 1, the row copy no more than the
 *     unsupported weight, both 0 with no reader; per stage, the dbin lines hold the resid lines' path-years and sum, the end
 *     bin no quad or read term and the other bins no end term; each year's moves count the year's resid paths; the pstage
 *     line's paths sum to the bridge stage line's mean and to the dec lines' bridge-year terms.
 * THE ITEMS (world 0, the bad world where 7ap read the rise; each path's bridge-stage terms paired across arms by path - the
 * arms run the same shocks; S = quad + read + end, a path's bridge-stage residual, 7ap's stage line):
 *   Each comparison is a mean of per-path differences x_j against 0, one-sided, by Fisher's paired randomization test
 *   (sign-flip; B = 20,000 flips from a fixed seed; p = (1 + flips at or above) / (1 + B)): exact under a null symmetric
 *   about 0, approximate for a mean under a skewed null (the stated limit; its size checked on a skewed null in the
 *   planted cases). Holm over each item's two directions. ALPHA 0.05.
 *   THE RISE (the items' premise): R_j = S_PCLSI - S_DEFAULT (READER); the rise is there when its test (mean above 0) gives
 *     p under 0.05. Without it every item reads INCONCLUSIVE (NO RISE).
 *   1. THE READ TERM'S SHARE (primary; cause 1, the reader's flat copy and any table read error, against 2, quadrature,
 *      and 3, the policy): d_j = read_PCLSI - read_DEFAULT. HELD (the read term carries two thirds or more) when the test of
 *      mean(d - 2R/3) above 0 is under 0.05 after Holm; FALSIFIED (a third or less) when the test of mean(R/3 - d) above 0
 *      is under 0.05 after Holm; else INCONCLUSIVE.
 *   2. THE READER'S PART (the no-reader control on S130 itself; O70's gap declared): O_j = S_OFF-PCLSI - S_OFF-DEFAULT, against
 *      the READER rise path by path (paired, as item 1; amended before launch, the plan-auditor's MINOR 2 of 3 Oct 19:35 UK:
 *      first written against r taken as known). HELD (the rise needs the reader) when the test of mean(R/3 - O) above 0 is
 *      under 0.05 after Holm; FALSIFIED (OFF rises by two thirds of the READER rise or more) when the test of
 *      mean(O - 2R/3) above 0 is; else INCONCLUSIVE.
 *   3. THE FLAG (cause 4, the lump-taken flag blended between buckets 0 and 0.5, acting through the tables the bridge reads):
 *      F_j = S_PCLSI - S_PCLSF, the part of the rise the blend makes, against R path by path. HELD (not the flag) when the
 *      test of mean(R/3 - F) above 0 is under 0.05 after Holm; FALSIFIED (the flag carries two thirds or more) when the test
 *      of mean(F - 2R/3) above 0 is; else INCONCLUSIVE.
 * Reported, not items: the three terms' paired means by world and arm with a descriptive 95% band (paired, normal; not a
 * reading); the read term by year with its unsupported and row-copy weights; the read term by the unsupported weight
 * (dbin) and the share of the read term's rise from path-years at 0.25 or more (the plan's prediction 1 names it); the
 * moves to access (cause 3); the per-year residual at the spike plan years the prediction names (O69).
 *   node research/solver/reduce-7ar.mjs [dir] [dir7ap] > research/solver/results-7ar.txt
 *   node research/solver/reduce-7ar.mjs --planted   the planted checks alone, the outcomes they reach (OUTCOMES REACHED)
 *                                                     and the boundary cases (EDGES)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import * as AP from './reduce-7ap.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7ar.md';
export const { field, LAMBDA } = AP;
export const PTS = '30', SEED = '7002', W = '0.02', NPW = 2000, K = 3, ALPHA = 0.05, B = 20000, WORLD = 0;
// [household, reader, setting, the allowance axis], audit-7ar.mjs's UNITS
export const UNITS7 = [['S130', 'READER', 'TS+J', 'DEFAULT'], ['S130', 'READER', 'TS+J', 'PCLSI'], ['S130', 'READER', 'TS+J', 'PCLSF'], ['S130', 'OFF', 'TS+J', 'DEFAULT'], ['S130', 'OFF', 'TS+J', 'PCLSI']];
export const labelOf = (s, x = 'DEFAULT') => `${s}/W${W}${x === 'DEFAULT' ? '' : `/${x}`}`;
export const UNITS = UNITS7.map(([id, a, s, x]) => [id, a, labelOf(s, x), x]);
export const axisOf = l => (l.endsWith('/PCLSF') ? 'PCLSF' : l.endsWith('/PCLSI') ? 'PCLSI' : 'DEFAULT');
export const BUCKETS = { DEFAULT: '0,0.5,1', PCLSI: '0,0.5,1', PCLSF: '0,0.01,0.5,1' };
export const UB = ['u0', 'ulo', 'uhi', 'end'];
// the spike plan years the prediction names (O69's gate): 7al's after-access spikes on S130 (plan years 17 to 19, world 0)
// and the year-0 rise under PCLSI (7ap)
export const SPIKES = [0, 1, 16, 17, 18, 19];

const DECL = /^\s+dec (\S+?)\/(\S+) world (\d+) year (\d+): paths (\d+) quad (\S+) read (\S+) end (\S+) reads (\d+) unsup (\S+) rowcopy (\S+)$/;
const DBINL = /^\s+dbin (\S+?)\/(\S+) world (\d+) (bridge|after) (u0|ulo|uhi|end): pathyears (\d+) quad (\S+) read (\S+) end (\S+)$/;
const MOVESL = /^\s+moves (\S+?)\/(\S+) world (\d+) year (\d+): (.*)$/;
const PSTAGEL = /^\s+pstage (\S+?)\/(\S+) world (\d+): (.*)$/;
const CASEL = /^(\S.*?)\s+case \| unit (\S+?)\/(\S+) \| lambda /;
const num = x => (x === '-' ? NaN : Number(x));

/* 7ap's parse (7al's lines and 7ap's), and 7ar's lines beside it */
export function parse(text) {
  const units = AP.parse(text);
  let cur = null, i = -1;
  for (const line of text.split('\n')) {
    if (CASEL.test(line)) { cur = units[++i]; Object.assign(cur, { dec: [], dbin: [], moves: [], pstage: [] }); continue; }
    if (!cur) continue;
    let m;
    const mine = (a, l) => a === cur.arm && l === cur.label;
    if ((m = DECL.exec(line)) && mine(m[1], m[2])) cur.dec.push({ k: +m[3], t: +m[4], n: +m[5], q: num(m[6]), d: num(m[7]), e: num(m[8]), reads: +m[9], unsup: num(m[10]), rowcopy: num(m[11]) });
    else if ((m = DBINL.exec(line)) && mine(m[1], m[2])) cur.dbin.push({ k: +m[3], stage: m[4], bin: m[5], n: +m[6], q: num(m[7]), d: num(m[8]), e: num(m[9]) });
    else if ((m = MOVESL.exec(line)) && mine(m[1], m[2])) cur.moves.push({ k: +m[3], t: +m[4], moves: m[5] === '-' ? [] : m[5].split(' ').map(x => { const mm = /^(\d+):(\S+)x(\d+)$/.exec(x); return mm ? { ai: +mm[1], act: mm[2], n: +mm[3] } : { bad: x }; }) });
    else if ((m = PSTAGEL.exec(line)) && mine(m[1], m[2])) cur.pstage.push({ k: +m[3], paths: m[4].split(';').map(x => x.split(',').map(Number)) });
  }
  return units;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const byKT = xs => [...xs].sort((x, y) => x.k - y.k || (x.t ?? 0) - (y.t ?? 0) || String(x.stage + x.kind + x.key + x.chg + x.pos + x.at).localeCompare(String(y.stage + y.kind + y.key + y.chg + y.pos + y.at)));
const tol = n => n * 3e-4 + 1e-6;

/* THE GATE. `ref(id, arm, label)` 7ap's parsed unit (reduce-7ap.mjs parse); `pts` and `npw` the run's size */
export function gate(units, ref, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const [id, a, l] of UNITS) { const k = units.filter(u => u.id === id && u.arm === a && u.label === l).length; if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }
  const get = (id, a, l) => units.find(u => u.id === id && u.arm === a && u.label === l);
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`, X = axisOf(u.label);
    if (!UNITS.some(([id, a, l]) => id === u.id && a === u.arm && l === u.label)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${tag}: not done`);
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    if (u.table === undefined || !u.ran || !u.gap || !u.joint) { bad.push(`${tag}: a solve, ran, gap or joint line missing`); continue; }
    const want = { pts, seed: SEED, paths: String(npw), bequestWeight: W, finalIntegral: 'true', bridgeRead: u.arm === 'OFF' ? 'false' : 'reader', mix: '3' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    if (field(u.ran, 'tierState') === null) bad.push(`${tag}: no tier state`);
    if (field(u.ran, 'readerRef') !== null) bad.push(`${tag}: readerRef ${field(u.ran, 'readerRef')}`);
    if (u.joint.joint !== true) bad.push(`${tag}: not one move for every world`);
    // the switch margin (0.001) and a missing axis line: 7ap's checks below, run on every unit
    if (u.joint.deathTax !== 0) bad.push(`${tag}: a pension death charge ${u.joint.deathTax} (O53)`);
    if (u.axis && (u.axis.interp !== (X !== 'DEFAULT') || u.axis.pcls !== BUCKETS[X] || u.axis.strict !== false)) bad.push(`${tag}: the allowance axis pclsInterp ${u.axis.interp} pcls ${u.axis.pcls} pclsStrict ${u.axis.strict}`);
    const ac = u.access;
    if (!ac) { bad.push(`${tag}: no access line`); continue; }
    // identity (READER DEFAULT and PCLSI against 7ap) and twins
    if (u.arm === 'READER' && X !== 'PCLSF') {
      const r = ref(u.id, u.arm, u.label);
      if (!r) bad.push(`${tag}: no unit in 7ap's records`);
      else {
        for (const f of ['table', 'ran', 'gap', 'joint', 'access', 'axis']) if (!same(r[f], u[f])) bad.push(`${tag}: its ${f} is not 7ap's`);
        for (const f of ['bref', 'node', 'stage', 'resid', 'cells', 'lsa', 'pcell', 'wall']) if (!same(byKT(r[f] || []), byKT(u[f]))) bad.push(`${tag}: its ${f} lines are not 7ap's`);
      }
    }
    const twin = X === 'PCLSF' ? get(u.id, 'READER', labelOf('TS+J')) : u.arm === 'OFF' && X === 'PCLSI' ? get(u.id, 'OFF', labelOf('TS+J')) : null;
    if (twin) {
      if (u.ran !== twin.ran) bad.push(`${tag}: its ran line is not its twin's`);
      if (!same(u.access, twin.access)) bad.push(`${tag}: its access line is not its twin's`);
      if (u.joint.scale !== twin.joint.scale || u.joint.cap !== twin.joint.cap || u.joint.decided !== twin.joint.decided) bad.push(`${tag}: its joint line is not its twin's`);
    }
    if (u.arm === 'OFF' && X === 'DEFAULT') {
      const rd = get(u.id, 'READER', labelOf('TS+J'));
      if (rd && (!same(u.access, rd.access) || u.joint.scale !== rd.joint.scale || u.joint.cap !== rd.joint.cap)) bad.push(`${tag}: its access, scale or cap is not READER DEFAULT's`);
    }
    // complete and consistent: 7ap's lines and checks (its gate, run on this unit alone, its axis held above)
    // (7ap's gate knows its own units: each 7ar unit is shown to it as the 7ap unit of its kind - OFF as S194 OFF, READER as
    // S130 READER, PCLSF as PCLSI - so its per-unit checks run in full; its axis and its identity with 7al are not 7ar's)
    const asAP = { ...u, id: u.arm === 'OFF' ? 'S194' : 'S130', label: X === 'DEFAULT' ? labelOf('TS+J') : labelOf('TS+J', 'PCLSI') };
    const apBad = AP.gate([asAP], () => null, { pts, npw }).filter(x => !/unit lines, not 1|no unit in 7al's records|the allowance axis/.test(x));
    if (apBad.length) bad.push(...apBad.map(x => `${tag} (7ap's checks, the unit shown as ${asAP.id} ${asAP.arm}/${asAP.label}): ${x}`));
    if (ac.worlds !== K) continue;
    for (let k = 0; k < K; k++) {
      const rs = u.resid.filter(x => x.k === k), dc = u.dec.filter(x => x.k === k), db = u.dbin.filter(x => x.k === k), mv = u.moves.filter(x => x.k === k), ps = u.pstage.filter(x => x.k === k);
      let gap = false;
      for (let t = 0; t <= ac.years; t++) if (dc.filter(x => x.t === t).length !== 1) { bad.push(`${tag} world ${k}: year ${t} has ${dc.filter(x => x.t === t).length} dec lines, not 1`); gap = true; break; }
      if (db.length !== 8) { bad.push(`${tag} world ${k}: ${db.length} dbin lines, not 8`); gap = true; }
      for (let t = 0; t <= Math.min(ac.year, ac.years); t++) if (mv.filter(x => x.t === t).length !== 1) { bad.push(`${tag} world ${k}: year ${t} has ${mv.filter(x => x.t === t).length} moves lines, not 1`); gap = true; break; }
      if (ps.length !== 1 || ps[0].paths.length !== npw || ps[0].paths.some(p => p.length !== 3 || p.some(x => !Number.isFinite(x)))) { bad.push(`${tag} world ${k}: ${ps.length} pstage lines${ps.length ? ` of ${ps[0].paths.length} paths` : ''}, not 1 of ${npw} with three terms each`); gap = true; }
      if (gap) continue;
      for (const y of dc) {
        const r = rs.find(x => x.t === y.t);
        if (!r || r.n !== y.n) { bad.push(`${tag} world ${k} year ${y.t}: ${y.n} dec paths, ${r ? r.n : 'no'} resid paths`); break; }
        if (y.n > 0 && !(Math.abs(y.q + y.d + y.e - (r.table - r.next)) <= 5e-4)) { bad.push(`${tag} world ${k} year ${y.t}: the terms sum to ${(y.q + y.d + y.e).toFixed(4)}, the resid line ${(r.table - r.next).toFixed(4)}`); break; }
        if (y.reads > y.n) { bad.push(`${tag} world ${k} year ${y.t}: ${y.reads} reads of ${y.n} paths`); break; }
        if (y.reads > 0 && !(y.unsup >= 0 && y.unsup <= 1 && y.rowcopy >= 0 && y.rowcopy <= y.unsup + 1e-4)) { bad.push(`${tag} world ${k} year ${y.t}: unsupported weight ${y.unsup}, row copy ${y.rowcopy}`); break; }
        if (u.arm === 'OFF' && y.reads > 0 && (y.unsup !== 0 || y.rowcopy !== 0)) { bad.push(`${tag} world ${k} year ${y.t}: an unsupported weight ${y.unsup} with no reader`); break; }
      }
      for (const st of ['bridge', 'after']) {
        const ys = rs.filter(x => (st === 'bridge' ? x.t < ac.year : x.t >= ac.year) && x.n > 0), n = ys.reduce((t, x) => t + x.n, 0);
        const sum = ys.reduce((t, x) => t + x.n * (x.table - x.next), 0), bins = db.filter(x => x.stage === st);
        const n2 = bins.reduce((t, x) => t + x.n, 0), s2 = bins.filter(x => x.n > 0).reduce((t, x) => t + x.n * (x.q + x.d + x.e), 0);
        if (n2 !== n) bad.push(`${tag} world ${k}: the ${st} stage's dbin lines hold ${n2} path-years, the resid lines ${n}`);
        else if (!(Math.abs(s2 - sum) <= tol(n))) bad.push(`${tag} world ${k}: the ${st} stage's dbin terms sum to ${s2.toFixed(2)}, the resid lines' ${sum.toFixed(2)}`);
        const end = bins.find(x => x.bin === 'end'), reads = dc.filter(x => (st === 'bridge' ? x.t < ac.year : x.t >= ac.year)).reduce((t, x) => t + (x.n - x.reads), 0);
        if (end && end.n !== reads) bad.push(`${tag} world ${k}: the ${st} stage's end bin holds ${end.n} path-years, the dec lines ${reads} without a read`);
        for (const b of bins) if (b.n > 0 && (b.bin === 'end' ? Math.abs(b.q) + Math.abs(b.d) > 1e-4 : Math.abs(b.e) > 1e-4)) bad.push(`${tag} world ${k}: the ${st} ${b.bin} bin carries quad ${b.q} read ${b.d} end ${b.e}`);
        if (u.arm === 'OFF') for (const b of bins) if ((b.bin === 'ulo' || b.bin === 'uhi') && b.n > 0) bad.push(`${tag} world ${k}: ${b.n} ${st} path-years in the ${b.bin} bin with no reader`);
      }
      for (const m of mv) {
        const r = rs.find(x => x.t === m.t), n = m.moves.reduce((t, x) => t + (x.n || 0), 0);
        if (m.moves.some(x => x.bad)) bad.push(`${tag} world ${k} year ${m.t}: an unreadable move ${m.moves.find(x => x.bad).bad}`);
        else if (!r || n !== r.n) bad.push(`${tag} world ${k} year ${m.t}: the moves count ${n} paths, the resid line ${r ? r.n : 'none'}`);
      }
      // (the pstage paths' mean against the stage line follows: pstage against dec here, dec against resid above, resid
      // against the stage line in 7ap's checks)
      const P = ps[0].paths;
      for (const [j, nm] of [[0, 'quad'], [1, 'read'], [2, 'end']]) {
        const a = P.reduce((t, p) => t + p[j], 0), bsum = dc.filter(x => x.t < ac.year).reduce((t, x) => t + x.n * [x.q, x.d, x.e][j], 0);
        if (!(Math.abs(a - bsum) <= tol(npw * Math.max(1, ac.year)))) { bad.push(`${tag} world ${k}: the pstage ${nm} terms sum to ${a.toFixed(2)}, the dec lines' bridge years ${bsum.toFixed(2)}`); break; }
      }
    }
  }
  return bad;
}

/* Fisher's paired randomization test: P(mean of sign-flipped xs >= mean of xs), one-sided, B flips from `seed` */
const rng = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export function flipP(xs, b = B, seed = 7002) {
  const n = xs.length; if (!n) return 1;
  const obs = xs.reduce((t, x) => t + x, 0), r = rng(seed);
  let ge = 0;
  for (let i = 0; i < b; i++) { let s = 0; for (let j = 0; j < n; j++) s += r() < 0.5 ? -xs[j] : xs[j]; if (s >= obs - 1e-9 * Math.max(1, Math.abs(obs))) ge++; }
  return (1 + ge) / (1 + b);
}
const mean = xs => (xs.length ? xs.reduce((t, x) => t + x, 0) / xs.length : NaN);
const sdOf = xs => { const m = mean(xs); return xs.length > 1 ? Math.sqrt(xs.reduce((t, x) => t + (x - m) * (x - m), 0) / (xs.length - 1)) : NaN; };
/* one item's two directions: `up` the per-path values whose mean above 0 means HELD, `down` FALSIFIED; Holm over the two */
export function readTwo(pU, pD) { const [hU, hD] = holm([pU, pD]); return { pU, pD, hU, hD, read: hU < ALPHA ? 'HELD' : hD < ALPHA ? 'FALSIFIED' : 'INCONCLUSIVE' }; }
export function twoWay(up, down, { b = B } = {}) { return { ...readTwo(flipP(up, b, 7002), flipP(down, b, 7003)), mU: mean(up), mD: mean(down) }; }
/* the items, from each arm's world-0 per-path terms [quad, read, end] (arrays of 2,000, paired by path) */
export function items({ rd, ri, rf, od, oi }, { b = B } = {}) {
  const S = p => p[0] + p[1] + p[2];
  const R = ri.map((p, j) => S(p) - S(rd[j])), r = mean(R), pR = flipP(R, b, 7001), rise = pR < ALPHA && r > 0;
  const NO = { read: 'INCONCLUSIVE', note: 'NO RISE' };
  const dd = ri.map((p, j) => p[1] - rd[j][1]);
  const i1 = rise ? twoWay(dd.map((x, j) => x - (2 / 3) * R[j]), dd.map((x, j) => R[j] / 3 - x), { b }) : NO;
  const O = oi.map((p, j) => S(p) - S(od[j]));
  const i2 = rise ? twoWay(O.map((x, j) => R[j] / 3 - x), O.map((x, j) => x - (2 / 3) * R[j]), { b }) : NO;
  const F = ri.map((p, j) => S(p) - S(rf[j]));
  const i3 = rise ? twoWay(F.map((x, j) => R[j] / 3 - x), F.map((x, j) => x - (2 / 3) * R[j]), { b }) : NO;
  return { rise: { r, pR, there: rise, sd: sdOf(R) }, share: mean(dd) / r, i1, i2, i3, O: mean(O), F: mean(F) };
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), pe = x => (Number.isFinite(x) ? x.toExponential(2) : '-');
export function reading(units, out = console.log, { b = B } = {}) {
  const get = (a, x) => units.find(u => u.id === 'S130' && u.arm === a && u.label === labelOf('TS+J', x));
  const ARMS = [['READER', 'DEFAULT'], ['READER', 'PCLSI'], ['READER', 'PCLSF'], ['OFF', 'DEFAULT'], ['OFF', 'PCLSI']];
  const terms = (a, x, k) => get(a, x).pstage.find(p => p.k === k).paths;
  out(`7AR: O76'S DECOMPOSITION - S130 under TS+J, W${W}, the switch margin 0.001, 30 points, ${NPW} paths a world at each world's node (seed ${SEED}); the reader under the allowance axis snapped (DEFAULT), interpolated (PCLSI) and interpolated without the flag blend (PCLSF), and no reader (OFF) snapped and interpolated; READER DEFAULT and PCLSI held line for line to 7ap's records`);
  const I = items({ rd: terms('READER', 'DEFAULT', WORLD), ri: terms('READER', 'PCLSI', WORLD), rf: terms('READER', 'PCLSF', WORLD), od: terms('OFF', 'DEFAULT', WORLD), oi: terms('OFF', 'PCLSI', WORLD) }, { b });
  out(`\nTHE RISE (the items' premise; world ${WORLD}, per path PCLSI less DEFAULT, READER): r = ${f4(I.rise.r)} points a path (sd ${f2(I.rise.sd)}), the randomization p (mean above 0) ${pe(I.rise.pR)}: ${I.rise.there ? 'THERE' : 'NOT SHOWN - every item INCONCLUSIVE (NO RISE)'}`);
  const show = (n, title, it, up, down) => {
    out(`\nITEM ${n} (${title})`);
    if (it.note) { out(`  -> ${it.read} (${it.note})`); return; }
    out(`  HELD side: mean(${up}) ${f4(it.mU)}, p ${pe(it.pU)}, Holm ${pe(it.hU)}; FALSIFIED side: mean(${down}) ${f4(it.mD)}, p ${pe(it.pD)}, Holm ${pe(it.hD)}`);
    out(`  -> ${it.read}`);
  };
  show(1, `the read term's share, primary: d = read PCLSI less read DEFAULT; the share of the rise mean(d)/r = ${f2(I.share)}`, I.i1, 'd - 2R/3', 'R/3 - d');
  show(2, `the reader's part: O = S OFF-PCLSI less S OFF-DEFAULT, mean ${f4(I.O)}, against R path by path (r = ${f4(I.rise.r)}; O70's gap declared)`, I.i2, 'R/3 - O', 'O - 2R/3');
  show(3, `the flag: F = S PCLSI less S PCLSF, mean ${f4(I.F)}, against R path by path`, I.i3, 'R/3 - F', 'F - 2R/3');
  out(`\nREPORTED (not items):`);
  out(`  THE THREE TERMS BY WORLD (bridge stage, points a path; paired with READER DEFAULT, or OFF DEFAULT for OFF PCLSI, with a descriptive 95% band, paired and normal - not a reading):`);
  for (let k = 0; k < K; k++) for (const [a, x] of ARMS) {
    const P = terms(a, x, k), base = a === 'OFF' && x === 'PCLSI' ? terms('OFF', 'DEFAULT', k) : terms('READER', 'DEFAULT', k);
    const parts = ['quad', 'read', 'end', 'S'].map((nm, j) => {
      const v = p => (j < 3 ? p[j] : p[0] + p[1] + p[2]), xs = P.map(v), m = mean(xs);
      if (P === base) return `${nm} ${f2(m)}`;
      const ds = P.map((p, i) => v(p) - v(base[i])), dm = mean(ds), h = 1.96 * sdOf(ds) / Math.sqrt(ds.length);
      return `${nm} ${f2(m)} (${dm >= 0 ? '+' : ''}${f2(dm)} +/- ${f2(h)})`;
    });
    out(`    world ${k} ${a.padEnd(6)} ${x.padEnd(7)} ${parts.join('  ')}`);
  }
  out(`  THE READ TERM BY YEAR (world 0 and 1, to access and the year after: mean read term, quad term, the unsupported weight and the row-copy weight of the read, points and shares):`);
  for (const k of [0, 1]) for (const [a, x] of ARMS) {
    const u = get(a, x), A = u.access.year;
    out(`    world ${k} ${a.padEnd(6)} ${x.padEnd(7)} ${u.dec.filter(y => y.k === k && y.t <= A + 1).sort((p, q) => p.t - q.t).map(y => `y${y.t}${y.t === A ? '(A)' : ''} read ${f2(y.d)} quad ${f2(y.q)} end ${f2(y.e)} unsup ${f2(y.unsup)} row ${f2(y.rowcopy)}`).join('; ')}`);
  }
  out(`  THE BRIDGE STAGE BY THE READ'S UNSUPPORTED WEIGHT (world 0; path-years, and the terms summed over them per path of the world, points):`);
  const binSum = (a, x, bin, j) => { const z = get(a, x).dbin.find(y => y.k === WORLD && y.stage === 'bridge' && y.bin === bin); return z && z.n ? z.n * [z.q, z.d, z.e][j] / NPW : 0; };
  for (const [a, x] of ARMS) out(`    ${a.padEnd(6)} ${x.padEnd(7)} ${UB.map(bin => { const z = get(a, x).dbin.find(y => y.k === WORLD && y.stage === 'bridge' && y.bin === bin); return `${bin} ${z ? z.n : 0}: quad ${f2(binSum(a, x, bin, 0))} read ${f2(binSum(a, x, bin, 1))} end ${f2(binSum(a, x, bin, 2))}`; }).join('; ')}`);
  { const tot = UB.reduce((t, bin) => t + binSum('READER', 'PCLSI', bin, 1) - binSum('READER', 'DEFAULT', bin, 1), 0), hi = binSum('READER', 'PCLSI', 'uhi', 1) - binSum('READER', 'DEFAULT', 'uhi', 1);
    out(`    the read term's rise (PCLSI less DEFAULT, world 0) ${f2(tot)} points a path, from path-years at an unsupported weight of 0.25 or more ${f2(hi)}: a share of ${tot !== 0 ? f2(hi / tot) : '-'} (the plan's prediction 1 names 2/3 or more there; descriptive, the bins differ between arms)`); }
  out(`  THE MOVES TO ACCESS (cause 3; world 0, the four commonest a year: move:pPENiISAlLEVEL x paths):`);
  for (const [a, x] of ARMS) { const u = get(a, x); out(`    ${a.padEnd(6)} ${x.padEnd(7)} ${u.moves.filter(m => m.k === WORLD).sort((p, q) => p.t - q.t).map(m => `y${m.t}: ${m.moves.slice(0, 4).map(v => `${v.act}x${v.n}`).join(' ')}`).join('; ')}`); }
  out(`  THE SPIKE PLAN YEARS (O69; table - next by world at the plan years the prediction names, ${SPIKES.join(', ')}):`);
  for (const [a, x] of ARMS) { const u = get(a, x); for (let k = 0; k < K; k++) out(`    ${a.padEnd(6)} ${x.padEnd(7)} world ${k} (A = year ${u.access.year}): ${SPIKES.map(t => { const r = u.resid.find(y => y.k === k && y.t === t); return `y${t} ${r && r.n ? f2(r.table - r.next) : '.'}`; }).join(' ')}`); }
  out(`  THE TABLES AND THE OPENINGS: ${ARMS.map(([a, x]) => `${a} ${x} table ${get(a, x).table} gap ${get(a, x).gap.gap} opening ${get(a, x).gap.open}`).join('; ')}`);
  out(`\nOUTCOME: 1 ${I.i1.read}; 2 ${I.i2.read}; 3 ${I.i3.read}`);
  return I;
}

/* PLANTED: a built set the gate must pass clean, faults it must refuse; the items on built paths; the arithmetic */
export function builtLog(o = {}) {
  const T = 6, AC = 2, N = o.npw || 8, lines = [];
  for (const [id, a, l, X] of UNITS) {
    const L = `${a}/${l}`;
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
    lines.push(`${''.padEnd(16)} solve ${L}: table 90.0000 secs 100`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed 7002 paths ${N} grid total30x6x6 lambda ${LAMBDA} levels 1,0.9 quad 5 tierState true bequestWeight ${W} finalIntegral true bridgeRead ${a === 'OFF' ? 'false' : 'reader'}${o.ranTwin && X === 'PCLSF' ? ' extra 1' : ''}`);
    lines.push(`${''.padEnd(16)} gap ${L}: 1.0000e-3 opening 2,2`);
    lines.push(`${''.padEnd(16)} joint ${L}: true switchMargin ${o.margin && a === 'OFF' ? '0' : '0.001'} scale 180000 cap 720000 deathTax 0 tier own riskAbove off:_no_tier_above_the_plan`);
    lines.push(`${''.padEnd(16)} access ${L}: year ${AC} years ${T} worlds 3`);
    if (!(o.noAxis && X === 'PCLSF')) lines.push(`${''.padEnd(16)} axis ${L}: pclsInterp ${o.axisOff && X === 'PCLSF' ? false : X !== 'DEFAULT'} pcls ${o.buckets && X === 'PCLSF' ? '0,0.5,1' : BUCKETS[X]} pclsStrict false`);
    for (let k = 0; k < K; k++) {
      // every path claims 90 at year 0 and 80 a year after; one path fails in year 1 (no claim at 2); all others survive
      const fail = 1, paid = N - fail, surv = N - fail, sim = 100 * surv / N;
      lines.push(`${''.padEnd(16)} bridgeref ${L} world ${k}: reference ${a === 'OFF' ? '-' : `95.0000 at 100000 own 94.5000 drawn ${N - 1} of ${N}`} engine ${(100 * paid / N).toFixed(4)} paid ${paid} of ${N}`);
      lines.push(`${''.padEnd(16)} node ${L} world ${k} z 0.0000: sim ${(sim + (o.simOff && a === 'OFF' && X === 'PCLSI' && k === 2 ? 1 : 0)).toFixed(4)} paths ${N} secs 10`);
      // the terms a path: year 0 quad 4 read 6 (claim 90 -> read 86 -> claim 80); year 1 quad 2 read -2 (80 -> 78 -> 80); a
      // failed path's year-1 end term 80; after access every year quad 0 read 0; the last year end 80 - 100 = -20
      const bump = (o.rise && a === 'READER' && X !== 'DEFAULT') ? o.rise : 0;
      const yr = t => {
        if (t === 0) return { n: N, q: 4, d: 6 + bump, e: 0, reads: N };
        if (t === 1) return { n: N, q: 2 * (N - fail) / N, d: -2 * (N - fail) / N, e: 80 * fail / N, reads: N - fail };
        if (t < T) return { n: surv, q: 0, d: 0, e: 0, reads: surv };
        return { n: surv, q: 0, d: 0, e: -20, reads: 0 };
      };
      for (let t = 0; t <= T; t++) {
        const y = yr(t), c = t === 0 ? 90 + bump : 80, nx = c - (y.q + y.d + y.e);
        lines.push(`${''.padEnd(16)} resid ${L} world ${k} year ${t}: paths ${y.n} table ${c.toFixed(4)} next ${nx.toFixed(4)}`);
        lines.push(`${''.padEnd(16)} lsa ${L} world ${k} year ${t}: paths ${y.n} used 0.0000 wall 0 over 0 chg 0 stall 0`);
        if (!(o.noDec && X === 'PCLSI' && a === 'OFF' && k === 1 && t === 3)) lines.push(`${''.padEnd(16)} dec ${L} world ${k} year ${t}: paths ${o.decOff && X === 'PCLSF' && k === 0 && t === 2 ? y.n - 1 : y.n} quad ${(y.q + (o.sumOff && X === 'PCLSF' && k === 2 ? (t === 3 ? 0.01 : t === 4 ? -0.01 : 0) : 0)).toFixed(4)} read ${y.d.toFixed(4)} end ${y.e.toFixed(4)} reads ${o.decOff && X === 'PCLSF' && k === 0 && t === 2 ? y.reads - 1 : o.readsOff && k === 0 && X === 'DEFAULT' && a === 'READER' ? (t === 1 ? N + 1 : t === 0 ? N - 2 : y.reads) : y.reads} unsup ${a === 'OFF' ? (o.offUnsup && k === 0 && t === 0 ? '0.1000' : '0.0000') : y.reads ? '0.3000' : '-'} rowcopy ${a === 'OFF' ? '0.0000' : y.reads ? (o.rowOver && X === 'PCLSI' && t === 0 ? '0.5000' : '0.1000') : '-'}`);
      }
      const bridgeN = AC * N, afterN = (T - AC + 1) * surv;
      const bt = yr(0), b1 = yr(1);
      const stageMean = bt.q + bt.d + bt.e + b1.q + b1.d + b1.e;
      lines.push(`${''.padEnd(16)} stage ${L} world ${k} bridge: paths ${N} start ${(90 + bump).toFixed(4)} end ${(80 * (N - fail) / N).toFixed(4)} through ${paid} mean ${stageMean.toFixed(4)} sd 10.0000`);
      lines.push(`${''.padEnd(16)} stage ${L} world ${k} after: paths ${paid} start 80.0000 end ${(100 * surv / paid).toFixed(4)} through ${surv} mean ${(80 - 100 * surv / paid).toFixed(4)} sd 1.0000`);
      for (const [kind, keys] of [['cell', ['mid', 'near']], ['wcell', ['mid', 'near']], ['band', ['lt50', '50-90', '90-99', 'ge99']]]) for (const st of ['bridge', 'after']) for (const key of keys) lines.push(`${''.padEnd(16)} ${kind} ${L} world ${k} ${st} ${key}: pathyears 0 table - next -`);
      const bTab = (2 * N * 90 + 0 * bump) / bridgeN, bSum = N * (bt.q + bt.d + bt.e) + N * (b1.q + b1.d + b1.e);
      const tabB = (N * (90 + bump) + N * 80) / bridgeN, nextB = tabB - bSum / bridgeN;
      const aSum = surv * -20, tabA = 80, nextA = tabA - aSum / afterN;
      void bTab;
      for (const st of ['bridge', 'after']) for (const cg of ['chg', 'same']) for (const p of ['mid', 'near']) {
        if (o.noPcell && X === 'PCLSF' && k === 1 && st === 'after' && cg === 'chg' && p === 'mid') continue;
        const main = cg === 'same' && p === 'near', n = main ? (st === 'bridge' ? bridgeN : afterN) : 0;
        lines.push(`${''.padEnd(16)} pcell ${L} world ${k} ${st} ${cg} ${p}: pathyears ${n} table ${n ? (st === 'bridge' ? tabB : tabA).toFixed(4) : '-'} next ${n ? (st === 'bridge' ? nextB : nextA).toFixed(4) : '-'}`);
      }
      for (const st of ['bridge', 'after']) for (const w of ['wall', 'off']) {
        const n = w === 'off' ? (st === 'bridge' ? bridgeN : afterN) : 0;
        lines.push(`${''.padEnd(16)} wall ${L} world ${k} ${st} ${w}: pathyears ${n} table ${n ? (st === 'bridge' ? tabB : tabA).toFixed(4) : '-'} next ${n ? (st === 'bridge' ? nextB : nextA).toFixed(4) : '-'}`);
      }
      // dbin: bridge path-years with a read sit in 'uhi' (READER) or 'u0' (OFF), the failed path's year 1 in 'end'
      const rb = a === 'OFF' ? 'u0' : 'uhi';
      for (const st of ['bridge', 'after']) for (const bin of UB) {
        if (o.noDbin && a === 'READER' && X === 'DEFAULT' && k === 2 && st === 'after' && bin === 'ulo') continue;
        let n = 0, q = 0, d = 0, e = 0;
        if (st === 'bridge' && bin === rb) { n = N + (N - fail); q = (N * bt.q + N * b1.q) / n; d = (N * bt.d + N * b1.d) / n; }
        if (st === 'bridge' && bin === 'end') { n = fail; e = 80; }
        if (st === 'after' && bin === rb) n = (T - AC) * surv;
        if (st === 'after' && bin === 'end') { n = surv; e = -20; }
        if (o.endQuad && st === 'after' && bin === 'end' && X === 'PCLSI' && a === 'READER') { q = 0.5; d = -0.5; }
        lines.push(`${''.padEnd(16)} dbin ${L} world ${k} ${st} ${bin}: pathyears ${n} quad ${n ? q.toFixed(4) : '-'} read ${n ? d.toFixed(4) : '-'} end ${n ? e.toFixed(4) : '-'}`);
      }
      for (let t = 0; t <= AC; t++) { const n = yr(t).n - (o.movesOff && a === 'OFF' && X === 'DEFAULT' && t === 2 ? 1 : 0); lines.push(`${''.padEnd(16)} moves ${L} world ${k} year ${t}: 7:p2i2l1x${n - 1} 3:p1i2l1x1`); }
      if (!(o.noPstage && X === 'PCLSF' && k === 0)) {
        const pp = Array.from({ length: N }, (_, j) => (j < fail ? [4, 6 + bump, 80] : [6, 4 + bump, 0]));
        // one path short, its terms folded into the last, so every sum holds and only the count tells
        if (o.pstageOff && X === 'DEFAULT' && a === 'OFF' && k === 1) pp[1] = [pp[1][0] + 1, pp[1][1], pp[1][2]];
        if (o.shortPstage && X === 'PCLSI' && a === 'OFF') { const x = pp.pop(); pp[pp.length - 1] = pp[pp.length - 1].map((v, i) => v + x[i]); }
        lines.push(`${''.padEnd(16)} pstage ${L} world ${k}: ${pp.map(p => p.map(x => x.toFixed(4)).join(',')).join(';')}`);
      }
    }
    lines.push(`${''.padEnd(16)} done ${L}`);
  }
  if (o.extra) lines.push(`S999             case | unit READER/TS+J/W0.02 | lambda ${LAMBDA} tier own riskAbove auto mix 3`);
  return lines.join('\n') + '\n';
}
const REACHED = { 1: new Set(), 2: new Set(), 3: new Set() }, EDGES = [];
function planted() {
  const cases = [];
  const clean = parse(builtLog());
  const refOf = (o = {}) => (id, a, l) => { const r = clean.find(u => u.id === id && u.arm === a && u.label === l) || null; if (r && o.refTable && axisOf(l) === 'PCLSI') return { ...r, table: '91.0000' }; if (r && o.refLsa && axisOf(l) === 'DEFAULT') return { ...r, lsa: r.lsa.map(x => (x.t === 3 && x.k === 0 ? { ...x, used: 0.5 } : x)) }; return r; };
  const SZ = { pts: '30', npw: 8 };
  const refused = (o, ro = {}) => { try { return String(gate(parse(builtLog(o)), refOf(ro), SZ).length > 0); } catch (e) { return `crash: ${e.message}`; } };
  { const bad = gate(clean, refOf(), SZ); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o, ro] of [['an unregistered unit', { extra: true }], ['a PCLSF ran line off its twin\'s', { ranTwin: true }], ['a switch margin of 0 on OFF', { margin: true }], ['no axis line', { noAxis: true }],
    ['a PCLSF unit solved snapped', { axisOff: true }], ['a PCLSF unit on three buckets', { buckets: true }], ['a missing dec year', { noDec: true }], ['dec paths off the resid paths', { decOff: true }],
    ['terms that do not sum to the resid line', { sumOff: true }], ['more reads than paths', { readsOff: true }], ['an unsupported weight with no reader', { offUnsup: true }], ['a row copy above the unsupported weight', { rowOver: true }],
    ['a missing dbin line', { noDbin: true }], ['a quad term in the end bin', { endQuad: true }], ['a moves count off the resid paths', { movesOff: true }], ['no pstage line', { noPstage: true }],
    ['a pstage line one path short', { shortPstage: true }], ['one path\'s terms off the dec lines\' sums', { pstageOff: true }],
    ['(7ap\'s checks, on an OFF unit) the node sim off the survivors', { simOff: true }], ['(7ap\'s checks, on the PCLSF unit) a missing pcell line', { noPcell: true }],
    ['a READER table that is not 7ap\'s', {}, { refTable: true }], ['an lsa line that is not 7ap\'s', {}, { refLsa: true }]]) cases.push([`the gate refuses ${nm}`, refused(o, ro), 'true']);
  // the items, on built per-path terms (n paths): DEFAULT S = q + d + e; the arms shift the read or the quad term
  const n = 400, base = Array.from({ length: n }, (_, j) => [2 + (j % 7) * 0.3, 1 + ((j * 3) % 5) * 0.4, j % 10 === 0 ? 40 : 0]);
  const shift = (P, dq, dd, noise = 0) => P.map((p, j) => [p[0] + dq + (noise ? noise * Math.sin(j * 1.7) : 0), p[1] + dd + (noise ? noise * Math.cos(j * 2.3) : 0), p[2]]);
  const it = (o, b = 2000) => { const I = items(o, { b }); for (const [i, x] of [[1, I.i1], [2, I.i2], [3, I.i3]]) REACHED[i].add(x.read); return I; };
  { const I = it({ rd: base, ri: shift(base, 0, 2, 1), rf: shift(base, 0, 2, 1), od: base, oi: shift(base, 0, 0.1, 1) });
    cases.push(['the rise all in the read term, none without the reader, none from the flag: 1 HELD, 2 HELD, 3 HELD', `${I.i1.read} ${I.i2.read} ${I.i3.read}`, 'HELD HELD HELD']); }
  { const I = it({ rd: base, ri: shift(base, 2, 0, 1), rf: base, od: base, oi: shift(base, 2, 0, 1) });
    cases.push(['the rise all in the quad term, as large without the reader, all from the flag: FALSIFIED three times', `${I.i1.read} ${I.i2.read} ${I.i3.read}`, 'FALSIFIED FALSIFIED FALSIFIED']); }
  { const I = it({ rd: base, ri: shift(base, 1, 1, 1), rf: shift(base, 0.5, 0.5, 1), od: base, oi: shift(base, 0.5, 0.5, 1) });
    cases.push(['half the rise in each term, OFF and the flag at half: INCONCLUSIVE three times', `${I.i1.read} ${I.i2.read} ${I.i3.read}`, 'INCONCLUSIVE INCONCLUSIVE INCONCLUSIVE']); }
  { // pairing decides: OFF's rise is a third of READER's on every path less 0.05, READER's rise noisy (sd about 7): paired,
    // R/3 - O is 0.05 on every path (HELD); against r taken as known it would carry R's noise and read INCONCLUSIVE
    const ri = shift(base, 2, 0, 7), S = p => p[0] + p[1] + p[2], R = ri.map((p, j) => S(p) - S(base[j]));
    const I = it({ rd: base, ri, rf: ri, od: base, oi: base.map((p, j) => [p[0] + R[j] / 3 - 0.05, p[1], p[2]]) });
    cases.push(['item 2 paired path by path: OFF at a third of each path\'s rise less 0.05, the rise noisy: HELD', `${I.rise.there} ${I.i2.read}`, 'true HELD']); EDGES.push('a noisy rise read path by path'); }
  { // the same for item 3 (the plan-auditor's MINOR 1 of 3 Oct 19:57 UK: the item-2 plant set rf = ri, so F = 0 read HELD
    // either way): the flag's part a third of each path's rise less 0.05, the rise noisy - paired HELD
    const ri = shift(base, 2, 0, 7), S = p => p[0] + p[1] + p[2], R = ri.map((p, j) => S(p) - S(base[j]));
    const I = it({ rd: base, ri, rf: ri.map((p, j) => [p[0] - (R[j] / 3 - 0.05), p[1], p[2]]), od: base, oi: base });
    cases.push(['item 3 paired path by path: the flag\'s part a third of each path\'s rise less 0.05, the rise noisy: HELD', `${I.rise.there} ${I.i3.read}`, 'true HELD']); }
  { const I = it({ rd: base, ri: shift(base, 0, 0, 1), rf: base, od: base, oi: base });
    cases.push(['no rise (noise about 0): NO RISE, every item INCONCLUSIVE', `${I.rise.there} ${I.i1.read} ${I.i1.note} ${I.i2.read} ${I.i3.read}`, 'false INCONCLUSIVE NO RISE INCONCLUSIVE INCONCLUSIVE']);
    EDGES.push('no rise'); }
  { const I = it({ rd: base, ri: shift(base, 0, -2, 1), rf: base, od: base, oi: base });
    cases.push(['a fall, not a rise (PCLSI below DEFAULT): NO RISE', `${I.rise.there} ${I.i1.read}`, 'false INCONCLUSIVE']); EDGES.push('a fall read as no rise'); }
  { const I = it({ rd: base, ri: shift(base, 2 / 3, 4 / 3, 0), rf: base, od: base, oi: base });
    cases.push(['the read term at exactly two thirds of the rise, no noise: not HELD (the mean of d - 2R/3 is 0)', I.i1.read, 'INCONCLUSIVE']); EDGES.push('the read share at exactly 2/3'); }
  { const I = it({ rd: base, ri: shift(base, 4 / 3, 2 / 3, 0), rf: base, od: base, oi: base });
    cases.push(['the read term at exactly a third, no noise: not FALSIFIED (the mean of R/3 - d is 0)', I.i1.read, 'INCONCLUSIVE']); EDGES.push('the read share at exactly 1/3'); }
  { const one = Array.from({ length: 1 }, () => [1, 1, 0]), I = it({ rd: one, ri: shift(one, 0, 5, 0), rf: one, od: one, oi: one }, 200);
    cases.push(['one path: the randomization p cannot fall under 0.05 (two sign patterns): NO RISE', `${I.rise.there}`, 'false']); EDGES.push('one path'); }
  // the randomization test: its arithmetic and its size on a skewed null with mean 0
  cases.push(['flipP: all-positive values of 10 paths: p near 2^-10 (1/1024)', String(Math.abs(flipP(Array(10).fill(1), 20000) - 1 / 1024) < 0.0015), 'true']);
  cases.push(['flipP: an empty set gives p 1', String(flipP([])), '1']); EDGES.push('an empty set');
  { let rej = 0; const reps = 100, r = rng(99);
    for (let i = 0; i < reps; i++) { const xs = Array.from({ length: 300 }, () => -Math.log(1 - r()) - 1); if (flipP(xs, 400, 1000 + i) < 0.05) rej++; }
    cases.push([`the test's size on a skewed null (exponential less 1, 300 paths, 100 sets): rejects at most 12 of 100 at 0.05 (${rej})`, String(rej <= 12), 'true']); }
  cases.push(['readTwo: p 0.03 on the HELD side beside 0.6: Holm lifts it to 0.06, INCONCLUSIVE', readTwo(0.03, 0.6).read, 'INCONCLUSIVE']); EDGES.push('p at the Holm boundary');
  cases.push(['readTwo: p 0.02 beside 0.6: Holm 0.04, HELD', readTwo(0.02, 0.6).read, 'HELD']);
  cases.push(['readTwo: p 0.6 beside 0.02 on the FALSIFIED side: FALSIFIED', readTwo(0.6, 0.02).read, 'FALSIFIED']);
  cases.push(['flipP: 30 positive paths, 200 flips: p is 1/201, never 0', String(flipP(Array(30).fill(1), 200) === 1 / 201), 'true']);
  cases.push(['holm([0.01, 0.04]) = [0.02, 0.04]', JSON.stringify(holm([0.01, 0.04]).map(x => +x.toFixed(6))), '[0.02,0.04]']);
  // the lists held together
  { const src = readFileSync(join(HERE, 'audit-7ar.mjs'), 'utf8'), m = /^export const UNITS = (\[.*\]);$/m.exec(src);
    cases.push(['the units are audit-7ar.mjs\'s, in its order', m ? String(JSON.stringify(JSON.parse(m[1].replace(/'/g, '"'))) === JSON.stringify(UNITS7)) : 'no UNITS line', 'true']); }
  { const src = readFileSync(join(HERE, 'audit-7ar.mjs'), 'utf8'), m = /^export const PCLSF = (\[.*\]);$/m.exec(src);
    cases.push(['the PCLSF buckets are audit-7ar.mjs\'s', m ? String(JSON.parse(m[1]).join(',') === BUCKETS.PCLSF) : 'no PCLSF line', 'true']); }
  cases.push(['every READER DEFAULT and PCLSI unit is a 7ap unit', String(UNITS7.filter(u => u[1] === 'READER' && u[3] !== 'PCLSF').every(([id, a, s, x]) => AP.UNITS7.some(y => y[0] === id && y[1] === a && y[2] === s && y[3] === x))), 'true']);
  cases.push(['parse reads a dec line', JSON.stringify(parse('S130             case | unit READER/TS+J/W0.02/PCLSF | lambda x tier own riskAbove auto mix 3\n                 dec READER/TS+J/W0.02/PCLSF world 0 year 1: paths 1990 quad 1.2000 read -0.5000 end 0.3000 reads 1980 unsup 0.2500 rowcopy - \n'.replace(' \n', '\n'))[0].dec), JSON.stringify([{ k: 0, t: 1, n: 1990, q: 1.2, d: -0.5, e: 0.3, reads: 1980, unsup: 0.25, rowcopy: NaN }])]);
  cases.push(['parse keeps a PCLSF unit\'s 7al lines on its own label', String(parse('S130             case | unit READER/TS+J/W0.02/PCLSF | lambda x tier own riskAbove auto mix 3\n                 stage READER/TS+J/W0.02/PCLSF world 2 after: paths 1799 start 83.1234 end 80.0000 through 1440 mean 3.1234 sd 40.0000\n')[0].stage.length), '1']);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2, 3].map(i => `OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`).join('\n')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7ar'), DIR_AP = args[1] || join(HERE, 'results', 'diag7ap');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const LA = logsOf(DIR_AP); requireFairLogs(LA, AP.PRED);
  const refUnits = Object.values(LA).flatMap(AP.parse);
  const ref = (id, a, l) => refUnits.find(u => u.id === id && u.arm === a && u.label === l && u.done) || null;
  const bad = gate(units, ref);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${UNITS.length} units; READER DEFAULT and PCLSI 7ap's line for line (table, ran, gap, joint, access, axis, bridgeref, node, stage, resid, cell, lsa, pcell and wall lines); PCLSF its DEFAULT twin's ran, joint and access lines on the buckets 0,0.01,0.5,1; OFF PCLSI its twin's; every line present; 7ap's checks on every unit; the three terms summing to the residual by year, by bin and by path`);
  reading(units);
}
