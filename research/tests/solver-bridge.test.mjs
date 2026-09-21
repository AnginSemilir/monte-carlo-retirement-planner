/*
 * PHASE 3: THE BRIDGE. A solved table drives the real engine.
 *
 * The engine honours `spending.policyOverride = { kind: 'table', choose }`: at the top of each year it
 * asks the table for the move at its exact position and executes it through its own machinery. Two
 * things must be true. A table that always answers with the plan's own settings changes nothing, to
 * the pound. And the solved table, run through the real engine, scores close to what the reduced model
 * predicted for it, the gap between them being the model-to-engine gap the plan asks to see per household.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { solve, runPolicy } from '../../src/solver/solve.js';
import { tablePolicy, withTable, modelStateOf } from '../../src/solver/bridge.js';
import { vecOf } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const rowsEqual = (a, b, keys) => { let worst = 0; for (let i = 0; i < a.length; i++) for (const k of keys) worst = Math.max(worst, Math.abs((a[i][k] || 0) - (b[i][k] || 0))); return worst; };
const KEYS = ['totalCombined', 'pensions', 'isas', 'other', 'cash', 'taxPaid', 'cgtPaid', 'drawdownPensions', 'targetSpend', 'unmetDemand'];

console.log('=========== A. A TABLE THAT ANSWERS WITH THE PLAN\'S OWN SETTINGS CHANGES NOTHING ===========');
{
  let worstDet = 0, worstMc = 0, n = 0;
  for (let h = 0; h < 8; h++) {
    const sc = singles[Math.floor(h * singles.length / 8)];
    const plan = prep(sc.plan);
    const ctx0 = E.buildContext(plan);
    const own = M.actionFromContext(ctx0);
    const echo = { ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose: () => ({ steps: own.steps, costSteps: own.costSteps, harvest: own.harvest, harvestCeil: own.harvestCeil, lump: own.lump, sweepCash: false, spendLevel: 1, tierPen: 0, tierIsa: 0, code: 'own' }), switchCost: 0 } } };
    const ctx1 = E.buildContext(echo);
    ok(`A${h + 1}a ${sc.id}: the context carries the table`, !!ctx1.policyOverride && !ctx0.policyOverride && Object.keys(ctx1.tierProfiles).length === ctx1.accounts.length);
    const d0 = E.simulateDeterministic(ctx0), d1 = E.simulateDeterministic(ctx1);
    worstDet = Math.max(worstDet, rowsEqual(d0, d1, KEYS));
    const zs = E.pathsForSeed(77, 20, ctx0.totalYears);
    for (const z of zs) { const r0 = E.runTrial(ctx0, z), r1 = E.runTrial(ctx1, z); worstMc = Math.max(worstMc, Math.abs(r0.terminalPot - r1.terminalPot), Math.abs(r0.lifetimeTax - r1.lifetimeTax), r0.failed !== r1.failed ? 1e9 : 0); n++; }
    ok(`A${h + 1}b ${sc.id}: the audit row names the move`, d1.every(r => r.action === 'own') && d0.every(r => r.action === null));
  }
  ok('A9  deterministic rows identical to the pound across eight households', worstDet < 0.01, `worst £${worstDet.toFixed(4)}`);
  ok('A10 ...and every Monte Carlo path identical too', worstMc < 0.01, `worst £${worstMc.toFixed(4)} over ${n} paths`);
}

console.log('=========== B. THE ENGINE\'S STATE MAPS TO THE TABLE\'S POSITION ===========');
{
  const sc = singles[5];
  const plan = prep(sc.plan);
  const m = M.prepare(E, plan);
  const ctx = E.buildContext(plan);
  const st = E.freshState(ctx);
  const a = vecOf(m, modelStateOf(st)), b = vecOf(m, M.initialState(m));
  ok('B1  the opening position is the same vector from either side', a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < 1e-9), `${a.length} slots`);
  E.stepYear(ctx, st, 0, 'expected'); E.stepYear(ctx, st, 1, 'expected');
  const ms = M.initialState(m); const act = M.actionFromContext(ctx); M.step(m, ms, act, 0); M.step(m, ms, act, 1);
  const a2 = vecOf(m, modelStateOf(st)), b2 = vecOf(m, ms);
  ok('B2  ...and still is after two engine years against two model years', a2.every((x, i) => Math.abs(x - b2[i]) < 0.01), `worst ${Math.max(...a2.map((x, i) => Math.abs(x - b2[i]))).toFixed(4)}`);
}

console.log('=========== C. THE SOLVED TABLE THROUGH THE REAL ENGINE (gate 3) ===========');
{
  const picks = [singles[3], singles[Math.floor(singles.length * 0.4)], singles[Math.floor(singles.length * 0.75)]];
  let worstGap = 0, edgeSum = 0;
  for (const sc of picks) {
    const plan = prep(sc.plan);
    const m0 = M.prepare(E, plan);
    const r = solve(E, M, plan, { points: 30, lump: m0.ctx.fullLumpSum });
    const withT = withTable(plan, r);
    const trials = 1500, seed = 9101;
    const mcT = E.monteCarlo(withT, { trials, seed }), mcF = E.monteCarlo(plan, { trials, seed });
    // the model's own forecast for the same policy: the fast flow on the same seed's per-year draws
    const zs = E.pathsForSeed(seed, trials, m0.ctx.totalYears);
    const model = 100 * zs.filter(z => runPolicy(r, z).survived).length / zs.length;
    const gap = mcT.successRate - model;
    worstGap = Math.max(worstGap, Math.abs(gap)); edgeSum += mcT.successRate - mcF.successRate;
    console.log(`      ${sc.id} ${sc.name.slice(0, 30).padEnd(31)} engine with table ${mcT.successRate.toFixed(1)}  model's forecast ${model.toFixed(1)}  gap ${gap >= 0 ? '+' : ''}${gap.toFixed(1)}  |  engine with the plan's own rule ${mcF.successRate.toFixed(1)}  edge ${(mcT.successRate - mcF.successRate) >= 0 ? '+' : ''}${(mcT.successRate - mcF.successRate).toFixed(1)}`);
  }
  ok('C1  the engine scores the solved table within 2 points of the model\'s forecast, on every household', worstGap <= 2, `worst gap ${worstGap.toFixed(2)}`);
  ok('C2  ...and the table beats the plan\'s own rule in the real engine on average', edgeSum > 0, `mean edge ${(edgeSum / picks.length).toFixed(2)}`);
  const withT = withTable(prep(picks[0].plan), solve(E, M, prep(picks[0].plan), { points: 16 }));
  const rows = E.simulateDeterministic(withT);
  ok('C3  the audit row carries the move each year', rows.every(r => typeof r.action === 'string' && r.action.length > 0), rows.slice(0, 5).map(r => r.action).join(' | '));
}

console.log('=========== D. THE TIER AND ITS COST, IN THE ENGINE ===========');
{
  const sc = singles[Math.floor(singles.length / 2)];
  const plan = prep(sc.plan);
  const ctx0 = E.buildContext(plan);
  const own = M.actionFromContext(ctx0);
  const forced = (tp) => ({ ...plan, spending: { ...plan.spending, policyOverride: { kind: 'table', choose: () => ({ steps: own.steps, costSteps: own.costSteps, harvest: own.harvest, harvestCeil: own.harvestCeil, lump: own.lump, sweepCash: false, spendLevel: 1, tierPen: tp, tierIsa: 0, code: `t${tp}` }), switchCost: F.SWITCH_COST } } });
  const r0 = E.simulateDeterministic(forced(0)), r2 = E.simulateDeterministic(forced(2));
  const pen = ctx0.owners[0].ids.pen;
  const profs = ctx0.tierProfiles[pen];
  ok('D1  the context lists the plan tier and two below for the pension', profs.length === 3 && profs[0].name === ctx0.acc[pen].risk && profs[2].real < profs[0].real);
  ok('D2  a pension held two tiers down grows at that tier\'s rate, after paying the round trip once', r2[0].switchPaid > 0 && r2[1].switchPaid === 0 && r2[0].tierPen === 2 && r0[0].switchPaid === 0, `paid £${r2[0].switchPaid.toFixed(0)} in year 0, tier ${r2[0].tierPen}`);
  // the growth check: from the same pots at the start of year 1, year 1's pension growth rate matches the tier
  const t1 = 1;
  const g0 = r0[t1].pots[pen] / Math.max(1, r0[t1 - 1].pots[pen] - (r0[t1].drawdownPensions || 0)), g2 = r2[t1].pots[pen] / Math.max(1, r2[t1 - 1].pots[pen] - (r2[t1].drawdownPensions || 0));
  ok('D3  ...visibly: the lower tier compounds more slowly', g2 < g0, `year-1 pension multiple ${g0.toFixed(4)} at the plan tier, ${g2.toFixed(4)} two tiers down`);
  ok('D4  the pot ends smaller two tiers down on the expected path, as a lower expected return must', r2[r2.length - 1].totalCombined < r0[r0.length - 1].totalCombined);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
