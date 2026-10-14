/*
 * NODE-AX (PLAN.md NODE-AX; predictions/diag-nodeax.md; the deep review after NODE-1, deep-review-log.md 14 Oct 06:33 UK;
 * UR's root-cause step NE-AXIS run on S360 first). What carries S360's remaining under-read with the dense share nodes?
 * Two jobs, the candidate's own unit (solveCandidate, e3pcls on), seed 7002, both under the order-drawn reference, both
 * NODE-1's (the same code: BN reproduces NODE-1's tables and runs, BO likewise):
 *   BN   S360 at 60 wealth points with the review's fifteen pension-share nodes (b at six);
 *   BO   S360 at 60 points at six linear shares (the known positive: its share term must exceed BN's).
 * THE LEDGER (re-cut after the escalation review, escalations/14-Oct-bridge-under-read-report.md), on the first `paths`
 * paths a world of seed 7002 (NODE-1's), the own opening forced in year 0 and the policy after it (runPolicy's visit hook
 * gives each year's state, held tiers and move). Per path, in world k's tables:
 *   B_t   the one-step value of the move taken at the state (scoreMoves, that move alone): the chance it pays this year's
 *         flow times the next year's table read at the five quadrature returns, in the layer of the tiers it moves to;
 *   V_t   the table read at the state in the layer of the tiers held (readValues), t >= 1;
 *   G_t = V_t - B_t (the table's Bellman residual at the state the policy visits);
 *   T_t = B_t - (V_{t+1} at the next state if the run goes on; the end rule's alive at t = T; 0 when the run fails at t)
 *         (the quadrature's error and the path's own noise);
 *   so OWN - survived = sum_t T_t + sum_{t>=1} G_t exactly on every path (the identity, held to 1e-9). Saved per path: the
 *   survival, the own table, sum T, the bridge years' G (GB) and its part in years 4 to 6 (GL), G after the bridge (GA),
 *   and G in each bridge year (Y<t>); GD, the bridge years' G in the de-risked tier layers held (any layer but the plan
 *   tier's), with NB and ND, the path's bridge path-years in all layers and in those; and on the first 1,000 paths a world
 *   QF, the bridge years' quadrature term: B_t less the move's one-step value at a fine rule (1,024 equal-weight midpoints
 *   in u = Phi(z), no step split; the deep review after NODE-AX's registration, deep-review-log.md 14 Oct 18:51 UK).
 *   Printed: per year the means, and per tier layer held the bridge years' G. Saved: the bridge path records (path, year,
 *   move, tiers held, state) of every world.
 * Self-checks (each must pass, or the job refuses, exit 3): ownTook (the ledger's B_0 is the printed own table);
 * identity (every path closes to 1e-9); qfTook (the fine rule's own machinery - a shallow copy of the table, the node
 * returns rebuilt from the move's rates - reproduces B_t bit for bit at the five nodes at every visit QF reads). The bridge years' survival tables of every world and layer are saved (log-odds,
 * Float32) with the per-path arrays.
 * Reported per bridge year (Step 0 of the review): the cliff of the plan-tier layer's reference in accessible money
 * (where its chance crosses 0.05 and 0.95) against the money one share cell and one wealth cell span at the median state.
 * Plants (NODEAX_PLANT, each must make the job refuse, exit 3): arm (BN without its nodes: armTook fails), layer (G read
 * in the layer of the move taken, T in the tiers held: identity fails), own (the ledger's first move not the opening:
 * ownTook fails), quad (the rebuilt node returns from the central world's context, the world's shift missed: qfTook
 * fails).
 *   node research/solver/audit-nodeax.mjs [scale=1] [paths a world=4000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy, chooseAction, scoreMoves, NODES, WEIGHTS } from '../../src/solver/solve.js';
import { readValues, locateVec } from '../../src/solver/grid.js';
import { solveCandidate, CANDIDATE_OPTS } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { SEED as SEED_7U } from './panel-7u.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

export const NODES_A = Object.freeze([0, 0.2, 0.4, 0.6, 0.7, 0.75, 0.8, 0.825, 0.85, 0.875, 0.9, 0.925, 0.95, 0.975, 1]);
export const JOBS = [['S360', 'BN', 60, NODES_A.length, 5], ['S360', 'BO', 60, 6, 5]];
export const ARMS = Object.freeze({ BN: { readerRef: 'order', shareNodes: NODES_A }, BO: { readerRef: 'order' } });
export const GRIDA = Object.freeze({ BN: NODES_A.length, BO: 6 });
export const FLOORS = Object.freeze({ S360: 5000 });
export const jobLabel = ([, arm, pts, sh, qn]) => `${arm}/P${pts}S${sh}Q${qn}`;
if (process.argv[2] === '--units') { console.log(JOBS.length); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const SCALE = Number(process.argv[2] || 1), NPW = Number(process.argv[3] || 4000);
if (!(SCALE >= 1) || !(NPW >= 1)) { console.error(`audit-nodeax: bad scale or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-nodeax: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-nodeax: seed ${process.argv[6]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const PLANT = process.env.NODEAX_PLANT || '';
if (PLANT && !['arm', 'layer', 'own', 'quad'].includes(PLANT)) { console.error(`audit-nodeax: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979, W = 0.02, CLAMP = 1e-6, TOL = 1e-9;
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-nodeax: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAGNODEAX_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagnodeax');
mkdirSync(OUT, { recursive: true });

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const caseOf = id => all.find(s => s.id === id);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const sha16 = x => createHash('sha256').update(Buffer.from(x.buffer, x.byteOffset, x.byteLength)).digest('hex').slice(0, 16);
export const fileOfJob = job => `${job[0]}-${jobLabel(job).replace(/\//g, '-')}.json.gz`;
const H0 = () => ({ pen: 0, isa: 0, gia: 0 });
const clampP = x => (x < CLAMP ? CLAMP : x > 1 - CLAMP ? 1 - CLAMP : x);
const f6 = x => x.toFixed(6), f4 = x => x.toFixed(4);
// the per-path quantities saved (survival probability units; the reducer reads points)
// X survived, B0 the own table, T the quadrature and noise, GB and GA the grid's residual in and after the bridge (B0 - X =
// T + GB + GA), GL the bridge's residual in years 4 to 6; and Y<t>, the residual in each bridge year t (added per job)
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
// QF on the first NQF paths a world, at NFINE equal-weight midpoints in u (the inverse normal by Acklam's rational
// approximation, relative error under 1.2e-9, then one Newton step on Phi)
export const NQF = 1000, NFINE = 1024;
const PhiInvA = u => {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const lo = 0.02425, q0 = Math.min(u, 1 - u);
  let z;
  if (q0 < lo) { const q = Math.sqrt(-2 * Math.log(q0)); z = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); if (u > 0.5) z = -z; }
  else { const q = u - 0.5, r = q * q; z = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  return z;
};
const ZF = Array.from({ length: NFINE }, (_, i) => PhiInvA((i + 0.5) / NFINE)), WF = new Array(NFINE).fill(1 / NFINE);
// a move's rate at draw z, rebuilt as solve.js realAt builds the node rates (zPath 0)
const realAtRep = (c, z, act, t) => { const R = act.real, Vv = act.volEffAt[t], S = act.sigma, out = new Float64Array(4); for (let q = 0; q < 4; q++) out[q] = Math.exp(Math.log(1 + R[q]) + S[q] * 0 + Vv[q] * z) - 1; return out; };

console.log(`NODE-AX: the candidate's own unit, ${NPW} paths a world, wealth points divided by ${SCALE} (seed ${SEED}); ${JOBS.length} jobs; part ${part}`);
JOBS.forEach((job, ji) => {
  if (ji % pn !== pk) return;
  const [id, arm, pts0, , quad] = job;
  const h = caseOf(id);
  if (!h) { console.error(`audit-nodeax: no case ${id}`); process.exit(2); }
  const PTS = Math.max(4, Math.round(pts0 / SCALE)), L = jobLabel(job);
  console.log(`${id.padEnd(16)} case | job ${L} | points ${PTS} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const extra = { ...(PLANT === 'arm' && arm === 'BN' ? { readerRef: 'order' } : ARMS[arm]), ...(quad !== 5 ? { quadNodes: quad } : {}) };
  const cand = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, ...extra });
  const mt = cand.meta;
  const common = !!mt.tierState && !!mt.jointWorlds && !!mt.e3pcls && cand.switchMargin === 0 && cand.switchCharge === 0.001 && Math.abs(mt.bequestWeight - W) < 1e-12 && mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && !mt.readerChance && !mt.readerBlend && !mt.readerSplit;
  const nodesOk = arm === 'BN' ? Array.isArray(mt.shareNodes) && mt.shareNodes.join(',') === NODES_A.join(',') : mt.shareNodes === undefined;
  const took = mt.readerRef === 'order' && nodesOk && mt.points === `total ${PTS} x ${GRIDA[arm]} x 6` && cand.m.ctx.solvencyFloor === FLOORS[id] && mt.readerSupportLine === 0.5;
  const s0v = M.initialState(cand.m);
  const table = 100 * cand.worlds.reduce((t, wd, k) => t + cand.mix.weights[k] * wd.value(s0v, 0).survival, 0);
  console.log(`${''.padEnd(16)} solve CAND ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran CAND ${L}: bridgeRead ${mt.bridgeRead} bridgeStep ${mt.bridgeStep} readerSplit ${mt.readerSplit} readerBlend ${mt.readerBlend} readerRef ${mt.readerRef || null} readerChance ${mt.readerChance} tierState ${mt.tierState} jointWorlds ${!!mt.jointWorlds} e3pcls ${!!mt.e3pcls} switchMargin ${cand.switchMargin} switchCharge ${cand.switchCharge} bequestWeight ${mt.bequestWeight} mix ${cand.mix.nodes.length} pts ${PTS} grid ${String(mt.points).replace(/ /g, '')} shareNodes ${mt.shareNodes ? mt.shareNodes.join(',') : 'none'} floor ${cand.m.ctx.solvencyFloor} line ${mt.readerSupportLine}`);
  console.log(`${''.padEnd(16)} checks ${L}: armTook ${took && common ? 1 : 0}/1`);
  if (!(took && common)) { console.error(`audit-nodeax: ${id} ${L}: the job's settings did not take`); process.exit(3); }
  const m = cand.m, T = m.ctx.totalYears, acts = cand.actions, n = acts.length, K = cand.mix.nodes.length;
  let s0 = null;
  runPolicy(cand, E.pathsForSeed(SEED, 1, T)[0], { choose: (t, st, held) => { if (t === 0 && !s0) s0 = Float64Array.from(st); return chooseAction(cand, st, t, held); } });
  const ownC = chooseAction(cand, s0, 0, H0());
  console.log(`${''.padEnd(16)} openings ${L}: OWN ai ${ownC} level ${cand.levelOf[ownC]} tiers ${acts[ownC].tierPen || 0},${acts[ownC].tierIsa || 0}`);
  const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n), SV = new Float64Array(n), rd = new Float64Array(4);
  // B: world tab's one-step value of move ai at state s, year t, tiers held
  const B = (tab, s, t, ai, held) => { scoreMoves(tab, s, t, SC, TX, BQ, { ...held }, { ai, act: tab.c.acts[ai], nr: tab.nodeRealOfAt[Math.min(t, tab.nodeRealOfAt.length - 1)][ai] }, SV); return SV[ai]; };
  // the copy's one-step value: `fine` at the fine rule with the step split off, otherwise at the five nodes rebuilt (qfTook)
  const nrCache = new Map();
  const Bq = (tab, s, t, ai, held, fine) => {
    const kk = `${fine ? 'f' : 'n'}/${t}/${ai}/${tab === cand.mix.tables[0] ? 0 : cand.mix.tables.indexOf(tab)}`;
    // the plant `quad` rebuilds them from the central world's context, missing the world's shift (the one place it lands)
    const cc = PLANT === 'quad' ? cand.c : tab.c;
    let nr = nrCache.get(kk); if (!nr) { nr = (fine ? ZF : NODES).map(z => realAtRep(cc, z, cc.acts[ai], t)); nrCache.set(kk, nr); }
    const r = fine ? { ...tab, stepExact: false, quadWeights: WF } : { ...tab, quadWeights: WEIGHTS };
    scoreMoves(r, s, t, SC, TX, BQ, { ...held }, { ai, act: tab.c.acts[ai], nr }, SV); return SV[ai];
  };
  const layerOf = (tab, ai) => (tab.tsLayers ? tab.tsLayers[tab.tsLayerOf[ai]] : tab);
  const layerHeld = (tab, held) => (tab.tsLayers ? tab.tsLayers[tab.tsLayerOf.findIndex((_, ai) => (acts[ai].tierPen || 0) === held.pen && (acts[ai].tierIsa || 0) === held.isa)] : tab);
  const V = (tab, Ly, s, t) => { readValues(tab.g, Ly.lsurv[t], Ly.beq[t], s, rd, Ly.lresil[t], Ly.short[t], t); return rd[0]; };
  const g = cand.mix.tables[0].g, bridge = [];
  for (let t = 1; t <= T; t++) if (g.reader && g.reader.years[t]) bridge.push(t);
  console.log(`${''.padEnd(16)} bridge ${L}: reader years ${bridge.join(',')}`);
  const f0 = Date.now(), wpaths = E.pathsForSeed(SEED, NPW, T), bits = {}, per = {};
  const worldPath = (i, k) => { const cz = Float64Array.from(wpaths[i]); cz[cz.length - 1] = cand.mix.nodes[k]; return cz; };
  let idOk = 0, idN = 0, ownOk = 0, qfOk = 0, qfN = 0;
  const li0 = (() => { const t0b = cand.mix.tables[0]; return t0b.tsLayerOf ? t0b.tsLayerOf[t0b.tsLayerOf.findIndex((_, ai) => (acts[ai].tierPen || 0) === 0 && (acts[ai].tierIsa || 0) === 0)] : 0; })();
  const NQ = Math.min(NPW, NQF), recS = [], recM = [];
  const YK = bridge.map(t => `Y${t}`), nL = cand.mix.tables[0].tsLayers ? cand.mix.tables[0].tsLayers.length : 1;
  for (let k = 0; k < K; k++) {
    const tab = cand.mix.tables[k];
    console.log(`${''.padEnd(16)} tables ${L} ${k} z ${cand.mix.nodes[k].toFixed(6)} weight ${cand.mix.weights[k].toFixed(6)}: OWN ${(100 * B(tab, s0, 0, ownC, H0())).toFixed(6)} READ ${(100 * cand.worlds[k].value(s0v, 0).survival).toFixed(6)}`);
    const A = Object.fromEntries([...KEYS, ...YK, 'NB', 'ND'].map(x => [x, new Float64Array(NPW)])), b = new Uint8Array(NPW), bb = new Uint8Array(NPW), QF = new Float64Array(NQ);
    const yr = { G: new Float64Array(T + 2), T: new Float64Array(T + 2) }, yrN = new Float64Array(T + 2), byL = new Float64Array(nL), byLN = new Float64Array(nL);
    const stat = bridge.map(() => ({ W: [], a: [] }));
    const other = (() => { for (let ai = 0; ai < n; ai++) if (ai !== ownC && cand.levelOf[ai] !== cand.levelOf[ownC]) return ai; return ownC; })();
    for (let i = 0; i < NPW; i++) {
      const rec = [];
      const r = runPolicy(cand, worldPath(i, k), { start: { t: 0, s: s0, held: H0(), firstAi: PLANT === 'own' ? other : ownC }, visit: (t, s, held, ai) => rec.push({ t, s: Float64Array.from(s), held: { ...held }, ai }) });
      b[i] = r.survived ? 1 : 0; bb[i] = r.survived || !r.preAccess ? 1 : 0;
      const X = b[i], Bv = rec.map(x => B(tab, x.s, x.t, x.ai, x.held)), Vv = rec.map((x, j) => (j === 0 ? NaN : V(tab, layerOf(tab, rec[j - 1].ai), x.s, x.t)));
      let Ts = 0, Gs = 0, GB = 0, GA = 0, GL = 0, GD = 0, NB = 0, ND = 0, QFs = 0;
      for (let j = 0; j < rec.length; j++) {
        const x = rec[j], last = j === rec.length - 1, next = last ? (x.t >= T ? X : 0) : Vv[j + 1], Tj = Bv[j] - next;
        Ts += Tj; yr.T[x.t] += Tj; yrN[x.t]++;
        if (j === 0) continue;
        // the plant `layer` reads G's table in the layer of the move taken, not the tiers held, so T and G no longer telescope
        const Vj = PLANT === 'layer' ? V(tab, layerOf(tab, x.ai), x.s, x.t) : Vv[j], Gj = Vj - Bv[j];
        Gs += Gj; yr.G[x.t] += Gj;
        const bi = bridge.indexOf(x.t);
        if (bi < 0) { GA += Gj; continue; }
        GB += Gj; A[`Y${x.t}`][i] += Gj; if (x.t >= 4 && x.t <= 6) GL += Gj;
        const li = tab.tsLayerOf ? tab.tsLayerOf[rec[j - 1].ai] : 0; byL[li] += Gj; byLN[li]++;
        NB++; if (li !== li0) { GD += Gj; ND++; }
        recS.push(...x.s); recM.push(k, i, x.t, x.ai, x.held.pen || 0, x.held.isa || 0, li);
        if (i < NQ) { const Bc = Bq(tab, x.s, x.t, x.ai, x.held, false); qfN++; if (Bc === Bv[j]) qfOk++; QFs += Bv[j] - Bq(tab, x.s, x.t, x.ai, x.held, true); }
        const Wq = x.s[0] + x.s[1] + x.s[2]; stat[bi].W.push(Wq); stat[bi].a.push(Wq > 0 ? x.s[0] / Wq : 0);
      }
      const B0 = Bv[0], resid = B0 - X - Ts - Gs;
      idN++; if (Math.abs(resid) <= TOL) idOk++;
      if (Math.abs(B0 - B(tab, s0, 0, ownC, H0())) <= TOL) ownOk++;
      A.X[i] = X; A.B0[i] = B0; A.T[i] = Ts; A.GB[i] = GB; A.GA[i] = GA; A.GL[i] = GL; A.GD[i] = GD; A.NB[i] = NB; A.ND[i] = ND;
      if (i < NQ) QF[i] = QFs;
    }
    bits[`OWN${k}`] = b; bits[`OWN${k}b`] = bb;
    for (const x of [...KEYS, ...YK, 'NB', 'ND']) per[`${x}${k}`] = A[x];
    per[`QF${k}`] = QF;
    console.log(`${''.padEnd(16)} sim ${L} ${k} OWN ai ${ownC}: ${b.reduce((t, x) => t + x, 0)}/${NPW} bridge ${bb.reduce((t, x) => t + x, 0)} bits ${sha16(b)} ${sha16(bb)}`);
    const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
    console.log(`${''.padEnd(16)} ledger ${L} ${k}: ${[...KEYS, ...YK].map(x => `${x} ${f6(100 * mean(A[x]))}`).join(' ')}`);
    for (let t = 1; t <= T; t++) if (yrN[t] > 0) console.log(`${''.padEnd(16)} year ${L} ${k} ${t}: paths ${yrN[t]} ${['G', 'T'].map(x => `${x} ${f6(100 * yr[x][t] / NPW)}`).join(' ')}`);
    console.log(`${''.padEnd(16)} derisk ${L} ${k}: plan layer ${li0} bridge path-years ${A.NB.reduce((t, x) => t + x, 0)} de-risked ${A.ND.reduce((t, x) => t + x, 0)} GD ${f6(100 * mean(A.GD))}`);
    console.log(`${''.padEnd(16)} qf ${L} ${k}: paths ${NQ} QF ${f6(100 * mean(QF))}`);
    for (let li = 0; li < nL; li++) console.log(`${''.padEnd(16)} layer ${L} ${k} ${li}: bridge path-years ${byLN[li]} G ${f6(100 * byL[li] / NPW)}`);
    // Step 0: the cliff of the plan-tier layer's reference in accessible money, against the cells at the median state
    const Ly0 = layerHeld(tab, H0()), med = v => { const s = [...v].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
    bridge.forEach((t, bi) => {
      const RD = g.reader.of.get(Ly0.lsurv[t]), at = pr => { let lo = 0, hi = 1e7; for (let it = 0; it < 80; it++) { const mid = 0.5 * (lo + hi); if (RD.chance(mid) < pr) lo = mid; else hi = mid; } return hi; };
      const a5 = at(0.05), a95 = at(0.95), Wm = med(stat[bi].W), am = med(stat[bi].a);
      const la = locateVec(g, Float64Array.from([am * Wm, 0.5 * (1 - am) * Wm, 0.5 * (1 - am) * Wm, 0, 0, 0, -1]));
      const aCell = Wm * (g.axes.a.pts[la.i.i + 1] - g.axes.a.pts[la.i.i]), wCell = (1 - am) * (g.axes.W.pts[la.p.i + 1] - g.axes.W.pts[la.p.i]);
      console.log(`${''.padEnd(16)} cliff ${L} ${k} ${t}: acc5 ${a5.toFixed(0)} acc95 ${a95.toFixed(0)} width ${(a95 - a5).toFixed(0)}; median W ${Number.isFinite(Wm) ? Wm.toFixed(0) : 'none'} share ${Number.isFinite(am) ? am.toFixed(4) : 'none'}; share cell ${Number.isFinite(aCell) ? aCell.toFixed(0) : 'none'} wealth cell ${Number.isFinite(wCell) ? wCell.toFixed(0) : 'none'} in accessible money`);
    });
  }
  console.log(`${''.padEnd(16)} checks ${L}: ownTook ${ownOk}/${idN} identity ${idOk}/${idN} qfTook ${qfOk}/${qfN} secs ${Math.round((Date.now() - f0) / 1000)}`);
  if (ownOk !== idN || idOk !== idN) { console.error(`audit-nodeax: ${id} ${L}: the ledger does not close on every path (ownTook ${ownOk}/${idN} identity ${idOk}/${idN})`); process.exit(3); }
  if (!(qfN > 0) || qfOk !== qfN) { console.error(`audit-nodeax: ${id} ${L}: the fine rule's machinery does not reproduce the one-step value (qfTook ${qfOk}/${qfN})`); process.exit(3); }
  // the bridge years' survival tables (log-odds, Float32) of every world and layer, so a later read needs no re-solve of the grid
  const tables = {};
  for (let k = 0; k < K; k++) { const tab = cand.mix.tables[k], Ls = tab.tsLayers || [tab]; Ls.forEach((Ly, li) => { for (const t of [...bridge, bridge[bridge.length - 1] + 1]) tables[`${k}/${li}/${t}`] = b64(Float32Array.from(Ly.lsurv[t])); }); }
  writeFileSync(join(OUT, fileOfJob(job)), gzipSync(JSON.stringify({ id, job: L, stamp: STAMP, NPW, seed: SEED, own: ownC, bridge, nqf: NQ, nfine: NFINE, paths: { cols: 'world path year move tierPen tierIsa layer', meta: b64(Int32Array.from(recM)), dim: recS.length / (recM.length / 7), states: b64(Float32Array.from(recS)) }, bits: Object.fromEntries(Object.entries(bits).map(([x, v]) => [x, b64(v)])), per: Object.fromEntries(Object.entries(per).map(([x, v]) => [x, b64(v)])), tables })));
  console.log(`${''.padEnd(16)} file ${L}: ${fileOfJob(job)}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
