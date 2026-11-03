/*
 * THIS YEAR'S SKIP COSTS SPLIT ACROSS WORKERS (Part C Phase 9; the launch plan's Phase 9 budgets: split four ways, the skip
 * costs within 2 minutes of the headline; the full tier). A split solve's parts are kept after the solve, each holding it;
 * each runs this year's skips on its share of the paths (src/solverStrategy.js skipRuns, src/solverWorker.js 'skipruns') and
 * the owner joins them in path order against the plan's runs (joinSkipRuns, actionsOf's `parts`), as src/solverClient.js
 * actions does. On S126 at light settings, on Node's worker threads:
 *   1. split two and three ways, each part running the skips on its own share of the paths: every skip, cost, lost and saved
 *      count the same as the whole solve running every path;
 *   2. planted, part 1 leaving out the first path of its share: refused (the parts do not meet), never a different cost.
 *   node research/tests/skip-split.test.mjs
 */
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaFor, arenaPool } from '../../src/solverPool.js';
import { actionsOf, skipRuns } from '../../src/solverStrategy.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const WORKER = fileURLToPath(new URL('./skip-split-worker.mjs', import.meta.url));
const opts = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const plan = E.normalizePlan(buildScenarios().find(s => s.id === 'S126').plan), SEED = 12345, N = 120;

const whole = actionsOf(E, solveForApp(E, M, plan, opts), plan, { seed: SEED, n: N });
const shares = parts => Array.from({ length: parts }, (_, k) => [Math.floor((k * N) / parts), Math.floor(((k + 1) * N) / parts)]);
async function split(parts, planted = null) {
  const arena = arenaFor();
  if (!arena) throw new Error('no growable SharedArrayBuffer here');
  const sh = shares(parts), got = [], ends = [];
  for (let part = 1; part < parts; part++) {
    const w = new Worker(WORKER, { workerData: { part, parts, arena, plan, opts, seed: SEED, from: sh[part][0], to: sh[part][1], planted } });
    ends.push(new Promise((resolve, reject) => {
      w.on('message', m => (m.error ? reject(new Error(m.error)) : got.push(m.skipruns)));
      w.once('error', e => { Atomics.store(new Int32Array(arena.ctrl), 2, 1); reject(e); });
      w.once('exit', code => (code === 0 ? resolve() : reject(new Error(`part ${part} exited ${code}`))));
    }));
  }
  const pool = arenaPool(0, parts, arena);
  let r;
  try { r = solveForApp(E, M, plan, { ...opts, e2: pool }); } catch (e) { pool.fail(); throw e; }
  const mine = skipRuns(E, r, { seed: SEED, from: sh[0][0], to: sh[0][1] });
  await Promise.all(ends);
  return actionsOf(E, r, plan, { seed: SEED, n: N, parts: [mine, ...got] });
}
const shown = a => a.actions.map(x => `${x.part} ${x.value}${x.skip ? ` (skip ${x.skip.index}: ${x.cost.toFixed(2)}, lost ${x.lost}, saved ${x.saved})` : ''}`).join('; ');
for (const parts of [2, 3]) {
  const s = await split(parts);
  ok(whole.actions.some(x => x.skip) && JSON.stringify(s) === JSON.stringify(whole), `1. split ${parts} ways, each part running the skips on its share of ${N} paths: every skip and cost the whole run's (${shown(s)})`);
}
let refused = '';
try { await split(2, 'skipdrop'); } catch (e) { refused = e.message; }
ok(/path order/.test(refused), `2. planted, part 1 leaving out its first path: refused (${refused || 'not refused'})`);
console.log(`\n${failed ? `FAILED: ${failed} of ${n + failed}` : `ALL PASS: ${n}`}`);
process.exit(failed ? 1 : 0);
