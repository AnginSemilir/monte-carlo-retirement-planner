/*
 * HO-DEP'S REDUCER (PLAN.md AREF, items/HO-DEP.md; predictions/diag-hodep.md; the deep review after FOOT-S366, deep-review-log.md
 * 18 Oct 09:43 UK, and its design consult of 18 Oct 11:27 UK; the maintainer's decision of 18 Oct: a reference change's harm read
 * by the mixture, survival and whole score, each world reported, not binding). Four jobs, the candidate's own unit, seed 7004, the
 * first 4,000 paths a world, into results/diaghodep (audit-hodep.mjs), all at 30 points: K1F (S362, the adaptive reference with
 * the RS split and the fix) and K2 (S362, the order reference); A and O, the same pair on HOUSE2, the deposit household the reach
 * step chose (select-hodep.mjs).
 * THE GATE: each job once and done at the registered settings, stamped as launched, the fair-test gate on the logs (one audit);
 *   its solve's meta reads the candidate's settings, the job's reference and split; its floor the product's own rule's; every
 *   self-check in full (armTook with R1's guard, adaptTook on the adaptive jobs, footTook, ownTook, identity on 12,000 paths,
 *   qfTook, layerTook, scoreTook); the fix on K1F and A with an A = 0 node alive, off on K2 and O; the files whole, their bits,
 *   moves and whole scores the logs'; and K1F equal to FOOT-S366's saved K1F (sha FOOT_K1F_SHA) on every array both carry.
 * THE ITEMS (the mixture: solve.js MIX3's weights; stats.mjs mixtureChange, mixtureOutcome and mixtureMean at MIX_LEVEL, the
 *   margin marginRel at the control's mixture survival):
 *   1: no material harm, A against O on HOUSE2, by the mixture: HELD when the survival and the whole score both read no
 *      material harm; FALSIFIED when either reads harm; otherwise INCONCLUSIVE.
 *   2: the same, K1F against K2 on S362 (O179's control).
 *   3: A's table at its own opening against its runs on HOUSE2 (the exact interval on each world's count, the mixture's by variance
 *      estimates recovery): HELD when the mixture's interval at 95% lies inside [-1.5, +1.5] and no world's at 1 - 0.05 / 3 lies
 *      wholly at or beyond 3 points; FALSIFIED when the mixture's or any world's lies wholly at or beyond 3 points either way;
 *      otherwise INCONCLUSIVE. (At 4,000 runs a world near 50% survival a world's interval spans about +-1.8 points, so the
 *      HELD line is read at the mixture, what the user sees, and each world for a gross misread: the planted set showed a
 *      per-world HELD line out of reach.)
 *   4: the accuracy contrast, both households, at the mixture: on a household the fixed reference reads truer when O's interval
 *      lies wholly beyond 1 point either way and A's point lies within 1 point, worse when A's interval lies wholly beyond 1
 *      point and O's point within 1; HELD when it reads truer on at least one household and worse on neither; FALSIFIED (it adds
 *      no accuracy) when on both households A's and O's tables lie within 0.5 points of each other in every world and it reads
 *      truer on neither; otherwise INCONCLUSIVE.
 * REPORTED: every world's survival and whole-score change beside the mixture's; every job's tables against its runs by world;
 *   K1F's and K2's bridge residual GB by world and year (O179-SECOND); the moves differing; the fix's live nodes; the solves.
 *   node research/solver/reduce-hodep.mjs [dir] [paths a world] [scale] [--preflight] [--planted]
 *   node research/solver/reduce-hodep.mjs --same <file a> <file b>   (the arrays both files carry, to the bit)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { clopperPearson, mixtureChange, mixtureOutcome, marginRel, zFor, MIX3W, MIX_LEVEL } from './stats.mjs';
import { sha16 } from './reduce-ao.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-hodep.md';
// the household the reach step chose (select-hodep.mjs's CHOSEN line), set at registration
export const HOUSE2 = '';
export const SEED = '7004', NPW = 4000, NQF = 1000, LATTICE = '160x41', NZ = 128, ALPHA3 = 0.05, ALPHA3W = 0.05 / 3;
export const IN3 = 1.5, OUT3 = 3, ADV4 = 1, SAME4 = 0.5;
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const ARMS = ['K1F', 'K2', 'A', 'O'];
export const PTS = Object.freeze({ K1F: 30, K2: 30, A: 30, O: 30 });
export const LABELS = Object.freeze(Object.fromEntries(ARMS.map(a => [a, `${a}/P${PTS[a]}S6Q5`])));
export const HOUSE = Object.freeze({ K1F: 'S362', K2: 'S362', A: HOUSE2, O: HOUSE2 });
export const REF = Object.freeze({ K1F: 'adaptive', K2: 'order', A: 'adaptive', O: 'order' });
export const SPLIT = Object.freeze({ K1F: 'rs', K2: 'null', A: 'rs', O: 'null' });
export const FOOT = Object.freeze({ K1F: true, K2: false, A: true, O: false });
export const FOOT_K1F = 'S362-K1F-P30S6Q5.json.gz', FOOT_K1F_SHA = 'FOOT_K1F_SHA_UNSET';
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S\d+)\s+case \| job ((K1F|K2|A|O)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^HO-DEP: .*?, (\d+) paths a world.*?, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts: Number(c[6]), stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, checks: {}, tables: [], sims: {}, moves: [], ledger: [], qf: [], whole: [], adaptive: null, foot: null, guard: null, bridge: null, own: null, solve: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label, e = esc(L);
    let m;
    if ((m = new RegExp(`^solve CAND ${e}: table (\\S+) secs (\\d+)$`).exec(l))) j.solve = { table: Number(m[1]), secs: Number(m[2]) };
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^guard ${e}: readerRef (\\S+) fix (true|false) declared unfixed (true|false) floor (\\d+) \\(the product's rule (\\d+)\\)$`).exec(l))) j.guard = { ref: m[1], fix: m[2] === 'true', unfixed: m[3] === 'true', floor: Number(m[4]), rule: Number(m[5]) };
    else if ((m = new RegExp(`^adaptive ${e}: moves (\\d+) nonMono (-?\\d+) lattice (\\d+)x(\\d+)x(\\d+) nz (\\d+) last year (\\d+) secs (\\S+)$`).exec(l))) j.adaptive = { moves: Number(m[1]), nonMono: Number(m[2]), lattice: `${m[3]}x${m[4]}`, ng: Number(m[5]), nz: Number(m[6]), TL: Number(m[7]), secs: Number(m[8]) };
    else if ((m = new RegExp(`^foot ${e}: (on|off) live nodes (-?\\d+)$`).exec(l))) j.foot = { on: m[1] === 'on', live: Number(m[2]) };
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

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerBlend: 'null', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3', shareNodes: 'none' };
const NEED = ['armTook', 'footTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'scoreTook'];
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null, house2 = HOUSE2 } = {}) {
  const bad = [], house = { ...HOUSE, A: house2, O: house2 };
  if (!house2 || house2 === 'S362' || house2 === 'S366') bad.push(`HOUSE2 is ${house2 || 'unset'}: the reach step's choice, a deposit household other than S362 and S366`);
  for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(`a job that is not HO-DEP's: ${x.label}`);
  for (const [arm, label] of Object.entries(LABELS)) {
    const js = jobs.filter(x => x.label === label);
    if (js.length !== 1) { bad.push(`${arm}: ${js.length ? `run ${js.length} times` : 'missing'}`); continue; }
    const j = js[0], pts = Math.max(4, Math.round(PTS[arm] / scale));
    if (j.id !== house[arm]) bad.push(`${arm}: run on ${j.id}, not ${house[arm]}`);
    if (!j.done) bad.push(`${arm}: no done line`);
    if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push(`${arm}: no stamp`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${arm}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${arm}: solved at ${j.pts} points, not ${pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, readerRef: REF[arm], readerSplit: SPLIT[arm], pts: String(pts), grid: `total${pts}x6x6` })) if (field(ran, f) !== v) bad.push(`${arm}: ${f} is ${field(ran, f)}, not ${v}`);
    if (!j.guard || j.guard.floor !== j.guard.rule || field(ran, 'floor') !== String(j.guard.floor)) bad.push(`${arm}: its floor is not the product's rule's`);
    if (!j.guard || j.guard.ref !== REF[arm] || j.guard.fix !== FOOT[arm] || j.guard.unfixed) bad.push(`${arm}: R1's guard line does not read ${REF[arm]} with the fix ${FOOT[arm] ? 'on' : 'off'} and nothing declared unfixed`);
    for (const c of [...NEED, ...(REF[arm] === 'adaptive' ? ['adaptTook'] : [])]) { const x = j.checks[c]; if (!x || !(x[1] > 0) || x[0] !== x[1] || (['armTook', 'adaptTook', 'footTook'].includes(c) && x[1] !== 1)) bad.push(`${arm}: ${c} did not pass in full`); }
    if (REF[arm] === 'adaptive' && (!j.adaptive || j.adaptive.lattice !== LATTICE || j.adaptive.nz !== NZ || j.adaptive.nonMono !== 0 || !(j.adaptive.moves > 0))) bad.push(`${arm}: the reference was not built at the registered lattice (${LATTICE}, ${NZ} draws) with a monotone last year`);
    if (!j.foot || j.foot.on !== FOOT[arm] || (FOOT[arm] && !(j.foot.live > 0))) bad.push(`${arm}: the fix is not ${FOOT[arm] ? 'on with an A = 0 node alive' : 'off'}`);
    if (!j.own) bad.push(`${arm}: no openings line`);
    if (!j.solve) bad.push(`${arm}: no solve line`);
    if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push(`${arm}: the identity was not held on every path of three worlds`);
    if (j.checks.scoreTook && j.checks.scoreTook[1] !== 3 * npw) bad.push(`${arm}: the whole score was not checked on every path of three worlds`);
    if (!j.bridge || !j.bridge.length) bad.push(`${arm}: no bridge years`);
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
        for (const x of [...KEYS, 'WS']) { const a = f.per && f.per[`${x}${w}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`${arm}: its file's ${x}${w} paths are not ${npw}`); }
        const ws = f.per && f.per[`WS${w}`]; if (ws && j.whole[w] && Math.abs(decRaw(ws).reduce((t, x) => t + x, 0) / npw - j.whole[w].mean) > 1e-5) bad.push(`${arm}: its file's world-${w} whole scores are not the log's`);
        const mv = f.moves && f.moves[`MV${w}`]; if (!mv || !j.moves[w] || sha16(Buffer.from(mv, 'base64')) !== j.moves[w].sha) bad.push(`${arm}: its file's world-${w} moves are not the log's`);
      }
    }
  }
  return bad;
}

// two saved jobs equal to the bit on the arrays both carry (K1F against FOOT-S366's K1F: per, bits, moves, tables); a key on one
// side only is skipped, and two files sharing nothing compare nothing (n 0: read as not equal)
export function same(a, b, { shared = false } = {}) {
  const off = [];
  for (const f of ['seed', 'NPW', 'own']) if (a[f] !== b[f]) off.push(f);
  if (JSON.stringify(a.bridge) !== JSON.stringify(b.bridge)) off.push('bridge');
  let n = 0;
  for (const nm of ['per', 'bits', 'moves', 'tables']) {
    const A = a[nm] || {}, B = b[nm] || {};
    for (const x of new Set([...Object.keys(A), ...Object.keys(B)])) { if (shared && (!(x in A) || !(x in B))) continue; n++; if (A[x] !== B[x]) off.push(`${nm} ${x}`); }
  }
  return { off, n };
}

const decRaw = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x));
// a world's paired cells, control against arm: a both alive, b lost (the control alive, the arm not), c saved, d both dead
export const cellsOf = (ctrl, arm) => { let a = 0, b = 0, c = 0, d = 0; for (let i = 0; i < ctrl.length; i++) { if (ctrl[i] && arm[i]) a++; else if (ctrl[i]) b++; else if (arm[i]) c++; else d++; } return { a, b, c, d }; };
// a world's paired whole-score change arm - control, its mean and standard error
export const wsOf = (ctrl, arm) => { const n = ctrl.length; let s = 0; for (let i = 0; i < n; i++) s += arm[i] - ctrl[i]; const m = s / n; let v = 0; for (let i = 0; i < n; i++) v += (arm[i] - ctrl[i] - m) ** 2; return { d: m, se: Math.sqrt(v / (n - 1) / n) }; };
// the whole score's mixture from per-world summaries (stats.mjs mixtureMean's arithmetic) and its three outcomes at the margin
export const wsMix = (per, margin, w = MIX3W, level = MIX_LEVEL) => {
  const z = zFor(level), d = per.reduce((t, x, k) => t + w[k] * x.d, 0), se = Math.sqrt(per.reduce((t, x, k) => t + (w[k] * x.se) ** 2, 0)), lo = d - z * se, hi = d + z * se;
  return { d, lo, hi, se, margin, outcome: lo > -margin ? 'no material harm' : hi < 0 && -d >= margin ? 'harm' : 'inconclusive' };
};
// a table against its runs (points): one world's exact interval on the count; the mixture's by variance estimates recovery
export const accOf = (table, c, N, alpha = ALPHA3) => { const [lo, hi] = clopperPearson(c, N, alpha), r = 100 * c / N; return { m: table - r, lo: table - 100 * hi, hi: table - 100 * lo }; };
export const accMix = (rows, alpha = ALPHA3, w = MIX3W) => { const per = rows.map(x => accOf(x.table, x.c, x.N, alpha)), m = per.reduce((t, x, k) => t + w[k] * x.m, 0); return { m, lo: m - Math.sqrt(per.reduce((t, x, k) => t + (w[k] * (x.m - x.lo)) ** 2, 0)), hi: m + Math.sqrt(per.reduce((t, x, k) => t + (w[k] * (x.hi - x.m)) ** 2, 0)), per }; };
const inside = (x, b) => x.lo >= -b && x.hi <= b, beyond = (x, b) => x.lo >= b || x.hi <= -b;

// a pair's harm item: survival and whole score by the mixture
export function harmItem(cells, ws) {
  const s = mixtureOutcome(mixtureChange(cells)), wm = wsMix(ws, s.margin);
  return { outcome: s.outcome === 'harm' || wm.outcome === 'harm' ? 'FALSIFIED' : s.outcome === 'no material harm' && wm.outcome === 'no material harm' ? 'HELD' : 'INCONCLUSIVE', s, w: wm };
}
/* P: { h2: { cells: [3], ws: [3] }, s362: { cells, ws }, acc: { h2: { A: [{ table, c, N } x3], O: [...] }, s362: { A, O } } } */
export function items(P) {
  const out = {};
  out['1'] = harmItem(P.h2.cells, P.h2.ws);
  out['2'] = harmItem(P.s362.cells, P.s362.ws);
  const a3 = [0, 1, 2].map(k => accOf(P.acc.h2.A[k].table, P.acc.h2.A[k].c, P.acc.h2.A[k].N, ALPHA3W)), m3 = accMix(P.acc.h2.A, ALPHA3);
  out['3'] = { outcome: [...a3, m3].some(x => beyond(x, OUT3)) ? 'FALSIFIED' : inside(m3, IN3) ? 'HELD' : 'INCONCLUSIVE', per: a3, mix: m3 };
  const hh = ['h2', 's362'].map(h => { const A = accMix(P.acc[h].A, ALPHA3), O = accMix(P.acc[h].O, ALPHA3), adv = beyond(O, ADV4) && Math.abs(A.m) <= ADV4, worse = beyond(A, ADV4) && Math.abs(O.m) <= ADV4, sameT = [0, 1, 2].every(k => Math.abs(P.acc[h].A[k].table - P.acc[h].O[k].table) <= SAME4); return { h, A, O, adv, worse, sameT }; });
  out['4'] = { outcome: hh.some(x => x.adv) && !hh.some(x => x.worse) ? 'HELD' : hh.every(x => x.sameT) && !hh.some(x => x.adv) ? 'FALSIFIED' : 'INCONCLUSIVE', hh };
  return out;
}
export function rowOf(it) {
  const o = i => it[i].outcome;
  if (o('1') === 'FALSIFIED' || o('2') === 'FALSIFIED') return 'R2';
  if (o('1') === 'HELD' && o('2') === 'HELD' && o('3') === 'HELD' && o('4') === 'HELD') return 'R1';
  if (o('1') === 'HELD' && o('2') === 'HELD' && o('3') === 'HELD' && o('4') === 'FALSIFIED') return 'R3';
  if (o('3') === 'FALSIFIED') return 'R4';
  return 'else';
}

