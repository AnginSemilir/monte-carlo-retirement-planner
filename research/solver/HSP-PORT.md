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

## Progress (20 Nov, afternoon; in the worktree, uncommitted, kept on the remote as `drafts/hsp-port.patch`)

- **Step 1 done.** `src/solver/household.js`, with `householdForm`, `householdFromTable` (the plan check the worker makes)
  and `assembleHousehold` split out of `solveHousehold`.
- **Step 2 done.**
  - The worker's two household steps are in `src/solverCouple.js`, where a test runs them as the worker does:
    - `householdCut` ('household-plan'): the page's plan through `householdPlan`, cut at a scaled form, with the bands
      and the partner's age; a form without a scale refused;
    - `householdSolved` ('household'): the household assembled from its table through `householdFromTable`, at the even
      split;
    - `householdMeta`: the record, with the setting the assembly recorded (the form, the top three, the tie-break, the
      hold).
  - Every `solveForApp` call in the worker's `solve`, `base` and `part` runs inside the bands.
  - **The client** (`src/solverClient.js`):
    - the household route runs before the couple's where a form is named;
    - the household's parts are kept as a single's;
    - each assembly's whole setting is read back, and a difference refused (as D109 reads back a couple's joint move).
  - **A defect found and fixed:** the stored table's key left out its bands (`src/solverKey.js` ignored them), so a table
    of the household plan solved outside the bands shared the household's key. The key and the dial base's key now name
    the bands; a key without them is unchanged.
  - **The route's test** `research/tests/household-route.test.mjs` (2 households) passes:
    - the cut is `solveHousehold`'s;
    - the table solved apart inside the bands has the whole solve's digest;
    - the household assembled from it runs as the whole on 200 paths;
    - its plants `nobands` and `oddsplit` each fail it.
  - **The client's test** `research/tests/household-client.test.mjs` (stand-in workers, as `couple-split.test.mjs`)
    passes all 6 checks:
    1. three parts, the bands in the owner and every part, each assembly the whole household (its table, its record, 50
       paths);
    2. restored split from the store;
    3. the key naming the bands, with a table solved outside them never restored;
    4. a part assembling with another setting refused;
    5. a variant neither restored nor stored;
    6. the dial's position 3, its base solved split inside the bands, its key the household's own at position 1.

    Plants: `bandsunkeyed` fails check 3, `noformcheck` 4, `keyvariant` 5, and `partnobands` every check solved split.
- **Step 3, the views, built.**
  - A household's moves have a couple's joint move's shape (both people taking the household's move, at the even split).
    So the page's couple views take a household (`isPair`): this year's actions, the next years, the ledger, the skips'
    runs shared across parts, and no rule of thumb.
  - This year's skips (`householdSkipsOf`): the household's moves are ranked once on its table at the merged state, and
    each person's alternative is the household table's best-ranked move differing in that part.
  - `research/tests/household-views.test.mjs` passes all 6 checks:
    1. the first move is the engine's, both people the same, the split even;
    2. a move put back as itself is unchanged;
    3. each skip changes only its part, its alternative the table's own at the merged state;
    4. each skip's cost is the same afresh, with the plan's runs handed in, and split in two and joined;
    5. the next years and the rows are the engine's moves.

    Plants: `hhpersonrank` fails check 3, `nosplit` checks 2 and 3. At light settings the first years show level and tier
    skips, not a draw or a harvest; the browser harness covers the app's settings.
- **Step 6 done** (a18c430a): `results-household-port-identity.txt`, 15 of 15 units IDENTICAL.

## Progress (20 Nov, evening; in the main tree, D135)

The late tail read THE GROWTH on its second read, so the build goes on (D134 (1)). The maintainer's "Unlock enforcement,
launch" (D135) covers `couple-default.test.mjs`'s edits. The worktree's changes are now in the main tree, and
`drafts/hsp-port.patch` is gone.
- **Step 4, the words.** The coverage line (`src/solverApproximations.js` `HOUSEHOLD_SENTENCE`) says how a couple is
  planned: one plan for the money the two hold, its bands set by how their pensions are split, every figure from each
  person's own tax. It also says that a plan one plan cannot hold is planned person by person. The couples' card and the
  scenario list are unchanged: they say which couples the solver plans for, not how.
- **Step 5, the default.**
  - `APP_COUPLE.household` is 'pensionsPA', in the decided-defaults block.
  - `couple-default.test.mjs`:
    - check 1 pins the block, with a planted block without the household;
    - check 3 has the household route as the page's default, and today's route under `household: null`, the option that
      names it;
    - check 4 has the sentence;
    - check 7 names that option.

    Its plants `nohousehold` (check 3) and `nohouseline` (check 4) each fail exactly their check, as do the ten before.
  - `couple-split.test.mjs` names today's route.
- **A couple the household plan refuses** (`householdPlanFor`'s refusals of the plan's own shapes, such as the two people's
  ISAs held at different risks) is solved on today's route, as before the default. Its record says why
  (`householdRefused`). Any other refusal, such as a form the page does not solve at, still fails the solve.
  - `household-client.test.mjs` check 7 covers this, with its plant `nofallback`.
  - Its check 5 now goes through `startFigures` at the default, as the page's What if does, and its figures are the
    whole household's.
- **The page's harness:** `solver-planner-ui.cjs` check 19 now takes the household's reference:
  - the 60/40 couple, reloaded, at 90/10, and entered younger first;
  - (g), a couple the household plan refuses, solved on today's route against today's reference. This is where the
    plants `couplehalf`, `coupleage` and `workernotie` now bite.
  - A new worker plant, `workernohold`: the household assembled without the hold, which the client refuses.

  To run with its plants at B1's gate.
- **Found, for the maintainer:**
  - **The speed mode reaches the household's table** (its chooser's shortlist), unmeasured. On S025-own at light
    settings, 185 of 200 paths end differently (EXPLORATORY scratch, not kept).
  - **A couple's views make their decisions on the shortlist under the speed mode, on either route.** These are this
    year's actions, the next years and the rows. D90's guard (`shownPolicy`, `shortlist-shown.test.mjs`) covers a
    single's views only, so this is older than the port.
- **Not yet:**
  - `research/solver/household.mjs` importing from `src` (step 1's last line). This is left until after the gate; the
    app does not read it.
  - The new tests joining the fast tier (an unlock of `run-all.mjs`). They run in the full tier meanwhile.
  - The reviewer on the change of default.
  - B1's gate, on quiet cores after the savings split's v2 has run.

## Box

Two days from the start of step 1. When the box runs out, stop and report what is done and what is not.
