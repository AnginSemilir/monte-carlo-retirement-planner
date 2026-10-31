/*
 * STEP-O182'S REDUCER (PLAN.md STEP-O182, items/STEP-O182.md; predictions/diag-o182.md; the deep review after STEP-S370,
 * deep-review-log.md 18 Oct 22:45 UK; O182, PR25). Three jobs on S370 at the candidate's own unit, 30 points, seed 7002, the
 * first 4,000 paths a world, into results/diago182 (audit-o182.mjs): C (the candidate as it stands, the plan reference, on the
 * new code with the option off), SN (C with NODES_SN, eight share nodes: the uniform six with two, 0.9 and 0.95, added in the
 * top cell; the option off) and SNR (SN with each corner's residual R scaled by (1 - pq) / (1 - pk) where the query's chance
 * exceeds the corner's, `readerSplit: 'ru'`).
 * THE GATE: each job once and done at the registered settings, stamped as launched, the fair-test gate on the logs (one audit);
 *   its solve's meta reads the candidate's settings with no readerRef, the nodes and split asked (NODES_SN on SN and SNR, 'ru' on
 *   SNR alone) and the grid's size; its floor the product's own rule's; every self-check in full (armTook, copyTook, ownTook,
 *   identity on 12,000 paths, qfTook, layerTook, scoreTook, splitTook); the files whole, their bits, moves and whole scores the
 *   logs', the split's paths and the saved states there; and INERT OFF: C's and SN's files reproduce STEP-S370's saved C and SN
 *   (results/diagsteps370) bit for bit - every path's survival bits, moves, whole score and ledger quantities in every world.
 * THE ITEMS (world 0's years 1 and 5: the ledger's Y1 + Y5 per path, where SN moved S370's over-read, O182):
 *   1: under SN the copied corners' I[R] carries at least half of world 0's Y1 + Y5, path by path (the ratio
 *      sum(RC1 + RC5) / sum(Y1 + Y5) with its interval by the delta method at 95%): HELD when its interval lies at or above one
 *      half; FALSIFIED when it lies below one quarter; otherwise INCONCLUSIVE; INCONCLUSIVE too when SN's mean Y1 + Y5 is under
 *      a point (nothing to carry).
 *   2: SNR's removal of SN's world-0 Y1 + Y5, path by path (sum(SN - SNR) / sum(SN), the delta method at 95%): the same three
 *      outcomes at one half and one quarter; INCONCLUSIVE when SN's mean is under a point.
 *   3: SNR's world-0 table less runs against C's: the drop (C's table less runs) - (SNR's), the tables fixed and the runs paired
 *      by path (the guarded unconditional interval at 95%): HELD when the drop's interval lies at or above half of C's table
 *      less runs (SNR's at most half of C's); FALSIFIED when it lies below a quarter of it; otherwise INCONCLUSIVE; INCONCLUSIVE
 *      too when C's table less runs is under a point.
 *   4: no material harm, SNR against C, by RULES.md section 8's rule as written for a policy change: per world the exact
 *      conditional McNemar at the relative margin marginRel(C's survival) with Holm across the three worlds, AND the guarded
 *      unconditional interval's lower end above minus the margin; the whole score per world by its normal interval at 95%.
 *      HELD when every world reads no material harm on both legs; FALSIFIED when any world reads harm; otherwise INCONCLUSIVE.
 * THE ROWS: R4 item 4 FALSIFIED (SNR harms); R1 items 2 and 3 HELD (the fix removes the over-read); R2 item 2 HELD and item 3
 *   FALSIFIED (a further carrier of the over-read); R3 item 1 FALSIFIED (O182-RESID not the carrier); else.
 * REPORTED: every arm's tables against its runs by world; GB, GA, T and Y by year by world; the split by year (PC, RS, RC) by
 *   world; the copied nodes; the reads at the clamp; the solves' seconds.
 *   node research/solver/reduce-o182.mjs [dir] [paths a world] [scale] [saved dir] [--preflight] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { mcnemarHarmP, holm, outcome, marginRel, survivalChangeU, zFor } from './stats.mjs';
import { guarded } from './reduce-7aa.mjs';
import { sha16 } from './reduce-ao.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-o182.md';
export const HOUSE = 'S370', SEED = '7002', NPW = 4000, NQF = 1000;
export const NODES_SN = Object.freeze([0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1]);
export const HALF = 0.5, QUARTER = 0.25, MINRES = 1;
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const ARMS = ['C', 'SN', 'SNR'];
export const PTS = Object.freeze({ C: 30, SN: 30, SNR: 30 });
export const SPLIT = Object.freeze({ C: 'null', SN: 'null', SNR: 'ru' });
export const LABELS = Object.freeze(Object.fromEntries(ARMS.map(a => [a, `${a}/P${PTS[a]}S6Q5`])));
export const YEARS = Object.freeze([1, 5]);
// the arms whose files must reproduce STEP-S370's saved run (the option off), and the quantities compared
export const INERT = Object.freeze({ C: 'S370-C-P30S6Q5.json.gz', SN: 'S370-SN-P30S6Q5.json.gz' });
export const INERT_PER = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD', 'WS', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7'];
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S\d+)\s+case \| job ((C|SN|SNR)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^STEP-O182: .*?, (\d+) paths a world.*?, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;

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
// INERT OFF: an arm's file against STEP-S370's saved file of the same arm, bit for bit; the differences found
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
  for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(`a job that is not STEP-O182's: ${x.label}`);
  for (const [arm, label] of Object.entries(LABELS)) {
    const js = jobs.filter(x => x.label === label);
    if (js.length !== 1) { bad.push(`${arm}: ${js.length ? `run ${js.length} times` : 'missing'}`); continue; }
    const j = js[0], pts = Math.max(4, Math.round(PTS[arm] / scale)), sn = arm !== 'C';
    if (j.id !== HOUSE) bad.push(`${arm}: run on ${j.id}, not ${HOUSE}`);
    if (!j.done) bad.push(`${arm}: no done line`);
    if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push(`${arm}: no stamp`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${arm}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${arm}: solved at ${j.pts} points, not ${pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, readerSplit: SPLIT[arm], pts: String(pts), grid: `total${pts}x${sn ? NODES_SN.length : 6}x6`, shareNodes: sn ? NODES_SN.join(',') : 'none' })) if (field(ran, f) !== v) bad.push(`${arm}: ${f} is ${field(ran, f)}, not ${v}`);
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
      if (!j.split[w] || (j.bridge || []).some(t => ['PC', 'RS', 'RC'].some(p => !Number.isFinite(j.split[w][`${p}${t}`])))) bad.push(`${arm}: world ${w}'s split line is missing or short`);
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
        for (const x of [...KEYS, 'WS', ...YEARS.flatMap(t => [`Y${t}`, `PC${t}`, `RS${t}`, `RC${t}`])]) { const a = f.per && f.per[`${x}${w}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`${arm}: its file's ${x}${w} paths are not ${npw}`); }
        const st = f.states && f.states[`S${w}`]; if (!st || !(f.dim > 0) || !(nb > 0) || Buffer.from(st, 'base64').length !== 8 * npw * nb * f.dim) bad.push(`${arm}: its file's world-${w} saved states are missing or short`);
        const ws = f.per && f.per[`WS${w}`]; if (ws && j.whole[w] && Math.abs(decRaw(ws).reduce((t, x) => t + x, 0) / npw - j.whole[w].mean) > 1e-5) bad.push(`${arm}: its file's world-${w} whole scores are not the log's`);
        const mv = f.moves && f.moves[`MV${w}`]; if (!mv || !j.moves[w] || sha16(Buffer.from(mv, 'base64')) !== j.moves[w].sha) bad.push(`${arm}: its file's world-${w} moves are not the log's`);
      }
      if (saved && INERT[arm]) { const d = inertOf(f, saved[INERT[arm]]); if (d.length) bad.push(`${arm}: does not reproduce STEP-S370's saved ${arm} (the option not inert off): ${d.slice(0, 6).join(', ')}${d.length > 6 ? ` and ${d.length - 6} more` : ''}`); }
    }
  }
  return bad;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
// a world's paired cells, control against arm: a both alive, b lost (the control alive, the arm not), c saved, d both dead
export const cellsOf = (ctrl, arm) => { let a = 0, b = 0, c = 0, d = 0; for (let i = 0; i < ctrl.length; i++) { if (ctrl[i] && arm[i]) a++; else if (ctrl[i]) b++; else if (arm[i]) c++; else d++; } return { a, b, c, d }; };
// a world's paired whole-score change arm - control, its mean and standard error
export const wsOf = (ctrl, arm) => { const n = ctrl.length; let s = 0; for (let i = 0; i < n; i++) s += arm[i] - ctrl[i]; const m = s / n; let v = 0; for (let i = 0; i < n; i++) v += (arm[i] - ctrl[i] - m) ** 2; return { d: m, se: Math.sqrt(v / (n - 1) / n) }; };
// the share of y that x carries, path by path: S = sum(x) / sum(y), its interval by the delta method on the ratio of paired
// means; y and x in points
export function share(y, x, z = zFor(0.05)) {
  const n = y.length; let sy = 0, sx = 0; for (let i = 0; i < n; i++) { sy += y[i]; sx += x[i]; }
  const my = sy / n, S = sy !== 0 ? sx / sy : NaN; let v = 0; for (let i = 0; i < n; i++) { const e = x[i] - S * y[i]; v += e * e; }
  const se = Math.sqrt(v / Math.max(1, n - 1) / n) / Math.abs(my);
  return { R: S, lo: S - z * se, hi: S + z * se, mc: my, n };
}
// the share of c's residual an arm removes, path by path: sum(c - x) / sum(c), the share of c that c - x carries
export const removal = (c, x, z = zFor(0.05)) => share(c, Float64Array.from(c, (v, i) => v - x[i]), z);
const ratioItem = r => ({ outcome: !(r.mc >= MINRES) || !Number.isFinite(r.R) ? 'INCONCLUSIVE' : r.lo >= HALF ? 'HELD' : r.hi < QUARTER ? 'FALSIFIED' : 'INCONCLUSIVE', r, nothing: !(r.mc >= MINRES) });
// no material harm per world by section 8's rule as written: the exact rule and the guarded unconditional interval, Holm across
// the worlds; the whole score's normal interval beside
export function harmWorlds(cells, ws, level = 0.05) {
  const ph = holm(cells.map(x => mcnemarHarmP(x.b, x.c))), z = zFor(level);
  const per = cells.map((x, k) => {
    const N = x.a + x.b + x.c + x.d, margin = marginRel(100 * (x.a + x.b) / N);
    const ex = outcome({ b: x.b, c: x.c, N, margin, pHolm: ph[k], level });
    const u = guarded(survivalChangeU(x.a, x.b, x.c, x.d, level), x.b, x.c, N, level);
    const w = { d: ws[k].d, lo: ws[k].d - z * ws[k].se, hi: ws[k].d + z * ws[k].se };
    const ok = ex.outcome === 'no material harm' && u.lo > -margin && w.lo > -margin, harm = ex.outcome === 'harm' || w.hi < -margin;
    return { k, N, margin, ex, u, w, ok, harm };
  });
  return { outcome: per.some(x => x.harm) ? 'FALSIFIED' : per.every(x => x.ok) ? 'HELD' : 'INCONCLUSIVE', per };
}
// the drop in world 0's table less runs, an arm against C: the tables fixed, the runs paired (the guarded unconditional interval)
export function dropOf(tabC, tabX, cell, level = 0.05) {
  const N = cell.a + cell.b + cell.c + cell.d, gapC = tabC - 100 * (cell.a + cell.b) / N, gapX = tabX - 100 * (cell.a + cell.c) / N;
  const u = guarded(survivalChangeU(cell.a, cell.b, cell.c, cell.d, level), cell.b, cell.c, N, level);
  return { gapC, gapX, d: (tabC - tabX) + u.d, lo: (tabC - tabX) + u.lo, hi: (tabC - tabX) + u.hi };
}
/* P: { y: { SN, SNR }: world 0's Y1 + Y5 per path in points; rc: SN's world-0 RC1 + RC5 per path in points; cells: [3] C against
   SNR; ws: [3] SNR less C; tab: { C, SNR } world 0's tables } */
