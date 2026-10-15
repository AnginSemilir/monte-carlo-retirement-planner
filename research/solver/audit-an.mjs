/*
 * AN (PLAN.md AREF, its AN arm; predictions/diag-an.md; the deep review after AREF Step 0, deep-review-log.md 15 Oct 10:13
 * UK). Does the adaptive reference (`readerRef: 'adaptive'`, src/solver/adaptive.js: the policy's own floor moves' chance
 * of paying the bridge by backward induction over the accessible money, its ISA share and gain fraction, the last bridge
 * year exact) remove S360's bridge-years grid residual? One job, NODE-AX's BN with its reference swapped: S360 at 60 wealth
 * points with NODE-AX's fifteen pension-share nodes, the candidate's own unit, seed 7002, the same ledger as NODE-AX's
 * (audit-nodeax.mjs, copied: B_t, V_t, G_t, T_t, the identity, GB, GL, GA, GD, Y<t>, QF and the saved bridge records and
 * tables), so its control is NODE-AX's saved BN (results/diagnodeax), behind NODE-AX's gate.
 * Self-checks as NODE-AX's (armTook, ownTook, identity, qfTook, layerTook), and adaptTook: the reference built, its last
 * bridge year's threshold monotone in the accessible money at every lattice point (nonMono 0), at the registered lattice.
 * refTook: in each p-bin of each world, the mean adaptive p at sampled in-band bridge records against the reference's own
 * rule run forward from each (adaptive.js simulate: its nearest joint move, the flow, the world's returns at fresh draws,
 * the tuning seed scaled, 7002 x 1000 + world, so no registry seed is a state), within 0.02 plus three standard errors (Step 0's dpTook); the bins where p sits above are counted (O157).
 * Plants (AN_PLANT, each must make the job refuse, exit 3): arm (AN under the order-drawn reference: armTook fails), drift
 * and choice (the reference's DP grows every world at the centre's rates, or values each world at its own best move:
 * refTook fails), step (the last bridge year read off the lattice, Step 0's smear: printed, its refTook read), and NODE-AX's
 * layer, own, quad and held.
 *   node research/solver/audit-an.mjs [scale=1] [paths a world=4000] part k/n [seed=7002]
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
export const JOBS = [['S360', 'AN', 60, NODES_A.length, 5]];
export const ARMS = Object.freeze({ AN: { readerRef: 'adaptive', shareNodes: NODES_A } });
// the reference's lattice (adaptive.js defaults); AN_LATTICE=na,nb,nz overrides it for a build check only, and the gate reads it
export const LATTICE = Object.freeze({ na: 160, nb: 41, nz: 128 });
const LAT = process.env.AN_LATTICE ? (([na, nb, nz]) => ({ na, nb, nz }))(process.env.AN_LATTICE.split(',').map(Number)) : LATTICE;
export const GRIDA = Object.freeze({ AN: NODES_A.length });
export const FLOORS = Object.freeze({ S360: 5000 });
export const jobLabel = ([, arm, pts, sh, qn]) => `${arm}/P${pts}S${sh}Q${qn}`;
if (process.argv[2] === '--units') { console.log(JOBS.length); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const SCALE = Number(process.argv[2] || 1), NPW = Number(process.argv[3] || 4000);
if (!(SCALE >= 1) || !(NPW >= 1)) { console.error(`audit-an: bad scale or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-an: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-an: seed ${process.argv[6]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const PLANT = process.env.AN_PLANT || '';
if (PLANT && !['arm', 'layer', 'own', 'quad', 'held', 'drift', 'choice', 'step'].includes(PLANT)) { console.error(`audit-an: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979, W = 0.02, CLAMP = 1e-6, TOL = 1e-9;
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-an: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAGAN_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagan');
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
// approximation, relative error under 1.2e-9; no refinement step)
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

console.log(`AN: the candidate's own unit, ${NPW} paths a world, wealth points divided by ${SCALE} (seed ${SEED}); ${JOBS.length} jobs; part ${part}`);
JOBS.forEach((job, ji) => {
  if (ji % pn !== pk) return;
  const [id, arm, pts0, , quad] = job;
  const h = caseOf(id);
  if (!h) { console.error(`audit-an: no case ${id}`); process.exit(2); }
  const PTS = Math.max(4, Math.round(pts0 / SCALE)), L = jobLabel(job);
  console.log(`${id.padEnd(16)} case | job ${L} | points ${PTS} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const extra = { ...(PLANT === 'arm' ? { readerRef: 'order', shareNodes: NODES_A } : ARMS[arm]), adaptiveLattice: { ...LAT, ...(['drift', 'choice', 'step'].includes(PLANT) ? { plant: PLANT } : {}) }, ...(quad !== 5 ? { quadNodes: quad } : {}) };
  const cand = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, ...extra });
  const mt = cand.meta;
  const common = !!mt.tierState && !!mt.jointWorlds && !!mt.e3pcls && cand.switchMargin === 0 && cand.switchCharge === 0.001 && Math.abs(mt.bequestWeight - W) < 1e-12 && mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && !mt.readerChance && !mt.readerBlend && !mt.readerSplit;
  const nodesOk = arm === 'AN' ? Array.isArray(mt.shareNodes) && mt.shareNodes.join(',') === NODES_A.join(',') : mt.shareNodes === undefined;
  const took = mt.readerRef === 'adaptive' && nodesOk && mt.points === `total ${PTS} x ${GRIDA[arm]} x 6` && cand.m.ctx.solvencyFloor === FLOORS[id] && mt.readerSupportLine === 0.5;
  const s0v = M.initialState(cand.m);
  const table = 100 * cand.worlds.reduce((t, wd, k) => t + cand.mix.weights[k] * wd.value(s0v, 0).survival, 0);
  console.log(`${''.padEnd(16)} solve CAND ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran CAND ${L}: bridgeRead ${mt.bridgeRead} bridgeStep ${mt.bridgeStep} readerSplit ${mt.readerSplit} readerBlend ${mt.readerBlend} readerRef ${mt.readerRef || null} readerChance ${mt.readerChance} tierState ${mt.tierState} jointWorlds ${!!mt.jointWorlds} e3pcls ${!!mt.e3pcls} switchMargin ${cand.switchMargin} switchCharge ${cand.switchCharge} bequestWeight ${mt.bequestWeight} mix ${cand.mix.nodes.length} pts ${PTS} grid ${String(mt.points).replace(/ /g, '')} shareNodes ${mt.shareNodes ? mt.shareNodes.join(',') : 'none'} floor ${cand.m.ctx.solvencyFloor} line ${mt.readerSupportLine}`);
  console.log(`${''.padEnd(16)} checks ${L}: armTook ${took && common ? 1 : 0}/1`);
  if (!(took && common)) { console.error(`audit-an: ${id} ${L}: the job's settings did not take`); process.exit(3); }
  { const ad = cand.mix.tables[0].g.reader && cand.mix.tables[0].g.reader.adaptive, lt = ad && ad.lattice;
    const ok = !!ad && ad.moves > 0 && ad.nonMono === 0 && lt.na === LAT.na && lt.nb === LAT.nb && lt.nz === LAT.nz;
    console.log(`${''.padEnd(16)} adaptive ${L}: moves ${ad ? ad.moves : 0} nonMono ${ad ? ad.nonMono : -1} lattice ${lt ? `${lt.na}x${lt.nb}x${lt.ng} nz ${lt.nz}` : 'none'} last year ${ad ? ad.TL : -1} secs ${ad ? ad.secs.toFixed(1) : -1}`);
    console.log(`${''.padEnd(16)} checks ${L}: adaptTook ${ok ? 1 : 0}/1`);
    if (!ok) { console.error(`audit-an: ${id} ${L}: the adaptive reference did not build at the lattice asked, or its last year's threshold is not monotone`); process.exit(3); } }
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
  let idOk = 0, idN = 0, ownOk = 0, qfOk = 0, qfN = 0, lyOk = 0, lyN = 0;
  const li0 = (() => { const t0b = cand.mix.tables[0]; return t0b.tsLayerOf ? t0b.tsLayerOf[t0b.tsLayerOf.findIndex((_, ai) => (acts[ai].tierPen || 0) === 0 && (acts[ai].tierIsa || 0) === 0)] : 0; })();
  const NQ = Math.min(NPW, NQF), recS = [], recM = [], recG = [], recB = [], recQ = [];
  // each tier layer's pair (the tiers a move into it holds), for layerTook
  const pairOf = (() => { const t0b = cand.mix.tables[0], m0 = {}; if (t0b.tsLayerOf) t0b.tsLayerOf.forEach((li, ai) => { if (!(li in m0)) m0[li] = [acts[ai].tierPen || 0, acts[ai].tierIsa || 0]; }); return m0; })();
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
        // the layer the visit's G is filed under: the tiers held (the previous move's); the plant `held` files it under the move taken
        const li = tab.tsLayerOf ? tab.tsLayerOf[PLANT === 'held' ? x.ai : rec[j - 1].ai] : 0; byL[li] += Gj; byLN[li]++;
        lyN++; if (!tab.tsLayerOf || (pairOf[li] && pairOf[li][0] === (x.held.pen || 0) && pairOf[li][1] === (x.held.isa || 0))) lyOk++;
        NB++; if (li !== li0) { GD += Gj; ND++; }
        recS.push(...x.s); recM.push(k, i, x.t, x.ai, x.held.pen || 0, x.held.isa || 0, li); recG.push(Gj); recB.push(Bv[j]);
        if (i < NQ) { const Bc = Bq(tab, x.s, x.t, x.ai, x.held, false); qfN++; if (Bc === Bv[j]) qfOk++; const q1 = Bv[j] - Bq(tab, x.s, x.t, x.ai, x.held, true); QFs += q1; recQ.push(q1); } else recQ.push(NaN);
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
      const RD = g.reader.of.get(Ly0.lsurv[t]), sv = A => [0, 0.5 * A, 0.5 * A, 0.25, 0, 0, -1], at = pr => { let lo = 0, hi = 1e7; for (let it = 0; it < 80; it++) { const mid = 0.5 * (lo + hi); if (RD.chance(mid, sv(mid)) < pr) lo = mid; else hi = mid; } return hi; };   // at an even ISA share and a gain fraction of 0.25 (reported only)
      const a5 = at(0.05), a95 = at(0.95), Wm = med(stat[bi].W), am = med(stat[bi].a);
      const la = locateVec(g, Float64Array.from([am * Wm, 0.5 * (1 - am) * Wm, 0.5 * (1 - am) * Wm, 0, 0, 0, -1]));
      const aCell = Wm * (g.axes.a.pts[la.i.i + 1] - g.axes.a.pts[la.i.i]), wCell = (1 - am) * (g.axes.W.pts[la.p.i + 1] - g.axes.W.pts[la.p.i]);
      console.log(`${''.padEnd(16)} cliff ${L} ${k} ${t}: acc5 ${a5.toFixed(0)} acc95 ${a95.toFixed(0)} width ${(a95 - a5).toFixed(0)}; median W ${Number.isFinite(Wm) ? Wm.toFixed(0) : 'none'} share ${Number.isFinite(am) ? am.toFixed(4) : 'none'}; share cell ${Number.isFinite(aCell) ? aCell.toFixed(0) : 'none'} wealth cell ${Number.isFinite(wCell) ? wCell.toFixed(0) : 'none'} in accessible money`);
    });
  }
  // refTook: the adaptive reference's p against its own rule run forward, by world and p-bin
  { const ref = cand.mix.tables[0].g.reader.adaptive.ref, BINS = [0.05, 0.2, 0.4, 0.6, 0.8, 0.95], PER = Math.max(10, Math.round(300 / SCALE)), NSIM = Math.max(100, Math.round(1000 / SCALE));
    const DIM = recS.length / (recM.length / 7);
    let rfOk = 0, rfN = 0, above = 0; const r0t = Date.now();
    for (let k = 0; k < K; k++) {
      let st = (7002 * 1000 + k) >>> 0;   // the tuning seed scaled, so no registry seed (7003 Phase 4, 7004 the second) is used as a state
      const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let x = st; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
      const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      const band = [];
      for (let r = 0; r < recM.length / 7; r++) {
        if (recM[7 * r] !== k) continue;
        const t = recM[7 * r + 2], x = recS.slice(DIM * r, DIM * r + DIM), A = x[1] + x[2], b = A > 0 ? x[1] / A : 0, p = ref.readV(k, t, A, b, x[3]);
        if (p >= BINS[0] && p <= BINS[5]) band.push({ t, A, b, gf: x[3], p });
      }
      const step = Math.max(1, Math.floor(band.length / PER)), pick = band.filter((_, j) => j % step === 0).slice(0, PER);
      const bins = BINS.slice(0, -1).map(() => ({ n: 0, p: 0, mc: 0, v: 0 }));
      for (const q of pick) { const mc = ref.simulate(k, q.t, q.A, q.b, q.gf, NSIM, gauss); let bi = BINS.findIndex((e, j) => q.p >= e && q.p < BINS[j + 1]); if (bi < 0) bi = 4; const x = bins[bi]; x.n++; x.p += q.p; x.mc += mc; x.v += mc * (1 - mc) / NSIM; }
      bins.forEach((x, bi) => {
        if (!x.n) return;
        const mp = x.p / x.n, mm = x.mc / x.n, se = Math.sqrt(Math.max(x.v, 1e-12)) / x.n, ok = Math.abs(mp - mm) <= 0.02 + 3 * se;
        rfN++; if (ok) rfOk++; if (mp > mm) above++;
        console.log(`${''.padEnd(16)} refcheck ${L} ${k} ${bi}: states ${x.n} p ${f6(mp)} simulated ${f6(mm)} se ${f6(se)} ${ok ? 'ok' : 'OFF'}`);
      });
    }
    console.log(`${''.padEnd(16)} checks ${L}: refTook ${rfOk}/${rfN} (p above its simulation in ${above} of ${rfN} bins; ${PER} states a world, ${NSIM} runs a state, secs ${Math.round((Date.now() - r0t) / 1000)})`);
    if (PLANT === 'step') console.log(`${''.padEnd(16)} step ${L}: refTook ${rfOk}/${rfN} with the last year read off the lattice (printed, not required to refuse)`);
    else if (!(rfN > 0) || rfOk !== rfN) { console.error(`audit-an: ${id} ${L}: the adaptive reference's p does not match its own rule run forward (refTook ${rfOk}/${rfN})`); process.exit(3); } }
  console.log(`${''.padEnd(16)} checks ${L}: ownTook ${ownOk}/${idN} identity ${idOk}/${idN} qfTook ${qfOk}/${qfN} layerTook ${lyOk}/${lyN} secs ${Math.round((Date.now() - f0) / 1000)}`);
  if (ownOk !== idN || idOk !== idN) { console.error(`audit-an: ${id} ${L}: the ledger does not close on every path (ownTook ${ownOk}/${idN} identity ${idOk}/${idN})`); process.exit(3); }
  if (!(lyN > 0) || lyOk !== lyN) { console.error(`audit-an: ${id} ${L}: a bridge visit's G is filed under a layer other than the tiers held (layerTook ${lyOk}/${lyN})`); process.exit(3); }
  if (!(qfN > 0) || qfOk !== qfN) { console.error(`audit-an: ${id} ${L}: the fine rule's machinery does not reproduce the one-step value (qfTook ${qfOk}/${qfN})`); process.exit(3); }
  // the bridge years' survival tables (log-odds, Float32) of every world and layer, so a later read needs no re-solve of the grid
  const tables = {};
  for (let k = 0; k < K; k++) { const tab = cand.mix.tables[k], Ls = tab.tsLayers || [tab]; Ls.forEach((Ly, li) => { for (const t of [...bridge, bridge[bridge.length - 1] + 1]) tables[`${k}/${li}/${t}`] = b64(Float32Array.from(Ly.lsurv[t])); }); }
  writeFileSync(join(OUT, fileOfJob(job)), gzipSync(JSON.stringify({ id, job: L, stamp: STAMP, NPW, seed: SEED, own: ownC, bridge, nqf: NQ, nfine: NFINE, paths: { cols: 'world path year move tierPen tierIsa layer', meta: b64(Int32Array.from(recM)), dim: recS.length / (recM.length / 7), states: b64(Float32Array.from(recS)), G: b64(Float32Array.from(recG)), B: b64(Float32Array.from(recB)), Q: b64(Float32Array.from(recQ)) }, bits: Object.fromEntries(Object.entries(bits).map(([x, v]) => [x, b64(v)])), per: Object.fromEntries(Object.entries(per).map(([x, v]) => [x, b64(v)])), tables })));
  console.log(`${''.padEnd(16)} file ${L}: ${fileOfJob(job)}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
