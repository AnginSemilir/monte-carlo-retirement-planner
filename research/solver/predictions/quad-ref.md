# Prediction: quad-ref

- **Run:** `batch-quadref.sh` - result tags `qr-d5`, `qr-u5`, `qr-d15`, `qr-u15`, `qr-u5m5`; reducer `node research/solver/reduce-quadref.mjs`
- **Kind:** test
- **Written:** 25 Sep 00:43 UK, after M14c (results-m14c.txt) and O19 (results-o19.txt, results-o19-exact.txt) were read, and before any run with 15 return points; drafted 24 Sep ~21:35 UK (drafts/quad-oracle.md) at the maintainer's request, revised with both results as asked
- **Plan section:** PLAN.md 7h; O19, O20

## Question

O19 showed the 5-node final year mispriced the tier above: integrated exactly, it raises survival only where the tier
above is allowed (+0.18 +/- 0.04 over six households) and the three comfortable households' tier-above cost falls from
-0.21 +/- 0.06 to -0.09 +/- 0.04, which sits exactly at two se (results-o19-exact.txt). Every earlier year still averages
next year's table over the same 5 return points, and near the end-of-plan line that table is steep. Does averaging the
earlier years more finely (15 points every year, the final year exact) remove what is left of the tier above's cost,
or change survival at all? And does the 3-world approximation of the persistent shift matter?

## Derivation

The end-of-plan cliff is about V x sqrt(years left) wide in ln W (results-cliff-grid.txt: under one grid gap for the last
6-7 years at Medium), while the outer return points sit 1.36 V apart, so the 5-point average can still step across a
steep read for a few years before the end. But each earlier year's read is already an interpolated, smoothed table, so
the error should fall fast with the years left, and O19's remainder (-0.09 +/- 0.04 pooled) is small and at the line.
M14c puts S194's at-risk bets mostly 6 or more years out (results-m14c-horizon.txt), where the cliff is wider than a grid
gap, so finer averaging should not change them much. Expected: finer averaging changes little; if the remainder is a
table error it lies in the grid read (interpolation), not the averaging, or it is the score's own trade (O20).

## Prediction

Four arms on each of S194, S162, S252 and S330, paired on the same 3,000 held paths (seed 7011): the tier above allowed
or not, each with the final year exact and every earlier year averaged over 5 points (`qr-d5`, `qr-u5`) or 15 points
(`qr-d15`, `qr-u15`); the plan held at Medium, M14b's settings otherwise. Plus `qr-u5m5`: tier above, 5 points, final
year exact, FIVE market worlds, on S194 and S330.
1. **Finer averaging changes little:** 15 points against 5 changes survival by no more than two paired se on each
   household, with the tier above allowed and without it (8 comparisons).
2. **The remainder stays:** the three comfortable households' tier-above cost pooled with 15 points is within two se of
   the same pool with 5 points.
3. **Five worlds:** the 5-world arm is within two paired se of the 3-world arm on S194 and on S330.
4. **Reproduction:** `qr-d5` and `qr-u5` reproduce O19's `o19-dx` and `o19-ux` path for path (the same settings on newer
   code whose solver change is comments only) - a check, not a finding.

**The tie rule** (from O19, where two readings fell exactly on the line): "beyond two se" means strictly more than two
se; a difference of exactly two se is reported AT THE LINE and holds neither way.

## Falsified if

With the tier above allowed, 15 points raises survival beyond two se, pooled over S194, S162 and S252 (the mean of the
three paired differences, se the root sum of squares over three): the earlier years' averaging matters, and the outside
review's template-residual averaging for earlier years is worth building. **Separately**, if 15 points LOWERS survival
beyond two se on any household, the finer averaging exposes a different fault, and that is investigated before anything
else is read from this test.

## Fair-test table

Arm A is 5 return points every year before the last and arm B is 15; both with the final year exact, each run with and
without the tier above (four arms). The 5-world arm is compared with `qr-u5` alone. All in one batch on one snapshot.

