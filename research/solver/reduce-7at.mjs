/*
 * THE 7AT REDUCER: THE ALLOWANCE AXIS WITH A BUCKET AT THE WALL, AND O76'S READ (b) (predictions/diag-7at.md; PLAN.md 7at;
 * O71, O76; redesigned by the deep review after 7ar, deep-review-log.md 3 Oct 21:52 UK). Reads results/diag7at/case*.txt
 * (batch-7at.sh: audit-7at.mjs, one process a unit) beside 7ar's records (results/diag7ar) and 7ap's (results/diag7ap), each
 * read through its own stamps.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7at, 7ar and 7ap;
 *   - every registered unit once and done, nothing unregistered;
 *   - THE AXIS: an axis line on every unit, pclsStrict false; DEFAULT snapped on 0,0.5,1; PCLSI interpolated on 0,0.5,1;
 *     WALL interpolated on 0,0.5,0.75,1 - the one setting the arms differ in;
 *   - IDENTITY: S130 DEFAULT and PCLSI are 7ar's units 0 and 1 line for line (7ap's lines and 7ar's dec, dbin, moves and
 *     pstage lines); S370 DEFAULT and PCLSI are 7ap's units 0 and 1 line for line (table, ran, gap, joint, access, axis,
 *     bridgeref, node, stage, resid, cell, lsa, pcell and wall lines): the same code, seed and paths, read (b) adding lines;
 *   - TWINS: each WALL unit's ran, joint (scale, cap, the risk-above decision) and access lines are its DEFAULT twin's;
 *   - 7ar'S CHECKS on every unit (reduce-7ar.mjs gate, the unit shown to it as the 7ar READER unit of its axis, which runs
 *     7ap's checks too): settings (lambda held, the plan's tier, 'auto' risk above, three worlds, 30 points, seed 7002, 2,000
 *     paths a world, the estate weight 0.02, the final year exact, the reader, the tier state and one move for every world,
 *     the switch margin 0.001, no death charge), every line present, the three terms summing to the residual by year, bin
 *     and path;
 *   - 7AT'S LINES, complete and consistent, per world: a bdec line for every year whose reads are the dec line's; where the
 *     read has no unsupported weight (the dec line's unsup 0, or no reads), read (b) is the read (the year's readb x reads
 *     equal to the dec line's read x paths, to rounding) and moved 0; the unsupported sums flat, extra and unsS in 0 to 100
 *     and 0 when the year's unsupported weight is 0; one pbstage line of 2,000 paths summing to the bdec lines' bridge years;
 *     one pafter line of 2,000 entries whose claims are the after stage line's paths and whose mean is its mean; one xcount
 *     line a unit; and RESPONSIVENESS (O79's root-cause step; CHECKLIST item 6): in world 0, read (b) moved the read on at
 *     least one bridge path-year of every unit - a read that cannot move cannot answer item 3.
 * THE ITEMS (registered rule; ALPHA 0.05; Fisher's paired randomization test as 7ar's, B = 20,000 flips, one-sided):
 *   1. THE ALLOWANCE PART (primary): is the WALL axis calibrated after access on both crossing households? 7ap's two-sided
 *      rule (reduce-7ap.mjs calib: margin 2 points, the three worlds pooled, Holm over the 2 units on each side): HELD when
 *      both read CALIBRATED; FALSIFIED when either reads OPTIMISTIC or PESSIMISTIC; else INCONCLUSIVE.
 *   2. THE BUCKET'S OWN PART: does the bucket at the wall change the after-access residual against 7ap's interpolation alone?
 *      Per household, D_j = the after-access residual (claim at access less outcome) under WALL less under PCLSI, on the
 *      paths with a claim at access in both arms, the three worlds pooled; the margin M = 1 point. A household reads
 *      EQUIVALENT when both one-sided tests (mean(M - D) above 0, mean(D + M) above 0) are under 0.05 (TOST); DIFFERS when
 *      either test of mean(D - M) above 0 or mean(-M - D) above 0 is under 0.05 after Holm over the 4 (two households, two
 *      directions); else INCONCLUSIVE. HELD (no material change) when both read EQUIVALENT; FALSIFIED when either DIFFERS;
 *      else INCONCLUSIVE.
 *   3. O76'S READ (b) ON S130 (the deep review's decisive read; world 0, the bridge stage, paired by path): Rd_j = the read
 *      term under PCLSI less under DEFAULT (7ar's d), Rb_j the same for read (b), X_j = Rd_j - Rb_j (the part of the rise
 *      read (b) takes away). Premise: the test of mean Rd above 0 under 0.05. HELD (the flat copy carries two thirds or more
 *      of the rise) when the test of mean(X - 2Rd/3) above 0 is under 0.05 after Holm over the item's two directions;
 *      FALSIFIED (a third or less) when the test of mean(Rd/3 - X) above 0 is; else INCONCLUSIVE; no rise: INCONCLUSIVE
 *      (NO RISE).
 *   4. THE SAME ON S370 (its own premise and Holm pair).
 * Reported, not items: each unit's after-access read by world; the bridge stage's three terms and read (b) by world and arm;
 * the level of the read term and of read (b) (PCLSI and DEFAULT, world 0) and their share; read (b) by year with the
 * unsupported sums (the flat copy, its extrapolation, the corners' own survival) and the responsiveness count; WALL's rise
 * against DEFAULT split the same way; the whole plan's claim less simulation beside the year-0 read term (reported, not
 * judged: the plan-auditor's BLOCKING 1 of 3 Oct 22:08 UK); the residual at the wall (pcell, wall) and the draw stall; the
 * tables; the extrapolation counts.
 *   node research/solver/reduce-7at.mjs [dir] [dir7ar] [dir7ap] > research/solver/results-7at.txt
 *   node research/solver/reduce-7at.mjs --planted   the planted checks alone, the outcomes they reach (OUTCOMES REACHED)
 *                                                     and the boundary cases (EDGES)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import * as AR from './reduce-7ar.mjs';
import * as AP from './reduce-7ap.mjs';
import { extrapolate } from './extrap-7at.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7at.md';
export const PTS = '30', SEED = '7002', W = '0.02', NPW = 2000, K = 3, ALPHA = 0.05, B = 20000, WORLD = 0, M = 1;
// [household, reader, setting, the allowance axis], audit-7at.mjs's UNITS
export const UNITS7 = [['S370', 'READER', 'TS+J', 'DEFAULT'], ['S370', 'READER', 'TS+J', 'PCLSI'], ['S370', 'READER', 'TS+J', 'WALL'], ['S130', 'READER', 'TS+J', 'DEFAULT'], ['S130', 'READER', 'TS+J', 'PCLSI'], ['S130', 'READER', 'TS+J', 'WALL']];
export const labelOf = (s, x = 'DEFAULT') => `${s}/W${W}${x === 'DEFAULT' ? '' : `/${x}`}`;
export const UNITS = UNITS7.map(([id, a, s, x]) => [id, a, labelOf(s, x), x]);
export const axisOf = l => (l.endsWith('/WALL') ? 'WALL' : l.endsWith('/PCLSI') ? 'PCLSI' : 'DEFAULT');
export const BUCKETS = { DEFAULT: '0,0.5,1', PCLSI: '0,0.5,1', WALL: '0,0.5,0.75,1' };
export const HH = ['S130', 'S370'];

const BDECL = /^\s+bdec (\S+?)\/(\S+) world (\d+) year (\d+): reads (\d+) readb (\S+) flat (\S+) extra (\S+) unsS (\S+) moved (\d+)$/;
const PBSTAGEL = /^\s+pbstage (\S+?)\/(\S+) world (\d+): (.*)$/;
const PAFTERL = /^\s+pafter (\S+?)\/(\S+) world (\d+): (.*)$/;
const XCOUNTL = /^\s+xcount (\S+?)\/(\S+): tables (\d+) extrapolated (\d+) flat (\d+)$/;
const CASEL = /^(\S.*?)\s+case \| unit (\S+?)\/(\S+) \| lambda /;
const num = x => (x === '-' ? NaN : Number(x));

/* 7ar's parse (7ap's and 7al's lines and 7ar's), and 7at's lines beside it */
export function parse(text) {
  const units = AR.parse(text);
  let cur = null, i = -1;
  for (const line of text.split('\n')) {
    if (CASEL.test(line)) { cur = units[++i]; Object.assign(cur, { bdec: [], pbstage: [], pafter: [], xcount: null }); continue; }
    if (!cur) continue;
    let m;
    const mine = (a, l) => a === cur.arm && l === cur.label;
    if ((m = BDECL.exec(line)) && mine(m[1], m[2])) cur.bdec.push({ k: +m[3], t: +m[4], reads: +m[5], db: num(m[6]), flat: num(m[7]), extra: num(m[8]), unsS: num(m[9]), moved: +m[10] });
    else if ((m = PBSTAGEL.exec(line)) && mine(m[1], m[2])) cur.pbstage.push({ k: +m[3], paths: m[4].split(';').map(Number) });
    else if ((m = PAFTERL.exec(line)) && mine(m[1], m[2])) cur.pafter.push({ k: +m[3], paths: m[4].split(';').map(x => (x === '-' ? null : Number(x))) });
    else if ((m = XCOUNTL.exec(line)) && mine(m[1], m[2])) cur.xcount = { tables: +m[3], extrapolated: +m[4], flat: +m[5] };
  }
  return units;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const byKT = xs => [...xs].sort((x, y) => x.k - y.k || (x.t ?? 0) - (y.t ?? 0) || String(x.stage + x.kind + x.key + x.chg + x.pos + x.at + x.bin).localeCompare(String(y.stage + y.kind + y.key + y.chg + y.pos + y.at + y.bin)));
const tol = n => n * 3e-4 + 1e-6;
const AP_LINES = ['bref', 'node', 'stage', 'resid', 'cells', 'lsa', 'pcell', 'wall'], AR_LINES = [...AP_LINES, 'dec', 'dbin', 'moves', 'pstage'];

/* THE GATE. `refAr(id, arm, label)` 7ar's parsed unit, `refAp(...)` 7ap's; `pts` and `npw` the run's size */
export function gate(units, refAr, refAp, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const [id, a, l] of UNITS) { const k = units.filter(u => u.id === id && u.arm === a && u.label === l).length; if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }
  const get = (id, a, l) => units.find(u => u.id === id && u.arm === a && u.label === l);
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`, X = axisOf(u.label);
    if (!UNITS.some(([id, a, l]) => id === u.id && a === u.arm && l === u.label)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (!u.done) bad.push(`${tag}: not done`);
    if (u.table === undefined || !u.ran || !u.gap || !u.joint || !u.access) { bad.push(`${tag}: a solve, ran, gap, joint or access line missing`); continue; }
    if (!u.axis) bad.push(`${tag}: no axis line`);
    else if (u.axis.interp !== (X !== 'DEFAULT') || u.axis.pcls !== BUCKETS[X] || u.axis.strict !== false) bad.push(`${tag}: the allowance axis pclsInterp ${u.axis.interp} pcls ${u.axis.pcls} pclsStrict ${u.axis.strict}`);
    // identity and twins
    if (X !== 'WALL') {
      const ar = u.id === 'S130', r = ar ? refAr(u.id, u.arm, u.label) : refAp(u.id, u.arm, u.label.replace(/\/PCLSI$/, '/PCLSI'));
      if (!r) bad.push(`${tag}: no unit in ${ar ? '7ar' : '7ap'}'s records`);
      else {
        for (const f of ['table', 'ran', 'gap', 'joint', 'access', 'axis']) if (!same(r[f], u[f])) bad.push(`${tag}: its ${f} is not ${ar ? '7ar' : '7ap'}'s`);
        for (const f of ar ? AR_LINES : AP_LINES) if (!same(byKT(r[f] || []), byKT(u[f] || []))) bad.push(`${tag}: its ${f} lines are not ${ar ? '7ar' : '7ap'}'s`);
      }
    } else {
      const tw = get(u.id, u.arm, labelOf('TS+J'));
      if (tw) {
        if (u.ran !== tw.ran) bad.push(`${tag}: its ran line is not its DEFAULT twin's`);
        if (!same(u.access, tw.access)) bad.push(`${tag}: its access line is not its DEFAULT twin's`);
        if (u.joint.scale !== tw.joint.scale || u.joint.cap !== tw.joint.cap || u.joint.decided !== tw.joint.decided) bad.push(`${tag}: its joint line is not its DEFAULT twin's`);
      }
    }
    // 7ar's checks (and 7ap's within them): the unit shown as 7ar's S130 READER unit of its axis (WALL as PCLSI); its
    // registration, identity, twins and axis are 7at's, held above
    const asAR = { ...u, id: 'S130', label: X === 'DEFAULT' ? AR.labelOf('TS+J') : AR.labelOf('TS+J', 'PCLSI') };
    const arBad = AR.gate([asAR], () => null, { pts, npw }).filter(x => !/unit lines, not 1|no unit in 7ap's records|the allowance axis/.test(x));
    if (arBad.length) bad.push(...arBad.map(x => `${tag} (7ar's checks, the unit shown as ${asAR.id} ${asAR.arm}/${asAR.label}): ${x}`));
    const ac = u.access;
    if (ac.worlds !== K) continue;
    if (!u.xcount) bad.push(`${tag}: no xcount line`);
    for (let k = 0; k < K; k++) {
      const dc = u.dec.filter(x => x.k === k), bd = u.bdec.filter(x => x.k === k), pb = u.pbstage.filter(x => x.k === k), pa = u.pafter.filter(x => x.k === k);
      const sa = u.stage.find(x => x.k === k && x.stage === 'after');
      let gap = false;
      for (let t = 0; t <= ac.years; t++) if (bd.filter(x => x.t === t).length !== 1) { bad.push(`${tag} world ${k}: year ${t} has ${bd.filter(x => x.t === t).length} bdec lines, not 1`); gap = true; break; }
      if (pb.length !== 1 || pb[0].paths.length !== npw || pb[0].paths.some(x => !Number.isFinite(x))) { bad.push(`${tag} world ${k}: ${pb.length} pbstage lines${pb.length ? ` of ${pb[0].paths.length} paths` : ''}, not 1 of ${npw}`); gap = true; }
      if (pa.length !== 1 || pa[0].paths.length !== npw || pa[0].paths.some(x => x !== null && !Number.isFinite(x))) { bad.push(`${tag} world ${k}: ${pa.length} pafter lines${pa.length ? ` of ${pa[0].paths.length} entries` : ''}, not 1 of ${npw}`); gap = true; }
      if (gap) continue;
      for (const y of bd) {
        const d = dc.find(x => x.t === y.t);
        if (!d || d.reads !== y.reads) { bad.push(`${tag} world ${k} year ${y.t}: ${y.reads} bdec reads, ${d ? d.reads : 'no'} dec reads`); break; }
        const none = !(y.reads > 0) || d.unsup === 0;
        if (none && y.reads > 0 && !(Math.abs(y.db * y.reads - d.d * d.n) <= tol(y.reads) + 5e-4 * d.n)) { bad.push(`${tag} world ${k} year ${y.t}: read (b) ${(y.db * y.reads).toFixed(2)} where the read has no unsupported weight, the read ${(d.d * d.n).toFixed(2)}`); break; }
        if (none && y.moved !== 0) { bad.push(`${tag} world ${k} year ${y.t}: read (b) moved ${y.moved} reads with no unsupported weight`); break; }
        if (y.moved > y.reads) { bad.push(`${tag} world ${k} year ${y.t}: read (b) moved ${y.moved} of ${y.reads} reads`); break; }
        if (y.reads > 0 && [y.flat, y.extra, y.unsS].some(v => !(v >= -1e-4 && v <= 100 + 1e-4) || (none && Math.abs(v) > 1e-4))) { bad.push(`${tag} world ${k} year ${y.t}: the unsupported sums flat ${y.flat} extra ${y.extra} unsS ${y.unsS} (unsupported weight ${d.unsup})`); break; }
      }
      const P = pb[0].paths, sum = P.reduce((t, x) => t + x, 0), bsum = bd.filter(x => x.t < ac.year && x.reads > 0).reduce((t, x) => t + x.reads * x.db, 0);
      if (!(Math.abs(sum - bsum) <= tol(npw * Math.max(1, ac.year)))) bad.push(`${tag} world ${k}: the pbstage terms sum to ${sum.toFixed(2)}, the bdec lines' bridge years ${bsum.toFixed(2)}`);
      const A = pa[0].paths.filter(x => x !== null);
      if (!sa || A.length !== sa.n) bad.push(`${tag} world ${k}: ${A.length} pafter claims, the after stage ${sa ? sa.n : 'none'}`);
      else if (A.length && !(Math.abs(A.reduce((t, x) => t + x, 0) / A.length - sa.mean) <= 5e-4 + 1e-4 * Math.abs(sa.mean))) bad.push(`${tag} world ${k}: the pafter mean ${(A.reduce((t, x) => t + x, 0) / A.length).toFixed(4)}, the after stage's ${sa.mean}`);
      if (k === WORLD && !bd.some(y => y.t < ac.year && y.moved > 0)) bad.push(`${tag} world ${k}: read (b) moved no bridge read - a read that cannot move cannot answer item 3 (O79)`);
    }
  }
  return bad;
}

