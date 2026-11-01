/*
 * THE SOLVER, OFF THE MAIN THREAD (Part C Phase 7, research/solver/PHASE-7.md step 7a).
 *
 * One solve runs in one of these, or split across several (src/solverPool.js): the first is part 0 and the solve's owner, the
 * others are parts that write their cells into the shared tables and finish. The owner keeps the result: a table is a policy
 * only beside its model (r.m holds the engine's functions, r.c the compiled context), and neither crosses to the page. So the
 * page asks the owner questions instead (simulate the solved plan; the tables' fingerprint), and keeps only the state.
 *
 *   part      { part, parts, arena, plan, opts, base }  one part of a split solve; replies { done } or { error }; `base`
 *                                                       ({ plan, rec }, a dial position's) is restored in the part first
 *   base      { id, plan, opts, parts, arena, key }     a dial position's base (step L2): kept here between solves, from
 *                                                       memory, the store, or solved; replies as solve, restored 'held' when
 *                                                       it was in memory
 *   share     { id }                                    the held base as shared memory for a split position's parts: { id, rec }
 *   solve     { id, plan, opts, parts, arena, key,      the owner: { id, progress } as it goes, then { id, done, meta, secs,
 *              baseKey }                                restored }; with a key, a stored solve of it is restored instead of
 *                                                       solved (src/solverCache.js), and a new one stored: { id, stored, why };
 *                                                       with baseKey, solved on the held base of that key
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
import { probeSolve, loadSolve, storeSolveWhy, touchSolve, cacheOf, shareRecord } from './solverCache.js';

// the engine as the solver reads it: App.jsx's exports and its E namespace (research/engine.mjs is the same union)
const E = { ...App, ...App.E };
let solved = null, held = null;   // held: { key, r }, the base a dial position is solved on, kept between solves
// the code that solves, for the cache: this worker's own URL, which a build fingerprints with its contents
const CODE = self.location ? self.location.href : 'unknown';
const plainMeta = r => JSON.parse(JSON.stringify(r.meta));

self.onmessage = async ({ data }) => {
  const { id, kind } = data || {};
  try {
    if (kind === 'part') {
      const pool = arenaPool(data.part, data.parts, data.arena);
      try {
        const base = data.base ? solveForApp(E, M, data.base.plan, { ...data.opts, restore: data.base.rec }) : null;
        solveForApp(E, M, data.plan, { ...data.opts, e2: pool, ...(base ? { base } : {}) });
      } catch (e) { pool.fail(); throw e; }
      self.postMessage({ done: true });
      return;
    }
    if (kind === 'share') {
      if (!held) throw new Error('solverWorker: no base held to share');
      self.postMessage({ id, rec: shareRecord(cacheOf(held.r)) });
      return;
    }
    if (kind === 'solve' || kind === 'base') {
      const isBase = kind === 'base', t0 = performance.now();
      if (isBase && held && held.key === data.key) {
        if (data.key) await touchSolve(data.key, CODE);
        self.postMessage({ id, done: true, meta: plainMeta(held.r), secs: 0, restored: 'held' });
        return;
      }
      if (isBase) held = null; else solved = null;
      let base = null;
      if (!isBase && data.baseKey) {
        if (!held || held.key !== data.baseKey) throw new Error('solverWorker: the dial position\'s base is not held');
        base = held.r;
      }
      const progress = p => self.postMessage({ id, progress: isBase ? { ...p, stage: 'base' } : base ? { ...p, stage: 'position' } : p });
      const keep = (r) => { if (isBase) held = { key: data.key, r }; else solved = r; };
      const rec = data.key && data.parts <= 1 ? await loadSolve(data.key, CODE) : null;
      if (rec) {
        const r = solveForApp(E, M, data.plan, { ...data.opts, restore: rec, progress, ...(base ? { base } : {}) });
        keep(r);
        self.postMessage({ id, done: true, meta: plainMeta(r), secs: (performance.now() - t0) / 1000, restored: true });
        return;
      }
      const pool = data.parts > 1 ? arenaPool(0, data.parts, data.arena) : null;
      let r;
      try { r = solveForApp(E, M, data.plan, { ...data.opts, ...(pool ? { e2: pool } : {}), progress, ...(base ? { base } : {}) }); }
      catch (e) { if (pool) pool.fail(); throw e; }
      keep(r);
      self.postMessage({ id, done: true, meta: plainMeta(r), secs: (performance.now() - t0) / 1000, restored: false });
      if (data.key) { const st = await storeSolveWhy(data.key, CODE, cacheOf(r), { keep: data.baseKey || null }); self.postMessage({ id, stored: st.stored, why: st.why }); }
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
