# Prediction: NE-EDGE (does the reader's unscaled residual carry S364's near-dead over-read, and does removing or scaling it change S364's opening without moving households off the edge?)

- **Run:** `research/solver/batch-needge.sh` - results/diagneedge/case0-6.txt and the seven jobs' files (audit-needge.mjs), reduced by reduce-needge.mjs into results-needge.txt
- **Kind:** test
- **Written:** 13 Oct, before the run (its time is its registering commit's, git log)
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths a world, NE-GRID B1's and C's paths; 7u's held-out seed refused by the audit
- **Unmasking:** removing or scaling the residual lowers every near-dead read the reader makes in the bridge years, so it may move S364's own opening (printed; items 5 and 6 read it) and unmask another error R was offsetting - the after-access optimism (O66) on near-dead households, which the deep review after C names; any fix this leads to names S364, S360, bridge 4, S126 and the 95% share household in its own Unmasking, and reports its solve time against gate 5
- **Mechanism:** grid.js's read "const v = pr * cc + rr;" (the residual blend rr added unscaled by the query's chance pr; PR18); reader.js:97 "if (p[i] >= ((g.reader && g.reader.line) || 0.5)) { sup[i] = 1;" (the corners below the line copied, their survival left in R); solve.js:1261 "else if (opts.readerSplit === 'rz') tb.R = new Float64Array(tb.R.length);" (RZ); grid.js's read under `g.reader.rs` "rr += w * RD.R[i] * (pk > pr ? pr / pk : 1);" (RS)
- **Plan section:** PLAN.md "NE-EDGE", O137, O132, O128, O131, O142, PR18; the deep review after NE-GRID C (deep-review-log.md 13 Oct 02:17 UK)

## Question

