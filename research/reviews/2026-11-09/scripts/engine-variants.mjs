// EXPLORATORY (external review, 10 Nov): what the engine's tax stacking is worth, to the plan's own rules and to a solved plan.
//   REPO_ROOT=<a copy with prototype/engine-hmrc.diff applied> node engine-variants.mjs <household> [points 45] [paths 1000] [seed 99001]
// The household is solved ONCE, on the engine as it is (every switch off, so the solver's model and the engine agree, as on the
// branch). The same solved policy and the plan's own rules then run on the same paths under each engine:
//   as it is | + a worker's pay in the stack (1.1) | + HMRC's order for interest, dividends and gains (1.2, 1.3) | + the sweep
//   keeping cash ISA money in an ISA (1.4).
// The policy was not re-solved for the corrected engines, so its figures there are a floor on what a re-solved plan would reach.
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const S = await import(R + '/src/solverStrategy.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, pts, nP, seed] = [process.argv[2], Number(process.argv[3] || 45), Number(process.argv[4] || 1000), Number(process.argv[5] || 99001)];
const set = (a, b, c) => { globalThis.__STACK_SALARY = a; globalThis.__HMRC_ORDER = b; globalThis.__ISA_SWEEP = c; };
set(false, false, false);
const plan = E.normalizePlan(buildScenarios().find(s => s.id === id).plan);
const opts = pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts };
const t0 = Date.now();
const solved = solveForApp(E, M, plan, opts);
const own = S.yourContext(E, plan), sol = S.solvedContext(E, solved);
const paths = E.pathsForSeed(seed, nP, own.totalYears);
console.log(`${id} at ${pts} points (solve ${Math.round((Date.now() - t0) / 1000)} s), ${nP} paths of seed ${seed}; EXPLORATORY`);
const VARIANTS = [['the engine as it is', false, false, false], ['+ pay in the stack (1.1)', true, false, false], ['+ HMRC order (1.2, 1.3)', true, true, false], ['+ cash ISA kept in an ISA (1.4)', true, true, true]];
const base = {};
for (const [name, a, b, c] of VARIANTS) {
  set(a, b, c);
  const out = {};
  for (const [arm, ctx] of [['rules', own], ['solved', sol]]) {
    const runs = paths.map(zs => S.runPath(E, ctx, zs));
    const rows = arm === 'rules' ? E.simulateDeterministic(ctx, 'expected') : S.rowsOf(E, solved, 'expected').rows;
    out[arm] = { surv: runs.map(r => r.survived), s: runs.filter(r => r.survived).length, pot: runs.reduce((t, r) => t + r.terminalPot, 0) / nP, del: runs.reduce((t, r) => t + r.delivered, 0) / runs.reduce((t, r) => t + r.target, 0),
      tax: rows.reduce((t, x) => t + x.taxPaid + x.cgtPaid, 0) };
  }
  if (!base.rules) Object.assign(base, out);
  const pc = v => (100 * v / nP).toFixed(1), d = (arm) => { let lost = 0, saved = 0; out[arm].surv.forEach((f, i) => { if (base[arm].surv[i] && !f) lost++; if (!base[arm].surv[i] && f) saved++; }); return `${saved} saved, ${lost} lost against the engine as it is`; };
  console.log(`  ${name}:\n    rules  ${pc(out.rules.s)}% (${d('rules')}); spending delivered ${(100 * out.rules.del).toFixed(2)}%; mean pot left ${Math.round(out.rules.pot)}; tax on the expected path ${Math.round(out.rules.tax)}\n    solved ${pc(out.solved.s)}% (${d('solved')}); spending delivered ${(100 * out.solved.del).toFixed(2)}%; mean pot left ${Math.round(out.solved.pot)}; tax on the expected path ${Math.round(out.solved.tax)}\n    solved less rules: ${((100 * (out.solved.s - out.rules.s)) / nP).toFixed(1)} points`);
}
set(false, false, false);
