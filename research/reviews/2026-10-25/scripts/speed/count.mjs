// The tier state's expectations by kind (the speed checkout with its local counter): node count.mjs <household> <points> [n1]
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, ptsArg, n1] = process.argv.slice(2), PTS = Number(ptsArg || 6);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const t0 = Date.now();
const r = S.solvePlan(E, M, C.candidatePlan(E, plan), { ...C.CANDIDATE_OPTS, lambda: 0.0223606797749979, points: PTS, menuPlus: ['hr'], tiersBelow: 3, ...(n1 === 'n1' ? { tableDealing: false } : {}) });
const c = globalThis.__SPEED_CNT, computed = c.charged + c.uncharged, looked = computed + c.hitsTS;
console.log(`${id} at ${PTS} points, the latest candidate${n1 === 'n1' ? ' with the table without the dealing cost' : ''} (e3pcls as the candidate has it), ${((Date.now() - t0) / 1000).toFixed(0)} s: the tier state's loop looked up ${looked} expectations and skipped ${c.failTS} failing moves; computed ${computed} (${(100 * computed / looked).toFixed(1)}% of lookups): at a switch's charged position ${c.charged} (${(100 * c.charged / computed).toFixed(1)}% of those computed), uncharged ${c.uncharged}; the memo answered ${c.hitsTS}`);
