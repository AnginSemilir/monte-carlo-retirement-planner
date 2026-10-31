/*
 * STEP-S370'S REDUCER (PLAN.md STEP-S370, items/STEP-S370.md; predictions/diag-steps370.md; the deep review after HO-DEP,
 * deep-review-log.md 18 Oct 18:40 UK; O180). Three jobs on S370 at the candidate's own unit, seed 7002, the first 4,000 paths a
 * world, into results/diagsteps370 (audit-steps370.mjs): C (the candidate as it stands, the plan reference, 30 points), SN (C with
 * explicit pension-share nodes, three more in the top cell) and W60 (C at 60 wealth points).
 * THE GATE: each job once and done at the registered settings, stamped as launched, the fair-test gate on the logs (one audit);
 *   its solve's meta reads the candidate's settings with no readerRef, the nodes asked (SN's NODES_SN, none on C and W60) and the
 *   grid's size; its floor the product's own rule's; every self-check in full (armTook, ownTook, identity on 12,000 paths,
 *   qfTook, layerTook, scoreTook); the files whole, their bits, moves and whole scores the logs'.
 * THE ITEMS (world 0's step-year residual: the ledger's Y3 + Y7 per path, S370's step years):
 *   1: SN's removal of C's world-0 step-year residual, path by path (the ratio sum(C - SN) / sum(C) with its interval by the
 *      delta method at 95%): HELD when its interval lies at or above one half; FALSIFIED when it lies below one quarter;
 *      otherwise INCONCLUSIVE; INCONCLUSIVE too when C's mean residual is under a point (nothing to remove).
 *   2: W60's removal of the same, the same three outcomes.
 *   3: no material harm, SN against C, by RULES.md section 8's rule as written for a policy change: per world the exact
 *      conditional McNemar at the relative margin marginRel(C's survival) with Holm across the three worlds, AND the guarded
 *      unconditional interval's lower end above minus the margin; the whole score per world by its normal interval at 95%
 *      (no material harm above minus the margin, harm wholly below it). HELD when every world reads no material harm on both
 *      legs; FALSIFIED when any world reads harm on either; otherwise INCONCLUSIVE.
 *   4: SN's world-0 table less runs against C's: the drop (C's table less runs) - (SN's), C's and SN's tables fixed and their
 *      runs paired by path (the guarded unconditional interval at 95%): HELD when the drop's interval lies at or above half
 *      of C's table less runs; FALSIFIED when it lies below a quarter of it; otherwise INCONCLUSIVE; INCONCLUSIVE too when C's
 *      table less runs is under a point.
 * THE ROWS: R2 item 3 FALSIFIED (SN harms); R1 item 1 HELD (S370-COPY); R3 item 1 FALSIFIED and item 2 HELD (S370-GRID); R4
 *   items 1 and 2 FALSIFIED (neither); else.
 * REPORTED: every arm's tables against its runs by world; GB, GA, T and Y by year by world; the reader's copied nodes and
 *   copied top nodes (copiedTop: a count of nodes, not the step reads' weight on the top node); the solves' seconds.
 *   node research/solver/reduce-steps370.mjs [dir] [paths a world] [scale] [--preflight] [--planted]
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
export const PRED = 'research/solver/predictions/diag-steps370.md';
export const HOUSE = 'S370', SEED = '7002', NPW = 4000, NQF = 1000;
export const NODES_SN = Object.freeze([0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1]);
export const HALF = 0.5, QUARTER = 0.25, MINRES = 1;
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const ARMS = ['C', 'SN', 'W60'];
export const PTS = Object.freeze({ C: 30, SN: 30, W60: 60 });
export const LABELS = Object.freeze(Object.fromEntries(ARMS.map(a => [a, `${a}/P${PTS[a]}S6Q5`])));
export const STEPS = Object.freeze([3, 7]);
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S\d+)\s+case \| job ((C|SN|W60)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^STEP-S370: .*?, (\d+) paths a world.*?, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts: Number(c[6]), stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, checks: {}, tables: [], sims: {}, moves: [], ledger: [], qf: [], whole: [], nodes: null, reader: null, bridge: null, own: null, solve: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label, e = esc(L);
    let m;
    if ((m = new RegExp(`^solve CAND ${e}: table (\\S+) secs (\\d+)$`).exec(l))) j.solve = { table: Number(m[1]), secs: Number(m[2]) };
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^nodes ${e}: (.+) floor (\\d+) \\(the product's rule (\\d+)\\)$`).exec(l))) j.nodes = { list: m[1], floor: Number(m[2]), rule: Number(m[3]) };
    else if ((m = new RegExp(`^reader ${e}: tables (\\S+) unsupported (\\S+) copied (\\S+) copiedTop (\\S+) nodes (\\S+)$`).exec(l))) j.reader = { copied: Number(m[3]), copiedTop: Number(m[4]), nodes: Number(m[5]) };
    else if ((m = new RegExp(`^openings ${e}: OWN ai (\\d+) `).exec(l))) j.own = { ai: Number(m[1]) };
    else if ((m = new RegExp(`^tables ${e} (\\d) z (\\S+) weight (\\S+): OWN (\\S+) READ (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), OWN: Number(m[4]), READ: Number(m[5]) };
    else if ((m = new RegExp(`^bridge ${e}: reader years ?(\\S*)$`).exec(l))) j.bridge = m[1] ? m[1].split(',').map(Number) : [];
    else if ((m = new RegExp(`^sim ${e} (\\d) OWN ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`OWN${m[1]}`] = { ai: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bridge: Number(m[5]), bits: m[6], bitsB: m[7] };
    else if ((m = new RegExp(`^moves ${e} (\\d): path-years (\\d+) sha (\\S+)$`).exec(l))) j.moves[Number(m[1])] = { py: Number(m[2]), sha: m[3] };
    else if ((m = new RegExp(`^ledger ${e} (\\d): (.*)$`).exec(l))) j.ledger[Number(m[1])] = Object.fromEntries([...m[2].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])]));
    else if ((m = new RegExp(`^qf ${e} (\\d): paths (\\d+) QF (\\S+)$`).exec(l))) j.qf[Number(m[1])] = { n: Number(m[2]), QF: Number(m[3]) };
    else if ((m = new RegExp(`^whole ${e} (\\d): mean (\\S+) `).exec(l))) j.whole[Number(m[1])] = { mean: Number(m[2]) };
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerSplit: 'null', readerBlend: 'null', readerRef: 'null', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3' };
const NEED = ['armTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook'];
const decRaw = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null } = {}) {
  const bad = [];
  for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(`a job that is not STEP-S370's: ${x.label}`);
  for (const [arm, label] of Object.entries(LABELS)) {
    const js = jobs.filter(x => x.label === label);
    if (js.length !== 1) { bad.push(`${arm}: ${js.length ? `run ${js.length} times` : 'missing'}`); continue; }
    const j = js[0], pts = Math.max(4, Math.round(PTS[arm] / scale)), sn = arm === 'SN';
    if (j.id !== HOUSE) bad.push(`${arm}: run on ${j.id}, not ${HOUSE}`);
    if (!j.done) bad.push(`${arm}: no done line`);
    if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push(`${arm}: no stamp`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${arm}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${arm}: solved at ${j.pts} points, not ${pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, pts: String(pts), grid: `total${pts}x${sn ? NODES_SN.length : 6}x6`, shareNodes: sn ? NODES_SN.join(',') : 'none' })) if (field(ran, f) !== v) bad.push(`${arm}: ${f} is ${field(ran, f)}, not ${v}`);
    if (!j.nodes || j.nodes.floor !== j.nodes.rule || field(ran, 'floor') !== String(j.nodes.floor)) bad.push(`${arm}: its floor is not the product's rule's`);
    if (!j.nodes || j.nodes.list !== (sn ? NODES_SN.join(',') : 'the uniform six')) bad.push(`${arm}: its share nodes are not ${sn ? 'NODES_SN' : 'the uniform six'}`);
    for (const c of NEED) { const x = j.checks[c]; if (!x || !(x[1] > 0) || x[0] !== x[1] || (c === 'armTook' && x[1] !== 1)) bad.push(`${arm}: ${c} did not pass in full`); }
    if (!j.own) bad.push(`${arm}: no openings line`);
    if (!j.solve) bad.push(`${arm}: no solve line`);
    if (!j.reader) bad.push(`${arm}: no reader line`);
    if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push(`${arm}: the identity was not held on every path of three worlds`);
    if (j.checks.scoreTook && j.checks.scoreTook[1] !== 3 * npw) bad.push(`${arm}: the whole score was not checked on every path of three worlds`);
    if (!j.bridge || STEPS.some(t => !j.bridge.includes(t))) bad.push(`${arm}: the bridge years do not hold S370's step years ${STEPS.join(' and ')}`);
    for (let w = 0; w < 3; w++) {
      const t = j.tables[w]; if (!t || !Number.isFinite(t.OWN) || !Number.isFinite(t.READ)) bad.push(`${arm}: world ${w}'s tables are missing`);
      const s = j.sims[`OWN${w}`]; if (!s || s.n !== npw || (j.own && s.ai !== j.own.ai)) bad.push(`${arm}: no OWN run of ${npw} paths at its opening in world ${w}`);
      if (!j.ledger[w] || [...KEYS, ...(j.bridge || []).map(t => `Y${t}`)].some(x => !Number.isFinite(j.ledger[w][x]))) bad.push(`${arm}: world ${w}'s ledger line is missing or short`);
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
      for (let w = 0; w < 3; w++) {
        for (const x of [...KEYS, 'WS', ...STEPS.map(t => `Y${t}`)]) { const a = f.per && f.per[`${x}${w}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`${arm}: its file's ${x}${w} paths are not ${npw}`); }
        const ws = f.per && f.per[`WS${w}`]; if (ws && j.whole[w] && Math.abs(decRaw(ws).reduce((t, x) => t + x, 0) / npw - j.whole[w].mean) > 1e-5) bad.push(`${arm}: its file's world-${w} whole scores are not the log's`);
        const mv = f.moves && f.moves[`MV${w}`]; if (!mv || !j.moves[w] || sha16(Buffer.from(mv, 'base64')) !== j.moves[w].sha) bad.push(`${arm}: its file's world-${w} moves are not the log's`);
      }
    }
  }
  return bad;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
// a world's paired cells, control against arm: a both alive, b lost (the control alive, the arm not), c saved, d both dead
export const cellsOf = (ctrl, arm) => { let a = 0, b = 0, c = 0, d = 0; for (let i = 0; i < ctrl.length; i++) { if (ctrl[i] && arm[i]) a++; else if (ctrl[i]) b++; else if (arm[i]) c++; else d++; } return { a, b, c, d }; };
// a world's paired whole-score change arm - control, its mean and standard error
export const wsOf = (ctrl, arm) => { const n = ctrl.length; let s = 0; for (let i = 0; i < n; i++) s += arm[i] - ctrl[i]; const m = s / n; let v = 0; for (let i = 0; i < n; i++) v += (arm[i] - ctrl[i] - m) ** 2; return { d: m, se: Math.sqrt(v / (n - 1) / n) }; };
// the share of C's residual an arm removes, path by path: R = sum(C - X) / sum(C), its interval by the delta method on the ratio
// of paired means; c and x in points
export function removal(c, x, z = zFor(0.05)) {
  const n = c.length; let sc = 0, sd = 0; for (let i = 0; i < n; i++) { sc += c[i]; sd += c[i] - x[i]; }
  const mc = sc / n, R = sc !== 0 ? sd / sc : NaN; let v = 0; for (let i = 0; i < n; i++) { const e = (c[i] - x[i]) - R * c[i]; v += e * e; }
  const se = Math.sqrt(v / Math.max(1, n - 1) / n) / Math.abs(mc);
  return { R, lo: R - z * se, hi: R + z * se, mc, n };
}
const removalItem = r => ({ outcome: !(r.mc >= MINRES) || !Number.isFinite(r.R) ? 'INCONCLUSIVE' : r.lo >= HALF ? 'HELD' : r.hi < QUARTER ? 'FALSIFIED' : 'INCONCLUSIVE', r, nothing: !(r.mc >= MINRES) });
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
// the drop in world 0's table less runs, SN against C: the tables fixed, the runs paired (the guarded unconditional interval)
export function dropOf(tabC, tabSN, cell, level = 0.05) {
  const N = cell.a + cell.b + cell.c + cell.d, gapC = tabC - 100 * (cell.a + cell.b) / N, gapSN = tabSN - 100 * (cell.a + cell.c) / N;
  const u = guarded(survivalChangeU(cell.a, cell.b, cell.c, cell.d, level), cell.b, cell.c, N, level);
  return { gapC, gapSN, d: (tabC - tabSN) + u.d, lo: (tabC - tabSN) + u.lo, hi: (tabC - tabSN) + u.hi };
}
/* P: { y: { C, SN, W60 }: world 0's Y3 + Y7 per path in points; cells: [3] C against SN; ws: [3] SN less C; tab: { C, SN } world 0's tables } */
export function items(P) {
  const out = {};
  out['1'] = removalItem(removal(P.y.C, P.y.SN));
  out['2'] = removalItem(removal(P.y.C, P.y.W60));
  out['3'] = harmWorlds(P.cells, P.ws);
  const dr = dropOf(P.tab.C, P.tab.SN, P.cells[0]);
  out['4'] = { outcome: !(dr.gapC >= MINRES) ? 'INCONCLUSIVE' : dr.lo >= HALF * dr.gapC ? 'HELD' : dr.hi < QUARTER * dr.gapC ? 'FALSIFIED' : 'INCONCLUSIVE', dr, nothing: !(dr.gapC >= MINRES) };
  return out;
}
export function rowOf(it) {
  const o = i => it[i].outcome;
  if (o('3') === 'FALSIFIED') return 'R2';
  if (o('1') === 'HELD') return 'R1';
  if (o('1') === 'FALSIFIED' && o('2') === 'HELD') return 'R3';
  if (o('1') === 'FALSIFIED' && o('2') === 'FALSIFIED') return 'R4';
  return 'else';
}

