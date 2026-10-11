/*
 * NE-BLEND stage A's reducer (predictions/diag-neblend-a.md; PLAN.md NE-BLEND; audit-neblend.mjs). The gate runs first and
 * refuses any log it cannot vouch for; the items are read only by their registered rules.
 * THE GATE: the four jobs once and done, one stamp (code, audit, prediction) across the logs and in every file; the
 *   registered settings (points, paths a world, seed); each arm in its solve's meta (armTook and the ran line) and the
 *   candidate's others intact; three world lines of the registered paths, their bits the file's; forceIdentity on world 0's
 *   first 1,000 paths; and S380 under BASE reproducing NE-ROOT's S380 tables by world to the printed digits
 *   (results-neroot.txt: the new code leaves the default unchanged).
 * THE ITEMS (ALPHA 0.05; each world's simulated survival bounded by its exact interval one-sided at ALPHA / 6):
 *   1. RZ keeps bridge 4: HELD when every world's table less simulated is within 0.3 points (the point); FALSIFIED when a
 *      world's interval lies wholly outside [-0.3, 0.3]; INCONCLUSIVE otherwise (NE-ROOT item 5's rule).
 *   2. LOR keeps bridge 4: the same rule on LOR's bridge 4 job.
 *   3. LOR restores S380's spread across the worlds: the ratio (T2 - T0) / (S2 - S0) of the table's spread to the
 *      simulated at CAND's own opening, bounded by the worlds' bounds; HELD when its point lies in [0.97, 1.03] and every
 *      world's table less simulated is within a point (the point, as the deep review set it); FALSIFIED when the ratio's
 *      interval lies wholly below 0.95 (still flattened); INCONCLUSIVE otherwise - and when it lies wholly above 1.05,
 *      read and printed as over-corrected (the blend carries the spread and LOR overshoots), never as FALSIFIED (the
 *      plan-auditor's BLOCKING 1 of 11 Oct 13:00 UK). BASE's ratio is printed beside it.
 *   4. LOR changes S380's outcome in world 0 (the poor world, where BASE's table over-reads): LOR's own opening and moves
 *      against BASE's, paired on the same 4,000 world-0 paths; HELD when the exact two-sided McNemar p is under ALPHA and
 *      the change is at least 0.5 points, printed with its direction (up: LOR saves paths; down: it loses them);
 *      FALSIFIED when the guarded interval of the change (survivalChangeU at ALPHA, held out to the exact bound on a
 *      one-sided count: reduce-7aa.mjs guarded) lies inside [-0.5, 0.5]; INCONCLUSIVE otherwise.
 * REPORTED: every job's world lines, the openings, BASE's spread ratio, the changes in worlds 1 and 2.
 *   node research/solver/reduce-neblend-a.mjs [dir] [paths a world] [points] > research/solver/results-neblend-a.txt   (--preflight, --planted)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { clopperPearson, survivalChangeU, binomUpperHalf } from './stats.mjs';
import { guarded } from './reduce-7aa.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-neblend-a.md';
export const PTS = '30', SEED = '7002', NPW = 4000, ALPHA = 0.05, CTRL = 0.3, WORLD = 1, MAT = 0.5;
export const SPREAD = [0.97, 1.03], SPREAD_OUT = [0.95, 1.05];   // HELD band; FALSIFIED below its first, over-corrected above its second
export const JOBS = [['bridge 4', '0.02', 'RZ'], ['bridge 4', '0.02', 'LOR'], ['S380', '0.02', 'BASE'], ['S380', '0.02', 'LOR']];
const key = (id, w, arm) => `${id} ${arm}/W${w}`;
const esc = s => s.replace(/[/+.-]/g, m => `\\${m}`);
const field = (s, k) => { const m = new RegExp(`(?:^| )${esc(k)} (\\S+)`).exec(s); return m ? m[1] : null; };
export const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const CASEL = /^(bridge 4|S380)\s+case \| job (BASE|RZ|LOR)\/W(0\.02) \| lambda (\S+)$/;
const HEAD = /^NE-BLEND A: .*, (\d+) points, (\d+) paths a world \(seed (\d+)\)/;

export function parse(text) {
  const lines = text.split('\n'), jobs = [];
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text);
  const hd = HEAD.exec(lines.find(l => HEAD.test(l)) || '');
  let j = null;
  for (const raw of lines) {
    const c = CASEL.exec(raw);
    if (c) { j = { id: c[1], arm: c[2], w: c[3], stamp: st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null, head: hd ? { pts: hd[1], npw: Number(hd[2]), seed: hd[3] } : null, world: [], checks: {}, done: false }; jobs.push(j); continue; }
    if (!j) continue;
    const l = raw.trim(), L = `${j.arm}/W${j.w}`;
    if (l.startsWith(`ran CAND ${L}:`)) j.ran = l.slice(`ran CAND ${L}:`.length);
    else if (l.startsWith(`checks ${L}:`)) { for (const m of l.matchAll(/(\w+) (\d+)\/(\d+)/g)) j.checks[m[1]] = [Number(m[2]), Number(m[3])]; }
    else if (l.startsWith(`openings ${L}:`)) { const m = /OWN ai (\d+) level (\S+) tiers (\S+)/.exec(l); j.own = m ? { ai: Number(m[1]), level: m[2], tiers: m[3] } : null; }
    else if (l.startsWith(`world ${L} `)) {
      const m = new RegExp(`^world ${esc(L)} (\\d) z (\\S+) weight (\\S+): OWN table (\\S+) sim (\\d+)/(\\d+) bits (\\S+)$`).exec(l);
      if (m) j.world.push({ k: Number(m[1]), weight: Number(m[3]), table: Number(m[4]), ok: Number(m[5]), n: Number(m[6]), bits: m[7] });
    } else if (l.startsWith(`file ${L}:`)) j.file = l.slice(`file ${L}:`.length).trim();
    else if (l === `done ${L}`) j.done = true;
  }
  return jobs;
}

const WANT = { BASE: { readerSplit: 'null', readerBlend: 'null' }, RZ: { readerSplit: 'rz', readerBlend: 'null' }, LOR: { readerSplit: 'null', readerBlend: 'logodds' } };
const COMMON = { bridgeRead: 'reader', bridgeStep: 'exact', readerChance: 'null', jointWorlds: 'true', e3pcls: 'true', switchMargin: '0', switchCharge: '0.001' };
/* NE-ROOT's S380 tables by world under BASE (its results file), to the digits it printed */
export function neRootS380(text) {
  const i = text.indexOf('\nS380 BASE/W0.02:'); if (i < 0) return null;
  const blk = text.slice(i + 1, text.indexOf('\n\n', i + 1));
  const t = [...blk.matchAll(/world (\d) .*?OWN table (\S+) sim/g)].map(m => Number(m[2]));
  return t.length === 3 ? t : null;
}
export function gate(jobs, { pts = PTS, npw = NPW, seed = SEED, files = null, ref = null } = {}) {
  const bad = [], byKey = {};
  for (const j of jobs) { const k = key(j.id, j.w, j.arm); (byKey[k] = byKey[k] || []).push(j); }
  for (const [id, w, arm] of JOBS) { const n = (byKey[key(id, w, arm)] || []).length; if (n !== 1) bad.push(`${key(id, w, arm)}: ${n ? 'run ' + n + ' times' : 'missing'}`); }
  const st0 = jobs[0] && jobs[0].stamp;
  for (const j of jobs) {
    const k = key(j.id, j.w, j.arm);
    if (!JOBS.some(([id, w, arm]) => id === j.id && w === j.w && arm === j.arm)) { bad.push(`${k}: not a registered job`); continue; }
    if (!j.done) bad.push(`${k}: no done line`);
    if (!j.stamp || !st0 || ['code', 'audit', 'prediction', 'sha'].some(f => j.stamp[f] !== st0[f])) bad.push(`${k}: its stamp is not the other logs'`);
    if (!j.head || j.head.pts !== pts || j.head.npw !== npw || j.head.seed !== seed) bad.push(`${k}: not at the registered settings (${pts} points, ${npw} a world, seed ${seed})`);
    if (!j.checks.armTook || j.checks.armTook[0] !== 1) bad.push(`${k}: armTook did not pass`);
    const ran = j.ran || '';
    for (const [f, v] of Object.entries({ ...WANT[j.arm], ...COMMON })) if (field(ran, f) !== v) bad.push(`${k}: ${f} is ${field(ran, f)}, not ${v}`);
    if (field(ran, 'pts') !== pts) bad.push(`${k}: not at ${pts} points`);
    if (!j.own) bad.push(`${k}: the openings line is missing or unread`);
    if (j.world.length !== 3 || j.world.some((x, i) => x.k !== i || x.n !== npw)) bad.push(`${k}: the world lines are not three worlds of ${npw} paths`);
    const fi = Math.min(npw, 1000); if (!j.checks.forceIdentity || j.checks.forceIdentity[0] !== fi || j.checks.forceIdentity[1] !== fi) bad.push(`${k}: forceIdentity did not pass on world 0's first ${fi} paths`);
    if (files) {
      const f = j.file && files[j.file];
      if (!f) bad.push(`${k}: its file ${j.file} is missing`);
      else {
        if (!f.stamp || !j.stamp || ['code', 'audit', 'prediction'].some(x => f.stamp[x] !== j.stamp[x])) bad.push(`${k}: its file is stamped by other code`);
        for (const x of j.world) if (!f.bits[`OWN${x.k}`] || sha16(Buffer.from(f.bits[`OWN${x.k}`], 'base64')) !== x.bits) bad.push(`${k}: world ${x.k}'s bits are not the log's`);
      }
    }
  }
  if (ref !== false) {
    const b = jobs.find(j => j.id === 'S380' && j.arm === 'BASE');
    if (!ref) bad.push('S380 BASE: NE-ROOT\'s S380 tables (results-neroot.txt) could not be read');
    else if (b && b.world.length === 3 && b.world.some((x, i) => x.table.toFixed(4) !== ref[i].toFixed(4))) bad.push(`S380 BASE: its tables ${b.world.map(x => x.table.toFixed(4)).join(', ')} are not NE-ROOT's ${ref.map(x => x.toFixed(4)).join(', ')} (the default moved)`);
  }
  return bad;
}

