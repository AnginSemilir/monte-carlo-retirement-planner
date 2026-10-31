/*
 * AREF STEP 0 (PLAN.md AREF; predictions/diag-aref0.md; the deep review after NODE-AX, deep-review-log.md 15 Oct 01:48 UK).
 * Before any solve of the adaptive reference: is the chance of paying the floor bills to access, chosen adaptively, a
 * calibrated reference for S360's bridge, and is S/p flat across the bridge tables' cells?
 *   THE ADAPTIVE CHANCE p: by backward induction over the bridge years, on accessible money A (a log grid) and its ISA
 *   share b (a linear grid), the other state at the year's typical value (the pension and the taxable account's gain
 *   fraction: the medians of NODE-AX's records of that world and year; the sheltered cash at the grid's typical value).
 *   Each year every floor-level move of the candidate's menu (its draw orders by its tier pairs; the switch charge left
 *   out) pays the year by the engine's own flow (F.flow: tax, draw order, deposits and income, as the solver's) and grows by
 *   the move's own rates in the world (F.grow at the move's real at 128 equal-weight midpoints in u = Phi(z)); one move for
 *   every world, the best on the mixture's weights (the joint choice, as the solver's); the year fails at unmet > 1 or a
 *   pre-access insolvency (scoreMoves' rule); after the last bridge year the chance is 1.
 *   The contexts, the menu and the bridge years come from a 4-point solve of BN (none depends on the grid's points); the
 *   60-point grid of NODE-AX's BN is rebuilt by makeGrid with the solve's options and checked against the saved tables.
 * READ: p at each of NODE-AX's BN bridge records (results/diagnodeax, behind NODE-AX's gate at the read) beside its realised
 *   bridge outcome (the path's bridge bit) and today's table read there (G + B); and over the saved bridge tables' nodes of
 *   every world and layer, c = S / p where p >= 0.5 and S is in the band (0.05 to 0.95).
 * Self-checks (each must pass, or the job refuses, exit 3): gridTook (the options rebuild cand.g at 4 points, axis for
 *   axis, and the 60-point grid's size is the saved tables'); dpTook (in each band bin of p, the mean p at sampled band
 *   records is within 0.02 plus three standard errors of a simulation from the record's own state under the joint rule's
 *   moves, the engine's flow and the world's own returns); recTook (every record is in a DP year and reads a finite p).
 * Plants (AREF0_PLANT, each must make the job refuse, exit 3): drift (the DP grows every world at the centre's rates:
 *   dpTook fails), choice (the DP takes each world's own best move, not the joint one: dpTook fails), grid (the 60-point
 *   grid built on the uniform share list: gridTook fails). A fourth, notax (the DP's flow refunds the year's tax), is
 *   run and its effect printed; it is not required to refuse (the tax at S360's floor may be too small to show).
 *   node research/solver/audit-aref0.mjs [scale=1] [simulations a state=1000]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { makeGrid, toVec } from '../../src/solver/grid.js';
import { PRODUCT_BASELINE } from '../../src/solver/solve.js';
import { solveCandidate, CANDIDATE_OPTS } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const NODES_A = Object.freeze([0, 0.2, 0.4, 0.6, 0.7, 0.75, 0.8, 0.825, 0.85, 0.875, 0.9, 0.925, 0.95, 0.975, 1]);   // NODE-AX's BN
export const JOB = ['S360', 'BN', 60, NODES_A.length, 5];
export const jobLabel = ([, arm, pts, sh, qn]) => `${arm}/P${pts}S${sh}Q${qn}`;
export const BAND = [0.05, 0.95], BINS = [0.05, 0.2, 0.4, 0.6, 0.8, 0.95];
if (process.argv[2] === '--units') { console.log(1); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const SCALE = Number(process.argv[2] || 1), NSIM = Number(process.argv[3] || 1000);
if (!(SCALE >= 1) || !(NSIM >= 10)) { console.error(`audit-aref0: bad scale or simulation count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const PLANT = process.env.AREF0_PLANT || '';
if (PLANT && !['drift', 'choice', 'grid', 'notax'].includes(PLANT)) { console.error(`audit-aref0: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const SEED = 7002, LAMBDA = 0.0223606797749979, W = 0.02;
const AX = process.env.AREF0_NODEAX || join(HERE, 'results', 'diagnodeax');
const OUT = process.env.AREF0_OUT || join(HERE, 'results', 'diagaref0');
mkdirSync(OUT, { recursive: true });
const sha16 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const dec = (x, T) => { const b = Buffer.from(x, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f6 = x => (Number.isFinite(x) ? x.toFixed(6) : String(x));

// the inverse normal (Acklam's rational approximation, relative error under 1.2e-9) and the fine rule's draws
const PhiInvA = u => {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const q0 = Math.min(u, 1 - u);
  let z;
  if (q0 < 0.02425) { const q = Math.sqrt(-2 * Math.log(q0)); z = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); if (u > 0.5) z = -z; }
  else { const q = u - 0.5, r = q * q; z = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  return z;
};
const NZ = Math.max(16, Math.round(128 / SCALE)), ZS = Array.from({ length: NZ }, (_, i) => PhiInvA((i + 0.5) / NZ));
// a move's rate at draw z, as solve.js realAt builds the node rates (zPath 0)
const realAt = (c, z, act, t, out) => { const R = act.real, V = act.volEffAt[t], S = act.sigma; for (let q = 0; q < 4; q++) out[q] = Math.exp(Math.log(1 + R[q]) + S[q] * 0 + V[q] * z) - 1; return out; };
let st = SEED >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => { let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

const L = jobLabel(JOB);
console.log(`AREF0: the adaptive floor chance at NODE-AX's BN records and tables, DP grid scale ${SCALE}, ${NSIM} simulations a checked state (seed ${SEED})`);
console.log(`${JOB[0].padEnd(16)} case | job ${L} | points ${JOB[2]} | lambda ${LAMBDA}`);
// NODE-AX's BN file (its records, bridge bits and saved tables)
const axPath = join(AX, `${JOB[0]}-${L.replace(/\//g, '-')}.json.gz`);
if (!existsSync(axPath)) { console.error(`audit-aref0: no NODE-AX file ${axPath}`); process.exit(2); }
const axBuf = readFileSync(axPath), ax = JSON.parse(gunzipSync(axBuf).toString());
console.log(`${''.padEnd(16)} nodeax ${L}: file ${sha16(axBuf)} stamp ${ax.stamp.code} ${ax.stamp.audit} records ${dec(ax.paths.G, Float32Array).length}`);

// 1. THE CONTEXTS: a 4-point solve of BN (the menu, the compiled worlds and the bridge years)
const h = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single').find(s => s.id === JOB[0]);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const extra = { lambda: LAMBDA, bequestWeight: W, readerRef: 'order', shareNodes: NODES_A };
const t0 = Date.now();
const cand = solveCandidate(E, M, plan, { ...extra, points: 4 });
console.log(`${''.padEnd(16)} solve CAND ${L}: points 4 secs ${Math.round((Date.now() - t0) / 1000)}`);
const tabs = cand.mix.tables, K = tabs.length, WK = cand.mix.weights, acts = cand.actions, levelOf = cand.levelOf, m = cand.m;
const years = tabs[0].g.reader.years, bridge = [];
for (let t = 1; t < years.length; t++) if (years[t]) bridge.push(t);
const T1 = bridge[0], TL = bridge[bridge.length - 1];
const floor = Math.min(...levelOf), moves = [], seenMv = new Set();
acts.forEach((a, ai) => { if (levelOf[ai] !== floor) return; const k = `${a.steps.join(',')}|${a.tierPen || 0}|${a.tierIsa || 0}`; if (!seenMv.has(k)) { seenMv.add(k); moves.push(ai); } });
console.log(`${''.padEnd(16)} menu ${L}: bridge years ${bridge.join(',')} floor ${floor} moves ${moves.length} worlds ${K} weights ${WK.map(f6).join(',')}`);

// 2. THE GRID CHECK: the solve's options rebuild cand.g at 4 points; the 60-point grid is NODE-AX's (its saved tables' size)
const { e3pclsPinFile, e3pclsPinning, ...candOpts } = { ...CANDIDATE_OPTS, ...extra };
const gridOpts = pts => ({ ...PRODUCT_BASELINE, ...candOpts, ...(PLANT === 'grid' ? { shareNodes: undefined } : {}), points: pts, lump: m.ctx.fullLumpSum, tiers: true });
const sameAxes = (g1, g2) => g1.size === g2.size && ['np', 'ni', 'nt'].every(k => g1[k] === g2[k]) && Object.keys(g2.axes).every(k => g1.axes[k] && g1.axes[k].pts.length === g2.axes[k].pts.length && g1.axes[k].pts.every((v, i) => v === g2.axes[k].pts[i]));
const g4 = makeGrid(m, gridOpts(4)), g60 = makeGrid(m, gridOpts(60));
const nTab = Buffer.from(ax.tables[`0/0/${bridge[0]}`], 'base64').length / 4;
// the menu: the context solve's tier state is the one NODE-AX's BN printed (the auto risk-above decision can change it)
const axRan = existsSync(join(AX, 'case0.txt')) ? readFileSync(join(AX, 'case0.txt'), 'utf8') : '', axTs = (new RegExp(`ran CAND ${L.replace(/\//g, '\\/')}: .* tierState (\\S+) `).exec(axRan) || [])[1];
const menuOk = !!axTs && String(cand.meta.tierState) === axTs;
const gridOk = sameAxes(g4, tabs[0].g) && g60.size === nTab && menuOk;
console.log(`${''.padEnd(16)} checks ${L}: gridTook ${gridOk ? 1 : 0}/1 (4 points ${g4.size} against ${tabs[0].g.size}; 60 points ${g60.size} against the saved ${nTab}; tier state ${cand.meta.tierState} against NODE-AX's ${axTs})`);
if (!gridOk) { console.error(`audit-aref0: ${L}: the grid's options do not rebuild the solve's grid`); process.exit(3); }

// 3. THE RECORDS: NODE-AX's BN bridge records, their states, realised bridge bits and today's reads
const meta = dec(ax.paths.meta, Int32Array), states = dec(ax.paths.states, Float32Array), Gr = dec(ax.paths.G, Float32Array), Br = dec(ax.paths.B, Float32Array), DIM = ax.paths.dim;
const NR = Gr.length, bb = [0, 1, 2].map(k => Buffer.from(ax.bits[`OWN${k}b`], 'base64'));
const rec = i => ({ k: meta[7 * i], path: meta[7 * i + 1], t: meta[7 * i + 2], s: states.subarray(DIM * i, DIM * i + DIM) });
const med = a => { const s = Float64Array.from(a).sort(); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
// the typical pension and gain fraction by world and year
const typ = {};
for (let i = 0; i < NR; i++) { const r = rec(i), kk = `${r.k}/${r.t}`; (typ[kk] = typ[kk] || { pen: [], gf: [] }).pen.push(r.s[0]); typ[kk].gf.push(r.s[3]); }
const typOf = (k, t) => { const x = typ[`${k}/${t}`] || typ[`1/${t}`]; return x ? { pen: med(x.pen), gf: med(x.gf) } : { pen: 0, gf: 0.25 }; };

// 4. THE DP: per bridge year a grid in A (log) and b; V[k][t] the chance in world k, MV[t] the joint rule's move index
const NA = Math.max(24, Math.round(160 / SCALE)), NB = Math.max(9, Math.round(40 / SCALE) + 1);
const sched = t => tabs[0].g.reader.chanceOf(0, t).schedule.bills;
const AG = {}, V = [0, 1, 2].map(() => ({})), MV = {}, MVW = [0, 1, 2].map(() => ({}));
for (const t of bridge) { const bl = sched(t), d0 = bl[0], rem = bl.reduce((u, v) => u + Math.max(0, v), 0); const lo = Math.log(Math.max(100, 0.5 * d0)), hi = Math.log(3 * rem + d0); AG[t] = Float64Array.from({ length: NA }, (_, i) => lo + (hi - lo) * i / (NA - 1)); }
const BG = Float64Array.from({ length: NB }, (_, j) => j / (NB - 1));
const readV = (k, t, A, b) => {
  if (t > TL) return 1;
  const ag = AG[t], arr = V[k][t]; if (!arr) return 1;
  const la = Math.log(Math.max(A, 1e-9));
  if (la < ag[0]) return 0;
  const fa = Math.min(NA - 1 - 1e-9, (la - ag[0]) / (ag[1] - ag[0])), ia = Math.floor(fa), wa = fa - ia;
  const fb = Math.min(NB - 1 - 1e-9, Math.max(0, b) * (NB - 1)), ib = Math.floor(fb), wb = fb - ib;
  const v = (ii, jj) => arr[ii * NB + jj];
  return (1 - wa) * ((1 - wb) * v(ia, ib) + wb * v(ia, ib + 1)) + wa * ((1 - wb) * v(ia + 1, ib) + wb * v(ia + 1, ib + 1));
};
const nearestMove = (t, A, b) => {
  const ag = AG[t], la = Math.log(Math.max(A, 1e-9));
  const ia = Math.max(0, Math.min(NA - 1, Math.round((la - ag[0]) / (ag[1] - ag[0])))), ib = Math.max(0, Math.min(NB - 1, Math.round(Math.max(0, b) * (NB - 1))));
  return MV[t][ia * NB + ib];
};
const c0 = tabs[0].c, centre = Math.floor(K / 2), post = new Float64Array(7), grown = new Float64Array(7), rr = new Float64Array(4);
const flowOf = (t, ai, s) => { post.set(s); const unmet = F.flow(c0, t, ai, post); if (unmet > 1 || c0.last.preNmpaInsolvent) return false; if (PLANT === 'notax') post[2] += (c0.last.taxPaid || 0) + (c0.last.cgtPaid || 0); return true; };
const td = Date.now();
for (let yi = bridge.length - 1; yi >= 0; yi--) {
  const t = bridge[yi], ag = AG[t];
  for (let k = 0; k < K; k++) V[k][t] = new Float64Array(NA * NB);
  MV[t] = new Int32Array(NA * NB); for (let k = 0; k < K; k++) MVW[k][t] = new Int32Array(NA * NB);
  const tp = [0, 1, 2].map(k => typOf(k, t));
  const Q = moves.map(() => new Float64Array(K));
  for (let ia = 0; ia < NA; ia++) for (let ib = 0; ib < NB; ib++) {
    const A = Math.exp(ag[ia]), b = BG[ib];
    for (let mi = 0; mi < moves.length; mi++) {
      const ai = moves[mi];
      // the flow does not depend on the world (solve.js solveMixture), so one flow serves every world's growth
      const s = [tp[1].pen, b * A, (1 - b) * A, tp[1].gf, 0, 0, -1];
      if (!flowOf(t, ai, s)) { Q[mi].fill(0); continue; }
      for (let k = 0; k < K; k++) {
        const ck = PLANT === 'drift' ? tabs[centre].c : tabs[k].c, act = ck.acts[ai];
        let acc = 0;
        for (let zi = 0; zi < NZ; zi++) { grown.set(post); F.grow(ck, t, grown, realAt(ck, ZS[zi], act, t, rr)); const A2 = grown[1] + grown[2]; acc += readV(k, t + 1, A2, A2 > 0 ? grown[1] / A2 : 0); }
        Q[mi][k] = acc / NZ;
      }
    }
    let best = 0, bestV = -1;
    for (let mi = 0; mi < moves.length; mi++) { let v = 0; for (let k = 0; k < K; k++) v += WK[k] * Q[mi][k]; if (v > bestV + 1e-15) { bestV = v; best = mi; } }
    const at = ia * NB + ib; MV[t][at] = best;
    for (let k = 0; k < K; k++) {
      let bk = best;
      if (PLANT === 'choice') { let bv = -1; for (let mi = 0; mi < moves.length; mi++) if (Q[mi][k] > bv + 1e-15) { bv = Q[mi][k]; bk = mi; } }
      MVW[k][t][at] = bk; V[k][t][at] = Q[bk][k];
    }
  }
}
console.log(`${''.padEnd(16)} dp ${L}: grid ${NA} by ${NB}, ${NZ} draws, years ${T1} to ${TL}, secs ${Math.round((Date.now() - td) / 1000)}`);

// 5. THE READ AT THE RECORDS: p, the realised bridge bit and today's read
const P = new Float32Array(NR), X = new Uint8Array(NR), RD = new Float32Array(NR);
let recOk = 0;
for (let i = 0; i < NR; i++) {
  const r = rec(i), A = r.s[1] + r.s[2], b = A > 0 ? r.s[1] / A : 0;
  P[i] = readV(r.k, r.t, A, b); X[i] = bb[r.k][r.path]; RD[i] = Gr[i] + Br[i];
  if (bridge.includes(r.t) && Number.isFinite(P[i])) recOk++;
}
console.log(`${''.padEnd(16)} checks ${L}: recTook ${recOk}/${NR}`);
if (recOk !== NR) { console.error(`audit-aref0: ${L}: some record falls outside the DP's years or reads no chance`); process.exit(3); }
for (let k = 0; k < K; k++) {
  const bins = BINS.slice(0, -1).map(() => ({ n: 0, p: 0, x: 0, rd: 0 }));
  for (let i = 0; i < NR; i++) { if (meta[7 * i] !== k) continue; const p = P[i]; if (p < BAND[0] || p > BAND[1]) continue; const bi = Math.min(bins.length - 1, BINS.findIndex((e, j) => p >= e && p < BINS[j + 1]) >= 0 ? BINS.findIndex((e, j) => p >= e && p < BINS[j + 1]) : bins.length - 1); const x = bins[bi]; x.n++; x.p += p; x.x += X[i]; x.rd += RD[i]; }
  bins.forEach((x, bi) => console.log(`${''.padEnd(16)} cal ${L} ${k} ${bi}: records ${x.n} p ${f6(x.n ? x.p / x.n : NaN)} realised ${f6(x.n ? x.x / x.n : NaN)} today ${f6(x.n ? x.rd / x.n : NaN)}`));
}

// 6. THE SELF-CHECK dpTook: in each band bin, the mean p at sampled band records against a simulation from each record's
//    own state under the joint rule's moves (the nearest grid point's), the engine's flow and the world's own returns
const sim = (k, t, s0) => {
  let ok = 0;
  for (let n = 0; n < NSIM; n++) {
    const s = Float64Array.from(s0.subarray(0, 7)); let alive = true;
    for (let y = t; y <= TL && alive; y++) {
      const A = s[1] + s[2], b = A > 0 ? s[1] / A : 0, ai = moves[nearestMove(y, A, b)];
      post.set(s); const unmet = F.flow(c0, y, ai, post);
      if (unmet > 1 || c0.last.preNmpaInsolvent) { alive = false; break; }
      const ck = tabs[k].c; F.grow(ck, y, post, realAt(ck, gauss(), ck.acts[ai], y, rr)); s.set(post);
    }
    if (alive) ok++;
  }
  return ok / NSIM;
};
let dpOk = 0, dpN = 0;
const PER = Math.max(10, Math.round(300 / SCALE));
for (let k = 0; k < K; k++) {
  const band = []; for (let i = 0; i < NR; i++) if (meta[7 * i] === k && P[i] >= BAND[0] && P[i] <= BAND[1]) band.push(i);
  const step = Math.max(1, Math.floor(band.length / PER)), pick = band.filter((_, j) => j % step === 0).slice(0, PER);
  const bins = BINS.slice(0, -1).map(() => ({ n: 0, p: 0, mc: 0, v: 0 }));
  for (const i of pick) { const r = rec(i), mc = sim(k, r.t, r.s), p = P[i]; let bi = BINS.findIndex((e, j) => p >= e && p < BINS[j + 1]); if (bi < 0) bi = bins.length - 1; const x = bins[bi]; x.n++; x.p += p; x.mc += mc; x.v += mc * (1 - mc) / NSIM; }
  bins.forEach((x, bi) => {
    if (!x.n) return;
    // se: the simulation's own error of the bin's mean (each state's simulated chance carries p(1-p)/NSIM)
    const mp = x.p / x.n, mm = x.mc / x.n, se = Math.sqrt(Math.max(x.v, 1e-12)) / x.n;
    const ok = Math.abs(mp - mm) <= 0.02 + 3 * se; dpN++; if (ok) dpOk++;
    console.log(`${''.padEnd(16)} dpcheck ${L} ${k} ${bi}: states ${x.n} p ${f6(mp)} simulated ${f6(mm)} se ${f6(se)} ${ok ? 'ok' : 'OFF'}`);
  });
}
console.log(`${''.padEnd(16)} checks ${L}: dpTook ${dpOk}/${dpN}`);
if (PLANT === 'notax') console.log(`${''.padEnd(16)} notax ${L}: dpTook ${dpOk}/${dpN} with the tax refunded (printed, not required to refuse)`);
else if (!(dpN > 0) || dpOk !== dpN) { console.error(`audit-aref0: ${L}: the DP's chance does not match its own rule simulated (dpTook ${dpOk}/${dpN})`); process.exit(3); }

// 7. S / p OVER THE SAVED BRIDGE TABLES: every world, layer and bridge year's band nodes, p where p >= 0.5 (supported)
const v7 = new Float64Array(7), NL = Object.keys(ax.tables).filter(x => x.startsWith('0/') && x.endsWith(`/${bridge[0]}`)).length;
const cS = {}, cP = {};
for (let k = 0; k < K; k++) {
  const Ss = [], Ps = [];
  let nodes = 0, band = 0, sup = 0, flat = 0;
  for (let li = 0; li < NL; li++) for (const t of bridge) {
    const ls = dec(ax.tables[`${k}/${li}/${t}`], Float32Array);
    const g = g60, NG = g.gain.length, NCL = g.pcls.length;
    for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < g.nt; it++) for (let ii = 0; ii < g.ni; ii++) for (let ip = 0; ip < g.np; ip++) {
      const i = g.index(ip, ii, it, ig, ic); nodes++;
      const S = 1 / (1 + Math.exp(-ls[i])); if (S < BAND[0] || S > BAND[1]) continue;
      band++; toVec(g, ip, ii, it, ig, ic, v7, t);
      const A = v7[1] + v7[2], p = readV(k, t, A, A > 0 ? v7[1] / A : 0);
      Ss.push(S); Ps.push(p);
      if (p >= 0.5) { sup++; const c = S / p; if (c >= 0.9 && c <= 1) flat++; }
    }
  }
  cS[k] = Float32Array.from(Ss); cP[k] = Float32Array.from(Ps);
  console.log(`${''.padEnd(16)} flat ${L} ${k}: nodes ${nodes} band ${band} supported ${sup} c in [0.9, 1] ${flat}`);
}

writeFileSync(join(OUT, `${JOB[0]}-${L.replace(/\//g, '-')}.json.gz`), gzipSync(JSON.stringify({ job: L, stamp: STAMP, seed: SEED, scale: SCALE, nsim: NSIM, nodeax: sha16(axBuf), bridge, band: BAND, bins: BINS,
  records: { P: b64(P), X: b64(X), RD: b64(RD), world: b64(Int32Array.from({ length: NR }, (_, i) => meta[7 * i])), path: b64(Int32Array.from({ length: NR }, (_, i) => meta[7 * i + 1])), year: b64(Int32Array.from({ length: NR }, (_, i) => meta[7 * i + 2])) },
  flat: Object.fromEntries([0, 1, 2].map(k => [k, { S: b64(cS[k]), p: b64(cP[k]) }])) })));
console.log(`${''.padEnd(16)} file ${L}: ${JOB[0]}-${L.replace(/\//g, '-')}.json.gz`);
console.log(`${''.padEnd(16)} done ${L}`);
