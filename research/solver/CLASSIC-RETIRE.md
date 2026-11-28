# Retiring the classic planner (D155)

Written 27 Nov (night), before any of it was built, and committed with the build in one commit, b612be65 (the fix round,
MINOR 6). The maintainer: "We don't need the classic anymore, just the new one"
(D155). This is a change to the app, not a research run: it moves no figure the solver or the engine computes, and it is
reviewed as a change of default before B1's gate.

## What goes

- **The choice and the rollback.**
  - In `src/App.jsx`: the choice between the two planners (`rp_planner`, `readPlanner`, `plannerOn`, `setPlanner`), the
    rollback that gives everyone the classic planner (`PLANNER_BETA`, `BETA_ON`), and their plants (`classicdefault`,
    `optinloses`, `classicfetch`, `betaignored`).
  - In `vite.config.js`: `PLANNER_BETA_OFF`.
  - `const SOLVER = true;` stays as written, and so does the form of `solverOn` that folds to false in the engine's workers.
- **The ways across.** The "Classic planner" buttons, "Try the new planner", the quick start's and the failure card's
  classic links, and the couples' rollback paths into the classic planner.
  - Under the couples' rollback, a couple's plan is shown under the app's own rules in the new planner, as the failure card
    shows a plan it cannot solve. The words are the agent's draft and the maintainer's to change.
