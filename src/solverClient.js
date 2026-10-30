/*
 * THE PAGE'S SIDE OF THE SOLVER (Part C Phase 7, research/solver/PHASE-7.md step 7a). Loaded lazily, by src/useSolver.js when
 * the switch is on, so the first load of the app fetches none of it.
 *
 *   const job = startSolve(plan, { parts, lambda, points, research, onProgress });
 *   const { meta, secs, parts } = await job.done;        // rejects with 'cancelled' after job.cancel()
 *   await job.ask('simulate', { trials, seed });          // the owner worker's answers (src/solverWorker.js)
 *   job.close();                                          // the owner worker, and the solved tables with it, let go
 *
 * A split solve needs a cross-origin isolated page (src/solverPool.js); elsewhere the solve runs whole in one worker.
 */
import { arenaFor, failArena } from './solverPool.js';

export const canSplit = () => typeof SharedArrayBuffer !== 'undefined' && (typeof crossOriginIsolated === 'undefined' || crossOriginIsolated)
  && typeof SharedArrayBuffer.prototype.grow === 'function';
/* gate 5's four cores at most (D11), fewer where the machine has fewer */
export const defaultParts = () => (canSplit() ? Math.max(1, Math.min(4, (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 1)) : 1);
const newWorker = () => new Worker(new URL('./solverWorker.js', import.meta.url), { type: 'module' });

export function startSolve(plan, { parts = defaultParts(), onProgress = null, ...opts } = {}) {
  const arena = parts > 1 && canSplit() ? arenaFor() : null;
  const n = arena ? parts : 1;
  const workers = Array.from({ length: n }, newWorker), owner = workers[0];
  const pending = new Map();
  let seq = 0, finished = false, rejectDone = null;
  const stop = (all) => { if (arena) failArena(arena); (all ? workers : workers.slice(1)).forEach(w => w.terminate()); };

  const done = new Promise((resolve, reject) => {
    rejectDone = reject;
    const ends = workers.slice(1).map((w, i) => new Promise((res, rej) => {
      w.onmessage = ({ data }) => (data.error ? rej(new Error(data.error)) : res());
      w.onerror = e => rej(new Error((e && e.message) || `solver part ${i + 1} failed`));
      w.postMessage({ kind: 'part', part: i + 1, parts: n, arena, plan, opts });
    }));
    const main = new Promise((res, rej) => {
      owner.onmessage = ({ data }) => {
        if (data.id !== 0) {   // an answer to ask()
          const p = pending.get(data.id); if (!p) return; pending.delete(data.id);
          if (data.error) p.reject(new Error(data.error)); else p.resolve(data);
          return;
        }
        if (data.progress) { if (onProgress) onProgress(data.progress); return; }
        if (data.error) rej(new Error(data.error)); else res(data);
      };
      owner.onerror = e => rej(new Error((e && e.message) || 'the solver failed'));
      owner.postMessage({ id: 0, kind: 'solve', plan, opts, parts: n, arena });
    });
    Promise.all([main, ...ends]).then(([m]) => {
      if (finished) return; finished = true;
      workers.slice(1).forEach(w => w.terminate());
      resolve({ meta: m.meta, secs: m.secs, parts: n });
    }, err => {
      if (finished) return; finished = true;
      stop(true);
      reject(err);
    });
  });

  return {
    done,
    parts: n,
    cancel() {
      if (finished) return; finished = true;
      stop(true);
      rejectDone(new Error('cancelled'));
    },
    ask(kind, extra = {}) {
      const id = ++seq;
      return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); owner.postMessage({ id, kind, ...extra }); });
    },
    close() { owner.terminate(); for (const p of pending.values()) p.reject(new Error('closed')); pending.clear(); }
  };
}
