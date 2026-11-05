# Part C Phase 11: the phone on the new planner (singles, behind the beta)

The launch plan (`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at 90fcb10, section 4, Phase 11,
recast by D58) holds, as D59 amends it: "Just do phones for 45 points anyway" (5 Nov), so the phone solves at 45 points
without the solve on the maintainer's phone first, and its memory is measured in the harness's browser only. Step U built
the phone's layout (the four places, Your plan as a deck, the levers in a sheet, the status line, the request per version).
`SOLVER` and `PLANNER_BETA` stay false on `main`. Box: one day.

## 1. The grid (B10, D59): 45 points, on request

- The app solves at its own 45 wealth points (`src/solverSettings.js` APP_POINTS) on every device. A phone asks first:
  "Solve my plan" in the status line and on the card, "It can take several minutes on a phone" (step U); no expected time is
  shown, since D59 skips the measurement on a real phone that the time was to come from.
- `research/tests/phone-grid.test.mjs` (the full tier): the grid is 45 points; the site's page passes the solver no options
  of its own; no line under `src/` sets `points` from the device; a solve's key carries the grid, so a solve stored on one
  device is the same on any other. Its three plants each fail exactly their own check (`results-phone-grid.txt`).

## 2. Memory (D59: in the harness's browser)

- `research/ui-harnesses/phone-memory.cjs` (a measurement, EXPLORATORY, not a gate): the switch-on site at the app's own
  settings, a Pixel 7's screen, a library household; the page's and its workers' memory
  (`performance.measureUserAgentSpecificMemory`, which the page's isolation allows) before the solve, with the solve on show,
  with a locked position (the dial at 3: the solve on show and its base) and back at the default
  (`results-phone-memory.txt`).

## 3. The harness: the phone at four times CPU throttle, the bytes recorded

- `research/ui-harnesses/phone-perf-ui.cjs` section 5 (REQUIRED with the rest of the harness): on a build with the new
  planner, opted in, a Pixel 7 at 4x CPU throttle presses "Solve my plan" and waits for every path in. The solve runs in the
  solver's workers, the main thread's long tasks stay under the section's ceiling (set from ten runs, above the worst by more
  than half the spread, as the projection's line is), and the bytes the page and its workers fetched are recorded. On the
  site's build it says the new planner is not there. Planted once (`PHONE_PERF_PLANT=hogmain`: the main thread held on every
  message from the solver's workers), the long-task check fails (`results-phone-perf-planner.txt`).

## 4. Found on the way, fixed here

- **One solve keyed twice** (found by item 2's run): a solve's key (`src/solverKey.js`) read the plan's aims and locks as
  stored, so the quick start's plan (no `solver` section) and the same plan once the dial, a Config choice or the limits
  card had written the defaults beside it keyed apart, though the solver reads them the same. The first touch of the dial
  solved the plan again, and a dial position never found its base in the store: S116 at 45 points, the dial at 3 solved its
  base again before the position (`results-phone-memory.txt`, the first run, on the code before the fix). The key now fills the
  aims and locks with their defaults and leaves out the view of whose money (a couple's display).
  `research/tests/solve-key.test.mjs` (the full tier), over all 210 single households, plant `raw` (the key as before) failing
  checks 2 to 5 (`results-solve-key.txt`).

- **The failure view's money chart** named your current approach's bands as the solved plan's as well (step U's
  screenshots): it now draws them alone, as your current approach's. `solver-planner-ui` check 11, plant `failboth`
  (`results-planner-failchart.txt`).
- **Each pot's contribution and its yearly increase** (the maintainer, trying step U's preview: "There's no setting for
  contribution per year and increase in contribution per year for each wrapper"). They are in You, Your money, as LAYOUT.md
  section 3.2 has it, but the quick start does not ask for them (LAYOUT.md section 5), the contribution boxes were drawn grey
  beside white balances, and the increase was headed "Percentage increase". In the new planner the contributions are drawn
  like the balances and the increase is named "Contribution increase"; the quick start points to Your money. The classic
  planner is as it was. `solver-planner-ui` checks 7 and 13, plants `contribold` and `nocontribhint`
  (`results-planner-contrib.txt`).