export function items(P) {
  const out = {};
  out['1'] = ratioItem(share(P.y.SN, P.rc));
  out['2'] = ratioItem(removal(P.y.SN, P.y.SNR));
  const dr = dropOf(P.tab.C, P.tab.SNR, P.cells[0]);
  out['3'] = { outcome: !(dr.gapC >= MINRES) ? 'INCONCLUSIVE' : dr.lo >= HALF * dr.gapC ? 'HELD' : dr.hi < QUARTER * dr.gapC ? 'FALSIFIED' : 'INCONCLUSIVE', dr, nothing: !(dr.gapC >= MINRES) };
  out['4'] = harmWorlds(P.cells, P.ws);
  return out;
}
export function rowOf(it) {
  const o = i => it[i].outcome;
  if (o('4') === 'FALSIFIED') return 'R4';
  if (o('2') === 'HELD' && o('3') === 'HELD') return 'R1';
  if (o('2') === 'HELD' && o('3') === 'FALSIFIED') return 'R2';
  if (o('1') === 'FALSIFIED') return 'R3';
  return 'else';
}

// THE PLANTED CHECKS: each item to each outcome on a case built for it, the rows, the gate's refusals, the EDGES
export const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
const N0 = 4000;
// a deterministic per-path residual: mean m, spread sd (points), the same draws every call
const ys = (m, sd, n = N0, seed = 7) => { let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; return Float64Array.from({ length: n }, () => m + sd * Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r())); };
const cellsAt = (s, lost, saved) => { const al = Math.round(s / 100 * N0); return { a: al - lost, b: lost, c: saved, d: N0 - al - saved }; };
const P0 = () => { const SN = ys(8, 20); return { y: { SN, SNR: SN.map(v => 0.3 * v) }, rc: SN.map(v => 0.7 * v), cells: [cellsAt(40, 10, 10), cellsAt(86, 10, 10), cellsAt(99, 5, 5)], ws: [{ d: 0, se: 0.05 }, { d: 0, se: 0.05 }, { d: 0, se: 0.05 }], tab: { C: 49, SNR: 43 } }; };
function planted() {
  const cases = [], put = (what, got, want) => cases.push([what, got, want]);
  const run = (what, edit, i, want, edge) => { const P = P0(); edit(P); const it = items(P); REACHED[i].add(it[i].outcome); put(`${what}: ${i} ${want}`, it[i].outcome, want); if (edge) EDGES.push(edge); };
  run('the copied corners carry seven tenths of SN\'s Y1 + Y5', () => {}, '1', 'HELD');
  run('they carry a tenth', P => { P.rc = P.y.SN.map(v => 0.1 * v); }, '1', 'FALSIFIED');
  run('they carry four tenths', P => { P.rc = P.y.SN.map(v => 0.4 * v); }, '1', 'INCONCLUSIVE');
  run('they carry exactly half with no spread (the line itself)', P => { P.y.SN = new Float64Array(N0).fill(8); P.rc = new Float64Array(N0).fill(4); }, '1', 'HELD', 'a share exactly at one half with no spread reads HELD');
  run('SN\'s Y1 + Y5 under a point (nothing to carry)', P => { P.y.SN = P.y.SN.map(v => 0.05 * v); P.rc = P.y.SN.map(v => v); }, '1', 'INCONCLUSIVE', 'SN\'s mean Y1 + Y5 under a point: nothing to carry');
  run('the copied corners\' part against the residual (a negative share)', P => { P.rc = P.y.SN.map(v => -0.5 * v); }, '1', 'FALSIFIED');
  run('they carry 0.55 with spread, the interval below a half', P => { const e = ys(0, 40, N0, 99); P.rc = P.y.SN.map((v, i) => 0.55 * v + e[i]); }, '1', 'INCONCLUSIVE');
  run('they carry 0.2 with spread, the interval reaching a quarter', P => { const e = ys(0, 40, N0, 99); P.rc = P.y.SN.map((v, i) => 0.2 * v + e[i]); }, '1', 'INCONCLUSIVE');
  run('SNR removes seven tenths of SN\'s Y1 + Y5', () => {}, '2', 'HELD');
  run('SNR removes 0.2 with spread, its interval reaching a quarter', P => { const e = ys(0, 40, N0, 99); P.y.SNR = P.y.SN.map((v, i) => 0.8 * v + e[i]); }, '2', 'INCONCLUSIVE');
  run('SNR removes a tenth', P => { P.y.SNR = P.y.SN.map(v => 0.9 * v); }, '2', 'FALSIFIED');
  run('SNR removes four tenths', P => { P.y.SNR = P.y.SN.map(v => 0.6 * v); }, '2', 'INCONCLUSIVE');
  run('SNR makes it worse (a negative removal)', P => { P.y.SNR = P.y.SN.map(v => 1.2 * v); }, '2', 'FALSIFIED');
  run('SN\'s Y1 + Y5 under a point (nothing to remove)', P => { P.y.SN = P.y.SN.map(v => 0.05 * v); P.y.SNR = P.y.SN.map(() => 0); }, '2', 'INCONCLUSIVE');
  run('SNR\'s table 6 points under C\'s on runs at C\'s (C\'s gap 9)', () => {}, '3', 'HELD');
  run('SNR\'s table 1 point under C\'s', P => { P.tab.SNR = 48; }, '3', 'FALSIFIED');
  run('SNR\'s table 3 points under (C\'s gap 9)', P => { P.tab.SNR = 46; }, '3', 'INCONCLUSIVE');
  run('C\'s table half a point over its runs (nothing to remove)', P => { P.tab.C = 40.5; P.tab.SNR = 39; }, '3', 'INCONCLUSIVE', 'C\'s table less runs under a point: nothing to remove');
  run('SNR\'s runs fall by as much as its table (no drop, paired by path)', P => { P.cells[0] = cellsAt(40, 250, 10); P.tab.SNR = 43; }, '3', 'FALSIFIED', 'a table that falls with its runs reads no drop');
  run('SNR\'s table above C\'s (the gap grows)', P => { P.tab.SNR = 52; }, '3', 'FALSIFIED');
  run('SNR\'s table 2 points under on discordant runs (its interval reaching a quarter of C\'s gap)', P => { P.tab.SNR = 47; P.cells[0] = cellsAt(40, 100, 100); }, '3', 'INCONCLUSIVE');
  run('SNR at C in every world', () => {}, '4', 'HELD');
  run('SNR loses 60 paths in world 0', P => { P.cells[0] = cellsAt(40, 70, 10); }, '4', 'FALSIFIED');
  run('SNR loses 15 paths net in world 1 (its interval across the margin)', P => { P.cells[1] = cellsAt(86, 25, 10); }, '4', 'INCONCLUSIVE', 'a world\'s survival interval across the margin');
  run('SNR\'s whole score 1 point down in world 2 alone', P => { P.ws[2] = { d: -1, se: 0.05 }; }, '4', 'FALSIFIED');
  run('SNR\'s whole score across the margin in world 0', P => { P.ws[0] = { d: -0.45, se: 0.1 }; }, '4', 'INCONCLUSIVE');
  run('SNR loses 4 and saves none in world 2 (the guard holds the interval out)', P => { P.cells[2] = cellsAt(99, 4, 0); }, '4', 'INCONCLUSIVE', 'a one-sided loss the exact rule passes and the guard holds out');
  // the decision rows
  { const P = P0(); put('the rows: SNR removes it and the gap falls, reads R1', rowOf(items(P)), 'R1'); }
  { const P = P0(); P.cells[0] = cellsAt(40, 70, 10); put('the rows: SNR harms, reads R4 over R1', rowOf(items(P)), 'R4'); }
  { const P = P0(); P.tab.SNR = 48; put('the rows: SNR removes the slice, the gap stays, reads R2', rowOf(items(P)), 'R2'); }
  { const P = P0(); P.rc = P.y.SN.map(v => 0.1 * v); P.y.SNR = P.y.SN.map(v => 0.9 * v); put('the rows: the copied corners carry little and SNR removes little, reads R3', rowOf(items(P)), 'R3'); }
  { const P = P0(); P.rc = P.y.SN.map(v => 0.1 * v); put('the rows: SNR works though the copied corners carry little, reads R1 (the fix over the split)', rowOf(items(P)), 'R1'); }
  { const P = P0(); P.y.SNR = P.y.SN.map(v => 0.6 * v); put('the rows: SNR partly, reads else', rowOf(items(P)), 'else'); }
  { const P = P0(); P.y.SNR = P.y.SN.map(v => 0.6 * v); P.tab.SNR = 48; put('the rows: the gap stays and SNR removes the slice only partly, reads else (R2 needs item 2 HELD)', rowOf(items(P)), 'else'); }
  { const P = P0(); P.rc = P.y.SN.map(v => 0.4 * v); P.y.SNR = P.y.SN.map(v => 0.6 * v); put('the rows: the copied corners\' share inconclusive and SNR partly, reads else (R3 needs item 1 FALSIFIED)', rowOf(items(P)), 'else'); }
  // the share's arithmetic on a case worked by hand
  { const r = share(Float64Array.from([2, 4, 6]), Float64Array.from([1, 2, 3])); put('the share of a half on three paths reads 0.5 with no spread', `${r.R.toFixed(3)} ${r.lo.toFixed(3)} ${r.hi.toFixed(3)}`, '0.500 0.500 0.500'); }
  { const r = removal(Float64Array.from([2, 4, 6]), Float64Array.from([1, 2, 3])); put('the removal of a half on three paths reads 0.5 with no spread', `${r.R.toFixed(3)} ${r.lo.toFixed(3)} ${r.hi.toFixed(3)}`, '0.500 0.500 0.500'); }
  // the gate on synthetic logs and files
  const enc = a => Buffer.from(Float64Array.from(a).buffer).toString('base64'), enc8 = a => Buffer.from(Uint8Array.from(a)).toString('base64'), enc16 = a => Buffer.from(Uint16Array.from(a).buffer).toString('base64');
  const npw = 4, DIM = 2, NB = 7;
  const mk = (arm, over = {}) => {
    const id = over.id || HOUSE, pts = over.pts || PTS[arm], L = `${arm}/P${pts}S6Q5`, sn = arm !== 'C', floor = over.floor ?? 104000, rule = over.rule ?? floor;
    const nodes = over.nodes ?? (sn ? NODES_SN.join(',') : 'none'), list = over.list ?? (nodes === 'none' ? 'the uniform six' : nodes), split = over.split ?? SPLIT[arm];
    const bitsW = [1, 1, 0, 1], mv = [1, 2, 65535, 1, 2, 3, 4, 65535], ws = [100, 99.5, -2, 100];
    const lines = [`stamp: code c1 audit a1 prediction ${PRED} sha s1`, `STEP-O182: the candidate's own unit, ${over.npw || npw} paths a world, wealth points divided by 1 (seed ${over.seed || SEED}); 3 jobs; part 0/1`, `${id.padEnd(16)} case | job ${L} | points ${over.casePts || pts} | lambda 0.0223606797749979`,
      `solve CAND ${L}: table 50.0000 secs 10`, `ran CAND ${L}: bridgeRead reader bridgeStep exact readerSplit ${split} readerBlend null readerRef ${over.ref || 'null'} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${pts} grid total${pts}x${nodes === 'none' ? 6 : nodes.split(',').length}x6 shareNodes ${over.ranNodes ?? nodes} floor ${floor} line 0.5`,
      `reader ${L}: tables 72 unsupported 0 copied 10 copiedTop 5 nodes 100`, `nodes ${L}: ${list} floor ${floor} (the product's rule ${rule})`, `checks ${L}: armTook 1/1`];
    if (!over.noRecount) lines.push(`recount ${L}: tables 72 copied ${over.recount ?? 10} (the solve's 72 and 10) line ${over.recLine ?? 0.5}`, `checks ${L}: copyTook ${over.copyTook ?? 1}/1`);
    lines.push(`openings ${L}: OWN ai 14 level 1 tiers 2,2`);
    for (let w = 0; w < 3; w++) lines.push(`tables ${L} ${w} z 0 weight 0.333333: OWN 50.000000 READ 50.000000`);
    lines.push(`bridge ${L}: reader years ${over.bridge || '1,2,3,4,5,6,7'}`);
    const per = {}, bits = {}, moves = {}, states = {}, yk = [1, 2, 3, 4, 5, 6, 7];
    for (let w = 0; w < 3; w++) {
      lines.push(`sim ${L} ${w} OWN ai 14: 3/${npw} bridge 3 bits ${sha16(Buffer.from(Uint8Array.from(bitsW)))} ${sha16(Buffer.from(Uint8Array.from(bitsW)))}`, `moves ${L} ${w}: path-years 6 sha ${sha16(Buffer.from(Uint16Array.from(mv).buffer))}`, `ledger ${L} ${w}: X 75 B0 75 T 0 GB 0 GA 0 GL 0 GD 0 ${yk.map(t => `Y${t} 0`).join(' ')}`);
      if (!(over.noSplit && w === 2)) lines.push(`split ${L} ${w}: ${yk.map(t => `PC${t} 0 RS${t} 0 RC${t} 0`).join(' ')}`);
      lines.push(`qf ${L} ${w}: paths ${Math.min(npw, NQF)} QF 0`, `whole ${L} ${w}: mean ${(ws.reduce((t, x) => t + x, 0) / npw).toFixed(6)} spending years 46 of 46 floor level 0.8 scale 1 cap 1 death charge 0`);
      for (const x of [...KEYS, ...yk.map(t => `Y${t}`), ...YEARS.flatMap(t => [`PC${t}`, `RS${t}`, `RC${t}`])]) if (!(over.noRC && x === 'RC5')) per[`${x}${w}`] = enc(over.yDiff && x === 'Y5' && w === 1 ? [0, 0, 0, 1e-9] : [0, 0, 0, 0]);
      per[`WS${w}`] = enc(over.wsFile && w === 0 ? [0, 0, 0, 0] : ws); bits[`OWN${w}`] = enc8(bitsW); bits[`OWN${w}b`] = enc8(bitsW); moves[`MV${w}`] = enc16(mv);
      if (!(over.noStates && w === 0)) states[`S${w}`] = enc(new Array(npw * NB * DIM).fill(0));
    }
    lines.push(`checks ${L}: ownTook 12/12 identity ${3 * npw}/${3 * npw} qfTook 9/9 layerTook 9/9 scoreTook ${3 * npw}/${3 * npw} splitTook ${over.split2 ?? 24}/24 secs 1`, `clamped ${L}: 0 of 24 bridge-year reads at the reader's clamp (their split does not sum to the read)`, `file ${L}: ${id}-${arm}.json.gz`);
    if (!over.notDone) lines.push(`done ${L}`);
    return { text: lines.join('\n'), file: [`${id}-${arm}.json.gz`, { stamp: { code: 'c1', audit: 'a1', prediction: PRED, sha: 's1' }, NPW: npw, seed: 7002, own: 14, bridge: yk, dim: DIM, per, bits, moves, states, tables: {} }] };
  };
  // STEP-S370's saved C and SN, built from the same synthetic run (inert off); an `inert` override alters one quantity
  const savedOf = (over = {}) => Object.fromEntries(['C', 'SN'].map(a => { const f = mk(a).file[1]; if (over[a]) over[a](f); return [INERT[a], f]; }));
  const gateOf = (overs = {}, extra = [], inert = {}) => { const all = ARMS.map(a => mk(a, overs[a] || {})), jobs = [...all, ...extra].flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); return gate(jobs, { npw, files, saved: savedOf(inert) }); };
  put('the gate passes the three jobs as registered', gateOf().join('; '), '');
  const refuses = (what, overs, extra = [], inert = {}) => put(`the gate refuses ${what}`, String(gateOf(overs, extra, inert).length > 0), 'true');
  refuses('a job run twice', {}, [mk('C')]);
  refuses('a job of another test beside the three', {}, [mk('C', { pts: 60 })]);
  refuses('SN without its nodes (the nodes plant)', { SN: { nodes: 'none' } });
  refuses('SNR without its split (the snr plant)', { SNR: { split: 'null' } });
  refuses('SN with the split', { SN: { split: 'ru' } });
  refuses('C with SN\'s nodes', { C: { nodes: NODES_SN.join(',') } });
  refuses('SNR with other nodes', { SNR: { nodes: '0,0.2,0.4,0.6,0.8,1' } });
  refuses('SN\'s nodes line naming other nodes, its solve meta right', { SN: { list: '0,0.2,0.4,0.6,0.85,0.9,0.95,1' } });
  refuses('a reader reference set', { C: { ref: 'order' } });
  refuses('SNR at 60 points', { SNR: { pts: 60 } });
  refuses('another seed', { SN: { seed: '7004' } });
  refuses('another household', { C: { id: 'S362' } });
  refuses('a header naming another path count', { SNR: { npw: 8 } });
  refuses('a floor other than the product rule\'s', { C: { floor: 9000, rule: 104000 } });
  refuses('no recount of the copied nodes', { SN: { noRecount: true } });
  refuses('a recount off the solve\'s count (the class plant)', { SNR: { recount: 11, copyTook: 0 } });
  refuses('copyTook failed, its recount line right', { SN: { copyTook: 0 } });
  refuses('a recount off the solve\'s count, copyTook passed (a log at odds with itself)', { C: { recount: 11 } });
  refuses('a recount at another line', { SNR: { recLine: 0.6 } });
  refuses('a case line at another point count alone', { C: { casePts: 4 } });
  refuses('SN\'s solve meta naming other nodes of the same count, its nodes line right', { SN: { ranNodes: '0,0.2,0.4,0.6,0.85,0.9,0.95,1' } });
  refuses('a file whose whole scores are not the log\'s', { SNR: { wsFile: true } });
  refuses('splitTook short (the split plant)', { SN: { split2: 23 } });
  refuses('a world\'s split line missing', { SNR: { noSplit: true } });
  refuses('a file without year 5\'s copied part', { SN: { noRC: true } });
  refuses('a file without world 0\'s saved states', { C: { noStates: true } });
  refuses('bridge years without year 5', { SN: { bridge: '1,2,3,4,6,7' } });
  refuses('C with no done line', { C: { notDone: true } });
  refuses('C not reproducing STEP-S370\'s saved C (one path\'s Y5 in world 1)', {}, [], { C: f => { f.per.Y51 = enc([0, 0, 0, 1e-9]); } });
  refuses('SN not reproducing STEP-S370\'s saved SN (its world-2 bits)', {}, [], { SN: f => { f.bits.OWN2 = enc8([1, 1, 1, 1]); } });
  refuses('SN not reproducing STEP-S370\'s saved SN (its world-0 moves)', {}, [], { SN: f => { f.moves.MV0 = enc16([1, 2, 65535, 1, 2, 3, 5, 65535]); } });
  refuses('no saved STEP-S370 file for C', {}, [], { C: f => { for (const k of Object.keys(f)) delete f[k]; } });
  { const all = ARMS.map(a => mk(a)), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate refuses a full read with no saved STEP-S370 files at all', String(gate(jobs, { npw, files, saved: {} }).length > 0), 'true'); }
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
  const DIR = args[0] || join(HERE, 'results', 'diago182'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1), SAVED = args[3] || join(HERE, 'results', 'diagsteps370');
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  // the preflight runs at a fraction of the points and paths, where no saved run exists to compare: its inert check is skipped
  const saved = PRE ? null : Object.fromEntries(Object.values(INERT).filter(f => existsSync(join(SAVED, f))).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(SAVED, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files, saved });
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const J = Object.fromEntries(Object.entries(LABELS).map(([a, l]) => [a, jobs.find(x => x.label === l)])), FJ = a => files[J[a].file];
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - C, SN and SNR once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}; S370 at 30 points); the candidate's settings with no readerRef, NODES_SN on SN and SNR, the split on SNR alone, every self-check in full${PRE ? '' : `; C and SN reproduce STEP-S370's saved runs bit for bit (${SAVED}): the option inert off`}`);
  const sumY = (a, k, p) => { const f = FJ(a), u = decRaw(f.per[`${p}1${k}`]), v = decRaw(f.per[`${p}5${k}`]); return Float64Array.from(u, (x, i) => 100 * (x + v[i])); };
  const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
  if (PRE) { for (const a of ARMS) console.log(`PREFLIGHT ${a}: world-0 Y1 + Y5 ${f4(mean(sumY(a, 0, 'Y')))} points, its copied corners' I[R] ${f4(mean(sumY(a, 0, 'RC')))}, copied ${J[a].reader.copied}, clamped ${J[a].clamped.n} of ${J[a].clamped.of}, world-0 whole score ${f4(J[a].whole[0].mean)}`); console.log('PREFLIGHT: the gate and the files read; no figure read for an item (a preview at a fraction of the points; PREVIEW)'); process.exit(0); }
  const bitsF = (a, k) => dec8(FJ(a).bits[`OWN${k}`]), wsF = (a, k) => decRaw(FJ(a).per[`WS${k}`]);
  const P = { y: { SN: sumY('SN', 0, 'Y'), SNR: sumY('SNR', 0, 'Y') }, rc: sumY('SN', 0, 'RC'), cells: [0, 1, 2].map(k => cellsOf(bitsF('C', k), bitsF('SNR', k))), ws: [0, 1, 2].map(k => wsOf(wsF('C', k), wsF('SNR', k))), tab: { C: J.C.tables[0].OWN, SNR: J.SNR.tables[0].OWN } };
  const it = items(P), iv = x => `${f4(x.d ?? x.R)} (${f4(x.lo)} to ${f4(x.hi)})`;
  console.log('\nSTEP-O182: a copied corner\'s residual R carried unscaled into queries of higher chance, at S370\'s years 1 and 5, the candidate as it stands (predictions/diag-o182.md)');
  console.log('\nTHE ITEMS (each read by its registered rule)');
  console.log(`1. under SN the copied corners' I[R] carries at least half of world 0's Y1 + Y5 (path by path): ${it['1'].outcome}`);
  console.log(`     the share ${iv(it['1'].r)} of SN's mean ${f4(it['1'].r.mc)} points${it['1'].nothing ? ' (SN\'s Y1 + Y5 under a point: nothing to carry)' : ''}`);
  console.log(`2. SNR removes at least half of SN's world-0 Y1 + Y5: ${it['2'].outcome}`);
  console.log(`     the removal ${iv(it['2'].r)} of SN's mean ${f4(it['2'].r.mc)} points${it['2'].nothing ? ' (nothing to remove)' : ''}`);
  console.log(`3. SNR's world-0 table less runs at most half of C's: ${it['3'].outcome}`);
  console.log(`     C's table less runs ${f4(it['3'].dr.gapC)}, SNR's ${f4(it['3'].dr.gapX)}, the drop ${iv(it['3'].dr)}`);
  console.log(`4. no material harm, SNR against C, by RULES.md section 8's rule as written (survival by both, whole score beside), per world: ${it['4'].outcome}`);
  for (const x of it['4'].per) console.log(`     world ${x.k}: survival ${f4(x.ex.d)} exact (${f4(x.ex.lo)} to ${f4(x.ex.hi)}) ${x.ex.outcome}, guarded unconditional (${f4(x.u.lo)} to ${f4(x.u.hi)}), whole score ${iv(x.w)}, margin ${f4(x.margin)}: ${x.harm ? 'harm' : x.ok ? 'no material harm' : 'inconclusive'}`);
  console.log(`OUTCOME: 1 ${it['1'].outcome}, 2 ${it['2'].outcome}, 3 ${it['3'].outcome}, 4 ${it['4'].outcome}`);
  console.log(`ROW: ${rowOf(it)}`);
  console.log(`REALISED item 1: ${f4(it['1'].r.R)}`); console.log(`REALISED item 2: ${f4(it['2'].r.R)}`); console.log(`REALISED item 3: ${f4(it['3'].dr.d)}`); console.log(`REALISED item 4: ${f4(it['4'].per[0].ex.d)}`);
  console.log('\nREPORTED');
  for (const a of ARMS) for (let k = 0; k < 3; k++) { const s = J[a].sims[`OWN${k}`], L = J[a].ledger[k], t = J[a].tables[k].OWN; console.log(`  ${a} world ${k}: table ${f4(t)} runs ${s.ok}/${s.n} (${f4(100 * s.ok / s.n)}), table less runs ${f4(t - 100 * s.ok / s.n)}; GB ${f4(L.GB)} GA ${f4(L.GA)} T ${f4(L.T)}; by year ${(J[a].bridge || []).map(y => `${y}: ${f4(L[`Y${y}`])}`).join(' | ')}`); }
  for (const a of ARMS) for (let k = 0; k < 3; k++) { const S = J[a].split[k]; console.log(`  ${a} world ${k} split by year (PC, RS, RC): ${(J[a].bridge || []).map(y => `${y}: ${f4(S[`PC${y}`])}, ${f4(S[`RS${y}`])}, ${f4(S[`RC${y}`])}`).join(' | ')}`); }
  for (const a of ARMS) console.log(`  ${a}: copied ${J[a].reader.copied} copiedTop ${J[a].reader.copiedTop} of ${J[a].reader.nodes} nodes; reads at the clamp ${J[a].clamped.n} of ${J[a].clamped.of}; solve ${J[a].solve.secs} s`);
}
