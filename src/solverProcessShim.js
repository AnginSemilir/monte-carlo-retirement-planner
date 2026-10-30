/*
 * A `process` for the solver's worker. src/solver reads two research switches from process.env as its modules load
 * (fast.js SOLVER_FOLD_K, grid.js SOLVER_CLAMP and SOLVER_INTERP); a browser has no process, so they would throw. With an
 * empty env every switch takes its default, which is what the research solves run. Imported before the solver, as
 * workerShim.js is before App.jsx: ES imports are evaluated in order, so an assignment in the worker itself would run too late.
 */
globalThis.process ??= { env: {} };
globalThis.process.env ??= {};