// THE PLANTED CHECKS: each item to each outcome on a case built for it, the gate's refusals, the inert comparison, the EDGES
export const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
const N0 = 4000;
const cellsAt = (s, lost, saved) => { const al = Math.round(s / 100 * N0); return { a: al - lost, b: lost, c: saved, d: N0 - al - saved }; };
const P0 = () => ({ h2: { cells: [cellsAt(30, 10, 10), cellsAt(50, 10, 10), cellsAt(70, 10, 10)], ws: [{ d: 0, se: 0.05 }, { d: 0, se: 0.05 }, { d: 0, se: 0.05 }] }, s362: { cells: [cellsAt(30, 10, 10), cellsAt(50, 10, 10), cellsAt(68, 10, 10)], ws: [{ d: 0, se: 0.05 }, { d: 0, se: 0.05 }, { d: 0, se: 0.05 }] },
  acc: { h2: { A: [{ table: 30, c: 1200, N: N0 }, { table: 50, c: 2000, N: N0 }, { table: 70, c: 2800, N: N0 }], O: [{ table: 27, c: 1200, N: N0 }, { table: 47, c: 2000, N: N0 }, { table: 67, c: 2800, N: N0 }] }, s362: { A: [{ table: 30, c: 1200, N: N0 }, { table: 50, c: 2000, N: N0 }, { table: 68, c: 2720, N: N0 }], O: [{ table: 29.8, c: 1200, N: N0 }, { table: 49.8, c: 2000, N: N0 }, { table: 67.8, c: 2720, N: N0 }] } } });
