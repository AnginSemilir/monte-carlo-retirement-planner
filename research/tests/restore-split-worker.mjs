/*
 * restore-split.test.mjs's worker, one part of a split solve on src/solverPool.js's arena, as the page's part runs it
 * (src/solverWorker.js 'part'):
 *   mode 'restore'   a restored solve split: this part follows part 0 (src/solverCache.js followRecord: no table, part 0
 *                    copies the record in), then gives its tables' and its reference's digests, the reference's counts and
 *                    its share of the strategy's paths (src/solverStrategy.js strategyRuns), as the page's part answers 'runs';
 *   mode 'position'  a dial position split (step P1 (b)): this part solves its own base, then its share of the position on it,
 *                    the reference taken from the base (`refFrom`), and gives the position's reference's counts.
 */
import { workerData, parentPort } from 'node:worker_threads';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaPool } from '../../src/solverPool.js';
import { strategyRuns } from '../../src/solverStrategy.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { refDigest, countsOf, atDial } from './restore-split-lib.mjs';

const { mode, part, parts, arena, plan, opts, restore, seed, from, to } = workerData;
const pool = arenaPool(part, parts, arena);
try {
  if (mode === 'restore') {
    const r = solveForApp(E, M, plan, { ...opts, restore, e2: pool });
    parentPort.postMessage({ part, tables: await digestOf(tablesOf(r)), ref: refDigest(r), counts: countsOf(r), restored: !!r.meta.restored, runs: strategyRuns(E, r, plan, { seed, from, to }) });
  } else {
    const base = solveForApp(E, M, atDial(plan, 1), opts);
    const r = solveForApp(E, M, atDial(plan, 10), { ...opts, base, e2: pool });
    parentPort.postMessage({ part, counts: countsOf(r), tables: await digestOf(tablesOf(r)) });
  }
} catch (e) { pool.fail(); parentPort.postMessage({ part, error: String((e && e.message) || e) }); }
