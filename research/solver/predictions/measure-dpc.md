# Prediction: measure-dpc

- **Run:** `research/solver/batch-dpc.sh` - results/diagdpc/case0-74.txt (audit-dpc.mjs, one process a unit: 25 households x 3 arms), read by `reduce-dpc.mjs` in the real tree into results-dpc.txt, its SNAP arm held to DP's results/diagdp line for line
- **Kind:** measurement
- **Written:** 4 Oct, before the run (its time is its registering commit's, git log); the design is the deep review after DP's (deep-review-log.md, 4 Oct 04:41 UK: the decisive test of what DP's pause count measures), given the go-ahead by the maintainer on 4 Oct ("Go ahead with your recommendations", recommendation 8: the three-arm contrast before any library-wide count; the ledger's 08:17 row)
- **Seeds:** 7002 tuning (2,000 paths a unit, the same paths for every household and arm, DP's). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** none: a measurement; no verdict on any arm is read. The PCLSI and SHIFT arms remove or move the snap's cliff, but the readings below are where the used allowance sits and how fast it grows, not the arms' survival, tax or estate; a fall in any of those under PCLSI would be the snap's removal exposing O66's optimism (the deep review after DP), and none is read here
- **Plan section:** PLAN.md "DPC" (the schedule), "O83" and "O71" (the register)

## Question

DP counted draw pauses on all 25 panel households (0.183 of the reaching paths, mean pausing dwell 13.75 years; results-dp.txt). The deep review after DP found that count to be two quantities under one name. Which one is it on the panel?

1. **Plateaus:** paths whose use of the lump sum allowance stops in the band and never reaches 0.75, from the pension running down or the plan ending, on pots whose whole tax-free part lies in the band.
2. **The snap's hold:** the chooser holding the use just below the cliff at 0.75 where a substitute pot exists. The cliff is there because the three-bucket axis is read by nearest snap.

Three arms tell them apart, each on DP's panel, paths and seed under the shipping default:

- **SNAP:** DP re-run.
- **PCLSI:** the axis interpolated, so there is no cliff.
- **SHIFT:** buckets 0, 0.6 and 1, so the cliff moves to 0.8.

What separates them:

- A hold within one year's pace of each arm's own cliff that disappears under PCLSI and moves under SHIFT is the snap's.
- Plateaus that look alike in every arm, with the pension near 0, are run-down.

## Derivation

**The mechanism** (code, grade A; the deep review after DP)
- chooseAction reads only the t+1 tables.
- Nearest snap is flat on [0.25, 0.75). So the snap can hold a path only within one year's draw of 0.75.
- The band from 0.60 to 0.72 carries no snap incentive.
- With buckets 0, 0.6 and 1, the snap's boundary between 0.6 and 1 is 0.8. The cliff moves there.
- Under interpolation there is no cliff.

**What the records give**
- DP's per-household counts (results-dp.txt):
  - S130: reach 2000, cross 1996, dwell 9.86, pause 443.
  - S128: reach 1836, cross 1730, dwell 10.04, pause 163.
- On the crossing households, the pause count is a threshold cut through one distribution of hold lengths. S130 needs about 9 years, and its dwell mode is 10.
- 7ap's bundle lines (world 0, TS+J with the reader; results-7ap.txt) show nearly all S130 paths holding at a mean use of 0.72 to 0.73 in plan years 13 to 17. Under PCLSI they cross by year 13.
- S128's whole pot gives a tax-free total of 0.75 of the allowance (807.5k; the deep review, grade B arithmetic). So pension run-down would plateau it just under the cliff by construction. That is why it decides between the two causes.

**The State Pension** (the deep review's cause 3)
- It starts at plan year 12 on most of the panel (18 on S360, S366 and S370).
- It is bounded on S130: it can cut S130's growth by at most about 0.016 of the allowance a year.
- It is read here as a growth drop at its year, under 0.6 and in the band, in every arm.

**The new counts**
- No record has the used allowance under the shipping default in PCLSI or SHIFT, or by distance to the cliff, so these counts are new.
- No derivation script: nothing here is computed before the run, and the registered readings are the reducer's.

## Prediction

**Registered readings** (the deep review's two households)

- **S130:**
  - Its mean dwell in DP's wall band falls from about 10 (SNAP: DP's 9.86, the identity) to about 3 under PCLSI.
  - Under SHIFT it falls too: the hold moves to just under 0.8, outside DP's band.
  - Its near-cliff share (the after-access path-years in [c - 0.3, c) within one year's pre-wall pace of the arm's own cliff c) is higher under SNAP and SHIFT than under PCLSI.
- **S128** is the household that decides. reduce-dpc.mjs's rule classes it:
  - **SNAP-HOLD:** its dwell falls by a quarter or more under PCLSI, and under SNAP the pension share of the wealth within one pace of the cliff is 0.25 or more.
  - **RUN-DOWN:** its dwell is within 10% of SNAP's under PCLSI, and its plateau paths' pension share is 0.05 or less in both arms.
  - **MIXED:** anything else.
  - Predicted: SNAP-HOLD. S128 crosses on 1730 of its 1836 reaching paths, and its strict stall share is low (84 of 18320 wall path-years), which fits a slow hold more than a dead plateau.

**The panel**
- The near-cliff share is higher under SNAP than under PCLSI, and about as high under SHIFT as under SNAP (moved with its cliff).
- Most plateau paths sit on the households whose pots' tax-free totals lie in the band: the S126 family, the built shares and the bridges. Their pension share is near 0, alike in every arm.
- The State Pension's growth drop shows under 0.6 and in the band alike in all three arms.

## Falsified if

A measurement settles nothing. It is read against this description, not falsified.

These would each go in the register with an owner and a gate:
- S130's dwell not falling under PCLSI;
- S128 reading RUN-DOWN;
- plateaus with a large pension;
- no difference between the arms anywhere.

The deep review's STOP stands whatever this shows:
- 0.183 and 13.75 years are not quoted as the snap's product effect;
- no ratio-based pause share is the contrast's reading.

## Fair-test table

Three arms on every household. SNAP is arm A; PCLSI and SHIFT are arm B.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing: lambda is held |
| 17 | The grid: points, shares, gain buckets | 30 points, 6 shares; the used-allowance axis 0, 0.5, 1, nearest snap | the same points and shares; the axis 0, 0.5, 1 interpolated (PCLSI) or 0, 0.6, 1 snapped (SHIFT) | TESTED - the used-allowance axis is the one thing that differs. SHIFT's bucket at 0.6 also carries toVec's lump-taken flag from 0.6 rather than 0.5 (grid.js), declared: SHIFT moves the cliff and that flag together |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | audit-dpc.mjs (SNAP); DP's results/diagdp by audit-dp.mjs | audit-dpc.mjs | ACCEPTED - the three arms come from one script. DP's files, re-used for the identity (checklist 3), come from audit-dp.mjs, of which audit-dpc.mjs is a copy with lines added after DP's. The reducer holds SNAP's ran, access, dp and dwell lines to DP's character for character, under DP's own stamp gate; a difference is refused |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | DP's dp and dwell (DP's band 0.6 to under 0.75), plus dist, plateau and sp against the arm's own cliff | the same lines | SAME definitions in every arm. dist and plateau are read against each arm's own cliff (0.75, 0.75, 0.8), which is the contrast's design; DP's lines keep DP's band in every arm |
| 31 | Paired or not, and the standard error used | counts | counts | N/A - counts and means per unit; no comparison carries a standard error |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision fed

O83's cause and the library-wide count:
- **If S128 reads SNAP-HOLD**, with S130's dwell falling under PCLSI and the near-cliff share moving with SHIFT's cliff:
  - The hold is the snap's where a substitute pot exists.
  - The interpolated axis's Phase 4 adoption test reads the advice on those households (tax, estate, survival).
  - The library question becomes which households hold a substitute pot at the wall. The SNAP traces and the fixtures answer that without the 39 core-hours.
- **If RUN-DOWN:**
  - Most of DP's count is plateaus.
  - O83 is restated as pension run-down in the band.
  - The snap's product effect is S130's hold alone.
- **If MIXED:** both are reported, and the library count is put to the maintainer with this reading.

No product change before Phase 4 (the maintainer's answer of 1 Oct 06:45 UK).

## Provenance

- **The design:** the deep review after DP (4 Oct 04:41 UK), its decisive test and its two registered households; the maintainer's go-ahead of 4 Oct (the 08:17 row); DP (predictions/measure-dp.md, results-dp.txt).
- **The build:**
  - audit-dpc.mjs: audit-dp.mjs's unit with the arm's axis options, plus the pension share and the pension recorded at every path-year beside the used share, and the dist, plateau and sp lines;
  - reduce-dpc.mjs: stamps; the gate; the SNAP identity against DP under DP's stamp gate; the reading with S128's class; 28 planted cases and an EDGES line;
  - batch-dpc.sh, preflight-dpc.sh, preflight-parse-dpc.mjs (the preflight holds SNAP to DP's own audit run at the preflight's size).
- **Not recorded:** the deep review asked for the move's order per path-year and the State Pension on or off per path-year. The State Pension's year is printed, and no registered reading uses the move's order.

## Point and interval

80% intervals, the author's:
- **S130's dwell under PCLSI:** 3 years (1.5 to 6).
- **S128's class:** SNAP-HOLD 0.5, MIXED 0.3, RUN-DOWN 0.2.
- **The panel's near-cliff share:** SNAP about twice PCLSI's (1.2 to 4 times); SHIFT's within a quarter of SNAP's.
- **Plateau paths:** the panel's plateau pension share under 0.1 in every arm.

## Budget line

75 units at the product's 30 points. Each is about 680 s by DP's measured mean (463 s solve and 215 s forward), so about 14 core-hours, about 3.5 hours on four cores. The interpolated arm may solve slower; this is revised when the first cells land. It runs after 7av (the cores).

## Changes after seeing results

None.
