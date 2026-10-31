/*
 * THE SOLVE STATE'S HOOK, AS App.jsx CALLS IT (Part C Phase 7, research/solver/PHASE-7.md).
 *
 * The real hook is src/useSolver.js, installed by main.jsx before the first render. App.jsx cannot import it: the engine's
 * workers import App.jsx, and through the hook they would bundle the solver's worker inside their own, which imports App.jsx
 * again (Vite refuses the circle). Installed once, before anything renders, so every render calls the same hook.
 */
const IDLE = Object.freeze({ solveState: 'idle', solveMeta: null, progress: null });
let impl = () => IDLE;
export const installSolver = (hook) => { impl = hook; };
export const useSolverState = (plan, enabled, engine) => impl(plan, enabled, engine);