| # | Variable | Arm A | Arm B | Status |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S194 S162 S252 (band 34 26 50), chosen because their tier-above bets lost in M14b, and S330 (64) because its bets helped; tuning set | the same | ACCEPTED - chosen on M14b's outcome on purpose, as in O19; paired on the same paths, so the choice cannot lean the comparison; the result describes these four |
| 2 | Changes the test makes to a household's inputs | PLANTIER=Medium Risk on pension and ISA (as M14b and O19) | the same | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8 of it | the same | SAME |
| 4 | The survival asked for, when a run lands | CONF 0.9, lambda held at M14b's value for each household (no landing) | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 3,000 paths, seed 7011 | the same paths | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | seed 7001, SEARCH=400 (unused: lambda held) | the same | SAME |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | MIX=3 | MIX=3; the 5-world arm `qr-u5m5` MIX=5 | SAME for the 5-against-15 comparison; TESTED only in item 3 (`qr-u5` against `qr-u5m5`) |
| 8 | How each year's return is averaged (quadrature points) | 5 points every year, the final year exact (FINALINT=1) | 15 points every year (QUAD=15), the final year exact | TESTED - the thing under test |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | the engine in the launch snapshot | the same | SAME |
| 10 | The minimum pot | MINPOTYEARS=1 | the same | SAME |
| 11 | The raise cap | RAISECAP=1.1 | the same | SAME |
| 12 | The estate preference | the default estate weight and shape | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | tiers 0/0 to 2/2, and with TIERSABOVE=1 one above (3/3), in both | the same pair of settings | TESTED - within each averaging, the tier-above setting is compared, as in O19 |
| 14 | The one-off cost lookahead | lookaheadYears 0 | the same | SAME |
| 15 | The tax-free lump sum rule | the full lump sum | the same | SAME |
| 16 | The taxable account's tier | GIA tier off | off | SAME |
| 17 | The grid: points, shares, gain buckets | 30 points x 6 x 6, default gain buckets | the same | SAME |
| 18 | The spending menu and the tier menu | levels 1.2 1.1 1 0.95 0.9 0.8; tiers as row 13 | the same | SAME |
| 19 | The switch margin and switching cost | MARGIN=0.005, the default switching cost | the same | SAME |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | M14b's lambda for each household, held; exponent 2 | the same | SAME |
| 21 | The raise credit, and whether it is weighted by survival | RAISE=0.003, RAISESURV=1 | the same | SAME |
| 22 | The price of a year with no money | FAILSHORT=1 | the same | SAME |
| 23 | Resilience and drift | WR=0, no drift | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | FINALEXACT=1; dead corners as default; F1 off; no block trim | the same | SAME |
| 25 | How it lands: bisection steps, level search | lambda held: no landing; the full level scan | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none (SOLVERONLY=1) | none | N/A - the solver against itself; no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one batch, one snapshot, all five arms | the same | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | simulated survival (failure includes ending under the minimum pot), paired; the cuts as in reduce-o19.mjs, supplementary only | the same | SAME |
| 30 | The reducer and its version | reduce-quadref.mjs (fair-gated on each pairing by its one line) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same 3,000 paths; se = sqrt(discordant)/N; pooled as the mean with the root sum of squares over the count; the tie rule above | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | simulated | simulated | SAME |
| 33 | For timings: what else the machine was running | solve times printed, no timing claim (four at a time) | the same | N/A - no timing claim |

## Changes after seeing results

No quad-ref result exists. After the launch (25 Sep 00:45 UK) and before any result was read, the thirtieth review found
(declared here; the registered text above is left as it was):
- **Row 29:** reduce-quadref.mjs computes no cuts; the row's "the cuts as in reduce-o19.mjs, supplementary only" is void.
- **Row 31:** item 2's difference-in-differences uses the per-path sample se, not sqrt(discordant)/N.
- **Item 2's power:** a hold shows only that the change in the tier above's cost is under about two se (about 0.09); it
  cannot tell the remainder staying from its full removal (O19's remainder is -0.0889; the same measure from 5 nodes to
  exact on O19's files is +0.1222 +/- 0.0458 over the three, results-o19-exact.txt, not registered).
- **The Question's O19 figures** (+0.18 +/- 0.04; -0.21 -> -0.09) stand beside O19's registered reading and were not
  registered there.
- **The tie rule** is judged on whole path counts (|net| = 2 x sqrt(discordant) exactly, with at least one discordant
  path) where they exist, and on the figures only for the per-path difference-in-differences; a pair with no discordant
  path (0 of 0: the same outcome on every path, difference and se both zero) reads as no change, 'within', not at the
  line - the reducer as launched read that case at the line (added 25 Sep 01:24 UK after the thirty-first review, before
  any result was read); reduce-quadref.mjs's planted check now has d15 unlike d5 and
  checks the se (a copy dropping d15, using d5 for it, or leaving /n out of the se now stops it).
Nothing in the question, the items or the falsifier changed.
- Read 25 Sep 04:26 UK (results-quadref.txt, whose first line carries the prediction-edited acceptance for the lines
  above). "No quad-ref result exists" was true when each line above was written: the first record landed 01:24:57 UK, after
  the last of them, and none was read before 04:26 UK.
