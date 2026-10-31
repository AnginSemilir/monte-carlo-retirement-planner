/*
 * TOP-CELL'S DERIVATION (predictions/diag-topcell.md; the deep reviews after REF-B and REF-STEP, deep-review-log.md 20 Oct 02:53 and
 * 10:31 UK, and the design review of 20 Oct 17:04 UK, adopted in PLAN.md's 20 Oct 17:57 row): the records (S370's plan-reference
 * factorial, COPY-X's C, SNR, CX and SNRX at 30 points and COPY-W's CW and CXW at 60, behind their gates; REF-B's AR, ARX and AN
 * and REF-STEP's AN3 on S370 behind theirs; COPY-B's S130 and S128 cells behind its own); the additive projection of every
 * TOP-CELL line, path by path (the review's (5): PX = ARX + AN3 - AN, PSNX = PX + SNRX - CX, PX60 = PX + CXW - CX, PSNX60 =
 * PX60 + SNRX - CX), read through reduce-topcell.mjs's own items(); the read-only reads the review asked for before
 * registration (KNOWN-LEG; SNRX against CX's harm by world and by the mixture; year 1 by read class and by share cell; TC-SHARE's
 * cell split; TC-FORM's ceiling, results-tcform-topcell.txt; S130's and S128's visited share; the one-bridge identity,
 * results-identity-topcell.txt; the rsu build's inertness and unit test; PR31's GATE-READY receipt); the judged stories below
 * (grade D); the power of items 1 to 5 through items() and pOf(); the credences from the receipts' CAUSE CREDENCES (TC and
 * O192 from 20 Oct 02:53 UK, TCP from 17:04 UK) as stated, at the lead rate's lower bound (the registered ones) and at the
 * settled-since rate; the decision rows; the points and 80% intervals; the budget, from the records' timings; escalation
 * trigger 3.
 *   node research/solver/derive-topcell.mjs [--records] > research/solver/results-derive-topcell.txt
 * THE DESIGN MAP (DESIGN-MAP: written and committed with the JUDGED block, before this script's first output): each line, arm
 * and condition of the adopted design (PLAN.md's TOP-CELL row; the 17:04 review's (1) to (8)) to the item that reads it, a
 * reported line, or a declared departure:
 *   - "rsu ... built as one loop" ((1)(a), (b)): 44dc34e; research/tests/reader-ru.test.mjs (the else-if plant; RU's side on
 *     S370 under the package, RS's on S364); results-inert-rsu.txt; the audit's armTook reads 'rsu' on PSNX and PSNX60;
 *   - "the audits' split probe ... extend it, print sgOk for PSNX, and refuse a planted probe without RU's factor" ((1)(c)):
 *     audit-topcell.mjs's probe (RS's and RU's factors, 'rsu' both), splitTook on every job, the plant `split` (RU's factor
 *     dropped) refused on PSNX at the preflight;
 *   - "the preflight prints R by side ... If RS's side exceeds a hundredth of a point anywhere, add PSNX-ru" ((1)(d)): RH
 *     saved per path and printed by the preflight (a preview) and the run; DEPARTURE, declared: PSNXU (PSNX-ru) runs in the
 *     batch whatever the preview shows (one job, about 1.3 job-hours: a preview at 4 points cannot read R's size at 30), and is
 *     read beside items 1 and 2 only where the run's PSNX shows RH at a hundredth of a point or more (reduce-topcell.mjs);
 *   - "the reference x fix factorial on S370 alone ... S370's plan-reference cells known ... reuse them with a fair-test" ((2)):
 *     PX, PSNX, PX60, PSNX60 run; CX, SNRX (COPY-X) and CXW (COPY-W) reused in this derivation (section 1) and reproduced on
 *     this code at the preview (the preflight's `repro` jobs, byte for byte against the sources' preflights); not read by an
 *     item at full scale (the items read the package arms);
 *   - "on S130, SNRX and SNRXW (CX and CXW reused from COPY-B); on S128, CX, SNRX, CXW and SNRXW" ((2)): the batch's S130 and
 *     S128 jobs; S130's CX and CXW read from COPY-B's files behind its gate and the reproduction (reduce-topcell.mjs reuseGate);
 *     item 4 and item 5's one-bridge legs;
 *   - "S128's tax at the threshold is NOT CHECKED: the preflight prints A*_1 against the plan's split ... S128's package cells
 *     run only if the two differ" ((2)): identity-topcell.mjs (A*_1 against the plan's split at every b and gain node, and the
 *     package's tables against the plan's, PX against CX and PSNX against SNRX, at 4 points); its output read in section 1;
 *   - "TC-FORM ... Its ceiling can be computed now ... CX's linear rule as the calibration ... quadratic, log-odds, and the
 *     oracle node value ... If even the oracle removes under half, the records falsify TC-FORM" ((3)): tcform-topcell.mjs
 *     (results-tcform-topcell.txt), read in section 1; DEPARTURE, declared: the review names SNR's and SNRX's saved tables;
 *     the script re-solves CX and SNRX on this code instead (the saved tables hold lsurv, not the reader's p, c and R), and
 *     reads CX's visited states from COPY-X's saved file;
 *   - "TC-SHARE ... split SNRX's remaining step-year residual by the read's share cell ... If the inner cells carry under a
 *     tenth of a point, TC-SHARE adds nothing" ((3)): section 1 here, over COPY-X's saved SNRX states;
 *   - "Item 1, SUPPORT ... Item 2, NOT MOVED ... Item 3, O192 ... Item 4, BREADTH ... Item 5, HARM by world" ((6)):
 *     reduce-topcell.mjs's items 1 to 5 as registered; DEPARTURE, declared: item 1 reports a cell whose control residual is
 *     under half a point in size (a removal of nothing; item 1's own remainder band) and item 4 a household with under a tenth
 *     of its reads in the top share cell (the review's F3), neither read;
 *   - "pre-register that a year-1 rise under PSNX is not the fix's until a decomposition splits it" (UNMASKING FLAGS): item 2's
 *     report (year 1 by read class and by share cell, in PX and PSNX; PSNXU against PX), and the TCP cause reading
 *     (reduce-topcell.mjs causeOf);
 *   - "PX60 takes ANW's role with the departure declared" ((6)): item 3; the departure is the review's;
 *   - "(7) BEFORE REGISTRATION THE DERIVATION PRINTS": every line, section 1 (R by side: not in the records; PSNXU runs, above);
 *   - "Q5 ... PX against CX is not an item ... report it by the mixture" ((8)): not reported at full scale (no package arm on
 *     CX's household-seed pairs but S370, where CX is reused); section 1 prints ARX against CX by the mixture from REF-B's
 *     files (the package's nearest record);
 *   - "Q6: register only on PR31's GATE-READY receipt": deep-review-log.md 20 Oct 17:57 UK, printed in section 1;
 *   - "Q7 ... over 2 h, so CHECKLIST 11's escalation question is asked at registration": section 4, trigger 3's check;
 *   - "STOP until it reads: ... building CXC or C12X; re-running COPY-X's or COPY-W's S370 legs": none built or run (the
 *     reproduction re-runs them at the preview only, 40 paths a world, for the reuse's fair-test).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, pOf, causeOf, rowOf, POINT, shareAt, topShareOf, y1Of, STEPY, OTHERY, LEGS, EXPECT, MINRES } from './reduce-topcell.mjs';
import { cellsOf, wsOf, harmWorlds } from './reduce-copyx.mjs';
import { mixtureChange, mixtureOutcome } from './stats.mjs';

// THE JUDGED INPUTS (committed before this script's output and before any TOP-CELL run; grade D throughout).
export const JUDGED = {
  // the fix's effect under the package against its effect under the plan reference (SNRX less CX, path by path), at every
  // bridge year but year 1 and in GA, by TC cause: support carries the step reads' remainder (TC-SUPPORT: the plan
  // reference's size), or the remainder is the form's or the share axis's and support carries part of it
  fs: { SUPPORT: { 0.8: 0.25, 1: 0.5, 1.2: 0.25 }, FORM: { 0.4: 0.3, 0.6: 0.4, 0.8: 0.3 }, SHARE: { 0.4: 0.3, 0.6: 0.4, 0.8: 0.3 }, OTHER: { 0.3: 0.3, 0.6: 0.4, 0.9: 0.3 } },
  // the fix's year-1 effect in worlds 0 and 2 against the plan reference's, by TCP cause (the 17:04 review's ranking): its
  // own reads (SNREAD) and the package's cancellation (UNMASK) keep it; the plan reference's p shape (PLANP) takes it away
  y1: { SNREAD: { 0.8: 0.25, 1: 0.5, 1.2: 0.25 }, PLANP: { 0: 0.6, 0.2: 0.3, 0.4: 0.1 }, UNMASK: { 0.8: 0.25, 1: 0.5, 1.2: 0.25 }, OTHER: { 0: 0.25, 0.5: 0.35, 1: 0.4 } },
  // world 1's years 1 and 2 by O192 cause (the 02:53 review's): the 60-point lever (CXW less CX, path by path, a60) and the
  // fix (SNRX less CX, aS) under the package against the plan reference's
  o192: {
    W: { a60: { 0.8: 0.3, 1: 0.4, 1.2: 0.3 }, aS: { 0: 0.4, 0.25: 0.4, 0.5: 0.2 } },
    TOPC: { a60: { 0: 0.4, 0.25: 0.4, 0.5: 0.2 }, aS: { 0.8: 0.3, 1: 0.4, 1.2: 0.3 } },
    LAT: { a60: { 0: 0.5, 0.25: 0.5 }, aS: { 0: 0.5, 0.25: 0.5 } },
    OTHER: { a60: { 0: 0.3, 0.5: 0.4, 1: 0.3 }, aS: { 0: 0.3, 0.5: 0.4, 1: 0.3 } },
  },
  // the 60-point lever elsewhere (world 1's step years, worlds 0 and 2) against the plan reference's
  w60: { 0.7: 0.25, 1: 0.5, 1.3: 0.25 },
  // the fix at 60 points against its effect at 30 (no record: SNRXW on S370 never ran)
  f60: { 0.5: 0.25, 0.8: 0.35, 1: 0.4 },
  // the package's own per-path jitter about the projection (paths whose moves change), points
  jit: 0.3,
  // S130 and S128: SNRX's removal of the control's GB (no record on either), the remainder's shift, and S128's CX against its
  // C (O189: CX never ran on S128) at 30 and 60 points
  r4: { 1: 0.3, 0.85: 0.3, 0.6: 0.25, 0.3: 0.15 },
  d4: { '-0.3': 0.25, 0: 0.5, 0.3: 0.25 },
  cx128: { 0.5: 0.3, 0.8: 0.4, 1: 0.3 },
  // item 5: the fix's flips against its control as a multiple of SNRX against CX's on S370 (COPY-X's bits), on S370 under
  // the package and on S130 and S128 (scaled there by the control's paths that can flip, DISCORD)
  flips: { 0.75: 0.3, 1: 0.4, 1.5: 0.3 },
};

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = d => join(HERE, 'results', d);
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f2 = x => x.toFixed(2);
let st = 17; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const pickN = dist => Number(pick(dist));
const pois = m => { if (m <= 0) return 0; if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss())); let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const dec = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
const dec16 = x => { const b = Buffer.from(x, 'base64'); return new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
const cnt = b => { let c = 0; for (const x of b) c += x; return c; };
const K = [0, 1, 2], MIXW = [1 / 6, 2 / 3, 1 / 6];
const txt = f => readFileSync(join(HERE, f), 'utf8');

// 1. THE RECORDS
const gateOf = (script, dir, extra = []) => /^GATE: passed/m.test(spawnSync('node', [join(HERE, script), R_(dir), ...extra], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '');
for (const [s, d] of [['reduce-copyx.mjs', 'diagcopyx'], ['reduce-copyw.mjs', 'diagcopyw'], ['reduce-copyb.mjs', 'diagcopyb'], ['reduce-refb.mjs', 'diagrefb'], ['reduce-refstep.mjs', 'diagrefstep']]) if (!gateOf(s, d)) { console.log(`${d}'s files did not pass ${s}'s gate`); process.exit(1); }
const ld = (d, f) => { const j = JSON.parse(gunzipSync(readFileSync(join(R_(d), f))).toString()); return { ...j, per: Object.fromEntries(Object.entries(j.per).map(([x, v]) => [x, dec(v)])), bits: Object.fromEntries(Object.entries(j.bits).map(([x, v]) => [x, dec8(v)])), mv: Object.fromEntries(Object.entries(j.moves).map(([x, v]) => [x, dec16(v)])), states: Object.fromEntries(Object.entries(j.states).map(([x, v]) => [x, dec(v)])) }; };
const F = {
  C: ld('diagcopyx', 'S370-C-P30S6Q5.json.gz'), SNR: ld('diagcopyx', 'S370-SNR-P30S6Q5.json.gz'), CX: ld('diagcopyx', 'S370-CX-P30S6Q5.json.gz'), SNRX: ld('diagcopyx', 'S370-SNRX-P30S6Q5.json.gz'),
  CW: ld('diagcopyw', 'S370-CW-P60S6Q5.json.gz'), CXW: ld('diagcopyw', 'S370-CXW-P60S6Q5.json.gz'),
  AR: ld('diagrefb', 'S370-AR-P30S6Q5.json.gz'), ARX: ld('diagrefb', 'S370-ARX-P30S6Q5.json.gz'), AN: ld('diagrefstep', 'S370-AN-P30S6Q5.json.gz'), AN3: ld('diagrefstep', 'S370-AN3-P30S6Q5.json.gz'),
};
const B = { S130: { C: ld('diagcopyb', 'S130-C-P30S6Q5.json.gz'), CX: ld('diagcopyb', 'S130-CX-P30S6Q5.json.gz'), CW: ld('diagcopyb', 'S130-CW-P60S6Q5.json.gz'), CXW: ld('diagcopyb', 'S130-CXW-P60S6Q5.json.gz') }, S128: { C: ld('diagcopyb', 'S128-C-P30S6Q5.json.gz'), CW: ld('diagcopyb', 'S128-CW-P60S6Q5.json.gz') } };
const N = F.C.NPW, BR = F.C.bridge;
if (Object.values(F).some(f => f.NPW !== N || f.seed !== 7002 || f.bridge.join(',') !== BR.join(',')) || Object.values(B).flatMap(Object.values).some(f => f.NPW !== N || f.seed !== 7002)) { console.log('the records are not on one seed, paths and bridge years'); process.exit(1); }
const P100 = (f, x, k) => Float64Array.from(f.per[`${x}${k}`], v => 100 * v);
const sumY = (f, k, ys) => { const a = ys.map(t => P100(f, `Y${t}`, k)); return Float64Array.from(a[0], (_, i) => a.reduce((s, x) => s + x[i], 0)); };
const lin = (terms, k, x) => { const a = terms.map(([s, f]) => [s, typeof x === 'string' ? P100(f, x, k) : sumY(f, k, x)]); return Float64Array.from(a[0][1], (_, i) => a.reduce((s, [c, y]) => s + c * y[i], 0)); };
const se = a => { const m = mean(a); let v = 0; for (const x of a) v += (x - m) ** 2; return Math.sqrt(v / (a.length - 1) / a.length); };
const iv = a => `${f4(mean(a))} (se ${f4(se(a))})`;
const COLS = [...BR.map(t => `Y${t}`), 'GA'];
console.log('TOP-CELL\'S DERIVATION (predictions/diag-topcell.md)\n\n1. THE RECORDS');
console.log(`  seed 7002, ${N} paths a world on S370: COPY-X's C, SNR, CX and SNRX (30 points), COPY-W's CW and CXW (60), REF-B's AR and ARX, REF-STEP's AN and AN3, each behind its reducer's gate; COPY-B's S130 C, CX, CW and CXW and S128 C and CW behind COPY-B's`);
// KNOWN-LEG: the plan-reference factorial on S370, and the package's nearest records
console.log('  KNOWN-LEG: S370 by world and bridge year, points a path (each arm\'s residual by year, GA, the step years 3 and 7, and world 1\'s years 1 and 2):');
for (const a of ['C', 'SNR', 'CX', 'SNRX', 'CW', 'CXW', 'AR', 'ARX', 'AN', 'AN3']) for (const k of K) {
  const f = F[a]; console.log(`    ${a.padEnd(4)} world ${k}: ${COLS.map(x => `${x} ${f4(mean(P100(f, x, k)))}`).join(' ')} | Y3+Y7 ${f4(mean(sumY(f, k, STEPY)))} Y1+Y2 ${f4(mean(sumY(f, k, [1, 2])))} | survival ${f4(100 * cnt(f.bits[`OWN${k}`]) / N)}`);
}
console.log('  the levers under the plan reference, path by path (mean and se): the fix SNRX less CX; the 60-point lever CXW less CX; stepAll AN3 less AN; the reference with the copy rule and RS, ARX less CX');
for (const k of K) for (const [lab, a, b] of [['the fix', 'SNRX', 'CX'], ['60 points', 'CXW', 'CX'], ['stepAll', 'AN3', 'AN'], ['the package\'s reference', 'ARX', 'CX']]) console.log(`    ${lab} world ${k}: ${['Y1', 'Y2', 'Y3', 'Y5', 'Y7', 'GA'].map(x => `${x} ${iv(lin([[1, F[a]], [-1, F[b]]], k, x))}`).join('; ')}; Y3+Y7 ${iv(lin([[1, F[a]], [-1, F[b]]], k, STEPY))}`);
// SNRX against CX: harm by world and by the mixture (the review's (7): COPY-X printed SNRX only against SNR and against C)
{ const cells = K.map(k => cellsOf(F.CX.bits[`OWN${k}`], F.SNRX.bits[`OWN${k}`])), ws = K.map(k => wsOf(F.CX.per[`WS${k}`], F.SNRX.per[`WS${k}`])), hw = harmWorlds(cells, ws, 0.05), mx = mixtureOutcome(mixtureChange(cells));
  console.log(`  SNRX against CX on S370 (the fix under the plan reference; COPY-X's bits): by world ${hw.outcome}; ${hw.per.map(x => `world ${x.k}: lost ${cells[x.k].b} saved ${cells[x.k].c}, survival ${f4(x.ex.d)} (${f4(x.ex.lo)} to ${f4(x.ex.hi)}) ${x.ex.outcome}, whole score ${f4(x.w.d)} (${f4(x.w.lo)} to ${f4(x.w.hi)}), margin ${f4(x.margin)}: ${x.harm ? 'harm' : x.ok ? 'no material harm' : 'inconclusive'}`).join('; ')}; by the mixture ${f4(mx.d)} (${f4(mx.lo)} to ${f4(mx.hi)}) ${mx.outcome}`);
  const c2 = K.map(k => cellsOf(F.CX.bits[`OWN${k}`], F.ARX.bits[`OWN${k}`])), m2 = mixtureOutcome(mixtureChange(c2));
  console.log(`  ARX against CX on S370 (the package's nearest record against the plan reference, by the mixture; the review's Q5, reported): ${f4(m2.d)} (${f4(m2.lo)} to ${f4(m2.hi)}) ${m2.outcome}; lost/saved by world ${c2.map(x => `${x.b}/${x.c}`).join(', ')}`); }
// THE ADDITIVE PROJECTION, path by path (grade D): every TOP-CELL arm on S370 from the records
const PROJ = { PX: [[1, F.ARX], [1, F.AN3], [-1, F.AN]], PSNX: [[1, F.ARX], [1, F.AN3], [-1, F.AN], [1, F.SNRX], [-1, F.CX]], PX60: [[1, F.ARX], [1, F.AN3], [-1, F.AN], [1, F.CXW], [-1, F.CX]], PSNX60: [[1, F.ARX], [1, F.AN3], [-1, F.AN], [1, F.CXW], [-1, F.CX], [1, F.SNRX], [-1, F.CX]] };
console.log('  THE ADDITIVE PROJECTION (the review\'s (5), path by path: PX = ARX + AN3 - AN, PSNX = PX + SNRX - CX, PX60 = PX + CXW - CX, PSNX60 = PX60 + SNRX - CX; grade D):');
for (const a of Object.keys(PROJ)) for (const k of K) console.log(`    ${a.padEnd(6)} world ${k}: ${COLS.map(x => `${x} ${f4(mean(lin(PROJ[a], k, x)))}`).join(' ')} | Y3+Y7 ${f4(mean(lin(PROJ[a], k, STEPY)))} Y1+Y2 ${f4(mean(lin(PROJ[a], k, [1, 2])))}`);
// the items under the projection (items 1 to 3 on S370; 4 and 5 need arms with no record: section 2's stories)
const projP = () => {
  const perP = (h, a, k, x) => lin(PROJ[a], k, x);
  return { sup: [{ k: 0, pts: 30, c: lin(PROJ.PX, 0, STEPY), x: lin(PROJ.PSNX, 0, STEPY) }, { k: 1, pts: 60, c: lin(PROJ.PX60, 1, STEPY), x: lin(PROJ.PSNX60, 1, STEPY) }],
    nm: K.flatMap(k => [...OTHERY.map(t => ({ k, y: `Y${t}`, a: perP('S370', 'PX', k, `Y${t}`), b: perP('S370', 'PSNX', k, `Y${t}`) })), { k, y: 'GA', a: perP('S370', 'PX', k, 'GA'), b: perP('S370', 'PSNX', k, 'GA') }]),
    o192: Object.fromEntries(['PX', 'PSNX', 'PX60', 'PSNX60'].map(a => [a, lin(PROJ[a], 1, [1, 2])])) };
};
const PJ = projP(), dummyBr = [], top0 = { S130: 1, S128: 1 }, legs0 = LEGS.map(([arm, ctl, h]) => ({ arm, ctl, h, cells: K.map(() => ({ a: 1000, b: 0, c: 0, d: 3000 })), ws: K.map(() => ({ d: 0, se: 0.01 })) }));
const y1P = [0, 2].map(k => ({ k, a: lin(PROJ.PX, k, 'Y1'), b: lin(PROJ.PSNX, k, 'Y1'), clsA: Uint8Array.from(P100(F.ARX, 'QS1', k), (v, i) => (v >= P100(F.ARX, 'QC1', k)[i] ? 1 : 0)), topA: Uint8Array.from(shareAt(F.ARX, k, 1), v => (v >= 0.8 ? 1 : 0)), topB: Uint8Array.from(shareAt(F.SNRX, k, 1), v => (v >= 0.8 ? 1 : 0)) }));
const itP = items({ ...PJ, br: dummyBr, top: top0, legs: legs0, y1: y1P }), czP = causeOf(itP, { y1: y1P });
console.log(`  the items under the projection (reduce-topcell.mjs items(), its Bonferroni intervals; items 4 and 5 not read here): item 1 ${itP['1'].outcome} (${itP['1'].per.map(x => `world ${x.k} at ${x.pts}: removal ${f4(x.r.R)} (${f4(x.r.lo)} to ${f4(x.r.hi)}), remainder ${f4(x.rem.d)} (${f4(x.rem.lo)} to ${f4(x.rem.hi)}) ${x.read}`).join('; ')}); item 2 ${itP['2'].outcome} (moved: ${itP['2'].per.filter(x => x.read === 'moved').map(x => `world ${x.k} ${x.y} ${f4(x.r.d)}`).join(', ') || 'none'}; unclear: ${itP['2'].per.filter(x => x.read === 'unclear').map(x => `world ${x.k} ${x.y} ${f4(x.r.d)}`).join(', ') || 'none'}); item 3 ${itP['3'].label} (PX ${f4(itP['3'].px.d)}, PX60 ${f4(itP['3'].lv60.d)}, PSNX ${f4(itP['3'].lvS.d)}, PSNX60 less PX ${f4(itP['3'].dB.d)})`);
console.log(`  the TCP reading under the projection (causeOf, with ARX's read classes and top-cell flags for PX's and SNRX's for PSNX's): ${czP.tcp}; ${czP.y.map(y => `world ${y.k}: year 1's increment ${f4(y.d.d)} (${f4(y.d.lo)} to ${f4(y.d.hi)}), ARX's year-1 residual on mostly-supported reads ${f4(y.sup)}, mostly-copied ${f4(y.cop)}, the increment's share on top-cell reads ${f4(y.topShare)}`).join('; ')}`);
// year 1 by read class and share cell (the unmasking flag's decomposition, on the records: ARX for the package, CX and SNRX for the plan reference)
const CELLS = [[0, 0.2], [0.2, 0.4], [0.4, 0.6], [0.6, 0.8], [0.8, 0.9], [0.9, 0.95], [0.95, 1.0000001]];
const byCell = (f, k, t, y) => { const sh = shareAt(f, k, t), n = y.length; return CELLS.map(([lo, hi]) => { let s = 0, m = 0; for (let i = 0; i < n; i++) if (sh[i] >= lo && sh[i] < hi) { s += y[i]; m++; } return { lo, hi: Math.min(1, hi), s: s / n, m }; }); };
for (const a of ['ARX', 'CX', 'SNRX']) for (const k of K) {
  const f = F[a], y = P100(f, 'Y1', k), qs = P100(f, 'QS1', k), qc = P100(f, 'QC1', k); let sup = 0, cop = 0; for (let i = 0; i < N; i++) if (qs[i] >= qc[i]) sup += y[i]; else cop += y[i];
  console.log(`  year 1 by read class and share cell, ${a} world ${k}: mostly-supported ${f4(sup / N)}, mostly-copied ${f4(cop / N)}; by cell ${byCell(f, k, 1, y).map(c => `${c.lo}-${c.hi}: ${f4(c.s)} (${c.m})`).join(' | ')}`);
}
// TC-SHARE: SNRX's remaining step-year residual by the read's share cell (COPY-X's saved states); the inner cells (under 0.8)
console.log('  TC-SHARE (the review\'s (3)): SNRX\'s step-year residual (years 3 and 7) by the read\'s share cell, points a path; the inner cells under the top cell (share under 0.8):');
const tcShare = {};
for (const k of K) { const cells = STEPY.map(t => byCell(F.SNRX, k, t, P100(F.SNRX, `Y${t}`, k))), tot = CELLS.map((_, j) => cells.reduce((s, c) => s + c[j].s, 0)), inner = tot.slice(0, 4).reduce((s, x) => s + x, 0); tcShare[k] = inner;
  console.log(`    world ${k}: ${CELLS.map(([lo, hi], j) => `${lo}-${Math.min(1, hi)}: ${f4(tot[j])}`).join(' | ')}; the inner cells ${f4(inner)}: ${Math.abs(inner) < 0.1 ? 'under a tenth of a point (TC-SHARE adds nothing a top-cell node does not)' : 'a tenth of a point or more'}`); }
// TC-FORM's ceiling (tcform-topcell.mjs), the one-bridge identity (identity-topcell.mjs), the rsu build, PR31's receipt
const tcf = txt('results-tcform-topcell.txt'), idt = txt('results-identity-topcell.txt'), inr = txt('results-inert-rsu.txt'), rut = txt('results-reader-ru.txt');
const tcfV = (/^VERDICT: (.*)$/m.exec(tcf) || [, 'not read'])[1], tcfCal = (/^THE CALIBRATION: (.*)$/m.exec(tcf) || [, 'not read'])[1];
console.log(`  TC-FORM's ceiling (results-tcform-topcell.txt): ${tcfCal.slice(0, 160)}; ${tcfV}`);
for (const l of tcf.split('\n').filter(l => /years 3 and 7 pooled/.test(l))) console.log(`    ${l.trim()}`);
console.log(`  the one-bridge identity (results-identity-topcell.txt): ${idt.split('\n').filter(l => /^(S130|S128|VERDICT)/.test(l)).join(' | ')}`);
console.log(`  the rsu build (44dc34e): ${(/^VERDICT: (.*)$/m.exec(inr) || [, 'not read'])[1]} (results-inert-rsu.txt); its unit test (results-reader-ru.txt): ${(rut.match(/^PASS/gm) || []).length} PASS, ${(rut.match(/^FAIL|AssertionError/gm) || []).length} FAIL; ${(/^reader-ru: (.*)$/m.exec(rut) || [, 'no final line'])[1]}`);
const pr31 = txt('deep-review-log.md').split('\n').find(l => l.startsWith('- 20 Oct 17:57 UK |')) || '';
console.log(`  PR31's design review (deep-review-log.md 20 Oct 17:57 UK): ${(/VERDICT: [^.;]*/.exec(pr31) || ['not found'])[0]}; ${(/pr31-split\.test\.mjs blob [0-9a-f]{12}/.exec(pr31) || ['no blob'])[0]}`);
console.log('  R by side under PSNX (the review\'s (1)(d)): not in the records (no arm ran SN with RS); the preflight prints RH at the preview and the run at 30 points; PSNXU runs in the batch either way (the design map)');
// S130's and S128's visited share at their bridge reads (COPY-B's states) and their controls' GB
for (const [h, as] of [['S130', ['C', 'CX', 'CW', 'CXW']], ['S128', ['C', 'CW']]]) for (const a of as) { const f = B[h][a];
  const sh = K.flatMap(k => f.bridge.flatMap(t => Array.from(shareAt(f, k, t)).filter(Number.isFinite))), hist = CELLS.map(([lo, hi]) => sh.filter(v => v >= lo && v < hi).length / sh.length);
  console.log(`  ${h} ${a}: bridge years ${f.bridge.join(',')}; ${sh.length} bridge-year reads, the share in each cell ${CELLS.map(([lo, hi], j) => `${lo}-${Math.min(1, hi)} ${f2(hist[j])}`).join(' ')} (top cell ${f4(topShareOf(f))}); GB by world ${K.map(k => f4(mean(P100(f, 'GB', k)))).join(', ')}; GA ${K.map(k => f4(mean(P100(f, 'GA', k)))).join(', ')}; survival ${K.map(k => f4(100 * cnt(f.bits[`OWN${k}`]) / N)).join(', ')}`); }
if (process.argv.includes('--records')) process.exit(0);

// 2. THE POWER: a draw in reduce-topcell.mjs pOf()'s shape, every S370 arm path by path from the records (NESTED: each year's
// residual drawn once and every sum taken from it), the stories moving the fix (SNRX less CX) and the 60-point lever (CXW less
// CX) by world and year
const YR = [...BR.map(t => `Y${t}`), 'GA'];
const REC = { PX: {}, D: {}, L: {} };
for (const k of K) for (const x of YR) { REC.PX[`${k}${x}`] = lin(PROJ.PX, k, x); REC.D[`${k}${x}`] = lin([[1, F.SNRX], [-1, F.CX]], k, x); REC.L[`${k}${x}`] = lin([[1, F.CXW], [-1, F.CX]], k, x); }
const TOPS = { S130: topShareOf(B.S130.CX), S128: topShareOf(B.S128.C) };
const clsARX = k => Uint8Array.from(P100(F.ARX, 'QS1', k), (v, i) => (v >= P100(F.ARX, 'QC1', k)[i] ? 1 : 0)), topOf = (f, k) => Uint8Array.from(shareAt(f, k, 1), v => (v >= 0.8 ? 1 : 0));
const CLS = K.map(clsARX), TOPA = K.map(k => topOf(F.ARX, k)), TOPB = K.map(k => topOf(F.SNRX, k));
// the controls' bits and whole scores: PX's from ARX (the package's nearest record), PX60's from ARX too, the one-bridge
// controls' from COPY-B (S128's CX from its C, CX never having run there); the fix's flips from SNRX against CX on S370
const FL = K.map(k => cellsOf(F.CX.bits[`OWN${k}`], F.SNRX.bits[`OWN${k}`]));
const gapOf = (bits, ws) => { let wa = 0, na = 0, wd = 0, nd = 0; for (let i = 0; i < bits.length; i++) { if (bits[i]) { wa += ws[i]; na++; } else { wd += ws[i]; nd++; } } return (na ? wa / na : 0) - (nd ? wd / nd : 0); };
const CTRL = { S370: { bits: K.map(k => F.ARX.bits[`OWN${k}`]), ws: K.map(k => F.ARX.per[`WS${k}`]) }, S130: { bits: K.map(k => B.S130.CX.bits[`OWN${k}`]), ws: K.map(k => B.S130.CX.per[`WS${k}`]) }, S128: { bits: K.map(k => B.S128.C.bits[`OWN${k}`]), ws: K.map(k => B.S128.C.per[`WS${k}`]) } };
const disc = b => { const p = cnt(b) / b.length; return 4 * p * (1 - p); };
const pickIdx = (bits, want, m) => { const ix = []; for (let i = 0; i < N; i++) if (bits[i] === want) ix.push(i); m = Math.min(m, ix.length); for (let j = 0; j < m; j++) { const r = j + Math.floor(rnd() * (ix.length - j)); [ix[j], ix[r]] = [ix[r], ix[j]]; } return ix.slice(0, m); };
const flipBits = (b0, lost, saved) => { const b = Uint8Array.from(b0); for (const j of pickIdx(b0, 1, lost)) b[j] = 0; for (const j of pickIdx(b0, 0, saved)) b[j] = 1; return b; };
function drawP(s) {
  const fac = (k, x) => (x === 'Y1' && k !== 1 ? s.y1 : k === 1 && (x === 'Y1' || x === 'Y2') ? s.aS : s.fs), lev = (k, x) => (k === 1 && (x === 'Y1' || x === 'Y2') ? s.a60 : s.w60);
  const A = { PX: {}, PSNX: {}, PX60: {}, PSNX60: {} };
  for (const k of K) for (const x of YR) {
    const px = REC.PX[`${k}${x}`], d = REC.D[`${k}${x}`], l = REC.L[`${k}${x}`], f = fac(k, x), a = lev(k, x);
    A.PX[`${k}${x}`] = px;
    A.PSNX[`${k}${x}`] = Float64Array.from(px, (v, i) => v + f * d[i] + JUDGED.jit * gauss());
    A.PX60[`${k}${x}`] = Float64Array.from(px, (v, i) => v + a * l[i] + JUDGED.jit * gauss());
    A.PSNX60[`${k}${x}`] = Float64Array.from(A.PX60[`${k}${x}`], (v, i) => v + s.f60 * f * d[i] + JUDGED.jit * gauss());
  }
  const br = [];
  for (const h of ['S130', 'S128']) for (const [pts, c, x] of [[30, 'CX', 'SNRX'], [60, 'CXW', 'SNRXW']]) for (const k of K) {
    const src = h === 'S130' ? B.S130[c] : B.S128[pts === 30 ? 'C' : 'CW'], sc = h === 'S128' ? s.cx128[h] : 1, cc = Float64Array.from(P100(src, 'GB', k), v => sc * v);
    br.push({ h, k, pts, c: cc, x: Float64Array.from(cc, v => (1 - s.r4[h]) * v + s.d4[h] + JUDGED.jit * gauss()) });
  }
  const leg = (arm, ctl, h) => {
    const cells = [], ws = [];
    for (const k of K) {
      const b0 = CTRL[h].bits[k], w0 = CTRL[h].ws[k], sc = h === 'S370' ? 1 : disc(b0) / Math.max(1e-9, disc(F.CX.bits[`OWN${k}`])), g = gapOf(b0, w0);
      const b1 = flipBits(b0, pois(s.flips * sc * FL[k].b), pois(s.flips * sc * FL[k].c));
      cells.push(cellsOf(b0, b1)); ws.push(wsOf(w0, Float64Array.from(w0, (v, i) => v + (b1[i] - b0[i]) * g)));
    }
    return { arm, ctl, h, cells, ws };
  };
  const sy = (a, k, ys) => Float64Array.from(A[a][`${k}Y${ys[0]}`], (_, i) => ys.reduce((t, y) => t + A[a][`${k}Y${y}`][i], 0));
  return {
    sup: [{ k: 0, pts: 30, c: sy('PX', 0, STEPY), x: sy('PSNX', 0, STEPY) }, { k: 1, pts: 60, c: sy('PX60', 1, STEPY), x: sy('PSNX60', 1, STEPY) }],
    nm: K.flatMap(k => [...OTHERY.map(t => ({ k, y: `Y${t}`, a: A.PX[`${k}Y${t}`], b: A.PSNX[`${k}Y${t}`] })), { k, y: 'GA', a: A.PX[`${k}GA`], b: A.PSNX[`${k}GA`] }]),
    o192: Object.fromEntries(['PX', 'PSNX', 'PX60', 'PSNX60'].map(a => [a, sy(a, 1, [1, 2])])),
    br, top: TOPS, legs: LEGS.map(([arm, ctl, h]) => leg(arm, ctl, h)),
    y1: [0, 2].map(k => ({ k, a: A.PX[`${k}Y1`], b: A.PSNX[`${k}Y1`], clsA: CLS[k], topA: TOPA[k], topB: TOPB[k] })),
  };
}
const drawOf = (tc, tcp, o) => ({ fs: pickN(JUDGED.fs[tc]), y1: pickN(JUDGED.y1[tcp]), a60: pickN(JUDGED.o192[o].a60), aS: pickN(JUDGED.o192[o].aS), w60: pickN(JUDGED.w60), f60: pickN(JUDGED.f60),
  r4: { S130: pickN(JUDGED.r4), S128: pickN(JUDGED.r4) }, d4: { S130: pickN(JUDGED.d4), S128: pickN(JUDGED.d4) }, cx128: { S128: pickN(JUDGED.cx128) }, flips: pickN(JUDGED.flips) });
const cnt3 = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f2(c[x] / tot(c))}`).join(' ');
const IT = ['1', '2', '3', '4', '5'], DR = 30;
const at = over => items(drawP({ ...drawOf('SUPPORT', 'SNREAD', 'W'), ...over }));
const cell = (lab, over, i) => { const c = cnt3(); for (let q = 0; q < DR; q++) c[at(over)[i].outcome]++; console.log(`  item ${i}, ${lab}: ${row(c)}`); };
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-topcell.mjs's items() and pOf()'s shape; S370's arms path by path from the records, one input moved, the rest at the stories' TC-SUPPORT, TCP-SNREAD and O192-W draws)`);
for (const fs of [0.3, 0.6, 0.8, 1, 1.2]) cell(`the fix at ${fs} of its plan-reference size (the step years' removal)`, { fs, f60: 1 }, '1');
for (const y1 of [0, 0.2, 0.5, 1]) cell(`the fix's year-1 effect in worlds 0 and 2 at ${y1} of its plan-reference size`, { y1 }, '2');
for (const [a60, aS] of [[1, 0], [0, 1], [1, 1], [0, 0], [0.5, 0.5]]) { const c = cnt3(), L = {}; for (let q = 0; q < DR; q++) { const it = at({ a60, aS }); c[it['3'].outcome]++; L[it['3'].label] = (L[it['3'].label] || 0) + 1; } console.log(`  item 3, the 60-point lever at ${a60} and the fix at ${aS} of their plan-reference sizes on world 1's years 1 and 2: ${row(c)} (labels ${Object.entries(L).map(([k, v]) => `${k} ${f2(v / DR)}`).join(', ')})`); }
for (const r4 of [1, 0.75, 0.5, 0.3]) cell(`SNRX removes ${r4} of the one-bridge controls' GB`, { r4: { S130: r4, S128: r4 }, d4: { S130: 0, S128: 0 } }, '4');
for (const flips of [0.75, 1, 1.5, 3]) cell(`the fix's flips at ${flips} times SNRX against CX's on S370`, { flips }, '5');

// 3. THE CREDENCES: the causes drawn from the receipts' CAUSE CREDENCES (TC and O192: 20 Oct 02:53 UK; TCP: 20 Oct 17:04 UK)
const logL = txt('deep-review-log.md').split('\n'), credOf = (time, prefix) => { const l = logL.find(x => x.startsWith(`- ${time} |`)) || '', c = (/CAUSE CREDENCES: (.*)$/.exec(l) || ['', ''])[1]; return Object.fromEntries([...c.matchAll(new RegExp(`${prefix}-([A-Z0-9]+)=([0-9.]+)`, 'g'))].map(m => [m[1], Number(m[2])])); };
const CR = { TC: credOf('20 Oct 02:53 UK', 'TC'), O192: credOf('20 Oct 02:53 UK', 'O192'), TCP: credOf('20 Oct 17:04 UK', 'TCP') };
const sumOf = c => Object.values(c).reduce((a, x) => a + x, 0);
if (Object.keys(CR.TC).join(',') !== 'SUPPORT,FORM,SHARE,OTHER' || Object.keys(CR.TCP).join(',') !== 'SNREAD,PLANP,UNMASK,OTHER' || Object.keys(CR.O192).join(',') !== 'W,TOPC,LAT,OTHER' || Object.values(CR).some(c => Math.abs(sumOf(c) - 1) > 0.02)) { console.log(`the receipts' CAUSE CREDENCES did not read (${JSON.stringify(CR)})`); process.exit(1); }
const ND = 600, qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
const pickC = cmap => { const t2 = sumOf(cmap); let u = rnd() * t2, acc = 0; for (const [k, v] of Object.entries(cmap)) { acc += v; if (u < acc) return k; } return Object.keys(cmap).pop(); };
const WHAT = { 1: 'the least removal of the step-year residual across item 1\'s cells', 2: 'the largest rise in size across item 2\'s cells, points', 3: 'world 1\'s years 1 and 2, PSNX less PX, points', 4: 'the least removal of GB across item 4\'s cells', 5: 'the least survival change by world across the legs, points' };
function credences(cr) {
  const I = Object.fromEntries(IT.map(i => [i, cnt3()])), R = { RH: 0, RM: 0, RN: 0, RB: 0, RS: 0, else: 0 }, pt = Object.fromEntries(IT.map(i => [i, []])), CZ = {}, LB = {};
  for (let q = 0; q < ND; q++) {
    const P = drawP(drawOf(pickC(cr.TC), pickC(cr.TCP), pickC(cr.O192))), it = items(P);
    for (const i of IT) { I[i][it[i].outcome]++; const v = POINT[i](it); if (Number.isFinite(v)) pt[i].push(v); }
    R[rowOf(it)]++; const cz = causeOf(it, P), key = `${cz.tc} | ${cz.tcp}`; CZ[key] = (CZ[key] || 0) + 1; LB[it['3'].label] = (LB[it['3'].label] || 0) + 1;
  }
  return { I, R, pt, CZ, LB };
}
const show = ({ I, R, pt, CZ, LB }, tag) => {
  for (const i of IT) console.log(`  item ${i}: ${row(I[i])}`);
  console.log(`  item 3's label: ${Object.entries(LB).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  the causes read (reduce-topcell.mjs causeOf): ${Object.entries(CZ).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${f2(v / ND)}`).join('; ')}`);
  console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
  for (const i of IT) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))} (${pt[i].length} of ${ND} draws read)`);
  if (tag) { for (const i of IT) console.log(`${tag}item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`); console.log(`${tag}else ${f2(R.else / ND)}`); }
  return R;
};
console.log(`\n3. THE CREDENCES AS STATED (TC: ${Object.entries(CR.TC).map(([k, v]) => `TC-${k}=${v}`).join('; ')}; TCP: ${Object.entries(CR.TCP).map(([k, v]) => `TCP-${k}=${v}`).join('; ')}; O192: ${Object.entries(CR.O192).map(([k, v]) => `O192-${k}=${v}`).join('; ')}; ${ND} draws through items())`);
show(credences(CR), '');
const lp = /LEAD RATE BY POPULATION: .*?settled since (\d+) of (\d+) \(Laplace ([0-9.]+)\);.*? counted not held, (\d+) of (\d+) \(Laplace ([0-9.]+)\)/.exec(txt('results-scorecard.txt'));
if (!lp) { console.log('the scorecard\'s LEAD RATE BY POPULATION did not read (results-scorecard.txt)'); process.exit(1); }
const atRate = (c, rate) => { const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0][0], rest = sumOf(c) - c[top]; return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, k === top ? rate : v * (1 - rate) / rest])); };
const lower = Number(lp[6]), since = Number(lp[3]);
console.log(`\n3b. THE CREDENCES WITH EACH SET'S LEADING CAUSE AT THE LEAD RATE'S LOWER BOUND (results-scorecard.txt: ${lp[4]} of ${lp[5]}, Laplace ${lp[6]}; the registered ones; ${ND} draws through items())`);
const R3b = show(credences({ TC: atRate(CR.TC, lower), TCP: atRate(CR.TCP, lower), O192: atRate(CR.O192, lower) }), 'CREDENCE ');
console.log(`\n3c. THE SAME AT THE SETTLED-SINCE RATE (results-scorecard.txt: ${lp[1]} of ${lp[2]}, Laplace ${lp[3]}; printed beside)`);
show(credences({ TC: atRate(CR.TC, since), TCP: atRate(CR.TCP, since), O192: atRate(CR.O192, since) }), '');

