/*
 * REF-B (PLAN.md REF-B; predictions/diag-refb.md; the deep review after COPY-B, deep-review-log.md 19 Oct 20:19 UK, adopted in
 * PLAN.md's 19 Oct 20:30 row; O188; PR24's gate cut to the root cause; the maintainer's decision of 19 Oct 09:26 UK: each fix
 * against the frozen candidate, a factorial where fixes interact). The adaptive reference against the plan reference, crossed
 * with the copy rule, at the candidate as it stands, each household its own unit, seed 7002 (the tuning seed), COPY-B's ledger
 * (AN's ledger with each bridge-year read split four ways, QS, QC, RS and RC, here with the RS split's scaling of R) on the
 * first 4,000 paths a world, every year's own move saved, each path's residual by bridge year (Y<t>) and its whole score, with
 * every bridge-year visit's state saved (audit-copyb.mjs's, copied):
 *   AR    the candidate at 30 wealth points with the adaptive reference, its fix (the A = 0 node: `foot`) and the RS split
 *         (`readerSplit: 'rs'`): K1F's package, HO-DEP's adaptive arm
 *   ARX   AR with `readerCopy: 'extrap'` (COPY-X's copy rule)
 *   AN    the adaptive reference with its fix and no RS split: the reference alone
 * on S362 and S370 (AR, ARX, AN) and S130 (AR, the control: one bridge year, the step's chance exact under either reference);
 * C and CX are COPY-B's (S362, S130) and COPY-X's (S370) saved cells, reused. Self-checks, each refusing the job (exit 3), as
 * COPY-B's, with armTook holding the reference, its lattice and its fix to the arm's (HO-DEP's guard) and the adaptive
 * reference's own record (moves made, no non-monotone node) printed.
 * REFB_PLANT (each must make its job refuse on its own check): foot (AR without its fix: armTook), cxw (ARX without the copy
 * rule: armTook), own, layer, quad, held (the ledger's), score (scoreTook's scorePaths leg), trace (scoreTook's counters leg),
 * split (the split scales every arm's R by RU's rule in place of RS's: splitTook), class (corners classed at a line of 0.6:
 * copyTook).
 *   node research/solver/audit-refb.mjs [scale=1] [paths a world=4000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy, chooseAction, scoreMoves, NODES, WEIGHTS } from '../../src/solver/solve.js';
import { readValues, READER_PROBE, ruScale } from '../../src/solver/grid.js';
import { solveCandidate, CANDIDATE_OPTS } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { SEED as SEED_7U } from './panel-7u.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCT_DEFAULTS } from '../../src/solver/solve.js';
import { makeTrace } from './record.mjs';
import { scorePaths, WB, MU } from './reduce-7t.mjs';
import { codeId } from './code-id.mjs';

// the households and the jobs (the deep review after COPY-B; PLAN.md's REF-B row), the longest first (the batch runs them in
// this order four at a time)
export const HOUSES = Object.freeze(['S370', 'S362', 'S130']);
// [household, arm, wealth points, shares, return nodes]
export const JOBS = [
  ['S370', 'AR', 30, 6, 5], ['S370', 'ARX', 30, 6, 5], ['S370', 'AN', 30, 6, 5], ['S362', 'AR', 30, 6, 5], ['S362', 'ARX', 30, 6, 5],
  ['S362', 'AN', 30, 6, 5], ['S130', 'AR', 30, 6, 5]];
export const ARMS = Object.freeze({ AR: { readerRef: 'adaptive', readerSplit: 'rs', foot: true }, ARX: { readerRef: 'adaptive', readerSplit: 'rs', foot: true, readerCopy: 'extrap' }, AN: { readerRef: 'adaptive', foot: true } });
// the adaptive reference's lattice (HO-DEP's, audit-hodep.mjs LATTICE: the reference's own grid in log money, bills and gains)
export const LATTICE = Object.freeze({ na: 160, nb: 41, nz: 128 });
// the support line the split classes corners at (the candidate's: armTook holds the solve to it)
export const LINE = 0.5;
// the household's solvency floor by the product's own rule (solve.js solvePlan: its own floor, else minPotYears of target)
export const floorOf = h => { const own = Math.max(0, E.num(h.plan.config && h.plan.config.solvencyFloor, 0)); return own > 0 ? own : Math.round(PRODUCT_DEFAULTS.minPotYears * E.num(h.plan.spending && h.plan.spending.targetSpend, 0)); };
// the audit's plan sets the floor spend at 0.8 of target; the whole score reads the floor level from the solve's own menu and
// refuses a mismatch
export const FLOOR_PLAN = 0.8;
export const jobLabel = ([, arm, pts, sh, qn]) => `${arm}/P${pts}S${sh}Q${qn}`;
if (process.argv[2] === '--units') { console.log(JOBS.length); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const SCALE = Number(process.argv[2] || 1), NPW = Number(process.argv[3] || 4000);
if (!(SCALE >= 1) || !(NPW >= 1)) { console.error(`audit-refb: bad scale or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-refb: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-refb: seed ${process.argv[6]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const PLANT = process.env.REFB_PLANT || '';
if (PLANT && !['foot', 'cxw', 'own', 'layer', 'quad', 'held', 'score', 'trace', 'split', 'class'].includes(PLANT)) { console.error(`audit-refb: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979, W = 0.02, TOL = 1e-9, CL = 1e-6, STOL = 1e-12;
if (process.env.SOLVER_CLAMP) { console.error('audit-refb: SOLVER_CLAMP is set; the split reads the reader at its own clamp'); process.exit(2); }
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-refb: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAGREFB_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagrefb');
mkdirSync(OUT, { recursive: true });

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const caseOf = id => all.find(s => s.id === id);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const sha16 = x => createHash('sha256').update(Buffer.from(x.buffer, x.byteOffset, x.byteLength)).digest('hex').slice(0, 16);
export const fileOfJob = job => `${job[0]}-${jobLabel(job).replace(/\//g, '-')}.json.gz`;
const H0 = () => ({ pen: 0, isa: 0, gia: 0 });
const f6 = x => x.toFixed(6);
// the per-path quantities saved (AN's): X survived, B0 the own table, T the quadrature and noise, GB and GA the grid's residual
// in and after the bridge (B0 - X = T + GB + GA), GL years 4 to 6, GD the de-risked layers' part of GB; Y<t> per bridge year
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
export const NQF = 1000, NFINE = 1024;
export const NOMOVE = 65535;   // a year the path did not reach, in the saved moves
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
// the copied nodes of one reader table at a support line, counted as reader.js buildReaderTable counts them: in each share row
// with a supported node, the nodes under the line
const copiedOf = (g, p, line) => { const NG = g.gain.length, NCL = g.pcls.length; let n = 0; for (let ic = 0; ic < NCL; ic++) for (let ig = 0; ig < NG; ig++) for (let it = 0; it < g.nt; it++) for (let ip = 0; ip < g.np; ip++) { let any = false, c = 0; for (let ii = 0; ii < g.ni; ii++) { if (p[g.index(ip, ii, it, ig, ic)] >= line) any = true; else c++; } if (any) n += c; } return n; };
const realAtRep = (c, z, act, t) => { const R = act.real, Vv = act.volEffAt[t], S = act.sigma, out = new Float64Array(4); for (let q = 0; q < 4; q++) out[q] = Math.exp(Math.log(1 + R[q]) + S[q] * 0 + Vv[q] * z) - 1; return out; };

console.log(`REF-B: the candidate's own unit, ${NPW} paths a world, wealth points divided by ${SCALE} (seed ${SEED}); ${JOBS.length} jobs; part ${part}`);
JOBS.forEach((job, ji) => {
  if (ji % pn !== pk) return;
  const [id, arm, pts0, shares, quad] = job;
  const h = caseOf(id);
  if (!h) { console.error(`audit-refb: no case ${id}`); process.exit(2); }
  const PTS = Math.max(4, Math.round(pts0 / SCALE)), L = jobLabel(job), want = ARMS[arm];
  console.log(`${id.padEnd(16)} case | job ${L} | points ${PTS} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  // the plants: `cxw` takes ARX's copy rule off, `foot` takes AR's fix off (armTook, each)
  const run = arm === 'ARX' && PLANT === 'cxw' ? { ...want, readerCopy: undefined } : arm === 'AR' && PLANT === 'foot' ? { ...want, foot: false } : want;
  const extra = { ...(run.readerRef ? { readerRef: run.readerRef, adaptiveLattice: { ...LATTICE, ...(run.foot ? { foot: true } : {}) } } : {}), ...(run.shareNodes ? { shareNodes: run.shareNodes } : {}), ...(run.readerSplit ? { readerSplit: run.readerSplit } : {}), ...(run.readerCopy ? { readerCopy: run.readerCopy } : {}), ...(shares !== 6 ? { shares } : {}), ...(quad !== 5 ? { quadNodes: quad } : {}) };
  const cand = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, ...extra });
  const mt = cand.meta;
  const common = !!mt.tierState && !!mt.jointWorlds && !!mt.e3pcls && cand.switchMargin === 0 && cand.switchCharge === 0.001 && Math.abs(mt.bequestWeight - W) < 1e-12 && mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && !mt.readerChance && !mt.readerBlend && (mt.readerSplit || null) === (want.readerSplit || null) && (mt.readerCopy || null) === (want.readerCopy || null);
  const nodesOk = want.shareNodes ? Array.isArray(mt.shareNodes) && mt.shareNodes.join(',') === want.shareNodes.join(',') : mt.shareNodes === undefined;
  // HO-DEP's guard: the reference, its lattice and its fix in the reference's own record are the arm's
  const adr = cand.mix.tables[0].g.reader && cand.mix.tables[0].g.reader.adaptive, lt0 = adr && adr.lattice, fixOn = !!(lt0 && lt0.foot);
  const refOk = (mt.readerRef || null) === (want.readerRef || null) && (!want.readerRef || (!!adr && fixOn === !!want.foot && lt0.na === LATTICE.na && lt0.nb === LATTICE.nb && lt0.nz === LATTICE.nz));
  const took = refOk && nodesOk && mt.points === `total ${PTS} x ${want.shareNodes ? want.shareNodes.length : shares} x 6` && cand.m.ctx.solvencyFloor === floorOf(h) && mt.readerSupportLine === LINE;
  const s0v = M.initialState(cand.m);
  const table = 100 * cand.worlds.reduce((t, wd, k) => t + cand.mix.weights[k] * wd.value(s0v, 0).survival, 0);
  const rdm = mt.reader || {};
  console.log(`${''.padEnd(16)} solve CAND ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran CAND ${L}: bridgeRead ${mt.bridgeRead} bridgeStep ${mt.bridgeStep} readerSplit ${mt.readerSplit || null} readerCopy ${mt.readerCopy || null} readerBlend ${mt.readerBlend || null} readerRef ${mt.readerRef || null} readerChance ${mt.readerChance || null} tierState ${mt.tierState} jointWorlds ${!!mt.jointWorlds} e3pcls ${!!mt.e3pcls} switchMargin ${cand.switchMargin} switchCharge ${cand.switchCharge} bequestWeight ${mt.bequestWeight} mix ${cand.mix.nodes.length} pts ${PTS} grid ${String(mt.points).replace(/ /g, '')} shareNodes ${mt.shareNodes ? mt.shareNodes.join(',') : 'none'} floor ${cand.m.ctx.solvencyFloor} line ${mt.readerSupportLine}`);
  console.log(`${''.padEnd(16)} reader ${L}: tables ${rdm.tables} unsupported ${rdm.unsupported} copied ${rdm.copied} copiedTop ${rdm.copiedTop} nodes ${rdm.nodes}`);
  console.log(`${''.padEnd(16)} nodes ${L}: ${mt.shareNodes ? mt.shareNodes.join(',') : 'the uniform six'} floor ${cand.m.ctx.solvencyFloor} (the product's rule ${floorOf(h)})`);
  console.log(`${''.padEnd(16)} adaptive ${L}: readerRef ${mt.readerRef || null} fix ${fixOn} moves ${adr ? adr.moves : 0} nonMono ${adr ? adr.nonMono : -1} lattice ${lt0 ? `${lt0.na}x${lt0.nb} nz ${lt0.nz}` : 'none'}`);
  if (want.readerRef && !(adr && adr.moves > 0 && adr.nonMono === 0)) { console.error(`audit-refb: ${id} ${L}: the adaptive reference's own record is short (moves ${adr ? adr.moves : 0}, nonMono ${adr ? adr.nonMono : -1})`); process.exit(3); }
  console.log(`${''.padEnd(16)} checks ${L}: armTook ${took && common ? 1 : 0}/1`);
  if (!(took && common)) { console.error(`audit-refb: ${id} ${L}: the job's settings did not take`); process.exit(3); }
  // copyTook: the copied nodes recounted from the reader's own tables at the split's line equal the solve's count (the plant
  // `class` classes them at 0.6)
  const CLS = PLANT === 'class' ? 0.6 : LINE;
  { let recount = 0, ntab = 0; const seen = new Set();
    for (const tb of cand.mix.tables) { const g2 = tb.g; if (!g2.reader) continue; for (const RD of g2.reader.of.values()) { if (seen.has(RD)) continue; seen.add(RD); ntab++; recount += copiedOf(g2, RD.p, CLS); } }
    const cOk = ntab === rdm.tables && recount === rdm.copied;
    console.log(`${''.padEnd(16)} recount ${L}: tables ${ntab} copied ${recount} (the solve's ${rdm.tables} and ${rdm.copied}) line ${CLS}`);
    console.log(`${''.padEnd(16)} checks ${L}: copyTook ${cOk ? 1 : 0}/1`);
    if (!cOk) { console.error(`audit-refb: ${id} ${L}: the copied nodes recounted at line ${CLS} are not the solve's (${recount} of ${ntab} tables against ${rdm.copied} of ${rdm.tables})`); process.exit(3); } }
  const m = cand.m, T = m.ctx.totalYears, acts = cand.actions, n = acts.length, K = cand.mix.nodes.length;
  if (n >= NOMOVE) { console.error(`audit-refb: ${id} ${L}: ${n} moves do not fit the saved moves' width`); process.exit(2); }
  let s0 = null;
  runPolicy(cand, E.pathsForSeed(SEED, 1, T)[0], { choose: (t, st, held) => { if (t === 0 && !s0) s0 = Float64Array.from(st); return chooseAction(cand, st, t, held); } });
  const ownC = chooseAction(cand, s0, 0, H0());
  console.log(`${''.padEnd(16)} openings ${L}: OWN ai ${ownC} level ${cand.levelOf[ownC]} tiers ${acts[ownC].tierPen || 0},${acts[ownC].tierIsa || 0}`);
  const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n), SV = new Float64Array(n), rd = new Float64Array(4);
  const B = (tab, s, t, ai, held) => { scoreMoves(tab, s, t, SC, TX, BQ, { ...held }, { ai, act: tab.c.acts[ai], nr: tab.nodeRealOfAt[Math.min(t, tab.nodeRealOfAt.length - 1)][ai] }, SV); return SV[ai]; };
  for (let k = 0; k < K; k++) { const tab = cand.mix.tables[k]; console.log(`${''.padEnd(16)} tables ${L} ${k} z ${cand.mix.nodes[k].toFixed(6)} weight ${cand.mix.weights[k].toFixed(6)}: OWN ${(100 * B(tab, s0, 0, ownC, H0())).toFixed(6)} READ ${(100 * cand.worlds[k].value(s0v, 0).survival).toFixed(6)}`); }
  const g = cand.mix.tables[0].g, bridge = [];
  for (let t = 1; t <= T; t++) if (g.reader && g.reader.years[t]) bridge.push(t);
  console.log(`${''.padEnd(16)} bridge ${L}: reader years ${bridge.join(',')}`);
  if (!bridge.length) { console.error(`audit-refb: ${id} ${L}: no bridge year (the split's and the layer's checks would run on nothing)`); process.exit(3); }
  const wpaths = E.pathsForSeed(SEED, NPW, T), bits = {}, per = {}, moves = {}, states = {};
  const worldPath = (i, k) => { const cz = Float64Array.from(wpaths[i]); cz[cz.length - 1] = cand.mix.nodes[k]; return cz; };
  const f0 = Date.now();
  {
    // THE LEDGER (AN's, copied): every path's own-opening run with its visits; B_t, V_t, G_t and T_t; the identity; the
    // bridge residual by year and layer; QF on the first NQF paths; and here every year's own move saved
    const nrCache = new Map();
    // the copy's one-step value: `fine` at the fine rule with the step split off, otherwise at the five nodes rebuilt (qfTook)
    const Bq = (tab, s, t, ai, held, fine) => {
      const kk = `${fine ? 'f' : 'n'}/${t}/${ai}/${tab === cand.mix.tables[0] ? 0 : cand.mix.tables.indexOf(tab)}`;
      // the plant `quad` rebuilds them from the central world's context, missing the world's shift (the one place it lands)
      const cc = PLANT === 'quad' ? cand.c : tab.c;
      let nr = nrCache.get(kk); if (!nr) { nr = (fine ? ZF : NODES).map(z => realAtRep(cc, z, cc.acts[ai], t)); nrCache.set(kk, nr); }
      const r = fine ? { ...tab, stepExact: false, quadWeights: WF } : { ...tab, quadWeights: WEIGHTS };
      scoreMoves(r, s, t, SC, TX, BQ, { ...held }, { ai, act: tab.c.acts[ai], nr }, SV); return SV[ai];
    };
    const layerOf = (tab, ai) => (tab.tsLayers ? tab.tsLayers[tab.tsLayerOf[ai]] : tab);
    const V = (tab, Ly, s, t) => { readValues(tab.g, Ly.lsurv[t], Ly.beq[t], s, rd, Ly.lresil[t], Ly.short[t], t); return rd[0]; };
    // THE SPLIT (STEP-O182): a bridge-year read of the ledger split into p x I[c], the supported corners' I[R] and the copied
    // corners' I[R], with the reference's part split by class too (QS supported, QC copied), a corner copied where its chance is
    // under the line, R at the arm's own scaling (SNR's ruScale); the plant
    // `split` scales every arm's R, so SN's reads are no longer given back
    const RU = mt.readerSplit === 'ru' || PLANT === 'split', RSP = mt.readerSplit === 'rs' && PLANT !== 'split';
    let cur = null, probes = 0;
    const probe = (Wc, IDX, NC, RD, pr) => { probes++; let cs = 0, cx = 0, rs = 0, rc = 0; for (let q = 0; q < NC; q++) { const w = Wc[q]; if (w === 0) continue; const i = IDX[q], pk = RD.p[i], r = RD.R[i] * (RU ? ruScale(pr, pk) : RSP ? (pk > pr ? pr / pk : 1) : 1); if (pk >= CLS) { cs += w * RD.c[i]; rs += w * r; } else { cx += w * RD.c[i]; rc += w * r; } } cur = { qs: pr * cs, qc: pr * cx, rs, rc }; };
    const Vs = (tab, Ly, s, t) => { cur = null; probes = 0; READER_PROBE.fn = probe; readValues(tab.g, Ly.lsurv[t], Ly.beq[t], s, rd, Ly.lresil[t], Ly.short[t], t); READER_PROBE.fn = null; return { v: rd[0], split: cur, probes }; };
    const bridgeSet = new Set(bridge), nb = bridge.length, DIM = s0.length;
    let sgOk = 0, sgN = 0, clampN = 0;
    let idOk = 0, idN = 0, ownOk = 0, qfOk = 0, qfN = 0, lyOk = 0, lyN = 0, scOk = 0, scN = 0, spOk = 0, ctOk = 0;
    const SCALE_W = Math.round(Math.max(1, m.ctx.accounts.reduce((t, x) => t + x.balance, 0))), CAP = Math.round(cand.meta.bequestCap), DEATH = m.ctx.pensionDeathTaxRate, FLOOR_LEVEL = Math.min(...cand.levelOf);
    if (DEATH !== 0) { console.error(`audit-refb: ${id} ${L}: a pension death charge of ${DEATH}: the whole score's estate would need the pension share`); process.exit(3); }
    if (Math.abs(FLOOR_LEVEL - FLOOR_PLAN) > 1e-9) { console.error(`audit-refb: ${id} ${L}: the solve's floor level ${FLOOR_LEVEL} is not the plan's ${FLOOR_PLAN}`); process.exit(3); }
    const li0 = (() => { const t0b = cand.mix.tables[0]; return t0b.tsLayerOf ? t0b.tsLayerOf[t0b.tsLayerOf.findIndex((_, ai) => (acts[ai].tierPen || 0) === 0 && (acts[ai].tierIsa || 0) === 0)] : 0; })();
    const NQ = Math.min(NPW, NQF);
    // each tier layer's pair (the tiers a move into it holds), for layerTook
    const pairOf = (() => { const t0b = cand.mix.tables[0], m0 = {}; if (t0b.tsLayerOf) t0b.tsLayerOf.forEach((li, ai) => { if (!(li in m0)) m0[li] = [acts[ai].tierPen || 0, acts[ai].tierIsa || 0]; }); return m0; })();
    const SK = bridge.flatMap(t => [`QS${t}`, `QC${t}`, `RS${t}`, `RC${t}`]);
    const YK = bridge.map(t => `Y${t}`), nL = cand.mix.tables[0].tsLayers ? cand.mix.tables[0].tsLayers.length : 1;
    for (let k = 0; k < K; k++) {
      const tab = cand.mix.tables[k];
      const ST = new Float64Array(NPW * nb * DIM).fill(NaN);
      const A = Object.fromEntries([...KEYS, ...YK, ...SK, 'NB', 'ND'].map(x => [x, new Float64Array(NPW)])), b = new Uint8Array(NPW), bb = new Uint8Array(NPW), QF = new Float64Array(NQ);
      const MV = new Uint16Array(NPW * (T + 1)).fill(NOMOVE);
      const yr = { G: new Float64Array(T + 2), T: new Float64Array(T + 2) }, yrN = new Float64Array(T + 2), byL = new Float64Array(nL), byLN = new Float64Array(nL);
      const other = (() => { for (let ai = 0; ai < n; ai++) if (ai !== ownC && cand.levelOf[ai] !== cand.levelOf[ownC]) return ai; return ownC; })();
      const Y = PLANT === 'trace' ? T : T + 1, tr = makeTrace(NPW, Y), tnet = new Float64Array(NPW), term = new Float64Array(NPW), sfall = new Float64Array(NPW).fill(NaN);
      for (let i = 0; i < NPW; i++) {
        const rec = [];
        tr.row = i;
        const r = runPolicy(cand, worldPath(i, k), { trace: tr, start: { t: 0, s: s0, held: H0(), firstAi: PLANT === 'own' ? other : ownC }, visit: (t, s, held, ai) => rec.push({ t, s: Float64Array.from(s), held: { ...held }, ai }) });
        tnet[i] = r.survived ? r.terminalNet : 0; term[i] = r.survived ? r.terminal : 0; if (Number.isFinite(r.shortfall)) sfall[i] = r.shortfall;
        b[i] = r.survived ? 1 : 0; bb[i] = r.survived || !r.preAccess ? 1 : 0;
        for (const x of rec) MV[i * (T + 1) + x.t] = x.ai;
        const sp = new Array(rec.length).fill(null);
        const X = b[i], Bv = rec.map(x => B(tab, x.s, x.t, x.ai, x.held)), Vv = rec.map((x, j) => { if (j === 0) return NaN; const Ly = layerOf(tab, rec[j - 1].ai); if (!bridgeSet.has(x.t)) return V(tab, Ly, x.s, x.t); const o = Vs(tab, Ly, x.s, x.t); sp[j] = o; return o.v; });
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
          // splitTook: the read probed once and given back by its split; the visit's state saved
          ST.set(x.s, (i * nb + bi) * DIM);
          { const o = sp[j]; sgN++; if (o && o.probes === 1 && o.split) { const sum = o.split.qs + o.split.qc + o.split.rs + o.split.rc, cl = sum < CL ? CL : sum > 1 - CL ? 1 - CL : sum; if (Math.abs(cl - Vv[j]) <= STOL) sgOk++; if (cl !== sum) clampN++; A[`QS${x.t}`][i] += o.split.qs; A[`QC${x.t}`][i] += o.split.qc; A[`RS${x.t}`][i] += o.split.rs; A[`RC${x.t}`][i] += o.split.rc; } }
          // the layer the visit's G is filed under: the tiers held (the previous move's); the plant `held` files it under the move taken
          const li = tab.tsLayerOf ? tab.tsLayerOf[PLANT === 'held' ? x.ai : rec[j - 1].ai] : 0; byL[li] += Gj; byLN[li]++;
          lyN++; if (!tab.tsLayerOf || (pairOf[li] && pairOf[li][0] === (x.held.pen || 0) && pairOf[li][1] === (x.held.isa || 0))) lyOk++;
          NB++; if (li !== li0) { GD += Gj; ND++; }
          if (i < NQ) { const Bc = Bq(tab, x.s, x.t, x.ai, x.held, false); qfN++; if (Bc === Bv[j]) qfOk++; QFs += Bv[j] - Bq(tab, x.s, x.t, x.ai, x.held, true); }
        }
        const B0 = Bv[0], resid = B0 - X - Ts - Gs;
        idN++; if (Math.abs(resid) <= TOL) idOk++;
        if (Math.abs(B0 - B(tab, s0, 0, ownC, H0())) <= TOL) ownOk++;
        A.X[i] = X; A.B0[i] = B0; A.T[i] = Ts; A.GB[i] = GB; A.GA[i] = GA; A.GL[i] = GL; A.GD[i] = GD; A.NB[i] = NB; A.ND[i] = ND;
        if (i < NQ) QF[i] = QFs;
      }
      // THE WHOLE SCORE per path (reduce-7t.mjs's arithmetic, the estate net of the pension death charge): its spending years the
      // years any path spent in; scoreTook: equal to scorePaths over the same trace where no death charge applies, and a failed
      // path never above zero (the plant 'score' counts the estate on a failed path)
      tr.survived = b;
      const spendYears = Array.from({ length: Y }, (_, t) => cand.c.yr.spend[t] > 0);
      const WS = new Float64Array(NPW);
      for (let i = 0; i < NPW; i++) {
        let cut = 0, raise = 0;
        for (let t = 0; t < Y; t++) { const l = tr.level[i * Y + t] / 100; if (l > 0 && l < 1) cut += LAMBDA * (1 - l) ** 2; else if (l > 1) raise += MU * Math.sqrt(Math.min(0.2, l - 1)); }
        if (tr.failYear[i] >= 0) for (let t = tr.failYear[i]; t < Y; t++) if (spendYears[t]) cut += LAMBDA * (1 - FLOOR_LEVEL) ** 2;
        const alive = b[i] === 1, est = alive ? Math.min(tnet[i], CAP) : PLANT === 'score' ? Math.min(Math.max(0, tr.wealth[i * Y + Y - 1]), CAP) + SCALE_W : 0;
        WS[i] = 100 * ((alive ? 1 : 0) + WB * est / SCALE_W - cut + (alive ? raise : 0));
      }
      // scoreTook's two legs: the score equal to scorePaths over the trace; the trace held to runPolicy's own counters
      { const ref7t = scorePaths(tr, { lambda: LAMBDA, floor: FLOOR_LEVEL, scale: SCALE_W, cap: CAP, spendYears });
        for (let i = 0; i < NPW; i++) {
          scN++;
          // scorePaths reads the estate from the trace's 32-bit wealth, the score from runPolicy's own: 1e-4 points covers the rounding
          const okp = Math.abs(ref7t[i] - WS[i]) <= 1e-4;
          let okc = true;
          if (b[i] === 1 && !(Math.abs(tr.wealth[i * Y + Y - 1] - term[i]) <= 1 + 1e-6 * Math.abs(term[i]))) okc = false;
          if (Number.isFinite(sfall[i])) { let ct = 0, ny = 0; for (let t = 0; t < Y; t++) { const l = tr.level[i * Y + t] / 100; if (spendYears[t] && l > 0) { ny++; if (l < 1) ct += (1 - l) ** 2; } } if (!(Math.abs(ct - sfall[i]) <= 0.01 * ny + 1e-9)) okc = false; }
          if (okp) spOk++; if (okc) ctOk++; if (okp && okc) scOk++;
        } }
      per[`WS${k}`] = WS;
      console.log(`${''.padEnd(16)} whole ${L} ${k}: mean ${f6(WS.reduce((t, x) => t + x, 0) / NPW)} spending years ${spendYears.filter(Boolean).length} of ${Y} floor level ${FLOOR_LEVEL} scale ${SCALE_W} cap ${CAP} death charge ${DEATH}`);
      bits[`OWN${k}`] = b; bits[`OWN${k}b`] = bb; moves[`MV${k}`] = MV;
      for (const x of [...KEYS, ...YK, ...SK, 'NB', 'ND']) per[`${x}${k}`] = A[x];
      states[`S${k}`] = ST;
      per[`QF${k}`] = QF;
      console.log(`${''.padEnd(16)} sim ${L} ${k} OWN ai ${ownC}: ${b.reduce((t, x) => t + x, 0)}/${NPW} bridge ${bb.reduce((t, x) => t + x, 0)} bits ${sha16(b)} ${sha16(bb)}`);
      let py = 0; for (const v of MV) if (v !== NOMOVE) py++;
      console.log(`${''.padEnd(16)} moves ${L} ${k}: path-years ${py} sha ${sha16(MV)}`);
      const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
      console.log(`${''.padEnd(16)} ledger ${L} ${k}: ${[...KEYS, ...YK].map(x => `${x} ${f6(100 * mean(A[x]))}`).join(' ')}`);
      console.log(`${''.padEnd(16)} split ${L} ${k}: ${SK.map(x => `${x} ${f6(100 * mean(A[x]))}`).join(' ')}`);
      for (let t = 1; t <= T; t++) if (yrN[t] > 0) console.log(`${''.padEnd(16)} year ${L} ${k} ${t}: paths ${yrN[t]} ${['G', 'T'].map(x => `${x} ${f6(100 * yr[x][t] / NPW)}`).join(' ')}`);
      console.log(`${''.padEnd(16)} derisk ${L} ${k}: plan layer ${li0} bridge path-years ${A.NB.reduce((t, x) => t + x, 0)} de-risked ${A.ND.reduce((t, x) => t + x, 0)} GD ${f6(100 * mean(A.GD))}`);
      console.log(`${''.padEnd(16)} qf ${L} ${k}: paths ${NQ} QF ${f6(100 * mean(QF))}`);
      for (let li = 0; li < nL; li++) console.log(`${''.padEnd(16)} layer ${L} ${k} ${li}: bridge path-years ${byLN[li]} G ${f6(100 * byL[li] / NPW)}`);
    }
    console.log(`${''.padEnd(16)} checks ${L}: ownTook ${ownOk}/${idN} identity ${idOk}/${idN} qfTook ${qfOk}/${qfN} layerTook ${lyOk}/${lyN} scoreTook ${scOk}/${scN} splitTook ${sgOk}/${sgN} secs ${Math.round((Date.now() - f0) / 1000)}`);
    console.log(`${''.padEnd(16)} clamped ${L}: ${clampN} of ${sgN} bridge-year reads at the reader's clamp (their split does not sum to the read)`);
    // the counters leg first: a trace a year short fails both legs, a score fault the scorePaths leg alone
    console.log(`${''.padEnd(16)} score legs ${L}: scorePaths ${spOk}/${scN} counters ${ctOk}/${scN}`);
    if (!(scN > 0) || ctOk !== scN) { console.error(`audit-refb: ${id} ${L}: the trace disagrees with runPolicy's own counters (counters ${ctOk}/${scN})`); process.exit(3); }
    if (spOk !== scN) { console.error(`audit-refb: ${id} ${L}: the whole score does not reproduce reduce-7t.mjs's over the trace (scorePaths ${spOk}/${scN})`); process.exit(3); }
    if (ownOk !== idN || idOk !== idN) { console.error(`audit-refb: ${id} ${L}: the ledger does not close on every path (ownTook ${ownOk}/${idN} identity ${idOk}/${idN})`); process.exit(3); }
    if (!(lyN > 0) || lyOk !== lyN) { console.error(`audit-refb: ${id} ${L}: a bridge visit's G is filed under a layer other than the tiers held (layerTook ${lyOk}/${lyN})`); process.exit(3); }
    if (!(sgN > 0) || sgOk !== sgN) { console.error(`audit-refb: ${id} ${L}: a bridge-year read is not given back by its split (splitTook ${sgOk}/${sgN})`); process.exit(3); }
    if (!(qfN > 0) || qfOk !== qfN) { console.error(`audit-refb: ${id} ${L}: the fine rule's machinery does not reproduce the one-step value (qfTook ${qfOk}/${qfN})`); process.exit(3); }
  }

  const tables = {};
  for (let k = 0; k < K; k++) { const tab = cand.mix.tables[k], Ls = tab.tsLayers || [tab]; Ls.forEach((Ly, li) => { for (const t of [...bridge, bridge[bridge.length - 1] + 1]) tables[`${k}/${li}/${t}`] = b64(Float32Array.from(Ly.lsurv[t])); }); }
  writeFileSync(join(OUT, fileOfJob(job)), gzipSync(JSON.stringify({ id, job: L, stamp: STAMP, NPW, seed: SEED, own: ownC, bridge, years: T + 1, nqf: Math.min(NPW, NQF), nfine: NFINE, bits: Object.fromEntries(Object.entries(bits).map(([x, v]) => [x, b64(v)])), per: Object.fromEntries(Object.entries(per).map(([x, v]) => [x, b64(v)])), moves: Object.fromEntries(Object.entries(moves).map(([x, v]) => [x, b64(v)])), dim: s0.length, states: Object.fromEntries(Object.entries(states).map(([x, v]) => [x, b64(v)])), tables })));
  console.log(`${''.padEnd(16)} file ${L}: ${fileOfJob(job)}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
