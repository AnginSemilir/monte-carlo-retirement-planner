# Review of the classic planner's retirement (D155), a change of default

Subject: D155, the classic planner retired and the new planner the app's only planner: commit b612be65 on
claude/fervent-goodall-e2mrnf against its parent 9d04859a; the plan `research/solver/CLASSIC-RETIRE.md` and its as-built
note; STATE.md's D155 line (section 3) and its build record (section 5, the Running line). Read as committed; nothing here
reads B1's gate, which was running in the main tree while I worked.

## What I read

- **The ruling and the plan:** STATE.md e6704d90257c (D155; section 5's Running line, l.292; the decided-defaults block);
  CHECKLIST.md; `research/solver/CLASSIC-RETIRE.md` 07cccc832165 (the gate, l.49-66; the acceptance test, l.68-75; the box,
  l.77-80; as built, l.82-103); the commit message.
- **The code:** `src/App.jsx` 04c235656903 against 9d04859a's (the UI half's 158 hunks: every hunk that adds a line in
  full, and the opening lines and enclosing condition of each hunk that only removes); `src/Shell.jsx`, `src/Docs.jsx` 049ac38d72bd, `src/PlannerCards.jsx`
  dd9247bf6e9a, `src/PlannerPlan.jsx` c38faafd7163, `src/PlannerStart.jsx` 194cabe6b582, `src/PlannerMore.jsx` 75be872bf5aa,
  `src/mcWorker.js` 24bf94b644a9, `src/SolverSimple.jsx`, `src/phone.jsx`, `src/nav.jsx`, `src/tabs.jsx`, `src/actionPlan.js`,
  `src/ui.js`, `src/glossary.jsx`, `src/workerShim.js`; `vite.config.js` 2248ba5d4a31; `research/build-engine.py`;
  `research/solver/code-id.mjs`, `e3pcls-pin.mjs`, `e3pcls-pin.json`.
