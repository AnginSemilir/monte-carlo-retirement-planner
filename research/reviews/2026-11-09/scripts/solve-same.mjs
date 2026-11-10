// Two copies of the solver, the same household and settings: every table of every world and layer compared bit for bit.
//   node solve-same.mjs <root A> <root B> <household> <points> <config for A | off> [<config for B | off>]
const [ra, rb, id, ptsS, cfgA, cfgB0] = process.argv.slice(2), pts = Number(ptsS), cfgB = cfgB0 || cfgA;
import { parseConfig as parse, researchOf } from './solve-cfg.mjs';
const solveIn = async (R, cfg) => { const E = await import(R + '/research/engine.mjs'), M = await import(R + '/src/solver/model.js'), { solveForApp } = await import(R + '/src/solverApp.js'), { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
  const plan = E.normalizePlan(buildScenarios().find(s => s.id === id).plan), light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const t0 = Date.now(); const r = solveForApp(E, M, plan, { points: pts, research: researchOf(parse(cfg), light) }); return { r, secs: (Date.now() - t0) / 1000 }; };
const a = await solveIn(ra, cfgA), b = await solveIn(rb, cfgB);
let n = 0, diff = 0;
const A = a.r.mix.tables, B = b.r.mix.tables;
for (let k = 0; k < A.length; k++) for (let j = 0; j < A[k].tsLayers.length; j++) for (const key of ['surv', 'beq', 'resil', 'short', 'pol', 'lsurv', 'lresil']) { const x = A[k].tsLayers[j][key], y = B[k].tsLayers[j][key]; if (!x) continue;
  for (let t = 0; t < x.length; t++) for (let i = 0; i < x[t].length; i++) { n++; if (!Object.is(x[t][i], y[t][i])) diff++; } }
console.log(`${id} at ${pts} points: ${ra.split('/').pop()} (${cfgA}, ${a.secs.toFixed(1)} s) against ${rb.split('/').pop()} (${cfgB}, ${b.secs.toFixed(1)} s): ${diff} of ${n} table values differ`);
process.exit(diff ? 1 : 0);
