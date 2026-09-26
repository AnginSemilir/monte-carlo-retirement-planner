# Prediction: diag-7t

- **Run:** `research/solver/batch-7t.sh` - results/diag7t/part0-4.txt and every run's trace (audit-s126.mjs diag7t); reduced by `reduce-7t.mjs` into results-7t.txt
- **Kind:** test
- **Written:** 26 Sep 16:40 UK, before the run; revised 26 Sep 17:11 UK, before the launch, for the seventy-sixth review's MINORs 3, 4, 5 and 7 (wording and provenance only: no item, rule, margin, falsifier, power figure or derive line changed) (the maintainer, 26 Sep 16:17 UK: "One last check, Design and run. If you can slot in extra checks that would help answer the question once and for all on a level playing field, do so, even if it takes longer")
- **Seeds:** 7002 tuning (8,000 paths, the first 3,000 of them 7r's and 7s's; 2,000 a world; the same paths for every arm of every case)
- **Plan section:** PLAN.md "7t"

## Question

The solver's tables rate the riskier tier above what it realises (7r: by the solver's own whole objective the reader's
tier scores -0.347 and -0.380 points below off, results-7r-failures.txt, grade C), and neither 15 return points (7s,
FALSIFIED) nor a 30-point grid (7e's S126 at 30 points held the same tier) changes that. The analysis of 26 Sep (grade C
and D) put one cause first: in the three-world mixture each world's backward pass picks that world's own best move at
every cell (solve.js, PASS 2 once per world), so each world's table values a future in which the household knows which
world it is in and acts on it; the household never knows - the forward chooser weighs the worlds 1/6, 2/3, 1/6 every year
and never updates. A riskier move is then valued as if, in the bad world, the household de-risked straight after; in
fact it de-risks only after its wealth has fallen (the 26 Sep analysis of 7r's lost paths, grade D; the years in which
they first hold a lower tier are in no results file, so none are given here: the seventy-sixth review, MINOR 4). Does valuing
the policy the household can actually follow - one move for every world, chosen by the chooser's own rule - remove the
reader's harm, and is that where the overrating comes from?

**The design, and why it changed** (the seventy-sixth review, MINOR 7). The design put to the maintainer at 16:12 UK ran
off and the reader under the three-world mixture and under the single-table fold, with a margin-0 arm. The fold solves
and simulates with one table over a spread of returns, so it would change how every arm is simulated as well as what the
tables value (fair-test row 7). The level-playing-field version is a solver option instead, `jointWorlds`: every arm keeps
the mixture's worlds, paths and simulation, and only the choice at each cell changes (one move for every world, by the
forward chooser's own rule). The maintainer is told of the change with the launch.

## Derivation

What the code and the records say before any run:
- **The worlds are far apart.** The library's preset gives High Risk a persistent shift of 2.14% a year (Medium/High
  1.69, Medium 1.31); the worlds sit at -sqrt 3, 0, +sqrt 3 of it, so High Risk returns about 1.0% real in the bad world (0.98%)
  against Medium's 1.4%, with 17.1% volatility against 9.9% (fast.js tiersFor on S126, printed 26 Sep).
- **The option isolates the one thing.** `jointWorlds` (solve.js, research only) keeps every world's rates, grid,
  quadrature and objective and changes only the choice at each cell: one move for every world, the best weighted score
  across the worlds (ties to the larger weighted estate) - the forward chooser's own rule. research/tests/solver-joint.test.mjs:
  off, the tables equal the option absent to the bit; on, every world holds the same move at every cell, and the
  forward chooser picks the stored move at all 9,072 grid cells checked on S004 (off, 1,214 differ); a planted
  wrong-weights fault is caught.
- **What it predicts if the hypothesis holds:** each world's table under the product's mixture overrates the reader's
  policy most in the bad world, where the table's own policy de-risks and the household's does not; under one policy the
  bad world's table and its realised survival agree; the reader under one policy de-risks early, as off does by accident,
  and its harm against off goes.
- **Other causes the run can see.** The switch margin (C5): each arm is also run at margin 0 on the same tables. The
  score's own trade (the objective itself prefers the tier; O20): the realised whole score says whether the policy one
  policy picks does better by that score. The grid and the quadrature are held (16 points, 5 return points; 7s and 7e).
