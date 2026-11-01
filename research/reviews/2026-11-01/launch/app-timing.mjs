/*
 * THE APP'S SOLVE, TIMED AS THE APP RUNS IT (the external review of 1 Nov, LAUNCH-PLAN.md section 1; EXPLORATORY, a
 * measurement, deciding nothing). Run from the root of the agent's code with the engine built:
 *   python3 research/build-engine.py && node <this file> S126 300 [floor]
 * With a third argument the plan's spending floor is set at that share of its target first (the research's convention,
 * 0.8: research/solver/phase4-panel.mjs; the library's households carry none, and the app sets none: LAUNCH-PLAN.md F1).
 * For one household of the library: solveForApp at the app's settings (the candidate, 45 points, the default aims), the
 * solved plan through the engine's monteCarlo as the solver's worker runs it ('simulate': buildContext(withTable(...))),
 * then the dial at ten with the age weights on the candidate's tiers (the review's recommended position: lambda x 10,
 * ageWeight { mode 90, disp 9 }, lockTiers the solve above, the layer loop, the candidate's own decision on the tier
 * above, as research/solver/lock-check.mjs calls it) and its simulation. One process, one core; the times are wall-clock.
 * Prints the solves' seconds, each simulation's milliseconds a path, and the tables' bytes (src/solverDigest.js sizeOf).
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
const ROOT = process.cwd();
const imp = p => import(pathToFileURL(resolve(ROOT, p)).href);
const E = await imp('research/engine.mjs');
const M = await imp('src/solver/model.js');
const { withTable } = await imp('src/solver/bridge.js');
const { solveForApp, APP_LAMBDA } = await imp('src/solverApp.js');
const { tablesOf, sizeOf } = await imp('src/solverDigest.js');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');

const [id = 'S126', trialsArg = '300', floorArg] = process.argv.slice(2), TRIALS = Number(trialsArg), SEED = 12345;
const h = buildScenarios().find(s => s.id === id);
if (!h) throw new Error(`no household ${id}`);
const FLOOR = floorArg === undefined ? null : Number(floorArg);
if (FLOOR !== null && !(FLOOR > 0 && FLOOR < 1)) throw new Error(`the floor ${floorArg}: a share of the target between 0 and 1`);
const plan = E.normalizePlan(FLOOR === null ? h.plan : { ...h.plan, spending: { ...h.plan.spending, floorSpend: Math.round(FLOOR * E.num(h.plan.spending.targetSpend, 0)) } });
const tag = FLOOR === null ? `${id} (the plan's own floor: ${E.num(plan.spending.floorSpend, 0) || 'none'})` : `${id} (the floor at ${FLOOR} of the target)`;
if (plan.demographics.planningMode !== 'single') throw new Error(`${id} is not a single household`);
const code = execSync('git rev-parse --short=12 HEAD', { cwd: ROOT }).toString().trim();
const dirty = execSync('git status --porcelain -- src research/solver', { cwd: ROOT }).toString().trim() ? ' (with changes)' : '';
const mb = r => (sizeOf(tablesOf(r)).bytes / 1048576).toFixed(0);
const simulate = r => {
  const ctx = E.buildContext(withTable(r.m.ctx.plan, r));
  const t = Date.now(), st = E.monteCarlo(ctx, { trials: TRIALS, seed: SEED });
  return { msPath: (Date.now() - t) / TRIALS, surv: st.successRate };
};
const fmt = x => `${x.toFixed(1)}%`;   // monteCarlo's successRate is in percent

let t = Date.now();
const base = solveForApp(E, M, plan);
const baseSecs = (Date.now() - t) / 1000, baseSim = simulate(base);
const d = base.meta.riskAbove && base.meta.riskAbove.decision;
if (typeof d !== 'string') throw new Error('the base solve records no decision on the tier above');
console.log(`${tag} the app's solve (the candidate, 45 points, the default aims): ${baseSecs.toFixed(0)} s; the spending levels on its menu ${JSON.stringify(base.meta.spendLevels)}; tables ${mb(base)} MB; the tier above ${d}; the simulation ${baseSim.msPath.toFixed(1)} ms a path over ${TRIALS} paths (survival ${fmt(baseSim.surv)}); code ${code}${dirty}`);

t = Date.now();
const locked = solveForApp(E, M, plan, { lambda: 10 * APP_LAMBDA, research: { ageWeight: { mode: 90, disp: 9 }, tsOnce: false, lockTiers: base, riskAbove: d.startsWith('on') } });
const lockSecs = (Date.now() - t) / 1000;
if (!(locked.meta.lockTiers && locked.meta.ageWeight && locked.meta.tsOnce === false)) throw new Error(`${id}: the locked solve is not as asked`);
const lockSim = simulate(locked);
console.log(`${tag} the dial at ten, age-weighted, on the candidate's tiers: ${lockSecs.toFixed(0)} s (${(lockSecs / baseSecs).toFixed(2)} x the base's); tables ${mb(locked)} MB beside the base's; the simulation ${lockSim.msPath.toFixed(1)} ms a path (${(lockSim.msPath / baseSim.msPath).toFixed(2)} x the base's; survival ${fmt(lockSim.surv)})`);
console.log(`${tag} 5,000 paths in one worker at these rates: the base ${(5000 * baseSim.msPath / 60000).toFixed(1)} min, the locked position ${(5000 * lockSim.msPath / 60000).toFixed(1)} min; the base solve and its 5,000 paths ${((baseSecs + 5 * baseSim.msPath) / 60).toFixed(1)} min`);
