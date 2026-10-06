/*
 * E2X: E2 SHOWN EXACT ON THE RESEARCH CANDIDATE, AND GATE 5 TIMED (PLAN.md Phase 4 condition 5; the maintainer, 6 Oct:
 * 'Include e2 as counted in gate 5', '4 cores is fine'; E2 counts 'once built and shown exact (every table the same split
 * and unsplit, as E3c showed for e3)'). A MEASUREMENT (predictions/measure-e2x.md). On SIZE's four households, one at a
 * time on a machine running nothing else, each at the candidate's 30 points:
 *   PRODUCT: today's product solve as it ships (solvePlan, lambda held), on one core, timed;
 *   CAND:    the research candidate (solveCandidate), on one core, timed - the reference the split is compared with;
 *   SPLIT:   the candidate split across four cores (e2.mjs solveSplit), timed in wall-clock.
 * Prints every table array compared bit for bit (Object.is), the moves evaluated and cells copied in each, and the three
 * wall-clock times. On S126 a planted split (a part that claims cells and never writes them, at 4 points) must break
 * identity, or the check proves nothing.
 *   node research/solver/audit-e2x.mjs [points=30] part k/n
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { solveCandidate, candidatePlan, CANDIDATE_OPTS } from './candidate.mjs';
// imported here as well as by candidate.mjs, so the research defaults are in the run's stamp by name too
import { RESEARCH_OPTS } from './research-opts.mjs';
import { solveSplit } from './e2.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
import { cpus, loadavg } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);

export const PANEL = ['bridge 4', 'S126', 'S370', 'share 0.50'];   // SIZE's four (size-probe.mjs)
export const PARTS = 4, PLANT_PTS = 4;
if (process.argv[2] === '--units') { console.log(PANEL.length); process.exit(0); }
const POINTS = Number(process.argv[2] || 30);
if (!(POINTS >= 4)) { console.error(`audit-e2x: bad grid size ${process.argv[2]}`); process.exit(2); }
const part = process.argv[3] === 'part' ? process.argv[4] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-e2x: bad part ${part}`); process.exit(2); }
const LAMBDA = 0.0223606797749979;
// e3 off: in the PRODUCT arm only - it is today's product solve as it ships (gate 5's reference), whose e3 is off; CAND and SPLIT carry RESEARCH_OPTS through CANDIDATE_OPTS (checked below)
if (!Object.entries(RESEARCH_OPTS).every(([k, v]) => CANDIDATE_OPTS[k] === v)) { console.error('audit-e2x: the candidate does not carry RESEARCH_OPTS'); process.exit(2); }

// size-probe.mjs's variant(), copied: S126 with its pension share or bridge length changed
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant(name, { a0 = 0.85, bridge = 2 } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0);
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => {
    const b = E.num(a.balance, 0);
    if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) };
    if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) };
    return a;
  });
  const age = E.num(p.demographics.privatePensionAge, 58) - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return { id: name, plan: p };
}
const BUILT = { 'bridge 4': { bridge: 4 }, 'share 0.50': { a0: 0.5 } };
const caseOf = id => (BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
// every table the solve keeps (solver-e3.test.mjs's list)
const arrays = r => { const out = []; const W = r.tablesW; const add = L => { for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); };
  if (W.layW) for (const ls of W.layW) for (const L of ls) add(L); else for (let k = 0; k < W.survW.length; k++) add({ surv: W.survW[k], beq: W.beqW[k], resil: W.resilW[k], pol: W.polW[k], short: W.shortW[k] });
  return out; };
const differ = (A, B) => { if (A.length !== B.length) return -1; let d = 0; for (let i = 0; i < A.length; i++) { const a = A[i], b = B[i]; if (a.length !== b.length) return -1; for (let j = 0; j < a.length; j++) if (!Object.is(a[j], b[j])) d++; } return d; };
const values = A => A.reduce((t, a) => t + a.length, 0);
const secs = (t0) => ((Date.now() - t0) / 1000).toFixed(1);
const load = () => loadavg().map(x => x.toFixed(2)).join(' ');

console.log(`E2X: E2 SHOWN EXACT ON THE CANDIDATE, AND GATE 5 TIMED: ${PANEL.join(', ')} one at a time, ${POINTS} points; PRODUCT (solvePlan, one core), CAND (solveCandidate, one core), SPLIT (the candidate across ${PARTS} cores); host ${cpus().length} cores; part ${pk}/${pn}`);
for (const [i, id] of PANEL.entries()) {
  if (i % pn !== pk) continue;
  const h = caseOf(id);
  if (!h) { console.error(`audit-e2x: no case ${id}`); process.exit(2); }
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  console.log(`${id.padEnd(16)} case | points ${POINTS} | lambda ${LAMBDA} | parts ${PARTS}`);
  const base = { lambda: LAMBDA, points: POINTS };
  let t0 = Date.now(), l0 = load();
  const prod = solvePlan(E, M, plan, base);
  const tP = secs(t0);
  if (prod.meta.bridgeRead || prod.meta.tierState || prod.g.pclsInterp) { console.error(`audit-e2x: ${id} PRODUCT ran a research setting`); process.exit(2); }
  console.log(`${''.padEnd(16)} time PRODUCT: secs ${tP} load ${l0}`);
  t0 = Date.now(); l0 = load();
  const one = solveCandidate(E, M, plan, base);
  const tC = secs(t0);
  console.log(`${''.padEnd(16)} time CAND: secs ${tC} load ${l0}`);
  t0 = Date.now(); l0 = load();
  const split = await solveSplit(E, M, candidatePlan(E, plan), { ...CANDIDATE_OPTS, ...base }, PARTS);
  const tS = secs(t0);
  console.log(`${''.padEnd(16)} time SPLIT: secs ${tS} load ${l0}`);
  const ran = r => `bridgeRead ${r.meta.bridgeRead} tierState ${!!r.meta.tierState} jointWorlds ${!!r.meta.jointWorlds} e3 ${!!r.meta.e3} pclsInterp ${r.g.pclsInterp} switchCharge ${r.meta.switchCharge} parts ${r.meta.e2 ? r.meta.e2.parts : 1}`;
  console.log(`${''.padEnd(16)} ran CAND: ${ran(one)}`);
  console.log(`${''.padEnd(16)} ran SPLIT: ${ran(split)}`);
  const A = arrays(one), B = arrays(split);
  console.log(`${''.padEnd(16)} e2x: arrays ${A.length} values ${values(A)} differ ${differ(A, B)} evaluated ${one.meta.evaluated} ${split.meta.evaluated} e3copied ${one.meta.e3 ? one.meta.e3.copied : 0} ${split.meta.e3 ? split.meta.e3.copied : 0}`);
  if (id === 'S126') {
    const pb = { ...CANDIDATE_OPTS, lambda: LAMBDA, points: PLANT_PTS }, cp = candidatePlan(E, plan);
    const d = differ(arrays(solvePlan(E, M, cp, pb)), arrays(await solveSplit(E, M, cp, pb, PARTS, 'drop')));
    console.log(`${''.padEnd(16)} planted SPLIT: a dropping part at ${PLANT_PTS} points differ ${d}`);
  }
  console.log(`${''.padEnd(16)} done`);
}
