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
2. **An edit's tables are kept from the LAST year it touches, not the first.** The tables are solved backwards: year t
   reads year t + 1. An edit that changes years up to k changes every table at or before k and none after it. And every
   edit that moves the grid (its unit is the spending target at the start, its top six times the opening wealth or sixty
   years of it, `grid.js` makeGrid) changes every table.
3. **A balance-only edit re-solves nothing only when the grid does not move.** The opening balances set the top of each
   wealth axis whenever six times the opening wealth exceeds sixty years of spending. Below that, whether nothing else in
   the solve reads the balances is a claim to test, not assume.

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
- `src/solver/diff.js` `keepAfter(prev, next)`: null (nothing to re-solve), or the last year the edit touches (re-solve that
  year and every year before it), or -1 (everything). Its test: the solves it says it may skip are the same bit for bit.
- The partial re-solve (`opts.reuse`) only if 7b's identity test passes on the candidate's path; otherwise every edit that
  is not balance-only re-solves whole, and the note says so.
- Tables cached in IndexedDB under the plan's hash, the options' hash and `SOLVER_VERSION`; the latest plan only (a
  candidate solve at 45 points is about 261 MB of tables in Chromium, `results-n7-check.txt`). Its test: a restored
  result chooses the same move as the solved one at every decision of a set of paths.

**7c. The locks** (box: one working session).
- `plan.solver.locks` in `normalizePlan`: `pensionBefore` (an age or null), `tierCeiling` per wrapper, `lumpSum` ('free',
  'never', 'now'); absent, every solve and every engine run the same bit for bit. Each lock shrinks the move menu, never
  adds to it. Its test: each lock respected on every path the engine runs, and every table the same with no locks.

## Deferred to Phase 12 (the maintainer's call then)

Cross-origin isolation in production. GitHub Pages cannot send the two headers the split needs (COOP and COEP); Cloudflare
Pages and Netlify can (a `_headers` file), and on Pages a service worker can add them. Until then the preview server sends
them for the harnesses, and the deployed app, with the switch off, is unchanged.
