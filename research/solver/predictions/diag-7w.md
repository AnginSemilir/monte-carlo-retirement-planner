# Prediction: diag-7w

- **Run:** `research/solver/batch-7w.sh` - results/diag7w/case0-8.txt and every run's trace (audit-s126.mjs diag7w); reduced by `reduce-7w.mjs` into results-7w.txt
- **Kind:** test
- **Written:** 27 Sept, 18:37 UK, before the run (new-prediction.mjs's stamp). The maintainer, 27 Sep: "agree - do option A, waive the registered second seed" (PLAN.md ledger 27 Sep 18:25), on the sixth deep review's proposal (deep-review-log.md, 27 Sep 18:19 UK)
- **Seen before registration:** no 7w output. The preflight (runs.log, a measurement under PREDICTION="none:...", 4 points and 20 paths) wrote logs whose lines carry figures at those sizes; only the parse check's verdict line was read. The sizes in the Power section are 7v's traces restricted to 7w's own paths, already read and published at 7v's read (results-7v.txt, results-derive-7w.txt)
- **Seeds:** 7002 tuning (3,000 paths, the first 3,000 of 7v's 8,000 and of 7r's; the same paths for every run of every unit). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan; on the three cases it never draws a path (no tier above within reach, as 7v's gate confirmed, and 7w's gate requires the same joint-line decision). The registered second seed is waived by the maintainer; the held-out seed reserved to 7u is not used
- **Unmasking:** fifteen return points remove a suspected error of the solver's own, Q: the five-point average of the year's return has no point between the year-1 failure thresholds of the plan's tier and tier 2 on share 0.95 (the sixth deep review, grade C; results-derive-7w.txt, "Q's arithmetic"), so the reader's table values the year-0 de-risk at 2.2992e-4 (about 1.8 paths of 8,000) where the realised year-1 excess is 175 paths. The baseline behaviour that error drives: the reader keeps the plan's tier at the product's margin (7v: READER/1e-3 opens in tier 0 and READER/0 saves 69 of these 3,000 paths). The separating arms: S126 (item 3), whose losses are not year-1 failures, tells a fix of the cliff from a quadrature change that moves every table; the 15-point runs at margin 0 against the 5-point ones (reported) tell whether fifteen points change anything beyond the opening; every 15-point run is set against its unit's 5-point run path by path, so a harm fifteen points unmask elsewhere (Q's arithmetic says fifteen points see about three times the true year-1 excess through one point, so they may over-de-risk) shows as lost paths. The freed-opening arm (item 4) removes P's opening hold alone and tells it from any later hold
- **Plan section:** PLAN.md "7w"

## Question

7v read P (the switch margin holding a near-tie opening tier for life) as INCONCLUSIVE by its registered rule, with grade C
evidence for it, and named N and L. The sixth deep review (deep-review-log.md, 27 Sep 18:19 UK) resized T, the fifth
review's "the tables undervalue the opening de-risk beyond what holding it explains" (O32): on share 0.95, 175 of the 177
extra failures fall in YEAR 1, the bridge's last year, so the table's year-0 gap (2.2992e-4) stands against a realised loss
about 95 times it. It proposed Q: whether a path fails in year 1 turns on the year-0 shock crossing a threshold (about
-1.52 sd at the plan's tier and -1.69 at tier 2, z0 + 0.4 x the path's shift), both thresholds fall between the same two
of the solver's five return points in every world, and the reader's last-bridge-year pay-out is a hard step
(src/solver/reader.js l.56; the exact final year covers only the plan's last year), so the five-point average cannot see
the de-risk's year-1 value.

**Is T the five-point return average hiding the bridge's last year (Q)?** And, beside it: does freeing only the year-0
move at the product's margin (the opening P blames) do what margin 0 does, without its churn?

**At the product's settings but for lambda**, as 7v: solvePlan's own entry with 30 points and the 'auto' risk-above rule,
lambda held at 7t's and 7v's 0.0223606797749979, the final year exact. The return points are 5 (the product's) or 15
(solve.js gaussHermite(15), used by 7s at 16 points on S126 and bridge 4). **A within-sample diagnosis**: 7w reuses 7v's
first 3,000 paths; a gap is a property of the solved tables and needs no paths, and the path items are read on the same
paths as 7v, so it is paired with 7v's record (grade C, as 7v).

## Derivation

What the code and the records say before any run:
- **Q's arithmetic** (derive-7w.mjs, results-derive-7w.txt): with the review's thresholds and the mixture's three worlds
  (solve.js MIX3: shifts -1.73, 0, +1.73, weights 1/6, 2/3, 1/6), the five points see a year-1 excess of 0.0000 (no point
  in any world's interval), fifteen points 0.0596 (the point -1.607 lies in the middle world's interval [-1.690, -1.520)),
  and the continuous chance is 0.0208 (166 of 8,000 paths, against 7v's realised 175). So fifteen points see the cliff,
  through one point, at about three times its true size; the point sits 0.08 from each end of its interval, so a small
  error in the review's thresholds leaves this unchanged.
- **The gap's scale.** 7v's reader gap on share 0.95, 2.2992e-4, is about 1.8 paths of 8,000 (the sixth deep review):
  about one score unit a unit of survival chance. If the table's year-0 value moves by the seen excess, the 15-point gap is
  about 0.06, some 250 times the 5-point one, and far past the product's margin (0.001). The ratio items therefore read
  tenfold (HELD) or threefold (FALSIFIED), wide of Q's point, so interpolation of the table's cliff in wealth can smear it a
  long way before item 1 moves.
- **What survival follows.** If the reader at 15 points opens de-risked at 0.001, its survival on share 0.95 should approach
  what margin 0 bought at 5 points: 7v's READER/0 saved 69 and lost 0 of these 3,000 paths against READER/1e-3, READER+J/0
  70 and 0, and READER/1e-4 70 and 1 (results-derive-7w.txt, from 7v's traces restricted to 7w's paths).
- **The control.** S126's reader losses are not year-1 failures (the sixth deep review; 7s: READER@15 against READER at 16
  points on S126, 0 saved and 1 lost, results-7s.txt), so Q predicts its gap barely moves (8.0241e-4 at 5 points, 7v).
- **The freed opening.** /1e-3+open runs the chooser at margin 0 in year 0 and at 0.001 after. On S126 the reader's gap
  (8.0241e-4) and on S194 off's (7.5604e-4) are inside the margin, so at 0.001 both keep the plan's tier, and 7v's margin 0
  gained against them on these paths: S126 READER/1e-3 lost 12 and saved 0 against READER/0, S194 OFF/1e-3 lost 15 and
  saved 4 against OFF/0. If P's harm is the opening alone, the freed opening is level with margin 0, and switches as rarely
  as 0.001 (7v: READER at 0.001 0.27 switches a path on share 0.95, at 0 about 4 to 5).
- **The product (item 5).** Off reads the bridge flat (7t, 7v): its table has no reader step at the bridge's last year, so
  Q's mechanism, the step averaged over five points, is not in off's table. Off's gap on share 0.95 (4.3068e-5) and its
  margin-0 gain (983 of 8,000) come from somewhere else (O33), and fifteen points are not expected to lift its gap tenfold.

## Prediction

Nine units, each one solve at the product's settings with 5 or 15 return points and run forward on the same 3,000 paths of
seed 7002 at switch margin 0.001 (/1e-3), 0 (/0) and 0.001 with the year-0 move freed (/1e-3+open): share 0.95 READER,
READER+J and OFF at 15 and at 5 points, S126 READER at 15 and at 5, S194 OFF at 5. Items (reduce-7w.mjs items(); 2 and 4
each a Holm family of their own, 1, 3 and 5 read by their registered ratios):
1. **Q on the reader:** on share 0.95 the year-0 gap rises at least tenfold from 5 to 15 points and passes the product's
   margin (above 0.001: the chooser at 0.001 no longer keeps the plan's tier), with and without one policy (HELD).
   FALSIFIED: less than threefold on both.
2. **Q's survival:** on share 0.95 the reader at 15 points gains against itself at 5 points at the product's margin, with
   and without one policy (HELD). FALSIFIED: no material gain on both.
3. **The control:** S126's reader gap moves by less than a factor of two either way between 5 and 15 points (HELD).
   FALSIFIED: it rises tenfold or more (Q would then explain S126 too, against 7s).
4. **The freed opening:** with the year-0 move freed at the product's margin, S126's reader and S194's off do no material
   harm against margin 0 and switch at most half as often (HELD). FALSIFIED: harm on both.
5. **Q on the product:** off's year-0 gap on share 0.95 rises at least tenfold at 15 points and passes the product's margin
   (FALSIFIED: less than threefold - the prediction, from the Derivation's last point).

Reported, not items: every run's survival, saved/lost against its unit's own 5-point run at 0.001, switches a path; every
solve's year-0 gap and the tier it opens in at 0.001 and 0; each 15-point run against the 5-point run at the same margin
(the 15-point runs at margin 0 included); each solve's time.

## Falsified if

Q is FALSIFIED on the reader when share 0.95's year-0 gap rises less than threefold from 5 to 15 points, with and without
one policy (item 1), or when the reader at 15 points shows no material gain against itself at 5 points on both (item 2).
Item 3 FALSIFIED (S126's gap rising tenfold) says fifteen points move S126's tables as much, so Q is not specific to the
bridge's last year and the S126 reading of P is re-opened. Item 4 FALSIFIED (the freed opening harming against margin 0
on both cases) says the opening is not all of what margin 0 buys: a later hold matters too. Item 5 HELD, against the
prediction, says Q reaches the product's own table. INCONCLUSIVE is never a negative: the suspect stays open.

## Fair-test table

Arm A and arm B as the batch script sets them: for the gap items (1, 3, 5) and item 2, the same case, arm and margin at 5
points (A) and at 15 (B); for item 4, the same solve at margin 0 (A) and at 0.001 with the year-0 move freed (B).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | share 0.95 (the case Q was found on, the reader's largest year-1 loss), S126 (the control, the reader's harm), S194 (off's sub-margin opening, O33): chosen on purpose from 7v's records; a diagnosis of those cases, nothing generalised | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | share 0.95 is 7c's variant of S126 (audit-s126.mjs F1_VARIANTS) | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 3,000 paths of seed 7002, the first 3,000 of 7v's (pathsForSeed builds each path from the seed alone: checked by derive-7w.mjs) | the same paths, paired, for every run of every unit | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | the three-world mixture; one move for every world (+J) on share 0.95's READER+J units | the same, unit by unit | SAME within every read (item 1 and item 2 read READER and READER+J each against itself) |
| 8 | How each year's return is averaged (quadrature points) | 5 (the product's) | 15 (solve.js gaussHermite(15)) | TESTED - items 1, 2, 3 and 5; held at 5 in item 4 |
| 13 | The risk tier chosen, consent to change it, risk above | the product's 'auto' rule (no tier above within reach: the joint line's "off: no tier above the plan", required by the gate) | the same | SAME |
| 17 | The grid: points, shares, gain buckets | 30 points (the product's), the default shares and gain buckets | the same | SAME |
| 19 | The switch margin and switching cost | the solved margin 0.001, the switching cost unchanged; items 1-3 and 5 at 0.001; item 4's arm A at 0 | item 4's arm B: 0 in year 0, 0.001 after (the cost unchanged) | TESTED in item 4 alone (the year-0 margin); SAME in items 1, 2, 3 and 5 |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | 7t's and 7v's 0.0223606797749979, exponent 2 | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | bridgeRead 'reader' on READER units, off on OFF units; the final year exact; no block trim | the same, unit by unit | SAME within every read (each item compares a unit with itself or its own 5-point twin) |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process a unit, every unit from the same snapshot and stamp (requireFairLogs) | the same | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; the year-0 gap: the smallest margin at which the chooser keeps the plan's tier at runPolicy's opening state (the table's own reading, read by items 1, 3 and 5 as the thing Q is about) | the same | SAME |
| 30 | The reducer and its version | reduce-7w.mjs: requireFairLogs over the logs' stamps, then its own gate on every unit, solve, ran, gap, joint and run line and the done count, and every trace's count, seed, arm, stamp and survival (within 0.00005, the run line's four decimals); INCOMPLETE unless all nine units are done; 23 planted checks, 29 planted faults each caught (mutate-reduce-7w.py, results-reduce-7w-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; the regimen's exact rule (reduce-7v.mjs gainFamily and harmFamily: stats.mjs outcome() for harm, the exact one-sided McNemar test for a gain), Holm within each item, the exact 95% interval against the case's margin; the unconditional interval printed beside | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival and switching are simulated; the gap is the table's reading, read as the table's reading (items 1, 3, 5), never as survival | the same | SAME |
| 33 | For timings: what else the machine was running | the solve and run seconds are printed, not read | the same | N/A - no timing is read: nine processes share four cores, four at a time |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **The families** (reduce-7v.mjs harmFamily and gainFamily, single look, level 0.05), as 7v: a harm leg reads **harm**
  when it loses more than it saves, the exact one-sided p under Holm over the item's legs is below 0.05 and the point loss
  is at least the margin; **no material harm** when the exact 95% interval's lower end is above minus the margin; otherwise
  **inconclusive**. A gain leg reads **gain** when it saves more than it loses and the exact one-sided p for a gain under
  Holm is below 0.05; **no material gain** when the interval's upper end is below the margin; otherwise **inconclusive**.
  The margin is the case's: stats.mjs marginFor() of the case's 5-point run at 0.001 (the product on share 0.95 and S194,
  the reader on S126, where 7w runs no off unit): 0.25 at 95% survival or more, 0.5 below.
- **The gap items** read the logged year-0 gap (a number, 0 when the chooser keeps the plan's tier at margin 0, or >1): the
  ratio of the 15-point gap to the 5-point one (unbounded from a 5-point gap of 0 to any positive one). Item 1 HELD needs a
  ratio of at least 10 and a 15-point gap above 0.001, on both legs; FALSIFIED a ratio below 3 on both; otherwise
  INCONCLUSIVE. Item 3 HELD is a ratio between 1/2 and 2 (exclusive); FALSIFIED at least 10. Item 5 as item 1, one leg.
- **Item 2** HELD when both legs gain, FALSIFIED when both show no material gain. **Item 4** HELD when both legs show no
  material harm and each freed run's switches a path are at most half its margin-0 run's; FALSIFIED when both harm.
- **NOT SETTLED:** the fair-test gate fails - something besides the things tested moved.
- **The registered reading decides; the unconditional one is printed beside it,** marked where they disagree.
- **Declared choices, not derived:** the ratios 10, 3 and 2 (an order of magnitude against Q's point of about 250, and a
  factor the quadrature alone could move a gap by); item 4's half (7v's item 8); Holm within each item.

## Decision fed

- **Q HELD on the reader (items 1 and 2):** the five-point average is a named error on share 0.95, T's cause there, apart
  from P. O32 is re-written as found (grade C, one seed, one case); the share of 7v's share 0.95 results that P was carrying
  is re-read as Q's; the fix goes to the maintainer as options with their costs - more return points at the bridge's last
  year (or everywhere: the 15-point solve's time is printed), or the exact integral over the year-0 shock at the reader's
  step as the exact final year does at the plan's last year (O19's pattern) - each needing its own registered test on 7e's
  panel before any default moves. SWITCH_MARGIN is not changed on it.
- **Q FALSIFIED (item 1 or item 2 FALSIFIED):** Q is dropped; T stays open in the register with L and N; the opening test
  of the fifth deep review (a rollout of each opening tier) is the next proposal to the maintainer.
- **Q INCONCLUSIVE:** Q stays a suspect; no fix is proposed on it; a finer read (the gap at 9 and 25 points) is put to the
  maintainer.
- **Item 3 HELD:** the control holds and Q is specific to the bridge's last year. **FALSIFIED:** fifteen points move S126
  as well; 7v's P reading on S126 is re-opened against the quadrature before any P fix. **INCONCLUSIVE:** reported beside Q,
  not read.
- **Item 4 HELD:** freeing the year-0 move at the product's margin buys what margin 0 buys on S126 and S194 without the
  churn: a candidate for 7u beside the held tier in the solved state, put to the maintainer. **FALSIFIED:** the opening is
  not all of it; the held-tier build stays the proposal. **INCONCLUSIVE** (its power is low: results-derive-7w.txt):
  neither is proposed on it.
- **Item 5 HELD:** Q reaches the product's own table, and O33's share 0.95 figure is re-read under it. **FALSIFIED:** O33
  stays as it is. **INCONCLUSIVE:** reported only.
- Until 7w is read and the maintainer decides: no 7u, no SWITCH_MARGIN change, no held-tier build, no use of seed 7013.

## Provenance

- The mode: audit-s126.mjs diag7w (1e719ad); measureV2's third argument sets the return points (as 7s's). The batch
  batch-7w.sh; the preflight preflight-7w.sh with preflight-parse-7w.mjs (a measurement through the launcher, tiny, no
  figure read). The reducer reduce-7w.mjs, which reuses reduce-7v.mjs's paired cells and families.
- 7v's figures: results-7v.txt and its traces (results/diag7v), through 7v's own stamp gate in derive-7w.mjs. 7s's:
  results-7s.txt. The sixth deep review: deep-review-log.md, 27 Sep 18:19 UK. The register: O30, O32, O33 (PLAN.md).

## Derivation script

- `derive: research/solver/derive-7w.mjs > research/solver/results-derive-7w.txt sha256 e20083d25e69e663`
  (Q's arithmetic over the solver's return points; 7v's sizes on 7w's own paths through 7v's gate; item 2's and item 4's
  legs drawn as Poisson counts under each story with a background of 0.5 and 5 paths each way, read by the reducer's
  families).

## Point and interval

80% intervals, the author's; paths of 3,000 (saved less lost) or as named:
- Item 1: the reader's gap on share 0.95 at 15 points 0.05 (0.004 to 0.09), READER+J's the same; ratio about 200 (15 to 400).
- Item 2: READER@15 against READER@5 at 0.001, +65 (+20 to +75); READER+J the same.
- Item 3: S126's reader gap at 15 points 8e-4 (5e-4 to 1.5e-3), ratio 1.0 (0.6 to 1.9).
- Item 4: the freed opening against margin 0, S126 0 (-4 to +3), S194 -2 (-10 to +4); switches a path at most 0.5 against
  about 4 at margin 0.
- Item 5: off's gap on share 0.95 at 15 points 6e-5 (0 to 5e-4), ratio 1.5 (0.5 to 12).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.65; 2 (HELD), 0.60; 3 (HELD), 0.55; 4 (HELD),
0.35; 5 (FALSIFIED), 0.45. The cumulative scorecard stands at 0.221 against its 0.20 target (results-scorecard.txt), and
7v's HELD calls were overconfident, so none is given above 0.65. Scored by scorecard.mjs.

## Power

From results-derive-7w.txt (20,000 draws a story; each leg read by the reducer's families with Holm over its legs;
backgrounds of 0.5 and 5 paths each way):
- **Item 2** at 7v's 1e-4 size on these paths (69 and 72 saved) reads HELD 1.000 at both backgrounds; at half, 1.000; at a
  quarter (17 and 18), 0.997 and 0.916; with no gain, FALSIFIED 1.000 and 0.978. Item 2 settles either way.
- **Item 4**, level with margin 0: no material harm on both 1.000 at the small background but 0.533 at the larger (mixed
  0.466); half of 0.001's loss kept, mostly mixed (0.750, 0.917); all of it kept, harm on both 0.676 and 0.457. Item 4 is
  weak: at margin 0's own churn it can read INCONCLUSIVE with the opening doing all the work (hence its credence).
- **Items 1, 3 and 5** are one solve each read by a ratio: no power is drawn. Q's arithmetic (above) puts item 1's point an
  order of magnitude past its HELD line.
- **What it cannot see:** a gap Q moves by less than tenfold because the table interpolates the cliff in wealth - item 1
  then reads INCONCLUSIVE, and item 2 still says whether survival moved; a harm below the margin (7 paths of 3,000 at 0.25).
- **Time:** a 30-point 5-point solve on share 0.95 took 251 to 323 s in 7v (results-7v.txt), and 7s's 15-point solves about
  twice the 5-point ones (results-7s.txt: 899 and 911 s against 430 and 432); 7v's traced forward runs took 409 to 589 s at
  8,000 paths, about 150 to 220 s at 3,000, and a 15-point run is assumed about twice that. So a 15-point unit about 35 to
  45 minutes, a 5-point unit about 15; the four 15-point units first, four at a time: about 70 to 90 minutes, plus the smoke
  run and the launcher's re-run of derive-7w.mjs (about 3 minutes).

## Budget line

On share 0.95 the reader at the product's margin loses 69 of these 3,000 paths (2.3 points of survival) to margin 0, and 7v
could not tell whether that is the margin's hold (P) or a table that cannot see the bridge's last year (Q). 7w removes no
error itself; it says whether the five-point average is that error, and whether freeing the opening alone is enough.

## Pre-mortem

- **Most likely:** Q holds on the reader (items 1 and 2), the control holds (item 3), item 4 INCONCLUSIVE at margin 0's
  churn, and off's gap barely moves (item 5 FALSIFIED).
- **Second:** item 1 INCONCLUSIVE - the gap rises but less than tenfold, because the table's cliff is smeared across its
  wealth grid; item 2 then decides whether the opening moved.
- **Third:** fifteen points de-risk share 0.95 but also move other years (they see about three times the true year-1
  excess), so item 2's gain comes with lost paths; the 15-point runs at margin 0 against the 5-point ones show it.
- **Fourth:** the gap line's opening state (one path's, as 7v's) is not the state most paths open in; the reported
  openings at 0.001 and 0 and item 2 cross-check it.
- **The smoke run:** smoke.sh (locked) does not run diag7w; the preflight through the launcher (all nine units, every line
  through the reducer's parse and gate, every trace's name) covers it.
- **Least likely:** the gate fails; the run is then NOT SETTLED.

## Changes after seeing results

None.
