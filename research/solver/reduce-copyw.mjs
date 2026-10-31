/*
 * COPY-W'S REDUCER, STAGE A (PLAN.md COPY-W, items/COPY-W.md; predictions/diag-copyw.md; the deep review after COPY-X,
 * deep-review-log.md 19 Oct 09:44 UK; family W, O187; the maintainer's decision of 19 Oct 09:26 UK: each fix against the frozen
 * candidate, a factorial where fixes interact). The copy x wealth factorial on S370, seed 7002, the first 4,000 paths a world:
 * C and CX at 30 wealth points (COPY-X's saved files, results/diagcopyx, read behind COPY-X's own gate, reduce-copyx.mjs) and
 * CW and CXW at 60 (audit-copyw.mjs, results/diagcopyw). Its gate: the fair-test gate on COPY-W's logs; the jobs once and done at
 * the registered settings with every self-check in full; CW reproducing STEP-S370's saved W60 bit for bit (the same candidate at
 * 60 points); THE REUSE (a new test of old files, CHECKLIST item 3): COPY-X's reducer passes its gate over results/diagcopyx, and
 * COPY-X's C and CX are on the code, household, seed and paths of COPY-W's jobs (their stamps' code hash the same; the shared
 * settings the same). THE ITEMS, each with three outcomes:
 *   1: CXW removes at least half of CX's world-1 residual at bridge years 4 to 6 (Y4 + Y5 + Y6), path by path: the removal
 *      sum(CX - CXW) / sum(CX) with its 95% interval by the delta method; HELD when the interval lies at or above one half,
 *      FALSIFIED when below a quarter, otherwise INCONCLUSIVE; INCONCLUSIVE too when CX's mean there is under a point in size.
 *   2: CXW's world-1 grid residual within a point: G = GB + GA per path (the table less runs less T, the quadrature's and the
 *      paths' noise: the part the two fixes act on), its mean's 95% interval; HELD when the interval lies within [-1, 1],
 *      FALSIFIED when it lies wholly outside, otherwise INCONCLUSIVE. (The table less runs itself, beside it, carries the runs'
 *      binomial noise, whose 95% half-width at 4,000 paths is about 1.05 points in world 1 and 1.5 in world 0, wider than the
 *      band: reported with its interval, not an item.)
 *   3: CXW's world-0 grid residual within a point, as item 2.
 *   4: the interaction (CXW - CW) - (CX - C) in table less runs, per world: the tables fixed, the runs paired by path (each
 *      path's b_CXW - b_CW - b_CX + b_C), its 95% interval; a world reads additive when the interval lies within half a point,
 *      interacting when wholly outside it; HELD when every world reads additive, FALSIFIED when any interacts, otherwise
 *      INCONCLUSIVE.
 *   5: no material harm per world, CXW against CX (the wealth fix on the copy rule's arm), by RULES.md section 8's rule as
 *      written (COPY-X's harmWorlds: the exact conditional rule at the relative margin with Holm across the three worlds, the
 *      guarded unconditional interval, the whole score's normal interval); HELD when it reads no material harm in every world,
 *      FALSIFIED when it reads harm in any world, otherwise INCONCLUSIVE. CW against C is reported, not an item: CW is
 *      STEP-S370's W60 bit for bit, so that leg is known from the records before the run (derive-copyw.mjs section 1).
 * THE ROWS (the plan-auditor's BLOCKING 2 of 19 Oct 11:20 UK): R5 item 5 FALSIFIED (the wealth fix harms the copy rule's arm);
 *   R1 items 2 and 3 HELD (the two fixes together close S370 within a point in worlds 0 and 1); R4 item 1 HELD with item 2
 *   FALSIFIED, or item 1's removal wholly above OVER (one and a half): the fall at years 4 to 6 moved or over-corrected (WHOLE),
 *   not removed; R2 item 1 HELD with item 2 not FALSIFIED (the wealth axis carries world 1's years 4 to 6 under the copy rule,
 *   world 1's whole with it); R3 item 1 FALSIFIED: the copy rule and 60 points interact at world 1's years 4 to 6 (CW's own
 *   removal of C's there is known from the records, 0.80, so this row reads the interaction, never 'the axis does not carry
 *   it'); else.
 * REPORTED: every arm's tables against its runs by world; GB, GA, T and the residual by year by world; the sum of absolute
 *   residuals by year (the cancellation guard); the four-way split by year; the copied nodes; the reads at the clamp; each
 *   world's interaction in runs; the solves' seconds.
 *   node research/solver/reduce-copyw.mjs [dir] [paths a world] [scale] [COPY-X dir] [STEP-S370 dir] [--preflight] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { mcnemarHarmP, holm, outcome, marginRel, survivalChangeU, zFor } from './stats.mjs';
import { guarded } from './reduce-7aa.mjs';
import { sha16 } from './reduce-ao.mjs';
import { spawnSync } from 'node:child_process';
import { cellsOf, wsOf, share, harmWorlds, parse as parseX, LABELS as LABELS_X } from './reduce-copyx.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-copyw.md';
export const HOUSE = 'S370', SEED = '7002', NPW = 4000, NQF = 1000;
export const NODES_SN = Object.freeze([0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1]);
export const HALF = 0.5, QUARTER = 0.25, MINRES = 1, CLOSE = 1, INTER = 0.5, OVER = 1.5;
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const ARMS = ['CW', 'CXW'];
export const PTS = Object.freeze({ CW: 60, CXW: 60 });
export const SPLIT = Object.freeze({ CW: 'null', CXW: 'null' });
export const COPY = Object.freeze({ CW: 'null', CXW: 'extrap' });
export const NODED = Object.freeze({ CW: false, CXW: false });
// the factorial's reused cells: COPY-X's C and CX (results/diagcopyx), read behind COPY-X's own gate
export const REUSED = Object.freeze(['C', 'CX']);
export const LABELS = Object.freeze(Object.fromEntries(ARMS.map(a => [a, `${a}/P${PTS[a]}S6Q5`])));
export const YEARS = Object.freeze([3, 5, 7]);
export const PARTS = Object.freeze(['QS', 'QC', 'RS', 'RC']);
// the arm whose file must reproduce STEP-S370's saved W60 (results/diagsteps370: the candidate at 60 points, the copy rule
// off), and the quantities compared
export const INERT = Object.freeze({ CW: 'S370-W60-P60S6Q5.json.gz' });
export const INERT_PER = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD', 'WS', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7'];
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S\d+)\s+case \| job ((CW|CXW)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^COPY-W: .*?, (\d+) paths a world.*?, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts: Number(c[6]), stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, checks: {}, tables: [], sims: {}, moves: [], ledger: [], split: [], qf: [], whole: [], nodes: null, reader: null, recount: null, clamped: null, bridge: null, own: null, solve: null, ran: null, file: null, done: false };
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
// INERT: CW's file against STEP-S370's saved W60, bit for bit; the differences found
export function inertOf(f, s) {
  const bad = [];
  if (!s) return ['no saved STEP-S370 file to compare'];
  if (f.NPW !== s.NPW || f.seed !== s.seed) bad.push(`not on the saved run's paths (${f.NPW} a world, seed ${f.seed} against ${s.NPW}, ${s.seed})`);
  for (let w = 0; w < 3; w++) {
    for (const x of INERT_PER) { const a = f.per && f.per[`${x}${w}`], b = s.per && s.per[`${x}${w}`]; if (!a || !b || a !== b) bad.push(`${x}${w}`); }
    for (const x of [`OWN${w}`, `OWN${w}b`]) { const a = f.bits && f.bits[x], b = s.bits && s.bits[x]; if (!a || !b || a !== b) bad.push(x); }
    const a = f.moves && f.moves[`MV${w}`], b = s.moves && s.moves[`MV${w}`]; if (!a || !b || a !== b) bad.push(`MV${w}`);
  }
  return bad;
}
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null, saved = null } = {}) {
  const bad = [];
  for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(`a job that is not COPY-W's: ${x.label}`);
  for (const [arm, label] of Object.entries(LABELS)) {
    const js = jobs.filter(x => x.label === label);
    if (js.length !== 1) { bad.push(`${arm}: ${js.length ? `run ${js.length} times` : 'missing'}`); continue; }
    const j = js[0], pts = Math.max(4, Math.round(PTS[arm] / scale)), sn = NODED[arm];
    if (j.id !== HOUSE) bad.push(`${arm}: run on ${j.id}, not ${HOUSE}`);
    if (!j.done) bad.push(`${arm}: no done line`);
    if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push(`${arm}: no stamp`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${arm}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${arm}: solved at ${j.pts} points, not ${pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, readerSplit: SPLIT[arm], readerCopy: COPY[arm], pts: String(pts), grid: `total${pts}x${sn ? NODES_SN.length : 6}x6`, shareNodes: sn ? NODES_SN.join(',') : 'none' })) if (field(ran, f) !== v) bad.push(`${arm}: ${f} is ${field(ran, f)}, not ${v}`);
    if (!j.nodes || j.nodes.floor !== j.nodes.rule || field(ran, 'floor') !== String(j.nodes.floor)) bad.push(`${arm}: its floor is not the product's rule's`);
    if (!j.nodes || j.nodes.list !== (sn ? NODES_SN.join(',') : 'the uniform six')) bad.push(`${arm}: its share nodes are not ${sn ? 'NODES_SN' : 'the uniform six'}`);
    for (const c of NEED) { const x = j.checks[c]; if (!x || !(x[1] > 0) || x[0] !== x[1] || ((c === 'armTook' || c === 'copyTook') && x[1] !== 1)) bad.push(`${arm}: ${c} did not pass in full`); }
    if (!j.own) bad.push(`${arm}: no openings line`);
    if (!j.solve) bad.push(`${arm}: no solve line`);
    if (!j.reader) bad.push(`${arm}: no reader line`);
    if (!j.recount || !j.reader || j.recount.copied !== j.reader.copied || j.recount.tables !== j.reader.tables || j.recount.line !== 0.5) bad.push(`${arm}: the copied nodes were not recounted at the support line to the solve's count`);
    if (!j.clamped || j.checks.splitTook && j.clamped.of !== j.checks.splitTook[1]) bad.push(`${arm}: no count of the reads at the clamp over the split's reads`);
    if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push(`${arm}: the identity was not held on every path of three worlds`);
    if (j.checks.scoreTook && j.checks.scoreTook[1] !== 3 * npw) bad.push(`${arm}: the whole score was not checked on every path of three worlds`);
    if (!j.bridge || YEARS.some(t => !j.bridge.includes(t))) bad.push(`${arm}: the bridge years do not hold years ${YEARS.join(' and ')}`);
    for (let w = 0; w < 3; w++) {
      const t = j.tables[w]; if (!t || !Number.isFinite(t.OWN) || !Number.isFinite(t.READ)) bad.push(`${arm}: world ${w}'s tables are missing`);
      const s = j.sims[`OWN${w}`]; if (!s || s.n !== npw || (j.own && s.ai !== j.own.ai)) bad.push(`${arm}: no OWN run of ${npw} paths at its opening in world ${w}`);
      if (!j.ledger[w] || [...KEYS, ...(j.bridge || []).map(t => `Y${t}`)].some(x => !Number.isFinite(j.ledger[w][x]))) bad.push(`${arm}: world ${w}'s ledger line is missing or short`);
      if (!j.split[w] || (j.bridge || []).some(t => PARTS.some(p => !Number.isFinite(j.split[w][`${p}${t}`])))) bad.push(`${arm}: world ${w}'s split line is missing or short`);
      if (!j.qf[w] || j.qf[w].n !== Math.min(npw, NQF)) bad.push(`${arm}: world ${w}'s QF line is missing`);
      if (!j.moves[w] || !(j.moves[w].py >= npw)) bad.push(`${arm}: world ${w}'s moves line is missing or short`);
      if (!j.whole[w] || !Number.isFinite(j.whole[w].mean)) bad.push(`${arm}: world ${w}'s whole score line is missing`);
    }
    if (files) {
      const f = j.file && files[j.file];
      if (!f) { bad.push(`${arm}: its file ${j.file} is missing`); continue; }
      if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${arm}: its file is stamped by other code`);
      if (f.NPW !== npw) bad.push(`${arm}: its file is not on ${npw} paths a world`);
      for (const [nm, s] of Object.entries(j.sims)) for (const [b, sh] of [[nm, s.bits], [`${nm}b`, s.bitsB]]) { const x = f.bits && f.bits[b]; if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(`${arm}: its file's ${b} bits are not the log's`); }
      const nb = (f.bridge || []).length;
      for (let w = 0; w < 3; w++) {
        for (const x of [...KEYS, 'WS', ...YEARS.flatMap(t => [`Y${t}`, ...PARTS.map(p => `${p}${t}`)])]) { const a = f.per && f.per[`${x}${w}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`${arm}: its file's ${x}${w} paths are not ${npw}`); }
        const st = f.states && f.states[`S${w}`]; if (!st || !(f.dim > 0) || !(nb > 0) || Buffer.from(st, 'base64').length !== 8 * npw * nb * f.dim) bad.push(`${arm}: its file's world-${w} saved states are missing or short`);
        const ws = f.per && f.per[`WS${w}`]; if (ws && j.whole[w] && Math.abs(decRaw(ws).reduce((t, x) => t + x, 0) / npw - j.whole[w].mean) > 1e-5) bad.push(`${arm}: its file's world-${w} whole scores are not the log's`);
        const mv = f.moves && f.moves[`MV${w}`]; if (!mv || !j.moves[w] || sha16(Buffer.from(mv, 'base64')) !== j.moves[w].sha) bad.push(`${arm}: its file's world-${w} moves are not the log's`);
      }
      if (saved && INERT[arm]) { const d = inertOf(f, saved[INERT[arm]]); if (d.length) bad.push(`${arm}: does not reproduce STEP-S370's saved W60 (the same candidate at 60 points): ${d.slice(0, 6).join(', ')}${d.length > 6 ? ` and ${d.length - 6} more` : ''}`); }
    }
  }
  return bad;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));

// THE REUSE: COPY-X's C and CX against COPY-W's jobs, the variables they must share; xOk is COPY-X's own gate over its files
export function reuseGate(xJobs, wJobs, xOk) {
  const bad = [];
  if (!xOk) bad.push('COPY-X\'s gate did not pass over its own files (reduce-copyx.mjs)');
  const xs = REUSED.map(a => xJobs.find(j => j.label === LABELS_X[a]));
  if (xs.some(j => !j)) { bad.push(`COPY-X's ${REUSED.join(' and ')} not all found`); return bad; }
  const all = [...xs, ...wJobs];
  const codes = new Set(all.map(j => j.stamp && j.stamp.code));
  if (codes.size !== 1 || codes.has(undefined) || codes.has(null)) bad.push(`the reused cells and COPY-W's jobs are on different code (${[...codes].join(', ')})`);
  for (const j of all) {
    if (j.id !== HOUSE) bad.push(`${j.label}: on ${j.id}, not ${HOUSE}`);
    if (!j.head || j.head.seed !== SEED) bad.push(`${j.label}: not on seed ${SEED}`);
    if (!j.head || j.head.npw !== (wJobs[0] && wJobs[0].head ? wJobs[0].head.npw : NPW)) bad.push(`${j.label}: not on the same paths a world`);
    for (const f of Object.keys(COMMON)) if (field(j.ran || '', f) !== COMMON[f]) bad.push(`${j.label}: ${f} is ${field(j.ran || '', f)}, not ${COMMON[f]}`);
    if (field(j.ran || '', 'readerSplit') !== 'null' || field(j.ran || '', 'shareNodes') !== 'none') bad.push(`${j.label}: a reader split or explicit share nodes`);
  }
  return bad;
}

// a removal with its sign: the share of the control's residual the arm removes, path by path, where the control's mean may be
// negative (an under-read); 'nothing' when the control's mean is under a point in size
export const ratioItem = r => { const nothing = !(Math.abs(r.mc) >= MINRES); return { outcome: nothing || !Number.isFinite(r.R) ? 'INCONCLUSIVE' : r.lo >= HALF ? 'HELD' : r.hi < QUARTER ? 'FALSIFIED' : 'INCONCLUSIVE', r, nothing }; };
// a world's table less runs, the table fixed and the runs' binomial interval at 95% (reported)
export function closeOf(table, ok, n, z = zFor(0.05)) { const p = ok / n, d = table - 100 * p, se = 100 * Math.sqrt(Math.max(0, p * (1 - p)) / n); return { d, lo: d - z * se, hi: d + z * se }; }
// a per-path residual's mean with its normal interval at 95% (the grid residual G = GB + GA, points)
export function meanOf(g, z = zFor(0.05)) { const n = g.length; let s = 0; for (const x of g) s += x; const m = s / n; let v = 0; for (const x of g) v += (x - m) ** 2; const se = Math.sqrt(v / Math.max(1, n - 1) / n); return { d: m, lo: m - z * se, hi: m + z * se }; }
export const closeItem = c => ({ outcome: c.lo >= -CLOSE && c.hi <= CLOSE ? 'HELD' : c.hi < -CLOSE || c.lo > CLOSE ? 'FALSIFIED' : 'INCONCLUSIVE', c });
// the interaction in table less runs per world: T = { C, CX, CW, CXW } the tables, b = the same arms' paired survival bits
export function interOf(T, b, z = zFor(0.05)) {
  const n = b.C.length; let s = 0; const v = new Float64Array(n);
  for (let i = 0; i < n; i++) { v[i] = b.CXW[i] - b.CW[i] - b.CX[i] + b.C[i]; s += v[i]; }
  const m = s / n; let q = 0; for (let i = 0; i < n; i++) q += (v[i] - m) ** 2;
  const se = 100 * Math.sqrt(q / Math.max(1, n - 1) / n), tab = T.CXW - T.CW - T.CX + T.C, d = tab - 100 * m;
  return { d, lo: d - z * se, hi: d + z * se, tab, runs: 100 * m };
}
const interWorld = x => (x.lo >= -INTER && x.hi <= INTER ? 'additive' : x.hi < -INTER || x.lo > INTER ? 'interacting' : 'unclear');
/* P: { y456: { CX, CXW }: world 1's Y4 + Y5 + Y6 per path in points; g: { CXW }: [3] CXW's GB + GA per path in points; tab: { C, CX, CW, CXW }: [3] the tables; bits: { C, CX,
   CW, CXW }: [3] the survival bits; cells: { CW, CXW }: [3] the control (C for CW, CX for CXW) against the arm; ws: { CW,
   CXW }: [3] the arm less its control } */
