/*
 * THE SIZING PROBE (the sizing pass before Phase 4; the maintainer, 6 Oct: 'go ahead with the sizing pass once DT-O97
 * reads'). A timing, not a test: no figure here judges the candidate. No run had timed the research candidate with
 * every setting it now carries (candidate.mjs: the reader, TS+J, Q's step, the charge, e3, pclsInterp, O60's blend
 * medians), so every step before Phase 4 that runs it was sized from runs of parts of it, at different loads
 * (650 to 2,200 s a 30-point solve). This times the whole candidate (solveCandidate) and today's product solve
 * (solvePlan with nothing passed but lambda and the grid) on the same households, at the same load, each a solve and a
 * forward run on Phase 4's path count.
 *
 *   node research/solver/size-probe.mjs <points> <paths> part <k>/<n> [seed]
 *
 * Each unit prints audit-dto97.mjs's line shapes ("solve <unit>: secs N", "sum <unit>: ... secs N"), read by
 * derive-sizing.mjs.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { solveCandidate, CANDIDATE_OPTS } from './candidate.mjs';
// imported here as well as by candidate.mjs: code-id.mjs stamps a script's direct imports only, so this puts the research
// defaults in the run's stamp (fair-gate.test.mjs, 'every module a stamped script imports is stamped too')
import { RESEARCH_OPTS } from './research-opts.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { codeId } from './code-id.mjs';

const STAMP = (() => {
  const own = createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12), cid = codeId();
  return { code: cid ? cid.hash : 'unknown', audit: own, prediction: process.env.PREDICTION_FILE || 'NOT-LAUNCHED' };
})();
console.log(`stamp: code ${STAMP.code} audit ${STAMP.audit} prediction ${STAMP.prediction}`);

if (process.argv[2] === '--units') { console.log(8); process.exit(0); }
const POINTS = Number(process.argv[2] || 30), NP = Number(process.argv[3] || 3000);
if (!(POINTS >= 4) || !(NP >= 1)) { console.error(`size-probe: bad grid size or path count (${process.argv.slice(2, 4).join(', ')})`); process.exit(2); }
const part = process.argv[4] === 'part' ? process.argv[5] : '0/1';
const [pk, pn] = part.split('/').map(Number);
if (!(pn >= 1 && pk >= 0 && pk < pn)) { console.error(`size-probe: bad part ${part}`); process.exit(2); }
const SEED = process.argv[6] ? Number(process.argv[6]) : 7002;
const LAMBDA = 0.0223606797749979;
if (!Object.entries(RESEARCH_OPTS).every(([k, v]) => CANDIDATE_OPTS[k] === v)) { console.error('size-probe: the candidate does not carry RESEARCH_OPTS'); process.exit(2); }

// audit-dto97.mjs's variant(), copied: S126 with its pension share or bridge length changed
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
// four of 7e's panel across its measured solve times: the two harmed cases, the slowest under PCLSI (7av) and an
// ordinary share; the candidates first (the longest), so four at once start together
export const PANEL = ['bridge 4', 'S126', 'S370', 'share 0.50'];
const BUILT = { 'bridge 4': { bridge: 4 }, 'share 0.50': { a0: 0.5 } };
const caseOf = id => (BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
export const UNITS = [...PANEL.map(id => [id, 'CAND']), ...PANEL.map(id => [id, 'PRODUCT'])];
if (UNITS.length !== 8) { console.error(`size-probe: ${UNITS.length} units, batch-size.sh runs 8`); process.exit(2); }
console.log(`SIZE: the research candidate (solveCandidate: ${JSON.stringify(CANDIDATE_OPTS)}, O60's blend medians) and today's product solve (solvePlan, lambda held), ${POINTS} points, ${NP} paths (seed ${SEED}); a timing only`);

UNITS.forEach(([id, arm], i) => {
  if (i % pn !== pk) return;
  const h = caseOf(id);
  if (!h) { console.error(`size-probe: no case ${id}`); process.exit(2); }
  console.log(`${id.padEnd(16)} case | unit ${arm} | lambda ${LAMBDA}`);
  const config = { ...h.plan.config, guardrails: false, lookaheadYears: 0 };
  const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
  const t0 = Date.now();
  const r = arm === 'CAND' ? solveCandidate(E, M, plan, { lambda: LAMBDA, points: POINTS }) : solvePlan(E, M, plan, { lambda: LAMBDA, points: POINTS });
  const secs = Math.round((Date.now() - t0) / 1000);
  // the settings the solve ran, so the timing is of the arm it names
  if (arm === 'CAND' && !(r.meta.bridgeRead === 'reader' && r.meta.tierState && r.meta.jointWorlds && r.meta.e3 && r.g.pclsInterp === true)) { console.error(`size-probe: ${id} CAND ran bridgeRead ${r.meta.bridgeRead} tierState ${r.meta.tierState} jointWorlds ${r.meta.jointWorlds} e3 ${r.meta.e3} pclsInterp ${r.g.pclsInterp}`); process.exit(2); }
  if (arm === 'PRODUCT' && (r.meta.bridgeRead || r.meta.tierState || r.meta.jointWorlds || r.g.pclsInterp)) { console.error(`size-probe: ${id} PRODUCT ran a research setting`); process.exit(2); }
  const T = r.m.ctx.totalYears;
  console.log(`${''.padEnd(16)} solve ${arm}: secs ${secs}`);
  console.log(`${''.padEnd(16)} ran ${arm}: pts ${r.g.np} seed ${SEED} paths ${NP} grid ${String(r.meta.points).replace(/ /g, '')} bridgeRead ${r.meta.bridgeRead} tierState ${!!r.meta.tierState} jointWorlds ${!!r.meta.jointWorlds} e3 ${!!r.meta.e3} pclsInterp ${r.g.pclsInterp} switchCharge ${r.meta.switchCharge} years ${T}`);
  const paths = E.pathsForSeed(SEED, NP, T), t1 = Date.now();
  let ok = 0;
  for (const zs of paths) if (runPolicy(r, zs, { choose: (t, st, held) => chooseAction(r, st, t, held) }).survived) ok++;
  console.log(`${''.padEnd(16)} sum ${arm}: paths ${NP} survived ${ok} secs ${Math.round((Date.now() - t1) / 1000)}`);
  console.log(`${''.padEnd(16)} done ${arm}`);
});
