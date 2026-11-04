/*
 * lock-ref.test.mjs's worker: part 1 of a dial position split two ways, as the page's part runs it (src/solverWorker.js
 * 'part'): it solves its own base first, then its share of the position on that base, the reference taken or built as told.
 */
import { workerData, parentPort } from 'node:worker_threads';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { REFSHARE } from '../../src/solver/solve.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaPool } from '../../src/solverPool.js';

const { part, parts, arena, plan, opts, on } = workerData;
const atDial = (p, pos) => ({ ...p, solver: { ...(p.solver || {}), aims: { ...((p.solver && p.solver.aims) || {}), cuts: pos } } });
const pool = arenaPool(part, parts, arena);
try {
  REFSHARE.on = on;
  const base = solveForApp(E, M, atDial(plan, 1), opts);
  solveForApp(E, M, atDial(plan, 10), { ...opts, base, e2: pool });
  parentPort.postMessage({ part, done: true });
} catch (e) { pool.fail(); parentPort.postMessage({ part, error: String((e && e.message) || e) }); }
