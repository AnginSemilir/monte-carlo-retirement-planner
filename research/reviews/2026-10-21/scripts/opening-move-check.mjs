// OPENING-MOVE IMPROVEMENT CHECK (external review, 21 Oct 2026): one step of policy iteration, at the opening state.
// For every move on the menu, simulate "take this move in year 0, then follow the solved policy" on the SAME paths
// (common random numbers) and compare it with the move the policy itself takes. A move that beats the policy's own
// choice by more than noise (after allowing for the number of moves compared) means the policy is improvable there;
// none means the opening decision passes this necessary condition for optimality. The table's own score for each
// move is printed beside it, so the table's ranking can be compared with the simulated one.
//
// This is the cheapest form of the policy-improvement audit (instruction V4 of the review): the same comparison at
// states sampled along simulated paths, not only the opening, is what measures distance to the best policy.
//
// usage (from the repository root): node research/reviews/2026-10-21/scripts/opening-move-check.mjs <household> <points> <paths> [seed] [solverDir]
// The default seed, 99002, is outside the project's registry; never pass a reserved held-out seed.
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const root = process.cwd();
const E = await import(pathToFileURL(resolve(root, 'research/engine.mjs')).href);
const { buildScenarios } = await import(pathToFileURL(resolve(root, 'research/policy-study/scenarios.mjs')).href);
const [id, ptsArg, nArg, seedArg, dirArg] = process.argv.slice(2);
const dir = resolve(root, dirArg || 'src/solver');
const M = await import(pathToFileURL(resolve(dir, 'model.js')).href);
const { solveMixture, runPolicy, chooseAction, scoreMoves, PRODUCT_BASELINE } = await import(pathToFileURL(resolve(dir, 'solve.js')).href);
const { vecOf } = await import(pathToFileURL(resolve(dir, 'grid.js')).href);

const points = Number(ptsArg || 30), N = Number(nArg || 3000), seed = Number(seedArg || 99002);
if ([7003, 7011, 7012, 7013, 7014].includes(seed)) throw new Error(`seed ${seed} is a reserved held-out seed`);
const sc = buildScenarios().find(s => s.id === id);
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
let plan = prep(sc.plan);
const own = Math.max(0, E.num(plan.config && plan.config.solvencyFloor, 0));
const target = E.num(plan.spending && plan.spending.targetSpend, 0);
if (!(own > 0)) plan = { ...plan, config: { ...plan.config, solvencyFloor: Math.round(target) } };

const r = solveMixture(E, M, plan, { ...PRODUCT_BASELINE, points, spendLevels: [1], raiseWeight: 0, lambda: 0 });
const s0 = vecOf(r.m, M.initialState(r.m)), T = r.m.ctx.totalYears, A = r.actions.length;
const held0 = { pen: 0, isa: 0, gia: 0 };
const pick = chooseAction(r, Float64Array.from(s0), 0, held0);
const SC = new Float64Array(A), SV = new Float64Array(A);
r.mix.tables.forEach((tab, k) => {
  const S2 = new Float64Array(A), T2 = new Float64Array(A), B2 = new Float64Array(A), V2 = new Float64Array(A);
  scoreMoves(tab, Float64Array.from(s0), 0, S2, T2, B2, null, null, V2);
  for (let a = 0; a < A; a++) { SC[a] += r.mix.weights[k] * S2[a]; SV[a] += r.mix.weights[k] * V2[a]; }
});
const paths = E.pathsForSeed(seed, N, T);
const out = [];
for (let a = 0; a < A; a++) {
  if (SC[a] === -Infinity) { out.push(null); continue; }
  const o = new Uint8Array(N);
  for (let i = 0; i < N; i++) o[i] = runPolicy(r, paths[i], { start: { s: s0, t: 0, held: held0, firstAi: a } }).survived ? 1 : 0;
  out.push(o);
}
const base = out[pick];
const rows = [];
for (let a = 0; a < A; a++) {
  if (!out[a]) continue;
  let s = 0, g = 0, l = 0;
  for (let i = 0; i < N; i++) { s += out[a][i]; if (out[a][i] > base[i]) g++; else if (out[a][i] < base[i]) l++; }
  rows.push({ a, sim: s / N, d: (g - l) / N, se: Math.sqrt(g + l) / N, table: SV[a], score: SC[a], label: r.actions[a].label });
}
rows.sort((x, y) => y.sim - x.sim);
// one-sided 5% after Bonferroni over the moves compared with the policy's own (only improvements matter): z 2.85 for 23
const Phi = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989422804014327 * Math.exp(-z * z / 2), p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))); return z >= 0 ? 1 - p : p; };
const zFor = (alpha) => { let lo = 0, hi = 10; while (hi - lo > 1e-6) { const m = (lo + hi) / 2; if (1 - Phi(m) > alpha) lo = m; else hi = m; } return hi; };
const zCrit = zFor(0.05 / Math.max(1, rows.length - 1));
console.log(`${id}, ${points} points, ${N} paths, seed ${seed}. The policy's opening move: [${pick}] ${r.actions[pick].label}`);
for (const x of rows) {
  const z = x.se > 0 ? x.d / x.se : 0;
  console.log(`[${String(x.a).padStart(3)}] simulated ${(100 * x.sim).toFixed(2)}%  against the policy's move ${x.d >= 0 ? '+' : ''}${(100 * x.d).toFixed(2)} (se ${(100 * x.se).toFixed(2)}, z ${z.toFixed(1)})${z > zCrit ? '  IMPROVES' : ''}   table ${(100 * x.table).toFixed(2)}%  ${x.label}`);
}
const best = rows.find(x => x.a !== pick && x.se > 0 && x.d / x.se > zCrit);
console.log(best ? `IMPROVABLE at the opening: [${best.a}] beats the policy's move by ${(100 * best.d).toFixed(2)} points` : 'PASS: no move beats the policy\'s own opening move beyond noise');
