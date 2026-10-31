/*
 * THE 7AU REDUCER: THE LEARNER AT P'S SETTINGS (predictions/diag-7au.md; PLAN.md 7au; the deep review after 7as,
 * deep-review-log.md 4 Oct 01:54 UK). Reads results/diag7au/case*.txt and traces (batch-7au.sh: audit-7au.mjs, one process a
 * job) beside P's records (results/diagP), which pass P's own gate first (reduce-P.mjs loadRefs and gate) and whose traces are
 * held to P's logs.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) of 7au, and P's records through P's own gate;
 *   - every registered job once and done, nothing unregistered: node:L on S194, all:L on bridge 4, S194 and S126;
 *   - the unit line's settings (lambda held, the plan's tier, 'auto' risk above, three worlds, 30 points, 5 return points);
 *   - IDENTITY OF THE SOLVE: every job's table, ran (sized), gap and opening, joint, moves, price and world lines are P's core:P
 *     lines for the unit (the same code as 7as, whose identity jobs held them; held again here);
 *   - COMPLETE: node:L's node line (OPEN2+L and OPEN2+O on WN paths, neither holding the plan's tiers at year 0), its ident line
 *     (OPEN2 and WA on IN paths), a weights line and ten decision-log lines a rule; each all:L's all line (TS+J+L and TS+J+O on
 *     NA paths), ident-all line (TS+J on IN) and weights lines; no node line on an all:L job;
 *   - THE TRACES: every trace present and agreeing with its log (count, seed, arm, stamp, survival); P's traces (S194's node
 *     OPEN2 and WA at P; TS+J across all worlds at P on the three units) agreeing with P's logs;
 *   - IDENTITY OF THE RUNS (today's code against P's traces, before pairing with them): this run's OPEN2, WA and TS+J on the
 *     first IN paths equal P's on the same paths in survival, spending level and tier, byte for byte; the learner's and the
 *     oracle's traces carry the same per-path long-run shifts (the same paths).
 * THE ITEMS (registered in predictions/diag-7au.md):
 *   1. THE LEARNER'S SHARE OF THE SLICE (primary; single look): at S194's node, each path's whole score (reduce-7aa.mjs
 *      wholePaths, P's configuration) under OPEN2+L less under P's OPEN2 (dL) and under P's WA less under P's OPEN2 (dW), paired
 *      by path on all WN paths. The premise: a slice (Fisher's paired randomization test, reduce-7ar.mjs flipP, of mean(dW) above
 *      0, p under 0.05); without it INCONCLUSIVE (NO SLICE). HELD (learnable in time: the learner recovers more than two thirds)
 *      when the test of mean(dL - 2dW/3) above 0 is under 0.05 after Holm over the two directions; FALSIFIED (not learnable in
 *      time: under a third) when the test of mean(dW/3 - dL) above 0 is; else INCONCLUSIVE.
 *   2. NO MATERIAL HARM ACROSS ALL WORLDS: TS+J+L against P's TS+J on each unit, NA paths paired. A leg is SAFE when survival
 *      reads no material harm (the exact conditional McNemar, one-sided, Holm over the three legs, at the unit's margin
 *      marginFor P's survival; and the guarded unconditional interval's lower end above minus the margin) and the whole score's
 *      lower end is above -MW; HARM when survival reads harm or the whole score's upper end is below -MW; else INCONCLUSIVE.
 *      HELD when all three are SAFE; FALSIFIED when any is HARM; else INCONCLUSIVE.
 * Reported, not items: OPEN2+O (the oracle with OPEN2's opening) against OPEN2 and WA at the node; the shares by survival;
 * TS+J+O against TS+J on each unit (the bound); every all-world arm by long-run-shift bin (the shift under -sqrt(3)/2, between,
 * above sqrt(3)/2: about the three worlds); the learner's and oracle's mean end weights and updates.
 *   node research/solver/reduce-7au.mjs [dir] [dirP] [dir7ae] [dir7ad] [dir7ac] [dir7aa] [dir7af] [dir7ag] > research/solver/results-7au.txt
 *   node research/solver/reduce-7au.mjs --planted   the planted checks, the outcomes they reach and the boundary cases (EDGES)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { survivalChangeU, mcnemarHarmP, holm, outcome, marginFor } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';
import * as F from './reduce-7af.mjs';
import * as P from './reduce-P.mjs';
import { flipP, readTwo } from './reduce-7ar.mjs';
import { pRaw, sizeRan, slice } from './reduce-7as.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7au.md';
export const N = 16000, WN = 16000, NA = 16000, IN = 2000, SEED = '7002', ALPHA = 0.05, MW = P.MW, B = 20000;
export const CORE = P.CORE;   // [['bridge 4', 'READER', '0'], ['S194', 'OFF', '0.02'], ['S126', 'READER', '0']]
export const JOBS = [['node:L', 'S194', 'OFF', '0.02'], ...CORE.map(([id, a, w]) => ['all:L', id, a, w])];
export const NODE_RULES = ['OPEN2+L', 'OPEN2+O'], NODE_IDENT = ['OPEN2', 'WA'], ALL_RULES = ['TS+J+L', 'TS+J+O'];
export const BIN = Math.sqrt(3) / 2;

const CASEL = /^(\S.*?)\s+case \| job (node:L|all:L) (\S+?)\/(\d+x\d+)\/W(\S+) \| lambda (\S+) tier (\S+) riskAbove (\S+) mix (\S+) points (\d+) quad (\d+)$/;
const LBL = '(\\S+?)\\/TS\\+J\\/MP\\/(\\d+x\\d+)\\/W(\\S+)';
const RE = {
  solve: new RegExp(`^\\s+solve ${LBL}: table (\\S+) secs (\\S+)$`),
  ran: new RegExp(`^\\s+ran ${LBL}: (.*)$`),
  gap: new RegExp(`^\\s+gap ${LBL}: (\\S+) opening (\\d+),(\\d+)$`),
  joint: new RegExp(`^\\s+joint ${LBL}: (true|false) switchMargin (\\S+) switchCharge (\\S+) scale (\\S+) cap (\\S+) deathTax (\\S+) tier (\\S+) riskAbove (\\S+)$`),
  moves: new RegExp(`^\\s+moves ${LBL}: (.*)$`),
  price: new RegExp(`^\\s+price ${LBL}: (.*)$`),
  world: new RegExp(`^\\s+world ${LBL} (\\d+) (.*)$`),
  node: new RegExp(`^\\s+node ${LBL} 0 z (\\S+): OPEN2\\+L (\\S+) held0 (\\d+) OPEN2\\+O (\\S+) held0 (\\d+) paths (\\d+) secs (\\S+)$`),
  ident: new RegExp(`^\\s+ident ${LBL} 0 z (\\S+): OPEN2 (\\S+) held0 (\\d+) WA (\\S+) held0 (\\d+) paths (\\d+) secs (\\S+)$`),
  all: new RegExp(`^\\s+all ${LBL}: TS\\+J\\+L (\\S+) held0 (\\d+) TS\\+J\\+O (\\S+) held0 (\\d+) paths (\\d+) secs (\\S+)$`),
  identAll: new RegExp(`^\\s+ident-all ${LBL}: TS\\+J (\\S+) held0 (\\d+) paths (\\d+) secs (\\S+)$`),
  weights: new RegExp(`^\\s+weights ${LBL} (\\S+) (world0|all): w-end (\\S+) updates (\\S+)$`),
  log: new RegExp(`^\\s+log ${LBL} (OPEN2\\+L|OPEN2\\+O) year (\\d+): (.*)$`),
};

export function parse(text) {
  const jobs = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { kind: m[2], id: m[1].trim(), arm: m[3], grid: m[4], w: m[5], lambda: m[6], tier: m[7], riskAbove: m[8], mix: m[9], points: +m[10], quad: +m[11], worlds: [], weights: {}, log: { 'OPEN2+L': [], 'OPEN2+O': [] }, dup: [], other: 0, done: false }; jobs.push(cur); continue; }
    if (!cur) continue;
    const mine = (a, g, w) => a === cur.arm && g === cur.grid && w === cur.w;
    const set = (k, v) => { if (cur[k] !== undefined) cur.dup.push(k); cur[k] = v; };
    if ((m = RE.solve.exec(line))) { if (mine(m[1], m[2], m[3])) { set('table', m[4]); cur.secs = +m[5]; } else cur.other++; continue; }
    if ((m = RE.ran.exec(line))) { if (mine(m[1], m[2], m[3])) set('ran', m[4]); else cur.other++; continue; }
    if ((m = RE.gap.exec(line))) { if (mine(m[1], m[2], m[3])) set('gap', { gap: m[4], open1e3: +m[5], open0: +m[6] }); else cur.other++; continue; }
    if ((m = RE.joint.exec(line))) { if (mine(m[1], m[2], m[3])) set('joint', { joint: m[4] === 'true', margin: m[5], charge: m[6], scale: +m[7], cap: +m[8], deathTax: +m[9], tier: m[10], decided: m[11] }); else cur.other++; continue; }
    if ((m = RE.moves.exec(line))) { if (mine(m[1], m[2], m[3])) set('movesRaw', m[4]); else cur.other++; continue; }
    if ((m = RE.price.exec(line))) { if (mine(m[1], m[2], m[3])) set('priceRaw', m[4]); else cur.other++; continue; }
    if ((m = RE.world.exec(line))) { if (mine(m[1], m[2], m[3])) { if (cur.worlds[+m[4]]) cur.dup.push(`world ${m[4]}`); cur.worlds[+m[4]] = m[5]; } else cur.other++; continue; }
    if ((m = RE.node.exec(line))) { if (mine(m[1], m[2], m[3])) set('node', { z: +m[4], sim: { 'OPEN2+L': +m[5], 'OPEN2+O': +m[7] }, held0: { 'OPEN2+L': +m[6], 'OPEN2+O': +m[8] }, paths: +m[9] }); else cur.other++; continue; }
    if ((m = RE.ident.exec(line))) { if (mine(m[1], m[2], m[3])) set('ident', { z: +m[4], sim: { OPEN2: +m[5], WA: +m[7] }, held0: { OPEN2: +m[6], WA: +m[8] }, paths: +m[9] }); else cur.other++; continue; }
    if ((m = RE.all.exec(line))) { if (mine(m[1], m[2], m[3])) set('all', { sim: { 'TS+J+L': +m[4], 'TS+J+O': +m[6] }, paths: +m[8] }); else cur.other++; continue; }
    if ((m = RE.identAll.exec(line))) { if (mine(m[1], m[2], m[3])) set('identAll', { sim: { 'TS+J': +m[4] }, paths: +m[6] }); else cur.other++; continue; }
    if ((m = RE.weights.exec(line))) { if (mine(m[1], m[2], m[3])) { if (cur.weights[m[4]]) cur.dup.push(`weights ${m[4]}`); cur.weights[m[4]] = { where: m[5], end: m[6].split(',').map(Number), updates: +m[7] }; } else cur.other++; continue; }
    if ((m = RE.log.exec(line))) { if (mine(m[1], m[2], m[3])) { const L = cur.log[m[4]], y = +m[5]; if (L[y]) cur.dup.push(`log ${m[4]} ${y}`); L[y] = m[6]; } else cur.other++; continue; }
    if (line.trim() === `done ${cur.kind} ${cur.arm}/${cur.grid}/W${cur.w}`) { cur.done = true; continue; }
  }
  return jobs;
}

/* THE GATE. `ref(id, arm, w)` P's core:P lines for the unit; sizes as registered unless the preflight's */
export function gate(jobs, ref, { n = N, wn = WN, na = NA, inn = IN, pts = 30 } = {}) {
  const bad = [];
  for (const [kind, id, a, w] of JOBS) { const k = jobs.filter(j => j.kind === kind && j.id === id && j.arm === a && j.w === w).length; if (k !== 1) bad.push(`${kind} ${id} ${a}/W${w}: ${k} job lines, not 1`); }
  for (const j of jobs) {
    const tag = `${j.kind} ${j.id} ${j.arm}/W${j.w}`;
    if (!JOBS.some(([kind, id, a, w]) => kind === j.kind && id === j.id && a === j.arm && w === j.w)) { bad.push(`${tag}: not a registered job`); continue; }
    if (!j.done) bad.push(`${tag}: not done`);
    if (j.dup.length) bad.push(`${tag}: lines twice (${j.dup.join(', ')})`);
    if (j.other) bad.push(`${tag}: ${j.other} lines carry another unit's label`);
    if (j.lambda !== P.LAMBDA || j.tier !== 'own' || j.riskAbove !== 'auto' || j.mix !== '3' || j.points !== pts || j.quad !== 5 || j.grid !== '30x5') bad.push(`${tag}: unit line settings ${j.lambda} ${j.tier} ${j.riskAbove} ${j.mix} points ${j.points} quad ${j.quad} grid ${j.grid}`);
    if (!j.table || !j.ran || !j.gap || !j.joint || !j.movesRaw || !j.priceRaw || j.worlds.filter(Boolean).length !== 3) { bad.push(`${tag}: a solve, ran, gap, joint, moves, price or world line missing`); continue; }
    const r = ref(j.id, j.arm, j.w);
    if (!r) { bad.push(`${tag}: no P record of the unit`); continue; }
    if (j.ran !== sizeRan(r.ran, pts, n)) bad.push(`${tag}: its ran line is not P's`);
    if (j.joint.joint !== true || j.joint.margin !== '0' || j.joint.charge !== '0.001' || j.joint.deathTax !== 0 || j.joint.scale !== r.joint.scale || j.joint.cap !== r.joint.cap) bad.push(`${tag}: joint line ${JSON.stringify(j.joint)}`);
    for (const f of ['table', 'gap', 'movesRaw', 'priceRaw', 'worlds']) if (JSON.stringify(j[f]) !== JSON.stringify(r[f])) bad.push(`${tag}: its ${f} is not P's`);
    if (j.kind === 'node:L') {
      if (!j.node || j.node.paths !== wn) bad.push(`${tag}: ${j.node ? `${j.node.paths} node paths` : 'no node line'}, not ${wn}`);
      else for (const rule of NODE_RULES) if (j.node.held0[rule] !== 0) bad.push(`${tag}: ${rule} held the plan's tiers at year 0 on ${j.node.held0[rule]} paths`);
      if (!j.ident || j.ident.paths !== inn) bad.push(`${tag}: ${j.ident ? `${j.ident.paths} identity paths` : 'no ident line'}, not ${inn}`);
      for (const rule of NODE_RULES) {
        if (!j.weights[rule] || j.weights[rule].where !== 'world0' || j.weights[rule].end.length !== 3) bad.push(`${tag}: no world-0 weights line for ${rule}`);
        for (let y = 1; y <= 10; y++) if (!j.log[rule][y]) { bad.push(`${tag}: no ${rule} decision log for year ${y}`); break; }
      }
      if (j.all || j.identAll) bad.push(`${tag}: an all-world line on the node job`);
    } else {
      if (!j.all || j.all.paths !== na) bad.push(`${tag}: ${j.all ? `${j.all.paths} all-world paths` : 'no all line'}, not ${na}`);
      if (!j.identAll || j.identAll.paths !== inn) bad.push(`${tag}: ${j.identAll ? `${j.identAll.paths} identity paths` : 'no ident-all line'}, not ${inn}`);
      for (const rule of ALL_RULES) if (!j.weights[rule] || j.weights[rule].where !== 'all' || j.weights[rule].end.length !== 3) bad.push(`${tag}: no all-world weights line for ${rule}`);
      if (j.node || j.ident) bad.push(`${tag}: a node line on an all-world job`);
    }
  }
  return bad;
}

