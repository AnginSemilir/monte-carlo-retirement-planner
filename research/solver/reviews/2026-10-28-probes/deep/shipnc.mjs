// The product's path with the consent to change risk withdrawn: does it run, and how long does a solve take (for the test's cost)?
import * as E from '../../../../../research/engine.mjs';
import * as M from '../../../../../src/solver/model.js';
import { solvePlan, runPolicy } from '../../../../../src/solver/solve.js';
import { candidatePlan } from '../../../../../research/solver/candidate.mjs';
import { readPanel, appPlan } from '../../../../../research/solver/phase4-panel.mjs';
import { armA } from '../../../../../research/solver/select-phase4.mjs';
import { solverPlanOf, LAMBDA } from '../../../../../research/solver/audit-phase4.mjs';
const h = readPanel().find(x => x.id === (process.argv[2] || 'S090'));
const a = armA(appPlan(h.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const plan = prep(solverPlanOf(h.plan, aPol));
const paths = E.pathsForSeed(7002, 1000, plan.demographics ? E.buildContext(E.resolveMpaa(h.plan)).totalYears : 40);
for (const [label, extra] of [['SHIP', {}], ['SHIP, consent withdrawn', { riskConsent: false }]]) {
  const t0 = Date.now(); const r = solvePlan(E, M, candidatePlan(E, plan), { lambda: LAMBDA, points: 30, bequestWeight: 0.02, ...extra }); const s = (Date.now() - t0) / 1000;
  const t1 = Date.now(); let ok = 0, lvl = 0; for (const zs of paths) { const o = runPolicy(r, Float64Array.from(zs)); if (o.survived) ok++; lvl += o.levelSum / Math.max(1, o.spendYears); }
  console.log(`${h.id} ${label}: solved in ${s.toFixed(0)} s (${r.actions.length} moves; riskAbove ${r.meta.riskAbove ? r.meta.riskAbove.decision : '-'}); runPolicy on 1,000 paths of 7002 in ${((Date.now() - t1) / 1000).toFixed(0)} s: survival ${(ok / 10).toFixed(1)}%, the mean level ${(100 * lvl / paths.length).toFixed(1)}% (EXPLORATORY, a cost check, not a result)`);
}