const a1 = ALPHA / 6;
export function ctrlOf(job) { return job.world.map(y => { const [l, h] = clopperPearson(y.ok, y.n, 2 * a1); return { k: y.k, d: y.table - 100 * y.ok / y.n, lo: y.table - 100 * h, hi: y.table - 100 * l }; }); }
export function spreadOf(job) {
  const w = job.world, [l0, h0] = clopperPearson(w[0].ok, w[0].n, 2 * a1), [l2, h2] = clopperPearson(w[2].ok, w[2].n, 2 * a1);
  const dT = w[2].table - w[0].table, dS = 100 * (w[2].ok / w[2].n - w[0].ok / w[0].n);
  return { point: dT / dS, lo: dT / (100 * (h2 - l0)), hi: dS > 0 && 100 * (l2 - h0) > 0 ? dT / (100 * (l2 - h0)) : Infinity };
}
/* the exact two-sided McNemar p on b lost and c saved: twice the smaller tail, P(X >= max(b, c)) for X ~ Bin(b + c, 1/2)
   by symmetry (stats.mjs binomUpperHalf, which builds large counts in logs: the plan-auditor's MINOR 5 of 11 Oct 13:00 UK) */
export function mcnemar2(b, c) {
  const n = b + c; if (n === 0) return 1;
  return Math.min(1, 2 * binomUpperHalf(Math.max(b, c), n));
}
export function pairOf(bitsA, bitsB) {
  let a = 0, b = 0, c = 0, d = 0;
  for (let i = 0; i < bitsA.length; i++) { const x = bitsA[i], y = bitsB[i]; if (x && y) a++; else if (x && !y) b++; else if (!x && y) c++; else d++; }
  return { a, b, c, d, change: 100 * (c - b) / bitsA.length };
}
export function items(J, bitsOf) {
  const out = {};
  const keep = job => { const c = ctrlOf(job); return { c, outcome: c.every(x => Math.abs(x.d) <= CTRL) ? 'HELD' : c.some(x => x.lo > CTRL || x.hi < -CTRL) ? 'FALSIFIED' : 'INCONCLUSIVE' }; };
  out[1] = keep(J[key('bridge 4', '0.02', 'RZ')]);
  out[2] = keep(J[key('bridge 4', '0.02', 'LOR')]);
  const lor = J[key('S380', '0.02', 'LOR')], base = J[key('S380', '0.02', 'BASE')], sp = spreadOf(lor), cw = ctrlOf(lor);
  const within = cw.every(x => Math.abs(x.d) <= WORLD), over = sp.lo > SPREAD_OUT[1];
  out[3] = { outcome: sp.point >= SPREAD[0] && sp.point <= SPREAD[1] && within ? 'HELD' : sp.hi < SPREAD_OUT[0] ? 'FALSIFIED' : 'INCONCLUSIVE', over, sp, base: spreadOf(base), cw };
  const pr = [0, 1, 2].map(k => pairOf(bitsOf(base, k), bitsOf(lor, k))), p0 = pr[0], pv = mcnemar2(p0.b, p0.c);
  const N0 = p0.a + p0.b + p0.c + p0.d, g = guarded(survivalChangeU(p0.a, p0.b, p0.c, p0.d, ALPHA), p0.b, p0.c, N0, ALPHA);
  const held = pv < ALPHA && Math.abs(p0.change) >= MAT;
  out[4] = { outcome: held ? 'HELD' : (g.lo >= -MAT && g.hi <= MAT) ? 'FALSIFIED' : 'INCONCLUSIVE', dir: held ? (p0.change > 0 ? 'up' : 'down') : null, pr, p: pv, g, own: { base: base.own, lor: lor.own } };
  return out;
}