function planted() {
  const cases = [], put = (what, got, want) => cases.push([what, got, want]);
  const run = (what, edit, i, want, edge) => { const P = P0(); edit(P); const it = items(P); REACHED[i].add(it[i].outcome); put(`${what}: ${i} ${want}`, it[i].outcome, want); if (edge) EDGES.push(edge); };
  run('A at O on HOUSE2, no loss', () => {}, '1', 'HELD');
  run('A loses 60 paths in every world on HOUSE2', P => { P.h2.cells = [cellsAt(30, 70, 10), cellsAt(50, 70, 10), cellsAt(70, 70, 10)]; }, '1', 'FALSIFIED');
  run('a survival trade at the margin on HOUSE2 (bad -1.7, middle -0.5, good +0.7)', P => { P.h2.cells = [cellsAt(30, 72, 4), cellsAt(50, 22, 2), cellsAt(70, 2, 30)]; }, '1', 'FALSIFIED', 'a trade across worlds read by the mixture, not by any one world');
  run('A trades the bad world for the good one, net zero by the mixture (FOOT-S366\'s S362)', P => { P.h2.cells = [cellsAt(29.75, 27, 4), cellsAt(49.875, 11, 12), cellsAt(67.65, 3, 25)]; }, '1', 'HELD', 'a bad-world loss the mixture reads as no material harm');
  run('A\'s whole score 1.2 points down by the mixture, survival level', P => { P.h2.ws = [{ d: -1.2, se: 0.05 }, { d: -1.2, se: 0.05 }, { d: -1.2, se: 0.05 }]; }, '1', 'FALSIFIED');
  run('A\'s whole score 2.4 points down in the bad world alone (the mixture weighs it a sixth)', P => { P.h2.ws = [{ d: -2.4, se: 0.05 }, { d: 0, se: 0.05 }, { d: 0, se: 0.05 }]; }, '1', 'HELD');
  run('A\'s whole score across the margin (lower end past it)', P => { P.h2.ws = [{ d: -0.45, se: 0.1 }, { d: -0.45, se: 0.1 }, { d: -0.45, se: 0.1 }]; }, '1', 'INCONCLUSIVE', 'an interval across the margin');
  run('K1F at K2 on S362', () => {}, '2', 'HELD');
  run('K1F loses 60 paths in every world on S362', P => { P.s362.cells = [cellsAt(30, 70, 10), cellsAt(50, 70, 10), cellsAt(68, 70, 10)]; }, '2', 'FALSIFIED');
  run('K1F\'s survival across the margin on S362', P => { P.s362.cells = [cellsAt(30, 28, 10), cellsAt(50, 28, 10), cellsAt(68, 28, 10)]; }, '2', 'INCONCLUSIVE');
  run('A\'s table at its runs on HOUSE2', () => {}, '3', 'HELD');
  run('A\'s table 5 points over its runs in world 0 alone (a world read for a gross misread)', P => { P.acc.h2.A[0].table = 35; }, '3', 'FALSIFIED', 'one world wholly past the FALSIFIED line while the mixture is not');
  run('A\'s table 2 points under its runs in every world', P => { P.acc.h2.A.forEach(x => { x.table -= 2; }); }, '3', 'INCONCLUSIVE');
  run('A\'s table exactly at 1.5 points in the middle world, its interval across the line', P => { P.acc.h2.A[1].table = 51.5; }, '3', 'INCONCLUSIVE', 'a table at the HELD line with its interval across it');
  run('O under-reads HOUSE2 by 3 points, A at its runs', () => {}, '4', 'HELD');
  run('A and O within 0.2 points on both households', P => { P.acc.h2.O = P.acc.h2.A.map(x => ({ ...x, table: x.table - 0.2 })); }, '4', 'FALSIFIED');
  run('O off by 3 on HOUSE2 but A off by 4 on S362 where O reads true', P => { P.acc.s362.A.forEach(x => { x.table += 4; }); P.acc.s362.O = P.acc.s362.A.map(x => ({ ...x, table: x.table - 4 })); }, '4', 'INCONCLUSIVE');
  run('O off by 3 on HOUSE2 and A off by 2 there (A not within a point)', P => { P.acc.h2.A.forEach(x => { x.table += 2; }); P.acc.h2.O = P.acc.h2.A.map(x => ({ ...x, table: x.table - 5 })); P.acc.s362.O = P.acc.s362.A.map(x => ({ ...x, table: x.table - 0.7 })); }, '4', 'INCONCLUSIVE');
  run('the tables a point apart in world 0 alone on both households, O otherwise A\'s', P => { P.acc.h2.O = P.acc.h2.A.map((x, k) => ({ ...x, table: x.table - (k === 0 ? 1 : 0) })); P.acc.s362.O = P.acc.s362.A.map((x, k) => ({ ...x, table: x.table - (k === 0 ? 1 : 0) })); }, '4', 'INCONCLUSIVE');
  run('the tables alike on HOUSE2 alone, 0.7 apart on S362 with no gain', P => { P.acc.h2.O = P.acc.h2.A.map(x => ({ ...x, table: x.table - 0.2 })); P.acc.s362.O = P.acc.s362.A.map(x => ({ ...x, table: x.table - 0.7 })); }, '4', 'INCONCLUSIVE');
  run('A\'s table 2 points over in world 0 alone (the mixture weighs it a sixth)', P => { P.acc.h2.A[0].table = 32; }, '3', 'HELD');
  // the decision rows
  { const P = P0(); put('the rows: all four HELD reads R1', rowOf(items(P)), 'R1'); }
  { const P = P0(); P.h2.cells = [cellsAt(30, 70, 10), cellsAt(50, 70, 10), cellsAt(70, 70, 10)]; put('the rows: a harm reads R2', rowOf(items(P)), 'R2'); }
  { const P = P0(); P.acc.h2.O = P.acc.h2.A.map(x => ({ ...x, table: x.table - 0.2 })); put('the rows: no accuracy gain reads R3', rowOf(items(P)), 'R3'); }
  { const P = P0(); P.acc.h2.A[0].table = 35; put('the rows: A misreading HOUSE2 reads R4', rowOf(items(P)), 'R4'); }
  { const P = P0(); P.s362.cells = [cellsAt(30, 70, 10), cellsAt(50, 70, 10), cellsAt(68, 70, 10)]; put('the rows: a harm on S362 alone reads R2', rowOf(items(P)), 'R2'); }
  { const P = P0(); P.s362.cells = [cellsAt(30, 28, 10), cellsAt(50, 28, 10), cellsAt(68, 28, 10)]; put('the rows: S362 unsettled, the rest HELD, reads else', rowOf(items(P)), 'else'); }
  // the gate and the inert comparison (on synthetic logs and files)
  const enc = a => Buffer.from(Float64Array.from(a).buffer).toString('base64'), enc8 = a => Buffer.from(Uint8Array.from(a)).toString('base64'), enc16 = a => Buffer.from(Uint16Array.from(a).buffer).toString('base64');
  const npw = 4, house2 = 'S374';
  const mk = (arm, over = {}) => {
    const id = over.id || (arm === 'K1F' || arm === 'K2' ? 'S362' : house2), L = `${arm}/P${over.pts || 30}S6Q5`, ref = REF[arm], fix = over.fix ?? FOOT[arm], floor = over.floor ?? 35000, rule = over.rule ?? floor, footOn = over.footOn ?? fix;
    const bitsW = [1, 1, 0, 1], mv = [1, 2, 65535, 1, 2, 3, 4, 65535], ws = [100, 99.5, -2, 100];
    const lines = [`stamp: code c1 audit a1 prediction ${PRED} sha s1`, `HO-DEP: the candidate's own unit, ${over.npw || npw} paths a world, wealth points divided by 1 (seed ${over.seed || SEED}); 4 jobs; part 0/1`, `${id.padEnd(16)} case | job ${L} | points ${over.casePts || over.pts || 30} | lambda 0.0223606797749979`,
      `solve CAND ${L}: table 50.0000 secs 10`, `ran CAND ${L}: bridgeRead reader bridgeStep exact readerSplit ${over.split || SPLIT[arm]} readerBlend null readerRef ${over.ranRef || over.ref || ref} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${over.pts || 30} grid total${over.pts || 30}x6x6 shareNodes none floor ${floor} line 0.5`,
      `guard ${L}: readerRef ${over.ref || ref} fix ${fix} declared unfixed ${!!over.unfixed} floor ${floor} (the product's rule ${rule})`, `checks ${L}: armTook 1/1`];
    if (ref === 'adaptive') lines.push(`adaptive ${L}: moves 24 nonMono 0 lattice 160x41x3 nz 128 last year 7 secs 300.0`, `checks ${L}: adaptTook ${over.adapt ?? 1}/1`);
    lines.push(`foot ${L}: ${footOn ? 'on' : 'off'} live nodes ${footOn ? (over.live ?? 10) : -1}`, `checks ${L}: footTook 1/1`, `openings ${L}: OWN ai 5 level 1 tiers 0,0`);
    for (let w = 0; w < 3; w++) if (!(over.noTables && w === 1)) lines.push(`tables ${L} ${w} z 0 weight 0.333333: OWN 50.000000 READ 50.000000`);
    lines.push(`bridge ${L}: reader years 1,2,3,4`);
    const per = {}, bits = {}, moves = {};
    for (let w = 0; w < (over.worlds ?? 3); w++) {
      lines.push(`sim ${L} ${w} OWN ai 5: 3/${npw} bridge 3 bits ${sha16(Buffer.from(Uint8Array.from(bitsW)))} ${sha16(Buffer.from(Uint8Array.from(bitsW)))}`, `moves ${L} ${w}: path-years ${over.py ?? 6} sha ${sha16(Buffer.from(Uint16Array.from(mv).buffer))}`, `ledger ${L} ${w}: X 75 B0 75 T 0 GB 0 GA 0 GL 0 GD 0 Y1 0 Y2 0 Y3 0 Y4 0`, `qf ${L} ${w}: paths ${Math.min(npw, NQF)} QF 0`, `whole ${L} ${w}: mean ${(ws.reduce((t, x) => t + x, 0) / npw).toFixed(6)} spending years 30 of 41 floor level 0.8 scale 1 cap 1 death charge 0`);
      for (const x of KEYS) per[`${x}${w}`] = enc([0, 0, 0, 0]);
      if (!over.noWsFile) per[`WS${w}`] = enc(over.wsFile && w === 0 ? [0, 0, 0, 0] : ws); bits[`OWN${w}`] = enc8(bitsW); bits[`OWN${w}b`] = enc8(bitsW); moves[`MV${w}`] = enc16(mv);
    }
    lines.push(`checks ${L}: ownTook 12/12 identity ${3 * npw}/${3 * npw} qfTook 9/9 layerTook 9/9 scoreTook ${over.score ?? 3 * npw}/${3 * npw} secs 1`, `file ${L}: ${id}-${arm}.json.gz`);
    if (!over.notDone) lines.push(`done ${L}`);
    return { text: lines.join('\n'), file: [`${id}-${arm}.json.gz`, { stamp: { code: 'c1', audit: 'a1', prediction: PRED, sha: 's1' }, NPW: npw, seed: 7004, own: 5, bridge: [1, 2, 3, 4], per, bits, moves, tables: {} }] };
  };
  const gateOf = (overs = {}, extra = []) => { const all = ARMS.map(a => mk(a, overs[a] || {})), jobs = [...all, ...extra].flatMap(x => parse(x.text)), files = Object.fromEntries(all.map(x => x.file)); return gate(jobs, { npw, files, house2 }); };
  put('the gate passes the four jobs as registered', gateOf().join('; '), '');
  const refuses = (what, overs, extra = []) => put(`the gate refuses ${what}`, String(gateOf(overs, extra).length > 0), 'true');
  refuses('a job run twice', {}, [mk('A')]);
  refuses('a job of another test beside the four', {}, [mk('A', { pts: 60 })]);
  refuses('a case line at another point count alone', { K2: { casePts: 4 } });
  refuses('a solve meta naming the adaptive reference for O, its guard line the order', { O: { ranRef: 'adaptive' } });
  refuses('K1F\'s own fix line off, its guard line on', { K1F: { footOn: false } });
  refuses('K2\'s own fix line on, its guard line off', { K2: { footOn: true } });
  refuses('a world\'s tables line missing', { A: { noTables: true } });
  refuses('a file without its whole scores', { O: { noWsFile: true } });
  refuses('K2 with no done line', { K2: { notDone: true } });
  refuses('another seed', { O: { seed: '7002' } });
  refuses('a header naming another path count', { A: { npw: 8 } });
  refuses('A at 60 points', { A: { pts: 60 } });
  refuses('A on S366', { A: { id: 'S366' } });
  refuses('K1F without the fix (the arm plant)', { K1F: { fix: false } });
  refuses('A declared unfixed (R1\'s guard)', { A: { unfixed: true } });
  refuses('a fixed job with no node alive', { A: { live: 0 } });
  refuses('O under the adaptive reference', { O: { ref: 'adaptive' } });
  refuses('A without the RS split', { A: { split: 'null' } });
  refuses('a floor other than the product rule\'s', { K2: { floor: 9000, rule: 35000 } });
  refuses('adaptTook short', { K1F: { adapt: 0 } });
  refuses('scoreTook short (the score and trace plants)', { O: { score: 3 * npw - 1 } });
  refuses('a job short of a world', { A: { worlds: 2 } });
  refuses('a file whose whole scores are not the log\'s', { K2: { wsFile: true } });
  { const g = gate(ARMS.map(a => mk(a)).flatMap(x => parse(x.text)), { npw, house2: '' }); put('the gate refuses an unset HOUSE2', String(g.some(x => /HOUSE2/.test(x))), 'true'); }
  const fa = mk('K1F').file[1], fb = JSON.parse(JSON.stringify(fa)); fb.per.extra = 'x';
  put('the inert comparison reads equal files equal on the arrays both carry', same(fa, fb, { shared: true }).off.length, 0);
  const fc = JSON.parse(JSON.stringify(fa)); fc.per.GB0 = enc([0, 1, 0, 0]);
  put('the inert comparison reads a changed array', same(fa, fc, { shared: true }).off.join(','), 'per GB0');
  put('the inert comparison compares nothing between files sharing nothing', same({ per: { a: 1 } }, { per: { b: 1 } }, { shared: true }).n, 0);
  let bad = 0;
  for (const [what, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}: ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`); }
  for (const i of Object.keys(REACHED)) if (REACHED[i].size !== 3) { bad++; console.log(`FAIL item ${i} reaches ${[...REACHED[i]].join(', ')} only`); }
  if (EDGES.length < 2) { bad++; console.log('FAIL fewer than two EDGES'); }
  if (bad) { console.log(`PLANTED CHECK FAILED (${bad})`); process.exit(1); }
  return cases.length;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (process.argv[2] === '--same') {
    const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString()), r = same(ld(process.argv[3]), ld(process.argv[4]), { shared: true });
    console.log(r.off.length || !(r.n > 0) ? `SAME: DIFFERS (${r.off.length} of ${r.n}: ${r.off.slice(0, 6).join(', ')})` : `SAME: identical (${r.n} arrays both carry)`);
    process.exit(r.off.length || !(r.n > 0) ? 1 : 0);
  }
  const np_ = planted();
  if (process.argv.includes('--planted')) {
    console.log(`planted (${np_}): all read as they should\nEDGES: ${EDGES.join(', ')}`);
    for (const i of Object.keys(REACHED)) console.log(`OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--')), PRE = process.argv.includes('--preflight');
  const DIR = args[0] || join(HERE, 'results', 'diaghodep'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  const J = Object.fromEntries(Object.entries(LABELS).map(([a, l]) => [a, jobs.find(x => x.label === l)])), FJ = a => J[a] && files[J[a].file];
  // K1F reproduces FOOT-S366's saved K1F on every array both carry (not at the preflight's scale)
  if (!PRE && FJ('K1F')) {
    const fk = join(HERE, 'results', 'diagfoot', FOOT_K1F);
    if (!existsSync(fk) || sha16(readFileSync(fk)) !== FOOT_K1F_SHA) bad.push(`FOOT-S366's K1F file is not the one recorded (${FOOT_K1F_SHA})`);
    else { const r = same(FJ('K1F'), JSON.parse(gunzipSync(readFileSync(fk)).toString()), { shared: true }); if (r.off.length || !(r.n > 0)) bad.push(`K1F does not reproduce FOOT-S366's K1F (${r.off.length} of ${r.n} arrays differ: ${r.off.slice(0, 4).join(', ')})`); else console.log(`K1F reproduces FOOT-S366's K1F on the ${r.n} arrays both carry`); }
  }
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - K1F, K2, A and O once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}; S362 and ${HOUSE2} at 30 points); each job's reference and split in its solve's meta, its floor the product's rule's, R1's guard; the fix on K1F and A with an A = 0 node alive and off on K2 and O; every self-check in full, scoreTook among them; the files, their moves and whole scores the logs'`);
  if (PRE) { for (const a of ARMS) console.log(`PREFLIGHT ${a}: ${J[a].id}, foot ${J[a].foot.on ? 'on' : 'off'}, live nodes ${J[a].foot.live}, world-0 whole score ${f4(J[a].whole[0].mean)}`); console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const bitsF = (a, k) => dec8(FJ(a).bits[`OWN${k}`]), wsF = (a, k) => decRaw(FJ(a).per[`WS${k}`]);
  const pair = (ctrl, arm) => ({ cells: [0, 1, 2].map(k => cellsOf(bitsF(ctrl, k), bitsF(arm, k))), ws: [0, 1, 2].map(k => wsOf(wsF(ctrl, k), wsF(arm, k))) });
  const accRows = a => [0, 1, 2].map(k => ({ table: J[a].tables[k].OWN, c: J[a].sims[`OWN${k}`].ok, N: J[a].sims[`OWN${k}`].n }));
  const P = { h2: pair('O', 'A'), s362: pair('K2', 'K1F'), acc: { h2: { A: accRows('A'), O: accRows('O') }, s362: { A: accRows('K1F'), O: accRows('K2') } } };
  const it = items(P), iv = x => `${f4(x.d ?? x.m)} (${f4(x.lo)} to ${f4(x.hi)})`;
  console.log(`\nHO-DEP: the fixed adaptive reference against the order reference on two deposit households, ${HOUSE2} (A against O) and S362 (K1F against K2), at 30 points, read by the mixture (predictions/diag-hodep.md)`);
  console.log('\nTHE ITEMS (each read by its registered rule)');
  const harmLine = (x, nm) => `     ${nm}: survival by the mixture ${iv(x.s)} at margin ${f4(x.s.margin)}: ${x.s.outcome}; whole score by the mixture ${iv(x.w)}: ${x.w.outcome}`;
  console.log(`1. no material harm, A against O on ${HOUSE2}, by the mixture (survival and whole score): ${it['1'].outcome}`); console.log(harmLine(it['1'], HOUSE2));
  console.log(`2. no material harm, K1F against K2 on S362, by the mixture (survival and whole score): ${it['2'].outcome}`); console.log(harmLine(it['2'], 'S362'));
  console.log(`3. A's table at its own opening against its runs on ${HOUSE2} within 1.5 points in every world and at the mixture (FALSIFIED at a whole interval past 3): ${it['3'].outcome}`);
  console.log(`     ${it['3'].per.map((x, k) => `world ${k}: ${iv(x)}`).join('; ')}; the mixture ${iv(it['3'].mix)}`);
  console.log(`4. the accuracy contrast, both households, at the mixture: ${it['4'].outcome}`);
  for (const x of it['4'].hh) console.log(`     ${x.h === 'h2' ? HOUSE2 : 'S362'}: the fixed reference's table less runs ${iv(x.A)}, the order reference's ${iv(x.O)}; the pattern: ${x.adv ? 'the fixed reads truer' : x.worse ? 'the fixed reads worse' : 'neither'}${x.sameT ? '; the two tables within 0.5 points in every world' : ''}`);
  console.log(`OUTCOME: 1 ${it['1'].outcome}, 2 ${it['2'].outcome}, 3 ${it['3'].outcome}, 4 ${it['4'].outcome}`);
  console.log(`ROW: ${rowOf(it)}`);
  console.log(`REALISED item 1: ${f4(it['1'].s.d)}`); console.log(`REALISED item 2: ${f4(it['2'].s.d)}`); console.log(`REALISED item 3: ${f4(it['3'].mix.m)}`); console.log(`REALISED item 4: ${f4(it['4'].hh[0].O.m - it['4'].hh[0].A.m)}`);
  console.log('\nREPORTED');
  for (const [nm, x] of [[HOUSE2, it['1']], ['S362', it['2']]]) x.s.per.forEach((p, k) => console.log(`  ${nm} world ${k}: survival change ${f4(p.d)} (${f4(p.lo)} to ${f4(p.hi)}); whole score change ${f4((nm === 'S362' ? P.s362 : P.h2).ws[k].d)} (se ${f4((nm === 'S362' ? P.s362 : P.h2).ws[k].se)})`));
  for (const a of ARMS) for (let k = 0; k < 3; k++) { const s = J[a].sims[`OWN${k}`], x = accOf(J[a].tables[k].OWN, s.ok, s.n); console.log(`  ${a} (${J[a].id}) world ${k}: table at its own opening ${f4(J[a].tables[k].OWN)} runs ${s.ok}/${s.n}, table less runs ${iv(x)}; GB ${f4(J[a].ledger[k].GB)}; by year ${(J[a].bridge || []).map(t => `${t}: ${f4(J[a].ledger[k][`Y${t}`])}`).join(' | ')}`); }
  for (const a of ARMS) console.log(`  ${a}: ${J[a].foot.on ? `the fix on, ${J[a].foot.live} A = 0 nodes alive` : 'the fix off'}; ${J[a].adaptive ? `the reference built in ${J[a].adaptive.secs} s; ` : ''}solve ${J[a].solve.secs} s`);
  // the reach step's tables against the batch's: the derivation read the reach's, the solve not depending on the paths
  for (const a of ['A', 'O']) {
    const rp = join(HERE, 'results', 'hodep-reach', J[a].file);
    if (!existsSync(rp)) { console.log(`  the reach step's ${a} tables: no file (NOT CHECKED)`); continue; }
    const T1 = FJ(a).tables || {}, T2 = JSON.parse(gunzipSync(readFileSync(rp)).toString()).tables || {}, ks = Object.keys(T1);
    const off = ks.filter(x => T1[x] !== T2[x]).length + Object.keys(T2).filter(x => !(x in T1)).length;
    console.log(`  the reach step's ${a} tables against the batch's: ${off || !ks.length ? `DIFFER (${off} of ${ks.length})` : `identical (${ks.length} tables)`}`);
  }
}
