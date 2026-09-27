# Prediction: diag-7z

- **Run:** `research/solver/batch-7z.sh` - results/diag7z/case0-7.txt and every run's trace (audit-s126.mjs diag7z); reduced by `reduce-7z.mjs` into results-7z.txt
- **Kind:** test
- **Written:** 27 Sept, 22:48 UK, before the run (new-prediction.mjs's stamp). Under the maintainer's 21:29 row ("i agree to the blind spot fix in parallel", PLAN.md ledger 27 Sep 21:29: 7z, share 0.95 and a no-bridge control, the reader on in both arms, the fix on against off, registered after 7x is read and the O35 and O36 diagnostics are in; not launched on 7x's item 3 FALSIFIED - it read HELD) and the deep review after 7x (deep-review-log.md 27 Sep 22:32 UK; PLAN.md ledger 22:32: S126 and bridge 4 added as no-harm legs, since the fix acts in the years before their reader years too)
- **Seen before registration:** O35's diagnostic (results-o35-diag.txt: at share 0.95's opening, the de-risk's year-1 value at level 0.80 is +2.0157 points by 4,000 equal-probability points against +0.0054 by 5); O36's p0 (results-o36-p0.txt); the fix's own test (research/tests/solver-step.test.mjs, 10 passed: at 8 points, spend levels 1.1 to 0.8, lambda 0.05, the chooser's scores with the fix within 0.00013 of the 4,000-point scores at share 0.95's opening in every world, the five points missing them by up to 0.23653). No 7z output: the preflight runs after this registration
- **Seeds:** 7002 tuning (8,000 paths, 7v's and 7x's; the first 3,000 are 7w's; the same paths for every unit). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan; on these four cases it draws no path (no tier above within reach, as 7v's to 7x's gates confirmed; 7z's gate requires the same decision). The held-out seed reserved to 7u is not used
- **Unmasking:** the fix removes Q in the chooser: the reader's read of next year's survival has a hard step at that year's first bill in accessible money (reader.js referenceChance), and five return points average across it blind - at share 0.95's opening they see the de-risk's year-1 value as +0.0054 points where 4,000 points see +2.0157 (results-o35-diag.txt). The baseline behaviour that error drives: the reader keeps the plan's tier at the product's margin on share 0.95 (7v, 7w: gap 2.2992e-4, opens 0 at 1e-3) and loses the paths the freed opening saves (72 of 3,000, results-7w.txt). What tells a harmful change from one that unmasks another error: S126 and bridge 4 (item 3), where the fix also acts (each year before a reader year) but no year-1 loss is recorded - a harm there is the fix's or an error it unmasks, and the reported saved/lost with the years below target and switches separate them; S194 (item 4), where no reader year exists, so any difference is an implementation leak, not an unmasking. O36's p0 is the reader's other known error (the table's year-0 value); the chooser never reads it (the deep review after 7x), so the fix does not unmask it, and it is not tested here
- **Plan section:** PLAN.md "7z"

## Question

Does integrating the year's return across the reader's step in next year's accessible money (solve.js bridgeStep 'exact':
12-point Gauss-Legendre on each side of the step, in the chooser at the true state and in the backward pass at the grid's
nodes) make the reader open share 0.95 de-risked at the product's margin and gain survival there, without harm on S126 and
bridge 4, and with nothing changed on a household with no reader year (S194)?

## Derivation

- **The size of the blind spot** (results-o35-diag.txt, diag-o35.mjs; grade C: one household, one state): at share 0.95's
  opening the step at the floor bill (23,199 of accessible money) falls inside the year's returns for every move (z* from
  -2.606 to 5.571). Per spend level, the de-risk's year-1 value (the best move at 2/2 less the best at 0/0,
  mixture-weighted) by 5 points, 15 points and 4,000 points: level 0.80 +0.0054, +0.3108, +2.0157; level 0.90 -0.0045,
  -3.8725, -14.8621. So the five points see almost none of the de-risk's value at the floor level, and fifteen about a
  sixth; the fix's integral should see what 4,000 points see (the fix's test: within 0.00013 of it in score).
- **What the chooser does with it.** The year-0 gap is the smallest margin at which the chooser keeps the plan's tier; at
  5 points it is 2.2992e-4 on share 0.95 (7v, 7w), at 15 points 3.1576e-3 and the reader opens in tier 2 at the product's
  margin (results-7w.txt, item 1 HELD). With the value seen whole (about 2 points, 0.02 in score), the gap should be an
  order above 15 points' and the opening de-risked: item 2's line at 2e-3 is below 15 points' own gap.
