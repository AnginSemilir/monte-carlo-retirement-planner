/*
 * THE SOLVER'S FLOOR (the launch plan of 1 Nov, step L1, B2, D51): src/solverSettings.js prepareForSolve sets the plan's
 * spending floor at APP_FLOOR (80%) of the target where the plan's is 0, so the solve's menu can cut (without it the menu is
 * the target and the 110% raise alone: the launch plan's F1). The fast tier (run-all.mjs FAST_JOINING).
 *   1. the library's 210 single households prepare with the floor at Math.round(0.8 x target) (none sets one), prepared twice
 *      the same, and "your plan" (normalizePlan alone, what the app's rules run) keeps a floor of 0;
 *   2. a plan that sets its own floor keeps it, prepared; so does a plan whose floor equals its target;
 *   3. on S126 at light settings the run record's spendLevels include 0.8 and the raise, and the solve's key moves with the
 *      floor (another floor, another key);
 *   4. planted, the floor left at 0 (the plan prepared as before L1): the menu is [1, 1.1] and the check of 3 fails.
 *   node research/tests/solver-floor.test.mjs
 */
// e3pcls guard: the solve below goes through solvePlan on this code (the app's path); e3pcls's own exactness is solver-e3pcls.test.mjs's
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { solveForApp, prepareForSolve, appPlan, lockedPlan, aimsOptions, APP_CANDIDATE, APP_FLOOR } from '../../src/solverApp.js';
import { solveKey } from '../../src/solverKey.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const all = buildScenarios(), singles = all.filter(s => E.normalizePlan(s.plan).demographics.planningMode !== 'couple');
const OPTS = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };

// 1. the library's singles
{ const own = singles.filter(s => E.num(E.normalizePlan(s.plan).spending.floorSpend, 0) > 0);
  const wrong = singles.filter(s => { const p = prepareForSolve(E, s.plan), t = E.num(p.spending.targetSpend, 0); return p.spending.floorSpend !== Math.round(APP_FLOOR * t) || !(p.spending.floorSpend > 0); });
  const twice = singles.filter(s => { const p = prepareForSolve(E, s.plan); return JSON.stringify(prepareForSolve(E, p)) !== JSON.stringify(p); });
  const yours = singles.filter(s => E.num(E.normalizePlan(s.plan).spending.floorSpend, 0) !== 0);
  ok(APP_FLOOR === 0.8 && singles.length === 210 && own.length === 0, `1. the library's ${singles.length} single households, ${own.length} with a floor of their own; APP_FLOOR ${APP_FLOOR}`);
  ok(wrong.length === 0, `1. each prepares with the floor at 80% of its target, rounded${wrong.length ? `: wrong on ${wrong.slice(0, 3).map(s => s.id)}` : ''}`);
  ok(twice.length === 0, `1. prepared twice is prepared once${twice.length ? `: not on ${twice.slice(0, 3).map(s => s.id)}` : ''}`);
  ok(yours.length === 0, '1. "your plan" (normalizePlan alone, as the app\'s rules run it) keeps a floor of 0 on every one'); }

// 2. a plan's own floor
const plan = all.find(s => s.id === 'S126').plan, target = E.num(E.normalizePlan(plan).spending.targetSpend, 0);
const withFloor = f => ({ ...plan, spending: { ...plan.spending, floorSpend: f } });
{ const p7 = prepareForSolve(E, withFloor(Math.round(0.7 * target))), pT = prepareForSolve(E, withFloor(target));
  ok(p7.spending.floorSpend === Math.round(0.7 * target) && pT.spending.floorSpend === target, `2. a plan's own floor is kept: ${p7.spending.floorSpend} (70% of ${target}) and ${pT.spending.floorSpend} (its target)`); }
// the rounding: no library single has a fractional 80% of target, so a target whose 80% is 16000.8 tells Math.round (16001)
// from Math.floor or a truncation (16000) (the review of 1 Nov, MINOR 2)
{ const odd = prepareForSolve(E, { ...plan, spending: { ...plan.spending, targetSpend: 20001, floorSpend: 0 } });
  ok(odd.spending.floorSpend === 16001, `2. a target of 20001 prepares with the floor at ${odd.spending.floorSpend} (80% is 16000.8, rounded as phase4-panel.mjs rounds it)`);
  // and Math.round from Math.ceil, which also gives 16001 above (the re-review of 1 Nov, MINOR 1)
  const up = prepareForSolve(E, { ...plan, spending: { ...plan.spending, targetSpend: 20004, floorSpend: 0 } });
  ok(up.spending.floorSpend === 16003, `2. a target of 20004 prepares with the floor at ${up.spending.floorSpend} (80% is 16003.2: rounded, not raised to 16004)`); }

// 3. the solve's menu, and the key
const levels = r => (r.meta.spendLevels || []).map(x => Math.round(x * 1e6) / 1e6);
const hasFloor = r => levels(r).includes(0.8) && levels(r).includes(1.1) && levels(r).includes(1);
{ const r = solveForApp(E, M, plan, OPTS);
  ok(hasFloor(r) && Math.min(...levels(r)) === 0.8, `3. S126's run record: spendLevels ${JSON.stringify(levels(r))}, the floor 0.8 among them and nothing below it`);
  const k0 = await solveKey(E, plan, OPTS), k7 = await solveKey(E, withFloor(Math.round(0.7 * target)), OPTS), k8 = await solveKey(E, withFloor(Math.round(0.8 * target)), OPTS);
  ok(k0 !== k7 && k0 === k8, `3. the key: the plan without a floor is keyed as the plan with 80% (${k0.slice(0, 12)}), another floor another key`); }

// 4. planted: the plan prepared as before L1, the floor left at 0
{ const before = p => { const q = lockedPlan(E, E.normalizePlan(p)).plan; return E.resolveMpaa(E.normalizePlan({ ...q, config: { ...q.config, guardrails: false, lookaheadYears: 0 } })); };
  const prepared = before(plan), aims = aimsOptions(prepared);
  const r = solvePlan(E, M, appPlan(E, prepared), { ...APP_CANDIDATE, ...aims, ...OPTS.research, lambda: aims.lambda, points: OPTS.points });
  ok(JSON.stringify(levels(r)) === '[1,1.1]' && !hasFloor(r), `4. planted, the floor left at 0: the menu is ${JSON.stringify(levels(r))} and the check of 3 fails`); }

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
