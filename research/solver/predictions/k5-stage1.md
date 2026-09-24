# Prediction: k5-stage1

- **Run:** `batch-k5.sh` - result tags `k5-c<c>-x<exp>` (arm A, 24 cells of the grid); the target `k5t-fold-cap:gkFloor` (arm B); reducer `TARGET=k5t-fold-cap node research/solver/reduce-k5.mjs`
- **Kind:** test
- **Written:** 24 Sep 06:38 UK in PLAN.md (commit 31a1b52, "K5 ... AS RUN" and "PREDICTION"), before the batch started at 06:38:51 UK; moved to this file unchanged 24 Sep ~09:12 UK
- **Plan section:** PLAN.md "K5. Guardrail matching"

## Question

Which point of the dislike-of-cuts dial (c, the cost of one floor year) and the trim curve's exponent makes the solver
cut about as much, and in about the same shape, as the guardrails with the floor - the fairness condition for Phase 4?

## Derivation

On the twelve the guardrails-with-floor cut a median 2.38 years of target spending over a retirement (the plan's 2.36 was
the mean; target corrected 08:39 UK to 2.14, see below) at a median depth of 0.88; the solver at its landed lambdas cut a median 0.40, so matching
needs about six times more cutting, at a lower dislike of cuts. A steeper curve makes deep cuts dearer and spreads the
same total into more, shallower years; the 0.95 level makes a shallow cut available.

## Prediction

1. The total cut rises smoothly as c falls, at every exponent; the median household's total matches the guardrails'
   (within 10%) at c between 0.0003 and 0.001, a quarter to a tenth of the median landed value (0.004).
2. Depth: at exponent 2 the solver still cuts deeper than the guardrails at the matching c. At exponent 3 or 4 the
   median depth comes within 3 points of the guardrails' (0.88; 0.89 after the target correction), because the 0.95
   level becomes the cheap cut.
3. At the matching point the solver's survival is at or above the guardrails' on at least 9 of 12 (previewed, not
   tested).

## Falsified if

No grid point brings the median total cut within 10% of the guardrails' (the dials cannot reach it), or the best match
on both criteria needs exponent 2 or below.

## Fair-test table

