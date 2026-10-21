# Prediction: diag-an

- **Run:** `research/solver/batch-an.sh` - results/diagan/case0.txt and its file (audit-an.mjs: AN, S360 at 60 wealth points with NODE-AX's fifteen pension-share nodes under `readerRef: 'adaptive'`, the candidate's own unit, 4,000 paths a world, seed 7002), read by `reduce-an.mjs` in the real tree into results-an.txt against NODE-AX's BN behind NODE-AX's gate
- **Kind:** test
- **Written:** 15 Oct, before the run (its time is its registering commit's, git log); the deep review after AREF Step 0 (deep-review-log.md 15 Oct 10:13 UK) and its adoption (PLAN.md's 15 Oct 10:13 row; the plan-auditor's PASS of 15 Oct 10:44 UK)
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths a world, NODE-AX's BN's, so AN's runs pair with BN's path by path; refTook's own simulations draw from the tuning seed scaled by a thousand, plus the world, so no registry seed is used as a state
- **Unmasking:** AN removes a known error, the order-drawn reference's shape at the cliff (N2-REF: BN's tables under-read S360's bridge by a grid residual GB of -1.7654 and -2.0679 points, results-nodeax.txt); that error drives BN's tables to price the bridge years too pessimistically, which may hold its openings lower than the policy needs. If AN's runs lose against BN's (item 2 not HELD) with item 1 HELD, the harm is not the reference's until a decomposition splits it (RULES.md section 9 rule 1): the decision table's R2 sends it to the deep review before anything is carried, and item 3 (world 2's year-1 term) reads whether the removal reaches the world the review did not rank
- **Mechanism:** src/solver/adaptive.js:83 "if (t === TL && plant !== 'step') return A >= astar(b, gf) ? 1 : 0;" (the last bridge year exact); src/solver/adaptive.js:119 "if (next === TL && plant !== 'step') { Q[mi][k] = clearStep(k, ai, t); continue; }" (the year before it integrated by the shock that clears it); src/solver/adaptive.js:127 "for (let mi = 0; mi < NM; mi++) { let v = 0; for (let k = 0; k < K; k++) v += weights[k] * Q[mi][k];" (one move for every world); src/solver/solve.js:671 "if (adaptiveRef) return adaptiveRef.chance(k, t, bills, ai0);" (the reader's reference swapped); src/solver/grid.js:412 "if (RD.chance.at) RD.chance.at(s);" (read at the position); the derive line prints how often it applies: the reference read at every bridge path-year a path visits
- **Plan section:** PLAN.md "AREF" (AN alone), O152, O156, O157, O158; the deep review after AREF Step 0 (deep-review-log.md 15 Oct 10:13 UK)

## Question

Does the adaptive reference - the chance that the policy's own floor moves pay every bridge bill, by backward induction over the accessible money, its ISA share and gain fraction, one move for every world, the last bridge year exact - remove S360's bridge-years grid residual (BN's GB -1.7654 and -2.0679 points in worlds 0 and 1) without harming its runs, and does it reach world 2's year-1 term (O156, -0.7929)?

## Derivation

- **What the records say:** NODE-AX read BN's remaining under-read in the bridge years' grid (item 1 HELD, results-nodeax.txt, grade B); the deep review after AREF Step 0 (deep-review-log.md 15 Oct 10:13 UK) read Step 0's saved S and p at the corners the in-band records weigh and found c = S / p near 1 there, every in-band move at the floor level, and the static substitution of the adaptive chance into BN's split removing the bridge grid's under-read and overshooting it (its reads grade C, post hoc, no solver run; the overshoot carried Step 0's smeared last year, O157).
- **What AN changes, and nothing else:** the reader's reference alone (readerRef 'order' to 'adaptive'); the solver's code otherwise leaves BN bit for bit at the preflight scale (compare-preflight.mjs over NODE-AX's saved BN preflight; every preflight from the first, runs.log 15 Oct 12:17 UK; the build check of 11:30 UK stopped on the stale e3pcls pin before any comparison). The re-solve with the new reference changes the tables, so the policy and the runs may move: item 2 reads the runs against BN's on the same paths.
- **The reference's correctness is checked in the run:** refTook (audit-an.mjs) compares p with its own rule run forward from sampled in-band bridge records, by world and p-bin (300 states a world) and by world and bridge year (100 a world-year: O157's gate), 1,000 runs a state at every scale, each cell within 0.01 plus three standard errors; the plants drift, choice and step each make it refuse (the fifth preflight). Its floor was set on those plants: at Step 0's 0.02 the choice and step plants' gaps (+0.020 to +0.028) passed, and at 0.01 each fails one cell, so refTook sees a bias in p of about 0.02 and not much under it: a bias under about 0.01 plus three standard errors (about 0.015 at the run's sample) is not excluded, and item 1's cause readings carry that (the plan-auditor's FAIL of 15 Oct 15:37 UK, BLOCKING 1 and 2).
- **The causes' predictions, by the 10:13 receipt's map:** N2-REF, GB inside [-0.5, +1.0] (an overshoot possible); N2-SHARE, B, W, QUAD, GB still near BN's (at -1.0 or below); N2-MODEL and N2-CPART, a partial lift; N2-OTHER anywhere. The judged stories (derive-an.mjs's JUDGED block, committed before its output in 6f6a9a7 and edb5bf5) carry these into the credences through the reducer's own items().

## Prediction

Item 1 most likely INCONCLUSIVE (0.52: GB lifted toward zero in both worlds, its interval not inside half a point, or an overshoot under one point), FALSIFIED under next (0.25), HELD 0.23; item 2 HELD (0.82: no material harm to the runs); item 3 INCONCLUSIVE (0.40: world 2's year-1 term lifted part of the way), HELD next (0.37). The figures are the derivation's (results-derive-an.txt section 3).

## Falsified if

Item 1 FALSIFIED: AN's GB wholly at or below -1.0 in world 0 or 1 (the matched reference leaves the under-read: N2-REF not the cause there), or wholly at or above +1.0 (the matched reference over-reads: an over-correction, read for the cause, RULES.md section 9). Item 2 FALSIFIED: AN's runs worse than BN's by the margin in world 0 or 1 (harm, Holm-adjusted). Item 3 FALSIFIED: world 2's year-1 term wholly beyond 0.6 points either way.

## Fair-test table

AN against BN (NODE-AX's saved job, behind NODE-AX's gate). The only thing tested is the bridge reader's reference.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | readerRef 'adaptive' | readerRef 'order' | TESTED - the thing this test is about |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code (the adaptive reference added) | code d297b820d217 (NODE-AX's) | ACCEPTED - the change is the adaptive reference, research only and inert off: BN's preflight job reruns on this code bit for bit, file and log (compare-preflight.mjs, in every preflight), so BN on this code is NODE-AX's BN at the preflight scale |
| 30 | The reducer and its version | reduce-an.mjs | reduce-nodeax.mjs (its gate, over NODE-AX's files) | ACCEPTED - each arm's files pass their own gate; AN's ledger is NODE-AX's code copied (audit-an.mjs), and the items read per-path arrays saved the same way |
| 31 | Paired or not, and the standard error used | paired by path (item 2); per arm (items 1, 3) | paired by path (item 2) | ACCEPTED - item 2 is the exact conditional McNemar on the same paths; items 1 and 3 read AN's own per-path means with their normal intervals; BN's figures are reported beside them |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** per world, a mean over the 4,000 paths with its interval normal at z = 2.2414 (the 1 - 0.05 / 4 quantile: two worlds, two sides) for item 1 and z = 1.96 for item 3 (one world); item 2 by stats.mjs's exact conditional McNemar interval and outcome at the margin marginFor(BN's survival) with Holm across worlds 0 and 1; every threshold read on the figure rounded to 1e-9.
- **Item 1 (primary; single look):** AN's GB (the grid term summed over the bridge years, per path, points) in worlds 0 and 1. HELD when both intervals sit inside [-0.5, +0.5]; FALSIFIED when either world's interval lies wholly at or below -1.0 (under) or wholly at or above +1.0 (over), the side printed; INCONCLUSIVE otherwise.
- **Item 2 (single look):** no material harm to the runs, worlds 0 and 1: HELD when both read no material harm, FALSIFIED when either reads harm, INCONCLUSIVE otherwise.
- **Item 3 (single look):** world 2's year-1 term under AN (O156). HELD inside [-0.4, +0.4]; FALSIFIED wholly beyond 0.6 points either way; INCONCLUSIVE otherwise.
- **The causes, by the registered map** (each with refTook's limit: a bias in p under about 0.015 not excluded): N2-REF held on item 1 HELD; not held on item 1 FALSIFIED under; item 1 FALSIFIED over reads an over-correction, held for the cause (the reference reaches the mechanism) with its own row, not against it; open otherwise. The arm reaches the mechanism: refTook passes and AN's GB is printed beside BN's in every world (an arm equal to its control everywhere is a design fault, the reducer's REPORTED lines show it).
- **Reported, not items:** per world, AN's OWN less runs = T + GB + GA, its GB beside BN's and their paired difference, each bridge year's G for both, survival; the reference's build line and refTook's cells (by p-bin and by year) with the count of cells where p sits above its simulation (O157).
- **Declared choices, not derived:** the deep review's lines for item 1 (half a point and one point); item 2's margin, the regimen's; item 3's (0.4 and 0.6, this prediction's: about half of BN's term, and three quarters of it); worlds 0 and 1 deciding (S360's near-edge worlds, NODE-AX's).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD and item 2 HELD (R1) | the matched reference removes S360's bridge residual without harm to its runs (N2-REF held, grade B, one household, one seed): AO next, S364 out of sample under the same reference, before any reference default is considered; no default | 0.19 |
| item 1 HELD, item 2 not HELD (R2) | the residual removed with the runs not shown unharmed: the deep review reads the runs' change by decomposition before anything is carried (RULES.md section 9 rule 1); nothing carried | 0.04 |
| item 1 FALSIFIED under (R3) | the matched reference leaves the under-read: N2-REF not the cause on S360; the deep review re-ranks (N2-OTHER and N2-MODEL next); the adaptive reference stays a research option | 0.25 |
| item 1 FALSIFIED over (R4) | the matched reference over-reads: an over-correction, read for the cause, its own row; the deep review reads the overshoot (the last bridge years' step, the support line) before any further reference work | 0.00 |
| else (item 1 INCONCLUSIVE) | a partial removal or an overshoot under a point: the deep review reads the year profile and the side; nothing built | 0.52 |

- **Waiver:** none needed: the chance the action changes is 0.48 (one less 0.52, the likeliest row), above a quarter
- **R4's 0.00 is the JUDGED stories' range, not evidence:** no story reaches +1.0 (REF's tops at +0.8 with a jitter of 0.15), while the review's static read (+0.88 to +0.99 in points, grade C) sits near the line and the ground for trimming it (O157's bias) is NOT CHECKED (the plan-auditor's MINOR 4).
- **The escalation rule (escalation.md, trigger 3):** the run is over 2 hours' wall (about 2.75 h, results-derive-an.txt section 4) and its 'else' row is 0.52, under the 0.6 bar; trigger 1 is not met (triggers.mjs --due: NODE-1 INCONCLUSIVE, NODE-AX HELD)

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1:** HELD settles N2-REF as held on S360 (grade B, one household, one seed); FALSIFIED under settles it as not; FALSIFIED over records an over-correction for the cause; inconclusive leaves it open and names the world and side.
- **Item 2:** HELD says AN's runs lose no material survival against BN's in worlds 0 and 1; FALSIFIED (harm) sends R2's decomposition; inconclusive names the world.
- **Item 3:** HELD answers O156's world-2 half (the matched reference reaches world 2's year-1 term); FALSIFIED leaves it to the next deep review; inconclusive records the part removed.
- **In every branch:** no product change; the candidate's settings unchanged; no reference default; 7u-F held.

## Provenance

- **The design:** the deep review after AREF Step 0 (deep-review-log.md 15 Oct 10:13 UK) proposed AN alone with NODE-AX's BN as its control; its adoption (PLAN.md's 15 Oct 10:13 row, the plan-auditor's PASS of 15 Oct 10:44 UK) and the maintainer's 'Yes' to building AN.
- **The build:** src/solver/adaptive.js (the reference; `simulate` and its audit-only plants), its hook in solve.js and the position's hand-over in grid.js and reader.js, wired without moving any line a registered anchor cites (dbd48bd); audit-an.mjs (NODE-AX's ledger copied, adaptTook, refTook, the plants; choice and step printed); reduce-an.mjs (47 planted checks, each item to all three outcomes, three EDGES; NODE-AX's BN behind NODE-AX's gate); mutate-reduce-an.py (32 of 32 caught, results-reduce-an-mutations.txt and results-mutation-history.txt); compare-preflight.mjs (planted: a changed file field and a changed log figure each caught); derive-an.mjs; buildcheck-an.sh, preflight-an.sh, batch-an.sh.
- **Seen before registration (declared):** NODE-AX's results and files; Step 0's results and files and the deep review's reads of them (grade C, its scratch scripts); the preflights' lines below. No figure of AN at 60 points.
- **Seen before registration, the preflights (declared):** the first (runs.log 12:17 UK) stopped at armTook (the meta did not name the reference) and printed AN's own-opening table at 4 points (49.1363, the solve line; BN's preflight read 42.7747); the second to fifth (13:36, 14:31, 16:05 and 16:58 UK) printed AN's 4-point, 40-path ledger lines and refTook's cells, and the plants' cells beside the clean run's (read to set refTook's floor). None is a 60-point figure.
- **The preflight** (through the launcher, runs.log 15 Oct 16:58 UK, on 910e95b; a fifteenth of the points, 40 paths a world, seed 7002): SMOKE PASSED. "A. bn-off: file identical (1340067 bytes of JSON), log identical (191 lines)". AN: armTook 1/1, adaptTook 1/1 (24 floor moves, nonMono 0, lattice 160x41x3, 128 draws, last year 7, 267.2 s), refTook 33/33 (p above its simulation in 18 of 33 cells), ownTook and identity 120/120, qfTook and layerTook 796/796. "B. GATE: passed" (reduce-an.mjs --preflight). The eight plants each refused on its own check: arm (armTook), drift (refTook 11/33), choice (refTook 32/33), step (refTook 32/33), layer (identity 47/120), own (ownTook 0/120), quad (qfTook 470/796), held (layerTook 666/796). The e3pcls pin re-taken on this code (solver-e3pcls.test.mjs, 27 passed). Four faults the earlier preflights and the plan-auditor caught, fixed before this one: the meta's readerRef (the first), plants counted by exit code alone (the first; O159), refTook read at a scaled sample and not by year (the plan-auditor's FAIL of 15:37 UK), and refTook's floor (the fourth: choice and step passed at 0.02).

## Derivation script

- `derive: research/solver/derive-an.mjs > research/solver/results-derive-an.txt sha256 d5bcf71b4eea2b7d`
  (NODE-AX's BN and BO behind NODE-AX's gate, the incidence, the power of items 1-3 through reduce-an.mjs's own items() at the record's spread times 0.75, 1 and 1.5, the credences from the 10:13 receipt's CAUSE CREDENCES through the JUDGED stories, the decision rows, the point and 80% interval, the budget)

## Point and interval

- **Item 1:** -0.2721, AN's bridge-years grid residual in world 0, points (results-derive-an.txt section 3); 80% interval -1.5815 to 0.7319
- **Item 2:** 0.0000, AN's runs less BN's in world 0, points (results-derive-an.txt section 3); 80% interval -0.3250 to 0.3500
- **Item 3:** -0.4929, world 2's year-1 term under AN, points (results-derive-an.txt section 3); 80% interval -0.8029 to -0.0062

## Power

From results-derive-an.txt section 2 (40 draws a cell through reduce-an.mjs's own items(), 4,000 paths a world, at the record's spread: GB sd 5.4538 and 4.2499 in worlds 0 and 1, world 2's Y1 sd 1.0666; the rows at 0.75 and 1.5 times it are in the file):

```
  x1 item 1, GB -1.2 in both worlds: HELD 0.00 INCONCLUSIVE 0.10 FALSIFIED 0.90
  x1 item 1, GB -0.8 in both worlds: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  x1 item 1, GB -0.3 in both worlds: HELD 0.42 INCONCLUSIVE 0.57 FALSIFIED 0.00
  x1 item 1, GB 0 in both worlds: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  x1 item 1, GB 0.3 in both worlds: HELD 0.33 INCONCLUSIVE 0.68 FALSIFIED 0.00
  x1 item 1, GB 0.8 in both worlds: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  x1 item 1, GB 1.2 in both worlds: HELD 0.00 INCONCLUSIVE 0.03 FALSIFIED 0.97
  x1 item 3, world 2's Y1 -0.6: HELD 0.00 INCONCLUSIVE 1.00 FALSIFIED 0.00
  x1 item 3, world 2's Y1 -0.25: HELD 1.00 INCONCLUSIVE 0.00 FALSIFIED 0.00
  churn x1 item 2, the runs -0.3 points in both worlds: HELD 0.25 INCONCLUSIVE 0.63 FALSIFIED 0.13
  churn x1 item 2, the runs 0 points in both worlds: HELD 0.97 INCONCLUSIVE 0.03 FALSIFIED 0.00
```

Item 1 separates a removed residual (GB within about 0.3 of zero: HELD) from one left at BN's level (-1.2 or below: FALSIFIED under); a partial lift or an overshoot under a point reads INCONCLUSIVE, the else row's route. Item 3 separates a year-1 term lifted to -0.25 or above from one left past -0.6. Item 2 reads no material harm unless the runs lose a quarter of a point or more.

## Budget line

From results-derive-an.txt section 4: BN's solve 8,469 s and ledger 1,173 s (NODE-AX's log, grade C), the reference's build 267.2 s (the preflight's: its lattice does not depend on the grid's points), refTook 1.5 s at the preflight's records (grade C: more records to sample in the run, seconds still): AN about 2.75 h on one core; the batch's timeout is 10 hours.

## Pre-mortem

- **First: an overshoot under a point.** The review's static read overshot to about +0.9 (grade C, carrying O157's bias); an overshoot between half a point and one reads item 1 INCONCLUSIVE, the else row's main route.
- **Second: the reference's own error.** refTook checks p against its own rule by p-bin and by year at a floor of 0.01; a bias under about 0.015 is not excluded (the choice and step plants, near 0.02, each failed one cell only), and it would move GB by its effect on the split; the exact last year removes O157's smear by construction, and the cells above are counted.
- **Third: the runs move.** A re-solve with a new reference moves openings; item 2's churn is judged from BO against BN (a change to the share axis alone), grade D for a change of reference.
- **Fourth: the code.** The control is NODE-AX's saved BN; BN on this code is shown bit for bit at the preflight scale only (4 points, 40 paths), not at 60 points.
- **Fifth: one seed (7002) and one household (S360).**

## Credence

Write the judged lines first and commit them, then run the derivation script, whose section computes each outcome's probability from stated priors over the Power section's stories through the decision bands (check-prediction.mjs refuses judged lines committed with or after its output). Each item starts from its kind's base rate (results-scorecard.txt, KIND BASE RATES, as of this file's writing: NOHARM 0.76 (40 of 52), ATTRIB 0.50 (36 of 72), an item leaning on a deep review's cause or story 0.32 (9 of 29)); the priors state why they move from it, and an item resting on a deep review's ranked cause or story starts from that record's rate, not the review's own probability. Run scorecard.mjs on the prediction before registration: an item read but not scored is listed in its TESTS entry's unscored list and stays off the OUTCOME line.

Items 1 and 3 rest on the deep review's ranked cause (N2-REF) and its static story, so each starts from a deep review's cause rate, 0.32; the derivation takes the receipt's leading cause at 0.5, not its 0.62 (the JUDGED block: the leading causes settled since held 8 of 10, and the review read the saved files at the corners the read weighs), the other causes scaled, through the JUDGED stories and section 2's power. Item 2 starts from NOHARM's rate, 0.76, and is derived at 0.82 from the judged runs' change and churn.

- **Base rate, item 1:** 0.32 (a deep review's cause: the reference's shape)
- **Base rate, item 2:** 0.76 (NOHARM)
- **Base rate, item 3:** 0.32 (a deep review's story: the static read of world 2's year 1)
- **Item 1:** INCONCLUSIVE 0.52, FALSIFIED 0.25, HELD 0.23 (derived, results-derive-an.txt section 3; INCONCLUSIVE named first, the likeliest)
- **Item 2:** HELD 0.82, INCONCLUSIVE 0.14, FALSIFIED 0.04 (derived)
- **Item 3:** INCONCLUSIVE 0.40, HELD 0.37, FALSIFIED 0.23 (derived; INCONCLUSIVE named first, the likeliest)
- **Judged:** none (the judged inputs are derive-an.mjs's JUDGED block, committed before its output in 6f6a9a7, the leading cause's shading added before any output in edb5bf5)
- **Kinds:** 1 ATTRIB, 2 NOHARM, 3 ATTRIB

## Changes after seeing results

None.