- **The classic planner's pages.**
  - The tabs: Start here, Config, Projection, Strategy, Inheritance, and the classic History, Audit and Docs tabs.
  - Their state, helpers and components.
  - The Simple page (`src/Simple.jsx`, `src/simWorker.js`, Shell's crossover). The quick start replaced it.
  - The pieces only those pages use: the parts of `SolverSimple.jsx`, `phone.jsx`, `nav.jsx`, `tabs.jsx`, `actionPlan.js`,
    `mcWorker.js`, `ui.js` and `glossary.jsx` that nothing else imports.
- **The classic planner's words.** Docs' classic sections and arms. Shared text that names a classic tab ("Config", "Audit
  Data Table"), including the engine's own words for the pass-through, which name Details, Assumptions instead.
  `DEPLOY.md` and `REVIEW-GUIDE.md`.
- **The harnesses that test only the classic planner, and the gate's classic mode.**

## What stays

- **The engine** (App.jsx's engine slice, `research/engine.mjs`). Every engine function stays, the tournament's and the
  inheritance optimiser's among them, because the research and its tests use them. The only engine change is the
  pass-through's words.
- **`src/evolve.js`** (the research uses it) and **`src/simplePlan.js`** (the quick start uses it).
- **Everything the new planner uses.**
  - The inputs form and the advanced inputs (You).
  - The controls of "Your current approach".
  - The assumptions, the number format and the tax region.
  - The history and the audit table (Details).
  - The failure view's projection, the scenarios, and the files (export, import, CSV).
  - The hidden phone tab strip.
  - The warnings.
  - `PLACE_OF`, which sends the shared links to Details.
- **"Clear all inputs"**, which only the classic planner offered. It moves into the new planner beside the files.
  Renaming or overwriting a saved scenario, which only the classic planner offered, goes with it.
- **The couples' rollback switches** (the guard and the cut, D155).

## The gate

B1's gate runs the new planner alone (D155, amending D19 and B1). `run-all.sh 4173`, the command CLAUDE.md names, runs two
passes:

1. **The site exactly as it ships** (`npm run build`). It runs the checks that only the classic mode made on that build,
   each moved onto the new planner:
   - production-build: the site and its workers answer.
   - load-perf: the new planner's first load and its ceiling.
   - The shared checks that the classic harnesses made of features the new planner keeps (the number format, the
     contrast, overflow and touch targets), where the new harnesses do not already make them.
2. **The new planner at the harnesses' light settings**, as `--new` runs it now.

The harnesses that test only the classic planner, and `lib/classic-default.cjs`, are removed; git keeps them.
`solver-planner-ui.cjs` checks 14 to 16 and their plants go, as do the classic sections of the other new-mode harnesses.

`research/solver/launch-ready.mjs` reads the one gate file (lines 1, 7 and 8), with its test. `solver-fullscale-ui.cjs`
finds its quiet page in the new planner.

## The acceptance test

1. `bash research/ui-harnesses/run-all.sh 4173` prints ALL REQUIRED GREEN, every check of a feature the new planner keeps
   still made, on the build as it ships or the harnesses'.
2. The fast tier and the full tier are green.
3. `research/engine.mjs` is the code before's to the byte, apart from the pass-through's words.
4. `npm run build` and the lint are clean, and no file imports a removed one.
5. The reviewer on the change of default.

## The box

A day and a half from 27 Nov (night). Built in steps, each committed with the new planner's harnesses green on it. If the
box runs out, the step that is done stays and the rest is reported to the maintainer.

## As built (28 Nov)

Where the build differs from the plan above, and why:

- **The shared checks run in the second pass, on the light build.** The plan put them on the site as it ships. They are
  checks of the page (contrast and overflow in every theme, the 44px and 24px targets, the number format, the glossary
  terms, You's sections), and the light build is the same source with the solve's settings lightened, so a place shows its
  solved content in seconds rather than minutes. The first pass carries what only the shipped build can show: its stylesheet
  and authoring tools (production-build), its first load and ceiling (load-perf), and its solve's plumbing (solver-progress).
- **The harnesses ported, each to the new planner's four places:** restyle-regression, numbers, phone, desktop-reach,
  production-build, load-perf, solver-progress and phone-perf (its section 5 alone; sections 1 to 4 timed the classic
  planner's "Run the projection"). Retired whole: sandbox-step, simple-extras, mc-reveal, crossover, tradeoffs, priorities,
  simple-closecall, tournament, the five inheritance harnesses, closecall, doc-landing and `lib/classic-default.cjs`.
- **load-perf's ceiling lowered** to the new first load's figure plus one (`176`KB: `175`KB for a fresh visitor, `172`KB for
  a saved plan, against `241`KB and `238`KB on 9d04859a, over its own `240`KB ceiling; `results-first-load-d155.txt`), so it
  guards the first load again.
- **The engine's change** is the pass-through's three strings and one comment: the comment on how relief at source is priced
  (the second look on D154 (3), MINOR 2, carried here so the code id moves once).
- **One finding of the ported checks:** Details' history strip has start-year columns narrower than WCAG 2.5.8's 24px on a
  desktop, and cells under 2.5.5's 44px across on a phone. The Start year box and slider above it pick the same year, the
  criterion's equivalent control: each column and cell names them (`data-target-equivalent`), and the target probes skip
  one only while a control it names is on the page at the bar (the fix round, MINOR 3).
- **The readiness checklist's line 8** (the opt-in switched on and off without losing a plan) retires with the switch.

## The fix round (28 Nov), on the reviewer's FAIL

The reviewer on the change (`reviews/2026-11-28-classic-retire.md`): FAIL, one BLOCKING and five MINOR, answered in one round
(D81 (F)). The checks' record is `results-d155-fixround.txt`; the first load's is `results-first-load-d155.txt`.

1. **BLOCKING: the classic mode's checks of kept features, ported.** Each is now made on the planner, and each passes
   (the second look found two not so, below: (e)'s checks could not fail on a worker that fails, and the classic tabs'
   screen caps, the fourth thing (a)'s loop measured, were not ported; the second fix round answers both):
   - (a) every section of You and Details, on the two phones in both themes (overflow, contrast, 44px: phone-ui) and at
     390px in three themes (overflow, contrast: restyle-regression). The history check's start-year cells are under 44px
     across on a phone (`24` by `44` on an iPhone 13, `27` by `44` on a Pixel 7); the Start year box above them is their
     equivalent (above). Planted, the Start year controls hidden (`PHONE_PLANT`, `REACH_PLANT` = noequivalent), the history
     check's 44px check fails on each phone and theme, and desktop-reach's 24px check on Details, nothing else.
   - (b) the full documentation: contrast and overflow in three themes at both widths (restyle-regression); its cards
     folded on a phone with the text kept (phone-ui); its contents list, one entry a card, an entry jumping to its card
     (desktop-reach).
   - (c) the ledger of your current approach (desktop-reach, on the classic planner's own household for these checks):
     the Guardrail column through You's real switch, naming the years the rule acted and not every year; the lookahead's
     Set aside column, five years by default, figures only before the cost, each naming it, gone at 0 through the field;
     each control's Documentation link landing on its card.
   - (d) You's phone form (phone-ui): rows with the label left and one control edge, the explanations a tap away, a new band
     as three fields, an income stream's floor and snap-back, a folded explanation's first lines, the wrapper cards and their
     six chips. The classic form's sections were held to two screens and a half with no long drop-down. Ported to the
     form's own content (`1660`px: the classic page's `1800` less the `140` it drew above and below a section, the planner's
     You heading starting every section `266`px lower), every section passes. What the planner adds to the form is measured
     and reported, not held to that bar: Your current approach's controls in Advanced and the solver's limits as drop-downs.
     Both go to the maintainer (`DECISIONS-PENDING.md`).
   - (e) the projection's worker, on the failure view, the one job it still runs: it ran, and the same page forced onto the
     main thread (`?forceMain=1`) starts none and gives the same chance (solver-strategy section 4).
   - (f) a narrow window with a pointer, at 683 and 700, keeps the desktop layout (desktop-reach).
2. **MINOR 2:** the documentation's five lines reworded: the pension death-tax haircut, the pass-through and the CGT figures
   are in Details, Assumptions; the Expected line and the rate band were the Projection chart's, which no page draws, so the
   two sentences say what the rates do. solver-planner check 17's list now catches any Config by name and the Projection
   chart: on b612be65's build it finds the five, on this code none.
3. **MINOR 3:** the equivalent is declared on each start-year cell rather than on the strip's container, so nothing else in
   the strip is exempt. It names both Start year controls, and a cell is skipped while either is on the page at the bar. The
   plants above show where it stops.
4. **MINOR 4:** each place's "own content" is an element its own card draws, not the place's heading. Your plan is measured
   on its answer, its first paths in, not its progress (the last paths change the same card's figures and draw nothing new,
   and take four minutes a page at the light settings). Measuring the answer found Your plan's "In shares" strip putting a `70`% label at `3.85`:1 in the
   light theme and `3.93`:1 in sepia, under `4.5`:1. The probe had read it as `1`:1, because the shade is a layer beside the
   label and not its parent. Now:
   - the probe reads a layer painted under the text (`lib/probes.cjs`);
   - each label carries a quarter of the colour opposite its own behind it (`src/PlannerMore.jsx`, the agent's choice, the
     maintainer's to change);
   - `research/tests/strip-contrast.test.mjs` holds every share from 0 to 100 in every theme, the weakest at `4.82`:1.
     Planted without the backing, `55` shares fall under the bar.
5. **MINOR 5:** the first load before was `241`KB for a fresh visitor and `238`KB for a saved plan, measured by 9d04859a's
   own load-perf on its own build: over its `240`KB ceiling, D154 (3)'s engine growth, which no gate measured. After, it is
   `175`KB and `172`KB.
6. **MINOR 6:** the plan and the build are one commit, b612be65, so "written before any of it is built" has no record in
   git. The plan's "built in steps, each committed" did not happen. solver-strategy, solver-projection and solver-planner
   had not run on b612be65's code when it was committed; the gate runs them on the fix round's.

## The second fix round (28 Nov), on the reviewer's second look (D156)

The reviewer's second look (`reviews/2026-11-28-classic-retire-2.md`): FAIL, two BLOCKING and four MINOR, standing after one
fix round, so the maintainer's (D81 (F)): "Second fix round, all six (Recommended)" (D156), each answered as the reviewer set
it out. The checks' record is `results-d155-fixround-2.txt`, on this round's light build.

1. **BLOCKING 1: the projection worker's checks fail on a worker that fails.** solver-strategy section 4's Worker wrapper now
   counts the projection worker's own answers, each message from it carrying a run's figures, and the failure card carries
   the run's whole figures (`data-failed-figures`: the chance unrounded and every year's band; `src/PlannerPlan.jsx`). The
   first check passes only when the worker answered the page itself; the second holds the page forced onto the main thread
   (`?forceMain=1`) to the worker's run to the bit, not to the card's whole percentage. On this code the worker answered once,
   and the main thread's chance and its `40` years of bands are the worker's exactly. Planted, each fails its check alone:
   'mcfail' (the worker started, then failing, the page finishing on the main thread) the first, its answers `0` with the
   chance still shown; 'mcseed' (the worker asked on the next seed) the second, where both pages show `95`% (the whole
   percentage the old check compared) but the unrounded chances are `94.70` and `94.96` and all `40` years' bands differ.
2. **BLOCKING 2: the classic tabs' screen caps.** phone-ui holds each section of Details to the cap of the classic tab that
   carried it, converted as You's form is (a cap of c screens is c times the screen's height less the `140`px the classic page
   drew around a tab's content): Year by year to the Audit Data Table's `1.8` screens, the history check to the Historical
   Backtest's `2.6`, Assumptions to Config & Assumptions' `2.0`, and the full documentation, from its contents to its last
   card, to the Documentation tab's `2.2`. The content the classic tab carried is held to the cap; what the planner adds or
   shows open is measured and reported beside it, not gated: the history check's strip of every start year (`553`px), and in
   Assumptions Tax rules open (`386`px; the classic Config folded it on a phone), Display's heading with the theme (`152`px)
   and the solver's settings (`174`px). Every section passes on both phones in both themes. On the iPhone 13 the history
   check's classic part is `1163` of `1586`px and Assumptions' `843` of `1188`px; whole, they are `1716` and `1555`px, over the
   caps. Planted ('nolengthsub', the additions left in), exactly those two checks fail on the iPhone 13 in both themes. The
   additions go to the maintainer with You's (`DECISIONS-PENDING.md`).
3. **MINOR 3:** You's phone form is checked on both phones in both themes, as the classic Plan Inputs was. Every check passes.
   Advanced's report on the iPhone 13: Your current approach's controls add `1224`px, the section `1974`px, the page `2380`px.
   On the Pixel 7: `1112`, `1846` and `2252`px.
4. **MINOR 4:** at 390, restyle-regression measures every slide of Your plan's deck, each shown with its own content (slide 2
   the spending's chart, 3 the money's, 4 the "In shares" strip, 5 the next ten years, 6 the run pot by pot, 7 the comparison
   with your current approach). Answering it found the desktop's check short as well. The card reads 'filling' once its first
   paths are in; the typical run's cards (the next ten years, the strip, the run pot by pot) come with the next question to
   the solve, within a second on a quiet machine and later under load. So the desktop's measurement on 'filling', the first
   fix round's, could come before them: on b612be65's build, where the strip's `70`% label is under the bar, this round's
   first desktop runs, with other pages solving beside them, passed, the strip not yet on the page (section 3b: the strip
   absent at 'filling' under load, there on a quiet machine). Now the desktop's Your plan waits for those three cards by
   their own marks, with a check that they are drawn.
   On b612be65's build the harness catches the label on the desktop and on slide 4, in the light theme at `3.85`:1 and in
   sepia at `3.93`:1, and nothing else (section 3a). This year's actions and the rule of thumb come after the last paths,
   minutes later at these settings, and are not measured here; the header says so.
   The answer's wait is ten minutes, not three: with three of this round's runs solving at once on four cores, one page's
   solve took longer than three.
5. **MINOR 5:** the contrast probe composites only a layer painted beneath the text. The layer must be drawn (not visibility
   hidden, not display none), the text's element at that level positioned, and the layer's z-index not above that element's.
   A veil over the text is read through, as before the first fix round, so pale text under it still fails. restyle-regression
   first runs the probe on a page of planted layers. Two backing layers, the strip's shape and a label above its layer by
   z-index, are composited: white on the indigo shade passes. Two veils and a hidden layer are not composited, so their pale
   labels are flagged at `1.37`:1, as is the same label under no layer. Planted ('layerall', the first fix round's rule),
   that check fails. An ancestor's opacity is still read by neither rule.
6. **MINOR 6:** phone-ui holds the history check's chart on a phone to the screen: `388` of `390`px and `410` of `412`px. Its
   expand button opens it at full screen, the dialog `390` by `664`px and `412` by `839`px, the viewport's, and Escape closes
   it. Planted ('halfchart', the dialog at half the screen's height), the height check fails on each phone and theme.

**The gate's one failure on the first fix round's code.** solver-projection's check that Details' year by year is the solved
plan's ledger read your current approach's: the solved ledger had not come within its two minutes. Run alone on a quiet
machine, the check passes (the ledger the solved plan's, every total and move Node's). The cause is the order of the solve's
questions. Once its paths are all in, Your plan asks the solve's worker for this year's actions and the rule of thumb, `1,000`
paired paths each (`src/PlannerPlan.jsx`), and the worker answers in turn. The ledger asked behind them waited for them, and
with the machine loaded beside the gate (the reviewer's runs) that took longer than two minutes. The page says so while it
waits: its heading reads "Your current approach, year by year, on the expected returns", under it "The solved plan's year by
year is being worked out; your current approach's is shown until it is in." The harness now waits for Your plan's last two
answers before opening Details, so the ledger has its two minutes to itself, and it prints how long each took: run with two
restyle-regression runs solving beside it, the two answers came `150`s after the card's last paths and the ledger at once
after them (section 4b).
