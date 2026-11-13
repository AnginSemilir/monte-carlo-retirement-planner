# Design review: Part D's D4, the candidate for couples against the app's rules and the couples' solver at the product's settings

Subject: `registrations/couples-d4.md` and the batch, audit, panel, sizing and read it names, before launch, at 4cd54db on
claude/project-access-i58m0x (code-id a8d0e9568319, the pilot's code; the audit stamp over STAMP_FILES 0783bdc5eab8, the
batch's AUDIT the same).

## What I read

Blobs (git hash-object, first 12): couples-d4.md be5c012e483f; audit-couples.mjs 7a818f8c708c; reduce-couples.mjs
ec7a2fbfdd51; size-couples.mjs 9cf914333053; couple-panel.mjs 78b04b290146; batch-couples.sh d9a10b802de3;
couples-orders.json 0dc6f3cb4245; couples-panel.json 133b00059a89; couples-paths.json 4cf12933f6a5; src/solver/couple.js
007be531192f; src/solverApp.js ff0b79d55a06; src/solverSettings.js 5d18fb6a3a6d; audit-phase4.mjs 5ace83959b96;
reduce-phase4.mjs ac319aad1f44; size-phase4.mjs ab2da96ea302; results-couples-pilot.txt 215b7b3ce427;
results-couples-sizing.txt 7468498d582c; PART-D.md 6c8b04e8b191. Also: STATE.md, CHECKLIST.md, code-id.mjs, fair-gate.mjs
(checkLogStamps), check-prediction.mjs, run-from-snapshot.sh, held-out.mjs, phase4-panel.mjs (touched, constants),
candidate.mjs (hashOf), solve.js solvePlan, research/engine.mjs (stepYear's spending and cost blocks, pathsForSeed,
gaussianPath, mulberry32), registrations/phase-4.md, reviews/2026-10-27-phase4-design.md and -design-2.md, results-phase4-sizing.txt,
and the launch plan's section 6 (origin/review/external-2026-10-21:research/reviews/2026-11-01/LAUNCH-PLAN.md). The pilot's
ten units (results/d4-pilot), the 56 landings (results/d4-land). Nothing of seed 7021.

What I ran (nothing written under research/ but this file; scratch scripts in the session scratchpad):
- `couple-panel.mjs --planted` 8 of 8; `reduce-couples.mjs --planted` 8 of 8; `size-couples.mjs --planted` 3 of 3.
- `reduce-couples.mjs --pilot`: byte for byte results-couples-pilot.txt. sizePilot and budgetOf over results/d4-pilot
  (imported, no file written): S011 19,000, S301F 17,000, 701.8 core-hours, engine 669.5: the sizing file's figures.
- `check-prediction.mjs registrations/couples-d4.md`: NOT COMPLETE (no registered seed; this file absent), as the author
  says. `--seeds ... batch-couples.sh`: passes today only because 7021 is not in the registry.
- `audit-couples.mjs registered part 0/200` (no PREDICTION_FILE), `audit-couples.mjs 10 part 0/200 7021`, and the registered
  call with D4_ONLY: each refused before a path was drawn.
- The panel from couples-orders.json and the landings: the orders frozen 14:58:25 UTC, the first landing 14:58:38; the
  touched hash recomputes to d639ac997267; each cohort's first 20 are the panel; all 56 landings landed; every panel row
  equals its landing; no panel base is in the touched set.
- A search for shared mulberry32 states between 7021's 19,000 paths and the paths of 7001, 7002, 7003, 7004, 7005, 7011 to
  7014, 7018, 7019, 7101 and 99001, at any offset up to 260 draws: none.
- Each panel couple's context (scratch, from readPanel): horizons, ages, bridge years, the cost year and whether anyone is
  retired in it; the pilot's costDelivered and failYear arrays.
- D34's rates at 19,000 paths by discordance (size-phase4.mjs thresholdFor and harmRate), and Phase 4's pilot discordances
  against APP (results-phase4-sizing.txt).
- A schedule of the batch under the 12-hour limit (the audit's unit order, four slots, a unit not done by the window's end
  re-run whole, as batch-couples.sh l.19 does), from the pilot's unit times.

Verdict: FAIL

Three BLOCKING findings, each a small fix to code that is stamped (so it must be made before launch: the read's gate refuses
any unit whose audit hash is not the files' as read, reduce-couples.mjs l.75). What holds, on the questions asked:
- The arms are the launch plan's: CANDC (each person by solveForApp at 45 points, the dial at 1, the rollout of D1 to D3),
  APP (armA without the tournament, D36), SHIPC (solvePlan at the product's settings, 30 points, the same rollout).
- Every arm runs on one plan per couple: inputsHash (audit-phase4.mjs l.77-83) over the context but the policy's fields,
  gated per couple (reduce-couples.mjs l.87, planted); the pilot's two couples each on one hash across five units.
- The panel is held out by the scan as Phase 4's was and its rule is mechanical (reproduced above); the one prior use
  outside the scan is MINOR 7. Seed 7021 is unused and shares no state with any seed in use.
- The decision rule and outcomes are fixed before the seed: Phase 4's bars (reduce-couples.mjs l.46, decide l.98-108), in a
  stamped reducer, the registration naming them. The pooled items are decisive at either path count the maintainer may
  choose: scaling the pilot's se to 40 couples, S1's se is about 0.014 points at 19,000 paths and 0.022 at 8,000, against a
  bar of -0.1; the path count changes only the flags' power. Settle one N in couples-paths.json and the registration before
  launch.
- The threshold-at-read rule keeps the quarter-point false-alarm rate (thresholdFor at the realised discordance's upper
  bound) and does not let a loss raise its own bar beyond what the rates price: the bar depends on the discordance alone,
  and harmRate already counts a true loss's own discordant paths. It does not keep the 1-point rate: finding 3.

## Findings

1. **BLOCKING. The cost years' spending, the launch plan's "the cost years are reported apart", is zero by construction on
   27 of the 40 couples, and the pooled figure averages those zeros in.**
   - Every panel couple has one one-off cost, in year 3. The engine's year has living spending only when someone is
     retired (research/engine.mjs l.2245 `if (anyRetired)`; the row's `targetSpend` is that spending, l.2644), and the audit
     counts a cost year only where `row.targetSpend > 0` (audit-couples.mjs l.144). On 27 couples nobody is retired in year
     3: all 20 younger couples (37 and 34, retiring at 52), and S189, S205, S223, S239 (55 and 52, retiring at 60), S259, S277,
     S293 (45 and 42, retiring at 60). Their costDelivered is 0 on every path in every arm.
   - The read takes every couple with a cost year (reduce-couples.mjs l.142, `withCost`), and spendingItem's denominator
     falls to 1 for a zero mean (reduce-phase4.mjs l.126), so each such couple adds an exact 0 to every path's average.
     The registered figure would be 13/40 of the retired couples' change, with its interval scaled alike.
   - On the pilot: S301F's costDelivered is 0 on 1,000 of 1,000 paths in all five units; the printed W0.02 figure -0.287
     (se 0.2090) is S011's -0.573 (se 0.4179) halved, and W0.01's +0.981 is S011's +1.961 halved.
   - Fix: take the cost-year spending over the couples with someone retired in the cost year only (13), naming the 27
     left out and why; beside it, per arm, the paths that fail in the cost year or the two after (failYear is already
     stored), for all 40; a planted couple whose cost falls in a working year must be left out of the spending item.

2. **BLOCKING. Nothing in the run ties CANDC to the candidate d71f65ae871e, and the files that set CANDC's configuration,
   arm A's settings and the read's arithmetic are outside both stamps, across a run that needs about 18 to 20 relaunches.**
   - The code hash covers research/engine.mjs, experiment.mjs, record.mjs, scenarios.mjs and src/solver/*.js only
     (code-id.mjs l.30-33). The audit's STAMP_FILES (audit-couples.mjs l.51) and the batch's AUDIT (batch-couples.sh l.17)
     add the audit, the panel scripts and data, select-phase4.mjs, audit-phase4.mjs and reduce-couples.mjs. Outside both:
     src/solverApp.js and src/solverSettings.js (APP_CANDIDATE, aimsOptions, APP_FLOOR, prepareForSolve: CANDC's whole
     configuration), candidate.mjs (candidatePlan: every arm's returns), phase4-panel.mjs (appPlan: arm A's guardrails,
     lookahead and cap), reduce-phase4.mjs (byPath, survivalItem, spendingItem, lossOf, harmFlag, lumpGroups: the decision's
     arithmetic), size-phase4.mjs (thresholdFor, harmRate) and stats.mjs (clopperPearson).
   - Phase 4's stamp held candidate.mjs, phase4-panel.mjs, size-phase4.mjs and reduce-phase4.mjs (audit-phase4.mjs l.68)
     and the candidate's hash, which its gate checked (reduce-phase4.mjs l.89). D4 dropped all of these.
   - The run record (audit-couples.mjs l.75) holds 14 settings per person; menuPlus (HR), jointWorlds, bridgeStep,
     switchMargin, pclsInterp, e3pcls, adaptiveLattice and readerSplit are part of d71f65ae871e and recorded nowhere, so a
     CANDC solved without HR or on another lattice passes the gate (reduce-couples.mjs l.48, l.78-84).
   - Each relaunch copies the working tree anew (run-from-snapshot.sh, `cp -r "$REAL/src" "$REAL/research"`), and
     RESUME keeps every unit whose log names the same code and audit hashes (batch-couples.sh l.19). An edit to
     src/solverSettings.js or src/solverApp.js between relaunches (the singles' beta runs on them meanwhile) leaves both
     hashes unchanged: earlier units are kept, later ones run on the new code, and the read's one-stamp check passes. The
     registration's line 3-4 ("refuses a unit stamped on any other version of the files it reads") is not true of the
     reducer's own arithmetic.
   - Fix: add those files (or code-id.mjs --smoke, which follows every import) to STAMP_FILES and the batch's AUDIT; stamp
     in each solver unit the hash of each person's options (candidate.mjs hashOf of APP_CANDIDATE for CANDC, PRODUCT_BASELINE's
     for SHIPC) and gate them against d71f65ae871e and 07c069b6e330, with a planted case (a unit with menuPlus removed refused).

3. **BLOCKING. D34's 1-point rate is not held for couples whose realised discordance is above about 12.4%, the registration
   reads as if it were, and the per-couple figures D34 (4) asks for are printed only for a flagged couple.**
   - At 19,000 paths, with the threshold set for a 5% false alarm at a quarter-point, a true 1-point loss reads as harm 0.901
     of the time at a 12.4% discordance, 0.888 at 13%, 0.846 at 15%, 0.803 at 17%, 0.744 at 20% (thresholdFor and harmRate).
   - On Phase 4's pilot, 16 of the 80 comparisons against APP had a point discordance above 12% (to 15.1%; upper bounds to
     16.75%, 27 of 80 above 12.4%), and D34 (2) gave those households more paths (to 26,000). D4 fixes every couple at
     19,000 and has no rule for a couple above the limit. "Each couple's thresholds are set at the read ... by the same rates"
     (registration l.42-43) is true of the false-alarm rate only.
   - D34 (4) asks the registration for every household's paths, threshold and both rates. Set at the read, they can only
     be printed by it, but report() prints a couple's threshold and 1-point rate only beside a flag (reduce-couples.mjs l.135).
   - Fix: the read prints, for all 160 comparisons, the realised discordance and its bound, the threshold, and both rates,
     naming each comparison whose 1-point rate is below 0.90; the registration states the limit and the rule for a couple
     above it (extended on 7021's next paths to sizeFor's N, which the path scheme keeps paired, or reported as below D34's
     rate); and the maintainer's ruling on this departure from D34 (2) and (4) is recorded before launch. "Seen" is not a
     ruling. The same text is needed at 8,000 paths, where the rate against APP is 0.61 to 0.64 for every couple.

4. MINOR. The fair-test diff between CANDC and SHIPC and the check of APP's run are gone (CHECKLIST 3). Phase 4's gate held
   CAND and SHIP to the same mix, lambda, bequest weight, levels and minimum pot (reduce-phase4.mjs l.58, l.107) and APP to
   "guardrails true", "lookahead 5", "raiseCap 1.1" (l.102). D4's gate compares only an arm's two weights. The audit
   enforces lambda (WANT) but not levels, mix or each person's minimum pot, and checks APP's guardrails and cap but not its
   lookahead (audit-couples.mjs l.118). Fix: port both, person by person, with a plant each.

5. MINOR. The budget understates the wall-clock and leaves the longest unit unstated. Each younger CANDC unit takes about 9.9
   hours at 19,000 paths (S301F's pilot unit: 709 s + 19,000 x 1.806 s + 768 s), 2 hours under the harness's 12-hour limit.
   The batch resumes by whole units, so each window completes at most one such unit per slot. My schedule of the audit's
   order shows 18 windows (about 216 hours, not 175), with about 160 core-hours killed and re-run. S011, the pilot's library
   couple, has the panel's shortest horizon (28 years; the library's mean is 40.3). Scaling the library units by horizon
   gives about 784 core-hours and 20 windows (240 hours). A host about a fifth slower puts the younger units at the limit,
   where they could never finish. Fix: run a unit's paths in chunks (the solve is deterministic, about 12 minutes), or state
   the longest unit, the wall-clock and the relaunch count; pilot or scale a long-horizon library couple.

6. MINOR. The primary metric is misdescribed (registration l.45-46). runPath fails a path when any year's own spending is
   unmet by more than £1, that is the target times the arm's chosen level or the guardrails' spend, or when the minimum pot
   is missed (audit-phase4.mjs l.89-104). "Every year's spending at the floor" is wrong. Phase 4's read review made the same
   point (its MINOR 4). Fix the wording.

7. MINOR. Prior use on the app's side is not recorded. S031, S083, S205, S307, S311 and S327 (the bases of S307F, S311F,
   S327F) appear in research/policy-study/confirmed-results.json (git grep at 4cd54db~1), which the scan does not read. As
   in Phase 4, which listed its own in Households, any effect favours APP. Fix: name them in the Households field.

8. MINOR. Some figures in the registration are not printed by a script (CHECKLIST 6). "28 of 40" (the panel's labels: 28,
   checked), "1.8 s a path against S011's 0.54 s" and "about three times" (the units' engineSecs; the sizing file prints
   only arm averages), and "every candidate tried landed, none passed over" (combine's console only; 56 landings, none not
   landed, checked). Fix: print them in results-couples-sizing.txt or a panel results file.

9. MINOR. The new gate has no planted case for a wrong path count, a wrong target, a NOT-LAUNCHED stamp, an audit hash
   that does not match the files, a missing or short rollout beside, more than one stamp, or A2's failing branch. The audit
   has none for wantProblems or costYearsOf (CHECKLIST 5). Phase 4's reducer planted 25. PART-D.md l.102-103 says D2.4's two
   limits are "for D4 to measure", but no registered item isolates them: name the item that does, or drop the claim.
