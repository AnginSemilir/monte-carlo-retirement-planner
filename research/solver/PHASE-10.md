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

## Still to build

3. The quick dials re-solve (the base cached, a position one more solve), the live line on request, nearest first.
4. The retirement-age dial (B11): on request, one solve an age.
5. The Simple page's safe spend and safe age: a search over solves on request, its progress shown and answers kept,
   renamed apart from the headline (F12).
6. Scenarios each carry a solve, on request.
7. The audit table gains the action column; history labelled the out-of-model check.
The harness `solver-projection-ui.cjs` covers the projection, the dials, the Simple page's request and the scenarios.
