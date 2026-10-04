/*
 * THE 7AV REDUCER: THE STEP-READ TEST (predictions/diag-7av.md; PLAN.md 7av; O76, O80, O81; the deep review after 7at,
 * deep-review-log.md 4 Oct 03:18 UK; the maintainer's 'Run 1', 4 Oct). Reads results/diag7av/case*.txt (batch-7av.sh:
 * audit-7av.mjs, one process a unit) beside 7at's records (results/diag7at), each read through its own stamps.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7av and 7at;
 *   - every registered unit once and done, nothing unregistered;
 *   - THE SETTINGS THE UNITS DIFFER IN: each unit's allowance axis (DEFAULT snapped, PCLSI interpolated, on 0,0.5,1), its share
 *     points (the ran line's grid total<points>x<S>x<S>, S the unit's 6 or 12) and its reference (readerRef 'order' on ORDER
 *     alone);
 *   - IDENTITY: the READER units at 6 share points are 7at's units line for line (its table, ran, gap, joint, access and axis
 *     lines and every line kind it printed: 7ap's, 7ar's and 7at's) - the same code, seed and paths, the step split adding lines;
 *   - TWINS: each unit at 12 share points and the ORDER unit has its READER PCLSI twin's at 6 ran line but for the grid and the
 *     reference, its access line, and its joint line's scale, cap and risk-above decision;
 *   - 7AT'S CHECKS on every unit (reduce-7at.mjs gate, the unit shown to it as 7at's READER unit of its axis, its grid and
 *     reference shown as 7at's once checked above; which runs 7ar's and 7ap's checks too): the settings, every line present, the
 *     three terms summing to the residual, read (b)'s lines consistent and responsive;
 *   - 7AV'S LINES, complete and consistent, per world: one sdec line a year whose reads are the bdec line's and split into step,
 *     spread and other; the flat reads summing to the dec line's read term and the straight-line reads to the bdec line's read
 *     (b), to rounding; where the year's reads carry no unsupported weight, the straight line and the quadratic equal the flat
 *     read and the quadratic moved none; one psplit line of the run's paths, six terms each, per path step flat + spread flat +
 *     other equal to its pstage read term and step line + spread line + other to its pbstage term, and each column summing to
 *     the sdec lines' bridge years; one qcount line a unit (steps at most the tables, its straight-line nodes at most xcount's);
 *     and RESPONSIVENESS (CHECKLIST item 6): in world 0 every unit has a step read in the bridge, and on every PCLSI READER unit
 *     the quadratic moved at least one bridge step read (a household whose 6-point PCLSI unit's quadratic fell back to the
 *     straight line at every node it extrapolated - qcount's back equal to its quad - has not acted: item 2 reads INCONCLUSIVE
 *     there, QUADRATIC DID NOT ACT; a quadratic through three nodes that equals the line is data, read by item 2); one pyear line a world of
 *     the run's paths, a term a bridge year each, per path summing to its pstage read term and per year to the sdec line's flat
 *     reads;
 *   - THE CLASS, across units (the plan-auditor's BLOCKING 1 and the pre-launch deep review of 4 Oct 07:06 UK): PCLSI at 6
 *     against PCLSI at 12 and against DEFAULT at 6 on each household put the same world-0 bridge years in the same classes
 *     (step, spread, other); S370's ORDER against its PCLSI at 6 the same, but for a year the reader's reference reads as
 *     spread, which 'order' may read as step (the preflight of 4 Oct found its year 3 so: 'order' turns the inflow year into a
 *     step) - item 3 reads the same years in both units by pyear, so the class difference changes no read compared; and the
 *     READER units at 6 share points read their step years where the deep review found them (S130 plan year 0, S370 years 2
 *     and 6), so the run's class agrees with the review's before any item is read.
 * THE ITEMS (registered rule; ALPHA 0.05; Fisher's paired randomization test as 7ar's, B = 20,000 flips, one-sided; world 0,
 * the bridge stage, per path, paired across arms on the same paths; psplit's columns):
 *   1. RESOLUTION (the deep review's cause 1 against cause 3): F6, F12 = the step reads' flat-copy term under PCLSI at 6 and at
 *      12 share points. Premise per household: mean F6 above 0 (p under 0.05). HELD (the flat copy's step error shrinks to 0.6
 *      of itself or less at 12) when the test of mean(0.6 F6 - F12) above 0 is under 0.05 after Holm over 4 (two households, two
 *      directions); FALSIFIED (0.9 of itself or more: no change with spacing) when the test of mean(F12 - 0.9 F6) above 0 is;
 *      else INCONCLUSIVE; no premise: INCONCLUSIVE (NO STEP ERROR). The item HELD when both households read HELD; FALSIFIED when
 *      either reads FALSIFIED; else INCONCLUSIVE.
 *   2. CURVATURE (cause 2): L6, Q6 = the step reads' straight-line and quadratic terms under PCLSI at 6. Premise per household:
 *      mean L6 above 0. HELD (the quadratic leaves a third or less of the straight line's residual, either sign) when both
 *      tests mean(L6/3 - Q6) above 0 and mean(Q6 + L6/3) above 0 are under 0.05 (the larger p) after Holm over 4; FALSIFIED (the
 *      quadratic takes away a third or less of it) when the test of mean(Q6 - 2 L6/3) above 0 is; else INCONCLUSIVE; flagged
 *      OVERSHOT when mean(-L6/3 - Q6) above 0 is under 0.05. The item as item 1.
 *   3. O81 ON S370 (O36's proportional reference at the spread reads): P6, O6 = S370's flat read term summed over the bridge
 *      years its READER PCLSI unit at 6 reads as spread (pyear), under PCLSI at 6 with the reader's reference and with
 *      'order''s - the same years in both, whatever class 'order' gives them. Premise: mean P6 below 0 (the test of mean(-P6) above 0 under 0.05).
 *      HELD ('order' shrinks the spread pessimism by half or more) when the test of mean(O6 - P6/2) above 0 is under 0.05 after
 *      Holm over 2; FALSIFIED (by a quarter or less) when the test of mean(0.75 P6 - O6) above 0 is; else INCONCLUSIVE; no
 *      premise: INCONCLUSIVE (NO SPREAD PESSIMISM).
 *   4. THE BRIDGE PART (the deep review: 'not needed only if L-step or Q-step at 12 points leaves the step reads under 0.5'):
 *      L12, Q12 = the step reads' straight-line and quadratic terms under PCLSI at 12. A read X is UNDER when both tests
 *      mean(0.5 - X) above 0 and mean(X + 0.5) above 0 are under 0.05 (the larger p), Holm over its household's two reads; OVER
 *      when mean(X - 0.5) above 0 or mean(-0.5 - X) above 0 is under 0.05 after Holm over 8 (two households, two reads, two
 *      directions). HELD (the bridge part not needed) when on both households a read is UNDER; FALSIFIED (needed) when on either
 *      household both reads are OVER; else INCONCLUSIVE. Item 4 reads 12-point tables: 'not needed' holds at 12 share points
 *      only (the pre-launch deep review).
 *   5. CURVATURE OR A BOUNDARY LAYER (the pre-launch deep review's registered prediction): the straight line's residual fraction
 *      within each unit, r = mean L / mean F at the step reads, r6 at 6 share points and r12 at 12 - a ratio within one solve,
 *      largely free of the policy moving between solves. Premise per household: mean F12 above 0 and r6 above 0. HELD (smooth
 *      curvature: the residual fraction shrinks with the cell, 0.7 of r6 or less) when the test of mean(0.7 r6 F12 - L12) above 0
 *      is under 0.05 after Holm over 4; FALSIFIED (a boundary layer narrower than a cell: 0.9 of r6 or more) when the test of
 *      mean(L12 - 0.9 r6 F12) above 0 is; else INCONCLUSIVE; r6 taken as known from the 6-point unit (its own noise not
 *      carried; declared). The item as item 1.
 *   Overshoot flags: item 1 flagged OVERSHOT when mean(-0.6 F6 - F12) above 0 is under 0.05 (the step error turns the other
 *   way at 12); item 3 flagged OVERSHOT when mean(O6 + P6/2) above 0 is ('order' turns the spread reads optimistic by more than
 *   half the pessimism it removes).
 * Reported, not items: each unit's bridge-stage step, spread and other terms by world under each read; the step and spread
 * terms by year; the straight line at step reads' share of the whole rise at 6 points (the review's 0.73 on S370 and 0.64 on
 * S130 from 7at's lines, reproduced: the 6-point units are 7at's); the spread term at 12 points over 6 beside item 3 (if share
 * spacing also shrinks the spread pessimism, O81 is partly the flat copy's); S370's reference against its own draw and the
 * engine's paid share under the reader's reference and 'order''s (O36 is named only if 'order' sits nearer the engine); the
 * extrapolation's node, fall-back and clip counts.
 *   node research/solver/reduce-7av.mjs [dir] [dir7at] > research/solver/results-7av.txt
 *   node research/solver/reduce-7av.mjs --planted   the planted checks alone, the outcomes they reach (OUTCOMES REACHED)
 *                                                     and the boundary cases (EDGES)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import * as AT from './reduce-7at.mjs';
import * as AR from './reduce-7ar.mjs';
import { extrapolateOrder, isStep } from './extrap-7av.mjs';
import { extrapolate } from './extrap-7at.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7av.md';
export const PTS = '30', SEED = '7002', W = '0.02', NPW = 2000, K = 3, ALPHA = 0.05, B = 20000, WORLD = 0, BAR = 0.5;
// [household, reader, setting, the allowance axis, share points], audit-7av.mjs's UNITS
export const UNITS7 = [['S370', 'READER', 'TS+J', 'PCLSI', 12], ['S130', 'READER', 'TS+J', 'PCLSI', 12], ['S370', 'READER', 'TS+J', 'DEFAULT', 6], ['S370', 'READER', 'TS+J', 'PCLSI', 6], ['S370', 'ORDER', 'TS+J', 'PCLSI', 6], ['S130', 'READER', 'TS+J', 'DEFAULT', 6], ['S130', 'READER', 'TS+J', 'PCLSI', 6]];
export const labelOf = (s, x = 'DEFAULT', sh = 6) => `${s}/W${W}${x === 'DEFAULT' ? '' : `/${x}`}${sh === 6 ? '' : `/S${sh}`}`;
export const UNITS = UNITS7.map(([id, a, s, x, sh]) => [id, a, labelOf(s, x, sh), x, sh]);
export const HH = ['S130', 'S370'];
const axisOf = l => (/\/PCLSI(\/|$)/.test(l) ? 'PCLSI' : 'DEFAULT');
const sharesOf = l => (/\/S(\d+)$/.test(l) ? Number(/\/S(\d+)$/.exec(l)[1]) : 6);

const SDECL = /^\s+sdec (\S+?)\/(\S+) world (\d+) year (\d+): reads (\d+) step (\d+) flat (\S+) lin (\S+) quad (\S+) unsup (\S+) qmoved (\d+) spread (\d+) flat (\S+) lin (\S+) other (\d+) flat (\S+)$/;
const PSPLITL = /^\s+psplit (\S+?)\/(\S+) world (\d+): (.*)$/;
const PYEARL = /^\s+pyear (\S+?)\/(\S+) world (\d+): (.*)$/;
const QCOUNTL = /^\s+qcount (\S+?)\/(\S+): tables (\d+) steps (\d+) lin (\d+) linLo (\d+) linHi (\d+) quad (\d+) back (\d+) quadLo (\d+) quadHi (\d+)$/;
const CASEL = /^(\S.*?)\s+case \| unit (\S+?)\/(\S+) \| lambda /;
const num = x => (x === '-' ? NaN : Number(x));

/* 7at's parse (7ap's, 7ar's and 7at's lines), and 7av's beside it */
export function parse(text) {
  const units = AT.parse(text);
  let cur = null, i = -1;
  for (const line of text.split('\n')) {
    if (CASEL.test(line)) { cur = units[++i]; Object.assign(cur, { sdec: [], psplit: [], pyear: [], qcount: null }); continue; }
    if (!cur) continue;
    let m;
    const mine = (a, l) => a === cur.arm && l === cur.label;
    if ((m = SDECL.exec(line)) && mine(m[1], m[2])) cur.sdec.push({ k: +m[3], t: +m[4], reads: +m[5], ns: +m[6], sf: num(m[7]), sl: num(m[8]), sq: num(m[9]), su: num(m[10]), qm: +m[11], np: +m[12], pf: num(m[13]), pl: num(m[14]), no: +m[15], of: num(m[16]) });
    else if ((m = PSPLITL.exec(line)) && mine(m[1], m[2])) cur.psplit.push({ k: +m[3], paths: m[4].split(';').map(x => x.split(',').map(Number)) });
    else if ((m = PYEARL.exec(line)) && mine(m[1], m[2])) cur.pyear.push({ k: +m[3], paths: m[4].split(';').map(x => x.split(',').map(Number)) });
    else if ((m = QCOUNTL.exec(line)) && mine(m[1], m[2])) cur.qcount = { tables: +m[3], steps: +m[4], lin: +m[5], linLo: +m[6], linHi: +m[7], quad: +m[8], back: +m[9], quadLo: +m[10], quadHi: +m[11] };
  }
  return units;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const byKT = xs => [...xs].sort((x, y) => x.k - y.k || (x.t ?? 0) - (y.t ?? 0) || String(x.stage + x.kind + x.key + x.chg + x.pos + x.at + x.bin).localeCompare(String(y.stage + y.kind + y.key + y.chg + y.pos + y.at + y.bin)));
const tol = n => n * 3e-4 + 1e-6;
const AT_LINES = ['bref', 'node', 'stage', 'resid', 'cells', 'lsa', 'pcell', 'wall', 'dec', 'dbin', 'moves', 'pstage', 'bdec', 'pbstage', 'pafter'];
const gridOf = ran => { const m = / grid total(\d+)x(\d+)x(\d+)/.exec(ran || ''); return m ? { pts: m[1], a: +m[2], b: +m[3] } : null; };
export const normRan = ran => (ran || '').replace(/ grid total(\d+)x\d+x\d+/, ' grid total$1x6x6').replace(/ readerRef order/, '');
const IDENT_7AT = /unit lines, not 1|no unit in 7ar's records|no unit in 7ap's records|is not 7ar's|is not 7ap's|lines are not 7ar's|lines are not 7ap's/;

/* THE GATE. `refAt(id, arm, label)` 7at's parsed unit; `pts` and `npw` the run's size */
/* the class rule across units: the same class every year, but for ORDER (stepGain) a year the reader's reference reads as
   spread ('p') may read as step ('s') - item 3 reads those years by pyear in both units */
export function classCompat(a, b, stepGain = false) {
  if (a === null || b === null) return false;
  const xa = a.split(' '), xb = b.split(' ');
  if (xa.length !== xb.length) return false;
  return xa.every((x, i) => x === xb[i] || (stepGain && x.split(':')[0] === xb[i].split(':')[0] && x.split(':')[1] === 'p' && xb[i].split(':')[1] === 's'));
}
export const STEPY = { S130: [0], S370: [2, 6] };   // the deep review's step years (deep-review-log.md 4 Oct 03:18 UK)
export function gate(units, refAt, { pts = PTS, npw = NPW, stepYears = STEPY } = {}) {
  const bad = [];
  for (const [id, a, l] of UNITS) { const k = units.filter(u => u.id === id && u.arm === a && u.label === l).length; if (k !== 1) bad.push(`${id} ${a}/${l}: ${k} unit lines, not 1`); }
  const get = (id, a, l) => units.find(u => u.id === id && u.arm === a && u.label === l);
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`;
    const reg = UNITS.find(([id, a, l]) => id === u.id && a === u.arm && l === u.label);
    if (!reg) { bad.push(`${tag}: not a registered unit`); continue; }
    const [, , , X, SH] = reg;
    if (!u.done) bad.push(`${tag}: not done`);
    if (u.table === undefined || !u.ran || !u.gap || !u.joint || !u.access) { bad.push(`${tag}: a solve, ran, gap, joint or access line missing`); continue; }
    // the settings the units differ in
    if (!u.axis) bad.push(`${tag}: no axis line`);
    else if (u.axis.interp !== (X === 'PCLSI') || u.axis.pcls !== '0,0.5,1' || u.axis.strict !== false) bad.push(`${tag}: the allowance axis pclsInterp ${u.axis.interp} pcls ${u.axis.pcls} pclsStrict ${u.axis.strict}`);
    const gd = gridOf(u.ran);
    if (!gd || gd.pts !== String(pts) || gd.a !== SH || gd.b !== SH) bad.push(`${tag}: the grid ${gd ? `total${gd.pts}x${gd.a}x${gd.b}` : 'missing'}, not total${pts}x${SH}x${SH}`);
    if ((u.arm === 'ORDER') !== / readerRef order( |$)/.test(u.ran) || / readerRef (?!order)/.test(u.ran)) bad.push(`${tag}: the reference ${(/ readerRef (\S+)/.exec(u.ran) || [, 'the reader\'s'])[1]} on ${u.arm}`);
    // identity and twins
    if (u.arm === 'READER' && SH === 6) {
      const r = refAt(u.id, u.arm, u.label);
      if (!r) bad.push(`${tag}: no unit in 7at's records`);
      else {
        for (const f of ['table', 'ran', 'gap', 'joint', 'access', 'axis', 'xcount']) if (!same(r[f], u[f])) bad.push(`${tag}: its ${f} is not 7at's`);
        for (const f of AT_LINES) if (!same(byKT(r[f] || []), byKT(u[f] || []))) bad.push(`${tag}: its ${f} lines are not 7at's`);
      }
    } else {
      const tw = get(u.id, 'READER', labelOf('TS+J', 'PCLSI', 6));
      if (!tw) bad.push(`${tag}: no READER PCLSI twin at 6 share points`);
      else {
        if (normRan(u.ran) !== normRan(tw.ran)) bad.push(`${tag}: its ran line is not its twin's but for the grid and the reference`);
        if (!same(u.access, tw.access)) bad.push(`${tag}: its access line is not its twin's`);
        if (u.joint.scale !== tw.joint.scale || u.joint.cap !== tw.joint.cap || u.joint.decided !== tw.joint.decided) bad.push(`${tag}: its joint line is not its twin's`);
      }
    }
    // 7at's checks (7ar's and 7ap's within them), the unit shown as 7at's READER unit of its axis
    const asAT = { ...u, arm: 'READER', label: AT.labelOf('TS+J', X), ran: normRan(u.ran) };
    const atBad = AT.gate([asAT], () => null, () => null, { pts, npw }).filter(x => !IDENT_7AT.test(x));
    if (atBad.length) bad.push(...atBad.map(x => `${tag} (7at's checks, shown as ${asAT.id} ${asAT.arm}/${asAT.label}): ${x}`));
    const ac = u.access;
    if (ac.worlds !== K) continue;
    if (!u.qcount) bad.push(`${tag}: no qcount line`);
    else if (!(u.qcount.steps <= u.qcount.tables) || !(u.xcount && u.qcount.lin <= u.xcount.extrapolated)) bad.push(`${tag}: the qcount line (steps ${u.qcount.steps} of ${u.qcount.tables} tables, ${u.qcount.lin} straight-line nodes against xcount's ${u.xcount ? u.xcount.extrapolated : 'none'})`);
    for (let k = 0; k < K; k++) {
      const sd = u.sdec.filter(x => x.k === k), bd = u.bdec.filter(x => x.k === k), dc = u.dec.filter(x => x.k === k), ps = u.psplit.filter(x => x.k === k);
      let gap = false;
      for (let t = 0; t <= ac.years; t++) if (sd.filter(x => x.t === t).length !== 1) { bad.push(`${tag} world ${k}: year ${t} has ${sd.filter(x => x.t === t).length} sdec lines, not 1`); gap = true; break; }
      if (ps.length !== 1 || ps[0].paths.length !== npw || ps[0].paths.some(p => p.length !== 6 || p.some(x => !Number.isFinite(x)))) { bad.push(`${tag} world ${k}: ${ps.length} psplit lines${ps.length ? ` of ${ps[0].paths.length} paths` : ''}, not 1 of ${npw} with six terms`); gap = true; }
      if (gap) continue;
      for (const y of sd) {
        const b = bd.find(x => x.t === y.t), d = dc.find(x => x.t === y.t);
        if (!b || !d || b.reads !== y.reads) { bad.push(`${tag} world ${k} year ${y.t}: ${y.reads} sdec reads, ${b ? b.reads : 'no'} bdec reads`); break; }
        if (y.ns + y.np + y.no !== y.reads) { bad.push(`${tag} world ${k} year ${y.t}: ${y.ns} step, ${y.np} spread and ${y.no} other reads, not the ${y.reads} reads`); break; }
        const S = (n, v) => (n ? n * v : 0);
        const flat = S(y.ns, y.sf) + S(y.np, y.pf) + S(y.no, y.of), lin = S(y.ns, y.sl) + S(y.np, y.pl) + S(y.no, y.of);
        if (y.reads > 0 && !(Math.abs(flat - d.d * d.n) <= tol(y.reads) + 5e-4 * d.n)) { bad.push(`${tag} world ${k} year ${y.t}: the flat reads sum to ${flat.toFixed(2)}, the dec line's read term ${(d.d * d.n).toFixed(2)}`); break; }
        if (y.reads > 0 && !(Math.abs(lin - b.db * b.reads) <= tol(y.reads) + 5e-4 * b.reads)) { bad.push(`${tag} world ${k} year ${y.t}: the straight-line reads sum to ${lin.toFixed(2)}, the bdec line's read (b) ${(b.db * b.reads).toFixed(2)}`); break; }
        if (y.qm > y.ns) { bad.push(`${tag} world ${k} year ${y.t}: the quadratic moved ${y.qm} of ${y.ns} step reads`); break; }
        if (y.reads > 0 && d.unsup === 0 && (y.qm !== 0 || (y.ns && (Math.abs(y.sq - y.sf) > 1e-4 || Math.abs(y.sl - y.sf) > 1e-4)) || (y.np && Math.abs(y.pl - y.pf) > 1e-4))) { bad.push(`${tag} world ${k} year ${y.t}: 7av's straight line or quadratic off the flat read where the reads carry no unsupported weight`); break; }
      }
      const P = ps[0].paths, pst = u.pstage.find(x => x.k === k), pbs = u.pbstage.find(x => x.k === k);
      if (!pst || !pbs) { bad.push(`${tag} world ${k}: no pstage or pbstage line to hold psplit to`); continue; }
      const off = P.findIndex((p, j) => Math.abs(p[0] + p[3] + p[5] - pst.paths[j][1]) > 1e-3 * Math.max(1, ac.year) || Math.abs(p[1] + p[4] + p[5] - pbs.paths[j]) > 1e-3 * Math.max(1, ac.year));
      if (off >= 0) bad.push(`${tag} world ${k} path ${off}: its psplit terms do not sum to its pstage read term and pbstage term`);
      const bridge = sd.filter(y => y.t < ac.year);
      const cols = [0, 1, 2, 3, 5].map(c => P.reduce((t, p) => t + p[c], 0)), want = [y => (y.ns ? y.ns * y.sf : 0), y => (y.ns ? y.ns * y.sl : 0), y => (y.ns ? y.ns * y.sq : 0), y => (y.np ? y.np * y.pf : 0), y => (y.no ? y.no * y.of : 0)].map(f => bridge.reduce((t, y) => t + f(y), 0));
      const ci = cols.findIndex((c, i) => !(Math.abs(c - want[i]) <= tol(npw * Math.max(1, ac.year))));
      if (ci >= 0) bad.push(`${tag} world ${k}: psplit column ${['step flat', 'step line', 'step quadratic', 'spread flat', 'other'][ci]} sums to ${cols[ci].toFixed(2)}, the sdec lines' bridge years ${want[ci].toFixed(2)}`);
      const pyl = u.pyear.filter(x => x.k === k), A = Math.min(ac.year, ac.years + 1);
      if (pyl.length !== 1 || pyl[0].paths.length !== npw || pyl[0].paths.some(p => p.length !== A || p.some(x => !Number.isFinite(x)))) bad.push(`${tag} world ${k}: ${pyl.length} pyear lines${pyl.length ? ` of ${pyl[0].paths.length} paths` : ''}, not 1 of ${npw} with ${A} years each`);
      else {
        const PY = pyl[0].paths;
        const offp = PY.findIndex((p, j) => Math.abs(p.reduce((t, x) => t + x, 0) - pst.paths[j][1]) > 1e-3 * Math.max(1, A));
        if (offp >= 0) bad.push(`${tag} world ${k} path ${offp}: its pyear terms do not sum to its pstage read term`);
        for (const y of bridge) { const c = PY.reduce((t, p) => t + p[y.t], 0), w = (y.ns ? y.ns * y.sf : 0) + (y.np ? y.np * y.pf : 0) + (y.no ? y.no * y.of : 0); if (!(Math.abs(c - w) <= tol(npw))) { bad.push(`${tag} world ${k} year ${y.t}: the pyear column sums to ${c.toFixed(2)}, the sdec line's flat reads ${w.toFixed(2)}`); break; } }
      }
      // one class a world-year: every layer of a world-year reads one chance function (solve.js chanceOf(k, t), built from the
      // plan's-tier move whatever the layer), so a year with step and spread reads together is a fault, not a case to read
      { const mx = bridge.find(y => y.ns > 0 && y.np > 0); if (mx) bad.push(`${tag} world ${k} year ${mx.t}: ${mx.ns} step and ${mx.np} spread reads in one world-year - one chance function serves every layer of a world-year, so a mixed year is a fault`); }
      if (k === WORLD && !bridge.some(y => y.ns > 0)) bad.push(`${tag} world ${k}: no step read in the bridge - the items read step reads`);
      if (k === WORLD && u.arm === 'READER' && X === 'PCLSI' && !bridge.some(y => y.qm > 0)) bad.push(`${tag} world ${k}: the quadratic moved no bridge step read - a read that cannot move cannot answer item 2`);
    }
  }
  // the class across units: the same world-0 bridge years in the same classes on each item's paired units; the 6-point READER
  // units' step years the deep review's
  const patOf = u => (u && u.access ? u.sdec.filter(y => y.k === WORLD && y.t < u.access.year).sort((p, q) => p.t - q.t).map(y => `y${y.t}:${y.ns > 0 ? 's' : ''}${y.np > 0 ? 'p' : ''}${y.no > 0 ? 'o' : ''}`).join(' ') : null);
  const pairs = [...HH.flatMap(id => [[id, 'READER', 'PCLSI', 12], [id, 'READER', 'DEFAULT', 6]].map(b => [[id, 'READER', 'PCLSI', 6], b])), [['S370', 'READER', 'PCLSI', 6], ['S370', 'ORDER', 'PCLSI', 6]]];
  for (const [[ia, aa, xa, sa], [ib, ab, xb, sb]] of pairs) {
    const ua = get(ia, aa, labelOf('TS+J', xa, sa)), ub = get(ib, ab, labelOf('TS+J', xb, sb));
    if (!ua || !ub) continue;
    if (!classCompat(patOf(ua), patOf(ub), ab === 'ORDER')) bad.push(`${ib} ${ab}/${ub.label}: its world-0 bridge classes by year (${patOf(ub)}) are not ${ia} ${aa}/${ua.label}'s (${patOf(ua)})${ab === 'ORDER' ? ' but for a spread year read as step' : ''} - the item would compare different sets of reads`);
  }
  for (const id of HH) for (const x of ['DEFAULT', 'PCLSI']) {
    const u = get(id, 'READER', labelOf('TS+J', x, 6));
    if (!u || !u.access) continue;
    const ys = u.sdec.filter(y => y.k === WORLD && y.t < u.access.year && y.ns > 0).map(y => y.t).sort((p, q) => p - q);
    if (JSON.stringify(ys) !== JSON.stringify(stepYears[id] || [])) bad.push(`${id} READER/${u.label}: its world-0 bridge step years ${ys.join(', ') || 'none'}, not the deep review's ${(stepYears[id] || []).join(', ')}`);
  }
  return bad;
}

