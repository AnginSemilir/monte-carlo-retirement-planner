# Prediction: o22-trace

- **Run:** `batch-o22.sh` - `audit-s126.mjs trace 16 1000 S360`, files `results/o22-trace/S360-{q5,q15,q5x,q15x}.json.gz`; reducer `node research/solver/reduce-o22.mjs S360`
- **Kind:** test
- **Written:** 25 Sept, 06:37 UK, before the run; after a tiny functional check of the trace mode (S360 at 4 points, 20 paths, a declared measurement, runs.log; its figures are not read)
- **Plan section:** PLAN.md O22 (gate: before 7e's prediction is registered); 7e

## Question

7i found 15 return points raise S360's simulated survival from 34.4 to 36.4 (+2.00 +/- 0.47, net 20 of 22 discordant)
while its opening table read barely moves (0.8 -> 2.4) (results-bridgequad.txt). 7i averaged every year over each arm's
own points, the final year included. 7h, which held the final year exact in both arms, found 15 points change survival
within two se on all four of its households (results-quadref.txt). Is S360's gain the final year's 5-node staircase (O19)
or the earlier years' averaging?

## Derivation

O19 showed the averaged final year scores survival as a weighted count of the 5 nodes that end at or above the minimum pot,
a staircase that misprices risk near the end line (final-year-staircase.mjs, results-final-year-staircase.txt), and the
exact final year raised survival where the tier above is allowed (results-o19-exact.txt, not registered). S360 is the
lowest-survival bridge case (34.4%), with the tier above allowed and a small minimum pot, so many of its paths end near the
line, where the staircase bites. 15 averaged points shrink the staircase's steps, which would explain a gain without any
change to the opening read. 7h's null result with the final year exact says the earlier years' averaging matters little
on the households it covered. Expected: the exact final year at 5 points reproduces most of the gain, and 15 points add
nothing beyond two se once the final year is exact.

## Prediction

S360 built as 7c and 7i built it (the library household, guardrails off, lookahead 0, floor 0.8 of target), F1 off, the
tier above allowed (riskAbove true, as 7i ran it before the 'auto' default of 25 Sep), the step-6 defaults in the mixture
through solvePlan, 16 points, lambda held at 0.0223606797749979, 1,000 paths of seed 7002, paired. Four arms: q5 and q15
(5 or 15 return points, the final year averaged over them: 7i's own arms), q5x and q15x (the same, the final year exact).
1. **The final year:** q5x against q5 raises survival beyond two se.
2. **The earlier years:** q15x against q5x is within two se.
3. **Reproduction (a check):** q5 and q15 reproduce 7i's S360 line (table and simulated survival to 0.1, and the paired
   whole counts, net 20 of 22, exactly).

**The tie rule:** judged on whole path counts: beyond two se is net^2 > 4 x discordant; net^2 = 4 x discordant (at least one
discordant path) is AT THE LINE and holds neither way; 0 of 0 is no change ('within').
Descriptive only, not an item: on the paths 15 points save, the first year the two runs move differently, and whether it
is a tier or a spending level.

## Falsified if

With the final year exact, 15 points raise S360's survival beyond two se (q15x against q5x): the earlier years' averaging
matters on S360, and the template-integral averaging for earlier years returns to the plan as a candidate.

## Fair-test table

Arms q5, q15, q5x, q15x, all four solves in one process on the same paths. Each pairing differs in one line: q5/q15 and
q5x/q15x in row 8, q5/q5x and q15/q15x in row 24.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S360 from the library, chosen because 7i found the gain there (O22) | the same | ACCEPTED - chosen on 7i's outcome on purpose; paired with itself, so the choice cannot lean the comparison; the result describes S360 only |
| 2 | Changes the test makes to a household's inputs | guardrails off, lookahead 0, floor 0.8 of target, as audit-s126.mjs builds it | the same | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8 of it | the same | SAME |
| 4 | The survival asked for, when a run lands | none: lambda held at S126's landed value (0.0223606797749979), as 7i | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 1,000 paths, seed 7002 | the same paths | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none (lambda held, no landing) | none | N/A - no search |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | the three-world mixture (solvePlan) | the same | SAME |
| 8 | How each year's return is averaged (quadrature points) | 5 points every year (q5, q5x) | 15 points every year (q15, q15x) | TESTED in the q5/q15 and q5x/q15x pairings; SAME in the other two |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | the engine in the launch snapshot | the same | SAME |
| 10 | The minimum pot | S360's own (printed as minPot 5000 in each ran line) | the same | SAME |
| 11 | The raise cap | 1.1 (solvePlan's default) | the same | SAME |
| 12 | The estate preference | the default estate weight and shape | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | the plan's tiers, one above allowed (riskAbove true, explicit: the product default is 'auto' since 25 Sep) | the same | SAME |
| 14 | The one-off cost lookahead | 0 | 0 | SAME |
| 15 | The tax-free lump sum rule | the full lump sum | the same | SAME |
| 16 | The taxable account's tier | off | off | SAME |
| 17 | The grid: points, shares, gain buckets | 16 points x 6 x 6 (total16x6x6), default gain buckets | the same | SAME |
| 18 | The spending menu and the tier menu | levels 1, 1.1, 0.95, 0.9, 0.8 (solvePlan's, capped at 1.1) | the same | SAME |
| 19 | The switch margin and switching cost | the defaults | the same | SAME |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | lambda 0.0223606797749979, held; exponent 2 | the same | SAME |
| 21 | The raise credit, and whether it is weighted by survival | 0.003, weighted (raiseSurv true) | the same | SAME |
| 22 | The price of a year with no money | the floor (failShort floor) | the same | SAME |
| 23 | Resilience and drift | 0, no drift | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the final year averaged over the arm's points (q5, q15); dead corners as default; F1 OFF; no block trim | the final year exact, finalIntegral (q5x, q15x); the rest the same | TESTED in the q5/q5x and q15/q15x pairings; SAME in the other two |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process, all four arms | the same process | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | simulated survival (failure includes ending below the minimum pot), paired; the table read printed only for the reproduction check | the same | SAME |
| 30 | The reducer and its version | reduce-o22.mjs (its gate reads each arm's ran line; shown refusing a planted lambda change) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same 1,000 paths; se = sqrt(discordant)/N; the tie rule above on whole counts | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | simulated | simulated | SAME |
| 33 | For timings: what else the machine was running | solve times printed, no timing claim | no timing claim | N/A - nothing timed |

## Changes after seeing results

None - no O22 trace result exists.
