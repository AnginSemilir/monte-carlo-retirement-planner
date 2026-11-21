# Review before a change of default: D134 (1) and D135, the household plan (HSPA) as the couples' default

Subject: commit 2adcaeed ("Step 8's port, step 5: the household plan is the couples' default"), on branch work-i58m0x (HEAD
ddd5fe76 adds only STATE.md and DECISIONS-PENDING.md lines). A couple the guard hands to the solver is solved as one household
(`APP_COUPLE.household = 'pensionsPA'`): the plan cut by `householdPlanFor`, one table solved inside `bandsAt`, the move from
`chooseHouseholdSingle` at the even split; a couple `householdPlanFor` refuses by its plan's shape falls back to today's route.

## What I read

- The change (HEAD blobs): `src/solver/household.js` 06b69ec74e, `src/solverClient.js` 90452a7b44, `src/solverCouple.js`
  6c4f11114c, `src/solverWorker.js` 915ecff4bf, `src/solverKey.js` 95071059c2, `src/solverStrategy.js` a2b342de48,
  `src/solverSettings.js` 65b3f55617, `src/solverApproximations.js` a47a716b41; the tests `research/tests/couple-default.test.mjs`
  c8bcba51a3, `household-client.test.mjs` 54b590b7e6, `household-route.test.mjs` 5c7b306ead, `household-views.test.mjs`
  c84fbb5d08; `research/ui-harnesses/solver-planner-ui.cjs` 66084f2107 (check 19's diff); `research/solver/HSP-PORT.md`
  1a08efd377.
- What it rests on: `research/solver/household.mjs` (diffed against the port), `registrations/household-hsp.md` fb070defb6,
  `audit-household-hsp.mjs` 4ac0e66a9d (the HSPA arm), `results-household-hsp.txt` (OUTCOME PASS, l.8),
  `results-late-tail-2.txt` (OUTCOME THE GROWTH, l.9), `household-port-identity.mjs` 7dda22276b and
  `results-household-port-identity.txt` 263526c178, STATE.md 549aac617b (the decided-defaults block, D134, D135),
  `DECISIONS-PENDING.md` 3e84f883c9.
- What the change reaches: `src/solver/solve.js` b3c20b3e7f (`solvePlan`, `wholeMenu`), `src/solver/couple.js` 7a12a43407
  (`solveCouple`'s floor), `src/solverApp.js`, `src/coupleOrder.js`, `src/couplesSwitch.js`, `src/useSolver.js`,
  `src/SolverConfig.jsx` 00ca0e87e3, `src/App.jsx` (`normalizeSolverLocks`, the config defaults), `src/PlannerPlan.jsx`,
  `src/solveStatus.js`, `src/solverWords.js`, `src/solverDiagnostic.js`.
- Run (each light, niced, beside the registered run): `couple-default.test.mjs` ALL PASS 8 checks, and `--planted` 12 of 12
  plants failing exactly their checks; `node research/solver/code-id.mjs` on the tree: `9f9857213b75`, the identity's code.
  Reviewer's scratch scripts (EXPLORATORY, no held-out seed; in this session's scratchpad `rev/`): `scan.mjs`, `scan2.mjs`,
  `floors.mjs`, `realroute.mjs`, `client-floor.mjs`, `inert.mjs`, `speed2.mjs`, `harnesscouple.mjs`, `panelfloor.mjs`.
- Not opened: `/home/user/sv2-launch` and anything of seed 7025.

Verdict: FAIL

One BLOCKING, five MINOR. What holds: the code default, the decided-defaults block and `couple-default.test.mjs` check 1 agree
and moved in one commit; the evidence is a confirmatory read (step 8, PASS, with the maintainer's word on M1's unit, D134
(1)); `src/solver/household.js` is the research module line for line plus the split of `solveHousehold` and
`householdMoveOf`; the solver code on the tree is the identity's (`9f9857213b75`), and the identity holds 15 of 15 units
path for path; the key names the bands and a single's key and solve are untouched; the fallback catches exactly
`householdPlanFor`'s shape refusals. What does not: the default fails the solve of every couple whose minimum pot is left at
nought, the page's own default.

## Findings

1. **BLOCKING. The household default fails the solve of any couple whose minimum pot is left at 0, the page's default.**
   - The cause. `solvePlan` gives the household table a minimum pot of one year's target where the plan sets none
     (`src/solver/solve.js` l.2759-2763). The couple's model keeps the plan's 0 (`M.prepare(E, household)` in
     `assembleHousehold`). `assembleHousehold` then throws "the minimum pots differ (0, target); the plan must set the
     household's" (`src/solver/household.js` l.302).
   - This happens at the worker's `'household'` step (`src/solverClient.js` l.283). The fallback wraps only
     `'household-plan'` (l.256-260), so the job fails after the table is solved.
   - Today's route handles the same plan: `solveCouple` sets the household's floor to the two tables' sum
     (`src/solver/couple.js` l.258-261). The page says "Left at 0, the solver keeps one year of your target spending"
     (`src/SolverConfig.jsx` l.151).
   - Shown three ways:
     - (i) The worker's own steps (`householdCut`, `solveForApp` inside `bandsAt` at 6 points, `householdSolved`) on the
       library's S025 and S001 as held: each THROWS "solveHousehold: the minimum pots differ (0, 7000)". S001 with its
       minimum pot set to 7,000 assembles (`realroute.mjs`).
     - (ii) The page's client, `startSolve` at the couples' default, with in-process stand-ins answering as
       `solverWorker.js` does (`client-floor.mjs`):
       - "S001 as the library holds it (config.solvencyFloor 0): the solve FAILS: solveHousehold: the minimum pots differ
         (0, 7000)";
       - with the floor set: "solved, its record {"household":"pensionsPA",...}";
       - `household: null`: "solved, its record {"share":0.5,"shareRule":"pots",...}".
     - (iii) The reach (`floors.mjs`, `scan.mjs`):
       - 126 of the library's 210 couples leave `config.solvencyFloor` at 0. All 210 are on the guard as entered, and all
         126 fail the assembly's check (the table's model emulated as `solvePlan` builds it).
       - All 40 of step 8's panel units set one (25 of them at exactly the target).
   - So nothing that ran could show it:
     - the identity, `household-route` and `household-client` take panel plans;
     - `couple-default` check 3's stand-in echoes the setting without assembling.
   - Check 19's couple is S001 (`harnesscouple.mjs`: the first 60/40 library couple, floor 0). B1's gate would most likely
     have failed there, but this is the change of default's own review.
   - The fix:
     - Where the plan sets no minimum pot, the household's should be the one its table is solved with (`solvePlan`'s
       `minPotYears` x target), in the couple's model and the engine's context, as `solveCouple` does.
     - It needs a test of its class: a couple with its minimum pot at 0 through the worker's steps and through the client,
       with its plant.
     - The library scan (every couple through the cut and the assembly) is its pattern search.
     - The identity's 15 units are unaffected, since all of them set a floor. The D-line should say that such couples then
       run on a floor step 8 tested only as set by the plan.

