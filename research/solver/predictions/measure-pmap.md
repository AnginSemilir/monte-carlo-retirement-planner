# Prediction: measure-pmap

- **Run:** `research/solver/batch-pmap.sh` - results/diagpmap/case0-4.txt (audit-pmap.mjs, one process a household), read by `reduce-pmap.mjs` into results-pmap.txt
- **Kind:** measurement
- **Written:** 4 Oct, before the run (its time is its registering commit's, git log). The design is the deep review after 7av's (deep-review-log.md, 4 Oct 11:37 UK: the position map, the step before 7an), adopted under the maintainer's standing go-ahead of 4 Oct ("I go ahead with your recommendations ... until I say stop"; the ledger's 11:37 and 11:41 rows).
- **Seeds:** 7002 tuning (2,000 paths a world, 7av's). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** none: a measurement. It changes no arm and reads no outcome; it maps where the bridge step reads sit and how much of each falls on unsupported nodes on grids not run.
- **Plan section:** PLAN.md "PMAP" (the schedule), "7an", "COV", O76, O85 and O86 (the register)

## Question

7av's 12-share-point read put S130's step reads wholly on supported nodes. The deep review after 7av read that as node placement. The pre-launch review (deep-review-log.md, 4 Oct 12:01 UK) corrected it: the cause is the width of the top share cell. The top node a = 1 has no accessible money, so it is unsupported in every bridge year with a bill. A read in the top cell carries weight on it whatever the count, and the cell narrows as the count rises: S130's reads straddle the edge at 6 to 9 points and at none from 10. "Placement" and "one position" were overclaims.

Over the bridge households, the questions are:
- where do the step reads sit?
- how many clusters do they form (paths with one move history to the year; 7an's replicates)?
- what share of them, and how much of each read's weight, would fall on unsupported nodes at each share-point count from 6 to 16, and with a coverage node at the edge?
- how much of it is the top share cell (reads with a > 0.8 at 6 points, and reads whose own edge lies there) against the interior?
- which reads sit at a supported position of their own (own accessible money at or above acc*: `stepsup`) and which below it (`stepuns`, where the chance multiplies the read's value out whatever the stencil)?
- under option B (one node per wealth row at its edge), what span is left between the read's own edge and its lower row's?

## Derivation

**The rule, from the code (grade A):**
- reader.js buildReaderTable marks a node unsupported when the reader's chance at its accessible money, W_j (1 - a_i), is under one half.
- That chance rises with accessible money, so each world and year has a threshold acc*, and a wealth row's edge is a*(W_j) = 1 - acc* / W_j.
- A read's stencil is its two wealth rows (grid.js locInto) times its two share nodes (locLinInto). Its unsupported weight is the sum of the corner weights on unsupported nodes.
- So the weight on any share axis follows by arithmetic from the read's position.

**What the run checks before any figure:**
- the arithmetic at 6 share points equals 7av's own measure (the indicator read), read by read;
- the threshold classifies every node of every reader table read as the table does;
- the self-checks (amended before launch): the chance at acc* is at least one half and just below it under, and the coverage weight is never above the 6-point weight, each check run on more than nothing;
- each histogram counts its line's reads.

All the reading is over `stepsup` reads; `stepuns` is printed beside it.

**Amended again before launch** (the post-amendment review, deep-review-log.md 4 Oct 12:21 UK):
- the top cell is read by its weight, not its read count: each line carries the weight on the top node a = 1 at each n (`tw`) and the share of reads in the top cell at each n (`tc`);
- the last bin of the own-money histogram is closed at infinity (a read with acc* = 0 was dropped);
- option B's span uses the finite wealth rows only, and its exposure, span times coverage weight (`spanx`), is printed;
- clusters are replicates per household, world and year, never summed across years (one lineage would count once a year);
- a fault planted in the audit itself (`PMAP_PLANT=acc`, `=cov`) must be refused by its own self-check in the preflight, and any log carrying a plant is refused by the gate.

Years are numbered by the read: a bridge read in year t is the year-t table read after the year-(t - 1) move, so S130's read, which 7av labelled year 0 (its move), is PMAP's year 1.

**From the records:**
- At 6 points S130's step reads carry 0.4045 unsupported weight, and none at 12. S370's carry 0.7443 and 0.5545 by year, against 0.4398 and 0.0741 at 12 (results-7av-observed.txt).
- Every S130 path takes one year-0 move (results/diag7av, the moves lines).

**Nesting:** the 6- and 12-point share axes share only 0 and 1 (grid.js linAxis: nodes at i/(n - 1)). 11 and 16 points keep every 6-point node.

No derivation script: no figure is computed before the run.

## Prediction

- **S130:** one cluster in its bridge read (PMAP's year 1), all in the top share cell at 6 points with its own edge there, carrying about 0.4 unsupported weight, almost all of it on the top node. That weight falls with the count as the top cell narrows past the edge: above 0.03 at 6 to 9 points, under 0.01 from 10 (a few tail reads may cross: cash is a third of S130's accessible money, so a drifts with the equity return, and on paths down 30 to 40% the lower row's edge drops). The coverage node takes it to about 0.
- **S370, bridge 4 and S126:** more clusters (paths differ by year 2). Most of their weight is in the top cell too, so it falls with the count, in steps where the cell passes the edges. The interior's share is the part the top-cell story does not explain. The coverage node removes most of it.
- **Bridge 0 (the control):** no reader year and no read.

## Falsified if

A measurement settles nothing. It is read against this description. These would each be logged in the register:
- S130's mean weight 0.01 or more at any count from 10 points, or 0.03 or less at any count from 6 to 9 (the top-cell story wrong for it);
- the top-cell split INTERIOR at 6 points (the top node carrying a third or less of the panel's unsupported weight);
- a coverage node that leaves much weight;
- an arithmetic that cannot reproduce the measured weight.

The last refuses the run at the gate.

## Fair-test table

One arm (7av's READER/TS+J/W0.02/PCLSI unit at 6 share points); the other grids are arithmetic over its positions, not runs.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - lambda held, no landing |
| 17 | The grid: points, shares, gain buckets | 30 points, 6 shares, run | 6 to 16 shares and the coverage node, by arithmetic over arm A's read positions | ONE ARM ONLY - only 6 share points is run. The other counts are what arm A's reads would carry, with the policy held. A grid that moved the policy would move the reads, which this does not show (7an's fixed-policy re-read does) |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 31 | Paired or not, and the standard error used | counts and means | counts and means | N/A - no comparison carries a standard error |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision fed

7an's design:
- **The arms, by the top-cell split** (the reducer's THE TOP-CELL SPLIT line: the top node's share of the panel's stepsup unsupported weight, at 6 and at 11 points). TOP CELL (two thirds or more): 7an reads its share-count arms as top-cell width (which counts clear each household's edge), per top-cell weight, not as resolution or placement. INTERIOR (a third or less): 7an reads by unsupported-weight group, and the top-cell story is logged as not the main cause. MIXED: both readings, each on its own share of the weight. NONE (no unsupported weight at that count): nothing to split there.
- **The replicates:** the clusters per household, world and year, not the reads.
- **COV:** the coverage node's weight against the 6-point weight, and the histograms of a and own money over acc*, size option A (coverage as a coordinate); option B's leftover span sizes option B. Neither is read as COV's effect: COV is tested at 6 points after 7an.

No default, no product change.

## Provenance

- **The design:** the deep review after 7av (4 Oct 11:37 UK), adopted in the ledger's 11:41 row; 7av's records (results-7av-observed.txt, results/diag7av).
- **The build:**
  - audit-pmap.mjs: 7av's READER PCLSI unit at 6 share points, e3 pinned off; the read's position; the indicator read as 7av's; the threshold and the arithmetic at 6 to 16 and with the coverage node; the node check; amended before launch (the 12:01 review): clusters by move history, the stepsup/stepuns split, the top-cell shares, option B's span, the histograms, the self-checks;
  - reduce-pmap.mjs: stamps; the gate holding the arithmetic to the measured weight within 1e-6 on every line, the node check, the self-checks (each run on more than nothing), the histograms against their reads, the coverage weight under the 6-point weight on every line, the top node's weight under the unsupported weight, a finite exposure, no audit plant, and the control; the reading split by own support with the top-cell weights and the top-cell split; 26 planted cases and an EDGES line; amended again (the 12:21 review): the top node's weight, the closed histogram bin, the finite span and its exposure, clusters per year, the audit plants;
  - batch-pmap.sh, preflight-pmap.sh.

## Point and interval

80% intervals, the author's:
- **S130's bridge reads (PMAP's year 1):** 1 cluster (1 to 3), all in the top cell at 6 points. The weight at 6 points is 0.4045 (as 7av measured), 0.38 to 0.41 of it on the top node. Above 0.03 at 6 to 9 points, under 0.01 at 10 to 16.
- **The top-cell split at 6 points:** TOP CELL, the top node's share 0.85 (0.6 to 1).
- **The panel's share of stepsup reads in the top cell at 6 points:** 0.8 (0.5 to 1).
- **The panel's mean weight with the coverage node:** 0.02 (0 to 0.1).

## Budget line

Five 6-point solves with forward runs at 30 points, about 30 to 45 minutes each (7av's 6-point units: solves of 1,584 to 2,466 s and forward runs of about 20 minutes, plus the arithmetic). About 3 core-hours, about 1 hour on four cores. It runs after E3c (the cores).

## Changes after seeing results

None. Amended before launch (the pre-launch review, 4 Oct 12:01 UK): the question and prediction corrected from placement to the top cell's width; replicates as clusters; the stepsup/stepuns split, top-cell shares, option B's span, histograms and self-checks added; e3 pinned off. No result had been seen. Amended again before launch (the post-amendment review, 4 Oct 12:21 UK): the top cell read by weight with a numeric cut, the falsifier given a tolerance (the hard zero was the review's overclaim), the histogram bin, the span, clusters per year, the audit plants, the year labels. No result had been seen.
