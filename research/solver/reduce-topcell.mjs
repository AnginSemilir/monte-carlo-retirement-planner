/*
 * TOP-CELL'S REDUCER (PLAN.md TOP-CELL; predictions/diag-topcell.md; the deep reviews after REF-B and REF-STEP, deep-review-log.md
 * 20 Oct 02:53 and 10:31 UK, and the design review of 20 Oct 17:04 UK, adopted in PLAN.md's 20 Oct 17:57 row; O198, O192, PR30).
 * The top-cell fix (SN's support nodes in the top share cell and the RU scaling) added under the package on S370, and its breadth
 * under the plan reference on the one-bridge households, seed 7002, the first 4,000 paths a world (audit-topcell.mjs,
 * results/diagtopcell): on S370 PX (the package with the copy rule), PSNX (PX with SN's nodes and `readerSplit: 'rsu'`), PSNXU
 * (PSNX without RS: RS x SN split out) at 30 wealth points and PX60 and PSNX60 at 60; on S130 SNRX and SNRXW (CX and CXW reused
 * from COPY-B, results/diagcopyb); on S128 CX, SNRX, CXW and SNRXW.
 * Its gate: the fair-test gate on TOP-CELL's logs; the eleven jobs once and done at the registered settings with every
 * self-check in full, on one code; the adaptive reference's own record (its fix and `stepAll` on the package arms alone, moves
 * made, no non-monotone node) and stepTook on the package arms; THE REUSE (a new test of old files, CHECKLIST item 3): COPY-B's
 * reducer passes its gate over its files and the reused S130 cells share TOP-CELL's seed, paths, bridge years and settings but
 * the code; THE CODE (accepted, not SAME): the reused cells were made before 05395be (`stepAll`), 22a40bf (PR31's split) and
 * 44dc34e (`rsu`), each behind its own flag; TOP-CELL's preflight re-ran S370's CX and SNRX (COPY-X), CXW (COPY-W) and S130's CX
 * and CXW (COPY-B) on TOP-CELL's code at the preview (audit-topcell.mjs `repro`), and every saved array, bit, move, visit state
 * and table of those files must equal the sources' preflights', byte for byte, on the code of TOP-CELL's jobs.
 * THE ITEMS, each with three outcomes; an item's cells read with Bonferroni intervals (0.05 over the intervals it reads). S370's
 * step years are 3 and 7 (STEPY: the step reads' remainder under the copy rule, the 17:04 review's item 1), its other bridge
 * years 1, 2, 4, 5 and 6:
 *   1: SUPPORT (TC-SUPPORT; the review's item 1): the step-year residual Y3 + Y7 under the fix against the package, path by path,
 *      in world 0 at 30 points (PSNX against PX) and world 1 at 60 (PSNX60 against PX60); a cell whose control residual is under
 *      half a point in size is reported only. The removal sum(c - x) / sum(c) (reduce-copyx.mjs removal) and the remainder (the
 *      fix's mean); a cell reads held when the removal's interval lies at or above three quarters and the remainder's within
 *      plus or minus a half; falsified when the removal's interval lies under a half, or the remainder's lies wholly beyond plus
 *      or minus one (an overshoot counts); HELD when every cell read reads held, FALSIFIED when any reads falsified, otherwise
 *      INCONCLUSIVE (and when no cell is read).
 *   2: NOT MOVED (O198; the review's item 2): PSNX against PX at 30 points in every world, at each other bridge year and GA, the
 *      rise in size |m_PSNX| - |m_PX|, its interval by the paired difference of the signed paths (each mean's sign; where a
 *      mean's own interval spans nil, the union over both signs); a cell reads still when its interval lies under 0.3, moved
 *      when at or above 0.5; HELD when every cell reads still, FALSIFIED when any reads moved, otherwise INCONCLUSIVE. Under
 *      additivity (the review's projection) it reads FALSIFIED at year 1 in worlds 0 and 2. A rise is not the fix's until a
 *      decomposition splits it (UNMASKING): year 1's increment by read class and by share cell, in PX and PSNX, reported, and
 *      PSNXU against PX beside it (RS x SN, read where RH under PSNX reaches a hundredth of a point).
 *   3: O192 (world 1's Y1 + Y2, the 2 x 2 of 30 and 60 points by PX and PSNX): W when PX60's level lies within plus or minus
 *      0.25 and PSNX less PX within plus or minus 0.2; TOPC when PSNX's level lies within plus or minus 0.25 and PX60 less PX
 *      within plus or minus 0.2; BOTH when each lever (PX60 less PX, PSNX less PX) moves it by 0.3 or more in size, wholly;
 *      NEITHER when PSNX60 less PX lies within plus or minus 0.2; otherwise INCONCLUSIVE (in that order). The outcome maps HELD
 *      for W, FALSIFIED for NEITHER, INCONCLUSIVE otherwise, for the scorecard; the label is printed.
 *   4: BREADTH (S130 and S128; the review's item 4): SNRX's GB against CX's at 30 points and SNRXW's against CXW's at 60, in
 *      each world where the control's GB is a point or more in size, in item 1's bands; a household with under a tenth of its
 *      control's bridge-year reads in the top share cell (pension share 0.8 or more) is reported only (F3); HELD when every
 *      cell read reads held, FALSIFIED when any reads falsified, otherwise INCONCLUSIVE (and when no cell is read).
 *   5: HARM BY WORLD (PR30, a reader change; RULES.md section 8's rule as written: reduce-copyx.mjs harmWorlds): PSNX against
 *      PX, PSNX60 against PX60, SNRX against CX on S130 and S128, SNRXW against CXW on S130 and S128, each leg at 0.05; HELD
 *      when every leg reads no material harm in every world, FALSIFIED when any reads harm, otherwise INCONCLUSIVE. The mixture
 *      beside each leg (stats.mjs mixtureChange); a by-world harm with a mixture gain is flagged TO THE MAINTAINER (PR30's
 *      premise, family BW), not read by Claude.
 * THE ROWS: RH item 5 FALSIFIED; RM item 2 FALSIFIED (the fix moves error into another year under the package); RN item 1
 *   FALSIFIED (support does not carry the step reads' remainder under the package); RB item 4 FALSIFIED (the fix does not
 *   carry to the one-bridge households); RS items 1 and 2 HELD (the fix carried to 7u-F's assembly, 4 and 5 not FALSIFIED);
 *   else.
 * THE CAUSES (KNOWN-LEG; causeOf, registered): TC-SUPPORT credited by item 1 HELD, its 'not' by item 1 FALSIFIED; the year-1
 *   rise's causes (the review's TCP ranking) from year 1's increment PSNX less PX in worlds 0 and 2: TCP-PLANP when both lie
 *   within plus or minus 0.3; when both rise by 0.3 or more wholly, TCP-UNMASK when PX's year-1 residual split by read class
 *   (paths whose year-1 read is mostly supported against mostly copied) has parts of opposite sign, each 0.3 or more in size,
 *   in both worlds, TCP-SNREAD when half or more of the rise in both worlds sits on paths whose year-1 read is in the top share
 *   cell, open when both or neither fit; open otherwise.
 * REPORTED: every arm's tables against its runs by world; GB, GA, T, G; the residual by bridge year; the split (QS, QC, RS, RC,
 *   RH) by year; year 1 by read class and share cell; PSNXU against PX and PSNX; the reused cells; each leg's saved and lost
 *   paths by band; the steps and PR31 lines; the solves' seconds; REALISED lines for each item's point.
 *   node research/solver/reduce-topcell.mjs [dir] [paths a world] [scale] [COPY-B dir] [repro dir] [--preflight] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { requireFairLogs } from './fair-gate.mjs';
import { zFor, mixtureChange, mixtureOutcome } from './stats.mjs';
import { sha16 } from './reduce-ao.mjs';
import { cellsOf, wsOf, removal, harmWorlds, parse as parseX, LABELS as LABELS_X } from './reduce-copyx.mjs';
import { meanOf, parse as parseW, LABELS as LABELS_W } from './reduce-copyw.mjs';
import { parse as parseB, keyOf as keyOfB, firstBand } from './reduce-copyb.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-topcell.md';
export const SEED = '7002', NPW = 4000, NQF = 1000;
export const KEEP = 0.75, HALF = 0.5, REM = 0.5, OUT = 1, STILL = 0.3, MOVED = 0.5, LEVEL = 0.25, NEAR = 0.2, LEVER = 0.3, MINRES = 1, MINSUP = 0.5, TOP = 0.8, TOPMIN = 0.1, RHMAT = 0.01, Y1R = 0.3, Y1P = 0.3;
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const PARTS = Object.freeze(['QS', 'QC', 'RS', 'RC', 'RH']);
export const STEPY = Object.freeze([3, 7]), OTHERY = Object.freeze([1, 2, 4, 5, 6]);
// the jobs as registered: [household, arm, wealth points] (audit-topcell.mjs's JOBS, in its order)
export const EXPECT = Object.freeze([['S370', 'PSNX60', 60], ['S370', 'PX60', 60], ['S370', 'PSNX', 30], ['S370', 'PSNXU', 30], ['S370', 'PX', 30], ['S130', 'SNRXW', 60], ['S128', 'SNRXW', 60], ['S128', 'CXW', 60], ['S130', 'SNRX', 30], ['S128', 'SNRX', 30], ['S128', 'CX', 30]]);
export const LATTICE_LINE = '160x41 nz 128';
export const SN_LINE = '0,0.2,0.4,0.6,0.8,0.9,0.95,1';
const PKGA = ['PX', 'PSNX', 'PSNXU', 'PX60', 'PSNX60'];
export const REF = Object.freeze(Object.fromEntries(['PX', 'PSNX', 'PSNXU', 'PX60', 'PSNX60', 'CX', 'SNRX', 'CXW', 'SNRXW'].map(a => [a, PKGA.includes(a) ? 'adaptive' : 'null'])));
export const SPLIT = Object.freeze({ PX: 'rs', PX60: 'rs', PSNX: 'rsu', PSNX60: 'rsu', PSNXU: 'ru', CX: 'null', CXW: 'null', SNRX: 'ru', SNRXW: 'ru' });
export const NODED = Object.freeze({ PX: false, PX60: false, PSNX: true, PSNX60: true, PSNXU: true, CX: false, CXW: false, SNRX: true, SNRXW: true });
export const STEPS = Object.freeze(Object.fromEntries(Object.keys(REF).map(a => [a, REF[a] === 'adaptive'])));
export const keyOf = (id, arm, pts) => `${id} ${arm}/P${pts}S6Q5`;
// the reused cells, read at full scale from COPY-B's files: [household, arm, wealth points]
export const REUSED = Object.freeze([['S130', 'CX', 30], ['S130', 'CXW', 60]]);
// the preflight's reproduction: [household, arm, wealth points, the test whose preflight files they must equal]
export const REPRO = Object.freeze([['S370', 'CX', 30, 'COPY-X'], ['S370', 'SNRX', 30, 'COPY-X'], ['S370', 'CXW', 60, 'COPY-W'], ['S130', 'CX', 30, 'COPY-B'], ['S130', 'CXW', 60, 'COPY-B']]);
// item 5's legs: [arm, control, household]
export const LEGS = Object.freeze([['PSNX', 'PX', 'S370'], ['PSNX60', 'PX60', 'S370'], ['SNRX', 'CX', 'S130'], ['SNRX', 'CX', 'S128'], ['SNRXW', 'CXW', 'S130'], ['SNRXW', 'CXW', 'S128']]);
export const MIXW = Object.freeze([1 / 6, 2 / 3, 1 / 6]);
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S\d+)\s+case \| job ((PSNX60|PX60|PSNXU|PSNX|PX|SNRXW|SNRX|CXW|CX)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^TOP-CELL: .*?, (\d+) paths a world.*?, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\); \d+ (reproduction )?jobs;/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts: Number(c[6]), key: `${c[1]} ${c[2]}`, stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3], repro: !!hd[4] } : null, checks: {}, tables: [], sims: {}, moves: [], ledger: [], split: [], qf: [], whole: [], steps: [], pr31: [], nodes: null, reader: null, recount: null, clamped: null, bridge: null, own: null, solve: null, ran: null, adaptive: null, file: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label, e = esc(L);
    let m;
    if ((m = new RegExp(`^solve CAND ${e}: table (\\S+) secs (\\d+)$`).exec(l))) j.solve = { table: Number(m[1]), secs: Number(m[2]) };
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if ((m = new RegExp(`^adaptive ${e}: readerRef (\\S+) fix (\\S+) stepAll (\\S+) moves (\\d+) nonMono (-?\\d+) lattice (.+)$`).exec(l))) j.adaptive = { ref: m[1], fix: m[2] === 'true', stepAll: m[3] === 'true', moves: Number(m[4]), nonMono: Number(m[5]), lattice: m[6] };
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^nodes ${e}: (.+) floor (\\d+) \\(the product's rule (\\d+)\\)$`).exec(l))) j.nodes = { list: m[1], floor: Number(m[2]), rule: Number(m[3]) };
    else if ((m = new RegExp(`^reader ${e}: tables (\\S+) unsupported (\\S+) copied (\\S+) copiedTop (\\S+) nodes (\\S+)$`).exec(l))) j.reader = { tables: Number(m[1]), copied: Number(m[3]), copiedTop: Number(m[4]), nodes: Number(m[5]) };
    else if ((m = new RegExp(`^recount ${e}: tables (\\d+) copied (\\d+) \\(the solve's (\\d+) and (\\d+)\\) line (\\S+)$`).exec(l))) j.recount = { tables: Number(m[1]), copied: Number(m[2]), line: Number(m[5]) };
    else if ((m = new RegExp(`^clamped ${e}: (\\d+) of (\\d+) `).exec(l))) j.clamped = { n: Number(m[1]), of: Number(m[2]) };
    else if ((m = new RegExp(`^openings ${e}: OWN ai (\\d+) `).exec(l))) j.own = { ai: Number(m[1]) };
    else if ((m = new RegExp(`^tables ${e} (\\d) z (\\S+) weight (\\S+): OWN (\\S+) READ (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), OWN: Number(m[4]), READ: Number(m[5]), raw: `${m[4]} ${m[5]}` };
    else if ((m = new RegExp(`^bridge ${e}: reader years ?(\\S*)$`).exec(l))) j.bridge = m[1] ? m[1].split(',').map(Number) : [];
    else if ((m = new RegExp(`^steps ${e} (\\d+): (.*)$`).exec(l))) j.steps.push({ t: Number(m[1]), text: m[2] });
    else if ((m = new RegExp(`^pr31 ${e} (\\d+): (.*)$`).exec(l))) j.pr31.push({ t: Number(m[1]), text: m[2] });
    else if ((m = new RegExp(`^sim ${e} (\\d) OWN ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`OWN${m[1]}`] = { ai: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bridge: Number(m[5]), bits: m[6], bitsB: m[7] };
    else if ((m = new RegExp(`^moves ${e} (\\d): path-years (\\d+) sha (\\S+)$`).exec(l))) j.moves[Number(m[1])] = { py: Number(m[2]), sha: m[3] };
    else if ((m = new RegExp(`^ledger ${e} (\\d): (.*)$`).exec(l))) j.ledger[Number(m[1])] = Object.fromEntries([...m[2].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])]));
    else if ((m = new RegExp(`^split ${e} (\\d): (.*)$`).exec(l))) j.split[Number(m[1])] = Object.fromEntries([...m[2].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])]));
    else if ((m = new RegExp(`^qf ${e} (\\d): paths (\\d+) QF (\\S+)$`).exec(l))) j.qf[Number(m[1])] = { n: Number(m[2]), QF: Number(m[3]) };
    else if ((m = new RegExp(`^whole ${e} (\\d): mean (\\S+) `).exec(l))) j.whole[Number(m[1])] = { mean: Number(m[2]) };
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerBlend: 'null', readerCopy: 'extrap', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3' };
const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];
const decRaw = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
const dec16 = x => { const b = Buffer.from(x, 'base64'); return new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
// one job's checks against its arm (want: [household, arm, points]); the gate's and the reproduction's shared part
function jobBad(j, w, { npw, seed, scale, files, repro = false }) {
  const bad = [], K = w.key, ad = REF[w.arm] === 'adaptive', nn = NODED[w.arm] ? 8 : 6;
  if (!j.done) bad.push(`${K}: no done line`);
  if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push(`${K}: no stamp`);
  if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale || j.head.repro !== repro) bad.push(`${K}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed}${repro ? ', a reproduction job' : ''})`);
  if (j.pts !== w.pts) bad.push(`${K}: solved at ${j.pts} points, not ${w.pts}`);
  const ran = j.ran || '';
  for (const [f, v] of Object.entries({ ...COMMON, readerRef: REF[w.arm], readerSplit: SPLIT[w.arm], pts: String(w.pts), grid: `total${w.pts}x${nn}x6`, shareNodes: NODED[w.arm] ? SN_LINE : 'none' })) if (field(ran, f) !== v) bad.push(`${K}: ${f} is ${field(ran, f)}, not ${v}`);
  const A = j.adaptive;
  if (ad && (!A || A.ref !== 'adaptive' || !A.fix || A.stepAll !== STEPS[w.arm] || !(A.moves > 0) || A.nonMono !== 0 || A.lattice !== LATTICE_LINE)) bad.push(`${K}: the adaptive reference's own record is not the arm's (${A ? `fix ${A.fix} stepAll ${A.stepAll} moves ${A.moves} nonMono ${A.nonMono} lattice ${A.lattice}` : 'no adaptive line'})`);
  if (!ad && (!A || A.ref !== 'null' || A.fix || A.stepAll || A.lattice !== 'none')) bad.push(`${K}: the plan reference's job carries an adaptive record`);
  if (!j.nodes || j.nodes.floor !== j.nodes.rule || field(ran, 'floor') !== String(j.nodes.floor)) bad.push(`${K}: its floor is not the product's rule's`);
  if (!j.nodes || j.nodes.list !== (NODED[w.arm] ? SN_LINE : 'the uniform six')) bad.push(`${K}: its share nodes are not the arm's`);
  for (const c of [...NEED, ...(STEPS[w.arm] ? ['stepTook'] : [])]) { const x = j.checks[c]; if (!x || !(x[1] > 0) || x[0] !== x[1] || ((c === 'armTook' || c === 'copyTook') && x[1] !== 1)) bad.push(`${K}: ${c} did not pass in full`); }
  if (!STEPS[w.arm] && j.checks.stepTook) bad.push(`${K}: a job without stepAll reports stepTook`);
  if (STEPS[w.arm] && !j.steps.length) bad.push(`${K}: no steps lines`);
  if (ad && !j.pr31.length) bad.push(`${K}: no pr31 lines`);
  if (!j.own) bad.push(`${K}: no openings line`);
  if (!j.solve) bad.push(`${K}: no solve line`);
  if (!j.reader) bad.push(`${K}: no reader line`);
  if (!j.recount || !j.reader || j.recount.copied !== j.reader.copied || j.recount.tables !== j.reader.tables || j.recount.line !== 0.5) bad.push(`${K}: the copied nodes were not recounted at the support line to the solve's count`);
  if (!j.clamped || j.checks.splitTook && j.clamped.of !== j.checks.splitTook[1]) bad.push(`${K}: no count of the reads at the clamp over the split's reads`);
  if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push(`${K}: the identity was not held on every path of three worlds`);
  if (j.checks.scoreTook && j.checks.scoreTook[1] !== 3 * npw) bad.push(`${K}: the whole score was not checked on every path of three worlds`);
  if (!j.bridge || !j.bridge.length) bad.push(`${K}: no bridge years`);
  for (let k = 0; k < 3; k++) {
    const t = j.tables[k]; if (!t || !Number.isFinite(t.OWN) || !Number.isFinite(t.READ)) bad.push(`${K}: world ${k}'s tables are missing`);
    const s = j.sims[`OWN${k}`]; if (!s || s.n !== npw || (j.own && s.ai !== j.own.ai)) bad.push(`${K}: no OWN run of ${npw} paths at its opening in world ${k}`);
    if (!j.ledger[k] || [...KEYS, ...(j.bridge || []).map(t2 => `Y${t2}`)].some(x => !Number.isFinite(j.ledger[k][x]))) bad.push(`${K}: world ${k}'s ledger line is missing or short`);
    if (!j.split[k] || (j.bridge || []).some(t2 => PARTS.some(p => !Number.isFinite(j.split[k][`${p}${t2}`])))) bad.push(`${K}: world ${k}'s split line is missing or short`);
    if (!j.qf[k] || j.qf[k].n !== Math.min(npw, NQF)) bad.push(`${K}: world ${k}'s QF line is missing`);
    if (!j.moves[k] || !(j.moves[k].py >= npw)) bad.push(`${K}: world ${k}'s moves line is missing or short`);
    if (!j.whole[k] || !Number.isFinite(j.whole[k].mean)) bad.push(`${K}: world ${k}'s whole score line is missing`);
  }
  if (files) {
    const f = j.file && files[j.file];
    if (!f) { bad.push(`${K}: its file ${j.file} is missing`); return bad; }
    if (f.id !== j.id || f.job !== j.label) bad.push(`${K}: its file is ${f.id} ${f.job}`);
    if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${K}: its file is stamped by other code`);
    if (f.NPW !== npw) bad.push(`${K}: its file is not on ${npw} paths a world`);
    if ((f.bridge || []).join(',') !== (j.bridge || []).join(',')) bad.push(`${K}: its file's bridge years are not the log's`);
    for (const [nm, s] of Object.entries(j.sims)) for (const [b, sh] of [[nm, s.bits], [`${nm}b`, s.bitsB]]) { const x = f.bits && f.bits[b]; if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(`${K}: its file's ${b} bits are not the log's`); }
    for (let k = 0; k < 3; k++) {
      for (const x of [...KEYS, 'WS', ...(f.bridge || []).flatMap(t2 => [`Y${t2}`, ...PARTS.map(p => `${p}${t2}`)])]) { const a = f.per && f.per[`${x}${k}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`${K}: its file's ${x}${k} paths are not ${npw}`); }
      const ws = f.per && f.per[`WS${k}`]; if (ws && j.whole[k] && Math.abs(decRaw(ws).reduce((t, x) => t + x, 0) / npw - j.whole[k].mean) > 1e-5) bad.push(`${K}: its file's world-${k} whole scores are not the log's`);
      const mv = f.moves && f.moves[`MV${k}`]; if (!mv || !j.moves[k] || sha16(Buffer.from(mv, 'base64')) !== j.moves[k].sha) bad.push(`${K}: its file's world-${k} moves are not the log's`);
      const sv = f.states && f.states[`S${k}`]; if (!sv || Buffer.from(sv, 'base64').length !== 8 * npw * (f.bridge || []).length * (f.dim || 0)) bad.push(`${K}: its file's world-${k} visit states are not every path's`);
    }
  }
  return bad;
}
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null } = {}) {
  const bad = [], ptsAt = p => Math.max(4, Math.round(p / scale)), want = EXPECT.map(([id, arm, pts]) => ({ id, arm, pts: ptsAt(pts), key: keyOf(id, arm, ptsAt(pts)) }));
  for (const x of jobs) if (!want.some(w => w.key === x.key)) bad.push(`a job that is not TOP-CELL's: ${x.key}`);
  const codes = new Set(jobs.map(j => j.stamp && j.stamp.code));
  if (codes.size !== 1 || codes.has(undefined) || codes.has(null)) bad.push(`the jobs are not on one code (${[...codes].join(', ')})`);
  for (const w of want) {
    const js = jobs.filter(x => x.key === w.key);
    if (js.length !== 1) { bad.push(`${w.key}: ${js.length ? `run ${js.length} times` : 'missing'}`); continue; }
    bad.push(...jobBad(js[0], w, { npw, seed, scale, files }));
    const peers = jobs.filter(x => x.id === js[0].id && x !== js[0] && x.bridge);
    if (js[0].bridge && peers.some(x => x.bridge.join(',') !== js[0].bridge.join(','))) bad.push(`${w.key}: its bridge years are not its household's other jobs'`);
  }
  return bad;
}

// THE REUSE (full scale): COPY-B's S130 CX and CXW against TOP-CELL's S130 jobs; bOk COPY-B's own gate over its files; rJobs
// the reused jobs found ([household, arm] -> job), peer TOP-CELL's S130 SNRX job. The code is not SAME: reproOk says the
// preflight's reproduction passed on TOP-CELL's code (reproCode, which must be the jobs' code)
export function reuseGate(rJobs, peer, bOk, reproOk, reproCode) {
  const bad = [];
  if (!bOk) bad.push('COPY-B\'s gate did not pass over its own files');
  if (!reproOk) bad.push('the preflight\'s reproduction of the reused cells did not pass on this code');
  if (!peer || !peer.stamp || reproCode !== peer.stamp.code) bad.push(`the reproduction was run on other code (${reproCode}) than TOP-CELL's jobs (${peer && peer.stamp && peer.stamp.code})`);
  for (const [h, a, pts] of REUSED) {
    const j = rJobs[`${h} ${a}`];
    if (!j) { bad.push(`the reused ${h} ${a} not found`); continue; }
    if (j.id !== h) bad.push(`the reused ${h} ${a} is on ${j.id}`);
    if (!j.head || j.head.seed !== SEED) bad.push(`the reused ${h} ${a} is not on seed ${SEED}`);
    if (!j.head || !peer || !peer.head || j.head.npw !== peer.head.npw) bad.push(`the reused ${h} ${a} is not on the same paths a world`);
    const ran = j.ran || '';
    for (const f of Object.keys(COMMON)) if (field(ran, f) !== COMMON[f]) bad.push(`the reused ${h} ${a}: ${f} is ${field(ran, f)}, not ${COMMON[f]}`);
    if (field(ran, 'readerSplit') !== 'null' || field(ran, 'shareNodes') !== 'none' || field(ran, 'readerRef') !== 'null' || field(ran, 'pts') !== String(pts)) bad.push(`the reused ${h} ${a}: a split, share nodes, another reference or another grid`);
    if (!peer || (j.bridge || []).join(',') !== (peer.bridge || []).join(',')) bad.push(`the reused ${h} ${a} reads other bridge years than TOP-CELL's ${h}`);
  }
  return bad;
}

// THE REPRODUCTION (the preflight): cells = [{ h, a, pts, src, job, file, old, oldFile }] (TOP-CELL's repro job and file, the
// source preflight's job and file); ok = { 'COPY-X': bool, 'COPY-W': bool, 'COPY-B': bool }, each source's reducer's preflight
// gate over its files. Every array of the source's file equal, byte for byte; TOP-CELL's only extra arrays are RH (the split's
// new part); every world's tables equal as printed
export function reproGate(cells, ok, code) {
  const bad = [];
  for (const s of ['COPY-X', 'COPY-W', 'COPY-B']) if (!ok[s]) bad.push(`${s}'s preflight gate did not pass over its own files`);
  for (const [h, a, pts, src] of REPRO) {
    const c = cells.find(x => x.h === h && x.a === a && x.pts === pts);
    if (!c || !c.old || !c.oldFile || !c.job || !c.file) { bad.push(`the reproduced ${h} ${a} at ${pts}: a file or log is missing (${src})`); continue; }
    if (c.src !== src) bad.push(`the reproduced ${h} ${a} is read against ${c.src}, not ${src}`);
    if (!c.job.stamp || c.job.stamp.code !== code) bad.push(`the reproduced ${h} ${a} is not on TOP-CELL's code`);
    if (c.old.id !== h || c.old.label !== c.job.label) bad.push(`the reproduced ${h} ${a}'s source is ${c.old.id} ${c.old.label}`);
    if (!c.old.head || c.old.head.seed !== SEED || !c.job.head || c.old.head.npw !== c.job.head.npw) bad.push(`the reproduced ${h} ${a}'s source is not on seed ${SEED} and the same paths a world`);
    if ((c.oldFile.bridge || []).join(',') !== (c.file.bridge || []).join(',')) bad.push(`the reproduced ${h} ${a}: other bridge years`);
    const groups = { per: c.oldFile.per || {}, bits: c.oldFile.bits || {}, moves: c.oldFile.moves || {}, states: c.oldFile.states || {} };
    let n = 0;
    for (const [g, o] of Object.entries(groups)) for (const [x, v] of Object.entries(o)) { n++; if (!c.file[g] || c.file[g][x] !== v) bad.push(`the reproduced ${h} ${a}: ${g} ${x} differs from ${src}'s`); }
    for (const [g, o] of Object.entries(groups)) for (const x of Object.keys(c.file[g] || {})) if (!(x in o) && !(g === 'per' && /^RH\d+$/.test(x))) bad.push(`the reproduced ${h} ${a}: ${g} ${x} is not in ${src}'s file`);
    if (!(n >= 3 * (KEYS.length + 3))) bad.push(`the reproduced ${h} ${a}: only ${n} arrays compared`);
    const ta = c.oldFile.tables || {}, tb = c.file.tables || {};
    if (!Object.keys(ta).length || Object.keys(ta).length !== Object.keys(tb).length || Object.entries(ta).some(([x, v]) => tb[x] !== v)) bad.push(`the reproduced ${h} ${a}: its saved tables differ from ${src}'s`);
    for (let k = 0; k < 3; k++) if (!c.old.tables[k] || !c.job.tables[k] || c.old.tables[k].OWN !== c.job.tables[k].OWN || c.old.tables[k].READ !== c.job.tables[k].READ) bad.push(`the reproduced ${h} ${a}: world ${k}'s tables differ from ${src}'s`);
  }
  return bad;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
const allOf = (per, yes, no) => (per.some(x => x.read === no) ? 'FALSIFIED' : per.length && per.every(x => x.read === yes) ? 'HELD' : 'INCONCLUSIVE');
const diffOf = (a, b) => Float64Array.from(a, (v, i) => v - b[i]);
// a support cell (items 1 and 4): c the control's residual per path, x the fix's; read in item 1's bands
export function supCell(c, x, z) {
  const r = removal(c, x, z), rem = meanOf(x, z);
  const read = !Number.isFinite(r.R) ? 'unclear' : r.lo >= KEEP && rem.lo >= -REM && rem.hi <= REM ? 'held' : r.hi < HALF || rem.lo > OUT || rem.hi < -OUT ? 'falsified' : 'unclear';
  return { r, rem, read };
}
// the rise in size |m_b| - |m_a|, paired: the signed paths' difference, each mean's sign; the union over both signs where a
// mean's own interval spans nil
export function riseOf(a, b, z) {
  const ma = meanOf(a, z), mb = meanOf(b, z), sa = ma.lo > 0 ? [1] : ma.hi < 0 ? [-1] : [1, -1], sb = mb.lo > 0 ? [1] : mb.hi < 0 ? [-1] : [1, -1];
  let lo = Infinity, hi = -Infinity;
  for (const x of sa) for (const y of sb) { const d = meanOf(Float64Array.from(a, (v, i) => y * b[i] - x * v), z); lo = Math.min(lo, d.lo); hi = Math.max(hi, d.hi); }
  return { d: Math.abs(mean(b)) - Math.abs(mean(a)), lo, hi, ma, mb };
}
/* P: { sup: [{ k, pts, c, x }] item 1's cells (Y3 + Y7 per path, points: c the control's, x the fix's); nm: [{ k, y, a, b }]
   item 2's cells (a PX's, b PSNX's per path); o192: { PX, PSNX, PX60, PSNX60 } world 1's Y1 + Y2 per path; br: [{ h, k, pts,
   c, x }] item 4's cells (GB per path), top: { [h]: the control's share of bridge-year reads in the top share cell };
   legs: [{ arm, ctl, h, cells: [3], ws: [3] }]; y1: [{ k, a, b, clsA: per path 1 supported 0 copied, topA, topB: per path 1 in
   the top cell }] worlds 0 and 2 } */
