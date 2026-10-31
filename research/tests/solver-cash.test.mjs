/*
 * THE FORWARD RUN'S CASH AGAINST THE ENGINE'S (V2 on the assembled candidate, 21 Oct: on S224, 3 of 2,000 paths survived in
 * runPolicy and failed in the engine). The grid merges cash with the GIA and splits them by the buffer rule (fast.js
 * cashSplit: last year's buffer grown at the cash tier's own rate); the engine grows its cash pot at the path's rate, the
 * long-run shift (sigmaParam x zPath) included, so on a path with a shift the forward run held less cash and more GIA than
 * the engine, sold a different amount and carried a different gain into next year's CGT, and now and then chose another
 * move. A forward run now carries its cash in slot 12 (grid.js vecOf, fast.js flow and grow).
 * Checked: S224 (its cash tier carries sigmaParam 0.0157) under the product baseline with withdrawal moves only at 12 points
 * (the cash path does not depend on the table's resolution), 50 paths of seed 99001: in every year before the two runs'
 * moves first differ, the cash the forward run's flow uses is the engine's cash at the year's start, within a penny.
 * Planted: the slot cleared at each year's start (the flow falls back to the split) must miss by more than a pound, in
 * year 0 (the split assumed the buffer, not the household's opening cash) and after it (the shift).
 *   node research/tests/solver-cash.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveMixture, runPolicy, PRODUCT_BASELINE } from '../../src/solver/solve.js';
import { cashSplit } from '../../src/solver/fast.js';
import { withTable } from '../../src/solver/bridge.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const sc = buildScenarios().find(s => s.id === 'S224');
let plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
if (!(E.num(plan.config.solvencyFloor, 0) > 0)) plan = { ...plan, config: { ...plan.config, solvencyFloor: Math.round(E.num(plan.spending.targetSpend, 0)) } };
const cashAcc = E.buildContext(plan).accounts.find(a => a.cat === 'cash');
ok(cashAcc && cashAcc.sigmaParam > 0, `S224's cash tier carries a long-run shift (sigmaParam ${cashAcc && cashAcc.sigmaParam}), so a path's shift moves its rate`);
const r = solveMixture(E, M, plan, { ...PRODUCT_BASELINE, points: 12, spendLevels: [1], raiseWeight: 0, lambda: 0 });
const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = r.m.ctx.totalYears, paths = E.pathsForSeed(99001, 50, T);
const cashId = r.m.ctx.owners[0].ids.cash;

function compare({ plantClear = false } = {}) {
  let years = 0, worst = 0, worstLater = 0, shifted = 0;
  for (const zs of paths) {
    const zPath = zs.length > T + 1 ? zs[T + 1] : 0;
    if (Math.abs(zPath) > 0.1) shifted++;
    // the engine, year by year: its cash at each year's start and its move
    const st = E.freshState(ctx), eng = [], ch = ctx.policyOverride.choose;
    let moveNow = null; ctx.policyOverride.choose = (state, t, held) => { const o = ch(state, t, held); moveNow = o.index; return o; };
    for (let t = 0; t <= T; t++) { const cash = st.pots[cashId] || 0; E.stepYear(ctx, st, t, { z: zs[t], zPath }); eng.push({ cash, ai: moveNow }); }
    ctx.policyOverride.choose = ch;
    // the forward run: the cash its flow will use at each year's start
    const mod = [];
    runPolicy(r, Float64Array.from(zs), { visit: (t, s, held, ai) => { if (plantClear && s.length > 12) s[12] = -1; mod.push({ cash: s.length > 12 && s[12] >= 0 ? Math.min(s[2], s[12]) : cashSplit(r.c, t, s[2]), ai }); } });
    for (let t = 0; t < Math.min(eng.length, mod.length); t++) {
      if (eng[t].ai !== mod[t].ai) break;   // after the moves part, the states differ by the policy, not the model
      years++; worst = Math.max(worst, Math.abs(eng[t].cash - mod[t].cash)); if (t > 0) worstLater = Math.max(worstLater, Math.abs(eng[t].cash - mod[t].cash));
    }
  }
  return { years, worst, worstLater, shifted };
}
const fixed = compare();
ok(fixed.years > 100 && fixed.shifted > 10, `compared ${fixed.years} path-years before the moves first part, on 50 paths (${fixed.shifted} with a long-run shift beyond 0.1)`);
ok(fixed.worst < 0.01, `the forward run's cash is the engine's at every year's start: the largest gap £${fixed.worst.toFixed(4)}`);
const planted = compare({ plantClear: true });
ok(planted.worst > 1 && planted.worstLater > 1, `planted: the slot cleared each year (the buffer rule's split) misses the engine's cash by up to £${planted.worst.toFixed(2)} (year 0: the opening cash, not the buffer) and £${planted.worstLater.toFixed(2)} after it (the path's shift on the cash rate)`);

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} cash checks failed`);