// THE PLANTED CHECKS: each item to each outcome on a case built for it, the rows, the gate's refusals, the EDGES
export const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
const N0 = 4000;
// a deterministic per-path residual: mean m, spread sd (points), the same draws every call
const ys = (m, sd, n = N0, seed = 7) => { let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; return Float64Array.from({ length: n }, () => m + sd * Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r())); };
const cellsAt = (s, lost, saved) => { const al = Math.round(s / 100 * N0); return { a: al - lost, b: lost, c: saved, d: N0 - al - saved }; };
const P0 = () => { const C = ys(10, 20); return { y: { C, SN: C.map(v => 0.3 * v), W60: C.map(v => 0.9 * v) }, cells: [cellsAt(38, 10, 10), cellsAt(85, 10, 10), cellsAt(98.5, 5, 5)], ws: [{ d: 0, se: 0.05 }, { d: 0, se: 0.05 }, { d: 0, se: 0.05 }], tab: { C: 51, SN: 41 } }; };
function planted() {
  const cases = [], put = (what, got, want) => cases.push([what, got, want]);
  const run = (what, edit, i, want, edge) => { const P = P0(); edit(P); const it = items(P); REACHED[i].add(it[i].outcome); put(`${what}: ${i} ${want}`, it[i].outcome, want); if (edge) EDGES.push(edge); };
  run('SN removes seven tenths of C\'s step-year residual', () => {}, '1', 'HELD');
  run('SN removes a tenth', P => { P.y.SN = P.y.C.map(v => 0.9 * v); }, '1', 'FALSIFIED');
  run('SN removes four tenths', P => { P.y.SN = P.y.C.map(v => 0.6 * v); }, '1', 'INCONCLUSIVE');
  run('SN removes exactly half with no spread (the line itself)', P => { P.y.C = new Float64Array(N0).fill(10); P.y.SN = new Float64Array(N0).fill(5); }, '1', 'HELD', 'a removal exactly at one half with no spread reads HELD');
  run('C\'s residual under a point (nothing to remove)', P => { P.y.C = P.y.C.map(v => 0.05 * v); P.y.SN = P.y.C.map(v => 0); }, '1', 'INCONCLUSIVE', 'C\'s mean residual under a point: nothing to remove');
  run('SN makes the residual worse (a negative removal)', P => { P.y.SN = P.y.C.map(v => 1.2 * v); }, '1', 'FALSIFIED');
  run('SN removes 0.55 with spread, its interval below a half', P => { const e = ys(0, 40, N0, 99); P.y.SN = P.y.C.map((v, i) => 0.45 * v + e[i]); }, '1', 'INCONCLUSIVE');
  run('SN removes 0.2 with spread, its interval reaching a quarter', P => { const e = ys(0, 40, N0, 99); P.y.SN = P.y.C.map((v, i) => 0.8 * v + e[i]); }, '1', 'INCONCLUSIVE');
  run('W60 removes a tenth', () => {}, '2', 'FALSIFIED');
  run('W60 removes seven tenths', P => { P.y.W60 = P.y.C.map(v => 0.3 * v); }, '2', 'HELD');
  run('W60 removes four tenths', P => { P.y.W60 = P.y.C.map(v => 0.6 * v); }, '2', 'INCONCLUSIVE');
  run('SN at C in every world', () => {}, '3', 'HELD');
  run('SN loses 60 paths in world 0', P => { P.cells[0] = cellsAt(38, 70, 10); }, '3', 'FALSIFIED');
  run('SN loses 15 paths net in world 1 (its interval across the margin, its loss under it)', P => { P.cells[1] = cellsAt(85, 25, 10); }, '3', 'INCONCLUSIVE', 'a world\'s survival interval across the margin');
  run('SN\'s whole score 1 point down in world 2 alone', P => { P.ws[2] = { d: -1, se: 0.05 }; }, '3', 'FALSIFIED');
  run('SN\'s whole score across the margin in world 0', P => { P.ws[0] = { d: -0.45, se: 0.1 }; }, '3', 'INCONCLUSIVE');
  run('SN loses 4 and saves none in world 1 (the guard holds the interval out)', P => { P.cells[1] = cellsAt(85, 4, 0); }, '3', 'HELD');
  run('SN loses 4 and saves none in world 2 (the exact rule and the unguarded interval read no material harm, the guarded interval does not)', P => { P.cells[2] = cellsAt(98.5, 4, 0); }, '3', 'INCONCLUSIVE', 'a one-sided loss the exact rule passes and the guard holds out');
  run('SN loses 70 and saves 50 in world 0 (unadjusted p under 0.05, Holm over it)', P => { P.cells[0] = cellsAt(38, 70, 50); }, '3', 'INCONCLUSIVE');
  run('SN\'s table drops 10 points on runs at C\'s', () => {}, '4', 'HELD');
  run('SN\'s table drops 1 point', P => { P.tab.SN = 50; }, '4', 'FALSIFIED');
  run('SN\'s table drops 5 points (C\'s gap 13)', P => { P.tab.SN = 46; }, '4', 'INCONCLUSIVE');
  run('C\'s table half a point over its runs (nothing to remove), SN\'s 1.5 points lower', P => { P.tab.C = 38.5; P.tab.SN = 37; }, '4', 'INCONCLUSIVE');
  run('SN\'s table drops 3 points on discordant runs (its interval reaching a quarter of C\'s gap)', P => { P.tab.SN = 48; P.cells[0] = cellsAt(38, 100, 100); }, '4', 'INCONCLUSIVE');
  run('SN\'s runs fall by as much as its table (no drop, paired by path)', P => { P.cells[0] = cellsAt(38, 210, 10); P.tab.SN = 46; }, '4', 'FALSIFIED', 'a table that falls with its runs reads no drop');
  // the decision rows
  { const P = P0(); put('the rows: SN removes most, no harm, reads R1', rowOf(items(P)), 'R1'); }
  { const P = P0(); P.cells[0] = cellsAt(38, 70, 10); put('the rows: SN harms, reads R2 over R1', rowOf(items(P)), 'R2'); }
  { const P = P0(); P.y.SN = P.y.C.map(v => 0.9 * v); P.y.W60 = P.y.C.map(v => 0.3 * v); put('the rows: W60 removes it, SN not, reads R3', rowOf(items(P)), 'R3'); }
  { const P = P0(); P.y.SN = P.y.C.map(v => 0.9 * v); put('the rows: neither removes it, reads R4', rowOf(items(P)), 'R4'); }
  { const P = P0(); P.y.SN = P.y.C.map(v => 0.6 * v); put('the rows: SN partly, reads else', rowOf(items(P)), 'else'); }
  { const P = P0(); P.y.SN = P.y.C.map(v => 0.6 * v); P.y.W60 = P.y.C.map(v => 0.3 * v); put('the rows: SN partly and W60 most, reads else (R3 needs item 1 FALSIFIED)', rowOf(items(P)), 'else'); }
  // the removal's arithmetic on a case worked by hand
  { const r = removal(Float64Array.from([2, 4, 6]), Float64Array.from([1, 2, 3])); put('the removal of a half on three paths reads 0.5 with no spread', `${r.R.toFixed(3)} ${r.lo.toFixed(3)} ${r.hi.toFixed(3)}`, '0.500 0.500 0.500'); }
  // the gate on synthetic logs and files
  const enc = a => Buffer.from(Float64Array.from(a).buffer).toString('base64'), enc8 = a => Buffer.from(Uint8Array.from(a)).toString('base64'), enc16 = a => Buffer.from(Uint16Array.from(a).buffer).toString('base64');
  const npw = 4;
  const mk = (arm, over = {}) => {
    const id = over.id || HOUSE, pts = over.pts || PTS[arm], L = `${arm}/P${pts}S6Q5`, sn = arm === 'SN', floor = over.floor ?? 104000, rule = over.rule ?? floor;
    const nodes = over.nodes ?? (sn ? NODES_SN.join(',') : 'none'), list = over.list ?? (nodes === 'none' ? 'the uniform six' : nodes), ranNodes = over.ranNodes ?? nodes;
    const bitsW = [1, 1, 0, 1], mv = [1, 2, 65535, 1, 2, 3, 4, 65535], ws = [100, 99.5, -2, 100];
    const lines = [`stamp: code c1 audit a1 prediction ${PRED} sha s1`, `STEP-S370: the candidate's own unit, ${over.npw || npw} paths a world, wealth points divided by 1 (seed ${over.seed || SEED}); 3 jobs; part 0/1`, `${id.padEnd(16)} case | job ${L} | points ${over.casePts || pts} | lambda 0.0223606797749979`,
      `solve CAND ${L}: table 50.0000 secs 10`, `ran CAND ${L}: bridgeRead reader bridgeStep exact readerSplit null readerBlend null readerRef ${over.ref || 'null'} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${pts} grid total${pts}x${over.gridA ?? (nodes === 'none' ? 6 : nodes.split(',').length)}x6 shareNodes ${ranNodes} floor ${floor} line 0.5`,
      `reader ${L}: tables 72 unsupported 0 copied 10 copiedTop 5 nodes 100`, `nodes ${L}: ${list} floor ${floor} (the product's rule ${rule})`, `checks ${L}: armTook 1/1`, `openings ${L}: OWN ai 14 level 1 tiers 2,2`];
    for (let w = 0; w < 3; w++) if (!(over.noTables && w === 1)) lines.push(`tables ${L} ${w} z 0 weight 0.333333: OWN 50.000000 READ 50.000000`);
    lines.push(`bridge ${L}: reader years ${over.bridge || '1,2,3,4,5,6,7'}`);
    const per = {}, bits = {}, moves = {};
    for (let w = 0; w < (over.worlds ?? 3); w++) {
      lines.push(`sim ${L} ${w} OWN ai 14: 3/${over.simN ?? npw} bridge 3 bits ${sha16(Buffer.from(Uint8Array.from(bitsW)))} ${sha16(Buffer.from(Uint8Array.from(bitsW)))}`, `moves ${L} ${w}: path-years ${over.py ?? 6} sha ${sha16(Buffer.from(Uint16Array.from(mv).buffer))}`, `ledger ${L} ${w}: X 75 B0 75 T 0 GB 0 GA 0 GL 0 GD 0 Y1 0 Y2 0 Y3 0 Y4 0 Y5 0 Y6 0 Y7 0`, `qf ${L} ${w}: paths ${Math.min(npw, NQF)} QF 0`, `whole ${L} ${w}: mean ${(ws.reduce((t, x) => t + x, 0) / npw).toFixed(6)} spending years 46 of 46 floor level 0.8 scale 1 cap 1 death charge 0`);
      for (const x of [...KEYS, 'Y3', 'Y7']) if (!(over.noY && x === 'Y7')) per[`${x}${w}`] = enc([0, 0, 0, 0]);
      per[`WS${w}`] = enc(over.wsFile && w === 0 ? [0, 0, 0, 0] : ws); bits[`OWN${w}`] = enc8(bitsW); bits[`OWN${w}b`] = enc8(bitsW); moves[`MV${w}`] = enc16(mv);
    }
    lines.push(`checks ${L}: ownTook 12/12 identity ${3 * npw}/${3 * npw} qfTook 9/9 layerTook 9/9 scoreTook ${over.score ?? 3 * npw}/${3 * npw} secs 1`, `file ${L}: ${id}-${arm}.json.gz`);
    if (!over.notDone) lines.push(`done ${L}`);
    return { text: lines.join('\n'), file: [`${id}-${arm}.json.gz`, { stamp: { code: 'c1', audit: 'a1', prediction: PRED, sha: 's1' }, NPW: npw, seed: 7002, own: 14, bridge: [1, 2, 3, 4, 5, 6, 7], per, bits, moves, tables: {} }] };
  };
  const gateOf = (overs = {}, extra = []) => { const all = ARMS.map(a => mk(a, overs[a] || {})), jobs = [...all, ...extra].flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); return gate(jobs, { npw, files }); };
  put('the gate passes the three jobs as registered', gateOf().join('; '), '');
  const refuses = (what, overs, extra = []) => put(`the gate refuses ${what}`, String(gateOf(overs, extra).length > 0), 'true');
  refuses('a job run twice', {}, [mk('C')]);
  refuses('a job of another test beside the three', {}, [mk('C', { pts: 60 })]);
  refuses('SN without its nodes (the nodes plant)', { SN: { nodes: 'none' } });
  refuses('C with SN\'s nodes', { C: { nodes: NODES_SN.join(',') } });
  refuses('SN with other nodes', { SN: { nodes: '0,0.2,0.4,0.6,0.8,1' } });
  refuses('a grid line of another size', { SN: { gridA: 6 } });
  refuses('SN\'s solve meta naming other nodes of the same count, its nodes line right', { SN: { ranNodes: '0,0.2,0.4,0.6,0.85,0.9,0.95,1' } });
  refuses('SN\'s nodes line naming other nodes, its solve meta right', { SN: { list: '0,0.2,0.4,0.6,0.85,0.9,0.95,1' } });
  refuses('a run line on another path count', { C: { simN: 5 } });
  refuses('a reader reference set', { C: { ref: 'order' } });
  refuses('W60 at 30 points', { W60: { pts: 30 } });
  refuses('a case line at another point count alone', { C: { casePts: 4 } });
  refuses('another seed', { SN: { seed: '7004' } });
  refuses('another household', { C: { id: 'S362' } });
  refuses('a header naming another path count', { W60: { npw: 8 } });
  refuses('a floor other than the product rule\'s', { C: { floor: 9000, rule: 104000 } });
  refuses('a world\'s tables line missing', { SN: { noTables: true } });
  refuses('a file without year 7\'s residual', { C: { noY: true } });
  refuses('bridge years without year 7', { SN: { bridge: '1,2,3,4,5,6' } });
  refuses('scoreTook short (the score and trace plants)', { W60: { score: 3 * npw - 1 } });
  refuses('C with no done line', { C: { notDone: true } });
  refuses('a job short of a world', { SN: { worlds: 2 } });
  refuses('a file whose whole scores are not the log\'s', { C: { wsFile: true } });
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
  const DIR = args[0] || join(HERE, 'results', 'diagsteps370'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const J = Object.fromEntries(Object.entries(LABELS).map(([a, l]) => [a, jobs.find(x => x.label === l)])), FJ = a => files[J[a].file];
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - C, SN and W60 once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}; S370; C and SN at 30 points, W60 at 60); the candidate's settings with no readerRef, SN's nodes and no others, every self-check in full`);
  const stepY = (a, k) => { const f = FJ(a), y3 = decRaw(f.per[`Y3${k}`]), y7 = decRaw(f.per[`Y7${k}`]); return Float64Array.from(y3, (v, i) => 100 * (v + y7[i])); };
  if (PRE) { for (const a of ARMS) console.log(`PREFLIGHT ${a}: world-0 step-year residual ${f4(stepY(a, 0).reduce((t, x) => t + x, 0) / npwA)} points, copiedTop ${J[a].reader.copiedTop}, world-0 whole score ${f4(J[a].whole[0].mean)}`); console.log('PREFLIGHT: the gate and the files read; no figure read'); process.exit(0); }
  const bitsF = (a, k) => dec8(FJ(a).bits[`OWN${k}`]), wsF = (a, k) => decRaw(FJ(a).per[`WS${k}`]);
  const P = { y: { C: stepY('C', 0), SN: stepY('SN', 0), W60: stepY('W60', 0) }, cells: [0, 1, 2].map(k => cellsOf(bitsF('C', k), bitsF('SN', k))), ws: [0, 1, 2].map(k => wsOf(wsF('C', k), wsF('SN', k))), tab: { C: J.C.tables[0].OWN, SN: J.SN.tables[0].OWN } };
  const it = items(P), iv = x => `${f4(x.d ?? x.R)} (${f4(x.lo)} to ${f4(x.hi)})`;
  console.log('\nSTEP-S370: the step read\'s copy across the unsupported top share node at S370\'s step years 3 and 7, the candidate as it stands (predictions/diag-steps370.md)');
  console.log('\nTHE ITEMS (each read by its registered rule)');
  console.log(`1. SN removes at least half of C's world-0 step-year residual (Y3 + Y7, path by path): ${it['1'].outcome}`);
  console.log(`     the removal ${iv(it['1'].r)} of C's mean ${f4(it['1'].r.mc)} points${it['1'].nothing ? ' (C\'s residual under a point: nothing to remove)' : ''}`);
  console.log(`2. W60 removes at least half of the same: ${it['2'].outcome}`);
  console.log(`     the removal ${iv(it['2'].r)}${it['2'].nothing ? ' (nothing to remove)' : ''}`);
  console.log(`3. no material harm, SN against C, by RULES.md section 8's rule as written (survival by both, whole score beside), per world: ${it['3'].outcome}`);
  for (const x of it['3'].per) console.log(`     world ${x.k}: survival ${f4(x.ex.d)} exact (${f4(x.ex.lo)} to ${f4(x.ex.hi)}) ${x.ex.outcome}, guarded unconditional (${f4(x.u.lo)} to ${f4(x.u.hi)}), whole score ${iv(x.w)}, margin ${f4(x.margin)}: ${x.harm ? 'harm' : x.ok ? 'no material harm' : 'inconclusive'}`);
  console.log(`4. SN's world-0 table less runs falls by at least half of C's: ${it['4'].outcome}`);
  console.log(`     C's table less runs ${f4(it['4'].dr.gapC)}, SN's ${f4(it['4'].dr.gapSN)}, the drop ${iv(it['4'].dr)}`);
  console.log(`OUTCOME: 1 ${it['1'].outcome}, 2 ${it['2'].outcome}, 3 ${it['3'].outcome}, 4 ${it['4'].outcome}`);
  console.log(`ROW: ${rowOf(it)}`);
  console.log(`REALISED item 1: ${f4(it['1'].r.R)}`); console.log(`REALISED item 2: ${f4(it['2'].r.R)}`); console.log(`REALISED item 3: ${f4(it['3'].per[0].ex.d)}`); console.log(`REALISED item 4: ${f4(it['4'].dr.d)}`);
  console.log('\nREPORTED');
  for (const a of ARMS) for (let k = 0; k < 3; k++) { const s = J[a].sims[`OWN${k}`], L = J[a].ledger[k], t = J[a].tables[k].OWN; console.log(`  ${a} world ${k}: table ${f4(t)} runs ${s.ok}/${s.n} (${f4(100 * s.ok / s.n)}), table less runs ${f4(t - 100 * s.ok / s.n)}; GB ${f4(L.GB)} GA ${f4(L.GA)} T ${f4(L.T)}; by year ${(J[a].bridge || []).map(y => `${y}: ${f4(L[`Y${y}`])}`).join(' | ')}`); }
  for (const a of ARMS) console.log(`  ${a}: copied ${J[a].reader.copied} copiedTop ${J[a].reader.copiedTop} of ${J[a].reader.nodes} nodes; solve ${J[a].solve.secs} s`);
}