- **What survival follows.** On share 0.95 the fix acts only at year 0 (the reader's years are 0 and 1; the fix acts in a
  year whose next is a reader year). If it opens de-risked, it should realise about what the freed opening realised: 72
  saved and 0 lost of 7w's 3,000 paths against the reader at 0.001 (results-7w.txt), about 192 of 8,000
  (results-derive-7z.txt). 15 points realised the same 72/0 (results-7w.txt).
- **Where it also acts.** S126 (share 0.85, a two-year bridge: the fix acts at year 0) had a year-0 gap of 8.0241e-4 at 5
  points and 6.5248e-4 at 15 (results-7w.txt), and the freed opening saved 15 of 3,000 against the product with none lost:
  whether the fix frees it is open; either way the freed opening did no harm. Bridge 4 (a four-year bridge: the fix acts at
  years 0 to 2, where the step at the first bill is from 0 to the chance of the rest, smaller than the last year's) has no
  freed-opening record; it is the leg most likely to show an effect nobody has measured.
- **The backward part** acts at the grid's nodes in the years before a reader year; the deep review after 7x found no node
  near share 0.95's opening that sees the step, so it barely moves the opening; it is kept (it is the same integral at the
  nodes, and consistent with the chooser), and item 4's control and the fix's test B bound where it can act.
- **The prior tests of the same mechanism** (RULES.md section 9 rule 7), each with its verdict:
  - **7w** (results-7w.txt): the reader at 15 return points against 5 on share 0.95: the gap rose from 2.2992e-4 to
    3.1576e-3 and it opened in tier 2 (item 1 HELD), gaining 72 saved and 0 lost of 3,000 (item 2 HELD); S126's gap moved
    less than twofold (item 3 HELD). The fix is the same mechanism without the node lottery.
  - **7s** (results-7s.txt): the reader at 15 points against 5 on S126 and bridge 4: S126 0 saved, 1 lost. Fifteen points
    did not harm there - the reason item 3 is expected to hold.
  - **7i** (results-bridgequad.txt): 5 against 15 points with the bridge read off: "the misread is the read, not the
    averaging". No reader, no step: it does not bear on the fix.
  - **7g/7h and O19** (results-o19.txt, results-o19-exact.txt, results-quadref-exact.txt): the same integral at the plan's
    last year (finalYearExact), the pattern this fix copies: it raised survival only where the tier above was allowed and
    moved no other household; now the product's default (the maintainer, 25 Sep).

## Prediction

1. **The gain:** on share 0.95, the reader with the fix gains against the reader without it at the product's margin
   (about +2.4 points: 192 saved, 0 lost of 8,000).
2. **The opening:** with the fix, share 0.95's year-0 gap is at least 2e-3 and the reader opens de-risked (pension tier
   above 0) at the product's margin.
3. **No harm:** on S126 and bridge 4 the fix shows no material harm against the reader without it.
4. **The control:** on S194 (no reader year) the two runs are the same path by path (survival, spend level and tier in
   every year) and the tables the same.

## Falsified if

Item 1: no material gain on share 0.95 (the exact interval's upper end below the 0.5 margin). Item 2: the fix's gap below
the product's margin, 1e-3 (the chooser keeps the plan's tier). Item 3: material harm on S126 or bridge 4. Item 4: anything
differs on S194. INCONCLUSIVE is never a negative: the suspect stays open.

## Fair-test table

