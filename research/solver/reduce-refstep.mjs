/*
 * REF-STEP'S REDUCER (PLAN.md REF-STEP; predictions/diag-refstep.md; the deep review after REF-B, deep-review-log.md 20 Oct 02:53
 * UK, adopted in PLAN.md's 20 Oct 03:02 row; PR29, O191, PR24, PR31). The adaptive reference with every bridge year's own step
 * read exactly (adaptive.js `stepAll`) against the reference without it and the plan reference, seed 7002, the first 4,000
 * paths a world (audit-refstep.mjs, results/diagrefstep): AN3 (the adaptive reference, its fix and `stepAll`), AN (REF-B's arm:
 * the reference and its fix alone) and C (the plan reference) on S362 and S370; AR3 (AN3 with the RS split: the package the
 * reference choice would adopt) and C on S364 and S360.
 * Its gate: the fair-test gate on REF-STEP's logs; the ten jobs once and done at the registered settings with every self-check
 * in full, on one code; the adaptive reference's own record (its fix, `stepAll` on the AN3 and AR3 jobs alone, moves made, no
 * non-monotone node) and stepTook (the read exactly 0 just under every earlier bridge year's own step) on the `stepAll` jobs;
 * THE REPRODUCTION (the build's claim that `stepAll` off changes nothing, and that nothing else under src/solver moved): AN's
 * files on S362 and S370 equal REF-B's (results/diagrefb) and C's equal COPY-B's on S362 (results/diagcopyb) and COPY-X's on
 * S370 (results/diagcopyx), every path's ledger, split, whole score, survival bits, moves and visit states and every world's
 * tables, behind each source's own reducer's gate over its files.
 * THE ITEMS, each with three outcomes; an item's cells read with Bonferroni intervals (0.05 over the cells it reads):
 *   1: the smear removed, from the whole (PR29; WHOLE, NETS): on S362, the smear is AN's year-3 residual on the paths that die at
 *      year 3 (D: 0.4916, 0.4328 and 0.5623 points of each world's mean, the receipt's signature, one sign); q_t is the share of
 *      it that leaves AN's read error from bridge year t (the tail sum: the residual at that year and every later one, with GA),
 *      path by path: q_t = sum(tail_t,AN - tail_t,AN3) / sum(D), its interval by the delta method (reduce-copyx.mjs removal over
 *      D and D less the change); a world reads removed when q_1, q_2 and q_3 each lie within [0.75, 1.25] (the smear gone from
 *      every year's read error, not moved into another), kept when q_3 lies wholly under a quarter; HELD when every world reads
 *      removed, FALSIFIED when any reads kept, otherwise INCONCLUSIVE. AN3's read error from each year is printed beside.
 *   2: O191's switch (O191-SMEAR against its rivals): on S362, the paths whose moves first differ at year 1 from C's
 *      taxable-first move to the arm's ISA-first one (read-o191.mjs's cell), AN3's count against AN's on the mixture weights
 *      (1/6, 2/3, 1/6), rho = sum W_k n_AN3,k / sum W_k n_AN,k, its interval by the delta method with each count binomial over
 *      the world's paths: wholly under a half (the switch largely gone with the smear: SMEAR's outcome) HELD; at or over three
 *      quarters (the switch stays: TIE's, TRADE's, CLUCK's or REFOTHER's) FALSIFIED; otherwise INCONCLUSIVE, and when AN's cell
 *      is empty. AN3's own-move read error in the cell (AN's 0.97, se 0.25, results-o191.txt) is printed beside, not read.
 *   3: no material harm by the mixture (RULES.md section 8 item 1 as amended for a reference change: the maintainer, 18 Oct, the
 *      18 Oct 09:43 row; HO-DEP's harmItem): AN3 against C on S362 and S370 and AR3 against C on S364 and S360, each household's
 *      paired survival by stats.mjs mixtureChange and mixtureOutcome and its paired whole score by wsMix at MIX_LEVEL, at the
 *      margin marginRel(the control's mixture survival), each world's line reported and none binding; a household identical
 *      arms could not clear by the mixture is reported only, harm still read (item 2's floor; the decided default
 *      marginRelFloor 'report-only'; PR13); HELD when every household read reads no material harm on both, FALSIFIED when any
 *      household reads harm on either, otherwise INCONCLUSIVE (and when every household is reported only).
 *   4: PR24's breadth: on S364 and S360, in each world where C's read error from bridge year 1 (G: GB with GA) is a point or more
 *      in size, AR3's lies within a point (its interval within [-1, 1]: closed; wholly outside: open); HELD when every world read
 *      reads closed, FALSIFIED when any reads open, otherwise INCONCLUSIVE or when no world is read.
 *   5: the control: AN3 moves S370's read error from year 3 on (AN3 less AN) by under a quarter of a point in every world (the
 *      smear there +0.15, +0.04, +0.03 by the receipt); still within [-0.25, 0.25], moved wholly outside; HELD when every world
 *      reads still, FALSIFIED when any moved.
 * THE ROWS: R3 item 3 FALSIFIED; R5 item 1 FALSIFIED; R4 item 4 FALSIFIED; R1 items 1 and 2 HELD; R2 item 1 HELD and item 2
 *   FALSIFIED; else.
 * THE CAUSE (KNOWN-LEG; causeOf, registered): item 2 HELD credits O191-SMEAR only with item 1 HELD (the whole in band); item 2
 *   FALSIFIED with item 1 HELD reads O191-SMEAR's 'not' (AN3 reaches the year-3 step, its read error in band, the switch stays:
 *   FD-X next); item 2 FALSIFIED without item 1 HELD reads open (the interaction); INCONCLUSIVE open.
 * REPORTED: every arm's tables against its runs by world; GB, GA, T, G; the residual by bridge year and the read error from
 *   each bridge year on; the four-way split; the year-3 dying paths' share of each world's year-3 residual (the smear's
 *   signature, the mechanism reached); O191's read for C against AN and C against AN3 (every cell by world, the mixture); AN3
 *   against AN and AN against C by the harm rule (own control and REF-B's leg); each leg's saved and lost paths by the band of
 *   the year their moves first differ and the paths whose moves differ; the steps' thresholds and PR31's chooser's split beside
 *   A*_t; the solves' seconds; REALISED lines for each item's point.
 *   node research/solver/reduce-refstep.mjs [dir] [paths a world] [scale] [REF-B dir] [COPY-B dir] [COPY-X dir] [--preflight] [--planted]
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
import { meanOf } from './reduce-copyw.mjs';
import { parse as parseB, keyOf as keyOfB } from './reduce-copyb.mjs';
import { parse as parseRB, keyOf as keyOfRB, tailOf, firstBand } from './reduce-refb.mjs';
import { read as readO191, W as WMIX } from './read-o191.mjs';
import { wsMix } from './reduce-hodep.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-refstep.md';
export const SEED = '7002', NPW = 4000, NQF = 1000;
export const QLO = 0.75, QHI = 1.25, QOUT = 0.25, HALF = 0.5, THREEQ = 0.75, GAP = 1, MINRES = 1, STILL = 0.25;
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const PARTS = Object.freeze(['QS', 'QC', 'RS', 'RC']);
// the jobs as registered: [household, arm, wealth points] (audit-refstep.mjs's JOBS, in its order)
export const EXPECT = Object.freeze([['S370', 'AN3', 30], ['S370', 'AN', 30], ['S370', 'C', 30], ['S362', 'AN3', 30], ['S362', 'AN', 30], ['S362', 'C', 30], ['S364', 'AR3', 30], ['S364', 'C', 30], ['S360', 'AR3', 30], ['S360', 'C', 30]]);
export const LATTICE_LINE = '160x41 nz 128';
export const REF = Object.freeze({ AN3: 'adaptive', AN: 'adaptive', C: 'null', AR3: 'adaptive' });
export const SPLIT = Object.freeze({ AN3: 'null', AN: 'null', C: 'null', AR3: 'rs' });
export const STEPS = Object.freeze({ AN3: true, AN: false, C: false, AR3: true });
export const keyOf = (id, arm, pts) => `${id} ${arm}/P${pts}S6Q5`;
// the reproduced cells: [household, arm, the test whose saved files they must equal]
export const REPRO = Object.freeze([['S362', 'AN', 'REF-B'], ['S370', 'AN', 'REF-B'], ['S362', 'C', 'COPY-B'], ['S370', 'C', 'COPY-X']]);
// the legs of item 3: [arm, control, households]
export const LEGS = Object.freeze([['AN3', 'C', ['S362', 'S370']], ['AR3', 'C', ['S364', 'S360']]]);
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S\d+)\s+case \| job ((AN3|AN|C|AR3)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^REF-STEP: .*?, (\d+) paths a world.*?, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts: Number(c[6]), key: `${c[1]} ${c[2]}`, stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, checks: {}, tables: [], sims: {}, moves: [], ledger: [], split: [], qf: [], whole: [], steps: [], pr31: [], nodes: null, reader: null, recount: null, clamped: null, bridge: null, own: null, solve: null, ran: null, adaptive: null, file: null, done: false };
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

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerBlend: 'null', readerCopy: 'null', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3' };
const NEED = ['armTook', 'copyTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook', 'splitTook'];
const decRaw = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
const dec16 = x => { const b = Buffer.from(x, 'base64'); return new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null } = {}) {
  const bad = [], ptsAt = p => Math.max(4, Math.round(p / scale)), want = EXPECT.map(([id, arm, pts]) => ({ id, arm, pts: ptsAt(pts), key: keyOf(id, arm, pts) }));
  for (const x of jobs) if (!want.some(w => w.key === x.key)) bad.push(`a job that is not REF-STEP's: ${x.key}`);
  const codes = new Set(jobs.map(j => j.stamp && j.stamp.code));
  if (codes.size !== 1 || codes.has(undefined) || codes.has(null)) bad.push(`the jobs are not on one code (${[...codes].join(', ')})`);
  for (const w of want) {
    const js = jobs.filter(x => x.key === w.key);
    if (js.length !== 1) { bad.push(`${w.key}: ${js.length ? `run ${js.length} times` : 'missing'}`); continue; }
    const j = js[0], K = w.key, ad = REF[w.arm] === 'adaptive';
    if (!j.done) bad.push(`${K}: no done line`);
    if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push(`${K}: no stamp`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${K}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== w.pts) bad.push(`${K}: solved at ${j.pts} points, not ${w.pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, readerRef: REF[w.arm], readerSplit: SPLIT[w.arm], pts: String(w.pts), grid: `total${w.pts}x6x6`, shareNodes: 'none' })) if (field(ran, f) !== v) bad.push(`${K}: ${f} is ${field(ran, f)}, not ${v}`);
    const A = j.adaptive;
    if (ad && (!A || A.ref !== 'adaptive' || !A.fix || A.stepAll !== STEPS[w.arm] || !(A.moves > 0) || A.nonMono !== 0 || A.lattice !== LATTICE_LINE)) bad.push(`${K}: the adaptive reference's own record is not the arm's (${A ? `fix ${A.fix} stepAll ${A.stepAll} moves ${A.moves} nonMono ${A.nonMono} lattice ${A.lattice}` : 'no adaptive line'})`);
    if (!ad && (!A || A.ref !== 'null' || A.fix || A.stepAll || A.lattice !== 'none')) bad.push(`${K}: the plan reference's job carries an adaptive record`);
    if (!j.nodes || j.nodes.floor !== j.nodes.rule || field(ran, 'floor') !== String(j.nodes.floor)) bad.push(`${K}: its floor is not the product's rule's`);
    if (!j.nodes || j.nodes.list !== 'the uniform six') bad.push(`${K}: its share nodes are not the uniform six`);
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

// THE REPRODUCTION: cells = [{ h, a, src, job, file, old, oldFile }] (REF-STEP's job and file, the source's job and file); ok =
// { 'REF-B': bool, 'COPY-B': bool, 'COPY-X': bool }, each source's own reducer's gate over its files. Every saved path array,
// bit, move and visit state equal, byte for byte, and every world's tables equal as printed
export function reproGate(cells, ok) {
  const bad = [];
  for (const s of ['REF-B', 'COPY-B', 'COPY-X']) if (!ok[s]) bad.push(`${s}'s gate did not pass over its own files`);
  for (const [h, a, src] of REPRO) {
    const c = cells.find(x => x.h === h && x.a === a);
    if (!c || !c.old || !c.oldFile || !c.job || !c.file) { bad.push(`the reproduced ${h} ${a}: a file or log is missing (${src})`); continue; }
    if (c.src !== src) bad.push(`the reproduced ${h} ${a} is read against ${c.src}, not ${src}`);
    if (c.old.id !== h || c.old.label !== c.job.label) bad.push(`the reproduced ${h} ${a}'s source is ${c.old.id} ${c.old.label}`);
    if (!c.old.head || c.old.head.seed !== SEED || c.old.head.npw !== c.job.head.npw) bad.push(`the reproduced ${h} ${a}'s source is not on seed ${SEED} and the same paths a world`);
    if ((c.oldFile.bridge || []).join(',') !== (c.file.bridge || []).join(',')) bad.push(`the reproduced ${h} ${a}: other bridge years`);
    const groups = { per: c.oldFile.per || {}, bits: c.oldFile.bits || {}, moves: c.oldFile.moves || {}, states: c.oldFile.states || {} };
    let n = 0;
    for (const [g, o] of Object.entries(groups)) for (const [x, v] of Object.entries(o)) { n++; if (!c.file[g] || c.file[g][x] !== v) bad.push(`the reproduced ${h} ${a}: ${g} ${x} differs from ${src}'s`); }
    for (const [g, o] of Object.entries(groups)) for (const x of Object.keys(c.file[g] || {})) if (!(x in o)) bad.push(`the reproduced ${h} ${a}: ${g} ${x} is not in ${src}'s file`);
    if (!(n >= 3 * (KEYS.length + 3))) bad.push(`the reproduced ${h} ${a}: only ${n} arrays compared`);
    for (let k = 0; k < 3; k++) if (!c.old.tables[k] || !c.job.tables[k] || c.old.tables[k].OWN !== c.job.tables[k].OWN || c.old.tables[k].READ !== c.job.tables[k].READ) bad.push(`the reproduced ${h} ${a}: world ${k}'s tables differ from ${src}'s`);
  }
  return bad;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
const allOf = (per, yes, no) => (per.some(x => x.read === no) ? 'FALSIFIED' : per.every(x => x.read === yes) ? 'HELD' : 'INCONCLUSIVE');
/* P: { S362: { tails: { AN3, AN }: [3] [3 years] per path, dying: [3] AN's year-3 residual on its year-3 dying paths, per path }, cell: { n: [3] AN3's cell paths by world, nAN: [3] AN's, N: paths a
   world, m, se: AN3's own-move read error there on the mixture }, legs: { [arm]: { [h]: { cells: [3], ws: [3] } } }, br: { [h]: { C: [3], AR3: [3] } }
   the read error from bridge year 1 per path, S370: { tail3: { AN3, AN }: [3] per path } } */