- **The gate and its checks:** `research/ui-harnesses/run-all.sh` 1d1a4322af27 (and 9d04859a's 6983b19cb8f3);
  `phone-ui.cjs` 41880230765d (25d2f5e5f1ce), `desktop-reach-ui.cjs` a2646e6ded78 (57cb42181d6e),
  `restyle-regression-ui.cjs` 5469cfa85ccf (49129a7c8fc8), `phone-perf-ui.cjs` fa2e5f6f6e0c (d401d94f4e70), `numbers-ui.cjs`,
  `load-perf-ui.cjs` 81a644dec3cd, `production-build-ui.cjs` 9d82c6127097, `solver-progress-ui.cjs`, `solver-isolation-ui.cjs`
  f6b868cb4976, `solver-strategy-ui.cjs` c977608eaef5, `solver-config-ui.cjs`, `solver-planner-ui.cjs` 5b543b39b460,
  `solver-fullscale-ui.cjs`, `lib/probes.cjs`; the fifteen retired harnesses at 9d04859a; `research/solver/launch-ready.mjs`
  a2340753197d and `research/tests/launch-ready.test.mjs` 2f433577e71c.
- **The other tests changed:** `safety.test.mjs`, `cache-key.test.mjs`, `pension-route.test.mjs`, `household.test.mjs`,
  `optimality.test.mjs`, `fast-inputs.json`.

## What I ran

On `git archive` copies of b612be65 and 9d04859a in my scratchpad (node_modules linked from the main tree), and a shared
clone at b612be65 for the tests that read git. Nothing in the main tree was touched; no timing harness was run.

- **Builds:** the shipped build and the light build (the gate's `LIGHT`) of b612be65, both clean; the parent's shipped build.
  The workers' bundles (mcWorker, solverWorker) carry no `new Worker` and no `startSolve`. The light and shipped builds have
  the same stylesheet (index-Dupha_0w.css), every lazy chunk the same once chunk names are normalised, and an entry differing
  only in `SOLVER_OPTS`'s literal (and what folds from it).
- **Lint:** `npx oxlint -D no-undef src`: every undefined name is a browser or Node global, the parent's set less
  `cancelAnimationFrame`. Every export removed from `src` is imported nowhere in `src`, `research`, `scripts` or CI.
- **The engine:** `research/build-engine.py` on each App.jsx: the two `engine.mjs` differ in the comment at
  `reliefTaxOnlyOf` and the three pass-through strings (`PASS_WORDS` and the two warnings), nothing else. `code-id.mjs`:
  3d4bb0353ea5 (the parent d3d5295b01b1). The e3pcls fingerprint 0648e94bd5312a2d on both trees;
  `node research/tests/solver-e3pcls.test.mjs 4` on b612be65: 27 passed.
- **Tests (the clone):** `launch-ready.test.mjs` 10 passed, 0 failed (its 'onepass' plant failing line 1 alone);
  `safety.test.mjs` 13 passed (five hostile cases now applied, one refused); `cache-key.test.mjs` 8 of 8, and under
  `CACHE_KEY_PLANT=url` checks 1 to 6 FAIL; `pension-route.test.mjs` ALL PASS, 10 of 10; `solver-isolation-ui.cjs` under
  `PLANNER_PLANT=blanksolve` (port 4321, its bare server on 4330): its new check 1 FAILS ("1 registrations"), so it can fail.
  The readiness checklist's row reader against run-all.sh's own `printf` rows: `phone` reads `pass` without matching
  `phone-perf`, a row of the pass not run reads `absent`.
- **Probes** (Playwright scripts in my scratchpad, the light build of b612be65 served on :4321 unless said): every section of
  You and Details on an iPhone 13 and a Pixel 7 in both themes (overflow, contrast, 44px); the full documentation at 1400 in
  three themes and on a phone; the parent's desktop-reach guardrails and lookahead checks and its docs-contents check, its
  narrow-window check, and its phone-ui checks of the phone form, each run on the planner; the failure view's figure with and
  without `?forceMain=1`; Your plan's card state at the moment restyle-regression measures it; the first load's script bytes on
  each commit's shipped build (served on :4322 and :4323, now stopped). Results are in the findings.
- **Not run:** `load-perf-ui.cjs` and `phone-perf-ui.cjs` (as asked), the gate itself, the fast and full tiers. When I wrote
  this the gate in the main tree had finished its shipped pass and its light pass through solver-isolation with no failure
  printed, and was on solver-projection; solver-planner had not started.

Verdict: FAIL

## What holds

- **Nothing the planner uses was removed** (item 1). Both builds and the lint are clean; no removed export is imported
  anywhere; every App.jsx hunk that adds a line keeps what the new planner rendered (`want` for Details, the warnings banner
  now unconditional where its old condition was always true in the planner, `effectiveMaxVisibleAge`, the chart box, You's
  sections, `assumptionCards` without the region as Details called it); the removed blocks sit under conditions the planner
  never met (`!solverOn`, classic tab ids that `PLACE_OF` maps away, `dashboardMode`, the sandbox). `const SOLVER = true;` and
  `const SOLVER_OPTS = null;` are as written, `vite.config.js` still refuses a build where either line moved, and the workers
  do not reach the solver's client. The mcWorker's one remaining job ('stats') is the only one the page asks for.
- **The engine** (item 2): as claimed, to the line; code id and pins as claimed; e3pcls 27 passed.
- **The new words** (item 3): the couples card's "See it in Details" opens Details on the ledger of your current approach
  (solver-planner check 10 reads `data-audit-ledger` 'yours'); the failure card's line sits over the current approach's
  figures (solver-strategy section 4 waits for them); the quick start's couple line sends to You; Clear all inputs in Details
  is the classic handler less the sandbox's state. The engine strings no page shows (`policyPlaybook` l.6869 and l.6965,
  `ESTATE_ASSET_KINDS` l.4776): no page or worker calls those functions, so leaving them keeps `engine.mjs` and the code id,
  which is right.
- **The two passes** (item 4): the as-built reason for the shared checks on the light build is sound on the bytes: the same
  stylesheet and the same chunks, the solve's settings alone differing. A pass run alone prints "the light pass alone, not the
  gate" and never "ALL REQUIRED GREEN", and the readiness checklist's line 1 needs "; the gate, both passes".
- **The changed and added checks** (item 5): load-perf's 176KB is the measured figure plus one (175KB and 172KB, finding 5);
  production-build's heading check reads the visible heading's own weight class (a fresh visitor's quick start heading,
  `font-medium`, 500, where a heading the built utilities miss reads the browser's 700) and that the screen readers' h1 is
  hidden, so it fails where the utilities do not apply; solver-isolation's check 1 fails on its plant (above); solver-strategy
  section 4 and solver-planner checks 10 and 11 are real checks of the new paths.
- **The readiness checklist** (item 6): the row reader matches the new table; retiring line 8 is what D155 says (the switch
  it read is gone). **The other tests** (item 7): as claimed. No decided default moves (the decided-defaults block has no
  planner key; the couples' rollback stays).

## Findings

1. **BLOCKING. The gate no longer makes checks the classic mode made of features the planner keeps, and one of them fails
   today.** CLASSIC-RETIRE.md's acceptance test 1 (l.70-71) is "every check of a feature the new planner keeps still made",
   its gate section (l.58-59) names "the contrast, overflow and touch targets" among them, and STATE.md's record (l.292) says
   "the checks the classic mode made of features the planner keeps, ported"; D155 retires only "the harnesses that test only the
   classic planner". The parent's classic-mode harnesses ran over render functions the planner still uses (`historyView`,
   `assumptionCards`, `auditCard`, `Docs`, You's phone form, the projection worker), and the ports keep only part of what
   they checked:
   (a) **Details' other sections at a phone's width.** Parent phone-ui l.158-184 (two phones, two themes) and restyle-regression
   (390px, three themes) measured the Config, Historical Backtest and Documentation tabs for overflow, contrast and, on the
   phones, 44px. Ported, both visit each place's first view only (phone-ui l.84, restyle-regression l.77), and at a phone's
   width Details shows one section, Year by year (probe: `["ledger"]` at 390 with touch). Run on Details' other sections, the
   phone check fails now: **History check, 48 controls under 44px on the iPhone 13 and the Pixel 7 in both themes**, every one
   a cell of the history strip's decade grid (24x44 on the iPhone; `src/PlannerMore.jsx` l.429-431, whose own comment gives
   "about 28 by 40"). Assumptions and How the solver decides: 0 failures.
   (b) **The full documentation.** Parent restyle-regression measured the Documentation tab (contrast, overflow) at both
   widths in three themes, phone-ui l.199-201 that its cards fold on a phone with the text kept, desktop-reach l.229-240 that
   its contents list has one entry per card and an entry jumps to its card. No ported harness presses "Read the full
   documentation" except solver-planner check 17, which reads words. Probe: 0 contrast failures in three themes, 0 overflow,
   10 entries for 10 cards, the fifth entry's card at 0px, on a phone 10 folds closed and 2,766px.
   (c) **The ledger's columns and the documentation links.** Parent desktop-reach l.630-672 and l.686-730: no Guardrail column
   with the rule off; with it on, a column naming the years it acted and not every year; the Set aside column with figures
   only in the years before a cost, each naming it, gone at 0; each Documentation link landing on its card. Made nowhere now
   (solver-planner check 7 flips the guardrails and reads the comparison only). Probe, through You's controls and Details'
   "Your current approach" ledger: all hold (20 of 51 rows acted; 2043 to 2046 "for 2047"; gone at 0; doc-guardrails at 0px).
   (d) **You's phone form.** Parent phone-ui l.925-1036: rows with the label left and one control edge, explanations a tap
   away, a new band as a row of three fields, a folded explanation, each wrapper a card with its tier, six chips, a chip
   setting the tier and folding, an income stream's start age floored at retirement and snapping back. Ported: the 16px inputs,
   the section tabs and the swipe only. Probe on the Pixel 7: all hold.
   (e) **The projection worker.** Parent phone-perf sections 2 and 3: a worker ran, and its answer equalled the main thread's
   (`?forceMain=1`). The 'stats' job is now the failure view's, behind a silent main-thread fallback (`src/App.jsx`
   `runMonteCarloAsync`, l.7553), so solver-strategy section 4 and solver-planner check 11 pass whether or not the worker ran
   or agreed. Probe: 87% both ways, the mcWorker started in the first only.
   (f) **A narrow window with a pointer keeps the desktop layout** (parent desktop-reach l.106-115, at 683 and 700). Probe:
   holds.
   So the gate as built passes with (a)'s cells present, and would pass a regression in any of (a) to (f). To answer it: port
   (a) to (f), which pass today but for (a); for (a), either cells of 44px or the equivalent exception in `TOUCH_PROBE` as
   desktop-reach got it (finding 3), the Start year controls on that page clearing 44px there (the probe flags neither); or put
   the narrower gate to the maintainer and say so in the plan's acceptance test and in STATE.md.

2. **MINOR. Five visible lines of the documentation still send a visitor to places that are gone.** `src/Docs.jsx` l.78
   ("Set the pension death-tax haircut in Config"), l.138 ("any employer NIC pass-through set in Config"), l.241 ("held flat in
   real terms at the Config figures"), l.179 and l.181 ("the Expected line on the Projection chart", "the rate-based band on the
   Projection chart"), all rendered once "Read the full documentation" is pressed. The record and the plan (l.25-26) say shared
   text naming a classic tab now names a place. solver-planner check 17 does not see them: its list (l.173) has "Config tab"
   and "Projection tab", not "in Config", "the Config figures" or "the Projection chart".

3. **MINOR. The equivalent-control exemption is WCAG 2.5.8's equivalent in substance, with two loose ends.** `SMALL_24`
   (desktop-reach l.36-52) skips a small target only inside a container that names a selector, and only while
   `document.querySelector` of it is at least 24 by 24; with both Start year inputs removed the probe flags 96 strip buttons at
   22x24, so it cannot hide the strip once no equivalent is on the page. But the selector `input[aria-label="Start year"]`
   matches two controls and resolves to the first, the "Start Year:" number box (App.jsx l.8577, 64x26), not the slider the
   strip's comment and the record name (l.8590, 1156x24, exactly at the bar); both pick the same year over the same range, so
   the exception holds either way. And it exempts anything placed in the strip's grid later, with no plant in the harness to
   show its boundary (I showed it by hand, above).

4. **MINOR. The ported "renders its own content" markers are drawn by App.jsx before a place's card arrives.** In
   restyle-regression and phone-ui (l.42-47 in each), /Your plan/ is met by the place's own `<h1 className="sr-only">`
   (App.jsx l.9608), /What if/ by its h1 (l.9628), /Year by year/ by Details' section control (l.7387). The check cannot fail on a
   card that renders empty without throwing, and the waits end at once: at the moment restyle-regression measures Your plan the
   card was 'solving' in all three themes (probe), so its contrast is measured on the progress state. Measured once done, Your
   plan, What if and Details show no contrast failure and no overflow in any theme, so nothing is hidden today; the as-built
   note's reason for the light build ("a place shows its solved content in seconds") is not what these waits use.

5. **MINOR. The "before" figures of the first load are not the parent's.** STATE.md and CLASSIC-RETIRE.md (l.95-96) give 239KB
   and 235KB before. On 9d04859a's shipped build, counted as load-perf counts (each script's transferSize until
   `[data-plan-answer]` or `[data-quick-start]`, a Pixel 7 context, vite preview): 241KB for a fresh visitor and 238KB for a
   saved plan, over the same three and two scripts, so the parent sat over its own 240KB ceiling (D154 (3)'s engine growth,
   never gated). The figures after hold: 175KB and 172KB on b612be65, so 176KB is the measured figure plus one. None of them
   is printed from a results file (CHECKLIST 6); nothing decides on the "before" figure.

6. **MINOR. "Written before any of it is built" has no record.** The plan (l.3) and the whole build are one commit, b612be65,
   where the plan's box (l.79-80) has the build committed in steps with the planner's harnesses green on each; by the agent's
   account solver-strategy, solver-projection and solver-planner had not run on the final code when it was committed, so the
   plan's acceptance test 1 rests on the gate now running.
