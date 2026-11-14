// EXPLORATORY: where a couple's path spends its time (D5.6). A library couple solved at the light settings, then N paths of the
// solved couple through the engine (runPath on solvedContext), timed; run under --cpu-prof to see the functions.
//   node --cpu-prof --cpu-prof-dir=<dir> couple-path-prof.mjs [N] [points]
import * as E from '../../research/engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCouple } from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { householdPlan } from '../../src/solverCouple.js';
import { solvedContext, runPath } from '../../src/solverStrategy.js';
import { buildScenarios } from '../../research/policy-study/scenarios.mjs';

const N = Number(process.argv[2] || 60), PTS = Number(process.argv[3] || 6);
const light = PTS >= 45 ? {} : { points: PTS, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const c0 = buildScenarios().find(s => s.plan.demographics.planningMode === 'couple' && Number(s.plan.demographics.currentAgeSelf) < 58 && Number(s.plan.demographics.currentAgeSelf) >= 50);
const household = householdPlan(E, c0.plan);
let t0 = performance.now();
const cp = solveCouple(E, M, household, { solveOne: (p, o) => solveForApp(E, M, p, { ...light, ageWith: o.partnerAge0 }) });
const solveS = (performance.now() - t0) / 1000;
const sc = solvedContext(E, cp), paths = E.pathsForSeed(4242, N, sc.totalYears);
t0 = performance.now();
let alive = 0;
for (const zs of paths) if (runPath(E, sc, Float64Array.from(zs)).survived) alive++;
const ms = (performance.now() - t0) / N;
console.log(`${c0.id} (${sc.totalYears} years) at ${PTS} points: solved in ${solveS.toFixed(1)} s; ${N} paths at ${ms.toFixed(1)} ms a path (${alive} survive)`);