Arm A is the reader without the fix (READER), arm B the reader with it (READER+STEP), the same case, solve settings,
margin and paths.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | share 0.95 (the case Q was found on), S126 and bridge 4 (the reader's other core bridge cases, the fix acting there too), S194 (no bridge: the 21:29 row's control): chosen on purpose from 7v's to 7x's records; a diagnosis, nothing generalised | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | share 0.95 and bridge 4 are 7c's variants of S126 (audit-s126.mjs F1_VARIANTS) | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 8,000 paths of seed 7002 (7v's and 7x's) | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 8 | How each year's return is averaged (quadrature points) | 5 (the product's) everywhere | 5, but integrated across the reader's step (12-point Gauss-Legendre each side) in each year whose next is a reader year | TESTED - the thing tested (bridgeStep 'exact'); every other year the same 5 points |
| 13 | The risk tier chosen, consent to change it, risk above | the product's 'auto' rule (no tier above within reach: the joint line's "off: no tier above the plan", required by the gate) | the same | SAME |
| 17 | The grid: points, shares, gain buckets | 30 points (the product's), the default shares and gain buckets | the same | SAME |
| 19 | The switch margin and switching cost | the solved margin 0.001, the switching cost unchanged | the same | SAME |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | 7t's to 7x's 0.0223606797749979, exponent 2 | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the reader on, the final year exact, no block trim | the same, and Q's fix | TESTED with row 8 (the fix is a read of the reader's step): the gate requires the reader on in both arms and the fix on READER+STEP alone |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process a unit, every unit from the same snapshot and stamp (requireFairLogs) | the same | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; the year-0 gap: the smallest margin at which the chooser keeps the plan's tier at runPolicy's opening state (the chooser's reading, item 2) | the same | SAME |
| 30 | The reducer and its version | reduce-7z.mjs: requireFairLogs over the logs' stamps, then its own gate on every unit, solve, ran, gap, joint (with the reader years), run and done line, and every trace's count, seed, arm, stamp and survival (within 0.00005, the run line's four decimals); INCOMPLETE unless all eight units are done; 40 planted checks, 33 planted faults each caught (mutate-reduce-7z.py, results-reduce-7z-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; the regimen's exact rule (reduce-7v.mjs gainFamily and harmFamily), Holm within item 3, the exact 95% interval against the case's margin; the unconditional interval printed beside | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival is simulated; the gap is the chooser's reading, read as that (item 2), never as survival | the same | SAME |
| 33 | For timings: what else the machine was running | the solve and run seconds are printed, not read | the same | N/A - no timing is read: eight processes share four cores, four at a time, beside a light-lane measurement |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **The families** (reduce-7v.mjs gainFamily and harmFamily, single look, level 0.05), as 7v to 7x: a gain leg reads
  **gain** (more saved than lost, the exact one-sided McNemar p under Holm below 0.05), **no material gain** (the exact
  95% interval's upper end below the case's margin), or inconclusive; a harm leg reads **harm**, **no material harm**
  (stats.mjs outcome()) or inconclusive. The margin is marginFor() of the case's READER survival (0.25 at 95% or more,
  else 0.5).
- **Item 1** HELD on gain, FALSIFIED on no material gain, else INCONCLUSIVE. **Item 2** HELD when the fix's gap is at
  least 2e-3 and the pension tier it opens in at 1e-3 is above 0; FALSIFIED when the gap is below 1e-3; else INCONCLUSIVE.
  **Item 3** HELD when both legs read no material harm (Holm over the two), FALSIFIED when either reads harm, else
  INCONCLUSIVE. **Item 4** HELD when S194's two runs are the same path by path (survival, spend level and tier in every
  year) and the table lines equal; FALSIFIED otherwise.
- **NOT SETTLED:** the fair-test gate fails - something besides the fix moved.
- **The registered reading decides; the unconditional one is printed beside it,** marked where they disagree.
- **Declared choices, not derived:** item 2's 2e-3 (below 15 points' own gap, 3.1576e-3; the margin's double).

## Decision fed

