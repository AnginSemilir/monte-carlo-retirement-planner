# Prediction: diag-foot

- **Run:** `research/solver/batch-foot.sh` - results/diagfoot/case0.txt to case3.txt and their files (audit-foot.mjs: J1F, S366 at 60 wealth points and six shares under `readerRef: 'adaptive', readerSplit: 'rs'` with the fix `adaptiveLattice: { foot: true }`; J1D, S366 at 60 points under `readerRef: 'adaptive'` with the default split; K1, S362 at 30 points under the adaptive reference with the RS split; K1F, K1 with the fix; the candidate's own unit), read by reduce-foot.mjs into results-foot.txt against AX-HO's saved J1 and J2 on S366 (results/diagaxho)
- **Kind:** test
- **Written:** 18 Oct, before the run (its time is its registering commit's, git log); the deep review after AX-HO (deep-review-log.md 18 Oct 01:41 UK) and its adoption (PLAN.md's 18 Oct 01:41 row; the plan-auditor's PASS of 18 Oct 02:01 UK)
- **Seeds:** 7004, the second seed (replication; RULES.md section 8 item 9): its first 4,000 paths a world for every job's ledger and runs and every paired comparison (engine.mjs pathsForSeed), the paths AX-HO's saved J1 and J2 ran on, so J1F and J1D pair with them path by path
- **Unmasking:** J1F removes O177's known error, the adaptive reference's p 0 at no accessible money in a year whose inflow pays its bill (S366's year 4), which drives the over-read of S366's world-0 year 4 (2.1823 points, AX-HO's J1; results-derive-foot.txt section 1) where the unsupported top share node copies c and keeps R; removing it may unmask another error at the same corners (the copy rule's own amplification, O177-COPYAMP) or move J1F's moves at the inflow year. The arm pair that splits a harm under J1F: J1F against AX-HO's J1 on S366 (the fix alone, the same reference, split, code path and paths; reported path by path: the year-4 residual, the GB, the moves and paths differing, the runs), and on S362 K1F against K1 (the fix alone, reported); J1D against J1 splits the split's part (item 3). A harm of J1F against J2 (item 4) is NOT SETTLED as the fix's until J1F against J1 reads it (RULES.md section 9), and the decision table sends the deep review, never a next fix.
- **Mechanism:** src/solver/adaptive.js:86 "return footRead(k, t, A, b, gf)" (with the fix, readV reads the A = 0 node at no accessible money and below the lattice's floor, in place of p 0); src/solver/adaptive.js:172 "function footRead(k, t, A, b, gf)" (the node at A = 0, else the interpolation in A between it and the lattice's first point); src/solver/adaptive.js:159 "V0[k][t][jb * NG + ig] =" (the A = 0 node valued by the same backward step through the flow as the lattice's); src/solver/adaptive.js:78 "hi0 = Math.log(3 * rem + (foot ? Math.max(d0, 0) : d0))" (with the fix the lattice's top in a year whose bill is negative moves too, active in S366's year 4, so J1F against J1 carries the top's move beside the A = 0 node); src/solver/solve.js:1984 "...(opts.adaptiveLattice || {})" (the option reaches the reference); the derive line prints the records it rests on (results-derive-foot.txt section 1)
- **Plan section:** PLAN.md "AREF" (FOOT-S366, items/FOOT-S366.md), O177, O178; the deep review after AX-HO (deep-review-log.md 18 Oct 01:41 UK)

## Question

Does the fix of the adaptive reference's floor at no accessible money remove S366's world-0 year-4 over-read (O177), so that the reference reads S366 at its runs, with the split no part of the over-read and no material harm to the policy's runs against the order reference on the same paths?

## Derivation

- **What the records say:** AX-HO's J1 on S366 read world 0's year-4 residual at 2.1823 points (per-path sd 2.3148), its own opening alive on 97.7750, 99.9250 and 100.0000 of 4,000 by world against J2's 97.8500, 99.9250 and 100.0000, and J1 against J2 moved 5 and 0 paths in worlds 0 and 1 (results-derive-foot.txt section 1, AX-HO's files behind AX-HO's gate). The deep review (deep-review-log.md 18 Oct 01:41 UK) rooted the over-read in readV's p 0 at A <= 0 and below the floor (adaptive.js:86 and :88 before the fix) in the inflow year, amplified by the copy rule at the unsupported top share node, the split and the tier layers no part (its credences: O177-FOOT 0.82, COPYAMP 0.08, SPLIT 0.02, LAYER 0.01, OTHER 0.07).
- **What FOOT-S366 changes, and nothing else:** J1F is AX-HO's J1 with `adaptiveLattice: { foot: true }` on the same paths, settings and household; with the fix off this code reproduces AX-HO's S366 step's J1 and J2 at 30 points to the bit (the preflight, step C), so AX-HO's saved J1 and J2 pair with J1F and J1D as if run on this code. J1D is J1 under the default split. K1 and K1F are the same pair on S362, a held-out deposit household (its year 4 also an inflow year, items/FOOT-S366.md), at 30 points on the spare cores, reported.
- **Departures from the receipt, declared:** J1D runs beside the fix (the receipt named R3's decomposition run alone in its STOP list; here it is item 3, on the same paths, not alone); S362 at 30 points, not 60 (its jobs reported, not items, on the spare cores); item 2 on the receipt's 4,000 paths a world (section 2: a gap of 1.2 points reads HELD 0.05 there).
- **The stories:** derive-foot.mjs's JUDGED block (committed in 8b65d13 before its output and before any preflight output): per O177 cause, J1F's world-0 year-4 residual (FOOT near 0; COPYAMP 0.6 to 1.5; SPLIT and LAYER at J1's), J1F's table against its runs, J1D less J1 (SPLIT -2.0 to -1.4, else near 0), J1F's runs against J2's moved as multiples of J1's record churn.
- **Power:** through reduce-foot.mjs's own items() on synthetic reads drawn at each story's values with J1's per-path spread (section 2).
- **Preflight:** it prints each job's tables against its runs and the fix's live nodes on S366 and S362 beside the job without the fix, and J1F at 30 points beside AX-HO's S366 step (the Provenance below).

## Prediction

Item 1 HELD (0.45: the fix brings J1F's world-0 year-4 residual inside half a point); item 2 HELD (0.63); item 3 HELD (0.79: J1D reads J1's residual); item 4 HELD (0.89: no material harm). The decision table's likeliest row is 'else' (0.39), R1 next (0.35). The figures are the derivation's with the review's leading cause at the record's rate (results-derive-foot.txt section 3b; at the receipt's own credences, section 3: items HELD 0.83, 0.87, 0.96 and 0.88, R1 0.70).

## Falsified if

Item 1 FALSIFIED: J1F's world-0 year-4 residual wholly a point or more from zero (its 95% interval), the side named. Item 2 FALSIFIED: J1F's table at its own opening wholly 3 points or more over or under its runs in any world. Item 3 FALSIFIED: J1D less J1 in world 0's year-4 residual wholly a point or more from zero. Item 4 FALSIFIED: J1F's runs worse than J2's on S366 by the relative margin in world 0 or 1 (harm, Holm-adjusted).

## Fair-test table

J1F against AX-HO's J2 (item 4) and J1D against AX-HO's J1 (item 3) on S366, each pair on the same paths (seed 7004's first 4,000 a world) and settings; J1F and J1D on this code, J1 and J2 saved by AX-HO on its code, which this code with the fix off reproduces to the bit.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | J1F: readerRef 'adaptive', readerSplit 'rs', the fix (item 4); J1D: readerRef 'adaptive', the default split (item 3) | J2: readerRef 'order' (item 4); J1: readerRef 'adaptive', readerSplit 'rs' (item 3) | TESTED - item 4 the adaptive reference with the RS split and the fix as one candidate against the order reference (a harm split by J1F against J1, the Unmasking field); item 3 the split alone; items 1 and 2 read J1F alone |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code (01abacb478e9, the fifth preflight's and the batch's; the fix an option, off by default) | AX-HO's J1 and J2 (code d2a982e80436, results/diagaxho, sha 6d3833268f934865 and 6fd322058ca882af) | ACCEPTED - this code with the fix off reproduces AX-HO's S366 step's J1 and J2 at 30 points to the bit (the preflight, step C), and the fix is inert to the bit where no inflow pays its year (step B, S360 and S364); the reducer reads AX-HO's files only behind AX-HO's gate and at the recorded sha (reusing them is fair-tested so) |
| 31 | Paired or not, and the standard error used | per path, J1F's year-4 residual (item 1) and J1F's table against its runs (item 2) | paired by path (items 3, 4) | ACCEPTED - item 1 the mean of J1F's per-path Y4 with its own sd; item 2 the exact (Clopper-Pearson) interval on J1F's run count; item 3 J1D less J1 path by path; item 4 the exact conditional McNemar on the same paths |
| 33 | For timings: what else the machine was running | the batch's other jobs, four cores | AX-HO's batch, five jobs on four cores | ACCEPTED - the reference's build and the solves' seconds are reported against gate 5, not read by an item |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** items 1 and 3, the per-path mean with z 1.96 (one world, two sides); item 2, per world, J1F's table less its runs in points with the exact (Clopper-Pearson) interval on the count at 1 - 0.05 / 3 (three worlds); item 4, stats.mjs's exact conditional McNemar interval and outcome at the relative margin marginRel(J2's survival in that world: min(marginFor, a tenth of it)) with Holm across worlds 0 and 1.
- **Item 1 (primary; single look):** J1F's world-0 year-4 grid residual: HELD inside [-0.5, +0.5]; FALSIFIED wholly at or beyond one point either way, the side named; INCONCLUSIVE otherwise.
- **Item 2 (single look):** J1F's table at its own opening against its runs on 4,000 paths a world: HELD when every world's interval sits inside [-1.5, +1.5]; FALSIFIED when any lies wholly at or beyond 3 points either way, the side named; INCONCLUSIVE otherwise.
- **Item 3 (single look):** J1D less AX-HO's J1 in world 0's year-4 residual, path by path: HELD inside [-0.5, +0.5]; FALSIFIED wholly at or beyond one point either way; INCONCLUSIVE otherwise.
- **Item 4 (single look):** no material harm to J1F's runs against AX-HO's J2 on S366, worlds 0 and 1: HELD when both read no material harm, FALSIFIED when either reads harm, INCONCLUSIVE otherwise; the moves and paths differing printed beside, per world.
- **A cause is read only as the items bear on it:** item 1 HELD credits O177-FOOT, the fix as a whole (the A = 0 node and the top's move in the inflow year, adaptive.js:78; the top's part NOT CHECKED by a run), over COPYAMP, SPLIT and LAYER, each of which predicts a residual left; item 3 HELD reads the split no part (SPLIT's outcome is a FALSIFIED item 3); OTHER is never credited by these items. The reader probe and S362's lines are reported, grade C.
- **Reported, not items:** every job's tables against its runs by world; J1F against AX-HO's J1 (the year-4 residual, the GB, the moves and paths differing, the runs); J1D's ledger beside J1's; K1's and K1F's tables against their runs, their year-4 residual and GB, K1F against K1 path by path; the fix's live nodes per job; the reference's build and solves (gate 5).
- **Declared choices, not derived:** the deep review's lines for items 1 to 4 (half a point and one point; 1.5 and 3 points; half a point and one point; the relative margin); item 2 on the receipt's 4,000 paths a world; worlds 0 and 1 for item 4.

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 4 FALSIFIED (R2) | harm under the fixed reference: not the fix's until J1F against J1 splits it (reported path by path); the deep review reads it, never a next fix; the fix stays an option, off; no default | 0.01 |
| items 1 to 4 HELD (R1) | O177's over-read removed by the fix (grade B, one household, one seed), the split no part, no material harm: every later adaptive-reference test runs with the fix; the steps before a default go ahead (a held-out deposit household outside the fix, another of the 14 not S362; gate 5; a design-reviewed test file with A = 0 in an inflow year and the NaN top planted; the 7u-F panel, the maintainer's); no default chosen here | 0.35 |
| item 1 FALSIFIED over, item 4 not FALSIFIED (R3) | the fix leaves an over-read of a point or more at year 4: the floor is not the whole cause (COPYAMP, SPLIT, LAYER or OTHER; item 3 FALSIFIED beside names SPLIT): the deep review roots the rest before any further fix; the adaptive reference not put forward | 0.25 |
| item 3 FALSIFIED, items 1 and 4 not (R4) | the split is a part of O177: the decomposition (the fix under the default split) before any default | 0.00 |
| else | nothing falsified that a row above names and not all four HELD: the deep review reads the unsettled items with the reported lines (J1F against J1, the probe, S362) before the next step; nothing built; no default | 0.39 |

- **Waiver:** none needed: the chance the action changes is 0.61 (one less 0.39, the likeliest row), above a quarter
- **The rows' credences are the JUDGED stories' with the review's leading cause at the record's rate (results-derive-foot.txt section 3b; at the receipt's own credences, section 3: R1 0.70, R2 0.01, R3 0.07, R4 0.00, else 0.22).**
- **The escalation rule (escalation.md, trigger 3):** the run is under 2 hours' wall (about 1.18 h, results-derive-foot.txt section 4), so trigger 3 does not apply; trigger 1 is not met (AX-HO's items read without a failed deep-review test)

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1:** HELD says the fix removes S366's world-0 year-4 over-read (O177-FOOT credited over COPYAMP, SPLIT and LAYER); FALSIFIED names the side (over: a residual the floor does not carry; under: the fix over-corrects, its own row in the deep review); inconclusive names the interval.
- **Item 2:** HELD says the fixed reference reads S366 within 1.5 points of its runs in every world; FALSIFIED names the side; inconclusive names the world.
- **Item 3:** HELD says the split is no part of O177's over-read (J1D reads J1's residual); FALSIFIED gives the split a part.
- **Item 4:** HELD says the fixed reference with the RS split loses no material survival against the order reference on S366, with the moves it changes beside; FALSIFIED (harm) is split by J1F against J1 before it is the fix's.
- **In every branch:** no product change; the candidate's settings unchanged; the fix stays an option of the research reference, off by default (no reference or split default chosen here: a default is the maintainer's decision); 7u-F held.

## Provenance

- **The design:** the deep review after AX-HO (deep-review-log.md 18 Oct 01:41 UK) proposed FOOT-S366's fix, jobs and items; its adoption (PLAN.md's 18 Oct 01:41 row, the plan-auditor's PASS of 18 Oct 02:01 UK; items/FOOT-S366.md), under the maintainer's standing go-ahead (4 Oct) and hand-over (17 Oct).
- **The build:** the fix in src/solver/adaptive.js (an option, off by default, no line the registered predictions anchor moved); audit-foot.mjs (AN's ledger copied from audit-axho.mjs with every year's move saved; armTook, adaptTook, footTook; plants arm, split, foot, own, layer, quad and held; FOOT_INERT's jobs); reduce-foot.mjs (52 planted checks, each item to all three outcomes, five EDGES; `--same`); mutate-reduce-foot.py (35 of 35 caught on the reducer's blob as launched, results-reduce-foot-mutations.txt); derive-foot.mjs; preflight-foot.sh and batch-foot.sh (commit 8b65d13); the e3pcls pin re-taken on the fix's code (27 passed, 395dcca); S362's floor in the audit and the reducer fixed to 35,000, its plan's own floor (a0109ff).
- **Seen before registration (declared):** the records named in the Derivation (AX-HO's saved J1 and J2 and their results, grade C reads of them for the stories); the deep review's receipt; every preflight line below, including J1F at 30 points, seen after the JUDGED block was committed and the derivation run. Its bearing (the plan-auditor's MINOR 1 of this registration): world 0's table at 96.145898 sits 3.70 points under AX-HO's 30-point J1 and within 2e-5 of J2, and its year-4 residual -0.246708 on 40 paths lies inside item 1's HELD band, pointing to items 1 and 2 HELD and to R1; the credences, derived before it, are left as derived.
- **The preflight** (through the launcher, seed 7004, 40 paths a world; results-foot-preflight.txt): the fifth launch (runs.log 18 Oct 06:11 UK): SMOKE PASSED; the twelve jobs exit 0; (A) the gate passed at a fifteenth of the points (reduce-foot.mjs --preflight), the fix on J1F and K1F with 369 A = 0 nodes alive and off on J1D and K1, every self-check in full; its reported cell, world 0's year-4 residual at 4 points, J1F 4.9965 and K1F 1.6252 against J1D 42.8989 and K1 16.6996 (O177's over-read at a fifteenth of the points, on S362 too; in the register under O177 before registration); (B) I0 against I1 (S360) and I2 against I3 (S364) identical to the bit (132 arrays each), the fix on with 0 nodes alive, and I1 with the plant 'foot' (2,583 nodes) differing from I0 in 102 of 132 arrays; (C) this code with the fix off reproduces AX-HO's S366 step's J1 and J2 at 30 points to the bit (138 and 132 arrays); (D) the six plants refused, each on its own check (arm: footTook; split: armTook; own: ownTook 0/120; layer: identity 50/120; quad: qfTook 428/640; held: layerTook 462/640); (E) J1F at 30 points, 40 paths a world: world 0's table at its opening 96.145898 (AX-HO's S366 step: J1 99.846164, J2 96.145882), its year-4 residual -0.246708 over the 40 paths, every run alive in every world. The earlier launches, declared: the first stopped by a container restart in its smoke run; the second (02:52 UK) refused at every solve, the e3pcls pin stale after the fix's edit (re-taken, 395dcca); the third (03:30 UK) refused K1 and K1F on S362's floor typed as 9,000 (fixed to 35,000, a0109ff; the launch stopped); the fourth (04:24 UK) passed all but the plant 'foot', inert by construction where no inflow pays its year (changed to value a node of 0 as sure to pay, b795f03; the pin re-taken, f71525c).

## Derivation script

- `derive: research/solver/derive-foot.mjs > research/solver/results-derive-foot.txt sha256 60c970074fda0ac3`
  (AX-HO's saved S366 jobs behind AX-HO's gate; the power of items 1 to 4 through reduce-foot.mjs's own items(); the credences from the receipt's CAUSE CREDENCES for O177, read from the log, through the JUDGED stories committed before the output, as stated (section 3) and with the leading cause at the record's rate read from results-scorecard.txt (section 3b, the registered ones); the decision rows; the points and 80% intervals; the budget)

## Point and interval

- **Item 1:** 0.4140, J1F's world-0 year-4 residual, points (results-derive-foot.txt section 3b); 80% interval -0.2015 to 1.9965
- **Item 2:** 0.5250, J1F's table less its runs in world 0, points (results-derive-foot.txt section 3b); 80% interval -0.3500 to 1.8500
- **Item 3:** -0.0002, J1D less J1 in world 0's year-4 residual, points (results-derive-foot.txt section 3b); 80% interval -1.0000 to 0.1009
- **Item 4:** 0.0000, J1F's runs less J2's in world 0, points (results-derive-foot.txt section 3b); 80% interval -0.1250 to 0.1250

## Power

From results-derive-foot.txt section 2 (40 draws a cell through reduce-foot.mjs's own items(); J1F's runs at J2's survival, 4,000 paths a world; J1's per-path spread):

```
  spread x1 item 1, J1F's year-4 residual -0.5: HELD 0.05 INCONCLUSIVE 0.95 FALSIFIED 0.00
  spread x1 item 1, J1F's year-4 residual 0.3: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  spread x1 item 1, J1F's year-4 residual 0.45: HELD 0.07 INCONCLUSIVE 0.93 FALSIFIED 0.00
  spread x1 item 1, J1F's year-4 residual 1.2: HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  item 2, world 0's table less runs 0: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 2, world 0's table less runs 1.2: HELD 0.05 INCONCLUSIVE 0.95 FALSIFIED 0.00
  item 2, world 0's table less runs -3.5: HELD 0.00 INCONCLUSIVE 0.68 FALSIFIED 0.33
  item 3, J1D less J1 -0.45: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  item 3, J1D less J1 -1: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  item 3, J1D less J1 -2: HELD 0.00 INCONCLUSIVE 0.00 FALSIFIED 1.00
  churn x1 item 4, J1F's runs -0.3 points in worlds 0 and 1: HELD 0.63 INCONCLUSIVE 0.00 FALSIFIED 0.38
  churn x3 item 4, J1F's runs 0 points in worlds 0 and 1: HELD 0.80 INCONCLUSIVE 0.20 FALSIFIED 0.00
  churn x8 item 4, J1F's runs 0 points in worlds 0 and 1: HELD 0.45 INCONCLUSIVE 0.55 FALSIFIED 0.00
```

Item 1 holds a residual within about 0.3 points at J1's spread and falsifies at 1.2 (the receipt's lines); item 2 holds a gap near zero only (1.2 points reads HELD 0.05 on 4,000 paths); item 3 holds J1D within about 0.45 of J1 and falsifies at SPLIT's story; item 4 reads no material harm at J1's record churn unless J1F loses a third of a point, weaker as the paths moved grow.

## Budget line

From results-derive-foot.txt section 4 (grade C: AX-HO's J1 log, solve 2701 s and ledger 1550 s on S366 at 60 points; its S366 step's 30-point solve 1446 s): J1F and J1D about 1.18 h each, K1 and K1F about 0.83 h each; four jobs on four cores, the wall about 1.18 h; the batch's timeout is 10 hours a job.

## Pre-mortem

- **First: the interpolation below the floor.** The fix reads p linearly in A between the A = 0 node and the lattice's first point (100 when the bill is negative); if p bends there, a residual is left at small A that reads as COPYAMP (item 1 over, R3) though the floor is the cause.
- **Second: the moves at the inflow year.** The fixed read may move J1F's choices at year 4 against J1's; with 5 paths moved in world 0 against J2, item 4 has few discordant paths and a HELD there is weak (the moves differing printed beside).
- **Third: the stories after the records.** The JUDGED block was written after AX-HO's J1 and J2 and the deep review were read; its causes' outcomes lean on the review's map (grade D).
- **Fourth: one household for the items.** S366 is the only household read by an item; S362 is reported at 30 points, and its year-4 inflow may differ in size.
- **Fifth: one seed (7004).**
- **Sixth: the preview.** The 30-point J1F preview points to items 1 and 2 HELD and to R1 over 'else' (Provenance); unless the 60-point tables differ from the 30-point ones, the registered credences (item 1 HELD 0.45, 'else' 0.39) are expected to miss toward HELD, as AX-HO's did (its calibration lesson, lessons.md).

## Credence

Write the judged lines first and commit them, then run the derivation script, whose section computes each outcome's probability from stated priors over the Power section's stories through the decision bands (check-prediction.mjs refuses judged lines committed with or after its output). Each item starts from its kind's base rate (results-scorecard.txt, KIND BASE RATES, as of this file's writing: NOHARM 0.78 (45 of 57), EFFECT 0.71 (19 of 26), ATTRIB 0.45 (36 of 80), SIZE 0.53 (24 of 45), CTRL 0.79 (18 of 22), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.40 (13 of 33)).

Items 1 and 2 rest on the deep review's leading cause (the floor), so each starts from a deep review's cause rate, 0.40, and the derivation takes O177-FOOT at that rate (section 3b; section 3 at the receipt's own credence beside); item 3 rests on the deep review's story that the split has no part, so it starts from a deep review's story rate, 0.40 (the code's own reading leans it higher, derived 0.79); item 4 is a no-harm item (NOHARM, 0.78), derived at 0.89.

- **Base rate, item 1:** 0.40 (a deep review's cause: the floor carries the over-read)
- **Base rate, item 2:** 0.40 (a deep review's cause: the fixed reference reads S366 at its runs)
- **Base rate, item 3:** 0.40 (a deep review's story: the split no part of the over-read)
- **Base rate, item 4:** 0.78 (NOHARM)
- **Item 1:** HELD 0.45, INCONCLUSIVE 0.30, FALSIFIED 0.25 (derived, results-derive-foot.txt section 3b)
- **Item 2:** HELD 0.63, INCONCLUSIVE 0.37, FALSIFIED 0.00 (derived)
- **Item 3:** HELD 0.79, INCONCLUSIVE 0.14, FALSIFIED 0.07 (derived)
- **Item 4:** HELD 0.89, INCONCLUSIVE 0.11, FALSIFIED 0.01 (derived)
- **Judged:** none (the judged inputs are derive-foot.mjs's JUDGED block, committed before its output)
- **Kinds:** 1 ATTRIB, 2 ATTRIB, 3 ATTRIB, 4 NOHARM

## Changes after seeing results

None.
