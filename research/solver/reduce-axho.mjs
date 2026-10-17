/*
 * AX-HO'S REDUCER (PLAN.md AREF, its AX-HO step; predictions/diag-axho.md; the deep review after AOR, deep-review-log.md
 * 17 Oct 18:22 UK). Five jobs at 60 points and six shares, the candidate's own unit, seed 7004, into results/diagaxho
 * (audit-axho.mjs): J1 and J1X (S366 under the adaptive reference with the RS split, J1X J1 re-solved for its runs on
 * paths 9,000 to 15,999), J2 (S366 under the order reference), J3 (S360 under A6RS's settings) and J4 (S360 under BO's).
 * S366 stands in the receipt's S380's place (the maintainer's choice, 17 Oct): S380's two arms moved alike on every path-year
 * at 4 and 30 points (its accessible money covers its bridge's floor bills 2.1 times); S366's accessible money sits nearest
 * those bills (0.77) among the households the reference was neither designed nor tested on.
 * THE GATE: each job once and done at the registered settings (4,000 paths a world, 60 points, seed 7004, the reference's
 *   lattice 160 by 41 with 128 draws), stamped as launched, the fair-test gate on the logs (one audit); its solve's meta
 *   reads the candidate's settings and the job's reference and split; every self-check in full (armTook; adaptTook on J1,
 *   J1X and J3; pairTook on J1 and J1X; ownTook, identity on 12,000 paths, qfTook and layerTook on J1 to J4's ledgers;
 *   engTook on J1 and J3); the pair P ai 12, D ai 14; every run at its path count; J1X's tables and opening J1's to the
 *   printed digit and its own runs on world 0's first 100 paths J1's bit for bit; the engine leg's twelve cells printed on
 *   J1 and J3; the files whole and the logs', their moves the logs'.
 * THE ITEMS:
 *   1 (primary): no material harm to J1's runs against J2's on the same paths, S366 worlds 0 and 1: the exact conditional
 *     McNemar interval, the relative margin marginRel(J2's survival), Holm across the two worlds: HELD (no material harm
 *     in both), FALSIFIED (harm in either), otherwise INCONCLUSIVE; the differing moves and paths printed beside.
 *   2: J1's table at its own opening against its runs on 16,000 paths a world (J1's ledger paths and paths 4,000 to 8,999,
 *     J1X's 9,000 to 15,999), table less runs in points, each world's exact (Clopper-Pearson) interval at 1 - 0.05 / 3:
 *     HELD when every world's interval sits inside [-1.5, +1.5]; FALSIFIED when any lies wholly at or beyond +3 (over) or
 *     -3 (under), the side named; otherwise INCONCLUSIVE. J2's table against its 4,000 runs beside.
 *   3: J1's bridge-years grid residual GB in worlds 0 and 1 (AO's item 2's rule, Z for two worlds, two sides): HELD inside
 *     [-0.5, +0.5]; FALSIFIED when either world's interval lies wholly at or beyond one point either way; else INCONCLUSIVE.
 *   4: S360 held out: no material harm to J3's runs against J4's in worlds 0 and 1 (item 1's rule) and J3's GB inside half a
 *     point in every world (Z for three worlds): HELD when both; FALSIFIED on harm in either world or a GB interval wholly
 *     at or beyond one point either way; otherwise INCONCLUSIVE.
 * REPORTED: every job's tables against its runs by world; J1's P and D against their runs; the ledgers (OWN less runs = T +
 *   GB + GA) and GB by year; the engine leg by world and p-decade beside the reference's own rule (O165); S360 world 0's
 *   luck-adjusted T under J3 and J4 on seed 7004 and under A6RS and BO on seed 7002 (their saved files, behind AOR's and
 *   NODE-AX's gates), pooled by inverse variance (O160); the reference's build and the solves' seconds (gate 5).
 *   node research/solver/reduce-axho.mjs [dir] [paths a world] [scale] [--preflight] [--planted]
 *   node research/solver/reduce-axho.mjs --differ <file a> <file b>   (the moves differing between two saved jobs)
 *   node research/solver/reduce-axho.mjs --copy <AN's file> <AX-HO's file>   (the ledger's copy, bit for bit: the preflight)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { requireFairLogs } from './fair-gate.mjs';
import { mcnemarHarmP, holm, outcome, marginRel, clopperPearson } from './stats.mjs';
import { pathsForSeed } from '../engine.mjs';
import { meanOf, paired, lnRead, luckAdjusted, sha16, q } from './reduce-ao.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-axho.md';
export const XSPLIT = 2.25;   // J1's own runs without the ledger on paths 4,000 to 8,999, J1X's on 9,000 to 15,999
export const SEED = '7004', NPW = 4000, NQF = 1000, OVERLAP = 100, LATTICE = '160x41', NZ = 128, NOMOVE = 65535;
export const Z2 = 2.241402727604947, Z3 = 2.393979714906444, ALPHA2 = 0.05 / 3;   // the 1 - 0.05 / 4 and 1 - 0.05 / 6 normal quantiles
export const IN2 = 1.5, OUT2 = 3, IN3 = 0.5, OUT3 = 1.0;
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const ARMS = ['J1', 'J1X', 'J2', 'J3', 'J4'], LABELS = Object.freeze(Object.fromEntries(ARMS.map(a => [a, `${a}/P60S6Q5`])));
export const HOUSE = Object.freeze({ J1: 'S366', J1X: 'S366', J2: 'S366', J3: 'S360', J4: 'S360' });
export const LEDGER = Object.freeze({ J1: true, J1X: false, J2: true, J3: true, J4: true });
export const ADAPT = Object.freeze({ J1: true, J1X: true, J2: false, J3: true, J4: false });
// the old files O160's pooled line reads (seed 7002): A6RS behind AOR's gate, BO behind NODE-AX's
export const A6RS_FILE = 'S360-A6RS-P60S6Q5.json.gz', A6RS_SHA = '518c25610c33f8c3', BO_FILE = 'S360-BO-P60S6Q5.json.gz', BO_SHA = 'bc583b88e106e30a';
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S366|S360)\s+case \| job ((J1|J1X|J2|J3|J4)\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^AX-HO: .*?, (\d+) paths a world.*?, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], arm: c[3], pts: Number(c[6]), stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, checks: {}, tables: [], sims: {}, moves: [], tail: [], refTail: null,
        ledger: [], qf: [], adaptive: null, pair: null, bridge: null, own: null, solve: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label, e = esc(L);
    let m;
    if ((m = new RegExp(`^solve CAND ${e}: table (\\S+) secs (\\d+)$`).exec(l))) j.solve = { table: Number(m[1]), secs: Number(m[2]) };
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^adaptive ${e}: moves (\\d+) nonMono (-?\\d+) lattice (\\d+)x(\\d+)x(\\d+) nz (\\d+) last year (\\d+) secs (\\S+)$`).exec(l))) j.adaptive = { moves: Number(m[1]), nonMono: Number(m[2]), lattice: `${m[3]}x${m[4]}`, ng: Number(m[5]), nz: Number(m[6]), TL: Number(m[7]), secs: Number(m[8]) };
    else if ((m = new RegExp(`^pair ${e}: P ai (\\d+) .*; D ai (\\d+) `).exec(l))) j.pair = [Number(m[1]), Number(m[2])];
    else if ((m = new RegExp(`^openings ${e}: OWN ai (\\d+) `).exec(l))) j.own = { ai: Number(m[1]) };
    else if ((m = new RegExp(`^tables ${e} (\\d) z (\\S+) weight (\\S+): OWN (\\S+) READ (\\S+)(?: P (\\S+) D (\\S+))?$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), OWN: Number(m[4]), READ: Number(m[5]), ...(m[6] ? { P: Number(m[6]), D: Number(m[7]) } : {}), text: m.slice(4).filter(Boolean).join(' ') };
    else if ((m = new RegExp(`^bridge ${e}: reader years ?(\\S*)$`).exec(l))) j.bridge = m[1] ? m[1].split(',').map(Number) : [];
    else if ((m = new RegExp(`^sim ${e} (\\d) OWN ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`OWN${m[1]}`] = { ai: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bridge: Number(m[5]), bits: m[6], bitsB: m[7] };
    else if ((m = new RegExp(`^sim ${e} (\\d) (P|D) ai (\\d+): (\\d+)\\/(\\d+) bits (\\S+)$`).exec(l))) j.sims[`${m[2]}${m[1]}`] = { ai: Number(m[3]), ok: Number(m[4]), n: Number(m[5]), bits: m[6] };
    else if ((m = new RegExp(`^simx ${e} (\\d) OWN ai (\\d+) paths (\\d+) to (\\d+): (\\d+)\\/(\\d+) bits (\\S+)$`).exec(l))) j.sims[`OWNX${m[1]}`] = { ai: Number(m[2]), from: Number(m[3]), to: Number(m[4]), ok: Number(m[5]), n: Number(m[6]), bits: m[7] };
    else if ((m = new RegExp(`^simo ${e} 0 OWN ai (\\d+) paths 0 to (\\d+): (\\d+)\\/(\\d+) bits (\\S+)$`).exec(l))) j.sims.OWNO0 = { ai: Number(m[1]), to: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bits: m[5] };
    else if ((m = new RegExp(`^moves ${e} (\\d): path-years (\\d+) sha (\\S+)$`).exec(l))) j.moves[Number(m[1])] = { py: Number(m[2]), sha: m[3] };
    else if ((m = new RegExp(`^tail ${e} (\\d) (\\d): records (\\d+) states (\\d+)(.*)$`).exec(l))) {
      const part = nm => { const x = new RegExp(`${nm} (\\S+) ln (\\S+) \\((\\S+) to (\\S+)\\) (ok|off)`).exec(m[5]); return x ? { r: Number(x[1]), ln: Number(x[2]), lo: Number(x[3]), hi: Number(x[4]), off: x[5] === 'off' } : null; };
      const p = /years (\S+) p (\S+)/.exec(m[5]);
      j.tail.push({ k: Number(m[1]), bin: Number(m[2]), records: Number(m[3]), states: Number(m[4]), years: p ? p[1] : '', p: p ? Number(p[2]) : NaN, sim: part('simulated'), eng: part('engine') });
    }
    else if ((m = new RegExp(`^refTail ${e}: cells (\\d+) off (\\d+); engine off (\\d+);.* secs (\\d+)$`).exec(l))) j.refTail = { cells: Number(m[1]), off: Number(m[2]), engOff: Number(m[3]), secs: Number(m[4]) };
    else if ((m = new RegExp(`^ledger ${e} (\\d): (.*)$`).exec(l))) j.ledger[Number(m[1])] = Object.fromEntries([...m[2].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])]));
    else if ((m = new RegExp(`^qf ${e} (\\d): paths (\\d+) QF (\\S+)$`).exec(l))) j.qf[Number(m[1])] = { n: Number(m[2]), QF: Number(m[3]) };
    else if ((m = new RegExp(`^runs ${e}: secs (\\d+)$`).exec(l))) j.runsSecs = Number(m[1]);
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerBlend: 'null', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3', shareNodes: 'none' };
const ARMF = Object.freeze({ J1: { readerRef: 'adaptive', readerSplit: 'rs', floor: '29000' }, J1X: { readerRef: 'adaptive', readerSplit: 'rs', floor: '29000' }, J2: { readerRef: 'order', readerSplit: 'null', floor: '29000' }, J3: { readerRef: 'adaptive', readerSplit: 'rs', floor: '5000' }, J4: { readerRef: 'order', readerSplit: 'null', floor: '5000' } });
const NEED = Object.freeze({ J1: ['armTook', 'adaptTook', 'pairTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'engTook'], J1X: ['armTook', 'adaptTook', 'pairTook'], J2: ['armTook', 'ownTook', 'identity', 'qfTook', 'layerTook'], J3: ['armTook', 'adaptTook', 'ownTook', 'identity', 'qfTook', 'layerTook', 'engTook'], J4: ['armTook', 'ownTook', 'identity', 'qfTook', 'layerTook'] });
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null } = {}) {
  const bad = [], pts = Math.max(4, Math.round(60 / scale)), xs = Math.round(XSPLIT * npw);
  for (const x of jobs) if (!Object.values(LABELS).includes(x.label)) bad.push(`a job that is not AX-HO's: ${x.label}`);
  for (const [arm, label] of Object.entries(LABELS)) {
    const js = jobs.filter(x => x.label === label);
    if (js.length !== 1) { bad.push(`${arm}: ${js.length ? `run ${js.length} times` : 'missing'}`); continue; }
    const j = js[0];
    if (j.id !== HOUSE[arm]) bad.push(`${arm}: run on ${j.id}, not ${HOUSE[arm]}`);
    if (!j.done) bad.push(`${arm}: no done line`);
    if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push(`${arm}: no stamp`);
    if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`${arm}: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
    if (j.pts !== pts) bad.push(`${arm}: solved at ${j.pts} points, not ${pts}`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...COMMON, ...ARMF[arm], pts: String(pts), grid: `total${pts}x6x6` })) if (field(ran, f) !== v) bad.push(`${arm}: ${f} is ${field(ran, f)}, not ${v}`);
    for (const c of NEED[arm]) {
      const x = j.checks[c];
      // engTook at 0/0: the engine leg ran on no state (no bridge record in the band), allowed only where every cell printed 0
      // states; the report says so, never a pass
      if (c === 'engTook' && x && x[1] === 0 && x[0] === 0 && j.refTail && j.refTail.cells === 0 && j.tail.length && j.tail.every(t => t.states === 0)) continue;
      if (!x || !(x[1] > 0) || x[0] !== x[1] || (['armTook', 'adaptTook', 'pairTook'].includes(c) && x[1] !== 1)) bad.push(`${arm}: ${c} did not pass in full`);
    }
    if (ADAPT[arm] && (!j.adaptive || j.adaptive.lattice !== LATTICE || j.adaptive.nz !== NZ || j.adaptive.nonMono !== 0 || !(j.adaptive.moves > 0))) bad.push(`${arm}: the reference was not built at the registered lattice (${LATTICE}, ${NZ} draws) with a monotone last year`);
    if (!j.own) bad.push(`${arm}: no openings line`);
    if (!j.solve) bad.push(`${arm}: no solve line`);
    const S366F = arm === 'J1' || arm === 'J1X';
    if (S366F && (!j.pair || j.pair[0] !== 12 || j.pair[1] !== 14)) bad.push(`${arm}: the pair is not the registered one (P ai 12, D ai 14)`);
    for (let w = 0; w < 3; w++) {
      const t = j.tables[w];
      if (!t || !Number.isFinite(t.OWN) || !Number.isFinite(t.READ) || (S366F && !(Number.isFinite(t.P) && Number.isFinite(t.D)))) bad.push(`${arm}: world ${w}'s tables are missing`);
    }
    if (LEDGER[arm]) {
      if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push(`${arm}: the identity was not held on every path of three worlds`);
      if (!j.bridge || !j.bridge.length) bad.push(`${arm}: no bridge years printed`);
      for (let w = 0; w < 3; w++) {
        const s = j.sims[`OWN${w}`]; if (!s || s.n !== npw || (j.own && s.ai !== j.own.ai)) bad.push(`${arm}: no OWN run of ${npw} paths at its opening in world ${w}`);
        if (!j.ledger[w] || [...KEYS, ...(j.bridge || []).map(t => `Y${t}`)].some(x => !Number.isFinite(j.ledger[w][x]))) bad.push(`${arm}: world ${w}'s ledger line is missing or short`);
        if (!j.qf[w] || j.qf[w].n !== Math.min(npw, NQF)) bad.push(`${arm}: world ${w}'s QF line is missing`);
        if (!j.moves[w] || !(j.moves[w].py >= npw)) bad.push(`${arm}: world ${w}'s moves line is missing or short`);
      }
    }
    if (arm === 'J1' || arm === 'J3') {
      if (!j.refTail) bad.push(`${arm}: no engine leg summary`);
      for (let w = 0; w < 3; w++) for (let b = 0; b < 4; b++) if (!j.tail.some(x => x.k === w && x.bin === b)) bad.push(`${arm}: the engine leg's cell ${w} ${b} is missing`);
    }
    if (arm === 'J1') for (let w = 0; w < 3; w++) {
      const x = j.sims[`OWNX${w}`]; if (!x || x.from !== npw || x.to !== xs - 1 || x.n !== xs - npw || (j.own && x.ai !== j.own.ai)) bad.push(`J1: no own run on paths ${npw} to ${xs - 1} in world ${w}`);
      const p = j.sims[`P${w}`]; if (!p || p.n !== npw || p.ai !== 12) bad.push(`J1: no P run of ${npw} paths in world ${w}`);
    }
    if (arm === 'J1X') {
      for (let w = 0; w < 3; w++) {
        const x = j.sims[`OWNX${w}`]; if (!x || x.from !== xs || x.to !== 4 * npw - 1 || x.n !== 4 * npw - xs || (j.own && x.ai !== j.own.ai)) bad.push(`J1X: no own run on paths ${xs} to ${4 * npw - 1} in world ${w}`);
        const d = j.sims[`D${w}`]; if (!d || d.n !== npw || d.ai !== 14) bad.push(`J1X: no D run of ${npw} paths in world ${w}`);
      }
      const o = j.sims.OWNO0; if (!o || o.n !== Math.min(npw, OVERLAP)) bad.push(`J1X: no overlap run on world 0's first ${Math.min(npw, OVERLAP)} paths`);
      // J1X is J1 re-solved: its tables and opening J1's to the printed digit
      const j1 = jobs.find(x => x.label === LABELS.J1);
      if (j1) {
        if (!j1.own || !j.own || j1.own.ai !== j.own.ai) bad.push('J1X: its opening is not J1\'s');
        for (let w = 0; w < 3; w++) if (!j1.tables[w] || !j.tables[w] || j1.tables[w].text !== j.tables[w].text) bad.push(`J1X: world ${w}'s tables are not J1's to the printed digit`);
      }
    }
    if (files) {
      const f = j.file && files[j.file];
      if (!f) { bad.push(`${arm}: its file ${j.file} is missing`); continue; }
      if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push(`${arm}: its file is stamped by other code`);
      if (f.NPW !== npw) bad.push(`${arm}: its file is not on ${npw} paths a world`);
      for (const [nm, s] of Object.entries(j.sims)) for (const [b, sh] of [[nm, s.bits], ...(s.bitsB ? [[`${nm}b`, s.bitsB]] : [])]) { const x = f.bits && f.bits[b]; if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(`${arm}: its file's ${b} bits are not the log's`); }
      if (LEDGER[arm]) for (let w = 0; w < 3; w++) {
        for (const x of KEYS) { const a = f.per && f.per[`${x}${w}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`${arm}: its file's ${x}${w} paths are not ${npw}`); }
        const mv = f.moves && f.moves[`MV${w}`]; if (!mv || !j.moves[w] || sha16(Buffer.from(mv, 'base64')) !== j.moves[w].sha) bad.push(`${arm}: its file's world-${w} moves are not the log's`);
      }
      if (arm === 'J1X') { const a = files[(jobs.find(x => x.label === LABELS.J1) || {}).file], o = f.bits && f.bits.OWNO0; if (!a || !o || !Buffer.from(o, 'base64').equals(Buffer.from(a.bits.OWN0, 'base64').subarray(0, Math.min(npw, OVERLAP)))) bad.push('J1X: its own runs on world 0\'s first paths are not J1\'s bit for bit'); }
    }
  }
  return bad;
}

// the moves differing between two jobs' saved moves in a world: the paths with any year's move different, and the
// path-years both runs reached whose moves differ
export function differ(a, b, years) {
  let paths = 0, py = 0, both = 0;
  const n = Math.min(a.length, b.length) / years;
  for (let i = 0; i < n; i++) {
    let d = false;
    for (let t = 0; t < years; t++) { const x = a[i * years + t], y = b[i * years + t]; if (x === NOMOVE || y === NOMOVE) continue; both++; if (x !== y) { py++; d = true; } }
    if (d) paths++;
  }
  return { paths, py, both, n };
}
// table less runs in points, the runs c of N, the exact interval at 1 - alpha
export function gapOf(table, c, N, alpha = ALPHA2) { const [lo, hi] = clopperPearson(c, N, alpha), r = 100 * c / N; return { table, c, N, runs: q(r), m: q(table - r), lo: q(table - 100 * hi), hi: q(table - 100 * lo) }; }
const harmItem = pr => {
  const ph = holm(pr.map(x => mcnemarHarmP(x.lost, x.saved)));
  const oc = pr.map((x, i) => { const margin = marginRel(100 * x.bAlive / x.N); return { ...x, margin, ...outcome({ b: x.lost, c: x.saved, N: x.N, margin, pHolm: ph[i] }) }; });
  return { outcome: oc.some(x => x.outcome === 'harm') ? 'FALSIFIED' : oc.every(x => x.outcome === 'no material harm') ? 'HELD' : 'INCONCLUSIVE', cells: oc };
};
/* TAB(k): J1's table at its own opening in world k (points); RUNS(k): { c, N } its runs on 16,000 paths; S(arm, k): the OWN
   bits on the ledger paths (J1 to J4); G(arm, k): the per-path GB in points (J1, J3) */
