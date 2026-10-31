// KEPT (the plan-auditor's read-only check in its review of 7y's registration, 28 Sep; RULES.md section 2 item 2): run once by the reviewer, not re-run; its figures are cited in predictions/diag-7y.md (Power, the time) at grade C.
import * as E from '/home/user/vitejs-vite-kdvuf9qw/research/engine.mjs';
import * as M from '/home/user/vitejs-vite-kdvuf9qw/src/solver/model.js';
import { solveMixture } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/solve.js';
import { buildScenarios } from '/home/user/vitejs-vite-kdvuf9qw/research/policy-study/scenarios.mjs';
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
const pts = Number(process.argv[2] || 12);
for (const id of ['S126', 'S194']) {
  const plan = prep(singles.find(x => x.id === id).plan), m = M.prepare(E, plan);
  const o = { points: pts, lump: m.ctx.fullLumpSum, tiers: true, spendLevels: [1, 1.1, 0.95, 0.9, 0.8], lambda: 0.0223606797749979, finalIntegral: true, finalExact: true, mix: 3 };
  let t0 = Date.now(); solveMixture(E, M, plan, o); const a = Date.now() - t0;
  t0 = Date.now(); solveMixture(E, M, plan, { ...o, tierState: true }); const b = Date.now() - t0;
  console.log(id, pts, 'points: product', a, 'ms; tier state', b, 'ms; ratio', (b / a).toFixed(2));
}
