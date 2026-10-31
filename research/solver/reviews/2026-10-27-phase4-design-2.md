# Design re-review: Phase 4 (registrations/phase-4.md, draft), before its registration is committed and launched

Subject: Phase 4's design after the FAIL of `reviews/2026-10-27-phase4-design.md` (3 BLOCKING, 11 MINOR), as the code
stands at 9e3d38b (D33 to D37; the D36 fixes in 3d4c3a0, D37's routing and the sizing in 9e3d38b), with the draft
registration. The draft (blob aab08d2b3d64) is committed as 9bfb57b on claude/project-access-i58m0x, local and origin,
on top of 9e3d38b; 9bfb57b changes nothing else.

## What I read

Blobs (git hash-object, first 12): phase-4.md aab08d2b3d64; audit-phase4.mjs d77d2a3cb8c7; select-phase4.mjs
0d54f6a47a8a; phase4-panel.mjs f5d8e7411e88; phase4-orders.json 6111b489f6a0 (and d514a36's, the first freeze);
phase4-panel.json a5631584ee5e; phase4-paths.json b55b539ccc8c; reduce-phase4.mjs 87b2526b581e; size-phase4.mjs
ab2da96ea302; batch-phase4.sh 460da1cb720e; phase4-routing.mjs c47f9c99b56c; prng-check.mjs 0600137c01c7;
run-from-snapshot.sh cf7ab99bb4ec; check-prediction.mjs 8cf1ef53758b; fair-gate.mjs 4d4a20402b1c; code-id.mjs
f00aa5b3bd48; candidate.mjs 7c747dd932cc; STATE.md 794ba41c4208; CHECKLIST.md b06443537a60; src/App.jsx bcbf29bd178e
(bedAndSippFor); src/solver/solve.js 2adf4a32aa39 (buildActions, l.381, solveBoth, solvePlan); research/engine.mjs
(buildContext, stepYear, mulberry32, gaussianPath, pathsForSeed); results-phase4-sizing.txt cc141ee94825,
results-phase4-routing.txt dda21c1e69fc, results-prng-check.txt 23596682fbc4, results-bed-sipp.txt 7b2362224755,
research/tests/bed-sipp.test.mjs 83134f7a3b89. The pilot's 200 units and logs (results/p4-pilot, seed 7002), the 12
re-routed units' logs, the landing log; the smoke run's units and log in the session scratchpad (p4smoke/, metadata and
unit lines only, no 7018 outcome); the names of the discarded pilot's units, and that pilot's 7002 survival bits for one
check (finding 2). Nothing of seed 7003 or of 7018's outcomes.

What I ran (no solve, no audit unit, nothing written under results/):
- `reduce-phase4.mjs --planted` 25 of 25; `size-phase4.mjs --planted` 11 of 11; `phase4-panel.mjs --planted` 12 of 12;
  `research/tests/bed-sipp.test.mjs` ALL PASS 4.
- `check-prediction.mjs registrations/phase-4.md`: NOT COMPLETE only for the Design review field (REVIEW_FILE).
  `check-prediction.mjs --seeds registrations/phase-4.md --text "bash research/solver/batch-phase4.sh" batch-phase4.sh`:
  seeds 7003 (Phase 4 only), exit 0.
- The batch's AUDIT command and the audit's STAMP over STAMP_FILES: both ef358cf85ea7. `audit-phase4.mjs --units` 200.
  `audit-phase4.mjs registered part 0/200` without PREDICTION_FILE, and `audit-phase4.mjs 100 part 0/200 7018` / `7003`:
  each refused before generating a path.
- Scratch scripts (scratchpad): sizePanel and budgetOf over results/p4-pilot (phase4-paths.json reproduced exactly; the
  registration's 40 rows and the sizing file's 40 rows equal to the recomputation; 753000 paths, 27 above 16,000; min
  rate at 1 point 0.9002, max at 0.25 0.0500; budget 111.4 core-hours, solves 17.5, engine 88.1, longest S356F CAND/0.02
  1.72 h); the reducer's gate() over the pilot's units; inputsHash over tournament plans and planted edits; every
  context key compared between arm A's plan and the solver arms' plan on the 40 households; an exact search for shared
  mulberry32 states (any offset up to 130 draws) between the held-out paths and every seed in use; the pilot's items.

Verdict: PASS

No BLOCKING finding. The three BLOCKING findings of the first review are fixed as the code stands, each with its
planted case, and the evidence below shows the fixes work on the pilot's own units. Keep these true through the
registration's commit: the decision rule's bars and phase4-paths.json do not move, and seed 7003 is not read before the
launch.

## The earlier findings, as the code now stands

1. Fixed (D36 (c)). armA `{ tournament: false }` (select-phase4.mjs l.79-91; audit l.196). Every unit records
   inputsHash (audit l.71-77, l.224-225); the gate refuses a household whose units differ (reduce l.103, planted).
   On the pilot all 40 households have one inputs hash and one target across their five units, the three re-routed
   households included. The hash moves where it should: on S304F 23 of 24 tournament plans hash differently from the
   own plan, on S290 15 of 16, and so does a balance +£1 or a target +£100; it holds when only the policy, the lump sum,
   the harvest, the guardrails and the lookahead change. Across the 40 households, arm A's context and the solver arms'
   differ only in plan, fullLumpSum, policyKey, policySteps, harvestPA, raiseCapFrac, guardrails and lookaheadYears;
   the tax parameters are the same on 40 of 40. Bed & SIPP is fixed (App.jsx l.3514-3529) and tested (4 of 4; 2 of 4
   before). Not on Phase 4's path now.
2. Fixed (D36). touched() also reads the manifest, archive/ and research/tests/ (phase4-panel.mjs l.73-79; planted
   S140, S226, S280 in). No panel id appears outside the scan's reach except the app-side uses the registration lists
   (policy-study confirmed-results.json: S030, S062, S074, S306, S358; lookahead-study.mjs: S308) and Phase 4's own
   files. How the replacement was done differs from D36's wording: finding 2 below.
3. Fixed. `clopperPearson(...)[1]` (size-phase4.mjs l.98); harmRate throws on a bad input (l.39, planted); an
   end-to-end planted case through synthetic units (l.136-141).
4. Fixed. The SHARED diff between CAND and SHIP, and between an arm's two weights (reduce l.104-105); the engine's
   target (audit l.267); the stamp held to the registration and the logs (reduce l.88-89); planted cases for each. On
   the pilot's units the gate raises only what a pilot must (seed, no replication, NOT-LAUNCHED, no worlds), and none of
   the plan, inputs, target, settings, minimum pot, runPolicy or FIXBR checks.
5. Fixed (audit l.147-148; shown refusing above).
6. Fixed (STAMP_FILES l.67; batch-phase4.sh's AUDIT the same list, the same hash).
7. Fixed as asked (s1Parts, reduce l.129-133, planted).
8. Fixed for the items asked (CAND less SHIP spending, FIXBR's, the worlds' and history's); see finding 5 for two gaps.
9. Fixed: runPolicy beside on the first 2,000 paths of each solver unit; on the pilot 0 paths differ on all 160.
10. Fixed: the CPU in each unit; every pilot unit on "Intel(R) Xeon(R) Processor @ 2.80GHz", as the budget says.
11. Fixed: the --check lines are printed in results-phase4-sizing.txt (6 cases, within 2.11 se).
12. Fixed: recorded in the Households field (matches my search).
13. Fixed: the returns-a-point-lower world carries D20 (9).
14. Decided by the maintainer (D37).

## What else I checked, and found sound

- Seeds. 7003 never read: no log or result names it as a seed, and no path of 7003 (0 to 25,999) or of 7018 (200 to
  4,199) shares a mulberry32 state, at any offset up to 130 draws, with paths 0 to 63,999 of 7001, 7002, 7004, 7005,
  7011 to 7014, 7101 or 99001, with 7018's first 200 paths, or with itself (the search found a planted overlap at
  offset 5). The smoke run's
  units confirm the replication there was 7018's paths 0 to 199 (N 200, no skip); the registered run skips them (audit
  l.61, l.154, l.228) and the gate refuses a replication from path 0 (planted).
- The decision rule. decide() and the items read exactly the registration's A1, A2 and S1 at both weights on the first
  16,000 paths of every household, the interval by path; the flags read phase4-paths.json's thresholds on all of each
  household's paths. Power: from the pilot, at 16,000 paths the pooled se is about 0.14 points (A1), 0.028% (A2) and
  0.022 to 0.024 points (S1). S1 passes when the observed change is above about -0.055 points, so a true S1 of 0 passes
  about 99% of the time and one at the -0.1 margin about 2.5%.
- D34. The thresholds and paths are sized at each comparison's Clopper-Pearson upper bound, by exact sums held to a
  convolution and checked by simulation; every comparison meets both rates at its bound; the normal cross-check is
  printed beside. The registration's table matches the sizing file and phase4-paths.json row for row.
- D37's routing. solverPlanOf switches the policy name only where the deposit order differs (S290, S314F, S358F). The
  pilot's re-routed units share APP's inputs hash, so the routed windfall is the same. Check 2 of the routing file shows
  the name reaching nothing else on S272 and S304F (CAND and SHIP, bit for bit).
- The launch. Once the Design review field names this file, check-prediction.mjs accepts the registration, and the
  seed registry accepts 7003 under phase-4.md. PREDICTION_FILE as the launcher exports it equals the audit's
  REGISTRATION, and the audit stamp matches LOG_STAMP. There is no smoke stamp for code-id --smoke 30d29b6d7beb, so the
  launcher will run smoke.sh first. The registration with this file named in its Design review field has to be
  committed and pushed (the launcher checks the commit that last touched it is on origin).

## Findings

1. MINOR. **The lump sum: arm A can take it, the solver arms cannot.**
   - Every panel plan is "Phased Drawdown". Arm A's search takes "Full 25% Lump Sum" on 16 of the 40 (the labels in
     phase4-panel.json).
   - The solver arms never take a lump sum. solvePlan passes `lump: m.ctx.fullLumpSum` (solve.js l.2415), and every
     action carries it (l.381), so it is false on all 40.
   - The registration says this. It is the decumulation rule as the product ships it, and it biases A1 and A2 against
     the candidate, so it cannot produce a false PASS.
   - On the pilot it does not matter: A1 at W0.02 is +10.25 points on the 16 lump-sum households and +10.21 on the
     other 24; A2 is +6.54% and +6.60%.
   - Ask:
     - Report A1 and A2 split by this group beside the items. This changes no rule.
     - Put the solver's own lump-sum choice on the list after Phase 4, beside D37's windfall item. solveBoth (solve.js
       l.2288) already solves both ways.
     - At a read, a NOT PASSED on A1 or A2 is not blamed on the table until this is split out.

2. MINOR. **The library cohort was re-picked, not topped up as D36 records.**
   - What D36 says: "a household it adds replaced by the frozen order's next reserve".
   - What was done: phase4-orders.json was frozen again over the new touched set (177 ids; 9 added). cohorts() then
     re-spaced the 20 evenly over the 37-household pool (phase4-panel.mjs l.84-89).
   - The effect:
     - Six untouched households of the first order's 20 became reserves: S080, S098, S110, S170, S200, S298.
     - Ten households entered that D36's rule would not have brought in.
     - D36's rule would have dropped S024, S140, S226 and S280 and taken S036, S048, S060 and S068 in their place.
   - The rule is mechanical, and I find no sign that outcomes chose it. The first (discarded) pilot was complete at
     03:31 UK, before the re-freeze at 07:03, so I checked it. On that pilot (seed 7002), the six demoted households are
     no worse for the candidate than the ten kept: S1 at W0.02 +0.68 against +0.55, and CAND less arm A +9.77 against
     +9.70.
   - Fix: write into the Households field that the orders were re-frozen and the 20 re-picked evenly, and name the six
     demoted households. The maintainer should know that D36's record and the procedure differ.

3. MINOR. **The record of 7018's earlier use is inaccurate.**
   - The Seed field says the smoke run scored 7018's first 200 paths on "S024 (APP and SHIP) and S304F (all five
     units)", from 20:39 to 20:43 UK.
   - The units say otherwise. All ten units of S024 and S304F carry `repl {seed 7018, N 200}`, so S024's two CAND units
     read those paths too. The log (p4smoke/case0.txt) has ten unit lines and was last written at 21:08 UK. Its units
     took 1,529 s in all, so the run went from about 20:43 to 21:08.
   - No effect on the design: every household skips paths 0 to 199.
   - Fix: correct the sentence in the Seed field (and in the record wherever it is repeated).