/* the identity of two runs on the same paths: survival, level and tier, byte for byte, over the first n paths */
export function sameRuns(X, Y, n) {
  if (!X || !Y || X.N < n || Y.N < n || X.Y !== Y.Y) return false;
  const eq = (a, b, k) => { if (!a || !b) return a === b; for (let i = 0; i < k; i++) if (a[i] !== b[i]) return false; return true; };
  return eq(X.survived, Y.survived, n) && eq(X.level, Y.level, n * X.Y) && eq(X.tier, Y.tier, n * X.Y);
}
const readTrace = f => JSON.parse(gunzipSync(readFileSync(f)).toString());
// a small decoded Buffer sits inside Node's shared pool: copy its own bytes, not the pool (the same bug found in reduce-dpc.mjs, 4 Oct)
const shiftOf = t => { if (!t.shift) return null; const x = Buffer.from(t.shift, 'base64'); return new Float32Array(x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength)); };
// `ident: false` only from preflight-parse-7au.mjs: at the preflight's 4 points the run cannot equal P's 30-point traces (the
// identity with P's records is the registered run's, as 7as's preflight declared); the reducer's own call never passes it
export function loadTraces(jobs, DIR, ST, jobsP, DIRP, STP, bad, { wn = WN, na = NA, inn = IN, ident = true } = {}) {
  const TR = {}, SH = {};
  const one = (dir, st, id, arm, w, rule, where, count, sim, key) => {
    const f = join(dir, P.traceName(id, arm, 'P', rule, w, where));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); return; }
    const t = readTrace(f);
    if (!P.traceAgrees(t, st, arm, 'P', rule, w, sim, count, where)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); return; }
    TR[key] = decode(t); SH[key] = shiftOf(t);
  };
  for (const j of jobs) {
    if (j.kind === 'node:L' && j.node && j.ident) {
      for (const rule of NODE_RULES) one(DIR, ST, j.id, j.arm, j.w, rule, 'world0', wn, j.node.sim[rule], `${j.id}|${rule}|node`);
      for (const rule of NODE_IDENT) one(DIR, ST, j.id, j.arm, j.w, rule, 'world0', inn, j.ident.sim[rule], `${j.id}|${rule}|ident`);
    }
    if (j.kind === 'all:L' && j.all && j.identAll) {
      for (const rule of ALL_RULES) one(DIR, ST, j.id, j.arm, j.w, rule, 'all', na, j.all.sim[rule], `${j.id}|${rule}|all`);
      one(DIR, ST, j.id, j.arm, j.w, 'TS+J', 'all', inn, j.identAll.sim['TS+J'], `${j.id}|TS+J|ident`);
    }
  }
  const tP = (id, arm) => { const x = jobsP.find(q => q.kind === 'core:P' && q.id === id && q.arm === arm); return x && x.tags.P; };
  for (const [id, arm, w] of CORE) {
    const u = tP(id, arm);
    if (!u) { bad.push(`no P core:P job for ${id}`); continue; }
    one(DIRP, STP, id, arm, w, 'TS+J', 'all', P.NA, u.all.sim, `${id}|P:TS+J|all`);
    if (id === 'S194') for (const rule of NODE_IDENT) one(DIRP, STP, id, arm, w, rule, 'world0', P.WN, u.node.sim[rule], `${id}|P:${rule}|node`);
  }
  if (bad.length) return { TR, SH };
  // the pairing on P's first paths, and today's code against P's runs on the first IN of them
  for (const k of Object.keys(TR)) { if (k.endsWith('|all') && k.includes('P:') && TR[k].N > na) TR[k] = slice(TR[k], na); if (k.endsWith('|node') && k.includes('P:') && TR[k].N > wn) TR[k] = slice(TR[k], wn); }
  if (ident) for (const rule of NODE_IDENT) if (!sameRuns(TR[`S194|${rule}|ident`], TR[`S194|P:${rule}|node`], inn)) bad.push(`S194 ${rule}: today's run on the first ${inn} node paths is not P's (survival, level or tier)`);
  if (ident) for (const [id] of CORE) if (!sameRuns(TR[`${id}|TS+J|ident`], TR[`${id}|P:TS+J|all`], inn)) bad.push(`${id} TS+J: today's run on the first ${inn} paths is not P's (survival, level or tier)`);
  for (const [id] of CORE) { const a = SH[`${id}|TS+J+L|all`], b = SH[`${id}|TS+J+O|all`]; if (!a || !b || a.length !== b.length || a.some((x, i) => x !== b[i])) bad.push(`${id}: the learner's and the oracle's traces do not carry the same shifts`); }
  return { TR, SH };
}

