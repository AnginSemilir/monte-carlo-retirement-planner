# Prediction: NE-GRID B1 (does the read space's gap close as the wealth axis doubles, and do the tables reach their runs and price the de-risk at 60 points?)

- **Run:** `research/solver/batch-negrid-b1.sh` - results/diagnegrid/case0-11.txt and the five simulating jobs' files (audit-negrid.mjs: S380, bridge 4 and S224 under BASE and LOR at 30 and 60 wealth points), reduced by reduce-negrid-b1.mjs into results-negrid-b1.txt
- **Kind:** test
- **Written:** 11 Oct, before the run (its time is its registering commit's, git log)
- **Seeds:** 7002, the tuning seed (RULES.md section 8 item 9): its first 4,000 paths for each world's forced runs at the fine grid, each world's long-run shift put in, the same paths for both arms and both openings; 7u's held-out seed refused by the audit
- **Unmasking:** doubling the wealth axis changes every table the chooser reads, so it may move the candidate's own openings (printed at both grids) and unmask a share-axis error the coarser wealth axis hid (item 1 FALSIFIED reads that); a finer grid that brings the tables to their runs could still move bridge 4 (item 4, the control); any resolution fix this leads to names bridge 4, S126, S224 and the 95% share household in its own Unmasking, and reports its cost
- **Mechanism:** grid.js:123 "axes.W = logAxis(n1, spend * 0.1, spend * top(open.pen + open.isa + open.tax));" (RB-INTERP, PR21: the wealth axis's points set each cell's width, and the read's error across a cell with it); grid.js:32 "whole cell and makes the solver think a doomed position is worth something. Log-odds keeps it sharp." (PR22, O141: the read's space sets the sign of that error by the side of one half)
- **Plan section:** PLAN.md "NE-GRID", O139, O141, O142, O143, PR21, PR22; the deep review after NE-BLEND stage A (deep-review-log.md 11 Oct 15:49 UK)

## Question

The deep review after NE-BLEND stage A's decisive test, its stage B1: (1) does the gap between the log-odds read (LOR) and the probability read (BASE) on S380, at the plan-tier opening P and the de-risked opening D, shrink by half when the wealth axis goes from 30 points to 60 (RB-INTERP along W, against a gap the share axis, the split or the reference carries)? (2) do S380's tables come within half their coarse error of their runs at 60 points, under both reads? (3) do the 60-point tables price D against P - the de-risk family's choice (O142) - within a point of the paired runs in every world? (4) does bridge 4 stay calibrated at 60 points under both reads?

## Derivation

- **The arms are research options, inert by default:** LOR is stage A's `readerBlend: 'logodds'`; the grid is the candidate's `points` (30, the candidate's own, and 60). The LOR clamp counter (grid.js LOR_CLAMPS, on existing lines, counting nothing off the LOR arm) is new; the e3pcls identity test re-pinned on this code (27 passed, fingerprint b05309e7e0413eac).
- **Each table is read against its own runs:** at the household's year-0 state, the survival read at P, D and the arm's own opening in every world table; on the fine grid P and D (and the own opening where it is neither) forced in year 0 with the arm's own moves after, on the same 4,000 paths a world. S224 has no bridge year, so LOR never reads there: its LOR job is checked identical to BASE (tables, own opening, no LOR read counted) rather than simulated.
- **The coarse grid is checked against its records:** the gate refuses unless S380 under BASE at P and under LOR at D, and bridge 4 under LOR at D, reproduce stage A's tables (results-neblend-a.txt), and S224 under BASE NE-ROOT's (results-neroot.txt), to the printed digits; item 2 reads the fine error against stage A's coarse error at the same openings.

## Prediction

- **Item 1 INCONCLUSIVE:** the read space's gap shrinks with the wealth axis but not by half in every counted cell (the derivation's likeliest, 0.53: RB-INTERP leads, but part of the gap is the share axis's).
- **Item 2 INCONCLUSIVE:** the fine tables come closer to their runs without a clear half under both reads.
- **Item 3 FALSIFIED:** the 60-point tables still misprice the de-risk by more than a point in some world (tied with INCONCLUSIVE at 0.37; taken because S380's coarse price error in world 0 is several points and the share axis is unchanged).
- **Item 4 HELD:** bridge 4 stays within 0.3 points under both reads at 60 points.

## Falsified if

- **Item 1 HELD:** every counted cell's gap at least halves: the read space's gap is the wealth cell's (RB-INTERP along W).
- **Item 1 FALSIFIED:** no counted cell's gap shrinks below 0.8 of its coarse size: the gap is not the wealth axis's.
- **Item 2 HELD:** both reads come within half their coarse error of their runs at 60 points; FALSIFIED: both surely do not.
- **Item 3 HELD:** the 60-point tables price D against P within a point of the paired runs in every world under both reads (the prediction missed).
- **Item 4 FALSIFIED:** a world's interval for bridge 4 lies wholly outside 0.3 points under either read at 60 points.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households | S380 (deciding), bridge 4 (control), S224 (identity and reported) | the same | SAME: tuning-seed households; S380 never read on its held-out survival item |
| 13 | The risk tier | P, the plan's tiers (0,0) | D, two steps down (2,2) | SAME across arms and grids: one pair a household at one level and tier base (pairTook) |
| 17 | The grid: points, shares, gain buckets | 30 wealth points, 6 shares | 60 wealth points, 6 shares | TESTED: the wealth axis alone; the shares are B2's |
| 24 | The read and edge handling: the bridge read | BASE: the reader's probability blend | LOR: the corners blended in log-odds | TESTED (item 1's gap, the two reads at each grid); items 2-4 read each arm against its own runs |
| 28 | Every file made by the same code | one launch, one stamp | the same | SAME: the gate refuses mixed stamps, and refuses a coarse grid off its records |
| 32 | The table's number is never the result | the gap between table and simulation is half the result, both printed | the same | ACCEPTED: items 1-3 are about the tables' calibration and price at a forced opening; item 1 is deterministic (tables alone) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Bounds:** each world's simulated survival bounded by its exact (Clopper-Pearson) interval one-sided at ALPHA / 6 = 0.0083, ALPHA 0.05; item 3's paired change by survivalChangeU at ALPHA / 3, held out to the exact bound on a one-sided count (reduce-7aa.mjs guarded); every threshold read on the figure rounded to 1e-9.
- **Item 1 (primary; single look; deterministic):** on S380, the gap g = LOR's table less BASE's at P and at D in worlds 0 and 1, a cell counted where the coarse gap is at least half a point; HELD when every counted cell's |fine gap| / |coarse gap| is at most 0.5; FALSIFIED when every counted cell's is at least 0.8; INCONCLUSIVE otherwise, or with no cell counted.
- **Item 2 (single look):** on S380 at the fine grid, BASE at P and LOR at D (stage A's openings for them), A = the weighted sum over worlds (1/6, 2/3, 1/6) of |table less simulated|, against stage A's coarse A (BASE 2.5434, LOR 3.2377, from results-neblend-a.txt's world lines); HELD when both arms' A is at most half their coarse A at the point; FALSIFIED when both arms' lower bound (each world's distance from 0 of its interval, weighted) is above half; INCONCLUSIVE otherwise.
- **Item 3 (primary; single look):** on S380 at the fine grid under each arm, per world, err = the table's D less P minus the paired runs' change of forcing D for P; HELD when every arm's and world's err is within a point at the point; FALSIFIED when some arm's and world's err interval lies wholly outside [-1, 1]; INCONCLUSIVE otherwise.
- **Item 4 (control; single look):** bridge 4 at the fine grid, each arm's own opening: HELD when every world's table less simulated is within 0.3 points at the point under both arms; FALSIFIED when a world's interval lies wholly outside [-0.3, 0.3]; INCONCLUSIVE otherwise (NE-ROOT item 5's rule).
- **Reported, not items:** every job's tables and own opening at both grids; the LOR clamp counts; the coarse tables' D less P against the fine runs' change; S224's fine world line beside NE-ROOT's coarse one (RB-INTERP predicts its after-access over-read shrinks); bridge 4's read-space gaps.
- **Declared choices, not derived:** 60 points (twice the candidate's 30: the review's design); half a point as the smallest gap read; the half and 0.8 ratio lines (the gap or error at most half: resolution's; at least 0.8: not); a point as the price line (the deep review's world line); the 0.3 control line (NE-ROOT's); P and D per household from NE-ROOT's openings (S380 12 and 14, bridge 4 57 and 59, S224 0 and 2).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD, item 4 not FALSIFIED | the read space's gap is the wealth axis's resolution (RB-INTERP along W, grade B on one seed): the fine grid is the direction of a fix; the deep review after B1 designs the candidate at a finer wealth axis against today's (outcomes and cost, registered as its own test), B2 beside it for the share axis; items 2 and 3 say whether the fine tables reach their runs and price the de-risk | 0.28 |
| item 1 FALSIFIED | the read space's gap is not the wealth axis's: RB-INTERP along W out (grade B); B2 next (S364 at 6 and 12 shares under BASE and LOR, ORDER at 6), the share axis, the split and the reference its candidates | 0.17 |
| item 4 FALSIFIED, item 1 not FALSIFIED | the fine grid moves bridge 4: no resolution fix as it stands; B2 next with bridge 4 read, and the deep review weighs the fine grid's control | 0.09 |
| else | the unsettled items named; B2 as the deep review designed it, its items re-derived from these lines | 0.46 |

- **Waiver:** none needed: the chance the action changes is 0.54 (one less 0.46, the likeliest row), above a quarter

## Decision fed

The decision table's rows decide; each item's own reading adds only this:

- **Item 1 HELD:** the read space's gap at P and D on S380 is the wealth cell's (grade B, one seed); which read is right is not decided by it (both may err; item 2). FALSIFIED: the gap is not the wealth axis's. INCONCLUSIVE leaves it open.
- **Item 2 HELD:** at 60 points both reads come within half their coarse error of their runs at stage A's openings (grade B; the two grids' continuations differ, so read as each grid's own calibration). FALSIFIED: neither does: doubling the wealth axis does not bring the tables to their runs. INCONCLUSIVE leaves it open.
- **Item 3 HELD:** at 60 points the tables price the de-risk within a point of its runs in every world under both reads: O142's mispricing is a coarse-grid error (grade B). FALSIFIED: the fine tables misprice it somewhere: O142's mechanism survives the finer wealth axis and gets its own cause step. INCONCLUSIVE leaves it open.
- **Item 4:** the control; its FALSIFIED decides row 3.
- **In every branch:** no product change; the candidate's settings unchanged; 7u-F held (the maintainer, 11 Oct); NS-PROP waits on NE-GRID.

## Provenance

- **The design:** the deep review after NE-BLEND stage A (deep-review-log.md 11 Oct 15:49 UK), its decisive test NE-GRID and its B1; adopted under the maintainer's standing go-ahead and put to the maintainer in the session (PLAN.md's 11 Oct 15:49 row; the plan-auditor's PASS of 11 Oct 16:15 UK).
- **Changed from the review's design (declared):** the capped-corner LOR read is not run (budget: its solves would add a third arm; the clamp count is reported instead, so whether a capped read could matter is shown); S224's LOR job is not simulated (no bridge year: identity by its tables, opening and LOR count); item 2 reads the fine error against stage A's coarse error at stage A's openings rather than re-running the coarse grid's paths; the review's 'weighted world line' read as the weighted absolute error against half its coarse size; the decision rows were restructured after the derivation's first output, which showed item 1 HELD - the most informative reading - feeding no row of its own (its JUDGED block unchanged; 9c70a0b).
- **The build:** grid.js's LOR clamp counter (on existing lines, no mechanism anchor moved); the e3pcls pin re-run; audit-negrid.mjs, reduce-negrid-b1.mjs (81 planted checks, each item reaching all three outcomes from its own plants, EDGES; every boundary planted at a value the double holds exactly), mutate-reduce-negrid-b1.py (77 of 77 caught, results-reduce-negrid-b1-mutations.txt: O144's gate), derive-negrid-b1.mjs, batch-negrid-b1.sh, preflight-negrid-b1.sh.
- **The preflight:** to be run through the launcher before launch and quoted here.
- **Seen before registration (declared):** stage A's and NE-ROOT's results in full (results-neblend-a.txt, results-neroot.txt, results/diagneblend, results/diagneroot); the deep review's figures; the derivation's first output (its rows before they were restructured).

## Derivation script

- `derive: research/solver/derive-negrid-b1.mjs > research/solver/results-derive-negrid-b1.txt sha256 459e618ed51f8179`
  (stage A's S380 and bridge 4 lines behind its gate, NE-ROOT's bridge 4 and S224 behind its gate, the power of items 1-4 through reduce-negrid-b1.mjs's own items(), the credences from the review's cause credences and the JUDGED block, the decision table's rows, the points and 80% intervals, the budget from stage A's and NE-ROOT's logs)

## Point and interval

- **Item 1:** 0.7630, the largest counted cell's |fine gap| / |coarse gap| on S380 (results-derive-negrid-b1.txt section 3); 80% interval 0.4321 to 1.0716
- **Item 2:** 0.6844, the fine A over the coarse A; 80% interval 0.2756 to 1.0512
- **Item 3:** none: read by each world's point and interval
- **Item 4:** none: a control, read by its point and interval

## Power

From results-derive-negrid-b1.txt section 2 (1,000 draws a cell at 4,000 paths a world through reduce-negrid-b1.mjs's own items()):

```
  item 1, the gap's ratio about 0.3 (each cell +-0.15): HELD 1.0000 INCONCLUSIVE 0.0000 FALSIFIED 0.0000
  item 1, the gap's ratio about 0.6 (each cell +-0.15): HELD 0.0010 INCONCLUSIVE 0.9990 FALSIFIED 0.0000
  item 1, the gap's ratio about 0.9 (each cell +-0.15): HELD 0.0000 INCONCLUSIVE 0.5310 FALSIFIED 0.4690
  item 2, BASE's error at 0.3 of its coarse one, the gap's ratio about 0.3: HELD 0.7270 INCONCLUSIVE 0.2730 FALSIFIED 0.0000
  item 2, BASE's error at 0.6 of its coarse one, the gap's ratio about 0.3: HELD 0.2690 INCONCLUSIVE 0.7310 FALSIFIED 0.0000
  item 2, BASE's error at 1 of its coarse one, the gap's ratio about 0.9: HELD 0.0000 INCONCLUSIVE 0.8750 FALSIFIED 0.1250
  item 3, a price error of 0.5 points in world 0 (a third of it in worlds 1 and 2): HELD 0.6960 INCONCLUSIVE 0.3040 FALSIFIED 0.0000
  item 3, a price error of 1.5 points in world 0 (a third of it in worlds 1 and 2): HELD 0.0190 INCONCLUSIVE 0.7930 FALSIFIED 0.1880
  item 3, a price error of 3 points in world 0 (a third of it in worlds 1 and 2): HELD 0.0000 INCONCLUSIVE 0.0010 FALSIFIED 0.9990
  item 4, bridge 4 kept: HELD 0.7610 INCONCLUSIVE 0.2390 FALSIFIED 0.0000
  item 4, bridge 4 small: HELD 0.1490 INCONCLUSIVE 0.7640 FALSIFIED 0.0870
  item 4, bridge 4 broken: HELD 0.0000 INCONCLUSIVE 0.0000 FALSIFIED 1.0000
```

Item 1 is deterministic, so its outcome follows the gap's ratio with no sampling noise (a cell's spread alone). Item 2 is weak: half the coarse error is about 1.3 points weighted for BASE and 1.6 for LOR, and LOR's fine table carries the read's gap (6.3457 in world 1 at the coarse grid), so it reads HELD only when the error and the gap both shrink to about a third; it is the likeliest INCONCLUSIVE (0.86) and feeds no row. Item 3 separates a half-point price error (HELD 0.70) from a three-point one (FALSIFIED 1.00) at the judged 5% churn.

## Budget line

From results-derive-negrid-b1.txt section 4 (stage A's and NE-ROOT's logs; the fine solve taken as twice the coarse, judged, NOT CHECKED until the preflight): in all about 14.08 core-hours, the twelve jobs four at a time, about 3.52 h wall at the least (the longest fine job about 2.39 h); an own opening that is neither P nor D adds about 0.54 h a job. Each job may run 8 hours (the batch's timeout). More than the review's 9 core-hours: its estimate counted the runs of one opening a job, B1 runs two.

## Pre-mortem

- **First: the fine grid changes the policy.** P's and D's runs at 60 points follow the 60-point continuation, and item 2 sets their error beside stage A's at the 30-point continuation: each grid's own calibration, not one policy's.
- **Second: item 1's coarse gaps at the forced openings are not on record.** The derivation took them from the two arms' errors at their own openings (-2.2242, 6.3457, 3.0333 by world); a cell under half a point is not counted, and with none counted item 1 reads INCONCLUSIVE.
- **Third: only the wealth axis doubles.** A gap the share axis carries reads FALSIFIED here, which is B2's question, not a failure of the resolution idea.
- **Fourth: the fine solve's cost and memory are judged** from the coarse (twice, linear in cells); the preflight times the small grids, and a fine job past 8 hours is cut off and refused by the gate.
- **Fifth: S224's LOR job is not simulated.** Its identity to BASE rests on its tables, own opening and LOR count, which the gate checks; a difference in its runs alone would go unseen.

## Credence

The maintainer's 'Go ahead' of 5 Oct on the deep review of the prediction record (deep-review-log.md 5 Oct 10:16 UK): write
the judged lines first, then run the derivation script, whose section computes each outcome's probability from stated
priors over the Power section's stories through the decision bands. No cap taken from the scorecard.

Start from the base rate of the item's kind (results-scorecard.txt, KIND BASE RATES, as of this file's writing: Laplace over every scored item of its kind): NOHARM 0.78 (38 of 48), EFFECT 0.70 (18 of 25), ATTRIB 0.50 (25 of 50), SIZE 0.53 (24 of 45), CTRL 0.69 (10 of 14), WHOLE 0.50 (3 of 6); an item leaning on a deep review's cause or story 0.26 (6 of 25).
Items 1-3 rest on the review's ranked causes (RB-INTERP leads at 0.45), so each starts from 0.26; the derivation mixes the receipt's cause credences through the JUDGED stories and section 2's power, which holds item 1 at 0.31 (RB-INTERP's 0.45 through a gap story that halves the gap in under half its draws), item 2 at 0.11 (its weak power) and item 3 at 0.26. Item 4 starts from CTRL's 0.69 and comes down to 0.44 on the judged chance that LOR's world-0 over-read on bridge 4 survives the finer grid.

- **Base rate, item 1:** 0.26 (a deep review's cause: RB-INTERP)
- **Base rate, item 2:** 0.26 (a deep review's cause: RB-INTERP)
- **Base rate, item 3:** 0.26 (a deep review's cause: RB-INTERP, O142's step)
- **Base rate, item 4:** 0.69 (CTRL)
- **Item 1:** HELD 0.31, INCONCLUSIVE 0.53, FALSIFIED 0.17 (derived, results-derive-negrid-b1.txt section 3)
- **Item 2:** HELD 0.11, INCONCLUSIVE 0.86, FALSIFIED 0.02 (derived)
- **Item 3:** HELD 0.26, INCONCLUSIVE 0.37, FALSIFIED 0.37 (derived)
- **Item 4:** HELD 0.44, INCONCLUSIVE 0.45, FALSIFIED 0.12 (derived)
- **Judged:** none (the judged inputs are derive-negrid-b1.mjs's JUDGED block, committed before its output)
- **Kinds:** 1 ATTRIB, 2 ATTRIB, 3 ATTRIB, 4 CTRL

## Changes after seeing results

None.
