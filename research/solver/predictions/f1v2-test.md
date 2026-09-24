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

From the F1 test (`results-f1.txt`, in the fold on step 2's settings) and **each case's cap from the solver's own code**
(`f1v2-caps.mjs`, `results-f1v2-caps.txt`: bridgeTable v2 and bridgeChanceV2 at the opening position, the cases built as
the f1v2 mode builds them; its v1 caps reproduce the F1 test's v1 reads exactly - share 0.95 57.4, bridge 6 53.3, bridge 4
96.9). The cap is the ceiling on the opening read wherever the table's own read is above it. Re-derived before any run
(the sixteenth review): the first version took its caps from diagnose-f1.mjs's rough model, which the code does not bear
out for the cost case, S360 or S370.
- **Covered, no inflow in the bridge** (S126, share 0.90, bridge 1, bridge 4, wealth x0.5 and x2, S120-S130): v1 already
  read these within +/-5 (S130 +5.3). v2 changes nothing that binds there: its cap is 99.9 to 100.0 on every one of them
  (results-f1v2-caps.txt), and both versions drop the same dead corners. So v2 reads as v1 did. The thin S128 and S130 read +3.2 and +5.3 with
  v1 (O9, a slightly optimistic read v2 does not address), and the mixture's table reads about 1 point higher than the
  fold's on average (gate 3: the fold reads a mean 1.07 points low) - so up to about +8 there.
- **Share 0.95** (on the edge, coverage 1.02, no inflow in its 2-year bridge): v2's cap is 73.2 against 68.2 simulated in
  the fold, where v1's cap read 57.4.
- **Bridge 6, S366, S370** (an inheritance inside the bridge): v2 needs only the years before it arrives - 92.8k where v1
  needs 139.2k (bridge 6) and 185.6k (S366). Their caps are 99.7 and 99.4, so the read is the alive corners' - near
  simulation (99.3 and 99.2 in the fold). **S370's cap is 84.8** (it needs 332.8k before its inheritance and has 360.0k):
  v2 reads it at most about 85, and S370 has never been simulated, so its gap is reported, not predicted.
- **S360** (lean, short even with its inflows: 27.0k against 32.0k): v2 now acts - its dead corners dropped - and its cap
  is 47.2 against 44.1 simulated in the fold, so the read comes up to about the simulation from v1's -39.8; the cap sits a
  little above it, so the read may be slightly optimistic.
- **Out of class**: bridge 0 has no retired bridge, so the bridge table is empty and the solve is the same, bit for bit
  (pinned by solver-f1.test.mjs on S000). Share 0.50 and 0.70 are covered many times over: the cap is one and no dead corner
  sits beside a live one.
- **The cost case** (bridge 4 with a 30k one-off cost in its year 2, added before any run): it needs 122.8k where bridge 4
  needs 92.8k, and its cap is **91.6** where bridge 4's is 99.9. Bridge 4's own read is near 100 (96.9 with v1 in the
  fold), so the cost case reads at its cap, about 91.6 - which shows the cost is counted (at about 99.9 it would not be)
  - and, if it simulates near bridge 4's 99.9, about 8 points below simulation: the cap is cautious here.
- **Behaviour**: where v1 took S126 and S120 off the pension's lower tier (40 -> 10.7 and 40 -> 0.2 years in the fold), v2,
  reading them the same, does too.
- **A known approximation, not predicted either way:** under the mixture every world's cap uses the centre world's growth
  and the yearly spread (the bridge table is built once, from the centre world). The low world's cap is a little
  optimistic and the high world's a little cautious; weighted 1/6, 2/3, 1/6 they largely cancel.

## Prediction

1. **In class away from the edge** (the class at the floor need, from `audit-s126.mjs scan`: S126, share 0.90, bridge 1,
   bridge 4, wealth x0.5, wealth x2, S120, S122, S124, S128, S130): v2's table within +/-5 of simulated survival; the thin
   S128 and S130 within +/-8.
2. **What v2 changes:** share 0.95 within +/-10; bridge 6 and S366 within +/-5 (v1 in the fold: -10.8, -46.0, -96.2). S370
   reads at most its cap, 84.8 (+2 for the grid); its gap is reported, not predicted.
3. **S360:** v2 reads within +/-10 of simulation (its cap 47.2 against 44.1 simulated in the fold; v1 read -39.8).
4. **No survival cost:** simulated survival with v2 not lower than off beyond two paired se, on any case.
5. **Out of class:** bridge 0 identical (table, simulation and years below tier); share 0.50 and 0.70 within 0.5 of off,
   table and simulation.
6. **Behaviour:** on S126 and S120, the years the pension sits below its tier fall by at least half with v2, scored where
   off starts at 20 or more (a case that starts below 20 is reported, not scored).
7. **The cost case:** v2 reads at its cap, 91.6 +/- 3 - the cost counted - and its gap is reported.

## Falsified if

An in-class case away from the edge misreads by more than 10 points with v2; or bridge 6 or S366 misreads by more than
15 (the inflow count does not work); or the cost case reads above 97 (the cost not counted); or any case loses survival
beyond two paired se. Then v2 is not carried forward, and
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
- 24 Sep 14:35 UK, before any run: **the caps re-derived from the solver's own code** (`f1v2-caps.mjs`,
  `results-f1v2-caps.txt`), after the sixteenth review (14:29 UK) found the first figures came from diagnose-f1.mjs's
  rough model: the cost case's cap is 91.6, not about 97; S360's is 47.2, not about 27; S370's is 84.8, where the first
  version assumed near one. Changed: the derivation; item 1 no longer holds the cost case, which gets its own item (7)
  and its own falsifier clause (above 97: the cost not counted); item 2 no longer predicts S370 within +/-5; item 3 is
  within +/-10 (was 5 to 30 below). Items 4-6 and the fair-test table are unchanged. **Same pattern searched:** every cap
  or growth figure taken from diagnose-f1.mjs's rough model - here (all replaced), PLAN.md's "Why F1 missed" (share 0.95
  72.0, bridge 6 75.6: the code's v2 caps are 73.2 and, with the inheritance counted, 99.7) and f2-design.md (S360 about
  27: the code's 47.2).
