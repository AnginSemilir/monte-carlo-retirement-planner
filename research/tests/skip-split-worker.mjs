/*
 * skip-split.test.mjs's worker: one part of a split solve on src/solverPool.js's arena, as the page's worker runs it
 * (src/solverWorker.js 'part'), which keeps its solve and runs the skips on its share of the paths (src/solverStrategy.js
 * skipRuns), as the page's part answers 'skipruns'. Plant (tests only): 'skipdrop' (the part leaves out its first path).
 */
import { workerData, parentPort } from 'node:worker_threads';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaPool } from '../../src/solverPool.js';
import { skipRuns, PLANT } from '../../src/solverStrategy.js';

const { part, parts, arena, plan, opts, seed, from, to, planted } = workerData;
const pool = arenaPool(part, parts, arena);
let r;
try { r = solveForApp(E, M, plan, { ...opts, e2: pool }); }
catch (e) { pool.fail(); parentPort.postMessage({ part, error: String((e && e.message) || e) }); process.exitCode = 1; }
if (r) {
  if (planted) PLANT.rule = planted;
  parentPort.postMessage({ part, skipruns: skipRuns(E, r, { seed, from, to }) });
}