/* ITEM 1 over per-path whole-score differences: dL the learner's (OPEN2+L less OPEN2), dW WA's (WA less OPEN2) */
const mean = xs => xs.reduce((t, x) => t + x, 0) / (xs.length || 1);
export function splitItem(dL, dW, { b = B } = {}) {
  const pSlice = flipP(dW, b, 7101), there = pSlice < ALPHA && mean(dW) > 0, Wm = mean(dW), Lm = mean(dL);
  if (!there) return { Lm, Wm, share: NaN, pSlice, read: 'INCONCLUSIVE', note: 'NO SLICE' };
  return { Lm, Wm, share: Lm / Wm, pSlice, ...readTwo(flipP(dL.map((x, j) => x - (2 / 3) * dW[j]), b, 7102), flipP(dL.map((x, j) => dW[j] / 3 - x), b, 7103)) };
}
/* ITEM 2 over pure inputs: K(id) the paired cells of TS+J+L against P's TS+J ({a, lost, saved, d, N}: lost = P survives and
   the learner fails), Wl(id) wholeLeg of TS+J+L against P's TS+J, mar(id) the unit's margin */
const guardedU = k => A.guarded(survivalChangeU(k.a, k.lost, k.saved, k.d, ALPHA), k.lost, k.saved, k.N, ALPHA);
export function readSafe(l) {
  const harm = l.down.outcome === 'harm' || l.w.hi < -MW;
  const safe = l.down.outcome === 'no material harm' && l.u.lo > -l.mg && l.w.lo > -MW;
  return harm ? 'HARM' : safe ? 'SAFE' : 'INCONCLUSIVE';
}
export function item2(K, Wl, mar) {
  const legs = CORE.map(([id]) => ({ id, k: K(id), w: Wl(id), mg: mar(id) }));
  legs.forEach(l => { l.p = mcnemarHarmP(l.k.lost, l.k.saved); });
  const h = holm(legs.map(l => l.p));
  legs.forEach((l, i) => { l.down = outcome({ b: l.k.lost, c: l.k.saved, N: l.k.N, margin: l.mg, pHolm: h[i], level: ALPHA }); l.u = guardedU(l.k); l.read = readSafe(l); });
  const read = legs.every(l => l.read === 'SAFE') ? 'HELD' : legs.some(l => l.read === 'HARM') ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { legs, read };
}