export function items(P) {
  const out = {};
  { const read = P.sup.filter(x => Math.abs(mean(x.c)) >= MINSUP), z = zFor(0.05 / Math.max(1, 2 * read.length));
    const per = read.map(x => ({ k: x.k, pts: x.pts, ...supCell(x.c, x.x, z) }));
    out['1'] = { outcome: per.length ? allOf(per, 'held', 'falsified') : 'INCONCLUSIVE', per, nothing: !per.length, skipped: P.sup.filter(x => !read.includes(x)).map(x => ({ k: x.k, pts: x.pts, mc: mean(x.c) })) }; }
  { const z = zFor(0.05 / Math.max(1, P.nm.length)), per = P.nm.map(x => { const r = riseOf(x.a, x.b, z); return { k: x.k, y: x.y, r, read: r.hi < STILL ? 'still' : r.lo >= MOVED ? 'moved' : 'unclear' }; });
    out['2'] = { outcome: allOf(per, 'still', 'moved'), per }; }
  { const z = zFor(0.05 / 5), o = P.o192, lv60 = meanOf(o.PX60, z), lvS = meanOf(o.PSNX, z), dS = meanOf(diffOf(o.PSNX, o.PX), z), d60 = meanOf(diffOf(o.PX60, o.PX), z), dB = meanOf(diffOf(o.PSNX60, o.PX), z);
    const within = (c, b) => c.lo >= -b && c.hi <= b, past = (c, b) => c.lo >= b || c.hi <= -b;
    const label = within(lv60, LEVEL) && within(dS, NEAR) ? 'W' : within(lvS, LEVEL) && within(d60, NEAR) ? 'TOPC' : past(d60, LEVER) && past(dS, LEVER) ? 'BOTH' : within(dB, NEAR) ? 'NEITHER' : 'unclear';
    out['3'] = { outcome: label === 'W' ? 'HELD' : label === 'NEITHER' ? 'FALSIFIED' : 'INCONCLUSIVE', label, lv60, lvS, dS, d60, dB, px: meanOf(o.PX, z), add: meanOf(Float64Array.from(o.PX, (v, i) => o.PSNX60[i] - o.PSNX[i] - o.PX60[i] + v), z) }; }
  { const cand = P.br.filter(x => Math.abs(mean(x.c)) >= MINRES), only = cand.filter(x => !(P.top[x.h] >= TOPMIN)), read = cand.filter(x => P.top[x.h] >= TOPMIN), z = zFor(0.05 / Math.max(1, 2 * read.length));
    const per = read.map(x => ({ h: x.h, k: x.k, pts: x.pts, mc: mean(x.c), ...supCell(x.c, x.x, z) }));
    out['4'] = { outcome: per.length ? allOf(per, 'held', 'falsified') : 'INCONCLUSIVE', per, nothing: !per.length, reportedOnly: only.map(x => ({ h: x.h, k: x.k, pts: x.pts, mc: mean(x.c) })) }; }
  { const legs = P.legs.map(l => { const hw = harmWorlds(l.cells, l.ws, 0.05), mx = mixtureOutcome(mixtureChange(l.cells)); return { ...l, hw, mx, maint: hw.outcome === 'FALSIFIED' && mx.d > 0 }; });
    out['5'] = { outcome: legs.some(l => l.hw.outcome === 'FALSIFIED') ? 'FALSIFIED' : legs.every(l => l.hw.outcome === 'HELD') ? 'HELD' : 'INCONCLUSIVE', legs, maint: legs.some(l => l.maint) }; }
  return out;
}
export function rowOf(it) {
  const o = i => it[i].outcome;
  if (o('5') === 'FALSIFIED') return 'RH';
  if (o('2') === 'FALSIFIED') return 'RM';
  if (o('1') === 'FALSIFIED') return 'RN';
  if (o('4') === 'FALSIFIED') return 'RB';
  if (o('1') === 'HELD' && o('2') === 'HELD') return 'RS';
  return 'else';
}
// the causes as the items bear on them (KNOWN-LEG, the registered reading): TC-SUPPORT by item 1; the year-1 rise's (TCP) from
// year 1's increment in worlds 0 and 2 (P.y1)
export function y1Of(P, z = zFor(0.05 / 2)) {
  return P.y1.map(x => {
    const n = x.a.length, d = meanOf(diffOf(x.b, x.a), z), parts = [1, 0].map(c => { let s = 0; for (let i = 0; i < n; i++) if (x.clsA[i] === c) s += x.a[i]; return s / n; });
    let top = 0, all = 0; for (let i = 0; i < n; i++) { const v = x.b[i] - x.a[i]; all += v; if (x.topA[i] || x.topB[i]) top += v; }
    return { k: x.k, d, sup: parts[0], cop: parts[1], topShare: all !== 0 ? top / all : NaN };
  });
}
export function causeOf(it, P) {
  const tc = it['1'].outcome === 'HELD' ? 'TC-SUPPORT' : it['1'].outcome === 'FALSIFIED' ? 'TC-SUPPORT not (support does not carry the step reads\' remainder under the package)' : 'TC-SUPPORT open';
  const y = y1Of(P), plan = y.every(x => x.d.lo >= -Y1P && x.d.hi <= Y1P), rise = y.every(x => x.d.lo >= Y1R);
  let tcp = 'open';
  if (plan) tcp = 'TCP-PLANP';
  else if (rise) {
    const un = y.every(x => Math.sign(x.sup) !== Math.sign(x.cop) && Math.abs(x.sup) >= Y1R && Math.abs(x.cop) >= Y1R), sn = y.every(x => x.topShare >= HALF);
    tcp = un && !sn ? 'TCP-UNMASK' : sn && !un ? 'TCP-SNREAD' : 'open (both or neither of TCP-UNMASK and TCP-SNREAD fit)';
  }
  return { tc, tcp, y };
}
// each item's point in the derivation's own definition (REALISED lines)
export const POINT = {
  1: it => (it['1'].per.length ? Math.min(...it['1'].per.map(x => x.r.R)) : NaN),
  2: it => Math.max(...it['2'].per.map(x => x.r.d)),
  3: it => it['3'].dS.d,
  4: it => (it['4'].per.length ? Math.min(...it['4'].per.map(x => x.r.R)) : NaN),
  5: it => Math.min(...it['5'].legs.flatMap(l => l.hw.per.map(x => x.ex.d))),
};
// the items' input from the files: perP(h, arm, world, key) in points per path, bitsF(h, arm, world), wsF(h, arm, world),
// stF(h, arm, world, year) the pension share of each path's visit at a bridge year (NaN where not visited), clsF(h, arm, world,
// year) 1 where a path's read is mostly supported (QS at or over QC), topF(h, arm) the arm's share of bridge-year reads in the
// top share cell
export function pOf(perP, bitsF, wsF, stF, clsF, topF) {
  const K = [0, 1, 2], sy = (h, a, k, ys) => { const arr = ys.map(t => perP(h, a, k, `Y${t}`)); return Float64Array.from(arr[0], (_, i) => arr.reduce((s, x) => s + x[i], 0)); };
  const topV = (h, a, k) => Float64Array.from(stF(h, a, k, 1), v => (v >= TOP ? 1 : 0));
  return {
    sup: [{ k: 0, pts: 30, c: sy('S370', 'PX', 0, STEPY), x: sy('S370', 'PSNX', 0, STEPY) }, { k: 1, pts: 60, c: sy('S370', 'PX60', 1, STEPY), x: sy('S370', 'PSNX60', 1, STEPY) }],
    nm: K.flatMap(k => [...OTHERY.map(t => ({ k, y: `Y${t}`, a: perP('S370', 'PX', k, `Y${t}`), b: perP('S370', 'PSNX', k, `Y${t}`) })), { k, y: 'GA', a: perP('S370', 'PX', k, 'GA'), b: perP('S370', 'PSNX', k, 'GA') }]),
    o192: Object.fromEntries(['PX', 'PSNX', 'PX60', 'PSNX60'].map(a => [a, sy('S370', a, 1, [1, 2])])),
    br: ['S130', 'S128'].flatMap(h => [[30, 'CX', 'SNRX'], [60, 'CXW', 'SNRXW']].flatMap(([pts, c, x]) => K.map(k => ({ h, k, pts, c: perP(h, c, k, 'GB'), x: perP(h, x, k, 'GB') })))),
    top: { S130: topF('S130', 'CX'), S128: topF('S128', 'CX') },
    legs: LEGS.map(([arm, ctl, h]) => ({ arm, ctl, h, cells: K.map(k => cellsOf(bitsF(h, ctl, k), bitsF(h, arm, k))), ws: K.map(k => wsOf(wsF(h, ctl, k), wsF(h, arm, k))) })),
    y1: [0, 2].map(k => ({ k, a: perP('S370', 'PX', k, 'Y1'), b: perP('S370', 'PSNX', k, 'Y1'), clsA: clsF('S370', 'PX', k, 1), topA: topV('S370', 'PX', k), topB: topV('S370', 'PSNX', k) })),
  };
}
// a file's pension share at each path's visit to bridge year t (the saved states: pension, ISA, taxable first), NaN where the
// path did not visit
export function shareAt(f, k, t) {
  const st = f.states[`S${k}`], nb = f.bridge.length, bi = f.bridge.indexOf(t), D = f.dim, n = f.NPW;
  return Float64Array.from({ length: n }, (_, i) => { const o = (i * nb + bi) * D, p = st[o], W = st[o] + st[o + 1] + st[o + 2]; return Number.isFinite(p) && W > 0 ? p / W : NaN; });
}
// a file's share of bridge-year reads (every world, every bridge year) in the top share cell
export function topShareOf(f) { let n = 0, top = 0; for (let k = 0; k < 3; k++) for (const t of f.bridge) for (const v of shareAt(f, k, t)) { if (!Number.isFinite(v)) continue; n++; if (v >= TOP) top++; } return n ? top / n : NaN; }

