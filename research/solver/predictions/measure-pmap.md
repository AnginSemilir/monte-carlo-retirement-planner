# Prediction: measure-pmap

- **Run:** `research/solver/batch-pmap.sh` - results/diagpmap/case0-4.txt (audit-pmap.mjs, one process a household), read by `reduce-pmap.mjs` into results-pmap.txt
- **Kind:** measurement
- **Written:** 4 Oct, before the run (its time is its registering commit's, git log). The design is the deep review after 7av's (deep-review-log.md, 4 Oct 11:37 UK: the position map, the step before 7an), adopted under the maintainer's standing go-ahead of 4 Oct ("I go ahead with your recommendations ... until I say stop"; the ledger's 11:37 and 11:41 rows).
- **Seeds:** 7002 tuning (2,000 paths a world, 7av's). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** none: a measurement. It changes no arm and reads no outcome; it maps where the bridge step reads sit and how much of each falls on unsupported nodes on grids not run.
- **Plan section:** PLAN.md "PMAP" (the schedule), "7an", "COV", O76, O85 and O86 (the register)

## Question

7av's 12-share-point read put S130's step reads wholly on supported nodes. The deep review read that as node placement: all of S130's reads sit at one position, and the 12-point lattice happened to put a node between that position and the bill's edge. It is not resolution.

Over the bridge households, the questions are:
- where do the step reads sit?
- how many distinct positions do they take (7an's replicates)?
- what share of them, and how much of each read's weight, would fall on unsupported nodes at each share-point count from 6 to 16, and with a coverage node at the edge?

## Derivation

**The rule, from the code (grade A):**
- reader.js buildReaderTable marks a node unsupported when the reader's chance at its accessible money, W_j (1 - a_i), is under one half.
- That chance rises with accessible money, so each world and year has a threshold acc*, and a wealth row's edge is a*(W_j) = 1 - acc* / W_j.
- A read's stencil is its two wealth rows (grid.js locInto) times its two share nodes (locLinInto). Its unsupported weight is the sum of the corner weights on unsupported nodes.
- So the weight on any share axis follows by arithmetic from the read's position.

**What the run checks before any figure:**
- the arithmetic at 6 share points equals 7av's own measure (the indicator read), read by read;
- the threshold classifies every node of every reader table read as the table does.

**From the records:**
- At 6 points S130's step reads carry 0.4045 unsupported weight, and none at 12. S370's carry 0.7443 and 0.5545 by year, against 0.4398 and 0.0741 at 12 (results-7av-observed.txt).
- Every S130 path takes one year-0 move (results/diag7av, the moves lines).

**Nesting:** the 6- and 12-point share axes share only 0 and 1 (grid.js linAxis: nodes at i/(n - 1)). 11 and 16 points keep every 6-point node.

No derivation script: no figure is computed before the run.

## Prediction

- **S130:** a handful of distinct step-read positions at most (one in year 0), carrying about 0.4 unsupported weight at 6 points. That weight is not monotone across 6 to 16: zero at some counts, including 12, and above zero at others. The coverage node takes it to about 0.
- **S370, bridge 4 and S126:** more positions (paths differ by year 2). Their mean weight still varies irregularly with the count, but less sharply, and the coverage node removes most of it.
- **Bridge 0 (the control):** no reader year and no read.

## Falsified if

A measurement settles nothing. It is read against this description. These would each be logged in the register:
- a weight that falls smoothly with the count on every household (resolution after all);
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
- **The arms.** If the weight is irregular in the count (placement), 7an reads by unsupported-weight group, and its 11- and 12-point arms are read as placement draws, not resolution. If it falls smoothly (resolution), 7an's arms read resolution directly.
- **The replicates:** the distinct positions per household, world and year.
- **COV's case:** the coverage node's weight is the share of the straddle COV removes by construction.

No default, no product change.

## Provenance

- **The design:** the deep review after 7av (4 Oct 11:37 UK), adopted in the ledger's 11:41 row; 7av's records (results-7av-observed.txt, results/diag7av).
- **The build:**
  - audit-pmap.mjs: 7av's READER PCLSI unit at 6 share points; the read's position; the indicator read as 7av's; the threshold and the arithmetic at 6 to 16 and with the coverage node; the node check;
  - reduce-pmap.mjs: stamps; the gate holding the arithmetic to the measured weight within 1e-6 on every line, the node check and the control; the reading; 15 planted cases and an EDGES line;
  - batch-pmap.sh, preflight-pmap.sh.

## Point and interval

80% intervals, the author's:
- **S130's year-0 step reads:** 1 distinct position (1 to 3). The weight at 6 points is 0.4045 (as 7av measured). Zero at 12 points; above zero at 3 or more of the other counts from 7 to 16.
- **The panel's mean weight with the coverage node:** 0.02 (0 to 0.1).

## Budget line

Five 6-point solves with forward runs at 30 points, about 30 to 45 minutes each (7av's 6-point units: solves of 1,584 to 2,466 s and forward runs of about 20 minutes, plus the arithmetic). About 3 core-hours, about 1 hour on four cores. It runs after E3c (the cores).

## Changes after seeing results

None.
