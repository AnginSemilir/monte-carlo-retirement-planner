# Prediction: diag-7at

- **Run:** `research/solver/batch-7at.sh` - results/diag7at/case0-5.txt (audit-7at.mjs, six READER units, one process a unit), read beside 7ar's records (results/diag7ar) and 7ap's (results/diag7ap); reduced by `reduce-7at.mjs` in the real tree into results-7at.txt
- **Kind:** test
- **Written:** 3 Oct, 22:35 UK, before the run (its time is its registering commit's, git log); the maintainer's go-ahead of 3 Oct 20:04 UK ('yes, design 7at after 7ar reads') scoped 20:41 UK to the allowance part ('ok, run the allowance part after 7ar reads'); redesigned by the deep review after 7ar (deep-review-log.md, 3 Oct 21:52 UK) and the plan-auditor's BLOCKING 1 of 3 Oct 22:08 UK (judged after access only); read (b) is the maintainer's stand-in for 7ar in O71's condition (3 Oct 22:14 UK)
- **Seeds:** 7002 tuning (2,000 paths a world at each of the three worlds' nodes, the same paths in every arm, as 7ap and 7ar). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** the WALL axis, like 7ap's interpolated axis, removes a known error - the used-allowance axis's absorbing snap (O71), which drives the snap's after-access optimism (S370 6.9393, S130 6.8291 points, three worlds pooled, results-7ap.txt). Removing it raised the bridge stage's optimism (O76), which the deep review after 7ar ranks to a second error the snap had been offsetting: the reader's flat copy of the continuation across the last bridge year's step (reader.js l.106-112). Item 1 judges the axis only where the reads are fully supported (after access), so the unmasked error cannot count against it; items 3 and 4 tell the two errors apart: read (b) replaces the flat copy with an extrapolation along the share row, and if the bridge rise goes with it, the rise is the reader's (unmasking), not the axis's. Nothing here is adopted.
- **Plan section:** PLAN.md "7at"

## Question

(1) Does the used-allowance axis with a bucket at the wall (0, 0.5, 0.75 and 1, interpolated: WALL), the grid point at the cliff the plan's own inputs locate, read calibrated after access on S370 and S130? (2) Does the bucket change the after-access residual against 7ap's interpolation alone (PCLSI) by more than a point? (3) Is O76's bridge rise the reader's flat copy: does read (b), the same tables read with the reader's continuation extrapolated along the share row in place of the flat copy, take away two thirds or more of the read term's rise on S130 (the deep review's decisive read)? (4) And on S370?

## Derivation

- **What the records give** (derive-7at.mjs, results-derive-7at.txt):
  - Item 1's nearest arm, 7ap's PCLSI, after access, three worlds pooled: S370 point 0.7030 (CP 71.7385 to 74.0315 against the band 71.5994 to 75.5994: CALIBRATED with 0.1390 to spare below); S130 point 0.8609 (CP 79.9331 to 81.9367 against 79.8109 to 83.8109: 0.1221 to spare). The CP half-widths (1.1465 and 1.0018) mean CALIBRATED needs a point inside +/- 0.8535 (S370) and +/- 0.9982 (S130). So a WALL arm at PCLSI's points sits at the edge on both.
  - Item 2: the snapped axis's after-access change against PCLSI was 6.2362 points (S370) and 5.9682 (S130): an axis change has moved this read by several points before. The per-path pairing of WALL against PCLSI is in no record: unpaired, the outcome's per-path sd (62.86 and 55.54) gives a standard error of 0.8212 and 0.7170, above the 0.6079 the TOST at a point needs even with D at 0; paired on the same shocks with few outcome flips, the sd is the claims' change alone (NOT CHECKED).
  - Item 3: 7ar's S130 world-0 read-term rise Rd, per path: mean 2.2054, sd 0.3066 over 2,000 paths; the bands two thirds 1.4703 and a third 0.7351. The bridge reads: year 0 all 2,000 at an unsupported weight of 0.40, year 1 none; so read (b) acts on year 0's read alone.
  - Item 4: S370 has no decomposition in any record: its world-0 bridge stage rose 3.3551 to 8.4007 (the rise 5.0456; access at year 8); how much is the read term is NOT CHECKED - item 4's premise reads it.
- **Read (b)** (grade A for the construction, extrap-7at.mjs and its planted cases): the reader splits each node's survival S_i into p_i c_i + R_i and copies c from the nearest supported node to the unsupported nodes of a share row. Read (b) extrapolates c linearly in the share from the nearest supported node and the next one beyond it on the same side, clipped to 0 to 1, and sets R_i = S_i - p_i c_i, so every node still reproduces S_i; a row with one supported node on the near side keeps the flat copy, a row with none keeps the reader's row copy. Only reads with unsupported weight can move (the gate holds read (b) to the read elsewhere).
- **Read (c)** (the claim at the path's position with its share moved to the last supported node) is not built: moving the share moves money between pots and so the year's tax path, not only the read.
- **Claude's choices, before any run:** WALL's buckets (0, 0.5, 0.75 and 1: the wall at 0.75, O71); the margin of 1 point for item 2 (half 7ap's calibration margin, a sixth of the change the axis made before); world 0 for items 3 and 4 (where 7ar read the rise); a third and two thirds as the bands (7ar's).

## Prediction

Item 1 INCONCLUSIVE (WALL's after-access points near PCLSI's, at the edge of the band on at least one household). Item 2 HELD (the bucket moves the after-access residual by under a point on both). Item 3 HELD (read (b) takes two thirds or more of the read term's rise away on S130). Item 4 HELD.

## Falsified if

Item 1: either WALL unit reads OPTIMISTIC or PESSIMISTIC after access. Item 2: either household's WALL-less-PCLSI difference beyond a point (Holm over 4). Item 3: read (b) takes a third of the S130 rise or less (the test of mean(Rd/3 - X) above 0 under 0.05 after Holm). Item 4: the same on S370.

## Fair-test table

Arm A is DEFAULT (the allowance axis snapped on 0, 0.5, 1; S130's held line for line to 7ar's unit 0, S370's to 7ap's unit 0); arm B is WALL (interpolated on 0, 0.5, 0.75, 1). The reference arm PCLSI (interpolated on 0, 0.5, 1; S130's held to 7ar's unit 1, S370's to 7ap's unit 1). Read (b) is a second read of the same tables in every arm. Every arm runs the same 2,000 paths a world (seed 7002), so per-path terms pair.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held |
| 17 | The grid: points, shares, gain buckets | 30 points; the allowance axis 0, 0.5, 1 by nearest snap | the axis 0, 0.5, 0.75, 1 interpolated (the reference PCLSI: 0, 0.5, 1 interpolated) | TESTED - the allowance axis alone; the gate holds the axis line and every other line |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the bridge reader | the bridge reader | SAME - read (b), the reader's continuation extrapolated, is a second read of the same tables in every arm (items 3 and 4), not a setting of any solve |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this run (the code as it stands) | this run | SAME - every arm in this run; DEFAULT and PCLSI also held line for line to 7ar's records (S130) and 7ap's (S370): the same solver code (code id), the audit adding lines and changing none |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | item 1: the after-access claim against simulated survival (7ap's); items 3 and 4: the bridge stage's read term per path and read (b)'s | the same | SAME - one definition in every arm; read (b)'s term is new (audit-7at.mjs's bdec and pbstage lines), the gate holding it to the read wherever the read has no unsupported weight |
| 31 | Paired or not, and the standard error used | item 1 unpaired by unit (7ap's rule: exact binomial tails, Clopper-Pearson); items 2 to 4 paired by path | the same | SAME - Fisher's paired randomization test on per-path differences for items 2 to 4 (no standard error enters a reading) |
| 32 | The table's number is never the result: survival is simulated | items 3 and 4 read the tables' consistency along simulated paths | the same | ACCEPTED - items 3 and 4 are a diagnostic of the tables' own read; item 1, the allowance part's verdict, reads simulated survival |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** item 1, each WALL unit's after stage (the stage lines: paths alive at access, their mean claim, the survivors), three worlds pooled as 7ap pooled them; item 2, each path's after-access residual (pafter) under WALL and PCLSI, on the paths with a claim at access in both, the three worlds pooled; items 3 and 4, each path's world-0 bridge-stage read term (pstage, the middle term) and read (b)'s term (pbstage) under DEFAULT and PCLSI, paired by path.
- **The test:** item 1, 7ap's two-sided rule (reduce-7ap.mjs calib: the lower binomial tail at c - 2 and the upper at c + 2, Holm over the 2 units on each side; CALIBRATED when the Clopper-Pearson 95% interval is inside c +/- 2). Items 2 to 4, Fisher's paired randomization test of a mean above 0, one-sided (sign-flip, B = 20,000 flips from fixed seeds, p = (1 + flips at or above) / (1 + B)): exact under a null symmetric about 0, approximate for a mean under a skewed null (7ar's planted size check). ALPHA 0.05.
- **Item 1 (primary; single look):** HELD when both WALL units read CALIBRATED; FALSIFIED when either reads OPTIMISTIC or PESSIMISTIC; else INCONCLUSIVE.
- **Item 2 (single look):** D_j = the after-access residual under WALL less under PCLSI; M = 1 point. A household reads EQUIVALENT when both tests of mean(M - D) above 0 and mean(D + M) above 0 are under 0.05 (TOST); DIFFERS when the test of mean(D - M) above 0 or of mean(-M - D) above 0 is under 0.05 after Holm over the 4 (two households, two directions); else INCONCLUSIVE. HELD when both read EQUIVALENT; FALSIFIED when either DIFFERS; else INCONCLUSIVE.
- **Item 3 (single look; S130):** Rd_j = the read term under PCLSI less under DEFAULT, Rb_j the same for read (b), X_j = Rd_j - Rb_j. The premise: the test of mean Rd above 0 under 0.05, else INCONCLUSIVE (NO RISE). HELD when the test of mean(X - 2Rd/3) above 0 is under 0.05 after Holm over the item's two directions; FALSIFIED when the test of mean(Rd/3 - X) above 0 is; else INCONCLUSIVE.
- **Item 4 (single look; S370):** as item 3, its own premise and Holm pair.
- **Reported, not items:** each arm's after-access read by world and pooled (7ap's rule on every arm, for comparison); the bridge stage's three terms and read (b)'s term by world and arm; the read term's level and read (b)'s (world 0, PCLSI) and the share taken away; WALL's rise against DEFAULT split the same way (descriptive); read (b) by year with the unsupported weight, the flat copy's stencil sum, its extrapolation, the unsupported corners' own survival and the reads read (b) moved; the whole plan's claim less simulation by world beside the year-0 read term (reported, not judged: the year-0 read leans on unsupported nodes; the plan-auditor's BLOCKING 1 of 3 Oct 22:08 UK); the residual at the wall and the draw stall; the tables and the extrapolation counts.
- **NOT SETTLED:** any gate fails (the stamps of 7at, 7ar and 7ap; a unit missing, twice, not done or unregistered; an axis not its arm's; S130 DEFAULT or PCLSI not 7ar's unit line for line, or S370's not 7ap's; a WALL unit's ran, joint or access line not its DEFAULT twin's; 7ar's checks or 7ap's on any unit; a missing bdec, pbstage, pafter or xcount line; read (b) off the read, or moving it, where the read has no unsupported weight; the unsupported sums outside 0 to 100; the pbstage sums off the bdec lines; the pafter claims off the after stage's paths or mean; read (b) moving no world-0 bridge read on some unit - a read that cannot move cannot answer items 3 and 4, O79).
- **Declared choices, not derived:** WALL's buckets; M = 1 point; world 0; the third and two thirds; B = 20,000.

## Decision fed

- **Item 1 HELD, item 2 HELD:** the bucket at the wall calibrates after access but changes nothing against interpolation alone: for the allowance axis, the cliff point adds nothing; the recommendation put to the maintainer is interpolation without the extra bucket. No default change (any allowance-axis default waits on O71's condition and Phase 4).
- **Item 1 HELD, item 2 FALSIFIED:** the bucket changes the after-access read by more than a point; its direction (reported) decides: closer to calibration than PCLSI, WALL joins pclsInterp as the allowance-axis candidate (O71's condition still applies: with the reader's fix, after read (b) names the flat copy and the fix works); further, WALL is dropped.
- **Item 1 FALSIFIED:** WALL is miscalibrated after access: not a candidate; a deep review ranks before any allowance-axis design.
- **Item 1 INCONCLUSIVE:** WALL not shown calibrated: not a candidate on this run; item 2 says whether it differs from PCLSI (HELD: the two read alike, and PCLSI's 7ap reading stands for both).
- **Item 3 HELD:** the reader's flat copy is named for O76 (grade B: one household, one seed; with item 4 HELD, two households). O71's condition's first half is met (read (b) names the flat copy): a reader-side fix (the continuation extrapolated along the share row in the solve's own reads, a research option) is registered as its own test and run on the charge (P) before it joins the research candidate; 7at's bridge part (a coverage coordinate) goes back to the maintainer with the recommendation that it is not needed for O76 if the reader-side fix works.
- **Item 3 FALSIFIED:** the flat copy is not the cause; the deep review's cause 2 (wealth-axis interpolation near the cliff) is next; 7at's bridge part goes back to the maintainer with the recommendation to build it (it reaches the step); pclsInterp stays out.
- **Item 3 INCONCLUSIVE:** item 4, if it reads HELD or FALSIFIED, carries the decision at grade C; else a deep review ranks before any fix.
- **Item 4:** read with item 3 as above; alone it does not name a cause (S370's read term was never decomposed).
- **In every branch:** no default change, no product change (O71: none before Phase 4), no 7u, no seed 7013; the draw-pause measurement (O71, O77) is not affected.

## Provenance

- The design: the maintainer's go-ahead (3 Oct 20:04 UK) and scope (20:41 UK); the deep review after 7ar (deep-review-log.md, 3 Oct 21:52 UK: no acceptance test on the absence of a bridge rise; read (b) as the decisive read; no OFF control; a responsiveness check before any item reads a control); the plan-auditor's BLOCKING 1 of 3 Oct 22:08 UK (after access only); the maintainer's answers of 3 Oct 22:14 UK; PLAN.md 7at, O71, O76, O79.
- The build: audit-7at.mjs (7ar's audit with read (b) and its sums added; its 7ar lines unchanged, so S130 DEFAULT and PCLSI are held to 7ar's records and S370's to 7ap's); extrap-7at.mjs; reduce-7at.mjs (planted cases with OUTCOMES REACHED on all four items and an EDGES line; 7ar's and 7ap's checks re-run on every unit; mutations, results-reduce-7at-mutations.txt); preflight-7at.sh and preflight-parse-7at.mjs; derive-7at.mjs; batch-7at.sh.
- The records: results-7ar.txt, results-7ap.txt and their runs (results/diag7ar, results/diag7ap), read only through their stamps.

## Derivation script

- `derive: research/solver/derive-7at.mjs > research/solver/results-derive-7at.txt sha256 48dfdd956ec1af17`
  (item 1's nearest arm and its room in the band; item 2's earlier axis change and the bounds on its power; item 3's rise and bands; item 4's stage rise; the time).

## Point and interval

80% intervals, the author's:
- Item 1: WALL's after-access points S370 0.6 (-0.5 to 2.0), S130 0.8 (-0.5 to 2.0).
- Item 2: D S370 -0.1 (-0.8 to 0.6), S130 -0.1 (-0.8 to 0.6).
- Item 3: the share of S130's read-term rise read (b) takes away 0.8 (0.2 to 1.2).
- Item 4: S370's share 0.6 (-0.2 to 1.2).

## Credence

The author's probability that each item reads as predicted: 1 (INCONCLUSIVE), 0.5; 2 (HELD), 0.5; 3 (HELD), 0.55; 4 (HELD), 0.4. Item 1: PCLSI was CALIBRATED with about an eighth of a point to spare at its lower end on both, and WALL differs from it only above a used share of 0.5. Item 2: the same reason makes a difference under a point likely, but its power rests on the pairing, which no record shows. Item 3: the deep review's mechanism fits 7ar's year-0 location and the supported years' clean reads, but the share row's nodes past the step may carry values the linear extrapolation over- or undershoots. Item 4: S370's longer bridge and its spike at the read of its last bridge year (plan year 6, results-7ap.txt) fit the same mechanism, but its read term was never split.

## Power

- **Item 1** (results-derive-7at.txt): CALIBRATED needs a point within +/- 0.8535 (S370) or +/- 0.9982 (S130); PCLSI's points 0.7030 and 0.8609 sit inside by 0.15 and 0.14. A WALL arm within a few tenths of PCLSI reads either CALIBRATED or INCONCLUSIVE; OPTIMISTIC needs a point of 2 or more with the tail significant.
- **Item 2:** unpaired, not met even at D = 0 (standard errors 0.8212 and 0.7170 against the 0.6079 needed); paired on the same shocks, the per-path sd is the claims' change plus the outcome flips between the arms (NOT CHECKED): with flips under about 5% of paths and claim changes under a point, the standard error falls under 0.3 and the TOST resolves; with more, item 2 reads INCONCLUSIVE.
- **Item 3** (results-derive-7at.txt): Rd's sd 0.3066 over 2,000 paths; at a share taken away of 1 or 0, z 101.72 with X's own noise at Rd's sd (321.67 with none); a share near a band edge reads INCONCLUSIVE.
- **Item 4:** NOT CHECKED (no decomposition of S370 in any record); its premise reads it.
- **Time** (results-derive-7at.txt): 7ap's S370 units and 7ar's S130 units as measured, the S370 WALL solve by 7ar's four-bucket cost (1.56): 20,735 s, 5.76 core-hours, about 1.72 hours on four cores longest first; read (b)'s four extra stencil reads a bridge read NOT CHECKED (the preflight times them).

## Budget line

O76's decisive read and the maintainer's allowance part, after 7as: about 5.8 core-hours, about 1.7 hours on four cores.

## Pre-mortem

- **Most likely:** item 1 INCONCLUSIVE on one household (its CP lower end just under c - 2), item 2 HELD or INCONCLUSIVE, item 3 HELD.
- **Second:** item 3 INCONCLUSIVE because the linear extrapolation overshoots on some rows and undershoots on others (the share taken away between a third and two thirds), the clipped rows adding noise: the deep review's cause 1 then stands at grade C and item 4 decides.
- **Third:** NOT SETTLED - read (b) moves no world-0 bridge read on some unit because the rows the year-0 stencil touches have only one supported node on the near side (the flat copy kept). The gate refuses it as a read that cannot move; the extrapolation counts (xcount) and the preflight show it first.
- **Fourth:** NOT SETTLED - S130 DEFAULT or PCLSI not 7ar's unit. Unlikely from code: audit-7at.mjs prints 7ar's lines through the same code, read (b) reading only; the solver files unchanged since 7ar ran (code id).
- **The smoke run:** smoke.sh (locked) does not run audit-7at.mjs; the preflight through the launcher (preflight-7at.sh: all six units at 4 points, read by preflight-parse-7at.mjs through the reducer's own parse, gate and reading, with planted faults) stands in, and the launcher's smoke run covers the solver code every solve here calls.

## Changes after seeing results

None.