export function items(TAB, RUNS, S, G) {
  const out = {};
  out['1'] = harmItem([0, 1].map(k => ({ k, ...paired(S('J1', k), S('J2', k)) })));
  const c2 = [0, 1, 2].map(k => { const r = RUNS(k); return { k, ...gapOf(TAB(k), r.c, r.N) }; });
  const over2 = x => x.lo >= OUT2, under2 = x => x.hi <= -OUT2, in2 = x => x.lo >= -IN2 && x.hi <= IN2;
  out['2'] = { outcome: c2.some(x => over2(x) || under2(x)) ? 'FALSIFIED' : c2.every(in2) ? 'HELD' : 'INCONCLUSIVE', side: c2.some(over2) && c2.some(under2) ? 'over and under' : c2.some(over2) ? 'over' : c2.some(under2) ? 'under' : null, cells: c2 };
  const in3 = x => x.lo >= -IN3 && x.hi <= IN3, out3 = x => x.lo >= OUT3 || x.hi <= -OUT3;
  const g3 = [0, 1].map(k => ({ k, ...meanOf(G('J1', k), Z2) }));
  out['3'] = { outcome: g3.some(out3) ? 'FALSIFIED' : g3.every(in3) ? 'HELD' : 'INCONCLUSIVE', side: g3.some(x => x.lo >= OUT3) ? 'over' : g3.some(x => x.hi <= -OUT3) ? 'under' : null, cells: g3 };
  const h4 = harmItem([0, 1].map(k => ({ k, ...paired(S('J3', k), S('J4', k)) }))), g4 = [0, 1, 2].map(k => ({ k, ...meanOf(G('J3', k), Z3) }));
  out['4'] = { outcome: h4.outcome === 'FALSIFIED' || g4.some(out3) ? 'FALSIFIED' : h4.outcome === 'HELD' && g4.every(in3) ? 'HELD' : 'INCONCLUSIVE', harm: h4, cells: g4 };
  return out;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), iv = x => `${f4(x.m)} (${f4(x.lo)} to ${f4(x.hi)})`;
