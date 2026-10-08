/*
 * NS-COND'S REDUCER (PLAN.md NS-COND; predictions/diag-nscond.md; the deep review after NSB, deep-review-log.md 8 Oct
 * 17:19 UK; items/NSB.md). Reads results/diagnscond (audit-nscond.mjs: S370, bridge 4 and S126 deciding, S130 and S128
 * for incidence) and, behind the gate, decides:
 *   ITEM 1 (NSL-UNCOND: the live corners' bequest error is their survival's, 1 + elive about rho). A CELL is a deciding
 *     household's reads in one arm and class - BASE in every reader year, BASE's non-step years apart, COV in its non-step
 *     years (COV's step years carry the coverage node) - over the reads touching a share-axis dead node (wd > 0) whose
 *     arm's own move has a one-step bequest and survival above 0 and whose live corners carry weight (wL > 0, S_L > 0); a
 *     cell COUNTS where its mean wd is above WD_MIN, and is MATERIAL where its mean |elive| is above MAT (held to within
 *     1e-12, as reduce-nsb.mjs holds LO3). Per read:
 *     elive = B_L / bE - 1, rho = S_L / s1, eC = bC / bE - 1 (the copy rule's read), eK = (B_L / S_L) sR / bE - 1 (the
 *     survival-conditioned read). Per path, dR = the mean of |elive| - |(1 + elive) / rho - 1| (dividing by rho brings the
 *     live read nearer bE) and dK = the mean of |eC| - |eK| (the conditioned read beats the copy read). Paired sign-flip
 *     tests (reduce-7ar.mjs flipP, B 20,000 from fixed seeds), one-sided, on each counting material cell: R, mean(dR) above
 *     0; K, mean(dK) above 0; N, mean(-dR) above 0; Holm over all of them. HELD when some cell is counting and material
 *     and every such cell shows R and K; FALSIFIED when some is and every such cell shows N; else INCONCLUSIVE.
 *   ITEM 2 and ITEM 3: NSB's (reduce-nsb.mjs), unchanged: the copy rule's census of changed moves under BASE, and the
 *     menu-order reference's share of BASE's year-before error on S370.
 *   THE GATE (NOT SETTLED if any fails): the fair-test gate on the logs (fair-gate.mjs requireFairLogs); the stamps (one
 *     code and audit across the run, the prediction the registered one, each file its log's); a plant line, a blind line
 *     or a tables line; a household missing, repeated or not done; an arm's settings not taking; a ran line off XAS's
 *     unit; THE TABLE CHECKS: DEADSTEP failed, or ran on nothing on an arm, or a slice's tolerance under twice its clean
 *     error, or a plant's effect printed; no census line for an arm; a self-check failed, or run on nothing where it must
 *     run; a file missing, short or off its log's counts; THE IDENTITY (NSB's): on S370 and bridge 4, every item-3 read
 *     rr, ex5 and vb equal to XAS-R2's BASE read, ex5 and vb at the same path, world and year.
 *   node research/solver/reduce-nscond.mjs [dir] [paths a world] [points] > research/solver/results-nscond.txt
 *   node research/solver/reduce-nscond.mjs --planted   the planted checks alone, the outcomes they reach and the EDGES
 *   node research/solver/reduce-nscond.mjs --tables <dir> [points]   the preflight's tables-only logs: the table checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { holm } from './stats.mjs';
import { flipP } from './reduce-7ar.mjs';
import { perPath } from './reduce-xasr.mjs';
import { item2, item3, yearsOf, identity, LO3, HI3, CHANGE_HELD, CHANGE_FALS, MIN_STATES, IDT } from './reduce-nsb.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-nscond.md', XPRED = 'research/solver/predictions/diag-xasr2.md';
export const PTS = '30', SEED = '7002', NPW = 2000, B = 20000, ALPHA = 0.05;
export const WD_MIN = 0.1, MAT = 0.05, RATIO_MIN = 2;
export const UNITS = ['S370', 'bridge 4', 'S126', 'S130', 'S128'], DECIDING = ['S370', 'bridge 4', 'S126'], IDENT = ['S370', 'bridge 4'], ARMS = ['BASE', 'COV'];
export { LO3, HI3, CHANGE_HELD, CHANGE_FALS, MIN_STATES, IDT };
const L = 'READER/TS+J/W0.02/PCLSI';
const CHECKS = ['replicaNS', 'wdRead', 'deadstepFail', 'deadstepNext', 'restore', 'replica', 'rebuild', 'nodes', 'fine'], MUST = ['replicaNS', 'wdRead', 'restore'], MUST3 = ['replica', 'rebuild', 'nodes', 'fine'];
const COLS1 = ['top', 'wd', 'bR', 'bE', 'hR', 'hE', 'hD', 'agree', 'w0x', 'wL', 'wK', 'BL', 'SL', 's1', 'sR', 'bC'];
const fileOf = id => `${id.replace(/\s+/g, '_')}.json.gz`;
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const esc = s => s.replace(/[/+.]/g, m => `\\${m}`);
const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const f4 = x => (Number.isFinite(x) ? x.toExponential(4) : 'NaN');
const f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-');
const frac = s => { const m = /^(\d+)\/(\d+)$/.exec(s || ''); return m ? [Number(m[1]), Number(m[2])] : null; };
const num = s => (s === null ? NaN : s === 'NaN' ? NaN : Number(s));

// a DEADSTEP line: "deadstep A: FAIL a/b clean error x tolerance y plant z; NEXT c/d clean error s x b y h z tolerance w plant v"
const DSL = /^\s+deadstep (BASE|COV): FAIL (\d+\/\d+) clean error (\S+) tolerance (\S+) plant (\S+); NEXT (\d+\/\d+) clean error s (\S+) b (\S+) h (\S+) tolerance (\S+) plant (\S+)$/;
export function parse(text) {
  const us = []; let cur = null, stamp = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = /^stamp: (.*)$/.exec(line))) stamp = m[1];
    if (/^plant: /.test(line)) us.push({ plant: line });
    if ((m = /^(\S.*?)\s+case \| unit (\S+) \| /.exec(line))) { cur = { id: m[1].trim(), unit: m[2], stamp, solve: {}, item1: {}, item2: {}, checks: {}, census: {}, deadstep: {}, tables: {}, blind: false, done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = /^\s+solve (BASE|COV): (.*)$/.exec(line))) cur.solve[m[1]] = m[2];
    else if ((m = new RegExp(`^\\s+ran ${esc(L)}: (.*)$`).exec(line))) cur.ran = m[1];
    else if ((m = /^\s+census (BASE|COV) t(\d+): dead (\d+), on the share axis (\d+) \(FAIL (\d+), NEXT (\d+)\), off it (\d+); KEPT (\d+) /.exec(line))) (cur.census[m[1]] = cur.census[m[1]] || []).push({ t: Number(m[2]), dead: Number(m[3]), ds: Number(m[4]), fail: Number(m[5]), next: Number(m[6]), x0: Number(m[7]), kept: Number(m[8]) });
    else if ((m = DSL.exec(line))) cur.deadstep[m[1]] = { fail: frac(m[2]), failErr: num(m[3]), failTol: num(m[4]), failPlant: m[5], next: frac(m[6]), sErr: num(m[7]), bErr: num(m[8]), hErr: num(m[9]), nextTol: num(m[10]), nextPlant: m[11] };
    else if ((m = /^\s+tables (BASE|COV): passed noAccessDead (\d+)$/.exec(line))) cur.tables[m[1]] = { noAccessDead: Number(m[2]) };
    else if (/^\s+blind: /.test(line)) cur.blind = true;
    else if ((m = /^\s+item1 (BASE|COV): reads (\d+) withDead (\d+) /.exec(line))) cur.item1[m[1]] = { reads: Number(m[2]), dead: Number(m[3]) };
    else if ((m = /^\s+item2 (BASE|COV): states (\d+) changed (\d+) /.exec(line))) cur.item2[m[1]] = { states: Number(m[2]), changed: Number(m[3]) };
    else if ((m = /^\s+item3 BASE: reads (\d+) /.exec(line))) cur.item3 = { reads: Number(m[1]) };
    else if ((m = /^\s+checks (BASE|COV): (.*)$/.exec(line))) { const c = {}; for (const q of CHECKS) c[q] = frac(field(m[2], q)); c.noAccessDead = Number(field(m[2], 'noAccessDead')); cur.checks[m[1]] = c; }
    else if (new RegExp(`^\\s+done ${esc(L)} `).test(line)) cur.done = true;
  }
  return us;
}
const stampParts = s => ({ code: field(s || '', 'code'), audit: field(s || '', 'audit'), prediction: field(s || '', 'prediction') });
const okFrac = f => f && f[0] === f[1];
// THE TABLE CHECKS of one household's log: DEADSTEP passed and ran on something, each slice's tolerance at least
// RATIO_MIN times its clean error (an error of 0 passes), no plant's effect printed, a census line for every arm
export function tableChecks(u, tag = u.id) {
  const bad = [];
  for (const a of ARMS) {
    const d = u.deadstep[a];
    if (!d || !d.fail || !d.next) { bad.push(`${tag}: no DEADSTEP line for ${a}`); continue; }
    if (!okFrac(d.fail)) bad.push(`${tag}: ${a}'s DEADSTEP FAIL failed (${d.fail[1] - d.fail[0]} of ${d.fail[1]})`);
    if (!okFrac(d.next)) bad.push(`${tag}: ${a}'s DEADSTEP NEXT failed (${d.next[1] - d.next[0]} of ${d.next[1]})`);
    if (!(d.fail[1] + d.next[1] > 0)) bad.push(`${tag}: ${a}'s DEADSTEP ran on nothing`);
    for (const [q, e, tol] of [['FAIL', d.failErr, d.failTol], ['NEXT s', d.sErr, d.nextTol], ['NEXT b', d.bErr, d.nextTol], ['NEXT h', d.hErr, d.nextTol]]) {
      if (!(Number.isFinite(e) && e >= 0 && Number.isFinite(tol) && tol > 0)) { bad.push(`${tag}: ${a}'s DEADSTEP ${q} slice unread`); continue; }
      if (e > 0 && tol / e < RATIO_MIN) bad.push(`${tag}: ${a}'s DEADSTEP ${q} tolerance ${tol} under ${RATIO_MIN} times its clean error ${e}`);
    }
    if (d.failPlant !== 'NaN' || d.nextPlant !== 'NaN') bad.push(`${tag}: ${a}'s DEADSTEP printed a plant's effect`);
    if (!(u.census[a] && u.census[a].length)) bad.push(`${tag}: no census line for ${a}`);
  }
  return bad;
}
export function gate(units, { pts = PTS, npw = NPW, pred = PRED, tables = false } = {}) {
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
    if (u.blind) bad.push(`${tag}: a blind run (no item line)`);
    for (const a of ARMS) if (!u.solve[a]) bad.push(`${tag}: no solve line for ${a}`);
    if (u.solve.BASE && (field(u.solve.BASE, 'readerTax') !== '-' || field(u.solve.BASE, 'coverage') !== '-')) bad.push(`${tag}: BASE ran with the reader's tax or coverage`);
    if (u.solve.COV && (field(u.solve.COV, 'readerTax') === '-' || field(u.solve.COV, 'coverage') === '-')) bad.push(`${tag}: COV ran without the reader's tax or coverage`);
    if (!u.ran) { bad.push(`${tag}: no ran line`); continue; }
    const want = { mix: '3', pts, seed: SEED, paths: String(3 * npw), worlds: '3' };
    for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    bad.push(...tableChecks(u));
    if (tables) {
      // the preflight's tables-only logs: the table checks and the no-access count alone
      for (const a of ARMS) if (!(u.tables[a] && u.tables[a].noAccessDead > 0)) bad.push(`${tag}: ${a}'s tables line missing, or no node with no accessible money classed dead`);
      continue;
    }
    if (Object.keys(u.tables).length) bad.push(`${tag}: a tables-only run (no read)`);
    if (!u.done) bad.push(`${tag}: not done`);
    const before = (field(u.ran, 'before') || 'none').split(',').filter(x => x !== 'none').map(Number), want3 = before.some(t => t > 0);
    for (const a of ARMS) {
      const c = u.checks[a];
      if (!c || CHECKS.some(q => !c[q])) { bad.push(`${tag}: no checks line for ${a}`); continue; }
      for (const q of CHECKS) if (!okFrac(c[q])) bad.push(`${tag}: ${a}'s ${q} check failed (${c[q][1] - c[q][0]} of ${c[q][1]})`);
      for (const q of MUST) if (!(c[q][1] > 0)) bad.push(`${tag}: ${a}'s ${q} check ran on nothing`);
      if (!(c.noAccessDead > 0)) bad.push(`${tag}: ${a} classed no node with no accessible money dead (the dead classification ran on none it must catch)`);
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
    if (!A || COLS1.some(q => !Array.isArray(A[q]) || A[q].length !== n1)) { bad.push(`${tag}: ${a}'s item 1 columns missing or of the wrong length`); continue; }
    if (A.bR.some(x => !Number.isFinite(x)) || A.hR.some(x => !Number.isFinite(x)) || A.bC.some(x => !Number.isFinite(x)) || A.sR.some(x => !Number.isFinite(x))) bad.push(`${tag}: ${a}'s item 1 reads not all finite`);
    if (['wd', 'w0x', 'wL', 'wK'].some(q => A[q].some(x => !(x >= 0 && x <= 1 + 1e-12)))) bad.push(`${tag}: ${a}'s item 1 weights outside [0, 1]`);
    if (A.wd.some((w, j) => Math.abs(w + A.w0x[j] + A.wL[j] - 1) > 1e-9)) bad.push(`${tag}: ${a}'s item 1 weights do not sum to 1`);
    if (A.wK.some((w, j) => w > A.wL[j] + 1e-12)) bad.push(`${tag}: ${a}'s KEPT weight above the live weight`);
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

// ITEM 1
export const readsOf = (A, j) => ({ el: A.BL[j] / A.bE[j] - 1, rho: A.SL[j] / A.s1[j], eC: A.bC[j] / A.bE[j] - 1, eK: A.BL[j] / A.SL[j] * A.sR[j] / A.bE[j] - 1 });
export function cellsOf(files) {
  const out = [];
  for (const id of DECIDING) {
    const t = files[id]; if (!t) continue;
    const I = t.item1;
    for (const [a, cls] of [['BASE', 'all'], ['BASE', 'nonstep'], ['COV', 'nonstep']]) {
      const A = I.arms[a];
      const J = I.t.map((_, j) => j).filter(j => A.wd[j] > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && A.s1[j] > 0 && A.wL[j] > 0 && A.SL[j] > 0 && (cls === 'all' || I.step[j] === 0));
      const mwd = mean(J.map(j => A.wd[j])), R = J.map(j => readsOf(A, j)), mel = mean(R.map(x => Math.abs(x.el)));
      const counts = J.length > 0 && mwd > WD_MIN, material = counts && mel > MAT + 1e-12;   // MAT held to within 1e-12 (0.05 is no binary fraction)
      const cnt = perPath(I, J, () => 1), at = new Map(J.map((j, x) => [j, R[x]]));
      const dR = perPath(I, J, j => { const x = at.get(j); return Math.abs(x.el) - Math.abs((1 + x.el) / x.rho - 1); }).map((v, i) => v / cnt[i]);
      const dK = perPath(I, J, j => { const x = at.get(j); return Math.abs(x.eC) - Math.abs(x.eK); }).map((v, i) => v / cnt[i]);
      out.push({ id, a, cls, n: J.length, paths: cnt.length, counts, material, mwd, mel, mrel: mean(R.map(x => x.el)), mrho: mean(R.map(x => x.rho)), mdiv: mean(R.map(x => Math.abs((1 + x.el) / x.rho - 1))),
        meC: mean(R.map(x => Math.abs(x.eC))), meK: mean(R.map(x => Math.abs(x.eK))), mw0x: mean(J.map(j => A.w0x[j])), mwK: mean(J.map(j => A.wK[j])),
        dR, dK, nR: dR.map(v => -v), dropped: I.t.filter((_, j) => A.wd[j] > 0).length - J.length });
    }
  }
  return out;
}
export function item1(files) {
  const cells = cellsOf(files), mc = cells.filter(c => c.material);
  const tests = mc.flatMap((c, i) => [{ c, k: 'R', p: flipP(c.dR, B, 8101 + 3 * i) }, { c, k: 'K', p: flipP(c.dK, B, 8102 + 3 * i) }, { c, k: 'N', p: flipP(c.nR, B, 8103 + 3 * i) }]);
  const h = holm(tests.map(x => x.p)); tests.forEach((x, i) => { x.c[`p${x.k}`] = h[i]; });
  const v = !mc.length ? 'INCONCLUSIVE' : mc.every(c => c.pR < ALPHA && c.pK < ALPHA) ? 'HELD' : mc.every(c => c.pN < ALPHA) ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { cells, v };
}

export function reading(files, out = console.log) {
  const one = item1(files), two = item2(files), three = item3(files);
  out(`\nITEM 1: THE LIVE CORNERS' BEQUEST AT THE SHARE-AXIS DEAD READS (cells: a deciding household's reads touching a share-axis dead node, an arm and a class; counts when mean wd > ${WD_MIN}, material when mean |elive| > ${MAT}; elive = B_L/bE - 1, rho = S_L/s1, eC the copy read's, eK the conditioned read's)`);
  for (const c of one.cells) out(`  ${c.id.padEnd(9)} ${c.a.padEnd(4)} ${c.cls.padEnd(7)} reads ${c.n} paths ${c.paths} mean wd ${f3(c.mwd)} w0x ${f3(c.mw0x)} wK ${f3(c.mwK)} elive ${f4(c.mrel)} |elive| ${f4(c.mel)} rho ${f4(c.mrho)} |(1+elive)/rho-1| ${f4(c.mdiv)} |eC| ${f4(c.meC)} |eK| ${f4(c.meK)}${c.counts ? (c.material ? '' : ' (not material)') : ' (does not count)'}${c.pR !== undefined ? ` R p ${c.pR.toFixed(4)} K p ${c.pK.toFixed(4)} N p ${c.pN.toFixed(4)}` : ''}; left out ${c.dropped}`);
  for (const id of UNITS.filter(x => !DECIDING.includes(x))) { const t = files[id]; if (!t) continue; const I = t.item1; for (const a of ARMS) { const A = I.arms[a], J = I.t.map((_, j) => j).filter(j => A.wd[j] > 0); out(`  ${id.padEnd(9)} ${a.padEnd(4)} incidence: reads ${I.t.length}, touching a share-axis dead node ${J.length}, mean wd there ${f3(mean(J.map(j => A.wd[j])))}`); } }
  out('\nITEM 2: THE MOVES THE COPY RULE CHANGES (BASE; COV beside; a census over the states the paths reach)');
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
  const rnd = (() => { let x = 24680; return () => ((x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 4294967296); })();
  // a synthetic household's item 1: per read wd, rho (the live corners' survival over the state's) and the live corners'
  // bequest error elive as a function of rho (lv); the copy read fills the dead corners with the live bequest; the
  // conditioned read's survival read sR is the state's own s1 unless sr says otherwise
  const fake = (id, { wd = 0.3, lv = rho => rho - 1, rhoOf = () => 0.5 + rnd(), sr = null, nP = 40, ys = [1, 2, 3], step = [2], cov = null, wL = null, s1 = 0.2 } = {}) => {
    const cols = () => Object.fromEntries(COLS1.map(q => [q, []]));
    const I1 = { k: [], p: [], t: [], step: [], arms: { BASE: cols(), COV: cols() } };
    for (let p = 0; p < nP; p++) for (const y of ys) {
      I1.k.push(0); I1.p.push(p); I1.t.push(y); I1.step.push(step.includes(y) ? 1 : 0);
      for (const [a, f] of [['BASE', lv], ['COV', cov || lv]]) {
        const w = typeof wd === 'function' ? wd(y, a) : wd, wl = wL !== null ? wL : 1 - w, rho = rhoOf(y, p, a), bE = 100 + rnd(), BL = bE * (1 + f(rho, y, p)), SL = rho * s1, A = I1.arms[a];
        A.top.push(1); A.wd.push(w); A.w0x.push(1 - w - wl); A.wL.push(wl); A.wK.push(0); A.bE.push(bE); A.BL.push(BL); A.SL.push(SL); A.s1.push(s1);
        A.sR.push(sr === null ? s1 : sr(rho, s1)); A.bR.push(wl * BL); A.bC.push(wl * BL + w * BL); A.hR.push(1); A.hE.push(1); A.hD.push(0); A.agree.push(1);
      }
    }
    const I2 = { k: [0], p: [0], s: [0], arms: { BASE: { a0: [2], a1: [2] }, COV: { a0: [2], a1: [2] } } };
    const I3 = { k: [], p: [], t: [], top: [], rr: [], ex5: [], ro: [], vb: [], vb41: [] };
    return { id, stamp: { code: 'c', audit: 'a', prediction: PRED, sha: 's' }, seed: 7002, npw: NPW, item1: I1, item2: I2, item3: I3 };
  };
  const set = (o = {}) => Object.fromEntries(DECIDING.map(id => [id, fake(id, { ...o, ...(o.byId && o.byId[id] ? o.byId[id] : {}) })]));
  // item 1
  { const r = item1(set()); ok(r.v === 'HELD', `item 1: the live error the survival ratio's (1 + elive = rho), the conditioned read at the state's survival, reads HELD (${r.v})`); reach[1].add(r.v); }
  { const r = item1(set({ lv: () => 0.5, rhoOf: () => 0.2 + 0.2 * rnd() })); ok(r.v === 'FALSIFIED', `item 1: a live error of +0.5 while rho lies at 0.2 to 0.4 (NSL-WEALTH or NSL-SHARE: not the survival's; dividing by rho moves the read away) reads FALSIFIED (${r.v})`); reach[1].add(r.v); }
  { const r = item1(set({ byId: { 'bridge 4': { lv: () => 0.5, rhoOf: () => 0.2 + 0.2 * rnd() } } })); ok(r.v === 'INCONCLUSIVE', `item 1: one household off the survival ratio keeps the rest from HELD and from FALSIFIED (${r.v})`); reach[1].add(r.v); }
  { const r = item1(set({ sr: (rho, s1) => s1 * 3 })); ok(r.v === 'INCONCLUSIVE' && r.cells.filter(c => c.material).every(c => c.pR < ALPHA && !(c.pK < ALPHA)), `item 1: rho carries the error but the conditioned read misses the state's survival by threefold (worse than the copy read): R shows, K does not, INCONCLUSIVE (${r.v})`); }
  { const r = item1(set({ rhoOf: () => 1.03, lv: rho => rho - 1 })); ok(r.cells.every(c => !c.material) && r.v === 'INCONCLUSIVE', `item 1: live errors of 0.03, under the materiality floor ${MAT}, leave no material cell: INCONCLUSIVE (${r.v})`); }
  { const F = set({ rhoOf: () => 1 + MAT, nP: 8, ys: [1, 3] }), c = cellsOf(F); ok(c.every(x => x.counts && !x.material && Math.abs(x.mel - MAT) < 1e-13) && item1(F).v === 'INCONCLUSIVE', `EDGE item 1: a mean |elive| at ${MAT} to within 1e-13 (0.05 is no binary fraction; the rule's 1e-12 holds it at the line) is not material (${c.map(x => f4(x.mel)).join(',')})`); }
  { const F = set({ wd: WD_MIN, nP: 4, ys: [1] }), c = cellsOf(F); ok(c.every(x => x.mwd === WD_MIN && !x.counts) && item1(F).v === 'INCONCLUSIVE', `EDGE item 1: a mean wd of exactly ${WD_MIN} does not count (${item1(F).v})`); }
  { const F = set(); const A = F.S370.item1.arms.BASE; A.bE[0] = NaN; A.wL[1] = 0; A.w0x[1] = 1 - A.wd[1]; A.SL[2] = 0; A.s1[3] = 0; A.bE[4] = 0; const c = cellsOf(F).find(x => x.id === 'S370' && x.a === 'BASE' && x.cls === 'all'); ok(c.dropped === 5 && item1(F).v === 'HELD', `EDGE item 1: a failing move, a read with no live weight, live corners at survival 0, a one-step survival of 0 and a one-step bequest of 0 are left out and counted (${c.dropped})`); }
  { const r = item1(set({ cov: () => 0.5, rhoOf: (y, p, a) => (a === 'COV' ? 0.2 + 0.2 * rnd() : 0.5 + rnd()) })); ok(r.v === 'INCONCLUSIVE', `item 1: COV's non-step cells off the survival ratio keep it from HELD (${r.v})`); }
  { const r = item1(set({ lv: (rho, y) => (y === 2 ? 0.5 : rho - 1), rhoOf: y => (y === 2 ? 0.2 + 0.2 * rnd() : 0.5 + rnd()) })); const all = r.cells.find(c => c.id === 'S370' && c.a === 'BASE' && c.cls === 'all'), ns = r.cells.find(c => c.id === 'S370' && c.a === 'BASE' && c.cls === 'nonstep'); ok(r.v === 'INCONCLUSIVE' && !(all.pR < ALPHA) && ns.pR < ALPHA, `item 1: the step year far off the ratio and the non-step years on it: the non-step cells show R, the all-years cell does not, INCONCLUSIVE (${r.v})`); }
  // item 2 and item 3 are NSB's functions (reduce-nsb.mjs --planted plants their outcomes and edges); here they read the files
  { const F = set(); ok(item2(F).v !== undefined && item3(F).v === 'INCONCLUSIVE', 'items 2 and 3: NSB\'s functions read the NS-COND files (item 3 with no reads is INCONCLUSIVE)'); }
  // the gate on the logs
  const clean = { failErr: '0.0000e+0', tol: '1.0000e-9', plant: 'NaN', s: '0.0000e+0' };
  const log = (id, o = {}) => [`stamp: code ${o.code || 'c'} audit a prediction ${o.pred || PRED} sha s`, ...(o.plant ? ['plant: deadh'] : []), `${id.padEnd(16)} case | unit ${o.unit || L} | lambda x`,
    `  solve BASE: secs 1 pts 30 shares 6 readerYears 3 readerTax - coverage -`, `  solve COV: secs 1 pts 30 shares 7 readerYears 3 readerTax ${o.tax || '1:2'} coverage {"nodes":1}`,
    `  ran ${L}: mix 3 pts ${o.pts || 30} seed 7002 paths 6000 worlds 3 steps 3 before ${o.before || '2'} readerYears 1,2,3`,
    ...(o.nocensus ? [] : ARMS.map(a => `  census ${a} t1: dead 10, on the share axis 4 (FAIL 3, NEXT 1), off it 6; KEPT 2 (largest bequest over survival x the year's largest bequest 1.0e+0)`)),
    ...ARMS.map(a => `  deadstep ${a}: FAIL ${o.dsBad === `${a}.fail` ? '2/3' : o.dsNone === a ? '0/0' : '3/3'} clean error ${o.failErr && a === 'BASE' ? o.failErr : clean.failErr} tolerance ${clean.tol} plant ${o.dsPlant === a ? '1.0000e-3' : clean.plant}; NEXT ${o.dsBad === `${a}.next` ? '0/1' : o.dsNone === a ? '0/0' : '1/1'} clean error s ${clean.s} b ${clean.s} h ${clean.s} tolerance ${clean.tol} plant NaN`),
    ...(o.blind ? ['  blind: reads 10, states 10, item-3 reads 6; no item line and no file'] : []),
    ...(o.tablesLine ? ARMS.map(a => `  tables ${a}: passed noAccessDead ${o.tablesNoAcc === a ? 0 : 3}`) : []),
    ...(o.tablesOnly ? [] : [...ARMS.map(a => `  item1 ${a}: reads 10 withDead 5 top 5 across 0 wd x`), ...ARMS.map(a => `  item2 ${a}: states 10 changed 0 opening -`), ...(o.no3 ? [] : ['  item3 BASE: reads 6 top 6 rep x']),
      ...ARMS.map(a => `  checks ${a}: ${CHECKS.map(q => `${q} ${o.bad === `${a}.${q}` ? '4/5' : o.none === `${a}.${q}` ? '0/0' : '5/5'}`).join(' ')} noAccessDead ${o.noacc === a ? 0 : 3}`), ...(o.undone ? [] : [`  done ${L} rss 1MB`])])].join('\n');
  const G = (o = {}, drop = null, opts = {}) => gate(UNITS.filter(id => id !== drop).flatMap(id => parse(log(id, o[id] || o.all || {}))), opts);
  ok(G().length === 0, 'the gate passes five clean logs');
  const planted1 = [
    ['a household missing', G({}, 'S128')], ['a plant line', G({ S370: { plant: 1 } })], ['a household not done', G({ S126: { undone: 1 } })],
    ['another code in one log', G({ S130: { code: 'd' } })], ['another prediction', G({ S370: { pred: 'x.md' } })], ['another unit', G({ S370: { unit: 'X/Y' } })],
    ['COV without the reader\'s tax', G({ S370: { tax: '-' } })], ['a ran line at 20 points', G({ S370: { pts: 20 } })],
    ['a DEADSTEP FAIL failure', G({ S370: { dsBad: 'BASE.fail' } })], ['a DEADSTEP NEXT failure', G({ S128: { dsBad: 'COV.next' } })], ['DEADSTEP on nothing on an arm', G({ S126: { dsNone: 'COV' } })],
    ['a DEADSTEP slice whose tolerance is under twice its clean error', G({ S370: { failErr: '6.0000e-10' } })], ['a plant\'s effect printed in DEADSTEP', G({ S130: { dsPlant: 'BASE' } })], ['no census line', G({ S370: { nocensus: 1 } })],
    ['a blind run', G({ S370: { blind: 1 } })], ['a tables-only line in a test run', G({ S128: { tablesLine: 1 } })],
    ['a failed restore check', G({ S370: { bad: 'COV.restore' } })], ['a failed deadstepNext check on the checks line', G({ S128: { bad: 'BASE.deadstepNext' } })], ['no node with no accessible money classed dead on COV', G({ S130: { noacc: 'COV' } })], ['a wdRead check on nothing', G({ S370: { none: 'BASE.wdRead' } })],
    ['a rebuild check on nothing where a year before a step follows year 0', G({ S370: { none: 'BASE.rebuild' } })], ['no item 3 reads where they are due', G({ S370: { no3: 1 } })]];
  for (const [m, b] of planted1) ok(b.length > 0, `planted: the gate refuses ${m}`);
  ok(G({ S370: { failErr: '5.0000e-10' } }).length === 0, 'EDGE: a DEADSTEP tolerance exactly twice its clean error passes');
  ok(G({ S126: { before: '0', no3: 1, none: 'BASE.rebuild' } }).length === 0, 'EDGE: a year before a step at year 0 alone (S126) needs no item 3 reads and no rebuild check');
  // the preflight's tables-only gate
  ok(G({ all: { tablesOnly: 1, tablesLine: 1, undone: 1 } }, null, { tables: true }).length === 0, 'the tables gate passes five clean tables-only logs');
  ok(G({ all: { tablesOnly: 1, tablesLine: 1, undone: 1 }, S370: { tablesOnly: 1, tablesLine: 1, undone: 1, tablesNoAcc: 'BASE' } }, null, { tables: true }).length > 0, 'planted: the tables gate refuses no node with no accessible money classed dead');
  ok(G({ all: { tablesOnly: 1, tablesLine: 1, undone: 1 }, S126: { tablesOnly: 1, tablesLine: 1, undone: 1, dsBad: 'BASE.fail' } }, null, { tables: true }).length > 0, 'planted: the tables gate refuses a DEADSTEP failure');
  // the file checks
  const F = set(), u = parse(log('S370'))[0], f0 = { ...F.S370 };
  const uF = { ...u, item1: { BASE: { reads: f0.item1.t.length }, COV: { reads: f0.item1.t.length } }, item2: { BASE: { states: 1, changed: 0 }, COV: { states: 1, changed: 0 } }, item3: { reads: 0 } };
  ok(checkFile(f0, uF).length === 0, 'the file check passes a file that matches its log');
  ok(checkFile({ ...f0, stamp: { ...f0.stamp, audit: 'b' } }, uF).length > 0, 'planted: the file check refuses a file stamped by another audit');
  { const g = JSON.parse(JSON.stringify(f0)); g.item1.arms.COV.wL[0] += 0.1; ok(checkFile(g, uF).length > 0, 'planted: the file check refuses weights that do not sum to 1'); }
  { const g = JSON.parse(JSON.stringify(f0)); g.item1.arms.BASE.wK[0] = g.item1.arms.BASE.wL[0] + 0.01; ok(checkFile(g, uF).length > 0, 'planted: the file check refuses a KEPT weight above the live weight'); }
  { const g = JSON.parse(JSON.stringify(f0)); delete g.item1.arms.BASE.SL; ok(checkFile(g, uF).length > 0, 'planted: the file check refuses a missing column'); }
  ok(checkFile(f0, { ...uF, item2: { ...uF.item2, BASE: { states: 1, changed: 1 } } }).length > 0, 'planted: the file check refuses an item2 line whose changed count is off the file');
  return Object.assign(msgs, { reach });
}

// ---------- the real read ----------
const logsOf = dir => Object.fromEntries((existsSync(dir) ? readdirSync(dir) : []).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(dir, f), 'utf8')]));
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let P0;
  try { P0 = planted(); } catch (e) { console.log(`PLANTED CHECK FAILED: ${e.message}`); process.exit(1); }
  if (process.argv.includes('--planted')) {
    P0.forEach(m => console.log(`ok   ${m}`));
    for (const k of [1]) console.log(`OUTCOMES REACHED: item ${k}: ${[...P0.reach[k]].sort().join(', ')}`);
    console.log('OUTCOMES REACHED: item 2: FALSIFIED, HELD, INCONCLUSIVE (NSB\'s function, planted in reduce-nsb.mjs)');
    console.log('OUTCOMES REACHED: item 3: FALSIFIED, HELD, INCONCLUSIVE (NSB\'s function, planted in reduce-nsb.mjs)');
    console.log(`EDGES: a mean |elive| of exactly ${MAT}, a mean dead weight of exactly ${WD_MIN}, a failing move, no live weight, live survival 0, a one-step survival of 0 and a one-step bequest of 0 left out, a DEADSTEP tolerance exactly twice its clean error, a year before a step at year 0 alone`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const tables = process.argv.includes('--tables');
  const dir = args[0] || join(HERE, 'results', 'diagnscond'), npw = args[1] ? Number(args[1]) : NPW, pts = args[2] || PTS;
  const logs = logsOf(dir);
  if (!Object.keys(logs).length) { console.log(`FAIR-TEST GATE: FAILED\n  no logs in ${dir}`); process.exit(1); }
  if (!tables) requireFairLogs(logs, PRED);
  const units = Object.values(logs).flatMap(parse), bad = gate(units, { pts, npw, tables, pred: tables ? (stampParts(units[0] && units[0].stamp).prediction || PRED) : PRED });
  if (tables) {
    if (bad.length) { console.log(`TABLE CHECKS: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
    console.log(`TABLE CHECKS: passed - ${UNITS.length} households once at ${pts} points: DEADSTEP passed and ran on each arm, each slice's tolerance at least ${RATIO_MIN} times its clean error, a census line per arm, some node with no accessible money classed dead`);
    for (const u of units.filter(x => !x.plant)) for (const a of ARMS) { const d = u.deadstep[a]; console.log(`  ${u.id.padEnd(9)} ${a}: DEADSTEP FAIL ${d.fail[1]} NEXT ${d.next[1]}; census years ${u.census[a].length}, FAIL ${u.census[a].reduce((s, c) => s + c.fail, 0)} NEXT ${u.census[a].reduce((s, c) => s + c.next, 0)} KEPT ${u.census[a].reduce((s, c) => s + c.kept, 0)}`); }
    process.exit(0);
  }
  const files = {};
  for (const u of units.filter(x => !x.plant && UNITS.includes(x.id))) { const f = join(dir, fileOf(u.id)); files[u.id] = existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; bad.push(...checkFile(files[u.id], u, npw)); }
  const xdir = join(HERE, 'results', 'diagxasr2'), xlogs = logsOf(xdir);
  try { requireFairLogs(xlogs, XPRED); } catch (e) { bad.push(`XAS-R2's files fail their own fair-test gate (${e.message})`); }
  for (const id of IDENT) { const f = join(xdir, fileOf(id)), x = existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; if (!x || !x.stamp || x.stamp.prediction !== XPRED) bad.push(`${id}: XAS-R2's file missing or not stamped by ${XPRED}`); else bad.push(...identity(files[id], x, id)); }
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${UNITS.length} households once and done at XAS's unit, one code and audit, each file its log's; THE TABLE CHECKS (DEADSTEP and the census) passed on each arm; every self-check passed, and ran where it must, per arm; THE IDENTITY: every item-3 read, ex5 and vb on ${IDENT.join(' and ')} is XAS-R2's at the same path, world and year (XAS-R2's files through their own gate)`);
  console.log(`planted checks: ${P0.length}`);
  reading(files);
}