- **Items 1, 2 and 3 HELD (4 HELD):** Q's fix works in the chooser: a research option the reader carries, recorded in the
  ledger with its evidence; nothing goes to a default tonight (the 21:22 row's exclusions). It becomes one of the two fixes
  the 21:34 row may combine - only after 7y is read and a deep review on both reads judges it ready; the combination is at
  most registered tonight (the 22:32 row).
- **Item 1 FALSIFIED:** the fix does not carry share 0.95's lost paths at the product's margin: Q is not the whole of the
  reader's share 0.95 error; to the maintainer with the gap and the openings; no combination.
- **Item 3 FALSIFIED (harm on S126 or bridge 4):** the fix is not a candidate; the harm goes in the register with an owner
  and a gate, and the reported legs (years below target, switches) say whether it is the fix's or an error it unmasks
  (RULES.md section 9: not the fix's fault until a decomposition splits the blame).
- **Item 4 FALSIFIED:** an implementation leak; the run is set aside, the fix corrected and its test extended, and 7z
  re-registered.
- **Otherwise (INCONCLUSIVE):** a sized follow-up to the maintainer; nothing else rests on it.

## Provenance

- The fix: solve.js bridgeStep 'exact' (stepExpect, stepAtOf; the backward pass and scoreMoves), with its test
  research/tests/solver-step.test.mjs (10 checks: refusals, the years it acts in, the chooser at the true state against
  4,000 points with a planted miss, the chooser moved, S194 bit-identical, the reference's own integral). Its first attempt
  was parked 27 Sep (PLAN.md O35); the deep review after 7x (22:32 UK) found why its check C read nothing and set this one.
- The mode: audit-s126.mjs diag7z (measureV2 passes bridgeStep and prints it on the ran line only when set). The batch
  batch-7z.sh; the preflight preflight-7z.sh with preflight-parse-7z.mjs (a measurement through the launcher, tiny, no
  figure read). The reducer reduce-7z.mjs, which reuses reduce-7v.mjs's paired cells and families.
- 7w's and 7v's figures: results-7w.txt, results-7v.txt and their traces, each through its own stamp gate in derive-7z.mjs.
  O35's: results-o35-diag.txt.

## Derivation script

- `derive: research/solver/derive-7z.mjs > research/solver/results-derive-7z.txt sha256 a3fae3d1eb01e37d`
  (7w's freed opening against the reader at 0.001 on share 0.95 and S126, scaled to 8,000 paths; each case's margin from
  7v's READER/1e-3; item 1's and item 3's legs drawn as Poisson counts under each story with a background of 0.5 and 5
  paths each way, read by the reducer's families).

## Point and interval

80% intervals, the author's, of 8,000 paths (saved less lost) or as named:
- Item 1: share 0.95, +190 (+60 to +230).
- Item 2: share 0.95's gap with the fix 0.02 (4e-3 to 0.05); opens in pension tier 2 at 1e-3.
- Item 3: S126 +10 (-5 to +45); bridge 4 0 (-15 to +30).
- Item 4: 0 paths differing.

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.80; 2 (HELD), 0.75; 3 (HELD), 0.65; 4 (HELD),
0.90. The cumulative scorecard stands at 0.221 over 63 items against its 0.20 target (results-scorecard.txt), and the
90%-and-over bin held 0.75 of the time, so none is given above 0.90. Scored by scorecard.mjs.

## Power

From results-derive-7z.txt (20,000 draws a story; backgrounds of 0.5 and 5 paths each way):
- **Item 1** at the freed opening's size (192 saved of 8,000) reads HELD 1.000 at both backgrounds; at half and at a
  quarter, 1.000; with no true change, FALSIFIED 1.000 and 0.977 (HELD 0.023 at the larger background: the test's own
  false-gain rate). Item 1 settles either way.
- **Item 3**, both legs level or S126 gaining as the freed opening: HELD 1.000 at both backgrounds; bridge 4 losing 40
  paths (0.5 points): FALSIFIED 1.000 and 0.999; a loss at the margin itself (20 paths, 0.25 points) on either leg reads
  FALSIFIED about 0.53 and otherwise HELD or INCONCLUSIVE - a harm below the margin is not what item 3 can see.
- **Items 2 and 4** are one solve's reading and an identity: no power is drawn.
- **Time:** from 7v's and 7w's records: a 30-point 5-point solve 246 to 323 s (results-7v.txt, results-7w.txt), a traced
  forward run of 8,000 paths 409 to 589 s (results-7v.txt). The fix adds a bisection and 24 reads per move in the years
  before a reader year, in the solve and the forward run; not measured, assumed at most half again. So a unit about 12 to
  20 minutes, eight units four at a time: about 30 to 45 minutes, plus the smoke run and the launcher's re-run of
  derive-7z.mjs (about 2 minutes).

## Budget line

On share 0.95 the reader at the product's margin loses 72 of 7w's 3,000 paths to the freed opening, and 7w showed fifteen
return points recover them through one node. 7z says whether the exact integral at the step recovers them without the
node lottery and without harm where it also acts - the reader's Q fix, tested alone (the 21:29 row).

## Pre-mortem

- **Most likely:** items 1, 2 and 4 HELD; item 3 HELD with S126 gaining a little (the fix frees its opening as it freed
  share 0.95's).
- **Second:** bridge 4 moves (the fix acts at three years there, where no one has measured it) - a gain or a loss; item 3
  then reads it, and the reported years below target and switches say which way the policy moved.
- **Third:** the fix de-risks share 0.95 more than the freed opening did (it sees about 2 points of year-1 value, where
  margin 0 saw a sub-margin gap), with a later cost the forward run shows as lost paths beside the saved ones; item 1 may
  still read gain.
- **Fourth:** the gap line's opening state (one path's, as 7v's to 7w's) is not the state most paths open in; the reported
  openings and item 1 cross-check it.
- **The smoke run:** smoke.sh (locked) does not run diag7z; the preflight through the launcher (all eight units, every line
  through the reducer's parse and gate, every trace's name) covers it.
- **Least likely:** the gate fails; the run is then NOT SETTLED.

## Changes after seeing results

None.