const { flipP, readTwo } = AR;
const mean = xs => (xs.length ? xs.reduce((t, x) => t + x, 0) / xs.length : NaN);
const sdOf = xs => { const m = mean(xs); return xs.length > 1 ? Math.sqrt(xs.reduce((t, x) => t + (x - m) * (x - m), 0) / (xs.length - 1)) : NaN; };
const lin = (a, xa, b, xb) => a.map((x, j) => xa * x + xb * b[j]);
const both = hs => (hs.length === HH.length && hs.every(h => h.read === 'HELD') ? 'HELD' : hs.some(h => h.read === 'FALSIFIED') ? 'FALSIFIED' : 'INCONCLUSIVE');

/* ITEM 1: per household { id, F6, F12 } */
export function item1(xs, { b = B } = {}) {
  const hs = xs.map(({ id, F6, F12 }) => { const pP = flipP(F6, b, 7001); return { id, m6: mean(F6), m12: mean(F12), pP, premise: pP < ALPHA && mean(F6) > 0, pU: flipP(lin(F6, 0.6, F12, -1), b, 7002), pD: flipP(lin(F12, 1, F6, -0.9), b, 7003), pO: flipP(lin(F6, -0.6, F12, -1), b, 7012) }; });
  const adj = holm(hs.flatMap(h => [h.pU, h.pD]));
  hs.forEach((h, i) => { h.hU = adj[2 * i]; h.hD = adj[2 * i + 1]; h.ratio = h.m12 / h.m6; h.read = !h.premise ? 'INCONCLUSIVE' : h.hU < ALPHA ? 'HELD' : h.hD < ALPHA ? 'FALSIFIED' : 'INCONCLUSIVE'; h.note = !h.premise ? 'NO STEP ERROR' : h.pO < ALPHA ? 'OVERSHOT' : ''; });
  return { hs, outcome: both(hs) };
}
/* ITEM 2: per household { id, L6, Q6 } */
export function item2(xs, { b = B } = {}) {
  const hs = xs.map(({ id, L6, Q6, acted = true }) => { const pP = flipP(L6, b, 7004); return { id, acted, mL: mean(L6), mQ: mean(Q6), pP, premise: pP < ALPHA && mean(L6) > 0, pU: Math.max(flipP(lin(L6, 1 / 3, Q6, -1), b, 7005), flipP(lin(Q6, 1, L6, 1 / 3), b, 7006)), pD: flipP(lin(Q6, 1, L6, -2 / 3), b, 7007), pO: flipP(lin(L6, -1 / 3, Q6, -1), b, 7008) }; });
  const adj = holm(hs.flatMap(h => [h.pU, h.pD]));
  hs.forEach((h, i) => { h.hU = adj[2 * i]; h.hD = adj[2 * i + 1]; h.read = !h.premise || !h.acted ? 'INCONCLUSIVE' : h.hU < ALPHA ? 'HELD' : h.hD < ALPHA ? 'FALSIFIED' : 'INCONCLUSIVE'; h.note = !h.acted ? 'QUADRATIC DID NOT ACT' : !h.premise ? 'NO RESIDUAL' : h.pO < ALPHA ? 'OVERSHOT' : ''; });
  return { hs, outcome: both(hs) };
}
/* ITEM 3: S370's { P6, O6 } */
export function item3({ P6, O6 }, { b = B } = {}) {
  const pP = flipP(P6.map(x => -x), b, 7009), premise = pP < ALPHA && mean(P6) < 0;
  const r = premise ? readTwo(flipP(lin(O6, 1, P6, -0.5), b, 7010), flipP(lin(P6, 0.75, O6, -1), b, 7011)) : { read: 'INCONCLUSIVE', note: 'NO SPREAD PESSIMISM' };
  const pO = premise ? flipP(lin(O6, 1, P6, 0.5), b, 7013) : 1;
  if (r.read === 'HELD' && pO < ALPHA) r.note = 'OVERSHOT';
  return { mP: mean(P6), mO: mean(O6), pP, pO, premise, share: 1 - mean(O6) / mean(P6), it: r, outcome: r.read };
}
/* ITEM 5: per household { id, F6, L6, F12, L12 }: the straight line's residual fraction within each unit, r6 taken as known */
export function item5(xs, { b = B } = {}) {
  const hs = xs.map(({ id, F6, L6, F12, L12 }) => { const r6 = mean(L6) / mean(F6), pP = flipP(F12, b, 7040); return { id, r6, r12: mean(L12) / mean(F12), pP, premise: pP < ALPHA && mean(F12) > 0 && mean(F6) > 0 && r6 > 0, pU: flipP(lin(F12, 0.7 * r6, L12, -1), b, 7041), pD: flipP(lin(L12, 1, F12, -0.9 * r6), b, 7042) }; });
  const adj = holm(hs.flatMap(h => [h.pU, h.pD]));
  hs.forEach((h, i) => { h.hU = adj[2 * i]; h.hD = adj[2 * i + 1]; h.read = !h.premise ? 'INCONCLUSIVE' : h.hU < ALPHA ? 'HELD' : h.hD < ALPHA ? 'FALSIFIED' : 'INCONCLUSIVE'; h.note = !h.premise ? 'NO STEP ERROR AT 12' : ''; });
  return { hs, outcome: both(hs) };
}
/* ITEM 4: per household { id, L12, Q12 } */
export function item4(xs, { b = B } = {}) {
  const hs = xs.map(({ id, L12, Q12 }) => {
    const rd = (X, s) => ({ m: mean(X), sd: sdOf(X), pT: Math.max(flipP(X.map(x => BAR - x), b, s), flipP(X.map(x => x + BAR), b, s + 1)), pA: flipP(X.map(x => x - BAR), b, s + 2), pB: flipP(X.map(x => -BAR - x), b, s + 3) });
    return { id, L: rd(L12, 7020), Q: rd(Q12, 7030) };
  });
  const adj = holm(hs.flatMap(h => [h.L.pA, h.L.pB, h.Q.pA, h.Q.pB]));
  hs.forEach((h, i) => {
    const [tL, tQ] = holm([h.L.pT, h.Q.pT]);
    h.L.hT = tL; h.Q.hT = tQ; h.L.hA = adj[4 * i]; h.L.hB = adj[4 * i + 1]; h.Q.hA = adj[4 * i + 2]; h.Q.hB = adj[4 * i + 3];
    for (const X of [h.L, h.Q]) X.read = X.hT < ALPHA ? 'UNDER' : Math.min(X.hA, X.hB) < ALPHA ? 'OVER' : 'NEITHER';
    h.read = h.L.read === 'UNDER' || h.Q.read === 'UNDER' ? 'UNDER' : h.L.read === 'OVER' && h.Q.read === 'OVER' ? 'OVER' : 'NEITHER';
  });
  const outcome = hs.length === HH.length && hs.every(h => h.read === 'UNDER') ? 'HELD' : hs.some(h => h.read === 'OVER') ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { hs, outcome };
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : '-'), f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), pe = x => (Number.isFinite(x) ? x.toExponential(2) : '-');
export function reading(units, out = console.log, { b = B } = {}) {
  const get = (id, a, x, sh) => units.find(u => u.id === id && u.arm === a && u.label === labelOf('TS+J', x, sh));
  const col = (u, c, k = WORLD) => u.psplit.find(p => p.k === k).paths.map(p => p[c]);
  out(`7AV: THE STEP-READ TEST - S130 and S370 (TS+J, W${W}, the switch margin 0.001), 30 points, ${NPW} paths a world at each world's node (seed ${SEED}); READER under the allowance axis snapped (DEFAULT) and interpolated (PCLSI) at 6 share points (7at's units, held line for line) and PCLSI at 12; S370 PCLSI at 6 with the reference drawn in the menu's order (ORDER); every bridge read classed step or spread and read by the flat copy, the straight line and the quadratic`);
  const I1 = item1(HH.map(id => ({ id, F6: col(get(id, 'READER', 'PCLSI', 6), 0), F12: col(get(id, 'READER', 'PCLSI', 12), 0) })), { b });
  out(`\nITEM 1 (resolution, the deep review's cause 1 against cause 3): F = the step reads' flat-copy term, world ${WORLD}, the bridge stage, per path, PCLSI at 6 and at 12 share points; HELD when mean(0.6 F6 - F12) > 0, FALSIFIED when mean(F12 - 0.9 F6) > 0, each under ${ALPHA} after Holm over 4; premise mean F6 > 0`);
  for (const h of I1.hs) out(`  ${h.id.padEnd(5)} F6 ${f4(h.m6)} (premise p ${pe(h.pP)}) F12 ${f4(h.m12)} ratio ${f2(h.ratio)} | HELD side p ${pe(h.pU)} Holm ${pe(h.hU)}; FALSIFIED side p ${pe(h.pD)} Holm ${pe(h.hD)} | ${h.read}${h.note ? ` (${h.note})` : ''}`);
  out(`  -> ${I1.outcome}`);
  // the quadratic acted when some step-table node took a true quadratic, not a fall-back to the line (qcount: quad over back);
  // a quadratic equal to the line through three nodes is data (it reads against cause 2), not a quadratic that never acted
  const actedOf = u => !!u.qcount && u.qcount.quad > u.qcount.back;
  const I2 = item2(HH.map(id => { const u = get(id, 'READER', 'PCLSI', 6); return { id, L6: col(u, 1), Q6: col(u, 2), acted: actedOf(u) }; }), { b });
  out(`\nITEM 2 (curvature, cause 2): L, Q = the step reads' straight-line and quadratic terms, PCLSI at 6; HELD when |Q6| <= L6/3 by both one-sided tests, FALSIFIED when mean(Q6 - 2 L6/3) > 0, each under ${ALPHA} after Holm over 4; premise mean L6 > 0; INCONCLUSIVE where the quadratic fell back to the line at every node (qcount)`);
  for (const h of I2.hs) out(`  ${h.id.padEnd(5)} L6 ${f4(h.mL)} (premise p ${pe(h.pP)}) Q6 ${f4(h.mQ)} | HELD side p ${pe(h.pU)} Holm ${pe(h.hU)}; FALSIFIED side p ${pe(h.pD)} Holm ${pe(h.hD)}; overshoot p ${pe(h.pO)} | ${h.read}${h.note ? ` (${h.note})` : ''}`);
  out(`  -> ${I2.outcome}`);
  const uR = get('S370', 'READER', 'PCLSI', 6), uO = get('S370', 'ORDER', 'PCLSI', 6), A3 = uR.access.year;
  const SPY = uR.sdec.filter(y => y.k === WORLD && y.t < A3 && y.np > 0).map(y => y.t).sort((p, q) => p - q);
  const yearSum = u => u.pyear.find(p => p.k === WORLD).paths.map(p => SPY.reduce((t, y) => t + p[y], 0));
  const I3 = item3({ P6: yearSum(uR), O6: yearSum(uO) }, { b });
  const clsO = SPY.map(t => { const y = uO.sdec.find(z => z.k === WORLD && z.t === t); return `y${t} ${y.ns > 0 ? 'step' : y.np > 0 ? 'spread' : 'other'}`; }).join(', ');
  out(`\nITEM 3 (O81 on S370, O36's proportional reference at the spread reads): the spread reads' flat term, PCLSI at 6, summed over the years the reader's reference reads as spread (${SPY.join(', ')}; under 'order' ${clsO}), the reader's reference P6 ${f4(I3.mP)} (premise mean P6 < 0, p ${pe(I3.pP)}) and 'order''s O6 ${f4(I3.mO)}; the share of the pessimism 'order' removes ${f2(I3.share)}`);
  if (!I3.premise) out(`  -> ${I3.outcome} (${I3.it.note})`);
  else out(`  HELD side mean(O6 - P6/2) > 0: p ${pe(I3.it.pU)} Holm ${pe(I3.it.hU)}; FALSIFIED side mean(0.75 P6 - O6) > 0: p ${pe(I3.it.pD)} Holm ${pe(I3.it.hD)}; overshoot p ${pe(I3.pO)}\n  -> ${I3.outcome}${I3.it.note ? ` (${I3.it.note})` : ''}`);
  { const P12 = mean(yearSum(get('S370', 'READER', 'PCLSI', 12))); out(`  beside it (reported): the spread term at 12 share points P12 ${f4(P12)}, P12 / P6 ${f2(P12 / I3.mP)}; S370 world ${WORLD}'s reference against its own draw and the engine's paid share: ${[['READER', 'reader'], ['ORDER', 'order']].map(([a, nm]) => { const r = get('S370', a, 'PCLSI', 6).bref.find(x => x.k === WORLD); return r ? `${nm} reference ${f2(r.ref)} own ${f2(r.own)} engine ${f2(r.engine)}` : `${nm} -`; }).join('; ')}`); }
  const I4 = item4(HH.map(id => ({ id, L12: col(get(id, 'READER', 'PCLSI', 12), 1), Q12: col(get(id, 'READER', 'PCLSI', 12), 2) })), { b });
  out(`\nITEM 4 (the bridge part): the step reads' straight-line and quadratic terms, PCLSI at 12; UNDER when inside +/- ${BAR} by both one-sided tests (Holm over the household's two reads), OVER when beyond (Holm over 8)`);
  for (const h of I4.hs) out(`  ${h.id.padEnd(5)} ${[['line', h.L], ['quadratic', h.Q]].map(([nm, X]) => `${nm} ${f4(X.m)} (sd ${f2(X.sd)}) inside p ${pe(X.pT)} Holm ${pe(X.hT)}, above p ${pe(X.pA)} Holm ${pe(X.hA)}, below p ${pe(X.pB)} Holm ${pe(X.hB)} ${X.read}`).join(' | ')} | ${h.read}`);
  out(`  -> ${I4.outcome} (HELD: the bridge part not needed at 12 share points; FALSIFIED: needed)`);
  const I5 = item5(HH.map(id => { const u6 = get(id, 'READER', 'PCLSI', 6), u12 = get(id, 'READER', 'PCLSI', 12); return { id, F6: col(u6, 0), L6: col(u6, 1), F12: col(u12, 0), L12: col(u12, 1) }; }), { b });
  out(`\nITEM 5 (curvature or a boundary layer): r = mean L / mean F at the step reads within each unit, PCLSI; HELD (smooth curvature) when mean(0.7 r6 F12 - L12) > 0, FALSIFIED (a boundary layer) when mean(L12 - 0.9 r6 F12) > 0, each under ${ALPHA} after Holm over 4; r6 taken as known`);
  for (const h of I5.hs) out(`  ${h.id.padEnd(5)} r6 ${f4(h.r6)} r12 ${f4(h.r12)} (premise p ${pe(h.pP)}) | HELD side p ${pe(h.pU)} Holm ${pe(h.hU)}; FALSIFIED side p ${pe(h.pD)} Holm ${pe(h.hD)} | ${h.read}${h.note ? ` (${h.note})` : ''}`);
  out(`  -> ${I5.outcome}`);
  out(`\nREPORTED (not items):`);
  out(`  THE BRIDGE STAGE BY WORLD (points a path: step flat / line / quadratic, spread flat / line, other):`);
  for (const [id, a, x, sh] of UNITS7.map(([id, a, , x, sh]) => [id, a, x, sh])) for (let k = 0; k < K; k++) { const u = get(id, a, x, sh), m = c => f2(mean(col(u, c, k))); out(`    ${id} ${a} ${x} S${sh} world ${k}: step ${m(0)} / ${m(1)} / ${m(2)}  spread ${m(3)} / ${m(4)}  other ${m(5)}`); }
  out(`  THE STEP AND SPREAD READS BY YEAR (world ${WORLD}, the bridge years: step n, flat, line, quadratic, unsupported weight, moved; spread n, flat, line):`);
  for (const [id, a, x, sh] of UNITS7.map(([id, a, , x, sh]) => [id, a, x, sh])) { const u = get(id, a, x, sh), A = u.access.year; out(`    ${id} ${a} ${x} S${sh}: ${u.sdec.filter(y => y.k === WORLD && y.t < A).sort((p, q) => p.t - q.t).map(y => `y${y.t} step ${y.ns} ${f2(y.sf)}/${f2(y.sl)}/${f2(y.sq)} u ${f2(y.su)} m ${y.qm}; spread ${y.np} ${f2(y.pf)}/${f2(y.pl)}`).join('; ')}`); }
  out(`  THE STRAIGHT LINE AT STEP READS, ITS SHARE OF THE WHOLE RISE (world ${WORLD}, PCLSI less DEFAULT at 6; the deep review's 0.73 on S370 and 0.64 on S130 from 7at's lines):`);
  for (const id of HH) { const P = get(id, 'READER', 'PCLSI', 6), D = get(id, 'READER', 'DEFAULT', 6), rd = j => (u => u.psplit.find(p => p.k === WORLD).paths[j]); const n = P.psplit.find(p => p.k === WORLD).paths.length; let R = 0, Ls = 0; for (let j = 0; j < n; j++) { const p = rd(j)(P), d = rd(j)(D); R += (p[0] + p[3] + p[5]) - (d[0] + d[3] + d[5]); Ls += (p[1] + p[3] + p[5]) - (d[1] + d[3] + d[5]); } out(`    ${id}: the rise ${f4(R / n)}, under the straight line at step reads ${f4(Ls / n)}, the share taken away ${f2((R - Ls) / R)}`); }
  out(`  THE EXTRAPOLATION'S COUNTS: ${UNITS7.map(([id, a, , x, sh]) => { const q = get(id, a, x, sh).qcount; return `${id} ${a} ${x} S${sh} tables ${q.tables} steps ${q.steps} line ${q.lin} (clipped ${q.linLo} low, ${q.linHi} high) quadratic ${q.quad} (fell back ${q.back}, clipped ${q.quadLo} low, ${q.quadHi} high)`; }).join('; ')}`);
  out(`  THE TABLES: ${UNITS7.map(([id, a, , x, sh]) => `${id} ${a} ${x} S${sh} ${get(id, a, x, sh).table}`).join('; ')}`);
  out(`  THE QUADRATIC'S FALL-BACKS: ${UNITS7.filter(u => u[3] === 'PCLSI' && u[1] === 'READER').map(([id, a, , x, sh]) => { const q = get(id, a, x, sh).qcount; return `${id} S${sh} ${q.back} of ${q.quad} (${f2(q.quad ? q.back / q.quad : NaN)})`; }).join('; ')}`);
  out(`\nOUTCOME: 1 ${I1.outcome}; 2 ${I2.outcome}; 3 ${I3.outcome}; 4 ${I4.outcome}; 5 ${I5.outcome}`);
  return { I1, I2, I3, I4, I5 };
}

