// EXPLORATORY: how many of a decision's joint candidates (a split, each person's move, a level) leave the same position: the
// couple's model state after the year's move, compared whole (the review's item 11: the flat path values each once). Seed 4242.
//   REPO_ROOT=<the branch or a patched copy> node couple-same.mjs <couple> [points 4] [paths 20]
import { repoRoot } from './root.mjs';
import { planOf } from './plan-of.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js');
const { prepareForSolve } = await import(R + '/src/solverSettings.js');
const { solveCouple, withCouple } = await import(R + '/src/solver/couple.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, pts, nP] = [process.argv[2] || 'S007', Number(process.argv[3] || 4), Number(process.argv[4] || 20)];
const { plan } = planOf(E, buildScenarios, id);
const opts = pts <= 6 ? { points: pts, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: pts };
const cp = solveCouple(E, M, prepareForSolve(E, plan), { solveOne: (p, o) => solveForApp(E, M, p, { ...opts, ageWith: o.partnerAge0 }) });
let cur = null; const decs = [];
cp.M = { ...M, step: (m, st, joint, t, rates, skip) => { const row = M.step(m, st, joint, t, rates, skip); if (cur && skip) cur.push({ split: joint.split, ia: joint.ia, ib: joint.ib, level: joint.spendLevel, key: JSON.stringify([st.pots, st.basis, st.cgtCarry, st.cumPcls, st.lumpTaken, st.cashIsa, st.tierHeld]), draw: row.netDrawdown, fail: row.unmetDemand > 1 || !!row.preNmpaInsolvent }); return row; } };
const pl = withCouple(cp.plan, cp), pol = pl.spending.policyOverride, choose0 = pol.choose.bind(pol);
pol.choose = (st, t) => { cur = []; const j = choose0(st, t); decs.push({ t, c: cur, split: j.split }); cur = null; return j; };
const ctx = E.buildContext(pl), paths = E.pathsForSeed(4242, nP, ctx.totalYears);
paths.forEach(zs => E.runTrial(ctx, zs));
let cand = 0, distinct = 0, bySplit = 0, groups = 0, noDraw = 0, splitDistinct = [0, 0, 0, 0, 0, 0], fail = 0, chosen = {};
for (const d of decs) {
  cand += d.c.length; distinct += new Set(d.c.map(x => x.key)).size; fail += d.c.filter(x => x.fail).length;
  chosen[d.split] = (chosen[d.split] || 0) + 1;
  const g = new Map(); for (const x of d.c) { const k = `${x.ia}/${x.ib}/${x.level}`; if (!g.has(k)) g.set(k, []); g.get(k).push(x); }
  for (const xs of g.values()) { groups++; const n = new Set(xs.map(x => x.key)).size; splitDistinct[n]++; if (xs.every(x => !(x.draw > 0))) noDraw++; }
}
console.log(`${id} at ${pts} points, ${nP} paths, ${decs.length} decisions: ${cand} candidates (${(cand / decs.length).toFixed(1)} a decision), ${distinct} distinct positions after the move (${(100 * distinct / cand).toFixed(1)}%), ${fail} that do not fund the year`);
console.log(`   for one pair of moves and one level, the five splits leave: 1 position ${splitDistinct[1]} times, 2: ${splitDistinct[2]}, 3: ${splitDistinct[3]}, 4: ${splitDistinct[4]}, 5: ${splitDistinct[5]} (of ${groups}); with no drawdown at all ${noDraw}`);
console.log(`   the split chosen: ${Object.entries(chosen).sort().map(([k, v]) => `${k}: ${v}`).join(', ')}`);