2. **MINOR. What the client reads back, and what the job's record names, does nothing on this route.**
   - `chooseHouseholdSingle` takes none of `topK`, `tieJoint` or `holdPast`: "No ranking of several moves, no tie rule of
     the couple's own, no look, no hold" (`src/solver/household.js` l.444). Its tie-break is the table's own `tieAboveCap`,
     through `chooseAction`.
   - Probe (`inert.mjs`): S273-90 as landed, light settings, 300 paths of seed 99001, assembled at {3, 1e-4, 2} against
     {1, 0, 0}: "paths differing in survival, end pot or tax 0".
   - So these test only that a record is read back, and no fault in the move:
     - `sameForm` (`src/solverClient.js` l.278-289);
     - the worker plant `workernohold` (`src/solverWorker.js` l.165), "the household assembled without the hold";
     - `household-client` check 4.
   - Several places describe a move the code does not make:
     - the record `couple.joint: {tieJoint, holdPast}`;
     - the comments "with the joint move's tie-break and hold" (`src/solverSettings.js` l.111) and "the tie-break and the
       hold of the couples' joint move" (`src/solverClient.js` l.275);
     - the descriptions of `couple-default` check 3 and check 19.
   - The tested arm passed the same inert options (`audit-household-hsp.mjs` `configOf` HSPA, l.66), so the identity holds.
     The registration describes HSPA correctly ("its table carries the candidate's tie-break above the cap").
   - The one assembly input that moves the paths, the even split, is fixed in `householdSolved` and is not in the read-back.