// 4. THE BUDGET (grade C: REF-STEP's AN3 on S370 for the package arms; COPY-X's SNRX against CX for SN's cost; COPY-W's CXW against
// CX for 60 points; COPY-B's S130 and S128 jobs; each a solve and its ledger, from the logs)
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const logIn = (d, re) => { try { return readdirSync(R_(d)).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_(d), f), 'utf8')).find(t => re.test(t)) || ''; } catch { return ''; } };
const tOf = (d, h, a, pts) => { const t = logIn(d, new RegExp(`^${h}\\s+case \\| job ${a}/P${pts}S6Q5`, 'm')), e = a.replace(/[/+.-]/g, m => `\\${m}`); return num(new RegExp(`solve CAND ${e}/P${pts}S6Q5: table \\S+ secs (\\d+)`), t) + num(new RegExp(`checks ${e}/P${pts}S6Q5: ownTook .* secs (\\d+)`), t); };
const T = { AN3: tOf('diagrefstep', 'S370', 'AN3', 30), CX: tOf('diagcopyx', 'S370', 'CX', 30), SNRX: tOf('diagcopyx', 'S370', 'SNRX', 30), CXW: tOf('diagcopyw', 'S370', 'CXW', 60), C130: tOf('diagcopyb', 'S130', 'CX', 30), W130: tOf('diagcopyb', 'S130', 'CXW', 60), C128: tOf('diagcopyb', 'S128', 'C', 30), W128: tOf('diagcopyb', 'S128', 'CW', 60) };
if (!Object.values(T).every(Number.isFinite)) { console.log(`the budget's inputs did not read (${JSON.stringify(T)})`); process.exit(1); }
const SNm = T.SNRX / T.CX, Wm = T.CXW / T.CX;
const jobSecs = ([h, a]) => { const sn = /SN/.test(a) ? SNm : 1; if (h === 'S370') return T.AN3 * sn * (/60$/.test(a) ? Wm : 1); const base = h === 'S130' ? (/W$/.test(a) ? T.W130 : T.C130) : (/W$/.test(a) ? T.W128 : T.C128); return base * sn; };
const secs = EXPECT.map(jobSecs), cores = [0, 0, 0, 0];
for (const s2 of secs) { const c = cores.indexOf(Math.min(...cores)); cores[c] += s2; }
const wall = Math.max(...cores) / 3600, elseRow = R3b.else / ND;
console.log(`\n4. THE BUDGET (grade C: AN3 on S370 ${T.AN3} s, a solve and its ledger; SN's cost ${f2(SNm)} times (COPY-X's SNRX ${T.SNRX} s against CX's ${T.CX} s); 60 points ${f2(Wm)} times (COPY-W's CXW ${T.CXW} s); COPY-B's S130 CX ${T.C130} s and CXW ${T.W130} s, S128 C ${T.C128} s and CW ${T.W128} s)`);
console.log(`  the jobs in the batch's order: ${EXPECT.map((j, i) => `${j[0]} ${j[1]} ${f2(secs[i] / 3600)} h`).join('; ')}`);
console.log(`  ${f2(secs.reduce((a, x) => a + x, 0) / 3600)} job-hours; four at a time in that order, the wall about ${f2(wall)} h`);
console.log(`  ESCALATION TRIGGER 3 (escalation.md): the wall ${f2(wall)} h ${wall > 2 ? 'over' : 'not over'} 2 hours; the registered 'else' row ${f2(elseRow)} ${elseRow >= 0.6 ? 'at or over' : 'under'} 0.6: ${wall > 2 && elseRow >= 0.6 ? 'FIRES (the escalation review before registration)' : 'does not fire'}`);
