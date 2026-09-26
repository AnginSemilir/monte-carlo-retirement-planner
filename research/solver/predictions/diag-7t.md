# Prediction: diag-7t

- **Run:** `research/solver/batch-7t.sh` - results/diag7t/part0-4.txt and every run's trace (audit-s126.mjs diag7t, with its learning and five-world arms); reduced by `reduce-7t.mjs` into results-7t.txt
- **Kind:** test
- **Written:** 26 Sep 16:40 UK, before the run; revised 17:11 UK for the seventy-sixth review's MINORs; RE-REGISTERED 26 Sep 17:50 UK, before any launch, for the maintainer's "Test all" (26 Sep 17:15 UK, answering the first deep review's finding that 7t as first registered could not separate its cause from two rivals): the learning and five-world arms, the margin read as a cause, a rule per cause with Holm over all ten tests, the attribution rule, and the reads from the traces. The first registration's items 3-8 are kept as items 7-12 (item 5 replaced: see item 9). Earlier quote: the maintainer, 26 Sep 16:17 UK: "One last check, Design and run. If you can slot in extra checks that would help answer the question once and for all on a level playing field, do so, even if it takes longer"
- **Seeds:** 7002 tuning (8,000 paths, the first 3,000 of them 7r's and 7s's; 2,000 a world; the same paths for every arm of every case)
- **Unmasking:** every arm removes a suspected error of the solver's own, not the bridge misread: J the per-world choice (each world's table plans as if it knew its world), L the fixed world weights of the forward choice, 5 the three worlds that stop at +/-sqrt 3, M0 the switch margin's hold on near-ties. The baseline behaviour those errors drive: off's misread of the bridge put it two tiers down at year 0 and the margin holds it there for life (7r's traces: off switches 0.03 times a path), so off's better survival on S126 and bridge 4 may be the margin's accident, not off being right. The separating arms: each cause's h (the reader against off with the SAME cause removed - both arms on the same footing), and item 9 (off at margin 0 against off as solved), which tells a harmful reader from an off made safe by accident. (diag-7t.md is exempt from this field by name; it is written here all the same.)
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

**Re-registered to test every candidate cause** (the first deep review, 26 Sep 17:12 UK, deep-review-log.md; the maintainer,
17:15 UK: "Test all"). As first registered, a cure by one policy could come from flipping the opening near-tie that the
switch margin then holds, and the world lines put each path's shift exactly on a node, so 7t could not separate the
clairvoyance from its rivals. Now each candidate cause is removed in its own arm, on the same paths, and read by the same
rule: **J**, the per-world choice (one policy for every world, `jointWorlds`); **L**, the forward chooser's fixed world
weights (learn.mjs: the weights become the posterior given the returns the path has realised, on the product's own
tables); **5**, three worlds that stop at +/-sqrt 3 (five worlds, to +/-2.86); **5L**, both; **M0**, the switch margin's
lock-in (the margin at 0, forward). The score's own trade is read by the realised whole score (item 12).

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
  back up to the plan's tier late: 14 of 15 on S126 and 11 of 12 on bridge 4 in their last 8 recorded years - item 16's
  definition - against 0 of 451 and 2 of 466 surviving paths with a shift below -1; 7 of 15 and 6 of 12 lost paths have a
  shift below -sqrt 3, where 3.2% and 4.2% of all paths are: results-7r-lost-paths.txt, from 7r's gated traces, grade C,
  reported not tested. Counting the plan's last 8 years instead, as the first deep review's scratch read did, bridge 4
  gives 10 of 12, the seventy-seventh review's recount. Items 15 and 16 register the reads on 7t's own 8,000 paths); off holds two tiers down for life (0.03 switches a path). M14b's comfortable plans lost with a tier
  above (O18, M14c) - S194 is in the panel to see whether one policy changes that too.
- **What each cause predicts that the others do not.** J: the reader with one policy loses nothing against off with one
  policy, at the solved margin AND at margin 0 (item 13), and the bad world's overrating halves (item 8). L: the reader
  learning loses nothing against off learning; the learning weights leave the reader's gains (item 14). 5: the reader
  under five worlds loses nothing against off under five. 5L: the same with both. M0: at margin 0 the reader gains
  against itself and loses nothing against off at margin 0; and off at margin 0 loses against itself (item 9) if its
  safety is the margin's accident. The lost paths' place (items 15 and 16) says where any cause must act: a deep bad world
  (below -sqrt 3, where no table world sits) and a late return to risk.
