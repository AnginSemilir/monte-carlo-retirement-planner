# Review of a change of default: D143's go, the household route's classes Y, E, S and G opened (D144)

Subject: the change D144 records, built and not committed in the worktree `/home/user/couples-open-build` (branch
couples-open-build at b2f807b7, the working tree's diff and its four untracked files): the guard (`src/couplesSwitch.js`
`HOUSEHOLD_OPEN`, `householdShapeOf`, `partLimitsDiffer`, `coupleSolverOn`), the client failing closed
(`src/solverClient.js`), the words (`src/PlannerCards.jsx`, `src/SolverFigures.jsx`, `src/solverApproximations.js`), the
decided-defaults block's `couples.householdOpen`, `couple-default.test.mjs` and the new `couple-shape.test.mjs`, the
identity, and the planner harness's check 19. It rests on the registered read (`registrations/couples-open.md`, read once:
`results-couples-open.txt`, Y, E, S and G each OPEN) and the maintainer's go (D143); D141 keeps a refused shape on today's
guard.

## What I read

- The change (working-tree blobs): `src/couplesSwitch.js` dbd692827bde, `src/solverClient.js` 60321e2ea67c,
  `src/solverApproximations.js` bd89238fcbee, `src/PlannerCards.jsx` c8c947290b1e, `src/SolverFigures.jsx` 584bd4eaac85,
  `src/App.jsx` fe66270f95db (its diff), `research/solver/STATE.md` a668784188cd (D143, D144, the decided-defaults block,
  section 5), `research/tests/couple-default.test.mjs` dd7ff3d46eea, `research/tests/couple-shape.test.mjs` 2980920e311b,
  `research/tests/run-all.mjs` 4dae32758592, `research/solver/couples-open-port-identity.mjs` 545f2d086123,
  `research/ui-harnesses/solver-planner-ui.cjs` e80235d687aa (check 19's diff), and the two other harnesses' diffs.
- The records: `results-couple-default.txt` ed41f77d7916, `results-couple-shape.txt` 56dcb0980dd9,
  `results-couples-open-port-identity.txt` 89e68af8e0d9; the planner harness's run on the build (the agent's, its output in
  the session's scratchpad `planner-ui-d143.txt`, 08:26 UTC): all 20 checks ok, check 19's 24 lines among them; its plants
  not run (B1's gate).
- What it rests on: `registrations/couples-open.md` d157f9f720f9 (whole; its Outcomes), `results-couples-open.txt`
  be3ee4820ba9, `DECISIONS-PENDING.md` (the entry D143 answered: way (A) builds all four classes, "Y and E do not wait" for
  the pricing fix).
- What the change reaches: `src/solver/household.js` 06b69ec74e77 (`householdPlanFor`'s refusals, `householdForm`,
  `pensionsSplit`, `bandsAt`), `src/solverCouple.js` c85332888894 (`householdCut`, `householdPlan`), `src/solverSettings.js`
  9b833da7e794 (`lockedPlan`, `partCeilingsDiffer`, `prepareForSolve`, `ageOptions`, `atAge`), `src/coupleOrder.js`
  bf2578bd6ccc (`otherOrder`'s swap of the limits), `src/App.jsx` (`normalizePlan`, `normalizeSolverLocks`,
  `buildContext`, `contribAtYear`, `salaryAtYear`, where `coupleState` is read), `src/SolverConfig.jsx` 00ca0e87e3d1
  (`SolverLocks`), `src/SolverFigures.jsx` (`FiguresList`, `SolverAges`, `SolverScenarios`), `src/SolverSimple.jsx`
  (`SolverAnswers`), `src/PlannerCards.jsx` (`WhatIf`), `src/PlannerPlan.jsx` (the failed card), `src/useSolver.js`,
  `src/solverWorker.js` (`inBands`), `research/solver/code-id.mjs`.
- Run, on the worktree:
  - `node research/tests/couple-default.test.mjs`: ALL PASS, 9 checks (43 s); `--planted`: 17 of 17 plants failing exactly
    their checks, as `results-couple-default.txt` has them (exit 0).
  - `node research/tests/couple-shape.test.mjs`: ALL PASS, 3 checks, the figures of `results-couple-shape.txt` (3,030
    refusals of 4,830 plans, none missed; the plants' misses risks 210, growth 18, cashisa 60, salaries 42, limits 42, year0
    144, noretire 42).
  - `node research/solver/check-state.mjs`: passes; the decided-defaults block parsed before and after: equal but for
    `couples.householdOpen` {Y, E, S, G all true}. `codeId()`: 36e4d2a860b2, the registered read's.
  - The guard, the build's against HEAD's (b2f807b7), over 473,088 generated couples (16 ages each person, blank, text and
    out of range among them; 7 end ages; 11 shares; 6 kinds of income; as entered, a refused risk, a cash ISA subscription,
    the first person retired with the partner paid): the rollback, `HOUSEHOLD_OPEN` all false, and the plant 'noopen' each
    differ from the guard before D143 on 0; with the swap off, 'noopen' against HEAD's swap off, 0. The open guard against
    the registration's Outcomes (on where the guard before was on; a couple it kept off for 'uneven' or 'gapincome', or by
    the age cap alone where those would keep it off, opened where solved elder first and its shape taken, 'shape' where
    refused, 'ages' past the cap where taken): 0 mismatches, no 'uneven' or 'gapincome' given with the swap on. With the
    swap off (47,520 couples): 8,815 opened, none of them an elder entered second, and every elder entered second the guard
    before D143's answer.
  - Reviewer's scratch scripts, EXPLORATORY, nothing of a held-out seed read (session scratchpad `rev/`): `diff-guard.mjs`,
    `diff-guard-off.mjs` (above), `limits-trap.mjs` (finding 1), `variant-leak.mjs` (finding 2), `shape-mirror.mjs` (finding
    3).

Verdict: FAIL

One BLOCKING, two MINOR. What holds:
- The guard opens Y, E, S and G exactly as the Outcomes say, on the household route alone, elder first (with the swap off an
  elder entered second keeps the guard before D143), and nothing more. A refused shape inside the guard before D143 keeps
  today's route; G with a refused shape, and every opened class with one, keeps the app's rules ('shape'); E reaches 100%.
- The rollback is the guard before D143 exactly, by `HOUSEHOLD_OPEN` or by 'noopen', and the coverage line's 'beforeopen'
  is the line before.
- Past the age cap an opened couple whose shape is taken is told 'ages' (ending the plan earlier does bring it in) and one
  refused is told 'shape'.
- `householdShapeOf` is the household plan's refusals as the cut reads them (risks after the locks, contribution growth,
  the cash ISA, salaries, the partner's limits, year 0, nobody retiring, the last a year short); I found no refusal it misses.
  The client fails closed on the page's own solve: no form, or a refusal at the cut, fails the job before today's route is
  asked (check 9's stand-ins; the failed card shows the plan under the app's rules).
- The words follow the guard with the swap on and off; the block, the code and check 1 agree; each of the 17 plants fails
  exactly its checks; check 9 holds the registered units (44 on the household route lifting their class, 24 off for their
  shape, each 'uneven' or 'gapincome' under 'noopen').
- The identity shows what D144 says: the page's functions (`householdCut`, `bandsAt` with `solveForApp`, `householdSolved`,
  `solvedContext`) give the pilot's ROUTE arrays on 44 of 44 units with the guard opening each for its class. It reconstructs
  the worker's steps; it does not run the client. That is the same as D136's identity, and check 9 covers the client.
