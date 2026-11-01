/*
 * THE SOLVE STATE OF THE PLAN ON SCREEN (Part C Phase 7, research/solver/PHASE-7.md).
 *
 *   const { solveState, solveMeta, progress } = useSolver(plan, SOLVER, E, opts);   // E: App.jsx's engine, for the solve's key;
 *                                                                                   // opts: null in the app (a harness's light
 *                                                                                   // settings in a preview build, PHASE-8.md)
 *
 * key: the key of the solve in hand (Phase 8's state line carries it, for its harness). ask(kind, extra): the question to the
 * worker that holds the solve in hand (src/solverWorker.js: 'strategy', for the Strategy tab, Phase 9), present once solved. storeNote: why the solve in hand was
 * not kept on this device (the store's quota, say; src/solverCache.js), or null. A dial position above 1 solves its base
 * first (step L2; src/solverClient.js baseOf).
 * solveState: 'idle' (the switch off, or nothing solved yet), 'solving', 'solved', or 'stale' (the plan changed since its
 * solve; the old result stays on show, marked so, until the new one is in). With the switch off it does nothing at all and
 * loads no solver code. On, each change of the plan waits a moment for the typing to stop and takes its key (src/solverKey.js:
 * the plan as the solver takes it and the settings). The same key as the solve in hand changes nothing. Any other cancels a
 * solve still running and starts the new one, which restores a stored solve of that key or solves it (src/solverClient.js).
 * There is no edit that keeps the tables but changes the key: the solver reads the opening balances too (PHASE-7.md).
 */
import { useEffect, useRef, useState } from 'react';

export const loadSolverClient = () => import('./solverClient.js');
// the harness's way in to the built site's lazy chunk, which nothing loads while the switch is off
// (research/ui-harnesses/solver-progress-ui.cjs)
if (typeof window !== 'undefined') window.__solverHarness = loadSolverClient;

const QUIET_MS = 800;

export function useSolver(plan, enabled, engine, opts = null) {
  const [state, setState] = useState({ solveState: 'idle', solveMeta: null, progress: null, key: null, storeNote: null });
  const job = useRef(null), jobKey = useRef(null);
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    const timer = setTimeout(async () => {
      const client = await loadSolverClient();
      const key = await client.keyOf(engine, plan, opts || {});
      if (!live || key === jobKey.current) return;
      setState(s => (s.solveState === 'idle' && !s.solveMeta ? s : { ...s, solveState: 'stale' }));
      if (job.current) { job.current.cancel(); job.current.close(); }
      const base = await client.baseOf(engine, plan, opts || {});
      if (!live || key === jobKey.current) return;
      let kept = null;
      const h = client.startSolve(plan, { ...(opts || {}), key, base, onProgress: progress => { if (job.current === h) setState(s => ({ ...s, progress })); }, onStored: (stored, why) => { kept = stored ? null : why; if (job.current === h) setState(s => ({ ...s, storeNote: kept })); } });
      job.current = h; jobKey.current = key;
      setState(s => ({ ...s, solveState: 'solving', progress: null, key, storeNote: null }));
      try {
        const res = await h.done;
        if (job.current === h) setState({ solveState: 'solved', solveMeta: { ...res, key }, progress: null, key, storeNote: kept, ask: (kind, extra) => h.ask(kind, extra) });
      } catch (e) {
        if (job.current === h && e.message !== 'cancelled') { jobKey.current = null; setState({ solveState: 'idle', solveMeta: { error: e.message }, progress: null, key }); }
      }
    }, QUIET_MS);
    return () => { live = false; clearTimeout(timer); };
  }, [plan, enabled, engine, opts]);
  // the workers and their tables let go when the planner unmounts
  useEffect(() => () => { if (job.current) { job.current.cancel(); job.current.close(); } }, []);
  return state;
}
