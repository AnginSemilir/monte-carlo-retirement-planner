/*
 * AN'S REDUCER (PLAN.md AREF, its AN arm; predictions/diag-an.md; the deep review after AREF Step 0, deep-review-log.md
 * 15 Oct 10:13 UK). One job, AN (audit-an.mjs: NODE-AX's BN with the adaptive reference), read against its control, NODE-AX's
 * saved BN (results/diagnodeax, behind NODE-AX's own gate, its file the one Step 0 read), on the same 4,000 paths a world of
 * seed 7002. The new code leaves BN bit for bit as it was at the preflight scale (compare-preflight.mjs, AN's build check and
 * preflight), so AN differs from BN in its reference alone.
 * THE GATE: the job once and done at the registered settings (4,000 paths a world, 60 points, seed 7002, the reference's
 *   lattice 160 by 41 with 128 draws), stamped as launched; its solve's meta reads NODE-AX's settings but readerRef
 *   'adaptive'; every self-check in full (armTook, adaptTook, refTook, ownTook, identity on 12,000 paths, qfTook, layerTook);
 *   its file whole and the log's; NODE-AX's BN behind NODE-AX's gate, its file the one recorded (sha 769a2d449e7738d1).
 * THE ITEMS (Z for two worlds, two sides: the 1 - 0.05 / 4 normal quantile):
 *   1 (primary): AN's bridge-years grid residual GB, per path in points, in worlds 0 and 1: HELD when both worlds' intervals
 *     sit inside [-0.5, +0.5]; FALSIFIED when either world's interval lies wholly at or below -1.0 (the under-read left) or
 *     wholly at or above +1.0 (an over-read made); otherwise INCONCLUSIVE.
 *   2: no material harm to the runs: per world 0 and 1, AN's paired change in survival against BN's on the same paths (the
 *     exact conditional McNemar interval, stats.mjs outcome, the margin marginFor(BN's survival), Holm across the two
 *     worlds): HELD when both read no material harm, FALSIFIED when either reads harm, otherwise INCONCLUSIVE.
 *   3: O156's world-2 year-1 term under AN (BN's -0.7929): the mean of Y1 in world 2 with its 95% interval: HELD inside
 *     [-0.4, +0.4], FALSIFIED wholly at or beyond 0.6 on either side, otherwise INCONCLUSIVE.
 * REPORTED: per world, AN's OWN less runs = T + GB + GA, its GB beside BN's and their paired difference, each bridge year's
 *   G for both, QF, survival; the reference's build line and its refcheck bins.
 *   node research/solver/reduce-an.mjs [dir] [paths a world] [scale] [--preflight] [--planted]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { requireFairLogs } from './fair-gate.mjs';
import { mcnemarHarmP, holm, outcome, marginFor, zFor } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-an.md';
export const SEED = '7002', NPW = 4000, NQF = 1000, LATTICE = '160x41', NZ = 128;
export const Z = 2.241402727604947, Z1 = 1.959963984540054;   // the 1 - 0.05 / 4 and 1 - 0.05 / 2 normal quantiles
export const IN1 = 0.5, OUT1 = 1.0, IN3 = 0.4, OUT3 = 0.6;
export const NODES_A = '0,0.2,0.4,0.6,0.7,0.75,0.8,0.825,0.85,0.875,0.9,0.925,0.95,0.975,1';
export const NODEAX_SHA = '769a2d449e7738d1', BN_FILE = 'S360-BN-P60S15Q5.json.gz';
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const LABEL = 'AN/P60S15Q5';
export const q = x => (Number.isFinite(x) ? Math.round(x * 1e9) / 1e9 : x);
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
const CASEL = /^(S360)\s+case \| job (AN\/P(\d+)S(\d+)Q5) \| points (\d+) \| lambda (\S+)$/;
const HEAD = /^AN: .*, (\d+) paths a world, wealth points divided by (\d+(?:\.\d+)?) \(seed (\d+)\);/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) {
      j = { id: c[1], label: c[2], pts: Number(c[5]), stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null,
        head: hd ? { npw: Number(hd[1]), scale: Number(hd[2]), seed: hd[3] } : null, checks: {}, tables: [], sims: {}, ledger: [], qf: [], refcheck: [], adaptive: null, bridge: null, own: null, solve: null, done: false };
      jobs.push(j); continue;
    }
    if (!j) continue;
    const l = raw.trim(), L = j.label;
    let m;
    if ((m = new RegExp(`^solve CAND ${esc(L)}: table (\\S+) secs (\\d+)$`).exec(l))) j.solve = { table: Number(m[1]), secs: Number(m[2]) };
    else if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const x of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[x[1]] = [Number(x[2]), Number(x[3])]; }
    else if ((m = new RegExp(`^adaptive ${esc(L)}: moves (\\d+) nonMono (-?\\d+) lattice (\\d+)x(\\d+)x(\\d+) nz (\\d+) last year (\\d+) secs (\\S+)$`).exec(l))) j.adaptive = { moves: Number(m[1]), nonMono: Number(m[2]), lattice: `${m[3]}x${m[4]}`, ng: Number(m[5]), nz: Number(m[6]), TL: Number(m[7]), secs: Number(m[8]) };
    else if ((m = new RegExp(`^openings ${esc(L)}: OWN ai (\\d+) `).exec(l))) j.own = { ai: Number(m[1]) };
    else if ((m = new RegExp(`^bridge ${esc(L)}: reader years ?(\\S*)$`).exec(l))) j.bridge = m[1] ? m[1].split(',').map(Number) : [];
    else if ((m = new RegExp(`^tables ${esc(L)} (\\d) z (\\S+) weight (\\S+): OWN (\\S+) READ (\\S+)$`).exec(l))) j.tables[Number(m[1])] = { w: Number(m[3]), OWN: Number(m[4]), READ: Number(m[5]) };
    else if ((m = new RegExp(`^sim ${esc(L)} (\\d) OWN ai (\\d+): (\\d+)\\/(\\d+) bridge (\\d+) bits (\\S+) (\\S+)$`).exec(l))) j.sims[`OWN${m[1]}`] = { ai: Number(m[2]), ok: Number(m[3]), n: Number(m[4]), bridge: Number(m[5]), bits: m[6], bitsB: m[7] };
    else if ((m = new RegExp(`^ledger ${esc(L)} (\\d): (.*)$`).exec(l))) j.ledger[Number(m[1])] = Object.fromEntries([...m[2].matchAll(/(\w+) (\S+)/g)].map(x => [x[1], Number(x[2])]));
    else if ((m = new RegExp(`^qf ${esc(L)} (\\d): paths (\\d+) QF (\\S+)$`).exec(l))) j.qf[Number(m[1])] = { n: Number(m[2]), QF: Number(m[3]) };
    else if ((m = new RegExp(`^refcheck ${esc(L)} (\\d) (\\d): (.*)$`).exec(l))) j.refcheck.push({ k: Number(m[1]), bin: Number(m[2]), text: m[3] });
    else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerSplit: 'null', readerBlend: 'null', readerRef: 'adaptive', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001', line: '0.5', mix: '3', floor: '5000', shareNodes: NODES_A };
export function gate(jobs, { npw = NPW, seed = SEED, scale = 1, files = null } = {}) {
  const bad = [], an = jobs.filter(j => j.label === LABEL);
  if (an.length !== 1) bad.push(`AN: ${an.length ? `run ${an.length} times` : 'missing'}`);
  if (jobs.length !== an.length) bad.push('a job that is not AN');
  const j = an[0];
  if (!j) return bad;
  const pts = Math.max(4, Math.round(60 / scale));
  if (!j.done) bad.push('AN: no done line');
  if (!j.stamp || ['code', 'audit', 'prediction', 'sha'].some(f => !j.stamp[f])) bad.push('AN: no stamp');
  if (!j.head || j.head.npw !== npw || j.head.seed !== seed || j.head.scale !== scale) bad.push(`AN: not at the registered settings (${npw} a world, scale ${scale}, seed ${seed})`);
  if (j.pts !== pts) bad.push(`AN: solved at ${j.pts} points, not ${pts}`);
  const ran = j.ran || '';
  for (const [f, v] of Object.entries({ ...COMMON, pts: String(pts), grid: `total${pts}x15x6` })) if (field(ran, f) !== v) bad.push(`AN: ${f} is ${field(ran, f)}, not ${v}`);
  for (const c of ['armTook', 'adaptTook', 'refTook', 'ownTook', 'identity', 'qfTook', 'layerTook']) { const x = j.checks[c]; if (!x || !(x[1] > 0) || x[0] !== x[1] || ((c === 'armTook' || c === 'adaptTook') && x[1] !== 1)) bad.push(`AN: ${c} did not pass in full`); }
  if (j.checks.identity && j.checks.identity[1] !== 3 * npw) bad.push('AN: the identity was not held on every path of three worlds');
  if (!j.adaptive || j.adaptive.lattice !== LATTICE || j.adaptive.nz !== NZ || j.adaptive.nonMono !== 0 || !(j.adaptive.moves > 0)) bad.push(`AN: the reference was not built at the registered lattice (${LATTICE}, ${NZ} draws) with a monotone last year`);
  if (!j.own) bad.push('AN: no openings line');
  if (!j.solve) bad.push('AN: no solve line');
  if (!j.bridge || !j.bridge.length) bad.push('AN: no bridge years printed');
  else if (j.adaptive && j.adaptive.TL !== j.bridge[j.bridge.length - 1]) bad.push('AN: the reference\'s last year is not the last bridge year');
  for (let w = 0; w < 3; w++) {
    if (!j.tables[w] || !Number.isFinite(j.tables[w].OWN) || !Number.isFinite(j.tables[w].READ)) bad.push(`AN: world ${w}'s tables are missing`);
    const s = j.sims[`OWN${w}`]; if (!s || s.n !== npw || s.bridge < s.ok || (j.own && s.ai !== j.own.ai)) bad.push(`AN: no OWN run of ${npw} paths at its opening in world ${w}`);
    const YK = (j.bridge || []).map(t => `Y${t}`);
    if (!j.ledger[w] || [...KEYS, ...YK].some(x => !Number.isFinite(j.ledger[w][x]))) bad.push(`AN: world ${w}'s ledger line is missing or short`);
    if (!j.qf[w] || j.qf[w].n !== Math.min(npw, NQF) || !Number.isFinite(j.qf[w].QF)) bad.push(`AN: world ${w}'s QF line is missing or not on ${Math.min(npw, NQF)} paths`);
  }
  if (files) {
    const f = j.file && files[j.file];
    if (!f) bad.push(`AN: its file ${j.file} is missing`);
    else {
      if (!f.stamp || ['code', 'audit', 'prediction', 'sha'].some(x => f.stamp[x] !== (j.stamp || {})[x])) bad.push('AN: its file is stamped by other code');
      for (const [nm, s] of Object.entries(j.sims)) for (const [b, sh] of [[nm, s.bits], [`${nm}b`, s.bitsB]]) { const x = f.bits && f.bits[b]; if (!x || sha16(Buffer.from(x, 'base64')) !== sh) bad.push(`AN: its file's ${b} bits are not the log's`); }
      for (let w = 0; w < 3; w++) for (const x of [...KEYS, ...(j.bridge || []).map(t => `Y${t}`)]) { const a = f.per && f.per[`${x}${w}`]; if (!a || Buffer.from(a, 'base64').length !== 8 * npw) bad.push(`AN: its file's ${x}${w} paths are not ${npw}`); }
    }
  }
  return bad;
}

// a mean's interval at z, in points
export function meanOf(a, z = Z) { const n = a.length, m = a.reduce((t, x) => t + x, 0) / n, v = n > 1 ? a.reduce((t, x) => t + (x - m) * (x - m), 0) / (n - 1) : 0; const se = Math.sqrt(v / n); return { m: q(m), lo: q(m - z * se), hi: q(m + z * se), se }; }
// the paired change in survival of AN against BN on the same paths: lost (alive under BN only), saved (under AN only)
export function paired(an, bn) { let lost = 0, saved = 0, both = 0; for (let i = 0; i < an.length; i++) { if (bn[i] && !an[i]) lost++; else if (an[i] && !bn[i]) saved++; else if (an[i] && bn[i]) both++; } return { lost, saved, both, N: an.length, bnAlive: both + lost }; }

/* P(arm, name, world): per-path array in points (arm 'AN' or 'BN'); S(arm, world): the OWN survival bits */
export function items(P, S) {
  const out = {};
  const g = [0, 1].map(k => ({ k, ...meanOf(P('AN', 'GB', k)) }));
  const inside = x => x.lo >= -IN1 && x.hi <= IN1, under = x => x.hi <= -OUT1, over = x => x.lo >= OUT1;
  out['1'] = { outcome: g.some(x => under(x) || over(x)) ? 'FALSIFIED' : g.every(inside) ? 'HELD' : 'INCONCLUSIVE', side: g.some(under) ? 'under' : g.some(over) ? 'over' : null, cells: g };
  const pr = [0, 1].map(k => ({ k, ...paired(S('AN', k), S('BN', k)) }));
  const ph = holm(pr.map(x => mcnemarHarmP(x.lost, x.saved)));
  const oc = pr.map((x, i) => ({ ...x, margin: marginFor(100 * x.bnAlive / x.N), ...outcome({ b: x.lost, c: x.saved, N: x.N, margin: marginFor(100 * x.bnAlive / x.N), pHolm: ph[i] }) }));
  out['2'] = { outcome: oc.some(x => x.outcome === 'harm') ? 'FALSIFIED' : oc.every(x => x.outcome === 'no material harm') ? 'HELD' : 'INCONCLUSIVE', cells: oc };
  const y = meanOf(P('AN', 'Y1', 2), Z1);
  out['3'] = { outcome: y.hi <= -OUT3 || y.lo >= OUT3 ? 'FALSIFIED' : y.lo >= -IN3 && y.hi <= IN3 ? 'HELD' : 'INCONCLUSIVE', cell: y };
  return out;
}