- **The learning is slow by design of the markets, not of the code.** A pot's yearly return shows its long-run shift
  through S/V, about 0.0214/0.171 = 0.125 for High Risk, so 27 years of returns carry about 0.4 of the shift's variance
  in information (research/tests/solver-learn.test.mjs: a path at shift -2.5 with no yearly noise ends with the bad world
  at most weight; with noise the weights move far less). L can cure only where the evidence has built up - late in the
  plan, which is where the losses are.
- **Why 8,000 paths.** One policy changes the reader's tables at every cell, so paths may move both ways at once; at
  3,000 paths with five paths each way in the background a full cure reads HELD only 0.38 of the time (the first draft
  of results-derive-7t.txt), at 8,000 with 13 each way 0.96 (below).

## Prediction

Each case solved with off and the reader (S194: off) under the product's mixture and with one policy for every world
(OFF+J, READER+J); every product arm also run with the learning chooser (+L); on S126 and bridge 4, off and the reader
also solved with five worlds (OFF5, READER5) and run with the learning chooser on those (OFF5+L, READER5+L); every arm
of the product's and one policy's run at switch margin 0 too (/M0) and in each of the three worlds on 2,000 paths; all on
the same 8,000 paths of seed 7002:
1. **7r reproduces:** OFF and READER give 7r's tables, and on the first 3,000 paths 7r's survival (to 0.1) and the
   reader's 15 (S126) and 12 (bridge 4) lost paths, none saved.
2. **J (clairvoyance) cures:** HELD by the rule below - READER+J gains against READER and does no material harm against
   OFF+J, on both harmed cases.
