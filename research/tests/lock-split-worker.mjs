/*
 * lock-split.test.mjs's worker: one part of a dial position's split solve on src/solverPool.js's arena, as the page's worker
 * runs it (src/solverWorker.js 'part'): the base restored first from the record it is handed (shared memory, one copy for
 * every part), then the position solved on it with the part's tables carved from the arena. A throw sets the failure flag.
 * Plant (tests only): 'nobase' (part 1 is handed a base without a tier state, so it solves its cells unlocked).
 */
import { workerData, parentPort } from 'node:worker_threads';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaPool } from '../../src/solverPool.js';

const { part, parts, arena, plan, opts, base, planted } = workerData;
const pool = arenaPool(part, parts, arena);
try {
  const b = planted === 'nobase' && part === 1 ? { meta: {} } : solveForApp(E, M, base.plan, { ...opts, restore: base.rec });
  solveForApp(E, M, plan, { ...opts, e2: pool, base: b });
} catch (e) {
  pool.fail();
  parentPort.postMessage({ part, error: String((e && e.message) || e) });
  if (!planted) console.error(`lock-split-worker part ${part}: ${e && e.stack ? e.stack : e}`);
  process.exitCode = 1;
}
