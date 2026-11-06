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
 *   simulate  { id, trials, seed, collectPaths }        the solved plan through the engine's monteCarlo: { id, stats } (with the
 *                                                       paths for the projection's fan when asked, Phase 10)
 *   runs      { id, plan, seed, from, to }              paths from..to-1 through both arms (src/solverStrategy.js strategyRuns): the
 *                                                       share of a split solve's part, which keeps its solve after it: { id, runs }
 *   strategy  { id, plan, seed, upto, runs }            the Strategy tab's figures (Phase 9, src/solverStrategy.js) on paths 0 to
 *                                                       upto-1 of the seed, the solved plan beside the plan as entered: { id,
 *                                                       strategy }; the paths already run for this solve, seed and plan are kept
 *                                                       and only the rest run, so asking for 2,000 then 5,000 costs 5,000; `runs`
 *                                                       the parts' shares of the next paths, joined in path order first
 *   actions   { id, plan, seed, n }                     this year's move, part by part, each with the survival cost of skipping
 *                                                       it on n paired paths (the plan's own runs reused): { id, actions }
 *   ahead     { id, plan, seed, years, upto }           the next years' moves on the median path of the strategy's first upto paths
 *                                                       (every path held when upto is 0; step U picks over the first step's):
 *                                                       { id, ahead }
 *   distil    { id, plan, seed, n }                     the rule of thumb (src/solverDistil.js): its tree, rules, fidelity and
 *                                                       the paired cost of following it on n paths: { id, distil }
 *   rows      { id, market }                            one market's run of the solved plan year by year ('expected', or
 *                                                       { historical: true, startYear }), each year's move: { id, rows }
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
import { strategyRuns, strategyAnswer, actionsOf, skipRuns, aheadAnswer, rowsOf } from './solverStrategy.js';
import { distilOf } from './solverDistil.js';
import { probeSolve, loadSolve, storeSolveWhy, touchSolve, cacheOf, shareRecord, codeOf } from './solverCache.js';

// the engine as the solver reads it: App.jsx's exports and its E namespace (research/engine.mjs is the same union)
const E = { ...App, ...App.E };
let solved = null, held = null;   // held: { key, r }, the base a dial position is solved on, kept between solves
let runs = null;                  // the Strategy tab's paths run so far: { r, plan, runs } (src/solverStrategy.js)
// the code that solves, for the cache: in a build, its module graph's key, which vite-plugin-solver-code.js writes over the
// placeholder (a screen change keeps it; step P1 (g)); under `vite dev`, this worker's own URL, as before
const CODE = codeOf('__SOLVER_CODE_KEY__', self.location);
const plainMeta = r => JSON.parse(JSON.stringify(r.meta));

self.onmessage = async ({ data }) => {
  const { id, kind } = data || {};
  try {
    if (kind === 'part') {
      const pool = arenaPool(data.part, data.parts, data.arena);
      try {
        const base = data.base ? solveForApp(E, M, data.base.plan, { ...data.opts, restore: data.base.rec }) : null;
        // kept: a split solve's part runs its share of the Strategy tab's paths ('runs', Phase 9)
        solved = solveForApp(E, M, data.plan, { ...data.opts, e2: pool, ...(base ? { base } : {}) });
        runs = null;
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
        self.postMessage({ id, done: true, meta: plainMeta(held.r), secs: 0, restored: 'held', code: CODE });
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
        self.postMessage({ id, done: true, meta: plainMeta(r), secs: (performance.now() - t0) / 1000, restored: true, code: CODE });
        return;
      }
      const pool = data.parts > 1 ? arenaPool(0, data.parts, data.arena) : null;
      let r;
      try { r = solveForApp(E, M, data.plan, { ...data.opts, ...(pool ? { e2: pool } : {}), progress, ...(base ? { base } : {}) }); }
      catch (e) { if (pool) pool.fail(); throw e; }
      keep(r);
      self.postMessage({ id, done: true, meta: plainMeta(r), secs: (performance.now() - t0) / 1000, restored: false, code: CODE });
      if (data.key) { const st = await storeSolveWhy(data.key, CODE, cacheOf(r), { keep: data.baseKey || null }); self.postMessage({ id, stored: st.stored, why: st.why }); }
      return;
    }
    if (kind === 'probe') { self.postMessage({ id, hit: await probeSolve(data.key, CODE) }); return; }
    if (!solved) throw new Error(`solverWorker: '${kind}' asked before a solve finished`);
    if (kind === 'simulate') {
      const ctx = E.buildContext(withTable(solved.m.ctx.plan, solved));
      self.postMessage({ id, stats: E.monteCarlo(ctx, { trials: data.trials, seed: data.seed, collectPaths: !!data.collectPaths }) });
      return;
    }
    if (kind === 'runs') {
      self.postMessage({ id, runs: strategyRuns(E, solved, data.plan, { seed: data.seed, from: data.from, to: data.to }) });
      return;
    }
    if (kind === 'skipruns') {
      self.postMessage({ id, skipruns: skipRuns(E, solved, { seed: data.seed, from: data.from, to: data.to }) });
      return;
    }
    if (kind === 'strategy') {
      // the paths the split solve's parts ran (src/solverClient.js strategy), joined in path order to those kept here
      const a = strategyAnswer(E, solved, runs, data);
      runs = a.held;
      self.postMessage({ id, strategy: a.strategy });
      return;
    }
    if (kind === 'distil') {
      const same = runs && runs.r === solved && runs.plan === JSON.stringify(data.plan) && runs.runs.seed === data.seed ? runs.runs : null;
      self.postMessage({ id, distil: distilOf(E, solved, data.plan, { seed: data.seed, n: data.n, base: same ? same.solved : null }) });
      return;
    }
    // Phase 10, item 7: one market's run of the solved plan year by year, with each year's move (the audit table's ledger
    // on the expected path, history's out-of-model check on a start year)
    if (kind === 'rows') {
      self.postMessage({ id, rows: rowsOf(E, solved, data.market) });
      return;
    }
    if (kind === 'actions' || kind === 'ahead') {
      const same = runs && runs.r === solved && runs.plan === JSON.stringify(data.plan) && runs.runs.seed === data.seed ? runs.runs : null;
      if (kind === 'actions') self.postMessage({ id, actions: actionsOf(E, solved, data.plan, { seed: data.seed, n: data.n, base: same ? same.solved : null, parts: data.parts || null }) });
      else {
        if (!same) throw new Error('solverWorker: \'ahead\' asked before the strategy\'s runs');
        self.postMessage({ id, ahead: aheadAnswer(E, solved, data.plan, same, { years: data.years, upto: data.upto || 0 }) });
      }
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
