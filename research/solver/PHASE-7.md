# Part C, Phase 7: the plumbing (the build note)

`PART-C-PLAN.md` item 2, after N7 (skipped, D45). Everything here sits behind `const SOLVER = false` in `src/App.jsx`: with
the switch off the app is the app of today, byte for byte in what it computes, and its first load fetches no solver code.
One pull request to `main` at the end (D41 (4)), after `bash research/ui-harnesses/run-all.sh 4173` prints ALL REQUIRED
GREEN with the switch off.

## What the code changes in the archived plan's design

Read against the code on 30 Oct, three parts of the archived Phase 7 do not hold as written.

1. **The tables stay in the worker.** The archive sends the tables back to the page as transferable buffers. But a table
   is a policy only together with its model (`r.m` holds the engine's functions, `r.c` the compiled context), and neither
   crosses a worker boundary. So the worker that solved keeps the result and answers the questions asked of it (simulate
   the solved plan, this year's move); the page holds only `solveState` and `solveMeta`.
2. **An edit could keep the tables after the LAST year it touches, not the first.** The tables are solved backwards: year t
   reads year t + 1. An edit that changes years up to k changes every table at or before k and none after it. And every
   edit that moves the grid (its unit is the spending target at the start, its top six times the opening wealth or sixty
   years of it, `grid.js` makeGrid) changes every table.
3. **A balance-only edit re-solves.** The opening balances set the top of each wealth axis whenever six times the opening
   wealth exceeds sixty years of spending; and whatever the grid, the objective weighs the estate against the opening wealth
   (`solve.js`, `scale`), and the bridge reader and the cash buffer read the balances. So every balance moves the tables
   (step 7b).

## The steps, each with its test and its time box

**7a. The worker, the split, the state, the switch** (box: one working session).
- `src/solverApp.js`: the app's entry (outside `src/solver`, whose every file the e3pcls pin fingerprints). The candidate's options (`candidate.json`) and O60's tier returns as constants,
  `candidatePlan`, and one `solveForApp(E, M, plan, { lambda, points, e2, progress })` that prepares the plan as the research
  does (guardrails and the lookahead off; twice is once on all 420 library households). Its test, `solver-app.test.mjs`: its
  options and returns the same as `research/solver/candidate.mjs`'s and its hash `CANDIDATE_HASH`, a planted copy that
  differs caught; its solve the candidate's bit for bit.
- `opts.progress(done, total)` in `solve.js`, called once per solved year and by the adaptive reference's build. Its test:
  every table the same bit for bit with it and without it, on the product's path and the candidate's; the e3pcls pin
  retaken.
- The browser split (E2 in the page): `src/solverPool.js`, every part's tables carved from one growable
  `SharedArrayBuffer` in the same order, so no part waits on a message for a buffer (a browser worker cannot take one
  synchronously, as Node's `receiveMessageOnPort` does). With no message to check each table against, the last part to reach
  each barrier compares every part's count and offset. Needs cross-origin isolation; without it the solve runs whole in one
  worker. Its test, `solver-app.test.mjs` on Node's worker threads: the tables the same split two and three ways as whole;
  planted, a part that drops its cells, one that carves a table the others do not, one that throws.
- `src/solverWorker.js` and `src/solverClient.js` (lazy; the fingerprint in `src/solverDigest.js`): solve with progress, cancel (the workers terminated), simulate the
  solved plan with the engine's `monteCarlo` under `withTable`.
- `src/App.jsx`: `const SOLVER = false` beside `SHOW_INHERITANCE`, and `solveState` / `solveMeta` through `src/useSolver.js`,
  which does nothing with the switch off. `main.jsx` installs it (`src/solverState.js`): the engine's workers import
  `App.jsx`, and through the hook would bundle the solver's worker, which imports `App.jsx` again (Vite refuses the circle).
- Harness `research/ui-harnesses/solver-progress-ui.cjs` (REQUIRED), on the built site: no solver code fetched at load; a
  solve in the browser's worker with its progress rising to the end; its tables the same as Node's bit for bit; a
  simulation of the solved plan the same as Node's; cancel; split and whole the same where the page is isolated.

**7b. Staleness and the cache** (box: one working session).
- No edit keeps the tables but changes nothing the solver reads. The objective weighs the estate against the opening wealth
  (`solve.js`, `scale`), and the bridge reader and the cash buffer read the opening balances too, so a balance edit moves the
  tables like any other (`solver-cache.test.mjs` check 3). The partial re-solve (keep the years after the last one an edit
  touches) is not built: it would save time only on edits confined to early years, at the risk of reading stale reader
  tables, adaptive reference or next-year caches, and it can come later if the solve's wait proves long.
- `src/solverKey.js`: the solve's key, the SHA-256 of the plan as the solver takes it and the settings, keys sorted. The same
  key, the same tables; any other, a new solve, the old result shown as stale meanwhile (`src/useSolver.js`).
- `src/solverCache.js`: the latest solve in IndexedDB under its key and the code that made it (the worker's fingerprinted
  URL), with a small key record beside it so the page can ask without loading tables. `solve.js` `opts.restore` and
  `adaptive.js` `restore`: each year's cells copied in where the cell loop would solve them, the rest of the year as always.
  Its test, `solver-cache.test.mjs`: a restored solve the solved one bit for bit (tables, the reference, every path
  runPolicy runs, the engine's simulation), with and without the tier state, through a structured clone; a planted stored
  value caught; the key's properties. The harness: stored, restored after a reload with Node's tables, an edit solved afresh.
- `src/solverSettings.js`: the settings without the solver, so the page names a solve without loading it; the dial's
  positions, 1, 3, 6 and 10 times lambda (D46).

**7c. The locks** (box: one working session).
- `plan.solver.locks` in `normalizePlan` (App.jsx `normalizeSolverLocks`), kept only where a plan carries them: on the
  library's 420 households a plan without them normalises with no `solver` key, as before. `pensionBefore` an age or null,
  `tierCeiling` per wrapper (pen, isa) a tier or null, `lumpSum` 'free', 'never' or 'now'.
- Applied as the solver prepares the plan (`src/solverSettings.js` `lockedPlan`), so the engine that runs the solved plan
  holds to them too, and no solver code changes: the pension access age raised to `pensionBefore` (never lowered); the
  pension's or ISA's tier lowered to its ceiling where riskier, and the tier above switched off (`riskAbove: false`); the
  drawdown strategy set by `lumpSum` ('free' keeps the plan's own: the solver does not choose the lump yet, the lump sum's
  route being the maintainer's call, D41 (5)). Each shrinks what the solver may do; applied twice is applied once; the
  solve's key carries them.
- Its test, `solver-locks.test.mjs`: each lock held on every year of 200 engine paths of its solved plan on S126, and the
  same check on the solve without the lock finding it broken (so it can see a breach); locks all free leave every table
  as without them; each lock another key.

## Deferred to Phase 12 (the maintainer's call then)

Cross-origin isolation in production. GitHub Pages cannot send the two headers the split needs (COOP and COEP); Cloudflare
Pages and Netlify can (a `_headers` file), and on Pages a service worker can add them. Until then the preview server sends
them for the harnesses, and the deployed app, with the switch off, is unchanged.
