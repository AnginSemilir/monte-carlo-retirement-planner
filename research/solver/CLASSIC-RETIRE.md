# Retiring the classic planner (D155)

Written 27 Nov (night), before any of it is built. The maintainer: "We don't need the classic anymore, just the new one"
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
  a saved plan, against `239`KB and `235`KB before), so it guards the first load again.
- **The engine's change** is the pass-through's three strings and one comment: the comment on how relief at source is priced
  (the second look on D154 (3), MINOR 2, carried here so the code id moves once).
- **One finding of the ported checks:** Details' history strip has start-year columns narrower than WCAG 2.5.8's 24px on a
  desktop. The Start year slider beside it picks the same year, the criterion's equivalent control, so the strip names that
  control (`data-target-equivalent`) and the probe skips a small target only while the named control is on the page at
  24px or more.
- **The readiness checklist's line 8** (the opt-in switched on and off without losing a plan) retires with the switch.