export function items(P) {
  const out = {};
  out['1'] = ratioItem(share(P.y456.CX, Float64Array.from(P.y456.CX, (v, i) => v - P.y456.CXW[i])));
  out['2'] = closeItem(meanOf(P.g.CXW[1])); out['3'] = closeItem(meanOf(P.g.CXW[0]));
  const per = [0, 1, 2].map(k => { const x = interOf({ C: P.tab.C[k], CX: P.tab.CX[k], CW: P.tab.CW[k], CXW: P.tab.CXW[k] }, { C: P.bits.C[k], CX: P.bits.CX[k], CW: P.bits.CW[k], CXW: P.bits.CXW[k] }); return { k, ...x, read: interWorld(x) }; });
  out['4'] = { outcome: per.some(x => x.read === 'interacting') ? 'FALSIFIED' : per.every(x => x.read === 'additive') ? 'HELD' : 'INCONCLUSIVE', per };
  const hw = harmWorlds(P.cells.CW, P.ws.CW), hx = harmWorlds(P.cells.CXW, P.ws.CXW);
  out['5'] = { outcome: hx.outcome, hw, hx };
  return out;
}
export function rowOf(it) {
  const o = i => it[i].outcome;
  if (o('5') === 'FALSIFIED') return 'R5';
  if (o('2') === 'HELD' && o('3') === 'HELD') return 'R1';
  if (o('1') === 'HELD' && (o('2') === 'FALSIFIED' || it['1'].r.lo > OVER)) return 'R4';
  if (o('1') === 'HELD') return 'R2';
  if (o('1') === 'FALSIFIED') return 'R3';
  return 'else';
}
// the items' input from the four cells' files (perP(arm, world, key) in points, bitsF(arm, world), wsF(arm, world), tabs[arm][k])
export const pOf = (perP, bitsF, wsF, tabs) => {
  const y456 = a => { const y4 = perP(a, 1, 'Y4'), y5 = perP(a, 1, 'Y5'), y6 = perP(a, 1, 'Y6'); return Float64Array.from(y4, (v, i) => v + y5[i] + y6[i]); };
  const K = [0, 1, 2], A4 = ['C', 'CX', 'CW', 'CXW'];
  const g = a => K.map(k => { const gb = perP(a, k, 'GB'), ga = perP(a, k, 'GA'); return Float64Array.from(gb, (v, i) => v + ga[i]); });
  return { y456: { CX: y456('CX'), CXW: y456('CXW') }, g: { CXW: g('CXW') }, tab: Object.fromEntries(A4.map(a => [a, K.map(k => tabs[a][k])])), bits: Object.fromEntries(A4.map(a => [a, K.map(k => bitsF(a, k))])),
    cells: { CW: K.map(k => cellsOf(bitsF('C', k), bitsF('CW', k))), CXW: K.map(k => cellsOf(bitsF('CX', k), bitsF('CXW', k))) }, ws: { CW: K.map(k => wsOf(wsF('C', k), wsF('CW', k))), CXW: K.map(k => wsOf(wsF('CX', k), wsF('CXW', k))) } };
};

