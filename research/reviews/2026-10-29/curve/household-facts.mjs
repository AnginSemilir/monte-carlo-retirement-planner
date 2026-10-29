/*
 * THE HOUSEHOLDS' FACTS THE WRITE-UP USES (EXPLORATORY; SPENDING-CURVE.md sections 9 and 10): each household's age, target,
 * first retired year, and its guaranteed income (State Pension and any other income the plan pays whatever the markets) as a
 * share of the target, in the first retired year and at its highest later. The share is the utility arms' own ruin level
 * (solve.js spendUtility: the guaranteed income after tax over the year's target, at least 10%), read from a light solve on
 * the plan each arm runs (arm A's pick, aPol.json beside the units).
 *   node household-facts.mjs <unit dir>        (from the root of the failure-year code, curve2-wt)
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync } from 'fs';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), C = await imp('research/solver/candidate.mjs');
const { readPanel } = await imp('research/solver/phase4-panel.mjs');
const { solverPlanOf, LAMBDA } = await imp('research/solver/audit-phase4.mjs');
const dir = process.argv[2];
if (!dir) { console.error('usage: household-facts.mjs <unit dir>'); process.exit(2); }
const LIGHT = { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true },
  spendUtility: { gamma: 2, kappa: 1, beta: 1, mortality: { mode: 90, disp: 9 }, ruinMin: 0.1 } };
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const P = Object.fromEntries(readPanel().map(h => [h.id, h]));
console.log('Each household: age now, target (a year, today\'s money), the first retired year, and the guaranteed income as a share of the target');
for (const id of ['S090', 'S030', 'S328F', 'S188', 'S304F', 'S368', 'S050', 'S340F']) {
  const A0 = JSON.parse(readFileSync(resolve(dir, `${id}-aPol.json`), 'utf8'));
  const r = C.solveCandidate(E, M, prep(solverPlanOf(P[id].plan, { decumulationPolicy: A0.decumulationPolicy })), LIGHT);
  const ctx = r.m.ctx, sp = r.c.yr.spend, R = r.spendUtility.ruinLevel, F = sp.findIndex(s => s > 0);
  let hi = 0, hiT = F;
  for (let t = F; t < sp.length; t++) if (sp[t] > 0 && R[t] > hi) { hi = R[t]; hiT = t; }
  console.log(`  ${id.padEnd(6)} age ${ctx.ageSelf0}; target £${Math.round(ctx.targetSpend).toLocaleString('en-GB')}; first retired year ${F} (age ${ctx.ageSelf0 + F}); guaranteed income ${(100 * R[F]).toFixed(0)}% of target then, at most ${(100 * hi).toFixed(0)}% (from age ${ctx.ageSelf0 + hiT})`);
}
