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

## Design notes (20 Nov, from reading the code)

- **Step 1, done in the worktree** (`/home/user/hsp-port`, local branch `port-household`, not yet committed: the commit waits
  for the e3pcls pin to be re-taken there, since the fast tier refuses a stale pin). `src/solver/household.js` is the research
  module line for line, its imports pointed at `src/solver`. `solveHousehold` is split into three parts without changing its
  order of work:
  - `householdForm`: the plan cut at its options, its band options and the people its band for gains is solved on;
  - the solve itself, inside `householdBands`;
  - `assembleHousehold`: the original checks and record, from a table solved here or elsewhere.
- **Step 2, the worker** (`src/solverWorker.js`):
  - The engine is `{ ...App, ...App.E }`, so `E.DEFAULT_CONFIG` is App's own object: the band scaling (`bandsAt`) reaches the
    engine's functions as it does in research.
  - A `household-plan` kind cuts the plan (`householdForm` at 'pensionsPA'). It returns the household plan, the bands
    `{ k, paOne, paK }` and the partner's age.
  - The table is solved as a single's, in a slot `household`, with `bands` beside its options. Every `solveForApp` call in
    `solve`, `base` and `part` (restores included) is wrapped in `bandsAt`, so each part's model carries the scaled band for
    gains.
  - A `household` kind assembles (`assembleHousehold`, the table checked to be the one solved on the plan cut). The solve
    in hand is `{ ...cp, split: 'even' }`.
  - `isCouple` stays K2's; a household is `x.household === true`.
- **Step 2, the client** (`src/solverClient.js`): where the couples' default names the household plan, the route is
  `household-plan`, then one `phase('solve', ...)` in the `household` slot with `bands`, then `household`. The form each
  assembly was made with is read back and a difference refused, as D109's joint move is.
- **Step 3, the views.** `solvedContext` for a household is `withHouseholdSingle(solved.plan, solved)`. The couple's views
  read K2's two tables (`cp.tables[who]`) for each person's skips, so a household needs its own. HSPA's move is the
  household table's one move, taken by both people at the even split (`chooseHouseholdSingle`). So:
  - this year's actions and their skips read like a single's from the household table, each skip forcing a household move
    built from another of the table's actions;
  - the rows, the ten years ahead and the strategy answer come from the engine's paths under the household policy.
- **The identity** holds the app's route to step 8's audit, as D109's held the couples' route to its arm. Step 8's audit
  builds HSPA from `solverPlanOf`'s plan with arm A's MPAA ages; the identity test says whether the page's plan matches it.

## Box

Two days from the start of step 1. When the box runs out, stop and report what is done and what is not.
