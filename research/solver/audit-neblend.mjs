/*
 * NE-BLEND stage A (PLAN.md NE-BLEND; the deep review after NE-ROOT, deep-review-log.md 11 Oct 10:33 UK, its stage A;
 * predictions/diag-neblend-a.md). The candidate's own unit (CAND solveCandidate, CANDIDATE_OPTS with e3pcls), 30 points,
 * the tuning seed 7002 (7u's held-out seed refused). Four jobs, one process each (JOBS): bridge 4 at 0.02 under RZ
 * (readerSplit 'rz': R set to 0, the clip-and-copy split kept) and LOR (readerBlend 'logodds': each corner read at the
 * position's own chance, p x c_i + R_i, blended in log-odds); S380 at 0.02 under BASE and LOR.
 * At the household's year-0 state: CAND's own opening under the arm, its survival part in every world table (scoreMoves),
 * and the opening forced in year 0 on the seed's first NPW paths with each world's long-run shift put in, the arm's own
 * moves after it, beside that world's table survival.
 * Self-checks, each refusing the run: armTook (the arm in the solve's meta, the candidate's others intact) and
 * forceIdentity (forcing CAND's own opening reproduces its unforced run on world 0's first 1,000 paths).
 * NEBLEND_PLANT=arm runs the LOR job on bridge 4 without its arm (armTook must refuse); NEBLEND_PLANT=force forces another
 * opening as CAND's own on that job (forceIdentity must refuse).
 *   node research/solver/audit-neblend.mjs [points=30] [paths a world=4000] part k/n [seed=7002]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { runPolicy, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { solveCandidate, CANDIDATE_OPTS } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { SEED as SEED_7U } from './panel-7u.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

export const JOBS = [['bridge 4', '0.02', 'RZ'], ['bridge 4', '0.02', 'LOR'], ['S380', '0.02', 'BASE'], ['S380', '0.02', 'LOR']];
export const ARMS = Object.freeze({ BASE: {}, RZ: { readerSplit: 'rz' }, LOR: { readerBlend: 'logodds' } });
if (process.argv[2] === '--units') { console.log(JOBS.length); process.exit(0); }
const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);
const POINTS = Number(process.argv[2] || 30), NPW = Number(process.argv[3] || 4000);
if (!(POINTS >= 4) || !(NPW >= 1)) { console.error(`audit-neblend: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-neblend: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
if (!(SEED >= 1) || SEED === SEED_7U) { console.error(`audit-neblend: seed ${process.argv[6]} refused (7u's held-out seed, or not a seed)`); process.exit(2); }
const PLANT = process.env.NEBLEND_PLANT || '';
if (PLANT && !['arm', 'force'].includes(PLANT)) { console.error(`audit-neblend: unknown plant ${PLANT}`); process.exit(2); }
if (PLANT) console.log(`plant: ${PLANT}`);
const LAMBDA = 0.0223606797749979, FI = Math.min(NPW, 1000);
if (CANDIDATE_OPTS.e3pcls !== true) { console.error('audit-neblend: the candidate does not carry e3pcls'); process.exit(2); }
const OUT = process.env.DIAGNEBLEND_OUT || join(dirname(fileURLToPath(import.meta.url)), 'results', 'diagneblend');
mkdirSync(OUT, { recursive: true });

// the households: audit-7u.mjs's builders (copied, as audit-neroot.mjs): bridge 4 from S126, S380 the library's
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
const fileOfJob = (id, w, arm) => `${id.replace(/ /g, '_')}-w${w}-${arm}.json.gz`;
const H0 = () => ({ pen: 0, isa: 0, gia: 0 });

console.log(`NE-BLEND A: the candidate's own unit under each arm, ${POINTS} points, ${NPW} paths a world (seed ${SEED}); ${JOBS.length} jobs; part ${part}`);
JOBS.forEach(([id, w, arm], ji) => {
  if (ji % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`audit-neblend: no case ${id}`); process.exit(2); }
  const W = Number(w), L = `${arm}/W${w}`, planted = id === 'bridge 4' && arm === 'LOR';
  console.log(`${id.padEnd(16)} case | job ${L} | lambda ${LAMBDA}`);
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const cand = solveCandidate(E, M, plan, { lambda: LAMBDA, points: POINTS, bequestWeight: W, ...(PLANT === 'arm' && planted ? {} : ARMS[arm]) });
  const mt = cand.meta;
  const common = !!mt.tierState && !!mt.jointWorlds && !!mt.e3pcls && cand.switchMargin === 0 && cand.switchCharge === 0.001 && Math.abs(mt.bequestWeight - W) < 1e-12 && mt.bridgeRead === 'reader' && mt.bridgeStep === 'exact' && !mt.readerChance;
  const took = arm === 'BASE' ? !mt.readerSplit && !mt.readerBlend : arm === 'RZ' ? mt.readerSplit === 'rz' && !mt.readerBlend : mt.readerBlend === 'logodds' && !mt.readerSplit;
  const s0v = M.initialState(cand.m);
  const table = 100 * cand.worlds.reduce((t, wd, k) => t + cand.mix.weights[k] * wd.value(s0v, 0).survival, 0);
  console.log(`${''.padEnd(16)} solve CAND ${L}: table ${table.toFixed(4)} secs ${Math.round((Date.now() - t0) / 1000)}`);
  console.log(`${''.padEnd(16)} ran CAND ${L}: bridgeRead ${mt.bridgeRead} bridgeStep ${mt.bridgeStep} readerSplit ${mt.readerSplit} readerBlend ${mt.readerBlend} readerChance ${mt.readerChance} tierState ${mt.tierState} jointWorlds ${!!mt.jointWorlds} e3pcls ${!!mt.e3pcls} switchMargin ${cand.switchMargin} switchCharge ${cand.switchCharge} bequestWeight ${mt.bequestWeight} mix ${mt.mixture} pts ${cand.g.np} minPot ${E.num(plan.spending.minPot, 0)}`);
  console.log(`${''.padEnd(16)} checks ${L}: armTook ${took && common ? 1 : 0}/1`);
  if (!(took && common)) { console.error(`audit-neblend: ${id} ${L}: the arm's settings did not take`); process.exit(3); }
  const m = cand.m, T = m.ctx.totalYears, acts = cand.c.acts, n = cand.actions.length;
  let s0 = null;
  runPolicy(cand, E.pathsForSeed(SEED, 1, T)[0], { choose: (t, st, held) => { if (t === 0 && !s0) s0 = Float64Array.from(st); return chooseAction(cand, st, t, held); } });
  const ownC = chooseAction(cand, s0, 0, H0());
  console.log(`${''.padEnd(16)} openings ${L}: OWN ai ${ownC} level ${cand.levelOf[ownC]} tiers ${acts[ownC].tierPen},${acts[ownC].tierIsa}`);
  const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n), SV = new Float64Array(n);
  const svOf = (tab, ai) => { scoreMoves(tab, s0, 0, SC, TX, BQ, H0(), { ai, act: tab.c.acts[ai], nr: tab.nodeRealOfAt[0][ai] }, SV); return SV[ai]; };
  const TAB = cand.mix.tables.map(tab => svOf(tab, ownC)), K = cand.mix.nodes.length;
  const f0 = Date.now(), wpaths = E.pathsForSeed(SEED, NPW, T), bits = {};
  for (let k = 0; k < K; k++) {
    const z = cand.mix.nodes[k], b = new Uint8Array(NPW);
    wpaths.forEach((zs, i) => { const cz = Float64Array.from(zs); cz[cz.length - 1] = z; b[i] = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: ownC } }).survived ? 1 : 0; });
    bits[`OWN${k}`] = b;
    console.log(`${''.padEnd(16)} world ${L} ${k} z ${z.toFixed(6)} weight ${cand.mix.weights[k].toFixed(6)}: OWN table ${(100 * TAB[k]).toFixed(6)} sim ${b.reduce((t, x) => t + x, 0)}/${NPW} bits ${sha16(b)}`);
  }
  // forceIdentity on world 0's first FI paths: CAND's own opening forced against its unforced run (the plant forces another)
  const other = (() => { for (let ai = 0; ai < n; ai++) if (ai !== ownC && cand.levelOf[ai] !== cand.levelOf[ownC]) return ai; return ownC; })();
  let same = 0;
  wpaths.slice(0, FI).forEach(zs => { const cz = Float64Array.from(zs); cz[cz.length - 1] = cand.mix.nodes[0]; const a = runPolicy(cand, cz, { start: { t: 0, s: s0, held: H0(), firstAi: PLANT === 'force' && planted ? other : ownC } }), b = runPolicy(cand, cz); if (a.survived === b.survived && (a.survived ? a.terminal === b.terminal : a.failYear === b.failYear)) same++; });
  console.log(`${''.padEnd(16)} checks ${L}: forceIdentity ${same}/${FI} secs ${Math.round((Date.now() - f0) / 1000)}`);
  if (same !== FI) { console.error(`audit-neblend: ${id} ${L}: forcing CAND's own opening did not reproduce its run`); process.exit(3); }
  writeFileSync(join(OUT, fileOfJob(id, w, arm)), gzipSync(JSON.stringify({ id, job: L, stamp: STAMP, NPW, seed: SEED, own: ownC, bits: Object.fromEntries(Object.entries(bits).map(([k, b]) => [k, b64(b)])) })));
  console.log(`${''.padEnd(16)} file ${L}: ${fileOfJob(id, w, arm)}`);
  console.log(`${''.padEnd(16)} done ${L}`);
});
