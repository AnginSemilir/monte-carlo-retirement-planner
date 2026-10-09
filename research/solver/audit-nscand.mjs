/*
 * NS-CAND: NS-COND's census and its bequest-read decomposition on 7u's own unit (the deep review after NS-COND,
 * deep-review-log.md 9 Oct 02:09 UK, its optional check; the maintainer's go-ahead of 9 Oct; PLAN.md PR12, NS-PROP).
 * A MEASUREMENT (PREDICTION none): it grades the transfer of NSL-PROP to the candidate - is the bridge years' bequest read
 * on the candidate's tables low against its one-step value where the next year blends a share-axis dead corner, and clean
 * where it does not - and decides nothing.
 * The unit: 7u's (audit-7u.mjs): CAND, solveCandidate (CANDIDATE_OPTS, e3pcls on, the candidate's plan) and SHIP, solvePlan
 * on the candidate's plan (the product's settings), at the estate weight 0.02, 30 points, seed 7002 (the tuning seed:
 * 7u's held-out seed is refused); households bridge 4 and S126, built by audit-7u.mjs's builders (copied).
 * Along CAND's own paths, in each world, at every year t from the first move to one past the last bridge (reader) year,
 * per arm at CAND's state through the layer of CAND's previous move (a fixed-policy read for SHIP):
 *   wd (the weight on share-axis dead corners: a node with stored survival log-odds at or below DEAD_LS and bequest 0 whose
 *   share row holds a live node, NS-COND's DS), bR (the plain bequest read), bE (the one-step bequest of the arm's own move
 *   there, NS-COND's oneStep), B_L (the live corners' bequest over their weight).
 * Printed per household, arm and year: reads, mean wd, mean eb = bR / bE - 1, mean eb + wd, mean elive = B_L / bE - 1 over
 * the reads with live weight, and the next year's mean wd on the same paths (0: a clean next year); and the census per arm
 * and year (dead, share-axis dead, KEPT: at or below DEAD_LS keeping a bequest).
 * Self-checks, each refusing the run (NS-COND's): replicaNS (the decomposed bequest and shortfall reads equal readValues'
 * within 1e-9 relative) and wdRead (wd equals readValues over the share-axis dead indicator within 1e-12), each run on
 * every read. NSCAND_PLANT=deadshift moves the dead indicator one share node (wdRead must refuse).
 *   node research/solver/audit-nscand.mjs [points=30] [paths a world=2000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { readValues, shareLocOf } from '../../src/solver/grid.js';
import { solveCandidate, candidatePlan, CANDIDATE_OPTS } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { SEED as SEED_7U } from './panel-7u.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const POINTS = Number(process.argv[2] || 30), NPW = Number(process.argv[3] || 2000);
if (!(POINTS >= 4) || !(NPW >= 1)) { console.error(`audit-nscand: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-nscand: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (SEED === SEED_7U) { console.error('audit-nscand: that is 7u\'s held-out seed'); process.exit(2); }
const PLANT = process.env.NSCAND_PLANT || '';
if (PLANT && PLANT !== 'deadshift') { console.error(`audit-nscand: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979, W = 0.02, DEAD_LS = -11.5;   // grid.js l.436, copied (NS-COND's)
const expit = x => 1 / (1 + Math.exp(-x));
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-nscand: the candidate does not carry e3pcls'); process.exit(2); }

// the households: audit-7u.mjs's builders (copied)
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
export const UNITS = ['bridge 4', 'S126'];
const caseOf = id => (id === 'bridge 4' ? variant(id, { bridge: 4 }) : all.find(s => s.id === id));
export const ARMS = ['CAND', 'SHIP'];
const f4 = x => (Number.isFinite(x) ? x.toExponential(4) : 'NaN');

// NS-COND's corner rows (audit-nscond.mjs locLog, locLin, nearest, nearestPclsStrict, bracket, rowsOf; copied)
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
function rowsOf(g, s, yr) {
  if (g.mode !== 'total' || g.gainInterp || g.pclsSeg) throw new Error('audit-nscand: the replica covers the total-wealth grid without gain interpolation or an allowance segment');
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

console.log(`NS-CAND: 7u's unit (CAND: solveCandidate; SHIP: solvePlan, the product's settings; both on the candidate's plan) at the estate weight ${W}, ${POINTS} points, ${NPW} paths a world (seed ${SEED}); the bridge years' bequest read against its one-step value, CAND's paths`);
UNITS.forEach((id, ui) => {
  if (ui % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`audit-nscand: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit CAND,SHIP/W${W} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const base = { lambda: LAMBDA, points: POINTS, bequestWeight: W }, R = {};
  for (const a of ARMS) {
    const t0 = Date.now();
    R[a] = a === 'CAND' ? solveCandidate(E, M, plan, base) : solvePlan(E, M, candidatePlan(E, plan), base);
    const r = R[a];
    const ok = a === 'CAND' ? r.meta.bridgeRead === 'reader' && r.meta.bridgeStep === 'exact' && !!r.meta.e3pcls : !r.meta.bridgeRead && !r.meta.tierState;
    if (!ok || !(Math.abs(r.meta.bequestWeight - W) < 1e-12)) { console.error(`audit-nscand: ${id} ${a}: the arm's settings did not take`); process.exit(2); }
    console.log(`${''.padEnd(16)} solve ${a}: secs ${Math.round((Date.now() - t0) / 1000)} pts ${r.g.np} shares ${r.g.ni} readerYears ${r.g.reader ? [...r.g.reader.years].map((x, t) => (x ? t : -1)).filter(t => t >= 0).join(',') : 'none'}`);
  }
  const cand = R.CAND, m = cand.m, T = m.ctx.totalYears, K = cand.worlds.length;
  const RY = new Set(cand.g.reader ? [...cand.g.reader.years].map((x, t) => (x ? t : -1)).filter(t => t >= 0) : []);
  if (!RY.size) { console.error(`audit-nscand: ${id}: no bridge (reader) year under CAND`); process.exit(2); }
  const lastRY = Math.max(...RY), YRS = new Set([...RY, lastRY + 1]);
  const paths = E.pathsForSeed(SEED, NPW, T);
  const NA = Math.max(...ARMS.map(a => R[a].actions.length));
  const SC = new Float64Array(NA), TX = new Float64Array(NA), BQ = new Float64Array(NA), SV = new Float64Array(NA), RD4 = new Float64Array(4), RDD = new Float64Array(4);
  const layerOf = (tab, prevAi) => (tab.tsLayers ? tab.tsLayers[tab.tsLayerOf[prevAi]] : tab);
  const CHK = Object.fromEntries(ARMS.map(a => [a, { replicaNS: 0, replicaNSBad: 0, wdRead: 0, wdReadBad: 0 }]));
  const DEAD = new Map(), CENSUS = new Map();
  // the dead and share-axis dead nodes of a layer's year (NS-COND's deadOf, without the swap), and the census
  const deadOf = (a, Ln, t) => {
    let d = DEAD.get(Ln.lsurv[t]);
    if (d) return d;
    const g = R[a].g, ls = Ln.lsurv[t], bq = Ln.beq[t], n = ls.length, ni = g.ni, nt = g.nt, np = g.np, NG = g.gain.length, NCL = g.pcls.length;
    const D = new Float64Array(n), DS = new Float64Array(n);
    let nd = 0, nds = 0, kept = 0;
    for (let i = 0; i < n; i++) { if (ls[i] <= DEAD_LS && bq[i] === 0) { D[i] = 1; nd++; } else if (ls[i] <= DEAD_LS) kept++; }
    for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < nt; it++) for (let ip = 0; ip < np; ip++) {
      let live = false;
      for (let ii = 0; ii < ni; ii++) if (!D[g.index(ip, ii, it, ig, ic)]) { live = true; break; }
      if (live) for (let ii = 0; ii < ni; ii++) { const i = g.index(ip, ii, it, ig, ic); if (D[i]) { DS[i] = 1; nds++; } }
    }
    d = { D, DS };
    DEAD.set(Ln.lsurv[t], d);
    const c = CENSUS.get(`${a}|${t}`) || { dead: 0, ds: 0, kept: 0, layers: 0 };
    c.dead += nd; c.ds += nds; c.kept += kept; c.layers++;
    CENSUS.set(`${a}|${t}`, c);
    return d;
  };
  const oneStepB = (tab, st, t, held, ai) => { scoreMoves(tab, st, t, SC, TX, BQ, held, null, SV); return SC[ai] === -Infinity ? NaN : BQ[ai]; };
  const nsRead = (a, k, t, st, prevAi) => {
    const r = R[a], g = r.g, tab = r.mix.tables[k], Ln = layerOf(tab, prevAi), C = CHK[a];
    readValues(g, Ln.lsurv[t], Ln.beq[t], st, RD4, Ln.lresil[t], Ln.short[t], t);
    const { D: DA, DS } = deadOf(a, Ln, t), { rows } = rowsOf(g, st, t);
    const bq = Ln.beq[t];
    let b = 0, hh = 0, wd = 0, ws = 0, wl = 0, bl = 0;
    for (const q of rows) {
      const iL = g.index(q.ip, q.ii, q.it, q.ig, q.ic), iH = g.index(q.ip, q.ii + 1, q.it, q.ig, q.ic), wL = q.w * (1 - q.wa), wH = q.w * q.wa;
      b += wL * bq[iL] + wH * bq[iH]; hh += wL * Ln.short[t][iL] + wH * Ln.short[t][iH]; ws += q.w;
      const dL = PLANT === 'deadshift' ? DS[iH] : DS[iL], dH = PLANT === 'deadshift' ? DS[iL] : DS[iH];
      wd += wL * dL + wH * dH;
      for (const [i, w] of [[iL, wL], [iH, wH]]) { if (w === 0 || DA[i]) continue; wl += w; bl += w * bq[i]; }
    }
    C.replicaNS++; if (!(Math.abs(b - RD4[1]) <= 1e-9 * Math.max(1, Math.abs(RD4[1])) && Math.abs(hh - RD4[3]) <= 1e-9 * Math.max(1, Math.abs(RD4[3])))) C.replicaNSBad++;
    readValues(g, Ln.lsurv[t], DS, st, RDD, null, null, t);
    C.wdRead++; if (!(Math.abs(wd - RDD[1]) <= 1e-12)) C.wdReadBad++;
    const n = ws > 0 ? ws : 1;
    return { bR: RD4[1], wd: wd / n, BL: wl > 0 ? bl / wl : NaN };
  };
  // per arm and year: the reads; per path, the year's wd, for the next year's wd on the same path
  const ACC = Object.fromEntries(ARMS.map(a => [a, new Map()])), WDP = Object.fromEntries(ARMS.map(a => [a, new Map()]));
  for (let k = 0; k < K; k++) {
    const z = cand.mix.nodes[k];
    paths.forEach((zs, pi) => {
      const cz = Float64Array.from(zs); cz[cz.length - 1] = z;
      let prev = -1;
      const pick = (t, st, held) => {
        const ai = chooseAction(cand, st, t, held);
        if (prev >= 0 && YRS.has(t)) for (const a of ARMS) {
          const gh = R[a].giaHold, aiA = a === 'CAND' ? ai : chooseAction(R[a], st, t, held); R[a].giaHold = gh;
          const q = nsRead(a, k, t, st, prev), bE = oneStepB(R[a].mix.tables[k], st, t, held, aiA);
          const L = ACC[a].get(t) || { n: 0, wd: 0, eb: 0, ebwd: 0, nl: 0, el: 0 };
          L.n++; L.wd += q.wd;
          if (Number.isFinite(bE) && bE > 0) { L.eb += q.bR / bE - 1; L.ebwd += q.bR / bE - 1 + q.wd; L.nE = (L.nE || 0) + 1; if (q.wd > 0 && Number.isFinite(q.BL)) { L.nl++; L.el += q.BL / bE - 1; } }
          ACC[a].set(t, L);
          WDP[a].set(`${k}|${pi}|${t}`, q.wd);
        }
        prev = ai;
        return ai;
      };
      runPolicy(cand, cz, { choose: pick });
    });
  }
  for (const a of ARMS) { const C = CHK[a]; console.log(`${''.padEnd(16)} checks ${a}: replicaNS ${C.replicaNS - C.replicaNSBad}/${C.replicaNS} wdRead ${C.wdRead - C.wdReadBad}/${C.wdRead}`); }
  const bad = ARMS.some(a => CHK[a].replicaNSBad || CHK[a].wdReadBad || !CHK[a].replicaNS || !CHK[a].wdRead);
  if (bad) { console.error(`audit-nscand: ${id}: a self-check failed or ran on nothing`); process.exit(3); }
  for (const a of ARMS) for (const t of [...CENSUS.keys()].filter(q => q.startsWith(`${a}|`)).map(q => +q.split('|')[1]).sort((x, y) => x - y)) {
    const c = CENSUS.get(`${a}|${t}`);
    console.log(`${''.padEnd(16)} census ${a} t${t}: layers ${c.layers} dead ${c.dead} share-axis dead ${c.ds} kept ${c.kept}`);
  }
  for (const a of ARMS) for (const t of [...ACC[a].keys()].sort((x, y) => x - y)) {
    const L = ACC[a].get(t), nE = L.nE || 0;
    let nx = 0, sx = 0;
    for (const [q, v] of WDP[a]) { const [kk, pp, tt] = q.split('|').map(Number); if (tt === t + 1) { nx++; sx += v; } }
    console.log(`${''.padEnd(16)} year ${a} t${t}${RY.has(t) ? ' bridge' : ' after'}: reads ${L.n} mean wd ${f4(L.wd / L.n)} eb ${f4(nE ? L.eb / nE : NaN)} eb+wd ${f4(nE ? L.ebwd / nE : NaN)} elive ${f4(L.nl ? L.el / L.nl : NaN)} (reads ${L.nl}) next-year wd ${nx ? f4(sx / nx) : 'none read'}`);
  }
  console.log(`${''.padEnd(16)} done ${id}`);
});
