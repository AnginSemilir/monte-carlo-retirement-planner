# Prediction: diag-7v

- **Run:** `research/solver/batch-7v.sh` - results/diag7v/case0-8.txt and every run's trace (audit-s126.mjs diag7v); reduced by `reduce-7v.mjs` into results-7v.txt
- **Kind:** test
- **Written:** 27 Sept, 07:22 UK, before the run. The maintainer, 27 Sep: "Run 7v first" (on the second deep review's proposal, drafts/after-7t-proposal.md; PLAN.md 7v)
- **Seeds:** 7002 tuning (8,000 paths, the first 3,000 of them 7r's; 1,000 a world on the harmed cases; the same paths for every run of every case). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan (PRODUCT_DEFAULTS.thinSeed); on the five core cases it never draws a path (no tier above is within reach: the rule returns before its check), and the pairs set the tier above explicitly
- **Unmasking:** every margin below the product's removes a suspected error of the solver's own, not the bridge misread: the forward chooser's switch margin (0.001) holding the tier it opens in, because the tables are solved as if switching were free and tier families sit within the margin (O30). The baseline behaviour that error drives: 7t's OFF switched its pension tier 0.03 and 0.04 times a path on S126 and bridge 4, so off's early de-risk is held for life by the margin whether or not it is right, and the reader's accurate read makes that de-risk a sub-margin gain it never takes (results-7t-deep.txt). The separating arms: item 2 (the reader against off at the SAME margin 0) tells the reader's own harm from the margin's; item 4 (margin 0 against a small positive margin) tells a margin that hides noise from one that hides a near-tie; OFF at every margin against the product says whether off's safety is the margin's
- **Plan section:** PLAN.md "7v"

## Question

7t found four changes that each remove the bridge reader's harm on S126 and bridge 4 (L, O, 5L and M0; results-7t.txt),
and the second deep review traced all four to one mechanism (grade C): the forward chooser changes tier only when the
table's gain beats the switch margin, 0.001 in score units, while the tables are solved as if switching were free, so two
tiers usually differ by less than the margin and the chooser keeps the tier it opens in for decades. The reader's accurate
read makes year 0's de-risk look worth less than the margin, so it keeps the riskier tier, and in the worst markets its
lost paths follow (O30). Margin 0 removes the hold but churns (about 10 tier changes a path, nearly half reversed within
three years) and, where a table has no signal, follows noise (7t's OFF at margin 0 lost 520 paths on S360).

**Is the reader's harm the margin holding a near-tie (P), or table noise (N), a separate clairvoyance error (C) or a
separate learning error (L)?** And is there a margin below today's that keeps the reader's gains, removes its harm and
keeps switching rare? The draft's four predictions (drafts/after-7t-proposal.md): P, the result rises as the margin falls
and the family pairs meet at 0; N, a peak at a small positive margin; C, one policy for every world gains at every small
margin; L, the learner adds survival at one policy and margin 0.

**At the product's settings** (the ninetieth review, BLOCKING 1: 7t's OFF was not the product as it ships): solvePlan's
own entry with 30 points and the product's 'auto' risk-above rule, the bridge read off (the product) or the reader, and
lambda the maintainer's research reference 0.025 (O15, 25 Sep 20:31 UK). The draft said "each household's own lambda";
three of the five core cases (bridge 4, share 0.95 and S360) have no landed lambda in any record, and the product has no
lambda default yet (it waits for K6), so the research reference stands in for every core case. The family pairs run at
their odd results' own setups (the ninety-first review, MINOR 5): S172 planned at Medium Risk with the tier above off and
on, at S172's landed lambda 0.6503449126242364 (O16: M14b's settings; results/m14b-down/S172.json), and S330 planned at
Medium Risk with the tier above on, in three and in five worlds, at S330's landed 0.9457416090031758 (O21: 7h's settings;
results/m14b-down/S330.json).

## Derivation