// THE PLANTED CHECKS: each item to each outcome on a case built for it, the rows, the gate's refusals, the reuse's, the EDGES
export const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
const N0 = 4000;
const ys = (m, sd, n = N0, seed = 7) => { let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; return Float64Array.from({ length: n }, () => m + sd * Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r())); };
const cellsAt = (s, lost, saved) => { const al = Math.round(s / 100 * N0); return { a: al - lost, b: lost, c: saved, d: N0 - al - saved }; };
// survival bits with `ok` survivors, the first `shift` of the survivors' places moved to the end (paired paths that disagree)
const bitsAt = (ok, shift = 0) => Uint8Array.from({ length: N0 }, (_, i) => (i < ok - shift || (shift > 0 && i >= N0 - shift) ? 1 : 0));
const RUNS = [1600, 3472, 3959];
const P0 = () => {
  const CX = ys(-1.75, 3), K = [0, 1, 2];
  const tabOf = d => K.map(k => 100 * RUNS[k] / N0 + d[k]);
  return { y456: { CX, CXW: CX.map(v => 0.2 * v) }, g: { CXW: [ys(0.9, 4.5, N0, 21), ys(-0.7, 3, N0, 23), ys(-0.5, 1, N0, 25)] }, tab: { C: tabOf([9, 1.1, -0.7]), CX: tabOf([2.5, -1.8, -1.2]), CW: tabOf([7.4, 2.2, 0]), CXW: tabOf([0.9, -0.7, -0.5]) },
    bits: Object.fromEntries(['C', 'CX', 'CW', 'CXW'].map(a => [a, K.map(k => bitsAt(RUNS[k]))])),
    cells: { CW: [cellsAt(40, 10, 10), cellsAt(86.8, 10, 10), cellsAt(99, 5, 5)], CXW: [cellsAt(40, 10, 10), cellsAt(86.8, 10, 10), cellsAt(99, 5, 5)] },
    ws: { CW: K.map(() => ({ d: 0, se: 0.05 })), CXW: K.map(() => ({ d: 0, se: 0.05 })) } };
};
function planted() {
  const cases = [], put = (what, got, want) => cases.push([what, got, want]);
  const run = (what, edit, i, want, edge) => { const P = P0(); edit(P); const it = items(P); REACHED[i].add(it[i].outcome); put(`${what}: ${i} ${want}`, it[i].outcome, want); if (edge) EDGES.push(edge); };
  // item 1: the removal of an under-read (CX's mean negative)
  run('CXW removes eight tenths of CX\'s world-1 years-4-6 under-read', () => {}, '1', 'HELD');
  run('CXW removes a tenth', P => { P.y456.CXW = P.y456.CX.map(v => 0.9 * v); }, '1', 'FALSIFIED');
  run('CXW removes four tenths', P => { P.y456.CXW = P.y456.CX.map(v => 0.6 * v); }, '1', 'INCONCLUSIVE');
  run('CXW turns the under-read into an over-read of the same size (removes 2)', P => { P.y456.CXW = P.y456.CX.map(v => -v); }, '1', 'HELD');
  run('CXW deepens the under-read (a negative removal)', P => { P.y456.CXW = P.y456.CX.map(v => 1.3 * v); }, '1', 'FALSIFIED');
  run('CX\'s mean there under a point in size (nothing to remove)', P => { P.y456.CX = P.y456.CX.map(v => 0.3 * v); P.y456.CXW = P.y456.CX.map(() => 0); }, '1', 'INCONCLUSIVE', 'CX\'s world-1 years-4-6 mean under a point in size: nothing to remove');
  run('CXW removes exactly half with no spread (the line itself)', P => { P.y456.CX = new Float64Array(N0).fill(-2); P.y456.CXW = new Float64Array(N0).fill(-1); }, '1', 'HELD', 'a removal exactly at one half with no spread reads HELD');
  run('CXW removes 0.15 with spread, its interval reaching a quarter', P => { const e = ys(0, 40, N0, 99), me = e.reduce((t, x) => t + x, 0) / N0; P.y456.CXW = P.y456.CX.map((v, i) => 0.85 * v + e[i] - me); }, '1', 'INCONCLUSIVE');
  run('CXW removes 0.55 with spread, its interval below a half', P => { const e = ys(0, 40, N0, 99), me = e.reduce((t, x) => t + x, 0) / N0; P.y456.CXW = P.y456.CX.map((v, i) => 0.45 * v + e[i] - me); }, '1', 'INCONCLUSIVE');
  // items 2 and 3: closure within a point, the table fixed and the runs' interval
  run('CXW\'s world-1 grid residual 0.7 under', () => {}, '2', 'HELD');
  run('CXW\'s world-1 grid residual 2 points under', P => { P.g.CXW[1] = ys(-2, 3, N0, 23); }, '2', 'FALSIFIED');
  run('CXW\'s world-1 grid residual 1 under with spread (its interval across the line)', P => { P.g.CXW[1] = ys(-1, 3, N0, 23); }, '2', 'INCONCLUSIVE');
  run('CXW\'s world-1 grid residual exactly a point under with no spread (the line itself)', P => { P.g.CXW[1] = new Float64Array(N0).fill(-1); }, '2', 'HELD', 'a residual exactly at minus a point with no spread reads HELD');
  run('CXW\'s world-1 grid residual 1.5 over', P => { P.g.CXW[1] = ys(1.5, 3, N0, 23); }, '2', 'FALSIFIED');
  run('CXW\'s world-0 grid residual 0.9 over with spread 4.5', () => {}, '3', 'INCONCLUSIVE', 'a world-0 residual of 0.9 whose interval crosses a point');
  run('CXW\'s world-0 grid residual 0.2 over', P => { P.g.CXW[0] = ys(0.2, 4.5, N0, 21); }, '3', 'HELD');
  run('CXW\'s world-0 grid residual 3 over', P => { P.g.CXW[0] = ys(3, 4.5, N0, 21); }, '3', 'FALSIFIED');
  run('CXW\'s world-0 grid residual 3 under', P => { P.g.CXW[0] = ys(-3, 4.5, N0, 21); }, '3', 'FALSIFIED');
  run('the table less runs far out though the grid residual is in (the runs\' noise is not the item)', P => { P.tab.CXW[0] = 100 * RUNS[0] / N0 + 3; P.g.CXW[0] = ys(0.2, 4.5, N0, 21); }, '3', 'HELD');
  // item 4: the interaction per world
  run('the two fixes additive in every world (the tables\' interaction within 0.1)', P => { P.tab.CXW = [0, 1, 2].map(k => P.tab.CX[k] + P.tab.CW[k] - P.tab.C[k] + 0.1); }, '4', 'HELD');
  run('the copy rule moves world 0 by 1 point less at 60 points (interacting)', P => { P.tab.CXW = [0, 1, 2].map(k => P.tab.CX[k] + P.tab.CW[k] - P.tab.C[k] + (k === 0 ? 1 : 0)); }, '4', 'FALSIFIED');
  run('world 1\'s interaction 0.4 with discordant runs (its interval across half a point)', P => { P.tab.CXW = [0, 1, 2].map(k => P.tab.CX[k] + P.tab.CW[k] - P.tab.C[k] + (k === 1 ? 0.4 : 0)); P.bits.CXW[1] = bitsAt(RUNS[1], 60); P.bits.CW[1] = bitsAt(RUNS[1], 30); }, '4', 'INCONCLUSIVE', 'a world\'s interaction interval across half a point');
  run('the interaction sits in the runs, not the tables (CXW saves 60 more paths in world 0 than additive)', P => { P.tab.CXW = [0, 1, 2].map(k => P.tab.CX[k] + P.tab.CW[k] - P.tab.C[k]); P.bits.CXW[0] = bitsAt(RUNS[0] + 60); }, '4', 'FALSIFIED');
  // item 5: no material harm, each fix against its own control
  run('both fixes at their controls in every world', () => {}, '5', 'HELD');
  run('CXW loses 60 paths against CX in world 0', P => { P.cells.CXW[0] = cellsAt(40, 70, 10); }, '5', 'FALSIFIED');
  run('CW loses 60 paths against C in world 0 (reported, not the item)', P => { P.cells.CW[0] = cellsAt(40, 70, 10); }, '5', 'HELD', 'CW\'s leg against C does not decide item 5 (known from the records)');
  run('CXW\'s whole score 1 point down in world 2 alone', P => { P.ws.CXW[2] = { d: -1, se: 0.05 }; }, '5', 'FALSIFIED');
  run('CXW loses 15 paths net in world 1 (its interval across the margin)', P => { P.cells.CXW[1] = cellsAt(86.8, 25, 10); }, '5', 'INCONCLUSIVE');
  // the rows
  { const P = P0(); P.g.CXW[0] = ys(0.2, 4.5, N0, 21); put('the rows: worlds 0 and 1 within a point, reads R1', rowOf(items(P)), 'R1'); }
  { const P = P0(); P.g.CXW[0] = ys(0.2, 4.5, N0, 21); P.cells.CXW[0] = cellsAt(40, 70, 10); put('the rows: CXW harms, reads R5 over R1', rowOf(items(P)), 'R5'); }
  { const P = P0(); put('the rows: years 4-6 removed, world 0 unclear, reads R2', rowOf(items(P)), 'R2'); }
  { const P = P0(); P.y456.CXW = P.y456.CX.map(v => 0.9 * v); P.g.CXW[1] = ys(-2, 3, N0, 23); put('the rows: the axis carries none of it, reads R3', rowOf(items(P)), 'R3'); }
  { const P = P0(); P.y456.CXW = P.y456.CX.map(v => 0.6 * v); P.g.CXW[1] = ys(-2, 3, N0, 23); put('the rows: item 1 inconclusive, world 1 still out, reads else', rowOf(items(P)), 'else'); }
  { const P = P0(); P.g.CXW[0] = ys(0.2, 4.5, N0, 21); P.y456.CXW = P.y456.CX.map(v => 0.9 * v); put('the rows: closure though years 4-6 stay (R1 over R3)', rowOf(items(P)), 'R1'); }
  { const P = P0(); P.g.CXW[1] = ys(-2, 3, N0, 23); put('the rows: years 4-6 removed while world 1\'s whole goes out of band, reads R4 (moved)', rowOf(items(P)), 'R4'); }
  { const P = P0(); P.y456.CXW = P.y456.CX.map(v => -v); put('the rows: years 4-6 over-corrected to an over-read of the same size (removal 2), reads R4', rowOf(items(P)), 'R4'); }
  { const P = P0(); P.y456.CXW = P.y456.CX.map(v => -0.4 * v); put('the rows: a removal of 1.4 (its interval not wholly above one and a half) reads R2', rowOf(items(P)), 'R2'); }
  { const P = P0(); P.g.CXW[1] = ys(-1, 3, N0, 23); put('the rows: years 4-6 removed, world 1\'s whole inconclusive, reads R2 (R4 needs item 2 falsified)', rowOf(items(P)), 'R2'); }
  // the arithmetic on cases worked by hand
  { const c = closeOf(50, 2, 4); put('closeOf: table 50 over runs of 2 of 4 reads 0', c.d.toFixed(4), '0.0000'); }
  { const x = interOf({ C: 40, CX: 33, CW: 38, CXW: 31 }, { C: Uint8Array.from([1, 1, 0, 0]), CX: Uint8Array.from([1, 1, 0, 0]), CW: Uint8Array.from([1, 1, 0, 0]), CXW: Uint8Array.from([1, 1, 0, 0]) }); put('interOf: the tables 40, 33, 38 and 31 on equal runs read 0 interaction', `${x.d.toFixed(4)} ${x.lo.toFixed(4)} ${x.hi.toFixed(4)}`, '0.0000 0.0000 0.0000'); }
  { const x = interOf({ C: 40, CX: 33, CW: 38, CXW: 32 }, { C: Uint8Array.from([1, 0, 0, 0]), CX: Uint8Array.from([1, 0, 0, 0]), CW: Uint8Array.from([1, 0, 0, 0]), CXW: Uint8Array.from([1, 1, 0, 0]) }); put('interOf: a table 1 above additive whose runs save a quarter more reads 1 - 25 = -24', x.d.toFixed(4), '-24.0000'); }
  // pOf: each fix against its own control, the interaction's cells from all four
  { const alive = { 0: 1600, 1: 3472, 2: 3959 }, bit = (k, lost) => Uint8Array.from({ length: N0 }, (_, i) => (i < alive[k] - lost ? 1 : 0));
    const bitsF = (a, k) => bit(k, (a === 'CX' || a === 'CXW') && k === 2 ? 40 : 0), wsF = (a, k) => new Float64Array(N0).fill((a === 'CX' || a === 'CXW') && k === 2 ? -1 : 0);
    const perP = (a, k, x) => ys(a === 'CXW' ? -0.3 : -0.6, 1, N0, ({ Y4: 3, Y5: 5, Y6: 7, GB: 11, GA: 13 })[x] + k), tabs = Object.fromEntries(['C', 'CX', 'CW', 'CXW'].map(a => [a, [40, 87, 99]])), P = pOf(perP, bitsF, wsF, tabs), it = items(P);
    put('pOf: CXW\'s cells are against CX (none discordant when CXW copies CX)', String(P.cells.CXW.every(x => x.b === 0 && x.c === 0)), 'true');
    put('pOf: CW\'s cells are against C (none discordant when CW copies C)', String(P.cells.CW.every(x => x.b === 0 && x.c === 0)), 'true');
    put('pOf: CXW\'s whole score against CX, not C', P.ws.CXW[2].d.toFixed(2), '0.00');
    put('pOf: CX\'s own world-2 loss against C is no harm of either fix', it['5'].outcome, 'HELD');
    put('pOf: CXW\'s grid residual is GB + GA per path', Math.abs(P.g.CXW[0][0] - (perP('CXW', 0, 'GB')[0] + perP('CXW', 0, 'GA')[0])) < 1e-12 ? 'yes' : 'no', 'yes');
    put('pOf: years 4 to 6 summed per path from world 1', P.y456.CX.length === N0 && Math.abs(P.y456.CX[0] - (perP('CX', 1, 'Y4')[0] + perP('CX', 1, 'Y5')[0] + perP('CX', 1, 'Y6')[0])) < 1e-12 ? 'yes' : 'no', 'yes');
    put('pOf: the interaction of four equal tables, CX\'s loss in world 2 shared with CXW, reads additive', it['4'].per[2].read, 'additive');
  }
  // the gate on synthetic logs and files
  const enc = a => Buffer.from(Float64Array.from(a).buffer).toString('base64'), enc8 = a => Buffer.from(Uint8Array.from(a)).toString('base64'), enc16 = a => Buffer.from(Uint16Array.from(a).buffer).toString('base64');
  const npw = 4, DIM = 2, NB = 7;
  const mk = (arm, over = {}) => {
    const id = over.id || HOUSE, pts = over.pts || PTS[arm], L = `${arm}/P${pts}S6Q5`, sn = NODED[arm], floor = over.floor ?? 104000, rule = over.rule ?? floor;
    const nodes = over.nodes ?? (sn ? NODES_SN.join(',') : 'none'), list = over.list ?? (nodes === 'none' ? 'the uniform six' : nodes), split = over.split ?? SPLIT[arm], copy = over.copy ?? COPY[arm];
    const bitsW = [1, 1, 0, 1], mv = [1, 2, 65535, 1, 2, 3, 4, 65535], ws = [100, 99.5, -2, 100];
    const lines = [`stamp: code c1 audit a1 prediction ${PRED} sha s1`, `COPY-W: the candidate's own unit, ${over.npw || npw} paths a world, wealth points divided by 1 (seed ${over.seed || SEED}); 2 jobs; part 0/1`, `${id.padEnd(16)} case | job ${L} | points ${over.casePts || pts} | lambda 0.0223606797749979`,
      `solve CAND ${L}: table 50.0000 secs 10`, `ran CAND ${L}: bridgeRead reader bridgeStep exact readerSplit ${split} readerCopy ${copy} readerBlend null readerRef ${over.ref || 'null'} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${pts} grid total${pts}x${nodes === 'none' ? 6 : nodes.split(',').length}x6 shareNodes ${over.ranNodes ?? nodes} floor ${floor} line 0.5`,
      `reader ${L}: tables 72 unsupported 0 copied 10 copiedTop 5 nodes 100`, `nodes ${L}: ${list} floor ${floor} (the product's rule ${rule})`, `checks ${L}: armTook 1/1`];
    if (!over.noRecount) lines.push(`recount ${L}: tables 72 copied ${over.recount ?? 10} (the solve's 72 and 10) line ${over.recLine ?? 0.5}`, `checks ${L}: copyTook ${over.copyTook ?? 1}/1`);
    lines.push(`openings ${L}: OWN ai 14 level 1 tiers 2,2`);
    for (let w = 0; w < 3; w++) lines.push(`tables ${L} ${w} z 0 weight 0.333333: OWN 50.000000 READ 50.000000`);
    lines.push(`bridge ${L}: reader years ${over.bridge || '1,2,3,4,5,6,7'}`);
    const per = {}, bits = {}, moves = {}, states = {}, yk = [1, 2, 3, 4, 5, 6, 7];
    for (let w = 0; w < 3; w++) {
      lines.push(`sim ${L} ${w} OWN ai 14: 3/${npw} bridge 3 bits ${sha16(Buffer.from(Uint8Array.from(bitsW)))} ${sha16(Buffer.from(Uint8Array.from(bitsW)))}`, `moves ${L} ${w}: path-years 6 sha ${sha16(Buffer.from(Uint16Array.from(mv).buffer))}`, `ledger ${L} ${w}: X 75 B0 75 T 0 GB 0 GA 0 GL 0 GD 0 ${yk.map(t => `Y${t} 0`).join(' ')}`);
      if (!(over.noSplit && w === 2)) lines.push(`split ${L} ${w}: ${yk.map(t => PARTS.map(p => `${p}${t} 0`).join(' ')).join(' ')}`);
      lines.push(`qf ${L} ${w}: paths ${Math.min(npw, NQF)} QF 0`, `whole ${L} ${w}: mean ${(ws.reduce((t, x) => t + x, 0) / npw).toFixed(6)} spending years 46 of 46 floor level 0.8 scale 1 cap 1 death charge 0`);
      for (const x of [...KEYS, ...yk.map(t => `Y${t}`), ...YEARS.flatMap(t => PARTS.map(p => `${p}${t}`))]) if (!(over.noQC && x === 'QC5')) per[`${x}${w}`] = enc([0, 0, 0, 0]);
      per[`WS${w}`] = enc(over.wsFile && w === 0 ? [0, 0, 0, 0] : ws); bits[`OWN${w}`] = enc8(bitsW); bits[`OWN${w}b`] = enc8(bitsW); moves[`MV${w}`] = enc16(mv);
      if (!(over.noStates && w === 0)) states[`S${w}`] = enc(new Array(npw * NB * DIM).fill(0));
    }
    lines.push(`checks ${L}: ownTook 12/12 identity ${3 * npw}/${3 * npw} qfTook 9/9 layerTook 9/9 scoreTook ${3 * npw}/${3 * npw} splitTook ${over.split2 ?? 24}/24 secs 1`, `clamped ${L}: 0 of 24 bridge-year reads at the reader's clamp (their split does not sum to the read)`, `file ${L}: ${id}-${arm}.json.gz`);
    if (!over.notDone) lines.push(`done ${L}`);
    return { text: lines.join('\n'), file: [`${id}-${arm}.json.gz`, { stamp: { code: 'c1', audit: 'a1', prediction: PRED, sha: 's1' }, NPW: npw, seed: 7002, own: 14, bridge: yk, dim: DIM, per, bits, moves, states, tables: {} }] };
  };
  // STEP-S370's saved W60, built from the same synthetic run; an `inert` override alters one quantity
  const savedOf = (over = {}) => Object.fromEntries(['CW'].map(a => { const f = mk(a).file[1]; if (over[a]) over[a](f); return [INERT[a], f]; }));
  const gateOf = (overs = {}, extra = [], inert = {}) => { const all = ARMS.map(a => mk(a, overs[a] || {})), jobs = [...all, ...extra].flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); return gate(jobs, { npw, files, saved: savedOf(inert) }); };
  put('the gate passes the two jobs as registered', gateOf().join('; '), '');
  const refuses = (what, overs, extra = [], inert = {}) => put(`the gate refuses ${what}`, String(gateOf(overs, extra, inert).length > 0), 'true');
  refuses('a job run twice', {}, [mk('CW')]);
  refuses('a job of another test beside the two', {}, [mk('CW', { pts: 30 })]);
  refuses('CXW without its copy rule (the cxw plant)', { CXW: { copy: 'null' } });
  refuses('CW with the copy rule', { CW: { copy: 'extrap' } });
  refuses('CW with the split', { CW: { split: 'ru' } });
  refuses('CXW with SN\'s nodes', { CXW: { nodes: NODES_SN.join(',') } });
  refuses('a reader reference set', { CW: { ref: 'order' } });
  refuses('a case line at another point count alone', { CXW: { casePts: 4 } });
  refuses('another seed', { CXW: { seed: '7004' } });
  refuses('another household', { CW: { id: 'S362' } });
  refuses('a header naming another path count', { CW: { npw: 8 } });
  refuses('a floor other than the product rule\'s', { CXW: { floor: 9000, rule: 104000 } });
  refuses('no recount of the copied nodes', { CXW: { noRecount: true } });
  refuses('a recount off the solve\'s count (the class plant)', { CW: { recount: 11, copyTook: 0 } });
  refuses('copyTook failed, its recount line right', { CXW: { copyTook: 0 } });
  refuses('a recount off the solve\'s count, copyTook passed (a log at odds with itself)', { CW: { recount: 11 } });
  refuses('a recount at another line', { CXW: { recLine: 0.6 } });
  refuses('CW\'s solve meta naming share nodes, its nodes line the uniform six', { CW: { ranNodes: '0,0.2,0.4,0.6,0.8,1' } });
  refuses('a file whose whole scores are not the log\'s', { CXW: { wsFile: true } });
  refuses('splitTook short (the split plant)', { CW: { split2: 23 } });
  refuses('a world\'s split line missing', { CXW: { noSplit: true } });
  refuses('a file without world 0\'s saved states', { CW: { noStates: true } });
  refuses('bridge years without year 5', { CXW: { bridge: '1,2,3,4,6,7' } });
  refuses('CW with no done line', { CW: { notDone: true } });
  refuses('CW not reproducing STEP-S370\'s saved W60 (one path\'s Y5 in world 1)', {}, [], { CW: f => { f.per.Y51 = enc([0, 0, 0, 1e-9]); } });
  refuses('CW not reproducing STEP-S370\'s saved W60 (its world-2 bits)', {}, [], { CW: f => { f.bits.OWN2 = enc8([1, 1, 1, 1]); } });
  refuses('CW not reproducing STEP-S370\'s saved W60 (its world-0 moves)', {}, [], { CW: f => { f.moves.MV0 = enc16([1, 2, 65535, 1, 2, 3, 5, 65535]); } });
  refuses('no saved W60 file', {}, [], { CW: f => { for (const k of Object.keys(f)) delete f[k]; } });
  { const all = ARMS.map(a => mk(a)), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate refuses a full read with no saved STEP-S370 file at all', String(gate(jobs, { npw, files, saved: {} }).length > 0), 'true'); }
  // the reuse: COPY-X's C and CX against COPY-W's jobs (synthetic COPY-X logs in COPY-X's own format)
  const mkX = (arm, over = {}) => { const t = mk('CW', over).text.replace(/CW\//g, `${arm}/`).replace(/^COPY-W:/m, 'COPY-X:').replace(/readerCopy \S+/, `readerCopy ${arm === 'CX' ? 'extrap' : 'null'}`).replace(/P60S6Q5/g, 'P30S6Q5').replace(/points 60 /, 'points 30 ').replace(/pts 60 grid total60x6x6/, 'pts 30 grid total30x6x6'); return parseX(over.code ? t.replace('code c1', `code ${over.code}`) : t); };
  const wJ = () => ARMS.flatMap(a => parse(mk(a).text));
  put('the reuse passes COPY-X\'s C and CX on the same code, household, seed and paths', reuseGate([...mkX('C'), ...mkX('CX')], wJ(), true).join('; '), '');
  put('the reuse refuses when COPY-X\'s gate failed', String(reuseGate([...mkX('C'), ...mkX('CX')], wJ(), false).length > 0), 'true');
  put('the reuse refuses COPY-X\'s files on other code', String(reuseGate([...mkX('C', { code: 'c2' }), ...mkX('CX')], wJ(), true).length > 0), 'true');
  put('the reuse refuses COPY-X\'s C on another seed', String(reuseGate([...mkX('C', { seed: '7004' }), ...mkX('CX')], wJ(), true).length > 0), 'true');
  put('the reuse refuses a missing CX', String(reuseGate([...mkX('C')], wJ(), true).length > 0), 'true');
  put('the reuse refuses COPY-X\'s C on another household', String(reuseGate([...mkX('C', { id: 'S362' }), ...mkX('CX')], wJ(), true).length > 0), 'true');
  put('the reuse refuses COPY-X\'s C with a reader reference', String(reuseGate([...mkX('C', { ref: 'order' }), ...mkX('CX')], wJ(), true).length > 0), 'true');
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
  const DIR = args[0] || join(HERE, 'results', 'diagcopyw'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1), XDIR = args[3] || join(HERE, 'results', 'diagcopyx'), SAVED = args[4] || join(HERE, 'results', 'diagsteps370');
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  // the preflight runs at a fraction of the points and paths: no saved run to compare, and no COPY-X cell to reuse
  const saved = PRE ? null : Object.fromEntries(Object.values(INERT).filter(f => existsSync(join(SAVED, f))).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(SAVED, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files, saved });
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const J = Object.fromEntries(Object.entries(LABELS).map(([a, l]) => [a, jobs.find(x => x.label === l)])), FW = a => files[J[a].file];
  const perW = (a, k, x) => Float64Array.from(decRaw(FW(a).per[`${x}${k}`]), v => 100 * v), mean = a => a.reduce((t, x) => t + x, 0) / a.length;
  if (PRE) {
    console.log(`planted (${np_}): all read as they should`);
    console.log(`GATE: passed - CW and CXW once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}); the candidate's settings with no readerRef, the copy rule on CXW alone, every self-check in full (the preflight: no saved run and no reused cell compared)`);
    for (const a of ARMS) console.log(`PREFLIGHT ${a}: world-1 Y4 + Y5 + Y6 ${f4(mean(perW(a, 1, 'Y4')) + mean(perW(a, 1, 'Y5')) + mean(perW(a, 1, 'Y6')))} points, world-0 GB ${f4(mean(perW(a, 0, 'GB')))}, copied ${J[a].reader.copied}, clamped ${J[a].clamped.n} of ${J[a].clamped.of}, world-0 whole score ${f4(J[a].whole[0].mean)}`);
    console.log('PREFLIGHT: the gate and the files read; no figure read for an item (a preview at a fraction of the points; PREVIEW)'); process.exit(0);
  }
  // THE REUSE: COPY-X's reducer over its own files (its gate, its fair-test gate and its inert gate), then the shared variables
  const xr = spawnSync('node', [join(HERE, 'reduce-copyx.mjs'), XDIR], { encoding: 'utf8', maxBuffer: 1 << 26 }), xOut = xr.stdout || '';
  const xLogs = existsSync(XDIR) ? readdirSync(XDIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(XDIR, f), 'utf8')) : [];
  const xJobs = xLogs.flatMap(parseX), rbad = reuseGate(xJobs, jobs, xr.status === 0 && /^GATE: passed/m.test(xOut));
  if (rbad.length) { console.log(`GATE FAILED (the reuse, ${rbad.length}):\n  ${rbad.join('\n  ')}`); process.exit(1); }
  const XJ = Object.fromEntries(REUSED.map(a => [a, xJobs.find(j => j.label === LABELS_X[a])])), xFiles = Object.fromEntries(REUSED.map(a => [a, JSON.parse(gunzipSync(readFileSync(join(XDIR, XJ[a].file))).toString())]));
  const JA = { ...XJ, ...J }, FA = a => (REUSED.includes(a) ? xFiles[a] : FW(a));
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - CW and CXW once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}; S370 at 60 points); the candidate's settings with no readerRef, the copy rule on CXW alone, every self-check in full; CW reproduces STEP-S370's saved W60 bit for bit (${SAVED}); the reuse: COPY-X's gate passed over ${XDIR}, and its C and CX share COPY-W's code, household, seed, paths and settings`);
  const perP = (a, k, x) => Float64Array.from(decRaw(FA(a).per[`${x}${k}`]), v => 100 * v);
  const bitsF = (a, k) => dec8(FA(a).bits[`OWN${k}`]), wsF = (a, k) => decRaw(FA(a).per[`WS${k}`]);
  const tabs = Object.fromEntries(['C', 'CX', 'CW', 'CXW'].map(a => [a, [0, 1, 2].map(k => JA[a].tables[k].OWN)]));
  const P = pOf(perP, bitsF, wsF, tabs), it = items(P), iv = x => `${f4(x.d ?? x.R)} (${f4(x.lo)} to ${f4(x.hi)})`;
  const hw = (h, x) => `world ${x.k}: survival ${f4(x.ex.d)} exact (${f4(x.ex.lo)} to ${f4(x.ex.hi)}) ${x.ex.outcome}, guarded unconditional (${f4(x.u.lo)} to ${f4(x.u.hi)}), whole score ${iv(x.w)}, margin ${f4(x.margin)}: ${x.harm ? 'harm' : x.ok ? 'no material harm' : 'inconclusive'}`;
  console.log('\nCOPY-W, STAGE A: the copy x wealth factorial on S370, the frozen candidate (predictions/diag-copyw.md)');
  console.log('\nTHE ITEMS (each read by its registered rule)');
  console.log(`1. CXW removes at least half of CX's world-1 residual at years 4 to 6 (path by path): ${it['1'].outcome}`);
  console.log(`     the removal ${iv(it['1'].r)} of CX's mean ${f4(it['1'].r.mc)} points${it['1'].nothing ? ' (nothing to remove)' : ''}`);
  const tlr = k => { const s = JA.CXW.sims[`OWN${k}`]; return iv(closeOf(JA.CXW.tables[k].OWN, s.ok, s.n)); };
  console.log(`2. CXW's world-1 grid residual GB + GA within a point (path by path): ${it['2'].outcome}`);
  console.log(`     ${iv(it['2'].c)}; reported beside: its table less runs ${tlr(1)} (the runs' binomial interval)`);
  console.log(`3. CXW's world-0 grid residual GB + GA within a point (path by path): ${it['3'].outcome}`);
  console.log(`     ${iv(it['3'].c)}; reported beside: its table less runs ${tlr(0)} (the runs' binomial interval)`);
  console.log(`4. the interaction (CXW - CW) - (CX - C) in table less runs within half a point in every world: ${it['4'].outcome}`);
  for (const x of it['4'].per) console.log(`     world ${x.k}: ${iv(x)} (tables ${f4(x.tab)}, runs ${f4(x.runs)}): ${x.read}`);
  console.log(`5. no material harm per world, CXW against CX, by RULES.md section 8's rule as written: ${it['5'].outcome}`);
  for (const x of it['5'].hx.per) console.log(`     CXW against CX ${hw(it['5'].hx, x)}`);
  console.log(`OUTCOME: 1 ${it['1'].outcome}, 2 ${it['2'].outcome}, 3 ${it['3'].outcome}, 4 ${it['4'].outcome}, 5 ${it['5'].outcome}`);
  console.log(`ROW: ${rowOf(it)}`);
  console.log(`REALISED item 1: ${f4(it['1'].r.R)}`); console.log(`REALISED item 2: ${f4(it['2'].c.d)}`); console.log(`REALISED item 3: ${f4(it['3'].c.d)}`); console.log(`REALISED item 4: ${f4(it['4'].per[0].d)}`); console.log(`REALISED item 5: ${f4(it['5'].hx.per[0].ex.d)}`);
  console.log('\nREPORTED');
  for (const x of it['5'].hw.per) console.log(`  CW against C (known from STEP-S370's W60, not an item) ${hw(it['5'].hw, x)}`);
  for (const a of ['C', 'CX', 'CW', 'CXW']) for (let k = 0; k < 3; k++) { const s = JA[a].sims[`OWN${k}`], L = JA[a].ledger[k], t = JA[a].tables[k].OWN, by = (JA[a].bridge || []); console.log(`  ${a} world ${k}: table ${f4(t)} runs ${s.ok}/${s.n} (${f4(100 * s.ok / s.n)}), table less runs ${f4(t - 100 * s.ok / s.n)}; GB ${f4(L.GB)} GA ${f4(L.GA)} T ${f4(L.T)}; by year ${by.map(y => `${y}: ${f4(L[`Y${y}`])}`).join(' | ')}; the sum of absolute residuals by year ${f4(by.reduce((t2, y) => t2 + Math.abs(L[`Y${y}`]), 0))}`); }
  for (const a of ARMS) for (let k = 0; k < 3; k++) { const S = J[a].split[k]; console.log(`  ${a} world ${k} split by year (QS, QC, RS, RC): ${(J[a].bridge || []).map(y => `${y}: ${PARTS.map(p => f4(S[`${p}${y}`])).join(', ')}`).join(' | ')}`); }
  for (const a of ARMS) console.log(`  ${a}: copied ${J[a].reader.copied} copiedTop ${J[a].reader.copiedTop} of ${J[a].reader.nodes} nodes; reads at the clamp ${J[a].clamped.n} of ${J[a].clamped.of}; solve ${J[a].solve.secs} s`);
}
