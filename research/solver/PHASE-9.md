# Part C Phase 9: the Strategy tab (singles), behind the switch

The launch plan (`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at 0e24e1b, section 4, Phase 9;
D51) holds; the wording is `PART-C-WORDING.md`, decided as B4. With `const SOLVER = false` the app is as before. Under the
switch a single household's Strategy tab is the solved plan; a couple's keeps the tournament with a line (D42), and so does
a solve that failed (F16).

## What is built

- `src/solverStrategy.js` (the worker's, and the tests'): every figure is the engine's own simulation of the solved plan
  (`E.stepYear` with the table as the plan's policy; runTrial's failure rule; summarizeTrials's quantile), never the table's
  forecast. `strategyRuns` runs paths `from..to-1` of a seed through both arms, the solved plan and the plan as entered (D18's
  baseline, as the projection runs it); `joinRuns` gathers parts in path order; `strategySummary` gives:
  - the headline: the safe starting spend (the first retired year's level: for a household retired, the table's first move;
    for one still working, the median over the paths alive then, "when you retire"), the year a typical run is back at
    target (each path's first retired year at the target or above before it fails, the median over the paths; a path that
    fails first counts as never), the chance the money lasts, and the spending delivered beside it; its case (B4): at the
    target or above, a short dip (back within three years), a long one, never back;
  - the comparison on the same paths: survival, the median and unlucky-tenth pot, the median lifetime tax, the median
    estate net of the pension's death tax;
  - the late raise (wording section 4): the first year the fan's upper quartile spends above the target, only where the
    paths alive then mostly survive (the presentation rule).
  - `actionsOf`: this year's move taken apart (the spending level, the draw order's start, the re-wrap, each wrapper's
    tier), each part's skip the best-scoring move this year that differs in that part (the table's own ranking at the
    opening position), then the plan; its cost the paired survival on n paths, in points.
  - `aheadOf`: the next ten years' moves on the median path (the path at the median of the pot left).
- `src/solverWords.js`: the table of strings (B4): the headline's words by case, the short note and the full text, the late
  raise, the actions in the playbook's words, the next years, "come back next year".
- `src/solverWorker.js`: `strategy` (the paths kept and added to, so 2,000 then 5,000 costs 5,000), `actions`, `ahead`, and
  `runs` (a part's share of the paths). The split simulation (`src/solverClient.js` `strategy`): a split solve keeps its
  parts, each holding the solve; the paths not yet run are shared out evenly, the owner taking the first share, and the owner
  joins them in path order. Without parts (a page not isolated, or a restored solve) the owner runs them all.
- `src/useSolver.js`: `ask` on the solve in hand. `src/SolverStrategy.jsx`: the tab, lazily loaded; `App.jsx` shows it under
  the switch for a single household. A harness's light settings may name fewer paths (`SOLVER_OPTS.strategySteps`,
  `strategyActionsN`).

## Tests

- `research/tests/solver-strategy.test.mjs` (the full tier): runPath is runTrial path for path and compareOf is
  summarizeTrials on both arms (S002 retired, S188 working); the headline's rules at their edges on hand-made paths; the
  late raise; strategyOf against monteCarlo on the same seed; parts joined in path order give the whole run's figures; this
  year's move rebuilt from its index is the engine's own field for field, forcing it is the plan path for path, each skip
  differs in its part and its cost is the paired count; the next years on the median path. Each rule's plant (the module's
  `PLANT`): the dip's edge a year early, the quantile from the top, a failed path counted as back, the raise on every path,
  a part that drops a path, another move forced in the first year.
- `research/tests/sim-split.test.mjs` (the fast tier, D53's `FAST_JOINING`): on Node's worker threads, S126 solved split two
  ways on the arena, each part running its share of the paths: every figure the whole run's; planted, a part leaving out
  its first path is refused (three ways checked once by hand: the same).
- `research/ui-harnesses/solver-strategy-ui.cjs` (REQUIRED): the switch off as today; the preview build's figures Node's bit
  for bit; the words by case on a household for each of the four; a failed solve (the worker planted to fail) with "try
  again" and the tournament below; a couple.

## Still to build in Phase 9

- The skip costs' harness fixture (a known costly action: the pension drawn to the basic-rate limit in a bridge year) and a
  planted dominated action.
- The rule of thumb (`src/solverDistil.js`), which may slip to after the beta without holding anything up.
- The budgets measured on this machine: the headline within 60 seconds of the solve split four ways, the skip costs within
  two minutes more.

Box: three days (the launch plan), from 1 Nov 23:00 UK.