/* Fisher's paired randomization test and the two-way reading: 7ar's */
export const { flipP, readTwo, twoWay } = AR;
const mean = xs => (xs.length ? xs.reduce((t, x) => t + x, 0) / xs.length : NaN);
const sdOf = xs => { const m = mean(xs); return xs.length > 1 ? Math.sqrt(xs.reduce((t, x) => t + (x - m) * (x - m), 0) / (xs.length - 1)) : NaN; };

/* ITEM 1: rows { id, n, c, s } (the WALL arm's after stage, three worlds pooled) for the two households */
export function item1(xs) {
  const us = AP.calib(xs);
  const outcome = us.length === HH.length && us.every(u => u.read === 'CALIBRATED') ? 'HELD' : us.some(u => u.read === 'OPTIMISTIC' || u.read === 'PESSIMISTIC') ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { units: us, outcome };
}
/* ITEM 2: per household the paired differences D (WALL less PCLSI, after access); TOST at M; DIFFERS by Holm over the 4 */
export function item2(byHH, { b = B } = {}) {
  const hs = byHH.map(({ id, D }) => ({ id, n: D.length, m: mean(D), sd: sdOf(D), pLo: flipP(D.map(x => M - x), b, 7011), pHi: flipP(D.map(x => x + M), b, 7012), pAbove: flipP(D.map(x => x - M), b, 7013), pBelow: flipP(D.map(x => -M - x), b, 7014) }));
  const adj = holm(hs.flatMap(h => [h.pAbove, h.pBelow]));
  hs.forEach((h, i) => { h.hAbove = adj[2 * i]; h.hBelow = adj[2 * i + 1]; h.read = h.hAbove < ALPHA || h.hBelow < ALPHA ? 'DIFFERS' : Math.max(h.pLo, h.pHi) < ALPHA ? 'EQUIVALENT' : 'INCONCLUSIVE'; });
  const outcome = hs.length === HH.length && hs.every(h => h.read === 'EQUIVALENT') ? 'HELD' : hs.some(h => h.read === 'DIFFERS') ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { hs, outcome };
}
/* ITEMS 3 and 4: one household's world-0 per-path read terms under DEFAULT and PCLSI, for the read and read (b) */
export function itemB({ dD, dP, bD, bP }, { b = B } = {}) {
  const Rd = dP.map((x, j) => x - dD[j]), Rb = bP.map((x, j) => x - bD[j]), X = Rd.map((x, j) => x - Rb[j]);
  const r = mean(Rd), pR = flipP(Rd, b, 7001), rise = pR < ALPHA && r > 0;
  const it = rise ? twoWay(X.map((x, j) => x - (2 / 3) * Rd[j]), X.map((x, j) => Rd[j] / 3 - x), { b }) : { read: 'INCONCLUSIVE', note: 'NO RISE' };
  return { rise: { r, pR, there: rise, sd: sdOf(Rd) }, rb: mean(Rb), share: mean(X) / r, it, levelD: mean(dP), levelB: mean(bP) };
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), pe = x => (Number.isFinite(x) ? x.toExponential(2) : '-');
export function reading(units, out = console.log, { b = B } = {}) {
  const get = (id, x) => units.find(u => u.id === id && u.arm === 'READER' && u.label === labelOf('TS+J', x));
  const ARMS = ['DEFAULT', 'PCLSI', 'WALL'];
  out(`7AT: THE ALLOWANCE AXIS WITH A BUCKET AT THE WALL, AND O76'S READ (b) - S370 and S130 (READER, TS+J, W${W}, the switch margin 0.001), 30 points, ${NPW} paths a world at each world's node (seed ${SEED}); the used-allowance axis snapped (DEFAULT), interpolated on 0, 0.5, 1 (PCLSI) and interpolated with a bucket at the wall on 0, 0.5, 0.75, 1 (WALL); DEFAULT and PCLSI held line for line to 7ar's records (S130) and 7ap's (S370); read (b) beside every read`);
  // item 1
  const I1 = item1(HH.map(id => ({ id, ...AP.afterOf(get(id, 'WALL')) })));
  const line = (x, tag, extra = '') => `${tag} | ${String(x.n).padStart(6)}  ${f4(x.c).padStart(8)}  ${f4(x.n ? 100 * x.s / x.n : NaN).padStart(8)}  ${f4(x.pt).padStart(7)} | ${f4(x.lo).padStart(8)}${extra}`;
  out(`\nITEM 1 (the allowance part, primary): 7ap's two-sided rule on the WALL units, after access, three worlds pooled (margin ${AP.D} points; the lower tail at (c - ${AP.D}) and the upper at (c + ${AP.D}), Holm over ${I1.units.length} on each side; CALIBRATED when the CP 95% interval is inside c +/- ${AP.D})`);
  out('  household arm    |  paths     claim c  survived  c - surv | CP 95% low');
  for (const u of I1.units) out(line(u, `  ${u.id.padEnd(9)} WALL   `, ` | CP high ${f4(u.hi)} | p ${pe(u.p)} Holm ${pe(u.pH)}; upper p ${pe(u.pUp)} Holm ${pe(u.pHUp)} | ${u.read}`));
  out(`  -> ${I1.outcome} (HELD when both read CALIBRATED; FALSIFIED when either reads OPTIMISTIC or PESSIMISTIC)`);
  // item 2
  const Dof = id => { const W_ = get(id, 'WALL'), P_ = get(id, 'PCLSI'), D = []; for (let k = 0; k < K; k++) { const a = W_.pafter.find(x => x.k === k).paths, c = P_.pafter.find(x => x.k === k).paths; for (let j = 0; j < a.length; j++) if (a[j] !== null && c[j] !== null) D.push(a[j] - c[j]); } return D; };
  const I2 = item2(HH.map(id => ({ id, D: Dof(id) })), { b });
  out(`\nITEM 2 (the bucket's own part): D = the after-access residual under WALL less under PCLSI, per path with a claim at access in both, the three worlds pooled; margin ${M} point; EQUIVALENT when both one-sided tests (mean(${M} - D) > 0, mean(D + ${M}) > 0) are under ${ALPHA}; DIFFERS when mean(D - ${M}) > 0 or mean(-${M} - D) > 0 is under ${ALPHA} after Holm over 4`);
  for (const h of I2.hs) out(`  ${h.id.padEnd(5)} paths ${h.n} mean D ${f4(h.m)} (sd ${f2(h.sd)}) | TOST p ${pe(h.pLo)} and ${pe(h.pHi)} | beyond: above p ${pe(h.pAbove)} Holm ${pe(h.hAbove)}, below p ${pe(h.pBelow)} Holm ${pe(h.hBelow)} | ${h.read}`);
  out(`  -> ${I2.outcome} (HELD when both read EQUIVALENT; FALSIFIED when either DIFFERS)`);
  // items 3 and 4
  const termsOf = (id, x, k) => ({ d: get(id, x).pstage.find(p => p.k === k).paths.map(p => p[1]), bb: get(id, x).pbstage.find(p => p.k === k).paths });
  const IB = {};
  for (const [n, id] of [[3, 'S130'], [4, 'S370']]) {
    const D_ = termsOf(id, 'DEFAULT', WORLD), P_ = termsOf(id, 'PCLSI', WORLD);
    const I = IB[id] = itemB({ dD: D_.d, dP: P_.d, bD: D_.bb, bP: P_.bb }, { b });
    out(`\nITEM ${n} (O76's read (b) on ${id}${n === 3 ? ', the decisive read' : ''}; world ${WORLD}, the bridge stage, per path PCLSI less DEFAULT): the read term's rise Rd ${f4(I.rise.r)} points a path (sd ${f2(I.rise.sd)}, p ${pe(I.rise.pR)}: ${I.rise.there ? 'THERE' : 'NOT SHOWN'}); read (b)'s rise Rb ${f4(I.rb)}; X = Rd - Rb, the share read (b) takes away ${f2(I.share)}`);
    if (I.it.note) out(`  -> ${I.it.read} (${I.it.note})`);
    else { out(`  HELD side: mean(X - 2Rd/3) ${f4(I.it.mU)}, p ${pe(I.it.pU)}, Holm ${pe(I.it.hU)}; FALSIFIED side: mean(Rd/3 - X) ${f4(I.it.mD)}, p ${pe(I.it.pD)}, Holm ${pe(I.it.hD)}`); out(`  -> ${I.it.read}`); }
  }
  // reported
  out(`\nREPORTED (not items):`);
  out(`  THE AFTER STAGE BY WORLD (c - survived, points; paths alive at access):`);
  for (const id of HH) for (let k = 0; k < K; k++) out(`    ${id} world ${k}: ${ARMS.map(x => { const s = get(id, x).stage.find(y => y.k === k && y.stage === 'after'); return `${x} ${f2(s.n ? s.start - 100 * s.through / s.n : NaN)} (${s.n})`; }).join('  ')}`);
  out(`  THE AFTER STAGE, THREE WORLDS POOLED (7ap's rule on every arm, for comparison; c - survived): ${HH.map(id => ARMS.map(x => { const [u] = AP.calib([{ id, ...AP.afterOf(get(id, x)) }]); return `${id} ${x} ${f2(u.pt)} ${u.read}`; }).join('; ')).join('; ')}`);
  out(`  THE BRIDGE STAGE BY WORLD (the three terms and read (b)'s term, points a path):`);
  for (const id of HH) for (let k = 0; k < K; k++) for (const x of ARMS) {
    const P = get(id, x).pstage.find(p => p.k === k).paths, Bb = get(id, x).pbstage.find(p => p.k === k).paths;
    out(`    ${id} world ${k} ${x.padEnd(7)} quad ${f2(mean(P.map(p => p[0])))} read ${f2(mean(P.map(p => p[1])))} end ${f2(mean(P.map(p => p[2])))} S ${f2(mean(P.map(p => p[0] + p[1] + p[2])))} | read (b) ${f2(mean(Bb))}`);
  }
  out(`  THE READ TERM'S LEVEL AND READ (b)'S (world 0, PCLSI): ${HH.map(id => `${id} read ${f2(IB[id].levelD)} read (b) ${f2(IB[id].levelB)} (the share of the level taken away ${IB[id].levelD ? f2((IB[id].levelD - IB[id].levelB) / IB[id].levelD) : '-'})`).join('; ')}`);
  out(`  WALL'S RISE AGAINST DEFAULT, SPLIT THE SAME WAY (world 0): ${HH.map(id => { const D_ = termsOf(id, 'DEFAULT', WORLD), X_ = termsOf(id, 'WALL', WORLD), I = itemB({ dD: D_.d, dP: X_.d, bD: D_.bb, bP: X_.bb }, { b: 2000 }); return `${id} Rd ${f2(I.rise.r)} Rb ${f2(I.rb)} share taken away ${f2(I.share)}`; }).join('; ')} (descriptive)`);
  out(`  READ (b) BY YEAR (world 0, the bridge years and access: read term, read (b)'s term, the unsupported weight, the flat copy's stencil sum, its extrapolation, the corners' own survival (points), and the reads read (b) moved):`);
  for (const id of HH) for (const x of ARMS) { const u = get(id, x), A = u.access.year; out(`    ${id} ${x.padEnd(7)} ${u.bdec.filter(y => y.k === WORLD && y.t <= A).sort((p, q) => p.t - q.t).map(y => { const d = u.dec.find(z => z.k === WORLD && z.t === y.t); return `y${y.t}${y.t === A ? '(A)' : ''} read ${f2(d.n ? d.d * d.n / Math.max(1, y.reads) : NaN)} (b) ${f2(y.db)} unsup ${f2(d.unsup)} flat ${f2(y.flat)} extra ${f2(y.extra)} S ${f2(y.unsS)} moved ${y.moved}/${y.reads}`; }).join('; ')}`); }
  out(`  THE WHOLE PLAN, BESIDE THE YEAR-0 READ TERM (reported, not judged: the year-0 read leans on unsupported nodes; mixture-weighted claim at year 0 less the simulated survival, by world, and the year-0 read term):`);
  for (const id of HH) out(`    ${id}: ${ARMS.map(x => { const u = get(id, x); return `${x} ${[0, 1, 2].map(k => { const nd = u.node.find(y => y.k === k), r0 = u.resid.find(y => y.k === k && y.t === 0), d0 = u.dec.find(y => y.k === k && y.t === 0); return `w${k} ${f2(r0.table - nd.sim)} (y0 read ${f2(d0.d)})`; }).join(' ')}`; }).join('; ')}`);
  out(`  THE WALL (after access, three worlds pooled; table - next over path-years at 0.6 to under 0.75 of the allowance; and the draw stall):`);
  for (const id of HH) out(`    ${id}: ${ARMS.map(x => { const u = get(id, x), xs = u.wall.filter(y => y.stage === 'after' && y.at === 'wall'), n = xs.reduce((t, y) => t + y.n, 0), ls = u.lsa.filter(y => y.t >= u.access.year); return `${x} ${n ? f2(xs.filter(y => y.n > 0).reduce((t, y) => t + y.n * (y.table - y.next), 0) / n) : '-'} (${n}) stall ${ls.reduce((t, y) => t + y.stall, 0)} of ${ls.reduce((t, y) => t + y.wall, 0)}`; }).join('; ')}`);
  out(`  THE TABLES AND THE EXTRAPOLATION: ${HH.map(id => ARMS.map(x => { const u = get(id, x); return `${id} ${x} table ${u.table} gap ${u.gap.gap} (tables ${u.xcount.tables}, nodes extrapolated ${u.xcount.extrapolated}, left flat ${u.xcount.flat})`; }).join('; ')).join('; ')}`);
  out(`\nOUTCOME: 1 ${I1.outcome}; 2 ${I2.outcome}; 3 ${IB.S130.it.read}; 4 ${IB.S370.it.read}`);
  return { I1, I2, I3: IB.S130, I4: IB.S370 };
}