export function items(P) {
  const out = {}, K = [0, 1, 2];
  { const z = zFor(0.05 / 9), per = K.map(k => { const D = P.S362.dying[k], q = [0, 1, 2].map(j => removal(D, Float64Array.from(D, (v, i) => v + P.S362.tails.AN3[k][j][i] - P.S362.tails.AN[k][j][i]), z));
      const tails = P.S362.tails.AN3[k].map(a => meanOf(a, z)), inb = q.every(r => r.lo >= QLO && r.hi <= QHI), off = q[2].hi < QOUT;
      return { k, q, tails, read: off ? 'kept' : inb ? 'removed' : 'unclear' }; });
    out['1'] = { outcome: allOf(per, 'removed', 'kept'), per }; }
  { const c = P.cell, z = zFor(0.05), vr = n => n * (1 - n / c.N), num = K.reduce((s, k) => s + WMIX[k] * c.n[k], 0), den = K.reduce((s, k) => s + WMIX[k] * c.nAN[k], 0);
    const vn = K.reduce((s, k) => s + WMIX[k] ** 2 * vr(c.n[k]), 0), vd = K.reduce((s, k) => s + WMIX[k] ** 2 * vr(c.nAN[k]), 0);
    const rho = den > 0 ? num / den : NaN, se = den > 0 ? Math.sqrt(vn / den ** 2 + num ** 2 * vd / den ** 4) : NaN, iv = Number.isFinite(rho) ? { d: rho, lo: rho - z * se, hi: rho + z * se } : null;
    out['2'] = { outcome: !iv ? 'INCONCLUSIVE' : iv.hi < HALF ? 'HELD' : iv.lo >= THREEQ ? 'FALSIFIED' : 'INCONCLUSIVE', iv, n: c.n, nAN: c.nAN, m: c.m, se: c.se, nothing: !iv }; }
  { const legs = LEGS.map(([arm, ctl, hs]) => ({ arm, ctl, per: hs.map(h => ({ h, ...harmMix(P.legs[arm][h].cells, P.legs[arm][h].ws) })) })), all = legs.flatMap(l => l.per), read = all.filter(x => !x.floor);
    out['3'] = { outcome: all.some(x => x.harm) ? 'FALSIFIED' : read.length && read.every(x => x.ok) ? 'HELD' : 'INCONCLUSIVE', legs, nothing: !read.length }; }
  { const cand = ['S364', 'S360'].flatMap(h => K.filter(k => Math.abs(mean(P.br[h].C[k])) >= MINRES).map(k => ({ h, k }))), z = zFor(0.05 / Math.max(1, cand.length));
    const per = cand.map(({ h, k }) => { const c = meanOf(P.br[h].AR3[k], z); return { h, k, mc: mean(P.br[h].C[k]), c, read: c.lo >= -GAP && c.hi <= GAP ? 'closed' : c.lo > GAP || c.hi < -GAP ? 'open' : 'unclear' }; });
    out['4'] = { outcome: per.length ? allOf(per, 'closed', 'open') : 'INCONCLUSIVE', per, nothing: !per.length }; }
  { const z = zFor(0.05 / 3), per = K.map(k => { const c = meanOf(Float64Array.from(P.S370.tail3.AN3[k], (v, i) => v - P.S370.tail3.AN[k][i]), z); return { k, c, read: c.lo >= -STILL && c.hi <= STILL ? 'still' : c.hi < -STILL || c.lo > STILL ? 'moved' : 'unclear' }; });
    out['5'] = { outcome: allOf(per, 'still', 'moved'), per }; }
  return out;
}
// a household that identical arms could not clear by the mixture: its control's own cells with nothing lost or saved
export const floorOf = cells => mixtureOutcome(mixtureChange(cells.map(x => ({ a: x.a + x.b, b: 0, c: 0, d: x.c + x.d })))).outcome !== 'no material harm';
// one household's harm by the mixture (HO-DEP's harmItem with the floor): survival and whole score at the survival's margin
export function harmMix(cells, ws) {
  const s = mixtureOutcome(mixtureChange(cells)), w = wsMix(ws, s.margin), floor = floorOf(cells), harm = s.outcome === 'harm' || w.outcome === 'harm', ok = s.outcome === 'no material harm' && w.outcome === 'no material harm';
  return { s, w, floor, harm, ok, read: harm ? 'harm' : floor ? 'reported only' : ok ? 'no material harm' : 'inconclusive' };
}
// the cause as items 1 and 2 bear on it (KNOWN-LEG, the registered reading)
export function causeOf(it) {
  const o1 = it['1'].outcome, o2 = it['2'].outcome;
  if (o2 === 'HELD') return o1 === 'HELD' ? 'O191-SMEAR' : 'O191-SMEAR not credited: AN3\'s read error from years 1 to 3 not in band (its whole)';
  if (o2 === 'FALSIFIED') return o1 === 'HELD' ? 'O191-SMEAR not (AN3 reads the year-3 step, its read error in band, and the switch stays): FD-X' : 'open (AN3\'s whole not in band: the interaction)';
  return 'open';
}
export function rowOf(it) {
  const o = i => it[i].outcome;
  if (o('3') === 'FALSIFIED') return 'R3';
  if (o('1') === 'FALSIFIED') return 'R5';
  if (o('4') === 'FALSIFIED') return 'R4';
  if (o('1') === 'HELD' && o('2') === 'HELD') return 'R1';
  if (o('1') === 'HELD' && o('2') === 'FALSIFIED') return 'R2';
  return 'else';
}
// each item's point in the derivation's own definition (REALISED lines)
export const POINT = { 1: it => Math.min(...it['1'].per.flatMap(x => x.q.map(r => r.R))), 2: it => (it['2'].iv ? it['2'].iv.d : NaN), 3: it => Math.min(...it['3'].legs.flatMap(l => l.per.map(x => x.s.d))), 4: it => (it['4'].per.length ? Math.max(...it['4'].per.map(x => Math.abs(x.c.d))) : NaN), 5: it => Math.max(...it['5'].per.map(x => Math.abs(x.c.d))) };
// the items' input from the files: perP(h, arm, world, key) in points, bitsF(h, arm, world), wsF(h, arm, world), bridge[h] the
// household's bridge years, o191 = { AN3, AN }: read-o191.mjs's read of C against each on S362, dyingF(h, a, k) the arm's year-3
// residual on its year-3 dying paths, per path, in points
export function pOf(perP, bitsF, wsF, bridge, o191, dyingF) {
  const K = [0, 1, 2], ys = (h, a, k) => Object.fromEntries(bridge[h].map(t => [t, perP(h, a, k, `Y${t}`)]));
  const tail = (h, a, k, t) => tailOf(ys(h, a, k), perP(h, a, k, 'GA'), bridge[h], t);
  const legs = Object.fromEntries(LEGS.map(([arm, ctl, hs]) => [arm, Object.fromEntries(hs.map(h => [h, { cells: K.map(k => cellsOf(bitsF(h, ctl, k), bitsF(h, arm, k))), ws: K.map(k => wsOf(wsF(h, ctl, k), wsF(h, arm, k))) }]))]));
  const cell = { n: o191.AN3.cell.map(x => x.n), nAN: o191.AN.cell.map(x => x.n), N: o191.N, m: o191.AN3.mix.cell.eB, se: o191.AN3.mix.cell.seB };
  return { S362: { tails: { AN3: K.map(k => [1, 2, 3].map(t => tail('S362', 'AN3', k, t))), AN: K.map(k => [1, 2, 3].map(t => tail('S362', 'AN', k, t))) }, dying: K.map(k => dyingF('S362', 'AN', k)) }, cell, legs,
    br: Object.fromEntries(['S364', 'S360'].map(h => [h, { C: K.map(k => tail(h, 'C', k, 1)), AR3: K.map(k => tail(h, 'AR3', k, 1)) }])), S370: { tail3: { AN3: K.map(k => tail('S370', 'AN3', k, 3)), AN: K.map(k => tail('S370', 'AN', k, 3)) } } };
}
// the smear's signature (the receipt's fate read): the paths that reach bridge year t and die there (no visit after t, not
// alive), their residual at t (dyingOf: per path, 0 elsewhere) and its share of the world's mean (dyingShare: points when y is
// the saved fraction); mv the moves (years per path), y the residual at t
export const dyingOf = (mv, years, bits, y, t) => Float64Array.from(y, (v, i) => { const at = mv[i * years + t] !== 65535, next = t + 1 < years ? mv[i * years + t + 1] !== 65535 : false; return at && !next && !bits[i] ? v : 0; });
export function dyingShare(mv, years, bits, y, t) { const d = dyingOf(mv, years, bits, y, t); let s = 0, n = 0; for (let i = 0; i < d.length; i++) if (d[i] !== 0 || (mv[i * years + t] !== 65535 && !(t + 1 < years && mv[i * years + t + 1] !== 65535) && !bits[i])) { s += d[i]; n++; } return { share: 100 * s / bits.length, n }; }