- **Records that bear on it:** 7r's lost paths (the reader held High Risk early, de-risked after early losses, and went
  back up to High Risk in the last years: 14 of 15 on S126, 11 of 12 on bridge 4, read from 7r's traces, not
  registered); off holds two tiers down for life (0.03 switches a path). M14b's comfortable plans lost with a tier
  above (O18, M14c) - S194 is in the panel to see whether one policy changes that too.
- **Why 8,000 paths.** One policy changes the reader's tables at every cell, so paths may move both ways at once; at
  3,000 paths with five paths each way in the background a full cure reads HELD only 0.38 of the time (the first draft
  of results-derive-7t.txt), at 8,000 with 13 each way 0.96 (below).

## Prediction

Each case solved with off and the reader (S194: off), each with the product's mixture and with one policy for every world
(OFF+J, READER+J); every arm run on the same 8,000 paths of seed 7002 as solved and at switch margin 0, and on 2,000 paths
in each world beside that world's table:
1. **7r reproduces:** OFF and READER give 7r's tables, and on the first 3,000 paths 7r's survival (to 0.1) and the
   reader's 15 (S126) and 12 (bridge 4) lost paths, none saved.
2. **The outcome (the primary, by the decision rule below):** HELD - one policy for every world removes the reader's harm
   on both harmed cases.
3. **The mixture overrates in the bad world:** for READER, the bad world's table survival exceeds what the policy realises
   there by at least 1 point, and by more than in the normal world, on S126 and bridge 4.
4. **One policy makes the bad world honest:** READER+J's bad-world overrating is at most half of READER's, on both.
5. **The switch margin is not the cause:** READER at margin 0 against READER changes survival immaterially (the exact 95%
   interval inside +/-0.25), on both.
6. **The reader keeps its gains:** on S360 and share 0.95, READER+J gains against OFF+J (exact p below 0.05) and loses
   nothing material against READER.
7. **M14b's family:** on S194, OFF+J gains survival against OFF (exact p below 0.05).
8. **By the solver's own score:** READER+J's realised whole score is above READER's, and not more than two standard
   errors below OFF+J's, on both harmed cases.

Reported, not items: every run's table, survival, tiers and below-target years; every pair among the eight runs; every
world's table and realised survival and estate; the realised whole score against every reference the reducer prints.

## Falsified if

On both harmed cases the reader with one policy for every world still harms against off with one policy (more lost than
saved, Holm, the point loss at the margin) and gains nothing material against the reader as the product solves it: the
rule's FALSIFIED. The clairvoyant mixture is then not the cause of the tier overrating on these cases.

## Fair-test table