4. MINOR. **Two of the audit's new checks have no planted test (CHECKLIST 5).**
   - inputsHash's sensitivity is not tested. The reducer's planted case only shows the gate comparing two strings.
   - The audit's refusals have no test either: a registered run outside the launcher, and 7003 or 7018 anywhere else.
   - I showed both working above.
   - Fix: add a planted case for each, for example in a `--planted` mode of the audit. The hash case is a tournament
     plan (or a balance +£1) hashing differently, and the policy fields not moving it.

5. MINOR. **The read is not held to the files it was launched with, and two survival lines lack spending.**
   - reduce-phase4.mjs reads phase4-panel.json and phase4-paths.json (the thresholds) from the tree at read time
     (l.176). It checks the units' stamp against the logs only, not against a hash of the files it reads. The reducer's
     own bars are in no stamp.
   - The second part breaks the registration's rule that no survival figure is reported without the spending delivered
     beside it. S1's parts (l.213-214) and the replication's S1 (l.209) print survival only.
   - Fix:
     - The reducer recomputes the STAMP_FILES hash and refuses unless it equals every unit's `stamp.audit`.
     - At the read, the reviewer checks that reduce-phase4.mjs has no diff since the launch commit.
     - Print CAND less SHIP spending beside S1's parts and beside the replication's S1.