- The by-inference list is the registration's.

What does not hold: the limits card, which the change reaches and no test does.

## Findings

1. **BLOCKING. For a couple the change opens, the limits card switches the solver off. A partner's limit set there cannot
   then be taken off from the page.**
   - The cause, in three parts:
     - `SolverLocks` shows the per-person rows to any couple the guard says is on (`src/SolverConfig.jsx` l.188). An opened
       couple is on.
     - The first edit of either row writes `tierCeilingPart` (l.191). So the two people's limits then differ.
     - The guard reads that as the refusal 'limits' (`src/couplesSwitch.js` l.178, `partLimitsDiffer` l.156-161). The couple
       is now off ('shape').
   - Once off, the card shows one row a wrapper (l.188: `isCouple` false). That row writes `tierCeiling` alone, and
     `tierCeilingPart` stays as it was.
   - Before D143 the same edit moved an in-guard couple to today's route, still on, with the per-person card kept. Only
     couples D143 opens can be switched off this way. By the same reading, a couple held inside the guard with per-person limits
     ends in the same state once its holdings move outside it.
   - Shown on the registered panel's S037-Y75 and S119-G8 (normalised). I re-enacted `setTier` and `patchSolver` (l.34-37,
     l.179-191), with `isCouple` read from the guard as the card reads it (`limits-trap.mjs`). Both couples gave the same
     answers:
     - as landed: on, household route;
     - the partner's pension set to Low Risk (per-person rows): off, 'shape', 'limits';
     - then the one row "your pension" set to No limit: still 'shape' (`tierCeilingPart` {pen: Low Risk});
     - or that row set to Medium Risk: still 'shape';
     - instead, your pension set to Medium Risk first (per-person rows): off, 'shape' (`tierCeilingPart` {pen: null}).
   - The ways back from the page (`limits-trap.mjs`, its last three lines):
     - A first person's own limit, set first, can only be undone: the one row back to No limit, on again. The same value
       again on that row leaves the couple off.
     - A partner's limit can only be matched on the one row, a value the card no longer shows. That puts the same limit on
       both people: Low Risk on the row, on again, both at Low Risk. It cannot be taken off.
     - The 'shape' card's buttons open the classic planner or make the plan one person's. Neither clears
       `tierCeilingPart` (`normalizeSolverLocks` keeps it).
   - No test reaches this. Check 19's per-person rows are read on S001 at 60/40, inside the guard
     (`planner-ui-d143.txt`: "the limits per person, a ceiling row for each person's wrappers").
   - The smallest fix:
     - For a couple the household route alone opens (the guard's `lifted`), the card writes one ceiling a wrapper for the
       household: `tierCeiling`, and `tierCeilingPart` set equal wherever the plan carries it.
     - For a couple off for 'shape' with `shape` 'limits', the card shows the per-person rows, so the difference can be
       undone.
     - A check that reads the card's writes back through the guard on an opened couple (the planner harness's check 10 or
       19, or a Node test of the writes), shown failing on a plant (the card as now).

