# Prediction: diag-7av

- **Run:** `research/solver/batch-7av.sh` - results/diag7av/case0-6.txt (audit-7av.mjs, seven units, one process a unit), read beside 7at's records (results/diag7at); reduced by `reduce-7av.mjs` in the real tree into results-7av.txt
- **Kind:** test
- **Written:** 4 Oct, before the run (its time is its registering commit's, git log); the maintainer's go-ahead of 4 Oct ('Run 1': decision 1 of the morning list, the step-read test run on its own); designed by the deep review after 7at (deep-review-log.md, 4 Oct 03:18 UK)
- **Seeds:** 7002 tuning (2,000 paths a world at each of the three worlds' nodes, the same paths in every unit, as 7at). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** the test fixes nothing: it reads the same tables four ways. But the reads it tests are the next fix of family 3 (a reader-side change at step reads), and the deep review registered what such a fix exposes: the spread reads' pessimism (O81), so far cancelled in the aggregate bridge terms by the step reads' optimism (O76), would show once the step reads are corrected (S370's bridge read term about -1.7 in world 0 and -4.0 in world 1, the review's estimate). The items read step and spread reads apart (item 3 reads the spread reads alone), so a step-read fix can never be credited or blamed with the spread reads' error, and no aggregate bridge term is read as an item.
- **Plan section:** PLAN.md "7av"

## Question

The deep review after 7at split the reader's bridge reads into STEP reads (the year's reference chance a pure step: the last bill before access, or a step before an inflow) and SPREAD reads, and ranked for O76's optimism at the step reads (1) the reader's flat copy of its continuation, limited by the 6 share points; (2) the value bending near the bill on the funded side, which a straight line misses; (3) wealth-axis interpolation (weak). (1) Does the flat copy's step-read error shrink to 0.6 of itself or less at 12 share points (cause 1), or stay at 0.9 or more (cause 3)? (2) At 6 share points, does a quadratic through three supported nodes leave a third or less of the straight line's step-read residual (cause 2)? (3) On S370, does the reference drawn in the menu's order shrink the spread reads' pessimism by half or more (O81 is O36's proportional reference)? (4) Is the bridge part (a coverage coordinate) needed: does neither the straight line nor the quadratic at 12 share points bring the step reads within half a point?

## Derivation

- **What the records give** (derive-7av.mjs, results-derive-7av.txt), world 0, per path over the bridge, the step years the deep review's (S130 plan year 0; S370 years 2 and 6):
  - The step reads' flat term F6 under PCLSI: S130 4.8888, S370 10.0493 (DEFAULT 2.6291 and 5.9386); the straight line L6: S130 1.3586, S370 1.4610. The spread reads' flat term P6: S130 0.0284, S370 -1.6745 (the straight line on them -10.1670: read (b)'s overshoot, O80).
  - The straight line at step reads takes away 0.64 of S130's rise and 0.73 of S370's - the review's figures, reproduced from 7at's lines; the 6-point units here repeat 7at's (the gate holds them line for line), so these are reproductions, not predictions.
  - The per-path spread (PCLSI): S130's read term sd 0.34, read (b)'s 0.26; S370's 5.07 and 2.77 (S370's mixes its step and spread reads; the step part's own sd is NOT CHECKED).
- **The step class** (grade A for the construction: extrap-7av.mjs isStep, reduce-7av.mjs's planted cases): a table whose reference chance is 0 or 1 at every node is a step; the audit classes every read by its own table, so the run checks the review's step years rather than assuming them.
- **The quadratic** (grade A for the construction): the Lagrange polynomial through the nearest three supported nodes on the near side, clipped to 0 to 1, R = S - p c so every node reproduces S; two supported nodes fall back to the straight line (counted), one keeps the flat copy; the straight line is 7at's read (b) to the bit (a planted check).
- **12 share points** (grid.js makeGrid `shares`: both share axes, a and b, at 12; solvePlan passes the option through): the grid's other axes and every other setting unchanged; the gate holds each 12-point unit's ran line to its 6-point twin's but for the grid.
- **Claude's choices, before any run:** the bands 0.6 and 0.9 for item 1 (the review's 'about halves' inside 0.6; 'no change' at 0.9 or more), a third and two thirds for items 2 and 3's quarter and half (7ar's and 7at's bands where they apply), the bar of 0.5 points for item 4 (the review's own), world 0 (where the rise was read), the quadratic's three nodes.

## Prediction

Item 1 HELD (the flat copy's step error at 12 share points about half of that at 6 on both households). Item 2 INCONCLUSIVE (the quadratic takes some of the straight line's residual away but not two thirds on both). Item 3 HELD ('order' shrinks S370's spread pessimism by half or more). Item 4 HELD (a step-only read at 12 points within half a point on both: the bridge part not needed).

## Falsified if

Item 1: either household's step error at 12 points 0.9 of that at 6 or more (Holm over 4). Item 2: the quadratic takes away a third of the straight line's residual or less on either household. Item 3: 'order' shrinks the spread pessimism by a quarter or less. Item 4: on either household both the straight line and the quadratic at 12 points beyond half a point (Holm over 8).

## Fair-test table

Arm A is S130 and S370 READER under PCLSI at 6 share points (7at's units 1 and 4, held line for line to 7at's records); arm B is the same at 12 share points (item 1; item 4 reads arm B alone); the read is the thing compared for item 2 (the straight line against the quadratic on arm A's tables); item 3's arm B is S370 under PCLSI at 6 with the reference drawn in the menu's order. DEFAULT at 6 (7at's units 0 and 3) is the reference for the rise (reported). Every unit runs the same 2,000 paths a world (seed 7002), so per-path terms pair.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held |
| 17 | The grid: points, shares, gain buckets | 30 points, 6 share points, the allowance axis interpolated | 30 points, 12 share points (item 1) | TESTED - the share points alone (item 1); the gate holds the ran line but for the grid |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the bridge reader, its reference proportional | the reader with readerRef 'order' (item 3) | TESTED - the reference alone (item 3); the step class and the four reads are second reads of the same tables in every unit, not a setting of any solve |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this run (the code as it stands) | this run | SAME - every unit in this run; the 6-point READER units also held line for line to 7at's records: the same solver code (code id), the audit adding lines and changing none |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | the step and spread reads' terms per path (the read less the claim at t + 1), by read | the same | SAME - one definition in every unit; the split is new (audit-7av.mjs's sdec and psplit lines), the gate holding its sums to 7ar's read term and 7at's read (b) by year and path |
| 31 | Paired or not, and the standard error used | paired by path | paired by path | SAME - Fisher's paired randomization test on per-path differences (no standard error enters a reading) |
| 32 | The table's number is never the result: survival is simulated | the tables' consistency along simulated paths | the same | ACCEPTED - a diagnostic of the tables' own reads, as 7ar's and 7at's; no survival claim is made from it |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** each unit's world-0 psplit line: per path, the bridge stage's step flat, step straight line, step quadratic, spread flat, spread straight line and other terms, paired by path across units.
- **The test:** Fisher's paired randomization test of a mean above 0, one-sided (sign-flip, B = 20,000 flips from fixed seeds, p = (1 + flips at or above) / (1 + B)), as 7ar's and 7at's. ALPHA 0.05.
- **Item 1 (single look):** per household, F6 and F12 the step flat term under PCLSI at 6 and 12. Premise: mean F6 above 0 (p under 0.05), else INCONCLUSIVE (NO STEP ERROR). HELD when the test of mean(0.6 F6 - F12) above 0 is under 0.05 after Holm over 4 (two households, two directions); FALSIFIED when the test of mean(F12 - 0.9 F6) above 0 is; else INCONCLUSIVE. The item HELD when both households read HELD; FALSIFIED when either reads FALSIFIED; else INCONCLUSIVE.
- **Item 2 (single look):** per household, L6 and Q6 the step straight-line and quadratic terms under PCLSI at 6. Premise: mean L6 above 0, else INCONCLUSIVE (NO RESIDUAL). HELD when both tests mean(L6/3 - Q6) above 0 and mean(Q6 + L6/3) above 0 are under 0.05 (the larger p, Holm over 4); FALSIFIED when the test of mean(Q6 - 2 L6/3) above 0 is; else INCONCLUSIVE; flagged OVERSHOT when the test of mean(-L6/3 - Q6) above 0 is under 0.05. The item as item 1.
- **Item 3 (single look; S370):** P6 and O6 the spread flat term under PCLSI at 6 with the reader's reference and with 'order''s. Premise: the test of mean(-P6) above 0 under 0.05, else INCONCLUSIVE (NO SPREAD PESSIMISM). HELD when the test of mean(O6 - P6/2) above 0 is under 0.05 after Holm over 2; FALSIFIED when the test of mean(0.75 P6 - O6) above 0 is; else INCONCLUSIVE.
- **Item 4 (single look):** per household, L12 and Q12 the step straight-line and quadratic terms under PCLSI at 12. A read is UNDER when both tests mean(0.5 - X) above 0 and mean(X + 0.5) above 0 are under 0.05 (the larger p, Holm over the household's two reads); OVER when the test of mean(X - 0.5) above 0 or of mean(-0.5 - X) above 0 is under 0.05 after Holm over 8. HELD (the bridge part not needed) when on both households a read is UNDER; FALSIFIED (needed) when on either household both reads are OVER; else INCONCLUSIVE.
- **Reported, not items:** each unit's bridge-stage step, spread and other terms by world under each read; the step and spread reads by year (count, the three reads, the unsupported weight, the reads the quadratic moved); the straight line at step reads' share of the whole rise at 6 points; the extrapolation's node, fall-back and clip counts; the tables.
- **NOT SETTLED:** any gate fails (the stamps of 7av and 7at; a unit missing, twice, not done or unregistered; an axis, grid or reference not the unit's; a 6-point READER unit not 7at's line for line; a 12-point or ORDER unit's ran line not its twin's but for the grid and the reference, or its access or joint line not its twin's; 7at's checks, 7ar's or 7ap's on any unit; a missing sdec, psplit or qcount line; a split off the reads; the flat reads off the read term or the straight-line reads off read (b); a straight line or quadratic off the flat read where the reads carry no unsupported weight; a psplit path off its pstage and pbstage terms or a column off the sdec lines; no world-0 bridge step read on a unit; the quadratic moving no bridge step read on a PCLSI READER unit).
- **Declared choices, not derived:** the bands 0.6 and 0.9 (item 1), a third and two thirds (item 2), a half and three quarters (item 3), the bar 0.5 (item 4), world 0, three nodes for the quadratic, B = 20,000.

## Decision fed

Every fix, the bridge part and any candidacy are the maintainer's (the ledger's 3 Oct 22:14 row; the deep review after 7at's STOP list):
- **Item 1 HELD and item 4 HELD:** the flat copy at step reads is resolution-limited, and a step-only read at 12 points brings the step reads within half a point. Put to the maintainer with Claude's recommendation: the bridge part (a coverage coordinate) not needed; a reader-side step-only fix (the read item 4 found UNDER; if both, the straight line, the simpler) registered as its own test, on the charge (P), with O81's exposure pre-registered, before it joins the research candidate; 12 share points not proposed as a grid default by this run (its cost against gate 5 is 7an's question).
- **Item 1 HELD, item 4 FALSIFIED or INCONCLUSIVE:** resolution helps but a step-only read at 12 points does not reach half a point: the coverage coordinate recommended to the maintainer (at step reads its support edge is coverage 1, so it removes the extrapolation by construction).
- **Item 1 FALSIFIED:** the step error does not shrink with share spacing: cause 3 (wealth-axis interpolation) or another; the coverage coordinate recommended to the maintainer, a deep review ranking first.
- **Item 1 INCONCLUSIVE:** cause 1 at grade C at most; a deep review before any fix is put to the maintainer.
- **Item 2 HELD:** curvature carries the straight line's residual at 6 points: the quadratic at step reads put to the maintainer as a reader-side fix to test at the grid as it is (no grid cost). FALSIFIED: the quadratic dropped. INCONCLUSIVE: no fix rests on it.
- **Item 3 HELD:** O81 named as O36's proportional reference at the spread reads (grade B, one household): the order reference comes back to the maintainer as the spread-read fix, to be tested paired with any step fix (the two cancel in aggregates). FALSIFIED: O81 is not O36's; a deep review ranks. INCONCLUSIVE: O81 stays open.
- **In every branch:** no default change, no product change, no 7u, no seed 7013, no fix built or registered without the maintainer; pclsInterp's candidacy stays the maintainer's under O71's condition (a step-read fix that works, shown by that fix's own test, not by this one); the deep review re-scopes 7an with this read (its share-point question at 6, 9 and 12 is partly answered here for S130 and S370).

## Provenance

- The design: the deep review after 7at (deep-review-log.md, 4 Oct 03:18 UK: the step and spread split, the ranked causes, the decisive test, the predicted unmasking, the bridge-part rule); the maintainer's 'Run 1' (4 Oct); PLAN.md 7av, O76, O80, O81, O82.
- The build: audit-7av.mjs (7at's audit with the step class, the quadratic and the split added; 7at's lines unchanged, so the 6-point READER units are held to 7at's records); extrap-7av.mjs; reduce-7av.mjs (planted cases with OUTCOMES REACHED on all four items and an EDGES line; 7at's, 7ar's and 7ap's checks re-run on every unit; mutations, results-reduce-7av-mutations.txt: 41 of 41 caught); preflight-7av.sh and preflight-parse-7av.mjs; derive-7av.mjs; batch-7av.sh.
- The records: results-7at.txt and its runs (results/diag7at), read only through their stamps.

## Derivation script

- `derive: research/solver/derive-7av.mjs > research/solver/results-derive-7av.txt sha256 267df582610eaf86`
  (the levels at 6 points and the review's shares reproduced; the per-path spread; the power; the time).

## Point and interval

80% intervals, the author's:
- Item 1: F12 / F6 S130 0.5 (0.2 to 0.9), S370 0.55 (0.2 to 1.0).
- Item 2: Q6 / L6 S130 0.4 (-0.5 to 1.0), S370 0.5 (-1.0 to 1.2).
- Item 3: the share of S370's spread pessimism 'order' removes 0.5 (-0.2 to 1.2).
- Item 4: the better read at 12 points S130 0.3 (0.0 to 0.8), S370 0.4 (-0.5 to 1.5).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.45; 2 (INCONCLUSIVE), 0.4; 3 (HELD), 0.4; 4 (HELD), 0.35. Item 1: the review's first-ranked cause, and the flat copy's reach is one share cell, which halves at 12; against, the step's own edge may sit where 12 points do not resolve it either, and S370's two step reads (one before an inflow) may differ. Item 2: three supported nodes at 6 points span most of a row, so the quadratic may overshoot as easily as correct. Item 3: 'order' draws the ISA first, which pays more bridges than the proportional draw (O36: 4.6% unpaid against 18.1% on share 0.95), but S370's spread pessimism may have another source (the review: NOT CHECKED on S370). Item 4: it needs item 1's halving and the straight line's quartering together.

## Power

- (results-derive-7av.txt; unpaired noise, a lower bound) **Item 1:** at F12 = F6/2 the HELD side's z is 81.69 (S130) and 11.36 (S370); at F12 = F6 the FALSIFIED side's z is 47.43 and 6.59. **Item 2:** at Q6 = 0 the HELD sides' z 73.94 and 7.47; at Q6 = L6 the FALSIFIED side's z 64.85 and 6.55. **Item 3:** at O6 = 0 the HELD side's z 6.61; at O6 = P6 the FALSIFIED side's z 2.96 (the weakest; pairing on the same paths should raise it, NOT CHECKED). **Item 4:** a read at 0 with read (b)'s noise: the TOST sides' z 86.06 and 8.08; a read at 1.4 the OVER side's z 154.90 and 14.55. A true value near a band edge reads INCONCLUSIVE by construction.
- **Time:** 7at's units as measured, a 12-point solve taken as 4 times the 6-point one and its forward runs as 1.5 times (NOT CHECKED): 27,666 s, 7.68 core-hours, about 2.29 hours on four cores longest first; ORDER's own cost NOT CHECKED. The preflight times the build at 4 points.

## Budget line

The deep review's decisive step-read test, on the maintainer's go-ahead: about 7.7 core-hours, about 2.3 hours on four cores (each process stopped at 8 hours).

## Pre-mortem

- **Most likely:** item 1 HELD on S130 and INCONCLUSIVE on S370 (its two step reads differ, its per-path noise large), so the item INCONCLUSIVE; item 4 HELD on S130 and NEITHER on S370.
- **Second:** the step class differs from the review's years on S370 (the inflow's step not a pure step: the 'order' reference's tabulated chance, or a prefix with spread): the reported step counts by year show it, and the items read whatever the code classes as step.
- **Third:** the 12-point solve is slower or larger than derived (4 times the cells): a unit stopped at 8 hours is NOT SETTLED, re-run alone.
- **Fourth:** NOT SETTLED - a 6-point unit not 7at's. Unlikely from code: audit-7av.mjs prints 7at's lines through the same code, the step split and quadratic reading only; the solver files unchanged since 7at ran (code id).
- **The smoke run:** smoke.sh (locked) does not run audit-7av.mjs; the preflight through the launcher (preflight-7av.sh: all seven units at 4 points, read by preflight-parse-7av.mjs through the reducer's own parse, gate and reading, with planted faults) stands in, and the launcher's smoke run covers the solver code every solve here calls.

## Changes after seeing results

None.
