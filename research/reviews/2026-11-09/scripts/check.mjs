// EXPLORATORY: the shortlist's check against the table's own value at the position, replayed (see short.mjs). For each decision of the
// whole-menu plan's own paths: the whole menu's best score, the table's value read at the position, and each variant's best.
//   node check.mjs <household> <points> <replay paths> <variants>
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const SEED = Number(process.env.SEED || 4242);   // 4242 gives the outputs in results/; a new run names its own (EXPERIMENTS-AND-PORTS.md)
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const { SHORT } = await import(R + '/src/solver/solve.js');
const S = await import(R + '/src/solverStrategy.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, pts, nReplay] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4])];
const VARIANTS = (process.argv[5] || 'cells-held,cells-all-time,structure').split(',');
const setV = v => { SHORT.levels = true; SHORT.time = v.endsWith('-time'); const b = v.replace('-time', ''); SHORT.mode = b.startsWith('cells') ? 'cells' : b; SHORT.layers = b === 'cells-held' ? 'held' : 'all'; };
const plan = E.normalizePlan(buildScenarios().find(s => s.id === id).plan);
const solved = solveForApp(E, M, plan, pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts });
const sc = S.solvedContext(E, solved), base = sc.policyOverride, T = sc.totalYears, paths = E.pathsForSeed(SEED, nReplay, T);
const gaps = [], rec = Object.fromEntries(VARIANTS.map(v => [v, []]));   // per decision: [regret, shortBest - vi]
const ctx = { ...sc, policyOverride: { ...base, choose(st, t, held) {
  SHORT.on = false; SHORT.probe = true; const f = base.choose(st, t, held); SHORT.probe = false;
  if (t >= T) return f;
  const scF = Float64Array.from(solved._sc), vi = SHORT.last.vi;
  gaps.push(scF[f.index] - vi);
  for (const v of VARIANTS) { setV(v); SHORT.delta = null; SHORT.on = true; const s = base.choose(st, t, held); SHORT.on = false; rec[v].push([scF[f.index] - scF[s.index], scF[s.index] - vi]); }
  return f;
} } };
for (const zs of paths) S.runPath(E, ctx, zs);
const q = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];
const g = Float64Array.from(gaps).sort();
console.log(`${id} at ${pts} points, ${gaps.length} decisions: the whole menu's best score less the table's value at the position, in points: 1% ${(100 * q(g, 0.01)).toFixed(3)}, 5% ${(100 * q(g, 0.05)).toFixed(3)}, median ${(100 * q(g, 0.5)).toFixed(3)}, 95% ${(100 * q(g, 0.95)).toFixed(3)}, 99% ${(100 * q(g, 0.99)).toFixed(3)}`);
for (const v of VARIANTS) for (const d of [null, 0.005, 0.002, 0.001, 0.0005]) {
  const r = rec[v]; let scan = 0, reg = 0, m3 = 0, m2 = 0, worst = 0;
  for (const [regret, below] of r) { if (d !== null && !(below >= -d)) { scan++; continue; } reg += regret; if (regret > 1e-3) m3++; if (regret > 1e-2) m2++; if (regret > worst) worst = regret; }
  console.log(`   ${v}, check ${d === null ? 'off' : (100 * d).toFixed(2) + ' points'}: whole menu scored at ${(100 * scan / r.length).toFixed(1)}% of decisions; left: over 0.1 points given up at ${(100 * m3 / r.length).toFixed(2)}%, over 1 at ${(100 * m2 / r.length).toFixed(2)}%, mean ${(100 * reg / r.length).toExponential(1)}, worst ${(100 * worst).toFixed(2)}`);
}
