// ROLLOUT AT DISAGREEMENT STATES (external review, 21 Oct 2026; exploratory). Does a state-sampled rollout audit see the
// improvement that a differently built policy shows as a whole? Solves one household twice (log-odds and probability
// interpolation), simulates the log-odds policy, collects visited states where the two policies choose different moves,
// and at a sample of them estimates "the other policy's move, then the log-odds policy" minus "the log-odds move, then
// the log-odds policy" on common continuation paths. Seeds 99004 (visits) and 99005 (continuations).
//
// grid.js reads SOLVER_INTERP once at load, so the two policies need two module instances from two folders: pass the
// repository's solver (or a patched copy) and a second copy of it, e.g. `cp -r src/solver /tmp/solver-linear`.
// Sizing: a whole-policy difference D spread over k disagreement states a path gives about D / k a state; at S070's
// 0.65 points and about 8 such states a path, that is about 0.08 points, so the per-state standard error must be well
// under 0.08 for this check to see it (60 states x 300 continuations gave 0.06).
//
// usage (from the repository root): node research/reviews/2026-10-21/scripts/rollout-demo.mjs <household> <points> <pathsVisited> <statesSampled> <continuations> <logitSolverDir> <linearSolverDir>
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const root = process.cwd();
const E = await import(pathToFileURL(resolve(root, 'research/engine.mjs')).href);
const { buildScenarios } = await import(pathToFileURL(resolve(root, 'research/policy-study/scenarios.mjs')).href);
const [id, ptsArg, nVisArg, nStArg, nContArg, dirA, dirL] = process.argv.slice(2);
if (!dirA || !dirL || resolve(root, dirA) === resolve(root, dirL)) throw new Error('pass two different solver folders');
const points = Number(ptsArg), NV = Number(nVisArg), NS = Number(nStArg), NC = Number(nContArg);
const load = async (d) => ({ M: await import(pathToFileURL(resolve(root, d, 'model.js')).href), S: await import(pathToFileURL(resolve(root, d, 'solve.js')).href) });
process.env.SOLVER_INTERP = 'logit';
const A = await load(dirA);
process.env.SOLVER_INTERP = 'linear';
const L = await load(dirL);
const sc = buildScenarios().find(s => s.id === id);
if (!sc) throw new Error(`no household ${id}`);
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
let plan = prep(sc.plan);
const own = Math.max(0, E.num(plan.config && plan.config.solvencyFloor, 0));
const target = E.num(plan.spending && plan.spending.targetSpend, 0);
if (!(own > 0)) plan = { ...plan, config: { ...plan.config, solvencyFloor: Math.round(target) } };
const opt = (S) => ({ ...S.PRODUCT_BASELINE, points, spendLevels: [1], raiseWeight: 0, lambda: 0 });
const rA = A.S.solveMixture(E, A.M, plan, opt(A.S));
const rL = L.S.solveMixture(E, L.M, plan, opt(L.S));
const T = rA.m.ctx.totalYears;
const vis = E.pathsForSeed(99004, NV, T);
const differ = []; let visits = 0;
for (let i = 0; i < NV; i++) {
  A.S.runPolicy(rA, vis[i], { visit: (t, s, held) => {
    visits++;
    const aA = A.S.chooseAction(rA, Float64Array.from(s), t, { ...held });
    const aL = L.S.chooseAction(rL, Float64Array.from(s), t, { ...held });
    if (aA !== aL) differ.push({ t, s: Float64Array.from(s), held: { ...held }, aA, aL });
  } });
}
console.log(`${id}: ${visits} visited states on ${NV} paths; the two policies disagree at ${differ.length} (${(100 * differ.length / visits).toFixed(1)}%)`);
const pick = []; const step = Math.max(1, Math.floor(differ.length / NS));
for (let k = 0; k < differ.length && pick.length < NS; k += step) pick.push(differ[k]);
const cont = E.pathsForSeed(99005, NC, T);
let sumD = 0, sumD2 = 0, wins = 0, losses = 0, n = 0;
for (const st of pick) {
  let g = 0, l = 0;
  for (let j = 0; j < NC; j++) {
    const a = A.S.runPolicy(rA, cont[j], { start: { s: st.s, t: st.t, held: st.held, firstAi: st.aA } }).survived ? 1 : 0;
    const b = A.S.runPolicy(rA, cont[j], { start: { s: st.s, t: st.t, held: st.held, firstAi: st.aL } }).survived ? 1 : 0;
    if (b > a) g++; else if (b < a) l++;
  }
  const d = (g - l) / NC; sumD += d; sumD2 += d * d; n++;
  if (g - l > 2 * Math.sqrt(g + l)) wins++; else if (l - g > 2 * Math.sqrt(g + l)) losses++;
}
const mean = sumD / n, sd = Math.sqrt(Math.max(0, sumD2 / n - mean * mean)), se = sd / Math.sqrt(n);
console.log(`at ${n} sampled disagreement states, the probability policy's move minus the log-odds policy's move, both then following the log-odds policy, ${NC} common continuations each:`);
console.log(`  mean ${(100 * mean).toFixed(2)} points of survival from that state (se across states ${(100 * se).toFixed(2)}); significantly better at ${wins} states, worse at ${losses}`);
