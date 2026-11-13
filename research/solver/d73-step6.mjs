// D73's port, step 6 (the review of 9 Nov, item 10, stage B; results-d73-port.txt): with the new defaults left out (sweepCashIsaTo and coarse; the lattice is the light one at 4 points
// on both trees), every table the same as on the tree before the port.   node step6.mjs <tree before> <tree after> <household>
const [ra, rb, id] = process.argv.slice(2);
const solveIn = async (R, research) => { const E = await import(R + '/research/engine.mjs'), M = await import(R + '/src/solver/model.js'), { solveForApp } = await import(R + '/src/solverApp.js'), { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
  return solveForApp(E, M, E.normalizePlan(buildScenarios().find(s => s.id === id).plan), { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true }, ...research } }); };
const a = await solveIn(ra, {}), b = await solveIn(rb, { sweepCashIsaTo: undefined, coarse: undefined });
let n = 0, diff = 0; const A = a.mix.tables, B = b.mix.tables;
for (let k = 0; k < A.length; k++) for (let j = 0; j < A[k].tsLayers.length; j++) for (const key of ['surv', 'beq', 'resil', 'short', 'pol', 'lsurv', 'lresil']) { const x = A[k].tsLayers[j][key], y = B[k].tsLayers[j][key]; if (!x) continue;
  for (let t = 0; t < x.length; t++) for (let i = 0; i < x[t].length; i++) { n++; if (!Object.is(x[t][i], y[t][i])) diff++; } }
console.log(`${id} at 4 points: the tree before the port against the port with sweepCashIsaTo and coarse left out: ${diff} of ${n} table values differ`);
process.exit(diff ? 1 : 0);