const harmLine = x => `world ${x.k}: lost ${x.lost} saved ${x.saved} of ${x.N}, change ${f4(x.d)} (${f4(x.lo)} to ${f4(x.hi)}) at margin ${x.margin}: ${x.outcome}`;
/* DIF(pair, k): the moves differing between the pair's arms in world k (differ()'s), or null */
export function report(TAB, RUNS, S, G, DIF = () => null) {
  const it = items(TAB, RUNS, S, G), L = [];
  const difLine = (pr, ks) => ks.map(k => { const d = DIF(pr, k); return d ? `world ${k}: ${d.paths} of ${d.n} paths and ${d.py} of ${d.both} path-years with a move differing` : `world ${k}: no moves`; }).join('; ');
  L.push('', 'THE ITEMS (each read by its registered rule)');
  L.push(`1. no material harm to J1's runs against J2's on S366 on the same paths, worlds 0 and 1: ${it['1'].outcome}`);
  L.push(`     ${it['1'].cells.map(harmLine).join('; ')}`, `     moves differing, J1 against J2: ${difLine('S366', [0, 1, 2])}`);
  L.push(`2. J1's table at its own opening against its runs on ${it['2'].cells[0].N} paths a world, inside 1.5 points in every world (FALSIFIED at a whole interval past 3 points either way): ${it['2'].outcome}${it['2'].side ? ` (${it['2'].side})` : ''}`);
  L.push(`     ${it['2'].cells.map(x => `world ${x.k}: table ${f4(x.table)} runs ${x.c}/${x.N} (${f4(x.runs)}), table less runs ${iv(x)}`).join('; ')}`);
  L.push(`3. J1's bridge-years grid residual GB within half a point in worlds 0 and 1 (FALSIFIED at a whole interval past one point either way): ${it['3'].outcome}${it['3'].side ? ` (${it['3'].side})` : ''}`);
  L.push(`     ${it['3'].cells.map(x => `world ${x.k}: ${iv(x)}`).join('; ')}`);
  L.push(`4. S360 held out: no material harm to J3's runs against J4's in worlds 0 and 1 and J3's GB within half a point in every world (FALSIFIED on harm or a GB wholly past one point): ${it['4'].outcome}`);
  L.push(`     ${it['4'].harm.cells.map(harmLine).join('; ')}`, `     J3's GB: ${it['4'].cells.map(x => `world ${x.k}: ${iv(x)}`).join('; ')}`, `     moves differing, J3 against J4: ${difLine('S360', [0, 1, 2])}`);
  L.push(`OUTCOME: ${['1', '2', '3', '4'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  for (const [i, x] of [['1', it['1'].cells[0].d], ['2', it['2'].cells[0].m], ['3', it['3'].cells[0].m], ['4', it['4'].harm.cells[0].d]]) L.push(`REALISED item ${i}: ${f4(x)}`);
  return L;
}

/* THE PLANTED CHECKS */
const EDGES = [], ITEMS = ['1', '2', '3', '4'], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
function planted() {
  const cases = [], N = 4000;
  const bitsOf = (alive, n = N, lose = 0, gain = 0) => { const b = Buffer.alloc(n); for (let i = 0; i < alive; i++) b[i] = 1; for (let i = 0; i < lose; i++) b[i] = 0; for (let i = 0; i < gain; i++) b[alive + i] = 1; return b; };
  // the first household at about 32% and 77% in worlds 0 and 1 (J2's survival), S360 at half; J1's runs 16,000 a world at the table unless o.runs
  const mk = (o = {}) => {
    const alive = { J2: o.aliveJ2 || [1280, 3080], J4: [2000, 2000] }, tab = o.tab || [32, 77, 96], runs = o.runs || [32, 77, 96];
    const S = (arm, k) => (arm === 'J1' ? bitsOf(alive.J2[k], N, o.lose1 ? o.lose1[k] : 0, o.gain1 ? o.gain1[k] : 0) : arm === 'J2' ? bitsOf(alive.J2[k]) : arm === 'J3' ? bitsOf(alive.J4[k], N, o.lose3 ? o.lose3[k] : 0, o.gain3 ? o.gain3[k] : 0) : bitsOf(alive.J4[k]));
    const gb = (m, sd = 0.5) => Array.from({ length: N }, (_, i) => m + (i % 2 ? sd : -sd));
    const G = (arm, k) => gb(arm === 'J1' ? (o.gb1 ? o.gb1[k] : 0.1) : (o.gb3 ? o.gb3[k] : 0.1), o.sd || 0.5);
    return [k => tab[k], k => ({ c: Math.round(runs[k] * 160), N: 16000 }), S, G];
  };
  const outc = (i, o, want, what) => { const got = items(...mk(o))[i].outcome; REACHED[i].add(got); cases.push([what, got, want]); };
  // item 1 (J2 alive on 1,280 and 3,080 of 4,000: margin 0.5 points)
  outc('1', {}, 'HELD', 'J1 equal to J2 on every path: 1 HELD'); EDGES.push('no discordant path');
  outc('1', { lose1: [400, 0] }, 'FALSIFIED', 'J1 loses 400 paths in world 0: 1 FALSIFIED');
  outc('1', { lose1: [0, 25], gain1: [0, 10] }, 'INCONCLUSIVE', 'J1 loses 25 and saves 10 in world 1: 1 INCONCLUSIVE');
  outc('1', { lose1: [15, 0], gain1: [3, 0] }, 'HELD', 'J1 loses 15 and saves 3 in world 0: 1 HELD');
  outc('1', { lose1: [0, 0], gain1: [0, 400] }, 'HELD', 'J1 saves 400 paths in world 1: 1 HELD');
  outc('1', { aliveJ2: [40, 3080], lose1: [8, 0] }, 'FALSIFIED', 'J2 alive on 1% in world 0 and J1 losing 8 of its 40 paths (0.2 points, past the relative margin 0.1): 1 FALSIFIED');
  { const x = items(...mk({ lose1: [400, 0] }))['1'].cells[0]; cases.push(['item 1 reads its margin from J2\'s survival (relative: 0.5 at 32%)', x.margin, 0.5]); }
  { const x = items(...mk({}))['1'].cells.map(c => c.margin); const lowAlive = marginRel(100 * 40 / 4000); cases.push(['the relative margin at 1% survival is a tenth of it', `${x.join(',')} ${f4(lowAlive)}`, '0.5,0.5 0.1000']); EDGES.push('a survival where the relative margin binds'); }
  // item 2 (16,000 runs a world; at 32% the 1 - 0.05 / 3 interval half-width about 0.88 points)
  outc('2', {}, 'HELD', 'J1\'s table at its runs in every world: 2 HELD');
  outc('2', { tab: [36, 77, 96] }, 'FALSIFIED', 'world 0\'s table 4 points over its runs: 2 FALSIFIED (over)');
  outc('2', { tab: [32, 72, 96] }, 'FALSIFIED', 'world 1\'s table 5 points under its runs: 2 FALSIFIED (under)');
  outc('2', { tab: [33.0, 77, 96] }, 'INCONCLUSIVE', 'world 0\'s table a point over its runs, its interval reaching 1.88, across 1.5: 2 INCONCLUSIVE'); EDGES.push('an interval across the HELD line');
  outc('2', { tab: [32, 77, 98.7] }, 'INCONCLUSIVE', 'world 2\'s table 2.7 points over, short of FALSIFIED: 2 INCONCLUSIVE');
  outc('2', { runs: [32, 77, 100], tab: [32, 77, 100] }, 'HELD', 'world 2 every run alive and the table at 100: 2 HELD'); EDGES.push('every run alive');
  { const x = items(...mk({ tab: [36, 77, 96] }))['2']; cases.push(['item 2 names its side', `${x.outcome} ${x.side}`, 'FALSIFIED over']); }
  { const x = gapOf(32, 5120, 16000); cases.push(['item 2\'s interval is exact at 1 - 0.05 / 3 (half-width about 0.88 at 32% on 16,000)', `${f4(x.m)} ${(x.hi - x.lo > 1.6 && x.hi - x.lo < 1.95)}`, '0.0000 true']); }
  // item 3
  outc('3', {}, 'HELD', 'J1\'s GB at 0.1 in both worlds: 3 HELD');
  outc('3', { gb1: [1.4, 0.1] }, 'FALSIFIED', 'J1\'s GB at 1.4 in world 0: 3 FALSIFIED (over)');
  outc('3', { gb1: [0.1, -1.4] }, 'FALSIFIED', 'J1\'s GB at -1.4 in world 1: 3 FALSIFIED (under)');
  outc('3', { gb1: [0.49, 0.1] }, 'INCONCLUSIVE', 'J1\'s GB at 0.49 in world 0, its interval across 0.5: 3 INCONCLUSIVE');
  outc('3', { gb1: [0.1, 0.1, 5] }, 'HELD', 'J1\'s GB far off in world 2 (not item 3\'s): 3 HELD');
  // item 4
  outc('4', {}, 'HELD', 'J3 equal to J4 and its GB at 0.1 everywhere: 4 HELD');
  outc('4', { lose3: [400, 0] }, 'FALSIFIED', 'J3 loses 400 paths in world 0: 4 FALSIFIED');
  outc('4', { gb3: [0.1, 0.1, 1.4] }, 'FALSIFIED', 'J3\'s GB at 1.4 in world 2: 4 FALSIFIED');
  outc('4', { gb3: [0.1, 0.49, 0.1] }, 'INCONCLUSIVE', 'J3\'s GB at 0.49 in world 1, its interval across 0.5: 4 INCONCLUSIVE');
  outc('4', { lose3: [0, 25], gain3: [0, 10] }, 'INCONCLUSIVE', 'J3 loses 25 and saves 10 in world 1: 4 INCONCLUSIVE');
  { let L = [], err = null; try { L = report(...mk()); } catch (e) { err = e.message; } cases.push(['the read prints four items, an OUTCOME of four and four REALISED lines', err || `${['1.', '2.', '3.', '4.'].every(p => L.some(l => l.startsWith(p)))} ${(L.find(l => l.startsWith('OUTCOME: ')) || '').split(',').length} ${L.filter(l => l.startsWith('REALISED item ')).length}`, 'true 4 4']); }
  // the differing moves (a planted change: the counter reads it; equal moves read zero; unreached years ignored)
  { const Y = 3, a = Uint16Array.from([1, 2, 3, 1, 2, 3, 1, NOMOVE, NOMOVE]), b = Uint16Array.from([1, 2, 3, 1, 5, 3, 1, NOMOVE, NOMOVE]);
    const d0 = differ(a, a, Y), d1 = differ(a, b, Y), d2 = differ(a, Uint16Array.from([1, 2, 3, 1, 2, 3, 1, 4, 4]), Y);
    cases.push(['the differing moves read zero on equal moves', `${d0.paths} ${d0.py} ${d0.both}`, '0 0 7']);
    cases.push(['the differing moves read a planted change of one year', `${d1.paths} ${d1.py} ${d1.both}`, '1 1 7']);
    cases.push(['the differing moves skip a year one run did not reach', `${d2.paths} ${d2.py} ${d2.both}`, '0 0 7']); EDGES.push('a year one run did not reach'); }
  // the gate, on synthetic logs as the audit prints them
  const pad = ''.padEnd(16), bits = 'aaaaaaaaaaaaaaaa';
  const ranOf = (arm, o) => `bridgeRead reader bridgeStep exact readerSplit ${o.split || ARMF[arm].readerSplit} readerBlend null readerRef ${o.ref || ARMF[arm].readerRef} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts 60 grid total60x6x6 shareNodes none floor ${o.floor || ARMF[arm].floor} line 0.5`;
  const logOf = (arm, o = {}) => {
    const Lb = LABELS[arm], ad = ADAPT[arm], s380 = arm === 'J1' || arm === 'J1X', npw = o.npw || NPW;
    const L = ['stamp: code c0 audit aa prediction p0 sha s0', `AX-HO: the candidate's own unit, ${o.headNpw || npw} paths a world, wealth points divided by 1 (seed ${o.seed || 7004}); 5 jobs; part 0/5`];
    L.push(`${o.house || HOUSE[arm]}             case | job ${Lb} | points 60 | lambda 0.0223606797749979`, `${pad} solve CAND ${Lb}: table 40 secs 3000`, `${pad} ran CAND ${Lb}: ${ranOf(arm, o)}`, `${pad} reader ${Lb}: tables 9 unsupported 1 copied 1 copiedTop 0 nodes 5`, `${pad} checks ${Lb}: armTook 1/1`);
    if (ad) L.push(`${pad} adaptive ${Lb}: moves 24 nonMono ${o.nonMono || 0} lattice 160x41x3 nz 128 last year 7 secs 300.0`, `${pad} checks ${Lb}: adaptTook 1/1`);
    if (s380) L.push(`${pad} pair ${Lb}: P ai 12 level 0.8 tiers 0,0; D ai ${o.dAi || 14} level 0.8 tiers 2,2`, `${pad} checks ${Lb}: pairTook 1/1`);
    L.push(`${pad} openings ${Lb}: OWN ai ${o.own || 12} level 0.8 tiers 0,0`);
    for (let k = 0; k < 3; k++) L.push(`${pad} tables ${Lb} ${k} z 0 weight 0.3: OWN ${o.tabOwn || '32.000000'} READ 32.000000${s380 ? ` P 32.000000 D ${o.tabD || '30.000000'}` : ''}`);
    L.push(`${pad} bridge ${Lb}: reader years 1,2,3,4,5,6,7`);
    if (LEDGER[arm]) {
      for (let k = 0; k < (o.worlds || 3); k++) L.push(`${pad} sim ${Lb} ${k} OWN ai ${o.own || 12}: 2000/${npw} bridge 2000 bits ${bits} ${bits}`, `${pad} moves ${Lb} ${k}: path-years ${o.py !== undefined ? o.py : 40000} sha ${bits}`, `${pad} ledger ${Lb} ${k}: ${[...KEYS, 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7'].map(x => `${x} 0.1`).join(' ')}`, `${pad} qf ${Lb} ${k}: paths 1000 QF 0.01`);
      L.push(`${pad} checks ${Lb}: ownTook ${3 * npw}/${3 * npw} identity ${o.idOk !== undefined ? o.idOk : 3 * npw}/${3 * npw} qfTook 9/9 layerTook 9/9 secs 100`);
    }
    const xs = Math.round(XSPLIT * npw);
    if (arm === 'J1') for (let k = 0; k < 3; k++) L.push(`${pad} simx ${Lb} ${k} OWN ai 12 paths ${npw} to ${o.xTo || xs - 1}: 2000/${xs - npw} bits ${bits}`);
    if (arm === 'J1X') { for (let k = 0; k < 3; k++) L.push(`${pad} simx ${Lb} ${k} OWN ai ${o.own || 12} paths ${xs} to ${4 * npw - 1}: 4000/${4 * npw - xs} bits ${bits}`); if (!o.noOverlap) L.push(`${pad} simo ${Lb} 0 OWN ai ${o.own || 12} paths 0 to 99: 50/100 bits ${bits}`); }
    if (arm === 'J1') for (let k = 0; k < 3; k++) L.push(`${pad} sim ${Lb} ${k} P ai 12: 2000/${npw} bits ${bits}`);
    if (arm === 'J1X') for (let k = 0; k < 3; k++) L.push(`${pad} sim ${Lb} ${k} D ai ${o.dSim || 14}: 1900/${npw} bits ${bits}`);
    L.push(`${pad} runs ${Lb}: secs 100`);
    if (arm === 'J1' || arm === 'J3') { for (let k = 0; k < 3; k++) for (let b = 0; b < (o.bins || 4); b++) L.push(o.empty ? `${pad} tail ${Lb} ${k} ${b}: records 0 states 0` : `${pad} tail ${Lb} ${k} ${b}: records 90 states 25 years 1,2 p 1.0e-3 | simulated 1.0e-3 ln 0.0 (-0.1 to 0.1) ok | engine 1.0e-3 ln 0.0 (-0.3 to 0.3) ok`); L.push(`${pad} refTail ${Lb}: cells ${o.empty ? 0 : 12} off 0; engine off 0; 100000 runs a state simulated, 4000 in the engine on its own draws, secs 200`, `${pad} checks ${Lb}: engTook ${o.eng !== undefined ? o.eng : 300}/${o.engN !== undefined ? o.engN : 300}`); }
    L.push(`${pad} file ${Lb}: ${HOUSE[arm]}-${arm}-P60S6Q5.json.gz`, ...(o.noDone ? [] : [`${pad} done ${Lb}`]));
    return L.join('\n');
  };
  const allJ = (o = {}) => [...ARMS.map(a => parse(logOf(a, o[a] || {}))).flat(), ...(o.extra || [])];
  const refuses = (what, o, opt = {}) => cases.push([`the gate refuses ${what}`, gate(allJ(o), opt).length > 0, true]);
  cases.push(['the gate passes the five jobs as registered', gate(allJ()).join('; '), '']);
  refuses('a job run twice', { extra: parse(logOf('J2')) });
  refuses('a job of another test', { extra: [{ ...parse(logOf('J2'))[0], label: 'A6RS/P60S6Q5' }] });
  cases.push(['the gate refuses a job missing', gate(allJ().filter(x => x.label !== LABELS.J4)).some(x => /J4: missing/.test(x)), true]);
  refuses('J4 with no done line', { J4: { noDone: true } });
  refuses('a header naming another path count (the runs right)', { J3: { headNpw: 2000 } });
  refuses('another seed', { J2: { seed: 7002 } });
  refuses('J1 under the order reference (the arm plant)', { J1: { ref: 'order' } });
  refuses('J1 without the RS split (the rs plant)', { J1: { split: 'null' } });
  refuses('J3 without the RS split', { J3: { split: 'null' } });
  refuses('J2 under the RS split', { J2: { split: 'rs' } });
  refuses('J4 under the adaptive reference', { J4: { ref: 'adaptive' } });
  refuses('J2 on S360\'s floor', { J2: { floor: '5000' } });
  refuses('J3 run on S366', { J3: { house: 'S366' } });
  refuses('an identity short on J4 (the own, layer plants)', { J4: { idOk: 11999 } });
  refuses('engTook short on J1 (the draws plant)', { J1: { eng: 299 } });
  refuses('J3\'s engine leg short of a p-decade', { J3: { bins: 3 } });
  cases.push(['the gate passes an engine leg on no state (0/0, every cell empty)', gate(allJ({ J1: { eng: 0, engN: 0, empty: true } })).join('; '), '']); EDGES.push('an engine leg on no state');
  refuses('engTook 0/0 with a cell holding states', { J1: { eng: 0, engN: 0 } });
  refuses('a ledger job with no moves recorded', { J2: { py: 0 } });
  refuses('a ledger job short of a world', { J4: { worlds: 2 } });
  refuses('J1\'s own runs on the wrong paths', { J1: { xTo: Math.round(XSPLIT * NPW) } });
  refuses('J1X with no overlap run', { J1X: { noOverlap: true } });
  refuses('J1X\'s tables a digit off J1\'s', { J1X: { tabOwn: '32.000001' } });
  refuses('J1X\'s D table alone a digit off J1\'s', { J1X: { tabD: '30.000001' } });
  refuses('J1X at another opening', { J1X: { own: 13 } });
  refuses('the forced pair not the registered one', { J1X: { dAi: 15 } });
  refuses('J1X\'s D runs at another move than the pair\'s', { J1X: { dSim: 15 } });
  refuses('a reference not monotone', { J3: { nonMono: 1 } });
  { const js = allJ(), z = n => Buffer.alloc(n).toString('base64'), fileOf = (arm, o = {}) => { const j = js.find(x => x.label === LABELS[arm]), bitsF = {}, per = {}, moves = {};
      for (const [nm, s] of Object.entries(j.sims)) { bitsF[nm] = z(s.n); if (s.bitsB) bitsF[`${nm}b`] = z(s.n); }
      if (LEDGER[arm]) for (let w = 0; w < 3; w++) { for (const x of KEYS) per[`${x}${w}`] = z(8 * NPW); moves[`MV${w}`] = z(16); }
      if (o.oneOff) bitsF.OWNO0 = Buffer.from([1, ...Array(99).fill(0)]).toString('base64');
      return { stamp: j.stamp, NPW, bits: bitsF, per, moves }; };
    // the synthetic logs' sha fields read 'aaaa...': rewrite them to the files' own hashes so only the planted fault differs
    const shaOf = b64 => sha16(Buffer.from(b64, 'base64'));
    const filesOf = o => { const F = Object.fromEntries(ARMS.map(a => [`${HOUSE[a]}-${a}-P60S6Q5.json.gz`, fileOf(a, a === 'J1X' ? o : {})])); for (const j of js) { const f = F[j.file]; for (const [nm, s] of Object.entries(j.sims)) { s.bits = shaOf(f.bits[nm]); if (s.bitsB) s.bitsB = shaOf(f.bits[`${nm}b`]); } j.moves.forEach((mv, w) => { mv.sha = shaOf(f.moves[`MV${w}`]); }); } return F; };
    const F0 = filesOf({});
    cases.push(['the gate passes the files as the logs name them', gate(js, { files: F0 }).join('; '), '']);
    cases.push(['the gate refuses J1X\'s overlap runs a path off J1\'s', gate(js, { files: filesOf({ oneOff: true }) }).some(x => /not J1's bit for bit/.test(x)), true]);
    const F2 = filesOf({}); F2['S366-J2-P60S6Q5.json.gz'].moves.MV1 = z(18);
    cases.push(['the gate refuses a file whose moves are not the log\'s', gate(js, { files: F2 }).some(x => /moves are not the log's/.test(x)), true]);
    const F3 = filesOf({}); delete F3['S360-J4-P60S6Q5.json.gz'];
    cases.push(['the gate refuses a missing file', gate(js, { files: F3 }).some(x => /file .* is missing/.test(x)), true]); }
  // the luck adjustment (reduce-ao.mjs's, imported): a known intercept recovered
  { const X = Array.from({ length: 400 }, (_, i) => [Math.sin(i), Math.cos(3 * i)]), y = X.map(x => 2 + 0.7 * x[0] - 0.3 * x[1]); const r = luckAdjusted(y, X); cases.push(['the luck adjustment recovers a known intercept', f4(r.m), '2.0000']); }
  { const p = pooledIV([{ m: 1, se: 1 }, { m: 4, se: 2 }]); cases.push(['the pooled luck-adjusted T weighs by inverse variance', `${f4(p.m)} ${f4(p.se)}`, `1.6000 ${f4(Math.sqrt(0.8))}`]); }
  const bad = cases.filter(([, got, want]) => got !== want);
  for (const [what, got, want] of cases) console.log(`${got === want ? 'ok  ' : 'BAD '} ${what}: ${JSON.stringify(got)}`);
  if (bad.length) { console.log(`PLANTED CHECK FAILED (${bad.length})`); process.exit(1); }
  const short = ITEMS.filter(i => REACHED[i].size < 3);
  if (short.length) { console.log(`PLANTED CHECK FAILED: items not planted to all three outcomes: ${short.map(i => `${i} (${[...REACHED[i]].join(', ')})`).join('; ')}`); process.exit(1); }
  if (EDGES.length < 2) { console.log('PLANTED CHECK FAILED: fewer than two edges'); process.exit(1); }
  return cases.length;
}
// two estimates pooled by inverse variance (O160's line: one seed's luck-adjusted T with another's)
export function pooledIV(xs) { const w = xs.map(x => 1 / (x.se * x.se)), sw = w.reduce((a, b) => a + b, 0); return { m: q(xs.reduce((t, x, i) => t + w[i] * x.m, 0) / sw), se: Math.sqrt(1 / sw) }; }

const dec = x => { const b = Buffer.from(x, 'base64'); return Array.from(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), v => 100 * v); };
const decMoves = x => { const b = Buffer.from(x, 'base64'); return new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const luckOf = (f, k, paths) => { const T = dec(f.per[`T${k}`]), yrs = [0, ...f.bridge]; return luckAdjusted(T, T.map((_, i) => yrs.map(t => paths[i][t]))); };
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (process.argv[2] === '--differ') {
    const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString()), a = ld(process.argv[3]), b = ld(process.argv[4]);
    for (let k = 0; k < 3; k++) { const d = differ(decMoves(a.moves[`MV${k}`]), decMoves(b.moves[`MV${k}`]), a.years); console.log(`DIFFER world ${k}: paths ${d.paths} of ${d.n} path-years ${d.py} of ${d.both}`); }
    process.exit(0);
  }
  // the ledger's copy (the preflight): an AN job's saved ledger against an AX-HO job's at the same settings and seed,
  // every per-path array, the runs' bits and the bridge years' tables equal to the bit
  if (process.argv[2] === '--copy') {
    const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString()), a = ld(process.argv[3]), b = ld(process.argv[4]), off = [];
    for (const f of ['seed', 'NPW', 'own']) if (a[f] !== b[f]) off.push(f);
    if (JSON.stringify(a.bridge) !== JSON.stringify(b.bridge)) off.push('bridge');
    const per = Object.keys(a.per || {}), bt = Object.keys(a.bits || {}), tb = Object.keys(a.tables || {});
    for (const [nm, ka, A, B] of [['per', per, a.per, b.per], ['bits', bt, a.bits, b.bits], ['tables', tb, a.tables, b.tables]]) for (const x of ka) if (!B || B[x] !== A[x]) off.push(`${nm} ${x}`);
    const n = per.length + bt.length + tb.length;
    console.log(off.length || !(per.length > 0) ? `COPY: DIFFERS (${off.length} of ${n}: ${off.slice(0, 6).join(', ')})` : `COPY: identical (${per.length} per-path arrays, ${bt.length} bit sets, ${tb.length} tables)`);
    process.exit(off.length || !(per.length > 0) ? 1 : 0);
  }
  const np_ = planted();
  if (process.argv.includes('--planted')) {
    console.log(`planted (${np_}): all read as they should\nEDGES: ${EDGES.join(', ')}`);
    for (const i of Object.keys(REACHED)) console.log(`OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--')), PRE = process.argv.includes('--preflight');
  const DIR = args[0] || join(HERE, 'results', 'diagaxho'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  // the old files O160's pooled line reads, each behind its own test's gate and the file the one recorded
  let a6rs = null, bo = null;
  if (!PRE) {
    const AR = join(HERE, 'results', 'diagaor'), AX = join(HERE, 'results', 'diagnodeax');
    const ra = spawnSync('node', [join(HERE, 'reduce-aor.mjs'), AR], { encoding: 'utf8', maxBuffer: 1 << 26 }), rb = spawnSync('node', [join(HERE, 'reduce-nodeax.mjs'), AX], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (!/^GATE: passed/m.test(ra.stdout || '')) bad.push('AOR\'s files did not pass AOR\'s gate');
    if (!/^GATE: passed/m.test(rb.stdout || '')) bad.push('NODE-AX\'s files did not pass NODE-AX\'s gate');
    const fa = join(AR, A6RS_FILE), fb = join(AX, BO_FILE);
    if (!existsSync(fa) || sha16(readFileSync(fa)) !== A6RS_SHA) bad.push(`AOR's A6RS file is not the one recorded (${A6RS_SHA})`); else a6rs = JSON.parse(gunzipSync(readFileSync(fa)).toString());
    if (!existsSync(fb) || sha16(readFileSync(fb)) !== BO_SHA) bad.push(`NODE-AX's BO file is not the one recorded (${BO_SHA})`); else bo = JSON.parse(gunzipSync(readFileSync(fb)).toString());
  }
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const J = Object.fromEntries(Object.entries(LABELS).map(([a, l]) => [a, jobs.find(x => x.label === l)])), FJ = a => files[J[a].file];
  // the STAMPS line's preflight duty: the moves differing between each pair's arms, printed here too (no figure is read)
  const DIF = (pr, k) => { const [a, b] = pr === 'S366' ? ['J1', 'J2'] : ['J3', 'J4']; return differ(decMoves(FJ(a).moves[`MV${k}`]), decMoves(FJ(b).moves[`MV${k}`]), FJ(a).years); };
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - J1, J1X, J2, J3 and J4 once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}); each job's reference and split in its solve's meta, the candidate's settings otherwise; every self-check in full; the pair P ai 12, D ai 14; J1X J1's tables and opening to the digit, its overlap runs J1's bit for bit; the engine leg's cells printed on J1 and J3; the files and their moves the logs'${PRE ? '' : `; AOR's A6RS (${A6RS_SHA}) and NODE-AX's BO (${BO_SHA}) behind their gates`}`);
  if (PRE) { for (const pr of ['S366', 'S360']) console.log(`PREFLIGHT moves differing (${pr}): ${[0, 1, 2].map(k => { const d = DIF(pr, k); return `world ${k} ${d.paths} paths ${d.py} of ${d.both} path-years`; }).join('; ')}`); console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const bitsF = (f, nm) => Buffer.from(f.bits[nm], 'base64'), cnt = b => { let c = 0; for (const x of b) c += x; return c; };
  const RUNS = k => { const b = [bitsF(FJ('J1'), `OWN${k}`), bitsF(FJ('J1'), `OWNX${k}`), bitsF(FJ('J1X'), `OWNX${k}`)]; return { c: b.reduce((t, x) => t + cnt(x), 0), N: b.reduce((t, x) => t + x.length, 0) }; };
  const TAB = k => J.J1.tables[k].OWN, S = (arm, k) => bitsF(FJ(arm), `OWN${k}`), G = (arm, k) => dec(FJ(arm).per[`GB${k}`]);
  console.log('\nAX-HO: the adaptive reference with the RS split held out - S366 (J1, J1X against J2) and S360 on seed 7004 (J3 against J4), each against the order reference on the same paths (predictions/diag-axho.md)');
  for (const L of report(TAB, RUNS, S, G, DIF)) console.log(L);
  console.log('\nREPORTED');
  for (const a of ['J1', 'J3']) { const x = J[a].adaptive; console.log(`  ${a}'s reference: ${x.moves} floor moves, lattice ${x.lattice} by ${x.ng} gain nodes, ${x.nz} draws, last bridge year ${x.TL}, built in ${x.secs} s; solve ${J[a].solve.secs} s (gate 5)`); }
  for (const a of ['J1X', 'J2', 'J4']) console.log(`  ${a}: solve ${J[a].solve.secs} s`);
  for (const a of ['J2', 'J3', 'J4']) for (let k = 0; k < 3; k++) { const s = J[a].sims[`OWN${k}`], x = gapOf(J[a].tables[k].OWN, s.ok, s.n); console.log(`  ${a} world ${k}: table at its own opening ${f4(x.table)} runs ${s.ok}/${s.n} (${f4(x.runs)}), table less runs ${iv(x)}`); }
  for (let k = 0; k < 3; k++) {
    const p = J.J1.sims[`P${k}`], d = J.J1X.sims[`D${k}`], t = J.J1.tables[k];
    console.log(`  J1 world ${k}: P table ${f4(t.P)} runs ${p.ok}/${p.n} ln ${iv(lnRead(t.P, p.ok, p.n, 0.05))}; D table ${f4(t.D)} runs ${d.ok}/${d.n} ln ${iv(lnRead(t.D, d.ok, d.n, 0.05))}; its own opening ai ${J.J1.own.ai}${J.J1.own.ai === 12 ? ' (P)' : J.J1.own.ai === 14 ? ' (D)' : ''}`);
  }
  for (const a of ['J1', 'J2', 'J3', 'J4']) for (let k = 0; k < 3; k++) {
    const m = x => meanOf(dec(FJ(a).per[`${x}${k}`]));
    console.log(`  ${a} world ${k}: OWN less runs ${f4(m('B0').m - m('X').m)} = T ${f4(m('T').m)} + GB ${iv(m('GB'))} + GA ${f4(m('GA').m)}; by year ${J[a].bridge.map(t => `${t}: ${f4(m(`Y${t}`).m)}`).join(' | ')}`);
  }
  for (const a of ['J1', 'J3']) {
    const j = J[a]; console.log(`  engine leg ${a}: ${j.refTail.cells ? `cells ${j.refTail.cells}, off ${j.refTail.off} simulated, ${j.refTail.engOff} in the engine (off: an interval wholly beyond ln 1.5), ${j.refTail.secs} s` : 'NOT RUN: no bridge record in the band (p 0.0001 to 0.95) on this household, so no engine cell and no engTook (a check on nothing, not a pass)'}`);
    for (const x of j.tail) console.log(`    world ${x.k} p-decade ${x.bin}: records ${x.records} states ${x.states}${x.states ? ` years ${x.years} p ${x.p.toExponential(4)} | simulated ln ${f4(x.sim.ln)} (${f4(x.sim.lo)} to ${f4(x.sim.hi)})${x.sim.off ? ' off' : ''} | engine ln ${f4(x.eng.ln)} (${f4(x.eng.lo)} to ${f4(x.eng.hi)})${x.eng.off ? ' off' : ''}` : ''}`);
  }
  // O160: S360 world 0's luck-adjusted T, seed 7004 (J3, J4) and seed 7002 (A6RS, BO), pooled by inverse variance
  { const p4 = pathsForSeed(Number(SEED), npwA, 60), p2 = pathsForSeed(7002, a6rs.NPW, 60);
    for (let k = 0; k < 3; k++) {
      const l3 = luckOf(FJ('J3'), k, p4), l4 = luckOf(FJ('J4'), k, p4), lr = luckOf(a6rs, k, p2), lb = luckOf(bo, k, p2), pr = pooledIV([l3, lr]), pb = pooledIV([l4, lb]);
      console.log(`  S360 world ${k}: T luck-adjusted (years 0 to ${J.J3.bridge[J.J3.bridge.length - 1]}'s shocks): J3 ${f4(l3.m)} (se ${f4(l3.se)}), A6RS on seed 7002 ${f4(lr.m)} (se ${f4(lr.se)}), pooled ${f4(pr.m)} (${f4(pr.m - 1.96 * pr.se)} to ${f4(pr.m + 1.96 * pr.se)}); J4 ${f4(l4.m)} (se ${f4(l4.se)}), BO on seed 7002 ${f4(lb.m)} (se ${f4(lb.se)}), pooled ${f4(pb.m)} (${f4(pb.m - 1.96 * pb.se)} to ${f4(pb.m + 1.96 * pb.se)})`);
    } }
  for (let k = 0; k < 3; k++) { const r = RUNS(k); console.log(`  J1 world ${k}: its own opening alive on ${r.c} of ${r.N} paths (J1's ${cnt(S('J1', k))} + ${cnt(bitsF(FJ('J1'), `OWNX${k}`))}, J1X's ${cnt(bitsF(FJ('J1X'), `OWNX${k}`))}); J2 alive on ${cnt(S('J2', k))} of ${npwA}`); }
}