| # | Variable | Arm A | Arm B | Status |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | step 2's twelve (band indices 20 6 50 74 38 16 32 64 26 10 14 68) | the same twelve | SAME |
| 2 | Changes the test makes to a household's inputs | none | none | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8 | the plan target; floor 0.8 honoured (gkFloor) | SAME |
| 4 | The survival asked for, when a run lands | CONF 0.9 with lambda held (no landing) | no ask | ONE ARM ONLY - the guardrails have no survival ask |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 3,000 held paths, seed 7002 | the same paths | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | seed 7001 (unused: lambda held) | seed 7001 picks the arm's withdrawal order | SAME |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | single-table fold, MIX=0 | fold, MIX=0 (corrected 08:39 UK from the mixture) | SAME |
| 8 | How each year's return is averaged (quadrature points) | 5 | no table | ONE ARM ONLY - the guardrails solve nothing |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | the engine in the 06:38 UK snapshot (commit 31a1b52) | the engine in the working tree at 08:29 UK (committed as e21279c, 08:39 UK) | ACCEPTED - the engine changes between them are the M23 guardrail cap (acts only when a guardrails plan sets raiseCap) and nothing else in the engine; the same return assumptions |
| 10 | The minimum pot | MINPOTYEARS=1 | MINPOTYEARS=1 (corrected 08:39 UK from each plan's own) | SAME |
| 11 | The raise cap | RAISECAP=1.1 | GUARDCAP=1.1 (corrected 08:39 UK from none) | SAME |
| 12 | The estate preference | estate weight 0.02, cap shape | no estate term | ONE ARM ONLY - a rule-based arm has no objective |
| 13 | The risk tier chosen, consent to change it, risk above | joint tier steps below the plan | the plan tiers, held | ONE ARM ONLY - tier moves are the solver's lever |
| 14 | The one-off cost lookahead | lookaheadYears 0 | 0 | SAME |
| 15 | The tax-free lump sum rule | the full lump sum | the full lump sum | SAME |
| 16 | The taxable account's tier | GIA tier off | no tier moves | ONE ARM ONLY - the solver-side setting |
| 17 | The grid: points, shares, gain buckets | 30 x 6 x 6 | no grid | ONE ARM ONLY - no table on the guardrails |
| 18 | The spending menu and the tier menu | levels 1.2 1.1 1 0.95 0.9 0.8 | the guardrails' own cut and raise rule | ONE ARM ONLY - each arm spends by its own rule; matching them is the point of K5 |
| 19 | The switch margin and switching cost | MARGIN=0.005 | none | ONE ARM ONLY - no tier switches on the guardrails |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | c in {0.0001 0.0003 0.001 0.003 0.01 0.03} x exponent {1.5 2 3 4} | none | TESTED - the dial being calibrated |
| 21 | The raise credit, and whether it is weighted by survival | RAISE=0.003, RAISESURV=1 | none | ONE ARM ONLY - the solver's objective |
| 22 | The price of a year with no money | FAILSHORT=1 | none | ONE ARM ONLY - the solver's objective |
| 23 | Resilience and drift | WR=0 | none | ONE ARM ONLY - the solver's objective |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | FINALEXACT=1; F1 off | none | ONE ARM ONLY - table reads |
| 25 | How it lands: bisection steps, level search | lambda held, no landing | none | ONE ARM ONLY - nothing lands on the guardrails |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | the guardrails with the floor, the engine's thresholds | ONE ARM ONLY - the rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | pickFixed on the search paths | ONE ARM ONLY - the rival's order |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | the 06:38 UK snapshot (commit 31a1b52) | the working tree at 08:29 UK (the k5t-fold-cap files; committed as e21279c at 08:39 UK) | ACCEPTED - between them: the M23 guardrail cap (the setting arm B is meant to have); ARMSONLY and GUARDCAP (switches that choose what runs); the runFixedPath fix (arm B's own code path - before it the rival arms did not run at all, they threw); F1 (bridgeRead, off by default, tables bit-identical when off); and solvePlan's step-6 and risk-above defaults in solve.js (the product entry point, which neither arm calls). None changes the solver arm's run; for arm B the only change in behaviour is the cap |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | total cut = years below x (1 - level when below); depth = level when below; raise total = years above x (level - 1) | the same definitions | SAME |
| 30 | The reducer and its version | reduce-k5.mjs (fair-gated) | the same | SAME |
| 31 | Paired or not, and the standard error used | medians over the twelve; a match of levels, not a paired test | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | simulated | simulated | SAME |
| 33 | For timings: what else the machine was running | no timing claim | no timing claim | N/A - nothing timed |

## Changes after seeing results

**24 Sep 08:39 UK - the target changed, after the run started and BEFORE any stage-1 cell was read.** The first
target, `results/flex-tiers`, differed from the cells in the market world (mixture), the raise cap (none) and the
minimum pot (each plan's own). Re-measured under the cells' own settings as `k5t-fold-cap` (`results-k5-targets.txt`):
median total cut 2.14 (was 2.38), depth 0.892 (0.882), raise total 1.07 (3.18). The prediction's text is unchanged
and is judged against the corrected target. Found by the maintainer's question on market worlds (ledger, 08:39).

**24 Sep 10:02 UK - corrections from the plan-auditor's review (09:45 UK; row 28's solvePlan item added 10:17 UK, after the 10:15 review), before any stage-1 figure was read:** the starting gap's
"median 2.36" was the mean (the median is 2.38); rows 9 and 28 named only part of the code between the two arms (the
full list is there now; the conclusion stands); the registration time.
