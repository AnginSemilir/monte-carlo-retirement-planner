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

## 2. The projection runs the solved plan: built (its first part)

- `App.jsx` `runStageTest`: under the switch, a single household with a solve in hand runs the projection's paths through the
  solved plan (the worker's `simulate`, with the paths for the fan), its survival tile headed "The solved plan" with your
  plan's survival beside it ("as you are now", the same paths and seed) and the typical spending. Where the solved plan's run
  fails, your plan's figures stand. The run goes stale when the plan's solve lands ("The solved plan is ready since this
  run", told apart from changed inputs). With the switch off nothing changes.
- `research/ui-harnesses/solver-projection-ui.cjs` (REQUIRED, switch-off only as it builds its own switch-on preview): the
  switch off shows your plan with no solver line; switch on, a run before the solve lands is your plan's and goes stale when
  it lands; re-run, the solved plan's survival is Node's (98.82% on S126 at light settings) and your plan's beside it Node's
  (94.72%). Shown failing first: the stale note looked for in the wrong view.
- Still to come under this item: the projection's second stage (the most you could spend at the chosen survival) still
  answers for your plan's rules under the switch; item 5's search over solves replaces it. The spending delivered beside
  every survival figure elsewhere on the tab.

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

## 3 and 4. The dial's live line and the age dial: built (their harness sections to run)

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
- `solver-projection-ui.cjs` sections 4 and 5 (to run): the dial's line Node's, the four settings filled nearest first, each
  Node's, choosing Medium giving the figure the list showed and keeping the others; the age dial on S188 the same way.
  Planted (`PROJECTION_PLANT=dialfar`, the settings solved farthest first), the order check is to fail.

## Still to build

5. The Simple page's safe spend and safe age: a search over solves on request, its progress shown and answers kept,
   renamed apart from the headline (F12).
6. Scenarios each carry a solve, on request.
The harness `solver-projection-ui.cjs` covers the projection, the dials, the Simple page's request and the scenarios.
