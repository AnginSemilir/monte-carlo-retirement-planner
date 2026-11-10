// EXPLORATORY: how far a cell's stored best move can be found from its neighbours' (the idea behind solving most cells on a
// shortlist). One solve, then for every year, cell and tier layer held: is the cell's move among the moves stored
//   (a) at its two neighbours along one axis (wealth, pension share, ISA share, gain bucket, allowance bucket), at distance d,
//   (b) those and next year's move at the cell itself?
//   node solve-coh.mjs <household> <points>          (needs no patch)
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs'); const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js'); const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, pts] = [process.argv[2] || 'S116', Number(process.argv[3] || 4)];
const plan = E.normalizePlan(buildScenarios().find(s => s.id === id).plan);
const opts = pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts };
const t0 = Date.now(); const r = solveForApp(E, M, plan, opts);
const g = r.g, T = r.m.ctx.totalYears, L = r.tsLayers, NL = L.length, dims = [g.np, g.ni, g.nt, g.gain.length, g.pcls.length], names = ['wealth', 'pension share', 'ISA share', 'gain bucket', 'allowance bucket'];
console.log(`${id} at ${pts} points: solve ${((Date.now() - t0) / 1000).toFixed(0)} s; grid ${dims.join(' x ')} (${g.size} cells), ${T + 1} years, ${NL} tier layers, ${r.actions.length} moves; EXPLORATORY`);
const acts = r.actions, ca = r.c.acts;
const part = ai => ({ lvl: acts[ai].spendLevel, st: JSON.stringify([acts[ai].steps, !!acts[ai].harvest, acts[ai].harvestCeil || 'pa']), tier: `${ca[ai].tierPen || 0}/${ca[ai].tierIsa || 0}` });
const idxOf = (i) => g.index(i[0], i[1], i[2], i[3], i[4]);
for (let ax = 0; ax < 5; ax++) for (const d of (ax === 0 ? [1, 2, 4] : ax < 3 ? [1, 2] : [1])) {
  let n = 0, hitA = 0, hitB = 0, lvlOnly = 0, tierOnly = 0, stOnly = 0, agree = 0, agreeHit = 0;
  const i = [0, 0, 0, 0, 0];
  for (let t = 0; t <= T; t++) for (i[4] = 0; i[4] < dims[4]; i[4]++) for (i[3] = 0; i[3] < dims[3]; i[3]++) for (i[2] = 0; i[2] < dims[2]; i[2]++) for (i[1] = 0; i[1] < dims[1]; i[1]++) for (i[0] = 0; i[0] < dims[0]; i[0]++) {
    const lo = i[ax] - d, hi = i[ax] + d; if (lo < 0 || hi >= dims[ax]) continue;
    const idx = idxOf(i); const sv = i[ax]; i[ax] = lo; const a = idxOf(i); i[ax] = hi; const b = idxOf(i); i[ax] = sv;
    for (let j = 0; j < NL; j++) {
      const p = L[j].pol[t], me = p[idx], x = p[a], y = p[b], nx = t < T ? L[j].pol[t + 1][idx] : -1;
      n++; const inA = me === x || me === y; if (inA) hitA++; if (inA || me === nx) hitB++;
      if (x === y) { agree++; if (me === x) agreeHit++; }
      if (!(inA || me === nx)) { const pm = part(me), cands = [x, y, nx].filter(v => v >= 0).map(part);
        if (cands.some(c => c.st === pm.st && c.tier === pm.tier)) lvlOnly++; else if (cands.some(c => c.st === pm.st && c.lvl === pm.lvl)) tierOnly++; else if (cands.some(c => c.lvl === pm.lvl && c.tier === pm.tier)) stOnly++; }
    }
  }
  const pc = v => (100 * v / n).toFixed(2);
  console.log(`  ${names[ax]}, neighbours ${d} away: the cell's move is one of its two neighbours' at ${pc(hitA)}% of ${n} cell-layers, or next year's at the cell at ${pc(hitB)}%; the neighbours agree at ${pc(agree)}%, and the cell then takes their move at ${(100 * agreeHit / agree).toFixed(2)}% of those; of the ${pc(n - hitB)}% missed, the spending level alone differs ${pc(lvlOnly)}%, the tier alone ${pc(tierOnly)}%, the draw order or re-wrap alone ${pc(stOnly)}%`);
}
