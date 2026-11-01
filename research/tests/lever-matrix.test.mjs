/*
 * THE LEVER MATRIX, ITS QUICK FORM (the launch plan's step L3; the fast tier, run-all.mjs FAST_JOINING). The design is every
 * pair of settings across the levers and locks on two households (research/tests/lever-matrix.mjs; the whole of it runs in
 * lever-matrix-full.test.mjs, the full tier). Here:
 *   1. the design covers every pair (14 combinations);
 *   2. four of its combinations, the dial at 1, 3 (B3b), 6 (B3b) and 10 (B3a), each solved and every check held on 100
 *      engine paths (lever-matrix.mjs says which);
 *   3. planted, each must fail: the lock dropped (the position solved as if its base had no tier state, on a combination
 *      whose base has one); the age weights dropped
 *      (B3b where B3a is asked); the base solved with the other estate weight; the floor at 0 (the plan prepared as before L1).
 *   node research/tests/lever-matrix.test.mjs
 */
// e3pcls guard: the solves below go through solveForApp on this code (the app's path); e3pcls's own exactness is solver-e3pcls.test.mjs's
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { solveForApp, appPlan, lockedPlan, aimsOptions, APP_CANDIDATE } from '../../src/solverApp.js';
import { allPairs, coversAllPairs, solveCombo, checkCombo, planOf, label, OPTS } from './lever-matrix.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const rows = allPairs(), gap = coversAllPairs(rows);
ok(rows.length === 14 && !gap, `1. the design: ${rows.length} combinations, every pair of settings covered${gap ? ` (missing ${gap})` : ''}`);

const QUICK = [6, 3, 5, 1], solved = {};
for (const i of QUICK) {
  const c = rows[i], t0 = Date.now();
  let s = null, bad;
  try { s = solveCombo(c); bad = await checkCombo(c, s); } catch (e) { bad = [`threw: ${e.message}`]; }
  solved[i] = s;
  ok(bad.length === 0, `2. ${label(c)}: ${bad.length ? bad.join('; ') : 'every check holds'} (${(Date.now() - t0) / 1000} s)`);
}

// 3. the plants: the lock on combination 5 (S126, the dial at 6, consent given, so a tier state to lock), the rest on 1
// (S002, the dial at 10, B3a) and 6 (S002, the dial at 1)
{ const c = rows[5], s = solved[5];
  const unlocked = solveForApp(E, M, s.plan, { ...OPTS, variant: c.variant, base: { meta: {} } });
  const b1 = await checkCombo(c, { ...s, r: unlocked });
  ok(s.base.meta.tierState && b1.length > 0, `3. planted, the lock dropped (the base's pairs ${s.base.meta.tierState}): ${b1.join('; ') || 'NOT CAUGHT'}`); }
{ const c = rows[1], s = solved[1];
  const noAW = solveForApp(E, M, s.plan, { ...OPTS, variant: 'B3b', base: s.base });
  const b2 = await checkCombo(c, { ...s, r: noAW }, { expectVariant: 'B3a' });
  ok(b2.length > 0, `3. planted, the age weights dropped: ${b2.join('; ') || 'NOT CAUGHT'}`);
  const other = { ...c, estate: c.estate === 'lower' ? 'standard' : 'lower' }, wrongBase = solveCombo({ ...other, dial: 1 }).r;
  const onWrong = solveForApp(E, M, s.plan, { ...OPTS, variant: c.variant, base: wrongBase });
  const b3 = await checkCombo(c, { ...s, base: wrongBase, basePlan: { ...planOf(other), solver: { ...planOf(other).solver, aims: { ...planOf(other).solver.aims, cuts: 1 } } }, r: onWrong });
  ok(b3.length > 0, `3. planted, the base solved with the other estate weight: ${b3.join('; ') || 'NOT CAUGHT'}`); }
{ const c = rows[6], s = solved[6];
  const before = p => { const q = lockedPlan(E, E.normalizePlan(p)).plan; return E.resolveMpaa(E.normalizePlan({ ...q, config: { ...q.config, guardrails: false, lookaheadYears: 0 } })); };
  const prepared = before(s.plan), aims = aimsOptions(prepared);
  const r0 = solvePlan(E, M, appPlan(E, prepared), { ...APP_CANDIDATE, ...aims, ...OPTS.research, lambda: aims.lambda, points: OPTS.points, ...(lockedPlan(E, E.normalizePlan(s.plan)).riskAbove === false ? { riskAbove: false } : {}) });
  const b4 = await checkCombo(c, { ...s, r: r0 });
  ok(b4.length > 0, `3. planted, the floor at 0: ${b4.join('; ') || 'NOT CAUGHT'}`); }

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
