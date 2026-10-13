/*
 * NE-EDGE (PLAN.md NE-EDGE; the deep review after NE-GRID C, deep-review-log.md 13 Oct 02:17 UK; predictions/diag-needge.md).
 * The near-dead read: the reader adds each corner's residual R unscaled by the query's own chance (grid.js's read; PR18).
 * The candidate's own unit (CAND solveCandidate, CANDIDATE_OPTS with e3pcls), the tuning seed 7002 (7u's held-out seed
 * refused), at 0.02, 60 wealth points, 6 shares, 5 return nodes. Seven jobs, one process each (JOBS), each a household and
 * an arm: BASE (the identity control, NE-GRID C's S364 job re-run); RZ (readerSplit 'rz': R set to 0, the split kept);
 * RS (readerSplit 'rs': each corner's R scaled by min(1, the query's chance / the corner's)):
 *   S364 under BASE, RZ and RS; bridge 4 and S380 under RZ and RS (their BASE at 60 points is NE-GRID B1's).
 * At the household's year-0 state, in every world table: the survival read at the forced pair (P tiers 0,0 and D 2,2 at
 * one level and tier base, PAIRS) and at the job's own opening; P and D forced in year 0 on the seed's first 4,000 paths a
 * world (B1's and C's paths), the job's own moves after; the own opening too where it is neither. The probe on S364's
 * three jobs: every read the year-0 score at P makes, corner by corner (as NE-GRID C's).
 * Self-checks, each refusing the run: armTook (the job's readerSplit in the solve's meta, the candidate's others intact,
 * the floor and the support line the household's), pairTook, forceIdentity (as NE-GRID C's).
 * NEEDGE_PLANT=arm runs S364's RS job without its split (armTook must refuse); =pair takes D a tier step off there
 * (pairTook must refuse); =force forces another opening as CAND's own there (forceIdentity must refuse).
 *   node research/solver/audit-needge.mjs [scale=1] [paths a world=4000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { LOR_CLAMPS, READER_PROBE } from '../../src/solver/grid.js';
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
export const JOBS = [['S364', 'BASE', 60, 6, 5, 1], ['S364', 'RZ', 60, 6, 5, 1], ['S364', 'RS', 60, 6, 5, 1], ['bridge 4', 'RZ', 60, 6, 5, 1], ['bridge 4', 'RS', 60, 6, 5, 1],
  ['S380', 'RZ', 60, 6, 5, 1], ['S380', 'RS', 60, 6, 5, 1]];
export const ARMS = Object.freeze({ BASE: {}, RZ: { readerSplit: 'rz' }, RS: { readerSplit: 'rs' } });
export const SPLIT = Object.freeze({ BASE: null, RZ: 'rz', RS: 'rs' });
// the forced pair per household: S380's, bridge 4's and S224's as NE-GRID B1's; S364's NE-ROOT's SS and SC (results/diagneroot)
export const PAIRS = Object.freeze({ S380: [12, 14], 'bridge 4': [57, 59], S224: [0, 2], S364: [12, 14] });
export const jobLabel = ([, arm, pts, sh, qn]) => `${arm}/P${pts}S${sh}Q${qn}`;
// the jobs whose year-1 reads at P are logged corner by corner (the probe)
export const PROBED = new Set(['S364 BASE/P60S6Q5', 'S364 RZ/P60S6Q5', 'S364 RS/P60S6Q5']);
// the minimum end pot the solve sets (solvePlan, solve.js: the plan's own, else one year's target spend), read from the
// model's context by M.prepare on 12 Oct; a run whose context differs is refused
export const FLOORS = Object.freeze({ S380: 52500, 'bridge 4': 29000, S224: 430000, S364: 205000 });
if (process.argv[2] === '--units') { console.log(JOBS.length); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const SCALE = Number(process.argv[2] || 1), NPW = Number(process.argv[3] || 4000);
if (!(SCALE >= 1) || !(NPW >= 1)) { console.error(`audit-needge: bad scale or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-needge: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-needge: seed ${process.argv[6]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const PLANT = process.env.NEEDGE_PLANT || '';
if (PLANT && !['arm', 'pair', 'force'].includes(PLANT)) { console.error(`audit-needge: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979, W = 0.02, FI = Math.min(NPW, 1000);
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-needge: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAGNEEDGE_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagneedge');
mkdirSync(OUT, { recursive: true });

// the households: audit-negrid.mjs's builders (copied): bridge 4 from S126, the others the library's
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
const caseOf = id => (id === 'bridge 4' ? variant(id, { bridge: 4 }) : all.find(s => s.id === id));
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
const sha16 = x => createHash('sha256').update(Buffer.from(x.buffer, x.byteOffset, x.byteLength)).digest('hex').slice(0, 16);
export const fileOfJob = job => `${job[0].replace(/ /g, '_')}-${jobLabel(job).replace(/\//g, '-')}.json.gz`;
const H0 = () => ({ pen: 0, isa: 0, gia: 0 });

console.log(`NE-EDGE: the candidate's own unit, ${NPW} paths a world, wealth points divided by ${SCALE} (seed ${SEED}); ${JOBS.length} jobs; part ${part}`);
JOBS.forEach((job, ji) => {
  if (ji % pn !== pk) return;
  const [id, arm, pts0, shares, quad, pMult] = job;
  const h = caseOf(id);
  if (!h) { console.error(`audit-needge: no case ${id}`); process.exit(2); }
  const PTS = Math.max(4, Math.round(pts0 / SCALE)), L = jobLabel(job), planted = id === 'S364' && arm === 'RS';
  console.log(`${id.padEnd(16)} case | job ${L} | points ${PTS} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  LOR_CLAMPS.n = 0; LOR_CLAMPS.lo = 0; LOR_CLAMPS.hi = 0;
  const extra = { ...(PLANT === 'arm' && planted ? {} : ARMS[arm]), ...(shares !== 6 ? { shares } : {}), ...(quad !== 5 ? { quadNodes: quad } : {}),  };
  const cand = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, ...extra });
  const cl = { ...LOR_CLAMPS }, mt = cand.meta;
  const common = !!mt.tierState && !!mt.jointWorlds && !!mt.e3pcls && cand.switchMargin === 0 && cand.switchCharge === 0.001 && Math.abs(mt.bequestWeight - W) < 1e-12 && mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && !mt.readerChance;
  const took = (mt.readerSplit || null) === SPLIT[arm] && !mt.readerBlend && mt.readerRef !== 'order' && cand.m.ctx.solvencyFloor === FLOORS[id] && mt.readerSupportLine === 0.5;
  const s0v = M.initialState(cand.m);
  const table = 100 * cand.worlds.reduce((t, wd, k) => t + cand.mix.weights[k] * wd.value(s0v, 0).survival, 0);
  const rd = mt.reader || {};
  console.log(`${''.padEnd(16)} solve CAND ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran CAND ${L}: bridgeRead ${mt.bridgeRead} bridgeStep ${mt.bridgeStep} readerSplit ${mt.readerSplit} readerBlend ${mt.readerBlend} readerRef ${mt.readerRef || null} readerChance ${mt.readerChance} tierState ${mt.tierState} jointWorlds ${!!mt.jointWorlds} e3pcls ${!!mt.e3pcls} switchMargin ${cand.switchMargin} switchCharge ${cand.switchCharge} bequestWeight ${mt.bequestWeight} mix ${cand.mix.nodes.length} pts ${PTS} grid ${String(mt.points).replace(/ /g, '')} floor ${cand.m.ctx.solvencyFloor} line ${mt.readerSupportLine}`);
  console.log(`${''.padEnd(16)} reader ${L}: tables ${rd.tables} unsupported ${rd.unsupported} copied ${rd.copied} copiedTop ${rd.copiedTop} nodes ${rd.nodes}; clamps n ${cl.n} lo ${cl.lo} hi ${cl.hi}`);
  console.log(`${''.padEnd(16)} checks ${L}: armTook ${took && common ? 1 : 0}/1`);
  if (!(took && common)) { console.error(`audit-needge: ${id} ${L}: the job's settings did not take`); process.exit(3); }
  const m = cand.m, T = m.ctx.totalYears, acts = cand.actions, n = acts.length;
  const [P, D0] = PAIRS[id], D = PLANT === 'pair' && planted ? D0 - 1 : D0;
  const pairOk = P < n && D < n && (acts[P].tierPen || 0) === 0 && (acts[P].tierIsa || 0) === 0 && acts[D].tierPen === 2 && acts[D].tierIsa === 2 && acts[P].tierBase === acts[D].tierBase && cand.levelOf[P] === cand.levelOf[D];
  console.log(`${''.padEnd(16)} pair ${L}: P ai ${P} level ${cand.levelOf[P]} tiers ${acts[P].tierPen || 0},${acts[P].tierIsa || 0}; D ai ${D} level ${cand.levelOf[D]} tiers ${acts[D].tierPen || 0},${acts[D].tierIsa || 0}`);
  console.log(`${''.padEnd(16)} checks ${L}: pairTook ${pairOk ? 1 : 0}/1`);
  if (!pairOk) { console.error(`audit-needge: ${id} ${L}: the forced pair is not the registered tiers at one level and tier base`); process.exit(3); }
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
  if (PROBED.has(`${id} ${L}`)) {
    const line = 0.5;
    for (let k = 0; k < K; k++) {
      const acc = { reads: 0, W: 0, pr: 0, plain: 0, del: 0, res: 0, sup: [0, 0, 0, 0, 0], clip: [0, 0, 0, 0, 0], copy: [0, 0, 0, 0, 0] };   // [weight, w p, w S, w c, w R]
      READER_PROBE.fn = (Wt, IDX, NC, RD, pr) => {
        acc.reads++; acc.pr += pr;
        for (let q = 0; q < NC; q++) { const w = Wt[q]; if (w === 0) continue; const i = IDX[q], pk = RD.p[i], ck = RD.c[i], rk = RD.R[i], sk = pk * ck + rk; const b = pk >= line ? (sk > pk ? acc.clip : acc.sup) : acc.copy; b[0] += w; b[1] += w * pk; b[2] += w * sk; b[3] += w * ck; b[4] += w * rk; acc.W += w; acc.plain += w * sk; acc.del += w * ck * pk; acc.res += w * rk; }
      };
      try { svOf(cand.mix.tables[k], P); } finally { READER_PROBE.fn = null; }
      const f = (b, nm) => `${nm} w ${(b[0] / (acc.W || 1)).toFixed(6)} p ${(b[0] ? b[1] / b[0] : 0).toFixed(6)} S ${(b[0] ? 100 * b[2] / b[0] : 0).toFixed(6)} c ${(b[0] ? b[3] / b[0] : 0).toFixed(6)} R ${(b[0] ? 100 * b[4] / b[0] : 0).toFixed(6)}`;
      console.log(`${''.padEnd(16)} probe ${L} ${k} P: reads ${acc.reads} pr ${(acc.reads ? acc.pr / acc.reads : 0).toExponential(4)} plain ${(100 * acc.plain / (acc.W || 1)).toFixed(6)} deletion ${(100 * acc.del / (acc.W || 1)).toFixed(6)} residual ${(100 * acc.res / (acc.W || 1)).toFixed(6)} | ${f(acc.sup, 'sup')} | ${f(acc.clip, 'clip')} | ${f(acc.copy, 'copy')}`);
    }
  }
  const f0 = Date.now(), NP = NPW * pMult, wpaths = E.pathsForSeed(SEED, NP, T), bits = {};
  const opens = [['P', P, NP], ['D', D, NPW], ...(ownC !== P && ownC !== D ? [['OWN', ownC, NPW]] : [])];
  for (let k = 0; k < K; k++) {
    const z = cand.mix.nodes[k];
    for (const [nm, ai, np] of opens) {
      const b = new Uint8Array(np);
      for (let i = 0; i < np; i++) { const cz = Float64Array.from(wpaths[i]); cz[cz.length - 1] = z; b[i] = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: ai } }).survived ? 1 : 0; }
      bits[`${nm}${k}`] = b;
      console.log(`${''.padEnd(16)} sim ${L} ${k} ${nm} ai ${ai}: ${b.reduce((t, x) => t + x, 0)}/${np} bits ${sha16(b)}`);
    }
  }
  // forceIdentity on world 0's first FI paths: CAND's own opening forced against its unforced run (the plant forces another)
  const other = (() => { for (let ai = 0; ai < n; ai++) if (ai !== ownC && cand.levelOf[ai] !== cand.levelOf[ownC]) return ai; return ownC; })();
  let same = 0;
  wpaths.slice(0, FI).forEach(zs => { const cz = Float64Array.from(zs); cz[cz.length - 1] = cand.mix.nodes[0]; const a = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: PLANT === 'force' && planted ? other : ownC } }), b = runPolicy(cand, cz); if (a.survived === b.survived && (a.survived ? a.terminal === b.terminal : a.failYear === b.failYear)) same++; });
  console.log(`${''.padEnd(16)} checks ${L}: forceIdentity ${same}/${FI} secs ${Math.round((Date.now() - f0) / 1000)}`);
  if (same !== FI) { console.error(`audit-needge: ${id} ${L}: forcing CAND's own opening did not reproduce its run`); process.exit(3); }
  writeFileSync(join(OUT, fileOfJob(job)), gzipSync(JSON.stringify({ id, job: L, stamp: STAMP, NPW, seed: SEED, own: ownC, pair: [P, D], bits: Object.fromEntries(Object.entries(bits).map(([k, b]) => [k, b64(b)])) })));
  console.log(`${''.padEnd(16)} file ${L}: ${fileOfJob(job)}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
