/*
 * FOOT-S366'S REDUCER (PLAN.md AREF, items/FOOT-S366.md; predictions/diag-foot.md; the deep review after AX-HO,
 * deep-review-log.md 18 Oct 01:41 UK; O177). Four jobs, the candidate's own unit, seed 7004, into results/diagfoot
 * (audit-foot.mjs): J1F (S366 at 60 points, the adaptive reference with the RS split and the fix of its floor at no accessible
 * money), J1D (S366 at 60 points, the adaptive reference with the default split), K1 and K1F (S362, a held-out deposit
 * household, at 30 points, the RS split without and with the fix), read against AX-HO's saved J1 and J2 on S366 (results/
 * diagaxho, behind AX-HO's gate, the files the ones recorded) on the same 4,000 paths a world.
 * THE GATE: each job once and done at the registered settings (4,000 paths a world, scale 1, seed 7004; S366 at 60 points,
 *   S362 at 30), stamped as launched, the fair-test gate on the logs (one audit); its solve's meta reads the candidate's
 *   settings, the adaptive reference and the job's split; every self-check in full (armTook, adaptTook, footTook, ownTook,
 *   identity on 12,000 paths, qfTook, layerTook); the fix on J1F and K1F (an A = 0 node alive) and off on J1D and K1; the files
 *   whole, their bits and moves the logs'; AX-HO's J1 and J2 behind AX-HO's gate (sha 6d3833268f934865, 6fd322058ca882af).
 * THE ITEMS:
 *   1 (primary): J1F's bridge year 4 grid residual in world 0 (the mean over its 4,000 paths of Y4, points; z for one world,
 *     two sides, 1.96): HELD inside [-0.5, +0.5] (the fix removes O177's over-read); FALSIFIED wholly at or beyond one point
 *     either way, the side named; otherwise INCONCLUSIVE.
 *   2: J1F's table at its own opening against its runs, every world (the exact interval on the count at 1 - 0.05 / 3): HELD
 *     inside [-1.5, +1.5] in every world; FALSIFIED any wholly at or beyond 3 points either way; otherwise INCONCLUSIVE.
 *   3: J1D against AX-HO's J1 in world 0's year-4 residual, path by path (J1D less J1, mean and z 1.96): HELD inside [-0.5,
 *     +0.5] (the split no part of O177); FALSIFIED wholly at or beyond one point either way; otherwise INCONCLUSIVE.
 *   4: no material harm to J1F's runs against AX-HO's J2 on the same paths, worlds 0 and 1 (the exact conditional McNemar
 *     interval, the relative margin marginRel(J2's survival), Holm across the two): HELD, FALSIFIED (harm in either) or
 *     INCONCLUSIVE; the moves differing printed beside.
 * REPORTED: every job's tables against its runs by world; J1F against AX-HO's J1 (the fix's own change: the year-4 residual,
 *   the GB, the moves and paths differing, the runs); J1D's ledger beside J1's; S362: K1's and K1F's tables against their
 *   runs, their year-4 residual and GB, K1F against K1 path by path; the fix's live nodes; the reference's build and solves.
 *   node research/solver/reduce-foot.mjs [dir] [paths a world] [scale] [--preflight] [--planted]
 *   node research/solver/reduce-foot.mjs --same <file a> <file b>   (two saved jobs' ledgers, bits, moves and tables to the bit)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { requireFairLogs } from './fair-gate.mjs';
import { mcnemarHarmP, holm, outcome, marginRel } from './stats.mjs';
import { meanOf, paired, sha16, q } from './reduce-ao.mjs';
import { differ, gapOf, NOMOVE } from './reduce-axho.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-foot.md';
export const SEED = '7004', NPW = 4000, NQF = 1000, LATTICE = '160x41', NZ = 128;
export const Z1 = 1.959963984540054, ALPHA2 = 0.05 / 3;
export const IN1 = 0.5, OUT1 = 1.0, IN2 = 1.5, OUT2 = 3, IN3 = 0.5, OUT3 = 1.0;
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const ARMS = ['J1F', 'J1D', 'K1', 'K1F'];
export const PTS = Object.freeze({ J1F: 60, J1D: 60, K1: 30, K1F: 30 });
export const LABELS = Object.freeze(Object.fromEntries(ARMS.map(a => [a, `${a}/P${PTS[a]}S6Q5`])));
export const HOUSE = Object.freeze({ J1F: 'S366', J1D: 'S366', K1: 'S362', K1F: 'S362' });
export const FOOT = Object.freeze({ J1F: true, J1D: false, K1: false, K1F: true });
export const AXHO_J1 = 'S366-J1-P60S6Q5.json.gz', AXHO_J1_SHA = '6d3833268f934865', AXHO_J2 = 'S366-J2-P60S6Q5.json.gz', AXHO_J2_SHA = '6fd322058ca882af';
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S366|S362|S360|S364)\s+case \| job ((J1F|J1D|K1|K1F|I0|I1|I2|I3)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^FOOT-S366: .*?, (\d+) paths a world.*?, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts: Number(c[6]), stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, checks: {}, tables: [], sims: {}, moves: [], ledger: [], qf: [], adaptive: null, foot: null, bridge: null, own: null, solve: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label, e = esc(L);
    let m;
    if ((m = new RegExp(`^solve CAND ${e}: table (\\S+) secs (\\d+)$`).exec(l))) j.solve = { table: Number(m[1]), secs: Number(m[2]) };
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^adaptive ${e}: moves (\\d+) nonMono (-?\\d+) lattice (\\d+)x(\\d+)x(\\d+) nz (\\d+) last year (\\d+) secs (\\S+)$`).exec(l))) j.adaptive = { moves: Number(m[1]), nonMono: Number(m[2]), lattice: `${m[3]}x${m[4]}`, ng: Number(m[5]), nz: Number(m[6]), TL: Number(m[7]), secs: Number(m[8]) };
    else if ((m = new RegExp(`^foot ${e}: (on|off) live nodes (-?\\d+)$`).exec(l))) j.foot = { on: m[1] === 'on', live: Number(m[2]) };
    else if ((m = new RegExp(`^openings ${e}: OWN ai (\\d+) `).exec(l))) j.own = { ai: Number(m[1]) };
    else if ((m = new RegExp(`^tables ${e} (\\d) z (\\S+) weight (\\S+): OWN (\\S+) READ (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), OWN: Number(m[4]), READ: Number(m[5]) };
    else if ((m = new RegExp(`^bridge ${e}: reader years ?(\\S*)$`).exec(l))) j.bridge = m[1] ? m[1].split(',').map(Number) : [];
    else if ((m = new RegExp(`^sim ${e} (\\d) OWN ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`OWN${m[1]}`] = { ai: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bridge: Number(m[5]), bits: m[6], bitsB: m[7] };
    else if ((m = new RegExp(`^moves ${e} (\\d): path-years (\\d+) sha (\\S+)$`).exec(l))) j.moves[Number(m[1])] = { py: Number(m[2]), sha: m[3] };
    else if ((m = new RegExp(`^ledger ${e} (\\d): (.*)$`).exec(l))) j.ledger[Number(m[1])] = Object.fromEntries([...m[2].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])]));
    else if ((m = new RegExp(`^qf ${e} (\\d): paths (\\d+) QF (\\S+)$`).exec(l))) j.qf[Number(m[1])] = { n: Number(m[2]), QF: Number(m[3]) };
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerBlend: 'null', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3', shareNodes: 'none', readerRef: 'adaptive' };
const ARMF = Object.freeze({ J1F: { readerSplit: 'rs', floor: '29000' }, J1D: { readerSplit: 'null', floor: '29000' }, K1: { readerSplit: 'rs', floor: '35000' }, K1F: { readerSplit: 'rs', floor: '35000' } });
const NEED = ['armTook', 'adaptTook', 'footTook', 'ownTook', 'identity', 'qfTook', 'layerTook'];
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null } = {}) {
  const bad = [];
  for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(`a job that is not FOOT-S366's: ${x.label}`);
  for (const [arm, label] of Object.entries(LABELS)) {
    const js = jobs.filter(x => x.label === label);
    if (js.length !== 1) { bad.push(`${arm}: ${js.length ? `run ${js.length} times` : 'missing'}`); continue; }
    const j = js[0], pts = Math.max(4, Math.round(PTS[arm] / scale));
    if (j.id !== HOUSE[arm]) bad.push(`${arm}: run on ${j.id}, not ${HOUSE[arm]}`);
    if (!j.done) bad.push(`${arm}: no done line`);
    if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push(`${arm}: no stamp`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${arm}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${arm}: solved at ${j.pts} points, not ${pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, ...ARMF[arm], pts: String(pts), grid: `total${pts}x6x6` })) if (field(ran, f) !== v) bad.push(`${arm}: ${f} is ${field(ran, f)}, not ${v}`);
    for (const c of NEED) { const x = j.checks[c]; if (!x || !(x[1] > 0) || x[0] !== x[1] || (['armTook', 'adaptTook', 'footTook'].includes(c) && x[1] !== 1)) bad.push(`${arm}: ${c} did not pass in full`); }
    if (!j.adaptive || j.adaptive.lattice !== LATTICE || j.adaptive.nz !== NZ || j.adaptive.nonMono !== 0 || !(j.adaptive.moves > 0)) bad.push(`${arm}: the reference was not built at the registered lattice (${LATTICE}, ${NZ} draws) with a monotone last year`);
    if (!j.foot || j.foot.on !== FOOT[arm] || (FOOT[arm] && !(j.foot.live > 0))) bad.push(`${arm}: the fix is not ${FOOT[arm] ? 'on with an A = 0 node alive' : 'off'}`);
    if (!j.own) bad.push(`${arm}: no openings line`);
    if (!j.solve) bad.push(`${arm}: no solve line`);
    if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push(`${arm}: the identity was not held on every path of three worlds`);
    if (!j.bridge || !j.bridge.includes(4)) bad.push(`${arm}: bridge year 4 is not among the reader's years`);
    for (let w = 0; w < 3; w++) {
      const t = j.tables[w]; if (!t || !Number.isFinite(t.OWN) || !Number.isFinite(t.READ)) bad.push(`${arm}: world ${w}'s tables are missing`);
      const s = j.sims[`OWN${w}`]; if (!s || s.n !== npw || (j.own && s.ai !== j.own.ai)) bad.push(`${arm}: no OWN run of ${npw} paths at its opening in world ${w}`);
      if (!j.ledger[w] || [...KEYS, ...(j.bridge || []).map(t => `Y${t}`)].some(x => !Number.isFinite(j.ledger[w][x]))) bad.push(`${arm}: world ${w}'s ledger line is missing or short`);
      if (!j.qf[w] || j.qf[w].n !== Math.min(npw, NQF)) bad.push(`${arm}: world ${w}'s QF line is missing`);
      if (!j.moves[w] || !(j.moves[w].py >= npw)) bad.push(`${arm}: world ${w}'s moves line is missing or short`);
    }
    if (files) {
      const f = j.file && files[j.file];
      if (!f) { bad.push(`${arm}: its file ${j.file} is missing`); continue; }
      if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${arm}: its file is stamped by other code`);
      if (f.NPW !== npw) bad.push(`${arm}: its file is not on ${npw} paths a world`);
      for (const [nm, s] of Object.entries(j.sims)) for (const [b, sh] of [[nm, s.bits], [`${nm}b`, s.bitsB]]) { const x = f.bits && f.bits[b]; if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(`${arm}: its file's ${b} bits are not the log's`); }
      for (let w = 0; w < 3; w++) {
        for (const x of KEYS) { const a = f.per && f.per[`${x}${w}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`${arm}: its file's ${x}${w} paths are not ${npw}`); }
        const mv = f.moves && f.moves[`MV${w}`]; if (!mv || !j.moves[w] || sha16(Buffer.from(mv, 'base64')) !== j.moves[w].sha) bad.push(`${arm}: its file's world-${w} moves are not the log's`);
      }
    }
  }
  return bad;
}

// two saved jobs equal to the bit in their ledgers, runs' bits, moves and tables (the preflight's inert and foot-off checks)
export function same(a, b) {
  const off = [];
  for (const f of ['seed', 'NPW', 'own']) if (a[f] !== b[f]) off.push(f);
  if (JSON.stringify(a.bridge) !== JSON.stringify(b.bridge)) off.push('bridge');
  let n = 0;
  for (const nm of ['per', 'bits', 'moves', 'tables']) { const A = a[nm] || {}, B = b[nm] || {}; for (const x of new Set([...Object.keys(A), ...Object.keys(B)])) { n++; if (A[x] !== B[x]) off.push(`${nm} ${x}`); } }
  return { off, n };
}
const harmItem = pr => {
  const ph = holm(pr.map(x => mcnemarHarmP(x.lost, x.saved)));
  const oc = pr.map((x, i) => { const margin = marginRel(100 * x.bAlive / x.N); return { ...x, margin, ...outcome({ b: x.lost, c: x.saved, N: x.N, margin, pHolm: ph[i] }) }; });
  return { outcome: oc.some(x => x.outcome === 'harm') ? 'FALSIFIED' : oc.every(x => x.outcome === 'no material harm') ? 'HELD' : 'INCONCLUSIVE', cells: oc };
};
const band = (x, IN, OUT) => (x.lo >= -IN && x.hi <= IN ? 'HELD' : x.lo >= OUT || x.hi <= -OUT ? 'FALSIFIED' : 'INCONCLUSIVE');
const sideOf = (x, OUT) => (x.lo >= OUT ? 'over' : x.hi <= -OUT ? 'under' : null);
/* Y(arm, k, t): per-path year-t residual in points (J1F, J1D, and J1 from AX-HO's file); TAB(k): J1F's table at its own
   opening; RUN(k): { c, N } J1F's runs; S(arm, k): OWN bits (J1F, J2) */
