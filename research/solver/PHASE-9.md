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
- `src/solverDistil.js`, the rule of thumb (item 7; outside `src/solver`, so the e3pcls pin does not move): the solved
  plan's spending level in each retired year of its own paths, learnt as a tree of at most three questions (the years of
  spending the savings hold, the age, the pension's share), on paths apart from those it is judged on; its fidelity the
  share of decisions it gives; its cost the paired survival of following it (the solved plan's move each year with the
  tree's level) against the solved plan; shown only under half a point. On S126 at light settings: 97% of 6,000 decisions,
  shown (it lost no path on 200).
- `src/solverWords.js`: the table of strings (B4): the headline's words by case, the short note and the full text, the late
  raise, the actions in the playbook's words, the next years, "come back next year".
- `src/solverWorker.js`: `strategy` (the paths kept and added to, so 2,000 then 5,000 costs 5,000), `actions`, `ahead`,
  `distil`, and
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
- `research/tests/solver-distil.test.mjs` (the full tier): a known rule of two questions found exactly (planted, one question
  gives fewer); one range per question in its rules; on S126 its decisions, fidelity, paired cost and the half-point rule.
- `research/ui-harnesses/solver-strategy-ui.cjs` (REQUIRED): the switch off as today; the preview build's figures Node's (the
  solved plan's bit for bit, your plan's within a relative 1e-12); this year's actions and the rule of thumb shown exactly
  when under half a point; the words by case on a household for each of the four; a failed solve (the worker planted to fail) with "try
  again" and the tournament below; a couple.

## Built and measured since (2 Nov)

- **The skip costs split across the parts.** They ran in the owner alone; the launch plan splits them four ways. Now each
  kept part runs the skips on its share of the paths (`skipRuns`, the worker's 'skipruns') and the owner joins them in path
  order against the plan's runs it holds (`joinSkipRuns`, `actionsOf`'s `parts`, `src/solverClient.js` actions).
  `research/tests/skip-split.test.mjs` (the full tier): split two and three ways, every skip and cost the whole run's;
  planted, a part leaving out its first path is refused (`results-skip-split.txt`). The strategy test unchanged: ALL PASS 34.
- **The skip costs' fixture: S116.** The launch plan's example, the pension drawn to the basic-rate limit in a bridge year,
  does not arise at the harness's light settings: no library household's first move draws to the basic-rate limit
  (`skip-scan.mjs`: none of the 30 retired in their bridge), and every part's skip on 35 households read -0.67 to +1.33
  points on 300 paths. S116 (61, the state pension at 67) draws the pension to the personal allowance and re-wraps it, and
  cuts its spending to 80%: skipping the re-wrap lost 3 paths and saved none, the cut 4 and none. The harness (section 2b):
  the page's skip costs Node's, the re-wrap's above 0 and the costs not all 0, a planted dominated action (the year's move at
  its highest spending level) at least 0. Its plant (`STRATEGY_SKIP_FIXTURE=S126`, a household whose skips all cost 0): running.
- **The budgets, measured on this machine: NOT MET** (`budget-strategy.mjs`, `results-budget-strategy.txt`; four
  households at the app's settings, split four ways, nothing else running). The headline on 2,000 paths 74 to 121 s after the
  solve, against 60; the skip costs 33 to 173 s more, against 120 (in one worker before the split, 64 to 360). The cause: a
  path of the solved plan costs about 96 ms on one thread at 45 points (the chooser scores 800 moves at each decision, the
  five spending levels since L1's floor; the app's own rules cost 0.4 ms a path), and four threads run at about 1.8 times one
  (a part's path about 218 ms: the tables' reads contend for memory). To the maintainer: (a) Phase 9 merges with the
  budgets recorded as not met, step P's first target the chooser's cost per path; or (b) fewer paths first (the launch
  plan's numbers: the headline's 2,000, the skips' 1,000).

## Seen on the way

- The harness's households were picked at its light settings (4 wealth points). There S380 started at 110% of its target
  while surviving 63%, a "safe starting spend" above the target on a plan that often fails; at the app's own settings
  (45 points, 2,000 paths) it starts at 80% and survives 73.9% (your plan 40.2%), the long dip's case. A coarse table's
  artefact, not the app's; the headline's words were not changed for it.

Box: three days (the launch plan), from 1 Nov 23:00 UK.
