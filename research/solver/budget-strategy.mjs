/*
 * PHASE 9'S BUDGETS, MEASURED (the launch plan's Phase 9, "Budgets": on the agent's machine, with the floor at 80%, split four
 * ways, the headline within 60 seconds of the solve and the skip costs within 2 minutes more). As the page runs them: a
 * solve at the app's settings (solveForApp, 45 points) split four ways on src/solverPool.js's arena (here Node's worker
 * threads, the main thread part 0); then the headline's paths shared out evenly across the four parts, 2,000 first and then
 * up to 5,000, joined in path order (src/solverClient.js strategy, src/solverWorker.js 'runs' and 'strategy'); then this
 * year's skip costs on 1,000 paired paths, shared out the same way and joined against the plan's runs (src/solverClient.js
 * actions, src/solverWorker.js 'skipruns' and 'actions').
 * Each figure is the wall time from the solve's end; the solve's own time beside it. Run with nothing else on the machine.
 *   node research/solver/budget-strategy.mjs [id ...]      (S126 S370 S002 S188 unless given)
 */
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { cpus, loadavg } from 'node:os';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaFor, arenaPool } from '../../src/solverPool.js';
import { strategyRuns, joinRuns, strategySummary, actionsOf, skipRuns } from '../../src/solverStrategy.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { codeId } from './code-id.mjs';

const WORKER = fileURLToPath(new URL('./budget-strategy-worker.mjs', import.meta.url));
const PARTS = 4, SEED = 12345, FIRST = 2000, MORE = 5000, SKIP_N = 1000, HEADLINE_S = 60, SKIP_S = 120;
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['S126', 'S370', 'S002', 'S188'];
const byId = Object.fromEntries(buildScenarios().map(s => [s.id, s]));
const secs = t => ((performance.now() - t) / 1000);
const cid = codeId();
console.log(`PHASE 9'S BUDGETS (the launch plan's Phase 9): ${ids.join(', ')}; split ${PARTS} ways; seed ${SEED}; code ${cid ? cid.hash : 'unknown'}; ${cpus().length} cores (${cpus()[0].model}), load ${loadavg().map(x => x.toFixed(2)).join(' ')} at the start`);
let allMet = true;
for (const id of ids) {
  const plan = E.normalizePlan(byId[id].plan), arena = arenaFor();
  if (!arena) throw new Error('no growable SharedArrayBuffer here');
  const workers = [], solvedP = [], replies = [];
  for (let part = 1; part < PARTS; part++) {
    const w = new Worker(WORKER, { workerData: { part, parts: PARTS, arena, plan, seed: SEED } });
    const queue = []; replies[part] = queue;
    solvedP.push(new Promise((resolve, reject) => {
      w.on('message', m => { if (m.error) reject(new Error(m.error)); else if (m.solved) resolve(); else { const q = queue.shift(); q && q(m.runs || m.skipruns); } });
      w.once('error', e => { Atomics.store(new Int32Array(arena.ctrl), 2, 1); reject(e); });
    }));
    workers.push(w);
  }
  const ask = (part, from, to, skips = false) => new Promise(resolve => { replies[part].push(resolve); workers[part - 1].postMessage({ from, to, skips }); });
  const share = (a, b) => Array.from({ length: PARTS }, (_, k) => [a + Math.floor((k * (b - a)) / PARTS), a + Math.floor(((k + 1) * (b - a)) / PARTS)]);
  const t0 = performance.now(), pool = arenaPool(0, PARTS, arena);
  let r;
  try { r = solveForApp(E, M, plan, { e2: pool }); } catch (e) { pool.fail(); throw e; }
  await Promise.all(solvedP);
  const solveS = secs(t0), tEnd = performance.now();
  // the headline: the paths shared out, the owner taking the first share, joined in path order
  const stage = async (a, b) => { const sh = share(a, b), got = await Promise.all(sh.slice(1).map(([f, t], k) => ask(k + 1, f, t))); return [strategyRuns(E, r, plan, { seed: SEED, from: sh[0][0], to: sh[0][1] }), ...got]; };
  let runs = joinRuns(await stage(0, FIRST));
  const h1 = strategySummary(E, r, runs), headS = secs(tEnd);
  runs = joinRuns([runs, ...(await stage(FIRST, MORE))]);
  const h2 = strategySummary(E, r, runs), moreS = secs(tEnd);
  // the skip costs split the same way (src/solverClient.js actions), joined against the plan's runs the owner holds
  const t2 = performance.now(), sh = share(0, SKIP_N);
  const parts = [skipRuns(E, r, { seed: SEED, from: sh[0][0], to: sh[0][1] }), ...(await Promise.all(sh.slice(1).map(([f, t], k) => ask(k + 1, f, t, true))))];
  const a = actionsOf(E, r, plan, { seed: SEED, n: SKIP_N, base: runs.solved, parts }), skipS = secs(t2);
  workers.forEach(w => w.postMessage('stop'));
  await Promise.all(workers.map(w => w.terminate()));
  const met = headS <= HEADLINE_S && skipS <= SKIP_S;
  allMet = allMet && met;
  console.log(`${id}: the solve split ${PARTS} ways ${solveS.toFixed(1)} s; then the headline on ${FIRST} paths ${headS.toFixed(1)} s (target ${HEADLINE_S}), on ${MORE} ${moreS.toFixed(1)} s; the skip costs (${a.actions.filter(x => x.skip).length} actions, ${SKIP_N} paths each) ${skipS.toFixed(1)} s more (target ${SKIP_S}): ${met ? 'MET' : 'NOT MET'}; survival ${h1.headline.survival.toFixed(2)}% on ${FIRST}, ${h2.headline.survival.toFixed(2)}% on ${MORE}`);
}
console.log(`VERDICT: ${allMet ? 'every budget MET' : 'NOT every budget met'}`);
process.exit(0);