/* PLANTED: every boundary the items and the gate turn on, read as it should */
const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
function planted() {
  const W = [1 / 6, 2 / 3, 1 / 6];
  const job = (id, arm, worlds, own = { ai: 1, level: '1', tiers: '0,0' }) => ({ id, arm, w: '0.02', own, world: worlds.map(([t, ok], k) => ({ k, weight: W[k], table: t, ok, n: NPW, bits: '-' })) });
  const cal = [[98.4, 3936], [99.97, 3999], [100, 4000]];
  const s380 = [[35.0977, 1234], [76.2609, 3136], [94.5685, 3881]];   // NE-ROOT's S380 under BASE: flattened (0.899)
  const steep = [[30.9, 1234], [78.4, 3136], [97.0, 3881]];          // a table at its runs
  const set = (over = {}) => Object.assign({ [key('bridge 4', '0.02', 'RZ')]: job('bridge 4', 'RZ', cal), [key('bridge 4', '0.02', 'LOR')]: job('bridge 4', 'LOR', cal), [key('S380', '0.02', 'BASE')]: job('S380', 'BASE', s380), [key('S380', '0.02', 'LOR')]: job('S380', 'LOR', steep) }, over);
  // bits: by default LOR and BASE identical on every path; `shift` moves c - b paths in world 0
  const mk = (ok, n = NPW) => { const b = new Uint8Array(n); for (let i = 0; i < ok; i++) b[i] = 1; return b; };
  const bitsWith = (lost = 0, saved = 0) => (job, k) => { const okB = [1234, 3136, 3881][k]; const b = mk(okB); if (job.arm === 'LOR' && k === 0) { for (let i = 0; i < lost; i++) b[i] = 0; for (let i = 0; i < saved; i++) b[okB + i] = 1; } return b; };
  const cases = [], o = (J, bits = bitsWith()) => items(J, bits);
  const at = (t) => job('bridge 4', 'RZ', [[t, 3936], [99.97, 3999], [100, 4000]]);
  cases.push(['bridge 4 calibrated under RZ: 1 HELD', o(set())[1].outcome, 'HELD']);
  cases.push(['bridge 4 off by exactly 0.3 in world 0 under RZ: 1 HELD', o(set({ [key('bridge 4', '0.02', 'RZ')]: at(98.7) }))[1].outcome, 'HELD']); EDGES.push('a control point exactly at 0.3');
  cases.push(['bridge 4 off by 0.45 under RZ, its interval reaching inside 0.3: 1 INCONCLUSIVE', o(set({ [key('bridge 4', '0.02', 'RZ')]: at(98.85) }))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['bridge 4 off by 48 under RZ (R0\'s break): 1 FALSIFIED', o(set({ [key('bridge 4', '0.02', 'RZ')]: job('bridge 4', 'RZ', [[50.65, 3935], [51.41, 3999], [51.37, 4000]]) }))[1].outcome, 'FALSIFIED']);
  cases.push(['bridge 4 calibrated under LOR: 2 HELD', o(set())[2].outcome, 'HELD']);
  cases.push(['bridge 4 off by 0.45 under LOR: 2 INCONCLUSIVE', o(set({ [key('bridge 4', '0.02', 'LOR')]: job('bridge 4', 'LOR', [[98.85, 3936], [99.97, 3999], [100, 4000]]) }))[2].outcome, 'INCONCLUSIVE']);
  cases.push(['bridge 4 off by 2 under LOR: 2 FALSIFIED', o(set({ [key('bridge 4', '0.02', 'LOR')]: job('bridge 4', 'LOR', [[96.4, 3936], [99.97, 3999], [100, 4000]]) }))[2].outcome, 'FALSIFIED']);
  cases.push(['LOR\'s table at its runs: 3 HELD', o(set())[3].outcome, 'HELD']);
  cases.push(['LOR as flat as BASE (0.899): 3 FALSIFIED', o(set({ [key('S380', '0.02', 'LOR')]: job('S380', 'LOR', s380) }))[3].outcome, 'FALSIFIED']); EDGES.push('a spread as flat as BASE\'s');
  // the ends moved in by half the shortfall each, so every world stays inside a point; nudged so the ratio reads r or above
  const ratioAt = r => { const s0 = 100 * 1234 / NPW, s2 = 100 * 3881 / NPW, dS = s2 - s0, dl = (1 - r) * dS / 2; let t2 = s2 - dl; const t0 = s0 + dl; while ((t2 - t0) / dS < r) t2 += 1e-12; return job('S380', 'LOR', [[t0, 1234], [78.4, 3136], [t2, 3881]]); };
  // steepened by lowering world 0's table, so every table stays inside 0 to 100
  const steepAt = r => { const s0 = 100 * 1234 / NPW, s2 = 100 * 3881 / NPW; return job('S380', 'LOR', [[s0 - (r - 1) * (s2 - s0), 1234], [78.4, 3136], [s2, 3881]]); };
  cases.push(['LOR\'s spread ratio exactly 0.97: 3 HELD', o(set({ [key('S380', '0.02', 'LOR')]: ratioAt(0.97) }))[3].outcome, 'HELD']); EDGES.push('a spread ratio exactly at 0.97');
  cases.push(['LOR\'s spread ratio 0.96, its interval reaching 0.95: 3 INCONCLUSIVE', o(set({ [key('S380', '0.02', 'LOR')]: ratioAt(0.96) }))[3].outcome, 'INCONCLUSIVE']);
  { const r = o(set({ [key('S380', '0.02', 'LOR')]: steepAt(1.2) }))[3]; cases.push(['LOR steepened to 1.2: 3 INCONCLUSIVE, over-corrected', `${r.outcome}${r.over ? ' over' : ''}`, 'INCONCLUSIVE over']); } EDGES.push('a spread steepened past 1.05 (over-corrected)');
  cases.push(['LOR at its spread, world 1 1.5 points off at its point but its interval reaching 1: 3 INCONCLUSIVE', o(set({ [key('S380', '0.02', 'LOR')]: job('S380', 'LOR', [[30.85, 1234], [79.9, 3136], [97.0, 3881]]) }))[3].outcome, 'INCONCLUSIVE']); EDGES.push('a world off at its point but not shown');
  cases.push(['LOR at its spread but world 1 shown 3 points off: 3 INCONCLUSIVE', o(set({ [key('S380', '0.02', 'LOR')]: job('S380', 'LOR', [[30.85, 1234], [81.4, 3136], [97.0, 3881]]) }))[3].outcome, 'INCONCLUSIVE']);
  cases.push(['LOR and BASE identical on every world-0 path: 4 FALSIFIED', o(set())[4].outcome, 'FALSIFIED']); EDGES.push('a pair with no discordant path');
  { const r = o(set(), bitsWith(0, 60))[4]; cases.push(['LOR saves 60 world-0 paths, loses none (1.5 points): 4 HELD, up', `${r.outcome} ${r.dir}`, 'HELD up']); }
  { const r = o(set(), bitsWith(60, 0))[4]; cases.push(['LOR loses 60 world-0 paths, saves none: 4 HELD, down', `${r.outcome} ${r.dir}`, 'HELD down']); } EDGES.push('a change down as well as up');
  cases.push(['LOR saves 12, loses none: the guarded interval reaches past 0.5: 4 INCONCLUSIVE', o(set(), bitsWith(0, 12))[4].outcome, 'INCONCLUSIVE']); EDGES.push('a one-sided count the guard holds out');
  { const z = (Math.abs(560 - 540) - 1) / Math.sqrt(1100), nrm = (() => { const t = 1 / (1 + 0.2316419 * z), d = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); return 2 * d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))); })();
    cases.push([`the exact test at 1,100 discordant paths (540 lost, 560 saved) meets the normal approximation with continuity (${nrm.toFixed(4)}), not 0`, Math.abs(mcnemar2(540, 560) - nrm) < 0.01, true]); } EDGES.push('a McNemar count past the old underflow');
  cases.push(['LOR saves exactly 20 paths, loses none (0.5 points): 4 HELD', o(set(), bitsWith(0, 20))[4].outcome, 'HELD']); EDGES.push('a change exactly at 0.5 points');
  cases.push(['LOR saves 30 and loses 30 (no net change, its interval inside 0.5): 4 FALSIFIED', o(set(), bitsWith(30, 30))[4].outcome, 'FALSIFIED']); EDGES.push('a balanced swap of discordant paths');
  cases.push(['LOR saves 30 and loses 15 (0.375 points, reads, but under 0.5): 4 INCONCLUSIVE', o(set(), bitsWith(15, 30))[4].outcome, 'INCONCLUSIVE']);
  // the gate, on a synthetic log built as the audit prints
  const st = 'stamp: code C audit A prediction P sha S';
  const jobText = (id, arm, { done = true, armTook = 1, force = 4, ran = null, pts = '4', seedx = '7002', table0 = null } = {}) => {
    const L = `${arm}/W0.02`, pad = ''.padEnd(16);
    const r = ran || { BASE: 'readerSplit null readerBlend null', RZ: 'readerSplit rz readerBlend null', LOR: 'readerSplit null readerBlend logodds' }[arm];
    const tabs = id === 'S380' ? [35.0977, 76.2609, 94.5685] : [98.4967, 99.9761, 99.9955]; if (table0 !== null) tabs[0] = table0;
    const out = [`${id.padEnd(16)} case | job ${L} | lambda 0.0223606797749979`, `${pad} solve CAND ${L}: table 3.0 secs 1`,
      `${pad} ran CAND ${L}: bridgeRead reader bridgeStep exact ${r} readerChance null tierState 0/0,1/1,2/2 jointWorlds true e3pcls true switchMargin 0 switchCharge 0.001 bequestWeight 0.02 mix 3 pts ${pts} minPot 0`,
      `${pad} checks ${L}: armTook ${armTook}/1`, `${pad} openings ${L}: OWN ai 13 level 0.9 tiers 2,2`];
    for (let k = 0; k < 3; k++) out.push(`${pad} world ${L} ${k} z 0 weight ${W[k].toFixed(6)}: OWN table ${tabs[k].toFixed(6)} sim 1/4 bits B`);
    out.push(`${pad} checks ${L}: forceIdentity ${force}/4 secs 1`, `${pad} file ${L}: f.json.gz`);
    if (done) out.push(`${pad} done ${L}`);
    return [st, `NE-BLEND A: x, ${pts} points, 4 paths a world (seed ${seedx}); 4 jobs; part 0/1`, ...out].join('\n');
  };
  const all = (mod = {}) => JOBS.map(([id, , arm]) => parse(jobText(id, arm, mod[`${id} ${arm}`] || {}))).flat();
  const ref = [35.0977, 76.2609, 94.5685];
  const G = (js, o2 = {}) => gate(js, { pts: '4', npw: 4, seed: '7002', ref, ...o2 });
  cases.push(['the gate passes four good jobs', G(all()).join(' / '), '']);
  cases.push(['the gate refuses a missing job', G(all().slice(1)).length > 0, true]);
  cases.push(['the gate refuses a job run twice', G([...all(), ...all().slice(0, 1)]).length > 0, true]);
  cases.push(['the gate refuses a job with no done line', G(all({ 'S380 LOR': { done: false } })).length > 0, true]);
  cases.push(['the gate refuses LOR whose solve carries no blend', G(all({ 'S380 LOR': { ran: 'readerSplit null readerBlend null' } })).length > 0, true]); EDGES.push('an arm named but not in the meta');
  cases.push(['the gate refuses armTook 0', G(all({ 'bridge 4 RZ': { armTook: 0 } })).length > 0, true]);
  cases.push(['the gate refuses a forceIdentity one path short', G(all({ 'bridge 4 LOR': { force: 3 } })).length > 0, true]);
  cases.push(['the gate refuses other points', G(all({ 'S380 BASE': { pts: '5' } })).length > 0, true]);
  cases.push(['the gate refuses another seed', G(all({ 'S380 BASE': { seedx: '7013' } })).length > 0, true]);
  cases.push(['the gate refuses S380 BASE off NE-ROOT\'s tables (the default moved)', G(all({ 'S380 BASE': { table0: 35.0978 } })).length > 0, true]); EDGES.push('a default moved by a ten-thousandth');
  cases.push(['the gate refuses a missing reference', G(all(), { ref: null }).length > 0, true]);
  cases.push(['the gate refuses a file whose bits are not the log\'s', G(all(), { files: { 'f.json.gz': { stamp: { code: 'C', audit: 'A', prediction: 'P' }, bits: {} } } }).length > 0, true]);
  let failed = 0;
  for (const [what, got, want] of cases) {
    const okc = String(got) === String(want); if (!okc) failed++; console.log(`${okc ? 'ok  ' : 'FAIL'} ${what}: ${JSON.stringify(got)}`);
    const m = /: (\d) (HELD|INCONCLUSIVE|FALSIFIED)/.exec(what); if (okc && m) REACHED[Number(m[1])].add(String(want).split(' ')[0]);
  }
  if (failed) { console.log(`PLANTED CHECKS FAILED: ${failed} of ${cases.length}`); process.exit(1); }
  return cases.length;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const np_ = planted();
  if (process.argv.includes('--planted')) {
    console.log(`planted (${np_}): all read as they should\nEDGES: ${EDGES.join(', ')}`);
    for (let i = 1; i <= 4; i++) console.log(`OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`);
    process.exit(0);
  }
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const PRE = process.argv.includes('--preflight');
  const DIR = args[0] || join(HERE, 'results', 'diagneblend'), npwA = Number(args[1] || NPW), ptsA = args[2] || PTS;
  const logs = existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')])) : {};
  if (!Object.keys(logs).length) { console.log(`GATE FAILED: no logs in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const jobs = Object.values(logs).flatMap(parse);
  const files = Object.fromEntries(readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => [f, JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString())]));
  const refFile = join(HERE, 'results-neroot.txt'), ref = PRE ? false : existsSync(refFile) ? neRootS380(readFileSync(refFile, 'utf8')) : null;
  const bad = gate(jobs, { pts: ptsA, npw: npwA, files, ref });
  if (bad.length) { console.log(`GATE FAILED (${bad.length}):\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`planted (${np_}): all read as they should`);
  console.log(`GATE: passed - the four jobs once and done at the registered settings (${ptsA} points, ${npwA} paths a world, seed ${SEED}); every arm in its solve's meta; every self-check passed (armTook, forceIdentity on world 0's first 1,000 paths); every file the log's${PRE ? '' : '; S380 under BASE is NE-ROOT\'s to the printed digits'}`);
  if (PRE) { console.log('PREFLIGHT: the gate and the files read; no figure is read'); process.exit(0); }
  const J = Object.fromEntries(jobs.map(j => [key(j.id, j.w, j.arm), j]));
  const bitsOf = (job, k) => Buffer.from(files[job.file].bits[`OWN${k}`], 'base64');
  const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), e4 = x => (Number.isFinite(x) ? x.toExponential(4) : String(x));
  console.log('\nNE-BLEND stage A: the residual zeroed with the copy kept (RZ), and the read in log-odds (LOR), on bridge 4 and S380, the tuning seed (predictions/diag-neblend-a.md)');
  for (const j of jobs) {
    console.log(`\n${key(j.id, j.w, j.arm)}: own ai ${j.own.ai} level ${j.own.level} tiers ${j.own.tiers}; ${j.ran.trim()}`);
    for (const x of j.world) console.log(`  world ${x.k} (weight ${x.weight}): OWN table ${f4(x.table)} sim ${f4(100 * x.ok / x.n)} (${x.ok}/${x.n}); table less simulated ${f4(x.table - 100 * x.ok / x.n)}`);
  }
  const it = items(J, bitsOf);
  console.log('\nTHE ITEMS (each read by its registered rule)');
  for (const i of [1, 2]) console.log(`${i}. ${i === 1 ? 'RZ' : 'LOR'} keeps bridge 4 within 0.3 points in every world: ${it[i].outcome}\n     ${it[i].c.map(c => `world ${c.k} ${f4(c.d)} (${f4(c.lo)} to ${f4(c.hi)})`).join('; ')}`);
  const s = it[3];
  console.log(`3. LOR restores S380's spread across the worlds: ${s.outcome}\n     LOR's ratio ${f4(s.sp.point)} (${f4(s.sp.lo)} to ${f4(s.sp.hi)}); BASE's ${f4(s.base.point)} (${f4(s.base.lo)} to ${f4(s.base.hi)}); LOR table less simulated by world ${s.cw.map(c => `${f4(c.d)} (${f4(c.lo)} to ${f4(c.hi)})`).join(', ')}`);
  const q = it[4];
  console.log(`4. LOR changes S380's outcome in world 0: ${q.outcome}\n     own openings: BASE ai ${q.own.base.ai} (level ${q.own.base.level}, tiers ${q.own.base.tiers}), LOR ai ${q.own.lor.ai} (level ${q.own.lor.level}, tiers ${q.own.lor.tiers}); world 0: ${q.pr[0].c} saved/${q.pr[0].b} lost, change ${f4(q.pr[0].change)} (exact two-sided p ${e4(q.p)}; guarded interval ${f4(q.g.lo)} to ${f4(q.g.hi)}); REPORTED world 1 ${q.pr[1].c} saved/${q.pr[1].b} lost (${f4(q.pr[1].change)}), world 2 ${q.pr[2].c}/${q.pr[2].b} (${f4(q.pr[2].change)})`);
  console.log(`REALISED item 3: ${f4(s.sp.point)}`);
  console.log(`REALISED item 4: ${f4(q.pr[0].change)}`);
  console.log(`OUTCOME: ${[1, 2, 3, 4].map(i => `${i} ${it[i].outcome}`).join(', ')}`);
}
