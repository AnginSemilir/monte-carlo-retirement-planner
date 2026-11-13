/*
 * THE SOLVE STATE OF THE PLAN ON SCREEN (Part C Phase 7, research/solver/PHASE-7.md).
 *
 *   const { solveState, solveMeta, progress } = useSolver(plan, SOLVER, E, opts);   // E: App.jsx's engine, for the solve's key;
 *                                                                                   // opts: null in the app (a harness's light
 *                                                                                   // settings in a preview build, PHASE-8.md)
 *
 * key: the key of the solve in hand (Phase 8's state line carries it, for its harness). ask(kind, extra): the question to the
 * worker that holds the solve in hand (src/solverWorker.js: 'strategy', for the Strategy tab, Phase 9), present once solved;
 * strategy(plan, seed, upto) the same figures with the paths shared across a split solve's parts (src/solverClient.js). storeNote: why the solve in hand was
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
import { PLANNER_PLANT } from './plannerPlant.js';

export const loadSolverClient = () => import('./solverClient.js');
// the harness's way in to the built site's lazy chunk, which nothing loads while the switch is off
// (research/ui-harnesses/solver-progress-ui.cjs)
if (typeof window !== 'undefined') window.__solverHarness = loadSolverClient;

const QUIET_MS = 800;
let isolationAsked = false;

/*
 * `hold` (step U, LAYOUT.md section 4.1: a phone's request is per version of the plan): with hold and a solve in hand, each
 * change still takes its key, and a key other than the solve's marks it 'stale' and starts nothing (a solve still running for
 * an older version is let go); with hold and nothing in hand, nothing runs and no solver code is fetched. Lifting hold solves.
 */
export function useSolver(plan, enabled, engine, opts = null, hold = false) {
  const [state, setState] = useState({ solveState: 'idle', solveMeta: null, progress: null, key: null, storeNote: null });
  const job = useRef(null), jobKey = useRef(null), had = useRef(false);
  useEffect(() => {
    if (!enabled) return undefined;
    if (hold && !had.current && !job.current) return undefined;
    let live = true;
    const timer = setTimeout(async () => {
      const client = await loadSolverClient();
      if (hold) {
        const key = await client.keyOf(engine, plan, opts || {});
        if (!live || key === jobKey.current) return;
        if (job.current) { job.current.cancel(); job.current.close(); job.current = null; jobKey.current = null; }
        setState(s => (s.solveMeta && !s.solveMeta.error ? { ...s, solveState: 'stale' } : { ...s, solveState: 'idle', progress: null }));
        return;
      }
      // with the first solve the page asks for cross-origin isolation, so later solves can split (Phase 10, B5): where the
      // host sends no headers, a service worker adds them and the page reloads once (src/isolation.js)
      if (!isolationAsked) { isolationAsked = true; client.ensureIsolation(); }
      const key = await client.keyOf(engine, plan, opts || {});
      if (!live || key === jobKey.current) return;
      setState(s => (s.solveState === 'idle' && !s.solveMeta ? s : { ...s, solveState: 'stale' }));
      if (job.current) { job.current.cancel(); job.current.close(); }
      // a couple's plan (Part D, D5.1): each person's table solved in turn, each with its own dial base, then the couple assembled
      // (src/solverClient.js startSolve's `couple`); the household's plan has no base of its own
      const isCouplePlan = !!(plan && plan.demographics && plan.demographics.planningMode === 'couple');
      const base = isCouplePlan ? null : await client.baseOf(engine, plan, opts || {});
      if (!live || key === jobKey.current) return;
      let kept = null;
      const h = client.startSolve(plan, { ...(opts || {}), key, base, ...(isCouplePlan ? { couple: { engine } } : {}), onProgress: progress => { if (job.current === h) setState(s => ({ ...s, progress })); }, onStored: (stored, why) => { kept = stored ? null : why; if (job.current === h) setState(s => ({ ...s, storeNote: kept })); } });
      job.current = h; jobKey.current = key;
      setState(s => ({ ...s, solveState: 'solving', progress: null, key, storeNote: null }));
      try {
        const res = await h.done;
        if (job.current === h) had.current = true;
        // the solve answers only for a plan whose key is its own (step U): between an edit that moves the key and the state
        // turning stale (the quiet time, then the key), the page's effects ask about the edited plan, and the old tables would
        // answer for it; such an ask is refused as 'closed', which every caller lets pass. A change that keeps the key (the
        // guardrails, say) is answered: its comparison re-runs. The plant 'staleask' lifts the guard (solver-planner-ui, 12).
        const mine = async pl => PLANNER_PLANT.has('staleask') || !pl || (await client.keyOf(engine, pl, opts || {})) === key;
        const refuse = () => Promise.reject(new Error('closed'));
        if (job.current === h) setState({ solveState: 'solved', solveMeta: { ...res, key }, progress: null, key, storeNote: kept,
          ask: async (kind, extra) => ((await mine(extra && extra.plan)) ? h.ask(kind, extra) : refuse()),
          strategy: async (pl, seed, upto, o) => ((await mine(pl)) ? h.strategy(pl, seed, upto, o) : refuse()),
          actions: async (pl, seed, n) => ((await mine(pl)) ? h.actions(pl, seed, n) : refuse()) });
      } catch (e) {
        if (job.current === h && e.message !== 'cancelled') { jobKey.current = null; setState({ solveState: 'idle', solveMeta: { error: e.message }, progress: null, key }); }
      }
    }, QUIET_MS);
    return () => { live = false; clearTimeout(timer); };
  }, [plan, enabled, engine, opts, hold]);
  // the workers and their tables let go when the planner unmounts
  useEffect(() => () => { if (job.current) { job.current.cancel(); job.current.close(); } }, []);
  return state;
}
