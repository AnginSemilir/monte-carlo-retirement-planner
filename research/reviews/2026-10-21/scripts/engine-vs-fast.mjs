// ENGINE AGAINST THE SOLVER'S MODEL (external review, 21 Oct 2026; exploratory). The same solved policy executed by the
// engine (bridge.js withTable, then the engine's runTrial path by path) and by the solver's own forward model
// (runPolicy), on the same paths of seed 99001, with per-path pairing. Product baseline, withdrawal moves only, as
// policy-probe.mjs. A non-zero difference is the solver's model disagreeing with the engine it stands in for (Part A, F0).
//
// usage (from the repository root): node research/reviews/2026-10-21/scripts/engine-vs-fast.mjs <household> <points> <paths> [solverDir]
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const root = process.cwd();
const E = await import(pathToFileURL(resolve(root, 'research/engine.mjs')).href);
const { buildScenarios } = await import(pathToFileURL(resolve(root, 'research/policy-study/scenarios.mjs')).href);
const [id, ptsArg, nArg, dirArg] = process.argv.slice(2);
const dir = resolve(root, dirArg || 'src/solver');
const M = await import(pathToFileURL(resolve(dir, 'model.js')).href);
const S = await import(pathToFileURL(resolve(dir, 'solve.js')).href);
const B = await import(pathToFileURL(resolve(dir, 'bridge.js')).href);
const sc = buildScenarios().find(s => s.id === id);
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
let plan = prep(sc.plan);
const own = Math.max(0, E.num(plan.config && plan.config.solvencyFloor, 0));
const target = E.num(plan.spending && plan.spending.targetSpend, 0);
if (!(own > 0)) plan = { ...plan, config: { ...plan.config, solvencyFloor: Math.round(target) } };
const r = S.solveMixture(E, M, plan, { ...S.PRODUCT_BASELINE, points: Number(ptsArg), spendLevels: [1], raiseWeight: 0, lambda: 0 });
const N = Number(nArg), T = r.m.ctx.totalYears;
const ctx = E.buildContext(B.withTable(plan, r));
if (ctx.totalYears !== T) throw new Error(`horizons differ: engine ${ctx.totalYears}, solver ${T}`);
const paths = E.pathsForSeed(99001, N, T);
let f = 0, e = 0, fOnly = 0, eOnly = 0, cgtE = 0;
for (let i = 0; i < N; i++) {
  const of = S.runPolicy(r, Float64Array.from(paths[i])).survived ? 1 : 0;
  const tr = E.runTrial(ctx, Float64Array.from(paths[i]));
  const oe = tr.survived ? 1 : 0;
  f += of; e += oe; if (of && !oe) fOnly++; if (oe && !of) eOnly++;
}
const gia = plan.accounts.filter(a => /GIA/.test(a.category)).reduce((s, a) => s + E.num(a.balance, 0), 0);
console.log(JSON.stringify({ id, points: Number(ptsArg), N, gia, fast: +(100 * f / N).toFixed(2), engine: +(100 * e / N).toFixed(2),
  fastMinusEngine: +(100 * (f - e) / N).toFixed(2), se: +(100 * Math.sqrt(fOnly + eOnly) / N).toFixed(2), fastOnly: fOnly, engineOnly: eOnly }));
