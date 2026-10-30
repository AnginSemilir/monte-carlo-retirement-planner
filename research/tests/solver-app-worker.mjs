/*
 * solver-app.test.mjs's worker: one part of a split solve on src/solverPool.js's arena (the page's pool, here on Node's worker
 * threads). Runs the same solveForApp call as part 0, its tables carved from the shared arena, so it returns nothing. A throw
 * sets the failure flag, so no part waits for it. Plants (tests only): 'drop' (solve.js: part 1 claims cells and never
 * writes them), 'stray' (part 1 carves one table the others do not), 'throw' (part 1 fails before it starts).
 */
import { workerData, parentPort } from 'node:worker_threads';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaPool } from '../../src/solverPool.js';

const { part, parts, arena, plan, opts, planted } = workerData;
const pool = arenaPool(part, parts, arena, planted === 'drop' ? 'drop' : null);
try {
  if (planted === 'throw' && part === 1) throw new Error('planted: part 1 fails before it starts');
  if (planted === 'stray' && part === 1) pool.f64(10);
  solveForApp(E, M, plan, { ...opts, e2: pool });
} catch (e) {
  pool.fail();
  parentPort.postMessage({ part, error: String((e && e.message) || e) });   // whichever part caught a fault, the test reads it
  if (!planted) console.error(`solver-app-worker part ${part}: ${e && e.stack ? e.stack : e}`);
  process.exitCode = 1;
}
