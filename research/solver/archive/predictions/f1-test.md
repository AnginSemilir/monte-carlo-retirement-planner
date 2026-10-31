# Prediction: f1-test

- **Run:** `node research/solver/audit-s126.mjs f1 16 1000 variants` and `... library` (one script; off and on paired inside it); logs kept in `results-f1.txt`
- **Kind:** test
- **Written:** 24 Sep 08:05 UK in PLAN.md (commit 6dd1181, "F1 TEST - PREDICTION"), before the run; moved to this file unchanged 24 Sep ~09:12 UK
- **Plan section:** PLAN.md "S126's dead corner (#106)", the F1 test

## Question

Does F1 (the cliff-aware read in retired bridge years) close the table's misread on S126's class without costing
survival anywhere, and does it end the pension sitting below its tier for the whole retirement?

## Derivation

See PLAN.md "S126's dead corner (#106): root cause": the bridge-year cliff lies along the pension share at
a* = 1 - (floor need)/W; the a = 1 node is dead, so the log-odds blend misplaces the cliff. F1 drops dead share-corners
when the accessible money covers the floor need, and caps survival by the chance the accessible money lasts.

## Prediction

1. The class: table within +/-5 points of simulation on every in-class case, except the two on the cliff edge (share 0.95
   and bridge 6, coverage 1.02 at the floor): there within +/-15.
2. No survival cost: simulated survival not lower with F1 than without, beyond two paired se, on any case.
3. Behaviour: on S126 and the library class, the years the pension sits below its tier fall by at least half (today 40),
   toward the unaffected twins' 5-11.
4. Out of class: bridge 0 unchanged; share 0.50 and 0.70 within 0.5 of the off values; share 0.78's 40-year signature
   falls, like item 3.
5. The truly short controls (S360, S366): F1 never activates at the start, so they are read low and simulate low, as
   without it.

## Falsified if

An in-class case away from the edge still misreads by more than 10 points, or any case loses survival beyond two paired
se. Then F2 (the coverage coordinate) is built instead.

## Fair-test table

| # | Variable | Arm A | Arm B | Status |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | the 12 S126 variants and S120 S122 S124 S128 S130 S360 S366 | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | variants of S126: pension share, bridge length, wealth | the same variants | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8; guardrails off | the same | SAME |
| 4 | The survival asked for, when a run lands | no ask: lambda held at S126's landed 0.02236 | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 1,000 held paths, seed 7002 | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none (no landing, no rival) | none | N/A - nothing is chosen on search paths |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | single table, as step 2 (solve(), no mixture) | the same | SAME |
| 8 | How each year's return is averaged (quadrature points) | 5 | 5 | SAME |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | one process, one engine build | the same process | SAME |
| 10 | The minimum pot | each plan's own (step-2 flags) | the same | SAME |
| 11 | The raise cap | none (step-2 flags) | none | SAME |
| 12 | The estate preference | the step-2 estate settings | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | joint tier steps below the plan | the same | SAME |
| 14 | The one-off cost lookahead | lookaheadYears 0 | 0 | SAME |
| 15 | The tax-free lump sum rule | the full lump sum | the same | SAME |
| 16 | The taxable account's tier | GIA tier off | off | SAME |
| 17 | The grid: points, shares, gain buckets | 16 points x 6 x 6 | the same | SAME |
| 18 | The spending menu and the tier menu | levels 1.2 1.1 1 0.95 0.9 0.8 | the same | SAME |
| 19 | The switch margin and switching cost | the default margin | the same | SAME |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | lambda held 0.02236; exponent 2 | the same | SAME |
| 21 | The raise credit, and whether it is weighted by survival | raise weight 0.003; RAISESURV off (step-2 flags) | the same | SAME |
| 22 | The price of a year with no money | failureShortfall off (step-2 flags) | the same | SAME |
| 23 | Resilience and drift | resilience 0 | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | bridgeRead off; finalExact on | bridgeRead ON | TESTED - F1 |
| 25 | How it lands: bisection steps, level search | no landing | no landing | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process | the same process | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | table: year-0 survival read; sim: simulated survival; years below plan tier; years below target (spend years - at target) | the same | SAME |
| 30 | The reducer and its version | audit-s126.mjs f1 | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same 1,000 paths; se = sqrt(discordant)/N | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | the table read is reported ONLY as the misread under test, never as a result | the same | SAME |
| 33 | For timings: what else the machine was running | no timing claim | no timing claim | N/A - nothing timed |

## Changes after seeing results

None to the prediction. Note for the write-up: the test ran on step 2's flags (no M17 fix, no raise cap, each plan's
own minimum pot), not the step-6 defaults - fair between its arms, but whether F1's effect carries to the defaults (and to
the mixture) is C8's question, not this test's.
