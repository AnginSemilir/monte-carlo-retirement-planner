/*
 * XAS-R: THE YEAR-BEFORE READ THREE WAYS, AT FIXED POLICY (PLAN.md XAS-R; the deep review after XAS, deep-review-log.md
 * 5 Oct 18:48 UK, and its revision of the third read the same evening). XAS's unit (READER/TS+J/W0.02/PCLSI, 6 share
 * points, 30 wealth points, e3 off) in XAS's two arms, BASE and COV, on S370 and bridge 4, at XAS's seed and paths, one
 * process a household; and S126's opening scores split by term. No solver change: every read below is assembled here from
 * the solved tables, and the assembly is held to the solver's own read on every read (the replica check).
 * Along BASE's own paths (BASE's moves), at every reader year t whose next year holds a reader step (COV's reader.tax:
 * the year before each step), in each world k, per arm:
 *   read   the arm's table at t read at BASE's state through the layer of BASE's previous move (XAS's read; the reducer
 *          holds it, and ex5, to XAS's saved files read for read);
 *   ex5    the one-step value at the same state (XAS's: BASE's move scored against the arm's table at t + 1);
 *   rr     the reader's read assembled here from the corner rows (must equal read: the replica check);
 *   plain  the same corners blended in log-odds with the reader off (reported only: it still reads the dead top node);
 *   va     (v-a) where the read lies in the top share cell: on each corner row a supported node is added at the row's own
 *          support edge a* (the share where the world's reference chance reaches 0.5), its survival S* computed exactly as
 *          the cell loop builds a node (the chooser's move across the mixture, holding the read's layer, scored against
 *          the t + 1 tables at the solve's 5 points), c* = min(1, S* over p*), R* = S* - p* c*; a read below a* on that row
 *          interpolates c and R between the a = 0.8 node and a*, a read at or above a* is unchanged; never re-solved;
 *   vb     (v-b) the same at the cell's midpoint a = 0.9 on every row, under the reader's own rule: c = S/p where the
 *          node is supported (p >= 0.5), else copied as the reader copies (the 0.8 node's c);
 *   vaw    the share of the read's row weight where (v-a) applied; vbs the share whose 0.9 node is supported.
 * Self-checks, each refusing the run: rr equals read on every read (replica); the node builder at the real 0.8 and top
 * nodes of every row it uses reproduces the solved survival (nodes), and at a supported 0.8 node the reader's c and R
 * (cr); every read classed in or out of the top cell (top).
 * And S126's opening: BASE's and COV's year-0 move (XAS's), and each arm's mixture score of both moves split into its
 * survival, resilience, bequest and shortfall terms (score = surv + resil + beq - short; checked against the score).
 * Lines per household: case, solve (an arm each), ran, xasr (an arm: reads, mean rep, va, vb, plain), checks, open and
 * terms (S126), done. Per-read files: results/diagxasr/<id>.json.gz.
 *   node research/solver/audit-xasr.mjs [points=30] [paths a world=2000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { readValues, toVec, shareLocOf } from '../../src/solver/grid.js';
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
if (!(POINTS >= 4) || !(NPW >= 1)) { console.error(`audit-xasr: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-xasr: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
const OUT = process.env.DIAGXASR_OUT || join(HERE, 'results', 'diagxasr');
const LAMBDA = 0.0223606797749979, W = 0.02, SH = 6;
const CLAMP = process.env.SOLVER_CLAMP ? Number(process.env.SOLVER_CLAMP) : 1e-6;   // grid.js CLAMP, copied
const clampP = v => (v < CLAMP ? CLAMP : v > 1 - CLAMP ? 1 - CLAMP : v);
const expit = x => 1 / (1 + Math.exp(-x));

// audit-xas.mjs's households (audit-covb.mjs l.56-84, copied there): bridge 4 built from S126
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
export const UNITS = ['S370', 'bridge 4', 'S126'];
const BUILT = { 'bridge 4': { bridge: 4 } };
const caseOf = id => (BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
export const ARMS = [['BASE', {}], ['COV', { readerTax: true, coverage: true }]];
if (process.argv[2] === '--units') { console.log(UNITS.length); process.exit(0); }
const L = 'READER/TS+J/W0.02/PCLSI';
console.log(`XAS-R: ${L} at ${SH} share points, ${POINTS} wealth points, ${NPW} paths a world (seed ${SEED}); arms BASE and COV; the year-before reads three ways; ${UNITS.length} households; part ${pk}/${pn}`);
const f4 = x => (Number.isFinite(x) ? x.toExponential(4) : 'NaN');

// grid.js locInto and locLinInto (the hot read's locators) and the bucket helpers, copied; the replica check holds them
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
// the corner rows of a read in total-wealth coordinates: each row a wealth node, a split node and an allowance node, with
// its weight, its share bracket [ii, ii + 1] and the weight on ii + 1 (readValues' corners, grouped by share row)
function rowsOf(g, s, yr) {
  if (g.mode !== 'total' || g.gainInterp || g.pclsSeg) throw new Error('audit-xasr: the replica covers the total-wealth grid without gain interpolation or an allowance segment');
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
// the vector of a share row's point at share `a` (toVec with the share free)
function vecAt(g, ip, a, it, ig, ic, out) {
  const Wt = g.axes.W.pts[ip], b = g.axes.b.pts[it], pen = a * Wt, rest = Wt - pen, isa = b * rest;
  out[0] = pen; out[1] = isa; out[2] = rest - isa; out[3] = g.gain[ig]; out[4] = g.pcls[ic] * g.m.P.lsa; out[5] = g.pcls[ic] > 0 ? 1 : 0; out[6] = -1;
  return out;
}

UNITS.forEach((id, ui) => {
  if (ui % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`audit-xasr: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit ${L} | lambda ${LAMBDA} tier own riskAbove auto mix 3 | arms ${ARMS.map(a => a[0]).join(',')}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const R = {};
  for (const [key, o] of ARMS) {
    const t0 = Date.now();
    const r = solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS, shares: SH, bridgeRead: 'reader', bequestWeight: W, tierState: true, jointWorlds: true, pclsInterp: true, e3: false, ...o });
    if (!r.meta.tierState || !r.meta.jointWorlds || r.g.pclsInterp !== true || r.meta.e3) { console.error(`audit-xasr: ${id} ${key} ran tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds} pclsInterp ${r.g.pclsInterp}`); process.exit(2); }
    if (!!o.readerTax !== !!(r.g.reader && r.g.reader.tax) || !!o.coverage !== !!r.g.cov) { console.error(`audit-xasr: ${id} ${key}: the arm's settings did not take`); process.exit(2); }
    R[key] = r;
    console.log(`${''.padEnd(16)} solve ${key}: secs ${Math.round((Date.now() - t0) / 1000)} pts ${r.g.np} shares ${r.g.ni} readerYears ${r.g.reader ? r.g.reader.years.reduce((t, x) => t + (x ? 1 : 0), 0) : 0} readerTax ${r.meta.readerTax || '-'} coverage ${r.meta.coverage || '-'}`);
  }
  const base = R.BASE, m = base.m, T = m.ctx.totalYears, K = base.worlds.length, n = base.actions.length;
  const STEP = new Set(R.COV.g.reader && R.COV.g.reader.tax ? R.COV.g.reader.tax.map((x, t) => (x ? t : -1)).filter(t => t >= 0) : []);
  const RY = new Set(base.g.reader ? base.g.reader.years.map((x, t) => (x ? t : -1)).filter(t => t >= 0) : []);
  const BEFORE = new Set([...RY].filter(t => STEP.has(t + 1) && !STEP.has(t)));
  console.log(`${''.padEnd(16)} ran ${L}: mix ${K} pts ${POINTS} seed ${SEED} paths ${NPW * K} worlds ${K} steps ${[...STEP].join(',') || 'none'} before ${[...BEFORE].join(',') || 'none'} readerYears ${[...RY].join(',') || 'none'}`);
  const paths = E.pathsForSeed(SEED, NPW, T);
  const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n), SV = new Float64Array(n), RDB = new Float64Array(4);
  const CHK = { replica: 0, replicaBad: 0, nodes: 0, nodesBad: 0, cr: 0, crBad: 0, top: 0, topBad: 0 };
  const layerOf = (tab, prevAi) => (tab.tsLayers ? tab.tsLayers[tab.tsLayerOf[prevAi]] : tab);
  const readAt = (r, k, t, st, prevAi) => { const Ln = layerOf(r.mix.tables[k], prevAi); return readValues(r.g, Ln.lsurv[t], Ln.beq[t], st, RDB, Ln.lresil[t], Ln.short[t], t)[0]; };
  const oneStep = (tab, st, t, held, ai) => { scoreMoves(tab, st, t, SC, TX, BQ, held, null, SV); return SC[ai] === -Infinity ? 0 : SV[ai]; };
  // a node's survival in every world, as the cell loop builds it: the chooser's move across the mixture holding `held`,
  // each world's own survival of that move (scoreMoves against its t + 1 layers at the solve's 5 points), clamped as stored
  const VEC = new Float64Array(7), SV2 = new Float64Array(n), SC2 = new Float64Array(n), TX2 = new Float64Array(n), BQ2 = new Float64Array(n);
  const nodeS = (r, vec, t, held) => {
    const gh = r.giaHold, ai = chooseAction(r, vec, t, held); r.giaHold = gh;
    return r.mix.tables.map(tab => { scoreMoves(tab, vec, t, SC2, TX2, BQ2, held, null, SV2); return clampP(SC2[ai] === -Infinity ? 0 : SV2[ai]); });
  };
  // the read's pieces on one arm, world and layer: the reader's read, the plain read, (v-a) and (v-b)
  const cache = new Map();
  const reads = (r, k, t, st, prevAi, held) => {
    const g = r.g, Ln = layerOf(r.mix.tables[k], prevAi), ls = Ln.lsurv[t], RD = g.reader.of.get(ls);
    if (!RD) throw new Error(`audit-xasr: no reader table at year ${t}`);
    const tx = g.reader.tax ? g.reader.tax[t] : null, acc = s => s[1] + s[2];
    const prOf = s => (tx && tx.inBand(acc(s)) ? (tx.payable(s) ? 1 : 0) : RD.chance(acc(s)));
    const { a, rows } = rowsOf(g, st, t), nA = g.axes.a.n, top = rows.every(q => q.ii === nA - 2) ? 1 : rows.every(q => q.ii < nA - 2) ? 0 : -1;
    const pr = prOf(st);
    let cc = 0, rr = 0, lsum = 0, ccA = 0, rrA = 0, ccB = 0, rrB = 0, wA = 0, wB = 0, wsum = 0;
    const lj = r.mix.tables[k].tsLayerOf ? r.mix.tables[k].tsLayerOf[prevAi] : 0;
    for (const q of rows) {
      const iL = g.index(q.ip, q.ii, q.it, q.ig, q.ic), iH = g.index(q.ip, q.ii + 1, q.it, q.ig, q.ic);
      const cL = RD.c[iL], cH = RD.c[iH], rL = RD.R[iL], rH = RD.R[iH];
      const c0 = (1 - q.wa) * cL + q.wa * cH, r0 = (1 - q.wa) * rL + q.wa * rH;
      cc += q.w * c0; rr += q.w * r0; lsum += q.w * ((1 - q.wa) * ls[iL] + q.wa * ls[iH]); wsum += q.w;
      if (top !== 1 || q.w === 0) { ccA += q.w * c0; rrA += q.w * r0; ccB += q.w * c0; rrB += q.w * r0; continue; }
      const aL = g.cov ? null : g.axes.a.pts[q.ii], key = `${t}|${lj}|${q.ip}|${q.it}|${q.ig}|${q.ic}`;
      let row = cache.get(key);
      if (!row) {
        // the row's self-checks: the node builder at its real 0.8 and top nodes reproduces the solved survival in every
        // world; at a supported 0.8 node the reader's c and R
        const real = [q.ii, q.ii + 1].map(ii => nodeS(r, toVec(g, q.ip, ii, q.it, q.ig, q.ic, VEC, t), t, held));
        r.mix.tables.forEach((tab, kk) => {
          const L2 = layerOf(tab, prevAi), R2 = g.reader.of.get(L2.lsurv[t]);
          [q.ii, q.ii + 1].forEach((ii, x) => {
            const i = g.index(q.ip, ii, q.it, q.ig, q.ic);
            CHK.nodes++; if (!(Math.abs(real[x][kk] - expit(L2.lsurv[t][i])) <= 1e-9)) CHK.nodesBad++;
            if (x === 0 && R2) { const v = toVec(g, q.ip, ii, q.it, q.ig, q.ic, new Float64Array(7), t), p = R2.p[i]; if (p >= 0.5) { CHK.cr++; const c = Math.min(1, Math.max(0, real[0][kk] / p)); if (!(Math.abs(c - R2.c[i]) <= 1e-9 && Math.abs(real[0][kk] - p * c - R2.R[i]) <= 1e-9 && Math.abs(p - R2.chance(v[1] + v[2])) <= 1e-12)) CHK.crBad++; } }
          });
        });
        // (v-b): the cell's midpoint, every world from one choice
        const aLo = toVec(g, q.ip, q.ii, q.it, q.ig, q.ic, new Float64Array(7), t), aL0 = aLo[0] / (aLo[0] + aLo[1] + aLo[2] || 1);
        const aM = (aL0 + 1) / 2, vM = vecAt(g, q.ip, aM, q.it, q.ig, q.ic, new Float64Array(7)), sM = nodeS(r, vM, t, held);
        row = { aLo: aL0, aM, sM, accM: vM[1] + vM[2], va: new Map() };
        cache.set(key, row);
      }
      // (v-b) on this world: supported where p >= 0.5, else the reader's copy (the 0.8 node's c)
      const pM = RD.chance(row.accM), supM = pM >= 0.5, cM = supM ? Math.min(1, Math.max(0, row.sM[k] / pM)) : cL, rM = row.sM[k] - pM * cM;
      let cb_, rb_;
      if (a <= row.aM) { const l = (a - row.aLo) / (row.aM - row.aLo); cb_ = (1 - l) * cL + l * cM; rb_ = (1 - l) * rL + l * rM; }
      else { const l = (a - row.aM) / (1 - row.aM); cb_ = (1 - l) * cM + l * cH; rb_ = (1 - l) * rM + l * rH; }
      ccB += q.w * cb_; rrB += q.w * rb_; if (supM) wB += q.w;
      // (v-a) on this world: a supported node at the row's own edge a* (reference chance 0.5), when a* lies inside the cell
      let vk = row.va.get(k);
      if (vk === undefined) {
        const Wr = g.axes.W.pts[q.ip], accLo = Wr * (1 - row.aLo);
        vk = null;
        if (RD.chance(accLo) >= 0.5 && !(RD.chance(0) >= 0.5)) {
          let lo = 0, hi = accLo;
          for (let it = 0; it < 80; it++) { const mid = (lo + hi) / 2; if (RD.chance(mid) >= 0.5) hi = mid; else lo = mid; }
          const aS = 1 - hi / Wr;
          if (aS > row.aLo + 1e-9 && aS < 1) {
            const v = vecAt(g, q.ip, aS, q.it, q.ig, q.ic, new Float64Array(7)), pS = RD.chance(v[1] + v[2]), sS = nodeS(r, v, t, held)[k];
            const cS = Math.min(1, Math.max(0, sS / pS));
            vk = { aS, cS, rS: sS - pS * cS };
          }
        }
        row.va.set(k, vk);
      }
      if (vk && a < vk.aS) { const l = (a - row.aLo) / (vk.aS - row.aLo); ccA += q.w * ((1 - l) * cL + l * vk.cS); rrA += q.w * ((1 - l) * rL + l * vk.rS); wA += q.w; }
      else { ccA += q.w * c0; rrA += q.w * r0; }
    }
    const asm = (c, r_) => clampP(pr * c + r_);
    return { top, rr: asm(cc, rr), plain: expit(lsum), va: asm(ccA, rrA), vb: asm(ccB, rrB), vaw: wsum > 0 ? wA / wsum : 0, vbs: wsum > 0 ? wB / wsum : 0 };
  };

  const X = { p: [], t: [], k: [], top: [], arms: Object.fromEntries(ARMS.map(([a]) => [a, { read: [], ex5: [], rr: [], plain: [], va: [], vb: [], vaw: [], vbs: [] }])) };
  const t2 = Date.now();
  if (id !== 'S126') {
    for (let k = 0; k < K; k++) {
      const z = base.mix.nodes[k];
      paths.forEach((zs, pi) => {
        const cz = Float64Array.from(zs); cz[cz.length - 1] = z;
        let prev = -1;
        const choose = (t, st, held) => {
          const ai = chooseAction(base, st, t, held), gh = base.giaHold;
          if (prev >= 0 && BEFORE.has(t)) {
            X.p.push(pi); X.t.push(t); X.k.push(k);
            let tp = null;
            for (const [a] of ARMS) {
              const tab = R[a].mix.tables[k], A = X.arms[a], read = readAt(R[a], k, t, st, prev), e5 = oneStep(tab, st, t, held, ai), q = reads(R[a], k, t, st, prev, held);
              A.read.push(read); A.ex5.push(e5); A.rr.push(q.rr); A.plain.push(q.plain); A.va.push(q.va); A.vb.push(q.vb); A.vaw.push(q.vaw); A.vbs.push(q.vbs);
              CHK.replica++; if (!(Math.abs(q.rr - read) <= 1e-12)) CHK.replicaBad++;
              if (tp === null) tp = q.top;
            }
            CHK.top++; if (tp !== 0 && tp !== 1) CHK.topBad++;
            X.top.push(tp);
          }
          base.giaHold = gh;
          prev = ai;
          return ai;
        };
        runPolicy(base, cz, { choose });
      });
    }
    const N = X.t.length;
    for (const [a] of ARMS) {
      const A = X.arms[a], mean = f => (N ? X.t.reduce((s, _, j) => s + f(j), 0) / N : NaN);
      if ([A.read, A.ex5, A.rr, A.va, A.vb].some(v => v.length !== N)) { console.error(`audit-xasr: ${id} ${a}: the reads do not line up`); process.exit(2); }
      console.log(`${''.padEnd(16)} xasr ${a}: reads ${N} top ${X.top.filter(x => x === 1).length} rep ${f4(mean(j => A.read[j] - A.ex5[j]))} va ${f4(mean(j => A.va[j] - A.ex5[j]))} vb ${f4(mean(j => A.vb[j] - A.ex5[j]))} plain ${f4(mean(j => A.plain[j] - A.ex5[j]))} vaw ${f4(mean(j => A.vaw[j]))} vbs ${f4(mean(j => A.vbs[j]))} secs ${Math.round((Date.now() - t2) / 1000)}`);
    }
    console.log(`${''.padEnd(16)} checks: replica ${CHK.replica - CHK.replicaBad}/${CHK.replica} nodes ${CHK.nodes - CHK.nodesBad}/${CHK.nodes} cr ${CHK.cr - CHK.crBad}/${CHK.cr} top ${CHK.top - CHK.topBad}/${CHK.top}`);
    if (CHK.replicaBad || CHK.nodesBad || CHK.crBad || CHK.topBad || !N || !CHK.nodes || !CHK.cr) { console.error(`audit-xasr: ${id}: a self-check failed or ran on nothing`); process.exit(2); }
  }
  const rec = { id, p: X.p, t: X.t, k: X.k, top: X.top, arms: Object.fromEntries(ARMS.map(([a]) => [a, Object.fromEntries(Object.entries(X.arms[a]).map(([q, v]) => [q, v.map(x => Math.round(x * 1e12) / 1e12)]))])) };
  // S126's opening: each arm's mixture score of both opening moves, split by term
  if (id === 'S126') {
    const st0 = { v: null }, mv = {};
    runPolicy(base, Float64Array.from(paths[0]), { choose: (t, st, held) => { if (t === 0 && !st0.v) st0.v = { st: Float64Array.from(st), held }; return chooseAction(base, st, t, held); } });
    const { st, held } = st0.v;
    for (const [a] of ARMS) mv[a] = chooseAction(R[a], st, 0, held);
    const terms = (r, ai) => {
      const o = { score: 0, surv: 0, resil: 0, beq: 0, short: 0 };
      r.mix.tables.forEach((tab, kk) => {
        const w = r.mix.weights[kk];
        scoreMoves(tab, st, 0, SC, TX, BQ, held, null, SV); const s1 = SC[ai], sv = SV[ai], bq = BQ[ai];
        const wR0 = tab.wR; tab.wR = 0;
        try { scoreMoves(tab, st, 0, SC, TX, BQ, held, null, SV); } finally { tab.wR = wR0; }
        const s0 = SC[ai];
        o.score += w * s1; o.surv += w * sv; o.resil += w * (s1 - s0); o.beq += w * tab.wB * bq; o.short += w * (sv + tab.wB * bq - s0);
      });
      return o;
    };
    rec.open = {};
    let bad = 0;
    for (const [a] of ARMS) {
      for (const [lab, ai] of [['BASE-move', mv.BASE], ['COV-move', mv.COV]]) {
        const o = terms(R[a], ai);
        if (!(Math.abs(o.surv + o.resil + o.beq - o.short - o.score) <= 1e-12)) bad++;
        rec.open[`${a} ${lab}`] = o;
        console.log(`${''.padEnd(16)} terms ${a} ${lab} ${ai}: score ${f4(o.score)} surv ${f4(o.surv)} resil ${f4(o.resil)} beq ${f4(o.beq)} short ${f4(o.short)}`);
      }
      console.log(`${''.padEnd(16)} open ${a}: move ${mv[a]}`);
    }
    console.log(`${''.padEnd(16)} checks: terms ${4 - bad}/4`);
    if (bad) { console.error(`audit-xasr: ${id}: the terms do not add to the score`); process.exit(2); }
    rec.mv = mv;
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${id.replace(/\s+/g, '_')}.json.gz`), gzipSync(JSON.stringify({ stamp: STAMP, seed: SEED, npw: NPW, points: POINTS, ...rec })));
  console.log(`${''.padEnd(16)} done ${L} rss ${Math.round(process.resourceUsage().maxRSS / 1024)}MB`);
});
