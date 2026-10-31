/*
 * NE-GRID B1 (PLAN.md NE-GRID; the deep review after NE-BLEND stage A, deep-review-log.md 11 Oct 15:49 UK, its decisive
 * test; predictions/diag-negrid-b1.md). The candidate's own unit (CAND solveCandidate, CANDIDATE_OPTS with e3pcls), the
 * tuning seed 7002 (7u's held-out seed refused), at 0.02. Twelve jobs, one process each (JOBS): S380, bridge 4 and S224
 * under BASE and LOR (readerBlend 'logodds') at the coarse grid (30 wealth points) and the fine grid (60).
 * At the household's year-0 state, in every world table: the survival read at the forced pair - the plan-tier opening P
 * (tiers 0,0) and the de-risked opening D (tiers 2,2) at one spend level and tier base, fixed per household (PAIRS) - and
 * at the arm's own opening. On the fine grid only: P and D (and the own opening where it is neither) forced in year 0 on the
 * seed's first NPW paths in each world, the arm's own moves after it; S224 under LOR is not simulated (it has no bridge
 * year, so the LOR read never runs: its clamp count must be 0 and its tables BASE's, the reducer's identity check).
 * The LOR corners read past the clamp counted over the solve (grid.js LOR_CLAMPS; 0 under BASE).
 * Self-checks, each refusing the run: armTook (the arm in the solve's meta, the candidate's others intact), pairTook (P and
 * D at the registered tiers, one level and tier base) and, where it simulates, forceIdentity (forcing CAND's own opening
 * reproduces its unforced run on world 0's first 1,000 paths).
 * NEGRID_PLANT=arm runs bridge 4's fine LOR job without its arm (armTook must refuse); NEGRID_PLANT=pair takes D one tier
 * step off on that job (pairTook must refuse); NEGRID_PLANT=force forces another opening as CAND's own there
 * (forceIdentity must refuse).
 *   node research/solver/audit-negrid.mjs [coarse=30] [fine=60] [paths a world=4000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { LOR_CLAMPS } from '../../src/solver/grid.js';
import { solveCandidate, CANDIDATE_OPTS } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { SEED as SEED_7U } from './panel-7u.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

// the fine grid's jobs first, the longest (the batch runs four at once)
export const JOBS = [['S380', 'BASE', 'fine'], ['S380', 'LOR', 'fine'], ['bridge 4', 'BASE', 'fine'], ['bridge 4', 'LOR', 'fine'], ['S224', 'BASE', 'fine'], ['S224', 'LOR', 'fine'],
  ['S380', 'BASE', 'coarse'], ['S380', 'LOR', 'coarse'], ['bridge 4', 'BASE', 'coarse'], ['bridge 4', 'LOR', 'coarse'], ['S224', 'BASE', 'coarse'], ['S224', 'LOR', 'coarse']];
export const ARMS = Object.freeze({ BASE: {}, LOR: { readerBlend: 'logodds' } });
// the forced pair per household: P (tiers 0,0) and D (tiers 2,2) at one level and tier base - S380's and bridge 4's from
// NE-ROOT's openings (results/diagneroot: SS ai 12 / SC ai 14 on S380's tier base, SS ai 57 / SC ai 59 on bridge 4's),
// S224's around its own opening there (ai 1, level 1, tiers 1,1: tier base 0)
export const PAIRS = Object.freeze({ S380: [12, 14], 'bridge 4': [57, 59], S224: [0, 2] });
if (process.argv[2] === '--units') { console.log(JOBS.length); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const COARSE = Number(process.argv[2] || 30), FINE = Number(process.argv[3] || 60), NPW = Number(process.argv[4] || 4000);
if (!(COARSE >= 4) || !(FINE > COARSE) || !(NPW >= 1)) { console.error(`audit-negrid: bad grid sizes or path count (${process.argv.slice(2, 5).join(', ')})`); process.exit(2); }
const part = process.argv[5] === 'part' ? process.argv[6] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-negrid: bad part ${part}`); process.exit(2); }
const SEED = process.argv[7] ? Number(process.argv[7]) : 7002;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-negrid: seed ${process.argv[7]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const PLANT = process.env.NEGRID_PLANT || '';
if (PLANT && !['arm', 'pair', 'force'].includes(PLANT)) { console.error(`audit-negrid: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979, W = 0.02, FI = Math.min(NPW, 1000);
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-negrid: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAGNEGRID_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagnegrid');
mkdirSync(OUT, { recursive: true });

// the households: audit-neblend.mjs's builders (copied): bridge 4 from S126, S380 and S224 the library's
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
export const fileOfJob = (id, arm, pts) => `${id.replace(/ /g, '_')}-${arm}-p${pts}.json.gz`;
const H0 = () => ({ pen: 0, isa: 0, gia: 0 });

console.log(`NE-GRID B1: the candidate's own unit under each arm at ${COARSE} and ${FINE} points, ${NPW} paths a world on the fine grid (seed ${SEED}); ${JOBS.length} jobs; part ${part}`);
JOBS.forEach(([id, arm, gridName], ji) => {
  if (ji % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`audit-negrid: no case ${id}`); process.exit(2); }
  const PTS = gridName === 'fine' ? FINE : COARSE, L = `${arm}/P${PTS}`, planted = id === 'bridge 4' && arm === 'LOR' && gridName === 'fine';
  const simulate = gridName === 'fine' && !(id === 'S224' && arm === 'LOR');
  console.log(`${id.padEnd(16)} case | job ${L} | grid ${gridName} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  LOR_CLAMPS.n = 0; LOR_CLAMPS.lo = 0; LOR_CLAMPS.hi = 0;
  const cand = solveCandidate(E, M, plan, { lambda: LAMBDA, points: PTS, bequestWeight: W, ...(PLANT === 'arm' && planted ? {} : ARMS[arm]) });
  const cl = { ...LOR_CLAMPS }, mt = cand.meta;
  const common = !!mt.tierState && !!mt.jointWorlds && !!mt.e3pcls && cand.switchMargin === 0 && cand.switchCharge === 0.001 && Math.abs(mt.bequestWeight - W) < 1e-12 && mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && !mt.readerChance && !mt.readerSplit;
  const took = arm === 'BASE' ? !mt.readerBlend : mt.readerBlend === 'logodds';
  const s0v = M.initialState(cand.m);
  const table = 100 * cand.worlds.reduce((t, wd, k) => t + cand.mix.weights[k] * wd.value(s0v, 0).survival, 0);
  console.log(`${''.padEnd(16)} solve CAND ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran CAND ${L}: bridgeRead ${mt.bridgeRead} bridgeStep ${mt.bridgeStep} readerSplit ${mt.readerSplit} readerBlend ${mt.readerBlend} readerChance ${mt.readerChance} tierState ${mt.tierState} jointWorlds ${!!mt.jointWorlds} e3pcls ${!!mt.e3pcls} switchMargin ${cand.switchMargin} switchCharge ${cand.switchCharge} bequestWeight ${mt.bequestWeight} mix ${cand.mix.nodes.length} pts ${PTS}`);
  console.log(`${''.padEnd(16)} clamps ${L}: n ${cl.n} lo ${cl.lo} hi ${cl.hi}`);
  console.log(`${''.padEnd(16)} checks ${L}: armTook ${took && common ? 1 : 0}/1`);
  if (!(took && common)) { console.error(`audit-negrid: ${id} ${L}: the arm's settings did not take`); process.exit(3); }
  const m = cand.m, T = m.ctx.totalYears, acts = cand.actions, n = cand.actions.length;
  const ahash = createHash('sha256').update(JSON.stringify(acts.map((a, ai) => [a.tierPen || 0, a.tierIsa || 0, a.tierBase, cand.levelOf[ai], a.label || '']))).digest('hex').slice(0, 16);
  console.log(`${''.padEnd(16)} actions ${L}: n ${n} hash ${ahash}`);
  const [P, D0] = PAIRS[id], D = PLANT === 'pair' && planted ? D0 - 1 : D0;
  const pairOk = P < n && D < n && (acts[P].tierPen || 0) === 0 && (acts[P].tierIsa || 0) === 0 && acts[D].tierPen === 2 && acts[D].tierIsa === 2 && acts[P].tierBase === acts[D].tierBase && cand.levelOf[P] === cand.levelOf[D];
  console.log(`${''.padEnd(16)} pair ${L}: P ai ${P} level ${cand.levelOf[P]} tiers ${acts[P].tierPen || 0},${acts[P].tierIsa || 0}; D ai ${D} level ${cand.levelOf[D]} tiers ${acts[D].tierPen || 0},${acts[D].tierIsa || 0}`);
  console.log(`${''.padEnd(16)} checks ${L}: pairTook ${pairOk ? 1 : 0}/1`);
  if (!pairOk) { console.error(`audit-negrid: ${id} ${L}: the forced pair is not the registered tiers at one level and tier base`); process.exit(3); }
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
  if (simulate) {
    const f0 = Date.now(), wpaths = E.pathsForSeed(SEED, NPW, T), bits = {};
    const opens = [['P', P], ['D', D], ...(ownC !== P && ownC !== D ? [['OWN', ownC]] : [])];
    for (let k = 0; k < K; k++) {
      const z = cand.mix.nodes[k];
      for (const [nm, ai] of opens) {
        const b = new Uint8Array(NPW);
        wpaths.forEach((zs, i) => { const cz = Float64Array.from(zs); cz[cz.length - 1] = z; b[i] = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: ai } }).survived ? 1 : 0; });
        bits[`${nm}${k}`] = b;
        console.log(`${''.padEnd(16)} sim ${L} ${k} ${nm} ai ${ai}: ${b.reduce((t, x) => t + x, 0)}/${NPW} bits ${sha16(b)}`);
      }
    }
    // forceIdentity on world 0's first FI paths: CAND's own opening forced against its unforced run (the plant forces another)
    const other = (() => { for (let ai = 0; ai < n; ai++) if (ai !== ownC && cand.levelOf[ai] !== cand.levelOf[ownC]) return ai; return ownC; })();
    let same = 0;
    wpaths.slice(0, FI).forEach(zs => { const cz = Float64Array.from(zs); cz[cz.length - 1] = cand.mix.nodes[0]; const a = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: PLANT === 'force' && planted ? other : ownC } }), b = runPolicy(cand, cz); if (a.survived === b.survived && (a.survived ? a.terminal === b.terminal : a.failYear === b.failYear)) same++; });
    console.log(`${''.padEnd(16)} checks ${L}: forceIdentity ${same}/${FI} secs ${Math.round((Date.now() - f0) / 1000)}`);
    if (same !== FI) { console.error(`audit-negrid: ${id} ${L}: forcing CAND's own opening did not reproduce its run`); process.exit(3); }
    writeFileSync(join(OUT, fileOfJob(id, arm, PTS)), gzipSync(JSON.stringify({ id, job: L, stamp: STAMP, NPW, seed: SEED, own: ownC, pair: [P, D], bits: Object.fromEntries(Object.entries(bits).map(([k, b]) => [k, b64(b)])) })));
    console.log(`${''.padEnd(16)} file ${L}: ${fileOfJob(id, arm, PTS)}`);
  }
  console.log(`${''.padEnd(16)} done ${L}`);
});
