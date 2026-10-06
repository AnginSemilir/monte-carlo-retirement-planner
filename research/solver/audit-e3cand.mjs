/*
 * E3-CAND: E3'S EXACTNESS UNDER THE FULL RESEARCH CANDIDATE (the deep review after E2X, deep-review-log.md 6 Oct 22:01 UK:
 * candidate.mjs's own note says e3's identity with Q's step (bridgeStep 'exact'), the charge (switchCharge, margin 0) and the
 * interpolated allowance axis (pclsInterp) is NOT CHECKED by a run - E3c ran TS+J with the reader only - and names this run
 * as what would close it; E2X does not, both its arms having e3 on). A MEASUREMENT (predictions/measure-e3cand.md), before
 * 7aj launches. On two households, each solved twice at the candidate's 30 points - the candidate as it stands (e3 on, its
 * RESEARCH_OPTS) and the same with e3 off:
 *   share 0.95 - where Q's step acts (O55: Q against the bundle 180 saved/1 lost there);
 *   S130       - where the interpolated allowance axis acts (ADOPT-PI's largest gain, +2.38).
 * Prints every table array (survival, estate, resilience, policy, shortfall; every world and tier-state layer) compared bit
 * for bit (Object.is), the moves evaluated and the cells e3 copied. On share 0.95 the planted copy from the wrong twin
 * (e3PlantedWrongTwin) at 8 points must break identity, or the check proves nothing.
 *   node research/solver/audit-e3cand.mjs [points=30] part k/n
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCandidate, CANDIDATE_OPTS } from './candidate.mjs';
// imported here as well as by candidate.mjs, so the research defaults are in the run's stamp by name too
import { RESEARCH_OPTS } from './research-opts.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: !process.env.PREDICTION_FILE ? 'NOT-LAUNCHED' : process.env.PREDICTION_FILE, sha: process.env.PREDICTION_SHA || '-' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction} sha ${STAMP.sha}`);

export const PANEL = ['share 0.95', 'S130'];
export const PLANT_PTS = 8;
if (process.argv[2] === '--units') { console.log(PANEL.length); process.exit(0); }
const POINTS = Number(process.argv[2] || 30);
if (!(POINTS >= 4)) { console.error(`audit-e3cand: bad grid size ${process.argv[2]}`); process.exit(2); }
const part = process.argv[3] === 'part' ? process.argv[4] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`audit-e3cand: bad part ${part}`); process.exit(2); }
const LAMBDA = 0.0223606797749979;
// e3 off: in the OFF arm only - the thing compared; ON carries RESEARCH_OPTS through CANDIDATE_OPTS (checked below)
if (!Object.entries(RESEARCH_OPTS).every(([k, v]) => CANDIDATE_OPTS[k] === v) || CANDIDATE_OPTS.e3 !== true) { console.error('audit-e3cand: the candidate does not carry RESEARCH_OPTS with e3 on'); process.exit(2); }

// audit-s126.mjs's variant(), copied (share 0.95 is S126 with 95% of its wealth in the pension)
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
const caseOf = id => (id === 'share 0.95' ? variant(id, { a0: 0.95 }) : all.find(s => s.id === id));
// every table the solve keeps (solver-e3.test.mjs's list)
const arrays = r => { const out = []; const W = r.tablesW; const add = L => { for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); };
  if (W.layW) for (const ls of W.layW) for (const L of ls) add(L); else for (let k = 0; k < W.survW.length; k++) add({ surv: W.survW[k], beq: W.beqW[k], resil: W.resilW[k], pol: W.polW[k], short: W.shortW[k] });
  return out; };
const differ = (A, B) => { if (A.length !== B.length) return -1; let d = 0; for (let i = 0; i < A.length; i++) { const a = A[i], b = B[i]; if (a.length !== b.length) return -1; for (let j = 0; j < a.length; j++) if (!Object.is(a[j], b[j])) d++; } return d; };
const values = A => A.reduce((t, a) => t + a.length, 0);
const ran = r => `bridgeRead ${r.meta.bridgeRead} tierState ${!!r.meta.tierState} jointWorlds ${!!r.meta.jointWorlds} bridgeStep ${r.meta.bridgeStep} switchCharge ${r.switchCharge || 0} switchMargin ${r.switchMargin} pclsInterp ${!!r.g.pclsInterp} e3 ${!!r.meta.e3} points ${String(r.meta.points).replace(/ /g, '')}`;

console.log(`E3-CAND: E3'S EXACTNESS UNDER THE FULL CANDIDATE: ${PANEL.join(', ')}, ${POINTS} points; ON (solveCandidate) and OFF (the same with e3 off); part ${pk}/${pn}`);
for (const [i, id] of PANEL.entries()) {
  if (i % pn !== pk) continue;
  const h = caseOf(id);
  if (!h) { console.error(`audit-e3cand: no case ${id}`); process.exit(2); }
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  console.log(`${id.padEnd(16)} case | points ${POINTS} | lambda ${LAMBDA}`);
  const base = { lambda: LAMBDA, points: POINTS };
  let t0 = Date.now();
  const on = solveCandidate(E, M, plan, base);
  console.log(`${''.padEnd(16)} time ON: secs ${((Date.now() - t0) / 1000).toFixed(1)}`);
  t0 = Date.now();
  const off = solveCandidate(E, M, plan, { ...base, e3: false });
  console.log(`${''.padEnd(16)} time OFF: secs ${((Date.now() - t0) / 1000).toFixed(1)}`);
  console.log(`${''.padEnd(16)} ran ON: ${ran(on)}`);
  console.log(`${''.padEnd(16)} ran OFF: ${ran(off)}`);
  const A = arrays(off), B = arrays(on);
  console.log(`${''.padEnd(16)} e3cand: arrays ${A.length} values ${values(A)} differ ${differ(A, B)} evaluated ${off.meta.evaluated} ${on.meta.evaluated} copied ${on.meta.e3 ? on.meta.e3.copied : 0}`);
  if (id === 'share 0.95') {
    const pb = { lambda: LAMBDA, points: PLANT_PTS };
    const d = differ(arrays(solveCandidate(E, M, plan, { ...pb, e3: false })), arrays(solveCandidate(E, M, plan, { ...pb, e3PlantedWrongTwin: true })));
    console.log(`${''.padEnd(16)} planted ON: the wrong twin at ${PLANT_PTS} points differ ${d}`);
  }
  console.log(`${''.padEnd(16)} done`);
}
