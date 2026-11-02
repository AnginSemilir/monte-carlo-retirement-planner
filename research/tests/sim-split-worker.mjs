/*
 * sim-split.test.mjs's worker: one part of a split solve on src/solverPool.js's arena, as the page's worker runs it
 * (src/solverWorker.js 'part'), which then keeps its solve and runs its share of the Strategy tab's paths (src/solverStrategy.js
 * strategyRuns), as the page's part answers 'runs'. Plant (tests only): 'drop' (part 1 leaves out the first path of its share).
 */
import { workerData, parentPort } from 'node:worker_threads';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaPool } from '../../src/solverPool.js';
import { strategyRuns } from '../../src/solverStrategy.js';

const { part, parts, arena, plan, opts, seed, from, to, planted } = workerData;
const pool = arenaPool(part, parts, arena);
let r;
try { r = solveForApp(E, M, plan, { ...opts, e2: pool }); }
catch (e) { pool.fail(); parentPort.postMessage({ part, error: String((e && e.message) || e) }); process.exitCode = 1; }
if (r) {
  const runs = strategyRuns(E, r, plan, { seed, from: planted === 'drop' && part === 1 ? from + 1 : from, to });
  parentPort.postMessage({ part, runs });
}
