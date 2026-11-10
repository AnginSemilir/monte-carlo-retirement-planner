// EXPLORATORY: a couple's path with each person ranked by the single chooser's shared scoring (COUPLE.fast), and with the
// shortlist on top, against the rollout as it is. Identity: every path's survival and pot left, compared bit for bit; exit 1
// if any differs.
//   REPO_ROOT=<a copy with prototype/couple-rank.diff and shortlist.diff applied> [SEED=n] [PLANT=faststale] node couple-fast.mjs <couple> [points 4] [paths 100]
// PLANT=faststale ranks on the scores of the decision before: the identity check must then fail (CHECKLIST 5).
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const SEED = Number(process.env.SEED || 4242);   // 4242 gives the outputs in results/; a new run names its own (EXPERIMENTS-AND-PORTS.md)
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const { prepareForSolve } = await import(R + '/src/solverSettings.js');
const { solveCouple, withCouple, COUPLE } = await import(R + '/src/solver/couple.js');
const { SHORT } = await import(R + '/src/solver/solve.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, pts, nP] = [process.argv[2] || 'S091', Number(process.argv[3] || 4), Number(process.argv[4] || 100)];
const plan = E.normalizePlan(buildScenarios().find(s => s.id === id).plan);
const opts = pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts };
const cp = solveCouple(E, M, prepareForSolve(E, plan), { solveOne: (p, o) => solveForApp(E, M, p, { ...opts, ageWith: o.partnerAge0 }) });
const ctx = E.buildContext(withCouple(cp.plan, cp)), paths = E.pathsForSeed(SEED, nP, ctx.totalYears);
if (process.env.PLANT) COUPLE.plant = process.env.PLANT;
const run = (fast, short) => { COUPLE.fast = fast; SHORT.on = !!short; if (short) { SHORT.levels = true; SHORT.time = false; SHORT.mode = short.startsWith('cells') ? 'cells' : short; SHORT.layers = short === 'cells-held' ? 'held' : 'all'; } const t0 = process.hrtime.bigint(); const out = paths.map(zs => E.runTrial(ctx, zs)); const ms = Number(process.hrtime.bigint() - t0) / 1e6 / nP; COUPLE.fast = false; SHORT.on = false; return { out, ms }; };
run(true, null).out.length; 
const a = run(false, null), b = run(true, null);
const same = a.out.every((x, i) => x.survived === b.out[i].survived && Object.is(x.terminalPot, b.out[i].terminalPot));
console.log(`${id} at ${pts} points, ${nP} paths, ${ctx.totalYears + 1} years: as it is ${a.ms.toFixed(0)} ms a path; ranked by the shared scoring ${b.ms.toFixed(0)} ms (${(a.ms / b.ms).toFixed(1)} times); every path's survival and pot left the same bit for bit: ${same}`);
if (!same) { const nd = a.out.filter((x, i) => x.survived !== b.out[i].survived || !Object.is(x.terminalPot, b.out[i].terminalPot)).length; console.log(`IDENTITY FAILED: ${nd} of ${nP} paths differ${process.env.PLANT ? ' (planted: ' + process.env.PLANT + ')' : ''}`); process.exit(1); }
if (process.env.SHORTLIST !== '0') for (const v of ['structure', 'cells-held']) {
  const c = run(true, v); let saved = 0, lost = 0, pa = 0, pc = 0;
  a.out.forEach((x, i) => { const y = c.out[i]; if (y.survived && !x.survived) saved++; if (x.survived && !y.survived) lost++; pa += x.terminalPot; pc += y.terminalPot; });
  console.log(`   with the shortlist '${v}': ${c.ms.toFixed(0)} ms a path (${(a.ms / c.ms).toFixed(1)} times); ${saved} saved, ${lost} lost; mean pot left ${(100 * (pc / pa - 1)).toFixed(2)}%`);
}