const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), iv = x => `${f4(x.m)} (${f4(x.lo)} to ${f4(x.hi)})`;
export function report(P, S, years) {
  const it = items(P, S), L = [];
  L.push('', 'THE ITEMS (each read by its registered rule)');
  L.push(`1. AN's bridge-years grid residual GB within half a point in worlds 0 and 1 (FALSIFIED at a whole interval past one point either way): ${it['1'].outcome}${it['1'].side ? ` (${it['1'].side})` : ''}`);
  L.push(`     ${it['1'].cells.map(x => `world ${x.k}: ${iv(x)}`).join('; ')}`);
  L.push(`2. no material harm to the runs against BN's on the same paths, worlds 0 and 1: ${it['2'].outcome}`);
  L.push(`     ${it['2'].cells.map(x => `world ${x.k}: lost ${x.lost} saved ${x.saved} of ${x.N}, change ${f4(x.d)} (${f4(x.lo)} to ${f4(x.hi)}) at margin ${x.margin}: ${x.outcome}`).join('; ')}`);
  L.push(`3. O156's world-2 year-1 term under AN within 0.4 points (FALSIFIED at a whole interval past 0.6 either way): ${it['3'].outcome}`, `     world 2: Y1 ${iv(it['3'].cell)}`);
  L.push('', 'REPORTED');
  for (let k = 0; k < 3; k++) {
    const a = x => meanOf(P('AN', x, k)), b = x => meanOf(P('BN', x, k));
    const d = meanOf(P('AN', 'GB', k).map((v, i) => v - P('BN', 'GB', k)[i]));
    L.push(`  world ${k}: AN OWN less runs ${f4(a('B0').m - a('X').m)} = T ${f4(a('T').m)} + GB ${f4(a('GB').m)} + GA ${f4(a('GA').m)}; BN's GB ${iv(b('GB'))}; AN less BN in GB ${iv(d)}; survival AN ${f4(a('X').m)} BN ${f4(b('X').m)}`);
    L.push(`  world ${k} by year (AN; BN): ${years.map(t => `${t}: ${f4(a(`Y${t}`).m)}; ${f4(b(`Y${t}`).m)}`).join(' | ')}`);
  }
  L.push(`OUTCOME: ${['1', '2', '3'].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
  for (const i of ['1', '2', '3']) { const x = i === '1' ? it[i].cells[0].m : i === '3' ? it[i].cell.m : it[i].cells[0].d; L.push(`REALISED item ${i}: ${f4(x)}`); }
  return L;
}

/* THE PLANTED CHECKS */
const EDGES = [], ITEMS = ['1', '2', '3'], REACHED = { 1: new Set(), 2: new Set(), 3: new Set() };
function planted() {
  const cases = [];
  const N = 4000;
  // per-path arrays with mean m and spread s (half the paths at m - s, half at m + s), and survival bits
  const arr = (m, s = 1) => Float64Array.from({ length: N }, (_, i) => (i % 2 ? m + s : m - s));
  const bitsOf = (alive, lose = 0, gain = 0) => { const b = new Uint8Array(N); for (let i = 0; i < alive; i++) b[i] = 1; for (let i = 0; i < lose; i++) b[i] = 0; for (let i = 0; i < gain; i++) b[alive + i] = 1; return b; };
  const mk = (o = {}) => {
    const per = { AN: {}, BN: {} };
    for (const arm of ['AN', 'BN']) for (const k of [0, 1, 2]) for (const x of [...KEYS, 'Y1']) per[arm][`${x}${k}`] = arr(0);
    for (const k of [0, 1, 2]) { per.AN[`GB${k}`] = arr(o.gb ? o.gb[k] : 0, o.s !== undefined ? o.s : 1); per.AN[`Y1${k}`] = arr(o.y1 !== undefined && k === 2 ? o.y1 : 0, o.ys !== undefined ? o.ys : 1); }
    const bits = { BN: [0, 1, 2].map(() => bitsOf(2000)), AN: [0, 1, 2].map(k => bitsOf(2000, o.lose ? o.lose[k] : 0, o.gain ? o.gain[k] : 0)) };
    return { P: (arm, x, k) => per[arm][`${x}${k}`], S: (arm, k) => bits[arm][k] };
  };
  const outc = (i, o, want, what) => { const r = mk(o), got = items(r.P, r.S)[i].outcome; REACHED[i].add(got); cases.push([what, got, want]); };
  // item 1 (se of a mean of 4,000 paths at spread 1: 1/sqrt(4000) = 0.0158; Z times it 0.0354)
  outc('1', {}, 'HELD', 'GB 0 in both worlds: 1 HELD');
  outc('1', { gb: [-1.5, 0, 0] }, 'FALSIFIED', 'GB -1.5 in world 0: 1 FALSIFIED (under)');
  outc('1', { gb: [0, 1.5, 0] }, 'FALSIFIED', 'GB +1.5 in world 1: 1 FALSIFIED (over)');
  outc('1', { gb: [0.7, 0, 0] }, 'INCONCLUSIVE', 'GB +0.7 in world 0: 1 INCONCLUSIVE');
  outc('1', { gb: [0, 0, -3] }, 'HELD', 'GB -3 in world 2 only (not read): 1 HELD');
  const hw = zFor(0.025) * Math.sqrt(N / (N - 1)) / Math.sqrt(N);   // the half-width at spread 1 (the sample's n - 1), its z from stats.mjs, not Z
  outc('1', { gb: [0.5 - hw - 1e-6, 0, 0] }, 'HELD', 'the interval\'s top just inside +0.5: 1 HELD'); EDGES.push('an interval\'s end at the HELD line');
  outc('1', { gb: [0.5 - hw + 1e-6, 0, 0] }, 'INCONCLUSIVE', 'the interval\'s top just past +0.5: 1 INCONCLUSIVE');
  outc('1', { gb: [-1 - hw + 1e-6, 0, 0] }, 'INCONCLUSIVE', 'the interval\'s top just above -1.0: 1 INCONCLUSIVE');
  outc('1', { gb: [-1 - hw - 1e-6, 0, 0] }, 'FALSIFIED', 'the interval\'s top just below -1.0: 1 FALSIFIED');
  outc('1', { gb: [0.3, 0, 0], s: 0 }, 'HELD', 'GB +0.3 with no spread: its interval the point: 1 HELD'); EDGES.push('a world with no spread');
  { const r = mk({ gb: [-1.5, 1.5, 0] }), it = items(r.P, r.S)['1']; cases.push(['under in world 0 and over in world 1: FALSIFIED, the side named under first', `${it.outcome} ${it.side}`, 'FALSIFIED under']); }
  // item 2 (BN alive on 2,000 of 4,000 paths: survival 50%, margin 0.5 points)
  outc('2', {}, 'HELD', 'AN equal to BN on every path (0 of 0 discordant): 2 HELD'); EDGES.push('no discordant path');
  outc('2', { lose: [400, 0, 0] }, 'FALSIFIED', 'AN loses 400 paths of 4,000 in world 0: 2 FALSIFIED');
  outc('2', { lose: [0, 25, 0], gain: [0, 10, 0] }, 'INCONCLUSIVE', 'AN loses 25 and saves 10 in world 1 (0.375 points, its interval past the margin): 2 INCONCLUSIVE');
  outc('2', { lose: [0, 15, 0], gain: [0, 3, 0] }, 'HELD', 'AN loses 15 and saves 3 in world 1 (its interval inside the margin): 2 HELD');
  outc('2', { lose: [0, 0, 400] }, 'HELD', 'AN loses 400 in world 2 only (not read): 2 HELD');
  outc('2', { gain: [100, 100, 0] }, 'HELD', 'AN saves 100 in both: 2 HELD');
  { const r = mk({ lose: [3, 0, 0], gain: [0, 0, 0] }); cases.push(['the paired counts: lost 3 saved 0 of 4,000, BN alive 2,000', JSON.stringify(paired(r.S('AN', 0), r.S('BN', 0))), JSON.stringify({ lost: 3, saved: 0, both: 1997, N: 4000, bnAlive: 2000 })]); }
  // item 3 (Y1 in world 2)
  outc('3', {}, 'HELD', 'Y1 0 in world 2: 3 HELD');
  outc('3', { y1: -0.79 }, 'FALSIFIED', 'Y1 at BN\'s -0.79 in world 2: 3 FALSIFIED');
  outc('3', { y1: 0.9 }, 'FALSIFIED', 'Y1 +0.9 in world 2: 3 FALSIFIED');
  outc('3', { y1: -0.5 }, 'INCONCLUSIVE', 'Y1 -0.5 in world 2: 3 INCONCLUSIVE');
  outc('3', { y1: 0.39 }, 'INCONCLUSIVE', 'Y1 +0.39 in world 2, its interval past +0.4: 3 INCONCLUSIVE');
  // the read end to end
  { const r = mk(); let L = [], err = null; try { L = report(r.P, r.S, [1]); } catch (e) { err = e.message; } cases.push(['the read prints three items, an OUTCOME of three and three REALISED lines, end to end', err || `${['1.', '2.', '3.'].every(p => L.some(l => l.startsWith(p)))} ${(L.find(l => l.startsWith('OUTCOME: ')) || '').split(', ').length} ${L.filter(l => l.startsWith('REALISED item')).length}`, 'true 3 3']); }
  // the gate, on synthetic logs as the audit prints them
  const pad = ''.padEnd(16), Lb = LABEL;
  const logOf = (o = {}) => {
    const pts = o.pts || 60, npw = o.npw || NPW, bits = 'aaaaaaaaaaaaaaaa';
    const ran = `bridgeRead reader bridgeStep exact readerSplit null readerBlend null readerRef ${o.ref || 'adaptive'} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${pts} grid total${pts}x15x6 shareNodes ${o.nodes || NODES_A} floor 5000 line 0.5`;
    const L = [`stamp: code c0 audit a0 prediction p0 sha s0`, `AN: the candidate's own unit, ${o.headNpw || npw} paths a world, wealth points divided by 1 (seed ${o.seed || 7002}); 1 jobs; part 0/1`];
    for (let c = 0; c < (o.cases || 1); c++) {
      L.push(`S360             case | job ${Lb} | points ${o.casePts || pts} | lambda 0.0223606797749979`, `${pad} solve CAND ${Lb}: table 46.8 secs 9000`, `${pad} ran CAND ${Lb}: ${ran}`, `${pad} checks ${Lb}: armTook 1/1`);
      L.push(`${pad} adaptive ${Lb}: moves 24 nonMono ${o.nonMono || 0} lattice ${o.lattice || '160x41'}x4 nz ${o.nz || 128} last year 7 secs 300.0`, `${pad} checks ${Lb}: adaptTook ${o.adapt !== undefined ? o.adapt : 1}/1`);
      L.push(`${pad} openings ${Lb}: OWN ai 12 level 0.8 tiers 0,0`, `${pad} bridge ${Lb}: reader years 1,2,3,4,5,6,7`);
      for (let k = 0; k < 3; k++) L.push(`${pad} tables ${Lb} ${k} z 0 weight 0.3: OWN 40 READ 40`, `${pad} sim ${Lb} ${k} OWN ai 12: ${npw / 2}/${npw} bridge ${npw / 2} bits ${bits} ${bits}`, `${pad} ledger ${Lb} ${k}: ${[...KEYS, 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7'].map(x => `${x} 0.1`).join(' ')}`, `${pad} qf ${Lb} ${k}: paths ${Math.min(npw, NQF)} QF 0.01`);
      L.push(`${pad} checks ${Lb}: refTook ${o.ref1 !== undefined ? o.ref1 : 15}/${o.refN !== undefined ? o.refN : 15} (p above its simulation in 7 of 15 bins)`, `${pad} checks ${Lb}: ownTook ${3 * npw}/${3 * npw} identity ${o.id !== undefined ? o.id : (o.idN || 3 * npw)}/${o.idN || 3 * npw} qfTook 9/9 layerTook 9/9 secs 100`);
      L.push(`${pad} file ${Lb}: S360-AN-P60S15Q5.json.gz`, ...(o.noDone ? [] : [`${pad} done ${Lb}`]));
    }
    return L.join('\n');
  };
  const refuses = (what, o, opt = {}) => cases.push([`the gate refuses ${what}`, gate(parse(logOf(o)), opt).length > 0, true]);
  cases.push(['the gate passes the job as registered', gate(parse(logOf())).join('; '), '']);
  refuses('a job run twice', { cases: 2 });
  refuses('no done line', { noDone: true });
  refuses('another seed', { seed: 7003 });
  refuses('another path count', { npw: 2000 });
  refuses('another wealth grid', { pts: 30 });
  refuses('the order-drawn reference (the arm\'s plant)', { ref: 'order' });
  refuses('other share nodes', { nodes: '0,0.2,0.4,0.6,0.8,1' });
  refuses('a reference built on another lattice', { lattice: '40x11' });
  refuses('a reference with fewer draws', { nz: 32 });
  refuses('a last year that is not monotone', { nonMono: 2 });
  refuses('adaptTook failed', { adapt: 0 });
  refuses('refTook short', { ref1: 14 });
  refuses('refTook over no bin', { ref1: 0, refN: 0 });
  refuses('a header naming another path count (the runs right)', { headNpw: 2000 });
  refuses('a case line at another point count (the meta right)', { casePts: 30 });
  refuses('the identity held on another count of paths', { idN: 3 * 2000 });
  refuses('the identity short', { id: 3 * NPW - 1 });
  { const j = parse(logOf()), b64 = a => Buffer.from(a.buffer).toString('base64'), per = {};
    for (let k = 0; k < 3; k++) for (const x of [...KEYS, 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7']) per[`${x}${k}`] = b64(new Float64Array(NPW));
    const bitsB = {}; for (let k = 0; k < 3; k++) for (const b of [`OWN${k}`, `OWN${k}b`]) bitsB[b] = 'x';
    const file = { stamp: j[0].stamp, per, bits: bitsB };
    // the log prints the bits' sha16; the synthetic bits 'x' hash to another value, so the file is refused on them unless matched
    const sh = sha16(Buffer.from('x', 'base64')), j2 = parse(logOf().replace(/bits aaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaa/g, `bits ${sh} ${sh}`));
    cases.push(['the gate passes a file that is the log\'s', gate(j2, { files: { 'S360-AN-P60S15Q5.json.gz': file } }).join('; '), '']);
    cases.push(['the gate refuses a missing file', gate(j2, { files: {} }).length > 0, true]);
    cases.push(['the gate refuses a file stamped by other code', gate(j2, { files: { 'S360-AN-P60S15Q5.json.gz': { ...file, stamp: { ...file.stamp, code: 'c9' } } } }).length > 0, true]);
    cases.push(['the gate refuses a file whose bits are not the log\'s', gate(j, { files: { 'S360-AN-P60S15Q5.json.gz': file } }).length > 0, true]);
    cases.push(['the gate refuses a file short of one world\'s GB', gate(j2, { files: { 'S360-AN-P60S15Q5.json.gz': { ...file, per: { ...per, GB1: b64(new Float64Array(5)) } } } }).length > 0, true]); }
  const bad = cases.filter(([, got, want]) => got !== want);
  for (const [what, got, want] of cases) console.log(`${got === want ? 'ok  ' : 'BAD '} ${what}: ${JSON.stringify(got)}`);
  if (bad.length) { console.log(`PLANTED CHECK FAILED (${bad.length})`); process.exit(1); }
  const short = ITEMS.filter(i => REACHED[i].size < 3);
  if (short.length) { console.log(`PLANTED CHECK FAILED: items not planted to all three outcomes: ${short.map(i => `${i} (${[...REACHED[i]].join(', ')})`).join('; ')}`); process.exit(1); }
  if (EDGES.length < 2) { console.log('PLANTED CHECK FAILED: fewer than two edges'); process.exit(1); }
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
  const DIR = args[0] || join(HERE, 'results', 'diagan'), npwA = Number(args[1] || NPW), scaleA = Number(args[2] || 1);
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const bad = gate(jobs, { npw: npwA, scale: scaleA, files });
  // the control: NODE-AX's BN, behind NODE-AX's own gate, its file the one recorded
  const AX = join(HERE, 'results', 'diagnodeax'), axf = join(AX, BN_FILE);
  let bnFile = null;
  if (!PRE) {
    const red = spawnSync('node', [join(HERE, 'reduce-nodeax.mjs'), AX], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (!/^GATE: passed/m.test(red.stdout || '')) bad.push('NODE-AX\'s files did not pass NODE-AX\'s gate');
    if (!existsSync(axf) || sha16(readFileSync(axf)) !== NODEAX_SHA) bad.push(`NODE-AX's BN file is not the one recorded (${NODEAX_SHA})`);
    else bnFile = JSON.parse(gunzipSync(readFileSync(axf)).toString());
    if (bnFile && bnFile.NPW !== npwA) bad.push('NODE-AX\'s BN is not on the same paths');
  }
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  const j = jobs[0];
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - AN once and done at the registered settings (${npwA} paths a world, scale ${scaleA}, seed ${SEED}); readerRef 'adaptive' at the lattice ${LATTICE} with ${NZ} draws in its solve's meta, NODE-AX's settings otherwise; every self-check in full (armTook, adaptTook, refTook, ownTook, identity, qfTook, layerTook); its file the log's${PRE ? '' : `; NODE-AX's BN behind NODE-AX's gate, its file ${NODEAX_SHA}`}`);
  if (PRE) { console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const dec = x => { const b = Buffer.from(x, 'base64'); return Array.from(new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)), v => 100 * v); };
  const P = (arm, x, k) => dec((arm === 'AN' ? files[j.file] : bnFile).per[`${x}${k}`]);
  const S = (arm, k) => Buffer.from((arm === 'AN' ? files[j.file] : bnFile).bits[`OWN${k}`], 'base64');
  console.log('\nAN: S360\'s bridge-years grid residual under the adaptive reference, against NODE-AX\'s BN (predictions/diag-an.md)');
  console.log(`  the reference: ${j.adaptive.moves} floor moves, lattice ${j.adaptive.lattice} by ${j.adaptive.ng} gain nodes, ${j.adaptive.nz} draws, last bridge year ${j.adaptive.TL}, built in ${j.adaptive.secs} s`);
  for (const L of report(P, S, j.bridge)) console.log(L);
  for (const r of j.refcheck) console.log(`  refcheck world ${r.k} bin ${r.bin}: ${r.text}`);
}
