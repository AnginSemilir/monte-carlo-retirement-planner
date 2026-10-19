/*
 * COPY-B: COPY-W'S STAGE B REDUCER (PLAN.md COPY-W, items/COPY-W.md's re-cut; predictions/diag-copyb.md; the deep review after
 * COPY-W, deep-review-log.md 19 Oct 13:32 UK, adopted in PLAN.md's 19 Oct 13:38 row; the maintainer's decision of 19 Oct 09:26
 * UK: each fix against the frozen candidate, a factorial where fixes interact). The copy x wealth factorial across the step
 * households, seed 7002, the first 4,000 paths a world (audit-copyb.mjs, results/diagcopyb): C and CX at 30 wealth points and CW
 * and CXW at 60 on S130, S126 and S362; C and CW on S128 (O133's after-access part); CW at 120 points on S370, read against
 * COPY-W's CW at 60 (results/diagcopyw), reused. Its gate: the fair-test gate on COPY-B's logs; the fifteen jobs once and done
 * at the registered settings with every self-check in full, on one code; THE REUSE (a new test of old files, CHECKLIST item 3):
 * COPY-W's reducer passes its gate over results/diagcopyw (and through it COPY-X's over results/diagcopyx), and COPY-W's CW is
 * on the code, household, seed and paths of COPY-B's S370 job with the shared settings the same.
 * THE ITEMS, each with three outcomes. An item's cells (household x world) are read together, Holm across them read as
 * Bonferroni intervals (each cell's interval at 0.05 over the number of cells the item reads: Holm's first step, conservative):
 *   1: the copy rule, the bridge part: in each factorial household and world where C's GB is a point or more in size, CX
 *      removes at least half of it, path by path (sum(GB_C - GB_CX) / sum(GB_C), its interval by the delta method); a cell
 *      reads removed when its interval lies at or above one half, kept when below a quarter; HELD when every cell read reads
 *      removed, FALSIFIED when any reads kept, otherwise INCONCLUSIVE; INCONCLUSIVE with nothing to remove when no cell is read.
 *   2: the interaction (CXW - CW) - (CX - C) in table less runs per factorial household and world, against half a point (stage
 *      A's item 4 across households): HELD when every cell reads additive, FALSIFIED when any interacts, otherwise INCONCLUSIVE.
 *   3: the wealth fix read as an order, the after-access part (the deep review after COPY-W's design, items/COPY-W.md's re-cut):
 *      in each household (the factorial's and S128) and world where C's GA is half a point or more in size, CW's removal of it,
 *      path by path; a cell reads removed when its interval lies at or above three quarters (the second-order expectation of
 *      doubling the points), kept when below a quarter; otherwise as item 1 (the removal against one half, the first-order
 *      expectation, reported beside).
 *   4: closure by part: the better cell (CXW on the factorial, CW on S128) in each household and world, GB and GA each within
 *      half a point in size (their means' intervals); a cell reads closed when both lie within, open when either lies wholly
 *      outside; HELD when every cell reads closed, FALSIFIED when any reads open, otherwise INCONCLUSIVE. The net G = GB + GA and
 *      the table less runs are reported beside.
 *   5: no material harm per world by RULES.md section 8's rule as written (COPY-X's harmWorlds: the exact conditional rule at the
 *      relative margin with Holm across the three worlds, the guarded unconditional interval, the whole score's normal
 *      interval), each fix against the frozen candidate: CX, CW and CXW each against C on the factorial, CW against C on S128,
 *      each leg at 0.05 over its households; HELD when every leg reads no material harm in every world, FALSIFIED when any
 *      reads harm, otherwise INCONCLUSIVE.
 *   6: the after-access part's order on S370: in each world where COPY-W's CW at 60 points carries GA of half a point or more
 *      in size, CW at 120 points' removal of it, path by path, read as item 3 against three quarters and a quarter (CXG0's
 *      after-access part: the wealth axis at second order predicts HELD; a cause apart from the axis, FALSIFIED: 120 points
 *      reaches the axis by construction).
 * THE ROWS: R5 item 5 FALSIFIED (a fix harms a household); R1 item 4 HELD (the pair closes every household by part); R3 item 1
 *   FALSIFIED (the copy rule leaves a household's bridge part); R4 item 3 FALSIFIED (60 points leaves a household's after-access
 *   part); R2 item 1 HELD or nothing to remove, with item 3 HELD or nothing to remove (each fix does its part where it has one,
 *   a remainder left); else.
 * REPORTED: every arm's tables against its runs by world; GB, GA, T, G and the residual by bridge year; the sum of absolute
 *   residuals by bridge year (the cancellation guard); G by year band (the bridge, the five years after it, the rest) from the
 *   year lines, and GA's two bands under each wealth arm against its control with a band's rise marked (band means: the
 *   ledger saves GA per path in total, not by band); S362's years-4-6 residual's removal by CW and CXW (against C and CX),
 *   with its interval, against three quarters and a quarter; the copied weight at the visited bridge reads (QC + RC); bridge failures by world; each leg's saved and lost
 *   paths by the band of the year their moves first differ; the copied nodes; the reads at the clamp; the solves' seconds.
 *   node research/solver/reduce-copyb.mjs [dir] [paths a world] [scale] [COPY-W dir] [COPY-X dir] [STEP-S370 dir] [--preflight] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { zFor } from './stats.mjs';
import { sha16 } from './reduce-ao.mjs';
import { spawnSync } from 'node:child_process';
import { cellsOf, wsOf, removal, harmWorlds } from './reduce-copyx.mjs';
import { parse as parseW, LABELS as LABELS_W, interOf, meanOf, closeOf } from './reduce-copyw.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-copyb.md';
export const SEED = '7002', NPW = 4000, NQF = 1000;
export const HALF = 0.5, QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, MINGA = 0.5, PART = 0.5, INTER = 0.5;
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const PARTS = Object.freeze(['QS', 'QC', 'RS', 'RC']);
export const FACT = Object.freeze(['S130', 'S126', 'S362']), WH = Object.freeze([...FACT, 'S128']);
// the jobs as registered: [household, arm, wealth points] (audit-copyb.mjs's JOBS, in its order)
export const EXPECT = Object.freeze([['S362', 'CW', 60], ['S362', 'CXW', 60], ['S370', 'CW', 120], ['S362', 'C', 30], ['S362', 'CX', 30], ['S130', 'CW', 60], ['S130', 'CXW', 60], ['S126', 'CW', 60], ['S126', 'CXW', 60], ['S128', 'CW', 60], ['S130', 'C', 30], ['S130', 'CX', 30], ['S126', 'C', 30], ['S126', 'CX', 30], ['S128', 'C', 30]]);
export const COPY = Object.freeze({ C: 'null', CX: 'extrap', CW: 'null', CXW: 'extrap' });
export const ptsAt = (pts, scale) => Math.max(4, Math.round(pts / scale));
export const keyOf = (id, arm, pts) => `${id} ${arm}/P${pts}S6Q5`;
// the legs of item 5: [arm, control, households]
export const LEGS = Object.freeze([['CX', 'C', FACT], ['CW', 'C', WH], ['CXW', 'C', FACT]]);
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S\d+)\s+case \| job ((C|CX|CW|CXW)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^COPY-B: .*?, (\d+) paths a world.*?, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts: Number(c[6]), key: `${c[1]} ${c[2]}`, stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, checks: {}, tables: [], sims: {}, moves: [], ledger: [], split: [], qf: [], whole: [], years: [[], [], []], nodes: null, reader: null, recount: null, clamped: null, bridge: null, own: null, solve: null, ran: null, file: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label, e = esc(L);
    let m;
    if ((m = new RegExp(`^solve CAND ${e}: table (\\S+) secs (\\d+)$`).exec(l))) j.solve = { table: Number(m[1]), secs: Number(m[2]) };
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^nodes ${e}: (.+) floor (\\d+) \\(the product's rule (\\d+)\\)$`).exec(l))) j.nodes = { list: m[1], floor: Number(m[2]), rule: Number(m[3]) };
    else if ((m = new RegExp(`^reader ${e}: tables (\\S+) unsupported (\\S+) copied (\\S+) copiedTop (\\S+) nodes (\\S+)$`).exec(l))) j.reader = { tables: Number(m[1]), copied: Number(m[3]), copiedTop: Number(m[4]), nodes: Number(m[5]) };
    else if ((m = new RegExp(`^recount ${e}: tables (\\d+) copied (\\d+) \\(the solve's (\\d+) and (\\d+)\\) line (\\S+)$`).exec(l))) j.recount = { tables: Number(m[1]), copied: Number(m[2]), line: Number(m[5]) };
    else if ((m = new RegExp(`^clamped ${e}: (\\d+) of (\\d+) `).exec(l))) j.clamped = { n: Number(m[1]), of: Number(m[2]) };
    else if ((m = new RegExp(`^openings ${e}: OWN ai (\\d+) `).exec(l))) j.own = { ai: Number(m[1]) };
    else if ((m = new RegExp(`^tables ${e} (\\d) z (\\S+) weight (\\S+): OWN (\\S+) READ (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), OWN: Number(m[4]), READ: Number(m[5]) };
    else if ((m = new RegExp(`^bridge ${e}: reader years ?(\\S*)$`).exec(l))) j.bridge = m[1] ? m[1].split(',').map(Number) : [];
    else if ((m = new RegExp(`^sim ${e} (\\d) OWN ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`OWN${m[1]}`] = { ai: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bridge: Number(m[5]), bits: m[6], bitsB: m[7] };
    else if ((m = new RegExp(`^moves ${e} (\\d): path-years (\\d+) sha (\\S+)$`).exec(l))) j.moves[Number(m[1])] = { py: Number(m[2]), sha: m[3] };
    else if ((m = new RegExp(`^ledger ${e} (\\d): (.*)$`).exec(l))) j.ledger[Number(m[1])] = Object.fromEntries([...m[2].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])]));
    else if ((m = new RegExp(`^split ${e} (\\d): (.*)$`).exec(l))) j.split[Number(m[1])] = Object.fromEntries([...m[2].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])]));
    else if ((m = new RegExp(`^year ${e} (\\d) (\\d+): paths (\\S+) G (\\S+) T (\\S+)$`).exec(l))) j.years[Number(m[1])][Number(m[2])] = { n: Number(m[3]), G: Number(m[4]), T: Number(m[5]) };
    else if ((m = new RegExp(`^qf ${e} (\\d): paths (\\d+) QF (\\S+)$`).exec(l))) j.qf[Number(m[1])] = { n: Number(m[2]), QF: Number(m[3]) };
    else if ((m = new RegExp(`^whole ${e} (\\d): mean (\\S+) `).exec(l))) j.whole[Number(m[1])] = { mean: Number(m[2]) };
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerBlend: 'null', readerRef: 'null', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3' };
const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];
const decRaw = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
const dec16 = x => { const b = Buffer.from(x, 'base64'); return new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null } = {}) {
  // a job's label carries its registered points, its case line the points it solved at (the scaled ones at the preflight)
  const bad = [], want = EXPECT.map(([id, arm, pts]) => ({ id, arm, pts: ptsAt(pts, scale), key: keyOf(id, arm, pts) }));
  for (const x of jobs) if (!want.some(w => w.key === x.key)) bad.push(`a job that is not COPY-B's: ${x.key}`);
  const codes = new Set(jobs.map(j => j.stamp && j.stamp.code));
  if (codes.size !== 1 || codes.has(undefined) || codes.has(null)) bad.push(`the jobs are not on one code (${[...codes].join(', ')})`);
  for (const w of want) {
    const js = jobs.filter(x => x.key === w.key);
    if (js.length !== 1) { bad.push(`${w.key}: ${js.length ? `run ${js.length} times` : 'missing'}`); continue; }
    const j = js[0], K = w.key;
    if (!j.done) bad.push(`${K}: no done line`);
    if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push(`${K}: no stamp`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${K}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== w.pts) bad.push(`${K}: solved at ${j.pts} points, not ${w.pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, readerSplit: 'null', readerCopy: COPY[w.arm], pts: String(w.pts), grid: `total${w.pts}x6x6`, shareNodes: 'none' })) if (field(ran, f) !== v) bad.push(`${K}: ${f} is ${field(ran, f)}, not ${v}`);
    if (!j.nodes || j.nodes.floor !== j.nodes.rule || field(ran, 'floor') !== String(j.nodes.floor)) bad.push(`${K}: its floor is not the product's rule's`);
    if (!j.nodes || j.nodes.list !== 'the uniform six') bad.push(`${K}: its share nodes are not the uniform six`);
    for (const c of NEED) { const x = j.checks[c]; if (!x || !(x[1] > 0) || x[0] !== x[1] || ((c === 'armTook' || c === 'copyTook') && x[1] !== 1)) bad.push(`${K}: ${c} did not pass in full`); }
    if (!j.own) bad.push(`${K}: no openings line`);
    if (!j.solve) bad.push(`${K}: no solve line`);
    if (!j.reader) bad.push(`${K}: no reader line`);
    if (!j.recount || !j.reader || j.recount.copied !== j.reader.copied || j.recount.tables !== j.reader.tables || j.recount.line !== 0.5) bad.push(`${K}: the copied nodes were not recounted at the support line to the solve's count`);
    if (!j.clamped || j.checks.splitTook && j.clamped.of !== j.checks.splitTook[1]) bad.push(`${K}: no count of the reads at the clamp over the split's reads`);
    if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push(`${K}: the identity was not held on every path of three worlds`);
    if (j.checks.scoreTook && j.checks.scoreTook[1] !== 3 * npw) bad.push(`${K}: the whole score was not checked on every path of three worlds`);
    if (!j.bridge || !j.bridge.length) bad.push(`${K}: no bridge years`);
    const peers = jobs.filter(x => x.id === j.id && x !== j && x.bridge);
    if (j.bridge && peers.some(x => x.bridge.join(',') !== j.bridge.join(','))) bad.push(`${K}: its bridge years are not its household's other jobs'`);
    for (let k = 0; k < 3; k++) {
      const t = j.tables[k]; if (!t || !Number.isFinite(t.OWN) || !Number.isFinite(t.READ)) bad.push(`${K}: world ${k}'s tables are missing`);
      const s = j.sims[`OWN${k}`]; if (!s || s.n !== npw || (j.own && s.ai !== j.own.ai)) bad.push(`${K}: no OWN run of ${npw} paths at its opening in world ${k}`);
      if (!j.ledger[k] || [...KEYS, ...(j.bridge || []).map(t2 => `Y${t2}`)].some(x => !Number.isFinite(j.ledger[k][x]))) bad.push(`${K}: world ${k}'s ledger line is missing or short`);
      if (!j.split[k] || (j.bridge || []).some(t2 => PARTS.some(p => !Number.isFinite(j.split[k][`${p}${t2}`])))) bad.push(`${K}: world ${k}'s split line is missing or short`);
      if (!j.qf[k] || j.qf[k].n !== Math.min(npw, NQF)) bad.push(`${K}: world ${k}'s QF line is missing`);
      if (!j.moves[k] || !(j.moves[k].py >= npw)) bad.push(`${K}: world ${k}'s moves line is missing or short`);
      if (!j.whole[k] || !Number.isFinite(j.whole[k].mean)) bad.push(`${K}: world ${k}'s whole score line is missing`);
      if (!j.years[k].some(Boolean)) bad.push(`${K}: world ${k}'s year lines are missing`);
    }
    if (files) {
      const f = j.file && files[j.file];
      if (!f) { bad.push(`${K}: its file ${j.file} is missing`); continue; }
      if (f.id !== j.id || f.job !== j.label) bad.push(`${K}: its file is ${f.id} ${f.job}`);
      if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${K}: its file is stamped by other code`);
      if (f.NPW !== npw) bad.push(`${K}: its file is not on ${npw} paths a world`);
      if ((f.bridge || []).join(',') !== (j.bridge || []).join(',')) bad.push(`${K}: its file's bridge years are not the log's`);
      for (const [nm, s] of Object.entries(j.sims)) for (const [b, sh] of [[nm, s.bits], [`${nm}b`, s.bitsB]]) { const x = f.bits && f.bits[b]; if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(`${K}: its file's ${b} bits are not the log's`); }
      const nb = (f.bridge || []).length;
      for (let k = 0; k < 3; k++) {
        for (const x of [...KEYS, 'WS', ...(f.bridge || []).flatMap(t2 => [`Y${t2}`, ...PARTS.map(p => `${p}${t2}`)])]) { const a = f.per && f.per[`${x}${k}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`${K}: its file's ${x}${k} paths are not ${npw}`); }
        const st = f.states && f.states[`S${k}`]; if (!st || !(f.dim > 0) || !(nb > 0) || Buffer.from(st, 'base64').length !== 8 * npw * nb * f.dim) bad.push(`${K}: its file's world-${k} saved states are missing or short`);
        const ws = f.per && f.per[`WS${k}`]; if (ws && j.whole[k] && Math.abs(decRaw(ws).reduce((t, x) => t + x, 0) / npw - j.whole[k].mean) > 1e-5) bad.push(`${K}: its file's world-${k} whole scores are not the log's`);
        const mv = f.moves && f.moves[`MV${k}`]; if (!mv || !j.moves[k] || sha16(Buffer.from(mv, 'base64')) !== j.moves[k].sha) bad.push(`${K}: its file's world-${k} moves are not the log's`);
      }
    }
  }
  return bad;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));

// THE REUSE: COPY-W's CW at 60 points on S370 against COPY-B's S370 job; wOk is COPY-W's own gate over its files (which runs
// COPY-X's over its own)
export function reuseGate(wJobs, bJobs, wOk) {
  const bad = [];
  if (!wOk) bad.push('COPY-W\'s gate did not pass over its own files (reduce-copyw.mjs)');
  const cw = wJobs.find(j => j.label === LABELS_W.CW), b = bJobs.find(j => j.id === 'S370');
  if (!cw || !b) { bad.push(`${!cw ? 'COPY-W\'s CW' : 'COPY-B\'s S370 job'} not found`); return bad; }
  if (!cw.stamp || !b.stamp || cw.stamp.code !== b.stamp.code) bad.push(`COPY-W's CW and COPY-B's jobs are on different code (${cw.stamp && cw.stamp.code}, ${b.stamp && b.stamp.code})`);
  if (cw.id !== 'S370') bad.push(`COPY-W's CW on ${cw.id}, not S370`);
  if (!cw.head || cw.head.seed !== SEED) bad.push(`COPY-W's CW not on seed ${SEED}`);
  if (!cw.head || !b.head || cw.head.npw !== b.head.npw) bad.push('COPY-W\'s CW not on the same paths a world');
  for (const f of Object.keys(COMMON)) if (field(cw.ran || '', f) !== COMMON[f]) bad.push(`COPY-W's CW: ${f} is ${field(cw.ran || '', f)}, not ${COMMON[f]}`);
  if (field(cw.ran || '', 'readerSplit') !== 'null' || field(cw.ran || '', 'shareNodes') !== 'none' || field(cw.ran || '', 'readerCopy') !== 'null') bad.push('COPY-W\'s CW: a reader split, the copy rule or explicit share nodes');
  if ((cw.bridge || []).join(',') !== (b.bridge || []).join(',')) bad.push('COPY-W\'s CW and COPY-B\'s S370 job read different bridge years');
  return bad;
}

const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
const cellRead = (r, line) => (!Number.isFinite(r.R) ? 'unclear' : r.lo >= line ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear');
const allOf = (per, yes, no) => (per.some(x => x.read === no) ? 'FALSIFIED' : per.every(x => x.read === yes) ? 'HELD' : 'INCONCLUSIVE');
// a removal item over cells: the control's per-path part, the arm's, read where the control's mean is at least `min` in size
// line: the removal a cell must reach to read removed (one half for the copy rule, three quarters for the wealth axis's order)
function removalItem(cells, min, line) {
  const read = cells.filter(x => Math.abs(mean(x.c)) >= min), z = zFor(0.05 / Math.max(1, read.length));
  const per = read.map(x => { const r = removal(x.c, x.a, z); return { h: x.h, k: x.k, r, read: cellRead(r, line) }; });
  return { outcome: per.length ? allOf(per, 'removed', 'kept') : 'INCONCLUSIVE', per, nothing: !per.length, skipped: cells.length - read.length };
}
const interWorld = x => (x.lo >= -INTER && x.hi <= INTER ? 'additive' : x.hi < -INTER || x.lo > INTER ? 'interacting' : 'unclear');
const partRead = c => (c.lo >= -PART && c.hi <= PART ? 'in' : c.hi < -PART || c.lo > PART ? 'out' : 'unclear');
/* P: { house: { [h]: { gb: { arm: [3] per path, points }, ga: { arm: [3] }, tab: { arm: [3] }, bits: { arm: [3] }, ws: { arm: [3] } } },
   s370: { ga60: [3], ga120: [3] } } */
