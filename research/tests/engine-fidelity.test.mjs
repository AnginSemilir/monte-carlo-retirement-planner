/*
 * V2: THE SOLVER'S MODEL AGAINST THE ENGINE, WITH THE SWEEP ON (the external review of 21 Oct, Part B Step 5; F0's case).
 * The same solved policy (the product baseline, withdrawal moves only, 30 points) executed by the engine (bridge.js
 * withTable, then runTrial path by path) and by the solver's own forward model (runPolicy), on 2,000 common paths of
 * seed 99001: households holding large taxable accounts (S330 £427,500, S028 £202,500, S224 £95,000, S070 £48,000, and the
 * review's carry household, £400,000 holding £240,000 of gain) must show no more paths that survive in one and fail in
 * the other than the households with small ones (S008, S194) do, plus one. Planted: a forward run that drops the gains
 * carried into next year's CGT (the fault before the fix: the sweep's gain never taxed) must show more on the carry
 * household (the library's households start with no gain, so on them the plant barely shows).
 *   node research/tests/engine-fidelity.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveMixture, runPolicy, PRODUCT_BASELINE } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const scen = buildScenarios(), N = 2000;
// the review's carry household (research/reviews/2026-10-21/scripts/engine-checks/carry.mjs)
const acc = (id, owner, category, balance, risk, extra = {}) => ({ id, owner, category, balance, contrib: 0, growth: 0, risk, ...extra });
const CARRY = { id: 'CARRY', plan: { demographics: { planningMode: 'single', currentAgeSelf: 66, retireAgeSelf: 66, terminalAge: 95, statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11976 },
  spending: { targetSpend: 30000, spendBands: [] },
  accounts: [acc('pen_self', 'Myself', 'Pensions', 200000, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', 100000, 'Medium/High Risk'),
    acc('other_self', 'Myself', 'Other Investments (e.g. GIA)', 400000, 'Medium Risk', { unrealisedGain: 240000 }), acc('cash_self', 'Myself', 'Cash Savings', 15000, 'Cash Equivalents')],
  config: { valuationDate: '2026-01-01' } } };
function discordant(id, { plantDropCarry = false } = {}) {
  const sc = id === 'CARRY' ? CARRY : scen.find(s => s.id === id);
  let plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
  if (!(E.num(plan.config.solvencyFloor, 0) > 0)) plan = { ...plan, config: { ...plan.config, solvencyFloor: Math.round(E.num(plan.spending.targetSpend, 0)) } };
  const r = solveMixture(E, M, plan, { ...PRODUCT_BASELINE, points: 30, spendLevels: [1], raiseWeight: 0, lambda: 0 });
  const ctx = E.buildContext(withTable(plan, r)), paths = E.pathsForSeed(99001, N, ctx.totalYears);
  const opts = plantDropCarry ? { visit: (t, s) => { if (s.length > 11) s[11] = 0; } } : {};
  let modelOnly = 0, engineOnly = 0;
  for (const zs of paths) {
    const a = runPolicy(r, Float64Array.from(zs), opts).survived, b = E.runTrial(ctx, Float64Array.from(zs)).survived;
    if (a && !b) modelOnly++; if (b && !a) engineOnly++;
  }
  return { id, modelOnly, engineOnly, d: modelOnly + engineOnly };
}
const controls = ['S008', 'S194'].map(id => discordant(id)), bar = Math.max(...controls.map(c => c.d)) + 1;
console.log(`controls (small taxable accounts): ${controls.map(c => `${c.id} ${c.modelOnly} / ${c.engineOnly}`).join(', ')}; the bar ${bar}`);
for (const id of ['S330', 'S028', 'S224', 'S070', 'CARRY']) {
  const x = discordant(id);
  ok(x.d <= bar, `${id}: ${x.modelOnly} paths survive only in the solver's model, ${x.engineOnly} only in the engine, of ${N} (at most ${bar})`);
}
const planted = discordant('CARRY', { plantDropCarry: true });
ok(planted.d > bar, `planted: dropping the carried gains each year, the carry household shows ${planted.modelOnly} / ${planted.engineOnly} (above ${bar})`);

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
assert.equal(failed, 0, `${failed} fidelity checks failed`);
