/*
 * NODE-AX (PLAN.md NODE-AX; predictions/diag-nodeax.md; the deep review after NODE-1, deep-review-log.md 14 Oct 06:33 UK;
 * UR's root-cause step NE-AXIS run on S360 first). What carries S360's remaining under-read with the dense share nodes?
 * Two jobs, the candidate's own unit (solveCandidate, e3pcls on), seed 7002, both under the order-drawn reference, both
 * NODE-1's (the same code: BN reproduces NODE-1's tables and runs, BO likewise):
 *   BN   S360 at 60 wealth points with the review's fifteen pension-share nodes (b at six);
 *   BO   S360 at 60 points at six linear shares (the known positive: its share term must exceed BN's).
 * THE LEDGER, on the first `paths` paths a world of seed 7002, the own opening forced in year 0 and the policy after it
 * (runPolicy's visit hook gives each year's state, held tiers and move). Per path, in world k's tables:
 *   B_t   the one-step value of the move taken at the state (scoreMoves, that move alone): the chance it pays this year's
 *         flow times the next year's table read at the five quadrature returns, in the layer of the tiers it moves to;
 *   V_t   the table read at the state in the layer of the tiers held (readValues), t >= 1;
 *   G_t = V_t - B_t (the grid's residual: the table at the state against the value of the policy's own move there);
 *   T_t = B_t - (V_{t+1} at the next state if the run goes on; the end rule's alive at t = T; 0 when the run fails at t)
 *         (the quadrature's error and the path's own noise; its mean is the quadrature term);
 *   so OWN - survived = sum_t T_t + sum_{t>=1} G_t exactly on every path (the identity, held to 1e-9).
 *   In the bridge years (the reader's years), G_t is split: CASH = the backup at the state with the sheltered cash read
 *   at the year's typical value (as the nodes are) less B_t; then for each axis (the wealth W, the pension share a, the
 *   ISA share b) the read along that axis alone: its two nodes' backups at the state's exact other coordinates (the
 *   chooser's own move there, the cash at its typical value) read in the reader's form p(query) x c + R, less that
 *   backup at the state; REST = G_t - CASH - W - A - B (the cross terms and the gain and allowance buckets).
 * Self-checks (each must pass, or the job refuses, exit 3): ownTook (the ledger's B_0 is the printed own table);
 * identity (every path closes to 1e-9); nodeTook (at grid nodes in the bridge years the backup is the stored table to
 * 1e-9: the projections' backups are the solve's own); readTook (with both ends supported, the two-point reader form on
 * the stored tables is readValues' read to 1e-9).
 * Reported per bridge year (Step 0 of the review): the cliff of the plan-tier layer's reference in accessible money
 * (where its chance crosses 0.05 and 0.95) against the money one share cell and one wealth cell span at the median state.
 * Plants (NODEAX_PLANT, each must make the job refuse, exit 3): arm (BN without its nodes: armTook fails), cash (the
 * backups read with a sheltered cash of 0, not the year's typical value: nodeTook fails), read (the projection read without the reader's p at
 * the query: readTook fails).
 *   node research/solver/audit-nodeax.mjs [scale=1] [paths a world=2000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { readValues, locateVec, toVec } from '../../src/solver/grid.js';
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
const SCALE = Number(process.argv[2] || 1), NPW = Number(process.argv[3] || 2000);
if (!(SCALE >= 1) || !(NPW >= 1)) { console.error(`audit-nodeax: bad scale or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-nodeax: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-nodeax: seed ${process.argv[6]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const PLANT = process.env.NODEAX_PLANT || '';
if (PLANT && !['arm', 'cash', 'read'].includes(PLANT)) { console.error(`audit-nodeax: unknown plant ${PLANT}`); process.exit(2); }
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
// T + GB + GA), GL the bridge's residual in years 3 to 6, CASH WA AA BA REST its split, AL the pension share's term in years 3 to 6
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'CASH', 'WA', 'AA', 'BA', 'REST', 'AL'];

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
  const layerOf = (tab, ai) => (tab.tsLayers ? tab.tsLayers[tab.tsLayerOf[ai]] : tab);
  const layerHeld = (tab, held) => (tab.tsLayers ? tab.tsLayers[tab.tsLayerOf.findIndex((_, ai) => (acts[ai].tierPen || 0) === held.pen && (acts[ai].tierIsa || 0) === held.isa)] : tab);
  const V = (tab, Ly, s, t) => { readValues(tab.g, Ly.lsurv[t], Ly.beq[t], s, rd, Ly.lresil[t], Ly.short[t], t); return rd[0]; };
  const g = cand.mix.tables[0].g, bridge = [];
  for (let t = 1; t <= T; t++) if (g.reader && g.reader.years[t]) bridge.push(t);
  console.log(`${''.padEnd(16)} bridge ${L}: reader years ${bridge.join(',')}`);
  // the backup at a state with the cash read at the year's typical value, the chooser's own move there, world tab's value
  const backup = (tab, s, t, held) => { const p = Float64Array.from(s); p[6] = PLANT === 'cash' ? 0 : -1; const ai = chooseAction(cand, p, t, { ...held }); return clampP(B(tab, p, t, ai, held)); };
  // the reader's two-point read along one axis at query q: ends' backups S0, S1 at end states e0, e1, weight w on e1
  const read2 = (RD, q, e0, e1, S0, S1, w) => {
    const pq = RD.chance(q[1] + q[2]), p0 = RD.chance(e0[1] + e0[2]), p1 = RD.chance(e1[1] + e1[2]), line = g.reader.line;
    let c0 = p0 >= line ? Math.min(1, Math.max(0, S0 / p0)) : null, c1 = p1 >= line ? Math.min(1, Math.max(0, S1 / p1)) : null;
    if (c0 === null && c1 === null) { c0 = 0; c1 = 0; } else if (c0 === null) c0 = c1; else if (c1 === null) c1 = c0;
    const R0 = S0 - p0 * c0, R1 = S1 - p1 * c1, pp = PLANT === 'read' ? 1 : pq;
    return clampP(pp * ((1 - w) * c0 + w * c1) + (1 - w) * R0 + w * R1);
  };
  // the three axes' end states at s: [lo, hi, weight on hi]
  const ends = s => {
    const lc = locateVec(g, s), Wq = s[0] + s[1] + s[2], aq = Wq > 0 ? s[0] / Wq : 0, rq = Wq - s[0], bq = rq > 0 ? s[1] / rq : 0;
    const at = (Wv, av, bv) => { const e = Float64Array.from(s), pen = av * Wv, rest = Wv - pen, isa = bv * rest; e[0] = pen; e[1] = isa; e[2] = rest - isa; e[6] = -1; return e; };
    const ax = g.axes;
    return {
      W: [at(ax.W.pts[lc.p.i], aq, bq), at(ax.W.pts[lc.p.i + 1], aq, bq), lc.p.w],
      A: [at(Wq, ax.a.pts[lc.i.i], bq), at(Wq, ax.a.pts[lc.i.i + 1], bq), lc.i.w],
      B: [at(Wq, aq, ax.b.pts[lc.t.i]), at(Wq, aq, ax.b.pts[lc.t.i + 1]), lc.t.w],
    };
  };

  // SELF-CHECKS: nodeTook and readTook, world by world, in the bridge years, the plan-tier layer, gain and allowance at 0
  let nodeOk = 0, nodeN = 0, readOk = 0, readN = 0;
  const vv = new Float64Array(7), H00 = H0();
  for (let k = 0; k < K; k++) {
    const tab = cand.mix.tables[k], Ly = layerHeld(tab, H00);
    for (const t of bridge.slice(0, 4)) {
      const RD = g.reader.of.get(Ly.lsurv[t]);
      for (const ip of [Math.floor(g.np / 3), Math.floor(g.np / 2), Math.floor(2 * g.np / 3)]) for (let ii = 0; ii < g.ni; ii++) {
        toVec(g, ip, ii, 2, 0, 0, vv, t);
        const stored = 1 / (1 + Math.exp(-Ly.lsurv[t][g.index(ip, ii, 2, 0, 0)])), got = backup(tab, vv, t, H00);
        nodeN++; if (Math.abs(got - stored) <= TOL) nodeOk++;
        if (ii + 1 < g.ni) {
          const e0 = Float64Array.from(vv), e1 = toVec(g, ip, ii + 1, 2, 0, 0, new Float64Array(7), t), q = Float64Array.from(vv), Wq = vv[0] + vv[1] + vv[2], am = 0.5 * (g.axes.a.pts[ii] + g.axes.a.pts[ii + 1]);
          q[0] = am * Wq; const rest = Wq - q[0], bq = g.axes.b.pts[2]; q[1] = bq * rest; q[2] = rest - q[1];
          const S0 = 1 / (1 + Math.exp(-Ly.lsurv[t][g.index(ip, ii, 2, 0, 0)])), S1 = 1 / (1 + Math.exp(-Ly.lsurv[t][g.index(ip, ii + 1, 2, 0, 0)]));
          if (RD.chance(e0[1] + e0[2]) >= g.reader.line && RD.chance(e1[1] + e1[2]) >= g.reader.line) { readN++; if (Math.abs(read2(RD, q, e0, e1, S0, S1, 0.5) - V(tab, Ly, q, t)) <= TOL) readOk++; }
        }
      }
    }
  }
  console.log(`${''.padEnd(16)} checks ${L}: nodeTook ${nodeOk}/${nodeN} readTook ${readOk}/${readN}`);
  if (!(nodeN > 0 && nodeOk === nodeN)) { console.error(`audit-nodeax: ${id} ${L}: the backup at grid nodes is not the stored table`); process.exit(3); }
  if (!(readN > 0 && readOk === readN)) { console.error(`audit-nodeax: ${id} ${L}: the two-point reader form is not readValues' read`); process.exit(3); }

  const f0 = Date.now(), wpaths = E.pathsForSeed(SEED, NPW, T), bits = {}, per = {};
  const worldPath = (i, k) => { const cz = Float64Array.from(wpaths[i]); cz[cz.length - 1] = cand.mix.nodes[k]; return cz; };
  let idOk = 0, idN = 0, ownOk = 0;
  for (let k = 0; k < K; k++) {
    const tab = cand.mix.tables[k];
    console.log(`${''.padEnd(16)} tables ${L} ${k} z ${cand.mix.nodes[k].toFixed(6)} weight ${cand.mix.weights[k].toFixed(6)}: OWN ${(100 * B(tab, s0, 0, ownC, H0())).toFixed(6)} READ ${(100 * cand.worlds[k].value(s0v, 0).survival).toFixed(6)}`);
    const A = Object.fromEntries(KEYS.map(x => [x, new Float64Array(NPW)])), b = new Uint8Array(NPW), bb = new Uint8Array(NPW);
    const yr = Object.fromEntries(['G', 'T', 'CASH', 'WA', 'AA', 'BA', 'REST'].map(x => [x, new Float64Array(T + 2)])), yrN = new Float64Array(T + 2);
    const stat = bridge.map(() => ({ W: [], a: [] }));
    for (let i = 0; i < NPW; i++) {
      const rec = [];
      const r = runPolicy(cand, worldPath(i, k), { start: { t: 0, s: s0, held: H0(), firstAi: ownC }, visit: (t, s, held, ai) => rec.push({ t, s: Float64Array.from(s), held: { ...held }, ai }) });
      b[i] = r.survived ? 1 : 0; bb[i] = r.survived || !r.preAccess ? 1 : 0;
      const X = b[i], Bv = rec.map(x => B(tab, x.s, x.t, x.ai, x.held)), Vv = rec.map((x, j) => (j === 0 ? NaN : V(tab, layerOf(tab, rec[j - 1].ai), x.s, x.t)));
      let Ts = 0, Gs = 0, GB = 0, GA = 0, GL = 0, CA = 0, WA = 0, AA = 0, BA = 0, RE = 0, AL = 0;
      for (let j = 0; j < rec.length; j++) {
        const x = rec[j], last = j === rec.length - 1, next = last ? (x.t >= T ? X : 0) : Vv[j + 1], Tj = Bv[j] - next;
        Ts += Tj; yr.T[x.t] += Tj; yrN[x.t]++;
        if (j === 0) continue;
        const Gj = Vv[j] - Bv[j]; Gs += Gj; yr.G[x.t] += Gj;
        const bi = bridge.indexOf(x.t);
        if (bi < 0) { GA += Gj; continue; }
        GB += Gj; if (x.t >= 3 && x.t <= 6) GL += Gj;
        // the split: the cash at its typical value, then each axis alone, then the rest
        const Ly = layerOf(tab, rec[j - 1].ai), RD = g.reader.of.get(Ly.lsurv[x.t]), Bc = backup(tab, x.s, x.t, x.held), cash = Bc - Bv[j];
        const e = ends(x.s), term = ([e0, e1, w]) => read2(RD, x.s, e0, e1, backup(tab, e0, x.t, x.held), backup(tab, e1, x.t, x.held), w) - Bc;
        const tw = term(e.W), ta = term(e.A), tb = term(e.B), rest = Gj - cash - tw - ta - tb;
        CA += cash; WA += tw; AA += ta; BA += tb; RE += rest;
        if (x.t >= 3 && x.t <= 6) AL += ta;
        yr.CASH[x.t] += cash; yr.WA[x.t] += tw; yr.AA[x.t] += ta; yr.BA[x.t] += tb; yr.REST[x.t] += rest;
        const Wq = x.s[0] + x.s[1] + x.s[2]; stat[bi].W.push(Wq); stat[bi].a.push(Wq > 0 ? x.s[0] / Wq : 0);
      }
      const B0 = Bv[0], resid = B0 - X - Ts - Gs;
      idN++; if (Math.abs(resid) <= TOL) idOk++;
      if (Math.abs(B0 - B(tab, s0, 0, ownC, H0())) <= TOL) ownOk++;
      A.X[i] = X; A.B0[i] = B0; A.T[i] = Ts; A.GB[i] = GB; A.GA[i] = GA; A.GL[i] = GL; A.CASH[i] = CA; A.WA[i] = WA; A.AA[i] = AA; A.BA[i] = BA; A.REST[i] = RE; A.AL[i] = AL;
    }
    bits[`OWN${k}`] = b; bits[`OWN${k}b`] = bb;
    for (const x of KEYS) per[`${x}${k}`] = A[x];
    console.log(`${''.padEnd(16)} sim ${L} ${k} OWN ai ${ownC}: ${b.reduce((t, x) => t + x, 0)}/${NPW} bridge ${bb.reduce((t, x) => t + x, 0)} bits ${sha16(b)} ${sha16(bb)}`);
    const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
    console.log(`${''.padEnd(16)} ledger ${L} ${k}: ${KEYS.map(x => `${x} ${f6(100 * mean(A[x]))}`).join(' ')}`);
    for (let t = 1; t <= T; t++) if (yrN[t] > 0) console.log(`${''.padEnd(16)} year ${L} ${k} ${t}: paths ${yrN[t]} ${['G', 'T', 'CASH', 'WA', 'AA', 'BA', 'REST'].map(x => `${x} ${f6(100 * yr[x][t] / NPW)}`).join(' ')}`);
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
  console.log(`${''.padEnd(16)} checks ${L}: ownTook ${ownOk}/${idN} identity ${idOk}/${idN} secs ${Math.round((Date.now() - f0) / 1000)}`);
  if (ownOk !== idN || idOk !== idN) { console.error(`audit-nodeax: ${id} ${L}: the ledger does not close on every path`); process.exit(3); }
  writeFileSync(join(OUT, fileOfJob(job)), gzipSync(JSON.stringify({ id, job: L, stamp: STAMP, NPW, seed: SEED, own: ownC, bits: Object.fromEntries(Object.entries(bits).map(([x, v]) => [x, b64(v)])), per: Object.fromEntries(Object.entries(per).map(([x, v]) => [x, b64(v)])) })));
  console.log(`${''.padEnd(16)} file ${L}: ${fileOfJob(job)}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