3. **L (fixed world weights) cures:** HELD - READER+L against READER, and against OFF+L.
4. **5 (three worlds) cures:** HELD - READER5 against READER, and against OFF5.
5. **5L (five worlds, learning) cures:** HELD - READER5+L against READER, and against OFF5+L.
6. **M0 (the margin's lock-in) cures:** HELD - READER/M0 against READER, and against OFF/M0.
7. **The mixture overrates in the bad world:** for READER, the bad world's table survival exceeds what the policy realises
   there by at least 1 point, and by more than in the normal world, on S126 and bridge 4.
8. **One policy makes the bad world honest:** READER+J's bad-world overrating is at most half of READER's, on both.
9. **Off's safety is the margin's:** OFF at margin 0 loses survival against OFF as solved (more lost than saved, exact p
   for harm below 0.05), on both. (Replaces the first registration's item 5, "the margin is not the cause", which is now
   cause M0's question.)
10. **The reader keeps its gains with one policy:** on S360 and share 0.95, READER+J gains against OFF+J (exact p below
    0.05) and loses nothing material against READER.
11. **M14b's family:** on S194, OFF+J gains survival against OFF (exact p below 0.05).
12. **By the solver's own score:** READER+J's realised whole score is above READER's, and not more than two standard
    errors below OFF+J's, on both harmed cases.
13. **One policy's cure is not the margin's:** READER+J/M0 against OFF+J/M0 shows no material harm (the exact 95%
    interval's lower end above -0.25), on both harmed cases.
14. **The reader keeps its gains with learning:** on S360 and share 0.95, READER+L gains against OFF+L (exact p below
    0.05) and loses nothing material against READER.
15. **The lost paths sit in the deep bad world:** of the reader's paths lost against off on S126 and bridge 4, pooled,
    more than a quarter have a long-run shift below -sqrt 3 (about 4% of all paths do).
16. **The lost paths re-risk late:** of them, at least half hold the plan's tier or riskier in their last 8 recorded
    years after 10 or more years below it.

Reported, not items: every run's table, survival, tiers and below-target years; every pair among each case's runs; every
world's table and realised survival and estate; the learning end weights; each arm's opening tier; the lost and saved
paths by shift bin for every cause's h pair, survival by bin, and the late re-risking; the worlds weighted 1/6, 2/3, 1/6
against the 8,000 paths; the realised whole score against every reference the reducer prints.

## Falsified if

Each cause separately: on both harmed cases the reader with the cause removed still harms against off with the same cause
removed (more lost than saved, Holm over the ten, the point loss at the margin) and gains nothing material against the
reader as the product solves it - that cause's FALSIFIED: removing it alone does not remove the reader's harm on these
cases. If every cause reads FALSIFIED, none of the five is the cause alone; what is left is the score's own trade (item 12
and the whole-score lines) and the grid.

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
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 8,000 paths of seed 7002 (the first 3,000 are 7r's), and 2,000 a world (the first 2,000, each path's persistent shift set to the world's node); the gate checks the seed, the counts and the world lines | the same paths, paired, for every arm: one policy, learning, five worlds, margin 0 | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | the three-world mixture, each world's own move at every cell, the forward chooser's fixed weights 1/6, 2/3, 1/6 (the product) | one change an arm: one move for every world (`jointWorlds`, +J); the forward chooser's weights the posterior given the path's realised returns (learn.mjs, +L, the same tables); five worlds (`mix: 5`, OFF5 and READER5, the chooser's fixed five-point weights); five worlds with learning (+L on them). Every arm simulated on the same paths, each path's shift drawn from the normal as the engine draws it | TESTED - how the mixture's worlds choose and are weighed, one change an arm, the bridge read held: g, each against the reader as solved; h, the reader against off with the same change; the rule reads each cause on its own, Holm over all ten |
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
| 19 | The switch margin and switching cost | the default margin 0.001 and cost, as solved | the same tables run forward with the margin at 0 (the /M0 runs; the cost unchanged) | TESTED - the switch margin, forward only: cause M0 (READER/M0 against READER, and against OFF/M0) and item 9 (OFF/M0 against OFF); the learning and five-world arms at the solved margin only |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | lambda held 0.0223606797749979; exponent 2 | the same | SAME |
| 21 | The raise credit, and whether it is weighted by survival | raise weight 0.003, weighted by survival | the same | SAME |
| 22 | The price of a year with no money | the floor's price (the M17 fix) | the same | SAME |
| 23 | Resilience and drift | resilience 0; no drift | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | bridgeRead off (OFF and every OFF arm); the final year exact (finalIntegral true, set explicitly); no block trim | bridgeRead 'reader' (READER and every READER arm); the rest the same | TESTED - the bridge read, with each cause's change held on both sides (each h pair; item 1: READER against OFF) |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan (the option refuses the ternary search) | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process per case writes every arm, run and trace; the log's audit stamp covers audit-s126.mjs, swap.mjs and learn.mjs | the same process | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; the whole score: survival, the capped estate at 0.02 of opening wealth, the dislike of cuts and the raise credit, realised per path from the trace | the same | SAME |
| 30 | The reducer and its version | reduce-7t.mjs: requireFairLogs over the logs' stamps, then its own gate on every ran line (the five-world ones at mix 5, the rest the same), joint line, margin-0 run, learning line (its end weights over three or five worlds), five-world line, pair, prefix line, world line and trace; INCOMPLETE unless all five cases' logs are there; the reproduction check; 39 planted checks, 50 planted faults each caught (mutate-reduce-7t.py, results-reduce-7t-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; exact one-sided McNemar with Holm over all ten cause-and-case tests (g for a gain, h for harm), the exact 95% interval against the 0.25 margin; the whole score's paired mean with its standard error (item 12, reported beside the rule) | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival, estate and the whole score are simulated; the tables' readings are read only by items 7 and 8, against the simulation | the same | SAME |
| 33 | For timings: what else the machine was running | the solve seconds are printed, not read | the same | N/A - no timing is read: five processes share four cores |

## Decision rule (registered before launch)

- **Each cause** (reduce-7t.mjs decideCauses(): 7s's rule, the path count 8,000, Holm over all ten cause-and-case
  tests), per harmed case, paired on the same paths:
  - **g**, the reader with the cause removed against the reader as the product solves it: it **gains** when it saves more
    than it loses and the exact one-sided p for a gain, Holm over the ten, is below 0.05; **no material gain** when the
    exact 95% interval's upper end is below +0.25.
  - **h**, the reader with the cause removed against off with the same cause removed: it **harms** when it loses more than
    it saves, the exact one-sided p for harm, Holm over the ten, is below 0.05, and the point loss is at least the margin;
    **no material harm** when the interval's lower end is above -0.25.
  - A case **cures** when g gains and h shows no material harm; **does not cure** when g neither gains nor shows a
    material gain and h harms; otherwise it is **partial**.
  - The cause **HELD:** both harmed cases cure. **FALSIFIED:** both do not cure. **INCONCLUSIVE:** otherwise.
  - The pairs: J (READER+J; READER; OFF+J), L (READER+L; READER; OFF+L), 5 (READER5; READER; OFF5), 5L (READER5+L; READER;
    OFF5+L), M0 (READER/M0; READER; OFF/M0).
- **NOT SETTLED:** item 1 fails - something besides the things tested moved.
- **The attribution** (RULES.md section 9 rule 1; the first deep review): a cure is named a root cause only by elimination
  and only as far as it goes -
  - one cause HELD, and for J item 13 also holds: that cause removes the reader's harm on these cases and the others,
    each tested, do not (grade B for the two cases);
  - J HELD but item 13 misses: the cure at the solved margin is not named clairvoyance (the margin may carry it);
  - several causes HELD: each removes the harm; the attribution between them is grade C, and the cheapest that holds goes
    to the maintainer;
  - none HELD: none of the five alone; the score's own trade (item 12) and the grid are left.
- **Items 7-16:** read by reduce-7t.mjs items(), as the Prediction words them.
- **Declared choices, not derived:** the margin 0.25 (the regimen's); Holm over the ten (every cause is a claim the plan may
  act on, so the family is all of them); the 1-point and one-half thresholds of items 7 and 8, the two standard errors of
  item 12, the quarter of item 15 and the half of item 16 (judgement; the base rate below -sqrt 3 is about 4%, and the
  deep review's scratch read on 7r's 3,000 paths was about half on both); 2,000 paths a world; the learning chooser's
  pot (the one with the largest S/V) and its likelihood (the tables' own world model).

## Decision fed

- **One cause HELD (with item 13 for J):** that cause is the root cause of the reader's harm on these cases (grade B, one
  seed, two cases). What goes to the maintainer: its fix as the candidate (for J `jointWorlds`; for L a learning chooser;
  for 5 five worlds; for 5L both; for M0 a margin of 0 or a solved held-tier state), each needing its own registered
  no-harm test on a broad panel (the regimen's 8f shape) and its cost before any default; the bridge reader re-tested
  with it on 7e's panel; 7r's question answered; F2, 7q, 7n and Phase 4 re-planned behind it.
- **Several HELD:** each removes the harm; the cheapest, by solve time and code, goes to the maintainer first, with the
  attribution between them grade C and a follow-up that combines them only if one alone falls short elsewhere.
- **None HELD (all FALSIFIED or INCONCLUSIVE):** none of the five alone removes the harm. Left: the score's own trade (item
  12 and the whole-score lines: if the reader does better by the solver's own score, the objective prefers the risk and
  the "harm" is the objective's), and the grid. They go to the maintainer with the per-cause counts, the lost paths'
  place (items 15, 16) and the options (the objective's terms, a second seed, the grid).
- **NOT SETTLED:** the run is repeated after the difference is found.

## Provenance

- The option: solve.js `jointWorlds` (commit 70a8b55); its test research/tests/solver-joint.test.mjs; the off path's tables
  before and after it equal to the bit (results-joint-off-identity.txt).
- The learning chooser: research/solver/learn.mjs, through runPolicy's `choose` hook (the product untouched); its test
  research/tests/solver-learn.test.mjs (17 checks: Bayes by hand, the simulation's model, year 0, the hook neutral, a
  planted sign slip caught). Five worlds: solveMixture's existing `mix: 5` (Gauss-Hermite nodes to +/-2.86).
- The mode: audit-s126.mjs diag7t; the batch batch-7t.sh; the preflight preflight-7t.sh (a measurement through the
  launcher, tiny, no figure read; preflight-parse-7t.mjs runs the reducer's parse and gate over it).
- The first deep review: deep-review-log.md, 26 Sep 17:12 UK.
- The worlds' spread: fast.js tiersFor on the library's S126; solveMixture MIX3.
- 7r's figures (item 1): results/diag7r/part0.txt and part1.txt; results-7r.txt. The whole-score deficit:
  results-7r-failures.txt. 7s: results-7s.txt. 7e's S126 at 30 points: results-7e.txt.
- lambda 0.0223606797749979: S126's landed lambda; the gate checks it. The margin 0.25: stats.mjs MARGINS.

## Derivation script

- `derive: research/solver/derive-7t.mjs > research/solver/results-derive-7t.txt sha256 5c774f810a002ecc`
  (7r's harm scaled to 8,000 paths, g and h drawn as Poisson counts under each true story with a background of paths
  moving both ways, read by reduce-7t.mjs's own decide() with Holm over all ten tests, the other four causes removing
  none of the harm - the least power a cause can have).

## Point and interval

80% intervals, the author's, g (the reader with the cause removed against the reader) and h (against off with it removed):
- J: g S126 +0.25 (0.0 to +0.5), bridge 4 +0.2 (0.0 to +0.4); h -0.2 (-0.45 to +0.05) on each.
- L: g +0.05 (-0.05 to +0.25) on each; h -0.35 (-0.5 to -0.1) on each.
- 5: g +0.2 (0.0 to +0.45) on each; h -0.2 (-0.45 to +0.05) on each.
- 5L: g +0.25 (0.0 to +0.5) on each; h -0.15 (-0.4 to +0.05) on each.
- M0: g 0.0 (-0.2 to +0.2) on each; h -0.2 (-0.45 to +0.05) on each (off at margin 0 may lose too: item 9).
- READER's bad-world overrating: +2 points (+0.5 to +5) on each; READER+J's: 0 (-1 to +1.5).

## Credence

The author's probability that each item holds: 1, 0.95; 2 (J HELD), 0.25; 3 (L), 0.15; 4 (5), 0.20; 5 (5L), 0.25; 6 (M0), 0.15;
7, 0.65; 8, 0.50; 9, 0.45; 10, 0.70; 11, 0.30; 12, 0.50; 13, 0.35; 14, 0.80; 15, 0.85; 16, 0.75. At least one cause HELD:
about 0.5; none, about 0.5. Lower than the first registration's 0.45 on J: the deep review's reading (grade C) puts the
losses late and in the deep bad world, where the per-world choice has few decisions left to spoil. Scored by
scorecard.mjs.

## Power

From results-derive-7t.txt (7r's harm scaled to 8,000 paths: S126 40 lost, bridge 4 32; 20,000 draws a story; each cause
drawn with the other four removing none of the harm, so its p-values take Holm's x10 and x9, the least power it can have):
- **With a background of 1.33 paths each way:** the cause removes all the harm -> HELD 1.000; three quarters -> HELD
  0.976; half -> INCONCLUSIVE 0.803 (HELD 0.197); a quarter -> INCONCLUSIVE 0.762 (FALSIFIED 0.238); none -> FALSIFIED 0.986.
- **With 13.3 each way:** all -> HELD 0.909; three quarters -> INCONCLUSIVE 0.814 (HELD 0.186); half -> INCONCLUSIVE 0.998;
  none -> FALSIFIED 0.908.
- **What Holm over ten costs:** against the first registration's Holm over two, a full cure at the larger background reads
  HELD 0.909, not 0.958, and three quarters 0.186, not 0.238 - the price of reading five causes as five claims.
- **What it cannot see:** a part of the harm below the margin (20 paths of 8,000, 0.25 points) reads as none; two causes
  that each remove half read INCONCLUSIVE each, and only 5L reads them together (five worlds with learning).
- **Time:** from 7r's and 7s's cells (a solve about 130 s at 16 points with three worlds, about 5/3 of that with five;
  forward runs about 100 s a thousand paths with three worlds, about 150 with five, the learning chooser the same; the
  preflight's tiny runs agree): S126 and bridge 4 about 4.6 h each, the gain cases about 3 h, S194 about 1.5 h; five
  processes on four cores: about 5.5 to 6 hours, plus the smoke run.

## Budget line

The bridge class's decision error: the reader cost S126 0.47 and bridge 4 0.31 points of survival in 7e, 0.50 and 0.40 in
7r. 7t removes no error itself; it says which of five suspected errors of the solver's own carries it, each with a fix.

## Pre-mortem

- **Most likely:** no single cause HELD - partial effects from several (INCONCLUSIVE on two or three), with the lost paths'
  place (items 15, 16) showing where they act; the whole score (item 12) then says whether the objective itself wants
  the late gamble.
- **Second:** five worlds with learning (5L) cures and nothing alone does - the three-world model's missing tail and its
  never-updated weights together; the attribution is then "both", grade C between them.
- **Third:** M0's h reads no harm because OFF at margin 0 got worse, not because the reader got better (item 9 holds, M0's
  g does not gain): the rule reads that partial, not a cure - off's safety was the margin's.
- **Fourth:** the learning chooser is right in its model and still weak (S/V about 0.125 a year): L reads FALSIFIED because
  the evidence builds too slowly, not because the weights do not matter. 5L and the end weights say how far it moved.
- **The smoke run** now reaches diag7t's registered arms (the maintainer's unlock of 26 Sep 16:47 UK) but not the learning
  or five-world arms (smoke.sh is locked); the preflight through the launcher, solver-learn.test.mjs and the reducer's
  gate cover them.
- **Least likely:** item 1 fails; the run is then NOT SETTLED.

## Changes after seeing results

None.
