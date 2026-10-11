# Prediction: NE-ROOT (why the candidate's S364 survival read is a plateau)

- **Run:** `research/solver/batch-neroot.sh` - results/diagneroot/case0-10.txt and the eleven jobs' files (audit-neroot.mjs: S364 at 0.02 and bridge 4 at 0.02 under BASE, R0, SIMP and READEROFF; S364 at 0.01, S224 and S380 at 0.02 under BASE), reduced by reduce-neroot.mjs into results-neroot.txt
- **Kind:** test
- **Written:** 11 Oct, before the run (its time is its registering commit's, git log)
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths for each world's forced runs, each world's long-run shift put in, the same paths for every arm and opening; 7u's held-out seed refused by the audit; simChance's own draws (the SIMP arm's chance table, reader.js) are seeded inside the solver and are not market paths
- **Unmasking:** R0 and SIMP each remove a suspected error in the bridge reader (the residual's linear blend across the share cliff; the lognormal reference chance), and READEROFF removes the reader whole; any of them may unmask the error the reader was built to fix - the no-reader dead-corner pessimism (SHIP's bridge 4 table 13.3493 against 7980 of 8000 simulated, results-nesplit.txt) - so bridge 4 is read under every arm as the control, and any near-edge reader fix this test leads to names bridge 4, S126 and share 0.95 in its own Unmasking (the deep review after NE-SPLIT)
- **Mechanism:** reader.js:80 "c_i = clip(S_i / p_i, 0, 1) where p_i >= 0.5 (supported)" (OW-RSPLIT: the clip and the copy leave the near-edge survival in R; the R0 arm); grid.js:387 "c and R blended with the same corner weights" (OW-RSPLIT: R blended in probability across the share cliff); reader.js:10 "* with ln D taken as normal with D's exact first two moments (worked backward from the last bill:" (OW-PREF: the lognormal chance; the SIMP arm)
- **Plan section:** PLAN.md "NE-ROOT", O132, O137, O138, PR15, PR17-PR19; the deep review after NE-SPLIT (deep-review-log.md 11 Oct 02:37 UK)

## Question

NE-SPLIT found the candidate's tables blind to S364's loss (the 11 Oct 02:08 row): S364's table survival at SS reads 3.6685, 3.2066 and 1.7719 in worlds 0, 1 and 2 against 1, 7 and 35 of 2,000 simulated - falling as the world improves, too flat in money and volatility (O137). Which part of the candidate's survival read makes that plateau: the reader's split leaving the near-edge survival in its residual R (OW-RSPLIT), its lognormal reference chance p (OW-PREF), a part outside the reader (OW-BUNDLE), or something else (OW-OTHER)? Each suspected part is removed in turn - R0, SIMP, READEROFF - and the arm's own table read against its own forced runs by world; stage 1 splits the year-1 read into p x c and R.

## Derivation

- **The arms are research options, inert by default:** `readerSplit: 'r0'` replaces the split's c and R with c = S/p and R = 0 at every node with p at least 1e-12 (reader.js r0Split); `readerChance: 'sim'` replaces the lognormal chance with a simulation of the same schedule (reader.js simChance); READEROFF sets bridgeRead off, and with it bridgeStep, which needs the reader (solve.js refuses bridgeStep 'exact' without it). research/tests/reader-neroot.test.mjs checks each (simChance within four standard errors of the exact two-bill chance, a drift five points off caught; r0Split leaves nothing in R, the reader as built caught leaving survival there): 7 checks passed; reader.test, reader-solve.test, reader-order.test and reader-order-solve.test pass unchanged (30, 17, 12 and 10), so the defaults are untouched; the e3pcls identity test re-pinned on this code.
- **The openings are the same moves under every arm:** SS and SC take SHIP's own year-0 spend and SHIP's own opening's withdrawal recipe (SHIP takes no arm), at the plan's tiers and two steps down; the gate refuses SS or SC differing between the arms.
- **The tables are seed-free and each arm is read against itself:** each arm's world-table survival at SS is set beside SS forced in year 0 with that arm's own moves after it, on the same 4,000 paths a world, so the gap measures that arm's calibration at S364's opening.
- **Stage 1's split is exact and checked:** the survival part is linear in each reader table's c and R (the read is p x sum w c + sum w R, grid.js readValues), so scoring the opening with R set to 0 gives pc, with c set to 0 and R halved about 1 gives r, and pc + r rebuilds the survival part (splitIdentity, within 1e-5); the five corner-status shares sum to 1 (splitCover).
- **G's size, from NE-SPLIT's records behind its gate (results-derive-neroot.txt section 1):** SS's gap over worlds 0 and 1 is 3.0090 points at NE-SPLIT's 2,000 paths; bridge 4's table less simulated is 0.1967, 0.0261 and -0.0045 by world.
- **The checks, each failed on a planted fault first:** reduce-neroot.mjs's 29 planted checks (`node research/solver/reduce-neroot.mjs --planted`, EDGES printed), and the audit's two plants, each refused by the preflight (Provenance): split moves r by 1e-3 (splitIdentity refuses), arm runs the R0 job without its arm (armTook refuses).

## Prediction

- **Item 1 (R0) INCONCLUSIVE or HELD:** removing the residual removes most of SS's over-read in worlds 0 and 1 and restores the world order, bridge 4 kept.
- **Item 2 (SIMP) FALSIFIED:** simulating the reference chance leaves at least three quarters of the gap.
- **Item 3 (READEROFF) INCONCLUSIVE:** the reader off removes the over-read but bridge 4 is shown off (the no-reader pessimism).
- **Item 4 HELD:** the residual carries at least half of SS's year-1 read in worlds 0 and 1 and at most a quarter in world 2.
- **Item 5 HELD:** bridge 4 under BASE is within 0.3 points of its table in every world.

## Falsified if

- **Item 1 FALSIFIED:** R0 leaves at least three quarters of SS's gap at a bound's end (or turns it into an under-read as large).
- **Item 2 HELD (the prediction missed):** SIMP removes at least half the gap, restores the order, bridge 4 kept.
- **Item 3 FALSIFIED:** the reader off leaves at least three quarters of the gap: the plateau is not the reader's.
- **Item 4 FALSIFIED:** the residual carries at most a quarter of the read in both worlds 0 and 1.
- **Item 5 FALSIFIED:** one world's interval of bridge 4's table less simulated lies wholly outside 0.3 points.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households | S364 (deciding), bridge 4 (control), S364 at 0.01, S224, S380 (reported) | the same | SAME: S364 and bridge 4 are NE-SPLIT's tuning-seed units; S224 and S380 are 7u-F's households, read here on the tuning seed and only reported (their world lines under BASE) |
| 5 | The paths | the tuning seed's first 4,000 paths a world | the same | SAME: every arm and opening on the same paths |
| 13 | The risk tier | SS at the plan's tiers (deciding) | SC two steps down (reported) | SAME across arms: SS and SC are SHIP's own spend and recipe under every arm, the gate refuses otherwise |
| 24 | The read and edge handling: the bridge read | BASE: the reader as the candidate carries it | R0: nothing left in R; SIMP: the chance simulated; READEROFF: the reader off, and bridgeStep with it | TESTED: one reader part per arm; READEROFF moves the reader and its step integration together (bridgeStep needs the reader), so its attribution is the reader as a whole, grade C (lessons.md, the 7ak close) |
| 28 | Every file made by the same code | one launch, one stamp | the same | SAME: the gate refuses mixed stamps |
| 29 | The statistic | each arm's table survival at SS against its own simulated survival by world | the same | SAME: the gap is each arm's own calibration |
| 32 | The table's number is never the result | the gap between table and simulation is the result, both printed | the same | ACCEPTED: the test is about the table's calibration, so the table is half of the measured quantity; survival itself is simulated |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The gap (items 1-3):** SS's table survival less its simulated survival, in points, weighted over worlds 0 and 1 by the mixture's weights; each world's simulated survival bounded by its exact (Clopper-Pearson) interval one-sided at ALPHA / 6 = 0.0083 (two worlds and three arms: Bonferroni, Holm's first step, conservative), the bounds combined at the same weights. Gb is BASE's gap at its point.
- **Items 1-3 (primary; single look; one per arm: R0, SIMP, READEROFF):** HELD when the arm's gap lies inside +-Gb/2 at both bounds, its SS table survival rises with the world (T0 <= T1 <= T2) and bridge 4 under the arm is not shown off its table by more than 0.3 points in any world (each world's interval of table less simulated, at the same bounds, reaches [-0.3, 0.3]); FALSIFIED when the arm leaves at least three quarters of Gb at a bound's end (low end >= 0.75 Gb, or high end <= -0.75 Gb); INCONCLUSIVE otherwise, and whenever Gb is not above 0.
- **Item 4 (stage 1; single look; deterministic):** r / sv for SS under BASE by world: HELD when >= 0.5 in worlds 0 and 1 and <= 0.25 in world 2; FALSIFIED when <= 0.25 in both worlds 0 and 1; INCONCLUSIVE otherwise.
- **Item 5 (the control; single look):** bridge 4 under BASE: HELD when every world's table less simulated is within 0.3 points; FALSIFIED when one world's interval, at the same bounds, lies wholly outside [-0.3, 0.3]; INCONCLUSIVE otherwise.
- **Reported, not items:** SC's gaps beside SS's; S364 at 0.01's split and world lines; S224's and S380's world lines at the candidate's own opening (whether the plateau reaches 7u-F's households, the plan-auditor's MINOR 2 of 11 Oct 02:53 UK); each reader table's nodes by status and its funded share corners' R and S - p.
- **Declared choices, not derived:** the half and three-quarter lines and the world order (the review's rule: 'removes at least half of the gap in worlds 0 and 1 and restores the world order'); the 0.3 control line (the review's); Bonferroni in place of Holm across the arms, since each arm's reading is an interval, not a p-value; the arms' control read at its interval, not its point (results-derive-neroot.txt section 2: the point alone would block a true removal 0.31 of the time); forceIdentity on world 0's first 1,000 paths (a self-check, not a figure).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD, item 2 not HELD | OW-RSPLIT leads (grade B, one seed): the reader's split leaves the near-edge survival in R; a fix of the split and R's blend is designed with NSL-PROP's R blend (NS-PROP folds into it), tested on a fresh seed, and goes to the maintainer with 7u-F (NE-SPLIT's row 1); PR17 and PR18 recorded false on S364 | 0.29 |
| item 2 HELD, item 1 not HELD | OW-PREF leads: the lognormal reference chance over-reads at the near-dead edge (PR15 false on S364); a fix of p is designed and tested on a fresh seed, to the maintainer with 7u-F | 0.07 |
| items 1, 2 and 3 FALSIFIED | not the reader (OW-BUNDLE or OW-OTHER): the next split, over the candidate's non-reader settings (e3, e3pcls, the tier state), is registered as its own test | 0.09 |
| else | the unsettled items named; the stage-1 split and the arms' per-world lines decide the next split, registered as its own test; nothing goes to the maintainer unless an arm reads | 0.55 |

- **Waiver:** none needed: the chance the action changes is 0.45 (one less 0.55, the likeliest row), above a quarter

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1 HELD (row 1):** OW-RSPLIT is recorded as O137's leading cause at grade B (one seed); NE-ROOT's STOP lifts for designing the split's fix, not for shipping one.
- **Item 2 HELD (row 2):** OW-PREF as above, PR15 recorded false on S364.
- **Items 1 and 2 both HELD (row 4):** both parts carry it; their fixes are designed together and neither is recorded as the cause alone.
- **Item 3:** HELD or FALSIFIED says whether the reader as a whole carries the plateau, grade C (two settings move together); its INCONCLUSIVE (bridge 4 shown off) is the expected reading and changes nothing.
- **Item 4 HELD or FALSIFIED:** the residual or the reference times the continuation carries S364's year-1 read; it supports or weakens row 1 but never decides a row alone.
- **Item 5 FALSIFIED:** the method misreads where the table was calibrated: items 1-3 are NOT SETTLED until the misread is explained; HELD or INCONCLUSIVE leaves them as read.
- **In every branch:** no product change; the candidate's settings unchanged; 7u-F waits as its row says; NS-PROP waits on this read.

## Provenance

- **The design:** the deep review after NE-SPLIT (deep-review-log.md 11 Oct 02:37 UK), its decisive test NE-ROOT and its STOP list; PLAN.md's NE-ROOT row (PROPOSED 11 Oct).
- **Changed from the review's design (declared):** the arms' bridge 4 condition read at its interval (above); Bonferroni across the arms; S224's and S380's world lines as BASE jobs (MINOR 2 of 11 Oct 02:53 UK); SS and SC at SHIP's own opening's recipe (O136's lesson); the review's 'S - p, c and R at the funded share corners in every bridge year by world and layer' printed per reader table at its lowest pension share, supported nodes; forceIdentity on world 0's first 1,000 paths; S364 at 0.01 under BASE only.
- **The build:** reader.js simChance and r0Split, solve.js's two options and their guards (one line each, so no mechanism anchor moved), research/tests/reader-neroot.test.mjs; audit-neroot.mjs, reduce-neroot.mjs, derive-neroot.mjs, batch-neroot.sh, preflight-neroot.sh.
- **The preflight:** preflight-neroot.sh on the tuning seed at 4 points through the launcher (runs.log 11 Oct), quoted from results-neroot-preflight.txt: A. the reducer's 29 planted checks all read as they should, EDGES printed; B. GATE passed on the eleven jobs at 4 points and 40 paths a world, every arm in its solve's meta, the same SS and SC under every arm, every self-check passed; C. the plant split refused (exit 3: a stage-1 self-check failed) and the plant arm refused (exit 3: the arm's settings did not take). The gate's printed line then said 'forceIdentity on every path'; corrected to world 0's first 1,000 paths before launch (the check itself unchanged).
- **Seen before registration (declared):** NE-SPLIT's results in full (results-nesplit.txt, results/diagnesplit) and the deep review's figures; NE-ROOT's own build checks and preflight at 4 points read through the gate only.

## Derivation script

- `derive: research/solver/derive-neroot.mjs > research/solver/results-derive-neroot.txt sha256 fcbff1466b15e103`
  (NE-SPLIT's world lines behind its gate, the power of items 1-3 and 5 through reduce-neroot.mjs's own items(), the credences from the review's cause credences and the JUDGED block, the decision table's rows, the points and 80% intervals, the budget from NE-SPLIT's logs)

## Point and interval

- **Item 1:** 0.5806, the share of SS's gap R0 removes (results-derive-neroot.txt section 3); 80% interval -0.0138 to 1.0215
- **Item 2:** 0.2273, the share SIMP removes; 80% interval -0.0336 to 0.6600
- **Item 3:** 0.8231, the share READEROFF removes; 80% interval 0.0032 to 2.0000 (2 is an under-read as large)
- **Item 4:** none: a table quantity, deterministic
- **Item 5:** none: a control

## Power

From results-derive-neroot.txt section 2 (2,000 draws a cell at 4,000 paths a world through reduce-neroot.mjs's own items()):

```
  removes 0   : FALSIFIED 1.0000 (every control case)
  removes 0.3 : INCONCLUSIVE 1.0000
  removes 0.6 : INCONCLUSIVE 1.0000 (the world order is not restored: under the linear shrink it needs about 0.61)
  removes 0.8 : kept HELD 0.9990 | off 0.5 HELD 0.6245 | off -86 HELD 0.0000
  removes 1   : kept HELD 0.9995 | off 0.5 HELD 0.6220 | off -86 HELD 0.0000
  removes flip: FALSIFIED 1.0000
  item 5 (bridge 4 under BASE at NE-SPLIT's tables and rates): HELD 0.6950 INCONCLUSIVE 0.3050 FALSIFIED 0.0000
```

Sampling decides little: an arm that removes most of the over-read with bridge 4 kept reads HELD, one that removes none reads FALSIFIED; what is uncertain is which arm removes it (the causes). Item 5's power is limited by bridge 4's world 0 at 4,000 paths (its point 0.1967 at NE-SPLIT's 2,000, a standard error near 0.2).

## Budget line

From results-derive-neroot.txt section 4 (NE-SPLIT's own logs): an S364 job about 0.53 core-hours, a bridge 4 job about 1.71, S224 and S380 about 1.02 each (bridge 4's pace, grade D); in all about 11.51 core-hours, four jobs at once with the long ones first, so about 3 to 4 h wall on the main lane; SIMP's chance tables and the arms' own solves untimed until the preflight. Each job may run 6 hours (the batch's timeout).

## Pre-mortem

- **First: each arm changes the policy too.** An arm's forced runs follow that arm's own moves after year 0, so a removed gap may be the arm's tables and its policy moving together; the gap is each arm's own calibration, which is the question, but it is not BASE's policy re-read.
- **Second: READEROFF moves two settings** (the reader and bridgeStep, which needs it), so item 3 reads the reader as a whole (grade C); and it brings back the no-reader pessimism on bridge 4, so its INCONCLUSIVE is expected.
- **Third: R0's c is unclipped above 1**, so off-grid reads can exceed 1 and clamp; R0 may move bridge 4, which the control reads.
- **Fourth: SIMP's chance table** has 160 levels and 12,000 draws, smearing a step across one cell (about 2% of the later bills, as orderChance).
- **Fifth: the world order needs about 0.61 of the gap removed** under the linear-shrink story, so an arm removing 0.6 reads INCONCLUSIVE by design.
- **Sixth: stage 1's shares are corner weights over the year-1 reads**, not paths; the swap is checked by splitIdentity, and its statuses are rebuilt from each table as built (the meter's blind spot, O138, counted as row-copied).
- **Seventh: S224 and S380 run at bridge 4's pace by assumption** (grade D), so the budget may move.

## Credence

The maintainer's 'Go ahead' of 5 Oct on the deep review of the prediction record (deep-review-log.md 5 Oct 10:16 UK): write
the judged lines first, then run the derivation script, whose section computes each outcome's probability from stated
priors over the Power section's stories through the decision bands. No cap taken from the scorecard.

Start from the base rate of the item's kind (results-scorecard.txt, KIND BASE RATES, as of this file's writing: Laplace over every scored item of its kind): NOHARM 0.78 (38 of 48), EFFECT 0.69 (17 of 24), ATTRIB 0.55 (25 of 45), SIZE 0.53 (24 of 45), CTRL 0.69 (8 of 11), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.26 (6 of 25).
Items 1-4 rest on the review's ranked causes and its story, so each starts from 0.26; the review's own lead credence (OW-RSPLIT 0.53) is already its posterior shaded halfway to that rate (its receipt), and the derivation mixes the receipt's credences through the JUDGED stories (how much of the over-read each arm removes under each cause, how often it moves bridge 4 off and by how much) and section 2's power. Item 1 stands at 0.31 because R0 removes most of the over-read under OW-RSPLIT (0.55 of its draws at 0.8 or more) and bridge 4 is judged kept 0.7 of the time; item 3 at 0.01 because the reader off is judged to put bridge 4 off by about 86 points 0.95 of the time, which the control shows. Item 5 starts from CTRL's 0.69 and its derived 0.69 is the power alone.

- **Base rate, item 1:** 0.26 (a deep review's cause: OW-RSPLIT)
- **Base rate, item 2:** 0.26 (a deep review's cause: OW-PREF)
- **Base rate, item 3:** 0.26 (a deep review's cause: the reader as a whole)
- **Base rate, item 4:** 0.26 (a deep review's story: OW-RSPLIT's prediction)
- **Base rate, item 5:** 0.69 (CTRL)
- **Item 1:** HELD 0.31, INCONCLUSIVE 0.34, FALSIFIED 0.35 (derived, results-derive-neroot.txt section 3)
- **Item 2:** HELD 0.09, INCONCLUSIVE 0.35, FALSIFIED 0.56 (derived)
- **Item 3:** HELD 0.01, INCONCLUSIVE 0.58, FALSIFIED 0.40 (derived)
- **Item 4:** HELD 0.44, INCONCLUSIVE 0.34, FALSIFIED 0.21 (derived: the JUDGED item-4 conditionals over the causes)
- **Item 5:** HELD 0.69, INCONCLUSIVE 0.30, FALSIFIED 0.00 (derived: the power at NE-SPLIT's rates)
- **Judged:** none (the judged inputs are derive-neroot.mjs's JUDGED block, committed before its output)
- **Kinds:** 1 ATTRIB, 2 ATTRIB, 3 ATTRIB, 4 ATTRIB, 5 CTRL

## Changes after seeing results

None.
