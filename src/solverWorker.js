/*
 * THE SOLVER, OFF THE MAIN THREAD (Part C Phase 7, research/solver/PHASE-7.md step 7a).
 *
 * One solve runs in one of these, or split across several (src/solverPool.js): the first is part 0 and the solve's owner, the
 * others are parts that write their cells into the shared tables and finish. The owner keeps the result: a table is a policy
 * only beside its model (r.m holds the engine's functions, r.c the compiled context), and neither crosses to the page. So the
 * page asks the owner questions instead (simulate the solved plan; the tables' fingerprint), and keeps only the state.
 *
 *   part      { part, parts, arena, plan, opts }        one part of a split solve; replies { done } or { error }
 *   solve     { id, plan, opts, parts, arena, key }     the owner: { id, progress } as it goes, then { id, done, meta, secs,
 *                                                       restored }; with a key, a stored solve of it is restored instead of
 *                                                       solved (src/solverCache.js), and a new one stored: { id, stored }
 *   probe     { id, key }                               whether a solve of the key is stored for this code: { id, hit }
 *   simulate  { id, trials, seed }                      the solved plan through the engine's monteCarlo: { id, stats }
 *   digest    { id }                                    the tables' fingerprint (src/solverDigest.js): { id, digest, values, bytes }
 *
 * Imports the engine from App.jsx, as mcWorker.js does, with the two shims first.
 */
import './workerShim.js';
import './solverProcessShim.js';
import * as App from './App.jsx';
import * as M from './solver/model.js';
import { withTable } from './solver/bridge.js';
import { solveForApp } from './solverApp.js';
import { arenaPool } from './solverPool.js';
import { tablesOf, digestOf, sizeOf } from './solverDigest.js';
import { probeSolve, loadSolve, storeSolve, cacheOf } from './solverCache.js';

// the engine as the solver reads it: App.jsx's exports and its E namespace (research/engine.mjs is the same union)
const E = { ...App, ...App.E };
let solved = null;
// the code that solves, for the cache: this worker's own URL, which a build fingerprints with its contents
const CODE = self.location ? self.location.href : 'unknown';
const plainMeta = r => JSON.parse(JSON.stringify(r.meta));

self.onmessage = async ({ data }) => {
  const { id, kind } = data || {};
  try {
    if (kind === 'part') {
      const pool = arenaPool(data.part, data.parts, data.arena);
      try { solveForApp(E, M, data.plan, { ...data.opts, e2: pool }); } catch (e) { pool.fail(); throw e; }
      self.postMessage({ done: true });
      return;
    }
    if (kind === 'solve') {
      solved = null;
      const t0 = performance.now();
      const rec = data.key && data.parts <= 1 ? await loadSolve(data.key, CODE) : null;
      if (rec) {
        solved = solveForApp(E, M, data.plan, { ...data.opts, restore: rec, progress: p => self.postMessage({ id, progress: p }) });
        self.postMessage({ id, done: true, meta: plainMeta(solved), secs: (performance.now() - t0) / 1000, restored: true });
        return;
      }
      const pool = data.parts > 1 ? arenaPool(0, data.parts, data.arena) : null;
      let r;
      try { r = solveForApp(E, M, data.plan, { ...data.opts, ...(pool ? { e2: pool } : {}), progress: p => self.postMessage({ id, progress: p }) }); }
      catch (e) { if (pool) pool.fail(); throw e; }
      solved = r;
      self.postMessage({ id, done: true, meta: plainMeta(r), secs: (performance.now() - t0) / 1000, restored: false });
      if (data.key) self.postMessage({ id, stored: await storeSolve(data.key, CODE, cacheOf(r)) });
      return;
    }
    if (kind === 'probe') { self.postMessage({ id, hit: await probeSolve(data.key, CODE) }); return; }
    if (!solved) throw new Error(`solverWorker: '${kind}' asked before a solve finished`);
    if (kind === 'simulate') {
      const ctx = E.buildContext(withTable(solved.m.ctx.plan, solved));
      self.postMessage({ id, stats: E.monteCarlo(ctx, { trials: data.trials, seed: data.seed }) });
      return;
    }
    if (kind === 'digest') {
      const A = tablesOf(solved);
      self.postMessage({ id, digest: await digestOf(A), ...sizeOf(A) });
      return;
    }
    throw new Error(`solverWorker: unknown message '${kind}'`);
  } catch (err) {
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