export function items(Y, TAB, RUN, S) {
  const out = {};
  const c1 = { k: 0, ...meanOf(Y('J1F', 0, 4), Z1) };
  out['1'] = { outcome: band(c1, IN1, OUT1), side: sideOf(c1, OUT1), cell: c1 };
  const c2 = [0, 1, 2].map(k => { const r = RUN(k); return { k, ...gapOf(TAB(k), r.c, r.N, ALPHA2) }; });
  const over2 = x => x.lo >= OUT2, under2 = x => x.hi <= -OUT2, in2 = x => x.lo >= -IN2 && x.hi <= IN2;
  out['2'] = { outcome: c2.some(x => over2(x) || under2(x)) ? 'FALSIFIED' : c2.every(in2) ? 'HELD' : 'INCONCLUSIVE', side: c2.some(over2) && c2.some(under2) ? 'over and under' : c2.some(over2) ? 'over' : c2.some(under2) ? 'under' : null, cells: c2 };
  const yd = Y('J1D', 0, 4), y1 = Y('J1', 0, 4), c3 = { k: 0, ...meanOf(yd.map((v, i) => v - y1[i]), Z1) };
  out['3'] = { outcome: band(c3, IN3, OUT3), side: sideOf(c3, OUT3), cell: c3 };
  out['4'] = harmItem([0, 1].map(k => ({ k, ...paired(S('J1F', k), S('J2', k)) })));
  return out;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), iv = x => `${f4(x.m)} (${f4(x.lo)} to ${f4(x.hi)})`;