export function items(P) {
  const out = {}, K = [0, 1, 2], H = P.house;
  out['1'] = removalItem(FACT.flatMap(h => K.map(k => ({ h, k, c: H[h].gb.C[k], a: H[h].gb.CX[k] }))), MINRES, HALF);
  { const z = zFor(0.05 / (FACT.length * 3));
    const per = FACT.flatMap(h => K.map(k => { const x = interOf(Object.fromEntries(['C', 'CX', 'CW', 'CXW'].map(a => [a, H[h].tab[a][k]])), Object.fromEntries(['C', 'CX', 'CW', 'CXW'].map(a => [a, H[h].bits[a][k]])), z); return { h, k, ...x, read: interWorld(x) }; }));
    out['2'] = { outcome: allOf(per, 'additive', 'interacting'), per }; }
  out['3'] = removalItem(WH.flatMap(h => K.map(k => ({ h, k, c: H[h].ga.C[k], a: H[h].ga.CW[k] }))), MINGA, THREEQ);
  { const z = zFor(0.05 / (WH.length * 3 * 2));
    const per = WH.flatMap(h => { const a = FACT.includes(h) ? 'CXW' : 'CW'; return K.map(k => { const gb = meanOf(H[h].gb[a][k], z), ga = meanOf(H[h].ga[a][k], z), rb = partRead(gb), ra = partRead(ga); return { h, k, arm: a, gb, ga, read: rb === 'out' || ra === 'out' ? 'open' : rb === 'in' && ra === 'in' ? 'closed' : 'unclear' }; }); });
    out['4'] = { outcome: allOf(per, 'closed', 'open'), per }; }
  { const legs = LEGS.map(([arm, ctl, hs]) => { const level = 0.05 / hs.length; return { arm, ctl, per: hs.map(h => ({ h, ...harmWorlds(K.map(k => cellsOf(H[h].bits[ctl][k], H[h].bits[arm][k])), K.map(k => wsOf(H[h].ws[ctl][k], H[h].ws[arm][k])), level) })) }; });
    const all = legs.flatMap(l => l.per);
    out['5'] = { outcome: all.some(x => x.outcome === 'FALSIFIED') ? 'FALSIFIED' : all.every(x => x.outcome === 'HELD') ? 'HELD' : 'INCONCLUSIVE', legs }; }
  out['6'] = removalItem(K.map(k => ({ h: 'S370', k, c: P.s370.ga60[k], a: P.s370.ga120[k] })), MINGA, THREEQ);
  return out;
}
export function rowOf(it) {
  const o = i => it[i].outcome, done = i => o(i) === 'HELD' || it[i].nothing;
  if (o('5') === 'FALSIFIED') return 'R5';
  if (o('4') === 'HELD') return 'R1';
  if (o('1') === 'FALSIFIED') return 'R3';
  if (o('3') === 'FALSIFIED') return 'R4';
  if (done('1') && done('3')) return 'R2';
  return 'else';
}
// the items' input from the files (perP(h, arm, world, key) in points, bitsF(h, arm, world), wsF(h, arm, world), tabs[h][arm][k];
// S370's: s370P(which, world, key) for COPY-W's CW ('60') and COPY-B's ('120'))
export const pOf = (perP, bitsF, wsF, tabs, s370P) => {
  const K = [0, 1, 2], house = {};
  for (const h of WH) {
    const arms = FACT.includes(h) ? ['C', 'CX', 'CW', 'CXW'] : ['C', 'CW'], of = f => Object.fromEntries(arms.map(a => [a, K.map(k => f(a, k))]));
    house[h] = { gb: of((a, k) => perP(h, a, k, 'GB')), ga: of((a, k) => perP(h, a, k, 'GA')), tab: of((a, k) => tabs[h][a][k]), bits: of((a, k) => bitsF(h, a, k)), ws: of((a, k) => wsF(h, a, k)) };
  }
  return { house, s370: { ga60: K.map(k => s370P('60', k, 'GA')), ga120: K.map(k => s370P('120', k, 'GA')) } };
};
// the band of the year two arms' moves first differ on a path: 0 the opening, 1 the bridge, 2 the five years after it, 3 the rest
export function firstBand(mvA, mvB, years, nb, i) { for (let t = 0; t < years; t++) { const a = mvA[i * years + t], b = mvB[i * years + t]; if (a !== b) return t === 0 ? 0 : t <= nb ? 1 : t <= nb + 5 ? 2 : 3; } return -1; }

