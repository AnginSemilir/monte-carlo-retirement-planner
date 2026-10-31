// WORLD PROBE (external review, 21 Oct 2026): is the table's optimism within a world or in how the worlds are weighted?
// Simulates the solved policy with each path's persistent shift held at each world's node (the table's own world) and
// compares it with that world's opening table value; then simulates with the shift drawn from its prior, as the paths
// carry it. Same settings as policy-probe.mjs's default (withdrawal moves only), seed 99001.
//
// usage (from the repository root): [SOLVER_INTERP=logit] node research/reviews/2026-10-21/scripts/world-probe.mjs <household> <points> <paths> [solverDir]
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const root = process.cwd();
const E = await import(pathToFileURL(resolve(root, 'research/engine.mjs')).href);
const { buildScenarios } = await import(pathToFileURL(resolve(root, 'research/policy-study/scenarios.mjs')).href);
const [id, ptsArg, nArg, dirArg] = process.argv.slice(2);
const dir = resolve(root, dirArg || 'src/solver');
const M = await import(pathToFileURL(resolve(dir, 'model.js')).href);
const { solveMixture, runPolicy, PRODUCT_BASELINE } = await import(pathToFileURL(resolve(dir, 'solve.js')).href);
const sc = buildScenarios().find(s => s.id === id);
if (!sc) throw new Error(`no household ${id}`);
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
let plan = prep(sc.plan);
const own = Math.max(0, E.num(plan.config && plan.config.solvencyFloor, 0));
const target = E.num(plan.spending && plan.spending.targetSpend, 0);
if (!(own > 0)) plan = { ...plan, config: { ...plan.config, solvencyFloor: Math.round(target) } };
const r = solveMixture(E, M, plan, { ...PRODUCT_BASELINE, points: Number(ptsArg), spendLevels: [1], raiseWeight: 0, lambda: 0 });
const s0 = M.initialState(r.m), T = r.m.ctx.totalYears, N = Number(nArg);
const paths = E.pathsForSeed(99001, N, T);
// index T + 1 of a path holds its persistent shift (the world it is in)
const simAt = (z) => { let a = 0; for (const p of paths) { const q = Float64Array.from(p); if (z !== null) q[T + 1] = z; a += runPolicy(r, q).survived ? 1 : 0; } return a / N; };
let fc = 0, simMix = 0;
r.mix.tables.forEach((tab, k) => {
  const v = tab.value(s0, 0).survival, z = r.mix.nodes[k], s = simAt(z);
  fc += r.mix.weights[k] * v; simMix += r.mix.weights[k] * s;
  console.log(`world ${k} (shift ${z.toFixed(3)}, weight ${r.mix.weights[k].toFixed(3)}): table ${(100 * v).toFixed(2)}%, policy simulated in that world ${(100 * s).toFixed(2)}% (table - sim ${(100 * (v - s)).toFixed(2)})`);
});
console.log(`the simulated worlds at the mixture's weights ${(100 * simMix).toFixed(2)}%; simulated with the shift drawn from its prior ${(100 * simAt(null)).toFixed(2)}%; mixture forecast ${(100 * fc).toFixed(2)}%`);
