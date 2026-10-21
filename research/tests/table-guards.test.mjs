/*
 * A SOLVED TABLE RUNS WITH GUARDRAILS AND THE COST LOOKAHEAD OFF (the external review of 21 Oct, F0a; Part B Step 1,
 * item 8). Under a table the engine executes the table's move, spend level included; with guardrails on it overwrote that
 * level, and the cost lookahead set money aside the table never planned for. On S070 with guardrails on, the lookahead at
 * five years and a £600,000 cost in its fourth year (more than its liquid wrappers hold, so the lookahead acts):
 *   1. withTable switches both off: the context it builds has no guardrails and no lookahead;
 *   2. along a path of five bad years (z = -2.5) under the table, no year's spending is cut or raised by a guardrail
 *      (multiplier 1, no guardrail action) and nothing is set aside for the cost;
 *   3. the engine refuses a table attached by hand with guardrails on, and one with the lookahead on.
 * Shown failing on the engine and bridge before the fix (results-table-guards.txt).
 *   node research/tests/table-guards.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve } from '../../src/solver/solve.js';
import { withTable, tablePolicy } from '../../src/solver/bridge.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };

const sc = buildScenarios().find(s => s.id === 'S070');
const p0 = JSON.parse(JSON.stringify(sc.plan));
const y0 = E.buildContext(E.normalizePlan(p0)).baseYear;
const withCost = { ...p0, oneOffCosts: [...(p0.oneOffCosts || []), { id: 'tg-cost', date: `${y0 + 3}-06-01`, year: y0 + 3, owner: 'Myself', amount: 600000, desc: 'One-off cost (test)' }] };
const guarded = E.resolveMpaa(E.normalizePlan({ ...withCost, config: { ...withCost.config, guardrails: true, lookaheadYears: 5 } }));
const plain = E.resolveMpaa(E.normalizePlan({ ...withCost, config: { ...withCost.config, guardrails: false, lookaheadYears: 0 } }));
const r = solve(E, M, plain, { points: 6, lambda: 0.5, spendLevels: [1.1, 1, 0.9] });

// 1. what withTable builds
let ctx = null, err = '';
try { ctx = E.buildContext(withTable(guarded, r)); } catch (e) { err = e.message; }
ok(ctx && !ctx.guardrails && ctx.lookaheadYears === 0, `withTable on a plan with guardrails on and a five-year lookahead: guardrails ${ctx ? !!ctx.guardrails : `(threw: ${err})`}, lookahead ${ctx ? ctx.lookaheadYears : '-'}`);

// 2. five bad years under the table
if (ctx) {
  const st = E.freshState(ctx), zs = Array.from({ length: ctx.totalYears + 1 }, (_, t) => (t < 5 ? -2.5 : 0));
  let rails = 0, mults = 0, reserved = 0, years = 0;
  for (let t = 0; t <= ctx.totalYears; t++) {
    const row = E.stepYear(ctx, st, t, { z: zs[t], zPath: 0 });
    years++;
    if (row.guardrail) rails++;
    if (row.spendMult !== 1) mults++;
    reserved += row.reserved || 0;
  }
  ok(rails === 0 && mults === 0 && reserved === 0, `${years} years, five bad ones first: guardrail actions ${rails}, years off the table's level ${mults}, set aside £${reserved.toFixed(0)}`);
} else ok(false, 'the bad-years run (no context: withTable threw)');

// 3. the engine refuses a table attached by hand with either on
for (const [label, cfg] of [['guardrails on', { guardrails: true, lookaheadYears: 0 }], ['a five-year lookahead', { guardrails: false, lookaheadYears: 5 }]]) {
  let msg = '';
  try { E.buildContext({ ...guarded, config: { ...guarded.config, ...cfg }, spending: { ...guarded.spending, policyOverride: tablePolicy(r) } }); } catch (e) { msg = e.message; }
  ok(/guardrails and the cost lookahead off/.test(msg), `planted: a table attached by hand with ${label} is refused (${msg || 'it was not'})`);
}

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} table-guard checks failed`);