// THE PLANTED CHECKS: each item to each outcome on a case built for it, the rows, the cause, the gate's refusals, the
// reproduction's, the EDGES
export const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
const N0 = 4000;
const ys = (m, sd, n = N0, seed = 7) => { let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; return Float64Array.from({ length: n }, () => m + sd * Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r())); };
const bitsAt = (ok, shift = 0) => Uint8Array.from({ length: N0 }, (_, i) => (i < ok - shift || (shift > 0 && i >= N0 - shift) ? 1 : 0));
const pairBits = (ok, lost, saved) => [bitsAt(ok), Uint8Array.from({ length: N0 }, (_, i) => ((i < ok && i >= lost) || (i >= ok && i < ok + saved) ? 1 : 0))];
const RUNS = { S362: [1174, 1964, 2667], S370: [1603, 3472, 3960], S364: [1500, 3000, 3900], S360: [1700, 3300, 3950] };
const ws0 = b => Float64Array.from(b, v => 100 * v);
const P0 = () => {
  const K = [0, 1, 2];
  const legsOf = () => Object.fromEntries(LEGS.map(([arm, , hs]) => [arm, Object.fromEntries(hs.map(h => [h, { cells: K.map(k => cellsOf(bitsAt(RUNS[h][k]), bitsAt(RUNS[h][k]))), ws: K.map(k => wsOf(ws0(bitsAt(RUNS[h][k])), ws0(bitsAt(RUNS[h][k])))) }]))]));
  const t3 = [ys(12.7, 2, N0, 51), ys(3.9, 2, N0, 52), ys(-0.1, 1, N0, 53)];
  const dyingP = K.map(k => Float64Array.from(ys(0, 1, N0, 20 + k), (v, i) => (i % 5 === 0 ? 2.5 + 0.5 * v : 0))), anT = K.map(k => [1, 2, 3].map(t => ys(0.5, 4, N0, 30 + 3 * k + t)));
  return { S362: { tails: { AN: anT, AN3: anT.map((a, k) => a.map(x => Float64Array.from(x, (v, i) => v - dyingP[k][i]))) }, dying: dyingP }, cell: { n: [40, 50, 60], nAN: [234, 269, 271], N: N0, m: 0.05, se: 0.2 }, legs: legsOf(),
    br: { S364: { C: [ys(3, 4, N0, 61), ys(1.5, 3, N0, 62), ys(0.2, 1, N0, 63)], AR3: [ys(0.2, 2, N0, 64), ys(0.1, 2, N0, 65), ys(0, 1, N0, 66)] }, S360: { C: [ys(-2.5, 4, N0, 71), ys(-1.2, 3, N0, 72), ys(-0.1, 1, N0, 73)], AR3: [ys(-0.2, 2, N0, 74), ys(0.1, 2, N0, 75), ys(0, 1, N0, 76)] } },
    S370: { tail3: { AN: t3, AN3: t3.map(a => a.map(v => v - 0.05)) } } };
};
function planted() {
  const cases = [], put = (what, got, want) => cases.push([what, got, want]);
  const run = (what, edit, i, want, edge) => { const P = P0(); edit(P); const it = items(P); REACHED[i].add(it[i].outcome); put(`${what}: ${i} ${want}`, it[i].outcome, want); if (edge) EDGES.push(edge); return it; };
  const alt = (m, e) => Float64Array.from({ length: N0 }, (_, i) => m + (i % 2 ? e : -e));
  const fill = v => new Float64Array(N0).fill(v);
  // item 1 (AN3 = AN less the dying paths' residual, path by path, in P0: every q exactly 1)
  const smear = (P, k, f, add = 0, years = [0, 1, 2]) => { for (const j of years) P.S362.tails.AN3[k][j] = Float64Array.from(P.S362.tails.AN[k][j], (v, i) => v - f * P.S362.dying[k][i] + add); };
  const exact = P => { for (const k of [0, 1, 2]) { P.S362.dying[k] = Float64Array.from({ length: N0 }, (_, i) => (i % 5 === 0 ? 4 : 0)); P.S362.tails.AN[k] = [0, 1, 2].map(() => new Float64Array(N0)); } };
  run('AN3 removes the dying paths\' residual exactly from every year\'s read error', () => {}, '1', 'HELD');
  run('AN3 removes none of it in world 1', P => smear(P, 1, 0), '1', 'FALSIFIED');
  run('AN3 removes half of it in world 0', P => smear(P, 0, 0.5), '1', 'INCONCLUSIVE');
  run('AN3 removes all of it with a live-side over-read of a quarter of the smear in world 2', P => smear(P, 2, 1, 0.125), '1', 'INCONCLUSIVE');
  run('AN3 removes it from year 3 on but years 1 and 2 gain it back (moved, not removed)', P => { smear(P, 0, 1); smear(P, 0, 0, 0, [0, 1]); }, '1', 'INCONCLUSIVE', 'the smear removed from year 3 but not from years 1 and 2 reads unclear (moved), not removed');
  run('AN3 removes twice the smear in world 1 (over-correction past 1.25)', P => smear(P, 1, 2), '1', 'INCONCLUSIVE');
  run('AN3 removes exactly three quarters, no spread (the line)', P => { exact(P); for (const k of [0, 1, 2]) smear(P, k, 0.75); }, '1', 'HELD', 'q exactly three quarters with no spread reads removed');
  run('AN3 removes exactly 1.25, no spread (the upper line)', P => { exact(P); for (const k of [0, 1, 2]) smear(P, k, 1.25); }, '1', 'HELD');
  run('AN3 removes 0.2 in world 2 (under a quarter)', P => smear(P, 2, 0.2), '1', 'FALSIFIED');
  run('AN3 removes exactly a quarter in world 2, no spread (not wholly under)', P => { exact(P); for (const k of [0, 1]) smear(P, k, 1); smear(P, 2, 0.25); }, '1', 'INCONCLUSIVE', 'q exactly a quarter reads unclear, not kept');
  run('AN3 removes 0.2 from years 1 and 2 only, all from year 3 (q_3 decides kept)', P => { smear(P, 1, 1); smear(P, 1, 0.2, 0, [0, 1]); }, '1', 'INCONCLUSIVE');
  run('AN3 removes 0.8 with a per-path spread putting q\'s interval under three quarters', P => { const e = ys(0, 6, N0, 97); for (const j of [0, 1, 2]) P.S362.tails.AN3[0][j] = Float64Array.from(P.S362.tails.AN[0][j], (v, i) => v - 0.8 * P.S362.dying[0][i] + e[i]); }, '1', 'INCONCLUSIVE');
  run('AN3 removes it from years 1 and 2 but not from year 3 (q_3 under a quarter: kept)', P => { smear(P, 1, 0); smear(P, 1, 1, 0, [0, 1]); }, '1', 'FALSIFIED');
  run('AN3 removes exactly 0.72, no spread (under three quarters)', P => { exact(P); for (const k of [0, 1, 2]) smear(P, k, 0.72); }, '1', 'INCONCLUSIVE');
  run('AN3 removes exactly 1.28, no spread (over 1.25)', P => { exact(P); for (const k of [0, 1, 2]) smear(P, k, 1.28); }, '1', 'INCONCLUSIVE');
  run('AN3 removes 0.2 in world 2 with a spread whose interval reaches over a quarter', P => { exact(P); for (const k of [0, 1]) smear(P, k, 1); const e = Float64Array.from({ length: N0 }, (_, i) => (i % 2 ? 1.5 : -1.5)); for (const j of [0, 1, 2]) P.S362.tails.AN3[2][j] = Float64Array.from(P.S362.dying[2], (v, i) => -0.2 * v + e[i]); }, '1', 'INCONCLUSIVE');
  run('AN3 removes 0.8 with a spread whose 95% interval clears three quarters but whose Bonferroni interval over nine does not', P => { exact(P); for (const k of [0, 1, 2]) smear(P, k, 1); const e = Float64Array.from({ length: N0 }, (_, i) => (i % 2 ? 1.1 : -1.1)); for (const j of [0, 1, 2]) P.S362.tails.AN3[0][j] = Float64Array.from(P.S362.dying[0], (v, i) => -0.8 * v + e[i]); }, '1', 'INCONCLUSIVE');
  // item 2
  run('AN3\'s cell about a fifth of AN\'s in every world (the switch largely gone)', () => {}, '2', 'HELD');
  run('the cell stays at AN\'s size', P => { P.cell.n = [234, 269, 271]; }, '2', 'FALSIFIED');
  run('the cell at six tenths of AN\'s (between the lines)', P => { P.cell.n = [140, 161, 163]; }, '2', 'INCONCLUSIVE');
  run('the cell at 0.45 of AN\'s, its interval reaching past a half', P => { P.cell.n = [105, 121, 122]; }, '2', 'INCONCLUSIVE', 'a cell of 0.45 of AN\'s with an interval reaching a half reads unclear, not gone');
  run('the cell gone entirely', P => { P.cell.n = [0, 0, 0]; }, '2', 'HELD', 'an empty cell under AN3 (AN\'s not empty) reads the switch gone');
  run('AN\'s cell empty (nothing to read)', P => { P.cell.n = [0, 0, 0]; P.cell.nAN = [0, 0, 0]; }, '2', 'INCONCLUSIVE');
  run('the cell grows past AN\'s (1.2 times)', P => { P.cell.n = [281, 323, 325]; }, '2', 'FALSIFIED');
  run('world 1 alone stays, worlds 0 and 2 gone (0.69 on the mixture: unclear)', P => { P.cell.n = [10, 269, 10]; }, '2', 'INCONCLUSIVE');
  run('worlds 0 and 2 stay, world 1 gone (a third of the weight)', P => { P.cell.n = [234, 0, 271]; }, '2', 'HELD');
  run('the cell at 0.8 of AN\'s with its interval reaching under three quarters', P => { P.cell.n = [190, 210, 215]; P.cell.nAN = [234, 269, 271]; }, '2', 'INCONCLUSIVE');
  run('the cell at 0.85 of AN\'s, its interval reaching under three quarters', P => { P.cell.n = [199, 229, 230]; }, '2', 'INCONCLUSIVE');
  run('the cell at nine tenths of AN\'s (wholly over three quarters)', P => { P.cell.n = [211, 242, 244]; }, '2', 'FALSIFIED');
  run('rho exactly a half with no variance (worlds 0 and 2 at every path under AN, world 0 alone under AN3)', P => { P.cell.N = 4000; P.cell.nAN = [4000, 0, 4000]; P.cell.n = [4000, 0, 0]; }, '2', 'INCONCLUSIVE', 'rho exactly a half with no variance reads unclear, not gone');
  run('300 paths a world, the cell at 0.8 of AN\'s (the binomial variance\'s own term puts it over three quarters)', P => { P.cell.N = 300; P.cell.nAN = [250, 280, 290]; P.cell.n = [200, 224, 232]; }, '2', 'FALSIFIED');
  run('the read error 0.97 does not decide (the cell a fifth of AN\'s)', P => { P.cell.m = 0.97; P.cell.se = 0.1; }, '2', 'HELD');
  // item 3 (by the mixture; P0's households all clearable)
  const lose = (P, arm, h, k, lost, saved) => { const [c, a] = pairBits(RUNS[h][k], lost, saved); P.legs[arm][h].cells[k] = cellsOf(c, a); P.legs[arm][h].ws[k] = wsOf(ws0(c), ws0(a)); };
  const tiny = (P, h) => { for (const k of [0, 1, 2]) { const c = bitsAt([2, 12, 62][k]); P.legs.AR3[h].cells[k] = cellsOf(c, c); P.legs.AR3[h].ws[k] = wsOf(ws0(c), ws0(c)); } };
  run('every leg at its control', () => {}, '3', 'HELD');
  run('AN3 loses 70 paths on S362 world 1 (the mixture weighs it two thirds)', P => lose(P, 'AN3', 'S362', 1, 80, 10), '3', 'FALSIFIED');
  run('AN3 loses 70 paths on S362 world 0 alone (a sixth of the weight: a world line, not binding)', P => lose(P, 'AN3', 'S362', 0, 80, 10), '3', 'HELD', 'a loss past the margin in world 0 alone reads no material harm on the mixture (the world line reported, not binding)');
  run('AR3 loses 25 net on S360 world 1 (the mixture\'s interval across the margin)', P => lose(P, 'AR3', 'S360', 1, 35, 10), '3', 'INCONCLUSIVE');
  run('S364 at near-nil survival, AR3 at its control: reported only, the rest no harm', P => tiny(P, 'S364'), '3', 'HELD', 'a household identical arms cannot clear is reported only and blocks no other');
  run('S364 at near-nil survival, AR3 losing every surviving path: harm still read there', P => { tiny(P, 'S364'); for (const k of [0, 1, 2]) { const c = bitsAt([2, 12, 62][k]), a = new Uint8Array(N0); P.legs.AR3.S364.cells[k] = cellsOf(c, a); P.legs.AR3.S364.ws[k] = wsOf(ws0(c), ws0(a)); } }, '3', 'FALSIFIED');
  run('every household reported only (nothing read)', P => { for (const [arm, , hs] of LEGS) for (const h of hs) for (const k of [0, 1, 2]) { const c = bitsAt(1); P.legs[arm][h].cells[k] = cellsOf(c, c); P.legs[arm][h].ws[k] = wsOf(ws0(c), ws0(c)); } }, '3', 'INCONCLUSIVE');
  run('the whole score alone harms (survival unmoved, S370 world 1 two points less on every path)', P => { const c = bitsAt(RUNS.S370[1]); P.legs.AN3.S370.ws[1] = wsOf(ws0(c), Float64Array.from(ws0(c), v => v - 2)); }, '3', 'FALSIFIED');
  const alt3 = (base, e) => Float64Array.from(base, (v, i) => v + (i % 2 ? e : -e));
  run('AN3 loses 70 paths on S362 world 1 with the whole score unmoved (survival alone harms)', P => { lose(P, 'AN3', 'S362', 1, 80, 10); const c = bitsAt(RUNS.S362[1]); P.legs.AN3.S362.ws[1] = wsOf(ws0(c), ws0(c)); }, '3', 'FALSIFIED');
  run('the whole score unclear on S370 (a spread of 50 points a path), survival unmoved', P => { const c = ws0(bitsAt(RUNS.S370[1])); P.legs.AN3.S370.ws[1] = wsOf(c, alt3(c, 50)); }, '3', 'INCONCLUSIVE');
  run('AR3 saves 70 paths on S360 world 1', P => lose(P, 'AR3', 'S360', 1, 0, 70), '3', 'HELD');
  run('S364 reported only, its whole score 0.45 under on every path (harm at its own margin, still read)', P => { tiny(P, 'S364'); for (const k of [0, 1, 2]) { const c = ws0(bitsAt([2, 12, 62][k])); P.legs.AR3.S364.ws[k] = wsOf(c, Float64Array.from(c, v => v - 0.45)); } }, '3', 'FALSIFIED', 'a household reported only still reads harm at its own margin');
  run('S364\'s control near nil, AR3 saving 50 a world with an unclear whole score: reported only by the control, not the arm', P => { tiny(P, 'S364'); for (const k of [0, 1, 2]) { const c = bitsAt([2, 12, 62][k]), x = bitsAt([52, 62, 112][k]); P.legs.AR3.S364.cells[k] = cellsOf(c, x); P.legs.AR3.S364.ws[k] = wsOf(ws0(c), alt3(ws0(c), 50)); } }, '3', 'HELD');
  { const c = bitsAt(3), z = bitsAt(1000); put('floorOf: 3 of 4,000 surviving cannot be cleared; 1,000 can', `${floorOf([0, 1, 2].map(() => cellsOf(c, c)))} ${floorOf([0, 1, 2].map(() => cellsOf(z, z)))}`, 'true false'); }
  // item 4
  run('AR3 closes S364\'s and S360\'s worlds 0 and 1', () => {}, '4', 'HELD');
  run('AR3 leaves S360\'s world 0 at -2.4', P => { P.br.S360.AR3[0] = ys(-2.4, 2, N0, 81); }, '4', 'FALSIFIED');
  run('AR3 leaves S364\'s world 1 at 0.9 with an interval across a point', P => { P.br.S364.AR3[1] = alt(0.9, 4); }, '4', 'INCONCLUSIVE');
  run('C under a point in every world of both households (nothing to read)', P => { for (const h of ['S364', 'S360']) for (const k of [0, 1, 2]) P.br[h].C[k] = fill(0.5); }, '4', 'INCONCLUSIVE', 'no world with C\'s read error a point in size: item 4 reads nothing');
  run('AR3 exactly at a point, no spread (the line)', P => { P.br.S364.AR3[0] = fill(1); }, '4', 'HELD');
  run('a world under a point under C is not read (S364\'s world 2 at 3 under AR3)', P => { P.br.S364.AR3[2] = ys(3, 1, N0, 82); }, '4', 'HELD');
  // item 5
  run('AN3 moves S370\'s tail from year 3 by -0.05', () => {}, '5', 'HELD');
  run('AN3 moves S370\'s world-0 tail from year 3 by -0.6', P => { P.S370.tail3.AN3[0] = P.S370.tail3.AN[0].map(v => v - 0.6); }, '5', 'FALSIFIED');
  run('AN3 moves world 1 by 0.25 with spread (across the line)', P => { const e = ys(0, 3, N0, 83); P.S370.tail3.AN3[1] = P.S370.tail3.AN[1].map((v, i) => v + 0.25 + e[i]); }, '5', 'INCONCLUSIVE', 'a control move whose interval straddles a quarter of a point reads unclear');
  // the rows
  const rowAt = edit => { const P = P0(); edit(P); return rowOf(items(P)); };
  const harm = P => lose(P, 'AN3', 'S362', 1, 80, 10);
  const stay = P => { P.cell.n = [234, 269, 271]; };
  put('the rows: the default reads R1', rowAt(() => {}), 'R1');
  put('the rows: the switch over-valued with item 1 held reads R2', rowAt(stay), 'R2');
  put('the rows: harm reads R3 over item 1 FALSIFIED', rowAt(P => { harm(P); smear(P, 1, 0); }), 'R3');
  put('the rows: item 1 FALSIFIED reads R5 over item 4 FALSIFIED', rowAt(P => { smear(P, 1, 0); P.br.S360.AR3[0] = ys(-2.4, 2, N0, 81); }), 'R5');
  put('the rows: item 4 FALSIFIED reads R4 over R1', rowAt(P => { P.br.S360.AR3[0] = ys(-2.4, 2, N0, 81); }), 'R4');
  put('the rows: the switch staying with item 1 unclear reads else, not R2', rowAt(P => { stay(P); smear(P, 0, 0.5); }), 'else');
  put('the rows: item 1 unclear reads else', rowAt(P => smear(P, 0, 0.5)), 'else');
  put('the rows: item 2 unclear with item 1 held reads else', rowAt(P => { P.cell.n = [140, 161, 163]; }), 'else');
  put('the rows: item 5 does not decide a row (moved, R1 stands)', rowAt(P => { P.S370.tail3.AN3[0] = P.S370.tail3.AN[0].map(v => v - 0.6); }), 'R1');
  // the cause
  { const cz = edit => { const P = P0(); edit(P); return causeOf(items(P)); };
    put('the cause: items 1 and 2 HELD credit O191-SMEAR', cz(() => {}), 'O191-SMEAR');
    put('the cause: item 2 HELD with item 1 unclear is not credited', cz(P => smear(P, 0, 0.5)), 'O191-SMEAR not credited: AN3\'s read error from years 1 to 3 not in band (its whole)');
    put('the cause: item 2 FALSIFIED with item 1 HELD reads the not', cz(stay), 'O191-SMEAR not (AN3 reads the year-3 step, its read error in band, and the switch stays): FD-X');
    put('the cause: item 2 FALSIFIED with item 1 kept reads open', cz(P => { stay(P); smear(P, 1, 0); }), 'open (AN3\'s whole not in band: the interaction)');
    put('the cause: item 2 FALSIFIED with item 1 unclear reads open', cz(P => { stay(P); smear(P, 0, 0.5); }), 'open (AN3\'s whole not in band: the interaction)');
    put('the cause: item 2 INCONCLUSIVE reads open', cz(P => { P.cell.n = [140, 161, 163]; }), 'open');
    EDGES.push('item 2 FALSIFIED with item 1 not held: the cause stays open (KNOWN-LEG)'); }
  // tailOf (REF-B's, imported), dyingShare and firstBand
  { const y = { 1: Float64Array.from([1, 2]), 2: Float64Array.from([10, 20]), 3: Float64Array.from([100, 200]) }, ga = Float64Array.from([1000, 2000]);
    put('tailOf: from year 3, the residual at year 3 with GA', Array.from(tailOf(y, ga, [1, 2, 3], 3)).join(','), '1100,2200'); }
  { const Y = 5, mv = Uint16Array.from([1, 1, 1, 1, 65535, 1, 1, 1, 65535, 65535, 1, 1, 1, 1, 1, 1, 1, 65535, 65535, 65535]), bits = Uint8Array.from([0, 0, 1, 0]), y = Float64Array.from([0.5, 0.25, 0.75, 1]);
    const d = dyingShare(mv, Y, bits, y, 3); put('dyingShare: the path dying at year 3 alone (not the one dying at 2, nor the survivor)', `${d.n} ${d.share}`, `1 ${100 * 0.5 / 4}`);
    put('dyingOf: the year-3 dying path\'s residual alone, per path', Array.from(dyingOf(mv, Y, bits, y, 3)).join(','), '0.5,0,0,0');
    const d4 = dyingShare(mv, Y, bits, y, 4); put('dyingShare: at the last year the survivor is not counted', `${d4.n}`, '0');
    const d2 = dyingShare(mv, Y, bits, y, 2); put('dyingShare: the path dying at year 2 alone (not the one dying at year 1, nor the survivor)', `${d2.n} ${d2.share}`, `1 ${100 * 0.25 / 4}`); }
  { const mvA = Uint16Array.from([1, 2, 3, 4]), mvB = Uint16Array.from([1, 2, 3, 5]); put('firstBand: differing first at year 3 with a two-year bridge reads the five years after', String(firstBand(mvA, mvB, 4, 2, 0)), '2'); }
  // pOf: the wiring
  { const bridge = { S362: [1, 2, 3], S370: [1, 2, 3], S364: [1, 2], S360: [1] };
    const perP = (h, a, k, x) => new Float64Array(N0).fill(({ GB: 1, GA: 2, Y1: 10, Y2: 20, Y3: 30 })[x] + ({ C: 0, AN: 100, AN3: 200, AR3: 300 })[a] + ({ S362: 1000, S370: 2000, S364: 3000, S360: 4000 })[h] + 0.1 * k);
    const bitsF = (h, a, k) => bitsAt(RUNS[h][k] - (a === 'AN3' ? 1 : a === 'AR3' ? 2 : 0)), wsF = (h, a, k) => ws0(bitsF(h, a, k));
    const o = (n, m, se) => ({ cell: [0, 1, 2].map(k => ({ n: n + k })), mix: { cell: { eB: m, seB: se } } });
    const P = pOf(perP, bitsF, wsF, bridge, { AN3: o(5, 0.3, 0.1), AN: o(200, 0.97, 0.25), N: 4000 }, (h, a, k) => new Float64Array(N0).fill(({ S362: 7, S370: 8 })[h] + ({ AN: 0.1, AN3: 0.2, C: 0.3 })[a] + 0.01 * k));
    put('pOf: S362\'s dying residual is AN\'s, world by world', P.S362.dying.map(a => a[0].toFixed(2)).join(','), '7.10,7.11,7.12');
    put('pOf: S362\'s AN tail from year 1 is AN\'s years 1 to 3 with GA', P.S362.tails.AN[1][0][0].toFixed(1), ((10 + 100 + 1000 + 0.1) + (20 + 100 + 1000 + 0.1) + (30 + 100 + 1000 + 0.1) + (2 + 100 + 1000 + 0.1)).toFixed(1));
    put('pOf: S362\'s AN3 tail from year 2 is years 2 and 3 with GA', P.S362.tails.AN3[0][1][0].toFixed(1), ((20 + 200 + 1000) + (30 + 200 + 1000) + (2 + 200 + 1000)).toFixed(1));
    put('pOf: S370\'s AN tail from year 3 is year 3 with GA', P.S370.tail3.AN[2][0].toFixed(1), ((30 + 100 + 2000 + 0.2) + (2 + 100 + 2000 + 0.2)).toFixed(1));
    put('pOf: S370\'s AN3 tail from year 3 is AN3\'s', P.S370.tail3.AN3[0][0].toFixed(1), ((30 + 200 + 2000) + (2 + 200 + 2000)).toFixed(1));
    put('pOf: S360\'s C read error from year 1 is its one bridge year with GA', P.br.S360.C[1][0].toFixed(1), ((10 + 4000 + 0.1) + (2 + 4000 + 0.1)).toFixed(1));
    put('pOf: S364\'s AR3 read error from year 1 is years 1 and 2 with GA', P.br.S364.AR3[0][0].toFixed(1), ((10 + 300 + 3000) + (20 + 300 + 3000) + (2 + 300 + 3000)).toFixed(1));
    put('pOf: the cell is AN3\'s counts against AN\'s, AN3\'s read error', `${P.cell.n.join(',')} ${P.cell.nAN.join(',')} ${P.cell.N} ${P.cell.m} ${P.cell.se}`, '5,6,7 200,201,202 4000 0.3 0.1');
    put('pOf: the AN3 leg on S362 sees its one lost path against C', P.legs.AN3.S362.cells.map(x => `${x.b}/${x.c}`).join(','), '1/0,1/0,1/0');
    put('pOf: the AR3 leg on S360 sees its two lost paths against C', P.legs.AR3.S360.cells.map(x => `${x.b}/${x.c}`).join(','), '2/0,2/0,2/0'); }
  // the gate on synthetic logs and files
  const enc = a => Buffer.from(Float64Array.from(a).buffer).toString('base64'), enc8 = a => Buffer.from(Uint8Array.from(a)).toString('base64'), enc16 = a => Buffer.from(Uint16Array.from(a).buffer).toString('base64');
  const npw = 4, DIM = 2, BR = [1, 2, 3];
  const mk = ([id, arm, pts0], over = {}) => {
    const pts = over.pts || pts0, at = over.at ?? pts, L = `${arm}/P${pts}S6Q5`, floor = 104000, br = over.bridge || BR, ad = (over.ref || REF[arm]) === 'adaptive', stp = over.stepAll ?? STEPS[arm];
    const bitsW = [1, 1, 0, 1], mv = [1, 2, 65535, 1, 2, 3, 4, 65535], ws = [100, 99.5, -2, 100], tv = over.tab ?? '50.000000';
    const lines = [`stamp: code ${over.code || 'c1'} audit a1 prediction ${PRED} sha s1`, `REF-STEP: the candidate's own unit, ${npw} paths a world, wealth points divided by ${over.scale || 1} (seed ${over.seed || SEED}); 10 jobs; part 0/1`, `${(over.id || id).padEnd(16)} case | job ${L} | points ${at} | lambda 0.0223606797749979`,
      `solve CAND ${L}: table 50.0000 secs 10`, `ran CAND ${L}: bridgeRead reader bridgeStep exact readerSplit ${over.split ?? SPLIT[arm]} readerCopy ${over.copy ?? 'null'} readerBlend null readerRef ${over.ranRef || over.ref || REF[arm]} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${at} grid total${at}x6x6 shareNodes none floor ${floor} line 0.5`,
      `reader ${L}: tables 72 unsupported 0 copied 10 copiedTop 5 nodes 100`, `nodes ${L}: the uniform six floor ${floor} (the product's rule ${over.rule ?? floor})`,
      ad ? `adaptive ${L}: readerRef adaptive fix ${over.fix ?? true} stepAll ${stp} moves ${over.moves ?? 120} nonMono ${over.nonMono ?? 0} lattice 160x41 nz 128` : `adaptive ${L}: readerRef null fix ${over.fix ?? false} stepAll ${over.stepAll ?? false} moves 0 nonMono -1 lattice none`,
      `checks ${L}: armTook ${over.armTook ?? 1}/1`];
    if (STEPS[arm] && !over.noSteps) lines.push(`steps ${L} 3: 9 of 9 cells with a step, A*_t 7199 to 7201 (median 7200)`);
    if ((STEPS[arm] || over.stepTook) && over.stepTook !== 'none') lines.push(`checks ${L}: stepTook ${over.stepTook ?? 81}/81`);
    if (ad && !over.noPr31) lines.push(`pr31 ${L} 3: the chooser's split 7199; A*_t at b 0, 0.5, 1 (gain nodes first, middle, last) 7200/7200/7200 7200/7200/7200 7200/7200/7200`);
    lines.push(`recount ${L}: tables 72 copied 10 (the solve's 72 and 10) line 0.5`, `checks ${L}: copyTook 1/1`, `openings ${L}: OWN ai 14 level 1 tiers 2,2`);
    for (let w = 0; w < 3; w++) lines.push(`tables ${L} ${w} z 0 weight 0.333333: OWN ${tv} READ 50.000000`);
    lines.push(`bridge ${L}: reader years ${br.join(',')}`);
    const per = {}, bits = {}, moves = {}, states = {};
    for (let w = 0; w < 3; w++) {
      lines.push(`sim ${L} ${w} OWN ai 14: 3/${npw} bridge 3 bits ${sha16(Buffer.from(Uint8Array.from(bitsW)))} ${sha16(Buffer.from(Uint8Array.from(bitsW)))}`, `moves ${L} ${w}: path-years 6 sha ${sha16(Buffer.from(Uint16Array.from(mv).buffer))}`, `ledger ${L} ${w}: X 75 B0 75 T 0 GB 0 GA 0 GL 0 GD 0 ${br.map(t => `Y${t} 0`).join(' ')}`);
      lines.push(`split ${L} ${w}: ${br.map(t => PARTS.map(p => `${p}${t} 0`).join(' ')).join(' ')}`);
      lines.push(`year ${L} ${w} 1: paths 4 G 0.000000 T 0.000000`, `qf ${L} ${w}: paths ${Math.min(npw, NQF)} QF 0`, `whole ${L} ${w}: mean ${(ws.reduce((t, x) => t + x, 0) / npw).toFixed(6)} spending years 46 of 46 floor level 0.8 scale 1 cap 1 death charge 0`);
      for (const x of [...KEYS, ...br.flatMap(t => [`Y${t}`, ...PARTS.map(p => `${p}${t}`)])]) per[`${x}${w}`] = enc(over.perVal && x === 'GB' ? [over.perVal, 0, 0, 0] : [0, 0, 0, 0]);
      per[`WS${w}`] = enc(ws); bits[`OWN${w}`] = enc8(bitsW); bits[`OWN${w}b`] = enc8(bitsW); moves[`MV${w}`] = enc16(over.mv && w === 1 ? over.mv : mv);
      states[`S${w}`] = enc(new Array(npw * br.length * DIM).fill(over.stateVal && w === 2 ? over.stateVal : 0));
    }
    lines.push(`checks ${L}: ownTook 12/12 identity ${3 * npw}/${3 * npw} qfTook 9/9 layerTook 9/9 scoreTook ${3 * npw}/${3 * npw} splitTook 24/24 secs 1`, `clamped ${L}: 0 of 24 bridge-year reads at the reader's clamp (their split does not sum to the read)`, `file ${L}: ${id}-${arm}.json.gz`);
    if (!over.notDone) lines.push(`done ${L}`);
    return { text: lines.join('\n'), file: [`${id}-${arm}.json.gz`, { id, job: L, stamp: { code: over.code || 'c1', audit: 'a1', prediction: PRED, sha: 's1' }, NPW: npw, seed: 7002, own: 14, bridge: br, dim: DIM, per, bits, moves, states, tables: {} }] };
  };
  const at = (id, arm) => EXPECT.findIndex(x => x[0] === id && x[1] === arm);
  const gateOf = (overs = {}, extra = [], opt = {}) => { const all = EXPECT.map((x, i) => mk(x, overs[i] || {})), jobs = [...all, ...extra].flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); return gate(jobs, { npw, files, ...opt }); };
  put('the gate passes the ten jobs as registered', gateOf().join('; '), '');
  { const all = EXPECT.map(x => mk(x, { at: Math.max(4, Math.round(x[2] / 15)), scale: 15 })), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate passes the preflight\'s jobs at a fifteenth of the points', gate(jobs, { npw, scale: 15, files }).join('; '), ''); }
  const refuses = (what, overs, extra = []) => put(`the gate refuses ${what}`, String(gateOf(overs, extra).length > 0), 'true');
  refuses('a job run twice', {}, [mk(EXPECT[0])]);
  refuses('a job of another test beside them', {}, [mk(['S130', 'AN3', 30])]);
  refuses('AN3 without stepAll (the stepoff plant\'s kind)', { [at('S362', 'AN3')]: { stepAll: false } });
  refuses('AN with stepAll', { [at('S370', 'AN')]: { stepAll: true, stepTook: 81 } });
  refuses('AR3 without its RS split', { [at('S364', 'AR3')]: { split: 'null' } });
  refuses('AN3 with the RS split', { [at('S362', 'AN3')]: { split: 'rs' } });
  refuses('C on the adaptive reference', { [at('S360', 'C')]: { ref: 'adaptive' } });
  refuses('AN3 on the plan reference', { [at('S370', 'AN3')]: { ref: 'null' } });
  refuses('AR3 without the reference\'s fix (the foot plant\'s kind)', { [at('S360', 'AR3')]: { fix: false } });
  refuses('stepTook short (the stepramp plant)', { [at('S362', 'AN3')]: { stepTook: 80 } });
  refuses('a stepAll job with no stepTook line', { [at('S364', 'AR3')]: { stepTook: 'none' } });
  refuses('a stepAll job with no steps lines', { [at('S370', 'AN3')]: { noSteps: true } });
  refuses('an adaptive job with no pr31 lines', { [at('S362', 'AN')]: { noPr31: true } });
  refuses('a run line naming the order reference under the arm\'s adaptive record', { [at('S370', 'AN')]: { ranRef: 'order' } });
  refuses('C whose record shows the reference\'s fix', { [at('S364', 'C')]: { fix: true } });
  refuses('AN reporting stepTook without stepAll', { [at('S362', 'AN')]: { stepTook: 81 } });
  refuses('a reference with no moves', { [at('S362', 'AN3')]: { moves: 0 } });
  refuses('a reference with a non-monotone node', { [at('S364', 'AR3')]: { nonMono: 2 } });
  refuses('armTook failed', { [at('S370', 'C')]: { armTook: 0 } });
  refuses('another seed', { [at('S360', 'C')]: { seed: '7004' } });
  refuses('a job on another code', { [at('S362', 'AN')]: { code: 'c2' } });
  refuses('a job with the copy rule', { [at('S362', 'C')]: { copy: 'extrap' } });
  refuses('a job whose bridge years are not its household\'s other jobs\'', { [at('S362', 'AN3')]: { bridge: [1, 2] } });
  refuses('a job whose floor is not the product\'s rule', { [at('S364', 'C')]: { rule: 99000 } });
  { const all = EXPECT.map((x, i) => mk(x, i === 2 ? { scale: 15 } : {})), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate refuses a job whose header is at a fifteenth of the points, read as the full run', String(gate(jobs, { npw, files }).length > 0), 'true'); }
  refuses('a job with no done line', { [at('S360', 'AR3')]: { notDone: true } });
  { const all = EXPECT.slice(1).map(x => mk(x)), jobs = all.flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); put('the gate refuses a missing job', String(gate(jobs, { npw, files }).length > 0), 'true'); }
  // the reproduction: REF-STEP's AN and C against the saved files (synthetic, the same builder)
  const okAll = { 'REF-B': true, 'COPY-B': true, 'COPY-X': true };
  const cellsR = (over = {}, oldOver = {}) => REPRO.map(([h, a, src]) => { const n = mk([h, a, 30], over[`${h} ${a}`] || {}), o = mk([h, a, 30], { code: 'c0', ...(oldOver[`${h} ${a}`] || {}) }); return { h, a, src, job: parse(n.text)[0], file: n.file[1], old: parse(o.text)[0], oldFile: o.file[1] }; });
  put('the reproduction passes equal files and tables', reproGate(cellsR(), okAll).join('; '), '');
  const rrefuses = (what, cells, ok = okAll) => put(`the reproduction refuses ${what}`, String(reproGate(cells, ok).length > 0), 'true');
  rrefuses('when REF-B\'s gate failed', cellsR(), { ...okAll, 'REF-B': false });
  rrefuses('when COPY-X\'s gate failed', cellsR(), { ...okAll, 'COPY-X': false });
  rrefuses('a path\'s GB differing in one path', cellsR({ 'S362 AN': { perVal: 1e-12 } }));
  rrefuses('a move differing in world 1', cellsR({ 'S370 C': { mv: [1, 2, 65535, 1, 2, 3, 5, 65535] } }));
  rrefuses('a visit state differing in world 2', cellsR({ 'S362 C': { stateVal: 1 } }));
  rrefuses('a table differing in the sixth place', cellsR({ 'S370 AN': { tab: '50.000001' } }));
  rrefuses('a source on another seed', cellsR({}, { 'S362 AN': { seed: '7004' } }));
  rrefuses('a source on other bridge years', cellsR({}, { 'S370 C': { bridge: [1, 2] } }));
  { const c = cellsR(); c[2] = { ...c[2], oldFile: null }; rrefuses('a missing source file', c); }
  { const c = cellsR(); c[3] = { ...c[3], oldFile: { ...c[3].oldFile, bridge: [1, 2] } }; rrefuses('a source file naming other bridge years (its arrays equal)', c); }
  { const c = cellsR(); c[0] = { ...c[0], src: 'COPY-B' }; rrefuses('a cell read against the wrong source', c); }
  { const c = cellsR(); c[1] = { ...c[1], file: { ...c[1].file, per: { ...c[1].file.per, EXTRA0: c[1].file.per.GB0 } } }; rrefuses('an array in REF-STEP\'s file that the source lacks', c); }
  EDGES.push('a single path\'s GB differing by 1e-12 fails the reproduction (byte for byte)');
  // the pin: the jobs and arms are the audit's
  { const au = readFileSync(join(HERE, 'audit-refstep.mjs'), 'utf8'), jl = /export const JOBS = \[([\s\S]*?)\];/.exec(au), al = /export const ARMS = Object\.freeze\(\{(.*)\}\);/.exec(au);
    const aj = jl ? [...jl[1].matchAll(/\['(S\d+)', '(\w+)', (\d+), 6, 5\]/g)].map(m => `${m[1]} ${m[2]} ${m[3]}`).join(',') : 'none';
    put('the pin: the reducer\'s jobs are the audit\'s, in its order', EXPECT.map(x => x.join(' ')).join(','), aj);
    const armOf = a => (al ? (new RegExp(`(?:^\\s*|, )${a}: \\{([^}]*)\\}`).exec(al[1]) || [])[1] ?? 'none' : 'none');
    for (const a of ['AN3', 'AN', 'C', 'AR3']) put(`the pin: ${a}'s reference, split, fix and stepAll are the audit's`, `${REF[a]} ${SPLIT[a]} ${REF[a] === 'adaptive'} ${STEPS[a]}`, `${(/readerRef: '(\w+)'/.exec(armOf(a)) || [, 'null'])[1]} ${(/readerSplit: '(\w+)'/.exec(armOf(a)) || [, 'null'])[1]} ${/foot: true/.test(armOf(a))} ${/stepAll: true/.test(armOf(a))}`); }
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
  const DIR = args[0] || join(HERE, 'results', 'diagrefstep'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const RDIR = args[3] || join(HERE, 'results', 'diagrefb'), BDIR = args[4] || join(HERE, 'results', 'diagcopyb'), XDIR = args[5] || join(HERE, 'results', 'diagcopyx');
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const J = (h, a) => jobs.find(x => x.key === keyOf(h, a, 30)), FR = (h, a) => files[J(h, a).file];
  // THE REPRODUCTION: each source's reducer over its own files, then the files compared byte for byte (the preflight reads its
  // own scale's sources when given them: the source directories' preflights)
  const spawnOk = (script, dir, extra = []) => { const r = spawnSync('node', [join(HERE, script), dir, ...extra], { encoding: 'utf8', maxBuffer: 1 << 26 }); return r.status === 0 && /^GATE: passed/m.test(r.stdout || ''); };
  const pre = PRE ? [String(npwA), String(scaleA), '--preflight'] : [];
  const ok = { 'REF-B': spawnOk('reduce-refb.mjs', RDIR, PRE ? pre : []), 'COPY-B': spawnOk('reduce-copyb.mjs', BDIR, pre), 'COPY-X': spawnOk('reduce-copyx.mjs', XDIR, pre) };
  const logsIn = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(d, f), 'utf8')) : []);
  const srcJobs = { 'REF-B': logsIn(RDIR).flatMap(parseRB), 'COPY-B': logsIn(BDIR).flatMap(parseB), 'COPY-X': logsIn(XDIR).flatMap(parseX) };
  const srcDir = { 'REF-B': RDIR, 'COPY-B': BDIR, 'COPY-X': XDIR };
  const findOld = (h, a, src) => (src === 'REF-B' ? srcJobs[src].find(x => x.key === keyOfRB(h, a, 30)) : src === 'COPY-B' ? srcJobs[src].find(x => x.key === keyOfB(h, a, 30)) : srcJobs[src].find(x => x.label === LABELS_X[a] && x.id === h));
  const rcells = REPRO.map(([h, a, src]) => { const old = findOld(h, a, src), p = old && old.file && join(srcDir[src], old.file); return { h, a, src, job: J(h, a), file: FR(h, a), old, oldFile: p && existsSync(p) ? JSON.parse(gunzipSync(readFileSync(p)).toString()) : null }; });
  const rbad = reproGate(rcells, ok);
  if (rbad.length) { console.log(`GATE FAILED (the reproduction, ${rbad.length}):\n  ${rbad.slice(0, 20).join('\n  ')}`); process.exit(1); }
  console.log(`planted (${np_}): all read as they should`);
  const GATELINE = `the ten jobs once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}) on one code; the adaptive reference with its fix on every adaptive job, stepAll on AN3 and AR3 alone with stepTook in full, the RS split on AR3 alone, every self-check in full; the reproduction: REF-B's, COPY-B's and COPY-X's gates passed over ${RDIR}, ${BDIR} and ${XDIR}, and AN's and C's files equal theirs byte for byte`;
  if (PRE) {
    console.log(`GATE: passed - ${GATELINE} (the preflight, against the sources' preflights)`);
    for (const [h, a] of EXPECT) { const j = J(h, a), pp = (k, x) => mean(decRaw(FR(h, a).per[`${x}${k}`])) * 100; console.log(`PREFLIGHT ${h} ${a}: bridge years ${j.bridge.join(',')}, ${j.adaptive.ref === 'adaptive' ? `the reference's moves ${j.adaptive.moves} stepAll ${j.adaptive.stepAll}` : 'the plan reference'}, world-0 GB ${f4(pp(0, 'GB'))} GA ${f4(pp(0, 'GA'))}, copied ${j.reader.copied}, clamped ${j.clamped.n} of ${j.clamped.of}, bridge failures by world ${[0, 1, 2].map(k => j.sims[`OWN${k}`].n - j.sims[`OWN${k}`].bridge).join(', ')}${j.checks.stepTook ? `, stepTook ${j.checks.stepTook.join('/')}` : ''}`); }
    for (const [h, a] of EXPECT) for (const s of J(h, a).steps) console.log(`PREFLIGHT ${h} ${a} steps ${s.t}: ${s.text}`);
    for (const [h, a] of EXPECT) for (const s of J(h, a).pr31) console.log(`PREFLIGHT ${h} ${a} pr31 ${s.t}: ${s.text}`);
    console.log('PREFLIGHT: the gate, the reproduction and the files read; no figure read for an item (a preview at a fraction of the points; PREVIEW)'); process.exit(0);
  }
  console.log(`GATE: passed - ${GATELINE}`);
  const perP = (h, a, k, x) => Float64Array.from(decRaw(FR(h, a).per[`${x}${k}`]), v => 100 * v), bitsF = (h, a, k) => dec8(FR(h, a).bits[`OWN${k}`]), wsF = (h, a, k) => decRaw(FR(h, a).per[`WS${k}`]);
  const bridge = Object.fromEntries(['S362', 'S370', 'S364', 'S360'].map(h => [h, J(h, 'C').bridge]));
  const ld = (h, a) => { const f = FR(h, a), per = Object.fromEntries(Object.entries(f.per).map(([x, v]) => [x, decRaw(v)])), bits = Object.fromEntries(Object.entries(f.bits).map(([x, v]) => [x, dec8(v)])), mv = Object.fromEntries(Object.entries(f.moves).map(([x, v]) => [x, dec16(v)])); return { ...f, per, bits, mv }; };
  const F362 = { C: ld('S362', 'C'), AN: ld('S362', 'AN'), AN3: ld('S362', 'AN3') }, o191 = { AN: readO191(F362.C, F362.AN), AN3: readO191(F362.C, F362.AN3), N: F362.C.NPW };
  const dyingF = (h, a, k) => { const f = ld(h, a); return Float64Array.from(dyingOf(f.mv[`MV${k}`], f.years, f.bits[`OWN${k}`], f.per[`Y3${k}`], 3), v => 100 * v); };
  const P = pOf(perP, bitsF, wsF, bridge, o191, dyingF), it = items(P), iv = x => `${f4(x.d ?? x.R)} (${f4(x.lo)} to ${f4(x.hi)})`;
  const hw = x => `world ${x.k}: survival ${f4(x.ex.d)} exact (${f4(x.ex.lo)} to ${f4(x.ex.hi)}) ${x.ex.outcome}, guarded unconditional (${f4(x.u.lo)} to ${f4(x.u.hi)}), whole score ${iv(x.w)}, margin ${f4(x.margin)}: ${x.harm ? 'harm' : x.ok ? 'no material harm' : 'inconclusive'}`;
  console.log('\nREF-STEP: the adaptive reference with every bridge year\'s step read exactly (AN3, AR3) against AN and the plan reference, on S362 and S370, with S364 and S360 (predictions/diag-refstep.md)');
  console.log('\nTHE ITEMS (each read by its registered rule)');
  console.log(`1. the smear removed from the whole: on S362 the share of AN's year-3 dying paths' residual leaving AN's read error from each of bridge years 1, 2 and 3 under AN3, within [0.75, 1.25] in every world: ${it['1'].outcome}`);
  for (const x of it['1'].per) console.log(`     world ${x.k}: AN's smear ${f4(x.q[0].mc)} points; the share leaving the read error from years 1, 2, 3: ${x.q.map(iv).join('; ')}; AN3's read error from years 1, 2, 3: ${x.tails.map(iv).join('; ')}: ${x.read}`);
  console.log(`2. O191's switch: AN3's year-1 cell (C taxable-first to the arm's ISA-first) under half of AN's on the mixture: ${it['2'].outcome}`);
  console.log(`     the cell's paths by world: AN3 ${it['2'].n.join(', ')} against AN's ${it['2'].nAN.join(', ')}; rho ${it['2'].iv ? iv(it['2'].iv) : 'none (AN\'s cell empty)'}; AN3's own-move read error there on the mixture ${f4(it['2'].m)} (se ${f4(it['2'].se)}; printed, not read)`);
  console.log(`3. no material harm by the mixture (RULES.md section 8 item 1 for a reference change), AN3 against C on S362 and S370 and AR3 against C on S364 and S360, a household identical arms cannot clear reported only: ${it['3'].outcome}`);
  for (const l of it['3'].legs) for (const x of l.per) { console.log(`     ${l.arm} against ${l.ctl} on ${x.h}: survival by the mixture ${f4(x.s.d)} (${f4(x.s.lo)} to ${f4(x.s.hi)}) ${x.s.outcome}, whole score ${iv(x.w)} ${x.w.outcome}, margin ${f4(x.s.margin)} (the control's mixture survival ${f4(x.s.ctrl)})${x.floor ? ', identical arms could not clear it: reported only' : ''}: ${x.read}`);
    const hw0 = harmWorlds(P.legs[l.arm][x.h].cells, P.legs[l.arm][x.h].ws, 0.05); for (const w of hw0.per) console.log(`       its world line (reported, not binding) ${hw(w)}`); }
  console.log(`4. PR24's breadth: AR3's read error from bridge year 1 on S364 and S360 within a point in every world where C's is a point or more: ${it['4'].outcome}`);
  for (const x of it['4'].per) console.log(`     ${x.h} world ${x.k}: C's ${f4(x.mc)}, AR3's ${iv(x.c)}: ${x.read}`);
  if (it['4'].nothing) console.log('     nothing to read: no world with C\'s read error from year 1 a point in size');
  console.log(`5. the control: AN3 moves S370's read error from year 3 on (AN3 less AN) by under a quarter of a point in every world: ${it['5'].outcome}`);
  for (const x of it['5'].per) console.log(`     world ${x.k}: AN3 less AN ${iv(x.c)}: ${x.read}`);
  console.log(`OUTCOME: ${Object.keys(it).map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  console.log(`ROW: ${rowOf(it)}`);
  console.log(`CAUSE item 2: ${causeOf(it)}`);
  for (const i of Object.keys(POINT)) console.log(`REALISED item ${i}: ${f4(POINT[i](it))}`);
  console.log('\nREPORTED');
  const ARMS_H = { S362: ['C', 'AN', 'AN3'], S370: ['C', 'AN', 'AN3'], S364: ['C', 'AR3'], S360: ['C', 'AR3'] };
  for (const [h, as] of Object.entries(ARMS_H)) for (const a of as) for (let k = 0; k < 3; k++) {
    const j = J(h, a), s = j.sims[`OWN${k}`], L = j.ledger[k], t = j.tables[k].OWN, by = j.bridge, S = j.split[k];
    const tails = by.map(u => { let g = L.GA; for (const v of by) if (v >= u) g += L[`Y${v}`]; return `${u}: ${f4(g)}`; }).join(' | ');
    console.log(`  ${h} ${a} world ${k}: table ${f4(t)} runs ${s.ok}/${s.n} (${f4(100 * s.ok / s.n)}), table less runs ${f4(t - 100 * s.ok / s.n)}; GB ${f4(L.GB)} GA ${f4(L.GA)} T ${f4(L.T)} G ${f4(L.GB + L.GA)}; by bridge year ${by.map(y => `${y}: ${f4(L[`Y${y}`])}`).join(' | ')}; the read error from each bridge year on ${tails}; split (QS, QC, RS, RC) ${by.map(y => `${y}: ${PARTS.map(p => f4(S[`${p}${y}`])).join(', ')}`).join(' | ')}; bridge failures ${s.n - s.bridge}`);
  }
  // the smear's signature (the mechanism reached: KNOWN-LEG): the year-3 dying paths' share of each world's year-3 residual
  for (const h of ['S362', 'S370']) for (const a of ARMS_H[h]) { const f = ld(h, a); console.log(`  ${h} ${a}: the paths dying at bridge year 3, their year-3 residual as a share of each world's mean ${[0, 1, 2].map(k => { const d = dyingShare(f.mv[`MV${k}`], f.years, f.bits[`OWN${k}`], f.per[`Y3${k}`], 3); return `world ${k} ${f4(d.share)} (${d.n} paths)`; }).join('; ')}`); }
  // O191's read (read-o191.mjs) for C against AN (it reproduces results-o191.txt's on these files) and C against AN3
  for (const a of ["AN", "AN3"]) { const o = o191[a];
    console.log(`  O191's read, C against ${a} on S362: the year-1 cell's mixture survival change ${f4(o.mix.cell.d)} (se ${f4(o.mix.cell.se)}), own-move read error C ${f4(o.mix.cell.eA)} (${f4(o.mix.cell.seA)}), ${a} ${f4(o.mix.cell.eB)} (${f4(o.mix.cell.seB)}); all paths on the mixture survival ${f4(o.mix.all.s)} (${f4(o.mix.all.se)}), whole score ${f4(o.mix.all.w)} (${f4(o.mix.all.seW)})`);
    for (const c of o.cell) console.log(`    world ${c.k}: the cell n ${c.n}, survival ${a} less C ${f4(c.d.m)} (se ${f4(c.d.se)}), own-move read error C ${f4(c.ea.m)} (${f4(c.ea.se)}), ${a} ${f4(c.eb.m)} (${f4(c.eb.se)})`);
    for (const w of o.worlds) console.log(`    world ${w.k}: every first difference at a bridge year n ${w.all.n}, alive C ${w.all.aliveA} ${a} ${w.all.aliveB}, own-move read error C ${f4(w.all.eA.m)} (${f4(w.all.eA.se)}), ${a} ${f4(w.all.eB.m)} (${f4(w.all.eB.se)})`);
  }
  // each arm against its own control (CONTROL): AN3 against AN (stepAll alone); and REF-B's leg, AN against C
  for (const [arm, ctl] of [['AN3', 'AN'], ['AN', 'C']]) for (const h of ['S362', 'S370']) { const hm = harmMix([0, 1, 2].map(k => cellsOf(bitsF(h, ctl, k), bitsF(h, arm, k))), [0, 1, 2].map(k => wsOf(wsF(h, ctl, k), wsF(h, arm, k)))); console.log(`  ${arm} against ${ctl} on ${h} (reported) by the mixture: survival ${f4(hm.s.d)} (${f4(hm.s.lo)} to ${f4(hm.s.hi)}), whole score ${iv(hm.w)}: ${hm.read}`); const hw0 = harmWorlds([0, 1, 2].map(k => cellsOf(bitsF(h, ctl, k), bitsF(h, arm, k))), [0, 1, 2].map(k => wsOf(wsF(h, ctl, k), wsF(h, arm, k))), 0.05 / 2); for (const w of hw0.per) console.log(`  ${arm} against ${ctl} on ${h} (reported) ${hw(w)}`); }
  for (const [arm, ctl, hs] of [...LEGS, ['AN3', 'AN', ['S362', 'S370']]]) for (const h of hs) for (let k = 0; k < 3; k++) {
    const fa = FR(h, arm), fc = FR(h, ctl), ma = dec16(fa.moves[`MV${k}`]), mc = dec16(fc.moves[`MV${k}`]), ba = bitsF(h, arm, k), bc = bitsF(h, ctl, k), yrs = fa.years, nb = fa.bridge.length, sv = [0, 0, 0, 0], ls = [0, 0, 0, 0];
    let diff = 0;
    for (let i = 0; i < ba.length; i++) { const b = firstBand(ma, mc, yrs, nb, i); if (b >= 0) diff++; if (ba[i] === bc[i] || b < 0) continue; if (ba[i]) sv[b]++; else ls[b]++; }
    console.log(`  ${arm} against ${ctl} on ${h} world ${k}: moves differ on ${diff} paths; saved ${sv.join('/')} and lost ${ls.join('/')} by the band their moves first differ (the opening / the bridge / the five years after / the rest)`);
  }
  for (const [h, a] of EXPECT) { const j = J(h, a); for (const s of j.steps) console.log(`  ${h} ${a} steps ${s.t}: ${s.text}`); for (const s of j.pr31) console.log(`  ${h} ${a} pr31 ${s.t}: ${s.text}`); }
  for (const [h, a] of EXPECT) { const j = J(h, a); console.log(`  ${h} ${a}: ${j.adaptive.ref === 'adaptive' ? `the adaptive reference's moves ${j.adaptive.moves}, fix ${j.adaptive.fix}, stepAll ${j.adaptive.stepAll}` : 'the plan reference'}; copied ${j.reader.copied} of ${j.reader.nodes} nodes; reads at the clamp ${j.clamped.n} of ${j.clamped.of}; solve ${j.solve.secs} s`); }
}