/* PLANTED: 7at's built log turned into 7av's units, with 7av's lines added consistently from the built values */
const esc = s => s.replace(/[/+.]/g, m => `\\${m}`);
export function builtLog(o = {}) {
  const text = AT.builtLog();
  const blocks = text.split(/(?=^\S.*? case \| unit )/m).filter(x => x.trim());
  const blockOf = (id, x) => blocks.find(bk => new RegExp(`^${id}\\s+case \\| unit READER/${esc(AT.labelOf('TS+J', x))} \\|`).test(bk));
  const out = [];
  for (const [id, a, l, X, SH] of UNITS) {
    if (o.skip === `${id}|${a}|${SH}`) continue;
    let bk = blockOf(id, X);
    const L0 = `READER/${AT.labelOf('TS+J', X)}`, L = `${a}/${l}`;
    if (L !== L0) bk = bk.split(L0).join(L);
    if (SH !== 6) bk = bk.replace(/ grid total30x6x6/, o.gridOff && id === 'S370' ? ' grid total30x6x6' : ` grid total30x${SH}x${SH}`);
    if (a === 'ORDER' && !o.noRef) bk = bk.replace(/( ran \S+: .*)$/m, '$1 readerRef order');
    if (o.refOnReader && a === 'READER' && SH === 12 && id === 'S130') bk = bk.replace(/( ran \S+: .*)$/m, '$1 readerRef order');
    if (o.ranTwin && SH === 12 && id === 'S130') bk = bk.replace(/( ran \S+: .*)$/m, '$1 extra 1');
    if (o.noDbin12 && SH === 12 && id === 'S130') bk = bk.replace(/^\s+dbin \S+ world 1 after ulo: .*\n/m, '');
    const u = AT.parse(bk)[0], add = [];
    for (let k = 0; k < K; k++) {
      const dc = u.dec.filter(x => x.k === k), bd = u.bdec.filter(x => x.k === k), A = u.access.year, n = u.access.years;
      const pst = u.pstage.find(x => x.k === k).paths, pbs = u.pbstage.find(x => x.k === k).paths, N = pst.length;
      // the built set: the reads at year 0 are step reads and those at year 1 spread reads (7at's built log moves read (b)
      // on both bridge years); the later reads have no reader (other). Per path the year-1 terms are spread evenly and the
      // step terms take the rest of the path's pstage and pbstage terms
      const d0 = dc.find(x => x.t === 0), d1 = dc.find(x => x.t === 1), b1 = bd.find(x => x.t === 1);
      const spf = d1 && d1.reads ? (d1.d * d1.n) / N : 0, spl = b1 && b1.reads ? (b1.db * b1.reads) / N : 0;
      const quadShift = -0.25;
      const P = Array.from({ length: N }, (_, j) => { const sf = pst[j][1] - spf, sl = pbs[j] - spl; return [sf, sl, sf + quadShift, spf, spl, 0]; });
      // year 1 read as a step year (classOff: on S370 ORDER alone; stepAll: on every S130 unit) - the step columns take the year-1 terms
      const y1step = k === 0 && ((o.classOff && id === 'S370' && a === 'ORDER') || (o.stepAll && id === 'S130') || (o.class12Off && id === 'S130' && SH === 12));
      if (y1step) P.forEach(p => { p[0] += p[3]; p[1] += p[4]; p[2] += p[3]; p[3] = 0; p[4] = 0; });
      if (o.qAsLin && id === 'S130' && X === 'PCLSI' && SH === 6 && k === 0) P.forEach(p => { p[2] = p[1]; });
      if (o.psplitOff && id === 'S370' && a === 'ORDER' && k === 1) P[2][3] += 0.5;
      if (o.psplitSwap && id === 'S370' && a === 'ORDER' && k === 1) { P[2][3] += 0.5; P[3][3] -= 0.5; }   // the column sums kept: the per-path check alone
      const sq1 = y1step ? spf * N / Math.max(1, (bd.find(x => x.t === 1) || {}).reads || 1) : 0;
      const sq0 = (P.reduce((t, p) => t + p[2], 0) - (y1step ? sq1 * ((bd.find(x => x.t === 1) || {}).reads || 0) : 0)) / Math.max(1, d0.reads);
      for (let t = 0; t <= n; t++) {
        const d = dc.find(x => x.t === t), b = bd.find(x => x.t === t);
        if (o.noSdec && SH === 12 && id === 'S130' && k === 2 && t === 4) continue;
        if (!b || !b.reads) { add.push(`${''.padEnd(16)} sdec ${L} world ${k} year ${t}: reads 0 step 0 flat - lin - quad - unsup - qmoved 0 spread 0 flat - lin - other 0 flat -`); continue; }
        if (t === 0) {
          const qm = o.noQMove && X === 'PCLSI' && SH === 12 ? 0 : b.reads;
          add.push(`${''.padEnd(16)} sdec ${L} world ${k} year ${t}: reads ${b.reads} step ${o.splitOff && SH === 6 && X === 'DEFAULT' && k === 0 ? b.reads - 1 : b.reads} flat ${(d.d * d.n / b.reads).toFixed(4)} lin ${(o.linOff && id === 'S370' && SH === 12 && k === 0 ? b.db + 1 : b.db).toFixed(4)} quad ${(o.qAsLin && id === 'S130' && X === 'PCLSI' && SH === 6 && k === 0 ? b.db : sq0).toFixed(4)} unsup ${d.unsup.toFixed(4)} qmoved ${qm} spread 0 flat - lin - other 0 flat -`);
        } else if (t === 1 && y1step) add.push(`${''.padEnd(16)} sdec ${L} world ${k} year ${t}: reads ${b.reads} step ${b.reads} flat ${(d.d * d.n / b.reads).toFixed(4)} lin ${b.db.toFixed(4)} quad ${sq1.toFixed(4)} unsup ${d.unsup.toFixed(4)} qmoved ${b.reads} spread 0 flat - lin - other 0 flat -`);
        else if (t === 1) add.push(`${''.padEnd(16)} sdec ${L} world ${k} year ${t}: reads ${b.reads} step 0 flat - lin - quad - unsup - qmoved 0 spread ${b.reads} flat ${(d.d * d.n / b.reads).toFixed(4)} lin ${b.db.toFixed(4)} other 0 flat -`);
        // the isolating plants after access (no psplit column reads them): one read dropped from the split, a spread flat read
        // off the read term alone, a spread straight-line read off read (b) alone
        else if (t === 3 && SH === 12 && id === 'S370' && k === 0 && (o.splitOnly || o.flatOnly || o.linOnly)) add.push(`${''.padEnd(16)} sdec ${L} world ${k} year ${t}: reads ${b.reads} step 0 flat - lin - quad - unsup - qmoved 0 ${o.splitOnly ? `spread 0 flat - lin - other ${b.reads - 1} flat ${(d.d * d.n / b.reads).toFixed(4)}` : `spread ${b.reads} flat ${o.flatOnly ? '0.5000' : (d.d * d.n / b.reads).toFixed(4)} lin ${o.linOnly ? '0.5000' : b.db.toFixed(4)} other 0 flat -`}`);
        else add.push(`${''.padEnd(16)} sdec ${L} world ${k} year ${t}: reads ${b.reads} step 0 flat - lin - quad - unsup - qmoved 0 spread 0 flat - lin - other ${b.reads} flat ${(d.d * d.n / b.reads).toFixed(4)}`);
      }
      if (!(o.noPsplit && id === 'S130' && SH === 6 && X === 'PCLSI' && k === 0)) add.push(`${''.padEnd(16)} psplit ${L} world ${k}: ${P.map(p => p.map(x => x.toFixed(4)).join(',')).join(';')}`);
      const PYb = Array.from({ length: N }, (_, j) => [pst[j][1] - spf, spf]);
      if (o.pyearOff && id === 'S370' && a === 'ORDER' && k === 2) { PYb[1][0] += 0.5; PYb[2][0] -= 0.5; }   // each year's column kept, two paths' sums off
      if (o.pyearCol && id === 'S370' && a === 'ORDER' && k === 2) { PYb[1][0] += 0.5; PYb[1][1] -= 0.5; }   // a path's sum kept, a year's column off
      if (!(o.noPyear && id === 'S370' && a === 'ORDER' && k === 1)) add.push(`${''.padEnd(16)} pyear ${L} world ${k}: ${PYb.map(p => p.map(x => x.toFixed(4)).join(',')).join(';')}`);
    }
    if (!(o.noQ && a === 'ORDER')) add.push(`${''.padEnd(16)} qcount ${L}: tables 9 steps ${o.qSteps && SH === 12 ? 10 : 3} lin 12 linLo 0 linHi 1 quad 12 back ${o.qNoAct && id === 'S130' && X === 'PCLSI' && SH === 6 ? 12 : 2} quadLo 1 quadHi 0`);
    bk = bk.replace(new RegExp(`^(\\s+done ${esc(L)})$`, 'm'), `${add.join('\n')}\n$1`);
    out.push(bk);
  }
  if (o.extra) out.push(`S999             case | unit READER/TS+J/W0.02/S9 | lambda ${AR.LAMBDA} tier own riskAbove auto mix 3\n`);
  return out.join('');
}
const REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() }, EDGES = [];
function planted() {
  const cases = [];
  const SZ = { pts: '30', npw: 8, stepYears: { S130: [0], S370: [0] } };
  const clean = parse(builtLog());
  const refOf = (ro = {}) => (id, a, l) => { const r = clean.find(u => u.id === id && u.arm === a && u.label === l) || null; if (r && ro.refTable && id === 'S130' && l === labelOf('TS+J', 'PCLSI')) return { ...r, table: '91.0000' }; if (r && ro.refBdec && id === 'S370' && l === labelOf('TS+J')) return { ...r, bdec: r.bdec.map(y => (y.k === 0 && y.t === 0 ? { ...y, db: y.db + 1 } : y)) }; return r; };
  const refused = (o, ro = {}) => { try { return String(gate(parse(builtLog(o)), refOf(ro), SZ).length > 0); } catch (e) { return `crash: ${e.message}`; } };
  { const bad = gate(clean, refOf(), SZ); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o, ro] of [['an unregistered unit', { extra: true }], ['a missing unit', { skip: 'S370|ORDER|6' }], ['a 12-point unit on a 6-point grid', { gridOff: true }],
    ['ORDER without readerRef order', { noRef: true }], ['readerRef order on a READER unit', { refOnReader: true }], ['a 12-point ran line off its twin\'s', { ranTwin: true }],
    ['a missing sdec year', { noSdec: true }], ['a step-spread split off the reads', { splitOff: true }], ['straight-line reads off read (b)', { linOff: true }],
    ['no pyear line', { noPyear: true }], ['two pyear paths off their pstage sums (the columns kept)', { pyearOff: true }], ['a pyear year column off the sdec flat reads', { pyearCol: true }],
    ['no psplit line', { noPsplit: true }], ['a psplit path off its pstage and pbstage terms', { psplitOff: true }], ['two psplit paths off by opposite amounts (the columns kept)', { psplitSwap: true }],
    ['(7at\'s checks alone, on a 12-point unit) a missing dbin line', { noDbin12: true }], ['a read dropped from the split after access', { splitOnly: true }], ['a spread flat read off the read term alone', { flatOnly: true }], ['a spread straight-line read off read (b) alone', { linOnly: true }], ['no qcount line', { noQ: true }], ['more step tables than tables', { qSteps: true }],
    ['a quadratic that moved no step read on a PCLSI unit', { noQMove: true }],
    ['a 12-point unit classing a bridge year differently from its 6-point twin', { class12Off: true }], ['step years off the deep review\'s (every S130 unit alike)', { stepAll: true }],
    ['a 6-point S130 PCLSI table that is not 7at\'s', {}, { refTable: true }], ['a 6-point S370 DEFAULT bdec line that is not 7at\'s', {}, { refBdec: true }]]) cases.push([`the gate refuses ${nm}`, refused(o, ro || {}), 'true']);
  cases.push(['the gate accepts ORDER reading a reader spread year as step (item 3 reads the same years by pyear)', refused({ classOff: true }), 'false']);
  // a mixed world-year (step and spread reads together), built at the object level so that every sum still holds: world 1 of
  // S130 PCLSI at 6, path 0's year-0 step read moved to the spread class
  { const us = parse(builtLog()), u = us.find(x => x.id === 'S130' && x.arm === 'READER' && x.label === labelOf('TS+J', 'PCLSI', 6));
    const y = u.sdec.find(z => z.k === 1 && z.t === 0), P = u.psplit.find(z => z.k === 1).paths, p0 = P[0], r = y.ns;
    const c0 = p0[0], c1 = p0[1], c2 = p0[2];
    Object.assign(y, { ns: r - 1, sf: (r * y.sf - c0) / (r - 1), sl: (r * y.sl - c1) / (r - 1), sq: (r * y.sq - c2) / (r - 1), qm: Math.min(y.qm, r - 1), np: 1, pf: c0, pl: c1 });
    p0[3] += c0; p0[4] += c1; p0[0] = 0; p0[1] = 0; p0[2] = 0;
    const bad = gate(us, refOf(), SZ); cases.push(['the gate refuses a mixed world-year (and nothing else)', `${bad.length > 0} ${bad.every(x => /in one world-year/.test(x))}`, 'true true']); EDGES.push('a mixed world-year'); }
  cases.push(['the gate accepts a quadratic equal to the line (item 2 reads it as data)', refused({ qAsLin: true }), 'false']);
  { let note = 'none'; try { const R = reading(parse(builtLog({ qNoAct: true })), () => {}, { b: 200 }); note = R.I2.hs.find(h => h.id === 'S130').note; } catch (e) { note = `crash: ${e.message}`; } cases.push(['the reading takes a 6-point quadratic that fell back at every node as not acted (S130, from qcount)', note, 'QUADRATIC DID NOT ACT']); }
  { let note = 'none'; try { const R = reading(parse(builtLog({ qAsLin: true })), () => {}, { b: 200 }); note = R.I2.hs.find(h => h.id === 'S130').note; } catch (e) { note = `crash: ${e.message}`; } cases.push(['the reading takes a quadratic equal to the line, with true quadratic nodes, as acted', String(note !== 'QUADRATIC DID NOT ACT'), 'true']); }
  cases.push(['classCompat: a spread year read as step is allowed for ORDER only; step read as spread never', `${classCompat('y0:s y1:p', 'y0:s y1:s', true)} ${classCompat('y0:s y1:p', 'y0:s y1:s', false)} ${classCompat('y0:s y1:p', 'y0:p y1:p', true)} ${classCompat('y0:s y1:o', 'y0:s y1:s', true)}`, 'true false false false']); EDGES.push('a class difference allowed for ORDER only');
  // the 'no unsupported weight' check: the built set's year-0 reads carry weight; a copy with its weight 0 must refuse a quadratic off the flat read
  { const noW = t => t.replace(/^(\s+dec \S+ world \d+ year 0: .* unsup )0\.3000( rowcopy )0\.1000$/gm, '$10.0000$20.0000').replace(/^(\s+sdec \S+ world \d+ year 0: .* unsup )0\.3000/gm, '$10.0000');
    const g2 = () => { try { return gate(parse(noW(builtLog())), refOf(), SZ).filter(x => /7av's straight line or quadratic off the flat read/.test(x)).length > 0; } catch (e) { return `crash: ${e.message}`; } };
    cases.push(['(no weight at year 0) the gate refuses a quadratic off the flat read', String(g2()), 'true']); EDGES.push('reads with no unsupported weight'); }
  // the items on built per-path values
  const n = 400, base = Array.from({ length: n }, (_, j) => 1 + (j % 7) * 0.3 + ((j * 3) % 5) * 0.2);
  const nz = (s, f = 1.7) => base.map((_, j) => s * Math.sin(j * f));
  const sc = (xs, c, z = 0, f = 2.9) => xs.map((x, j) => c * x + (z ? z * Math.sin(j * f) : 0));
  const it1 = xs => { const I = item1(xs, { b: 2000 }); REACHED[1].add(I.outcome); return I; };
  { const I = it1([{ id: 'S130', F6: base, F12: sc(base, 0.4, 0.3) }, { id: 'S370', F6: base, F12: sc(base, 0.45, 0.3) }]); cases.push(['the flat step error falls to 0.4 at 12 points on both: HELD', I.outcome, 'HELD']); }
  { const I = it1([{ id: 'S130', F6: base, F12: sc(base, 1, 0.3) }, { id: 'S370', F6: base, F12: sc(base, 0.45, 0.3) }]); cases.push(['no change with spacing on S130: FALSIFIED', `${I.hs[0].read} ${I.outcome}`, 'FALSIFIED FALSIFIED']); }
  { const I = it1([{ id: 'S130', F6: base, F12: sc(base, 0.75, 0.3) }, { id: 'S370', F6: base, F12: sc(base, 0.45, 0.3) }]); cases.push(['the error falls to 0.75 on S130 (between the bands): INCONCLUSIVE', `${I.hs[0].read} ${I.outcome}`, 'INCONCLUSIVE INCONCLUSIVE']); }
  { const I = it1([{ id: 'S130', F6: nz(1), F12: nz(1, 2.3) }, { id: 'S370', F6: base, F12: sc(base, 0.45, 0.3) }]); cases.push(['no step error at 6 points on S130: NO STEP ERROR', `${I.hs[0].read} ${I.hs[0].note} ${I.outcome}`, 'INCONCLUSIVE NO STEP ERROR INCONCLUSIVE']); EDGES.push('no step error to shrink'); }
  { const I = it1([{ id: 'S130', F6: base, F12: sc(base, 0.6) }, { id: 'S370', F6: base, F12: sc(base, 0.45, 0.3) }]); cases.push(['the error at exactly 0.6 of itself, no noise: not HELD', I.hs[0].read, 'INCONCLUSIVE']); EDGES.push('the ratio at exactly 0.6'); }
  { const F6 = base.map((_, j) => 0.05 + 5 * Math.sin(j * 1.7)), I = it1([{ id: 'S130', F6, F12: F6.map(x => 0.4 * x - 1) }, { id: 'S370', F6: base, F12: sc(base, 0.45, 0.3) }]); cases.push(['a positive F6 too noisy to show (p above 0.05), F12 far below: NO STEP ERROR, not HELD', `${I.hs[0].m6 > 0} ${I.hs[0].read} ${I.hs[0].note}`, 'true INCONCLUSIVE NO STEP ERROR']); EDGES.push('a positive step error not shown'); }
  const it2 = xs => { const I = item2(xs, { b: 2000 }); REACHED[2].add(I.outcome); return I; };
  { const I = it2([{ id: 'S130', L6: base, Q6: nz(0.2) }, { id: 'S370', L6: base, Q6: nz(0.2, 2.3) }]); cases.push(['the quadratic leaves nothing on both: HELD', I.outcome, 'HELD']); }
  { const I = it2([{ id: 'S130', L6: base, Q6: sc(base, 0.95, 0.2) }, { id: 'S370', L6: base, Q6: nz(0.2, 2.3) }]); cases.push(['the quadratic leaves the residual on S130: FALSIFIED', `${I.hs[0].read} ${I.outcome}`, 'FALSIFIED FALSIFIED']); }
  { const I = it2([{ id: 'S130', L6: base, Q6: sc(base, -0.95, 0.2) }, { id: 'S370', L6: base, Q6: nz(0.2, 2.3) }]); cases.push(['the quadratic overshoots to minus the residual on S130: not HELD, flagged OVERSHOT', `${I.hs[0].read} ${I.hs[0].note}`, 'INCONCLUSIVE OVERSHOT']); EDGES.push('a quadratic overshooting'); }
  { const I = it2([{ id: 'S130', L6: nz(1), Q6: nz(1, 2.3) }, { id: 'S370', L6: base, Q6: nz(0.2, 2.3) }]); cases.push(['no straight-line residual on S130: NO RESIDUAL', `${I.hs[0].read} ${I.hs[0].note}`, 'INCONCLUSIVE NO RESIDUAL']); EDGES.push('no residual to remove'); }
  { const I = it2([{ id: 'S130', L6: base, Q6: sc(base, 0.5, 0.2) }, { id: 'S370', L6: base, Q6: nz(0.2, 2.3) }]); cases.push(['the quadratic leaves half on S130: INCONCLUSIVE', `${I.hs[0].read} ${I.outcome}`, 'INCONCLUSIVE INCONCLUSIVE']); }
  { const I = it2([{ id: 'S130', L6: base, Q6: sc(base, 0.95, 0.2), acted: false }, { id: 'S370', L6: base, Q6: nz(0.2, 2.3) }]); cases.push(['a quadratic that never acted on S130 (only fell back): INCONCLUSIVE, not FALSIFIED', `${I.hs[0].read} ${I.hs[0].note} ${I.outcome}`, 'INCONCLUSIVE QUADRATIC DID NOT ACT INCONCLUSIVE']); EDGES.push('a quadratic that never acted'); }
  { const I = it2([{ id: 'S130', L6: base, Q6: base.map((x, j) => (2 / 3) * x + 0.04 + 0.6 * Math.sin(j * 2.9)) }, { id: 'S370', L6: base, Q6: nz(0.2, 2.3) }]); cases.push(['the quadratic just past two thirds on S130 (raw p near 0.03, Holm over 4 lifts it): not FALSIFIED', `${I.hs[0].pD < 0.05} ${I.hs[0].read} ${I.outcome}`, 'true INCONCLUSIVE INCONCLUSIVE']); EDGES.push('FALSIFIED at the Holm boundary'); }
  { const I = it1([{ id: 'S130', F6: base, F12: sc(base, -0.9, 0.3) }, { id: 'S370', F6: base, F12: sc(base, 0.45, 0.3) }]); cases.push(['the step error turns the other way at 12 on S130: HELD, flagged OVERSHOT', `${I.hs[0].read} ${I.hs[0].note}`, 'HELD OVERSHOT']); EDGES.push('a step error of the other sign at 12'); }
  const it3 = o => { const I = item3(o, { b: 2000 }); REACHED[3].add(I.outcome); return I; };
  { const I = it3({ P6: sc(base, -1), O6: sc(base, 0.9, 0.3) }); cases.push(['order turns the spread reads optimistic by 0.9 of the pessimism: HELD, flagged OVERSHOT', `${I.outcome} ${I.it.note}`, 'HELD OVERSHOT']); EDGES.push('order overshooting'); }
  { const I = it3({ P6: sc(base, -1), O6: sc(base, -0.2, 0.3) }); cases.push(['order removes four fifths of the spread pessimism: HELD', I.outcome, 'HELD']); }
  { const I = it3({ P6: sc(base, -1), O6: sc(base, -0.95, 0.3) }); cases.push(['order removes a twentieth: FALSIFIED', I.outcome, 'FALSIFIED']); }
  { const I = it3({ P6: sc(base, -1), O6: sc(base, -0.62, 0.3) }); cases.push(['order removes 0.38 (between the bands): INCONCLUSIVE', I.outcome, 'INCONCLUSIVE']); }
  { const I = it3({ P6: base, O6: sc(base, 0.5) }); cases.push(['no spread pessimism (the term positive): NO SPREAD PESSIMISM', `${I.outcome} ${I.it.note}`, 'INCONCLUSIVE NO SPREAD PESSIMISM']); EDGES.push('a spread term of the wrong sign'); }
  const it4 = xs => { const I = item4(xs, { b: 2000 }); REACHED[4].add(I.outcome); return I; };
  { const I = it4([{ id: 'S130', L12: nz(0.3), Q12: sc(base, 1) }, { id: 'S370', L12: sc(base, 1), Q12: nz(0.3, 2.3) }]); cases.push(['a read inside 0.5 on each household: HELD', I.outcome, 'HELD']); }
  { const I = it4([{ id: 'S130', L12: sc(base, 1), Q12: sc(base, 1.2) }, { id: 'S370', L12: nz(0.3), Q12: nz(0.3, 2.3) }]); cases.push(['both reads beyond 0.5 on S130: FALSIFIED', `${I.hs[0].read} ${I.outcome}`, 'OVER FALSIFIED']); }
  { const I = it4([{ id: 'S130', L12: sc(base, -1), Q12: sc(base, -1.2) }, { id: 'S370', L12: nz(0.3), Q12: nz(0.3, 2.3) }]); cases.push(['both reads beyond -0.5 on S130: FALSIFIED', `${I.hs[0].read} ${I.outcome}`, 'OVER FALSIFIED']); EDGES.push('beyond the bar on the negative side'); }
  { const I = it4([{ id: 'S130', L12: sc(base, 1), Q12: nz(8) }, { id: 'S370', L12: nz(0.3), Q12: nz(0.3, 2.3) }]); cases.push(['one read beyond, one too noisy on S130: INCONCLUSIVE', `${I.hs[0].read} ${I.outcome}`, 'NEITHER INCONCLUSIVE']); }
  { const I = it4([{ id: 'S130', L12: base.map(() => 0.5), Q12: base.map(() => 0.5) }, { id: 'S370', L12: nz(0.3), Q12: nz(0.3, 2.3) }]); cases.push(['both reads exactly at the bar on every path: neither UNDER nor OVER', I.hs[0].read, 'NEITHER']); EDGES.push('reads at the bar'); }
  const it5 = xs => { const I = item5(xs, { b: 2000 }); REACHED[5].add(I.outcome); return I; };
  { const I = it5([{ id: 'S130', F6: sc(base, 2), L6: sc(base, 0.6), F12: base, L12: sc(base, 0.13, 0.02) }, { id: 'S370', F6: sc(base, 2), L6: sc(base, 0.3), F12: base, L12: sc(base, 0.07, 0.02) }]); cases.push(['the residual fraction falls to under half at 12 on both: HELD', I.outcome, 'HELD']); }
  { const I = it5([{ id: 'S130', F6: sc(base, 2), L6: sc(base, 0.6), F12: base, L12: sc(base, 0.3, 0.02) }, { id: 'S370', F6: sc(base, 2), L6: sc(base, 0.3), F12: base, L12: sc(base, 0.07, 0.02) }]); cases.push(['the residual fraction unchanged at 12 on S130 (a boundary layer): FALSIFIED', `${I.hs[0].read} ${I.outcome}`, 'FALSIFIED FALSIFIED']); }
  { const I = it5([{ id: 'S130', F6: sc(base, 2), L6: sc(base, 0.6), F12: base, L12: sc(base, 0.24, 0.02) }, { id: 'S370', F6: sc(base, 2), L6: sc(base, 0.3), F12: base, L12: sc(base, 0.07, 0.02) }]); cases.push(['the residual fraction at 0.8 of r6 on S130: INCONCLUSIVE', `${I.hs[0].read} ${I.outcome}`, 'INCONCLUSIVE INCONCLUSIVE']); }
  { const I = it5([{ id: 'S130', F6: sc(base, 2), L6: sc(base, 0.6), F12: nz(1), L12: nz(1, 2.3) }, { id: 'S370', F6: sc(base, 2), L6: sc(base, 0.3), F12: base, L12: sc(base, 0.07, 0.02) }]); cases.push(['no step error at 12 on S130: NO STEP ERROR AT 12', `${I.hs[0].read} ${I.hs[0].note}`, 'INCONCLUSIVE NO STEP ERROR AT 12']); EDGES.push('no step error at 12 to take a fraction of'); }
  // the extrapolations, on a built row
  { const ni = 6, pts = [0, 0.2, 0.4, 0.6, 0.8, 1], g = { size: ni, np: 1, ni, nt: 1, gain: [0], pcls: [0], axes: { a: { pts } }, index: (ip, ii) => ii };
    const p = [1, 1, 1, 0.2, 0.1, 0], c = [0.9, 0.85, 0.7, 0.7, 0.7, 0.7], S = [0.9, 0.85, 0.7, 0.05, 0.02, 0.001], R = S.map((s, i) => s - p[i] * c[i]);
    const a7 = extrapolate(g, { p, c, R }), l1 = extrapolateOrder(g, { p, c, R }, 1), q2 = extrapolateOrder(g, { p, c, R }, 2);
    cases.push(['the straight line is 7at\'s read (b) to the bit', String(Array.from(a7.c).every((v, i) => v === l1.c[i]) && Array.from(a7.R).every((v, i) => v === l1.R[i])), 'true']);
    cases.push(['the quadratic through (0, 0.9), (0.2, 0.85), (0.4, 0.7): 0.45, 0.1, then clipped at 0', JSON.stringify(Array.from(q2.c).map(v => +v.toFixed(6))), JSON.stringify([0.9, 0.85, 0.7, 0.45, 0.1, 0])]); EDGES.push('a quadratic clipped at 0');
    cases.push(['the quadratic counts: 3 extrapolated, 1 clipped low, none high, none fell back', `${q2.extrapolated} ${q2.clipLo} ${q2.clipHi} ${q2.fellBack}`, '3 1 0 0']);
    cases.push(['the quadratic still reproduces S at every node', String(Array.from(q2.c).every((cv, i) => Math.abs(p[i] * cv + q2.R[i] - S[i]) < 1e-12)), 'true']);
    const q3 = extrapolateOrder(g, { p: [1, 1, 0.1, 0.1, 0.1, 0.1], c: [0.9, 0.8, 0.8, 0.8, 0.8, 0.8], R: S.map(() => 0) }, 2);
    cases.push(['two supported nodes: the quadratic falls back to the straight line (counted)', `${q3.fellBack} ${JSON.stringify(Array.from(q3.c).map(v => +v.toFixed(6)))}`, `4 ${JSON.stringify([0.9, 0.8, 0.7, 0.6, 0.5, 0.4])}`]); EDGES.push('a quadratic with two supported nodes');
    cases.push(['isStep: a table of 0s and 1s is a step; one chance of 0.5 is not', `${isStep({ p: [0, 1, 1, 0] })} ${isStep({ p: [0, 1, 0.5] })}`, 'true false']); }
  // the lists held together
  { const src = readFileSync(join(HERE, 'audit-7av.mjs'), 'utf8'), m = /^export const UNITS = (\[.*\]);$/m.exec(src);
    cases.push(['the units are audit-7av.mjs\'s, in its order', m ? String(JSON.stringify(JSON.parse(m[1].replace(/'/g, '"'))) === JSON.stringify(UNITS7)) : 'no UNITS line', 'true']); }
  cases.push(['every READER unit at 6 share points is a 7at unit', String(UNITS7.filter(u => u[1] === 'READER' && u[4] === 6).every(([id, a, s, x]) => AT.UNITS7.some(y => y[0] === id && y[1] === a && y[2] === s && y[3] === x))), 'true']);
  cases.push(['normRan drops the grid and the reference', normRan('mix 3 pts 30 seed 7002 paths 8 grid total30x12x12 lambda 1 tierState true readerRef order bequestWeight 0.02'), 'mix 3 pts 30 seed 7002 paths 8 grid total30x6x6 lambda 1 tierState true bequestWeight 0.02']);
  cases.push(['parse reads an sdec line', JSON.stringify(parse('S130             case | unit READER/TS+J/W0.02/PCLSI/S12 | lambda x tier own riskAbove auto mix 3\n                 sdec READER/TS+J/W0.02/PCLSI/S12 world 0 year 0: reads 2000 step 2000 flat 4.9000 lin 1.4000 quad 0.5000 unsup 0.4000 qmoved 1500 spread 0 flat - lin - other 0 flat -\n')[0].sdec[0]), JSON.stringify({ k: 0, t: 0, reads: 2000, ns: 2000, sf: 4.9, sl: 1.4, sq: 0.5, su: 0.4, qm: 1500, np: 0, pf: NaN, pl: NaN, no: 0, of: NaN })]);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2, 3, 4, 5].map(i => `OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`).join('\n')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7av'), DIR_AT = args[1] || join(HERE, 'results', 'diag7at');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const LT = logsOf(DIR_AT); requireFairLogs(LT, AT.PRED);
  const atUnits = Object.values(LT).flatMap(AT.parse);
  const refAt = (id, a, l) => atUnits.find(u => u.id === id && u.arm === a && u.label === l && u.done) || null;
  const bad = gate(units, refAt);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${UNITS.length} units; the READER units at 6 share points 7at's line for line; the 12-point units and ORDER their twin's ran line but for the grid and the reference, their access and joint lines; 7at's checks (7ar's and 7ap's) on every unit; the step split summing to the read and read (b) by year and path, and the quadratic moving the bridge step reads on every PCLSI READER unit`);
  reading(units);
}
