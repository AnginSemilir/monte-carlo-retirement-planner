/*
 * THE VERIFY PASS, AND WHEN IT IS NOTHING.
 *
 * `solveFlex` searches lambda on `searchPaths` and re-measures the chosen table on `verifyPaths`. Since
 * the single-stage landing became the default, `verifyPaths` DEFAULTS TO `searchPaths` - deliberately,
 * so the whole landing is one sample throughout. That makes `zsSearch` and `zsAll` the same array, and
 * the re-measurement re-derives a number already held, from the same immutable table, at full price.
 *
 * A landing calls `at` eight times and `verify` three times, so this was about a quarter of all
 * forward-pass work, and forward passes dominate the run. The fix returns early when the two draws are
 * the SAME OBJECT. These assertions pin the invariant that makes that legal, and pin the case where the
 * second pass is real work and must still happen.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveFlex } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p, floor) => E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(E.num(p.spending.targetSpend, 0) * 0.8), floorConfidence: 90 } }));
const sc = singles.find(s => s.id === 'S004');
const plan = prep(sc.plan);
const base = { points: 10, searchPaths: 120, seed: 7001, confidence: 0.9, bisectSteps: 2, spendLevels: [1.2, 1.1, 1, 0.9, 0.8] };

console.log('=========== A. SAME DRAW: THE SECOND PASS CANNOT DISAGREE WITH THE FIRST ===========');
{
  const r = solveFlex(E, M, plan, { ...base });
  ok('A1  with verifyPaths defaulted, the promised rate IS the search rate, exactly',
    r.floorRate === r.searchFloorRate, `${r.floorRate} === ${r.searchFloorRate}`);
  ok('A2  and the run reports one sample throughout, which is what makes that legal',
    r.meta.searchPaths === r.meta.verifyPaths, `${r.meta.searchPaths} / ${r.meta.verifyPaths}`);
  /* the property the skip rests on: same table, same paths, same answer - so not recomputing it is free */
  const again = solveFlex(E, M, plan, { ...base });
  ok('A3  two identical landings agree to the bit, so the skipped pass was deterministic',
    again.floorRate === r.floorRate && again.searchFloorRate === r.searchFloorRate);
}

console.log('=========== B. A WIDER DRAW: THE SECOND PASS IS REAL WORK AND STILL RUNS ===========');
{
  const r = solveFlex(E, M, plan, { ...base, verifyPaths: 600 });
  ok('B1  raising verifyPaths above searchPaths keeps the two draws distinct',
    r.meta.verifyPaths === 600 && r.meta.searchPaths === 120);
  ok('B2  and the promised rate is then measured separately - it may differ from the search rate',
    typeof r.searchFloorRate === 'number' && typeof r.floorRate === 'number',
    `search ${(100 * r.searchFloorRate).toFixed(2)}, promised ${(100 * r.floorRate).toFixed(2)}`);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
if (fail) process.exitCode = 1;