2. **MINOR. The client fails closed only on a plan the guard itself opens. A variant of an opened couple that the household
   plan refuses is solved on today's route.**
   - `closed` is read from `coupleSolverOn(plan).lifted` of the plan being solved (`src/solverClient.js` l.261). A variant
     whose shape the guard refuses is off ('shape'), so it has no `lifted`. Its refusal at the cut then takes the fallback.
   - The age card solves `atAge(plan, a)` for each age (`src/SolverFigures.jsx` l.129, l.59). It does not read the guard on
     each option, as the scenario list does (l.201). Its ages run to three past the plan's own retirement age, with no stop
     at the plan's end (`src/solverSettings.js` l.158).
   - Shown with check 3's stand-in workers (`variant-leak.mjs`) on S199-Y75: ages 55 and 52, retiring at 60 and 60, the
     plan ending at 95; on, household route, lifting Y. I moved its end to 62 and the partner's retirement to 120; it is
     still on, household route, Y. The age card's ages are 57 to 63:
     - 57 to 61: the household route.
     - 62: the guard says 'shape' (noretire: its reading a year short of the plan's end), and the household route takes it.
     - 63: the guard says 'shape' (noretire). The client asked household-plan, couple-plans, solve:self, solve:part and
       couple. That is today's route, its record `householdRefused`.
   - The registration's Outcomes ask more than D144 claims. They say "a couple the household plan refuses that today's
     guard keeps off is not solved on today's route"; D144 says the client fails closed for "a couple the household route
     alone opens". The reach is small: a partner working through the plan's last year, and an age on the card past the
     plan's end.
   - Fix: in `startSolve`, close where the guard reads the plan off for 'shape' as well
     (`const g = coupleSolverOn(plan); closed = (!!g.lifted || g.why === 'shape') && PLANT.rule !== 'openfallback'`).
     Add such a variant to check 9, with 'openfallback' failing it. Or have the age card read the guard on each option, as
     the scenario list does.

3. **MINOR. `couple-shape.test.mjs` never puts a planted shape on a mirrored couple. So the mirror's swap of the limits,
   which the Outcomes name, is untested.**
   - The Outcomes ask for the test "on the plan the page hands the solver (its mirror where the elder is entered second,
     whose limits are swapped)".
   - No couple in the library is entered younger first (0 of 210). So the battery's only mirrored plans are each couple's
     'ages swapped' shape, as entered (`research/tests/couple-shape.test.mjs` l.44). Neither limits shape, nor any other,
     reaches `otherOrder`.
   - I ran every shape again on each couple with its two ages swapped (`shape-mirror.mjs`): 4,830 plans, the page's cut
     refusing 3,150 of them (year 0 840), none missed, no over-reach. So the guard holds today, but the test would not catch
     a fault in the mirror.
   - Fix: run the battery on the swapped couples as well (one more `battery` call in check 1).
