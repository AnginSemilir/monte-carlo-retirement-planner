/*
 * AO (PLAN.md AREF, its AO step; predictions/diag-ao.md; the deep review after AN, deep-review-log.md 15 Oct 21:05 UK): the
 * adaptive reference out of sample on S364, read as NE-GRID C read S364 (audit-negridc.mjs, copied): at the household's
 * year-0 state, in every world table, the survival read at the forced pair - P (tiers 0,0) and D (2,2) - and at the job's own
 * opening; P forced in year 0 on ten times the base paths a world (40,000 at the base 4,000: S364's survival is near zero),
 * D and the own opening on the base paths; the seed's path i from seed + i x 7919, so the first 4,000 are NE-GRID C's. Three
 * jobs at 60 wealth points and six shares, the candidate's own unit, seed 7002:
 *   AO   the adaptive reference (`readerRef: 'adaptive'`, src/solver/adaptive.js), the default split;
 *   AOL  AO with the reference's lattice finer (320 by 41 cells, 256 draws: the 21:05 receipt's premise 2, never swept),
 *        in place of the RS split's ARS (the preflight: the residual R 0.00007 points of a 29-point read at S364's
 *        year-1 reads under the adaptive reference, so ARS's tables equalled AO's to 6e-6 points); reported only;
 *   CO   the order reference (NE-GRID C's S364 ORDER job, its P and D runs on the first 4,000 paths to be its bits).
 * The probe on every job (each year-1 read the year-0 score at P makes, corner by corner, by status: supported, clipped,
 * copied). On AO and AOL, reported (none refuses the run), from P's bridge records in the years before the last (the
 * position, the move, the reference's p, the path's bridge outcome):
 *   - the tail check: per world and p-decade (1e-4 to 1e-3, 1e-3 to 1e-2, 1e-2 to 0.05, and the band 0.05 to 0.95), 25
 *     records drawn at random, their mean p against the reference's own rule run forward (adaptive.js simulate) at 100,000
 *     runs a state, in log terms with an exact interval; a cell 'off' when its interval lies wholly beyond ln 1.5;
 *   - the engine run: from the same records, the engine (runPolicy) under the reference's own move each bridge year before
 *     the last (adaptive.js moveAt) and any floor move that pays in the last (moveList, the first that does), 1,000 runs a
 *     state at fresh draws, its bridge outcome against p, as the tail check (MODEL against TAIL: the same rule in the
 *     engine's model and in the reference's fixed context);
 *   - the tier slice (O158): the realised bridge outcome less p by world, year, the move's tiers and band (p in 0.05-0.95,
 *     below, above), with its standard error clustered by path.
 * Self-checks, each refusing the run: armTook, adaptTook (AO and AOL, each at its own lattice), pairTook and forceIdentity (as NE-GRID C's).
 * AO_PLANT=arm runs AO without its reference (armTook must refuse); pair takes D one tier step off on CO (pairTook must
 * refuse); force forces another opening as CAND's own on CO (forceIdentity must refuse); drift solves AO with the
 * reference's drift plant (every world grown at the centre's rates), a fault in p the tail check must flag.
 *   node research/solver/audit-ao.mjs [scale=1] [paths a world=4000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { LOR_CLAMPS, READER_PROBE } from '../../src/solver/grid.js';
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

// [household, arm, wealth points, shares, return nodes, P's paths a world as a multiple of the base]
export const JOBS = [['S364', 'AO', 60, 6, 5, 10], ['S364', 'AOL', 60, 6, 5, 10], ['S364', 'CO', 60, 6, 5, 1]];
export const ARMS = Object.freeze({ AO: { readerRef: 'adaptive' }, AOL: { readerRef: 'adaptive' }, CO: { readerRef: 'order' } });
export const PAIRS = Object.freeze({ S364: [12, 14] });
export const jobLabel = ([, arm, pts, sh, qn]) => `${arm}/P${pts}S${sh}Q${qn}`;
export const FLOORS = Object.freeze({ S364: 205000 });
export const TAIL = Object.freeze({ edges: [1e-4, 1e-3, 1e-2, 0.05, 0.95], per: 25, nsim: 100000, neng: 1000 });
export const SPLIT = Object.freeze({ AO: null, AOL: null, CO: null });
// the reference's lattice: AO's adaptive.js's defaults (AN's), AOL's twice as fine in the accessible money and the draws
export const LATTICES = Object.freeze({ AO: Object.freeze({ na: 160, nb: 41, nz: 128 }), AOL: Object.freeze({ na: 320, nb: 41, nz: 256 }) });
if (process.argv[2] === '--units') { console.log(JOBS.length); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const SCALE = Number(process.argv[2] || 1), NPW = Number(process.argv[3] || 4000);
if (!(SCALE >= 1) || !(NPW >= 1)) { console.error(`audit-ao: bad scale or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-ao: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-ao: seed ${process.argv[6]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const PLANT = process.env.AO_PLANT || '';
if (PLANT && !['arm', 'pair', 'force', 'drift'].includes(PLANT)) { console.error(`audit-ao: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979, W = 0.02, FI = Math.min(NPW, 1000);
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-ao: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAGAO_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagao');
mkdirSync(OUT, { recursive: true });

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const caseOf = id => all.find(s => s.id === id);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const sha16 = x => createHash('sha256').update(Buffer.from(x.buffer, x.byteOffset, x.byteLength)).digest('hex').slice(0, 16);
export const fileOfJob = job => `${job[0]}-${jobLabel(job).replace(/\//g, '-')}.json.gz`;
const H0 = () => ({ pen: 0, isa: 0, gia: 0 });

console.log(`AO: the candidate's own unit, ${NPW} paths a world (P ten times that where marked), wealth points divided by ${SCALE} (seed ${SEED}); ${JOBS.length} jobs; part ${part}`);
JOBS.forEach((job, ji) => {
  if (ji % pn !== pk) return;
  const [id, arm, pts0, shares, quad, pMult] = job;
  const h = caseOf(id);
  if (!h) { console.error(`audit-ao: no case ${id}`); process.exit(2); }
  const PTS = Math.max(4, Math.round(pts0 / SCALE)), L = jobLabel(job), planted = arm === 'CO', adaptive = arm === 'AO' || arm === 'AOL', LATTICE = LATTICES[arm];
  console.log(`${id.padEnd(16)} case | job ${L} | points ${PTS} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  LOR_CLAMPS.n = 0; LOR_CLAMPS.lo = 0; LOR_CLAMPS.hi = 0;
  const extra = { ...(PLANT === 'arm' && arm === 'AO' ? {} : ARMS[arm]), ...(adaptive ? { adaptiveLattice: { ...LATTICE, ...(PLANT === 'drift' && arm === 'AO' ? { plant: 'drift' } : {}) } } : {}), ...(shares !== 6 ? { shares } : {}), ...(quad !== 5 ? { quadNodes: quad } : {}) };
  const cand = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, ...extra });
  const cl = { ...LOR_CLAMPS }, mt = cand.meta;
  const common = !!mt.tierState && !!mt.jointWorlds && !!mt.e3pcls && cand.switchMargin === 0 && cand.switchCharge === 0.001 && Math.abs(mt.bequestWeight - W) < 1e-12 && mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && !mt.readerChance && !mt.readerBlend && (mt.readerSplit || null) === SPLIT[arm];
  const took = mt.readerRef === (arm === 'CO' ? 'order' : 'adaptive') && mt.shareNodes === undefined && mt.points === `total ${PTS} x ${shares} x 6` && cand.m.ctx.solvencyFloor === FLOORS[id] && mt.readerSupportLine === 0.5;
  const s0v = M.initialState(cand.m);
  const table = 100 * cand.worlds.reduce((t, wd, k) => t + cand.mix.weights[k] * wd.value(s0v, 0).survival, 0);
  const rd = mt.reader || {};
  console.log(`${''.padEnd(16)} solve CAND ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran CAND ${L}: bridgeRead ${mt.bridgeRead} bridgeStep ${mt.bridgeStep} readerSplit ${mt.readerSplit} readerBlend ${mt.readerBlend} readerRef ${mt.readerRef || null} readerChance ${mt.readerChance} tierState ${mt.tierState} jointWorlds ${!!mt.jointWorlds} e3pcls ${!!mt.e3pcls} switchMargin ${cand.switchMargin} switchCharge ${cand.switchCharge} bequestWeight ${mt.bequestWeight} mix ${cand.mix.nodes.length} pts ${PTS} grid ${String(mt.points).replace(/ /g, '')} shareNodes ${mt.shareNodes ? mt.shareNodes.join(',') : 'none'} floor ${cand.m.ctx.solvencyFloor} line ${mt.readerSupportLine}`);
  console.log(`${''.padEnd(16)} reader ${L}: tables ${rd.tables} unsupported ${rd.unsupported} copied ${rd.copied} copiedTop ${rd.copiedTop} nodes ${rd.nodes}; clamps n ${cl.n} lo ${cl.lo} hi ${cl.hi}`);
  console.log(`${''.padEnd(16)} checks ${L}: armTook ${took && common ? 1 : 0}/1`);
  if (!(took && common)) { console.error(`audit-ao: ${id} ${L}: the job's settings did not take`); process.exit(3); }
  const ad = adaptive ? cand.mix.tables[0].g.reader && cand.mix.tables[0].g.reader.adaptive : null, ref = ad ? ad.ref : null;
  if (adaptive) {
    const lt = ad && ad.lattice, ok = !!ad && ad.moves > 0 && ad.nonMono === 0 && lt.na === LATTICE.na && lt.nb === LATTICE.nb && lt.nz === LATTICE.nz && typeof ref.moveAt === 'function';
    console.log(`${''.padEnd(16)} adaptive ${L}: moves ${ad ? ad.moves : 0} nonMono ${ad ? ad.nonMono : -1} lattice ${lt ? `${lt.na}x${lt.nb}x${lt.ng} nz ${lt.nz}` : 'none'} last year ${ad ? ad.TL : -1} secs ${ad ? ad.secs.toFixed(1) : -1}`);
    console.log(`${''.padEnd(16)} checks ${L}: adaptTook ${ok ? 1 : 0}/1`);
    if (!ok) { console.error(`audit-ao: ${id} ${L}: the adaptive reference did not build at the lattice asked, or its last year's threshold is not monotone`); process.exit(3); }
  }
  const m = cand.m, T = m.ctx.totalYears, acts = cand.actions, n = acts.length, base = m.ctx.baseYear;
  const [P, D0] = PAIRS[id], D = PLANT === 'pair' && planted ? D0 - 1 : D0;
  const pairOk = P < n && D < n && (acts[P].tierPen || 0) === 0 && (acts[P].tierIsa || 0) === 0 && acts[D].tierPen === 2 && acts[D].tierIsa === 2 && acts[P].tierBase === acts[D].tierBase && cand.levelOf[P] === cand.levelOf[D];
  console.log(`${''.padEnd(16)} pair ${L}: P ai ${P} level ${cand.levelOf[P]} tiers ${acts[P].tierPen || 0},${acts[P].tierIsa || 0}; D ai ${D} level ${cand.levelOf[D]} tiers ${acts[D].tierPen || 0},${acts[D].tierIsa || 0}`);
  console.log(`${''.padEnd(16)} checks ${L}: pairTook ${pairOk ? 1 : 0}/1`);
  if (!pairOk) { console.error(`audit-ao: ${id} ${L}: the forced pair is not the registered tiers at one level and tier base`); process.exit(3); }
  let s0 = null;
  runPolicy(cand, E.pathsForSeed(SEED, 1, T)[0], { choose: (t, st, held) => { if (t === 0 && !s0) s0 = Float64Array.from(st); return chooseAction(cand, st, t, held); } });
  const ownC = chooseAction(cand, s0, 0, H0());
  console.log(`${''.padEnd(16)} openings ${L}: OWN ai ${ownC} level ${cand.levelOf[ownC]} tiers ${acts[ownC].tierPen || 0},${acts[ownC].tierIsa || 0}`);
  const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n), SV = new Float64Array(n);
  const svOf = (tab, ai) => { scoreMoves(tab, s0, 0, SC, TX, BQ, H0(), { ai, act: tab.c.acts[ai], nr: tab.nodeRealOfAt[0][ai] }, SV); return SV[ai]; };
  const K = cand.mix.nodes.length;
  for (let k = 0; k < K; k++) {
    const tab = cand.mix.tables[k];
    console.log(`${''.padEnd(16)} tables ${L} ${k} z ${cand.mix.nodes[k].toFixed(6)} weight ${cand.mix.weights[k].toFixed(6)}: P ${(100 * svOf(tab, P)).toFixed(6)} D ${(100 * svOf(tab, D)).toFixed(6)} OWN ${(100 * svOf(tab, ownC)).toFixed(6)}`);
  }
  // the probe (NE-GRID C's, every job): each year-1 read the year-0 score at P makes, corner by corner, by status
  for (let k = 0; k < K; k++) {
    const line = 0.5, acc = { reads: 0, W: 0, pr: 0, plain: 0, del: 0, res: 0, sup: [0, 0, 0, 0, 0], clip: [0, 0, 0, 0, 0], copy: [0, 0, 0, 0, 0] };   // [weight, w p, w S, w c, w R]
    READER_PROBE.fn = (Wt, IDX, NC, RD, pr) => {
      acc.reads++; acc.pr += pr;
      for (let q = 0; q < NC; q++) { const w = Wt[q]; if (w === 0) continue; const i = IDX[q], pk = RD.p[i], ck = RD.c[i], rk = RD.R[i], sk = pk * ck + rk; const b = pk >= line ? (sk > pk ? acc.clip : acc.sup) : acc.copy; b[0] += w; b[1] += w * pk; b[2] += w * sk; b[3] += w * ck; b[4] += w * rk; acc.W += w; acc.plain += w * sk; acc.del += w * ck * pk; acc.res += w * rk; }
    };
    try { svOf(cand.mix.tables[k], P); } finally { READER_PROBE.fn = null; }
    const f = (b, nm) => `${nm} w ${(b[0] / (acc.W || 1)).toFixed(6)} p ${(b[0] ? b[1] / b[0] : 0).toFixed(6)} S ${(b[0] ? 100 * b[2] / b[0] : 0).toFixed(6)} c ${(b[0] ? b[3] / b[0] : 0).toFixed(6)} R ${(b[0] ? 100 * b[4] / b[0] : 0).toFixed(6)}`;
    console.log(`${''.padEnd(16)} probe ${L} ${k} P: reads ${acc.reads} pr ${(acc.reads ? acc.pr / acc.reads : 0).toExponential(4)} plain ${(100 * acc.plain / (acc.W || 1)).toFixed(6)} deletion ${(100 * acc.del / (acc.W || 1)).toFixed(6)} residual ${(100 * acc.res / (acc.W || 1)).toFixed(6)} | ${f(acc.sup, 'sup')} | ${f(acc.clip, 'clip')} | ${f(acc.copy, 'copy')}`);
  }
  // the runs: P on NPW x pMult paths a world, D and the own opening on NPW; on the adaptive jobs P's bridge records feed the
  // tail check, the engine run and the tier slice (each record: year t in the bridge before its last year, the position, p)
  const f0 = Date.now(), NP = NPW * pMult, wpaths = E.pathsForSeed(SEED, NP, T), bits = {};
  const opens = [['P', P, NP], ['D', D, NPW], ...(ownC !== P && ownC !== D ? [['OWN', ownC, NPW]] : [])];
  const TL = ref ? ref.TL : -1, inBridge = new Set(ref ? ref.bridge.filter(t => t >= 1 && t < TL) : []);
  const binOf = p => { const e = TAIL.edges; for (let j = 0; j < e.length - 1; j++) if (p >= e[j] && (p < e[j + 1] || (j === e.length - 2 && p <= e[j + 1]))) return j; return -1; };
  const rngOf = sd => { let st = sd >>> 0; return () => { st = (st + 0x6D2B79F5) >>> 0; let x = st; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };
  const samples = [], slice = [];
  for (let k = 0; k < K; k++) {
    const z = cand.mix.nodes[k], rs = rngOf(SEED * 1000 + 50 + k), cells = Array.from({ length: TAIL.edges.length - 1 }, () => ({ seen: 0, keep: [] })), sl = new Map();
    for (const [nm, ai, np] of opens) {
      const b = new Uint8Array(np), rec = adaptive && nm === 'P';
      for (let i = 0; i < np; i++) {
        const cz = Float64Array.from(wpaths[i]); cz[cz.length - 1] = z;
        const rv = rec ? [] : null;
        const r = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: ai }, ...(rec ? { visit: (t, st, held, a) => { if (inBridge.has(t)) { const A = st[1] + st[2], bb = A > 0 ? st[1] / A : 0; rv.push({ t, s: Float64Array.from(st), held: { ...held }, A, b: bb, gf: st[3], p: ref.readV(k, t, A, bb, st[3]), ai: a }); } } } : {}) });
        b[i] = r.survived ? 1 : 0;
        if (!rec) continue;
        const bridgeOk = r.survived || r.failYear - base > TL ? 1 : 0;
        for (const x of rv) {
          const bi = binOf(x.p);
          if (bi >= 0) { const c = cells[bi]; c.seen++; if (c.keep.length < TAIL.per) c.keep.push(x); else { const j = Math.floor(rs() * c.seen); if (j < TAIL.per) c.keep[j] = x; } }
          // the tier slice (O158): realised bridge outcome less p, by year, the move's tiers and band, clustered by path
          const key = `${x.t} ${acts[x.ai].tierPen || 0},${acts[x.ai].tierIsa || 0} ${x.p >= 0.05 && x.p <= 0.95 ? 'band' : x.p < 0.05 ? 'low' : 'high'}`;
          let a = sl.get(key); if (!a) sl.set(key, a = { n: 0, paths: 0, d: 0, last: -1, S: 0, Sn: 0, SS: 0, SSn: 0, Snn: 0 });
          const d = bridgeOk - x.p; a.n++; a.d += d;
          if (a.last !== i) { if (a.last >= 0) { a.SS += a.S * a.S; a.SSn += a.S * a.Sn; a.Snn += a.Sn * a.Sn; } a.paths++; a.last = i; a.S = 0; a.Sn = 0; }
          a.S += d; a.Sn++;
        }
      }
      bits[`${nm}${k}`] = b;
      console.log(`${''.padEnd(16)} sim ${L} ${k} ${nm} ai ${ai}: ${b.reduce((t, x) => t + x, 0)}/${np} bits ${sha16(b)}`);
    }
    samples.push(cells); slice.push(sl);
  }
  console.log(`${''.padEnd(16)} runs ${L}: secs ${Math.round((Date.now() - f0) / 1000)}`);
  // forceIdentity on world 0's first FI paths: CAND's own opening forced against its unforced run (the plant forces another)
  const fi0 = Date.now(), other = (() => { for (let ai = 0; ai < n; ai++) if (ai !== ownC && cand.levelOf[ai] !== cand.levelOf[ownC]) return ai; return ownC; })();
  let same = 0;
  wpaths.slice(0, FI).forEach(zs => { const cz = Float64Array.from(zs); cz[cz.length - 1] = cand.mix.nodes[0]; const a = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: PLANT === 'force' && planted ? other : ownC } }), b = runPolicy(cand, cz); if (a.survived === b.survived && (a.survived ? a.terminal === b.terminal : a.failYear === b.failYear)) same++; });
  console.log(`${''.padEnd(16)} checks ${L}: forceIdentity ${same}/${FI} secs ${Math.round((Date.now() - fi0) / 1000)}`);
  if (same !== FI) { console.error(`audit-ao: ${id} ${L}: forcing CAND's own opening did not reproduce its run`); process.exit(3); }
  if (adaptive) {
    // THE TAIL CHECK (reported): per world and p-decade, the sampled records' mean p against the reference's own rule run
    // forward (adaptive.js simulate) at TAIL.nsim runs a state, in log terms; and THE ENGINE RUN (reported): from the same
    // records, the engine (runPolicy) under the reference's own move each bridge year before its last (moveAt), and in the
    // last any floor move that pays (moveList, the first that does, as the rule reads it), TAIL.neng runs a state at fresh
    // draws, its bridge outcome. A cell is 'off' when its interval lies wholly beyond ln 1.5 either way (a reported flag)
    const t1 = Date.now(), lnIv = (pm, c, N) => { const [lo, hi] = clopperPearson(c, N); return { r: c / N, ln: Math.log(pm / (c / N)), lo: Math.log(pm / hi), hi: lo > 0 ? Math.log(pm / lo) : Infinity }; };
    const STOP = {}, fl = Float64Array.from(s0), pays = (st, t, ai) => { fl.set(st); const u = F.flow(cand.c, t, ai, fl); return !(u > 1 || cand.c.last.preNmpaInsolvent); };
    let offT = 0, offE = 0, cellsN = 0;
    for (let k = 0; k < K; k++) {
      const z = cand.mix.nodes[k], rs = rngOf(SEED * 1000 + 60 + k), gauss = () => { let u = 0, v = 0; while (u === 0) u = rs(); while (v === 0) v = rs(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      const epaths = E.pathsForSeed(SEED * 1000 + 70 + k, TAIL.neng, T);
      samples[k].forEach((c, bi) => {
        const q = c.keep.slice().sort((a, b) => a.t - b.t || a.A - b.A); if (!q.length) { console.log(`${''.padEnd(16)} tail ${L} ${k} ${bi}: records ${c.seen} states 0`); return; }
        let pm = 0, cs = 0, ce = 0; for (const x of q) pm += x.p; pm /= q.length;
        for (const x of q) cs += Math.round(ref.simulate(k, x.t, x.A, x.b, x.gf, TAIL.nsim, gauss) * TAIL.nsim);
        for (const x of q) for (let e = 0; e < TAIL.neng; e++) {
          const cz = Float64Array.from(epaths[e]); cz[cz.length - 1] = z;
          const mv = (t, st) => { if (t < TL) { const A = st[1] + st[2]; return ref.moveAt(t, A, A > 0 ? st[1] / A : 0, st[3]); } for (const ai of ref.moveList) if (pays(st, t, ai)) return ai; return ref.moveList[0]; };
          try { const r = runPolicy(cand, cz, { start: { t: x.t, s: x.s, held: { ...x.held }, firstAi: mv(x.t, x.s) }, choose: (t, st) => { if (t > TL) throw STOP; return mv(t, st); } }); if (r.survived || r.failYear - base > TL) ce++; }
          catch (err) { if (err !== STOP) throw err; ce++; }
        }
        const a = lnIv(pm, cs, q.length * TAIL.nsim), e = lnIv(pm, ce, q.length * TAIL.neng), off = x => x.lo > Math.log(1.5) || x.hi < -Math.log(1.5);
        cellsN++; if (off(a)) offT++; if (off(e)) offE++;
        const g = x => `${x.r.toExponential(4)} ln ${x.ln.toFixed(4)} (${x.lo.toFixed(4)} to ${x.hi.toFixed(4)}) ${off(x) ? 'off' : 'ok'}`;
        console.log(`${''.padEnd(16)} tail ${L} ${k} ${bi}: records ${c.seen} states ${q.length} years ${[...new Set(q.map(x => x.t))].join(',')} p ${pm.toExponential(4)} | simulated ${g(a)} | engine ${g(e)}`);
      });
    }
    console.log(`${''.padEnd(16)} refTail ${L}: cells ${cellsN} off ${offT}; engine off ${offE}; ${TAIL.nsim} runs a state simulated, ${TAIL.neng} in the engine, secs ${Math.round((Date.now() - t1) / 1000)}`);
    for (let k = 0; k < K; k++) for (const [key, a] of [...slice[k]].sort((x, y) => (x[0] < y[0] ? -1 : 1))) {
      const SS = a.SS + a.S * a.S, SSn = a.SSn + a.S * a.Sn, Snn = a.Snn + a.Sn * a.Sn, mm = a.d / a.n, G = a.paths;
      const se = G > 1 ? Math.sqrt(Math.max(0, SS - 2 * mm * SSn + mm * mm * Snn) * G / (G - 1)) / a.n : NaN;
      console.log(`${''.padEnd(16)} tier ${L} ${k} ${key}: records ${a.n} paths ${G} realised less p ${(100 * mm).toFixed(4)} se ${(100 * se).toFixed(4)}`);
    }
  }
  writeFileSync(join(OUT, fileOfJob(job)), gzipSync(JSON.stringify({ id, job: L, stamp: STAMP, NPW, pMult, seed: SEED, own: ownC, pair: [P, D], bits: Object.fromEntries(Object.entries(bits).map(([k, b]) => [k, b64(b)])) })));
  console.log(`${''.padEnd(16)} file ${L}: ${fileOfJob(job)}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
