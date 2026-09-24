# Prediction: f1v2-test

- **Run:** `batch-f1v2.sh` - `node research/solver/audit-s126.mjs f1v2 16 1000 part k/4`, k = 0-3, four at a time (off and v2 paired inside each process); the joined log `results/f1v2/log.txt`, kept verbatim in `results-f1v2.txt`; reducer `node research/solver/read-f1v2.mjs` (its fair-test gate first), reading kept in `results-f1v2-verdict.txt`
- **Kind:** test
- **Written:** 24 Sep 13:09 UK, before the run. Seen before writing it (declared, so nothing here is fitted to it): a check that v1 was unchanged by the v2 build (12:55 UK, 8 points, step 2's settings in the fold) also printed v2's opening read on two cases - S126 99.45 (the same as v1's) and S366 97.4 (off 0.5). No simulated survival and no case at this test's settings was seen.
- **Plan section:** PLAN.md schedule row 7c and the F1 result section ("Why F1 missed what it missed"; the proposal approved 12:42 UK)

## Question

F1 v2 counts money arriving in the bridge, gives the chance the accessible money lasts its expected growth, and acts
when the money is short as well as when it is covered. On the step-6 defaults in the three-world mixture - where the
product runs, and where the F1 test (step 2's settings, the fold) never looked - does v2 read the bridge households
within a few points of their simulated survival, including the ones v1 missed (bridge 6, S366, S360), without costing
survival anywhere?

## Derivation

From the F1 test and its diagnosis (`results-f1.txt`, `results-f1-misses.txt`, both in the fold on step 2's settings):
- **Covered, no inflow in the bridge** (S126, share 0.90, bridge 1, bridge 4, wealth x0.5 and x2, S120-S130): v1 already
  read these within +/-5 (S130 +5.3). v2 changes nothing that binds there: the coverage is well above one, so both caps
  are near one and both drop the same dead corners. So v2 reads as v1 did. The thin S128 and S130 read +3.2 and +5.3 with
  v1 (O9, a slightly optimistic read v2 does not address), and the mixture's table reads about 1 point higher than the
  fold's on average (gate 3: the fold reads a mean 1.07 points low) - so up to about +8 there.
- **Share 0.95** (on the edge, coverage 1.02, no inflow in its 2-year bridge): the growth-aware cap alone reads 72.0
  against 68.2 simulated, where v1's no-growth cap read 57.7 (57.4 in the solve).
- **Bridge 6, S366, S370** (an inheritance inside the bridge): v2 needs only the years before it arrives. Bridge 6 needs
  four of its six years first (the 2030 inheritance, at age 56); S366 four of eight. Coverage on the years that must be met
  first is then well above one (about 1.5 for bridge 6; S366 and S370 covered by the inputs), so the cap is near one and
  the read is the alive corners' - near simulation (99.3 and 99.2 in the fold). S370 is inferred from its inputs only: the
  solver has never read or simulated it.
- **S360** (lean, short even with its inflows, coverage 0.84): v2 now acts - its dead corners dropped, the cap with growth
  about 27 against 44 simulated in the fold (-17). The cap's lognormal is coarse for a long, lean bridge, so the read stays
  low, but by far less than v1's -40.
- **Out of class**: bridge 0 has no retired bridge, so the bridge table is empty and the solve is the same, bit for bit
  (pinned by solver-f1.test.mjs on S000). Share 0.50 and 0.70 are covered many times over: the cap is one and no dead corner
  sits beside a live one.
- **The cost case** (bridge 4 with a 30k one-off cost in its year 2, added before any run): from its inputs, the
  accessible money covers the bridge's floor need 1.54 times without the cost and 1.16 times with it (142.5k against
  92.8k + 30k); the growth-aware cap is then about 97 (85 without growth), and with the cost counted in the floor need
  a* is 0.871, still above the pension share of 0.85 - so it stays in the class. v2 should read it as it reads bridge 4.
  At 30k the cap is near one whether or not the cost is counted, so this case checks that v2 reads a household with a
  bridge cost correctly; that the cost is counted at all is pinned by solver-f1.test.mjs's planted checks.
- **Behaviour**: where v1 took S126 and S120 off the pension's lower tier (40 -> 10.7 and 40 -> 0.2 years in the fold), v2,
  reading them the same, does too.
- **A known approximation, not predicted either way:** under the mixture every world's cap uses the centre world's growth
  and the yearly spread (the bridge table is built once, from the centre world). The low world's cap is a little
  optimistic and the high world's a little cautious; weighted 1/6, 2/3, 1/6 they largely cancel.

## Prediction

1. **In class away from the edge** (the class at the floor need, from `audit-s126.mjs scan`: S126, share 0.90, bridge 1,
   bridge 4, wealth x0.5, wealth x2, S120, S122, S124, S128, S130; and the cost case): v2's table within +/-5 of simulated
   survival; the thin S128 and S130 within +/-8.
2. **What v2 changes:** share 0.95 within +/-10; bridge 6, S366 and S370 within +/-5 (v1 in the fold: -10.8, -46.0, -96.2;
   S370 never run).
3. **S360:** v2 reads below simulation by 5 to 30 points (v1 in the fold: -39.8).
4. **No survival cost:** simulated survival with v2 not lower than off beyond two paired se, on any case.
5. **Out of class:** bridge 0 identical (table, simulation and years below tier); share 0.50 and 0.70 within 0.5 of off,
   table and simulation.
6. **Behaviour:** on S126 and S120, the years the pension sits below its tier fall by at least half with v2, scored where
   off starts at 20 or more (a case that starts below 20 is reported, not scored).

## Falsified if

An in-class case away from the edge (the cost case included) misreads by more than 10 points with v2; or bridge 6 or S366 misreads by more than
15 (the inflow count does not work); or any case loses survival beyond two paired se. Then v2 is not carried forward, and
F2 (a coverage axis in bridge years, or a node at the cliff) is built instead.

## Fair-test table

| # | Variable | Arm A | Arm B | Status |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | the 12 S126 variants (the F1 test's), S120 S122 S124 S128 S130 (the library class), S360 S366 S370 (the long bridges: S370 added from its inputs, results-f1-misses.txt), and the cost case (bridge 4 with a 30k cost in its year 2: no library bridge household has a cost inside its bridge) | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | variants of S126: pension share, bridge length, wealth, and one with a one-off cost of 30k in 2028 | the same variants | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8; guardrails off | the same | SAME |
| 4 | The survival asked for, when a run lands | no ask: lambda held at S126's landed 0.02236 | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 1,000 held paths, seed 7002 | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none (no landing, no rival) | none | N/A - nothing is chosen on search paths |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | the three-world mixture (solvePlan), the forward run with each path's own shift | the same | SAME |
| 8 | How each year's return is averaged (quadrature points) | 5 | 5 | SAME |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | one process, one engine build | the same process | SAME |
| 10 | The minimum pot | one year of target (the step-6 default in solvePlan), or the plan's own where it sets one | the same | SAME |
| 11 | The raise cap | 1.1 (the step-6 default) | 1.1 | SAME |
| 12 | The estate preference | today's estate term (solvePlan with no estate weight set) | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | joint tier steps, consent given; one tier above the plan (the step-6 default, provisional until M14b) | the same | SAME |
| 14 | The one-off cost lookahead | lookaheadYears 0 | 0 | SAME |
| 15 | The tax-free lump sum rule | the full lump sum | the same | SAME |
| 16 | The taxable account's tier | GIA tier off (the product refuses it) | off | SAME |
| 17 | The grid: points, shares, gain buckets | 16 points, the default shares and gain buckets | the same | SAME |
| 18 | The spending menu and the tier menu | the product menu for a 0.8 floor, capped at 1.1: 1.1 1 0.95 0.9 0.8 | the same | SAME |
| 19 | The switch margin and switching cost | the defaults | the same | SAME |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | lambda held 0.02236; exponent 2 | the same | SAME |
| 21 | The raise credit, and whether it is weighted by survival | raise weight 0.003; weighted by survival (RAISESURV, the step-6 default) | the same | SAME |
| 22 | The price of a year with no money | the floor's price (FAILSHORT, the M17 fix, the step-6 default) | the same | SAME |
| 23 | Resilience and drift | resilience 0; no drift | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | bridgeRead off; finalExact on; no block trim | bridgeRead 2 (F1 v2) | TESTED - F1 v2 |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process per case, both arms | the same process | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | table: the mixture's opening read (the worlds weighted as the solve weights them); sim: simulated survival (failure includes ending below the minimum pot); years below the plan's pension tier | the same | SAME |
| 30 | The reducer and its version | read-f1v2.mjs (its fair-test gate reads each case's "ran" lines) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same 1,000 paths; se = sqrt(discordant)/N | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | the table read is reported ONLY as the misread under test, never as a result | the same | SAME |
| 33 | For timings: what else the machine was running | no timing claim | no timing claim | N/A - nothing timed |

## Changes after seeing results

No result of this test exists yet; one change was made before the run.
- 24 Sep 14:08 UK, before any run: added the cost case, bridge 4 with a 30k one-off cost in its year 2, at the
  maintainer's request (14:05 UK, "Yes, add the cost case"). It covers a bridge household with a one-off cost, which the
  library does not have. Changed: the derivation, item 1, the falsifier and rows 1-2 now include the cost case. Nothing
  else changed. The case runs last (the 21st), and read-f1v2.mjs scores it with the class.