/* PLANTED: 7ar's built log turned into 7at's units (S130 and S370, DEFAULT, PCLSI and WALL) with 7at's lines added */
export function builtLog(o = {}) {
  const N = 8, T = 6, AC = 2, fail = 1;
  const text = AR.builtLog({ npw: N });
  const blocks = text.split(/(?=^\S.*? case \| unit )/m).filter(x => x.trim());
  const blockOf = (arm, x) => blocks.find(bk => bk.includes(`case | unit ${arm}/${AR.labelOf('TS+J', x)} |`));
  const out = [];
  for (const [id, a, l, X] of UNITS) {
    if (o.skip === `${id}|${X}`) continue;
    let bk = blockOf('READER', X === 'WALL' ? 'PCLSI' : X);
    if (X === 'WALL') bk = bk.split(`READER/${AR.labelOf('TS+J', 'PCLSI')}`).join(`READER/${l}`).replace(/pcls 0,0\.5,1 pclsStrict/, `pcls ${o.wallBuckets ? '0,0.5,1' : BUCKETS.WALL} pclsStrict`);
    bk = bk.replace(/^S130(\s+case)/m, (mm, rest) => `${id.padEnd(4)}${rest}`);
    if (o.noDbinWall && X === 'WALL' && id === 'S370') bk = bk.replace(/^\s+dbin \S+ world 1 after ulo: .*\n/m, '');
    const L = `${a}/${l}`, add = [];
    for (let k = 0; k < K; k++) {
      // the reads: year 0 all N paths, year 1 the N - 1 survivors of year 1's bill; read (b) takes `sh` off each bridge read
      const sh = o.noMove && X === 'PCLSI' ? 0 : X === 'DEFAULT' ? 0.5 : 1.5, bump = X === 'DEFAULT' ? 0 : 0;
      for (let t = 0; t <= T; t++) {
        const reads = t === 0 ? N : t === 1 ? N - fail : t < T ? N - fail : 0;
        const per = t === 0 ? 6 + bump : t === 1 ? -2 : 0, bridge = t < AC, s = bridge ? sh : 0;
        const db = reads ? (per - s + (o.readbOff && X === 'WALL' && k === 1 && t === 3 ? 0.5 : 0)).toFixed(4) : '-';
        const moved = bridge && reads ? (o.noMove && X === 'PCLSI' ? 0 : reads) : (o.movedAfter && X === 'DEFAULT' && t === 4 && k === 0 ? 1 : 0);
        if (o.noBdec && X === 'WALL' && k === 2 && t === 5) continue;
        add.push(`${''.padEnd(16)} bdec ${L} world ${k} year ${t}: reads ${o.bdecReads && X === 'PCLSI' && k === 0 && t === 3 ? reads - 1 : reads} readb ${db} flat ${reads ? (o.flatHigh && X === 'DEFAULT' && t === 0 ? '120.0000' : bridge ? '20.0000' : '0.0000') : '-'} extra ${reads ? (bridge ? '15.0000' : '0.0000') : '-'} unsS ${reads ? (bridge ? '1.0000' : '0.0000') : '-'} moved ${moved}`);
      }
      if (!(o.noPb && X === 'WALL' && k === 0)) {
        const pp = Array.from({ length: N }, (_, j) => (j < fail ? 6 - sh : 4 - 2 * sh) + (o.pbOff && X === 'DEFAULT' && k === 1 && j === 3 ? 0.5 : 0));
        add.push(`${''.padEnd(16)} pbstage ${L} world ${k}: ${pp.map(x => x.toFixed(4)).join(';')}`);
      }
      if (!(o.noPa && X === 'PCLSI' && k === 2)) {
        const pa = Array.from({ length: N }, (_, j) => (j < fail ? '-' : (-20 + (o.paOff && X === 'WALL' && k === 0 && j === 2 ? 3 : 0)).toFixed(4)));
        if (o.paShort && X === 'DEFAULT' && k === 0) pa[2] = '-';
        add.push(`${''.padEnd(16)} pafter ${L} world ${k}: ${pa.join(';')}`);
      }
    }
    if (!(o.noX && X === 'WALL')) add.push(`${''.padEnd(16)} xcount ${L}: tables 9 extrapolated 40 flat 2`);
    bk = bk.replace(new RegExp(`^(\\s+done ${L.replace(/[/+.]/g, m => `\\${m}`)})$`, 'm'), `${add.join('\n')}\n$1`);
    out.push(bk);
  }
  if (o.extra) out.push(`S999             case | unit READER/TS+J/W0.02 | lambda ${AR.LAMBDA} tier own riskAbove auto mix 3\n`);
  return out.join('');
}
const REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() }, EDGES = [];
function planted() {
  const cases = [];
  const clean = parse(builtLog());
  const SZ = { pts: '30', npw: 8 };
  const refOf = (o = {}) => (id, a, l) => { const r = clean.find(u => u.id === id && u.arm === a && u.label === l) || null; if (r && o.refTable && id === 'S130' && axisOf(l) === 'PCLSI') return { ...r, table: '91.0000' }; if (r && o.refPstage && id === 'S130' && axisOf(l) === 'DEFAULT') return { ...r, pstage: r.pstage.map(p => (p.k === 0 ? { ...p, paths: p.paths.map((q, j) => (j === 2 ? [q[0], q[1] + 1, q[2]] : q)) } : p)) }; if (r && o.refApNode && id === 'S370' && axisOf(l) === 'PCLSI') return { ...r, node: r.node.map(x => (x.k === 1 ? { ...x, sim: x.sim + 1 } : x)) }; return r; };
  const refused = (o, ro = {}) => { try { return String(gate(parse(builtLog(o)), refOf(ro), refOf(ro), SZ).length > 0); } catch (e) { return `crash: ${e.message}`; } };
  { const bad = gate(clean, refOf(), refOf(), SZ); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o, ro] of [['an unregistered unit', { extra: true }], ['a missing unit', { skip: 'S370|WALL' }], ['a WALL unit on three buckets', { wallBuckets: true }],
    ['a missing bdec year', { noBdec: true }], ['bdec reads off the dec reads', { bdecReads: true }], ['a flat-copy sum above 100', { flatHigh: true }],
    ['no pbstage line', { noPb: true }], ['a pbstage path off the bdec sums', { pbOff: true }], ['no pafter line', { noPa: true }], ['a pafter claim off the after stage\'s mean', { paOff: true }],
    ['a pafter count off the after stage\'s paths', { paShort: true }], ['no xcount line', { noX: true }], ['(7ar\'s checks alone, on a WALL unit) a missing dbin line', { noDbinWall: true }], ['read (b) that moves no bridge read (O79)', { noMove: true }],
    ['an S130 table that is not 7ar\'s', {}, { refTable: true }], ['an S130 pstage line that is not 7ar\'s', {}, { refPstage: true }], ['an S370 node line that is not 7ap\'s', {}, { refApNode: true }]]) cases.push([`the gate refuses ${nm}`, refused(o, ro || {}), 'true']);
  // the built set's READER years carry unsupported weight 0.3 everywhere (7ar's built log), so the 'no unsupported weight'
  // checks are shown on a built set with the after-access years' weight set to 0, as the real runs have it
  { const noW = t => t.replace(/^(\s+dec \S+ world \d+ year ([2-6]): .* unsup )0\.3000( rowcopy )0\.1000$/gm, '$10.0000$30.0000');
    const g2 = (o) => { try { return String(gate(parse(noW(builtLog(o))), refOf(), refOf(), SZ).filter(x => !/is not 7ar's|is not 7ap's|lines are not/.test(x)).length > 0); } catch (e) { return `crash: ${e.message}`; } };
    cases.push(['(no weight after access) a built set gates clean but for the identity it changed', g2({}), 'false']);
    cases.push(['(no weight after access) the gate refuses read (b) off the read', g2({ readbOff: true }), 'true']);
    cases.push(['(no weight after access) the gate refuses read (b) moving a read', g2({ movedAfter: true }), 'true']); }
  // the items on built per-path values
  const n = 400, base = Array.from({ length: n }, (_, j) => 1 + (j % 7) * 0.3 + ((j * 3) % 5) * 0.2);
  const noise = (s, f = 1.7) => base.map((_, j) => s * Math.sin(j * f));
  const add = (xs, c, nz = 0, f = 1.7) => xs.map((x, j) => x + c + (nz ? nz * Math.sin(j * f) : 0));
  const it3 = (o, b = 2000) => { const I = itemB(o, { b }); REACHED[3].add(I.it.read); REACHED[4].add(I.it.read); return I; };
  { const I = it3({ dD: base, dP: add(base, 2, 1), bD: base, bP: add(base, 0.1, 1, 2.9) }); cases.push(['read (b) takes the whole rise away: HELD', I.it.read, 'HELD']); }
  { const I = it3({ dD: base, dP: add(base, 2, 1), bD: base, bP: add(base, 2, 1) }); cases.push(['read (b) rises as the read does: FALSIFIED', I.it.read, 'FALSIFIED']); }
  { const I = it3({ dD: base, dP: add(base, 2, 1), bD: base, bP: add(base, 1, 1, 2.9) }); cases.push(['read (b) takes half the rise away: INCONCLUSIVE', I.it.read, 'INCONCLUSIVE']); }
  { const I = it3({ dD: base, dP: add(base, 0, 1), bD: base, bP: base }); cases.push(['no rise in the read term: NO RISE', `${I.rise.there} ${I.it.read} ${I.it.note}`, 'false INCONCLUSIVE NO RISE']); EDGES.push('no rise'); }
  { const I = it3({ dD: base, dP: add(base, 0.05, 5), bD: base, bP: add(base, -3, 0) }); cases.push(['a rise too small to show (p above 0.05) with read (b) far below: NO RISE, not HELD', `${I.rise.r > 0} ${I.rise.there} ${I.it.read}`, 'true false INCONCLUSIVE']); EDGES.push('a positive rise not shown'); }
  { const I = it3({ dD: base, dP: add(base, 3, 0), bD: base, bP: add(base, 1, 0) }); cases.push(['read (b) takes away exactly two thirds, no noise: not HELD', I.it.read, 'INCONCLUSIVE']); EDGES.push('read (b) at exactly 2/3'); }
  { const I = it3({ dD: base, dP: add(base, 3, 0), bD: base, bP: add(base, 2, 0) }); cases.push(['read (b) takes away exactly a third, no noise: not FALSIFIED', I.it.read, 'INCONCLUSIVE']); EDGES.push('read (b) at exactly 1/3'); }
  { const I = it3({ dD: base, dP: add(base, 2, 1), bD: base, bP: add(base, -1, 1, 2.9) }); cases.push(['read (b) overshoots (takes away more than the rise): HELD', I.it.read, 'HELD']); EDGES.push('read (b) overshooting'); }
  const it2 = (byHH, b = 2000) => { const I = item2(byHH, { b }); REACHED[2].add(I.outcome); return I; };
  { const I = it2([{ id: 'S130', D: noise(0.5) }, { id: 'S370', D: noise(0.5, 2.3) }]); cases.push(['WALL within 1 point of PCLSI on both: HELD', I.outcome, 'HELD']); }
  { const I = it2([{ id: 'S130', D: add(noise(0.5), 2) }, { id: 'S370', D: noise(0.5, 2.3) }]); cases.push(['WALL 2 points above PCLSI on S130: FALSIFIED', `${I.hs[0].read} ${I.outcome}`, 'DIFFERS FALSIFIED']); }
  { const I = it2([{ id: 'S130', D: add(noise(0.5), -2) }, { id: 'S370', D: noise(0.5, 2.3) }]); cases.push(['WALL 2 points below PCLSI on S130: FALSIFIED', `${I.hs[0].read} ${I.outcome}`, 'DIFFERS FALSIFIED']); }
  { const I = it2([{ id: 'S130', D: add(noise(30), 0) }, { id: 'S370', D: noise(0.5, 2.3) }]); cases.push(['WALL against PCLSI too noisy to tell on S130: INCONCLUSIVE', `${I.hs[0].read} ${I.outcome}`, 'INCONCLUSIVE INCONCLUSIVE']); }
  { const I = it2([{ id: 'S130', D: add(noise(3), -0.9) }, { id: 'S370', D: noise(0.5, 2.3) }]); cases.push(['D near -0.9 on S130: within the margin on one side only, so not EQUIVALENT (TOST needs both)', `${I.hs[0].read} ${I.outcome}`, 'INCONCLUSIVE INCONCLUSIVE']); EDGES.push('TOST passing one side'); }
  { const I = it2([{ id: 'S130', D: add(noise(3), 1.21) }, { id: 'S370', D: noise(0.5, 2.3) }]); cases.push(['D just beyond the margin on S130 (raw p near 0.02, Holm over 4 lifts it): not DIFFERS', `${I.hs[0].pAbove < 0.05} ${I.hs[0].read}`, 'true INCONCLUSIVE']); EDGES.push('DIFFERS at the Holm boundary'); }
  { const I = it2([{ id: 'S130', D: add(base.map(() => 0), 1) }, { id: 'S370', D: noise(0.5, 2.3) }]); cases.push(['D exactly at the margin on every path: neither EQUIVALENT nor DIFFERS', I.hs[0].read, 'INCONCLUSIVE']); EDGES.push('D at the margin'); }
  const it1 = xs => { const I = item1(xs); REACHED[1].add(I.outcome); return I; };
  { const I = it1([{ id: 'S130', n: 5000, c: 80, s: 4000 }, { id: 'S370', n: 5000, c: 72, s: 3600 }]); cases.push(['both WALL units at their claim on 5,000 paths: HELD', I.outcome, 'HELD']); }
  { const I = it1([{ id: 'S130', n: 5000, c: 80, s: 3700 }, { id: 'S370', n: 5000, c: 72, s: 3600 }]); cases.push(['S130 WALL 6 points optimistic: FALSIFIED', `${I.units[0].read} ${I.outcome}`, 'OPTIMISTIC FALSIFIED']); }
  { const I = it1([{ id: 'S130', n: 5000, c: 80, s: 4300 }, { id: 'S370', n: 5000, c: 72, s: 3600 }]); cases.push(['S130 WALL 6 points pessimistic: FALSIFIED', `${I.units[0].read} ${I.outcome}`, 'PESSIMISTIC FALSIFIED']); }
  { const I = it1([{ id: 'S130', n: 300, c: 80, s: 240 }, { id: 'S370', n: 5000, c: 72, s: 3600 }]); cases.push(['S130 WALL on 300 paths (the interval too wide): INCONCLUSIVE', `${I.units[0].read} ${I.outcome}`, 'INCONCLUSIVE INCONCLUSIVE']); EDGES.push('too few paths to calibrate'); }
  // the extrapolation, on a built grid row (6 share nodes, supported at the low shares)
  { const ni = 6, pts = [0, 0.2, 0.4, 0.6, 0.8, 1], g = { size: ni, np: 1, ni, nt: 1, gain: [0], pcls: [0], axes: { a: { pts } }, index: (ip, ii) => ii };
    const p = [1, 1, 1, 0.2, 0.1, 0], c = [0.9, 0.8, 0.7, 0.7, 0.7, 0.7], S = [0.9, 0.8, 0.7, 0.05, 0.02, 0.001], R = S.map((s, i) => s - p[i] * c[i]);
    const x = extrapolate(g, { p, c, R });
    cases.push(['extrapolate: the unsupported nodes follow the last two supported (0.6, 0.5, 0.4)', JSON.stringify(Array.from(x.c).map(v => +v.toFixed(6))), JSON.stringify([0.9, 0.8, 0.7, 0.6, 0.5, 0.4])]);
    cases.push(['extrapolate: every node still reproduces S', String(Array.from(x.c).every((cv, i) => Math.abs(p[i] * cv + x.R[i] - S[i]) < 1e-12)), 'true']);
    cases.push(['extrapolate: 3 nodes extrapolated, none left flat', `${x.extrapolated} ${x.flat}`, '3 0']);
    const x1 = extrapolate(g, { p: [1, 0.1, 0.1, 0.1, 0.1, 0.1], c: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9], R: S.map(() => 0) });
    cases.push(['extrapolate: one supported node leaves the row flat (nothing to extrapolate from)', `${x1.extrapolated} ${x1.flat} ${Array.from(x1.c).every(v => v === 0.9)}`, '0 5 true']); EDGES.push('one supported node in a row');
    const x2 = extrapolate(g, { p: [1, 1, 0.1, 0.1, 0.1, 0.1], c: [0.2, 0.9, 0.9, 0.9, 0.9, 0.9], R: S.map(() => 0) });
    cases.push(['extrapolate: a rising row clips at 1', JSON.stringify(Array.from(x2.c).map(v => +v.toFixed(6))), JSON.stringify([0.2, 0.9, 1, 1, 1, 1])]); EDGES.push('extrapolation clipped');
    const x3 = extrapolate(g, { p: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1], c: [0, 0, 0, 0, 0, 0], R: S });
    cases.push(['extrapolate: a row with no support is left to the reader\'s row copy', `${x3.extrapolated} ${x3.flat}`, '0 0']); EDGES.push('a row with no support'); }
  // the lists held together
  { const src = readFileSync(join(HERE, 'audit-7at.mjs'), 'utf8'), m = /^export const UNITS = (\[.*\]);$/m.exec(src);
    cases.push(['the units are audit-7at.mjs\'s, in its order', m ? String(JSON.stringify(JSON.parse(m[1].replace(/'/g, '"'))) === JSON.stringify(UNITS7)) : 'no UNITS line', 'true']); }
  { const src = readFileSync(join(HERE, 'audit-7at.mjs'), 'utf8'), m = /^export const WALLB = (\[.*\]);$/m.exec(src);
    cases.push(['the WALL buckets are audit-7at.mjs\'s', m ? String(JSON.parse(m[1]).join(',') === BUCKETS.WALL) : 'no WALLB line', 'true']); }
  cases.push(['every S130 DEFAULT and PCLSI unit is a 7ar unit', String(UNITS7.filter(u => u[0] === 'S130' && u[3] !== 'WALL').every(([id, a, s, x]) => AR.UNITS7.some(y => y[0] === id && y[1] === a && y[2] === s && y[3] === x))), 'true']);
  cases.push(['every S370 DEFAULT and PCLSI unit is a 7ap unit', String(UNITS7.filter(u => u[0] === 'S370' && u[3] !== 'WALL').every(([id, a, s, x]) => AP.UNITS7.some(y => y[0] === id && y[1] === a && y[2] === s && y[3] === x))), 'true']);
  cases.push(['parse reads a bdec line', JSON.stringify(parse('S130             case | unit READER/TS+J/W0.02/WALL | lambda x tier own riskAbove auto mix 3\n                 bdec READER/TS+J/W0.02/WALL world 0 year 1: reads 1990 readb 1.2000 flat 20.5000 extra 15.0000 unsS 0.1000 moved 1200\n')[0].bdec), JSON.stringify([{ k: 0, t: 1, reads: 1990, db: 1.2, flat: 20.5, extra: 15, unsS: 0.1, moved: 1200 }])]);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2, 3, 4].map(i => `OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`).join('\n')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7at'), DIR_AR = args[1] || join(HERE, 'results', 'diag7ar'), DIR_AP = args[2] || join(HERE, 'results', 'diag7ap');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const LR = logsOf(DIR_AR); requireFairLogs(LR, AR.PRED);
  const LA = logsOf(DIR_AP); requireFairLogs(LA, AP.PRED);
  const arUnits = Object.values(LR).flatMap(AR.parse), apUnits = Object.values(LA).flatMap(AP.parse);
  const refAr = (id, a, l) => arUnits.find(u => u.id === id && u.arm === a && u.label === l && u.done) || null;
  const refAp = (id, a, l) => apUnits.find(u => u.id === id && u.arm === a && u.label === l && u.done) || null;
  const bad = gate(units, refAr, refAp);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${UNITS.length} units; S130 DEFAULT and PCLSI 7ar's line for line, S370 DEFAULT and PCLSI 7ap's; WALL its DEFAULT twin's ran, joint and access lines on the buckets 0,0.5,0.75,1; 7ar's checks (and 7ap's) on every unit; read (b) equal to the read where the read has no unsupported weight, its path sums and the after-access paths consistent, and read (b) moving the bridge reads on every unit (O79)`);
  reading(units);
}