// THE PLANTED CHECKS: each item to each outcome on a case built for it, the rows, the causes, the gate's refusals, the reuse's
// and the reproduction's, the EDGES
export const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
const N0 = 4000;
const ys = (m, sd, n = N0, seed = 7) => { let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; return Float64Array.from({ length: n }, () => m + sd * Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r())); };
const bitsAt = (ok, shift = 0) => Uint8Array.from({ length: N0 }, (_, i) => (i < ok - shift || (shift > 0 && i >= N0 - shift) ? 1 : 0));
const pairBits = (ok, lost, saved) => [bitsAt(ok), Uint8Array.from({ length: N0 }, (_, i) => ((i < ok && i >= lost) || (i >= ok && i < ok + saved) ? 1 : 0))];
const RUNS = { S370: [1603, 3472, 3960], S130: [1500, 3000, 3900], S128: [1700, 3300, 3950] };
const ws0 = b => Float64Array.from(b, v => 100 * v);
const fill = v => new Float64Array(N0).fill(v);
const alt = (m, e) => Float64Array.from({ length: N0 }, (_, i) => m + (i % 2 ? e : -e));
const P0 = () => {
  const K = [0, 1, 2];
  // item 1: the package's step years 2.7 (world 0) and 2.1 (world 1 at 60), the fix leaves a tenth
  const c0 = ys(2.7, 3, N0, 11), c1 = ys(2.1, 3, N0, 12);
  const nm = K.flatMap(k => [...OTHERY.map((t, j) => { const a = ys(-0.2, 2, N0, 100 + 10 * k + j); return { k, y: `Y${t}`, a, b: Float64Array.from(a, v => v + 0.05) }; }), (() => { const a = ys(1.7, 2, N0, 140 + k); return { k, y: 'GA', a, b: Float64Array.from(a, v => v + 0.05) }; })()]);
  const px = ys(-0.93, 2, N0, 31);
  const br = ['S130', 'S128'].flatMap((h, hi) => [30, 60].flatMap((pts, pi) => K.map(k => { const c = ys(k === 2 ? 0.3 : 2, 2, N0, 200 + 20 * hi + 10 * pi + k); return { h, k, pts, c, x: Float64Array.from(c, v => 0.1 * v) }; })));
  const legs = LEGS.map(([arm, ctl, h]) => ({ arm, ctl, h, cells: K.map(k => cellsOf(bitsAt(RUNS[h][k]), bitsAt(RUNS[h][k]))), ws: K.map(k => wsOf(ws0(bitsAt(RUNS[h][k])), ws0(bitsAt(RUNS[h][k])))) }));
  const y1 = [0, 2].map(k => { const a = ys(-0.1, 2, N0, 300 + k); return { k, a, b: Float64Array.from(a, v => v + 0.05), clsA: Uint8Array.from({ length: N0 }, (_, i) => i % 2), topA: new Uint8Array(N0), topB: new Uint8Array(N0) }; });
  return { sup: [{ k: 0, pts: 30, c: c0, x: Float64Array.from(c0, v => 0.1 * v) }, { k: 1, pts: 60, c: c1, x: Float64Array.from(c1, v => 0.1 * v) }], nm,
    o192: { PX: px, PSNX: Float64Array.from(px, v => v + 0.6), PX60: Float64Array.from(px, v => v + 0.9), PSNX60: Float64Array.from(px, v => v + 0.95) }, br, top: { S130: 0.4, S128: 0.3 }, legs, y1 };
};
function planted() {
  const cases = [], put = (what, got, want) => cases.push([what, got, want]);
  const run = (what, edit, i, want, edge) => { const P = P0(); edit(P); const it = items(P); REACHED[i].add(it[i].outcome); put(`${what}: ${i} ${want}`, it[i].outcome, want); if (edge) EDGES.push(edge); return it; };
  const fix = (P, j, f, add = 0) => { P.sup[j].x = Float64Array.from(P.sup[j].c, v => f * v + add); };
  // item 1 (P0: the fix leaves a tenth in both cells)
  run('the fix removes nine tenths in both cells', () => {}, '1', 'HELD');
  run('the fix removes none in world 0', P => fix(P, 0, 1), '1', 'FALSIFIED');
  run('the fix removes six tenths in world 1 at 60 points (between the lines)', P => fix(P, 1, 0.4), '1', 'INCONCLUSIVE');
  run('the fix overshoots world 0 to -1.5 everywhere (removal 1.55, the remainder wholly beyond one)', P => { P.sup[0].c = fill(2.7); fix(P, 0, 0, -1.5); }, '1', 'FALSIFIED', 'an overshoot whose remainder lies wholly beyond one reads falsified though the removal is over three quarters');
  run('the fix removes all but leaves a remainder of 0.7 (removal over three quarters, the remainder past a half)', P => { P.sup[0].c = fill(2.7); fix(P, 0, 0, 0.7); }, '1', 'INCONCLUSIVE');
  run('the fix removes exactly three quarters, no spread, the remainder 0.5 (the lines)', P => { P.sup[0].c = fill(2); fix(P, 0, 0.25); P.sup[1].c = fill(2); fix(P, 1, 0.25); }, '1', 'HELD', 'a removal of exactly three quarters with a remainder of exactly a half, no spread, reads held');
  run('the control under half a point in both cells (nothing read)', P => { P.sup[0].c = fill(0.3); P.sup[1].c = fill(-0.4); }, '1', 'INCONCLUSIVE', 'no cell whose control residual is half a point in size: item 1 reads nothing');
  run('world 1\'s control under half a point (read in world 0 alone)', P => { P.sup[1].c = fill(0.4); fix(P, 1, 3); }, '1', 'HELD');
  run('the fix removes 0.45 in world 0 (wholly under a half)', P => { P.sup[0].c = fill(2.7); fix(P, 0, 0.55); }, '1', 'FALSIFIED');
  run('a negative control (an under-read of -2) removed by nine tenths', P => { P.sup[0].c = ys(-2, 2, N0, 41); fix(P, 0, 0.1); }, '1', 'HELD');
  run('a removal of 0.875 on a control of 0.8, the fix\'s paths spread by 3 (its interval reaching under three quarters), the remainder 0.1', P => { P.sup[0].c = fill(0.8); P.sup[0].x = alt(0.1, 3); }, '1', 'INCONCLUSIVE', 'a removal whose point clears three quarters but whose interval does not reads unclear');
  run('a removal of exactly 0.72, no spread, the remainder 0.28 (under three quarters)', P => { P.sup[0].c = fill(1); P.sup[0].x = fill(0.28); }, '1', 'INCONCLUSIVE');
  run('a removal of 0.8 whose 95% interval clears three quarters but whose Bonferroni interval over four does not', P => { P.sup[0].c = alt(2, 14); P.sup[0].x = fill(0.4); }, '1', 'INCONCLUSIVE');
  // item 2 (P0: every cell moves by 0.05)
  run('every other year and GA moves by 0.05', () => {}, '2', 'HELD');
  run('year 1 in world 0 rises from -0.085 to +0.872 (the projection)', P => { const c = P.nm.find(x => x.k === 0 && x.y === 'Y1'); c.a = ys(-0.085, 2, N0, 51); c.b = Float64Array.from(c.a, v => v + 0.957); }, '2', 'FALSIFIED', 'a residual crossing nil (-0.085 to +0.872) reads a rise in size of 0.79, moved');
  run('year 1 in world 2 falls in size from -1.2 to -0.2 (a fall, not a rise)', P => { const c = P.nm.find(x => x.k === 2 && x.y === 'Y1'); c.a = ys(-1.2, 2, N0, 52); c.b = Float64Array.from(c.a, v => v + 1); }, '2', 'HELD');
  run('GA in world 0 rises by 0.4 (between the lines)', P => { const c = P.nm.find(x => x.k === 0 && x.y === 'GA'); c.b = Float64Array.from(c.a, v => v + 0.4); }, '2', 'INCONCLUSIVE');
  run('year 5 in world 1 rises by exactly a half, no spread (the line)', P => { const c = P.nm.find(x => x.k === 1 && x.y === 'Y5'); c.a = fill(1); c.b = fill(1.5); }, '2', 'FALSIFIED', 'a rise of exactly a half with no spread reads moved');
  run('year 2 in world 1 from -0.2 to +0.2 (the sign flips, the size the same)', P => { const c = P.nm.find(x => x.k === 1 && x.y === 'Y2'); c.a = fill(-0.2); c.b = fill(0.2); }, '2', 'HELD');
  run('year 4 near nil both sides with a wide spread (the union of signs)', P => { const c = P.nm.find(x => x.k === 0 && x.y === 'Y4'); c.a = alt(0, 3); c.b = alt(0.02, 3); }, '2', 'INCONCLUSIVE');
  run('year 6 in world 2: PX\'s mean spans nil (0.001 with a spread of 3), PSNX 0.6 above it path by path (the union over both signs reads it unclear)', P => { const c = P.nm.find(x => x.k === 2 && x.y === 'Y6'); c.a = alt(0.001, 3); c.b = Float64Array.from(c.a, v => v + 0.6); }, '2', 'INCONCLUSIVE');
  // item 3 (P0: PX -0.93; PSNX less PX +0.6; PX60 less PX +0.9; PSNX60 less PX +0.95)
  const o3 = (P, s, w60, b) => { const px = P.o192.PX; P.o192.PSNX = Float64Array.from(px, v => v + s); P.o192.PX60 = Float64Array.from(px, v => v + w60); P.o192.PSNX60 = Float64Array.from(px, v => v + b); };
  const lab = (what, edit, want, edge) => { const it = run(what, edit, '3', want === 'W' ? 'HELD' : want === 'NEITHER' ? 'FALSIFIED' : 'INCONCLUSIVE', edge); put(`${what}: the label`, it['3'].label, want); };
  lab('the wealth axis alone closes it (PX60 at nil, PSNX at PX)', P => o3(P, 0, 0.93, 0.93), 'W');
  lab('the top cell alone closes it (PSNX at nil, PX60 at PX)', P => o3(P, 0.93, 0, 0.93), 'TOPC');
  lab('each lever moves it by 0.6 and 0.9 (both)', () => {}, 'BOTH');
  lab('neither lever moves it (PSNX60 within 0.2 of PX)', P => o3(P, 0.05, 0.05, 0.1), 'NEITHER', 'neither lever moving world 1\'s years 1 and 2 reads NEITHER (FALSIFIED for the scorecard)');
  lab('one lever moves it by 0.25 (not 0.3), the other by nothing beyond 0.2', P => o3(P, 0.25, 0.1, 0.5), 'unclear');
  lab('PX60 at 0.15 in level with PSNX at PX: W (level within 0.25)', P => { o3(P, 0, 0.93, 0.93); P.o192.PX60 = Float64Array.from(P.o192.PX, v => v - mean(P.o192.PX) + 0.15); }, 'W');
  lab('PSNX closes it and PX60 moves it by 0.5 (BOTH, not TOPC)', P => o3(P, 0.93, 0.5, 1.2), 'BOTH');
  lab('PX60 moves it by 0.35 with a spread whose interval reaches under 0.3 (not BOTH)', P => { o3(P, 0.6, 0.35, 0.95); P.o192.PX60 = Float64Array.from(P.o192.PX, (v, i) => v + 0.35 + (i % 2 ? 2 : -2)); }, 'unclear');
  lab('PX60 at 0.35 in level with PSNX at PX: not W (level past 0.25)', P => { o3(P, 0, 0.93, 0.93); P.o192.PX60 = Float64Array.from(P.o192.PX, v => v - mean(P.o192.PX) + 0.35); }, 'unclear');
  // item 4 (P0: worlds 0 and 1 read, the fix leaves a tenth; world 2 under a point)
  run('SNRX removes nine tenths on both households at 30 and 60 points', () => {}, '4', 'HELD');
  run('S128 at 60 points world 0 removes none', P => { const c = P.br.find(x => x.h === 'S128' && x.pts === 60 && x.k === 0); c.x = Float64Array.from(c.c); }, '4', 'FALSIFIED');
  run('S130 at 30 points world 1 removes six tenths', P => { const c = P.br.find(x => x.h === 'S130' && x.pts === 30 && x.k === 1); c.x = Float64Array.from(c.c, v => 0.4 * v); }, '4', 'INCONCLUSIVE');
  run('both households\' reads under a tenth in the top cell (reported only)', P => { P.top = { S130: 0.05, S128: 0.02 }; }, '4', 'INCONCLUSIVE', 'a household with under a tenth of its reads in the top share cell is reported only (F3), and with both so nothing is read');
  run('S128 reported only (its reads not in the top cell), S130 read and held', P => { P.top.S128 = 0.05; const c = P.br.find(x => x.h === 'S128' && x.pts === 60 && x.k === 0); c.x = Float64Array.from(c.c); }, '4', 'HELD');
  run('every control under a point (nothing read)', P => { for (const c of P.br) c.c = fill(0.5); }, '4', 'INCONCLUSIVE');
  run('a world whose control is under a point is not read (S130 world 2 at 30 points, the fix removing nothing there)', P => { const c = P.br.find(x => x.h === 'S130' && x.pts === 30 && x.k === 2); c.c = fill(0.4); c.x = fill(0.4); }, '4', 'HELD');
  // item 5
  const lose = (P, li, k, lost, saved) => { const l = P.legs[li], [c, a] = pairBits(RUNS[l.h][k], lost, saved); l.cells[k] = cellsOf(c, a); l.ws[k] = wsOf(ws0(c), ws0(a)); };
  run('every leg at its control', () => {}, '5', 'HELD');
  run('PSNX loses 80 and saves 10 paths in world 0 of S370', P => lose(P, 0, 0, 80, 10), '5', 'FALSIFIED');
  run('SNRX on S128 loses 20 and saves 10 in world 1 (across the margin)', P => lose(P, 3, 1, 20, 10), '5', 'INCONCLUSIVE');
  { const P = P0(); lose(P, 0, 0, 80, 10); lose(P, 0, 1, 0, 120); const it = items(P); put('a by-world harm with a mixture gain is flagged to the maintainer', `${it['5'].outcome} ${it['5'].maint}`, 'FALSIFIED true'); EDGES.push('a harm in world 0 with a mixture gain reads FALSIFIED and is flagged to the maintainer (PR30)'); }
  { const P = P0(); lose(P, 0, 0, 80, 10); const it = items(P); put('a by-world harm with a mixture loss is not flagged', `${it['5'].outcome} ${it['5'].maint}`, 'FALSIFIED false'); }
  // the rows
  const rowAt = edit => { const P = P0(); edit(P); return rowOf(items(P)); };
  const moved = P => { const c = P.nm.find(x => x.k === 0 && x.y === 'Y1'); c.b = Float64Array.from(c.a, v => v + 1.5); };
  put('the rows: the default reads RS', rowAt(() => {}), 'RS');
  put('the rows: harm reads RH over a move', rowAt(P => { lose(P, 0, 0, 80, 10); moved(P); }), 'RH');
  put('the rows: a move reads RM over item 1 FALSIFIED', rowAt(P => { moved(P); fix(P, 0, 1); }), 'RM');
  put('the rows: item 1 FALSIFIED reads RN over item 4 FALSIFIED', rowAt(P => { fix(P, 0, 1); const c = P.br.find(x => x.h === 'S128' && x.pts === 60 && x.k === 0); c.x = Float64Array.from(c.c); }), 'RN');
  put('the rows: item 4 FALSIFIED reads RB', rowAt(P => { const c = P.br.find(x => x.h === 'S128' && x.pts === 60 && x.k === 0); c.x = Float64Array.from(c.c); }), 'RB');
  put('the rows: item 1 unclear reads else', rowAt(P => fix(P, 1, 0.4)), 'else');
  put('the rows: item 1 held with item 2 unclear reads else, not RS', rowAt(P => { const c = P.nm.find(x => x.k === 0 && x.y === 'GA'); c.b = Float64Array.from(c.a, v => v + 0.4); }), 'else');
  put('the rows: item 3 does not decide a row (NEITHER, RS stands)', rowAt(P => o3(P, 0.05, 0.05, 0.1)), 'RS');
  // the causes
  { const cz = edit => { const P = P0(); edit(P); const it = items(P); const c = causeOf(it, P); return `${c.tc} | ${c.tcp}`; };
    const rise = (P, f) => { for (const x of P.y1) { x.b = Float64Array.from(x.a, v => v + 1); f(x); } };
    put('the causes: item 1 HELD and year 1 still credit TC-SUPPORT and TCP-PLANP', cz(() => {}), 'TC-SUPPORT | TCP-PLANP');
    put('the causes: item 1 FALSIFIED reads TC-SUPPORT\'s not', cz(P => fix(P, 0, 1)).split(' | ')[0], 'TC-SUPPORT not (support does not carry the step reads\' remainder under the package)');
    put('the causes: a year-1 rise on the top cell\'s reads, PX\'s classes one sign, credits TCP-SNREAD', cz(P => rise(P, x => { x.topB = new Uint8Array(N0).fill(1); x.a = fill(0.4); x.b = fill(1.4); })).split(' | ')[1], 'TCP-SNREAD');
    put('the causes: a year-1 rise off the top cell, PX\'s classes of opposite sign each 0.3 or more, credits TCP-UNMASK', cz(P => rise(P, x => { x.a = Float64Array.from({ length: N0 }, (_, i) => (i % 2 ? 0.8 : -0.8)); x.b = Float64Array.from(x.a, v => v + 1); })).split(' | ')[1], 'TCP-UNMASK');
    put('the causes: a rise fitting both reads open', cz(P => rise(P, x => { x.topB = new Uint8Array(N0).fill(1); x.a = Float64Array.from({ length: N0 }, (_, i) => (i % 2 ? 0.8 : -0.8)); x.b = Float64Array.from(x.a, v => v + 1); })).split(' | ')[1], 'open (both or neither of TCP-UNMASK and TCP-SNREAD fit)');
    put('the causes: a rise in world 0 alone reads open', cz(P => { P.y1[0].b = Float64Array.from(P.y1[0].a, v => v + 1); }).split(' | ')[1], 'open');
    put('the causes: a rise off the top cell with PX\'s classes of one sign, each 0.4, reads open (neither fits)', cz(P => rise(P, x => { x.a = fill(0.8); x.b = fill(1.8); })).split(' | ')[1], 'open (both or neither of TCP-UNMASK and TCP-SNREAD fit)');
    put('the causes: item 1 INCONCLUSIVE leaves TC-SUPPORT open', cz(P => fix(P, 1, 0.4)).split(' | ')[0], 'TC-SUPPORT open');
    EDGES.push('a year-1 rise in one world of the two reads no TCP cause (open)'); }
  // the helpers: riseOf, supCell, shareAt, topShareOf
  { const r = riseOf(fill(-0.5), fill(0.5), 2); put('riseOf: -0.5 to +0.5 is no rise in size', `${r.d} ${r.lo} ${r.hi}`, '0 0 0'); const r2 = riseOf(fill(0.2), fill(1), 2); put('riseOf: 0.2 to 1 rises by 0.8', r2.d.toFixed(4), '0.8000'); }
  { const f = { NPW: 2, dim: 3, bridge: [1, 2], states: { S0: Float64Array.from([80, 10, 10, 50, 25, 25, 90, 5, 5, NaN, NaN, NaN]), S1: new Float64Array(12).fill(NaN), S2: new Float64Array(12).fill(NaN) } };
    put('shareAt: the pension share at year 1 for each path', Array.from(shareAt(f, 0, 1)).join(','), '0.8,0.9'); put('shareAt: an unvisited year is NaN', String(shareAt(f, 0, 2)[1]), 'NaN');
    put('topShareOf: three visits, two at 0.8 or more', topShareOf(f).toFixed(4), (2 / 3).toFixed(4)); }
  // pOf: the wiring
  { const perP = (h, a, k, x) => fill(({ GB: 1, GA: 2, Y1: 10, Y2: 20, Y3: 30, Y4: 40, Y5: 50, Y6: 60, Y7: 70 })[x] + ({ PX: 0, PSNX: 100, PX60: 200, PSNX60: 300, CX: 400, SNRX: 500, CXW: 600, SNRXW: 700 })[a] + ({ S370: 1000, S130: 2000, S128: 3000 })[h] + 0.1 * k);
    const bitsF = (h, a, k) => bitsAt(RUNS[h][k] - (a === 'PSNX' ? 1 : a === 'SNRXW' ? 2 : 0)), wsF = (h, a, k) => ws0(bitsF(h, a, k));
    const stF = (h, a, k) => fill(a === 'PSNX' ? 0.9 : 0.5), clsF = () => new Uint8Array(N0).fill(1), topF = h => (h === 'S130' ? 0.4 : 0.2);
    const P = pOf(perP, bitsF, wsF, stF, clsF, topF);
    put('pOf: item 1\'s world-0 control is PX\'s years 3 and 7', P.sup[0].c[0].toFixed(1), (30 + 70 + 2000).toFixed(1));
    put('pOf: item 1\'s world-1 fix is PSNX60\'s years 3 and 7 in world 1', P.sup[1].x[0].toFixed(1), (30 + 70 + 2 * 1300 + 0.2).toFixed(1));
    put('pOf: item 1\'s world-0 fix is PSNX\'s years 3 and 7', P.sup[0].x[0].toFixed(1), (30 + 70 + 2 * 1100).toFixed(1));
    put('pOf: item 1\'s world-1 control is PX60\'s in world 1', P.sup[1].c[0].toFixed(1), (30 + 70 + 2 * 1200 + 0.2).toFixed(1));
    put('pOf: item 2 reads years 1, 2, 4, 5, 6 and GA in each world', P.nm.map(x => `${x.k}${x.y}`).join(','), [0, 1, 2].flatMap(k => ['Y1', 'Y2', 'Y4', 'Y5', 'Y6', 'GA'].map(y => `${k}${y}`)).join(','));
    put('pOf: item 2\'s year-5 cell in world 2 is PSNX\'s', P.nm.find(x => x.k === 2 && x.y === 'Y5').b[0].toFixed(1), (50 + 1100 + 0.2).toFixed(1));
    put('pOf: item 3 is world 1\'s years 1 and 2 under PX60', P.o192.PX60[0].toFixed(1), (10 + 20 + 2 * 1200 + 0.2).toFixed(1));
    put('pOf: item 4 reads GB, CXW and SNRXW at 60 on S128', `${P.br.find(x => x.h === 'S128' && x.pts === 60 && x.k === 1).c[0].toFixed(1)} ${P.br.find(x => x.h === 'S128' && x.pts === 60 && x.k === 1).x[0].toFixed(1)}`, `${(1 + 3600 + 0.1).toFixed(1)} ${(1 + 3700 + 0.1).toFixed(1)}`);
    put('pOf: the top share by household', `${P.top.S130} ${P.top.S128}`, '0.4 0.2');
    put('pOf: the PSNX leg sees its one lost path against PX', P.legs[0].cells.map(x => `${x.b}/${x.c}`).join(','), '1/0,1/0,1/0');
    put('pOf: the SNRXW leg on S128 sees its two lost paths against CXW', P.legs[5].cells.map(x => `${x.b}/${x.c}`).join(','), '2/0,2/0,2/0');
    put('pOf: year 1\'s top flags from each arm\'s own states', `${P.y1[0].topA[0]} ${P.y1[0].topB[0]} ${P.y1.map(x => x.k).join(',')}`, '0 1 0,2'); }
  // the gate on synthetic logs and files
  const enc = a => Buffer.from(Float64Array.from(a).buffer).toString('base64'), enc8 = a => Buffer.from(Uint8Array.from(a)).toString('base64'), enc16 = a => Buffer.from(Uint16Array.from(a).buffer).toString('base64');
  const npw = 4, DIM = 7, BR = [1, 2, 3];
  const mk = ([id, arm, pts0], over = {}) => {
    const pts = over.pts || pts0, at = over.at ?? pts, L = `${arm}/P${at}S6Q5`, floor = 104000, br = over.bridge || BR, ad = (over.ref || REF[arm]) === 'adaptive', stp = over.stepAll ?? STEPS[arm], nd = over.nodes ?? NODED[arm];
    const bitsW = [1, 1, 0, 1], mv = [1, 2, 65535, 1, 2, 3, 4, 65535], ws = [100, 99.5, -2, 100], tv = over.tab ?? '50.000000';
    const lines = [`stamp: code ${over.code || 'c1'} audit a1 prediction ${PRED} sha s1`, `TOP-CELL: the candidate's own unit, ${npw} paths a world, wealth points divided by ${over.scale || 1} (seed ${over.seed || SEED}); 11 ${over.repro ? 'reproduction ' : ''}jobs; part 0/1`, `${(over.id || id).padEnd(16)} case | job ${L} | points ${at} | lambda 0.0223606797749979`,
      `solve CAND ${L}: table 50.0000 secs 10`, `ran CAND ${L}: bridgeRead reader bridgeStep exact readerSplit ${over.split ?? SPLIT[arm]} readerCopy ${over.copy ?? 'extrap'} readerBlend null readerRef ${over.ranRef || over.ref || REF[arm]} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${at} grid total${at}x${(over.ranNodes ?? nd) ? 8 : 6}x6 shareNodes ${over.ranSN ?? ((over.ranNodes ?? nd) ? SN_LINE : 'none')} floor ${floor} line 0.5`,
      `reader ${L}: tables 72 unsupported 0 copied 10 copiedTop 5 nodes 100`, `nodes ${L}: ${(over.nodesList ?? nd) ? SN_LINE : 'the uniform six'} floor ${floor} (the product's rule ${over.rule ?? floor})`,
      ad ? `adaptive ${L}: readerRef adaptive fix ${over.fix ?? true} stepAll ${stp} moves ${over.moves ?? 120} nonMono ${over.nonMono ?? 0} lattice 160x41 nz 128` : `adaptive ${L}: readerRef null fix ${over.fix ?? false} stepAll ${over.stepAll ?? false} moves 0 nonMono -1 lattice none`,
      `checks ${L}: armTook ${over.armTook ?? 1}/1`];
    if (STEPS[arm] && !over.noSteps) lines.push(`steps ${L} 3: 9 of 9 cells with a step, A*_t 83199 to 85696 (median 83199)`);
    if ((STEPS[arm] || over.stepTook) && over.stepTook !== 'none') lines.push(`checks ${L}: stepTook ${over.stepTook ?? 81}/81`);
    if (ad && !over.noPr31) lines.push(`pr31 ${L} 3: the plan's split 83199; A*_t at b 0, 0.5, 1 (gain nodes first, middle, last) 83199/84039/85696 83199/83199/83199 83199/83199/83199`);
    lines.push(`recount ${L}: tables 72 copied 10 (the solve's 72 and 10) line 0.5`, `checks ${L}: copyTook 1/1`, `openings ${L}: OWN ai 14 level 1 tiers 2,2`);
    for (let w = 0; w < 3; w++) lines.push(`tables ${L} ${w} z 0 weight 0.333333: OWN ${tv} READ 50.000000`);
    lines.push(`bridge ${L}: reader years ${br.join(',')}`);
    const per = {}, bits = {}, moves = {}, states = {}, tables = { '0/0/1': over.tabB ?? 'AAAA' };
    for (let w = 0; w < 3; w++) {
      lines.push(`sim ${L} ${w} OWN ai 14: 3/${npw} bridge 3 bits ${sha16(Buffer.from(Uint8Array.from(bitsW)))} ${sha16(Buffer.from(Uint8Array.from(bitsW)))}`, `moves ${L} ${w}: path-years 6 sha ${sha16(Buffer.from(Uint16Array.from(mv).buffer))}`, `ledger ${L} ${w}: X 75 B0 75 T 0 GB 0 GA 0 GL 0 GD 0 ${br.map(t => `Y${t} 0`).join(' ')}`);
      lines.push(`split ${L} ${w}: ${br.map(t => (over.noRH ? PARTS.slice(0, 4) : PARTS).map(p => `${p}${t} 0`).join(' ')).join(' ')}`);
      lines.push(`year ${L} ${w} 1: paths 4 G 0.000000 T 0.000000`, `qf ${L} ${w}: paths ${Math.min(npw, NQF)} QF 0`, `whole ${L} ${w}: mean ${(ws.reduce((t, x) => t + x, 0) / npw).toFixed(6)} spending years 46 of 46 floor level 0.8 scale 1 cap 1 death charge 0`);
      for (const x of [...KEYS, ...br.flatMap(t => [`Y${t}`, ...(over.noRH ? PARTS.slice(0, 4) : PARTS).map(p => `${p}${t}`)])]) per[`${x}${w}`] = enc(over.perVal && x === 'GB' ? [over.perVal, 0, 0, 0] : [0, 0, 0, 0]);
      per[`WS${w}`] = enc(ws); bits[`OWN${w}`] = enc8(bitsW); bits[`OWN${w}b`] = enc8(bitsW); moves[`MV${w}`] = enc16(over.mv && w === 1 ? over.mv : mv);
      states[`S${w}`] = enc(new Array(npw * br.length * DIM).fill(over.stateVal && w === 2 ? over.stateVal : 0));
    }
    lines.push(`checks ${L}: ownTook 12/12 identity ${3 * npw}/${3 * npw} qfTook 9/9 layerTook 9/9 scoreTook ${3 * npw}/${3 * npw} splitTook 24/24 secs 1`, `clamped ${L}: 0 of 24 bridge-year reads at the reader's clamp (their split does not sum to the read)`, `file ${L}: ${id}-${arm}-${at}.json.gz`);
    if (!over.notDone) lines.push(`done ${L}`);
    return { text: lines.join('\n'), file: [`${id}-${arm}-${at}.json.gz`, { id, job: L, stamp: { code: over.code || 'c1', audit: 'a1', prediction: PRED, sha: 's1' }, NPW: npw, seed: 7002, own: 14, bridge: br, dim: DIM, per, bits, moves, states, tables }] };
  };
  const at = (id, arm) => EXPECT.findIndex(x => x[0] === id && x[1] === arm);
  const gateOf = (overs = {}, extra = [], opt = {}) => { const all = EXPECT.map((x, i) => mk(x, overs[i] || {})), jobs = [...all, ...extra].flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); return gate(jobs, { npw, files, ...opt }); };
  put('the gate passes the eleven jobs as registered', gateOf().join('; '), '');
  { const all = EXPECT.map(x => mk(x, { at: Math.max(4, Math.round(x[2] / 15)), scale: 15 })), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate passes the preflight\'s jobs at a fifteenth of the points', gate(jobs, { npw, scale: 15, files }).join('; '), ''); }
  const refuses = (what, overs, extra = []) => put(`the gate refuses ${what}`, String(gateOf(overs, extra).length > 0), 'true');
  refuses('a job run twice', {}, [mk(EXPECT[0])]);
  refuses('a job of another test beside them', {}, [mk(['S362', 'PX', 30])]);
  refuses('PSNX without its share nodes (the nodes plant\'s kind)', { [at('S370', 'PSNX')]: { nodes: false } });
  refuses('PX with SN\'s nodes', { [at('S370', 'PX')]: { nodes: true } });
  refuses('PSNX on the RS split (the rsu plant\'s kind)', { [at('S370', 'PSNX')]: { split: 'rs' } });
  refuses('PSNXU on \'rsu\'', { [at('S370', 'PSNXU')]: { split: 'rsu' } });
  refuses('PX60 without stepAll (the stepoff plant\'s kind)', { [at('S370', 'PX60')]: { stepAll: false } });
  refuses('PSNX60 without the reference\'s fix (the foot plant\'s kind)', { [at('S370', 'PSNX60')]: { fix: false } });
  refuses('SNRX on S128 on the adaptive reference', { [at('S128', 'SNRX')]: { ref: 'adaptive' } });
  refuses('PX on the plan reference', { [at('S370', 'PX')]: { ref: 'null' } });
  refuses('CX on S128 without the copy rule', { [at('S128', 'CX')]: { copy: 'null' } });
  refuses('CXW on S128 with stepTook (no stepAll)', { [at('S128', 'CXW')]: { stepTook: 81 } });
  refuses('stepTook short (the stepramp plant)', { [at('S370', 'PSNX')]: { stepTook: 80 } });
  refuses('a package job with no steps lines', { [at('S370', 'PX')]: { noSteps: true } });
  refuses('a package job with no pr31 lines', { [at('S370', 'PSNXU')]: { noPr31: true } });
  refuses('a split line without RH', { [at('S370', 'PSNX')]: { noRH: true } });
  refuses('a reference with no moves', { [at('S370', 'PX')]: { moves: 0 } });
  refuses('a run line naming another reference under the arm\'s adaptive record', { [at('S370', 'PX')]: { ranRef: 'order' } });
  refuses('a run line without SN\'s nodes under a nodes line with them', { [at('S370', 'PSNX')]: { ranNodes: false } });
  refuses('a run line naming other share nodes on SN\'s grid', { [at('S370', 'PSNX60')]: { ranSN: '0,0.2,0.4,0.6,0.8,0.85,0.95,1' } });
  refuses('a nodes line without SN\'s nodes under a run line with them', { [at('S130', 'SNRX')]: { nodesList: false } });
  refuses('a plan-reference job whose record shows the reference\'s fix', { [at('S128', 'CX')]: { fix: true } });
  refuses('a reference with a non-monotone node', { [at('S370', 'PSNX60')]: { nonMono: 1 } });
  refuses('armTook failed', { [at('S130', 'SNRX')]: { armTook: 0 } });
  refuses('another seed', { [at('S128', 'CX')]: { seed: '7004' } });
  refuses('a job on another code', { [at('S130', 'SNRXW')]: { code: 'c2' } });
  refuses('a job whose bridge years are not its household\'s other jobs\'', { [at('S128', 'SNRX')]: { bridge: [1, 2] } });
  refuses('a job whose floor is not the product\'s rule', { [at('S128', 'CXW')]: { rule: 99000 } });
  refuses('a job with no done line', { [at('S370', 'PX')]: { notDone: true } });
  refuses('a reproduction job read as a test job', { [at('S370', 'PX')]: { repro: true } });
  { const all = EXPECT.map((x, i) => mk(x, i === 2 ? { scale: 15 } : {})), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate refuses a job whose header is at a fifteenth of the points, read as the full run', String(gate(jobs, { npw, files }).length > 0), 'true'); }
  { const all = EXPECT.slice(1).map(x => mk(x)), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate refuses a missing job', String(gate(jobs, { npw, files }).length > 0), 'true'); }
  // the reuse (COPY-B's S130 CX and CXW, synthetic)
  { const peer = parse(mk(['S130', 'SNRX', 30]).text)[0], rj = (over = {}) => Object.fromEntries(REUSED.map(([h, a, pts]) => [`${h} ${a}`, parse(mk([h, a, pts], { code: 'c0', ...(over[`${h} ${a}`] || {}) }).text)[0]]));
    put('the reuse passes COPY-B\'s cells with the reproduction passed on this code', reuseGate(rj(), peer, true, true, 'c1').join('; '), '');
    const ru = (what, r, b = true, ok = true, code = 'c1') => put(`the reuse refuses ${what}`, String(reuseGate(r, peer, b, ok, code).length > 0), 'true');
    ru('when COPY-B\'s gate failed', rj(), false);
    ru('when the reproduction did not pass', rj(), true, false);
    ru('a reproduction on other code than the jobs\'', rj(), true, true, 'c9');
    ru('a reused cell on another seed', rj({ 'S130 CX': { seed: '7004' } }));
    ru('a reused cell with share nodes', rj({ 'S130 CXW': { nodes: true } }));
    ru('a reused cell without the copy rule', rj({ 'S130 CX': { copy: 'null' } }));
    ru('a reused cell on other bridge years', rj({ 'S130 CXW': { bridge: [1, 2] } }));
    { const r = rj(); delete r['S130 CX']; ru('a missing reused cell', r); } }
  // the reproduction (the preflight's: TOP-CELL's repro jobs against the sources' preflight files, synthetic)
  const okAll = { 'COPY-X': true, 'COPY-W': true, 'COPY-B': true };
  const cellsR = (over = {}, oldOver = {}) => REPRO.map(([h, a, pts, src]) => { const n = mk([h, a, pts], { repro: true, ...(over[`${h} ${a} ${pts}`] || {}) }), o = mk([h, a, pts], { code: 'c0', noRH: true, ...(oldOver[`${h} ${a} ${pts}`] || {}) }); return { h, a, pts, src, job: parse(n.text)[0], file: n.file[1], old: parse(o.text)[0], oldFile: o.file[1] }; });
  put('the reproduction passes equal files and tables (RH the only extra arrays)', reproGate(cellsR(), okAll, 'c1').join('; '), '');
  const rrefuses = (what, cells, ok = okAll, code = 'c1') => put(`the reproduction refuses ${what}`, String(reproGate(cells, ok, code).length > 0), 'true');
  rrefuses('when COPY-W\'s preflight gate failed', cellsR(), { ...okAll, 'COPY-W': false });
  rrefuses('a reproduction job on other code than the jobs\'', cellsR(), okAll, 'c9');
  rrefuses('a path\'s GB differing in one path', cellsR({ 'S370 CX 30': { perVal: 1e-12 } }));
  rrefuses('a move differing in world 1', cellsR({ 'S130 CXW 60': { mv: [1, 2, 65535, 1, 2, 3, 5, 65535] } }));
  rrefuses('a visit state differing in world 2', cellsR({ 'S370 SNRX 30': { stateVal: 1 } }));
  rrefuses('a table differing in the sixth place', cellsR({ 'S130 CX 30': { tab: '50.000001' } }));
  rrefuses('a saved bridge table differing', cellsR({ 'S370 CXW 60': { tabB: 'AAAB' } }));
  rrefuses('a source on another seed', cellsR({}, { 'S370 CX 30': { seed: '7004' } }));
  rrefuses('a source on other bridge years', cellsR({}, { 'S130 CX 30': { bridge: [1, 2] } }));
  { const c = cellsR(); c[2] = { ...c[2], oldFile: null }; rrefuses('a missing source file', c); }
  { const c = cellsR(); c[0] = { ...c[0], src: 'COPY-B' }; rrefuses('a cell read against the wrong source', c); }
  { const c = cellsR(); c[3] = { ...c[3], oldFile: { ...c[3].oldFile, bridge: [1, 2] } }; rrefuses('a source file naming other bridge years (its arrays equal)', c); }
  { const c = cellsR(); c[1] = { ...c[1], file: { ...c[1].file, per: { ...c[1].file.per, EXTRA0: c[1].file.per.GB0 } } }; rrefuses('an array other than RH in TOP-CELL\'s file that the source lacks', c); }
  EDGES.push('a single path\'s GB differing by 1e-12 fails the reproduction (byte for byte)');
  // the pin: the jobs, arms and reused cells are the audit's
  { const au = readFileSync(join(HERE, 'audit-topcell.mjs'), 'utf8'), jl = /export const JOBS = \[([\s\S]*?)\];/.exec(au), rl = /export const REPRO = \[([\s\S]*?)\];/.exec(au);
    const aj = jl ? [...jl[1].matchAll(/\['(S\d+)', '(\w+)', (\d+), 6, 5\]/g)].map(m => `${m[1]} ${m[2]} ${m[3]}`).join(',') : 'none', ar = rl ? [...rl[1].matchAll(/\['(S\d+)', '(\w+)', (\d+), 6, 5, '([\w-]+)'\]/g)].map(m => `${m[1]} ${m[2]} ${m[3]} ${m[4]}`).join(',') : 'none';
    put('the pin: the reducer\'s jobs are the audit\'s, in its order', EXPECT.map(x => x.join(' ')).join(','), aj);
    put('the pin: the reproduction\'s cells are the audit\'s', REPRO.map(x => x.join(' ')).join(','), ar);
    const def = n => (new RegExp(`(?:const |, )${n} = (\\{[^}]*\\})`).exec(au) || [, ''])[1];
    const armsLine = (/export const ARMS = Object\.freeze\(\{(.*)\}\);/.exec(au) || [, ''])[1];
    const armDef = a => { const m = new RegExp(`(?:^\\s*|, )${a}: (\\w+)`).exec(armsLine); return m ? m[1] : 'none'; };
    const want = a => ({ PKG: def('PKG'), PSN: `${def('PKG')} ${def('PSN')}`, PSNU: `${def('PKG')} ${def('PSN')} ${def('PSNU')}`, CXA: def('CXA'), SNRXA: def('SNRXA') })[armDef(a)] || '';
    const last = (s, k) => { const m = [...s.matchAll(new RegExp(`${k}: '(\\w+)'`, 'g'))]; return m.length ? m[m.length - 1][1] : 'null'; };
    for (const a of Object.keys(REF)) { const s = want(a); put(`the pin: ${a}'s reference, split, share nodes and stepAll are the audit's`, `${REF[a]} ${SPLIT[a]} ${NODED[a]} ${STEPS[a]}`, `${last(s, 'readerRef')} ${last(s, 'readerSplit')} ${/shareNodes: NODES_SN/.test(s)} ${/stepAll: true/.test(s)}`); } }
  let bad = 0;
  for (const [what, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}: ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`); }
  for (const i of Object.keys(REACHED)) if (REACHED[i].size !== 3) { bad++; console.log(`FAIL item ${i} reaches ${[...REACHED[i]].join(', ')} only`); }
  if (EDGES.length < 2) { bad++; console.log('FAIL fewer than two EDGES'); }
  if (bad) { console.log(`PLANTED CHECK FAILED (${bad})`); process.exit(1); }
  return cases.length;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const np_ = planted();
  if (process.argv.includes('--planted')) {
    console.log(`planted (${np_}): all read as they should\nEDGES: ${EDGES.join(', ')}`);
    for (const i of Object.keys(REACHED)) console.log(`OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--')), PRE = process.argv.includes('--preflight');
  const DIR = args[0] || join(HERE, 'results', 'diagtopcell'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const BDIR = args[3] || join(HERE, 'results', 'diagcopyb'), RDIR = args[4] || join(HERE, 'results', 'topcell-preflight', 'repro');
  const logsOf = d => (existsSync(d) ? Object.fromEntries(readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(d, f), 'utf8')])) : {});
  const filesOf = d => (existsSync(d) ? Object.fromEntries(readdirSync(d).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(d, f))).toString())])) : {});
  const logs = logsOf(DIR);
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse), files = filesOf(DIR);
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const CODE = jobs[0].stamp.code, ptsAt = p => Math.max(4, Math.round(p / scaleA));
  const J = (h, a) => jobs.find(x => x.key === keyOf(h, a, ptsAt(EXPECT.find(e => e[0] === h && e[1] === a)[2]))), FR = (h, a) => files[J(h, a).file];
  // THE REPRODUCTION (the preflight's repro jobs, at the preview, against the sources' preflights, each behind its reducer's
  // preflight gate); read at the preflight and again by the full run, which holds it to its own code
  const spawnOk = (script, dir, extra = []) => { const r = spawnSync('node', [join(HERE, script), dir, ...extra], { encoding: 'utf8', maxBuffer: 1 << 26 }); return r.status === 0 && /^GATE: passed/m.test(r.stdout || ''); };
  const PREV = ['40', '15', '--preflight'], S = join(HERE, 'results'), XPRE = join(S, 'copyx-preflight', 'main'), WPRE = join(S, 'copyw-preflight', 'main'), BPRE = join(S, 'copyb-preflight', 'main');
  const rok = { 'COPY-X': spawnOk('reduce-copyx.mjs', XPRE, PREV), 'COPY-W': spawnOk('reduce-copyw.mjs', WPRE, [...PREV.slice(0, 2), XPRE, PREV[2]]), 'COPY-B': spawnOk('reduce-copyb.mjs', BPRE, [...PREV.slice(0, 2), WPRE, XPRE, PREV[2]]) };
  const rlogs = logsOf(RDIR), rjobs = Object.values(rlogs).flatMap(parse), rfiles = filesOf(RDIR);
  const srcLogs = { 'COPY-X': Object.values(logsOf(XPRE)).flatMap(parseX), 'COPY-W': Object.values(logsOf(WPRE)).flatMap(parseW), 'COPY-B': Object.values(logsOf(BPRE)).flatMap(parseB) }, srcDir = { 'COPY-X': XPRE, 'COPY-W': WPRE, 'COPY-B': BPRE };
  const findOld = (h, a, pts, src) => (src === 'COPY-B' ? srcLogs[src].find(x => x.key === keyOfB(h, a, ptsAt(pts))) : srcLogs[src].find(x => x.id === h && x.label === (src === 'COPY-X' ? LABELS_X[a] : LABELS_W[a]).replace(/P\d+/, `P${ptsAt(pts)}`)));
  const rcells = REPRO.map(([h, a, pts, src]) => { const old = findOld(h, a, pts, src), p = old && old.file && join(srcDir[src], old.file), job = rjobs.find(x => x.key === keyOf(h, a, ptsAt(pts))); return { h, a, pts, src, job, file: job && rfiles[job.file], old, oldFile: p && existsSync(p) ? JSON.parse(gunzipSync(readFileSync(p)).toString()) : null }; });
  const rjBad = REPRO.flatMap(([h, a, pts]) => { const js = rjobs.filter(x => x.key === keyOf(h, a, ptsAt(pts))); return js.length !== 1 ? [`the reproduction's ${h} ${a}: ${js.length ? 'run twice' : 'missing'}`] : jobBad(js[0], { id: h, arm: a, pts: ptsAt(pts), key: keyOf(h, a, ptsAt(pts)) }, { npw: 40, seed: SEED, scale: 15, files: rfiles, repro: true }); });
  const rbad = [...rjBad, ...reproGate(rcells, rok, CODE)];
  if (rbad.length) { console.log(`GATE FAILED (the reproduction, ${rbad.length}):\n  ${rbad.slice(0, 20).join('\n  ')}`); process.exit(1); }
  console.log(`planted (${np_}): all read as they should`);
  const rhOf = (h, a) => { const j = J(h, a); let mx = 0, at = ''; for (let k = 0; k < 3; k++) for (const t of j.bridge) { const v = Math.abs(j.split[k][`RH${t}`]); if (v > mx) { mx = v; at = `world ${k} year ${t}`; } } return { mx, at }; };
  if (PRE) {
    console.log(`GATE: passed - the eleven jobs once and done at the preview (${npwA} paths a world, scale ${scaleA}, seed ${SEED}) on one code; the package's record on its five arms with stepTook in full; every self-check in full; the reproduction: S370's CX and SNRX, CXW and S130's CX and CXW on this code equal COPY-X's, COPY-W's and COPY-B's preflights byte for byte, each behind its reducer's preflight gate`);
    for (const [h, a] of EXPECT) { const j = J(h, a), pp = (k, x) => mean(decRaw(FR(h, a).per[`${x}${k}`])) * 100; console.log(`PREFLIGHT ${h} ${a}: bridge years ${j.bridge.join(',')}, ${j.adaptive.ref === 'adaptive' ? `the reference's moves ${j.adaptive.moves} stepAll ${j.adaptive.stepAll}` : 'the plan reference'}, nodes ${j.nodes.list}, split ${field(j.ran, 'readerSplit')}, world-0 GB ${f4(pp(0, 'GB'))} GA ${f4(pp(0, 'GA'))}, copied ${j.reader.copied}, clamped ${j.clamped.n} of ${j.clamped.of}, solve ${j.solve.secs} s`); }
    for (const a of ['PSNX', 'PSNX60', 'PSNXU', 'PX']) { const r = rhOf('S370', a); console.log(`PREFLIGHT S370 ${a}: R on RS's side (RH) at most ${f4(r.mx)} points (${r.at || 'nowhere'}), by world and year ${[0, 1, 2].map(k => J('S370', a).bridge.map(t => f4(J('S370', a).split[k][`RH${t}`])).join('/')).join(' | ')}`); }
    for (const [h, a] of EXPECT) for (const s of J(h, a).pr31) console.log(`PREFLIGHT ${h} ${a} pr31 ${s.t}: ${s.text}`);
    console.log('PREFLIGHT: the gate, the reproduction and the files read; no figure read for an item (a preview at a fraction of the points; PREVIEW)'); process.exit(0);
  }
  // THE REUSE: COPY-B's S130 CX and CXW behind COPY-B's gate over its files; the code accepted by the reproduction above
  const bOk = spawnOk('reduce-copyb.mjs', BDIR), bLogs = Object.values(logsOf(BDIR)).flatMap(parseB), rJobs = Object.fromEntries(REUSED.map(([h, a, pts]) => [`${h} ${a}`, bLogs.find(x => x.key === keyOfB(h, a, pts))]));
  const ubad = reuseGate(rJobs, J('S130', 'SNRX'), bOk, true, rjobs[0] && rjobs[0].stamp && rjobs[0].stamp.code);
  if (ubad.length) { console.log(`GATE FAILED (the reuse, ${ubad.length}):\n  ${ubad.join('\n  ')}`); process.exit(1); }
  const RF = Object.fromEntries(REUSED.map(([h, a]) => { const j = rJobs[`${h} ${a}`]; return [`${h} ${a}`, JSON.parse(gunzipSync(readFileSync(join(BDIR, j.file))).toString())]; }));
  console.log(`GATE: passed - the eleven jobs once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}) on one code (${CODE}); the package's record on its five arms with stepTook in full; every self-check in full; THE REUSE: COPY-B's gate passed over ${BDIR} and its S130 CX and CXW share TOP-CELL's seed, paths, bridge years and settings; THE CODE ACCEPTED (not SAME: the reused cells predate 05395be, 22a40bf and 44dc34e, each behind its own flag): the preflight's reproduction on this code equals COPY-X's, COPY-W's and COPY-B's preflights byte for byte (${RDIR})`);
  const fileOf = (h, a) => (RF[`${h} ${a}`] || FR(h, a));
  const perP = (h, a, k, x) => Float64Array.from(decRaw(fileOf(h, a).per[`${x}${k}`]), v => 100 * v), bitsF = (h, a, k) => dec8(fileOf(h, a).bits[`OWN${k}`]), wsF = (h, a, k) => decRaw(fileOf(h, a).per[`WS${k}`]);
  const stCache = new Map(), withStates = f => { if (!stCache.has(f)) stCache.set(f, { ...f, states: Object.fromEntries(Object.entries(f.states).map(([x, v]) => [x, decRaw(v)])) }); return stCache.get(f); };
  const stF = (h, a, k, t) => shareAt(withStates(fileOf(h, a)), k, t), topF = (h, a) => topShareOf(withStates(fileOf(h, a)));
  const clsF = (h, a, k, t) => { const qs = perP(h, a, k, `QS${t}`), qc = perP(h, a, k, `QC${t}`); return Uint8Array.from(qs, (v, i) => (v >= qc[i] ? 1 : 0)); };
  const P = pOf(perP, bitsF, wsF, stF, clsF, topF), it = items(P), cz = causeOf(it, P), iv = x => `${f4(x.d ?? x.R)} (${f4(x.lo)} to ${f4(x.hi)})`;
  const hw = x => `world ${x.k}: survival ${f4(x.ex.d)} exact (${f4(x.ex.lo)} to ${f4(x.ex.hi)}) ${x.ex.outcome}, guarded unconditional (${f4(x.u.lo)} to ${f4(x.u.hi)}), whole score ${iv(x.w)}, margin ${f4(x.margin)}: ${x.harm ? 'harm' : x.ok ? 'no material harm' : 'inconclusive'}`;
  console.log('\nTOP-CELL: the top-cell fix (SN\'s nodes and RU) under the package on S370 (PSNX against PX at 30 points, PSNX60 against PX60 at 60), its breadth under the plan reference on S130 and S128 (predictions/diag-topcell.md)');
  console.log('\nTHE ITEMS (each read by its registered rule)');
  console.log(`1. SUPPORT: the step-year residual (years 3 and 7) removed by three quarters or more with the remainder within a half, world 0 at 30 points and world 1 at 60: ${it['1'].outcome}`);
  for (const x of it['1'].per) console.log(`     world ${x.k} at ${x.pts} points: the control's ${f4(x.r.mc)}, removal ${iv(x.r)}, remainder ${iv(x.rem)}: ${x.read}`);
  for (const x of it['1'].skipped) console.log(`     world ${x.k} at ${x.pts} points: the control's ${f4(x.mc)}, under half a point in size: reported only`);
  console.log(`2. NOT MOVED: the fix moves no other bridge year's residual or GA by 0.3 or more in size, in every world (PSNX against PX at 30 points): ${it['2'].outcome}`);
  for (const x of it['2'].per) console.log(`     world ${x.k} ${x.y}: PX ${iv(x.r.ma)}, PSNX ${iv(x.r.mb)}, the rise in size ${iv(x.r)}: ${x.read}`);
  const i3 = it['3'];
  console.log(`3. O192: world 1's years 1 and 2 across PX, PSNX, PX60 and PSNX60: ${i3.label} (${i3.outcome})`);
  console.log(`     PX ${iv(i3.px)}; PX60's level ${iv(i3.lv60)}, PSNX's level ${iv(i3.lvS)}; PSNX less PX ${iv(i3.dS)}, PX60 less PX ${iv(i3.d60)}, PSNX60 less PX ${iv(i3.dB)}; the interaction PSNX60 - PSNX - PX60 + PX ${iv(i3.add)}`);
  console.log(`4. BREADTH: SNRX's GB against CX's at 30 points and SNRXW's against CXW's at 60 on S130 and S128, in item 1's bands where the control's is a point or more: ${it['4'].outcome}`);
  for (const x of it['4'].per) console.log(`     ${x.h} world ${x.k} at ${x.pts} points: the control's ${f4(x.mc)}, removal ${iv(x.r)}, remainder ${iv(x.rem)}: ${x.read}`);
  for (const x of it['4'].reportedOnly) console.log(`     ${x.h} world ${x.k} at ${x.pts} points: the control's ${f4(x.mc)}; its household's reads under a tenth in the top share cell: reported only`);
  console.log(`     the control's share of bridge-year reads in the top share cell: S130 ${f4(P.top.S130)}, S128 ${f4(P.top.S128)}`);
  if (it['4'].nothing) console.log('     nothing read');
  console.log(`5. HARM BY WORLD (PR30, a reader change): ${it['5'].outcome}${it['5'].maint ? ' - a by-world harm with a mixture gain: TO THE MAINTAINER (PR30), not read by Claude' : ''}`);
  for (const l of it['5'].legs) { console.log(`     ${l.arm} against ${l.ctl} on ${l.h}: ${l.hw.outcome}; by the mixture (beside) ${f4(l.mx.d)} (${f4(l.mx.lo)} to ${f4(l.mx.hi)}) ${l.mx.outcome}${l.maint ? ' TO THE MAINTAINER' : ''}`); for (const w of l.hw.per) console.log(`       ${hw(w)}`); }
  console.log(`OUTCOME: ${Object.keys(it).map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  console.log(`ROW: ${rowOf(it)}`);
  console.log(`CAUSE TC: ${cz.tc}`);
  console.log(`CAUSE TCP (the year-1 rise): ${cz.tcp}`);
  for (const y of cz.y) console.log(`     world ${y.k}: year 1's increment PSNX less PX ${iv(y.d)}; PX's year-1 residual on mostly-supported reads ${f4(y.sup)}, on mostly-copied ${f4(y.cop)}; the share of the increment on top-cell reads ${f4(y.topShare)}`);
  console.log(`CAUSE O192: ${i3.label === 'W' ? 'O192-W' : i3.label === 'TOPC' ? 'O192-TOPC' : i3.label === 'BOTH' ? 'both (O192-W and O192-TOPC)' : i3.label === 'NEITHER' ? 'neither (O192-OTHER)' : 'open'}`);
  for (const i of Object.keys(POINT)) console.log(`REALISED item ${i}: ${f4(POINT[i](it))}`);
  console.log('\nREPORTED');
  const rh = rhOf('S370', 'PSNX');
  console.log(`  RS x SN: R on RS's side under PSNX at most ${f4(rh.mx)} points (${rh.at}): ${rh.mx >= RHMAT ? 'a hundredth of a point or more: PSNXU against PX read beside items 1 and 2 (the fix less RS x SN)' : 'under a hundredth of a point: PSNXU reported only'}`);
  { const z = zFor(0.05 / 18); for (const k of [0, 1, 2]) console.log(`  PSNXU against PX world ${k}: ${[...STEPY.map(t => `Y${t}`), ...OTHERY.map(t => `Y${t}`), 'GA'].map(y => `${y} ${iv(meanOf(diffOf(perP('S370', 'PSNXU', k, y), perP('S370', 'PX', k, y)), z))}`).join('; ')}; PSNX less PSNXU (RS x SN): ${[...STEPY, ...OTHERY].map(t => `Y${t} ${f4(mean(diffOf(perP('S370', 'PSNX', k, `Y${t}`), perP('S370', 'PSNXU', k, `Y${t}`))))}`).join(' ')}`); }
  const HA = [['S370', ['PX', 'PSNX', 'PSNXU', 'PX60', 'PSNX60']], ['S130', ['CX', 'SNRX', 'CXW', 'SNRXW']], ['S128', ['CX', 'SNRX', 'CXW', 'SNRXW']]];
  for (const [h, as] of HA) for (const a of as) for (let k = 0; k < 3; k++) {
    const reused = RF[`${h} ${a}`], f = fileOf(h, a), bits = bitsF(h, a, k), ok = bits.reduce((t, x) => t + x, 0), by = f.bridge, pm = x => mean(perP(h, a, k, x));
    const tab = reused ? rJobs[`${h} ${a}`].tables[k].OWN : J(h, a).tables[k].OWN;
    console.log(`  ${h} ${a}${reused ? ' (COPY-B\'s)' : ''} world ${k}: table ${f4(tab)} runs ${ok}/${bits.length} (${f4(100 * ok / bits.length)}), table less runs ${f4(tab - 100 * ok / bits.length)}; GB ${f4(pm('GB'))} GA ${f4(pm('GA'))} T ${f4(pm('T'))}; by bridge year ${by.map(y => `${y}: ${f4(pm(`Y${y}`))}`).join(' | ')}; split (QS, QC, RS, RC${reused ? '' : ', RH'}) ${by.map(y => `${y}: ${(reused ? PARTS.slice(0, 4) : PARTS).map(p => f4(pm(`${p}${y}`))).join(', ')}`).join(' | ')}`);
  }
  // year 1 by read class and by share cell, in PX and PSNX (the unmasking decomposition: item 2's pre-registered split)
  const CELLS = [[0, 0.2], [0.2, 0.4], [0.4, 0.6], [0.6, 0.8], [0.8, 0.9], [0.9, 0.95], [0.95, 1.0000001]];
  for (const a of ['PX', 'PSNX']) for (let k = 0; k < 3; k++) {
    const y = perP('S370', a, k, 'Y1'), cls = clsF('S370', a, k, 1), sh = stF('S370', a, k, 1), n = y.length;
    const byCls = [1, 0].map(c => { let s = 0; for (let i = 0; i < n; i++) if (cls[i] === c) s += y[i]; return s / n; }), byCell = CELLS.map(([lo, hi]) => { let s = 0, m = 0; for (let i = 0; i < n; i++) if (sh[i] >= lo && sh[i] < hi) { s += y[i]; m++; } return `${lo}-${Math.min(1, hi)}: ${f4(s / n)} (${m})`; });
    console.log(`  S370 ${a} world ${k} year 1: by read class supported ${f4(byCls[0])} copied ${f4(byCls[1])}; by share cell ${byCell.join(' | ')}`);
  }
  for (const [arm, ctl, h] of LEGS) for (let k = 0; k < 3; k++) {
    const fa = fileOf(h, arm), fc = fileOf(h, ctl), ma = dec16(fa.moves[`MV${k}`]), mc = dec16(fc.moves[`MV${k}`]), ba = bitsF(h, arm, k), bc = bitsF(h, ctl, k), yrs = fa.years, nb = fa.bridge.length, sv = [0, 0, 0, 0], ls = [0, 0, 0, 0];
    let diff = 0;
    for (let i = 0; i < ba.length; i++) { const b = firstBand(ma, mc, yrs, nb, i); if (b >= 0) diff++; if (ba[i] === bc[i] || b < 0) continue; if (ba[i]) sv[b]++; else ls[b]++; }
    console.log(`  ${arm} against ${ctl} on ${h} world ${k}: moves differ on ${diff} paths; saved ${sv.join('/')} and lost ${ls.join('/')} by the band their moves first differ (the opening / the bridge / the five years after / the rest)`);
  }
  for (const [h, a] of EXPECT) { const j = J(h, a); for (const s of j.steps) console.log(`  ${h} ${a} steps ${s.t}: ${s.text}`); for (const s of j.pr31) console.log(`  ${h} ${a} pr31 ${s.t}: ${s.text}`); }
  for (const [h, a] of EXPECT) { const j = J(h, a); console.log(`  ${h} ${a}: ${j.adaptive.ref === 'adaptive' ? `the adaptive reference's moves ${j.adaptive.moves}, fix ${j.adaptive.fix}, stepAll ${j.adaptive.stepAll}` : 'the plan reference'}; nodes ${j.nodes.list}; copied ${j.reader.copied} of ${j.reader.nodes} nodes; reads at the clamp ${j.clamped.n} of ${j.clamped.of}; solve ${j.solve.secs} s`); }
}
