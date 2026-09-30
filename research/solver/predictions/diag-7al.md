# Prediction: diag-7al

- **Run:** `research/solver/batch-7al.sh` - results/diag7al/case0-7.txt (audit-7al.mjs), read beside the records each solve is held to (results/diag7ah, diag7ag, diag7aa, diag7af); reduced by `reduce-7al.mjs` in the real tree into results-7al.txt
- **Kind:** test
- **Written:** 30 Sept, before the run (its time is its registering commit's, git log); designed by the deep review after 7ah (deep-review-log.md, 30 Sep 14:39 UK, its decisive test), amended by the deep review after 7ai (30 Sep 18:03 UK: the reference's own draw, the wealth-axis split and claim bands, OFF/PRODUCT on S194); its FALSIFIED consequence amended before launch after the deep review after 7ak (30 Sep 19:56 UK)
- **Seeds:** 7002 tuning (its first 2,000 paths, the long-run shift set to each world's node). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched. **Disclosed:** the build check results/7al-build2.log (the S360 ORDER unit at 4 points and 30 paths a world, on 3951645, before the 18:03 amendments) printed its lines at that size; the build check on the amended script, results/7al-build6.log (units 1, 3, 5 and 7 on d221b8d), was still running at registration (launched 18:36 UK, runs.log; the registering commit 18:35 UK): its outcome is recorded when it ends, and the preflight runs all eight units through the reducer before launch (the plan-auditor's MINOR 3 of 30 Sep); no figure at the registered size has been seen, and none of the build checks' figures is read here
- **Unmasking:** none - nothing is fixed or judged for harm: the test measures each unit's own solved tables against its own policy's paths, to locate O66's error by stage
- **Plan section:** PLAN.md "7al"

## Question

O66: on S128, S130 and S370 the bundle's year-0 table reads 4.2 to 8.0 points above its simulated survival (results-7ag.txt, results-7ah.txt; S370 +7.89 under the order-drawn reference), and those households' paths fail after pension access. Is the error the tables' overvaluation of survival after access (the deep review after 7ah's hypothesis (1)), or is it set in the bridge years by the reader's reassembly (its hypothesis (2))? And does the reader's reference match its own draw, and the engine's bridge payment, world by world?

## Derivation

