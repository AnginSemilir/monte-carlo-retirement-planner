# Part C Phase 10: the projection, dials, Simple page, scenarios, audit and history; isolation (singles, behind the switch)

The launch plan (`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at 0e24e1b, section 4, Phase 10;
D51) holds. With `const SOLVER = false` the app is as before: no service worker, no isolation code fetched. Box: four days.

## 1. Isolation (B5): built

GitHub Pages cannot send COOP and COEP, and a solve splits across workers only on a cross-origin isolated page
(`src/solverPool.js` needs SharedArrayBuffer).

- `public/coi-sw.js`: a service worker that re-serves the app's own responses (same origin only) with COOP `same-origin`,
  COEP `require-corp` and CORP `same-origin`. Every asset the app loads is its own, so nothing is blocked.
- `src/isolation.js` `ensureIsolation()`, asked for with the first solve (`src/useSolver.js`, through the solver's lazy
  client, so the page's first load fetches none of it): where the page is not isolated and service workers are available,
  it registers the worker and reloads once when the worker takes control; a page still not isolated after that one reload
  is not reloaded again, and the solve runs whole in one worker (the fallback).
- The switch file: `coi-off` served beside the page, its body the word "off" (so a host's single-page fallback is not a
  switch). Each load under the switch asks for it first: served, the page unregisters its workers, reloads once if one still
  controls it, and registers nothing while it stays; the worker checks it too when it activates.
- `research/ui-harnesses/solver-isolation-ui.cjs` (REQUIRED, switch-off only as it builds and serves its own switch-on site):
  the switch off registers nothing; the switch-on build served with no headers (the harness's own static server, as Pages
  serves it) registers the worker on the first solve, reloads once and is isolated; a plan saved before the worker existed
  still loads; a solve split two ways in the isolated page is Node's whole solve bit for bit; service workers blocked, the
  page is not isolated and the solve runs whole, the same tables; the switch file served unregisters the worker with one
  reload, and nothing registers again while it stays. Planted once (`ISOLATION_PLANT=nosw`, the worker's script left out of
  the site): the isolation and the split fail.
- Other browsers (Safari, Firefox) are checked in Phase 12's solves; where isolation does not hold, that browser solves whole.

## 2. The projection runs the solved plan: built, through the harness

- `App.jsx` `runStageTest`: under the switch, a single household with a solve in hand runs the projection's paths through the
  solved plan (the worker's `simulate`, with the paths for the fan), its survival tile headed "The solved plan" with your
  plan's survival beside it ("as you are now", the same paths and seed) and the typical spending. Where the solved plan's run
  fails, your plan's figures stand. The run goes stale when the plan's solve lands ("The solved plan is ready since this
  run", told apart from changed inputs). With the switch off nothing changes.
- `research/ui-harnesses/solver-projection-ui.cjs` (REQUIRED, switch-off only as it builds its own switch-on preview): the
  switch off shows your plan with no solver line; switch on, a run before the solve lands is your plan's and goes stale when
  it lands; re-run, the solved plan's survival is Node's (98.82% on S126 at light settings) and your plan's beside it Node's
  (94.72%). Shown failing first: the stale note looked for in the wrong view.
- The rest of the item (the second stage and the spending beside every survival figure): "2, the rest" below.

## 7. The audit table and history: built

- `src/solverStrategy.js` `rowsOf(E, solved, market)`: one market's run of the solved plan year by year, the engine's own
  rows (E.stepYear with the table as the plan's policy) and each year's move taken apart (`partsOf`), with E.evaluateRows on
  the solved plan's context; the worker's `rows` (`src/solverWorker.js`).
- The audit table under the switch, a single household with a solve in hand: the solved plan's expected-return ledger, an
  "Action" column with each year's move in the Strategy tab's words, shortened (`src/solverWords.js` `ledgerWords`: the
  spending level where the year has a target, the pension drawn first and to where, the re-wrap, a wrapper moved safer);
  "Your plan" gives your plan's ledger, with its guardrail and set-aside columns. The CSV export is what the table shows.
  Without a solve, or with the switch off, the ledger is your plan's as before.
- History under the switch, with a solve in hand: the solved plan through the start year's real returns, labelled "The
  out-of-model check" (the solver worked the plan out on the model's markets; history is outside them), its verdict on its
  own context, your plan's verdict on the same history beside it.
- `research/tests/solver-rows.test.mjs` (the full tier, `results-solver-rows.txt`): on S126 and S188 at light settings,
  'expected' is E.simulateDeterministic of the solved plan and two start years E.simulateHistorical's, row for row and field
  for field, with their verdicts; each year's spending level is the engine row's and its tiers those the row holds; the
  result survives structuredClone; the words. Its plants (the module's `PLANT`): 'rowsfirst' (the first year's move for
  every year) and 'rowsexp' (the market ignored) each caught. ALL PASS 20.
- `solver-projection-ui.cjs` section 3: the audit table's totals and actions Node's year for year (S126: 40 years, none
  differing), "Your plan" Node's with no action column, history labelled the out-of-model check with the solved plan's
  verdict and pot left and your plan's verdict Node's (from 1965: the pot left 2,610,942); section 1 the switch off as
  before. Planted (`PROJECTION_PLANT=histexp`, the page asking history for the expected path), the history check fails
  (the pot left 2,308,141 against Node's 2,610,942) and nothing else does.

## 3 and 4. The dial's live line and the age dial: built, through the harness

- `src/solverClient.js` `startFigures`: a variant of the plan solved in workers of its own, the Strategy tab's headline and
  comparison run on the plan's own paths and seed, and the workers let go, so only the figures are kept (the launch plan's
  F6). A dial position's base is restored from the store (the store keeps the base beside the latest position), so a
  position costs one solve; the variant itself is neither stored nor restored unless keyed (the dial's Low setting is that
  base). The worker's `strategy` reads `exact`ly the first paths asked for (`headRuns`), so a line read from the solve in
  hand matches its neighbours' whatever the Strategy tab has run since.
- `src/SolverFigures.jsx` `FiguresList`: the line at the plan's own setting from the solve in hand, and on request the other
  settings worked out in the background in a given order, one at a time; kept under the plan with every other input as it
  is, so moving between its settings keeps them and any other edit drops them.
- Item 3, the Config tab: under the dial, "At this setting: start at £X (Y% of target), back at target by YYYY; chance your
  money lasts Z%" (PART-C-WORDING.md section 3, `dialLineWords`), and "Show the four settings", nearest first along the dial
  (`dialOrder`: Low 3, 6, 10; Medium 1, 6, 10; High 3, 10, 1; Very high 6, 3, 1).
- Item 4 (B11), the Strategy tab: "Retiring earlier or later", the solved plan at the plan's own age, and on request the ages
  three either side (`ageOptions`: the nearest first, the earlier first on a tie, none at or before today's age; none for a
  household already retired), one solve an age. On the Strategy tab rather than the sandbox: on a desktop the sandbox is the
  dashboard's narrow rail, and the Strategy tab is the solved plan's own.
- `research/tests/solver-figures.test.mjs` (the full tier): the two orders, each with its plant caught (the later or higher
  first on a tie); atDial and atAge move one input alone; the exact read is a run of that many paths field for field; a
  setting's figures as its job gets them (the base restored from the store's record, then the setting solved on it) are the
  solve in hand's, at Medium and at Low on S126, and an age's on S188; the words. ALL PASS 19.
- Two defects the harness's first run of sections 4 and 5 found (3 Nov), each fixed with a test that catches its class:
  - Two asks for figures at once on one split solve (the Strategy tab and the age dial beside it) both shared out the same
    next paths, and the owner refused the second join (`joinRuns`), which the age dial swallowed: it never drew its line.
    The client now takes the asks one at a time (`src/solverClient.js` `strategy`), and the owner's answer is one function
    (`src/solverStrategy.js` `strategyAnswer`). `research/tests/solver-client.test.mjs` (the full tier): two and three asks
    at once on S126 split two ways, every answer Node's; a share offered twice refused with the paths held kept; planted
    (`PLANT` 'noqueue', the asks at once), the second ask is refused and the check fails.
  - Choosing Medium dropped the other settings' figures: a choice writes every aim with its default (`patchSolver`), and the
    figures were kept under the plan as stored. They are now kept under `dialSig` (the plan at Low with its aims filled in,
    `withAims`; `AIMS_DEFAULT` moved to `src/solverSettings.js`). `solver-figures.test.mjs` section 8: the key the same after
    any setting is chosen from a plan with no aims, some or all, and changed by the estate's weight, the raises and the
    target; planted (`PLANT` 'rawsig', the key from the plan as stored), caught.
- `solver-projection-ui.cjs` sections 4 and 5 (`results-projection-ui.txt`, run h3): on S126 the dial's line at the plan's
  setting Node's (98.9%), the four settings filled 3, 6, 10, each Node's (1: 98.9%, 3: 99.05%, 6: 98.75%, 10: 98.6%), and
  choosing Medium giving the 99.05% the list showed with the other three kept; S126, retired, has no age dial; on S188 the
  age dial's line at 60 Node's (61.4%), the ages filled 59, 61, 58, 62, 57, 63, each Node's (from 45.85% at 57 to 74.05% at
  63). Planted (`results-projection-ui-plants.txt`): 'dialfar' (the settings solved farthest first) fails the order check
  (filled 10, 6, 3) and 'agelate' (the later age first on a tie) the ages' order (61, 59, 62, 58, 63, 57), each line still
  Node's.

## 5. The Simple page's answers from the solver: built, through the harness

- `src/solverSearch.js`: `highestTarget` (from the page's own answer, up or down a fifth at a time to a bracket, then halving
  it to £500; at most 8 solves) and `earliestAge` (from the plan's age, a year at a time; never at or before today's age;
  at most 6 solves), each solve's survival read through an evaluator, each reported as it lands, a survival at exactly the
  goal counted as passing. `research/tests/solver-search.test.mjs` (the full tier): on evaluators with known edges, both
  searches from either side, the cap, nothing passing, the age's bounds, the reports; plants 'gt' and 'nohalve' each
  caught. ALL PASS 11.
- `src/SolverSimple.jsx`, on the Simple page under the switch for one person (App.jsx `solverSwitch`, below the engine's
  export line): "Find the solved plan's answers" runs both searches over solves (`startFigures` on the page's plan at each
  target and age), shows the solve in hand and the last one's survival, and keeps the answers for the inputs they were found
  on; an edit drops a search in flight. Named apart from the Strategy tab's safe starting spend (F12): "Highest target the
  solved plan keeps at 90%" and "Earliest retirement the solved plan keeps at 90%". With the switch off the page is as
  before.
- `solver-projection-ui.cjs` section 6 (`results-projection-ui.txt`, run h4): from the page's £26,000, the highest target
  £31,000 and the earliest age 57, each Node's, every target tried (26,000, 31,000, 37,000, 34,000, 32,500, 32,000, 31,500)
  and every age (60, 59, 58, 57) the same as Node's search; section 1, the switch off, on the Simple page with no card.
  Planted (`results-projection-ui-plants.txt`): 'simpleseed' (the card on another seed) fails it, its target search ending at
  £30,500 against Node's £31,000.

## 6. Scenarios each carry a solve: built, through the harness

- `src/SolverFigures.jsx` `SolverScenarios`, under the scenario comparison on the Projection tab: the plan on screen's line
  from the solve in hand, and "Solve this scenario" for each scenario compared, one solve a scenario in workers of its own,
  its figures kept for the visit by the scenario's plan; a couple's scenario keeps the app's rules (D42).
- `solver-projection-ui.cjs` section 7 (`results-projection-ui.txt`, run h3): S126 and a saved scenario spending £2,000 more,
  the plan's line 98.9% and the scenario's 98.9%, each Node's. Planted (`results-projection-ui-plants.txt`): 'scenseed' (the
  scenario solved on another seed) fails it, the scenario at 98.55% against Node's 98.9%.

## 2, the rest: the second stage and the spending beside survival: built, through the harness

- The "Spend and date" step keeps its figures under your plan's rules, now said so, and offers the solved plan's own: the
  Simple page's search (`src/SolverSimple.jsx` `SolverPlanAnswers`, the same `SolverAnswers` card) on the plan on screen at
  the survival the step is set to, from the page's own safe maximum. `atSpend` scales the spending bands with the target as
  the engine's own spend override scales its schedule (`solver-figures.test.mjs` section 7: path for path on a banded plan
  and a flat one; planted, the bands left unscaled is caught).
- The spending delivered beside every survival figure under the switch: your plan's typical spending beside "as you are
  now" on the survival tile, a "Typical spending" row in the methods table and a tile on the dashboard (the solved plan's,
  with your plan's beside it), and the second stage's and the sandbox's typical spending beside their survival.
- `solver-projection-ui.cjs` (`results-projection-ui.txt`): your plan's typical spending beside "as you are now" Node's
  (29,000; run h3), and the "Spend and date" step's card from the page's safe maximum (£33,000; run h4). Planted
  (`results-projection-ui-plants.txt`): 'yoursdeliv' (the figure taken from another field) fails the spending check.

The harness `solver-projection-ui.cjs` covers the projection, the dials, the Simple page's request and the scenarios;
`PROJECTION_PLANT` takes several plants at once and `PROJECTION_SECTIONS` a subset of the switch-on sections.

## The harness's runs (3 Nov)

- Run h3, the whole harness on the fixed code: every check passed but two, both the harness's own faults: section 2b opened
  the step by the phone's deck bar, hidden at desktop width (d39bbba: the desktop pill, then the safe maximum awaited); and
  sections 1 and 6 stored the page key JSON-quoted where the Shell reads it raw, so they opened the full planner (cd794b9),
  which section 1's switch-off check had passed without testing anything; it now checks the Simple page is up first
  (60de7bd). Run h4, sections 2b and 6 on the fixed harness: both pass (`results-projection-ui.txt`, both runs whole).
- The plants in one run (`results-projection-ui-plants.txt`, on 60de7bd): yoursdeliv, dialfar, agelate, simpleseed and
  scenseed, exactly five checks failed, each its plant's, and every other check passed, section 1 among them; the sixth
  plant, histexp, was shown failing alone (item 7).
- The whole harness runs again on the release head in B1's gate, both modes.
