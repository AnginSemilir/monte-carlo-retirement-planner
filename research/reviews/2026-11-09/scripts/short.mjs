// EXPLORATORY (external review, 9 Nov): the chooser's shortlist against the whole menu, on one household.
//   REPO_ROOT=<a copy with prototype/shortlist.diff applied> [SEED=n] node short.mjs <household> <points> <replay paths> <paths> [variants]
// variants, comma-separated: cells-held | cells-all | structure | order, each optionally with -time (the years either side too)
// and @<delta> (the check against the table's own value, in score units: @0.005 is 0.5 points). Default: cells-held,cells-all,structure,order.
// The shortlist is off unless SHORT.on, so the whole-menu arm is the branch's own chooser.
// 1. replay: along the whole-menu plan's own paths, each decision is made both ways at the same position; a miss is a
//    different move, its cost the whole-menu score given up (score units: 1 is 100 points of survival);
// 2. both plans run on the same paths: time a path, survival (paired), spending delivered, the pot left.
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const SEED = Number(process.env.SEED || 4242);   // 4242 gives the outputs in results/; a new run names its own (EXPERIMENTS-AND-PORTS.md)
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const { SHORT } = await import(R + '/src/solver/solve.js');
const S = await import(R + '/src/solverStrategy.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, pts, nReplay, nPaths] = [process.argv[2], Number(process.argv[3] || 4), Number(process.argv[4] || 50), Number(process.argv[5] || 300)];
const VARIANTS = (process.argv[6] || 'cells-held,cells-all,structure,order').split(',');
const setV = v0 => { const [v, dl] = v0.split('@'); SHORT.delta = dl ? Number(dl) : null; SHORT.levels = true; SHORT.time = v.endsWith('-time'); const b = v.replace('-time', ''); SHORT.mode = b.startsWith('cells') ? 'cells' : b; SHORT.layers = b === 'cells-held' ? 'held' : 'all'; };
const plan = E.normalizePlan(buildScenarios().find(s => s.id === id).plan);
const opts = pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts };
let t0 = Date.now();
const solved = solveForApp(E, M, plan, opts);
const solveS = (Date.now() - t0) / 1000;
const sc = S.solvedContext(E, solved), base = sc.policyOverride, T = sc.totalYears;
const paths = E.pathsForSeed(SEED, Math.max(nReplay, nPaths), T);
// 1. the replay: every variant's choice at each decision of the whole-menu plan's own paths
const mk = () => ({ decisions: 0, miss: 0, m4: 0, m3: 0, m2: 0, regret: 0, worst: 0, listed: 0, parts: { level: 0, draw: 0, isaFirst: 0, harvest: 0, tierPen: 0, tierIsa: 0 } });
const R1 = Object.fromEntries(VARIANTS.map(v => [v, mk()]));
const replayCtx = { ...sc, policyOverride: { ...base, choose(st, t, held) {
  SHORT.on = false; const f = base.choose(st, t, held);
  if (t >= T) return f;
  const scF = Float64Array.from(solved._sc);
  for (const v of VARIANTS) {
    const r = R1[v], before = SHORT.stats.listed;
    setV(v); SHORT.on = true; const s = base.choose(st, t, held); SHORT.on = false;
    r.decisions++; r.listed += SHORT.stats.listed - before;
    if (s.index !== f.index) {
      const reg = scF[f.index] - scF[s.index];
      r.miss++; r.regret += reg; if (reg > r.worst) r.worst = reg;
      if (reg > 1e-4) r.m4++; if (reg > 1e-3) r.m3++; if (reg > 1e-2) r.m2++;
      const a = S.partsOf(solved.actions[f.index], solved.c.acts[f.index]), b = S.partsOf(solved.actions[s.index], solved.c.acts[s.index]);
      for (const k of Object.keys(r.parts)) if (a[k] !== b[k]) r.parts[k]++;
    }
  }
  return f;
} } };
for (let i = 0; i < nReplay; i++) S.runPath(E, replayCtx, paths[i]);
// 2. each plan on the same paths
const run = (v) => { if (v) { setV(v); SHORT.on = true; } else SHORT.on = false; const f0 = SHORT.stats.fallback, t1 = process.hrtime.bigint(); const out = paths.slice(0, nPaths).map(zs => S.runPath(E, sc, zs)); const ms = Number(process.hrtime.bigint() - t1) / 1e6 / nPaths; SHORT.on = false; return { out, ms, fallbacks: SHORT.stats.fallback - f0 }; };
paths.slice(0, 5).forEach(zs => { for (const v of [null, ...VARIANTS]) { if (v) { setV(v); SHORT.on = true; } else SHORT.on = false; S.runPath(E, sc, zs); } SHORT.on = false; });   // warm every code path before timing
const full = run(null);
const pc = v => (100 * v).toFixed(2);
console.log(`${id} at ${pts} points (solve ${solveS.toFixed(0)} s, ${solved.actions.length} moves, ${T + 1} years); whole menu: a path ${full.ms.toFixed(2)} ms, survival ${pc(full.out.filter(x => x.survived).length / nPaths)}% on ${nPaths} paths; replay ${nReplay} paths, ${R1[VARIANTS[0]].decisions} decisions`);
for (const v of VARIANTS) {
  const short = run(v), r = R1[v];
  let saved = 0, lost = 0, dF = 0, dS = 0, tg = 0, pF = 0, pS = 0, b = 0;
  for (let i = 0; i < nPaths; i++) { const x = full.out[i], y = short.out[i]; if (y.survived) b++; if (y.survived && !x.survived) saved++; if (x.survived && !y.survived) lost++; dF += x.delivered; dS += y.delivered; tg += x.target; pF += x.terminalPot; pS += y.terminalPot; }
  console.log(`  ${v}: ${(r.listed / r.decisions).toFixed(1)} moves listed; a different move at ${pc(r.miss / r.decisions)}% of decisions (over 0.01 points of score given up at ${pc(r.m4 / r.decisions)}%, over 0.1 at ${pc(r.m3 / r.decisions)}%, over 1 at ${pc(r.m2 / r.decisions)}%; mean ${(100 * r.regret / r.decisions).toExponential(1)} points, worst ${(100 * r.worst).toFixed(2)}); parts ${Object.entries(r.parts).filter(([, n]) => n).map(([k, n]) => k + ' ' + n).join(', ') || 'none'} | a path ${short.ms.toFixed(2)} ms (${(full.ms / short.ms).toFixed(1)} times), whole-menu fallbacks ${short.fallbacks}; survival ${pc(b / nPaths)}% (${saved} saved, ${lost} lost); spending delivered ${(100 * dS / tg - 100 * dF / tg).toFixed(3)} points of target; mean pot left ${((pS / pF - 1) * 100).toFixed(2)}%`);
}
