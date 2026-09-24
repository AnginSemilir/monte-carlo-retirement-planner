# Prediction: o19-final

- **Run:** `batch-o19.sh` - result tags `o19-d5`, `o19-u5`, `o19-dx`, `o19-ux` (each household's result file and record); reducer `node research/solver/reduce-o19.mjs`
- **Kind:** test
- **Written:** 24 Sep 20:28 UK (committed 20:45 UK), before any run with the exact final year beyond its unit test; the maintainer asked at 20:15 UK to prioritise testing the outside review's ideas
- **Plan section:** PLAN.md O19 (the final year's 5-node staircase), O18 (M14b's lost bets)

## Question

The solver scores the plan's last year as the weighted count of 5 quadrature nodes that end at or above the minimum pot,
and the estate credit is zero below it, so both are staircases in wealth. In one year, one pot and three worlds, that
rule prices Medium to Medium/High at 0.00 points of survival for pots 1.20 to 1.25 times the minimum, where the exact
cost is 2.04 to 3.44 (results-final-year-staircase.txt); on S194's own tiers at 1.22 times its floor it reads 98.87%
where the exact figure is 95.32% (final-integral.test.mjs). M14b found that allowing one tier above the plan cost
comfortable households survival, the lost paths ending just under the minimum pot (results-m14b.txt,
results-m14b-why.txt). With the final year integrated exactly (the crossing shock, `finalIntegral`), does the tier above
stop costing those households survival, while still helping the thin ones?

## Derivation

At the final year the tier above adds spread. Near the line a riskier tier moves probability across it both ways, and the
5-node rule only sees a move when a node crosses the line, so over a band of pots it charges the riskier tier nothing for
the extra downside while the estate credit, which rises with the riskier tier's higher mean, still pays it. The table
then prefers the bet in the last years, and M14b's lost paths end exactly there: just under the pot, bets made 4-10
years before the end. Integrated exactly, the downside is priced at every pot, so the table should stop preferring bets
that lose survival near the end, and earlier years inherit a final layer without steps. Where the bet is right (a thin
household far below the line), the exact rule charges the same kind of cost it credits, so the gain should remain.
The exact rule changes nothing else: the same cash flow, growth and rules, only the final year's average (evidence: the
code - src/solver/solve.js keeps the 5-node loop as the `else` branch of each `t === T && FINT` test, in both backward
loops and the forward pick; and final-integral.test.mjs checks the final year itself: survival within 5.5e-6 and the
estate within 0.03% of a brute-force integral of the same growth).

## Prediction

Four arms on each household, paired on the same 3,000 held paths (seed 7011): no tier above / tier above, each with the
5-node final year and with the exact final year; the plan held at Medium, M14b's settings otherwise.
1. **S194, S162, S252** (M14b's lost bets): with the final year exact, allowing the tier above costs no survival beyond
   two paired se on each of the three.
2. **S330 and S354** (M14b's thin gainers): with the final year exact, the tier above still raises survival beyond two
   paired se on both.
3. **The bets themselves:** on S194, S162 and S252, the paths that ever hold the tier above fall by a third or more
   from the 5-node arm to the exact arm.
4. **S172** (M14b's estate trade): the survival cost of the tier above is smaller with the final year exact than with 5
   nodes (the trade is the estate term doing its job; the exact rule prices its downside, so it should buy less of it).
5. **No harm:** the exact final year loses survival beyond two paired se against the 5-node rule nowhere (either tier
   setting, any household).

## Falsified if

Pooled over S194, S162 and S252 (the mean of the three paired differences, se the root sum of squares over three),
allowing the tier above with the final year exact still costs survival beyond two se: the staircase is not the cause of
M14b's lost bets, or not the only one. **Separately**, the exact final year is not carried forward if it loses survival
beyond two paired se anywhere (item 5).

## Fair-test table

Arm A is the 5-node final year and arm B the exact final year, each run with and without the tier above (four arms).
Within each final-year rule, the two tier settings differ only in row 13; within each tier setting, the two final-year
rules differ only in row 8. All four run in one batch on one code snapshot.

| # | Variable | Arm A | Arm B | Status |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S194 S162 S252 (band 34 26 50) chosen BECAUSE their bets lost in M14b, S172 (28) for its estate trade, S330 S354 (64 68) because the bet helped; tuning set | the same households | ACCEPTED - chosen on M14b's outcome on purpose: the question is whether the staircase caused those outcomes; the comparison is paired on the same paths, so the choice cannot lean it, and the result describes these six, not the library |
| 2 | Changes the test makes to a household's inputs | PLANTIER=Medium Risk on pension and ISA (as M14b) | the same | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8 of it | the same | SAME |
| 4 | The survival asked for, when a run lands | CONF 0.9, lambda held at M14b's value for each household (no landing) | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 3,000 paths, seed 7011 | the same paths | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | seed 7001, SEARCH=400 (unused: lambda held) | the same | SAME |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | three-world mixture, MIX=3 | MIX=3 | SAME |
| 8 | How each year's return is averaged (quadrature points) | 5 nodes every year, the final year included | 5 nodes before the final year; the final year exact (`FINALINT=1`: the crossing shock for survival, 12-point Gauss-Legendre over the surviving shocks for the estate) | TESTED - the thing under test |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | the engine in the launch snapshot | the same | SAME |
| 10 | The minimum pot | MINPOTYEARS=1 | the same | SAME |
| 11 | The raise cap | RAISECAP=1.1 | the same | SAME |
| 12 | The estate preference | the default estate weight and shape | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | tiers 0/0 to 2/2, and with TIERSABOVE=1 one above (3/3), in both rules | the same pair of settings | TESTED - within each final-year rule, the tier-above setting is the second thing compared, as M14b |
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
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | FINALEXACT=1 (the final year scored at the exact state); dead corners as default; F1 off; no block trim | the same | SAME |
| 25 | How it lands: bisection steps, level search | lambda held: no landing; the full level scan | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none (SOLVERONLY=1) | none | N/A - the solver against itself; no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one batch, one snapshot, all four arms | the same | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | simulated survival (failure includes ending under the minimum pot); paths that ever hold the tier above; the median estate on paths both arms survive | the same | SAME |
| 30 | The reducer and its version | reduce-o19.mjs (fair-gated on all four pairings) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same 3,000 paths; se = sqrt(discordant)/N; pooled as the mean with the root sum of squares over the count | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | simulated | simulated | SAME |
| 33 | For timings: what else the machine was running | the solve times are printed but no timing claim is made (four at a time; the exact arms' extra cost is unmeasured); the run-time bar is measured separately on a quiet box before any decision | the same | N/A - no timing claim |

## Changes after seeing results

No O19 result exists. Changed before any run, after the twenty-second review (21:00 UK): the written and asked times
corrected (20:28 and 20:15 UK); the no-effect claim in the derivation now cites the code as well as the unit test; row
33's note on what shares the machine; and the reducer gates each pairing on its one line ('risk tiers allowed', 'final-year
integration') instead of the row number, whose group also holds `quadNodes` and `PLANTIER`. Nothing in the question,
the items or the falsifier changed.
