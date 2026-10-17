/*
 * AX-HO (PLAN.md AREF, its AX-HO step; predictions/diag-axho.md; the deep review after AOR, deep-review-log.md 17 Oct 18:22
 * UK): the adaptive reference with the RS split held out - a third household (S380) and S360 on a fresh registry seed (the
 * second seed, 7004), each against the order reference (BO's) on the same paths. Five jobs at 60 wealth points and six
 * shares, the candidate's own unit:
 *   J1   S380 under the adaptive reference with the RS split (`readerRef: 'adaptive', readerSplit: 'rs'`): AN's ledger on
 *        the first 4,000 paths a world (B_t, V_t, G_t, T_t, the identity, GB, GL, GA, GD, Y<t>, QF), its own opening run on
 *        paths 4,000 to 8,999 more without the ledger, P forced on the first 4,000 (the ledger's own runs when P is its
 *        opening: the same paths and first move, so the same run), and the engine leg below;
 *   J1X  J1 re-solved (its tables and opening J1's to the printed digit, the reducer checks), its own opening on paths
 *        9,000 to 15,999 and D forced on the first 4,000: with J1, 16,000 paths a world at J1's opening (item 2's power,
 *        predictions/diag-axho.md: at 4,000 a world's interval is wider than the 1.5-point HELD band at S380's survival);
 *   J2   S380 under the order reference (BO's arm), the ledger on the first 4,000 paths a world;
 *   J3   S360 as J1 (A6RS's settings), the ledger and the engine leg;
 *   J4   S360 under the order reference (BO's settings), the ledger.
 * Every job's own move in every year of every ledger path is saved (the reducer counts the moves and paths that differ
 * between arms, section 9 rule 5's standing gate for a no-harm item).
 * THE ENGINE LEG (J1 and J3; O165, the deep review's main flag): per world and p-decade, 25 bridge records sampled from the
 * ledger paths (in the bridge before its last year), each run in the engine under the reference's own moves (adaptive.js
 * moveAt; in the last year the first floor move that pays, as the rule reads it) 4,000 times on draws of its own: state g's
 * paths are engine.mjs pathsForSeed(seed + 7919 x (2^31 + 4,000 g)), so no state shares a draw with another or with the
 * ledger's paths (indices under 16,000); the reference's own rule run forward beside (adaptive.js simulate, 100,000 runs a
 * state); each against p in log terms with its exact interval. engTook refuses the job unless every engine path's first
 * draw is distinct from every other's and from every main path's.
 * Self-checks, each refusing the job (exit 3): armTook, adaptTook (the adaptive arms), pairTook (S380's forced jobs),
 * ownTook, identity, qfTook and layerTook (the ledger, AN's), engTook (the engine leg).
 * AXHO_PLANT (each must make its job refuse on its own check): arm (J1 under the order reference: armTook), rs (J1 without
 * the split: armTook), draws (every engine state on one stream: engTook; run on J3, whose S360 records fill the band), and AN's own, layer, quad and held (the ledger's
 * checks); nudge refuses nothing: it changes the own move at the first bridge year on every tenth ledger path of world 0,
 * the preflight's planted change for the differing-moves count.
 *   node research/solver/audit-axho.mjs [scale=1] [paths a world=4000] part k/n [seed]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy, chooseAction, scoreMoves, NODES, WEIGHTS } from '../../src/solver/solve.js';
import { readValues } from '../../src/solver/grid.js';
import * as F from '../../src/solver/fast.js';
import { clopperPearson } from './stats.mjs';
import { solveCandidate, CANDIDATE_OPTS } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { SEED as SEED_7U } from './panel-7u.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

// [household, arm, wealth points, shares, return nodes, the ledger, own-opening runs without it from and to (multiples of
// the paths a world), the forced openings]; XSPLIT balances J1's and J1X's runs (paths 4,000 to 8,999 on J1, 9,000 to
// 15,999 on J1X: S380's 60-point solve 3,738 s and 0.159 s a run, NE-EDGE's RZ log)
export const XSPLIT = 2.25;
export const JOBS = [
  ['S380', 'J1', 60, 6, 5, true, 1, XSPLIT, ['P']],
  ['S380', 'J1X', 60, 6, 5, false, XSPLIT, 4, ['D']],
  ['S380', 'J2', 60, 6, 5, true, 0, 0, []],
  ['S360', 'J3', 60, 6, 5, true, 0, 0, []],
  ['S360', 'J4', 60, 6, 5, true, 0, 0, []],
];
export const ARMS = Object.freeze({ J1: { readerRef: 'adaptive', readerSplit: 'rs' }, J1X: { readerRef: 'adaptive', readerSplit: 'rs' }, J2: { readerRef: 'order' }, J3: { readerRef: 'adaptive', readerSplit: 'rs' }, J4: { readerRef: 'order' } });
export const ADAPTIVE = Object.freeze({ J1: true, J1X: true, J2: false, J3: true, J4: false });
export const PAIRS = Object.freeze({ S380: [12, 14] });
export const FLOORS = Object.freeze({ S380: 52500, S360: 5000 });
export const TAIL = Object.freeze({ edges: [1e-4, 1e-3, 1e-2, 0.05, 0.95], per: 25, nsim: 100000 });
// the reference's lattice (adaptive.js's defaults, AN's, AO's and AOR's)
export const LATTICE = Object.freeze({ na: 160, nb: 41, nz: 128 });
export const OVERLAP = 100;   // J1X's own opening on world 0's first paths, against J1's ledger runs bit for bit
export const jobLabel = ([, arm, pts, sh, qn]) => `${arm}/P${pts}S${sh}Q${qn}`;
if (process.argv[2] === '--units') { console.log(JOBS.length); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const SCALE = Number(process.argv[2] || 1), NPW = Number(process.argv[3] || 4000);
if (!(SCALE >= 1) || !(NPW >= 1)) { console.error(`audit-axho: bad scale or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-axho: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7004;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-axho: seed ${process.argv[6]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const PLANT = process.env.AXHO_PLANT || '';
if (PLANT && !['arm', 'rs', 'draws', 'own', 'layer', 'quad', 'held', 'nudge'].includes(PLANT)) { console.error(`audit-axho: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979, W = 0.02, TOL = 1e-9, NENG = NPW;   // NENG: the engine leg's runs a state, the paths a world
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-axho: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAGAXHO_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagaxho');
mkdirSync(OUT, { recursive: true });

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const caseOf = id => all.find(s => s.id === id);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const sha16 = x => createHash('sha256').update(Buffer.from(x.buffer, x.byteOffset, x.byteLength)).digest('hex').slice(0, 16);
export const fileOfJob = job => `${job[0]}-${jobLabel(job).replace(/\//g, '-')}.json.gz`;
const H0 = () => ({ pen: 0, isa: 0, gia: 0 });
const f6 = x => x.toFixed(6);
// the per-path quantities saved (survival probability units; the reducer reads points), AN's: X survived, B0 the own
// table, T the quadrature and noise, GB and GA the grid's residual in and after the bridge (B0 - X = T + GB + GA), GL the
// bridge's residual in years 4 to 6, GD the de-risked layers' part of GB; and Y<t>, the residual in each bridge year t
export const KEYS = ['X', 'B0', 'T', 'GB', 'GA', 'GL', 'GD'];
// QF on the first NQF paths a world, at NFINE equal-weight midpoints in u (AN's: the inverse normal by Acklam's rational
// approximation, relative error under 1.2e-9)
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
const realAtRep = (c, z, act, t) => { const R = act.real, Vv = act.volEffAt[t], S = act.sigma, out = new Float64Array(4); for (let q = 0; q < 4; q++) out[q] = Math.exp(Math.log(1 + R[q]) + S[q] * 0 + Vv[q] * z) - 1; return out; };
const rngOf = sd => { let st = sd >>> 0; return () => { st = (st + 0x6D2B79F5) >>> 0; let x = st; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };

console.log(`AX-HO: the candidate's own unit, ${NPW} paths a world, wealth points divided by ${SCALE} (seed ${SEED}); ${JOBS.length} jobs; part ${part}`);
JOBS.forEach((job, ji) => {
  if (ji % pn !== pk) return;
  const [id, arm, pts0, shares, quad, ledger, x0, x1, forced] = job;
  const h = caseOf(id);
  if (!h) { console.error(`audit-axho: no case ${id}`); process.exit(2); }
  const PTS = Math.max(4, Math.round(pts0 / SCALE)), L = jobLabel(job), adaptive = ADAPTIVE[arm];
  console.log(`${id.padEnd(16)} case | job ${L} | points ${PTS} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const planted = arm === 'J1' && PLANT === 'arm' ? { readerRef: 'order' } : arm === 'J1' && PLANT === 'rs' ? { readerRef: 'adaptive' } : null;
  const extra = { ...(planted || ARMS[arm]), adaptiveLattice: { ...LATTICE }, ...(shares !== 6 ? { shares } : {}), ...(quad !== 5 ? { quadNodes: quad } : {}) };
  const cand = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, ...extra });
  const mt = cand.meta;
  const common = !!mt.tierState && !!mt.jointWorlds && !!mt.e3pcls && cand.switchMargin === 0 && cand.switchCharge === 0.001 && Math.abs(mt.bequestWeight - W) < 1e-12 && mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && !mt.readerChance && !mt.readerBlend && (mt.readerSplit || null) === (ARMS[arm].readerSplit || null);
  const took = mt.readerRef === ARMS[arm].readerRef && mt.shareNodes === undefined && mt.points === `total ${PTS} x ${shares} x 6` && cand.m.ctx.solvencyFloor === FLOORS[id] && mt.readerSupportLine === 0.5;
  const s0v = M.initialState(cand.m);
  const table = 100 * cand.worlds.reduce((t, wd, k) => t + cand.mix.weights[k] * wd.value(s0v, 0).survival, 0);
  const rdm = mt.reader || {};
  console.log(`${''.padEnd(16)} solve CAND ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran CAND ${L}: bridgeRead ${mt.bridgeRead} bridgeStep ${mt.bridgeStep} readerSplit ${mt.readerSplit} readerBlend ${mt.readerBlend} readerRef ${mt.readerRef || null} readerChance ${mt.readerChance} tierState ${mt.tierState} jointWorlds ${!!mt.jointWorlds} e3pcls ${!!mt.e3pcls} switchMargin ${cand.switchMargin} switchCharge ${cand.switchCharge} bequestWeight ${mt.bequestWeight} mix ${cand.mix.nodes.length} pts ${PTS} grid ${String(mt.points).replace(/ /g, '')} shareNodes ${mt.shareNodes ? mt.shareNodes.join(',') : 'none'} floor ${cand.m.ctx.solvencyFloor} line ${mt.readerSupportLine}`);
  console.log(`${''.padEnd(16)} reader ${L}: tables ${rdm.tables} unsupported ${rdm.unsupported} copied ${rdm.copied} copiedTop ${rdm.copiedTop} nodes ${rdm.nodes}`);
  console.log(`${''.padEnd(16)} checks ${L}: armTook ${took && common ? 1 : 0}/1`);
  if (!(took && common)) { console.error(`audit-axho: ${id} ${L}: the job's settings did not take`); process.exit(3); }
  const ad = adaptive ? cand.mix.tables[0].g.reader && cand.mix.tables[0].g.reader.adaptive : null, ref = ad ? ad.ref : null;
  if (adaptive) {
    const lt = ad && ad.lattice, ok = !!ad && ad.moves > 0 && ad.nonMono === 0 && lt.na === LATTICE.na && lt.nb === LATTICE.nb && lt.nz === LATTICE.nz && typeof ref.moveAt === 'function';
    console.log(`${''.padEnd(16)} adaptive ${L}: moves ${ad ? ad.moves : 0} nonMono ${ad ? ad.nonMono : -1} lattice ${lt ? `${lt.na}x${lt.nb}x${lt.ng} nz ${lt.nz}` : 'none'} last year ${ad ? ad.TL : -1} secs ${ad ? ad.secs.toFixed(1) : -1}`);
    console.log(`${''.padEnd(16)} checks ${L}: adaptTook ${ok ? 1 : 0}/1`);
    if (!ok) { console.error(`audit-axho: ${id} ${L}: the adaptive reference did not build at the lattice asked, or its last year's threshold is not monotone`); process.exit(3); }
  }
  const m = cand.m, T = m.ctx.totalYears, acts = cand.actions, n = acts.length, K = cand.mix.nodes.length, base = m.ctx.baseYear;
  const pair = PAIRS[id] && forced.length ? PAIRS[id] : null;
  if (pair) {
    const [P, D] = pair, ok = P < n && D < n && (acts[P].tierPen || 0) === 0 && (acts[P].tierIsa || 0) === 0 && acts[D].tierPen === 2 && acts[D].tierIsa === 2 && acts[P].tierBase === acts[D].tierBase && cand.levelOf[P] === cand.levelOf[D];
    console.log(`${''.padEnd(16)} pair ${L}: P ai ${P} level ${cand.levelOf[P]} tiers ${acts[P].tierPen || 0},${acts[P].tierIsa || 0}; D ai ${D} level ${cand.levelOf[D]} tiers ${acts[D].tierPen || 0},${acts[D].tierIsa || 0}`);
    console.log(`${''.padEnd(16)} checks ${L}: pairTook ${ok ? 1 : 0}/1`);
    if (!ok) { console.error(`audit-axho: ${id} ${L}: the forced pair is not the registered tiers at one level and tier base`); process.exit(3); }
  }
  if (n >= NOMOVE) { console.error(`audit-axho: ${id} ${L}: ${n} moves do not fit the saved moves' width`); process.exit(2); }
  let s0 = null;
  runPolicy(cand, E.pathsForSeed(SEED, 1, T)[0], { choose: (t, st, held) => { if (t === 0 && !s0) s0 = Float64Array.from(st); return chooseAction(cand, st, t, held); } });
  const ownC = chooseAction(cand, s0, 0, H0());
  console.log(`${''.padEnd(16)} openings ${L}: OWN ai ${ownC} level ${cand.levelOf[ownC]} tiers ${acts[ownC].tierPen || 0},${acts[ownC].tierIsa || 0}`);
  const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n), SV = new Float64Array(n), rd = new Float64Array(4);
  // B: world tab's one-step value of move ai at state s, year t, tiers held
  const B = (tab, s, t, ai, held) => { scoreMoves(tab, s, t, SC, TX, BQ, { ...held }, { ai, act: tab.c.acts[ai], nr: tab.nodeRealOfAt[Math.min(t, tab.nodeRealOfAt.length - 1)][ai] }, SV); return SV[ai]; };
  for (let k = 0; k < K; k++) {
    const tab = cand.mix.tables[k], pr = pair ? ` P ${(100 * B(tab, s0, 0, pair[0], H0())).toFixed(6)} D ${(100 * B(tab, s0, 0, pair[1], H0())).toFixed(6)}` : '';
    console.log(`${''.padEnd(16)} tables ${L} ${k} z ${cand.mix.nodes[k].toFixed(6)} weight ${cand.mix.weights[k].toFixed(6)}: OWN ${(100 * B(tab, s0, 0, ownC, H0())).toFixed(6)} READ ${(100 * cand.worlds[k].value(s0v, 0).survival).toFixed(6)}${pr}`);
  }
  const g = cand.mix.tables[0].g, bridge = [];
  for (let t = 1; t <= T; t++) if (g.reader && g.reader.years[t]) bridge.push(t);
  console.log(`${''.padEnd(16)} bridge ${L}: reader years ${bridge.join(',')}`);
  const NMAX = Math.max(NPW, Math.round(x1 * NPW)), wpaths = E.pathsForSeed(SEED, NMAX, T), bits = {}, per = {}, moves = {};
  const worldPath = (i, k) => { const cz = Float64Array.from(wpaths[i]); cz[cz.length - 1] = cand.mix.nodes[k]; return cz; };
  const TL = ref ? ref.TL : -1, inBridge = new Set(ref ? ref.bridge.filter(t => t >= 1 && t < TL) : []);
  const binOf = p => { const e = TAIL.edges; for (let j = 0; j < e.length - 1; j++) if (p >= e[j] && (p < e[j + 1] || (j === e.length - 2 && p <= e[j + 1]))) return j; return -1; };
  const samples = [];
  const f0 = Date.now();
  if (ledger) {
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
    let idOk = 0, idN = 0, ownOk = 0, qfOk = 0, qfN = 0, lyOk = 0, lyN = 0;
    const li0 = (() => { const t0b = cand.mix.tables[0]; return t0b.tsLayerOf ? t0b.tsLayerOf[t0b.tsLayerOf.findIndex((_, ai) => (acts[ai].tierPen || 0) === 0 && (acts[ai].tierIsa || 0) === 0)] : 0; })();
    const NQ = Math.min(NPW, NQF);
    // each tier layer's pair (the tiers a move into it holds), for layerTook
    const pairOf = (() => { const t0b = cand.mix.tables[0], m0 = {}; if (t0b.tsLayerOf) t0b.tsLayerOf.forEach((li, ai) => { if (!(li in m0)) m0[li] = [acts[ai].tierPen || 0, acts[ai].tierIsa || 0]; }); return m0; })();
    const YK = bridge.map(t => `Y${t}`), nL = cand.mix.tables[0].tsLayers ? cand.mix.tables[0].tsLayers.length : 1;
    // the plant `nudge`: another move holding the same tiers (else any other) in place of the own move at the first bridge
    // year on every tenth path of world 0 (the first preflight's sibling at the same tier base and another level did not
    // exist in this menu, so that plant changed no move)
    const sib = ai => { for (let a = 0; a < n; a++) if (a !== ai && (acts[a].tierPen || 0) === (acts[ai].tierPen || 0) && (acts[a].tierIsa || 0) === (acts[ai].tierIsa || 0)) return a; for (let a = 0; a < n; a++) if (a !== ai) return a; return ai; };
    for (let k = 0; k < K; k++) {
      const tab = cand.mix.tables[k], rs = rngOf(SEED * 1000 + 50 + k), cells = Array.from({ length: TAIL.edges.length - 1 }, () => ({ seen: 0, keep: [] }));
      const A = Object.fromEntries([...KEYS, ...YK, 'NB', 'ND'].map(x => [x, new Float64Array(NPW)])), b = new Uint8Array(NPW), bb = new Uint8Array(NPW), QF = new Float64Array(NQ);
      const MV = new Uint16Array(NPW * (T + 1)).fill(NOMOVE);
      const yr = { G: new Float64Array(T + 2), T: new Float64Array(T + 2) }, yrN = new Float64Array(T + 2), byL = new Float64Array(nL), byLN = new Float64Array(nL);
      const other = (() => { for (let ai = 0; ai < n; ai++) if (ai !== ownC && cand.levelOf[ai] !== cand.levelOf[ownC]) return ai; return ownC; })();
      for (let i = 0; i < NPW; i++) {
        const rec = [], nudge = PLANT === 'nudge' && k === 0 && i % 10 === 0;
        const r = runPolicy(cand, worldPath(i, k), { start: { t: 0, s: s0, held: H0(), firstAi: PLANT === 'own' ? other : ownC }, ...(nudge ? { choose: (t, st, held) => { const a = chooseAction(cand, st, t, held); return t === bridge[0] ? sib(a) : a; } } : {}), visit: (t, s, held, ai) => rec.push({ t, s: Float64Array.from(s), held: { ...held }, ai }) });
        b[i] = r.survived ? 1 : 0; bb[i] = r.survived || !r.preAccess ? 1 : 0;
        for (const x of rec) MV[i * (T + 1) + x.t] = x.ai;
        const X = b[i], Bv = rec.map(x => B(tab, x.s, x.t, x.ai, x.held)), Vv = rec.map((x, j) => (j === 0 ? NaN : V(tab, layerOf(tab, rec[j - 1].ai), x.s, x.t)));
        let Ts = 0, Gs = 0, GB = 0, GA = 0, GL = 0, GD = 0, NB = 0, ND = 0, QFs = 0;
        for (let j = 0; j < rec.length; j++) {
          const x = rec[j], last = j === rec.length - 1, next = last ? (x.t >= T ? X : 0) : Vv[j + 1], Tj = Bv[j] - next;
          Ts += Tj; yr.T[x.t] += Tj; yrN[x.t]++;
          if (j === 0) continue;
          // the plant `layer` reads G's table in the layer of the move taken, not the tiers held, so T and G no longer telescope
          const Vj = PLANT === 'layer' ? V(tab, layerOf(tab, x.ai), x.s, x.t) : Vv[j], Gj = Vj - Bv[j];
          Gs += Gj; yr.G[x.t] += Gj;
          if (adaptive && inBridge.has(x.t)) {
            const Aq = x.s[1] + x.s[2], bq = Aq > 0 ? x.s[1] / Aq : 0, p = ref.readV(k, x.t, Aq, bq, x.s[3]), bi = binOf(p);
            if (bi >= 0) { const c = cells[bi], q = { t: x.t, s: x.s, held: x.held, A: Aq, b: bq, gf: x.s[3], p }; c.seen++; if (c.keep.length < TAIL.per) c.keep.push(q); else { const jj = Math.floor(rs() * c.seen); if (jj < TAIL.per) c.keep[jj] = q; } }
          }
          const bi = bridge.indexOf(x.t);
          if (bi < 0) { GA += Gj; continue; }
          GB += Gj; A[`Y${x.t}`][i] += Gj; if (x.t >= 4 && x.t <= 6) GL += Gj;
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
      bits[`OWN${k}`] = b; bits[`OWN${k}b`] = bb; moves[`MV${k}`] = MV;
      for (const x of [...KEYS, ...YK, 'NB', 'ND']) per[`${x}${k}`] = A[x];
      per[`QF${k}`] = QF;
      samples.push(cells);
      console.log(`${''.padEnd(16)} sim ${L} ${k} OWN ai ${ownC}: ${b.reduce((t, x) => t + x, 0)}/${NPW} bridge ${bb.reduce((t, x) => t + x, 0)} bits ${sha16(b)} ${sha16(bb)}`);
      let py = 0; for (const v of MV) if (v !== NOMOVE) py++;
      console.log(`${''.padEnd(16)} moves ${L} ${k}: path-years ${py} sha ${sha16(MV)}`);
      const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
      console.log(`${''.padEnd(16)} ledger ${L} ${k}: ${[...KEYS, ...YK].map(x => `${x} ${f6(100 * mean(A[x]))}`).join(' ')}`);
      for (let t = 1; t <= T; t++) if (yrN[t] > 0) console.log(`${''.padEnd(16)} year ${L} ${k} ${t}: paths ${yrN[t]} ${['G', 'T'].map(x => `${x} ${f6(100 * yr[x][t] / NPW)}`).join(' ')}`);
      console.log(`${''.padEnd(16)} derisk ${L} ${k}: plan layer ${li0} bridge path-years ${A.NB.reduce((t, x) => t + x, 0)} de-risked ${A.ND.reduce((t, x) => t + x, 0)} GD ${f6(100 * mean(A.GD))}`);
      console.log(`${''.padEnd(16)} qf ${L} ${k}: paths ${NQ} QF ${f6(100 * mean(QF))}`);
      for (let li = 0; li < nL; li++) console.log(`${''.padEnd(16)} layer ${L} ${k} ${li}: bridge path-years ${byLN[li]} G ${f6(100 * byL[li] / NPW)}`);
    }
    console.log(`${''.padEnd(16)} checks ${L}: ownTook ${ownOk}/${idN} identity ${idOk}/${idN} qfTook ${qfOk}/${qfN} layerTook ${lyOk}/${lyN} secs ${Math.round((Date.now() - f0) / 1000)}`);
    if (ownOk !== idN || idOk !== idN) { console.error(`audit-axho: ${id} ${L}: the ledger does not close on every path (ownTook ${ownOk}/${idN} identity ${idOk}/${idN})`); process.exit(3); }
    if (!(lyN > 0) || lyOk !== lyN) { console.error(`audit-axho: ${id} ${L}: a bridge visit's G is filed under a layer other than the tiers held (layerTook ${lyOk}/${lyN})`); process.exit(3); }
    if (!(qfN > 0) || qfOk !== qfN) { console.error(`audit-axho: ${id} ${L}: the fine rule's machinery does not reproduce the one-step value (qfTook ${qfOk}/${qfN})`); process.exit(3); }
  }
  // the own opening without the ledger on paths x0 to x1 times the paths a world; J1X's overlap on world 0's first paths
  const r1 = Date.now();
  if (x1 > x0) for (let k = 0; k < K; k++) {
    const from = Math.round(x0 * NPW), to = Math.round(x1 * NPW), b = new Uint8Array(to - from);
    for (let i = from; i < to; i++) b[i - from] = runPolicy(cand, worldPath(i, k), { start: { t: 0, s: s0, held: H0(), firstAi: ownC } }).survived ? 1 : 0;
    bits[`OWNX${k}`] = b;
    console.log(`${''.padEnd(16)} simx ${L} ${k} OWN ai ${ownC} paths ${from} to ${to - 1}: ${b.reduce((t, x) => t + x, 0)}/${to - from} bits ${sha16(b)}`);
  }
  if (!ledger) {
    const no = Math.min(NPW, OVERLAP), b = new Uint8Array(no);
    for (let i = 0; i < no; i++) b[i] = runPolicy(cand, worldPath(i, 0), { start: { t: 0, s: s0, held: H0(), firstAi: ownC } }).survived ? 1 : 0;
    bits.OWNO0 = b;
    console.log(`${''.padEnd(16)} simo ${L} 0 OWN ai ${ownC} paths 0 to ${no - 1}: ${b.reduce((t, x) => t + x, 0)}/${no} bits ${sha16(b)}`);
  }
  // the forced openings on the first paths a world (where the opening is the job's own and the ledger ran, its runs are
  // the ledger's: the same paths and the same first move)
  for (const nm of forced) {
    const ai = pair[nm === 'P' ? 0 : 1];
    for (let k = 0; k < K; k++) {
      const b = ledger && ai === ownC ? Uint8Array.from(bits[`OWN${k}`]) : new Uint8Array(NPW);
      if (!(ledger && ai === ownC)) for (let i = 0; i < NPW; i++) b[i] = runPolicy(cand, worldPath(i, k), { start: { t: 0, s: s0, held: H0(), firstAi: ai } }).survived ? 1 : 0;
      bits[`${nm}${k}`] = b;
      console.log(`${''.padEnd(16)} sim ${L} ${k} ${nm} ai ${ai}: ${b.reduce((t, x) => t + x, 0)}/${NPW} bits ${sha16(b)}`);
    }
  }
  console.log(`${''.padEnd(16)} runs ${L}: secs ${Math.round((Date.now() - r1) / 1000)}`);
  if (adaptive && ledger) {
    // THE ENGINE LEG (reported; O165): each sampled record run NENG times in the engine on draws of its own, under the
    // reference's own moves to its last bridge year; the reference's own rule run forward beside (TAIL.nsim runs a state).
    // engTook: every engine path's first draw distinct from every other's and from every main path's (the plant `draws`
    // puts every state on state 0's stream)
    const t1 = Date.now(), lnIv = (pm, c, N) => { const [lo, hi] = clopperPearson(c, N); return { r: c / N, ln: Math.log(pm / (c / N)), lo: Math.log(pm / hi), hi: lo > 0 ? Math.log(pm / lo) : Infinity }; };
    const STOP = {}, fl = Float64Array.from(s0), pays = (st, t, ai) => { fl.set(st); const u = F.flow(cand.c, t, ai, fl); return !(u > 1 || cand.c.last.preNmpaInsolvent); };
    const firsts = new Set(wpaths.map(p => p[0]));
    let offS = 0, offE = 0, cellsN = 0, eN = 0, eDup = 0, gi = 0;
    for (let k = 0; k < K; k++) {
      const z = cand.mix.nodes[k], rs = rngOf(SEED * 1000 + 60 + k), gauss = () => { let u = 0, v = 0; while (u === 0) u = rs(); while (v === 0) v = rs(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      samples[k].forEach((c, bi) => {
        const q = c.keep.slice().sort((a, b) => a.t - b.t || a.A - b.A); if (!q.length) { console.log(`${''.padEnd(16)} tail ${L} ${k} ${bi}: records ${c.seen} states 0`); return; }
        let pm = 0, cs = 0, ce = 0; for (const x of q) pm += x.p; pm /= q.length;
        for (const x of q) cs += Math.round(ref.simulate(k, x.t, x.A, x.b, x.gf, TAIL.nsim, gauss) * TAIL.nsim);
        const mv = (t, st) => { if (t < TL) { const Aq = st[1] + st[2]; return ref.moveAt(t, Aq, Aq > 0 ? st[1] / Aq : 0, st[3]); } for (const ai of ref.moveList) if (pays(st, t, ai)) return ai; return ref.moveList[0]; };
        for (const x of q) {
          const gs = PLANT === 'draws' ? 0 : gi++, epaths = E.pathsForSeed(SEED + 7919 * (2147483648 + gs * NENG), NENG, T);
          for (const p of epaths) { eN++; if (firsts.has(p[0])) eDup++; firsts.add(p[0]); }
          for (let e = 0; e < NENG; e++) {
            const cz = Float64Array.from(epaths[e]); cz[cz.length - 1] = z;
            const s1 = Float64Array.from(x.s);
            try { const r = runPolicy(cand, cz, { start: { t: x.t, s: s1, held: { ...x.held }, firstAi: mv(x.t, s1) }, choose: (t, st) => { if (t > TL) throw STOP; return mv(t, st); } }); if (r.survived || r.failYear - base > TL) ce++; }
            catch (err) { if (err !== STOP) throw err; ce++; }
          }
        }
        const a = lnIv(pm, cs, q.length * TAIL.nsim), e = lnIv(pm, ce, q.length * NENG), off = x => x.lo > Math.log(1.5) || x.hi < -Math.log(1.5);
        cellsN++; if (off(a)) offS++; if (off(e)) offE++;
        const gf = x => `${x.r.toExponential(4)} ln ${x.ln.toFixed(4)} (${x.lo.toFixed(4)} to ${x.hi.toFixed(4)}) ${off(x) ? 'off' : 'ok'}`;
        console.log(`${''.padEnd(16)} tail ${L} ${k} ${bi}: records ${c.seen} states ${q.length} years ${[...new Set(q.map(x => x.t))].join(',')} p ${pm.toExponential(4)} | simulated ${gf(a)} | engine ${gf(e)}`);
      });
    }
    console.log(`${''.padEnd(16)} refTail ${L}: cells ${cellsN} off ${offS}; engine off ${offE}; ${TAIL.nsim} runs a state simulated, ${NENG} in the engine on its own draws, secs ${Math.round((Date.now() - t1) / 1000)}`);
    console.log(`${''.padEnd(16)} checks ${L}: engTook ${eN - eDup}/${eN}`);
    // a household with no bridge record in the band runs the leg on nothing: printed as such (0/0), never a pass (the reducer
    // says so); the refusal is for shared draws (the preflight's J1 at 4 points: S380's records all past the band)
    if (eDup !== 0) { console.error(`audit-axho: ${id} ${L}: the engine leg's draws are not each state's own (engTook ${eN - eDup}/${eN})`); process.exit(3); }
  }
  // the bridge years' survival tables (log-odds, Float32) of every world and layer, on the ledger's jobs (AN's)
  const tables = {};
  if (ledger) for (let k = 0; k < K; k++) { const tab = cand.mix.tables[k], Ls = tab.tsLayers || [tab]; Ls.forEach((Ly, li) => { for (const t of [...bridge, bridge[bridge.length - 1] + 1]) tables[`${k}/${li}/${t}`] = b64(Float32Array.from(Ly.lsurv[t])); }); }
  writeFileSync(join(OUT, fileOfJob(job)), gzipSync(JSON.stringify({ id, job: L, stamp: STAMP, NPW, seed: SEED, own: ownC, pair, bridge, years: T + 1, nqf: Math.min(NPW, NQF), nfine: NFINE, bits: Object.fromEntries(Object.entries(bits).map(([x, v]) => [x, b64(v)])), per: Object.fromEntries(Object.entries(per).map(([x, v]) => [x, b64(v)])), moves: Object.fromEntries(Object.entries(moves).map(([x, v]) => [x, b64(v)])), tables })));
  console.log(`${''.padEnd(16)} file ${L}: ${fileOfJob(job)}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
