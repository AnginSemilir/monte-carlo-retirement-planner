/*
 * NS-COND: NSB RE-SCOPED (the deep review after NSB, deep-review-log.md 8 Oct 17:19 UK; items/NSB.md; PLAN.md NS-COND).
 * NSB's unit, arms, states and households (audit-nsb.mjs, copied): READER/TS+J/W0.02/PCLSI at 6 share points, 30 wealth
 * points, e3 off; BASE, and COV with the reader's tax and the coverage node; seed 7002; S370, bridge 4 and S126
 * (deciding), S130 and S128 (incidence). No solver change: every read is assembled here from the solved tables.
 * A node is DEAD when its stored survival log-odds are at or below DEAD_LS (-11.5, grid.js l.436's constant) and its
 * stored bequest is 0; ON THE SHARE AXIS (DS) when its share row holds a node not dead; a dead node off it (X0) lies on a
 * row dead throughout. A node at or below DEAD_LS that keeps a bequest (KEPT) is not dead here: the bequest read takes its
 * value (O128). A dead node is FAIL when every move at it fails (solve.js l.1015: survival 0, bequest 0, the shortfall
 * the failure cost) and NEXT when its chosen move survives the year into next-year corners that read as all but dead.
 * THE TABLE CHECKS run right after the solves, before any read and before any item line (the deep review's structural
 * answer, [T:c-preflight]):
 *   DEADSTEP   every share-axis dead node of every reader year after the first, every world and layer, recomputed one
 *              step at the node holding its layer's tier: a NEXT node's survival, bequest and shortfall are the chosen
 *              move's (the joint chooser; survival within 1e-9, bequest and shortfall within 1e-9 relative); a FAIL node
 *              holds the clamp and bequest 0, and every FAIL node of an arm's year stores one shortfall (the failure cost:
 *              the unit charges no switch). Each slice prints its clean error, its tolerance and the plant's effect;
 *   noAccessDead  some node with no accessible money is classed dead (it ran on the nodes it must catch);
 *   the census (reported): per arm and year the dead, DS, FAIL, NEXT, X0 and KEPT counts, and KEPT's largest bequest
 *              over its survival times the year's largest stored bequest.
 * Along BASE's own paths, in each world k, per arm, at every reader year t after the first move:
 *   ITEM 1 (NSL-UNCOND): the bequest read at BASE's state through the layer of BASE's previous move, decomposed over its
 *     corners: wd (DS), w0x (X0), wL (the rest) and wK (KEPT, within wL); B_L, the live corners' bequest over wL; S_L,
 *     their survival (probability) over wL; s1 and bE, the one-step survival and bequest of the arm's own move there
 *     (XAS-R2 item 3's construction); sR, the arm's own survival read at the state (readValues out[0], the reader's in a
 *     reader year); bC, the copy rule's read (item 2's swapped arrays, read at year t). The reducer forms elive = B_L/bE
 *     - 1, rho = S_L/s1, the copy read's error and the conditioned read (B_L/S_L) sR's.
 *   ITEM 2 and ITEM 3: NSB's, unchanged.
 * Read-time self-checks, each refusing the run (NSB's): replicaNS, wdRead, restore; replica, rebuild, nodes and fine (item 3,
 * BASE). No item line is printed unless every check passed and ran where it must.
 * NSCOND_PLANT, each a fault one check must refuse: 'deadshift' (wdRead), 'norestore' (restore), 'rebuild' (rebuild),
 * 'deadh' moves one FAIL node's stored shortfall by 1e-3 of itself (DEADSTEP FAIL), 'deadnext' moves one NEXT node's
 * stored survival by 1% (DEADSTEP NEXT). NSCOND_TABLES=1 runs the table checks and the census alone (the preflight at the
 * registered grid): no read, no item line, no file. NSCOND_BLIND=1 (build checks before registration) runs every read and
 * check and writes no item line and no file.
 *   node research/solver/audit-nscond.mjs [points=30] [paths a world=2000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction, scoreMoves, gaussHermite, NODES } from '../../src/solver/solve.js';
import { readValues, toVec, shareLocOf } from '../../src/solver/grid.js';
import { buildReaderTable, orderChance } from '../../src/solver/reader.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const POINTS = Number(process.argv[2] || 30), NPW = Number(process.argv[3] || 2000);
if (!(POINTS >= 4) || !(NPW >= 1)) { console.error(`audit-nscond: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-nscond: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
const OUT = process.env.DIAGNSCOND_OUT || join(HERE, 'results', 'diagnscond');
const PLANT = process.env.NSCOND_PLANT || '', TABLES = !!process.env.NSCOND_TABLES;
if (PLANT && !['deadshift', 'norestore', 'rebuild', 'deadh', 'deadnext'].includes(PLANT)) { console.error(`audit-nscond: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const NF = 41, GHF = gaussHermite(NF);
const DEAD_LS = -11.5;   // grid.js l.436, copied
// solve.js realAt (l.160), copied as audit-xasr2.mjs copies it: each pot's real rate at a draw z, for the fine quadrature
function realAt(c, z, out, act, t) {
  const Rr = act ? act.real : c.real, V = act ? act.volEffAt[t] : c.volEffAt[t];
  for (let i = 0; i < 4; i++) out[i] = Math.exp(Math.log(1 + Rr[i]) + V[i] * z) - 1;
  return out;
}
const LAMBDA = 0.0223606797749979, W = 0.02, SH = 6;
const CLAMP = process.env.SOLVER_CLAMP ? Number(process.env.SOLVER_CLAMP) : 1e-6;   // grid.js CLAMP, copied
const clampP = v => (v < CLAMP ? CLAMP : v > 1 - CLAMP ? 1 - CLAMP : v);
const expit = x => 1 / (1 + Math.exp(-x));

// audit-xasr2.mjs's households (bridge 4 built from S126), with S130 and S128 from the library for incidence
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant(name, { a0 = 0.85, bridge = 2, scale = 1 } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0) * scale;
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => {
    const b = E.num(a.balance, 0);
    if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) };
    if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) };
    return a;
  });
  const nmpa = E.num(p.demographics.privatePensionAge, 58);
  const age = nmpa - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return { id: name, plan: p };
}
export const UNITS = ['S370', 'bridge 4', 'S126', 'S130', 'S128'];
export const DECIDING = ['S370', 'bridge 4', 'S126'];
const BUILT = { 'bridge 4': { bridge: 4 } };
const caseOf = id => (BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
export const ARMS = [['BASE', {}], ['COV', { readerTax: true, coverage: true }]];
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
const L = 'READER/TS+J/W0.02/PCLSI';
console.log(`NS-COND: ${L} at ${SH} share points, ${POINTS} wealth points, ${NPW} paths a world (seed ${SEED}); arms BASE and COV; the live corners' bequest at the share-axis dead reads${TABLES ? ' (the table checks and census alone)' : ''}; ${UNITS.length} households; part ${pk}/${pn}`);
const f4 = x => (Number.isFinite(x) ? x.toExponential(4) : 'NaN');

// grid.js locInto and locLinInto and the bucket helpers, copied from audit-xasr2.mjs; the replica checks hold them
function locLog(ax, v) {
  if (!(v > 0)) return [0, 0];
  if (v <= ax.pts[1]) return [0, v / ax.pts[1]];
  if (v >= ax.hi) return [ax.n - 2, 1];
  const f = 1 + (Math.log(v) - ax.lg) / ax.step, i = Math.min(ax.n - 2, Math.max(1, Math.floor(f)));
  return [i, f - i];
}
function locLin(ax, v) { const f = (v <= 0 ? 0 : v >= 1 ? 1 : v) * (ax.n - 1), i = Math.min(ax.n - 2, Math.floor(f)); return [i, f - i]; }
const nearest = (arr, v) => { let best = 0, bd = Infinity; for (let i = 0; i < arr.length; i++) { const d = Math.abs(arr[i] - v); if (d < bd) { bd = d; best = i; } } return best; };
const nearestPclsStrict = (arr, v) => { if (!(v > 0)) return 0; let best = 1, bd = Infinity; for (let i = 1; i < arr.length; i++) { const d = Math.abs(arr[i] - v); if (d < bd) { bd = d; best = i; } } return best; };
const bracket = (arr, v) => {
  if (v <= arr[0]) return { i: 0, w: 0 };
  const n = arr.length;
  if (v >= arr[n - 1]) return { i: n - 2 < 0 ? 0 : n - 2, w: n > 1 ? 1 : 0 };
  let k = 0; while (k < n - 2 && v > arr[k + 1]) k++;
  const lo = arr[k], hi = arr[k + 1];
  return { i: k, w: hi > lo ? (v - lo) / (hi - lo) : 0 };
};
// the corner rows of a read in total-wealth coordinates (audit-xasr2.mjs rowsOf): each row a wealth node, a split node and
// an allowance node, with its weight, its share bracket [ii, ii + 1] and the weight on ii + 1
function rowsOf(g, s, yr) {
  if (g.mode !== 'total' || g.gainInterp || g.pclsSeg) throw new Error('audit-nscond: the replica covers the total-wealth grid without gain interpolation or an allowance segment');
  const Wt = s[0] + s[1] + s[2], rest = Wt - s[0], a = Wt > 0 ? s[0] / Wt : 0;
  const [ip, wp] = locLog(g.axes.W, Wt), [it, wt] = locLin(g.axes.b, rest > 0 ? s[1] / rest : 0);
  const pf = Math.min(1, s[4] / g.m.P.lsa), cb = g.pclsInterp ? bracket(g.pcls, pf) : null;
  const ic = cb ? cb.i : g.pclsStrict ? nearestPclsStrict(g.pcls, pf) : nearest(g.pcls, pf), cw = cb ? cb.w : 0;
  const ig = nearest(g.gain, s[3]);
  const rows = [];
  for (const dc of cb ? [0, 1] : [0]) for (const dt of [0, 1]) for (const dp of [0, 1]) {
    const w = (dp ? wp : 1 - wp) * (dt ? wt : 1 - wt) * (cb ? (dc ? cw : 1 - cw) : 1);
    let ii, wa;
    if (g.cov) { const r = shareLocOf(g, ip + dp, a, yr); ii = r.i; wa = r.w; } else [ii, wa] = locLin(g.axes.a, a);
    rows.push({ ip: ip + dp, it: it + dt, ig, ic: ic + dc, w, ii, wa });
  }
  return { a, rows };
}
function vecAt(g, ip, a, it, ig, ic, out) {
  const Wt = g.axes.W.pts[ip], b = g.axes.b.pts[it], pen = a * Wt, rest = Wt - pen, isa = b * rest;
  out[0] = pen; out[1] = isa; out[2] = rest - isa; out[3] = g.gain[ig]; out[4] = g.pcls[ic] * g.m.P.lsa; out[5] = g.pcls[ic] > 0 ? 1 : 0; out[6] = -1;
  return out;
}

UNITS.forEach((id, ui) => {
  if (ui % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`audit-nscond: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3 | arms ${ARMS.map(a => a[0]).join(',')}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const R = {};
  for (const [key, o] of ARMS) {
    const t0 = Date.now();
    // e3 off: coverage refuses e3, and XAS's unit ran without it (audit-xasr2.mjs)
    const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, shares: SH, bridgeRead: 'reader', bequestWeight: W, tierState: true, jointWorlds: true, pclsInterp: true, e3: false, ...o });
    if (!r.meta.tierState || !r.meta.jointWorlds || r.g.pclsInterp !== true || r.meta.e3) { console.error(`audit-nscond: ${id} ${key} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds} pclsInterp ${r.g.pclsInterp}`); process.exit(2); }
    if (!!o.readerTax !== !!(r.g.reader && r.g.reader.tax) || !!o.coverage !== !!r.g.cov) { console.error(`audit-nscond: ${id} ${key}: the arm's settings did not take`); process.exit(2); }
    if (r.meta.readerRef === 'order') { console.error(`audit-nscond: ${id} ${key}: solved on the order reference`); process.exit(2); }
    R[key] = r;
    console.log(`${''.padEnd(16)} solve ${key}: secs ${Math.round((Date.now() - t0) / 1000)} pts ${r.g.np} shares ${r.g.ni} readerYears ${r.g.reader ? r.g.reader.years.reduce((t, x) => t + (x ? 1 : 0), 0) : 0} readerTax ${r.meta.readerTax || '-'} coverage ${r.meta.coverage ? JSON.stringify(r.meta.coverage) : '-'}`);
  }
  const base = R.BASE, m = base.m, T = m.ctx.totalYears, K = base.worlds.length;
  const STEP = new Set(R.COV.g.reader && R.COV.g.reader.tax ? R.COV.g.reader.tax.map((x, t) => (x ? t : -1)).filter(t => t >= 0) : []);
  const RYof = r => new Set(r.g.reader ? [...r.g.reader.years].map((x, t) => (x ? t : -1)).filter(t => t >= 0) : []);
  const RY = RYof(base);
  if ([...RYof(R.COV)].join() !== [...RY].join()) { console.error(`audit-nscond: ${id}: the arms' reader years differ`); process.exit(2); }
  const BEFORE = new Set([...RY].filter(t => STEP.has(t + 1) && !STEP.has(t)));
  console.log(`${''.padEnd(16)} ran ${L}: mix ${K} pts ${POINTS} seed ${SEED} paths ${NPW * K} worlds ${K} steps ${[...STEP].join(',') || 'none'} before ${[...BEFORE].join(',') || 'none'} readerYears ${[...RY].join(',') || 'none'}`);
  const paths = E.pathsForSeed(SEED, NPW, T);
  const NA = Math.max(...ARMS.map(([a]) => R[a].actions.length));
  const SC = new Float64Array(NA), TX = new Float64Array(NA), BQ = new Float64Array(NA), SV = new Float64Array(NA), RD4 = new Float64Array(4), RDD = new Float64Array(4);
  const ZERO = () => ({ replicaNS: 0, replicaNSBad: 0, wdRead: 0, wdReadBad: 0, deadstepFail: 0, deadstepFailBad: 0, deadstepNext: 0, deadstepNextBad: 0, noAccessDead: 0, restore: 0, restoreBad: 0, replica: 0, replicaBad: 0, rebuild: 0, rebuildBad: 0, nodes: 0, nodesBad: 0, fine: 0, fineBad: 0 });
  const CHK = Object.fromEntries(ARMS.map(([a]) => [a, ZERO()]));
  const layersOf = tab => (tab.tsLayers ? tab.tsLayers : [tab]);
  const layerOf = (tab, prevAi) => (tab.tsLayers ? tab.tsLayers[tab.tsLayerOf[prevAi]] : tab);
  const ljOf = (tab, prevAi) => (tab.tsLayerOf ? tab.tsLayerOf[prevAi] : 0);
  const { np, nt } = base.g;

  // THE DEAD NODES of an arm's layer at year t (lazily, once): the 0/1 indicator of every dead node (D), of the share-axis
  // dead (DS: a dead node whose share row holds a live node), its counts, and the swapped arrays of item 2 (bequest,
  // resilience and shortfall at each share-axis dead node taken from the nearest live node on its share row)
  const DEAD = new Map(), NOACC = new Map();   // NOACC: the nodes with no accessible money by arm and year, dead and alive
  const LS_CLAMP = Math.log(CLAMP / (1 - CLAMP));
  const deadOf = (a, k, lj, t) => {
    const key = `${a}|${k}|${lj}|${t}`;
    let d = DEAD.get(key);
    if (d) return d;
    const r = R[a], g = r.g, Ln = layersOf(r.mix.tables[k])[lj], ls = Ln.lsurv[t], bq = Ln.beq[t], n = ls.length, ni = g.ni, NG = g.gain.length, NCL = g.pcls.length;
    const D = new Float64Array(n);
    let nd = 0;
    for (let i = 0; i < n; i++) if (ls[i] <= DEAD_LS && bq[i] === 0) { D[i] = 1; nd++; }
    // noAccess (reported): the nodes with no accessible money, dead or alive, by year
    const v = new Float64Array(7), C = CHK[a];
    for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ii = 0; ii < ni; ii++) for (let ip = 0; ip < np; ip++) {
      toVec(g, ip, ii, it, ig, ic, v, t);
      if (v[1] + v[2] > 0) continue;
      const i = g.index(ip, ii, it, ig, ic), na = NOACC.get(`${a}|${t}`) || { dead: 0, alive: 0 };
      if (D[i]) { na.dead++; C.noAccessDead++; } else na.alive++;
      NOACC.set(`${a}|${t}`, na);
    }
    // the share-axis dead, and the swap: the copy rule along the share row, lower side first at each distance
    const DS = new Float64Array(n), sw = { beq: Float64Array.from(bq), short: Float64Array.from(Ln.short[t]), lresil: Float64Array.from(Ln.lresil[t]) };
    let copied = 0, nds = 0;
    for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ip = 0; ip < np; ip++) {
      let live = false;
      for (let ii = 0; ii < ni; ii++) if (!D[g.index(ip, ii, it, ig, ic)]) { live = true; break; }
      if (live) for (let ii = 0; ii < ni; ii++) { const i = g.index(ip, ii, it, ig, ic); if (D[i]) { DS[i] = 1; nds++; } }
    }
    for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ip = 0; ip < np; ip++) for (let ii = 0; ii < ni; ii++) {
      const i = g.index(ip, ii, it, ig, ic);
      if (!DS[i]) continue;
      for (let dd = 1; dd < ni; dd++) {
        const lo = ii - dd, hi = ii + dd, src = lo >= 0 && !D[g.index(ip, lo, it, ig, ic)] ? g.index(ip, lo, it, ig, ic) : hi < ni && !D[g.index(ip, hi, it, ig, ic)] ? g.index(ip, hi, it, ig, ic) : -1;
        if (src >= 0) { sw.beq[i] = bq[src]; sw.short[i] = Ln.short[t][src]; sw.lresil[i] = Ln.lresil[t][src]; copied++; break; }
      }
    }
    d = { D, DS, nd, nds, copied, sw };
    DEAD.set(key, d);
    return d;
  };
  // swap year t's arrays of every world and layer of arm a for their item-2 copies; returns the restore
  const swapIn = (a, t) => {
    const saved = [];
    R[a].mix.tables.forEach((tab, k) => layersOf(tab).forEach((Ln, lj) => {
      const { sw } = deadOf(a, k, lj, t);
      saved.push([Ln, Ln.beq[t], Ln.short[t], Ln.lresil[t]]);
      Ln.beq[t] = sw.beq; Ln.short[t] = sw.short; Ln.lresil[t] = sw.lresil;
    }));
    return () => {
      const C = CHK[a];
      for (const [Ln, b, s, rl] of saved) {
        if (PLANT !== 'norestore') { Ln.beq[t] = b; Ln.short[t] = s; Ln.lresil[t] = rl; }
        C.restore++; if (Ln.beq[t] !== b || Ln.short[t] !== s || Ln.lresil[t] !== rl) C.restoreBad++;
      }
    };
  };
  // every choice but the path's own leaves the chooser's taxable-account hold as it found it (audit-xasr2.mjs's rule)
  const choose = (r, st, t, held) => { const gh = r.giaHold, ai = chooseAction(r, st, t, held); r.giaHold = gh; return ai; };
  // one step for move ai on table tab: [survival, bequest, shortfall], NaN for a failing move (XAS-R2 item 3)
  const oneStep = (tab, st, t, held, ai) => {
    scoreMoves(tab, st, t, SC, TX, BQ, held, null, SV);
    if (SC[ai] === -Infinity) return [0, NaN, NaN];
    const s1 = SC[ai], bq = BQ[ai], sv = SV[ai], wR0 = tab.wR;
    tab.wR = 0;
    try { scoreMoves(tab, st, t, SC, TX, BQ, held, null, SV); } finally { tab.wR = wR0; }
    return [sv, bq, sv + tab.wB * bq - SC[ai], s1];
  };

  // ITEM 1's read at a state, per arm: the bequest and shortfall reads, wd, hD and the class (NSB's), and the
  // decomposition: w0x (dead off the share axis), wL (every other corner), wK (KEPT, within wL), B_L and S_L (the live
  // corners' bequest and survival over wL), sR (the arm's own survival read) and bC (the copy rule's read)
  const nsRead = (a, k, t, st, prevAi) => {
    const r = R[a], g = r.g, tab = r.mix.tables[k], Ln = layerOf(tab, prevAi), lj = ljOf(tab, prevAi), C = CHK[a];
    readValues(g, Ln.lsurv[t], Ln.beq[t], st, RD4, Ln.lresil[t], Ln.short[t], t);
    const sR = RD4[0];
    const { D: DA, DS: D, sw } = deadOf(a, k, lj, t), { rows } = rowsOf(g, st, t), nA = g.axes.a.n;   // D here: the share-axis dead
    const ls = Ln.lsurv[t], bq = Ln.beq[t];
    let b = 0, hh = 0, wd = 0, hD = 0, ws = 0, w0x = 0, wl = 0, wK = 0, bl = 0, sl = 0, bC = 0;
    for (const q of rows) {
      const iL = g.index(q.ip, q.ii, q.it, q.ig, q.ic), iH = g.index(q.ip, q.ii + 1, q.it, q.ig, q.ic), wL = q.w * (1 - q.wa), wH = q.w * q.wa;
      b += wL * bq[iL] + wH * bq[iH]; hh += wL * Ln.short[t][iL] + wH * Ln.short[t][iH]; ws += q.w;
      const dL = PLANT === 'deadshift' ? D[iH] : D[iL], dH = PLANT === 'deadshift' ? D[iL] : D[iH];
      wd += wL * dL + wH * dH; hD += wL * dL * Ln.short[t][iL] + wH * dH * Ln.short[t][iH];
      bC += wL * sw.beq[iL] + wH * sw.beq[iH];
      for (const [i, w] of [[iL, wL], [iH, wH]]) {
        if (w === 0) continue;
        if (DA[i]) { if (!D[i]) w0x += w; continue; }
        wl += w; bl += w * bq[i]; sl += w * expit(ls[i]);
        if (ls[i] <= DEAD_LS) wK += w;
      }
    }
    C.replicaNS++; if (!(Math.abs(b - RD4[1]) <= 1e-9 * Math.max(1, Math.abs(RD4[1])) && Math.abs(hh - RD4[3]) <= 1e-9 * Math.max(1, Math.abs(RD4[3])))) C.replicaNSBad++;
    readValues(g, Ln.lsurv[t], D, st, RDD, null, null, t);
    C.wdRead++; if (!(Math.abs(wd - RDD[1]) <= 1e-12)) C.wdReadBad++;
    const top = rows.every(q => q.ii === nA - 2) ? 1 : rows.every(q => q.ii < nA - 2) ? 0 : -1;
    const n = ws > 0 ? ws : 1;
    return { bR: RD4[1], hR: RD4[3], wd: wd / n, hD, top, w0x: w0x / n, wL: wl / n, wK: wK / n, BL: wl > 0 ? bl / wl : NaN, SL: wl > 0 ? sl / wl : NaN, sR, bC };
  };

  // ITEM 3: the reader table rebuilt at read time (once a world, layer and year), on the solve's own reference (the
  // rebuild check) and on the menu-order reference (solve.js l.654-677, the readerRef 'order' branch, copied)
  const orders = [...new Set(base.actions.map(x => x.steps.filter(y => y === 'isa' || y === 'cash' || y === 'other').map(y => (y === 'other' ? 'gia' : y)).join(',')))].map(x => x.split(','));
  const REB = new Map();
  const rebuilt = (k, lj, t) => {
    const key = `${k}|${lj}|${t}`;
    let o = REB.get(key);
    if (o) return o;
    const g = base.g, tab = base.mix.tables[k], Ln = layersOf(tab)[lj], ls = Ln.lsurv[t], RD = g.reader.of.get(ls), sch = RD && RD.chance.schedule;
    if (!sch || sch.t !== t || sch.k !== k) throw new Error(`audit-nscond: ${id}: no reference schedule at world ${k} year ${t}`);
    const Sc = new Float64Array(ls.length);
    for (let i = 0; i < ls.length; i++) Sc[i] = 1 / (1 + Math.exp(-ls[i]));
    const act = tab.c.acts[sch.ai0], rate = [];
    for (let j = t; j < t + sch.bills.length - 1; j++) rate.push({ isa: [act.real[1], act.volEffAt[j][1]], gia: [act.real[2], act.volEffAt[j][2]], cash: [act.real[3], act.volEffAt[j][3] || 0] });
    const ordChance = orderChance(sch.bills, g.reader.weights, rate, orders);
    const own = buildReaderTable(g, Sc, PLANT === 'rebuild' ? ordChance : RD.chance, null, t), C = CHK.BASE;
    for (let i = 0; i < ls.length; i++) { C.rebuild++; if (!(own.c[i] === RD.c[i] && own.R[i] === RD.R[i] && own.p[i] === RD.p[i])) C.rebuildBad++; }
    const ord = buildReaderTable(g, Sc, ordChance, null, t);
    o = { RD, ord: { ...ord, chance: ordChance } };
    REB.set(key, o);
    return o;
  };
  // the node builder (audit-xasr2.mjs nodeS, nodeSF): the chooser's move at the node across the mixture holding `held`,
  // each world's survival of it, at the solve's 5 points or at QZ/QW
  const VEC = new Float64Array(7), SC2 = new Float64Array(NA), TX2 = new Float64Array(NA), BQ2 = new Float64Array(NA), SV2 = new Float64Array(NA);
  const nodeS = (r, vec, t, held) => {
    const ai = choose(r, vec, t, held);
    return r.mix.tables.map(tab => { scoreMoves(tab, vec, t, SC2, TX2, BQ2, held, null, SV2); return clampP(SC2[ai] === -Infinity ? 0 : SV2[ai]); });
  };
  const nodeSF = (r, vec, t, held, QZ, QW) => {
    const ai = choose(r, vec, t, held);
    return r.mix.tables.map(tab => {
      const act = tab.c.acts[ai], nr = QZ.map(z => realAt(tab.c, z, new Float64Array(4), act, t)), qw0 = tab.quadWeights;
      tab.quadWeights = QW || qw0;
      try { scoreMoves(tab, vec, t, SC2, TX2, BQ2, held, { ai, nr, act }, SV2); } finally { tab.quadWeights = qw0; }
      return clampP(SC2[ai] === -Infinity ? 0 : SV2[ai]);
    });
  };
  const ROW = new Map();
  // ITEM 3's reads at a state (BASE): rr, ro, vb, vb41 and the class
  const ybReads = (k, t, st, prevAi, held) => {
    const g = base.g, tab = base.mix.tables[k], Ln = layerOf(tab, prevAi), lj = ljOf(tab, prevAi), ls = Ln.lsurv[t], C = CHK.BASE;
    const { RD, ord } = rebuilt(k, lj, t), { a, rows } = rowsOf(g, st, t), nA = g.axes.a.n, acc = st[1] + st[2];
    const top = rows.every(q => q.ii === nA - 2) ? 1 : rows.every(q => q.ii < nA - 2) ? 0 : -1;
    const pr = RD.chance(acc), po = ord.chance(acc);
    let cc = 0, rr = 0, co = 0, ro = 0, cB = 0, rB = 0, cF = 0, rF = 0;
    const hk = held ? `${held.pen || 0}/${held.isa || 0}/${held.gia || 0}` : '-';
    for (const q of rows) {
      const iL = g.index(q.ip, q.ii, q.it, q.ig, q.ic), iH = g.index(q.ip, q.ii + 1, q.it, q.ig, q.ic);
      const cL = RD.c[iL], cH = RD.c[iH], rL = RD.R[iL], rH = RD.R[iH];
      const c0 = (1 - q.wa) * cL + q.wa * cH, r0 = (1 - q.wa) * rL + q.wa * rH;
      cc += q.w * c0; rr += q.w * r0;
      co += q.w * ((1 - q.wa) * ord.c[iL] + q.wa * ord.c[iH]); ro += q.w * ((1 - q.wa) * ord.R[iL] + q.wa * ord.R[iH]);
      if (top !== 1 || q.w === 0) { cB += q.w * c0; rB += q.w * r0; cF += q.w * c0; rF += q.w * r0; continue; }
      const key = `${hk}|${t}|${lj}|${q.ip}|${q.it}|${q.ig}|${q.ic}`;
      let row = ROW.get(key);
      if (!row) {
        // the row's nodes: the cell's real lower and top nodes (the nodes check), its midpoint at 5 points and the lower
        // node and midpoint at 41 (the fine check at the lower node)
        const vL = toVec(g, q.ip, q.ii, q.it, q.ig, q.ic, new Float64Array(7), t), real = [q.ii, q.ii + 1].map(ii => nodeS(base, toVec(g, q.ip, ii, q.it, q.ig, q.ic, VEC, t), t, held));
        base.mix.tables.forEach((tb, kk) => {
          const L2 = layerOf(tb, prevAi);
          [q.ii, q.ii + 1].forEach((ii, x) => { const i = g.index(q.ip, ii, q.it, q.ig, q.ic); C.nodes++; if (!(Math.abs(real[x][kk] - expit(L2.lsurv[t][i])) <= 1e-9)) C.nodesBad++; });
        });
        const aLo = vL[0] / (vL[0] + vL[1] + vL[2] || 1), aM = (aLo + 1) / 2, vM = vecAt(g, q.ip, aM, q.it, q.ig, q.ic, new Float64Array(7));
        const sM = nodeS(base, vM, t, held), sL41 = nodeSF(base, vL, t, held, GHF.nodes, GHF.weights), sM41 = nodeSF(base, vM, t, held, GHF.nodes, GHF.weights);
        const sL5 = nodeSF(base, vL, t, held, NODES, null);
        base.mix.tables.forEach((_, kk) => { C.fine++; if (!(Math.abs(sL5[kk] - real[0][kk]) <= 1e-9)) C.fineBad++; });
        row = { aLo, aM, accL: vL[1] + vL[2], accM: vM[1] + vM[2], sM, sL41, sM41 };
        ROW.set(key, row);
      }
      // vb (XAS-R2's): the midpoint supported where its chance is at least 0.5, else the reader's copy (the lower node's c)
      const piece = (cl, rl, cm, rm, ch, rh) => { if (a <= row.aM) { const l = (a - row.aLo) / (row.aM - row.aLo); return [(1 - l) * cl + l * cm, (1 - l) * rl + l * rm]; } const l = (a - row.aM) / (1 - row.aM); return [(1 - l) * cm + l * ch, (1 - l) * rm + l * rh]; };
      const pM = RD.chance(row.accM), supM = pM >= 0.5, pL = RD.p[iL], pH = RD.p[iH];
      const cM = supM ? Math.min(1, Math.max(0, row.sM[k] / pM)) : cL, rM = row.sM[k] - pM * cM;
      const [cb_, rb_] = piece(cL, rL, cM, rM, cH, rH);
      cB += q.w * cb_; rB += q.w * rb_;
      // vb41: the lower node's c and R from its 41-point survival where it is supported (else its copied c kept), the
      // midpoint's from its 41-point survival, the top node's copied c following the lower node's
      const cL41 = pL >= 0.5 ? Math.min(1, Math.max(0, row.sL41[k] / pL)) : cL, rL41 = row.sL41[k] - pL * cL41;
      const cM41 = supM ? Math.min(1, Math.max(0, row.sM41[k] / pM)) : cL41, rM41 = row.sM41[k] - pM * cM41;
      const cH41 = cH === cL ? cL41 : cH, rH41 = expit(ls[iH]) - pH * cH41;
      const [cf_, rf_] = piece(cL41, rL41, cM41, rM41, cH41, rH41);
      cF += q.w * cf_; rF += q.w * rf_;
    }
    const rrv = clampP(pr * cc + rr);
    readValues(g, ls, Ln.beq[t], st, RD4, Ln.lresil[t], Ln.short[t], t);
    C.replica++; if (!(Math.abs(rrv - RD4[0]) <= 1e-12)) C.replicaBad++;
    return { top, rr: rrv, ro: clampP(po * co + ro), vb: clampP(pr * cB + rB), vb41: clampP(pr * cF + rF) };
  };

  const X1 = { k: [], p: [], t: [], step: [], arms: Object.fromEntries(ARMS.map(([a]) => [a, { top: [], wd: [], bR: [], bE: [], hR: [], hE: [], hD: [], agree: [], w0x: [], wL: [], wK: [], BL: [], SL: [], s1: [], sR: [], bC: [] }])) };
  const X2 = { k: [], p: [], s: [], arms: Object.fromEntries(ARMS.map(([a]) => [a, { a0: [], a1: [] }])) };
  const X3 = { k: [], p: [], t: [], top: [], rr: [], ex5: [], ro: [], vb: [], vb41: [] };
  // THE TABLE CHECKS, before any read and any item line (the header): DEADSTEP over every share-axis dead node of every
  // reader year after the first, in every world and layer, and the census. A layer's tiers are its pair in the solve's own
  // order (solve.js l.433: the menu's distinct pairs in action order), checked against the table's tsLayerOf
  const pairsOf = r => {
    const P = [...new Set(r.actions.map(x => `${x.tierPen || 0}/${x.tierIsa || 0}`))].map(x => x.split('/').map(Number));
    r.mix.tables.forEach(tab => { if (tab.tsLayerOf && r.actions.some((x, ai) => P[tab.tsLayerOf[ai]][0] !== (x.tierPen || 0) || P[tab.tsLayerOf[ai]][1] !== (x.tierIsa || 0))) throw new Error(`audit-nscond: ${id}: a layer's pair is not the solve's`); });
    return P;
  };
  const TOL_S = 1e-9, TOL_R = 1e-9, logit = x => Math.log(x / (1 - x));
  const DSTEP = Object.fromEntries(ARMS.map(([a]) => [a, { failErr: 0, sErr: 0, bErr: 0, hErr: 0, plantFail: NaN, plantNext: NaN }]));
  const CENSUS = [];
  for (const [a] of ARMS) {
    const r = R[a], g = r.g, C = CHK[a], P = pairsOf(r), Z = DSTEP[a], NG = g.gain.length, NCL = g.pcls.length;
    let plantH = PLANT === 'deadh', plantN = PLANT === 'deadnext';
    for (const t of [...RY].filter(y => y >= 1)) {
      const cen = { t, dead: 0, ds: 0, fail: 0, next: 0, x0: 0, kept: 0, keptRatio: 0, beqMax: 0 };
      for (let k = 0; k < K; k++) for (const Ln of layersOf(r.mix.tables[k])) { const bq = Ln.beq[t]; for (let i = 0; i < bq.length; i++) if (bq[i] > cen.beqMax) cen.beqMax = bq[i]; }
      let failH = NaN;   // the year's one FAIL shortfall (the failure cost: the unit charges no switch)
      const choice = new Map();   // the joint chooser's move at a node and layer, shared by the worlds
      for (let k = 0; k < K; k++) layersOf(r.mix.tables[k]).forEach((Ln, lj) => {
        const tab = r.mix.tables[k], held = tab.tsLayers ? { pen: P[lj][0], isa: P[lj][1], gia: 0 } : null, ls = Ln.lsurv[t], bq = Ln.beq[t], sh = Ln.short[t], { D, DS } = deadOf(a, k, lj, t);
        for (let i = 0; i < ls.length; i++) if (ls[i] <= DEAD_LS && bq[i] !== 0) { cen.kept++; const q = bq[i] / (expit(ls[i]) * cen.beqMax); if (q > cen.keptRatio) cen.keptRatio = q; }
        for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ii = 0; ii < g.ni; ii++) for (let ip = 0; ip < np; ip++) {
          const i = g.index(ip, ii, it, ig, ic);
          if (!D[i]) continue;
          cen.dead++;
          if (!DS[i]) { cen.x0++; continue; }
          cen.ds++;
          const vec = toVec(g, ip, ii, it, ig, ic, new Float64Array(7), t);
          scoreMoves(tab, vec, t, SC2, TX2, BQ2, held, null, SV2);
          let live = false;
          for (let x = 0; x < r.actions.length; x++) if (SC2[x] !== -Infinity) { live = true; break; }
          if (!live) {
            // FAIL: every move fails; the clamp, bequest 0, and the year's one shortfall
            cen.fail++; C.deadstepFail++;
            let h = sh[i];
            if (plantH) { h *= 1 + 1e-3; plantH = false; Z.plantFail = 1e-3 * Math.abs(sh[i]) / Math.max(1, Math.abs(sh[i])); }
            if (!Number.isFinite(failH)) failH = sh[i];
            const e = Math.abs(h - failH) / Math.max(1, Math.abs(failH));
            if (!(Math.abs(ls[i] - LS_CLAMP) <= 1e-9 && bq[i] === 0 && e <= TOL_R)) C.deadstepFailBad++;
            else if (e > Z.failErr) Z.failErr = e;
            continue;
          }
          // NEXT: the joint chooser's move, its survival, bequest and shortfall (oneStep's construction at wR = 0)
          const key = `${lj}|${i}`;
          let ai = choice.get(key);
          if (ai === undefined) { ai = choose(r, vec, t, held); choice.set(key, ai); }
          scoreMoves(tab, vec, t, SC2, TX2, BQ2, held, null, SV2);
          if (SC2[ai] === -Infinity) { cen.next++; C.deadstepNext++; C.deadstepNextBad++; continue; }
          const sv = SV2[ai], bv = BQ2[ai], wR0 = tab.wR;
          tab.wR = 0;
          try { scoreMoves(tab, vec, t, SC2, TX2, BQ2, held, null, SV2); } finally { tab.wR = wR0; }
          const hv = sv + tab.wB * bv - SC2[ai];
          let lsS = ls[i];
          if (plantN) { lsS = logit(Math.min(1 - CLAMP, 1.01 * expit(ls[i]))); plantN = false; Z.plantNext = Math.abs(expit(lsS) - expit(ls[i])); }
          cen.next++; C.deadstepNext++;
          const eS = Math.abs(clampP(sv) - expit(lsS)), eB = Math.abs(bv - bq[i]) / Math.max(1, Math.abs(bq[i])), eH = Math.abs(hv - sh[i]) / Math.max(1, Math.abs(sh[i]));
          if (!(eS <= TOL_S && eB <= TOL_R && eH <= TOL_R)) C.deadstepNextBad++;
          else { if (eS > Z.sErr) Z.sErr = eS; if (eB > Z.bErr) Z.bErr = eB; if (eH > Z.hErr) Z.hErr = eH; }
        }
      });
      CENSUS.push([a, cen]);
    }
  }
  for (const [a, c] of CENSUS) console.log(`${''.padEnd(16)} census ${a} t${c.t}: dead ${c.dead}, on the share axis ${c.ds} (FAIL ${c.fail}, NEXT ${c.next}), off it ${c.x0}; KEPT ${c.kept} (largest bequest over survival x the year's largest bequest ${c.keptRatio.toExponential(2)})`);
  // each DEADSTEP slice: its clean error, its tolerance, and (in a plant run) the plant's effect
  for (const [a] of ARMS) { const Z = DSTEP[a], C = CHK[a]; console.log(`${''.padEnd(16)} deadstep ${a}: FAIL ${C.deadstepFail - C.deadstepFailBad}/${C.deadstepFail} clean error ${f4(Z.failErr)} tolerance ${f4(TOL_R)} plant ${f4(Z.plantFail)}; NEXT ${C.deadstepNext - C.deadstepNextBad}/${C.deadstepNext} clean error s ${f4(Z.sErr)} b ${f4(Z.bErr)} h ${f4(Z.hErr)} tolerance ${f4(TOL_S)} plant ${f4(Z.plantNext)}`); }
  const tableBad = ARMS.filter(([a]) => CHK[a].deadstepFailBad || CHK[a].deadstepNextBad || !(CHK[a].deadstepFail + CHK[a].deadstepNext > 0) || !CHK[a].noAccessDead).map(([a]) => a);
  if (tableBad.length) { console.error(`audit-nscond: ${id}: a table check failed or ran on nothing (${tableBad.map(a => `${a} ${JSON.stringify(CHK[a])}`).join('; ')})`); process.exit(2); }
  if (TABLES) { for (const [a] of ARMS) console.log(`${''.padEnd(16)} tables ${a}: passed noAccessDead ${CHK[a].noAccessDead}`); return; }
  const t2 = Date.now();
  for (let k = 0; k < K; k++) {
    const z = base.mix.nodes[k];
    paths.forEach((zs, pi) => {
      const cz = Float64Array.from(zs); cz[cz.length - 1] = z;
      let prev = -1;
      const pick = (t, st, held) => {
        const ai = chooseAction(base, st, t, held), own = { BASE: ai };   // the path's own move: its hold carried on
        const ownOf = a => (own[a] !== undefined ? own[a] : (own[a] = choose(R[a], st, t, held)));
        if (prev >= 0 && RY.has(t)) {
          X1.k.push(k); X1.p.push(pi); X1.t.push(t); X1.step.push(STEP.has(t) ? 1 : 0);
          for (const [a] of ARMS) {
            const q = nsRead(a, k, t, st, prev), aiA = ownOf(a), [s1, bE, hE] = oneStep(R[a].mix.tables[k], st, t, held, aiA), A = X1.arms[a];
            A.top.push(q.top); A.wd.push(q.wd); A.bR.push(q.bR); A.bE.push(bE); A.hR.push(q.hR); A.hE.push(hE); A.hD.push(q.hD); A.agree.push(aiA === ai ? 1 : 0);
            A.w0x.push(q.w0x); A.wL.push(q.wL); A.wK.push(q.wK); A.BL.push(q.BL); A.SL.push(q.SL); A.s1.push(clampP(s1)); A.sR.push(q.sR); A.bC.push(q.bC);
          }
        }
        if (RY.has(t + 1)) {
          X2.k.push(k); X2.p.push(pi); X2.s.push(t);
          for (const [a] of ARMS) {
            const a0 = ownOf(a), restore = swapIn(a, t + 1);
            let a1;
            try { a1 = choose(R[a], st, t, held); } finally { restore(); }
            X2.arms[a].a0.push(a0); X2.arms[a].a1.push(a1);
          }
        }
        if (prev >= 0 && BEFORE.has(t)) {
          const q = ybReads(k, t, st, prev, held), [e5] = oneStep(base.mix.tables[k], st, t, held, ai);
          X3.k.push(k); X3.p.push(pi); X3.t.push(t); X3.top.push(q.top); X3.rr.push(q.rr); X3.ex5.push(e5); X3.ro.push(q.ro); X3.vb.push(q.vb); X3.vb41.push(q.vb41);
        }
        prev = ai;
        return ai;
      };
      runPolicy(base, cz, { choose: pick });
    });
  }
  const mean = (J, f) => (J.length ? J.reduce((s, j) => s + f(j), 0) / J.length : NaN);
  const N1 = X1.t.length, N2 = X2.s.length, N3 = X3.t.length;
  // the counts and every check first: no item line is printed unless every check passed and ran where it must
  for (const [a] of ARMS) { const E = [...DEAD.entries()].filter(([q]) => q.startsWith(`${a}|`)); console.log(`${''.padEnd(16)} dead ${a}: ${E.length} layer-years, nodes ${E.reduce((s, [, d]) => s + d.nd, 0)} on the share axis ${E.reduce((s, [, d]) => s + d.nds, 0)} copied ${E.reduce((s, [, d]) => s + d.copied, 0)}`); }
  for (const [a] of ARMS) { const ys = [...NOACC.entries()].filter(([q]) => q.startsWith(`${a}|`)).sort((x, y) => +x[0].split('|')[1] - +y[0].split('|')[1]); console.log(`${''.padEnd(16)} noAccess ${a}: ${ys.map(([q, x]) => `t${q.split('|')[1]} dead ${x.dead} alive ${x.alive}`).join(', ')}`); }
  const ok = (x, bad) => `${x - bad}/${x}`;
  for (const [a] of ARMS) { const C = CHK[a]; console.log(`${''.padEnd(16)} checks ${a}: ${Object.keys(ZERO()).filter(q => !q.endsWith('Bad') && q !== 'noAccessDead').map(q => `${q} ${ok(C[q], C[`${q}Bad`])}`).join(' ')} noAccessDead ${C.noAccessDead}`); }
  const bad = ARMS.some(([a]) => Object.keys(CHK[a]).some(q => q.endsWith('Bad') && CHK[a][q]));
  // item 3 reads only after the first move: a year before a step at year 0 (S126's) has none
  const want3 = [...BEFORE].some(t => t > 0);
  const must = ARMS.flatMap(([a]) => ['replicaNS', 'wdRead', 'noAccessDead', 'restore'].filter(q => !CHK[a][q]).map(q => `${a} ${q}`)).concat(ARMS.filter(([a]) => !(CHK[a].deadstepFail + CHK[a].deadstepNext > 0)).map(([a]) => `${a} deadstep`)).concat(want3 ? ['replica', 'rebuild', 'nodes', 'fine'].filter(q => !CHK.BASE[q]).map(q => `BASE ${q}`) : []);
  if (bad || must.length || !N1 || !N2 || (want3 && !N3)) { console.error(`audit-nscond: ${id}: a self-check failed or ran on nothing (${must.join(', ') || 'failed'}; reads ${N1}, states ${N2}; ${ARMS.map(([a]) => `${a} ${JSON.stringify(CHK[a])}`).join('; ')})`); process.exit(2); }
  // NSCOND_BLIND (build checks before registration): every read and check runs, and no item line or file is written
  if (process.env.NSCOND_BLIND) { console.log(`${''.padEnd(16)} blind: reads ${N1}, states ${N2}, item-3 reads ${N3}; no item line and no file`); return; }
  for (const [a] of ARMS) {
    const A = X1.arms[a], J = A.wd.map((w, j) => (w > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 && A.wL[j] > 0 ? j : -1)).filter(j => j >= 0);
    const el = j => A.BL[j] / A.bE[j] - 1, rho = j => A.SL[j] / A.s1[j];
    console.log(`${''.padEnd(16)} item1 ${a}: reads ${N1} withDead ${J.length} top ${A.top.filter(x => x === 1).length} across ${A.top.filter(x => x === -1).length} wd ${f4(mean(J, j => A.wd[j]))} w0x ${f4(mean(J, j => A.w0x[j]))} wK ${f4(mean(J, j => A.wK[j]))} elive ${f4(mean(J, el))} |elive| ${f4(mean(J, j => Math.abs(el(j))))} |(1+elive)/rho-1| ${f4(mean(J, j => Math.abs((1 + el(j)) / rho(j) - 1)))} |eC| ${f4(mean(J, j => Math.abs(A.bC[j] / A.bE[j] - 1)))} |eK| ${f4(mean(J, j => Math.abs(A.BL[j] / A.SL[j] * A.sR[j] / A.bE[j] - 1)))} failed ${A.bE.filter(x => !Number.isFinite(x)).length}`);
    const B = X2.arms[a], ch = B.a0.filter((x, j) => x !== B.a1[j]).length;
    console.log(`${''.padEnd(16)} item2 ${a}: states ${N2} changed ${ch} opening ${X2.s.indexOf(0) >= 0 ? `${B.a0[X2.s.indexOf(0)]}->${B.a1[X2.s.indexOf(0)]}` : '-'}`);
  }
  if (N3) { const J = X3.t.map((_, j) => j); console.log(`${''.padEnd(16)} item3 BASE: reads ${N3} top ${X3.top.filter(x => x === 1).length} rep ${f4(mean(J, j => X3.rr[j] - X3.ex5[j]))} ro ${f4(mean(J, j => X3.ro[j] - X3.ex5[j]))} vb ${f4(mean(J, j => X3.vb[j] - X3.ex5[j]))} vb41 ${f4(mean(J, j => X3.vb41[j] - X3.ex5[j]))} secs ${Math.round((Date.now() - t2) / 1000)}`); }
  const r12 = v => v.map(x => (typeof x === 'number' && Number.isFinite(x) ? Math.round(x * 1e12) / 1e12 : x === null || Number.isNaN(x) ? null : x));
  const pack = o => Object.fromEntries(Object.entries(o).map(([q, v]) => [q, Array.isArray(v) ? r12(v) : pack(v)]));
  const rec = { id, steps: [...STEP], before: [...BEFORE], readerYears: [...RY], item1: pack(X1), item2: pack(X2), item3: pack(X3), census: CENSUS, deadstep: DSTEP, dead: Object.fromEntries(ARMS.map(([a]) => [a, Object.fromEntries([...DEAD.entries()].filter(([q]) => q.startsWith(`${a}|`)).map(([q, d]) => [q.split('|').slice(1).join('/'), [d.nd, d.nds, d.copied]]))])), checks: CHK };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${id.replace(/\s+/g, '_')}.json.gz`), gzipSync(JSON.stringify({ stamp: STAMP, seed: SEED, npw: NPW, points: POINTS, ...rec })));
  console.log(`${''.padEnd(16)} done ${L} rss ${Math.round(process.resourceUsage().maxRSS / 1024)}MB`);
});
