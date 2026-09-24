# Prediction: m14c-bets

- **Run:** `batch-m14c.sh` - result tag `m14c` (each household's `<id>.bets.json`, beside the usual result file and record); reducer `node research/solver/reduce-m14c.mjs`
- **Kind:** test
- **Written:** 24 Sep ~18:15 UK, before any M14c run; the maintainer approved the test at ~18:00 UK ("Yes, run it")
- **Plan section:** PLAN.md M14b (to be written up with M14b's result; the register row for the losing bets)

## Question

In M14b, allowing one tier above the plan lost survival on comfortable households (S194 -0.27, S162 -0.20, S252 -0.17
points; results-m14b.txt). The records show the lost paths mostly reached the end just under the one-year minimum pot
(0.86-0.94 years of target in the last paid year, against 1.03-1.06 without the bet; results-m14b-why.txt), and the bets
that led to them were made a median 4-10 years earlier. The maintainer: "I'm surprised they make the wrong move, for me it
points to a problem with the solver." At the positions where the solver makes those bets, does its table rank betting
above staying when simulating both from the same position says staying is better?

## Derivation

The table scores the minimum pot as a hard line in the final year (src/solver/solve.js: alive only at or above it), as the
simulation does. Near a hard line, more spread helps a position below it and hurts one just above it (Jensen, both ways).
The table reads positions through a coarse grid and is optimistic in bad positions (M16: 3-5 points), so near the line
it can see a position as at risk when it is not. The table picks the bet (by construction), and the margins found in the
test of this audit were about 0.001 (a tenth of a survival point), so the bets are near-ties the table's error can
flip. Where the bet is truly right (a thin household far below the line, S330: 44 of its 53 saved paths would have run
out part-way), the simulation should agree with the table.

## Prediction

At up to 40 first-bet positions per household (a fixed draw from the 3,000 held paths of M14b's arm with the tier above),
the table's chosen bet and its best move without the tier above are each simulated from that position on the same 500
fresh paths (seed 9100 + position), following the same solved plan afterwards:
1. **S194, S162, S252** (M14b: 22 paths lost to the bets, 3 saved): staying simulates better than betting, pooled over
   each household's positions, beyond two standard errors on at least two of the three.
2. **S330, the control** (M14b: 53 saved, 17 lost): betting simulates better than staying, pooled, beyond two standard
   errors.
3. **The table's margins** are small: at least three quarters of all positions under 0.005 (half a survival point).
4. **Where it goes wrong:** pooled over the four households, the bet does worse than staying at positions where staying
   survives 90% or more, and better where staying survives under 50%.

## Falsified if

On S194, S162 and S252 pooled together, betting simulates at least as well as staying (the difference is above minus two
standard errors): the bets are not wrong when they are made, M14b's losses come from something else (the option changing
later or everyday decisions), and "the table misreads the end line" is wrong. **The test is void** if S330's bets
simulate worse than staying beyond two standard errors: the rollout would then be biased against betting and cannot
separate the two.

## Fair-test table

Arm A is the table's chosen bet at a position; arm B is the table's best move without the tier above at the SAME position.
Both are run in the same process, from the same solve, on the same fresh paths.

| # | Variable | Arm A | Arm B | Status |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S194 S162 S252 (band indices 34 26 50), chosen BECAUSE their bets lost in M14b, and S330 (64) as the control because its bets won; tuning set | the same households | ACCEPTED - chosen on M14b's outcome on purpose: the question is why those bets lost; every comparison is on fresh paths, so the choice cannot lean the rollouts, and the result describes these four, not the library |
| 2 | Changes the test makes to a household's inputs | PLANTIER=Medium Risk on pension and ISA (as M14b) | the same | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8 of it | the same | SAME |
| 4 | The survival asked for, when a run lands | CONF 0.9, lambda held at M14b's value (no landing) | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | positions from M14b's 3,000 held paths (seed 7011); each position's rollouts on 500 fresh paths, seed 9100 + position | the same fresh paths | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | seed 7001, SEARCH=400 (unused: lambda held) | the same | SAME |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | three-world mixture, MIX=3 | MIX=3 | SAME |
| 8 | How each year's return is averaged (quadrature points) | 5 | 5 | SAME |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | the engine in the launch snapshot | the same | SAME |
| 10 | The minimum pot | MINPOTYEARS=1 | the same | SAME |
| 11 | The raise cap | RAISECAP=1.1 | the same | SAME |
| 12 | The estate preference | the default estate weight and shape | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | the move at the position holds the tier above (index 3) | the best move that does not | TESTED - the thing under test |
| 14 | The one-off cost lookahead | lookaheadYears 0 | the same | SAME |
| 15 | The tax-free lump sum rule | the full lump sum | the same | SAME |
| 16 | The taxable account's tier | GIA tier off | off | SAME |
| 17 | The grid: points, shares, gain buckets | 30 points x 6 x 6, default gain buckets | the same solve | SAME |
| 18 | The spending menu and the tier menu | levels 1.2 1.1 1 0.95 0.9 0.8; tiers 0/0 to 3/3 | the same solve | SAME |
| 19 | The switch margin and switching cost | MARGIN=0.005, the default switching cost | the same | SAME |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | M14b's lambda for each household, held; exponent 2 | the same | SAME |
| 21 | The raise credit, and whether it is weighted by survival | RAISE=0.003, RAISESURV=1 | the same | SAME |
| 22 | The price of a year with no money | FAILSHORT=1 | the same | SAME |
| 23 | Resilience and drift | WR=0, no drift | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | FINALEXACT=1; dead corners as default; F1 off (M14b's setting) | the same | SAME |
| 25 | How it lands: bisection steps, level search | lambda held: no landing | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none (SOLVERONLY=1) | none | N/A - the solver against itself; no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process per household, both arms | the same process | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | simulated survival from the position (failure includes ending under the minimum pot); the estate on paths both survive; the table's score margin reported beside, never as the result | the same | SAME |
| 30 | The reducer and its version | reduce-m14c.mjs (fair-gated against m14b-up; refuses any household whose solve did not reproduce m14b-up path for path) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same 500 paths per position; se from the discordant paths; pooled over positions as the root sum of squares over the count | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | simulated | simulated | SAME |
| 33 | For timings: what else the machine was running | no timing claim | no timing claim | N/A - nothing timed |

## Changes after seeing results

None - no M14c result exists.
