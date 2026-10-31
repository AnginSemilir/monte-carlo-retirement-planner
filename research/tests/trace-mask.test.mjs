/*
 * THE TRACE MASK (research/solver/trace-mask.mjs; PLAN.md O59). Stated before it ran (29 Sep): on a trace built by
 * record.mjs with three paths - one that survives holding 2/2 from year 2, one that runs out in year 3 after holding 2/2,
 * and one that ends below the minimum pot (a full record, failYear -1) - the mask reads the run-out path's years 3 and
 * after as no record (null), never 0/0 or 0 wealth, and counts 0/0 holders among recorded paths only. Planted: a direct
 * read of the arrays counts the run-out path as a 0/0 holder in year 4, so the two readings differ, or the test proves
 * nothing. And on a real run: S370 at 4 points, 200 paths - the mask's 0/0 count in the last year equals the direct count
 * less the paths that ran out.
 *   node research/tests/trace-mask.test.mjs
 */
import assert from 'node:assert/strict';
import { makeTrace, mark, markFail } from '../solver/record.mjs';
import { recordedYears, hasRecord, tierAt, wealthAt, levelAt, countTier } from '../solver/trace-mask.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const Y = 6, tr = makeTrace(3, Y), s = Float64Array.from([100, 50, 25, 0]);
// path 0: survives, 0/0 in years 0-1, 2/2 from year 2
tr.row = 0; for (let t = 0; t < Y; t++) mark(tr, t, true, 1, s, 0, t < 2 ? 0 : 10);
// path 1: 2/2 from year 1, runs out in year 3 (runPolicy returns before tracing it)
tr.row = 1; for (let t = 0; t < 3; t++) mark(tr, t, true, 0.9, s, 0, t < 1 ? 0 : 10); markFail(tr, 3);
// path 2: a full record at 0/0, ends below the minimum pot (failYear stays -1)
tr.row = 2; for (let t = 0; t < Y; t++) mark(tr, t, true, 1, s, 0, 0);

ok(recordedYears(tr, 0) === Y && recordedYears(tr, 1) === 3 && recordedYears(tr, 2) === Y, 'recorded years: 6, 3 (its run-out year), 6 (below the minimum pot: a full record)');
ok(hasRecord(tr, 1, 2) && !hasRecord(tr, 1, 3) && !hasRecord(tr, 1, 5), 'the run-out path has a record in year 2, none in years 3 and after');
ok(tierAt(tr, 1, 2) === 10 && tierAt(tr, 1, 3) === null && wealthAt(tr, 1, 4) === null && levelAt(tr, 1, 3) === null, 'the run-out path reads 2/2 in year 2 and no record (null) after - never 0/0 or 0 wealth');
ok(tierAt(tr, 2, 5) === 0 && wealthAt(tr, 2, 5) === 175, 'the path below the minimum pot keeps its full record (0/0, wealth 175 at the end)');
const masked = countTier(tr, 4, 0);
let direct = 0; for (let i = 0; i < 3; i++) if (tr.tier[i * Y + 4] === 0) direct++;
ok(masked.holding === 1 && masked.recorded === 2, `year 4: the mask counts 1 of 2 recorded paths at 0/0 (got ${masked.holding} of ${masked.recorded})`);
ok(direct === 2, `planted: a direct read counts ${direct} paths at 0/0 in year 4 - the run-out path among them - so the mask changes the answer`);

// on a real run: the last year's 0/0 count, masked, is the direct count less the paths that ran out
{
  const E = await import('../engine.mjs'), M = await import('../../src/solver/model.js'), { solvePlan, runPolicy } = await import('../../src/solver/solve.js'), { buildScenarios } = await import('../policy-study/scenarios.mjs');
  const sc = buildScenarios().find(x => x.id === 'S370');
  const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } }));
  const r = solvePlan(E, M, plan, { lambda: 0.0223606797749979, points: 4, riskAbove: true, bridgeRead: 'reader' });
  const T = r.m.ctx.totalYears, NP = 200, X = makeTrace(NP, T + 1);
  E.pathsForSeed(7002, NP, T).forEach((zs, i) => { X.row = i; runPolicy(r, zs, { trace: X }); });
  const last = T, ranOut = Array.from(X.failYear).filter(f => f >= 0).length;
  let d = 0, deadAt0 = 0; for (let i = 0; i < NP; i++) { if (X.tier[i * X.Y + last] === 0) d++; if (X.failYear[i] >= 0 && X.tier[i * X.Y + last] === 0) deadAt0++; }
  const m = countTier(X, last, 0);
  ok(ranOut > 0 && deadAt0 === ranOut, `S370, ${NP} paths: every one of the ${ranOut} run-out paths reads 0/0 in the last year by a direct read`);
  ok(m.holding === d - ranOut && m.recorded === NP - ranOut, `the mask's last-year 0/0 count is the direct count less the run-out paths (${m.holding} = ${d} - ${ranOut}, of ${m.recorded} recorded)`);
}
console.log(`\ntrace-mask: ${n} passed`);