- **The martingale** (the 14:39 review): under a policy its table was solved for, the table's claim along that policy's own paths is a martingale - this year's claim is next year's on average, and the last year's is the outcome. Summed over a stage, a path's residuals telescope to its claim at the stage's start less its claim at its end, one value a path, so a stage's calibration is read on independent paths: the after stage as the claim at access against the share that survive (a count), the bridge stage as the mean of claim at year 0 less claim at access (a continuous value, reported).
- **The level to expect** (derive-7al.mjs, results-derive-7al.txt): the year-0 error G is +4.20 on S128, +8.04 on S130, +5.00 on S370 READER (+7.89 ORDER), -0.11 on S194 OFF/TS+J (7aa's record; its bad world -0.88 at 1,000 paths) and -13.27 on S360 READER (pessimistic; O36). If the bridge is calibrated (hypothesis (1)), the after stage carries the whole error, about G over the share alive at access: 4.20 to 6.10 on S128, 8.04 to 9.69 on S130, 5.00 to 6.71 on S370 READER. **The weighting (the plan-auditor's MINOR 4 of 30 Sep):** G is the mixture's error, its worlds weighted 1/6, 2/3 and 1/6, while item 1 pools each unit's three node worlds at 2,000 paths each, about equally; so the item's level is G's only if the optimism is spread evenly across the worlds - about half of it if it sits in the middle world (S128 about 2.1 to 3.0, at its detection floor), about double if it sits in the bad world.
- **The item's power** (results-derive-7al.txt): with 6,000 paths a unit (three worlds) alive at access, the smallest optimism a unit reads OPTIMISTIC at (2 points plus z sd, z 2.450 at Holm's first step over 7) is 2.10 to 3.58 points: every O66 household's hypothesis-(1) level sits above it. O66's pool (about 24,000 paths, survival about 81%) has a Clopper-Pearson lower end 0.50 points under its point, so FALSIFIED is reachable while the pooled optimism is under about 1.5 points.
- **S194:** O66's S194 figure (+4.24 in its bad world under OFF+J, results-7t.txt) came from 7t's settings; 7aa's record at W0.02, the solve 7al holds S194 to, reads -0.88 there. S194 is not expected to read OPTIMISTIC, so HELD rests on two of S128, S130 and S370.
- **Claude's choices, before any run:** item 1 is post-access optimism, and the reference against its own draw and the engine's payment is REPORTED, not an item - a departure from both reviews, whose first item was that comparison (14:39: 'its first item is ORDER's p0 by world'; 18:03: add the own draw and report the policy's beside it): the reference is read against its own draw on 2,000 paths a world as a reported interval, and the maintainer's 15:19 hold on ORDER waits for that reading, not for a verdict on it (the plan-auditor's MINOR 1 of 30 Sep); the units (the reviews'); 2,000 paths a world (the review's 3 x 2,000); the item on the household with its worlds pooled, not the unit-world (21 unit-worlds at 2,000 paths leave FALSIFIED unreachable: a Clopper-Pearson interval of 2 to 3 points against any margin a table can be held to); the margin 2 points (about half the smallest O66 error, S128's 4.20); mid-cell as a weight on the node above between 0.25 and 0.75; the claim bands (under 50, 50 to 90, 90 to 99, 99 and over).

## Prediction

Item 1 HELD: two or more of S128, S130 and S370 (READER) read OPTIMISTIC after access; S194 OFF does not. Reported, expected: the bridge stage close to calibrated on S128, S130 and S370 (within about 2 points) and strongly pessimistic on S360 (O36's pessimism sits in the bridge); ORDER's after stage on S370 within about a point of READER's (the reference acts in the bridge); the reference within about a point of its own draw in every world.

## Falsified if

No unit reads OPTIMISTIC and O66's four units pooled read NO MATERIAL OPTIMISM (the pooled after stage's Clopper-Pearson lower end at the mean claim less 2 points or more): the tables are calibrated after access, and O66's year-0 error sits in the bridge.

## Fair-test table

Arm A and arm B as the batch script sets them. SAME, TESTED (the one thing that differs), ONE ARM ONLY (a setting
only one arm has - say why that is fair), N/A (does not apply here - say why) or ACCEPTED (differs, and why that
does not bias the comparison). Rows that are SAME may be deleted: then keep the line "- **All other rows: SAME**" below the
table (every other status is written out, with its reason).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S360, S370 (7ah's), S128, S130 (7ag's), S194 (the no-reader control) | the same | N/A - one arm: each unit's table against its own paths; the units are the reviews' (where O66 and O36 were seen), on the tuning panel |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | the claim at access, on seed 7002's first 2,000 paths at each world's node | the outcome on the same paths | SAME - one run gives both; the same 2,000 paths in every unit and world |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing: lambda held |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | world k's table | the paths with the long-run shift held at world k's node | SAME - each world's claim is read on its own world's paths |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | READER, ORDER (S360, S370) and OFF (S194) as each record solved | the same | ONE ARM ONLY - the bridge read is the unit's own setting, each held to its record; ORDER beside READER is reported, not an item |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code | the records' code (7ah 05be10bd7b34; 7ag and 7af 4d91a3e1d649; 7aa eb7b84680587) | ACCEPTED - the gate holds every solve to its record (table, ran line but the path count, gap and opening, joint line), so the tables read are the records' |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | the table's survival claim for the move chosen, at access (world k's table, scoreMoves) | the share of those paths that survive the plan (the engine's failure rule) | SAME - declared; this test compares them, which is its point |
| 31 | Paired or not, and the standard error used | exact binomial lower tail at the mean claim less the margin; Clopper-Pearson | the same | SAME - declared: exact for equal chances, conservative for unequal ones (Hoeffding 1956, Theorem 4) |
| 32 | The table's number is never the result: survival is simulated | the table's claim at access | the simulated outcome of the same paths | TESTED - the table's calibration against simulation, after access, is the thing tested |
| 33 | For timings: what else the machine was running | the solve seconds are printed, not read | the same | N/A - no timing is read |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Item 1 (post-access optimism, the one primary outcome):** on each TS+J unit (seven), its three worlds pooled: n the paths alive at access, c their mean claim there (points), s those that survive the plan. The margin D is 2 points. p = P(Bin(n, (c - D)/100) <= s), Holm across the 7 units. A unit reads OPTIMISTIC when its Holm p is under 0.05 and c - 100 s/n is D or more; NO MATERIAL OPTIMISM when the Clopper-Pearson 95% lower end of s/n, in points, is c - D or more; else INCONCLUSIVE. O66's four units (S128, S130, S370 READER and S194 OFF) are also pooled into one. HELD when 2 or more of those four read OPTIMISTIC; FALSIFIED when none of the 7 reads OPTIMISTIC and O66's pool reads NO MATERIAL OPTIMISM; else INCONCLUSIVE. One look.
- **NOT SETTLED:** any gate fails (the stamps of 7al, 7ah, 7ag, 7aa and 7af; a unit missing, twice or not done; any setting off the registered ones; a solve not its record's - table, ran line but the path count, gap and opening, joint line; a line missing; the lines computed apart disagreeing - the paths through the bridge against the engine's paid count, the after stage's paths and survivors against it and the node line, the stage means against the per-year residuals' sums).
- **Reported, not items:** each unit-world read the same way (unadjusted p); the reference against its own draw and the engine's bridge payment by world, with Clopper-Pearson intervals (the review after 7ai: the policy spends above the floor and de-risks, so its payment alone is no calibration); the bridge stage's per-path mean with a normal 95% band (not an exact test); ORDER beside READER on S360 and S370; the shipping default on S194 (its world tables each hold their own world's policy while its paths run the mixture's, so its residual carries that gap too); the residual pooled by share position, wealth position and claim band; the per-year residual.
- **Declared choices, not derived:** D = 2 points; the pooling of worlds within a unit; HELD at 2 of O66's 4; the mid-cell weights and the bands.

## Decision fed

- **HELD:** O66 is the tables' overvaluation after access (grade B for the households that read OPTIMISTIC: one run on one seed; the plan-auditor's MINOR 2 of 30 Sep). Where it sits - mid-cell on the wealth axis near depletion, a claim band, a world - is read from the reported split and names the next step (the review's first candidate, late-life interpolation near depletion, or the per-world tables); a design for it goes to the maintainer before 7u, as the 15:33 decision gates 7u on 7al.
- **FALSIFIED:** no unit's post-access optimism reaches the 2-point margin and O66's pool reads NO MATERIAL OPTIMISM: O66's after-access overvaluation is under 2 points on these units. It is NOT re-filed under the reader by elimination (amended before launch, the deep review after 7ak, 30 Sep 19:56 UK): an optimism under 2 points with no reader in it stands in the records - 7ak's S194 (OFF/TS+J, no reader) at +1.33 and +1.41 after access under P, M16's 3 to 5 points in the 50-95% band (results-calibration.txt), Phase V's V2 optimism falling as the wealth points rise (results-phase-v.txt) - so O66 stays with the interpolation family; the bridge stage's reported readings and the reference's calibration are read beside it, and the next step is the one-action-table test (the deep review after 7ak: the tables at one action, the plan's tiers and the de-risked tiers, each world at its node, on S194 and S130, log-odds against linear along the wealth axis and 60 wealth points), which splits interpolation bias from the chooser picking moves on interpolated values.
- **INCONCLUSIVE:** reported with its sizes; no design rests on it, and 7u's gate is put to the maintainer with the sizes.
- **The order-drawn reference** (the maintainer, 30 Sep 15:19 UK: out of the bundle and 7u until 7al reads): put back to the maintainer with ORDER's reported after and bridge stages beside READER's and the reference's calibration against its own draw.
- **In every branch:** no default change; no margin or charge default; no 7u; no seed 7013.

## Provenance

- The design: the deep review after 7ah (deep-review-log.md, 30 Sep 14:39 UK) and after 7ai (30 Sep 18:03 UK); O66 and O36 (PLAN.md); the plan's 7al row.
- The records: results-7ag.txt, results-7ah.txt, results-7af.txt and results/diag7aa (the year-0 errors; derive-7al.mjs); results-7ah-secs.txt (this machine's solve times).
- The build: audit-7al.mjs (build-checked through the light lane before the amendments, results/7al-build2.log; the amended script's check, 7al-build6.log, running at registration; builds 3 to 5 stopped in their smoke runs as the lines changed), reduce-7al.mjs (planted 40; mutations 30 of 30 caught, one equivalent mutation noted, results-reduce-7al-mutations.txt), batch-7al.sh, preflight-7al.sh, preflight-parse-7al.mjs, derive-7al.mjs.

## Derivation script

- `derive: research/solver/derive-7al.mjs > research/solver/results-derive-7al.txt sha256 02307bfe0d505a87`
  (the year-0 errors by unit from the records, hypothesis (1)'s post-access level, the item's power and O66's pooled interval).

## Point and interval

80% intervals, the author's, the after stage's optimism c - survived in points:
- S128 READER +5 (+1 to +8); S130 READER +8 (+3 to +11); S370 READER +5 (+1 to +8), ORDER +6 (+1 to +10).
- S194 OFF (TS+J) 0 (-1.5 to +1.5); S360 READER and ORDER +1 (-3 to +5).
- The bridge stage: within 2 points on S128, S130 and S370; S360 -10 (-20 to -3).
- The reference against its own draw: within a point in every world (the linear reference's lognormal mix a little off where the pots differ).

## Credence

The author's probability that item 1 reads as predicted (HELD): 0.55. For: the three households' errors are 4 to 8 points, their paths fail after access, and hypothesis (1)'s level clears the item's detection floor by about 1 to 6 points if the optimism is spread evenly across the worlds (less if it sits in the middle world, where S128's level falls to about its floor; more if in the bad world). Against: the reader's reassembly sets the year-0 level on bridge households (the review's (2)), so part of each error may sit in the bridge and leave the after stage under the floor; S370's ORDER error is 2.9 points above READER's, which (1) says the reference cannot move after access.

## Power

- **Item 1** (results-derive-7al.txt): 6,000 paths a unit; the smallest OPTIMISTIC optimism 2.10 to 3.58 points; hypothesis (1)'s levels 4.20 to 9.69 on O66's three bridge households at an even spread across the worlds (the item pools its worlds about equally, the mixture weights them 1/6, 2/3, 1/6: about half that level if the optimism sits in the middle world, about double in the bad world). FALSIFIED reachable while O66's pooled optimism is under about 1.5 points (its interval's lower end 0.50 points under the point).
- **Time:** eight units, four at once. Solves on this machine: TS+J 1,525 to 2,287 s on S360 and S370 (results-7ah-secs.txt), the others about 2.1 times their records' (S128, S130 and S194 about 1,500 to 1,800 s), OFF/PRODUCT about 600 s. The forward runs: 6,000 paths a unit with one scoreMoves beside each chooser call (7ak's 8,000-path runs with the same read are its nearest measure, not yet timed): perhaps 15 to 30 minutes a unit. About 45 to 70 minutes a unit, two rounds: about 1.5 to 2.5 hours, about 6 to 9 core-hours.

## Budget line

O66's step (the deep review after 7ah, its decisive test; the 15:33 decision gates 7u on it): where the tables misjudge survival, by stage; about 6 to 9 core-hours, about 1.5 to 2.5 hours on four cores (the Time line), after 7ak.

## Pre-mortem

- **Most likely:** INCONCLUSIVE - the bridge stage carries part of each error (the reader's reassembly), so only one of S128, S130 and S370 clears the floor after access; the reported bridge stage then sizes the split.
- **Second:** NOT SETTLED by the identity gate on S194 OFF/TS+J, held to 7aa's record (the oldest code, eb7b84680587): 7af held S194's shipping default to 7aa and 7ah held the bundle to 7af and 7ag, but OFF/TS+J has not been re-solved against 7aa since 7ac; a drift there stops the whole read.
- **Third:** HELD, but the post-access optimism sits in one world (the bad one) and the per-world tables, not interpolation, carry it: the reported per-world reads and bands then point away from the review's first candidate.
- **The smoke run:** smoke.sh (locked) does not run audit-7al.mjs; the preflight through the launcher (preflight-7al.sh: all eight units at 4 points and 20 paths, read by preflight-parse-7al.mjs through the reducer's own parse, gate and reading, with three planted faults) and the build checks stand in.

## Changes after seeing results

None.