The deep review after NE-GRID C's decisive test: S364's 60-point table at P over-reads its runs by 3.3712 and 2.5196 points in worlds 0 and 1 (NE-GRID C, results-negrid-c.txt), and C's probe put most of the read on copied corners whose residual carries over half of it. The reader adds each corner's residual R unscaled by the query's own chance, so a near-dead query (chance 2.8e-4 against the copied corners' 0.0211 in world 0) keeps the corner's whole R. (1) Does zeroing R (RZ) remove S364's over-read? (2) Does scaling R by min(1, the query's chance / the corner's) (RS) remove it? (3, 4) Do the arms leave bridge 4's read and S380's tables alone, off the near-dead edge? (5, 6) Under each arm, does S364's own opening stop losing to the plan's tier (BASE's de-risked opening loses 2, 12 and 55 of 4,000 paths by world)?

## Derivation

- **The arms are research options, inert by default:** RZ (`readerSplit: 'rz'`, NE-BLEND's) and RS (`readerSplit: 'rs'`, new: grid.js's read scales each corner's R by min(1, pr / p_corner) when the reader's flag is set; solve.js refuses it with readerBlend). Inert by construction (the flag false in every product path; without it the read's arithmetic is the same additions in the same order) and by results-needge-inert.txt (grade A with the construction: S364's tables at 4 points bit for bit the code before's at defaults, 9adf125874e13b37, different under RS); the e3pcls identity test re-run and re-pinned on this code.
- **S364's baseline is NE-GRID C's:** the BASE job re-runs C's S364 BASE/P60S6Q5 and the gate refuses it unless its tables match C's to the printed digits and its runs C's to the bits (the identity control). S380's reference is NE-GRID B1's 60-point BASE tables, behind B1's gate.
- **Each table is read against its own policy's runs:** P and D forced in year 0, the job's own moves after, on the seed's first 4,000 paths a world; the own opening run too where it is neither.

## Prediction

- **Item 1 HELD / FALSIFIED (tied, 0.38 each):** RZ removes S364's over-read, or removes under half of it; the derivation gives no lean.
- **Item 2 FALSIFIED:** RS removes under half of S364's over-read (0.43 against HELD 0.33).
- **Item 3 HELD:** bridge 4 stays within 0.3 at its own opening under both arms.
- **Item 4 HELD:** S380's tables stay within 0.3 of B1's under both arms.
- **Item 5 FALSIFIED, item 6 FALSIFIED:** under each arm S364's own opening still loses to the plan's tier in a world.

## Falsified if

- **Item 1 or 2 HELD:** the arm removes at least 0.8 of the over-read in every counted world, even at its runs' interval's worst end; FALSIFIED: under 0.5 at the best end.
- **Item 3 FALSIFIED:** a world's interval for bridge 4 lies wholly outside 0.3 under either arm.
- **Item 4 FALSIFIED:** an S380 table moves 0.6 or more under either arm.
- **Item 5 or 6 HELD:** under the arm S364's own opening does no material harm against P in every world.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households | S364 (deciding), bridge 4 and S380 (controls) | the same | SAME: tuning-seed households |
| 24 | The read and edge handling: the bridge read | BASE | RZ, RS | TESTED: the residual's treatment, one change an arm |
| 28 | Every file made by the same code | this launch | NE-GRID C's S364 job and B1's S380 tables | ACCEPTED: C's and B1's records read behind their gates, on code that differs from this test's by research options inert by default (results-negridc-inert.txt, results-needge-inert.txt, with the construction); S364's BASE re-run must reproduce C's job to the bits |
| 32 | The table's number is never the result | the gap between table and simulation is half the result, both printed | the same | ACCEPTED: items 1-3 read a table against its own runs; item 4 a table move (deterministic); items 5 and 6 paired runs |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** each world's runs bounded by their exact (Clopper-Pearson) interval one-sided at ALPHA / 4 = 0.0125, ALPHA 0.05; every threshold read on the figure rounded to 1e-9.
- **Items 1 and 2 (primary; single look):** in worlds 0 and 1, BASE's over-read is its table at P less its P runs, counted where at least half a point; the arm's removal is 1 less the arm's over-read over BASE's. HELD when every counted world's removal is at least 0.8 with the arm's over-read at its interval's top (the bound on the side that leaves the most over-read); FALSIFIED when every counted world's removal is under 0.5 with it at its interval's bottom; INCONCLUSIVE otherwise, or with none counted.
- **Item 3 (control; single look):** bridge 4 under RZ and RS, its own opening's table less its runs in each world: HELD when every point is within 0.3 under both arms; FALSIFIED when a world's interval lies wholly outside [-0.3, 0.3] under either; INCONCLUSIVE otherwise.
- **Item 4 (control; deterministic):** S380 under RZ and RS against B1's 60-point BASE tables, worlds 0 and 1, P and D: HELD when every |difference| is at most 0.3; FALSIFIED when any is 0.6 or more; INCONCLUSIVE otherwise.
- **Items 5 and 6 (single look):** S364's own opening under the arm against the arm's P on the same paths, worlds 0, 1 and 2, by the regimen's exact paired rule (stats.mjs outcome()) at the relative margin (PR13: the margin or a tenth of P's survival, the smaller), Holm across the three worlds; 0 of 0 discordant is no material harm. HELD when every world reads no material harm; FALSIFIED when any world reads harm; INCONCLUSIVE otherwise. Reported: BASE's own opening read alike (the positive control).
- **The causes, by the registered map (printed '=> <cause> held / not / open'):** R-CARRIES (S364's over-read is the residual's) held on item 1 HELD, not on item 1 FALSIFIED; S364-RUNSCALED held on item 2 HELD, not on item 2 FALSIFIED with item 1 HELD or FALSIFIED; open otherwise. Both arms reach the mechanism by construction (RZ removes every corner's R; RS scales every corner whose chance exceeds the query's), so 'not' needs no reach line (new-prediction.mjs's rule of 13 Oct).
- **Reported, not items:** every job's tables, own opening, runs and reader counts; the probe on S364's three jobs; BASE's own opening against P.
- **Declared choices, not derived:** 0.8 and 0.5 as the removal lines (the deep review's); half a point as the smallest over-read counted; 0.3 for the controls (NE-ROOT's), 0.6 as item 4's falsifier; PR13's tenth margin for items 5 and 6 (the maintainer's, 11 Oct 07:27 UK); 60 points, 6 shares and 5 return nodes (NE-GRID C's S364 job's).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 3 or 4 FALSIFIED | an arm moves a household off the near-dead edge: no near-edge fix as built; the deep review weighs the control | 0.08 |
| item 2 HELD, and item 5 or 6 HELD (3 and 4 not FALSIFIED) | the scaled residual carries S364's over-read and an arm ends its opening's loss: the near-edge fix goes into the panel test as its own arm (rule 1), RS where item 6 holds, else RZ | 0.24 |
| item 1 HELD, item 2 FALSIFIED | the residual carries it but scaling does not remove it: RZ is the arm the deep review weighs for the panel, S364-RUNSCALED not | 0.06 |
| items 1 and 2 FALSIFIED | the residual does not carry it: the deep review re-ranks S364's causes (S364-STORED, S364-REF) before any near-edge fix | 0.25 |
| else | NE-EDGE's unsettled items named; the deep review after NE-EDGE designs the next step | 0.38 |

- **Waiver:** none needed: the chance the action changes is 0.62 (one less 0.38, the likeliest row), above a quarter
- **The escalation rule (escalation.md, trigger 3):** the run is over 2 hours' wall (about 3.61 h) and its 'else' row is 0.38, under the 0.6 bar: no escalation review first.

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1:** HELD shows S364's 60-point over-read is the residual's (grade B, one household); FALSIFIED rules the residual out as its carrier.
- **Item 2:** HELD shows scaling R by the query's chance removes it, the mechanism the deep review ranked first (S364-RUNSCALED); FALSIFIED with item 1 HELD shows R carries it but not by that route.
- **Items 3 and 4:** the controls; their FALSIFIED decides row 1. An arm that moves bridge 4 or S380 does not go into a panel as it stands.
- **Items 5 and 6:** HELD says the arm ends S364's opening loss (grade B); FALSIFIED says the arm's read still lets S364 open into a loss, whatever item 1 or 2 shows; O132's loss then stays the opening's own.
- **Inconclusive on any item:** it leaves its question open and names the world or arm that kept it so; nothing rests on it, and the deep review after NE-EDGE reads it.
- **In every branch:** no product change; the candidate's settings unchanged; 7u-F held; the panel test registers after NE-EDGE reads (the deep review after C).

## Provenance

- **The design:** the deep review after NE-GRID C (deep-review-log.md 13 Oct 02:17 UK), its decisive test, adopted under the maintainer's standing go-ahead of 4 Oct and the night's instruction (12 Oct, the session: launch overnight only under 2 hours or below the 0.6 escalation bar, with no product decision and 7u-F untouched).
- **The build:** audit-needge.mjs, reduce-needge.mjs (100 planted checks, each of items 1-6 reaching all three outcomes, checked by the planted run itself, EDGES, every boundary planted exactly; the identity control against C's job), mutate-reduce-needge.py (72 of 72 caught, results-reduce-needge-mutations.txt), derive-needge.mjs, batch-needge.sh, preflight-needge.sh, inert-needge.mjs.
- **Changed from the review's design (declared):** item 1 of the review's ("RZ and RS each remove at least 0.8") split into items 1 and 2, and its harm read into items 5 and 6 per arm; the opening read against the arm's own P (a loss of the opening under the arm) rather than against BASE's own opening, so it reads the harm O132 names; the removal lines read with the runs' interval on the strict side.
- **The preflight:** to be run through the launcher before launch and quoted here.
- **Seen before registration (declared):** NE-GRID C's results in full and its files; the deep review's figures and its scratch reads of C's and B1's bits; results-partyear.txt; the outside reviews of the opening near-ties.

## Derivation script

- `derive: research/solver/derive-needge.mjs > research/solver/results-derive-needge.txt sha256 992a0ab376fc5ed4`
  (NE-GRID C's S364 job behind C's gate, the power of items 1-6 through reduce-needge.mjs's own items(), the credences from the review's S364 cause credences and the JUDGED block, the decision table's rows, the points and 80% intervals, the budget from C's and B1's logs)

## Point and interval

- **Item 1:** 0.5783, RZ's removal of S364's over-read in world 0 (results-derive-needge.txt section 3); 80% interval 0.1170 to 0.9251
- **Item 2:** 0.5359, RS's removal in world 0; 80% interval 0.1021 to 0.9215
- **Items 3-6:** none: controls and paired harm reads, read by their rules

## Power

From results-derive-needge.txt section 2 (1,000 draws a cell through reduce-needge.mjs's own items(); S364's BASE at C's records):

```
  items 1 and 2, an arm removing 0.3 of S364's over-read: RZ HELD 0.0000 INCONCLUSIVE 0.0150 FALSIFIED 0.9850; RS HELD 0.0000 INCONCLUSIVE 0.0200 FALSIFIED 0.9800
  items 1 and 2, an arm removing 0.6 of S364's over-read: RZ HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000; RS HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000
  items 1 and 2, an arm removing 0.8 of S364's over-read: RZ HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000; RS HELD 0.0000 INCONCLUSIVE 1.0000 FALSIFIED 0.0000
  items 1 and 2, an arm removing 0.9 of S364's over-read: RZ HELD 0.9390 INCONCLUSIVE 0.0610 FALSIFIED 0.0000; RS HELD 0.9400 INCONCLUSIVE 0.0600 FALSIFIED 0.0000
```

Items 1 and 2 read a removal clearly at or beyond 0.8 as HELD (0.94 at 0.9) and one at exactly 0.8 as INCONCLUSIVE, since the rule reads the arm at its runs' worst end; under 0.5 they read FALSIFIED (0.98 at 0.3). Items 3 and 4 separate kept from broken fully at these stories; items 5 and 6 separate an opening at P (HELD 1.00) from one keeping BASE's loss (FALSIFIED 1.00).

## Budget line

From results-derive-needge.txt section 4 (C's S364 log; B1's S380 and bridge 4 logs; each job solve plus runs): in all about 12.75 core-hours, the seven jobs four at a time, about 3.61 h wall. Each job may run 10 hours (the batch's timeout).

## Pre-mortem

- **First: RZ and RS read alike in worlds 0 and 1,** where the query's chance sits 75 and 17 times under the copied corners', so RS scales most of R away; items 1 and 2 then tell apart only where the ratio is near 1 (world 2, not read), and S364-RUNSCALED against R-CARRIES rests on world 1's ratio.
- **Second: the arm moves S364's policy.** Removing R lowers the de-risked opening's read too, so the own opening may move (items 5 and 6 read it) and each table is read against its own runs.
- **Third: S380 and bridge 4 may carry small R** in years the probe did not read (it read year 0's score at P only); items 3 and 4 catch a move of 0.3 or more.
- **Fourth: C's S364 job is reproduced, or the run refuses** - a code difference since C (the RS change, inert by default) would show here first.
- **Fifth: one seed (7002) and one deciding household.**

## Credence

The maintainer's 'Go ahead' of 5 Oct on the deep review of the prediction record (deep-review-log.md 5 Oct 10:16 UK): write
the judged lines first, then run the derivation script, whose section computes each outcome's probability from stated
priors over the Power section's stories through the decision bands. No cap taken from the scorecard.

Start from the base rate of the item's kind (results-scorecard.txt, KIND BASE RATES, as of this file's writing: Laplace over every scored item of its kind): NOHARM 0.78 (38 of 48), EFFECT 0.70 (18 of 25), ATTRIB 0.47 (29 of 62), SIZE 0.53 (24 of 45), CTRL 0.72 (12 of 16), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.29 (7 of 26).
Items 1 and 2 rest on the review's ranked cause (S364-RUNSCALED at 0.50), so each starts from 0.29; the derivation mixes the receipt's cause credences through the JUDGED stories and section 2's power, which puts item 1 at 0.38 and item 2 at 0.33 (RZ removes R whatever its route; RS only where the query's chance falls below the corner's). Items 3 and 4 start from CTRL's 0.72 and move to 0.72 and 0.90 (S380's corners all supported at P, R zero there). Items 5 and 6 start from NOHARM's 0.78 and fall to 0.33 and 0.31: an arm ends the opening's loss only where it removes most of the over-read and the opening then moves.

- **Base rate, item 1:** 0.29 (a deep review's cause: S364-RUNSCALED, R-CARRIES)
- **Base rate, item 2:** 0.29 (a deep review's cause: S364-RUNSCALED)
- **Base rate, item 3:** 0.72 (CTRL)
- **Base rate, item 4:** 0.72 (CTRL)
- **Base rate, item 5:** 0.78 (NOHARM)
- **Base rate, item 6:** 0.78 (NOHARM)
- **Item 1:** HELD 0.38, INCONCLUSIVE 0.24, FALSIFIED 0.38 (derived, results-derive-needge.txt section 3)
- **Item 2:** HELD 0.33, INCONCLUSIVE 0.24, FALSIFIED 0.43 (derived)
- **Item 3:** HELD 0.72, INCONCLUSIVE 0.22, FALSIFIED 0.06 (derived)
- **Item 4:** HELD 0.90, INCONCLUSIVE 0.08, FALSIFIED 0.02 (derived)
- **Item 5:** HELD 0.33, INCONCLUSIVE 0.00, FALSIFIED 0.67 (derived)
- **Item 6:** HELD 0.31, INCONCLUSIVE 0.00, FALSIFIED 0.69 (derived)
- **Judged:** none (the judged inputs are derive-needge.mjs's JUDGED block, committed before its output in 87f778a)
- **Kinds:** 1 ATTRIB, 2 ATTRIB, 3 CTRL, 4 CTRL, 5 NOHARM, 6 NOHARM

## Changes after seeing results

None.
