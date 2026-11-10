// EXPLORATORY (the external review, 10 Nov): the solve on anchors and shortlists under the split (the solve shared by
// worker threads, as the app runs it).
//   REPO_ROOT=<a tree with solve-coarse.diff applied> node solve-split.mjs <household> <points> <parts> <setting | off>[,...]
// For each setting: the solve on one thread and split across <parts>, their tables compared bit for bit, and both times.
// The split is research/solver/e2.mjs's solveSplit, called here without its e3pcls pin check (the pin names the branch's
// solver code; a patched tree's differs, though with the option off its tables are the branch's bit for bit).
import { Worker, MessageChannel } from 'node:worker_threads';
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs'), M = await import(R + '/src/solver/model.js');
const { solvePlan } = await import(R + '/src/solver/solve.js'), SS = await import(R + '/src/solverSettings.js');
const { makeControl, makePool } = await import(R + '/research/solver/e2.mjs'), { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, ptsS, partsS, cfgs] = process.argv.slice(2), pts = Number(ptsS), parts = Number(partsS);
import { parseConfig as parse } from './solve-cfg.mjs';
const raw = buildScenarios().find(s => s.id === id).plan, norm = E.normalizePlan(raw);
// the options solveForApp hands solvePlan for a plan at the dial's first position
const aims = SS.aimsOptions(norm, SS.APP_DIAL_VARIANT), locked = SS.lockedPlan(E, norm).riskAbove === false ? { riskAbove: false } : {};
const light = pts <= 6 ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
const optsOf = cfg => ({ ...SS.APP_CANDIDATE, ...aims, ...light, ...(cfg.lattice ? { adaptiveLattice: cfg.lattice } : {}), ...(cfg.coarse ? { coarse: cfg.coarse } : {}), lambda: aims.lambda, points: pts, ...locked });
const plan = SS.appPlan(E, SS.prepareForSolve(E, raw));
async function split(opts) {
  const control = makeControl(), ports = [], ends = [];
  for (let part = 1; part < parts; part++) {
    const { port1, port2 } = new MessageChannel();
    const w = new Worker(R + '/research/solver/e2-worker.mjs', { workerData: { part, parts, control, plan, opts, port: port2, planted: null }, transferList: [port2] });
    ends.push(new Promise((resolve, reject) => { w.once('error', e => { Atomics.store(new Int32Array(control.ctrl), 2, 1); reject(e); }); w.once('exit', code => (code === 0 ? resolve() : reject(new Error(`part ${part} exited ${code}`)))); }));
    ports.push(port1);
  }
  const pool = makePool(0, parts, control, ports);
  let r; try { r = solvePlan(E, M, plan, { ...opts, e2: pool }); } catch (e) { pool.fail(); await Promise.allSettled(ends); throw e; }
  await Promise.all(ends); for (const p of ports) p.close();
  return r;
}
const timed = async f => { const t0 = process.hrtime.bigint(); const r = await f(); return { r, secs: Number(process.hrtime.bigint() - t0) / 1e9 }; };
const tablesDiffer = (a, b) => { let n = 0, d = 0; const A = a.mix.tables, B = b.mix.tables;
  for (let k = 0; k < A.length; k++) for (let j = 0; j < A[k].tsLayers.length; j++) for (const key of ['surv', 'beq', 'resil', 'short', 'pol', 'lsurv', 'lresil']) { const x = A[k].tsLayers[j][key], y = B[k].tsLayers[j][key]; for (let t = 0; t < x.length; t++) for (let i = 0; i < x[t].length; i++) { n++; if (!Object.is(x[t][i], y[t][i])) d++; } }
  return `${d} of ${n} table values differ`; };
console.log(`${id} at ${pts} points, the solve on one thread and split across ${parts}; EXPLORATORY`);
let one0 = null, split0 = null;
for (const cfg of cfgs.split(',')) {
  const opts = optsOf(parse(cfg));
  const one = await timed(async () => solvePlan(E, M, plan, opts)), sp = await timed(() => split(opts));
  if (cfg === 'off') { one0 = one.secs; split0 = sp.secs; }
  console.log(`  ${cfg}: one thread ${one.secs.toFixed(1)} s${one0 && cfg !== 'off' ? ` (${(one0 / one.secs).toFixed(2)} times the solve as it is)` : ''}; split ${sp.secs.toFixed(1)} s (${(one.secs / sp.secs).toFixed(2)} times its one thread${split0 && cfg !== 'off' ? `, ${(split0 / sp.secs).toFixed(2)} times the split solve as it is` : ''}); split against one thread: ${tablesDiffer(one.r, sp.r)}`);
}
