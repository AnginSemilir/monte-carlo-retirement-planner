/*
 * AOR (PLAN.md AREF, its AOR step; predictions/diag-aor.md; the deep review after AO, deep-review-log.md 16 Oct 05:36 UK):
 * does the copied residual R carry S364's world-0 over-read under the adaptive reference (O169), and what does the RS
 * split do to it? audit-ao.mjs copied, two jobs at 60 wealth points and six shares, the candidate's own unit, seed 7002:
 *   AOP  AO re-solved (`readerRef: 'adaptive'`, the default split), its tables and its P and D runs on the first 4,000
 *        paths a world to be AO's to the digit and the bit (the reducer checks them against AO's files);
 *   ARS  the adaptive reference with the RS split (`readerSplit: 'rs'`: each copied corner's R scaled to the query's chance).
 * THE DECOMPOSITION (both jobs, the deep review's per-read probe): the year-0 score at P in every world, read node by node
 * (the quadrature's weight q, the queried state's own chance pr, the corners' interpolated c and R (RS-scaled on ARS) and
 * the clamped read v = pr c + R), the deletion term sum q pr c and the residual sum q R; decompTook refuses unless sum q v
 * is the table's score at P to 1e-9 in every world (O170: the old probe summed each corner at its own p, equally weighted).
 * THE ENGINE RUN TWICE (AOP, reported; O165): the tail check's records as AO's, the engine under the reference's own moves
 * once with the record's sheltered cash and once with the year's typical value (s[6] = -1 each year, as the reference
 * reads it), each against p in log terms beside the reference's own rule run forward.
 * Self-checks, each refusing the run: armTook, adaptTook, pairTook, forceIdentity and decompTook.
 * AOR_PLANT=arm runs AOP without its reference (armTook must refuse); force forces another opening on ARS (forceIdentity
 * must refuse); weights reads the decomposition at equal weights on AOP (decompTook must refuse); rs reads ARS's R unscaled
 * (decompTook must refuse).
 *   node research/solver/audit-aor.mjs [scale=1] [paths a world=4000] part k/n [seed=7002]
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
export const JOBS = [['S364', 'AOP', 60, 6, 5, 1], ['S364', 'ARS', 60, 6, 5, 1]];
export const ARMS = Object.freeze({ AOP: { readerRef: 'adaptive' }, ARS: { readerRef: 'adaptive', readerSplit: 'rs' } });
export const PAIRS = Object.freeze({ S364: [12, 14] });
export const jobLabel = ([, arm, pts, sh, qn]) => `${arm}/P${pts}S${sh}Q${qn}`;
export const FLOORS = Object.freeze({ S364: 205000 });
export const TAIL = Object.freeze({ edges: [1e-4, 1e-3, 1e-2, 0.05, 0.95], per: 25, nsim: 100000, neng: 1000 });
export const SPLIT = Object.freeze({ AOP: null, ARS: 'rs' });
// the reference's lattice, AO's (adaptive.js's defaults)
export const LATTICE = Object.freeze({ na: 160, nb: 41, nz: 128 });
export const TOL_DECOMP = 1e-9;
if (process.argv[2] === '--units') { console.log(JOBS.length); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const SCALE = Number(process.argv[2] || 1), NPW = Number(process.argv[3] || 4000);
if (!(SCALE >= 1) || !(NPW >= 1)) { console.error(`audit-aor: bad scale or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-aor: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-aor: seed ${process.argv[6]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const PLANT = process.env.AOR_PLANT || '';
if (PLANT && !['arm', 'force', 'weights', 'rs'].includes(PLANT)) { console.error(`audit-aor: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979, W = 0.02, FI = Math.min(NPW, 1000);
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-aor: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAGAOR_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagaor');
mkdirSync(OUT, { recursive: true });

const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const caseOf = id => all.find(s => s.id === id);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const sha16 = x => createHash('sha256').update(Buffer.from(x.buffer, x.byteOffset, x.byteLength)).digest('hex').slice(0, 16);
export const fileOfJob = job => `${job[0]}-${jobLabel(job).replace(/\//g, '-')}.json.gz`;
const H0 = () => ({ pen: 0, isa: 0, gia: 0 });

console.log(`AOR: the candidate's own unit, ${NPW} paths a world, wealth points divided by ${SCALE} (seed ${SEED}); ${JOBS.length} jobs; part ${part}`);
JOBS.forEach((job, ji) => {
  if (ji % pn !== pk) return;
  const [id, arm, pts0, shares, quad, pMult] = job;
  const h = caseOf(id);
  if (!h) { console.error(`audit-aor: no case ${id}`); process.exit(2); }
  const PTS = Math.max(4, Math.round(pts0 / SCALE)), L = jobLabel(job), adaptive = true;
  console.log(`${id.padEnd(16)} case | job ${L} | points ${PTS} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  LOR_CLAMPS.n = 0; LOR_CLAMPS.lo = 0; LOR_CLAMPS.hi = 0;
  const extra = { ...(PLANT === 'arm' && arm === 'AOP' ? {} : ARMS[arm]), adaptiveLattice: { ...LATTICE }, ...(shares !== 6 ? { shares } : {}), ...(quad !== 5 ? { quadNodes: quad } : {}) };
  const cand = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, ...extra });
  const cl = { ...LOR_CLAMPS }, mt = cand.meta;
  const common = !!mt.tierState && !!mt.jointWorlds && !!mt.e3pcls && cand.switchMargin === 0 && cand.switchCharge === 0.001 && Math.abs(mt.bequestWeight - W) < 1e-12 && mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && !mt.readerChance && !mt.readerBlend && (mt.readerSplit || null) === SPLIT[arm];
  const took = mt.readerRef === 'adaptive' && mt.shareNodes === undefined && mt.points === `total ${PTS} x ${shares} x 6` && cand.m.ctx.solvencyFloor === FLOORS[id] && mt.readerSupportLine === 0.5;
  const s0v = M.initialState(cand.m);
  const table = 100 * cand.worlds.reduce((t, wd, k) => t + cand.mix.weights[k] * wd.value(s0v, 0).survival, 0);
  const rd = mt.reader || {};
  console.log(`${''.padEnd(16)} solve CAND ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran CAND ${L}: bridgeRead ${mt.bridgeRead} bridgeStep ${mt.bridgeStep} readerSplit ${mt.readerSplit} readerBlend ${mt.readerBlend} readerRef ${mt.readerRef || null} readerChance ${mt.readerChance} tierState ${mt.tierState} jointWorlds ${!!mt.jointWorlds} e3pcls ${!!mt.e3pcls} switchMargin ${cand.switchMargin} switchCharge ${cand.switchCharge} bequestWeight ${mt.bequestWeight} mix ${cand.mix.nodes.length} pts ${PTS} grid ${String(mt.points).replace(/ /g, '')} shareNodes ${mt.shareNodes ? mt.shareNodes.join(',') : 'none'} floor ${cand.m.ctx.solvencyFloor} line ${mt.readerSupportLine}`);
  console.log(`${''.padEnd(16)} reader ${L}: tables ${rd.tables} unsupported ${rd.unsupported} copied ${rd.copied} copiedTop ${rd.copiedTop} nodes ${rd.nodes}; clamps n ${cl.n} lo ${cl.lo} hi ${cl.hi}`);
  console.log(`${''.padEnd(16)} checks ${L}: armTook ${took && common ? 1 : 0}/1`);
  if (!(took && common)) { console.error(`audit-aor: ${id} ${L}: the job's settings did not take`); process.exit(3); }
  const ad = adaptive ? cand.mix.tables[0].g.reader && cand.mix.tables[0].g.reader.adaptive : null, ref = ad ? ad.ref : null;
  if (adaptive) {
    const lt = ad && ad.lattice, ok = !!ad && ad.moves > 0 && ad.nonMono === 0 && lt.na === LATTICE.na && lt.nb === LATTICE.nb && lt.nz === LATTICE.nz && typeof ref.moveAt === 'function';
    console.log(`${''.padEnd(16)} adaptive ${L}: moves ${ad ? ad.moves : 0} nonMono ${ad ? ad.nonMono : -1} lattice ${lt ? `${lt.na}x${lt.nb}x${lt.ng} nz ${lt.nz}` : 'none'} last year ${ad ? ad.TL : -1} secs ${ad ? ad.secs.toFixed(1) : -1}`);
    console.log(`${''.padEnd(16)} checks ${L}: adaptTook ${ok ? 1 : 0}/1`);
    if (!ok) { console.error(`audit-aor: ${id} ${L}: the adaptive reference did not build at the lattice asked, or its last year's threshold is not monotone`); process.exit(3); }
  }
  const m = cand.m, T = m.ctx.totalYears, acts = cand.actions, n = acts.length, base = m.ctx.baseYear;
  const [P, D] = PAIRS[id];
  const pairOk = P < n && D < n && (acts[P].tierPen || 0) === 0 && (acts[P].tierIsa || 0) === 0 && acts[D].tierPen === 2 && acts[D].tierIsa === 2 && acts[P].tierBase === acts[D].tierBase && cand.levelOf[P] === cand.levelOf[D];
  console.log(`${''.padEnd(16)} pair ${L}: P ai ${P} level ${cand.levelOf[P]} tiers ${acts[P].tierPen || 0},${acts[P].tierIsa || 0}; D ai ${D} level ${cand.levelOf[D]} tiers ${acts[D].tierPen || 0},${acts[D].tierIsa || 0}`);
  console.log(`${''.padEnd(16)} checks ${L}: pairTook ${pairOk ? 1 : 0}/1`);
  if (!pairOk) { console.error(`audit-aor: ${id} ${L}: the forced pair is not the registered tiers at one level and tier base`); process.exit(3); }
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
  // THE DECOMPOSITION: the year-0 score at P read node by node (the reader's own sum, grid.js l.413-419), against svOf
  let decOk = 0;
  for (let k = 0; k < K; k++) {
    const tab = cand.mix.tables[k], QW = tab.quadWeights, reads = [];
    READER_PROBE.fn = (Wt, IDX, NC, RD, pr) => {
      let cc = 0, rr = 0;
      for (let q = 0; q < NC; q++) { const w = Wt[q]; if (w === 0) continue; const i = IDX[q], pk = RD.p[i]; cc += w * RD.c[i]; rr += w * RD.R[i] * (arm === 'ARS' && PLANT !== 'rs' && pk > pr ? pr / pk : 1); }
      reads.push({ pr, cc, rr });
    };
    let sv;
    try { sv = svOf(tab, P); } finally { READER_PROBE.fn = null; }
    const qw = PLANT === 'weights' && arm === 'AOP' ? QW.map(() => 1 / QW.length) : QW;
    const CL = 1e-6, vOf = x => { const v = x.pr * x.cc + x.rr; return v < CL ? CL : v > 1 - CL ? 1 - CL : v; };
    let sum = 0, del = 0, res = 0;
    reads.forEach((x, n) => { sum += qw[n] * vOf(x); del += qw[n] * x.pr * x.cc; res += qw[n] * x.rr; console.log(`${''.padEnd(16)} read ${L} ${k} ${n}: q ${qw[n].toFixed(6)} pr ${x.pr.toExponential(6)} cc ${x.cc.toFixed(6)} rr ${(100 * x.rr).toFixed(6)} v ${(100 * vOf(x)).toFixed(6)}`); });
    const ok = reads.length === QW.length && Math.abs(sum - sv) <= TOL_DECOMP; if (ok) decOk++;
    console.log(`${''.padEnd(16)} decomp ${L} ${k}: reads ${reads.length} table ${(100 * sv).toFixed(9)} sum ${(100 * sum).toFixed(9)} deletion ${(100 * del).toFixed(9)} residual ${(100 * res).toFixed(9)} ${ok ? 'ok' : 'OFF'}`);
  }
  console.log(`${''.padEnd(16)} checks ${L}: decompTook ${decOk}/${K}`);
  if (decOk !== K) { console.error(`audit-aor: ${id} ${L}: the read's decomposition does not sum to the table's score at P`); process.exit(3); }
  // the runs: P, D and the own opening on NPW paths a world; on AOP P's bridge records feed the tail check and the engine run
  // twice (each record: year t in the bridge before its last year, the position, p)
  const f0 = Date.now(), NP = NPW * pMult, wpaths = E.pathsForSeed(SEED, NP, T), bits = {};
  const opens = [['P', P, NP], ['D', D, NPW], ...(ownC !== P && ownC !== D ? [['OWN', ownC, NPW]] : [])];
  const TL = ref ? ref.TL : -1, inBridge = new Set(ref ? ref.bridge.filter(t => t >= 1 && t < TL) : []);
  const binOf = p => { const e = TAIL.edges; for (let j = 0; j < e.length - 1; j++) if (p >= e[j] && (p < e[j + 1] || (j === e.length - 2 && p <= e[j + 1]))) return j; return -1; };
  const rngOf = sd => { let st = sd >>> 0; return () => { st = (st + 0x6D2B79F5) >>> 0; let x = st; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };
  const samples = [];
  for (let k = 0; k < K; k++) {
    const z = cand.mix.nodes[k], rs = rngOf(SEED * 1000 + 50 + k), cells = Array.from({ length: TAIL.edges.length - 1 }, () => ({ seen: 0, keep: [] }));
    for (const [nm, ai, np] of opens) {
      const b = new Uint8Array(np), rec = arm === 'AOP' && nm === 'P';
      for (let i = 0; i < np; i++) {
        const cz = Float64Array.from(wpaths[i]); cz[cz.length - 1] = z;
        const rv = rec ? [] : null;
        const r = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: ai }, ...(rec ? { visit: (t, st, held, a) => { if (inBridge.has(t)) { const A = st[1] + st[2], bb = A > 0 ? st[1] / A : 0; rv.push({ t, s: Float64Array.from(st), held: { ...held }, A, b: bb, gf: st[3], p: ref.readV(k, t, A, bb, st[3]), ai: a }); } } } : {}) });
        b[i] = r.survived ? 1 : 0;
        if (!rec) continue;
        for (const x of rv) {
          const bi = binOf(x.p);
          if (bi >= 0) { const c = cells[bi]; c.seen++; if (c.keep.length < TAIL.per) c.keep.push(x); else { const j = Math.floor(rs() * c.seen); if (j < TAIL.per) c.keep[j] = x; } }
        }
      }
      bits[`${nm}${k}`] = b;
      console.log(`${''.padEnd(16)} sim ${L} ${k} ${nm} ai ${ai}: ${b.reduce((t, x) => t + x, 0)}/${np} bits ${sha16(b)}`);
    }
    samples.push(cells);
  }
  console.log(`${''.padEnd(16)} runs ${L}: secs ${Math.round((Date.now() - f0) / 1000)}`);
  // forceIdentity on world 0's first FI paths: CAND's own opening forced against its unforced run (the plant forces another)
  const fi0 = Date.now(), other = (() => { for (let ai = 0; ai < n; ai++) if (ai !== ownC && cand.levelOf[ai] !== cand.levelOf[ownC]) return ai; return ownC; })();
  let same = 0;
  wpaths.slice(0, FI).forEach(zs => { const cz = Float64Array.from(zs); cz[cz.length - 1] = cand.mix.nodes[0]; const a = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: PLANT === 'force' && arm === 'ARS' ? other : ownC } }), b = runPolicy(cand, cz); if (a.survived === b.survived && (a.survived ? a.terminal === b.terminal : a.failYear === b.failYear)) same++; });
  console.log(`${''.padEnd(16)} checks ${L}: forceIdentity ${same}/${FI} secs ${Math.round((Date.now() - fi0) / 1000)}`);
  if (same !== FI) { console.error(`audit-aor: ${id} ${L}: forcing CAND's own opening did not reproduce its run`); process.exit(3); }
  if (arm === 'AOP') {
    // THE TAIL CHECK (reported): per world and p-decade, the sampled records' mean p against the reference's own rule run
    // forward (adaptive.js simulate) at TAIL.nsim runs a state, in log terms; and THE ENGINE RUN (reported): from the same
    // records, the engine (runPolicy) under the reference's own move each bridge year before its last (moveAt), and in the
    // last any floor move that pays (moveList, the first that does, as the rule reads it), TAIL.neng runs a state at fresh
    // draws, its bridge outcome. A cell is 'off' when its interval lies wholly beyond ln 1.5 either way (a reported flag)
    const t1 = Date.now(), lnIv = (pm, c, N) => { const [lo, hi] = clopperPearson(c, N); return { r: c / N, ln: Math.log(pm / (c / N)), lo: Math.log(pm / hi), hi: lo > 0 ? Math.log(pm / lo) : Infinity }; };
    const STOP = {}, fl = Float64Array.from(s0), pays = (st, t, ai) => { fl.set(st); const u = F.flow(cand.c, t, ai, fl); return !(u > 1 || cand.c.last.preNmpaInsolvent); };
    let offT = 0, offE = 0, offC = 0, cellsN = 0;
    for (let k = 0; k < K; k++) {
      const z = cand.mix.nodes[k], rs = rngOf(SEED * 1000 + 60 + k), gauss = () => { let u = 0, v = 0; while (u === 0) u = rs(); while (v === 0) v = rs(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      const epaths = E.pathsForSeed(SEED * 1000 + 70 + k, TAIL.neng, T);
      samples[k].forEach((c, bi) => {
        const q = c.keep.slice().sort((a, b) => a.t - b.t || a.A - b.A); if (!q.length) { console.log(`${''.padEnd(16)} tail ${L} ${k} ${bi}: records ${c.seen} states 0`); return; }
        let pm = 0, cs = 0; for (const x of q) pm += x.p; pm /= q.length;
        for (const x of q) cs += Math.round(ref.simulate(k, x.t, x.A, x.b, x.gf, TAIL.nsim, gauss) * TAIL.nsim);
        // the engine run twice: the record's sheltered cash (s[6] as recorded) and the year's typical value (s[6] = -1 set
        // before every year's flow, as the reference reads it; fast.js l.360)
        const eng = typical => { let ce = 0; for (const x of q) for (let e = 0; e < TAIL.neng; e++) {
          const cz = Float64Array.from(epaths[e]); cz[cz.length - 1] = z;
          const mv = (t, st) => { if (typical) st[6] = -1; if (t < TL) { const A = st[1] + st[2]; return ref.moveAt(t, A, A > 0 ? st[1] / A : 0, st[3]); } for (const ai of ref.moveList) if (pays(st, t, ai)) return ai; return ref.moveList[0]; };
          const s1 = Float64Array.from(x.s); if (typical) s1[6] = -1;
          try { const r = runPolicy(cand, cz, { start: { t: x.t, s: s1, held: { ...x.held }, firstAi: mv(x.t, s1) }, choose: (t, st) => { if (t > TL) throw STOP; return mv(t, st); } }); if (r.survived || r.failYear - base > TL) ce++; }
          catch (err) { if (err !== STOP) throw err; ce++; }
        } return ce; };
        const ce = eng(false), ct = eng(true);
        const a = lnIv(pm, cs, q.length * TAIL.nsim), e = lnIv(pm, ce, q.length * TAIL.neng), ec = lnIv(pm, ct, q.length * TAIL.neng), off = x => x.lo > Math.log(1.5) || x.hi < -Math.log(1.5);
        cellsN++; if (off(a)) offT++; if (off(e)) offE++; if (off(ec)) offC++;
        const g = x => `${x.r.toExponential(4)} ln ${x.ln.toFixed(4)} (${x.lo.toFixed(4)} to ${x.hi.toFixed(4)}) ${off(x) ? 'off' : 'ok'}`;
        console.log(`${''.padEnd(16)} tail ${L} ${k} ${bi}: records ${c.seen} states ${q.length} years ${[...new Set(q.map(x => x.t))].join(',')} p ${pm.toExponential(4)} | simulated ${g(a)} | engine ${g(e)} | typical ${g(ec)}`);
      });
    }
    console.log(`${''.padEnd(16)} refTail ${L}: cells ${cellsN} off ${offT}; engine off ${offE}; typical off ${offC}; ${TAIL.nsim} runs a state simulated, ${TAIL.neng} in the engine twice, secs ${Math.round((Date.now() - t1) / 1000)}`);
  }
  writeFileSync(join(OUT, fileOfJob(job)), gzipSync(JSON.stringify({ id, job: L, stamp: STAMP, NPW, pMult, seed: SEED, own: ownC, pair: [P, D], bits: Object.fromEntries(Object.entries(bits).map(([k, b]) => [k, b64(b)])) })));
  console.log(`${''.padEnd(16)} file ${L}: ${fileOfJob(job)}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
