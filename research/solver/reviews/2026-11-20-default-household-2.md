# Review before a change of default, second round: D135's household default, the fix round (D136)

Subject: commits 977d5fc5 and 80d1e36b on work-i58m0x. They answer the first round (`reviews/2026-11-20-default-household.md`:
FAIL, one BLOCKING and five MINOR) in the one fix D81 (F) allows, recorded as D136 in STATE.md, which I read whole. The default
itself (`APP_COUPLE.household` 'pensionsPA', the decided-defaults block, `couple-default.test.mjs` check 1) did not move in this
round.

## What I read

- The fix (blobs at 80d1e36b):
  - source: `src/solverCouple.js` ecedc57eed, `src/solverSettings.js` 16344e2f5d, `src/solverClient.js` bd27a80045,
    `src/solverWorker.js` 4acaebe7f9;
  - tests: `research/tests/household-client.test.mjs` 9d91d0df66 (checks 4, 8, 9 and the plant list),
    `couple-shown.test.mjs` a2df201f6a, `couple-default.test.mjs` d13204e985 (check 3), `solver-planner-ui.cjs` dd0654112c
    (check 19's plant);
  - reach and results: `household-port-floor.mjs` bc9436c529, `results-household-port-floor.txt` 0583c72fad,
    `results-couple-shown.txt` f2a3a17a61;
  - the speed mode's measure: `SPEED-H.md` 09cde77322, `audit-speed-h.mjs` 8a2f444986;
  - records: STATE.md e597e54f75 (D136), `DECISIONS-PENDING.md` 6e39e57ef8, `HSP-PORT.md` 22a9059abc.
- Beside them: `src/solver/solve.js` (`solvePlan`'s floor l.2758-2763, the shortlist set on a table l.2923, its decision count
  l.1807), `src/solverStrategy.js` (`shownPolicy`, the single's views).
- Run on 80d1e36b, each light and niced beside the registered run:
  - `node research/solver/code-id.mjs`: `9f9857213b75`, the identity's code; `git diff --stat 2adcaeed 80d1e36b -- src/solver/`
    is empty;
  - `household-port-floor.mjs`: `results-household-port-floor.txt` reproduced byte for byte;
  - `couple-default.test.mjs`: ALL PASS 8, and `--planted` 12 of 12 plants failing exactly their checks;
  - `household-client.test.mjs`: ALL PASS 9; under `hhzerofloor` only check 8 fails, under `partceilkey` only check 9;
  - `couple-shown.test.mjs`: ALL PASS 4, the file's figures (1030 and 403 decisions held to the whole menu, 0 on a shortlist).
- My scratch reproductions (EXPLORATORY, light settings, seed 99001 or none; this session's scratchpad `rev/`):
  - `client-floor.mjs`, the page's client with stand-in workers, which before the fix failed S001: "S001 as the library holds
    it (config.solvencyFloor 0): solved, its record {"household":"pensionsPA","k":1.6666666666666667,"split":"even"}";
  - `floorsame.mjs`: "S001: its minimum pot 0 against 7000 set: the household plan the same true; the table's digest the same
    true; the minimum pots (model, table, engine) [7000,7000,7000] / [7000,7000,7000]; paths differing of 200: 0";
  - `ceil.mjs` on S025-own:
    - equal ceilings, both free or both Medium Risk on the pension, taken, the household plan's locks without
      `tierCeilingPart`;
    - a differing ceiling either way refused: "householdPlanFor: the two people's Pensions hold different risks", so the
      couple falls back.
- Not opened: `/home/user/sv2-launch` and anything of seed 7025.

Verdict: PASS

The BLOCKING finding and the five MINOR are each answered. One new MINOR, a narrow gap in a test.

## The first round's findings

1. **BLOCKING, answered.** `householdCut` now gives a household plan with no minimum pot the one its table is solved with:
   `PRODUCT_DEFAULTS.minPotYears` x target, `src/solverCouple.js` l.118-127. That is what `solvePlan` sets where the app asks no
   `minPotYears`, and nothing in `src/` outside `solve.js` asks one.
   - Such a couple is now exactly a couple whose plan sets one year's target by hand: the same household plan, the same table
     by digest, and 0 of 200 paths differing (`floorsame.mjs`). That is inside what step 8 tested: all 40 panel units set a
     minimum pot, 25 of them at exactly the target.
   - The cut on all 40 panel units is unchanged, and the solver code is the identity's, so the identity stands.
   - `household-client` check 8 runs S001 through `startSolve` and fails on its plant; its 210-couple pattern search compares
     exactly the two floors the assembly compares.
2. **MINOR, answered.** The read-back now holds the even split. It is the input besides the form that moves the household's
   move (`chooseHouseholdSingle` reads `cp.split`).
   - The worker plant `workersplit` hands back a household at the pensions' split, a fault that moves paths. Check 4 refuses
     it in Node; the harness's check 19 is to show it at the gate.
   - The record names the split, and the comments no longer claim the tie-break and the hold act.
3. **MINOR, answered.** `partCeilingsDiffer` (`src/solverSettings.js` l.225) compares the two people's ceilings wrapper by
   wrapper, as `lockedPlan` reads them.
   - Equal ceilings are dropped before the cut, which is exact: `lockedPlan` holds the partner to the first person's ceilings
     without the field.
   - A differing ceiling still falls back (`ceil.mjs`).
   - With the limits set back to free, 210 of 210 library couples are now taken (recomputed).
4. **MINOR, answered.** D136 records the change, the unlock's use (check 4 beyond the ask's numbers; this round's edit is in
   check 3, which D135 names) and the reach by inference as the registration asks. That includes the mirror, run by no Node
   test, and couples with no minimum pot.
5. **MINOR, answered as planned.** SPEED-H is built to measure the speed mode on the household before the batch merges.
   - It compares the two arms on the same 4,000 paths by the page's route, with the table's digest held equal across arms.
   - It is EXPLORATORY and decides nothing. Its read should be with the maintainer before the merge, as `DECISIONS-PENDING.md`
     says.
6. **MINOR, answered.** This year's move, its skips' rankings, the next years and the rows now decide through `wholeMenu` on
   either route.
   - Check 2 also requires that no shown decision be counted on a shortlist (`SHORTLIST.stats.decisions`, `solve.js` l.1807).
     So a fault in any one view fails it even where the shown move comes out the same.
   - The plants `noshown` and `shown` fail exactly checks 2 and 4.

## Finding

1. **MINOR. `couple-shown.test.mjs` check 4 cannot fail on its household unit.**
   - On the code before the fix, S025-own's typical run already matched the whole menu's: "path 20, 0 of 28 years' levels
     differ" (`results-couple-shown.txt`). So the household branch of the typical run is shown by reading alone:
     `shortlisted`'s `[cp.H]` (`src/solverCouple.js` l.197), against the top-level `chooserShortlist` the solve sets
     (`solve.js` l.2923).
   - A typical run reads stored runs and makes no decision, so check 2's count cannot reach it either.
   - The code is right as read. A household unit whose typical run moves with the shortlist would close the gap; one of
     SPEED-H's twelve may.
