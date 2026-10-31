/*
 * WHAT THE TIER-ABOVE MISMATCH COST (the external review of 21 Oct, F2a; Part B Step 1, item 5). Thin households held
 * below the top tier, from outside the library (S070, S224 and S380 with the pension and the ISA at Medium Risk), solved
 * by the product's entry point (solvePlan, default levers: the 'auto' rule decides whether to offer the tier above), then
 * the same table executed by the engine twice on the same paths of the tuning seed 7002: as the engine did before the fix
 * (its tier list cut back to the plan's tier and two below, the table's tier names ignored, so index 3 grows at the
 * lowest tier) and as it does now. Paired: survival each way, and the paths saved and lost by the fix. Exploratory (the
 * maintainer's go-ahead of 21 Oct): no held-out seed, nothing registered.
 * lambda 0.3, the review's policy-probe.mjs default for solvePlan.
 *   node research/solver/tier-above-cost.mjs [paths=4000] [points=30] > research/solver/results-tier-above-cost.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { tablePolicy } from '../../src/solver/bridge.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const N = Number(process.argv[2] || 4000), POINTS = Number(process.argv[3] || 30), SEED = 7002, LAMBDA = 0.3;
const scen = buildScenarios();
const medOf = id => {
  const p = scen.find(s => s.id === id).plan;
  return E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 }, accounts: p.accounts.map(x => (/^Pensions|^S&S ISA/.test(x.category) ? { ...x, risk: 'Medium Risk' } : x)) }));
};
console.log(`THE TIER-ABOVE MISMATCH, ENGINE BEFORE AND AFTER THE FIX: pension and ISA held at Medium Risk; solvePlan defaults at ${POINTS} points, lambda ${LAMBDA}; ${N} paths of seed ${SEED}, paired`);
for (const id of ['S070', 'S224', 'S380']) {
  const plan = medOf(id), t0 = Date.now();
  const r = solvePlan(E, M, plan, { points: POINTS, lambda: LAMBDA });
  const secs = (Date.now() - t0) / 1000, ra = r.meta.riskAbove, tiers = r.c.tiers.pen.map(x => x.name);
  const base = tablePolicy(r);
  const ctxOf = (old) => {
    const pol = old ? { ...base, choose: (...a) => ({ ...base.choose(...a), tierPenName: undefined, tierIsaName: undefined }) } : base;
    const c = E.buildContext({ ...plan, spending: { ...plan.spending, policyOverride: pol } });
    if (old) for (const k of Object.keys(c.tierProfiles)) c.tierProfiles[k] = c.tierProfiles[k].slice(0, 3);
    return c;
  };
  const cNew = ctxOf(false), cOld = ctxOf(true), T = cNew.totalYears, paths = E.pathsForSeed(SEED, N, T);
  let sNew = 0, sOld = 0, saved = 0, lost = 0, aboveYears = 0, years = 0;
  for (const zs of paths) {
    const a = E.runTrial(cNew, Float64Array.from(zs)).survived ? 1 : 0, b = E.runTrial(cOld, Float64Array.from(zs)).survived ? 1 : 0;
    sNew += a; sOld += b; if (a && !b) saved++; if (b && !a) lost++;
  }
  // how often the fixed run holds the tier above, along the first 500 paths
  for (const zs of paths.slice(0, 500)) {
    const st = E.freshState(cNew), zPath = zs.length > T + 1 ? zs[T + 1] : 0;
    for (let t = 0; t <= T; t++) { const row = E.stepYear(cNew, st, t, { z: zs[t], zPath }); years++; if (row.tierPenName && tiers.indexOf(row.tierPenName) >= 3) aboveYears++; }
  }
  const d = 100 * (sNew - sOld) / N, se = 100 * Math.sqrt(saved + lost) / N;
  console.log(`${id}: auto rule ${ra ? `"${ra.decision}"` : 'none'}; pension tiers ${tiers.join(', ')}; solve ${secs.toFixed(0)} s`);
  console.log(`   survival before the fix ${(100 * sOld / N).toFixed(2)}%, after ${(100 * sNew / N).toFixed(2)}%: ${d >= 0 ? '+' : ''}${d.toFixed(2)} points (se ${se.toFixed(2)}; ${saved} saved, ${lost} lost); the tier above held in ${aboveYears} of ${years} path-years (first 500 paths, after)`);
}