Arm A and arm B as the batch script sets them. SAME, TESTED (the one thing that differs), ONE ARM ONLY (a setting
only one arm has - say why that is fair), N/A (does not apply here - say why) or ACCEPTED (differs, and why that
does not bias the comparison).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S126 and bridge 4 (the reader's harm, 7e and 7r), S360 and share 0.95 (its largest gains, 7e), S194 (M14b's comfortable-plan losses): chosen on purpose from the records, a diagnosis of those cases; nothing here generalises beyond them | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | 7c's variants of S126 (bridge 4; share 0.95); the library's S360 and S194 | the same | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8; guardrails off | the same | SAME |
| 4 | The survival asked for, when a run lands | no ask: lambda held at S126's landed 0.0223606797749979 | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 8,000 paths of seed 7002 (the first 3,000 are 7r's), and 2,000 a world (the first 2,000, each path's persistent shift set to the world's node); the gate checks the seed, the counts and the world lines | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | the three-world mixture, each world's own move at every cell (the product) | the three-world mixture, one move for every world chosen by the chooser's rule (`jointWorlds`); the worlds, weights and rates the same | TESTED - how the worlds' tables choose, with the bridge read held (g: READER+J against READER; OFF+J against OFF) |
| 8 | How each year's return is averaged (quadrature points) | 5 | 5 | SAME |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | one process per case, one engine build | the same process | SAME |
| 10 | The minimum pot | one year of target (solvePlan's default) or the plan's own | the same | SAME |
| 11 | The raise cap | 1.1 | 1.1 | SAME |
| 12 | The estate preference | today's estate term (no weight set) | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | joint tier steps, consent given; one tier above allowed, set explicitly (riskAbove true) in every arm | the same | SAME |
| 14 | The one-off cost lookahead | lookaheadYears 0 | 0 | SAME |
| 15 | The tax-free lump sum rule | the full lump sum | the same | SAME |
| 16 | The taxable account's tier | off (the product refuses it) | off | SAME |
| 17 | The grid: points, shares, gain buckets | 16 points, the default shares and gain buckets | the same | SAME |
| 18 | The spending menu and the tier menu | the product menu for a 0.8 floor, capped at 1.1 | the same | SAME |
| 19 | The switch margin and switching cost | the default margin 0.001 and cost, as solved | the same tables run forward with the margin at 0 (the /M0 runs; the cost unchanged) | TESTED - the switch margin, forward only, each arm against itself (item 5) |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | lambda held 0.0223606797749979; exponent 2 | the same | SAME |
| 21 | The raise credit, and whether it is weighted by survival | raise weight 0.003, weighted by survival | the same | SAME |
| 22 | The price of a year with no money | the floor's price (the M17 fix) | the same | SAME |
| 23 | Resilience and drift | resilience 0; no drift | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | bridgeRead off (OFF, OFF+J); the final year exact (finalIntegral true, set explicitly); no block trim | bridgeRead 'reader' (READER, READER+J); the rest the same | TESTED - the bridge read, with how the worlds choose held (h: READER+J against OFF+J; item 1: READER against OFF) |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan (the option refuses the ternary search) | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process per case writes every arm, run and trace | the same process | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; the whole score: survival, the capped estate at 0.02 of opening wealth, the dislike of cuts and the raise credit, realised per path from the trace | the same | SAME |
| 30 | The reducer and its version | reduce-7t.mjs: requireFairLogs over the logs' stamps, then its own gate on every ran line, joint line, margin-0 run, pair, prefix line, world line and trace; INCOMPLETE unless all five cases' logs are there; the reproduction check; 26 planted checks, 33 planted faults each caught (mutate-reduce-7t.py, results-reduce-7t-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; exact one-sided McNemar with Holm over the two harmed cases (g for a gain, h for harm), the exact 95% interval against the 0.25 margin; the whole score's paired mean with its standard error (item 8, reported beside the rule) | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival, estate and the whole score are simulated; the tables' readings are read only by items 3 and 4, against the simulation | the same | SAME |
| 33 | For timings: what else the machine was running | the solve seconds are printed, not read | the same | N/A - no timing is read: five processes share four cores |

## Decision rule (registered before launch)

- **Primary** (reduce-7t.mjs decide(): 7s's rule with the path count 8,000), per harmed case, paired on the same paths:
  - **g**, READER+J against READER: it **gains** when it saves more than it loses and the exact one-sided p for a gain,
    Holm over the two cases, is below 0.05; **no material gain** when the exact 95% interval's upper end is below +0.25.
  - **h**, READER+J against OFF+J: it **harms** when it loses more than it saves, the exact one-sided p for harm, Holm
    over the two cases, is below 0.05, and the point loss is at least the margin; **no material harm** when the
    interval's lower end is above -0.25.
  - A case **cures** when g gains and h shows no material harm; **does not cure** when g neither gains nor shows a
    material gain and h harms; otherwise it is **partial**.
  - **HELD:** both harmed cases cure. **FALSIFIED:** both do not cure. **INCONCLUSIVE:** otherwise.
  - **NOT SETTLED:** item 1 fails - something besides the thing tested moved.
- **Items 3-8:** read by reduce-7t.mjs items(), as the Prediction words them.
- **Declared choices, not derived:** the margin 0.25 (the regimen's; off survives 95% or more on both harmed cases);
  Holm over the two; the 1-point and one-half thresholds of items 3 and 4 and the two standard errors of item 8
  (judgement; no record fixes them); 2,000 paths a world (a survival of 97% there has a standard error of 0.4 points).

## Decision fed

- **Held:** the clairvoyant mixture is the root cause of the tier overrating on the reader's harmed cases (grade B, one
  seed, two cases). What goes to the maintainer: `jointWorlds` as the candidate fix, which before it could be a default
  needs its own registered no-harm test on a broad panel (the regimen's 8f shape) and its solve time; the bridge reader
  re-tested with it on 7e's panel (the reader could then be carried forward); 7r's question answered (the trade was a
  table error, not the objective's); F2, 7q and Phase 4 re-planned behind that.
- **Falsified:** the clairvoyant mixture is not the cause on these cases. The candidates left: the score's own trade
  (item 8 and the whole-score lines speak to it), the switch margin (item 5), and the grid; they go to the maintainer
  with 7r's question.
- **Inconclusive:** a partial or one-sided effect. The per-case counts, the world lines and the whole score go to the
  maintainer, with the options then open (a second seed, more paths, the remaining causes).

## Provenance

- The option: solve.js `jointWorlds` (commit 70a8b55); its test research/tests/solver-joint.test.mjs.
- The mode: audit-s126.mjs diag7t; the batch batch-7t.sh; the preflight preflight-7t.sh (a measurement through the
  launcher, tiny, no figure read).
- The worlds' spread: fast.js tiersFor on the library's S126; solveMixture MIX3.
- 7r's figures (item 1): results/diag7r/part0.txt and part1.txt; results-7r.txt. The whole-score deficit:
  results-7r-failures.txt. 7s: results-7s.txt. 7e's S126 at 30 points: results-7e.txt.
- lambda 0.0223606797749979: S126's landed lambda; the gate checks it. The margin 0.25: stats.mjs MARGINS.

## Derivation script

- `derive: research/solver/derive-7t.mjs > research/solver/results-derive-7t.txt sha256 5f2d315c2e227d1c`
  (7r's harm scaled to 8,000 paths, g and h drawn as Poisson counts under each true story with a background of paths
  moving both ways, read by reduce-7t.mjs's own decide()).

## Point and interval

80% intervals, the author's:
- g, READER+J against READER: S126 +0.35 points (0.0 to +0.6); bridge 4 +0.3 (0.0 to +0.5).
- h, READER+J against OFF+J: S126 -0.1 (-0.4 to +0.1); bridge 4 -0.1 (-0.35 to +0.1).
- READER's bad-world overrating: S126 +2 points (+0.5 to +5); bridge 4 +2 (+0.5 to +5); READER+J's: 0 (-1 to +1.5).
- READER at margin 0 against READER: 0.0 (-0.2 to +0.2).

## Credence

The author's probability that each item holds: 1, 0.95; 2, 0.45 (the outcome HELD); 3, 0.65; 4, 0.55; 5, 0.50; 6, 0.75;
7, 0.35; 8, 0.55. The outcome: HELD 0.45, FALSIFIED 0.20, INCONCLUSIVE 0.35. 7s's lean held (0.45 on FALSIFIED) and the
scorecard is 0.193 over 22 items; the hypothesis here rests on code reading and one seed's traces (grade C and D), so
HELD is kept under a half. Scored by scorecard.mjs.

## Power

From results-derive-7t.txt (7r's harm scaled to 8,000 paths: S126 40 lost, bridge 4 32; 20,000 draws a story):
- **With a background of 1.33 paths each way:** one policy removes all the harm -> HELD 1.000; three quarters -> HELD
  0.980; half -> INCONCLUSIVE 0.784 (HELD 0.216); a quarter -> INCONCLUSIVE 0.937; none -> FALSIFIED 0.986.
- **With 13.3 each way:** all -> HELD 0.958; three quarters -> INCONCLUSIVE 0.762 (HELD 0.238); none -> FALSIFIED 0.898.
- **What it cannot see:** a part of the harm below the margin (20 paths of 8,000, 0.25 points) reads as none.
- **Time:** each arm is a solve (about 130 s at 16 points, 7r and 7s) and 22,000 forward paths (8,000 as solved, 8,000 at
  margin 0, 6,000 in the worlds; about 100 s a thousand, 7r's swap arms), about 40 minutes; four arms a case, S360's
  horizon longer, S194 two arms, five processes on four cores: about 3.5 to 4 hours, plus the smoke run if the code moved.

## Budget line

The bridge class's decision error: the reader cost S126 0.47 and bridge 4 0.31 points of survival in 7e, 0.50 and 0.40 in
7r. 7t removes no error itself; it says whether the mixture's clairvoyance carries it, and tests a fix for it.

## Pre-mortem

- **Most likely:** a partial effect - one policy changes the reader's tables at every cell, part of the harm goes and
  part stays - which reads INCONCLUSIVE; the world lines and the whole score then say how much.
- **Second:** one policy costs the reader its gains elsewhere (item 6 misses), so a fix is not free even if HELD.
- **Third:** the switch margin matters more than expected (item 5 misses), and the harm is partly the margin's lock-in.
- **Fourth:** the smoke run does not exercise diag7t or jointWorlds (smoke.sh is locked); the preflight measurement
  through the launcher and research/tests/solver-joint.test.mjs cover them, and a smoke line is proposed for the next
  unlock.
- **Least likely:** item 1 fails; the run is then NOT SETTLED.

## Changes after seeing results

None.