const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`, f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-');
const iv = p => `${f3(p.d)} (${p.lo.toFixed(3)} to ${p.hi.toFixed(3)})`;
const surv = T => { let k = 0; for (let i = 0; i < T.N; i++) k += T.survived[i]; return 100 * k / T.N; };
export function reading(TR, SH, tagP, jobs, out = console.log, { b = B } = {}) {
  const cfgOf = (id, X, Y) => { const u = tagP(id); return { lambda: Number(P.field(u.ran, 'lambda')), floor: Math.min(...P.field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb: Number(CORE.find(c => c[0] === id)[2]), spendYears: F.spendYears(X, Y) }; };
  const per = (id, X, Y) => { const c = cfgOf(id, X, Y), x = A.wholePaths(X, c), y = A.wholePaths(Y, c); return Array.from(y, (v, j) => v - x[j]); };
  const leg = (id, X, Y) => A.wholeLeg(X, Y, cfgOf(id, X, Y), ALPHA);
  const O = TR['S194|P:OPEN2|node'], W = TR['S194|P:WA|node'], L = TR['S194|OPEN2+L|node'], OO = TR['S194|OPEN2+O|node'];
  const s1 = splitItem(per('S194', O, L), per('S194', O, W), { b });
  const i2 = item2(id => cells(TR[`${id}|P:TS+J|all`].survived, TR[`${id}|TS+J+L|all`].survived), id => leg(id, TR[`${id}|P:TS+J|all`], TR[`${id}|TS+J+L|all`]), id => marginFor(surv(TR[`${id}|P:TS+J|all`])));
  out(`7AU: THE LEARNER AT P'S SETTINGS (predictions/diag-7au.md): P's three units at switchCharge 0.001 (margin 0, TS+J, 30x5), the learner (learn.mjs: one risky pot a year) and the oracle against P's own runs; ${WN} paths of seed ${SEED} at S194's bad node, ${NA} across all worlds; P's records through P's gate; this run's solves and its OPEN2, WA and TS+J on ${IN} paths identical to P's`);
  const wl = (kind, rule) => { const j = jobs.find(x => x.kind === kind && x.id === 'S194'); return j && j.weights[rule] ? `${j.weights[rule].end.map(x => x.toFixed(3)).join(',')} (${j.weights[rule].updates.toFixed(1)} updates a path)` : '-'; };
  out(`\nITEM 1 (primary; the learner's share of S194's node slice): survival OPEN2 ${surv(O).toFixed(3)}, OPEN2+L ${surv(L).toFixed(3)}, WA ${surv(W).toFixed(3)} (OPEN2+O ${surv(OO).toFixed(3)}, reported); the whole score a path: the slice (WA less OPEN2) ${f3(s1.Wm)} (test p ${s1.pSlice.toExponential(2)}), the learner (OPEN2+L less OPEN2) ${f3(s1.Lm)}; the learner's share ${f2(s1.share)}${s1.note ? '' : `; Holm p: above two thirds ${s1.hU.toExponential(2)}, under a third ${s1.hD.toExponential(2)}`}; the learner's end weights at the node ${wl('node:L', 'OPEN2+L')}`);
  out(`  -> ${s1.read}${s1.note ? ` (${s1.note})` : ''} (HELD: learnable in time, more than two thirds recovered; FALSIFIED: not learnable in time, under a third)`);
  { const kL = cells(O.survived, L.survived), kW = cells(O.survived, W.survived), kO = cells(O.survived, OO.survived), dO = per('S194', O, OO);
    out(`  reported: by survival, the learner ${kL.saved} saved/${kL.lost} lost against OPEN2, WA ${kW.saved}/${kW.lost}, the oracle with OPEN2's opening ${kO.saved}/${kO.lost} (its whole score ${f3(mean(dO))} a path, ${Number.isFinite(s1.share) ? `${(mean(dO) / s1.Wm).toFixed(2)} of the slice` : '-'}); share by survival ${kW.saved - kW.lost ? ((kL.saved - kL.lost) / (kW.saved - kW.lost)).toFixed(2) : '-'}`); }
  out(`\nITEM 2 (no material harm across all worlds): TS+J+L against P's TS+J, ${NA} paths paired; survival by the exact rule (Holm over 3) and the guarded interval at the unit's margin, the whole score's lower end above -${MW}`);
  for (const l of i2.legs) out(`  ${l.id.padEnd(9)} ${l.k.saved} saved/${l.k.lost} lost of ${l.k.N} | survival ${f3(l.down.d)} (exact ${l.down.lo.toFixed(3)} to ${l.down.hi.toFixed(3)}; guarded ${l.u.lo.toFixed(3)} to ${l.u.hi.toFixed(3)}; margin ${l.mg}) ${l.down.outcome} | whole ${iv(l.w)} -> ${l.read}`);
  out(`  -> ${i2.read} (HELD when all three are SAFE; FALSIFIED when any is HARM)`);
  out('\nREPORTED: ACROSS ALL WORLDS, THE ORACLE (the bound) AND EVERY ARM BY LONG-RUN-SHIFT BIN (survival %, n; the shift under -0.866, between, above 0.866)');
  for (const [id] of CORE) {
    const T0 = TR[`${id}|P:TS+J|all`], TL = TR[`${id}|TS+J+L|all`], TO = TR[`${id}|TS+J+O|all`], sh = SH[`${id}|TS+J+L|all`], kO = cells(T0.survived, TO.survived);
    const bins = [[-Infinity, -BIN], [-BIN, BIN], [BIN, Infinity]].map(([lo, hi]) => { const idx = []; for (let i = 0; i < sh.length; i++) if (sh[i] >= lo && sh[i] < hi) idx.push(i); const s = T => (idx.length ? 100 * idx.reduce((t, i) => t + T.survived[i], 0) / idx.length : NaN); return `${f2(s(T0))}/${f2(s(TL))}/${f2(s(TO))} (n ${idx.length})`; });
    const j = jobs.find(x => x.kind === 'all:L' && x.id === id);
    out(`  ${id.padEnd(9)} TS+J+O ${kO.saved} saved/${kO.lost} lost, whole ${iv(leg(id, T0, TO))} | by bin TS+J/+L/+O: ${bins.join(' | ')} | end weights +L ${j.weights['TS+J+L'].end.map(x => x.toFixed(3)).join(',')}, +O ${j.weights['TS+J+O'].end.map(x => x.toFixed(3)).join(',')}`);
  }
  out(`\nOUTCOME: 1 ${s1.read}; 2 ${i2.read}`);
  return { s1, i2 };
}

