/*
 * REF-B'S REDUCER (PLAN.md REF-B; predictions/diag-refb.md; the deep review after COPY-B, deep-review-log.md 19 Oct 20:19 UK,
 * adopted in PLAN.md's 19 Oct 20:30 row; O188; PR24's gate cut to the root cause). The adaptive reference against the plan
 * reference, crossed with the copy rule, seed 7002, the first 4,000 paths a world (audit-refb.mjs, results/diagrefb): AR (the
 * adaptive reference, its fix and the RS split, K1F's package), ARX (AR with the copy rule) and AN (the adaptive reference and
 * its fix alone) on S362 and S370, AR on S130 (the control), each against the plan reference's C and CX: COPY-B's saved cells
 * for S362 and S130 (results/diagcopyb, behind COPY-B's own gate) and COPY-X's for S370 (results/diagcopyx, behind COPY-X's).
 * Its gate: the fair-test gate on REF-B's logs; the seven jobs once and done at the registered settings with every self-check
 * in full, on one code, the adaptive reference's own record (its fix on, moves made, no non-monotone node) printed for each;
 * THE REUSE (a new test of old files, CHECKLIST item 3): COPY-B's and COPY-X's reducers pass their gates over their files, and
 * the reused cells share REF-B's code, seed, paths, bridge years and settings but the reference.
 * THE ITEMS, each with three outcomes; an item's cells read with Bonferroni intervals (0.05 over the cells it reads):
 *   1: the plan reference carries S362's bridge under-read (O188-REF): in each world where C's GB is a point or more in size,
 *      AN removes it, path by path (sum(GB_C - GB_AN) / sum(GB_C), its interval by the delta method), and AN's read error
 *      from each of years 1, 2 and 3 (the tail sum: the residual at that bridge year and every later one, with GA) lies
 *      within a point; a cell reads removed when the removal's interval lies at or above three quarters and the three tail
 *      sums' intervals within [-1, 1], kept when the removal's interval lies below a quarter; HELD when every cell read reads
 *      removed, FALSIFIED when any reads kept, otherwise INCONCLUSIVE.
 *   2: the plan reference carries S370's first two years' increments (Y12R): in each world where C's Y1 + Y2 is a point or
 *      more in size, AN removes it, path by path, read as item 1's removal alone (three quarters and a quarter).
 *   3: the copy rule and the adaptive package add: (ARX - AR) - (CX - C) in table less runs per household (S362, S370) and
 *      world, against half a point (COPY-B's item 2); the copied part QC's change under each reference printed (O190).
 *   4: the control: AR moves S130's GB by under a quarter of a point in every world (the change's mean interval within
 *      [-0.25, 0.25]; moved when wholly outside); HELD when every world reads still, FALSIFIED when any moved.
 *   5: no material harm per world by RULES.md section 8's rule as written (COPY-X's harmWorlds), AR, ARX and AN each against C
 *      on S362 and S370 and AR against C on S130, each leg at 0.05 over its households; HELD when every leg reads no material
 *      harm in every world, FALSIFIED when any reads harm, otherwise INCONCLUSIVE.
 * THE ROWS: R5 item 5 FALSIFIED; R3 item 4 FALSIFIED (the control moved: the comparison's premise fails on a one-bridge-year
 *   household); R1 item 1 HELD (O188-REF credited); R2 item 1 FALSIFIED (O188-NOTREF); else.
 * REPORTED: every arm's tables against its runs by world; GB, GA, T, G; the residual by bridge year and the read error from
 *   each bridge year on (the tail sum: the backlog row of 19 Oct 20:19 UK); the four-way split by bridge year; AR against AN
 *   (the RS split's own part); the copied nodes; the adaptive reference's record; the reads at the clamp; each leg's saved and
 *   lost paths by the band of the year their moves first differ; the solves' seconds; REALISED lines for each item's point.
 *   node research/solver/reduce-refb.mjs [dir] [paths a world] [scale] [COPY-B dir] [COPY-X dir] [--preflight] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { zFor } from './stats.mjs';
import { sha16 } from './reduce-ao.mjs';
import { spawnSync } from 'node:child_process';
import { cellsOf, wsOf, removal, harmWorlds, parse as parseX, LABELS as LABELS_X } from './reduce-copyx.mjs';
import { interOf, meanOf, closeOf } from './reduce-copyw.mjs';
import { parse as parseB, keyOf as keyOfB } from './reduce-copyb.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-refb.md';
export const SEED = '7002', NPW = 4000, NQF = 1000;
export const QUARTER = 0.25, THREEQ = 0.75, MINRES = 1, TAIL = 1, STILL = 0.25, INTER = 0.5;
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const PARTS = Object.freeze(['QS', 'QC', 'RS', 'RC']);
// the jobs as registered: [household, arm, wealth points] (audit-refb.mjs's JOBS, in its order)
export const EXPECT = Object.freeze([['S370', 'AR', 30], ['S370', 'ARX', 30], ['S370', 'AN', 30], ['S362', 'AR', 30], ['S362', 'ARX', 30], ['S362', 'AN', 30], ['S130', 'AR', 30]]);
export const LATTICE_LINE = '160x41 nz 128';
export const SPLIT = Object.freeze({ AR: 'rs', ARX: 'rs', AN: 'null' });
export const COPY = Object.freeze({ AR: 'null', ARX: 'extrap', AN: 'null' });
export const keyOf = (id, arm, pts) => `${id} ${arm}/P${pts}S6Q5`;
// the reused cells: [household, arm, the test that saved them]
export const REUSED = Object.freeze([['S362', 'C', 'COPY-B'], ['S362', 'CX', 'COPY-B'], ['S130', 'C', 'COPY-B'], ['S370', 'C', 'COPY-X'], ['S370', 'CX', 'COPY-X']]);
// the legs of item 5: [arm, control, households]
export const LEGS = Object.freeze([['AR', 'C', ['S362', 'S370', 'S130']], ['ARX', 'C', ['S362', 'S370']], ['AN', 'C', ['S362', 'S370']]]);
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S\d+)\s+case \| job ((AR|ARX|AN)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^REF-B: .*?, (\d+) paths a world.*?, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts: Number(c[6]), key: `${c[1]} ${c[2]}`, stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, checks: {}, tables: [], sims: {}, moves: [], ledger: [], split: [], qf: [], whole: [], years: [[], [], []], nodes: null, reader: null, recount: null, clamped: null, bridge: null, own: null, solve: null, ran: null, adaptive: null, file: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label, e = esc(L);
    let m;
    if ((m = new RegExp(`^solve CAND ${e}: table (\\S+) secs (\\d+)$`).exec(l))) j.solve = { table: Number(m[1]), secs: Number(m[2]) };
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if ((m = new RegExp(`^adaptive ${e}: readerRef (\\S+) fix (\\S+) moves (\\d+) nonMono (-?\\d+) lattice (.+)$`).exec(l))) j.adaptive = { ref: m[1], fix: m[2] === 'true', moves: Number(m[3]), nonMono: Number(m[4]), lattice: m[5] };
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

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerBlend: 'null', readerRef: 'adaptive', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3' };
const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];
const decRaw = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null } = {}) {
  const bad = [], ptsAt = p => Math.max(4, Math.round(p / scale)), want = EXPECT.map(([id, arm, pts]) => ({ id, arm, pts: ptsAt(pts), key: keyOf(id, arm, pts) }));
  for (const x of jobs) if (!want.some(w => w.key === x.key)) bad.push(`a job that is not REF-B's: ${x.key}`);
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
    for (const [f, v] of Object.entries({ ...COMMON, readerSplit: SPLIT[w.arm], readerCopy: COPY[w.arm], pts: String(w.pts), grid: `total${w.pts}x6x6`, shareNodes: 'none' })) if (field(ran, f) !== v) bad.push(`${K}: ${f} is ${field(ran, f)}, not ${v}`);
    if (!j.adaptive || j.adaptive.ref !== 'adaptive' || !j.adaptive.fix || !(j.adaptive.moves > 0) || j.adaptive.nonMono !== 0 || j.adaptive.lattice !== LATTICE_LINE) bad.push(`${K}: the adaptive reference's own record is not its fixed lattice's (${j.adaptive ? `fix ${j.adaptive.fix} moves ${j.adaptive.moves} nonMono ${j.adaptive.nonMono}` : 'no adaptive line'})`);
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
    }
    if (files) {
      const f = j.file && files[j.file];
      if (!f) { bad.push(`${K}: its file ${j.file} is missing`); continue; }
      if (f.id !== j.id || f.job !== j.label) bad.push(`${K}: its file is ${f.id} ${f.job}`);
      if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${K}: its file is stamped by other code`);
      if (f.NPW !== npw) bad.push(`${K}: its file is not on ${npw} paths a world`);
      if ((f.bridge || []).join(',') !== (j.bridge || []).join(',')) bad.push(`${K}: its file's bridge years are not the log's`);
      for (const [nm, s] of Object.entries(j.sims)) for (const [b, sh] of [[nm, s.bits], [`${nm}b`, s.bitsB]]) { const x = f.bits && f.bits[b]; if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(`${K}: its file's ${b} bits are not the log's`); }
      for (let k = 0; k < 3; k++) {
        for (const x of [...KEYS, 'WS', ...(f.bridge || []).flatMap(t2 => [`Y${t2}`, ...PARTS.map(p => `${p}${t2}`)])]) { const a = f.per && f.per[`${x}${k}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`${K}: its file's ${x}${k} paths are not ${npw}`); }
        const ws = f.per && f.per[`WS${k}`]; if (ws && j.whole[k] && Math.abs(decRaw(ws).reduce((t, x) => t + x, 0) / npw - j.whole[k].mean) > 1e-5) bad.push(`${K}: its file's world-${k} whole scores are not the log's`);
        const mv = f.moves && f.moves[`MV${k}`]; if (!mv || !j.moves[k] || sha16(Buffer.from(mv, 'base64')) !== j.moves[k].sha) bad.push(`${K}: its file's world-${k} moves are not the log's`);
      }
    }
  }
  return bad;
}

// THE REUSE: the plan reference's cells (COPY-B's and COPY-X's) against REF-B's jobs, the variables they must share; bOk and xOk
// are their own reducers' gates over their files; rJobs the reused jobs found ([household, arm] -> job)
export function reuseGate(rJobs, refJobs, bOk, xOk) {
  const bad = [];
  if (!bOk) bad.push('COPY-B\'s gate did not pass over its own files (reduce-copyb.mjs)');
  if (!xOk) bad.push('COPY-X\'s gate did not pass over its own files (reduce-copyx.mjs)');
  const code = refJobs[0] && refJobs[0].stamp && refJobs[0].stamp.code, npw = refJobs[0] && refJobs[0].head && refJobs[0].head.npw;
  for (const [h, a] of REUSED) {
    const j = rJobs[`${h} ${a}`];
    if (!j) { bad.push(`the reused ${h} ${a} not found`); continue; }
    if (j.id !== h) bad.push(`the reused ${h} ${a} is on ${j.id}`);
    if (!j.stamp || j.stamp.code !== code) bad.push(`the reused ${h} ${a} is on other code (${j.stamp && j.stamp.code}, not ${code})`);
    if (!j.head || j.head.seed !== SEED) bad.push(`the reused ${h} ${a} is not on seed ${SEED}`);
    if (!j.head || j.head.npw !== npw) bad.push(`the reused ${h} ${a} is not on the same paths a world`);
    for (const f of Object.keys(COMMON)) { const v = f === 'readerRef' ? 'null' : COMMON[f]; if (field(j.ran || '', f) !== v) bad.push(`the reused ${h} ${a}: ${f} is ${field(j.ran || '', f)}, not ${v}`); }
    if (field(j.ran || '', 'readerSplit') !== 'null' || field(j.ran || '', 'shareNodes') !== 'none' || field(j.ran || '', 'readerCopy') !== (a === 'CX' ? 'extrap' : 'null') || field(j.ran || '', 'pts') !== '30') bad.push(`the reused ${h} ${a}: a split, share nodes, another copy rule or another grid`);
    const peer = refJobs.find(x => x.id === h && x.bridge);
    if (!peer || (j.bridge || []).join(',') !== peer.bridge.join(',')) bad.push(`the reused ${h} ${a} reads other bridge years than REF-B's ${h}`);
  }
  return bad;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
const allOf = (per, yes, no) => (per.some(x => x.read === no) ? 'FALSIFIED' : per.every(x => x.read === yes) ? 'HELD' : 'INCONCLUSIVE');
// the read error from bridge year t on, per path: the residual at t and every later bridge year, with GA (the backlog row of
// 19 Oct 20:19 UK: a year's G is an increment; its tail sum is the read's error against the truth)
export const tailOf = (y, ga, bridge, t) => Float64Array.from(ga, (g, i) => { let s = g; for (const u of bridge) if (u >= t) s += y[u][i]; return s; });
/* P: { S362: { gb: { C, AN }: [3] per path, tails: { AN }: [3] [3 years] per path }, S370: { y12: { C, AN }: [3] per path },
   inter: { S362, S370 }: { tab: { C, CX, AR, ARX }: [3], bits: { ... }: [3] }, s130: { gb: { C, AR }: [3] },
   legs: { [arm] : { [h]: { cells: [3], ws: [3] } } } } */