// THE PLANTED CHECKS: each item to each outcome on a case built for it, the rows, the gate's refusals, the reuse's, the EDGES
export const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set(), 6: new Set() };
const N0 = 4000;
const ys = (m, sd, n = N0, seed = 7) => { let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; return Float64Array.from({ length: n }, () => m + sd * Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r())); };
const bitsAt = (ok, shift = 0) => Uint8Array.from({ length: N0 }, (_, i) => (i < ok - shift || (shift > 0 && i >= N0 - shift) ? 1 : 0));
const RUNS = [1600, 3472, 3959];
// a synthetic household: C's GB and GA by world, CX removing 0.8 of GB, CW removing 0.8 of GA, every arm's runs alike
const houseOf = (gbC, gaC, seed, fact = true) => {
  const K = [0, 1, 2], arms = fact ? ['C', 'CX', 'CW', 'CXW'] : ['C', 'CW'];
  const gb = { C: K.map(k => ys(gbC[k], 2, N0, seed + k)) }, ga = { C: K.map(k => ys(gaC[k], 2, N0, seed + 10 + k)) };
  gb.CW = gb.C.map(a => Float64Array.from(a)); ga.CW = ga.C.map(a => a.map(v => 0.2 * v));
  if (fact) { gb.CX = gb.C.map(a => a.map(v => 0.2 * v)); ga.CX = ga.C.map(a => Float64Array.from(a)); gb.CXW = gb.CX.map(a => a.map(v => 0.2 * v)); ga.CXW = ga.CW.map(a => Float64Array.from(a)); }
  const tab = Object.fromEntries(arms.map(a => [a, K.map(k => 100 * RUNS[k] / N0 + mean(gb[a][k]) + mean(ga[a][k]))]));
  return { gb, ga, tab, bits: Object.fromEntries(arms.map(a => [a, K.map(k => bitsAt(RUNS[k]))])), ws: Object.fromEntries(arms.map(a => [a, K.map(() => new Float64Array(N0).fill(50))])) };
};
const P0 = () => ({ house: { S130: houseOf([2, 0.3, 0], [1, 0.6, 0.1], 11), S126: houseOf([0.2, 0.1, 0], [0.3, 0.2, 0], 31), S362: houseOf([3, 1.5, 0.4], [2, 1, 0.2], 51), S128: houseOf([0.3, 0.1, 0], [3, 1.2, 0.2], 71, false) },
  s370: (() => { const ga60 = [ys(0.9, 2, N0, 91), ys(0.6, 2, N0, 92), ys(0.1, 1, N0, 93)]; return { ga60, ga120: ga60.map(a => a.map(v => 0.15 * v)) }; })() });
