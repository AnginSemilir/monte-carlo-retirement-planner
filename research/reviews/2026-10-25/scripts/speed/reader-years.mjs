// Which years the bridge reader reads in (g.reader.years), and how many tables it built, under the latest candidate with
// the table without the dealing cost: why E11's plant can or cannot bite on a household.
//   node reader-years.mjs <household> [points=4]
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const C = await imp('research/solver/candidate.mjs');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, ptsArg] = process.argv.slice(2), PTS = Number(ptsArg || 4);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const r = S.solvePlan(E, M, C.candidatePlan(E, plan), { ...C.CANDIDATE_OPTS, lambda: 0.0223606797749979, points: PTS, menuPlus: ['hr'], tiersBelow: 3, tableDealing: false });
const R = r.g.reader;
console.log(`${id}: ${R ? `the reader reads in years ${Array.from(R.years, (y, i) => (y ? i : null)).filter(x => x !== null).join(', ') || 'none'}; tables built ${R.built}` : 'no reader'}`);
