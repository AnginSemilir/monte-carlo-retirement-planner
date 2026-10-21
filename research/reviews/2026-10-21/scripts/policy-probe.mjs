// POLICY PROBE (external review, 21 Oct 2026). Solves one single household, reads the table's own opening forecast
// (the three worlds at the mixture's weights), simulates the solved policy on N paths of a seed outside the registry,
// and writes the per-path outcomes so two runs on the same seed can be compared path by path.
//
// Two configurations:
//   default: PRODUCT_BASELINE through solveMixture with the withdrawal moves only (spendLevels [1], raiseWeight 0,
//            lambda 0, no tier moves), guardrails and lookahead off, a minimum end pot of one year of target spending
//            unless the plan sets one. EXTRA_OPTS='{"pclsInterp":true}' (JSON) adds solver options.
//   PRODUCT=1: the product entry point solvePlan (spend levels, tier moves with consent, the raise cap, the minimum pot,
//            the exact final year) at LAMBDA (default 0.3) with the tier-above rule off; EXTRA_OPTS passes levers such
//            as {"raiseCap":1,"riskConsent":false}.
// SOLVER_INTERP=linear is the solver's own switch (grid.js); SOLVER_INTERP=probit needs probit-option.diff applied.
//
// usage (from the repository root): [PRODUCT=1] [EXTRA_OPTS=...] node research/reviews/2026-10-21/scripts/policy-probe.mjs <household> <points> <paths> <out.json> [solverDir]
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { writeFileSync } from 'fs';
const root = process.cwd();
const E = await import(pathToFileURL(resolve(root, 'research/engine.mjs')).href);
const { buildScenarios } = await import(pathToFileURL(resolve(root, 'research/policy-study/scenarios.mjs')).href);
const [id, ptsArg, nArg, out, dirArg] = process.argv.slice(2);
const dir = resolve(root, dirArg || 'src/solver');
const M = await import(pathToFileURL(resolve(dir, 'model.js')).href);
const S = await import(pathToFileURL(resolve(dir, 'solve.js')).href);

const points = Number(ptsArg), N = Number(nArg), SEED = 99001;
const EXTRA = process.env.EXTRA_OPTS ? JSON.parse(process.env.EXTRA_OPTS) : {};
const PRODUCT = !!process.env.PRODUCT;
const sc = buildScenarios().find(s => s.id === id);
if (!sc) throw new Error(`no household ${id}`);
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
let plan = prep(sc.plan);
const t0 = Date.now();
let r;
if (PRODUCT) {
  r = S.solvePlan(E, M, plan, { lambda: Number(process.env.LAMBDA || 0.3), riskAbove: false, points, ...EXTRA });
} else {
  const own = Math.max(0, E.num(plan.config && plan.config.solvencyFloor, 0));
  const target = E.num(plan.spending && plan.spending.targetSpend, 0);
  if (!(own > 0)) plan = { ...plan, config: { ...plan.config, solvencyFloor: Math.round(target) } };
  r = S.solveMixture(E, M, plan, { ...S.PRODUCT_BASELINE, points, spendLevels: [1], raiseWeight: 0, lambda: 0, ...EXTRA });
}
const solveMs = Date.now() - t0;
const s0 = M.initialState(r.m);
const perWorld = r.mix.tables.map(tab => tab.value(s0, 0).survival);
const forecast = perWorld.reduce((a, v, k) => a + r.mix.weights[k] * v, 0);
let unchosen = 0, cells = 0;
for (const tab of r.mix.tables) for (const a of tab.surv) { cells += a.length; for (const x of a) if (!(x >= 0)) unchosen++; }
const T = r.m.ctx.totalYears;
const paths = E.pathsForSeed(SEED, N, T);
const outcomes = new Uint8Array(N);
let alive = 0;
for (let i = 0; i < N; i++) { outcomes[i] = S.runPolicy(r, paths[i], {}).survived ? 1 : 0; alive += outcomes[i]; }
const p = alive / N, se = Math.sqrt(p * (1 - p) / N);
const res = { id, solver: dirArg || 'src/solver', mode: PRODUCT ? 'solvePlan' : 'withdrawal-only', extra: EXTRA, interp: process.env.SOLVER_INTERP || 'logit',
  points, N, seed: SEED, moves: r.actions.length, unchosen, cells, solveMs, forecast, perWorld, simulated: p, se,
  forecastMinusSimulated: 100 * (forecast - p), outcomes: Array.from(outcomes) };
writeFileSync(out, JSON.stringify(res));
console.log(JSON.stringify({ ...res, outcomes: undefined }));