/* PLANTED */
const REACHED = { 1: new Set(), 2: new Set() }, EDGES = [];
export function builtLog(o = {}) {
  const lines = [], ranP = id => `mix 3 pts 30 seed 7002 paths ${N} grid total30x5x5 lambda ${P.LAMBDA} levels 1,0.9,0.8 quad 5 tierState true bequestWeight ${CORE.find(c => c[0] === id)[2]} finalIntegral true bridgeRead x switchMargin 0 switchCharge 0.001`;
  for (const [kind, id, a, w] of JOBS) {
    if (o.skip === `${kind}|${id}`) continue;
    const L = `${a}/TS+J/MP/30x5/W${w}`;
    lines.push(`${id.padEnd(16)} case | job ${kind} ${a}/30x5/W${w} | lambda ${P.LAMBDA} tier own riskAbove auto mix 3 points 30 quad 5`);
    lines.push(`${''.padEnd(16)} solve ${L}: table ${o.table && id === 'S126' ? '91.0000' : '90.0000'} secs 100`);
    lines.push(`${''.padEnd(16)} ran ${L}: ${o.ran && id === 'bridge 4' ? ranP(id).replace('switchCharge 0.001', 'switchCharge 0.002') : ranP(id)}`);
    lines.push(`${''.padEnd(16)} gap ${L}: 1.0000e-3 opening 2,2`);
    lines.push(`${''.padEnd(16)} joint ${L}: true switchMargin ${o.margin && id === 'S126' ? '0.001' : '0'} switchCharge 0.001 scale 180000 cap 720000 deathTax 0 tier own riskAbove off`);
    lines.push(`${''.padEnd(16)} moves ${L}: best 3 2/2 stay 1 0/0 chosen 3 2/2 held 0/0`);
    lines.push(`${''.padEnd(16)} price ${L}: mixture 1.0e-1 like-for-like whole 1.0e-1 survival 1.0e-1`);
    for (let k = 0; k < 3; k++) if (!(o.noWorld && id === 'S126' && k === 2)) lines.push(`${''.padEnd(16)} world ${L} ${k} z 0.0000 weight 0.3333: whole 0.1 survival 0.1`);
    if (kind === 'node:L') {
      if (!o.noNode) lines.push(`${''.padEnd(16)} node ${L} 0 z -1.7321: OPEN2+L 92.0000 held0 ${o.held ? 3 : 0} OPEN2+O 93.0000 held0 0 paths ${o.nodePaths ? 8000 : WN} secs 10`);
      if (!o.noIdent) lines.push(`${''.padEnd(16)} ident ${L} 0 z -1.7321: OPEN2 91.0000 held0 0 WA 93.0000 held0 0 paths ${IN} secs 10`);
      for (const rule of NODE_RULES) {
        if (!(o.noWeights && rule === 'OPEN2+L')) lines.push(`${''.padEnd(16)} weights ${L} ${rule} world0: w-end 0.6000,0.3500,0.0500 updates 9.00`);
        for (let y = 1; y <= 10; y++) if (!(o.noLog && rule === 'OPEN2+O' && y === 7)) lines.push(`${''.padEnd(16)} log ${L} ${rule} year ${y}: held 10 fwdLeave 1 cellLeave 1 fwdHoldCellLeave 0 fwdLeaveCellHold 0`);
      }
      if (o.allOnNode) lines.push(`${''.padEnd(16)} all ${L}: TS+J+L 98.0000 held0 0 TS+J+O 98.5000 held0 0 paths ${NA} secs 10`);
    } else {
      if (!(o.noAll && id === 'bridge 4')) lines.push(`${''.padEnd(16)} all ${L}: TS+J+L 98.0000 held0 0 TS+J+O 98.5000 held0 0 paths ${o.allPaths && id === 'S126' ? 8000 : NA} secs 10`);
      if (!(o.noIdentAll && id === 'S194')) lines.push(`${''.padEnd(16)} ident-all ${L}: TS+J 98.0000 held0 0 paths ${IN} secs 10`);
      for (const rule of ALL_RULES) lines.push(`${''.padEnd(16)} weights ${L} ${rule} all: w-end 0.1700,0.6600,0.1700 updates 9.00`);
      if (o.nodeOnAll && id === 'bridge 4') lines.push(`${''.padEnd(16)} node ${L} 0 z -1.7321: OPEN2+L 92.0000 held0 0 OPEN2+O 93.0000 held0 0 paths ${WN} secs 10`);
    }
    if (o.foreign && id === 'S126') lines.push(`${''.padEnd(16)} solve OFF/TS+J/MP/30x5/W0.02: table 90.0000 secs 100`);
    if (!(o.noDone && kind === 'all:L' && id === 'S194')) lines.push(`${''.padEnd(16)} done ${kind} ${a}/30x5/W${w}`);
  }
  if (o.extra) lines.push(`S999             case | job all:L READER/30x5/W0 | lambda ${P.LAMBDA} tier own riskAbove auto mix 3 points 30 quad 5`);
  return lines.join('\n') + '\n';
}
function planted() {
  const cases = [];
  const base = parse(builtLog());
  const refOf = (ro = {}) => id => { const j = base.find(x => x.id === id); if (!j) return null; const t = { table: j.table, ran: j.ran, gap: j.gap, joint: j.joint, movesRaw: j.movesRaw, priceRaw: j.priceRaw, worlds: j.worlds }; if (ro.refGap && id === 'S194') t.gap = { ...t.gap, gap: '2.0000e-3' }; if (ro.refMoves && id === 'bridge 4') t.movesRaw = 'best 3 2/2 stay 1 0/0 chosen 1 0/0 held 0/0'; if (ro.refCap && id === 'S126') t.joint = { ...t.joint, cap: 1 }; if (ro.refNoWorld && id === 'S126') t.worlds = t.worlds.slice(0, 2); return t; };
  const refused = (o, ro = {}) => { try { return String(gate(parse(builtLog(o)), refOf(ro)).length > 0); } catch (e) { return `crash: ${e.message}`; } };
  { const bad = gate(base, refOf()); cases.push(['a built set gates clean', `${bad.length}${bad.length ? ` ${bad[0]}` : ''}`, '0']); }
  for (const [nm, o, ro] of [['a missing job', { skip: 'all:L|S126' }], ['an unregistered job', { extra: true }], ['a job not done', { noDone: true }], ['a ran line off P\'s', { ran: true }],
    ['a margin on the joint line', { margin: true }], ['a missing world line', { noWorld: true }], ['a missing world line that P lacks too', { noWorld: true }, { refNoWorld: true }], ['a solve table off P\'s', { table: true }], ['a gap off P\'s', {}, { refGap: true }],
    ['moves off P\'s', {}, { refMoves: true }], ['a cap off P\'s', {}, { refCap: true }], ['a missing node line', { noNode: true }], ['8,000 node paths', { nodePaths: true }],
    ['OPEN2+L holding the plan\'s tiers at year 0', { held: true }], ['a missing ident line', { noIdent: true }], ['a missing weights line', { noWeights: true }], ['a missing decision-log year', { noLog: true }],
    ['an all line on the node job', { allOnNode: true }], ['a missing all line', { noAll: true }], ['8,000 all-world paths', { allPaths: true }], ['a missing ident-all line', { noIdentAll: true }],
    ['a node line on an all-world job', { nodeOnAll: true }], ['a line with another unit\'s label', { foreign: true }]]) cases.push([`the gate refuses ${nm}`, refused(o, ro), 'true']);
  // the run identity
  { const T = n => ({ N: n, Y: 2, survived: Uint8Array.from({ length: n }, (_, i) => i % 2), level: Uint8Array.from({ length: 2 * n }, (_, i) => i % 3), tier: Uint8Array.from({ length: 2 * n }, (_, i) => i % 4) });
    const X = T(10), Y = T(12), Z = T(12); Z.tier[5] = 9; const Z2 = T(12); Z2.tier[21] = 9;   // past the first 10 paths' 20 tier bytes
    cases.push(['sameRuns: P\'s longer trace equal on the first paths', String(sameRuns(X, Y, 10)), 'true']);
    cases.push(['sameRuns: one tier byte off inside the first paths is refused', String(sameRuns(X, Z, 10)), 'false']);
    cases.push(['sameRuns: a byte off past the first paths is not read', String(sameRuns(T(12), Z2, 10)), 'true']); EDGES.push('a difference just past the identity paths');
    cases.push(['sameRuns: fewer paths than asked is refused', String(sameRuns(X, Y, 11)), 'false']);
    cases.push(['sameRuns: two equal runs both shorter than asked are refused', String(sameRuns(T(10), T(10), 11)), 'false']); EDGES.push('both runs shorter than the identity paths'); }
  // item 1 over built per-path differences (600 paths)
  { const n = 600, noise = j => 0.4 * Math.sin(j * 1.7), dW = Array.from({ length: n }, (_, j) => 0.3 + noise(j)), mk = f => Array.from({ length: n }, (_, j) => f(j));
    const r = (dl, dw = dW) => { const t = splitItem(dl, dw, { b: 2000 }); REACHED[1].add(t.read); return t; };
    cases.push(['item 1: the learner recovers all of the slice: HELD (learnable)', r(dW.slice()).read, 'HELD']);
    cases.push(['item 1: the learner recovers none: FALSIFIED (not learnable in time)', r(mk(j => 0.05 * Math.cos(j * 2.3))).read, 'FALSIFIED']);
    cases.push(['item 1: the learner recovers half: INCONCLUSIVE', r(mk(j => dW[j] / 2)).read, 'INCONCLUSIVE']);
    { const t = r(mk(j => (2 / 3) * dW[j])); cases.push(['item 1: exactly two thirds on every path: not HELD (the mean of dL - 2dW/3 is 0)', t.read, 'INCONCLUSIVE']); EDGES.push('the learner at exactly two thirds'); }
    { const t = r(mk(j => dW[j] / 3)); cases.push(['item 1: exactly a third on every path: not FALSIFIED', t.read, 'INCONCLUSIVE']); EDGES.push('the learner at exactly a third'); }
    cases.push(['item 1: the learner beyond WA (1.5 of the slice): HELD', r(mk(j => 1.5 * dW[j])).read, 'HELD']);
    cases.push(['item 1: the learner losing while WA gains: FALSIFIED', r(mk(j => -0.2 + 0.05 * Math.cos(j))).read, 'FALSIFIED']);
    { const t = r(dW.slice(), mk(j => noise(j))); cases.push(['item 1: no slice (WA level with OPEN2): INCONCLUSIVE, NO SLICE', `${t.read} ${t.note}`, 'INCONCLUSIVE NO SLICE']); EDGES.push('no slice to recover'); }
    { const t = r(mk(() => 0), mk(() => 0)); cases.push(['item 1: every difference 0: NO SLICE, not a crash', `${t.read} ${t.note}`, 'INCONCLUSIVE NO SLICE']); EDGES.push('all differences zero'); } }
  // item 2 on built cells and legs
  { const k = (lost, saved, n = 16000) => ({ a: n - lost - saved - 100, lost, saved, d: 100, N: n });
    const w = (d, h = 0.05) => ({ d, lo: d - h, hi: d + h, sd: d, rest: 0 });
    const run = (K, Wl) => { const I = item2(K, Wl, () => 0.25); REACHED[2].add(I.read); return I; };
    cases.push(['item 2: every leg level: HELD', run(() => k(3, 3), () => w(0)).read, 'HELD']);
    cases.push(['item 2: S194 loses 120 of 16,000 (harm): FALSIFIED', run(id => (id === 'S194' ? k(120, 0) : k(3, 3)), () => w(0)).read, 'FALSIFIED']);
    cases.push(['item 2: a whole score wholly below -MW on S126: FALSIFIED', run(() => k(3, 3), id => (id === 'S126' ? w(-0.4) : w(0))).read, 'FALSIFIED']);
    cases.push(['item 2: a whole score with its lower end at -0.3: INCONCLUSIVE', run(() => k(3, 3), id => (id === 'bridge 4' ? w(-0.2, 0.1) : w(0))).read, 'INCONCLUSIVE']);
    cases.push(['item 2: the learner gaining 100 paths: HELD (a gain is no harm)', run(id => (id === 'S194' ? k(0, 100) : k(3, 3)), () => w(0)).read, 'HELD']);
    { const I = run(() => k(0, 0), () => w(0)); cases.push(['item 2: no discordant path: HELD', I.read, 'HELD']); EDGES.push('no discordant path'); }
    { const I = run(() => k(3, 3), () => w(-MW + 0.05)); cases.push(['item 2: a whole score\'s lower end exactly at -MW: not SAFE, INCONCLUSIVE', I.read, 'INCONCLUSIVE']); EDGES.push('a whole interval ending exactly at -MW'); }
    { const I = run(id => (id === 'S126' ? k(60, 0) : k(3, 3)), () => w(0)); const l = I.legs.find(x => x.id === 'S126');
      cases.push(['item 2: 60 lost, none saved (0.375 points, past the 0.25 margin): never SAFE', String(l.read !== 'SAFE'), 'true']); }
    { const I = run(id => (id === 'S126' ? k(30, 0) : k(3, 3)), () => w(0)); const l = I.legs.find(x => x.id === 'S126'); cases.push(['item 2: 30 lost, none saved: the exact rule reads no material harm, the guarded interval\'s lower end under -0.25: INCONCLUSIVE', `${l.down.outcome} ${l.u.lo < -0.25} ${I.read}`, 'no material harm true INCONCLUSIVE']); }
    { const I = run(id => (id === 'S194' ? k(7, 1, 400) : k(3, 3)), () => w(0)); const l = I.legs.find(x => x.id === 'S194'); cases.push(['item 2: 7 lost against 1 saved of 400 (one-sided p 0.035, beyond the margin): Holm over three lifts it over 0.05, not harm: INCONCLUSIVE', `${l.p < 0.05} ${I.read}`, 'true INCONCLUSIVE']); EDGES.push('p at the Holm boundary'); }
    { const I = run(id => (id === 'S126' ? k(24, 0) : k(3, 3)), () => w(0)); cases.push(['item 2: 24 lost, none saved (0.15 points, inside the margin): SAFE', I.legs.find(x => x.id === 'S126').read, 'SAFE']); } }
  cases.push(['the jobs are audit-7au.mjs\'s: node:L on S194, all:L on the three units', (() => { const src = readFileSync(join(HERE, 'audit-7au.mjs'), 'utf8'); return String(/\['node:L', 'S194', 'off', 0\.02, 30, 5\], \.\.\.CORE\.map\(\(\[id, arm, w\]\) => \['all:L', id, arm, w, 30, 5\]\)/.test(src) && /switchMargin: 0, switchCharge: 0\.001/.test(src)); })(), 'true']);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export { logsOf };
/* P's records for the gate and the reading: P's jobs through P's gate, and the unit's core:P lines as 7au compares them */
export function pRefs(logsP) {
  const jobsP = Object.values(logsP).flatMap(P.parse), raw = Object.assign({}, ...Object.values(logsP).map(pRaw));
  const tagP = id => { const j = jobsP.find(x => x.kind === 'core:P' && x.id === id); return j ? j.tags.P : null; };
  const ref = (id, arm, w) => { const t = tagP(id), r = raw[`${id}|${arm}|${w}`]; return t && r ? { table: t.table, ran: t.ran, gap: t.gap, joint: t.joint, movesRaw: r.movesRaw, priceRaw: r.priceRaw, worlds: r.worlds } : null; };
  return { jobsP, tagP, ref };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2].map(i => `OUTCOMES REACHED: item ${i}: ${[...REACHED[i]].sort().join(', ')}`).join('\n')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const d = (k, name) => args[k] || join(HERE, 'results', name);
  const DIR = d(0, 'diag7au'), DIRP = d(1, 'diagP');
  const logs = logsOf(DIR), jobs = Object.values(logs).flatMap(parse);
  if (JOBS.some(([kind, id, a, w]) => !jobs.some(j => j.kind === kind && j.id === id && j.arm === a && j.w === w && j.done))) { console.log(`INCOMPLETE - ${jobs.filter(j => j.done).length} of ${JOBS.length} jobs done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const { R } = P.loadRefs(d(2, 'diag7ae'), d(3, 'diag7ad'), d(4, 'diag7ac'), d(5, 'diag7aa'), d(6, 'diag7af'), d(7, 'diag7ag'));
  const logsP = logsOf(DIRP);
  requireFairLogs(logsP, P.PRED);
  const { jobsP, tagP, ref } = pRefs(logsP);
  { const b = P.gate(jobsP, R); if (b.length) { console.log(`FAIR-TEST GATE (P): FAILED\n  ${b.join('\n  ')}`); process.exit(1); } }
  const bad = gate(jobs, ref);
  const { TR, SH } = bad.length ? { TR: {}, SH: {} } : loadTraces(jobs, DIR, P.stampOf(logs), jobsP, DIRP, P.stampOf(logsP), bad);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`FAIR-TEST GATE: passed - ${JOBS.length} jobs; P's records through P's gate; every job's solve lines P's (table, ran, gap, joint, moves, price, worlds); every line and trace present and agreeing with its log; today's OPEN2, WA and TS+J on ${IN} paths identical to P's; the learner's and the oracle's shifts the same paths`);
  reading(TR, SH, tagP, jobs);
}
