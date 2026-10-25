// The prototype's solve, timed alone (no profiler): node time-n1.mjs <household | 'bridge 4' | 'share 0.50'> [points=45]
// The latest candidate (HR, the third step) with tableDealing false, solvePlan as solveCandidate calls it (the speed checkout).
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, ptsArg] = process.argv.slice(2), PTS = Number(ptsArg || 45);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const t0 = Date.now();
const r = S.solvePlan(E, M, C.candidatePlan(E, plan), { ...C.CANDIDATE_OPTS, lambda: 0.0223606797749979, points: PTS, menuPlus: ['hr'], tiersBelow: 3, tableDealing: false });
console.log(JSON.stringify({ who: id, arm: 'HRT3-N1', points: PTS, secs: (Date.now() - t0) / 1000, moves: r.actions.length, tierState: r.meta.tierState }));
