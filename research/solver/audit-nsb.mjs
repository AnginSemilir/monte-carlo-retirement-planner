/*
 * NSB: THE DEAD NODE'S NON-SURVIVAL VALUES IN EVERY BRIDGE YEAR, READ-ONLY (PLAN.md NSB; proposed by the deep review after
 * XAS-R2, deep-review-log.md 6 Oct 03:10 UK: FLAG 1, FLAG 3 and its DECISIVE TEST). XAS-R2's unit and arms, copied from
 * audit-xasr2.mjs (READER/TS+J/W0.02/PCLSI at 6 share points, 30 wealth points, e3 off; BASE, and COV with the reader's
 * tax and the coverage node), XAS's seed and paths, one process a household: S370, bridge 4 and S126 (deciding), S130 and
 * S128 (incidence). No solver change: every read is assembled here from the solved tables and held to the solver's own.
 * A node is DEAD when its stored survival log-odds are at or below grid.js's DEAD_LS (-11.5, l.436) and its bequest is 0:
 * a state every move fails stores b = 0 and the failure cost as its shortfall (solve.js l.1015), its survival at the clamp
 * (checked: deadExact). A node with no accessible money (the share axis's top node) is dead in a reader year whose bill
 * its income does not meet; where income meets it (S370's year 4 in the build check of 8 Oct: every such node alive) it is
 * not, so those nodes are reported by year (noAccess), not refused. A dead
 * node is ON THE SHARE AXIS when its share row (the same wealth, split, gain and allowance nodes) holds a live node: the
 * blend FLAG 1 names. A row dead throughout is the survival cliff along wealth (grid.js l.425-428: there the sharpness is
 * the point), and is not counted.
 * Along BASE's own paths (BASE's moves), in each world k, per arm:
 *   ITEM 1 (F3-NSBLEND): at every reader year t after the first move, the arm's bequest and shortfall reads at BASE's
 *     state through the layer of BASE's previous move (readValues out[1], out[3]) against their one-step values for the
 *     arm's own move there (XAS-R2 item 3's construction: scoreMoves' bq; h = surv + wB bq - the score at wR = 0; a
 *     failing move NaN), with wd, the read's corner weight on share-axis dead nodes, and hD, those corners' weighted shortfall;
 *     the read classed in the arm's top share cell (1), below it (0) or across (-1), its year a step year (COV's
 *     reader.tax) or not.
 *   ITEM 2 (decisions): at every year s whose next year is a reader year, the arm's move at BASE's state, and the move
 *     chosen with year s + 1's dead nodes' bequest, resilience and shortfall replaced by the nearest live node's on the
 *     same share row (reader.js l.116's copy rule for c: the lower side first at each distance), in every world and
 *     layer at once; then the tables restored, each array the very one the solve stored (restore).
 *   ITEM 3 (YB2), BASE only, at each reader year before a step (XAS-R2's BEFORE): the reader's read (rr, equal to the
 *     solver's: replica), the read with the reader table rebuilt at read time on the menu-order reference (ro: reader.js
 *     orderChance with solve.js's readerRef 'order' inputs, l.671-677, copied; p, c and R from the same stored S), XAS-R2's
 *     midpoint construct (vb) and vb with its two live nodes' survival at 41 Gauss-Hermite points (vb41: the cell's
 *     lower node and its midpoint; the top node is dead at any quadrature, its c the lower node's copy), each against ex5
 *     (BASE's move scored one step against BASE's table at t + 1).
 * Self-checks, each refusing the run, each counted per arm and refused when it ran on nothing where it must run:
 *   replicaNS  the bequest and shortfall reads assembled from the corners equal the solver's;
 *   wdRead     wd from the corners equals the solver's own read of the dead indicator (readValues on a 0/1 array);
 *   deadExact  every node classed dead holds the survival clamp's log-odds exactly (the threshold catches failed states
 *              only), and some node with no accessible money is classed dead (it ran on the nodes it must catch);
 *   restore    after each swap every swapped array is the solve's own again;
 *   replica    the reader's survival read from the corners equals the solver's (item 3);
 *   rebuild    the reader table rebuilt at read time on the solve's own reference equals the stored one, node for node;
 *   nodes      the node builder at the cell's real lower and top nodes reproduces the stored survival (XAS-R2's);
 *   fine       the 41-point path run at the solve's own 5 points reproduces the node's survival (XAS-R2's).
 * NSB_PLANT, each a fault one check must refuse (the preflight runs them): 'deadshift' puts wd's weight on the other
 * corner of the cell (wdRead); 'norestore' leaves the swapped tables in place (restore); 'rebuild' rebuilds the solve's own
 * table on the order reference (rebuild).
 *   node research/solver/audit-nsb.mjs [points=30] [paths a world=2000] part k/n [seed=7002]
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
if (!(POINTS >= 4) || !(NPW >= 1)) { console.error(`audit-nsb: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-nsb: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
const OUT = process.env.DIAGNSB_OUT || join(HERE, 'results', 'diagnsb');
const PLANT = process.env.NSB_PLANT || '';
if (PLANT && !['deadshift', 'norestore', 'rebuild'].includes(PLANT)) { console.error(`audit-nsb: unknown plant ${PLANT}`); process.exit(2); }
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
console.log(`NSB: ${L} at ${SH} share points, ${POINTS} wealth points, ${NPW} paths a world (seed ${SEED}); arms BASE and COV; the dead node's non-survival values in every bridge year; ${UNITS.length} households; part ${pk}/${pn}`);
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
  if (g.mode !== 'total' || g.gainInterp || g.pclsSeg) throw new Error('audit-nsb: the replica covers the total-wealth grid without gain interpolation or an allowance segment');
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
  if (!h) { console.error(`audit-nsb: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3 | arms ${ARMS.map(a => a[0]).join(',')}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const R = {};
  for (const [key, o] of ARMS) {
    const t0 = Date.now();
    // e3 off: coverage refuses e3, and XAS's unit ran without it (audit-xasr2.mjs)
    const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, shares: SH, bridgeRead: 'reader', bequestWeight: W, tierState: true, jointWorlds: true, pclsInterp: true, e3: false, ...o });
    if (!r.meta.tierState || !r.meta.jointWorlds || r.g.pclsInterp !== true || r.meta.e3) { console.error(`audit-nsb: ${id} ${key} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds} pclsInterp ${r.g.pclsInterp}`); process.exit(2); }
    if (!!o.readerTax !== !!(r.g.reader && r.g.reader.tax) || !!o.coverage !== !!r.g.cov) { console.error(`audit-nsb: ${id} ${key}: the arm's settings did not take`); process.exit(2); }
    if (r.meta.readerRef === 'order') { console.error(`audit-nsb: ${id} ${key}: solved on the order reference`); process.exit(2); }
    R[key] = r;
    console.log(`${''.padEnd(16)} solve ${key}: secs ${Math.round((Date.now() - t0) / 1000)} pts ${r.g.np} shares ${r.g.ni} readerYears ${r.g.reader ? r.g.reader.years.reduce((t, x) => t + (x ? 1 : 0), 0) : 0} readerTax ${r.meta.readerTax || '-'} coverage ${r.meta.coverage ? JSON.stringify(r.meta.coverage) : '-'}`);
  }
  const base = R.BASE, m = base.m, T = m.ctx.totalYears, K = base.worlds.length;
  const STEP = new Set(R.COV.g.reader && R.COV.g.reader.tax ? R.COV.g.reader.tax.map((x, t) => (x ? t : -1)).filter(t => t >= 0) : []);
  const RYof = r => new Set(r.g.reader ? [...r.g.reader.years].map((x, t) => (x ? t : -1)).filter(t => t >= 0) : []);
  const RY = RYof(base);
  if ([...RYof(R.COV)].join() !== [...RY].join()) { console.error(`audit-nsb: ${id}: the arms' reader years differ`); process.exit(2); }
  const BEFORE = new Set([...RY].filter(t => STEP.has(t + 1) && !STEP.has(t)));
  console.log(`${''.padEnd(16)} ran ${L}: mix ${K} pts ${POINTS} seed ${SEED} paths ${NPW * K} worlds ${K} steps ${[...STEP].join(',') || 'none'} before ${[...BEFORE].join(',') || 'none'} readerYears ${[...RY].join(',') || 'none'}`);
  const paths = E.pathsForSeed(SEED, NPW, T);
  const NA = Math.max(...ARMS.map(([a]) => R[a].actions.length));
  const SC = new Float64Array(NA), TX = new Float64Array(NA), BQ = new Float64Array(NA), SV = new Float64Array(NA), RD4 = new Float64Array(4), RDD = new Float64Array(4);
  const ZERO = () => ({ replicaNS: 0, replicaNSBad: 0, wdRead: 0, wdReadBad: 0, deadExact: 0, deadExactBad: 0, noAccessDead: 0, restore: 0, restoreBad: 0, replica: 0, replicaBad: 0, rebuild: 0, rebuildBad: 0, nodes: 0, nodesBad: 0, fine: 0, fineBad: 0 });
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
    // deadExact: every node classed dead holds the clamp exactly; noAccess (reported): the nodes with no accessible money,
    // dead or alive, by year
    const v = new Float64Array(7), C = CHK[a];
    for (let i = 0; i < n; i++) if (D[i]) { C.deadExact++; if (!(Math.abs(ls[i] - LS_CLAMP) <= 1e-9)) C.deadExactBad++; }
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

  // ITEM 1's read at a state, per arm: the bequest and shortfall reads, wd, hD and the class
  const nsRead = (a, k, t, st, prevAi) => {
    const r = R[a], g = r.g, tab = r.mix.tables[k], Ln = layerOf(tab, prevAi), lj = ljOf(tab, prevAi), C = CHK[a];
    readValues(g, Ln.lsurv[t], Ln.beq[t], st, RD4, Ln.lresil[t], Ln.short[t], t);
    const { DS: D } = deadOf(a, k, lj, t), { rows } = rowsOf(g, st, t), nA = g.axes.a.n;   // the share-axis dead
    let b = 0, hh = 0, wd = 0, hD = 0, ws = 0;
    for (const q of rows) {
      const iL = g.index(q.ip, q.ii, q.it, q.ig, q.ic), iH = g.index(q.ip, q.ii + 1, q.it, q.ig, q.ic), wL = q.w * (1 - q.wa), wH = q.w * q.wa;
      b += wL * Ln.beq[t][iL] + wH * Ln.beq[t][iH]; hh += wL * Ln.short[t][iL] + wH * Ln.short[t][iH]; ws += q.w;
      const dL = PLANT === 'deadshift' ? D[iH] : D[iL], dH = PLANT === 'deadshift' ? D[iL] : D[iH];
      wd += wL * dL + wH * dH; hD += wL * dL * Ln.short[t][iL] + wH * dH * Ln.short[t][iH];
    }
    C.replicaNS++; if (!(Math.abs(b - RD4[1]) <= 1e-9 * Math.max(1, Math.abs(RD4[1])) && Math.abs(hh - RD4[3]) <= 1e-9 * Math.max(1, Math.abs(RD4[3])))) C.replicaNSBad++;
    readValues(g, Ln.lsurv[t], D, st, RDD, null, null, t);
    C.wdRead++; if (!(Math.abs(wd - RDD[1]) <= 1e-12)) C.wdReadBad++;
    const top = rows.every(q => q.ii === nA - 2) ? 1 : rows.every(q => q.ii < nA - 2) ? 0 : -1;
    return { bR: RD4[1], hR: RD4[3], wd: ws > 0 ? wd / ws : 0, hD, top };
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
    if (!sch || sch.t !== t || sch.k !== k) throw new Error(`audit-nsb: ${id}: no reference schedule at world ${k} year ${t}`);
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

  const X1 = { k: [], p: [], t: [], step: [], arms: Object.fromEntries(ARMS.map(([a]) => [a, { top: [], wd: [], bR: [], bE: [], hR: [], hE: [], hD: [], agree: [] }])) };
  const X2 = { k: [], p: [], s: [], arms: Object.fromEntries(ARMS.map(([a]) => [a, { a0: [], a1: [] }])) };
  const X3 = { k: [], p: [], t: [], top: [], rr: [], ex5: [], ro: [], vb: [], vb41: [] };
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
            const q = nsRead(a, k, t, st, prev), aiA = ownOf(a), [, bE, hE] = oneStep(R[a].mix.tables[k], st, t, held, aiA), A = X1.arms[a];
            A.top.push(q.top); A.wd.push(q.wd); A.bR.push(q.bR); A.bE.push(bE); A.hR.push(q.hR); A.hE.push(hE); A.hD.push(q.hD); A.agree.push(aiA === ai ? 1 : 0);
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
  for (const [a] of ARMS) {
    const A = X1.arms[a], J = A.wd.map((w, j) => (w > 0 && Number.isFinite(A.bE[j]) && A.bE[j] > 0 ? j : -1)).filter(j => j >= 0);
    console.log(`${''.padEnd(16)} item1 ${a}: reads ${N1} withDead ${J.length} top ${A.top.filter(x => x === 1).length} across ${A.top.filter(x => x === -1).length} wd ${f4(mean(J, j => A.wd[j]))} eb/bE ${f4(mean(J, j => (A.bR[j] - A.bE[j]) / A.bE[j]))} |eb/bE+wd| ${f4(mean(J, j => Math.abs((A.bR[j] - A.bE[j]) / A.bE[j] + A.wd[j])))} failed ${A.bE.filter(x => !Number.isFinite(x)).length}`);
    const B = X2.arms[a], ch = B.a0.filter((x, j) => x !== B.a1[j]).length;
    console.log(`${''.padEnd(16)} item2 ${a}: states ${N2} changed ${ch} opening ${X2.s.indexOf(0) >= 0 ? `${B.a0[X2.s.indexOf(0)]}->${B.a1[X2.s.indexOf(0)]}` : '-'}`);
  }
  if (N3) { const J = X3.t.map((_, j) => j); console.log(`${''.padEnd(16)} item3 BASE: reads ${N3} top ${X3.top.filter(x => x === 1).length} rep ${f4(mean(J, j => X3.rr[j] - X3.ex5[j]))} ro ${f4(mean(J, j => X3.ro[j] - X3.ex5[j]))} vb ${f4(mean(J, j => X3.vb[j] - X3.ex5[j]))} vb41 ${f4(mean(J, j => X3.vb41[j] - X3.ex5[j]))} secs ${Math.round((Date.now() - t2) / 1000)}`); }
  for (const [a] of ARMS) { const E = [...DEAD.entries()].filter(([q]) => q.startsWith(`${a}|`)); console.log(`${''.padEnd(16)} dead ${a}: ${E.length} layer-years, nodes ${E.reduce((s, [, d]) => s + d.nd, 0)} on the share axis ${E.reduce((s, [, d]) => s + d.nds, 0)} copied ${E.reduce((s, [, d]) => s + d.copied, 0)}`); }
  for (const [a] of ARMS) { const ys = [...NOACC.entries()].filter(([q]) => q.startsWith(`${a}|`)).sort((x, y) => +x[0].split('|')[1] - +y[0].split('|')[1]); console.log(`${''.padEnd(16)} noAccess ${a}: ${ys.map(([q, x]) => `t${q.split('|')[1]} dead ${x.dead} alive ${x.alive}`).join(', ')}`); }
  const ok = (x, bad) => `${x - bad}/${x}`;
  for (const [a] of ARMS) { const C = CHK[a]; console.log(`${''.padEnd(16)} checks ${a}: ${Object.keys(ZERO()).filter(q => !q.endsWith('Bad') && q !== 'noAccessDead').map(q => `${q} ${ok(C[q], C[`${q}Bad`])}`).join(' ')} noAccessDead ${C.noAccessDead}`); }
  // every check clean; the ones that must run on each arm ran (item 3's only on BASE, and only where a year precedes a step)
  const bad = ARMS.some(([a]) => Object.keys(CHK[a]).some(q => q.endsWith('Bad') && CHK[a][q]));
  // item 3 reads only after the first move: a year before a step at year 0 (S126's) has none
  const want3 = [...BEFORE].some(t => t > 0);
  const must = ARMS.flatMap(([a]) => ['replicaNS', 'wdRead', 'deadExact', 'noAccessDead', 'restore'].filter(q => !CHK[a][q]).map(q => `${a} ${q}`)).concat(want3 ? ['replica', 'rebuild', 'nodes', 'fine'].filter(q => !CHK.BASE[q]).map(q => `BASE ${q}`) : []);
  if (bad || must.length || !N1 || !N2 || (want3 && !N3)) { console.error(`audit-nsb: ${id}: a self-check failed or ran on nothing (${must.join(', ') || 'failed'}; reads ${N1}, states ${N2}; ${ARMS.map(([a]) => `${a} ${JSON.stringify(CHK[a])}`).join('; ')})`); process.exit(2); }
  const r12 = v => v.map(x => (typeof x === 'number' && Number.isFinite(x) ? Math.round(x * 1e12) / 1e12 : x === null || Number.isNaN(x) ? null : x));
  const pack = o => Object.fromEntries(Object.entries(o).map(([q, v]) => [q, Array.isArray(v) ? r12(v) : pack(v)]));
  const rec = { id, steps: [...STEP], before: [...BEFORE], readerYears: [...RY], item1: pack(X1), item2: pack(X2), item3: pack(X3), dead: Object.fromEntries(ARMS.map(([a]) => [a, Object.fromEntries([...DEAD.entries()].filter(([q]) => q.startsWith(`${a}|`)).map(([q, d]) => [q.split('|').slice(1).join('/'), [d.nd, d.nds, d.copied]]))])), checks: CHK };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${id.replace(/\s+/g, '_')}.json.gz`), gzipSync(JSON.stringify({ stamp: STAMP, seed: SEED, npw: NPW, points: POINTS, ...rec })));
  console.log(`${''.padEnd(16)} done ${L} rss ${Math.round(process.resourceUsage().maxRSS / 1024)}MB`);
});