const harmLine = x => `world ${x.k}: lost ${x.lost} saved ${x.saved} of ${x.N}, change ${f4(x.d)} (${f4(x.lo)} to ${f4(x.hi)}) at margin ${x.margin}: ${x.outcome}`;
/* DIF(k): the moves differing between J1F and J2 in world k (differ()'s), or null */
export function report(Y, TAB, RUN, S, DIF = () => null) {
  const it = items(Y, TAB, RUN, S), L = [];
  L.push('', 'THE ITEMS (each read by its registered rule)');
  L.push(`1. J1F's bridge year 4 grid residual in world 0 within half a point (FALSIFIED at a whole interval past one point either way): ${it['1'].outcome}${it['1'].side ? ` (${it['1'].side})` : ''}`, `     world 0: ${iv(it['1'].cell)}`);
  L.push(`2. J1F's table at its own opening against its runs inside 1.5 points in every world (FALSIFIED at a whole interval past 3 points either way): ${it['2'].outcome}${it['2'].side ? ` (${it['2'].side})` : ''}`);
  L.push(`     ${it['2'].cells.map(x => `world ${x.k}: table ${f4(x.table)} runs ${x.c}/${x.N} (${f4(x.runs)}), table less runs ${iv(x)}`).join('; ')}`);
  L.push(`3. J1D against AX-HO's J1 in world 0's year-4 residual, path by path, within half a point (FALSIFIED at a whole interval past one point either way): ${it['3'].outcome}${it['3'].side ? ` (${it['3'].side})` : ''}`, `     J1D less J1: ${iv(it['3'].cell)}`);
  L.push(`4. no material harm to J1F's runs against AX-HO's J2 on S366 on the same paths, worlds 0 and 1: ${it['4'].outcome}`, `     ${it['4'].cells.map(harmLine).join('; ')}`);
  L.push(`     moves differing, J1F against J2: ${[0, 1, 2].map(k => { const d = DIF(k); return d ? `world ${k}: ${d.paths} of ${d.n} paths and ${d.py} of ${d.both} path-years` : `world ${k}: no moves`; }).join('; ')}`);
  L.push(`OUTCOME: ${['1', '2', '3', '4'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  for (const [i, x] of [['1', it['1'].cell.m], ['2', it['2'].cells[0].m], ['3', it['3'].cell.m], ['4', it['4'].cells[0].d]]) L.push(`REALISED item ${i}: ${f4(x)}`);
  return L;
}

/* THE PLANTED CHECKS */
const EDGES = [], ITEMS = ['1', '2', '3', '4'], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
function planted() {
  const cases = [], N = 4000;
  const bitsOf = (alive, n = N, lose = 0, gain = 0) => { const b = Buffer.alloc(n); for (let i = 0; i < alive; i++) b[i] = 1; for (let i = 0; i < lose; i++) b[i] = 0; for (let i = 0; i < gain; i++) b[alive + i] = 1; return b; };
  // S366 at about 98% and 99.9% in worlds 0 and 1 (J2's survival); the year-4 residual per path about its mean, spread sd
  const mk = (o = {}) => {
    const y = (m, sd = 1) => Array.from({ length: N }, (_, i) => m + (i % 2 ? sd : -sd));
    const Y = (arm, k, t) => (t !== 4 ? y(0, o.sd || 1) : arm === 'J1F' ? y(o.y1f !== undefined ? o.y1f : 0.05, o.sd || 1) : arm === 'J1D' ? y(o.y1d !== undefined ? o.y1d : 2.1, o.sd || 1) : y(2.1, o.sd || 1));
    const runs = o.runs || [97.9, 99.95, 100], tab = o.tab || [97.9, 99.95, 100];
    const S = (arm, k) => (arm === 'J1F' ? bitsOf(k ? 3998 : 3920, N, o.lose ? o.lose[k] : 0, o.gain ? o.gain[k] : 0) : bitsOf(k ? 3998 : 3920));
    return [Y, k => tab[k], k => ({ c: Math.round(runs[k] * 40), N }), S];
  };
  const outc = (i, o, want, what) => { const got = items(...mk(o))[i].outcome; REACHED[i].add(got); cases.push([what, got, want]); };
  // item 1 (sd 1 on 4,000: half-width about 0.03)
  outc('1', {}, 'HELD', 'J1F\'s year-4 residual 0.05: 1 HELD');
  outc('1', { y1f: 2.1 }, 'FALSIFIED', 'J1F\'s year-4 residual 2.1 (the fix inert): 1 FALSIFIED (over)');
  outc('1', { y1f: -1.4 }, 'FALSIFIED', 'J1F\'s year-4 residual -1.4: 1 FALSIFIED (under)');
  outc('1', { y1f: 0.49 }, 'INCONCLUSIVE', 'J1F\'s year-4 residual 0.49, its interval across 0.5: 1 INCONCLUSIVE'); EDGES.push('an interval across the HELD line');
  outc('1', { y1f: 0.75 }, 'INCONCLUSIVE', 'J1F\'s year-4 residual 0.75: 1 INCONCLUSIVE');
  { const x = items(...mk({ y1f: 2.1 }))['1']; cases.push(['item 1 names its side', `${x.outcome} ${x.side}`, 'FALSIFIED over']); }
  // item 2 (4,000 runs a world; at 97.9% the 1 - 0.05 / 3 half-width about 0.55)
  outc('2', {}, 'HELD', 'J1F\'s table at its runs: 2 HELD');
  outc('2', { tab: [99.98, 99.95, 100] }, 'INCONCLUSIVE', 'world 0\'s table 2.08 over (AX-HO\'s J1): 2 INCONCLUSIVE');
  outc('2', { tab: [97.9, 96.5, 100] }, 'FALSIFIED', 'world 1\'s table 3.45 under: 2 FALSIFIED (under)');
  outc('2', { runs: [97.9, 99.95, 100], tab: [97.9, 99.95, 100] }, 'HELD', 'world 2 every run alive: 2 HELD'); EDGES.push('every run alive');
  outc('2', { tab: [97.9, 99.95, 96.0] }, 'FALSIFIED', 'world 2\'s table 4 points under its runs (world 2 read too): 2 FALSIFIED');
  outc('2', { tab: [99.6, 99.95, 100] }, 'INCONCLUSIVE', 'world 0\'s table 1.7 over, its interval inside 2.5 but past 1.5: 2 INCONCLUSIVE');
  { const x = items(...mk({ tab: [97.9, 96.5, 100] }))['2']; cases.push(['item 2 names its side', `${x.outcome} ${x.side}`, 'FALSIFIED under']); }
  // item 3 (J1 at 2.1 per path; J1D less J1 path by path)
  outc('3', {}, 'HELD', 'J1D at J1\'s year-4 residual: 3 HELD');
  outc('3', { y1d: 0.1 }, 'FALSIFIED', 'J1D 2 points under J1 (the split a part): 3 FALSIFIED (under)');
  outc('3', { y1d: 2.85 }, 'INCONCLUSIVE', 'J1D 0.75 over J1: 3 INCONCLUSIVE');
  { const x = items(...mk({ y1d: 0.1 }))['3']; cases.push(['item 3 names its side', `${x.outcome} ${x.side}`, 'FALSIFIED under']); }
  { const x = items(...mk({ y1d: 2.1, sd: 3 }))['3'].cell; cases.push(['item 3 reads the difference path by path (equal paths, a difference of 0 with no spread)', `${f4(x.m)} ${f4(x.hi - x.lo)}`, '0.0000 0.0000']); EDGES.push('a difference with no spread'); }
  // item 4 (J2 alive on 3,920 and 3,998 of 4,000: margin 0.25)
  outc('4', {}, 'HELD', 'J1F equal to J2 on every path: 4 HELD'); EDGES.push('no discordant path');
  outc('4', { lose: [40, 0] }, 'FALSIFIED', 'J1F loses 40 paths in world 0: 4 FALSIFIED');
  outc('4', { lose: [11, 0], gain: [2, 0] }, 'INCONCLUSIVE', 'J1F loses 11 and saves 2 in world 0 (0.225 points, short of the margin): 4 INCONCLUSIVE');
  outc('4', { lose: [4, 0], gain: [1, 0] }, 'HELD', 'J1F loses 4 and saves 1 in world 0: 4 HELD');
  { const x = items(...mk({ lose: [40, 0] }))['4'].cells[0]; cases.push(['item 4\'s margin is the relative one at J2\'s survival (0.25 at 98%)', x.margin, 0.25]); }
  { let L = [], err = null; try { L = report(...mk()); } catch (e) { err = e.message; } cases.push(['the read prints four items, an OUTCOME of four and four REALISED lines', err || `${['1.', '2.', '3.', '4.'].every(p => L.some(l => l.startsWith(p)))} ${(L.find(l => l.startsWith('OUTCOME: ')) || '').split(',').length} ${L.filter(l => l.startsWith('REALISED item ')).length}`, 'true 4 4']); }
  // the inert check (same): equal files read equal, a changed table or a missing array read off
  { const f = { seed: 7004, NPW: 40, own: 59, bridge: [1, 2], per: { X0: 'aa' }, bits: { OWN0: 'bb' }, moves: { MV0: 'cc' }, tables: { '0/0/1': 'dd' } };
    cases.push(['the inert check reads equal files equal', same(f, JSON.parse(JSON.stringify(f))).off.length, 0]);
    cases.push(['the inert check reads a changed table', same(f, { ...f, tables: { '0/0/1': 'de' } }).off.join(','), 'tables 0/0/1']);
    cases.push(['the inert check reads an array missing on one side', same(f, { ...f, per: {} }).off.join(','), 'per X0']); EDGES.push('an array on one side only'); }
  // the gate, on synthetic logs as the audit prints them
  const pad = ''.padEnd(16), bits = 'aaaaaaaaaaaaaaaa';
  const logOf = (arm, o = {}) => {
    const Lb = LABELS[arm], npw = o.npw || NPW, pts = PTS[arm];
    const L = ['stamp: code c0 audit aa prediction p0 sha s0', `FOOT-S366: the candidate's own unit, ${o.headNpw || npw} paths a world, wealth points divided by 1 (seed ${o.seed || 7004}); 4 jobs; part 0/4`];
    L.push(`${o.house || HOUSE[arm]}             case | job ${Lb} | points ${o.casePts || o.pts || pts} | lambda 0.0223606797749979`, `${pad} solve CAND ${Lb}: table 99 secs 3000`);
    L.push(`${pad} ran CAND ${Lb}: bridgeRead reader bridgeStep exact readerSplit ${o.split || ARMF[arm].readerSplit} readerBlend null readerRef ${o.ref || 'adaptive'} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${o.pts || pts} grid total${o.pts || pts}x6x6 shareNodes none floor ${o.floor || ARMF[arm].floor} line 0.5`);
    L.push(`${pad} checks ${Lb}: armTook 1/1`, `${pad} adaptive ${Lb}: moves 24 nonMono 0 lattice 160x41x3 nz 128 last year 7 secs 250.0`, `${pad} checks ${Lb}: adaptTook 1/1`);
    L.push(`${pad} foot ${Lb}: ${o.footOn !== undefined ? (o.footOn ? 'on' : 'off') : FOOT[arm] ? 'on' : 'off'} live nodes ${o.live !== undefined ? o.live : FOOT[arm] ? 120 : -1}`, `${pad} checks ${Lb}: footTook ${o.ft !== undefined ? o.ft : 1}/1`);
    L.push(`${pad} openings ${Lb}: OWN ai 59 level 0.8 tiers 2,2`);
    for (let k = 0; k < 3; k++) L.push(`${pad} tables ${Lb} ${k} z 0 weight 0.3: OWN 99.000000 READ 99.000000`);
    L.push(`${pad} bridge ${Lb}: reader years ${o.years || '1,2,3,4,5,6,7'}`);
    for (let k = 0; k < (o.worlds || 3); k++) L.push(`${pad} sim ${Lb} ${k} OWN ai 59: 3900/${npw} bridge 4000 bits ${bits} ${bits}`, `${pad} moves ${Lb} ${k}: path-years ${o.py !== undefined ? o.py : 40000} sha ${bits}`, `${pad} ledger ${Lb} ${k}: ${[...KEYS, 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7'].map(x => `${x} 0.1`).join(' ')}`, `${pad} qf ${Lb} ${k}: paths 1000 QF 0.01`);
    L.push(`${pad} checks ${Lb}: ownTook ${3 * npw}/${3 * npw} identity ${o.idOk !== undefined ? o.idOk : 3 * npw}/${3 * npw} qfTook 9/9 layerTook 9/9 secs 100`);
    L.push(`${pad} file ${Lb}: ${HOUSE[arm]}-${arm}-P${PTS[arm]}S6Q5.json.gz`, ...(o.noDone ? [] : [`${pad} done ${Lb}`]));
    return L.join('\n');
  };
  const allJ = (o = {}) => [...ARMS.map(a => parse(logOf(a, o[a] || {}))).flat(), ...(o.extra || [])];
  const refuses = (what, o, opt = {}) => cases.push([`the gate refuses ${what}`, gate(allJ(o), opt).length > 0, true]);
  cases.push(['the gate passes the four jobs as registered', gate(allJ()).join('; '), '']);
  refuses('a job run twice', { extra: parse(logOf('K1')) });
  cases.push(['the gate refuses a job missing', gate(allJ().filter(x => x.label !== LABELS.K1F)).some(x => /K1F: missing/.test(x)), true]);
  refuses('J1D with no done line', { J1D: { noDone: true } });
  refuses('another seed', { J1F: { seed: 7002 } });
  refuses('a header naming another path count', { K1: { headNpw: 2000 } });
  refuses('S362 at 60 points', { K1: { pts: 60 } });
  refuses('a case line at another point count alone', { K1: { casePts: 60 } });
  refuses('a job of another test', { extra: [{ ...parse(logOf('K1'))[0], label: 'A6RS/P60S6Q5' }] });
  refuses('J1F without the fix (the arm plant)', { J1F: { footOn: false, live: -1 } });
  refuses('a fixed job with no node alive', { K1F: { live: 0 } });
  refuses('J1D with the fix', { J1D: { footOn: true, live: 120 } });
  refuses('J1D under the RS split (the split plant)', { J1D: { split: 'rs' } });
  refuses('J1F without the RS split', { J1F: { split: 'null' } });
  refuses('J1F under the order reference', { J1F: { ref: 'order' } });
  refuses('K1 on S366', { K1: { house: 'S366' } });
  refuses('K1 at S366\'s floor', { K1: { floor: '29000' } });
  refuses('footTook short', { K1F: { ft: 0 } });
  refuses('an identity short (the own and layer plants)', { J1D: { idOk: 11999 } });
  refuses('a ledger job short of a world', { K1: { worlds: 2 } });
  refuses('a job without bridge year 4', { J1F: { years: '1,2,3,5,6,7' } });
  refuses('a job with no moves recorded', { J1F: { py: 0 } });
  { const js = allJ(), z = n => Buffer.alloc(n).toString('base64'), shaOf = x => sha16(Buffer.from(x, 'base64'));
    const filesOf = () => { const F = {}; for (const j of js) { const bitsF = {}, per = {}, moves = {}; for (const [nm, s] of Object.entries(j.sims)) { bitsF[nm] = z(s.n); bitsF[`${nm}b`] = z(s.n); s.bits = shaOf(bitsF[nm]); s.bitsB = shaOf(bitsF[`${nm}b`]); } for (let w = 0; w < 3; w++) { for (const x of KEYS) per[`${x}${w}`] = z(8 * NPW); moves[`MV${w}`] = z(16); j.moves[w].sha = shaOf(moves[`MV${w}`]); } F[j.file] = { stamp: j.stamp, NPW, bits: bitsF, per, moves }; } return F; };
    const F0 = filesOf();
    cases.push(['the gate passes the files as the logs name them', gate(js, { files: F0 }).join('; '), '']);
    const F1 = filesOf(); F1['S366-J1F-P60S6Q5.json.gz'].moves.MV2 = z(18);
    cases.push(['the gate refuses a file whose moves are not the log\'s', gate(js, { files: F1 }).some(x => /moves are not the log's/.test(x)), true]);
    const F2 = filesOf(); delete F2['S362-K1-P30S6Q5.json.gz'];
    cases.push(['the gate refuses a missing file', gate(js, { files: F2 }).some(x => /file .* is missing/.test(x)), true]); }
  const bad = cases.filter(([, got, want]) => got !== want);
  for (const [what, got, want] of cases) console.log(`${got === want ? 'ok  ' : 'BAD '} ${what}: ${JSON.stringify(got)}`);
  if (bad.length) { console.log(`PLANTED CHECK FAILED (${bad.length})`); process.exit(1); }
  const short = ITEMS.filter(i => REACHED[i].size < 3);
  if (short.length) { console.log(`PLANTED CHECK FAILED: items not planted to all three outcomes: ${short.map(i => `${i} (${[...REACHED[i]].join(', ')})`).join('; ')}`); process.exit(1); }
  if (EDGES.length < 2) { console.log('PLANTED CHECK FAILED: fewer than two edges'); process.exit(1); }
  return cases.length;
}

const dec = x => { const b = Buffer.from(x, 'base64'); return Array.from(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), v => 100 * v); };
const decMoves = x => { const b = Buffer.from(x, 'base64'); return new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (process.argv[2] === '--same') {
    const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString()), r = same(ld(process.argv[3]), ld(process.argv[4]));
    console.log(r.off.length || !(r.n > 0) ? `SAME: DIFFERS (${r.off.length} of ${r.n}: ${r.off.slice(0, 6).join(', ')})` : `SAME: identical (${r.n} arrays, bit sets, move sets and tables)`);
    process.exit(r.off.length || !(r.n > 0) ? 1 : 0);
  }
  const np_ = planted();
  if (process.argv.includes('--planted')) {
    console.log(`planted (${np_}): all read as they should\nEDGES: ${EDGES.join(', ')}`);
    for (const i of Object.keys(REACHED)) console.log(`OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--')), PRE = process.argv.includes('--preflight');
  const DIR = args[0] || join(HERE, 'results', 'diagfoot'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  // AX-HO's saved J1 and J2, behind AX-HO's gate and the files the ones recorded
  let j1 = null, j2 = null;
  if (!PRE) {
    const AX = join(HERE, 'results', 'diagaxho'), red = spawnSync('node', [join(HERE, 'reduce-axho.mjs'), AX], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (!/^GATE: passed/m.test(red.stdout || '')) bad.push('AX-HO\'s files did not pass AX-HO\'s gate');
    const f1 = join(AX, AXHO_J1), f2 = join(AX, AXHO_J2);
    if (!existsSync(f1) || sha16(readFileSync(f1)) !== AXHO_J1_SHA) bad.push(`AX-HO's J1 file is not the one recorded (${AXHO_J1_SHA})`); else j1 = JSON.parse(gunzipSync(readFileSync(f1)).toString());
    if (!existsSync(f2) || sha16(readFileSync(f2)) !== AXHO_J2_SHA) bad.push(`AX-HO's J2 file is not the one recorded (${AXHO_J2_SHA})`); else j2 = JSON.parse(gunzipSync(readFileSync(f2)).toString());
    if (j1 && (j1.NPW !== npwA || String(j1.seed) !== SEED)) bad.push('AX-HO\'s J1 is not on the same paths');
  }
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const J = Object.fromEntries(Object.entries(LABELS).map(([a, l]) => [a, jobs.find(x => x.label === l)])), FJ = a => files[J[a].file];
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - J1F, J1D, K1 and K1F once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}); the adaptive reference and each job's split in its solve's meta, the fix on J1F and K1F with an A = 0 node alive and off on J1D and K1; every self-check in full; the files and their moves the logs'${PRE ? '' : `; AX-HO's J1 (${AXHO_J1_SHA}) and J2 (${AXHO_J2_SHA}) behind AX-HO's gate`}`);
  if (PRE) { for (const a of ARMS) console.log(`PREFLIGHT ${a}: foot ${J[a].foot.on ? 'on' : 'off'}, live nodes ${J[a].foot.live}, world 0 year-4 residual ${f4(J[a].ledger[0].Y4)}`); console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const bitsF = (f, nm) => Buffer.from(f.bits[nm], 'base64'), cnt = b => { let c = 0; for (const x of b) c += x; return c; };
  const Y = (arm, k, t) => dec((arm === 'J1' ? j1 : FJ(arm)).per[`Y${t}${k}`]);
  const TAB = k => J.J1F.tables[k].OWN, RUN = k => { const s = J.J1F.sims[`OWN${k}`]; return { c: s.ok, N: s.n }; };
  const S = (arm, k) => bitsF(arm === 'J2' ? j2 : FJ(arm), `OWN${k}`);
  const DIF = k => differ(decMoves(FJ('J1F').moves[`MV${k}`]), decMoves(j2.moves[`MV${k}`]), FJ('J1F').years);
  console.log('\nFOOT-S366: the adaptive reference\'s floor at no accessible money fixed, on S366 (J1F, J1D against AX-HO\'s J1 and J2) and on S362, a held-out deposit household (K1F against K1) (predictions/diag-foot.md)');
  for (const L of report(Y, TAB, RUN, S, DIF)) console.log(L);
  console.log('\nREPORTED');
  for (const a of ARMS) console.log(`  ${a}: the fix ${J[a].foot.on ? `on, ${J[a].foot.live} A = 0 nodes alive` : 'off'}; the reference built in ${J[a].adaptive.secs} s; solve ${J[a].solve.secs} s`);
  for (const a of ['J1D', 'K1', 'K1F']) for (let k = 0; k < 3; k++) { const s = J[a].sims[`OWN${k}`], x = gapOf(J[a].tables[k].OWN, s.ok, s.n, ALPHA2); console.log(`  ${a} world ${k}: table at its own opening ${f4(x.table)} runs ${s.ok}/${s.n} (${f4(x.runs)}), table less runs ${iv(x)}`); }
  const ledgerOf = (f, bridge, k) => { const m = x => meanOf(dec(f.per[`${x}${k}`])); return `OWN less runs ${f4(m('B0').m - m('X').m)} = T ${f4(m('T').m)} + GB ${iv(m('GB'))} + GA ${f4(m('GA').m)}; by year ${bridge.map(t => `${t}: ${f4(m(`Y${t}`).m)}`).join(' | ')}`; };
  for (let k = 0; k < 3; k++) {
    console.log(`  J1F world ${k}: ${ledgerOf(FJ('J1F'), J.J1F.bridge, k)}`);
    console.log(`  J1 (AX-HO) world ${k}: ${ledgerOf(j1, j1.bridge, k)}`);
    console.log(`  J1D world ${k}: ${ledgerOf(FJ('J1D'), J.J1D.bridge, k)}`);
    const d = differ(decMoves(FJ('J1F').moves[`MV${k}`]), decMoves(j1.moves[`MV${k}`]), FJ('J1F').years), pr = paired(bitsF(FJ('J1F'), `OWN${k}`), bitsF(j1, `OWN${k}`));
    console.log(`  J1F against J1 world ${k}: moves differing on ${d.paths} of ${d.n} paths and ${d.py} of ${d.both} path-years; runs lost ${pr.lost} saved ${pr.saved} of ${pr.N}; year-4 residual less J1's ${iv(meanOf(Y('J1F', k, 4).map((v, i) => v - Y('J1', k, 4)[i])))}`);
  }
  for (let k = 0; k < 3; k++) {
    console.log(`  K1 world ${k}: ${ledgerOf(FJ('K1'), J.K1.bridge, k)}`);
    console.log(`  K1F world ${k}: ${ledgerOf(FJ('K1F'), J.K1F.bridge, k)}`);
    const d = differ(decMoves(FJ('K1F').moves[`MV${k}`]), decMoves(FJ('K1').moves[`MV${k}`]), FJ('K1F').years), pr = paired(bitsF(FJ('K1F'), `OWN${k}`), bitsF(FJ('K1'), `OWN${k}`));
    console.log(`  K1F against K1 world ${k}: moves differing on ${d.paths} of ${d.n} paths and ${d.py} of ${d.both} path-years; runs lost ${pr.lost} saved ${pr.saved} of ${pr.N}; year-4 residual less K1's ${iv(meanOf(Y('K1F', k, 4).map((v, i) => v - Y('K1', k, 4)[i])))}`);
  }
}
