# Prediction: bridge-quad

- **Run:** `batch-bridgequad.sh` - `audit-s126.mjs quad` in four parts, joined in `results/bridgequad/log.txt`; reducer `node research/solver/read-bridgequad.mjs`
- **Kind:** test
- **Written:** 25 Sep 00:43 UK, after M14c and O19 were read, before any run of the quad mode beyond a tiny functional check (S126 at 4 points and 20 paths, run as a declared measurement 25 Sep 00:37 UK, runs.log; its figures are not read); drafted 24 Sep ~21:35 UK (drafts/bridge-quad.md) at the maintainer's request
- **Plan section:** PLAN.md 7i; 7e (the bridge fix to be chosen), O17

## Question

With F1 off, the table's opening survival on retired bridge households reads 34-97 points too low (results-f1v2.txt, the
OFF arm). F1 patches the read; the outside review's boundary-plus-residual reader (7e's candidate) would replace it. That
is worth building only if the misread is a representation problem - the bridge cliff runs across the 6-point pension-share
axis, between grid columns - and not an averaging problem that more return points would close. Does averaging each
year's return over 15 points instead of 5 close the bridge misread?

## Derivation

O19 showed the 5-point average misprices a steep final year. The bridge cliff is steep too, but in a different direction:
it depends on accessible money, W x (1 - share), and the table stores it at 6 share points, so at a position between two
share columns the read blends a live column with a dead one whatever the averaging. More return points change how next
year's table is averaged over growth, not where the share columns sit. F1's dead-corner drop was the fix that closed these
reads (results-f1v2.txt: the gaps collapse to about zero with v2). So finer averaging should leave the gaps nearly as large.

## Prediction

Six bridge cases (S126, bridge 4, bridge 6, share 0.95, S366, S360), each built exactly as the F1 v2 test built it, F1 off
in both arms, the step-6 defaults in the mixture through solvePlan, 16 points, 1,000 paths of seed 7002, paired: 5 return
points against 15 in every year (the final year as the product has it, 5 nodes, in both arms).
1. **The misread stays:** every case that misreads by more than 40 points at 5 return points still misreads by more than
   30 at 15 (at 5 points in the F1 v2 test's OFF arm: S126 -43.2, bridge 4 -91.3, bridge 6 -94.2, share 0.95 -72.7,
   S366 -96.6; S360 -33.6 is under 40).
2. **No harm:** 15 points loses survival beyond two se on no case.
3. **Reproduction (a check):** the 5-point arm reproduces the F1 v2 test's OFF arm (table and simulated survival, to 0.1)
   on every case - the same settings, on newer code whose solver change is comments and the added option.

**The tie rule:** "beyond two se" is strictly more than two se; exactly two se is reported AT THE LINE.

## Falsified if

15 return points close the gap to within 10 points on at least three of the six cases: the bridge misread is mostly
averaging, and the fix to build is better averaging (the template integral), not a new representation.

## Fair-test table

Arm A is 5 return points every year and arm B is 15, F1 off in both, both solves of a case in one process on the same paths.

| # | Variable | Arm A | Arm B | Status |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S126 and its variants bridge 4, bridge 6, share 0.95, and S366 and S360 from the library - chosen because the F1 tests found them misread (the in-class case, the short and long bridges, the edge, the two with money arriving) | the same | ACCEPTED - chosen for their misread on purpose; each is paired with itself, so the choice cannot lean the comparison |
| 2 | Changes the test makes to a household's inputs | the variants' bridge length and pension share, as audit-s126.mjs builds them; guardrails off, lookahead 0, floor 0.8 of target | the same | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8 of it | the same | SAME |
| 4 | The survival asked for, when a run lands | none: lambda held at S126's landed value (0.0223606797749979) | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 1,000 paths, seed 7002 | the same paths | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none (lambda held, no landing) | none | N/A - no search |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | the three-world mixture (solvePlan) | the same | SAME |
| 8 | How each year's return is averaged (quadrature points) | 5 points every year (the final year 5 nodes, as the product) | 15 points every year (the final year 15 nodes) | TESTED - the thing under test |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | the engine in the launch snapshot | the same | SAME |
| 10 | The minimum pot | the plan's own, as the F1 v2 test (printed as minPot in each ran line) | the same | SAME |
| 11 | The raise cap | 1.1 (solvePlan's default) | the same | SAME |
| 12 | The estate preference | the default estate weight and shape | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | the plan's tiers, one above allowed (tiersAbove 1, solvePlan's default) | the same | SAME |
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
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | final year exact (the product's), dead corners as default, F1 OFF, no block trim | the same | SAME |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process per case, both arms | the same process | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | the gap: the mixture's opening table read minus simulated survival (failure includes ending below the minimum pot); simulated survival, paired | the same | SAME |
| 30 | The reducer and its version | read-bridgequad.mjs (its gate reads each case's two "ran" lines; shown refusing a planted mismatch) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same 1,000 paths; se = sqrt(discordant)/N; the tie rule above | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | the table read is reported ONLY as the misread under test, never as a result | the same | SAME |
| 33 | For timings: what else the machine was running | solve times printed, no timing claim | no timing claim | N/A - nothing timed |

## Changes after seeing results

None - no bridge-quad result exists.
