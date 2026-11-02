/*
 * budget-strategy.mjs's worker: one part of a split solve on src/solverPool.js's arena, as the page's worker runs it
 * (src/solverWorker.js 'part'); it keeps its solve and answers each { from, to } with its paths of the Strategy tab
 * (src/solverStrategy.js strategyRuns), as the page's part answers 'runs', and each { from, to, skips } with its share of this
 * year's skips (skipRuns), as it answers 'skipruns'.
 */
import { workerData, parentPort } from 'node:worker_threads';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaPool } from '../../src/solverPool.js';
import { strategyRuns, skipRuns } from '../../src/solverStrategy.js';

const { part, parts, arena, plan, seed } = workerData;
const pool = arenaPool(part, parts, arena);
let r;
try { r = solveForApp(E, M, plan, { e2: pool }); parentPort.postMessage({ part, solved: true }); }
catch (e) { pool.fail(); parentPort.postMessage({ part, error: String((e && e.message) || e) }); process.exitCode = 1; }
if (r) parentPort.on('message', m => {
  if (m === 'stop') { parentPort.close(); return; }
  if (m.skips) parentPort.postMessage({ part, skipruns: skipRuns(E, r, { seed, from: m.from, to: m.to }) });
  else parentPort.postMessage({ part, runs: strategyRuns(E, r, plan, { seed, from: m.from, to: m.to }) });
});
