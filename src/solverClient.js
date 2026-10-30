/*
 * THE PAGE'S SIDE OF THE SOLVER (Part C Phase 7, research/solver/PHASE-7.md). Loaded lazily, by src/useSolver.js when the
 * switch is on, so the first load of the app fetches none of it.
 *
 *   const key = await keyOf(engine, plan, opts);          // what the solve depends on (src/solverKey.js); the engine is
 *                                                         // App.jsx's, handed in (importing App.jsx here would split the
 *                                                         // page's own first-load code into another chunk)
 *   const job = startSolve(plan, { key, parts, lambda, points, research, onProgress, onStored });
 *   const { meta, secs, parts, restored } = await job.done;   // rejects with 'cancelled' after job.cancel()
 *   await job.ask('simulate', { trials, seed });          // the owner worker's answers (src/solverWorker.js)
 *   job.close();                                          // the owner worker, and the solved tables with it, let go
 *
 * With a key, the owner first asks the store (src/solverCache.js): a stored solve of the same key and code is restored in that
 * one worker; otherwise the plan is solved, split across workers where the page is cross-origin isolated (src/solverPool.js),
 * and stored. Elsewhere the solve runs whole in one worker.
 */
import { arenaFor, failArena } from './solverPool.js';
import { solveKey } from './solverKey.js';

export const canSplit = () => typeof SharedArrayBuffer !== 'undefined' && (typeof crossOriginIsolated === 'undefined' || crossOriginIsolated)
  && typeof SharedArrayBuffer.prototype.grow === 'function';
/* gate 5's four cores at most (D11), fewer where the machine has fewer */
export const defaultParts = () => (canSplit() ? Math.max(1, Math.min(4, (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 1)) : 1);
const newWorker = () => new Worker(new URL('./solverWorker.js', import.meta.url), { type: 'module' });
/* the solve's key on the page: the plan as the solver takes it and the settings (the code is checked by the worker) */
export const keyOf = (engine, plan, opts = {}) => solveKey(engine, plan, opts);

export function startSolve(plan, { key = null, parts = defaultParts(), onProgress = null, onStored = null, ...opts } = {}) {
  const owner = newWorker(), workers = [owner], pending = new Map();
  let seq = 0, finished = false, rejectDone = null, arena = null, n = 1;
  const stop = () => { if (arena) failArena(arena); workers.forEach(w => w.terminate()); };
  // the owner's answers: ask() replies by id, the solve's own messages under id 0
  let onMain = null;
  owner.onmessage = ({ data }) => {
    if (data.id !== 0) {
      const p = pending.get(data.id); if (!p) return; pending.delete(data.id);
      if (data.error) p.reject(new Error(data.error)); else p.resolve(data);
      return;
    }
    if (data.progress) { if (onProgress) onProgress(data.progress); return; }
    if (data.stored !== undefined) { if (onStored) onStored(data.stored); return; }
    if (onMain) onMain(data);
  };
  const ask = (kind, extra = {}) => {
    const id = ++seq;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); owner.postMessage({ id, kind, ...extra }); });
  };

  const done = new Promise((resolve, reject) => {
    rejectDone = reject;
    (async () => {
      const hit = key ? (await ask('probe', { key })).hit : false;
      if (finished) return;
      if (!hit && parts > 1 && canSplit()) { arena = arenaFor(); if (arena) n = parts; }
      const ends = [];
      for (let i = 1; i < n; i++) {
        const w = newWorker(); workers.push(w);
        ends.push(new Promise((res, rej) => {
          w.onmessage = ({ data }) => (data.error ? rej(new Error(data.error)) : res());
          w.onerror = e => rej(new Error((e && e.message) || `solver part ${i} failed`));
          w.postMessage({ kind: 'part', part: i, parts: n, arena, plan, opts });
        }));
      }
      const main = new Promise((res, rej) => {
        onMain = data => (data.error ? rej(new Error(data.error)) : res(data));
        owner.onerror = e => rej(new Error((e && e.message) || 'the solver failed'));
        owner.postMessage({ id: 0, kind: 'solve', plan, opts, parts: n, arena, key });
      });
      const [m] = await Promise.all([main, ...ends]);
      if (finished) return; finished = true;
      workers.slice(1).forEach(w => w.terminate());
      resolve({ meta: m.meta, secs: m.secs, parts: n, restored: !!m.restored });
    })().catch(err => { if (finished) return; finished = true; stop(); reject(err); });
  });

  return {
    done,
    get parts() { return n; },
    cancel() {
      if (finished) return; finished = true;
      stop();
      rejectDone(new Error('cancelled'));
    },
    ask,
    close() { owner.terminate(); for (const p of pending.values()) p.reject(new Error('closed')); pending.clear(); }
  };
}