// a world's paths that disagree: the arm loses `lost` of the control's survivors and saves `saved` of its failures
const pairBits = (ok, lost, saved) => [bitsAt(ok), Uint8Array.from({ length: N0 }, (_, i) => ((i < ok && i >= lost) || (i >= ok && i < ok + saved) ? 1 : 0))];
function planted() {
  const cases = [], put = (what, got, want) => cases.push([what, got, want]);
  const run = (what, edit, i, want, edge) => { const P = P0(); edit(P); const it = items(P); REACHED[i].add(it[i].outcome); put(`${what}: ${i} ${want}`, it[i].outcome, want); if (edge) EDGES.push(edge); return it; };
  // item 1: the copy rule's removal of C's bridge part
  run('CX removes eight tenths of C\'s GB where it is over a point (S130 and S362 world 0, S362 world 1)', () => {}, '1', 'HELD');
  run('CX removes a tenth on S362 world 0', P => { const h = P.house.S362; h.gb.CX[0] = h.gb.C[0].map(v => 0.9 * v); }, '1', 'FALSIFIED');
  run('CX removes four tenths on S130 world 0', P => { const h = P.house.S130; h.gb.CX[0] = h.gb.C[0].map(v => 0.6 * v); }, '1', 'INCONCLUSIVE');
  run('CX deepens an under-read on S362 world 1 (C -1.5, CX -2)', P => { const h = P.house.S362; h.gb.C[1] = ys(-1.5, 2, N0, 52); h.gb.CX[1] = h.gb.C[1].map(v => 1.33 * v); }, '1', 'FALSIFIED');
  run('no household\'s GB a point in size (nothing to remove)', P => { for (const h of FACT) for (const k of [0, 1, 2]) { P.house[h].gb.C[k] = ys(0.3, 2, N0, 3 + k); P.house[h].gb.CX[k] = P.house[h].gb.C[k].map(v => 0.2 * v); } }, '1', 'INCONCLUSIVE', 'no household with C\'s GB a point in size: item 1 reads nothing to remove');
  run('C\'s GB at exactly a point with CX removing exactly half, no spread (the lines themselves)', P => { for (const h of FACT) for (const k of [0, 1, 2]) { P.house[h].gb.C[k] = new Float64Array(N0).fill(h === 'S130' && k === 0 ? 1 : 0.3); P.house[h].gb.CX[k] = new Float64Array(N0).fill(h === 'S130' && k === 0 ? 0.5 : 0.3); } }, '1', 'HELD', 'C\'s GB exactly a point and a removal exactly one half read HELD');
  run('a removal of exactly 0.45 with no spread on S130 world 0 (just short of one half)', P => { for (const h of FACT) for (const k of [0, 1, 2]) { P.house[h].gb.C[k] = new Float64Array(N0).fill(h === 'S130' && k === 0 ? 2 : 0.3); P.house[h].gb.CX[k] = new Float64Array(N0).fill(h === 'S130' && k === 0 ? 1.1 : 0.3); } }, '1', 'INCONCLUSIVE');
  run('a removal of 0.55 with wide spread on S362 world 0 (its interval below a half)', P => { const h = P.house.S362, e = ys(0, 60, N0, 99), me = mean(e); h.gb.CX[0] = h.gb.C[0].map((v, i) => 0.45 * v + e[i] - me); }, '1', 'INCONCLUSIVE');
  run('a removal of 0.2 with wide spread on S362 world 0 (its interval reaching past a quarter)', P => { const h = P.house.S362, e = ys(0, 60, N0, 98), me = mean(e); h.gb.CX[0] = h.gb.C[0].map((v, i) => 0.8 * v + e[i] - me); }, '1', 'INCONCLUSIVE');
  // item 2: the interaction per factorial household and world
  run('the two fixes additive everywhere', () => {}, '2', 'HELD');
  run('S126 world 0 interacting by a point in the tables', P => { P.house.S126.tab.CXW[0] += 1; }, '2', 'FALSIFIED');
  run('S362 world 1 at 0.4 with discordant runs (its interval across half a point)', P => { const h = P.house.S362; h.tab.CXW[1] += 0.4; h.bits.CXW[1] = bitsAt(RUNS[1], 60); h.bits.CW[1] = bitsAt(RUNS[1], 30); }, '2', 'INCONCLUSIVE', 'an interaction interval across half a point reads INCONCLUSIVE');
  run('the interaction in the runs (CXW saves 60 more paths on S130 world 0)', P => { P.house.S130.bits.CXW[0] = bitsAt(RUNS[0] + 60); }, '2', 'FALSIFIED');
  // item 3: the wealth fix's removal of C's GA
  run('CW removes eight tenths of C\'s GA where it is over half a point', () => {}, '3', 'HELD');
  run('CW removes a tenth of S128\'s world-0 GA', P => { const h = P.house.S128; h.ga.CW[0] = h.ga.C[0].map(v => 0.9 * v); }, '3', 'FALSIFIED');
  run('CW removes four tenths of S362\'s world-0 GA', P => { const h = P.house.S362; h.ga.CW[0] = h.ga.C[0].map(v => 0.6 * v); }, '3', 'INCONCLUSIVE');
  run('CW removes exactly 0.6 of S130\'s world-0 GA, no spread (past one half, short of three quarters)', P => { const h = P.house.S130; h.ga.CW[0] = h.ga.C[0].map(v => 0.4 * v); }, '3', 'INCONCLUSIVE', 'a removal of 0.6 with no spread, past one half and short of three quarters, reads unclear on the order');
  run('CW removes exactly 0.72 everywhere, no spread (just short of three quarters)', P => { for (const h of WH) for (const k of [0, 1, 2]) { P.house[h].ga.C[k] = new Float64Array(N0).fill(2); P.house[h].ga.CW[k] = new Float64Array(N0).fill(0.56); } }, '3', 'INCONCLUSIVE');
  run('CW removes exactly three quarters everywhere, no spread (the line itself)', P => { for (const h of WH) for (const k of [0, 1, 2]) { P.house[h].ga.C[k] = new Float64Array(N0).fill(2); P.house[h].ga.CW[k] = new Float64Array(N0).fill(0.5); } }, '3', 'HELD', 'a removal exactly at three quarters with no spread reads removed on the order');
  run('C\'s GA at 0.49 everywhere (under half a point: nothing to remove)', P => { for (const h of WH) for (const k of [0, 1, 2]) P.house[h].ga.C[k] = new Float64Array(N0).fill(0.49); }, '3', 'INCONCLUSIVE', 'C\'s GA at 0.49 in size everywhere: item 3 reads nothing to remove');
  // item 4: closure by part
  const closeAll = P => { for (const h of WH) { const a = FACT.includes(h) ? 'CXW' : 'CW'; for (const k of [0, 1, 2]) { P.house[h].gb[a][k] = ys(0.05, 1, N0, 200 + k); P.house[h].ga[a][k] = ys(-0.05, 1, N0, 210 + k); } } };
  run('every household\'s better cell within half a point by part', closeAll, '4', 'HELD');
  run('S362\'s world-0 GA at 0.52 with its interval across half a point, the rest closed', P => { closeAll(P); P.house.S362.ga.CXW[0] = ys(0.52, 1, N0, 240); }, '4', 'INCONCLUSIVE');
  run('the default (S128\'s CW GA 0.6 in world 0: open)', () => {}, '4', 'FALSIFIED');
  run('S362\'s CXW GB 1.2 in world 0 (open)', P => { for (const h of WH) { const a = FACT.includes(h) ? 'CXW' : 'CW'; for (const k of [0, 1, 2]) { P.house[h].gb[a][k] = ys(0.05, 1, N0, 200 + k); P.house[h].ga[a][k] = ys(-0.05, 1, N0, 210 + k); } } P.house.S362.gb.CXW[0] = ys(1.2, 1, N0, 220); }, '4', 'FALSIFIED');
  run('S128\'s CW GA -1.2 in world 1 while its net is near nil (parts read, not the net)', P => { for (const h of WH) { const a = FACT.includes(h) ? 'CXW' : 'CW'; for (const k of [0, 1, 2]) { P.house[h].gb[a][k] = ys(0.05, 1, N0, 200 + k); P.house[h].ga[a][k] = ys(-0.05, 1, N0, 210 + k); } } P.house.S128.gb.CW[1] = ys(1.2, 1, N0, 230); P.house.S128.ga.CW[1] = ys(-1.2, 1, N0, 231); }, '4', 'FALSIFIED', 'two parts cancelling to a nil net read open, not closed');
  run('S126\'s CXW GA -1.2 in world 2 alone (a part wholly below)', P => { closeAll(P); P.house.S126.ga.CXW[2] = ys(-1.2, 1, N0, 232); }, '4', 'FALSIFIED');
  run('parts exactly at half a point with no spread (the line itself)', P => { for (const h of WH) { const a = FACT.includes(h) ? 'CXW' : 'CW'; for (const k of [0, 1, 2]) { P.house[h].gb[a][k] = new Float64Array(N0).fill(0.5); P.house[h].ga[a][k] = new Float64Array(N0).fill(-0.5); } } }, '4', 'HELD', 'parts exactly at plus and minus half a point read closed');
  // item 5: no material harm, each fix against the frozen candidate
  run('every fix at its control in every world', () => {}, '5', 'HELD');
  run('CW loses 70 paths against C on S128 world 1', P => { const [c, a] = pairBits(RUNS[1], 80, 10); P.house.S128.bits.C[1] = c; P.house.S128.bits.CW[1] = a; }, '5', 'FALSIFIED');
  run('CX loses 15 paths net on S130 world 1 (its interval across the margin)', P => { const [c, a] = pairBits(RUNS[1], 25, 10); P.house.S130.bits.C[1] = c; P.house.S130.bits.CX[1] = a; }, '5', 'INCONCLUSIVE');
  run('CXW\'s whole score 2 points down on S126 world 2', P => { P.house.S126.ws.CXW[2] = new Float64Array(N0).fill(48); }, '5', 'FALSIFIED');
  run('CX saves 70 paths over C and CXW none (CXW 70 down on CX, level with C: the leg is against C)', P => { const h = P.house.S362; h.bits.CX[0] = bitsAt(RUNS[0] + 70); }, '5', 'HELD', 'CXW read against C, the frozen candidate, not against CX');
  // item 6: S370's after-access order
  run('CW at 120 removes eight tenths of CW at 60\'s GA in worlds 0 and 1', () => {}, '6', 'HELD');
  run('CW at 120 removes a tenth of world 0\'s', P => { P.s370.ga120[0] = P.s370.ga60[0].map(v => 0.9 * v); }, '6', 'FALSIFIED');
  run('CW at 120 removes four tenths of world 0\'s', P => { P.s370.ga120[0] = P.s370.ga60[0].map(v => 0.6 * v); }, '6', 'INCONCLUSIVE');
  run('CW at 120 removes 0.6 of world 0\'s, no spread (past one half, short of three quarters)', P => { P.s370.ga120[0] = P.s370.ga60[0].map(v => 0.4 * v); }, '6', 'INCONCLUSIVE');
  run('CW at 60\'s GA under half a point in every world (nothing to remove)', P => { P.s370.ga60 = P.s370.ga60.map((a, k) => ys(0.2, 2, N0, 300 + k)); }, '6', 'INCONCLUSIVE');
  // the rows
  const rowAt = edit => { const P = P0(); edit(P); return rowOf(items(P)); };
  put('the rows: the default (each fix does its part, a remainder) reads R2', rowAt(() => {}), 'R2');
  put('the rows: every household closed by part reads R1', rowAt(closeAll), 'R1');
  put('the rows: closed but a fix harms reads R5 over R1', rowAt(P => { closeAll(P); const [c, a] = pairBits(RUNS[1], 80, 10); P.house.S128.bits.C[1] = c; P.house.S128.bits.CW[1] = a; }), 'R5');
  put('the rows: the copy rule keeps S362\'s world-0 GB reads R3', rowAt(P => { const h = P.house.S362; h.gb.CX[0] = h.gb.C[0].map(v => 0.9 * v); }), 'R3');
  put('the rows: 60 points keeps S128\'s world-0 GA reads R4', rowAt(P => { const h = P.house.S128; h.ga.CW[0] = h.ga.C[0].map(v => 0.9 * v); }), 'R4');
  put('the rows: both fail reads R3 over R4', rowAt(P => { const h = P.house.S362; h.gb.CX[0] = h.gb.C[0].map(v => 0.9 * v); const g = P.house.S128; g.ga.CW[0] = g.ga.C[0].map(v => 0.9 * v); }), 'R3');
  put('the rows: nothing to remove for the copy rule, the wealth fix doing its part reads R2', rowAt(P => { for (const h of FACT) for (const k of [0, 1, 2]) { P.house[h].gb.C[k] = ys(0.3, 2, N0, 3 + k); P.house[h].gb.CX[k] = P.house[h].gb.C[k].map(v => 0.2 * v); } }), 'R2');
  put('the rows: item 4 unclear, each fix doing its part, reads R2 (R1 needs item 4 HELD)', rowAt(P => { closeAll(P); P.house.S362.ga.CXW[0] = ys(0.52, 1, N0, 240); }), 'R2');
  put('the rows: item 1 HELD, item 3 unclear, reads else', rowAt(P => { const h = P.house.S362; h.ga.CW[0] = h.ga.C[0].map(v => 0.6 * v); }), 'else');
  put('the rows: item 1 unclear reads else', rowAt(P => { const h = P.house.S130; h.gb.CX[0] = h.gb.C[0].map(v => 0.6 * v); }), 'else');
  put('the rows: item 6 does not decide a row (S370\'s order kept, the default otherwise)', rowAt(P => { P.s370.ga120[0] = P.s370.ga60[0].map(v => 0.9 * v); }), 'R2');
  // firstBand
  { const yrs = 4, mvA = Uint16Array.from([1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4]), mvB = Uint16Array.from([1, 2, 3, 5, 9, 2, 3, 4, 1, 2, 3, 4]);
    put('firstBand: a path differing first at year 3 with a two-year bridge reads the five years after', String(firstBand(mvA, mvB, yrs, 2, 0)), '2');
    put('firstBand: a path differing at the opening reads 0', String(firstBand(mvA, mvB, yrs, 2, 1)), '0');
    put('firstBand: a path with no difference reads -1', String(firstBand(mvA, mvB, yrs, 2, 2)), '-1');
    put('firstBand: a path differing first at the last bridge year reads the bridge', String(firstBand(mvA, mvB, yrs, 3, 0)), '1'); }
  // pOf: the wiring from the files
  { const perP = (h, a, k, x) => new Float64Array(N0).fill(({ GB: 1, GA: 2 })[x] * (k + 1) + ({ C: 0, CX: 10, CW: 20, CXW: 30 })[a] + ({ S130: 100, S126: 200, S362: 300, S128: 400 })[h]);
    const bitsF = (h, a, k) => bitsAt(RUNS[k] - (a === 'CW' ? 1 : 0)), wsF = (h, a, k) => new Float64Array(N0).fill(a === 'CX' ? 1 : 0);
    const tabs = Object.fromEntries(WH.map(h => [h, Object.fromEntries(['C', 'CX', 'CW', 'CXW'].map(a => [a, [10, 20, 30]]))])), s370P = (w, k, x) => new Float64Array(N0).fill(w === '60' ? 5 + k : 1 + k);
    const P = pOf(perP, bitsF, wsF, tabs, s370P);
    put('pOf: S362\'s CX GB in world 2 is its own', String(P.house.S362.gb.CX[2][0]), String(3 + 10 + 300));
    put('pOf: S128\'s CW GA in world 1 is its own', String(P.house.S128.ga.CW[1][0]), String(4 + 20 + 400));
    put('pOf: S128 carries C and CW only', Object.keys(P.house.S128.gb).join(','), 'C,CW');
    put('pOf: S370\'s GA at 60 and 120 points kept apart', `${P.s370.ga60[1][0]} ${P.s370.ga120[1][0]}`, '6 2');
    const it = items(P); put('pOf: item 5\'s CW leg on S130 reads CW\'s one lost path against C in every world', it['5'].legs[1].per[0].per.map(x => x.ex.d.toFixed(4)).join(' '), '-0.0250 -0.0250 -0.0250');
    put('pOf: item 5\'s CX leg reads no change in survival (CX\'s bits are C\'s)', it['5'].legs[0].per[0].per.map(x => x.ex.d.toFixed(4)).join(' '), '0.0000 0.0000 0.0000'); }
  // the gate on synthetic logs and files
  const enc = a => Buffer.from(Float64Array.from(a).buffer).toString('base64'), enc8 = a => Buffer.from(Uint8Array.from(a)).toString('base64'), enc16 = a => Buffer.from(Uint16Array.from(a).buffer).toString('base64');
  const npw = 4, DIM = 2, BR = [1, 2, 3];
  const mk = ([id, arm, pts0], over = {}) => {
    const pts = over.pts || pts0, at = over.at ?? pts, L = `${arm}/P${pts}S6Q5`, floor = over.floor ?? 104000, rule = over.rule ?? floor, copy = over.copy ?? COPY[arm], br = over.bridge || BR;
    const bitsW = [1, 1, 0, 1], mv = [1, 2, 65535, 1, 2, 3, 4, 65535], ws = [100, 99.5, -2, 100];
    const lines = [`stamp: code ${over.code || 'c1'} audit a1 prediction ${PRED} sha s1`, `COPY-B: the candidate's own unit, ${over.npw || npw} paths a world, wealth points divided by ${over.scale || 1} (seed ${over.seed || SEED}); 15 jobs; part 0/1`, `${(over.id || id).padEnd(16)} case | job ${L} | points ${at} | lambda 0.0223606797749979`,
      `solve CAND ${L}: table 50.0000 secs 10`, `ran CAND ${L}: bridgeRead reader bridgeStep exact readerSplit ${over.split || 'null'} readerCopy ${copy} readerBlend null readerRef ${over.ref || 'null'} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${at} grid total${at}x6x6 shareNodes ${over.nodes || 'none'} floor ${floor} line 0.5`,
      `reader ${L}: tables 72 unsupported 0 copied 10 copiedTop 5 nodes 100`, `nodes ${L}: the uniform six floor ${floor} (the product's rule ${rule})`, `checks ${L}: armTook 1/1`];
    if (!over.noRecount) lines.push(`recount ${L}: tables 72 copied ${over.recount ?? 10} (the solve's 72 and 10) line ${over.recLine ?? 0.5}`, `checks ${L}: copyTook ${over.copyTook ?? 1}/1`);
    lines.push(`openings ${L}: OWN ai 14 level 1 tiers 2,2`);
    for (let w = 0; w < 3; w++) lines.push(`tables ${L} ${w} z 0 weight 0.333333: OWN 50.000000 READ 50.000000`);
    lines.push(`bridge ${L}: reader years ${br.join(',')}`);
    const per = {}, bits = {}, moves = {}, states = {};
    for (let w = 0; w < 3; w++) {
      lines.push(`sim ${L} ${w} OWN ai 14: 3/${npw} bridge 3 bits ${sha16(Buffer.from(Uint8Array.from(bitsW)))} ${sha16(Buffer.from(Uint8Array.from(bitsW)))}`, `moves ${L} ${w}: path-years 6 sha ${sha16(Buffer.from(Uint16Array.from(mv).buffer))}`, `ledger ${L} ${w}: X 75 B0 75 T 0 GB 0 GA 0 GL 0 GD 0 ${br.map(t => `Y${t} 0`).join(' ')}`);
      if (!(over.noSplit && w === 2)) lines.push(`split ${L} ${w}: ${br.length ? br.map(t => PARTS.map(p => `${p}${t} 0`).join(' ')).join(' ') : 'none 0'}`);
      if (!(over.noYears && w === 1)) lines.push(`year ${L} ${w} 1: paths 4 G 0.000000 T 0.000000`);
      lines.push(`qf ${L} ${w}: paths ${Math.min(npw, NQF)} QF 0`, `whole ${L} ${w}: mean ${(ws.reduce((t, x) => t + x, 0) / npw).toFixed(6)} spending years 46 of 46 floor level 0.8 scale 1 cap 1 death charge 0`);
      for (const x of [...KEYS, ...br.flatMap(t => [`Y${t}`, ...PARTS.map(p => `${p}${t}`)])]) if (!(over.noQC && x === 'QC2')) per[`${x}${w}`] = enc([0, 0, 0, 0]);
      per[`WS${w}`] = enc(over.wsFile && w === 0 ? [0, 0, 0, 0] : ws); bits[`OWN${w}`] = enc8(bitsW); bits[`OWN${w}b`] = enc8(bitsW); moves[`MV${w}`] = enc16(mv);
      if (!(over.noStates && w === 0)) states[`S${w}`] = enc(new Array(npw * (over.fileBridge || br).length * DIM).fill(0));
    }
    lines.push(`checks ${L}: ownTook 12/12 identity ${3 * npw}/${3 * npw} qfTook 9/9 layerTook 9/9 scoreTook ${3 * npw}/${3 * npw} splitTook ${over.split2 ?? 24}/24 secs 1`, `clamped ${L}: 0 of 24 bridge-year reads at the reader's clamp (their split does not sum to the read)`, `file ${L}: ${id}-${arm}-${pts}.json.gz`);
    if (!over.notDone) lines.push(`done ${L}`);
    return { text: lines.join('\n'), file: [`${id}-${arm}-${pts}.json.gz`, { id: over.fileId || id, job: L, stamp: { code: over.code || 'c1', audit: 'a1', prediction: PRED, sha: 's1' }, NPW: npw, seed: 7002, own: 14, bridge: over.fileBridge || br, dim: DIM, per, bits, moves, states, tables: {} }] };
  };
  const at = (id, arm) => EXPECT.findIndex(x => x[0] === id && x[1] === arm);
  const gateOf = (overs = {}, extra = []) => { const all = EXPECT.map((x, i) => mk(x, overs[i] || {})), jobs = [...all, ...extra].flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); return gate(jobs, { npw, files }); };
  put('the gate passes the fifteen jobs as registered', gateOf().join('; '), '');
  const refuses = (what, overs, extra = []) => put(`the gate refuses ${what}`, String(gateOf(overs, extra).length > 0), 'true');
  refuses('a job run twice', {}, [mk(EXPECT[0])]);
  refuses('a job of another test beside them', {}, [mk(['S370', 'CXW', 120])]);
  refuses('S130\'s CX without its copy rule (the cxw plant\'s kind)', { [at('S130', 'CX')]: { copy: 'null' } });
  refuses('S362\'s CW with the copy rule', { [at('S362', 'CW')]: { copy: 'extrap' } });
  refuses('a job with the split', { [at('S126', 'C')]: { split: 'ru' } });
  refuses('a job with share nodes', { [at('S128', 'CW')]: { nodes: '0,0.2,0.4,0.6,0.8,1' } });
  refuses('a reader reference set', { [at('S130', 'C')]: { ref: 'order' } });
  refuses('S370 at 60 points, not 120', { [at('S370', 'CW')]: { pts: 60 } });
  refuses('another seed', { [at('S126', 'CXW')]: { seed: '7004' } });
  refuses('a header naming another path count', { [at('S362', 'C')]: { npw: 8 } });
  refuses('a job on another code', { [at('S128', 'C')]: { code: 'c2' } });
  refuses('a floor other than the product rule\'s', { [at('S362', 'CXW')]: { floor: 9000, rule: 35000 } });
  refuses('no recount of the copied nodes', { [at('S130', 'CXW')]: { noRecount: true } });
  refuses('a recount off the solve\'s count (the class plant)', { [at('S126', 'CW')]: { recount: 11, copyTook: 0 } });
  refuses('copyTook failed, its recount line right', { [at('S130', 'CX')]: { copyTook: 0 } });
  refuses('a recount off the solve\'s count, copyTook passed (a log at odds with itself)', { [at('S362', 'C')]: { recount: 11 } });
  refuses('a recount at another line', { [at('S128', 'C')]: { recLine: 0.6 } });
  refuses('splitTook short (the split plant)', { [at('S362', 'CW')]: { split2: 23 } });
  refuses('a world\'s split line missing', { [at('S130', 'CW')]: { noSplit: true } });
  refuses('a world\'s year lines missing', { [at('S126', 'CX')]: { noYears: true } });
  refuses('a file without world 0\'s saved states', { [at('S128', 'CW')]: { noStates: true } });
  refuses('a file whose whole scores are not the log\'s', { [at('S370', 'CW')]: { wsFile: true } });
  refuses('a file missing a bridge year\'s QC paths', { [at('S130', 'C')]: { noQC: true } });
  refuses('a job with no bridge year', { [at('S126', 'C')]: { bridge: [], fileBridge: [] } });
  refuses('a job whose bridge years are not its household\'s other jobs\'', { [at('S362', 'CX')]: { bridge: [1, 2], fileBridge: [1, 2] } });
  refuses('a file whose bridge years are not the log\'s', { [at('S130', 'CX')]: { fileBridge: [1, 2] } });
  refuses('a file of another household', { [at('S126', 'CW')]: { fileId: 'S128' } });
  refuses('a job with no done line', { [at('S362', 'CXW')]: { notDone: true } });
  { const all = EXPECT.map(x => mk(x, x[0] === 'S126' ? { bridge: [], fileBridge: [] } : {})), jobs = all.flatMap(x => parse(x.text)); put('the gate refuses a household with no bridge year on the logs alone', String(gate(jobs, { npw }).length > 0), 'true'); }
  { const all = EXPECT.map(x => mk(x, { at: ptsAt(x[2], 15), scale: 15 })), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate passes the preflight\'s jobs at a fifteenth of the points (labels at the registered points, the case lines at the scaled)', gate(jobs, { npw, scale: 15, files }).join('; '), ''); }
  { const all = EXPECT.map(x => mk(x, { scale: 15 })), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate refuses jobs at the registered points read as a fifteenth\'s', String(gate(jobs, { npw, scale: 15, files }).length > 0), 'true'); }
  { const all = EXPECT.slice(1).map(x => mk(x)), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate refuses a missing job', String(gate(jobs, { npw, files }).length > 0), 'true'); }
  // the reuse: COPY-W's CW against COPY-B's S370 job (synthetic COPY-W logs in COPY-W's own format)
  const mkW = (over = {}) => parseW(mk(['S370', 'CW', 60], over).text.replace(/^COPY-B:/m, 'COPY-W:'));
  const bJ = () => parse(mk(['S370', 'CW', 120]).text);
  put('the reuse passes COPY-W\'s CW on the same code, household, seed and paths', reuseGate(mkW(), bJ(), true).join('; '), '');
  put('the reuse refuses when COPY-W\'s gate failed', String(reuseGate(mkW(), bJ(), false).length > 0), 'true');
  put('the reuse refuses COPY-W\'s CW on other code', String(reuseGate(mkW({ code: 'c2' }), bJ(), true).length > 0), 'true');
  put('the reuse refuses COPY-W\'s CW on another seed', String(reuseGate(mkW({ seed: '7004' }), bJ(), true).length > 0), 'true');
  put('the reuse refuses COPY-W\'s CW with the copy rule', String(reuseGate(mkW({ copy: 'extrap' }), bJ(), true).length > 0), 'true');
  put('the reuse refuses COPY-W\'s CW on other bridge years', String(reuseGate(mkW({ bridge: [1, 2] }), bJ(), true).length > 0), 'true');
  put('the reuse refuses COPY-W\'s CW on another household', String(reuseGate(mkW({ id: 'S362' }), bJ(), true).length > 0), 'true');
  put('the reuse refuses a missing CW', String(reuseGate([], bJ(), true).length > 0), 'true');
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
  const DIR = args[0] || join(HERE, 'results', 'diagcopyb'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1), WDIR = args[3] || join(HERE, 'results', 'diagcopyw'), XDIR = args[4] || join(HERE, 'results', 'diagcopyx'), SAVED = args[5] || join(HERE, 'results', 'diagsteps370');
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const J = (h, a) => { const e = EXPECT.find(x => x[0] === h && x[1] === a); return jobs.find(x => x.key === keyOf(h, a, e[2])); }, FB = (h, a) => files[J(h, a).file];
  const perP = (h, a, k, x) => Float64Array.from(decRaw(FB(h, a).per[`${x}${k}`]), v => 100 * v);
  if (PRE) {
    console.log(`planted (${np_}): all read as they should`);
    console.log(`GATE: passed - the fifteen jobs once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}) on one code; the candidate's settings with no readerRef, the copy rule on CX and CXW alone, every self-check in full (the preflight: no reused cell compared)`);
    for (const [h, a] of EXPECT) { const j = J(h, a); console.log(`PREFLIGHT ${h} ${a}: bridge years ${j.bridge.join(',')}, world-0 GB ${f4(mean(perP(h, a, 0, 'GB')))} GA ${f4(mean(perP(h, a, 0, 'GA')))}, copied ${j.reader.copied}, clamped ${j.clamped.n} of ${j.clamped.of}, bridge failures by world ${[0, 1, 2].map(k => j.sims[`OWN${k}`].n - j.sims[`OWN${k}`].bridge).join(', ')}`); }
    console.log('PREFLIGHT: the gate and the files read; no figure read for an item (a preview at a fraction of the points; PREVIEW)'); process.exit(0);
  }
  // THE REUSE: COPY-W's reducer over its own files (its gate, its fair-test gate, its inert gate and COPY-X's reuse), then the
  // shared variables
  const wr = spawnSync('node', [join(HERE, 'reduce-copyw.mjs'), WDIR, String(npwA), '1', XDIR, SAVED], { encoding: 'utf8', maxBuffer: 1 << 26 }), wOut = wr.stdout || '';
  const wLogs = existsSync(WDIR) ? readdirSync(WDIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(WDIR, f), 'utf8')) : [];
  const wJobs = wLogs.flatMap(parseW), rbad = reuseGate(wJobs, jobs, wr.status === 0 && /^GATE: passed/m.test(wOut));
  if (rbad.length) { console.log(`GATE FAILED (the reuse, ${rbad.length}):\n  ${rbad.join('\n  ')}`); process.exit(1); }
  const cwW = wJobs.find(j => j.label === LABELS_W.CW), cwF = JSON.parse(gunzipSync(readFileSync(join(WDIR, cwW.file))).toString());
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the fifteen jobs once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}) on one code; the candidate's settings with no readerRef, the copy rule on CX and CXW alone, every self-check in full; the reuse: COPY-W's gate passed over ${WDIR} (with COPY-X's over ${XDIR}), and its CW shares COPY-B's code, household, seed, paths, bridge years and settings`);
  const bitsF = (h, a, k) => dec8(FB(h, a).bits[`OWN${k}`]), wsF = (h, a, k) => decRaw(FB(h, a).per[`WS${k}`]);
  const tabs = Object.fromEntries(WH.map(h => [h, Object.fromEntries((FACT.includes(h) ? ['C', 'CX', 'CW', 'CXW'] : ['C', 'CW']).map(a => [a, [0, 1, 2].map(k => J(h, a).tables[k].OWN)]))]));
  const s370P = (w, k, x) => Float64Array.from(decRaw((w === '60' ? cwF : FB('S370', 'CW')).per[`${x}${k}`]), v => 100 * v);
  const P = pOf(perP, bitsF, wsF, tabs, s370P), it = items(P), iv = x => `${f4(x.d ?? x.R)} (${f4(x.lo)} to ${f4(x.hi)})`;
  const hw = x => `world ${x.k}: survival ${f4(x.ex.d)} exact (${f4(x.ex.lo)} to ${f4(x.ex.hi)}) ${x.ex.outcome}, guarded unconditional (${f4(x.u.lo)} to ${f4(x.u.hi)}), whole score ${iv(x.w)}, margin ${f4(x.margin)}: ${x.harm ? 'harm' : x.ok ? 'no material harm' : 'inconclusive'}`;
  const rem = (it2, what) => { for (const x of it2.per) console.log(`     ${x.h} world ${x.k}: ${what} ${f4(x.r.mc)} points, removed ${iv(x.r)}: ${x.read}${it2 === it['3'] || it2 === it['6'] ? ` (against one half, the first-order expectation: ${x.r.lo >= HALF ? 'above' : x.r.hi < HALF ? 'below' : 'across'})` : ''}`); if (it2.nothing) console.log('     nothing to remove: no cell at the line'); else if (it2.skipped) console.log(`     ${it2.skipped} cells under the line, not read`); };
  console.log('\nCOPY-B: COPY-W\'s stage B, the copy x wealth factorial across the step households at the frozen candidate (predictions/diag-copyb.md)');
  console.log('\nTHE ITEMS (each read by its registered rule)');
  console.log(`1. the copy rule removes at least half of C's bridge part GB where it is a point or more (the factorial's households): ${it['1'].outcome}`); rem(it['1'], 'C\'s GB');
  console.log(`2. the interaction (CXW - CW) - (CX - C) in table less runs within half a point in every factorial household and world: ${it['2'].outcome}`);
  for (const x of it['2'].per) console.log(`     ${x.h} world ${x.k}: ${iv(x)} (tables ${f4(x.tab)}, runs ${f4(x.runs)}): ${x.read}`);
  console.log(`3. 60 points removes at least half of C's after-access part GA where it is half a point or more (the factorial's households and S128): ${it['3'].outcome}`); rem(it['3'], 'C\'s GA');
  console.log(`4. closure by part: the better cell's GB and GA each within half a point in every household and world: ${it['4'].outcome}`);
  for (const x of it['4'].per) { const s = J(x.h, x.arm).sims[`OWN${x.k}`]; console.log(`     ${x.h} ${x.arm} world ${x.k}: GB ${iv(x.gb)}, GA ${iv(x.ga)}: ${x.read}; reported beside: G ${f4(x.gb.d + x.ga.d)}, table less runs ${iv(closeOf(J(x.h, x.arm).tables[x.k].OWN, s.ok, s.n))}`); }
  console.log(`5. no material harm per world, each fix against the frozen candidate, by RULES.md section 8's rule as written: ${it['5'].outcome}`);
  for (const l of it['5'].legs) for (const x of l.per) for (const w of x.per) console.log(`     ${l.arm} against ${l.ctl} on ${x.h} ${hw(w)}`);
  console.log(`6. on S370, 120 points removes at least half of 60 points' after-access part GA where it is half a point or more: ${it['6'].outcome}`); rem(it['6'], 'CW at 60\'s GA');
  console.log(`OUTCOME: ${Object.keys(it).map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  console.log(`ROW: ${rowOf(it)}`);
  console.log('\nREPORTED');
  for (const h of [...WH, 'S370']) for (const a of (h === 'S370' ? ['CW'] : FACT.includes(h) ? ['C', 'CX', 'CW', 'CXW'] : ['C', 'CW'])) for (let k = 0; k < 3; k++) {
    const j = J(h, a), s = j.sims[`OWN${k}`], L = j.ledger[k], t = j.tables[k].OWN, by = j.bridge, nb = by.length, yr = j.years[k], band = (lo, hi) => { let g = 0; for (let y = lo; y <= hi && y < yr.length; y++) if (yr[y]) g += yr[y].G; return g; }, S = j.split[k];
    console.log(`  ${h} ${a} world ${k}: table ${f4(t)} runs ${s.ok}/${s.n} (${f4(100 * s.ok / s.n)}), table less runs ${f4(t - 100 * s.ok / s.n)}; GB ${f4(L.GB)} GA ${f4(L.GA)} T ${f4(L.T)} G ${f4(L.GB + L.GA)}; by bridge year ${by.map(y => `${y}: ${f4(L[`Y${y}`])}`).join(' | ')}; the sum of absolute residuals by year ${f4(by.reduce((t2, y) => t2 + Math.abs(L[`Y${y}`]), 0))}; G by band: the bridge ${f4(band(1, nb))}, the five years after ${f4(band(nb + 1, nb + 5))}, the rest ${f4(band(nb + 6, 999))}; copied weight at the bridge reads (QC + RC) ${f4(by.reduce((t2, y) => t2 + S[`QC${y}`] + S[`RC${y}`], 0))}; bridge failures ${s.n - s.bridge}`);
  }
  const bandsOf = (yr, nb) => { const b = (lo, hi) => { let g = 0; for (let y = lo; y <= hi && y < yr.length; y++) if (yr[y]) g += yr[y].G; return g; }; return [b(nb + 1, nb + 5), b(nb + 6, 999)]; };
  const bandLine = (what, yc, ya, nb) => { const c = bandsOf(yc, nb), a = bandsOf(ya, nb); return `  ${what}: GA by band (the five years after the bridge, the rest) ${c.map(f4).join(', ')} under the control, ${a.map(f4).join(', ')} under the arm; ${['the five years after', 'the rest'].map((n, i) => `${n} ${Math.abs(a[i]) > Math.abs(c[i]) ? 'RISES' : `removed ${f4(c[i] !== 0 ? (c[i] - a[i]) / c[i] : NaN)}`}`).join(', ')}`; };
  for (const h of WH) for (const [a, c] of FACT.includes(h) ? [['CW', 'C'], ['CXW', 'CX']] : [['CW', 'C']]) for (let k = 0; k < 3; k++) console.log(bandLine(`${h} ${a} against ${c} world ${k}`, J(h, c).years[k], J(h, a).years[k], J(h, a).bridge.length));
  { const yW = k => { const m = new RegExp(`^\\s+year ${LABELS_W.CW.replace(/[/]/g, '\\/')} ${k} (\\d+): paths \\S+ G (\\S+) T`, 'gm'), out = []; for (const t of wLogs) for (const x of t.matchAll(m)) out[Number(x[1])] = { G: Number(x[2]) }; return out; };
    for (let k = 0; k < 3; k++) console.log(bandLine(`S370 CW at 120 against COPY-W's CW at 60 world ${k}`, yW(k), J('S370', 'CW').years[k], J('S370', 'CW').bridge.length)); }
  { const y456 = (a, k) => { const y4 = perP('S362', a, k, 'Y4'), y5 = perP('S362', a, k, 'Y5'), y6 = perP('S362', a, k, 'Y6'); return Float64Array.from(y4, (v, i) => v + y5[i] + y6[i]); };
    for (const [a, c] of [['CW', 'C'], ['CXW', 'CX']]) for (let k = 0; k < 3; k++) { const r = removal(y456(c, k), y456(a, k)); console.log(`  S362 ${a} against ${c} world ${k}: the years-4-6 residual ${f4(r.mc)} points under the control, removed ${iv(r)} (against three quarters and a quarter: ${!(Math.abs(r.mc) >= MINGA) ? 'under half a point, not read' : r.lo >= THREEQ ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear'})`); } }
  for (const [arm, ctl, hs] of LEGS) for (const h of hs) for (let k = 0; k < 3; k++) {
    const fa = FB(h, arm), fc = FB(h, ctl), ma = dec16(fa.moves[`MV${k}`]), mc = dec16(fc.moves[`MV${k}`]), ba = bitsF(h, arm, k), bc = bitsF(h, ctl, k), yrs = fa.years, nb = fa.bridge.length, sv = [0, 0, 0, 0], ls = [0, 0, 0, 0];
    for (let i = 0; i < ba.length; i++) { if (ba[i] === bc[i]) continue; const b = firstBand(ma, mc, yrs, nb, i); if (b < 0) continue; if (ba[i]) sv[b]++; else ls[b]++; }
    console.log(`  ${arm} against ${ctl} on ${h} world ${k}: saved ${sv.join('/')} and lost ${ls.join('/')} by the band their moves first differ (the opening / the bridge / the five years after / the rest)`);
  }
  for (const [h, a] of EXPECT) { const j = J(h, a); console.log(`  ${h} ${a}: copied ${j.reader.copied} copiedTop ${j.reader.copiedTop} of ${j.reader.nodes} nodes; reads at the clamp ${j.clamped.n} of ${j.clamped.of}; solve ${j.solve.secs} s`); }
  for (let k = 0; k < 3; k++) { const L = cwW.ledger[k]; console.log(`  S370 CW (60 points, COPY-W's, reused) world ${k}: GB ${f4(L.GB)} GA ${f4(L.GA)} T ${f4(L.T)}`); }
}
