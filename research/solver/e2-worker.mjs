/*
 * E2's worker: one part of a split solve (e2.mjs). Runs the same solvePlan call as part 0, with its own pool; its tables
 * are part 0's shared memory, so it returns nothing. A throw sets the failure flag, so no part waits for it.
 */
import { workerData, receiveMessageOnPort } from 'node:worker_threads';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { makePool } from './e2.mjs';

const { part, parts, control, plan, opts, port, planted } = workerData;
const pool = makePool(part, parts, control, [{ receive: () => receiveMessageOnPort(port) }], planted);
try {
  if (planted === 'throw' && part === 2) throw new Error('planted: part 2 fails before it starts');
  solvePlan(E, M, plan, { ...opts, e2: pool });
} catch (e) {
  pool.fail();
  console.error(`e2-worker part ${part}: ${e && e.stack ? e.stack : e}`);
  process.exitCode = 1;
}
port.close();
