/*
 * One solve, timed, for the speed work (the external review, 25 Oct): gate 5's arms on one core.
 *   node [--cpu-prof --cpu-prof-dir=D] prof-arm.mjs <household | 'bridge 4' | 'share 0.50'> <PRODUCT | CAND | HRT3> [points]
 * PRODUCT: solvePlan as gate 5 times it (points 30 by default). CAND: solveCandidate as candidate.json stands at c28e729.
 * HRT3: the candidate with HR (menuPlus ['hr']) and the third step (tiersBelow 3), as the maintainer is settling it.
 * Run from the root of the agent's code with the engine built. SOLVER_PROFILE=1 adds the solve's own split to meta.
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [who, arm, ptsArg] = process.argv.slice(2);
const LAMBDA = 0.0223606797749979;
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant(name, { a0 = 0.85, bridge = 2 } = {}) {   // audit-e2x.mjs's variant(), copied
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
const h = BUILT[who] ? variant(who, BUILT[who]) : all.find(s => s.id === who);
if (!h) throw new Error(`no case ${who}`);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const pts = Number(ptsArg || (arm === 'PRODUCT' ? 30 : 45));
const t0 = Date.now();
const r = arm === 'PRODUCT' ? S.solvePlan(E, M, plan, { lambda: LAMBDA, points: pts })
  : C.solveCandidate(E, M, plan, { lambda: LAMBDA, points: pts, ...(arm === 'HRT3' ? { menuPlus: ['hr'], tiersBelow: 3 } : {}), ...(process.env.E3PCLS_OFF ? { e3pcls: false } : {}) });
const secs = (Date.now() - t0) / 1000;
const pr = r.meta.profile;
console.log(JSON.stringify({ who, arm, points: pts, secs, moves: r.actions.length, tierState: r.meta.tierState, cells: r.meta.size, evaluated: r.meta.evaluated,
  profile: pr ? { totalMs: Math.round(pr.total), flowMs: Math.round(pr.flowNet), nodesMs: Math.round(pr.nodesNet), otherMs: Math.round(pr.otherNet), flows: pr.flows, skipped: pr.skipped, cells: pr.cells } : null,
  memo: S.EXP_MEMO_STATS ? { hits: S.EXP_MEMO_STATS.hits, misses: S.EXP_MEMO_STATS.misses } : null, tsCount: globalThis.__SPEED_CNT || null }));
