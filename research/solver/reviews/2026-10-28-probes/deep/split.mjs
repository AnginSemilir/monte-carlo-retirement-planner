// EXPLORATORY lead (tuning seed 7002, 1,000 paths; nothing written to results/): one household's survival under APP (the app's
// rules, the engine), SHIP and SHIP with the consent to change risk withdrawn (the product's path, runPolicy), and the
// candidate (runPolicy), on the same paths. What share of the solver's gain over the app's rules is the tier changes?
import * as E from '../../../../../research/engine.mjs';
import * as M from '../../../../../src/solver/model.js';
import { solvePlan, runPolicy } from '../../../../../src/solver/solve.js';
import { candidatePlan, solveCandidate } from '../../../../../research/solver/candidate.mjs';
import { readPanel, appPlan } from '../../../../../research/solver/phase4-panel.mjs';
import { armA } from '../../../../../research/solver/select-phase4.mjs';
import { solverPlanOf, runPath, LAMBDA } from '../../../../../research/solver/audit-phase4.mjs';
const ID = process.argv[2], N = Number(process.argv[3] || 1000), WITH_CAND = process.argv[4] === 'cand';
const h = readPanel().find(x => x.id === ID);
const a = armA(appPlan(h.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
const appCtx = E.buildContext(E.resolveMpaa(a.planState)), T = appCtx.totalYears;
const paths = E.pathsForSeed(7002, N, T);
const app = paths.map(zs => runPath(appCtx, Float64Array.from(zs), false));
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const plan = prep(solverPlanOf(h.plan, aPol));
const arms = { SHIP: () => solvePlan(E, M, candidatePlan(E, plan), { lambda: LAMBDA, points: 30, bequestWeight: 0.02 }), 'SHIP-NC': () => solvePlan(E, M, candidatePlan(E, plan), { lambda: LAMBDA, points: 30, bequestWeight: 0.02, riskConsent: false }) };
if (WITH_CAND) arms.CAND = () => solveCandidate(E, M, plan, { lambda: LAMBDA, points: 45, bequestWeight: 0.02 });
const sA = app.filter(o => o.survived).length;
const out = [`${ID} (${h.cohort}) on ${N} paths of 7002: APP ${(100 * sA / N).toFixed(1)}%`];
for (const [k, f] of Object.entries(arms)) {
  const r = f(); let s = 0, saved = 0, lost = 0;
  paths.forEach((zs, i) => { const o = runPolicy(r, Float64Array.from(zs)); if (o.survived) s++; if (o.survived && !app[i].survived) saved++; if (!o.survived && app[i].survived) lost++; });
  out.push(`${k} ${(100 * s / N).toFixed(1)}% (less APP ${(100 * (s - sA) / N).toFixed(1)}; ${saved} saved, ${lost} lost)`);
}
console.log(out.join(' | '));