export function items(P) {
  const out = {}, K = [0, 1, 2];
  { const read = K.filter(k => Math.abs(mean(P.S362.gb.C[k])) >= MINRES), zr = zFor(0.05 / Math.max(1, read.length)), zt = zFor(0.05 / Math.max(1, 3 * read.length));
    const per = read.map(k => { const r = removal(P.S362.gb.C[k], P.S362.gb.AN[k], zr), tails = P.S362.tails.AN[k].map(a => meanOf(a, zt)), tin = tails.every(c => c.lo >= -TAIL && c.hi <= TAIL);
      return { k, r, tails, read: r.lo >= THREEQ && tin ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear' }; });
    out['1'] = { outcome: per.length ? allOf(per, 'removed', 'kept') : 'INCONCLUSIVE', per, nothing: !per.length }; }
  { const read = K.filter(k => Math.abs(mean(P.S370.y12.C[k])) >= MINRES), z = zFor(0.05 / Math.max(1, read.length));
    const per = read.map(k => { const r = removal(P.S370.y12.C[k], P.S370.y12.AN[k], z); return { k, r, read: r.lo >= THREEQ ? 'removed' : r.hi < QUARTER ? 'kept' : 'unclear' }; });
    out['2'] = { outcome: per.length ? allOf(per, 'removed', 'kept') : 'INCONCLUSIVE', per, nothing: !per.length }; }
  { const z = zFor(0.05 / 6), per = ['S362', 'S370'].flatMap(h => K.map(k => { const I = P.inter[h], x = interOf({ C: I.tab.C[k], CX: I.tab.CX[k], CW: I.tab.AR[k], CXW: I.tab.ARX[k] }, { C: I.bits.C[k], CX: I.bits.CX[k], CW: I.bits.AR[k], CXW: I.bits.ARX[k] }, z);
      return { h, k, ...x, read: x.lo >= -INTER && x.hi <= INTER ? 'additive' : x.hi < -INTER || x.lo > INTER ? 'interacting' : 'unclear' }; }));
    out['3'] = { outcome: allOf(per, 'additive', 'interacting'), per }; }
  { const z = zFor(0.05 / 3), per = K.map(k => { const c = meanOf(Float64Array.from(P.s130.gb.AR[k], (v, i) => v - P.s130.gb.C[k][i]), z); return { k, c, read: c.lo >= -STILL && c.hi <= STILL ? 'still' : c.hi < -STILL || c.lo > STILL ? 'moved' : 'unclear' }; });
    out['4'] = { outcome: allOf(per, 'still', 'moved'), per }; }
  { const legs = LEGS.map(([arm, ctl, hs]) => ({ arm, ctl, per: hs.map(h => ({ h, ...harmWorlds(P.legs[arm][h].cells, P.legs[arm][h].ws, 0.05 / hs.length) })) })), all = legs.flatMap(l => l.per);
    out['5'] = { outcome: all.some(x => x.outcome === 'FALSIFIED') ? 'FALSIFIED' : all.every(x => x.outcome === 'HELD') ? 'HELD' : 'INCONCLUSIVE', legs }; }
  return out;
}
export function rowOf(it) {
  const o = i => it[i].outcome;
  if (o('5') === 'FALSIFIED') return 'R5';
  if (o('4') === 'FALSIFIED') return 'R3';
  if (o('1') === 'HELD') return 'R1';
  if (o('1') === 'FALSIFIED') return 'R2';
  return 'else';
}
// each item's point in the derivation's own definition (REALISED lines)
export const POINT = { 1: it => (it['1'].per.length ? Math.min(...it['1'].per.map(x => x.r.R)) : NaN), 2: it => (it['2'].per.length ? Math.min(...it['2'].per.map(x => x.r.R)) : NaN), 3: it => Math.max(...it['3'].per.map(x => Math.abs(x.d))), 4: it => Math.max(...it['4'].per.map(x => Math.abs(x.c.d))), 5: it => Math.min(...it['5'].legs.flatMap(l => l.per.flatMap(x => x.per.map(y => y.ex.d)))) };
// the items' input from the files: perP(h, arm, world, key) in points, bitsF(h, arm, world), wsF(h, arm, world), tabs[h][arm][k],
// bridge[h] the household's bridge years
export function pOf(perP, bitsF, wsF, tabs, bridge) {
  const K = [0, 1, 2], ys = (h, a, k) => Object.fromEntries(bridge[h].map(t => [t, perP(h, a, k, `Y${t}`)]));
  const y12 = (a, k) => { const y = ys('S370', a, k); return Float64Array.from(y[1], (v, i) => v + y[2][i]); };
  const inter = h => ({ tab: Object.fromEntries(['C', 'CX', 'AR', 'ARX'].map(a => [a, K.map(k => tabs[h][a][k])])), bits: Object.fromEntries(['C', 'CX', 'AR', 'ARX'].map(a => [a, K.map(k => bitsF(h, a, k))])) });
  const legs = Object.fromEntries(LEGS.map(([arm, ctl, hs]) => [arm, Object.fromEntries(hs.map(h => [h, { cells: K.map(k => cellsOf(bitsF(h, ctl, k), bitsF(h, arm, k))), ws: K.map(k => wsOf(wsF(h, ctl, k), wsF(h, arm, k))) }]))]));
  return { S362: { gb: { C: K.map(k => perP('S362', 'C', k, 'GB')), AN: K.map(k => perP('S362', 'AN', k, 'GB')) }, tails: { AN: K.map(k => [1, 2, 3].map(t => tailOf(ys('S362', 'AN', k), perP('S362', 'AN', k, 'GA'), bridge.S362, t))) } },
    S370: { y12: { C: K.map(k => y12('C', k)), AN: K.map(k => y12('AN', k)) } }, inter: { S362: inter('S362'), S370: inter('S370') }, s130: { gb: { C: K.map(k => perP('S130', 'C', k, 'GB')), AR: K.map(k => perP('S130', 'AR', k, 'GB')) } }, legs };
}
// the band of the year two arms' moves first differ on a path: 0 the opening, 1 the bridge, 2 the five years after it, 3 the rest
export function firstBand(mvA, mvB, years, nb, i) { for (let t = 0; t < years; t++) { const a = mvA[i * years + t], b = mvB[i * years + t]; if (a !== b) return t === 0 ? 0 : t <= nb ? 1 : t <= nb + 5 ? 2 : 3; } return -1; }

// THE PLANTED CHECKS: each item to each outcome on a case built for it, the rows, the gate's refusals, the reuse's, the EDGES
export const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
const N0 = 4000;
const ys = (m, sd, n = N0, seed = 7) => { let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; return Float64Array.from({ length: n }, () => m + sd * Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r())); };
const bitsAt = (ok, shift = 0) => Uint8Array.from({ length: N0 }, (_, i) => (i < ok - shift || (shift > 0 && i >= N0 - shift) ? 1 : 0));
const pairBits = (ok, lost, saved) => [bitsAt(ok), Uint8Array.from({ length: N0 }, (_, i) => ((i < ok && i >= lost) || (i >= ok && i < ok + saved) ? 1 : 0))];
const RUNS = { S362: [1187, 1955, 2664], S370: [1602, 3472, 3959], S130: [2396, 3700, 3960] };
const ws0 = b => Float64Array.from(b, v => 100 * v);
const P0 = () => {
  const K = [0, 1, 2];
  const gbC = [ys(-3.3, 4, N0, 11), ys(-5.2, 4, N0, 12), ys(-4.9, 3, N0, 13)];
  const legsOf = () => Object.fromEntries(LEGS.map(([arm, , hs]) => [arm, Object.fromEntries(hs.map(h => [h, { cells: K.map(k => cellsOf(bitsAt(RUNS[h][k]), bitsAt(RUNS[h][k]))), ws: K.map(k => wsOf(ws0(bitsAt(RUNS[h][k])), ws0(bitsAt(RUNS[h][k])))) }]))]));
  const interOfH = h => ({ tab: Object.fromEntries(['C', 'CX', 'AR', 'ARX'].map(a => [a, K.map(k => 100 * RUNS[h][k] / N0)])), bits: Object.fromEntries(['C', 'CX', 'AR', 'ARX'].map(a => [a, K.map(k => bitsAt(RUNS[h][k]))])) });
  const y12C = [ys(-2.7, 3, N0, 21), ys(-2.4, 3, N0, 22), ys(-0.7, 1, N0, 23)];
  return { S362: { gb: { C: gbC, AN: gbC.map(a => a.map(v => 0.1 * v)) }, tails: { AN: K.map(k => [1, 2, 3].map(t => ys(0.1 * (4 - t), 2, N0, 30 + 3 * k + t))) } },
    S370: { y12: { C: y12C, AN: y12C.map(a => a.map(v => 0.1 * v)) } }, inter: { S362: interOfH('S362'), S370: interOfH('S370') },
    s130: { gb: { C: [ys(4.7, 3, N0, 41), ys(0.8, 2, N0, 42), ys(0.03, 1, N0, 43)], AR: null } }, legs: legsOf() };
};
const withS130 = P => { P.s130.gb.AR = P.s130.gb.C.map(a => a.map(v => v + 0.05)); return P; };
function planted() {
  const cases = [], put = (what, got, want) => cases.push([what, got, want]);
  const base = () => withS130(P0());
  const run = (what, edit, i, want, edge) => { const P = base(); edit(P); const it = items(P); REACHED[i].add(it[i].outcome); put(`${what}: ${i} ${want}`, it[i].outcome, want); if (edge) EDGES.push(edge); return it; };
  // item 1
  run('AN removes nine tenths of S362\'s GB in every world, its tails within a point', () => {}, '1', 'HELD');
  run('AN removes a tenth in world 1', P => { P.S362.gb.AN[1] = P.S362.gb.C[1].map(v => 0.9 * v); }, '1', 'FALSIFIED');
  run('AN removes six tenths in world 0', P => { P.S362.gb.AN[0] = P.S362.gb.C[0].map(v => 0.4 * v); }, '1', 'INCONCLUSIVE');
  run('AN removes nine tenths but world 2\'s year-2 tail stays 1.25 under', P => { P.S362.tails.AN[2][1] = ys(-1.25, 2, N0, 99); }, '1', 'INCONCLUSIVE', 'GB removed while a year\'s tail sum stays past a point reads unclear, not removed');
  run('AN deepens world 0\'s under-read (a negative removal)', P => { P.S362.gb.AN[0] = P.S362.gb.C[0].map(v => 1.3 * v); }, '1', 'FALSIFIED');
  run('AN removes exactly three quarters, no spread, tails exactly a point (the lines)', P => { for (const k of [0, 1, 2]) { P.S362.gb.C[k] = new Float64Array(N0).fill(-4); P.S362.gb.AN[k] = new Float64Array(N0).fill(-1); P.S362.tails.AN[k] = [1, 2, 3].map(() => new Float64Array(N0).fill(-1)); } }, '1', 'HELD', 'a removal of exactly three quarters with tails exactly at a point reads removed');
  run('C\'s GB under a point in every world (nothing to read)', P => { for (const k of [0, 1, 2]) { P.S362.gb.C[k] = new Float64Array(N0).fill(0.5); P.S362.gb.AN[k] = new Float64Array(N0).fill(0); } }, '1', 'INCONCLUSIVE', 'no world with S362\'s GB a point in size: item 1 reads nothing');
  run('AN removes exactly 0.72, no spread (short of three quarters)', P => { for (const k of [0, 1, 2]) { P.S362.gb.C[k] = new Float64Array(N0).fill(-4); P.S362.gb.AN[k] = new Float64Array(N0).fill(-1.12); } }, '1', 'INCONCLUSIVE');
  const alt = (m, e) => Float64Array.from({ length: N0 }, (_, i) => m + (i % 2 ? e : -e));
  run('AN removes 0.78 in world 1 with an interval reaching under three quarters', P => { const e = alt(0, 8); P.S362.gb.C[1] = new Float64Array(N0).fill(-5.2); P.S362.gb.AN[1] = Float64Array.from(e, (v, i) => 0.22 * -5.2 + v); }, '1', 'INCONCLUSIVE');
  run('AN removes 0.22 in world 1 with an interval reaching over a quarter', P => { const e = alt(0, 8); P.S362.gb.C[1] = new Float64Array(N0).fill(-5.2); P.S362.gb.AN[1] = Float64Array.from(e, (v, i) => 0.78 * -5.2 + v); }, '1', 'INCONCLUSIVE');
  run('AN\'s world-0 year-1 tail at -0.95 with an interval reaching past a point', P => { P.S362.tails.AN[0][0] = alt(-0.95, 3); }, '1', 'INCONCLUSIVE');
  run('C\'s world-2 GB at 1.2 points, a tenth removed (read: a point in size)', P => { P.S362.gb.C[2] = new Float64Array(N0).fill(-1.2); P.S362.gb.AN[2] = new Float64Array(N0).fill(-1.08); }, '1', 'FALSIFIED');
  run('AN removes exactly 0.3, no spread (over a quarter)', P => { P.S362.gb.AN[0] = P.S362.gb.C[0].map(v => 0.7 * v); }, '1', 'INCONCLUSIVE');
  // item 2
  run('AN removes nine tenths of S370\'s years 1-2 increments', () => {}, '2', 'HELD');
  run('AN removes a tenth of world 0\'s', P => { P.S370.y12.AN[0] = P.S370.y12.C[0].map(v => 0.9 * v); }, '2', 'FALSIFIED');
  run('AN removes half of world 1\'s', P => { P.S370.y12.AN[1] = P.S370.y12.C[1].map(v => 0.5 * v); }, '2', 'INCONCLUSIVE');
  // item 3
  run('the copy rule adds under both references', () => {}, '3', 'HELD');
  run('S370 world 0 interacting by a point in the tables', P => { P.inter.S370.tab.ARX[0] += 1; }, '3', 'FALSIFIED');
  run('S362 world 1 at 0.4 with discordant runs', P => { const I = P.inter.S362; I.tab.ARX[1] += 0.4; I.bits.ARX[1] = bitsAt(RUNS.S362[1], 60); I.bits.AR[1] = bitsAt(RUNS.S362[1], 30); }, '3', 'INCONCLUSIVE');
  run('the copy rule adds a point under both references on S362 world 2 (additive, not interacting)', P => { P.inter.S362.tab.ARX[2] += 1; P.inter.S362.tab.CX[2] += 1; }, '3', 'HELD');
  // item 4
  run('AR moves S130\'s GB by 0.05', () => {}, '4', 'HELD');
  run('AR moves S130\'s world-0 GB by a point', P => { P.s130.gb.AR[0] = P.s130.gb.C[0].map(v => v + 1); }, '4', 'FALSIFIED');
  run('AR moves S130\'s world-0 GB by 0.25 with spread (its interval across the line)', P => { const e = ys(0, 3, N0, 77); P.s130.gb.AR[0] = P.s130.gb.C[0].map((v, i) => v + 0.25 + e[i]); }, '4', 'INCONCLUSIVE', 'a control move whose interval straddles a quarter of a point reads unclear');
  run('AR moves S130\'s world-1 GB by 0.4 exactly', P => { P.s130.gb.AR[1] = P.s130.gb.C[1].map(v => v + 0.4); }, '4', 'FALSIFIED');
  // item 5
  run('every leg at its control', () => {}, '5', 'HELD');
  run('AN loses 70 paths on S362 world 0', P => { const [c, a] = pairBits(RUNS.S362[0], 80, 10); P.legs.AN.S362.cells[0] = cellsOf(c, a); P.legs.AN.S362.ws[0] = wsOf(ws0(c), ws0(a)); }, '5', 'FALSIFIED');
  run('AR loses 15 net on S370 world 1 (across the margin)', P => { const [c, a] = pairBits(RUNS.S370[1], 25, 10); P.legs.AR.S370.cells[1] = cellsOf(c, a); P.legs.AR.S370.ws[1] = wsOf(ws0(c), ws0(a)); }, '5', 'INCONCLUSIVE');
  // the rows
  const rowAt = edit => { const P = base(); edit(P); return rowOf(items(P)); };
  put('the rows: the default reads R1', rowAt(() => {}), 'R1');
  put('the rows: AN removes a tenth reads R2', rowAt(P => { P.S362.gb.AN[1] = P.S362.gb.C[1].map(v => 0.9 * v); }), 'R2');
  put('the rows: the control moved reads R3 over R1', rowAt(P => { P.s130.gb.AR[0] = P.s130.gb.C[0].map(v => v + 1); }), 'R3');
  put('the rows: harm reads R5 over R3', rowAt(P => { P.s130.gb.AR[0] = P.s130.gb.C[0].map(v => v + 1); const [c, a] = pairBits(RUNS.S362[0], 80, 10); P.legs.AN.S362.cells[0] = cellsOf(c, a); P.legs.AN.S362.ws[0] = wsOf(ws0(c), ws0(a)); }), 'R5');
  put('the rows: item 1 unclear reads else', rowAt(P => { P.S362.gb.AN[0] = P.S362.gb.C[0].map(v => 0.4 * v); }), 'else');
  put('the rows: item 2 does not decide a row (item 2 kept, item 1 held)', rowAt(P => { P.S370.y12.AN[0] = P.S370.y12.C[0].map(v => 0.9 * v); }), 'R1');
  // tailOf and firstBand
  { const y = { 1: Float64Array.from([1, 2]), 2: Float64Array.from([10, 20]), 3: Float64Array.from([100, 200]) }, ga = Float64Array.from([1000, 2000]);
    put('tailOf: from year 2, the residual at years 2 and 3 with GA', Array.from(tailOf(y, ga, [1, 2, 3], 2)).join(','), '1110,2220');
    put('tailOf: from year 1, every bridge year with GA', Array.from(tailOf(y, ga, [1, 2, 3], 1)).join(','), '1111,2222'); }
  { const mvA = Uint16Array.from([1, 2, 3, 4, 1, 2, 3, 4]), mvB = Uint16Array.from([1, 2, 3, 5, 9, 2, 3, 4]);
    put('firstBand: differing first at year 3 with a two-year bridge reads the five years after', String(firstBand(mvA, mvB, 4, 2, 0)), '2');
    put('firstBand: differing first at the last bridge year reads the bridge', String(firstBand(mvA, mvB, 4, 3, 0)), '1'); }
  // pOf: the wiring
  { const bridge = { S362: [1, 2, 3], S370: [1, 2, 3], S130: [1] };
    const perP = (h, a, k, x) => new Float64Array(N0).fill(({ GB: 1, GA: 2, Y1: 10, Y2: 20, Y3: 30 })[x] + ({ C: 0, CX: 100, AR: 200, ARX: 300, AN: 400 })[a] + ({ S362: 1000, S370: 2000, S130: 3000 })[h] + 0.1 * k);
    const bitsF = (h, a, k) => bitsAt(RUNS[h][k] - (a === 'AN' ? 1 : a === 'AR' ? 2 : 0)), wsF = (h, a, k) => ws0(bitsF(h, a, k));
    const tabs = Object.fromEntries(['S362', 'S370', 'S130'].map(h => [h, Object.fromEntries(['C', 'CX', 'AR', 'ARX', 'AN'].map(a => [a, [10, 20, 30]]))]));
    const P = pOf(perP, bitsF, wsF, tabs, bridge);
    put('pOf: S362\'s AN GB in world 2 is its own', P.S362.gb.AN[2][0].toFixed(1), (1 + 400 + 1000 + 0.2).toFixed(1));
    put('pOf: S362\'s AN tail from year 2 is years 2 and 3 with GA', P.S362.tails.AN[0][1][0].toFixed(1), ((20 + 400 + 1000) + (30 + 400 + 1000) + (2 + 400 + 1000)).toFixed(1));
    put('pOf: S370\'s years 1-2 are Y1 + Y2', P.S370.y12.C[1][0].toFixed(1), ((10 + 2000 + 0.1) + (20 + 2000 + 0.1)).toFixed(1));
    put('pOf: S130\'s AR GB is its own', P.s130.gb.AR[0][0].toFixed(1), (1 + 200 + 3000).toFixed(1));
    put('pOf: the AN leg on S362 sees its one lost path against C', P.legs.AN.S362.cells.map(x => `${x.b}/${x.c}`).join(','), '1/0,1/0,1/0');
    put('pOf: the AR leg sees its two lost paths against C', P.legs.AR.S362.cells.map(x => `${x.b}/${x.c}`).join(','), '2/0,2/0,2/0'); }
  // the gate on synthetic logs and files
  const enc = a => Buffer.from(Float64Array.from(a).buffer).toString('base64'), enc8 = a => Buffer.from(Uint8Array.from(a)).toString('base64'), enc16 = a => Buffer.from(Uint16Array.from(a).buffer).toString('base64');
  const npw = 4, DIM = 2, BR = [1, 2, 3];
  const mk = ([id, arm, pts0], over = {}) => {
    const pts = over.pts || pts0, at = over.at ?? pts, L = `${arm}/P${pts}S6Q5`, floor = 104000, br = over.bridge || BR;
    const bitsW = [1, 1, 0, 1], mv = [1, 2, 65535, 1, 2, 3, 4, 65535], ws = [100, 99.5, -2, 100];
    const lines = [`stamp: code ${over.code || 'c1'} audit a1 prediction ${PRED} sha s1`, `REF-B: the candidate's own unit, ${npw} paths a world, wealth points divided by ${over.scale || 1} (seed ${over.seed || SEED}); 7 jobs; part 0/1`, `${(over.id || id).padEnd(16)} case | job ${L} | points ${at} | lambda 0.0223606797749979`,
      `solve CAND ${L}: table 50.0000 secs 10`, `ran CAND ${L}: bridgeRead reader bridgeStep exact readerSplit ${over.split ?? { AR: 'rs', ARX: 'rs', AN: 'null' }[arm]} readerCopy ${over.copy ?? { AR: 'null', ARX: 'extrap', AN: 'null' }[arm]} readerBlend null readerRef ${over.ref || 'adaptive'} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${at} grid total${at}x6x6 shareNodes none floor ${floor} line 0.5`,
      `adaptive ${L}: readerRef ${over.ref || 'adaptive'} fix ${over.fix ?? true} moves ${over.moves ?? 120} nonMono ${over.nonMono ?? 0} lattice 160x41 nz 128`,
      `reader ${L}: tables 72 unsupported 0 copied 10 copiedTop 5 nodes 100`, `nodes ${L}: the uniform six floor ${floor} (the product's rule ${over.rule ?? floor})`, `checks ${L}: armTook ${over.armTook ?? 1}/1`,
      `recount ${L}: tables 72 copied 10 (the solve's 72 and 10) line 0.5`, `checks ${L}: copyTook 1/1`, `openings ${L}: OWN ai 14 level 1 tiers 2,2`];
    for (let w = 0; w < 3; w++) lines.push(`tables ${L} ${w} z 0 weight 0.333333: OWN 50.000000 READ 50.000000`);
    lines.push(`bridge ${L}: reader years ${br.join(',')}`);
    const per = {}, bits = {}, moves = {}, states = {};
    for (let w = 0; w < 3; w++) {
      lines.push(`sim ${L} ${w} OWN ai 14: 3/${npw} bridge 3 bits ${sha16(Buffer.from(Uint8Array.from(bitsW)))} ${sha16(Buffer.from(Uint8Array.from(bitsW)))}`, `moves ${L} ${w}: path-years 6 sha ${sha16(Buffer.from(Uint16Array.from(mv).buffer))}`, `ledger ${L} ${w}: X 75 B0 75 T 0 GB 0 GA 0 GL 0 GD 0 ${br.map(t => `Y${t} 0`).join(' ')}`);
      if (!(over.noSplit && w === 2)) lines.push(`split ${L} ${w}: ${br.map(t => PARTS.map(p => `${p}${t} 0`).join(' ')).join(' ')}`);
      lines.push(`year ${L} ${w} 1: paths 4 G 0.000000 T 0.000000`, `qf ${L} ${w}: paths ${Math.min(npw, NQF)} QF 0`, `whole ${L} ${w}: mean ${(ws.reduce((t, x) => t + x, 0) / npw).toFixed(6)} spending years 46 of 46 floor level 0.8 scale 1 cap 1 death charge 0`);
      for (const x of [...KEYS, ...br.flatMap(t => [`Y${t}`, ...PARTS.map(p => `${p}${t}`)])]) per[`${x}${w}`] = enc([0, 0, 0, 0]);
      per[`WS${w}`] = enc(ws); bits[`OWN${w}`] = enc8(bitsW); bits[`OWN${w}b`] = enc8(bitsW); moves[`MV${w}`] = enc16(mv);
      states[`S${w}`] = enc(new Array(npw * br.length * DIM).fill(0));
    }
    lines.push(`checks ${L}: ownTook 12/12 identity ${3 * npw}/${3 * npw} qfTook 9/9 layerTook 9/9 scoreTook ${3 * npw}/${3 * npw} splitTook ${over.split2 ?? 24}/24 secs 1`, `clamped ${L}: 0 of 24 bridge-year reads at the reader's clamp (their split does not sum to the read)`, `file ${L}: ${id}-${arm}.json.gz`);
    if (!over.notDone) lines.push(`done ${L}`);
    return { text: lines.join('\n'), file: [`${id}-${arm}.json.gz`, { id, job: L, stamp: { code: over.code || 'c1', audit: 'a1', prediction: PRED, sha: 's1' }, NPW: npw, seed: 7002, own: 14, bridge: br, dim: DIM, per, bits, moves, states, tables: {} }] };
  };
  const at = (id, arm) => EXPECT.findIndex(x => x[0] === id && x[1] === arm);
  const gateOf = (overs = {}, extra = [], opt = {}) => { const all = EXPECT.map((x, i) => mk(x, overs[i] || {})), jobs = [...all, ...extra].flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); return gate(jobs, { npw, files, ...opt }); };
  put('the gate passes the seven jobs as registered', gateOf().join('; '), '');
  { const all = EXPECT.map(x => mk(x, { at: Math.max(4, Math.round(x[2] / 15)), scale: 15 })), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate passes the preflight\'s jobs at a fifteenth of the points', gate(jobs, { npw, scale: 15, files }).join('; '), ''); }
  const refuses = (what, overs, extra = []) => put(`the gate refuses ${what}`, String(gateOf(overs, extra).length > 0), 'true');
  refuses('a job run twice', {}, [mk(EXPECT[0])]);
  refuses('a job of another test beside them', {}, [mk(['S130', 'ARX', 30])]);
  refuses('ARX without its copy rule (the cxw plant\'s kind)', { [at('S362', 'ARX')]: { copy: 'null' } });
  refuses('AR without its RS split', { [at('S370', 'AR')]: { split: 'null' } });
  refuses('AN with the RS split', { [at('S362', 'AN')]: { split: 'rs' } });
  refuses('AR on the plan reference', { [at('S130', 'AR')]: { ref: 'null' } });
  refuses('AR without the reference\'s fix (the foot plant\'s kind)', { [at('S370', 'AR')]: { fix: false } });
  refuses('a reference with no moves', { [at('S362', 'AR')]: { moves: 0 } });
  refuses('a reference with a non-monotone node', { [at('S362', 'AN')]: { nonMono: 2 } });
  refuses('armTook failed', { [at('S370', 'ARX')]: { armTook: 0 } });
  refuses('another seed', { [at('S130', 'AR')]: { seed: '7004' } });
  refuses('a job on another code', { [at('S362', 'ARX')]: { code: 'c2' } });
  refuses('splitTook short (the split plant)', { [at('S370', 'AN')]: { split2: 23 } });
  refuses('a world\'s split line missing', { [at('S362', 'AR')]: { noSplit: true } });
  refuses('a job whose bridge years are not its household\'s other jobs\'', { [at('S362', 'ARX')]: { bridge: [1, 2] } });
  refuses('a job whose floor is not the product\'s rule', { [at('S370', 'ARX')]: { rule: 99000 } });
  { const all = EXPECT.map((x, i) => mk(x, i === 2 ? { scale: 15 } : {})), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate refuses a job whose header is at a fifteenth of the points, read as the full run', String(gate(jobs, { npw, files }).length > 0), 'true'); }
  refuses('a job with no done line', { [at('S370', 'AN')]: { notDone: true } });
  { const all = EXPECT.slice(1).map(x => mk(x)), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate refuses a missing job', String(gate(jobs, { npw, files }).length > 0), 'true'); }
  // the reuse: the plan reference's cells against REF-B's jobs (synthetic COPY-B and COPY-X logs in their own formats)
  const mkR = ([h, a], over = {}) => { const t = mk([h, 'AR', 30], { ref: 'null', split: 'null', copy: a === 'CX' ? 'extrap' : 'null', ...over }).text.replace(/AR\/P30/g, `${a}/P30`); return over.x ? parseX(t.replace(/^REF-B:/m, 'COPY-X:'))[0] : parseB(t.replace(/^REF-B:/m, 'COPY-B:'))[0]; };
  const rJ = (over = {}) => Object.fromEntries(REUSED.map(([h, a, src]) => [`${h} ${a}`, mkR([h, a], { x: src === 'COPY-X', ...(over[`${h} ${a}`] || {}) })]));
  const refJ = () => EXPECT.flatMap(x => parse(mk(x).text));
  put('the reuse passes the plan reference\'s cells on the same code, seed, paths and bridge years', reuseGate(rJ(), refJ(), true, true).join('; '), '');
  put('the reuse refuses when COPY-B\'s gate failed', String(reuseGate(rJ(), refJ(), false, true).length > 0), 'true');
  put('the reuse refuses when COPY-X\'s gate failed', String(reuseGate(rJ(), refJ(), true, false).length > 0), 'true');
  put('the reuse refuses a cell on other code', String(reuseGate(rJ({ 'S362 C': { code: 'c2' } }), refJ(), true, true).length > 0), 'true');
  put('the reuse refuses a cell on another seed', String(reuseGate(rJ({ 'S370 CX': { seed: '7004' } }), refJ(), true, true).length > 0), 'true');
  put('the reuse refuses a cell on another reference', String(reuseGate(rJ({ 'S130 C': { ref: 'order' } }), refJ(), true, true).length > 0), 'true');
  put('the reuse refuses a C with the copy rule', String(reuseGate(rJ({ 'S362 C': { copy: 'extrap' } }), refJ(), true, true).length > 0), 'true');
  put('the reuse refuses a cell on other bridge years', String(reuseGate(rJ({ 'S370 C': { bridge: [1, 2] } }), refJ(), true, true).length > 0), 'true');
  { const r = rJ(); delete r['S370 CX']; put('the reuse refuses a missing cell', String(reuseGate(r, refJ(), true, true).length > 0), 'true'); }
  { const au = readFileSync(join(HERE, 'audit-refb.mjs'), 'utf8'), jl = /export const JOBS = \[([\s\S]*?)\];/.exec(au), al = /export const ARMS = Object\.freeze\(\{(.*)\}\);/.exec(au);
    const aj = jl ? [...jl[1].matchAll(/\['(S\d+)', '(\w+)', (\d+), 6, 5\]/g)].map(m => `${m[1]} ${m[2]} ${m[3]}`).join(',') : 'none';
    put('the pin: the reducer\'s jobs are the audit\'s, in its order', EXPECT.map(x => x.join(' ')).join(','), aj);
    const armOf = a => (al ? (new RegExp(`(?:^\\s*|, )${a}: \\{([^}]*)\\}`).exec(al[1]) || [])[1] || '' : '');
    for (const a of ['AR', 'ARX', 'AN']) put(`the pin: ${a}'s split, copy rule, reference and fix are the audit's`, `${SPLIT[a]} ${COPY[a]} ${COMMON.readerRef} true`, `${(/readerSplit: '(\w+)'/.exec(armOf(a)) || [, 'null'])[1]} ${(/readerCopy: '(\w+)'/.exec(armOf(a)) || [, 'null'])[1]} ${(/readerRef: '(\w+)'/.exec(armOf(a)) || [, 'null'])[1]} ${/foot: true/.test(armOf(a))}`); }
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
  const DIR = args[0] || join(HERE, 'results', 'diagrefb'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1), BDIR = args[3] || join(HERE, 'results', 'diagcopyb'), XDIR = args[4] || join(HERE, 'results', 'diagcopyx');
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const J = (h, a) => jobs.find(x => x.key === keyOf(h, a, 30)), FR = (h, a) => files[J(h, a).file];
  if (PRE) {
    console.log(`planted (${np_}): all read as they should`);
    console.log(`GATE: passed - the seven jobs once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}) on one code; the adaptive reference with its fix on every job, the RS split on AR and ARX alone, the copy rule on ARX alone, every self-check in full (the preflight: no reused cell compared)`);
    for (const [h, a] of EXPECT) { const j = J(h, a), pp = (k, x) => mean(decRaw(FR(h, a).per[`${x}${k}`])) * 100; console.log(`PREFLIGHT ${h} ${a}: bridge years ${j.bridge.join(',')}, the reference's moves ${j.adaptive.moves}, world-0 GB ${f4(pp(0, 'GB'))} GA ${f4(pp(0, 'GA'))}, copied ${j.reader.copied}, clamped ${j.clamped.n} of ${j.clamped.of}, bridge failures by world ${[0, 1, 2].map(k => j.sims[`OWN${k}`].n - j.sims[`OWN${k}`].bridge).join(', ')}`); }
    console.log('PREFLIGHT: the gate and the files read; no figure read for an item (a preview at a fraction of the points; PREVIEW)'); process.exit(0);
  }
  // THE REUSE: COPY-B's and COPY-X's reducers over their own files, then the shared variables
  const spawnOk = (script, dir) => { const r = spawnSync('node', [join(HERE, script), dir], { encoding: 'utf8', maxBuffer: 1 << 26 }); return r.status === 0 && /^GATE: passed/m.test(r.stdout || ''); };
  const bOk = spawnOk('reduce-copyb.mjs', BDIR), xOk = spawnOk('reduce-copyx.mjs', XDIR);
  const logsIn = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
  const bJobs = logsIn(BDIR).flatMap(parseB), xJobs = logsIn(XDIR).flatMap(parseX);
  const rJobs = Object.fromEntries(REUSED.map(([h, a, src]) => [`${h} ${a}`, src === 'COPY-B' ? bJobs.find(x => x.key === keyOfB(h, a, 30)) : xJobs.find(x => x.label === LABELS_X[a] && x.id === h)]));
  const rbad = reuseGate(rJobs, jobs, bOk, xOk);
  if (rbad.length) { console.log(`GATE FAILED (the reuse, ${rbad.length}):\n  ${rbad.join('\n  ')}`); process.exit(1); }
  const rFiles = Object.fromEntries(REUSED.map(([h, a, src]) => [`${h} ${a}`, JSON.parse(gunzipSync(readFileSync(join(src === 'COPY-B' ? BDIR : XDIR, rJobs[`${h} ${a}`].file))).toString())]));
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the seven jobs once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}) on one code; the adaptive reference with its fix on every job, the RS split on AR and ARX alone, the copy rule on ARX alone, every self-check in full; the reuse: COPY-B's gate passed over ${BDIR} and COPY-X's over ${XDIR}, and the plan reference's C and CX share REF-B's code, seed, paths, bridge years and settings but the reference`);
  const JA = (h, a) => (['C', 'CX'].includes(a) ? rJobs[`${h} ${a}`] : J(h, a)), FA = (h, a) => (['C', 'CX'].includes(a) ? rFiles[`${h} ${a}`] : FR(h, a));
  const perP = (h, a, k, x) => Float64Array.from(decRaw(FA(h, a).per[`${x}${k}`]), v => 100 * v), bitsF = (h, a, k) => dec8(FA(h, a).bits[`OWN${k}`]), wsF = (h, a, k) => decRaw(FA(h, a).per[`WS${k}`]);
  const ARMS_H = { S362: ['C', 'CX', 'AR', 'ARX', 'AN'], S370: ['C', 'CX', 'AR', 'ARX', 'AN'], S130: ['C', 'AR'] };
  const tabs = Object.fromEntries(Object.entries(ARMS_H).map(([h, as]) => [h, Object.fromEntries(as.map(a => [a, [0, 1, 2].map(k => JA(h, a).tables[k].OWN)]))]));
  const bridge = Object.fromEntries(Object.keys(ARMS_H).map(h => [h, J(h, 'AR').bridge]));
  const P = pOf(perP, bitsF, wsF, tabs, bridge), it = items(P), iv = x => `${f4(x.d ?? x.R)} (${f4(x.lo)} to ${f4(x.hi)})`;
  const hw = x => `world ${x.k}: survival ${f4(x.ex.d)} exact (${f4(x.ex.lo)} to ${f4(x.ex.hi)}) ${x.ex.outcome}, guarded unconditional (${f4(x.u.lo)} to ${f4(x.u.hi)}), whole score ${iv(x.w)}, margin ${f4(x.margin)}: ${x.harm ? 'harm' : x.ok ? 'no material harm' : 'inconclusive'}`;
  console.log('\nREF-B: the adaptive reference against the plan reference, crossed with the copy rule, on S362 and S370, S130 the control (predictions/diag-refb.md)');
  console.log('\nTHE ITEMS (each read by its registered rule)');
  console.log(`1. the adaptive reference alone (AN) removes at least three quarters of S362's bridge part GB with its read error from years 1, 2 and 3 each within a point: ${it['1'].outcome}`);
  for (const x of it['1'].per) console.log(`     world ${x.k}: C's GB ${f4(x.r.mc)} points, removed ${iv(x.r)}; AN's read error from years 1, 2, 3: ${x.tails.map(iv).join('; ')}: ${x.read}`);
  if (it['1'].nothing) console.log('     nothing to read: no world with C\'s GB a point in size');
  console.log(`2. AN removes at least three quarters of S370's first two years' increments (Y1 + Y2) where they are a point or more: ${it['2'].outcome}`);
  for (const x of it['2'].per) console.log(`     world ${x.k}: C's Y1 + Y2 ${f4(x.r.mc)} points, removed ${iv(x.r)}: ${x.read}`);
  console.log(`3. the copy rule and the adaptive package add, (ARX - AR) - (CX - C) in table less runs within half a point on S362 and S370: ${it['3'].outcome}`);
  for (const x of it['3'].per) console.log(`     ${x.h} world ${x.k}: ${iv(x)} (tables ${f4(x.tab)}, runs ${f4(x.runs)}): ${x.read}`);
  console.log(`4. the control: AR moves S130's GB by under a quarter of a point in every world: ${it['4'].outcome}`);
  for (const x of it['4'].per) console.log(`     world ${x.k}: AR less C ${iv(x.c)}: ${x.read}`);
  console.log(`5. no material harm per world, AR, ARX and AN against C, by RULES.md section 8's rule as written: ${it['5'].outcome}`);
  for (const l of it['5'].legs) for (const x of l.per) for (const w of x.per) console.log(`     ${l.arm} against ${l.ctl} on ${x.h} ${hw(w)}`);
  console.log(`OUTCOME: ${Object.keys(it).map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  console.log(`ROW: ${rowOf(it)}`);
  for (const i of Object.keys(POINT)) console.log(`REALISED item ${i}: ${f4(POINT[i](it))}`);
  console.log('\nREPORTED');
  for (const [h, as] of Object.entries(ARMS_H)) for (const a of as) for (let k = 0; k < 3; k++) {
    const j = JA(h, a), s = j.sims[`OWN${k}`], L = j.ledger[k], t = j.tables[k].OWN, by = j.bridge, S = j.split[k], f = FA(h, a);
    const tails = by.map(u => { let g = L.GA; for (const v of by) if (v >= u) g += L[`Y${v}`]; return `${u}: ${f4(g)}`; }).join(' | ');
    console.log(`  ${h} ${a} world ${k}: table ${f4(t)} runs ${s.ok}/${s.n} (${f4(100 * s.ok / s.n)}), table less runs ${f4(t - 100 * s.ok / s.n)}; GB ${f4(L.GB)} GA ${f4(L.GA)} T ${f4(L.T)} G ${f4(L.GB + L.GA)}; by bridge year ${by.map(y => `${y}: ${f4(L[`Y${y}`])}`).join(' | ')}; the read error from each bridge year on ${tails}; split (QS, QC, RS, RC) ${by.map(y => `${y}: ${PARTS.map(p => f4(S[`${p}${y}`])).join(', ')}`).join(' | ')}; bridge failures ${s.n - s.bridge}${f ? '' : ''}`);
  }
  for (const h of ['S362', 'S370']) for (let k = 0; k < 3; k++) { const d = a => JA(h, a).split[k], by = J(h, 'AR').bridge; console.log(`  ${h} world ${k}: the copied part QC's change, CX less C ${by.map(y => f4(d('CX')[`QC${y}`] - d('C')[`QC${y}`])).join(', ')}; ARX less AR ${by.map(y => f4(d('ARX')[`QC${y}`] - d('AR')[`QC${y}`])).join(', ')} (O190's reach by bridge year)`); }
  for (const h of ['S362', 'S370']) for (let k = 0; k < 3; k++) { const L = a => JA(h, a).ledger[k]; console.log(`  ${h} world ${k}: AR less AN (the RS split's own part): GB ${f4(L('AR').GB - L('AN').GB)} GA ${f4(L('AR').GA - L('AN').GA)}`); }
  const dec16 = x => { const b = Buffer.from(x, 'base64'); return new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
  for (const [arm, ctl, hs] of LEGS) for (const h of hs) for (let k = 0; k < 3; k++) {
    const fa = FA(h, arm), fc = FA(h, ctl), ma = dec16(fa.moves[`MV${k}`]), mc = dec16(fc.moves[`MV${k}`]), ba = bitsF(h, arm, k), bc = bitsF(h, ctl, k), yrs = fa.years, nb = fa.bridge.length, sv = [0, 0, 0, 0], ls = [0, 0, 0, 0];
    for (let i = 0; i < ba.length; i++) { if (ba[i] === bc[i]) continue; const b = firstBand(ma, mc, yrs, nb, i); if (b < 0) continue; if (ba[i]) sv[b]++; else ls[b]++; }
    console.log(`  ${arm} against ${ctl} on ${h} world ${k}: saved ${sv.join('/')} and lost ${ls.join('/')} by the band their moves first differ (the opening / the bridge / the five years after / the rest)`);
  }
  for (const [h, a] of EXPECT) { const j = J(h, a); console.log(`  ${h} ${a}: the adaptive reference's moves ${j.adaptive.moves}, fix ${j.adaptive.fix}; copied ${j.reader.copied} of ${j.reader.nodes} nodes; reads at the clamp ${j.clamped.n} of ${j.clamped.of}; solve ${j.solve.secs} s`); }
}