3. **MINOR. The limits refusal falls back on the field's presence, which the page's own card writes.**
   - `householdPlanFor` refuses whenever `locks.tierCeilingPart` has keys (`src/solver/household.js` l.150).
   - The limits card writes `tierCeilingPart` the first time either person's ceiling moves (`src/SolverConfig.jsx` l.191),
     and `normalizeSolverLocks` keeps it with both keys, even when both are free (`src/App.jsx` l.1067).
   - So a couple whose partner's ceilings equal the first person's, or are free like theirs, stays on today's route from
     then on.
   - Scan (`scan2.mjs`, the floor set so finding 1 does not mask it): with the locks as the card leaves them, every ceiling
     free, 210 of 210 library couples take "FALLBACK: householdPlanFor: the partner's own limits".
   - The record says why (`householdRefused`), but no page reads it (no file under `src/` outside the client names it), and
     nothing in the plan needs two plans.
   - Narrow the refusal to where the partner's effective ceilings differ from the first person's, or say this reach.

4. **MINOR. The reach the registration asks to be said is not said.**
   - The registration's PASS outcome reads: "What it reaches beyond the panel is by inference, said in the D-line" (the
     estate aim, consent withdrawn, the dial's other positions, the speed mode, other gaps, an elder entered second, pensions
     held unlike the pots). Neither D134 nor D135 says it, and the commit adds no D-line.
   - Beside that list:
     - finding 1's couples, once fixed;
     - finding 3's couples;
     - a couple entered younger first on the household route, which no Node test runs (`household-route`, `-client` and
       `-views` name no mirror) and which only check 19 (e), not yet run, covers. Its answers go through the shared `back`.
       The record's `meta` is not put back, and holds nothing per person.
   - D135 (3) names checks 1, 3 and 7 for the unlock; the commit also edits check 4 and adds its plant `nohouseline` in the
     same protected file, which the ask ("the words, the default and its pin") covered in substance. Let the D-line name it.

5. **MINOR. The agent's (a) is confirmed: the speed mode reaches the household table, unmeasured.**
   - `householdPlanFor` keeps `plan.solver`, so `solveForApp` hands the table the shortlist (`speedOptions`), and
     `chooseHouseholdSingle`'s `chooseAction` uses it.
   - Probe (`speed2.mjs`): S025-own as landed, light settings, 200 paths of 99001: "survival off 200, speed 200 (saved 0,
     lost 0); end pot differs on 185".
   - The couples' warning's figures (`src/solverWords.js` l.159) were measured on today's route (SPEED-B). Measuring the
     household before the batch merges, as the agent recommends, is the right order.

6. **MINOR (older than this change). The agent's (b) is confirmed by reading.**
   - The couple views run the policy's `choose` outside `wholeMenu`: `coupleFirstMove` l.164, `coupleAheadOf` l.268 and
     `coupleRowsOf` l.279 in `src/solverCouple.js`. `shownPolicy` (`src/solverStrategy.js` l.268) wraps a single's alone.
   - So under the speed mode a couple's shown decisions are the shortlist's on either route, against D90 (2)'s guard. The
     household route extends it, including `householdSkipsOf`'s ranking.
   - The proposed fix, with a test of its class, belongs in the same batch.