What the code and the records say before any run:
- **The margin acts only forward.** solve.js chooseAction applies `switchMargin` when a tier is held; the backward pass
  holds none (every cell is solved as if switching were free: fast.js SWITCH_COST's note, solve.js l.965-975), so the
  tables do not depend on the margin and one solve serves all four margins (audit-s126.mjs diag7v runs each solve forward
  four times). The switching cost (0.25% of the slice traded) is charged at decision time in every run, unchanged.
- **What P predicts.** With the tables unchanged, lowering the margin lets the chooser take any tier gain above it. If the
  reader's harm is a sub-margin opening de-risk held for life, the reader's net loss against the product falls as the
  margin falls, and at margin 0 the reader and off open alike (7t: READER/M0 and OFF/M0 identical on S126, results-7t.txt),
  so the reader's own harm is gone (item 2). With one policy for every world at margin 0 the result also stays near the
  product (7t: 2 lost on S126, 11 saved against 5 lost on bridge 4 against 7t's OFF, results-7t-vs-product.txt), so it
  rises to no material harm (item 3).
- **What N predicts.** Where a table carries no signal a margin of 0 follows noise (7t's OFF/M0 on S360: 6 saved, 520
  lost, results-7t-vs-product.txt), so some small positive margin should beat both 0.001 and 0 (item 4).
- **What C and L predict.** A clairvoyance error the margin does not carry shows as one policy gaining against the reader
  at every small margin (item 5); a learning error, as the learner adding survival on top of one policy at margin 0 (item
  6). 7t: at today's margin one policy changed nothing on S126; the learner at today's margin saved 5 and lost none against
  7t's OFF (results-7t-vs-product.txt).
- **The family pairs.** O16: allowed one tier above, S172 loses 0.77 points and holds the plan's tier in 73.4% of years
  against 0.1% without (results-m14b.txt, results-m14b-why.txt, seed 7011); O21: five worlds raise S330's survival by 0.27
  (results-quadref-exact.txt). If both are a sub-margin tier change held by the margin, each pair meets at margin 0 (item 7).
- **The churn.** 7t at margin 0: 10.52 and 10.02 pension switches a path on S126 and bridge 4, 48% and 47% reversed
  within three years (results-7t-deep.txt). A margin that holds only true noise should keep most of that away (item 8).
- **What 7v does not test:** the held tier as part of the solved state (not built), the grid beyond 30 points, a second
  seed, or any household beyond these nine cases. Its candidates (item 9) go to 7u, which tests them on 7e's panel and a
  broad one.

## Prediction

Every case solved with off and the reader (a non-bridge case, off alone), each under the product's mixture and with one
policy for every world (+J), and every solve run forward at switch margins 0.001 (the product's), 3e-4, 1e-4 and 0 on the
same 8,000 paths of seed 7002; one policy at margin 0 also run with the learner (+L); the harmed cases' world lines at
0.001 and 0. The product is OFF/1e-3 on each case. Items (reduce-7v.mjs items(); each a Holm family of its own):
1. **The harm at the product's settings:** READER/1e-3 harms against the product on S126 and bridge 4 (HELD).
2. **The margin carries the reader's own harm (P):** READER/0 does no material harm against OFF/0, on both harmed cases (HELD).
3. **The dose-response (P):** against the product, READER+J's net paths (saved less lost) rise as the margin falls (each
   step no more than 3 paths down, and more at 0 than at 0.001) and READER+J/0 does no material harm, on both harmed
   cases (HELD).
4. **Table noise (N):** on no core case does margin 0 harm against one policy's better small positive margin (FALSIFIED).
5. **A separate clairvoyance error (C):** READER+J shows no material gain against READER at margins 1e-4 and 0, on both
   harmed cases (FALSIFIED).
6. **A separate learning error (L):** READER+J/0+L shows no material gain against READER+J/0, on both harmed cases
   (FALSIFIED).
7. **The family pairs meet at 0:** S172's loss with the tier above and S330's gain with five worlds each reproduce at
   0.001 and are gone at 0 (HELD).
8. **A small margin keeps switching rare:** READER+J's pension switches a path at 1e-4 are at most half those at 0, on both
   harmed cases (HELD).
9. **The candidates for 7u** (a list, not a verdict): READER+J/0 among them; the fix alone (OFF+J/m) at 1e-4 and 0 too.

Reported, not items: every run's survival, saved and lost against the product, switches a path and the share reversed
within three years, the share of paths opening below the plan's tier, and the realised whole score against the product
(reduce-7t.mjs scorePaths(), grade C: the whole-score rule waits for the maintainer); every world line; each solve's time.

## Falsified if

The margin explanation (P) is FALSIFIED when READER/0 still harms against OFF/0 on both harmed cases (item 2), or when
READER+J at 0 harms against the product or ends below its 0.001 result on both (item 3): the harm then survives the
margin's removal. Each other explanation is FALSIFIED as its item says (4, 5, 6); item 7 FALSIFIED is both reproduced pairs
staying different at 0; item 8 FALSIFIED is a small margin churning nearly as much as 0. INCONCLUSIVE is not a negative:
an explanation that reads INCONCLUSIVE stays a suspect. Item 1 FALSIFIED (no material harm at the product's settings)
says the harm was 7e's and 7t's settings'; the items are then read as the margin's effect on the product alone.

## Fair-test table

Arm A and arm B as the batch script sets them: arm A the product (OFF/1e-3, the same case) or, for item 2, off at the
same margin, and for items 5 and 6 the run with the one thing removed; arm B the run read against it. The pairs of item 7
are read across their two cases on the same paths.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S126 and bridge 4 (the reader's harm, 7e, 7r, 7t), S360 and share 0.95 (its largest gains), S194, and the family pairs S172 and S330 (O16, O21): chosen on purpose from the records, a diagnosis of those cases on the tuning seed; nothing here generalises beyond them (7u does that) | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | 7c's variants of S126 (bridge 4, share 0.95); the pairs planned at Medium Risk on pension and ISA (M14's PLANTIER) | the same, case by case | SAME |
| 4 | The survival asked for, when a run lands | no ask: lambda held - 0.025, the research reference, on the core cases; the landed 0.6503449126242364 (S172) and 0.9457416090031758 (S330) on the pairs | the same, case by case | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 8,000 paths of seed 7002 (the first 3,000 are 7r's), 1,000 a world on the harmed cases (each path's persistent shift set to the world's node); the gate checks the seed, the counts, the world lines and every trace's survival against its run line | the same paths, paired, for every run of every case | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself. The 'auto' rule's thin check (seed 7101) never runs on the core cases (no tier above) and is set explicitly on the pairs |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | the three-world mixture, each world's own move at every cell, the forward chooser's fixed weights (the product) | one change a run: one move for every world (`jointWorlds`, +J); the learning chooser on one policy's tables at margin 0 (+L, learn.mjs); five worlds on S330 mix5 (item 7's pair, against S330 mix3) | TESTED - one change a run, each read against the run without it (items 3, 5, 6, 7), the margin and the bridge read held |
| 8 | How each year's return is averaged (quadrature points) | 5 | 5 | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | the product's 'auto' rule on the core cases (no tier above within reach: the joint line records "off: no tier above the plan"); S172 down: none; S330: one tier above | the same on the core cases; S172 up: one tier above | SAME on every read but item 7's S172 pair, where it is TESTED (O16's own variable: S172 up against S172 down) |
| 17 | The grid: points, shares, gain buckets | 30 points (the product's), the default shares and gain buckets | the same | SAME |
| 19 | The switch margin and switching cost | the solved margin 0.001, the switching cost unchanged | the same tables run forward at 3e-4, 1e-4 and 0 (the cost unchanged) | TESTED - the switch margin, forward only (the tables do not depend on it): items 2, 3, 4, 5 and 8, and item 7 at 0.001 against 0 |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | 0.025 on the core cases; S172's and S330's landed values on their pairs; exponent 2 | the same, case by case | SAME within every read (every read compares two runs of one case, or item 7's two cases, which share their lambda) |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | bridgeRead off (OFF and every OFF run); the final year exact (the product's default); no block trim | bridgeRead 'reader' (READER and every READER run); the rest the same | TESTED - the bridge read, in items 1 and 2 (READER against OFF) and in item 9's reader candidates; held within items 3, 5, 6 and 8 |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan (the one-policy option refuses the ternary search) | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process per case writes every run and trace; the log's audit stamp covers audit-s126.mjs, swap.mjs and learn.mjs; item 7's pairs are two processes of the same code and stamp | the same | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; the whole score reported (survival, the capped estate at 0.02 of opening wealth, the dislike of cuts, the raise credit, per path from the trace) | the same | SAME |
| 30 | The reducer and its version | reduce-7v.mjs: requireFairLogs over the logs' stamps, then its own gate on every case line, solve, ran, joint, run and world line and the done count, and every trace's count, seed, arm, stamp and survival; INCOMPLETE unless all nine cases are done; 50 planted checks, 42 planted faults each caught (mutate-reduce-7v.py, results-reduce-7v-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; the regimen's exact rule per item (stats.mjs outcome() for harm, the exact one-sided McNemar test for a gain), Holm within each item, the exact 95% interval against the case's margin (marginFor: 0.25 at 95% survival or more, 0.5 below); the unconditional interval printed beside every no-material read; the whole score's paired mean and standard error reported | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival, switching and the whole score are simulated; the tables' readings appear only in the world lines, against the simulation | the same | SAME |
| 33 | For timings: what else the machine was running | the solve and run seconds are printed, not read | the same | N/A - no timing is read: nine processes share four cores, four at a time |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **The families** (reduce-7v.mjs harmFamily and gainFamily, single look, level 0.05): a harm leg reads **harm** when it
  loses more than it saves, the exact one-sided p under Holm over the item's legs is below 0.05 and the point loss is at
  least the case's margin; **no material harm** when the exact 95% interval's lower end is above minus the margin;
  otherwise **inconclusive** (stats.mjs outcome()). A gain leg reads **gain** when it saves more than it loses and the exact
  one-sided p for a gain under Holm is below 0.05; **no material gain** when the interval's upper end is below the margin;
  otherwise **inconclusive**. The margin is the case's (stats.mjs marginFor() of the product's survival on that case).
- **Items 1-8** read HELD, FALSIFIED or INCONCLUSIVE as the Prediction words them (item 7 also NOT REPRODUCED when neither
  pair differs at 0.001; a pair that does not reproduce is left out of item 7's reading). Item 3's step tolerance is 3 paths.
- **The attribution** (reduce-7v.mjs attribution(), printed as the ATTRIBUTION line): P is named when items 2 and 3 both
  HOLD; N when item 4 HOLDS; C when item 5 HOLDS; L when item 6 HOLDS. INCONCLUSIVE is never read as a negative.
- **The candidates** (item 9, reduce-7v.mjs candidates()): an arm at a margin below the product's - OFF/m, OFF+J/m,
  READER/m, READER+J/m (on S194 the reader arms are read on off's runs) - is a candidate when it does no material harm
  against the product on all five core cases (a harm family per arm over the five), and a reader arm also gains on S360 and
  share 0.95 (a gain family per arm over the two).
- **NOT SETTLED:** the fair-test gate fails - something besides the things tested moved.
- **The registered reading decides; the unconditional one is printed beside it** (the regimen's item 1 waits for the
  maintainer): every no-material read where the two disagree is marked, and a candidate with such a leg is marked too.
- **Declared choices, not derived:** Holm within each item (each item is its own claim, and the attribution names an
  explanation only from its own item); the step tolerance of 3 paths in item 3; item 8's half; the margins 1e-4 and 3e-4
  (the draft's, a third and a tenth of the product's); 1,000 paths a world; the research reference lambda on the core cases.

## Decision fed

- **P HELD (items 2 and 3), N FALSIFIED:** the margin's hold on a near-tie carries the reader's harm, and margin 0 does no
  harm here. What goes to the maintainer: the candidates (item 9) with their churn (item 8), the cheapest first, for 7u to
  test on 7e's panel and a broad one; the held tier as part of the solved state named as the principled fix if the churn at
  the candidate margin is not acceptable advice (the maintainer's open question 2).
- **P HELD with N HELD:** the margin carries the harm, and margin 0 follows noise somewhere; the candidate for 7u is the
  small positive margin that is a candidate in item 9 with the least churn, or, if none is, the solved held-tier state.
- **P FALSIFIED:** the harm survives the margin's removal; the margin is dropped as its sole cause, and C or L (items 5,
  6), if HELD, goes to the maintainer as the next suspect with its fix (one policy for every world; a learner with a
  declared information set); if neither holds, the grid and a second seed are the options put to the maintainer.
- **INCONCLUSIVE on P:** the margin stays a suspect beside whatever else is HELD; no candidate goes to 7u without the
  maintainer's decision, and a second seed is proposed for the legs that did not settle.
- **Item 1 FALSIFIED:** the reader does no material harm at the product's settings; the reader alone goes back to the
  maintainer for re-testing in 7u on 7e's panel, and the margin's items are read as its effect on the product.
- **Item 7:** HELD adds O16 and O21 to the margin's family (their gates move to 7u); FALSIFIED leaves them open with their
  own gates; NOT REPRODUCED leaves them open and says so.
- F2, 7q, 7n, 8b, any re-test of 'auto' and any default change wait for 7v's read and the maintainer's decision on it.

## Provenance

- The mode: audit-s126.mjs diag7v (commit 39edb00 and after); measureV2's `lambda` and `forward` options default to today's
  behaviour. The batch batch-7v.sh; the preflight preflight-7v.sh with preflight-parse-7v.mjs (a measurement through the
  launcher, tiny, no figure read). The timing measurement of 27 Sep (a measurement through the launcher, runs.log): the
  seconds only.
- The option `jointWorlds` and its tests: solve.js (70a8b55), research/tests/solver-joint.test.mjs. The learner:
  learn.mjs, research/tests/solver-learn.test.mjs.
- 7t's figures: results-7t.txt, results-7t-vs-product.txt, results-7t-deep.txt. 7e's: results-7e.txt. O16's:
  results-m14b.txt, results-m14b-why.txt. O21's: results-quadref-exact.txt. The landed lambdas: results/m14b-down/S172.json
  and S330.json ("lambda held"). The research reference: PLAN.md's ledger, 25 Sep 20:31 UK (O15).
- The second deep review: deep-review-log.md, 27 Sep 02:07 UK; drafts/after-7t-proposal.md.

## Derivation script

- `derive: research/solver/derive-7v.mjs > research/solver/results-derive-7v.txt sha256 6c882ed7a8dba680`
  (each item's legs drawn as Poisson counts under each story with a background of 1.33 and 13.3 paths each way, read by
  reduce-7v.mjs's own families; the sizes from 7t, 7e, M14b and 7h's records).

## Point and interval

80% intervals, the author's, in paths of 8,000 (saved less lost) or as named:
- Item 1: READER/1e-3 against the product, S126 -38 (-60 to -15), bridge 4 -25 (-45 to -8).
- Item 2: READER/0 against OFF/0, 0 (-4 to +4) on each.
- Item 3: READER+J against the product at 0.001, 3e-4, 1e-4, 0: S126 -38, -25, -10, -2 (-12 to +6 at 0); bridge 4 -25,
  -15, -5, +3 (-8 to +12 at 0).
- Item 4: margin 0 against the better small margin, worst core case -10 (-60 to +2); on S360 OFF/0 against OFF/1e-3 -400
  (-600 to -50).
- Item 5: READER+J against READER at 1e-4 and 0, +3 (-3 to +12) each.
- Item 6: the learner at one policy and 0, +2 (-3 to +8) on each.
- Item 7: S172 up against down at 0.001 -55 (-80 to -20), at 0 -5 (-25 to +8); S330 mix5 against mix3 at 0.001 +18 (0 to
  +35), at 0 +3 (-10 to +15).
- Item 8: READER+J's switches a path at 1e-4, 2 (0.3 to 5); at 0, 10 (7 to 12).

## Credence

The author's probability that each item holds as predicted: 1, 0.80; 2, 0.85; 3, 0.45; 4 (FALSIFIED, no noise at 0 on the
core cases), 0.35; 5 (FALSIFIED), 0.55; 6 (FALSIFIED), 0.65; 7 (HELD), 0.30; 8, 0.60. P named (items 2 and 3 both HELD):
about 0.40. At least one READER+J candidate in item 9: about 0.50. The cumulative scorecard stands at 0.223 against its
0.20 target (O29), so these are set lower than 7t's where 7t was overconfident on its negatives. Scored by scorecard.mjs.

## Power

From results-derive-7v.txt (20,000 draws a story; each item read by the reducer's own families with Holm over its legs):
- **Item 1** (the harm at 7e's 30-point size, 38 and 25 paths): HELD 0.854 with a background of 1.33 paths each way, 0.771
  with 13.3; at 7t's size 0.962 and 0.899; at half 7e's size mostly INCONCLUSIVE (0.620 and 0.916); with no harm FALSIFIED
  1.000 and 0.963.
- **Item 2:** the reader identical to off at 0 reads HELD 1.000 and 0.962; the harm kept at 0 reads FALSIFIED 0.960 and 0.897.
- **Item 3's no-harm leg at 0:** none left, no material harm on both 1.000 and 0.960; 7t's margin-0 losses (14 and 10)
  0.820 and 0.083 - at the larger background such losses read INCONCLUSIVE ("mixed" 0.906), not a cure; the harm kept, harm
  on both 0.962 and 0.896.
- **Item 5:** no gain, FALSIFIED 1.000 and 0.918; half the harm saved at each margin, HELD 0.957 and 0.358.
- **Item 6:** nothing added, FALSIFIED 0.999 and 0.949; a quarter of the harm saved, HELD 0.581 and 0.120 (INCONCLUSIVE
  0.340 and 0.625): a small learning effect mostly reads INCONCLUSIVE.
- **Item 7:** S172 reproduces O16's loss 1.000 and meets at 0 0.981 or better; S330 reproduces O21's gain 0.998 and 0.847,
  and meets at 0 0.969 or better.
- **What it cannot see:** a harm below the margin (20 paths of 8,000 at the 0.25 margin) reads as none; item 4 is read on
  point counts where the peak is chosen, so a peak within a few paths of 0's reads no noise.
- **Time:** from the timing measurement on S126 (27 Sep, a quiet box): a 30-point solve about 232 to 234 s, a traced forward
  run about 63 s a thousand paths (about 505 s at 8,000); so S126 and bridge 4 about 3 h each, S360 and share 0.95 about
  2.7 h, S194, the S172 pair and S330 mix3 about 1.4 h each, S330 mix5 about 2.1 h; nine processes four at a time, the
  longest first: about 5.5 hours on a quiet box, 6 to 7 with the four sharing the cores, plus the smoke run.

## Budget line

The bridge class's decision error: the reader cost S126 0.47 and bridge 4 0.31 points of survival in 7e. 7v removes no
error itself; it says whether the forward chooser's switch margin carries it, and which margin (and whether one policy for
every world) can go to 7u as the candidate fix, at what churn.

## Pre-mortem

- **Most likely:** item 1 and 2 hold, item 3 INCONCLUSIVE - one policy at 0 cures on one harmed case and leaves a small loss
  on the other, as 7t's margin-0 runs did (S126 2 lost, bridge 4 5 lost against 7t's OFF); the candidates then carry
  unconditional-interval warnings, and 7u's larger panel decides.
- **Second:** the harm does not reproduce at 30 points and lambda 0.025 (item 1 INCONCLUSIVE or FALSIFIED): 7e's harm was
  read at lambda 0.0224, which is close, so the points are the likelier cause; the margin's items still say what the margin
  does to the product.
- **Third:** noise at 0 on S360 (item 4 HELD), as 7t's OFF/M0 lost 520 there; then the reader's candidates survive only at
  a small positive margin, if at all, since the reader at 0 kept its S360 gains in 7t (899 saved).
- **Fourth:** the family pairs do not reproduce at seed 7002 (O16 and O21 were read on seed 7011 at 3,000 paths); item 7
  reads NOT REPRODUCED and says nothing about them.
- **The smoke run:** smoke.sh (locked) does not run diag7v; the crash check of 27 Sep 07:06 UK and the preflight through the
  launcher (all nine cases, every line through the reducer's parse and gate, every trace's name) cover it.
- **Least likely:** the gate fails; the run is then NOT SETTLED.

## Changes after seeing results

None.
