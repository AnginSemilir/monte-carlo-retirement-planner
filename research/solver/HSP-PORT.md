# Step 8's port: the household plan as the couples' default (D134 (1))

The maintainer ruled on 20 Nov (D134 (1), "Go, test beside"): HSPA becomes the couples' default by the build step 8's
registration names (`registrations/household-hsp.md`, Outcomes, PASS), with S273-90's trade accepted. The deep review's
one test (`LATE-TAIL.md`) runs beside the build. **Nothing goes to `main` before that test reads.** If it shows the
household table reading the couple as safer than it is, the build stops there and comes back to the maintainer.

## What the registration asks

- The household plan's construction, its table and its move put into the app's solve of a couple (`src/`).
- The port shown identical to the tested arm, path for path, as D99's and D109's changes of default were.
- The decided-defaults block and the test that pins it.
- The reviewer on the change of default, then `main` on B1's gate.
- Then the guard looked at again with its own units, as the external review asks.

## Where it is built

In its own git worktree, on a local branch, until two runs that depend on today's code have launched:
- the savings split's v2, whose registered run refuses any code but the one its panel was landed on (71fb4271c681);
- the late tail, whose read checks its own stamp, which includes `research/solver/household.mjs`.

The worktree's branch joins the working branch after both launches; its `src/` changes change the code id.

## The steps, each with its check

1. **The household plan in `src/solver/household.js`.** The parts the app needs:
   - `householdPlanFor` at HSPA's form ('pensionsPA'), with its refusals;
   - `pensionsSplit` and the band scaling for the table's solve and context (`bandsAt`);
   - `mergedState`, the move (`chooseHouseholdSingle` at the even split), and the engine's policy;
   - an assembly of the household from a table solved elsewhere, as `solveHousehold` builds it without the solve.

   Check: on step 8's pilot's 15 units at light settings, the module's plan, table and move are the research module's,
   by digest, and 200 paths' arrays are the same bit for bit. `research/solver/household.mjs` then imports these from
   `src`, after the late tail is read, and `household.test.mjs` passes unchanged.
2. **The worker and the client.** Where the couples' default names the household plan:
   - the client cuts the household plan;
   - it solves its table as a single's table is solved (its key, its parts, the store), every part inside the band
     scaling;
   - the owner assembles the household.

   The client reads back the household setting each assembly was made with, and refuses a difference, as it reads back
   the joint move (D109).

   Check: a test of the route in Node (as `couple-solve-client.test.mjs` runs the couple's), with a plant that drops the
   band scaling in one part.
3. **The page's views.** `solvedContext`, the skip runs, the rows, this year's actions, the ten years ahead and the
   strategy answer, each for a household: the move's parts for each person, as for a couple.

   Check: the planner's harness (`solver-planner-ui.cjs` check 19 and its couples) in both modes.
4. **The words.** The couples' card, the scenario list and the approximations list name the household plan. The guard
   (`src/couplesSwitch.js`) is unchanged: it is looked at again after the build, with its own units.
5. **The decided defaults.** `APP_COUPLE` names the household plan. The decided-defaults block and
   `couple-default.test.mjs` pin it, with a plant that takes it off.
6. **The identity.** The app's route on the pilot's 15 units, seed 7002, 1,000 paths, equal to step 8's pilot's HSPA arrays
   path for path (`results-household-port-identity.txt`).
7. **Review and gate.** The reviewer on the change of default; the fast and full tiers; `run-all.sh 4173 --both`. Then
   `main` only after the late tail reads with the build going on.

## Box

Two days from the start of step 1. When the box runs out, stop and report what is done and what is not.
