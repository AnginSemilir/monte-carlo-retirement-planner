/*
 * THE SOLVE STATE OF THE PLAN ON SCREEN (Part C Phase 7, research/solver/PHASE-7.md step 7a).
 *
 *   const { solveState, solveMeta, progress } = useSolver(plan, SOLVER);
 *
 * solveState: 'idle' (the switch off, or nothing solved yet), 'solving', 'solved', or 'stale' (the plan changed since its
 * solve, and a new one is about to start). With the switch off it does nothing at all and loads no solver code. On, each
 * change of the plan waits a moment for the typing to stop, cancels a solve still running, and solves the plan afresh in the
 * background (src/solverClient.js, loaded on first use). Phase 7b replaces "afresh" with only what the edit touched.
 */
import { useEffect, useRef, useState } from 'react';

export const loadSolverClient = () => import('./solverClient.js');
// the harness's way in to the built site's lazy chunk, which nothing loads while the switch is off
// (research/ui-harnesses/solver-progress-ui.cjs)
if (typeof window !== 'undefined') window.__solverHarness = loadSolverClient;

const QUIET_MS = 800;

export function useSolver(plan, enabled) {
  const [state, setState] = useState({ solveState: 'idle', solveMeta: null, progress: null });
  const job = useRef(null);
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    setState(s => (s.solveState === 'idle' && !s.solveMeta ? s : { ...s, solveState: 'stale' }));
    const timer = setTimeout(async () => {
      const client = await loadSolverClient();
      if (!live) return;
      if (job.current) { job.current.cancel(); job.current.close(); }
      const h = client.startSolve(plan, { onProgress: progress => { if (job.current === h) setState(s => ({ ...s, progress })); } });
      job.current = h;
      setState(s => ({ ...s, solveState: 'solving', progress: null }));
      try {
        const res = await h.done;
        if (job.current === h) setState({ solveState: 'solved', solveMeta: res, progress: null });
      } catch (e) {
        if (job.current === h && e.message !== 'cancelled') setState({ solveState: 'idle', solveMeta: { error: e.message }, progress: null });
      }
    }, QUIET_MS);
    return () => { live = false; clearTimeout(timer); };
  }, [plan, enabled]);
  // the workers and their tables let go when the planner unmounts
  useEffect(() => () => { if (job.current) { job.current.cancel(); job.current.close(); } }, []);
  return state;
}
