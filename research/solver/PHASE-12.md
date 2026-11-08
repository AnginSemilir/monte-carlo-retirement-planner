# Part C Phase 12: the rollout (singles; the opt-in between the two planners)

The launch plan (`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at 90fcb10, section 4, Phase 12,
recast by D58) and LAYOUT.md (`research/reviews/2026-11-03/LAYOUT.md` sections 2.1, 3.4, 8, 11.2 and 13). Box: two days, plus
the two weeks of the beta. The beta starts by R6: the opt-in goes on `main`, off by default, when the readiness checklist prints
all PASS. Where the plan and the code differ, the code holds; each such place is said below and in the pull request.

## 1. The rename pass

- **The tournament's words never reach the new planner.** Details' "How the solver decides" opens the full documentation
  (`src/Docs.jsx`), which the classic planner shares. In the new planner (`planner="new"`) it leaves out what only the classic
  planner has: the Projection tab's three stages, the tournament and its recommended policy, and the coverage section's line on
  the tournament's contributions. Where a kept section names a classic tab (Plan Inputs, the Config tab, the Strategy tab) it
  names the new planner's place (You, Your current approach, Details' Assumptions). The classic planner keeps every word.
- **Docs gains "How the solver decides"** (`doc-solver`, first in the new planner's documentation): how the solved plan is
  worked out, the order of what matters (not running out, then spending, then a small weight on the estate), where the figures
  come from, and the glossary's words in use.
- **The coverage card lists the solver's approximations**: one list (`src/solverApproximations.js`) for Details' coverage
  card and the documentation's coverage section: the wealth grid, the returns read at a few points, the gain in other
  investments read at three levels, the solver's forecast against the simulation, the plan's end and the age weights, one
  person, the lump sum, the simulated markets. Each line is a fact of the code, named in the file's header.
- **The glossary** is LAYOUT.md section 8's, in Details (step U built it; Phase 12 checks it).
- **The test:** `solver-planner-ui` check 17: no tournament word ("tournament", "recommended policy", "bridge safety margin")
  and no classic tab's name on any of the four places with the full documentation open; the documentation leads with how the
  solver decides; the coverage card lists the approximations; the glossary's four words. Plant `tournamentdocs`.
- **What its first run found, fixed:** the tournament's bridge safety margin and its line on the emergency buffer in Details'
  Assumptions (B13 and LAYOUT.md section 3.4 have it hidden in the new planner; step U had left it showing); the levers'
  two help lines naming Plan Inputs (now You); You's harvest line sending the reader to the estate optimiser on the Strategy
  tab (the clause left out in the new planner); and the documentation's one-off cost section naming the Strategy tab's
  instruction sheet (in the new planner, Details' year by year). The classic planner's words are unchanged.

## 2. The harnesses

Tournament, tradeoffs and priorities run on the classic planner (step U took them out of the switch-on exceptions, D58). The
launch plan's F14 also says "Phase 12 points them at a couple's plan": during the beta the classic planner keeps the tournament
for every plan, so they test it as visitors meet it; pointing them at a couple's plan belongs with the switch's removal for
singles (the maintainer's), after which only couples meet the tournament (D42). The code holds.

## 3. The opt-in (B6): it switches between the two planners

- `SOLVER` and `PLANNER_BETA` are true in `src/App.jsx`; `rp_planner` is `'classic'` unless set, so every visitor sees the
  classic planner, the app with the switch off bit for bit, until they press "Try the new planner (beta)" (the classic header,
  and the phone's More sheet); "Classic planner" in the new planner's header comes back (step U built both).
- **The rollback** ("one deploy turns it off for everyone"): `PLANNER_BETA` false gives everyone the classic planner whatever
  `rp_planner` says, with no opt-in.
- **The preview plugin retires** (the launch plan's F9: once the switch read true it would have stopped every build). What is
  left in `vite.config.js` acts only in a harness's build (`SOLVER_HARNESS=1`): its light settings (`SOLVER_HARNESS_OPTS`), the
  rollback (`PLANNER_BETA_OFF=1`) and the planted faults (`PLANNER_PLANT`). The Vercel preview's own switch went with it: a
  preview link now builds what `main` builds.
- **The workers read the switch off.** The engine's workers import `App.jsx` for the engine; with the switch on in the source
  they reached the solver's client and its worker, a circular worker import Vite refuses. Before Phase 12 every worker build
  read the switch off (the preview plugin acted in the page's build only), so `vite.config.js` keeps that for the worker builds:
  the engine's two workers are byte for byte the bundles they were; the solver's worker differs only in dead code it carries.
- **The gate's two modes are the opt-in's two states** (`run-all.sh`): the classic mode (the default) builds the site exactly
  as it ships and runs the harnesses of the classic planner and of what every visitor loads, with phone-perf's classic sections
  and load-perf (whose one run measures both first loads on the site's own build); the new mode (`--new`) builds the same source
  at the harnesses' light settings and runs the new planner's harnesses, each opting in on the build it makes, and phone-perf's
  section 5 on the served build. A harness not run in a mode is listed with the mode that runs it; `--both` runs the two.
  `--solver` is retired. The code holds: there is no switch-off build any more, so each harness runs in the state it tests.
- **The tests:** `solver-planner-ui` check 15 (the opt-in both ways, the saved plan as it was each time, a reload keeping the
  choice; plant `optinloses`) and check 16 (the rollback build: a visitor who opted in sees the classic planner and no opt-in;
  plant `betaignored`).

## 4. The diagnostic (F17)

- "Copy the details for a bug report" on the failure card and in Details' solver settings (`src/DiagnosticCopy.jsx`, a lazy
  chunk). The text (`src/solverDiagnostic.js`) is built from a whitelist, never the record or the plan whole: the solver's code
  (its module-graph key, which the worker now reports with each solve), the key's hash (its first 16 hex digits), the state and
  whether it completed, the levers' positions (the dial; the aims' words; the limits' words and ages; the floor as a share of the
  target), the grid, the times, the parts, whether the page was isolated, the browser's name and version, and the error's text
  with every number of 100 or more taken out. Each field's value is checked against its form; anything else is written "other".
  The browser, isolation, parts and state are beyond the launch plan's list (the code version, the key's hash, the levers'
  positions, the grid, the times, the error text): none carries an amount, and each says where a solve failed. The code holds.
- **The test:** `solver-diagnostic.test.mjs` (the full tier): amounts planted in the record, the plan and an error, each in
  five written forms, none in the text; the whitelist in order and nothing else; the error's numbers; values not of their form;
  the kept fields' forms. Plant `whole` (the record appended whole) fails checks 1 and 2. On the page, `solver-planner-ui`
  check 18 (Details on a solved plan, and the failure card; plant `diagwhole`).

## 5. The readiness checklist

`research/solver/launch-ready.mjs` prints each line PASS or FAIL from results files, on the release commit: each file names
the code it ran on by a stamp of the files that make the site (`launch-stamp.mjs`), so a result on other code never counts.
Its own test (`launch-ready.test.mjs`): a clean release's files all PASS; six planted faults each fail exactly their lines.
The launch plan's ninth line, a solve in Safari and in Firefox, is excluded by the maintainer (D60, 6 Nov: "exclude safari
and firefox checks"), so the checklist has eight.

| line | results file | made by |
|---|---|---|
| 1. run-all.sh green in both modes | `results-gate-classic.txt`, `results-gate-new.txt` | `run-all.sh 4173 --both` on the release commit |
| 2. both CI tiers green on the release commit | `results-ci.txt` | `ci-record.mjs` from the runs' JSON as GitHub reports them |
| 3. the full-scale browser solve | `results-fullscale.txt` | `solver-fullscale-ui.cjs`: S116 at 45 points, the site as it ships, Node's tables bit for bit, the times |
| 4. the library sweep | `results-library-sweep.txt` | `library-sweep.test.mjs` checks 1 and 2 (plants `needsolver`, `lumpthrow`) |
| 5. L4 and L5 read, R1 to R3, the reports | `results-levers.txt`, `results-costs.txt`, their reviews, STATE.md | the reads of 1 and 2 Nov |
| 6. old exports import | `results-library-sweep.txt` | `library-sweep.test.mjs` check 3 |
| 7. the isolation, failure-path, phone and new-planner harnesses | the gate's files | solver-isolation, solver-planner (check 11), phone, phone-perf |
| 8. the opt-in on and off without losing a plan | the gate's files | solver-planner (check 15) |

**What the full-scale run found, fixed (6 Nov).** Its first run on the release's code stopped with "solver part 2710 failed":
the harness read `--parts` at its index plus one without checking it was given, so run with the port alone it read the port
and told the page to split the solve 4,173 ways. The harness reads it only when given now, and `cli-options.test.mjs` (the
full tier) scans every research script for the class: on the code before the fix it names the harness's line, on the fix
none (`results-cli-options.txt`). The site's code is not touched. Run again: the page's tables Node's bit for bit, 86 s
split four ways against Node's 306 s on one core (`results-fullscale.txt`).

**Safari and Firefox: excluded (D60).** WebKit and Firefox cannot be installed here (Playwright's own builds are not to be
installed; Ubuntu's Firefox is a snap), so the line was to be the maintainer's devices, as the launch plan allows; the
maintainer excluded it. What was built for it stays, unused: the page is in the release's code, and removing it is a later
change of the site's code with its own gate. `public/browser-check.html`, copied into
the build as it is (the app's pages carry none of it), loads the app in a hidden frame and solves one library household (S116)
at the app's own settings through the harnesses' way in, without a key, so nothing is stored and the visitor's plan and choice
of planner are left as they were; it shows a block to copy back. `browser-results.mjs` reads each block against the same page's
Chromium run (same solver code, 45 points, the same seed and 5,000 markets; survival within 1.96 standard errors of a
difference; the tables' fingerprint reported, not required). Removed on 8 Nov by the maintainer's ruling (D62), the page
with its Chromium harness (`browser-check-ui.cjs`) and its reader (`browser-results.mjs`), in the site change that carried
D62's other items through B1's gate; they are in git at 0ee3a3b for a later check of another browser.

## 6. The beta

The opt-in goes on `main` with this phase's pull request, so by R6 that merge waits for the checklist's all PASS on the release
commit (its eight lines, D60). Then the two weeks; go or no-go is the maintainer's list (no open defect that
changes a figure, the checklist green on the final commit); on by default and the switch's removal stay the maintainer's.
