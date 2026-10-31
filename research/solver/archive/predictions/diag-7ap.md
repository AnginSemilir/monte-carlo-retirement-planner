# Prediction: diag-7ap

- **Run:** `research/solver/batch-7ap.sh` - results/diag7ap/case0-5.txt (audit-7ap.mjs, six units), read beside 7al's records (results/diag7al); reduced by `reduce-7ap.mjs` in the real tree into results-7ap.txt
- **Kind:** test
- **Written:** 1 Oct, before the run (its time is its registering commit's, git log); registered after the maintainer's answer of 1 Oct 06:45 UK (on 7al's linear tier convention, before O60's switch); designed by the deep review after 7al (deep-review-log.md, 30 Sep 22:51 UK) as its decisive test for O66, O69 and O71; its decision rule rests on the interpolated arm (the plan-auditor's MINOR 3 of 30 Sep 23:04 UK)
- **Seeds:** 7002 tuning (its first 2,000 paths, the long-run shift set to each world's node: 7al's paths). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** the PCLSI arm removes a known error - the used-allowance axis's absorbing snap (O71; grid.js, three buckets read by nearest snap) - and the chooser then runs on tables that value the allowance differently, so its policy changes too: a PCLSI residual may carry errors the snap hid (share-axis interpolation, O66's second cause; the lump-taken flag, which the PCLSI read blends between buckets 0 and 0.5). Item 3 (the control, which cannot cross 0.75 of the allowance) and the reported split by bucket change and share position tell a fix that unmasks another error from one that adds its own; a PCLSI arm that reads worse is not the option's fault until that split names it (RULES.md section 9).
- **Plan section:** PLAN.md "7ap"

## Question

Is the post-access optimism on the crossing households (7al: S370 +6.94 and S130 +6.83 points, OPTIMISTIC; results-7al.txt) the used-allowance axis's absorbing snap - so that interpolating that axis removes at least half of it - or does it survive the interpolation (share-axis interpolation, the optimizer's curse)?

## Derivation

- **The mechanism** (grade A, the code): grid.js snaps the used share of the allowance to {0, 0.5, 1} by nearest; a year using under a quarter of the allowance reads back on its bucket, so the tables value the tax-free part of every later draw as lasting until the path's use crosses 0.75, where the read jumps to the last bucket. With the axis interpolated (`pclsInterp`, research only, default off; research/tests/solver-gridfidelity.test.mjs E1 to E9, the read linear in the used share across the 0.75 wall), a table read moves with the used share, and the backward pass values the allowance running out year by year.
- **The level to expect** (derive-7ap.mjs, results-derive-7ap.txt, from 7al's records): the DEFAULT arm's after-stage optimism, three worlds pooled, is S370 6.9393 (n 5,870, c 78.7792) and S130 6.8291 (n 6,000, c 85.3624); h, half of each, 3.4696 and 3.4145. S194's is 0.0747 (the control).
- **The item's power** (results-derive-7ap.txt): at the DEFAULT arm's n and c, item 1 reads HALVED while the PCLSI arm leaves up to 0.34 (S370) or 0.35 (S130) of the optimism, NOT HALVED from 0.66 or 0.65; between, INCONCLUSIVE. Item 2 reads NO MATERIAL OPTIMISM at none left, INCONCLUSIVE at a quarter, OPTIMISTIC from a half.
- **Claude's choices, before any run:** item 1 (the snap's share) is primary because it separates cause 1 from cause 2 (share-axis interpolation predicts no change under PCLSI; the concentration on bucket-change path-years does not, the plan-auditor's MINOR 3); h is half the DEFAULT arm's measured point, taken as known (its sampling error, about 0.5 points, is a stated limit); the control is S194 under TS+J, whose tables value the policy its paths run (O70).

## Prediction

Item 1 HELD: interpolating the allowance axis leaves no more than half of the post-access optimism on both S370 and S130 (both read HALVED). Item 2 INCONCLUSIVE: some optimism is left, under the margin on neither unit or on one. Item 3 HELD: S194 under PCLSI reads CALIBRATED (its interval inside 2 points either side of its claim).

## Falsified if

Item 1: both S370 and S130 read NOT HALVED - more than half the DEFAULT arm's optimism survives the interpolated axis (the binomial tail at c - h under 0.05 after Holm, and the point h or more): the snap is not the main cause. Item 3: S194 under PCLSI reads OPTIMISTIC or PESSIMISTIC: the option adds an error where no crossing exists.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S370, S130 (READER), S194 (OFF) | the same | SAME - the deep review's units: the two households whose use crosses 0.75 of the allowance and the control that cannot, all on the tuning panel, all 7al's units |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7002's first 2,000 paths at each world's node | the same | SAME - 7al's paths; both arms read on them |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing: lambda held |
| 17 | The grid: points, shares, gain buckets | 30 points, the allowance axis snapped (the records') | 30 points, the allowance axis interpolated (`pclsInterp`) | TESTED - the one setting the arms differ in; the gate checks each unit's axis line |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code, pclsInterp off | this code, pclsInterp on | SAME within 7ap; against 7al's record (code 05be10bd7b34) ACCEPTED - the gate holds every DEFAULT unit to 7al's line for line (table, ran, gap, joint, access, bridgeref, node, stage, resid and cell lines), so the option off is the code 7al ran |
| 32 | The table's number is never the result: survival is simulated | the table's claim at access against the simulated outcome | the same | SAME - both arms compare the claim with simulation on the same paths |
| 33 | For timings: what else the machine was running | the solve seconds are printed, not read | the same | N/A - no timing is read |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Item 1 (the snap's share, primary):** on S370 and S130 READER, each unit's three worlds pooled as 7al pooled them (n the paths alive at access, c their mean claim there, s the survivors). h is half the DEFAULT unit's point c - 100 s/n (the gate holds it to 7al's record). The PCLSI unit reads HALVED when the Clopper-Pearson 95% lower end of its s/n, in points, is c - h or more; NOT HALVED when P(Bin(n, (c - h)/100) <= s) is under 0.05 after Holm over the 2 units and its point is h or more; else INCONCLUSIVE (the tail exact for equal chances, conservative for unequal ones: Hoeffding 1956, Theorem 4). A unit whose PCLSI arm overshoots into pessimism (P(Bin(n, (c + 2)/100) >= s) under 0.05 after Holm over the 2, and its point -2 or less) reads OVERSHOT whatever its halving (the deep review after 7am, 1 Oct 02:00 UK). HELD when both read HALVED; FALSIFIED when both read NOT HALVED; else INCONCLUSIVE.
- **Item 2 (the cure):** 7al's rule made two-sided on the PCLSI crossing units (margin 2 points; OPTIMISTIC: the lower tail at c - 2 under 0.05 after Holm over 2 and the point 2 or more; PESSIMISTIC: the upper tail at c + 2 likewise and the point -2 or less; CALIBRATED: the CP 95% interval inside c - 2 to c + 2; else INCONCLUSIVE). HELD when both read CALIBRATED; FALSIFIED when both read OPTIMISTIC; else INCONCLUSIVE.
- **Item 3 (the control):** the same two-sided rule on S194 OFF under PCLSI (one unit). HELD when CALIBRATED; FALSIFIED when OPTIMISTIC or PESSIMISTIC; else INCONCLUSIVE.
- **NOT SETTLED:** any gate fails (the stamps of 7ap and 7al; a unit missing, twice or not done; any setting off the registered ones; a missing or wrong axis line; a DEFAULT unit not 7al's line for line; a PCLSI unit's ran, joint or access line not its twin's; a line missing; the lines computed apart disagreeing - the paths through the bridge, the after stage's paths and survivors, the telescoping, and the pcell, wall and lsa lines against the resid lines).
- **Reported, not items:** the paired reading (the optimism DEFAULT less PCLSI per crossing unit, a 95% band treating the arms as independent, wider than a paired one; for power); the draw stall (path-years at the wall whose used allowance does not grow to t + 1, after access, both arms: the snap as cause predicts it gone under PCLSI, share-axis interpolation that it stays); both arms' after and bridge stages by world; the residual by bucket change and share position (pcell) and by the wall; the used allowance by plan year; the per-year residual by plan year with access named.
- **Declared choices, not derived:** h = half the DEFAULT point; D = 2 points (7al's); the pooling of worlds within a unit; the wall at 0.6 to 0.75 of the allowance; the bucket change read on the snapped buckets in both arms.

## Decision fed

- **Item 1 HELD:** O71's attribution rises to grade B on S370 and S130 (the snap carries at least half their post-access optimism; one run, one seed); O66 and O69 are re-filed under O71; 7ao's hold is reviewed (one-action tables would need the interpolated axis); a design for the product (the interpolated axis or more allowance buckets, with its solve cost and a product-level check of the draw stalls) goes to the maintainer. No default change here.
- **Item 1 FALSIFIED:** interpolating the three buckets does not remove the optimism - which tests the absorbing snap, not whether three buckets are enough (the deep review after 7am): the next arm is a finer allowance axis (more buckets, interpolated) before O71's attribution drops to D; share-axis interpolation (cause 2) and the optimizer's curse rise; the next step is designed by a deep review (7ao's hold lifted or recast).
- **Item 1 INCONCLUSIVE:** reported with the share left on each unit; the split by bucket change and share position sizes the rest; to the maintainer with the sizes.
- **A unit OVERSHOT (item 1) or PESSIMISTIC (item 2):** interpolation moves the tables past calibration - the snap is a lever but the interpolated read is no fix as built (the lump-taken flag's blend between buckets 0 and 0.5, and the value's linearity between buckets 0.5 and 1, NOT CHECKED, the first suspects); reported to the maintainer with the paired reading.
- **Item 3 FALSIFIED:** the option adds an error where no crossing exists (the lump-taken flag's blend between buckets 0 and 0.5 the first suspect): item 1's read is qualified, and the option is not a candidate fix as built.
- **In every branch:** no default change; no 7u; no seed 7013; the draw-stall product question stays with the maintainer.

## Provenance

- The design: the deep review after 7al (deep-review-log.md, 30 Sep 22:51 UK); O71, O66, O69, O70 (PLAN.md); the plan's 7ap row; the plan-auditor's MINOR 3 of 30 Sep 23:04 UK.
- The records: results-7al.txt and results/diag7al (the DEFAULT arm, its times; derive-7ap.mjs).
- The build, amended after the deep review after 7am (deep-review-log.md, 1 Oct 02:00 UK: a two-sided read with the overshoot branch, the finer-axis consequence, the stall count, the paired reading): src/solver/grid.js `pclsInterp` (research only, default off; research/tests/solver-gridfidelity.test.mjs E1 to E11; 7 planted faults in the option and in nearestIndex's rounding all caught, mutate-grid-pclsinterp.py, results-grid-pclsinterp-mutations.txt); solve.js nearestIndex and snap.mjs nearestOf round an interpolated axis's lower bracket by its weight (the plan-auditor's MINOR 3 of 30 Sep 23:32 UK: off, bit for bit the snap); audit-7ap.mjs; reduce-7ap.mjs (planted 58; mutations 41 of 41 caught - 7 escaped on the first run and 1 after the amendment, an equivalent mutation now noted in the runner; results-reduce-7ap-mutations.txt and results-mutation-history.txt); batch-7ap.sh, preflight-7ap.sh, preflight-parse-7ap.mjs, derive-7ap.mjs.

## Derivation script

- `derive: research/solver/derive-7ap.mjs > research/solver/results-derive-7ap.txt sha256 ce9f80fd80e6f988`
  (the DEFAULT arm's after-stage figures from 7al's records, the items' power, the time).

## Point and interval

80% intervals, the author's, the after stage's optimism c - survived in points, three worlds pooled:
- PCLSI: S370 +2.0 (-0.5 to +5); S130 +2.0 (-0.5 to +5); S194 0 (-1 to +1.5). At +2.0 item 1 reads HALVED on both (HALVED needs about 2.36 or less on S370 and 2.39 on S130, results-derive-7ap.txt's 0.34 and 0.35 of the optimism left) and item 2 INCONCLUSIVE (the point at the margin): the point agrees with the prediction (the plan-auditor's MINOR 1 of 30 Sep 23:32 UK, which found the first draft's +2.5 reading INCONCLUSIVE on item 1).
- DEFAULT: 7al's figures exactly (the gate).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.45; 2 (INCONCLUSIVE), 0.45; 3 (HELD), 0.65. Item 1: the spike years line up with the allowance crossing 0.75 on both households, the claim falls while almost no path dies (the 22:51 review, grade C), and the mechanism is in the code; against it, the interpolated tables change the policy as well as its valuation, the share axis leans mid-cell after access (7al: S130 0.40 against 0.12), and the traces' stalled draws move the share axis on the same path-years, so part of the optimism may be share-axis interpolation that the PCLSI arm leaves. Item 3: S194 cannot cross 0.75, but it may use part of the allowance, where the PCLSI read blends the lump-taken flag between buckets 0 and 0.5.

## Power

- **Item 1** (results-derive-7ap.txt): at 7al's n and c, HALVED up to 0.34 and 0.35 of the optimism left, NOT HALVED from 0.66 and 0.65; INCONCLUSIVE between.
- **Time** (results-derive-7ap.txt): the DEFAULT units 7,699 core-seconds in 7al (2.14 core-hours), measured on the host before the 30 Sep 23:35 UK restart; on the 2.10 GHz host (results-host.txt) perhaps a third longer, NOT CHECKED; the PCLSI units at the same cost to twice it (the interpolated read touches up to twice the corners, NOT CHECKED which): 4.28 to 6.42 core-hours, 1.37 to 1.91 hours on four cores.

## Budget line

O71's step (the deep review after 7al's decisive test; 7ao and so 7u wait on it): about 4.3 to 6.4 core-hours, about 1.4 to 1.9 hours on four cores, after 7am.

## Pre-mortem

- **The likeliest miss:** item 1 INCONCLUSIVE - the interpolated tables remove a third to two thirds of the optimism, the rest carried by share-axis interpolation on the same path-years; the reported pcell split then sizes the two.
- **Second:** NOT SETTLED by the identity gate: the option off must be bit-identical to the code 7al ran (test A1 checks one household at 14 points, not these at 30); any drift in grid.js's read with the option off stops the whole read.
- **Third:** item 3 FALSIFIED by the lump-taken flag's blend between buckets 0 and 0.5, which changes S194's early-plan valuation.
- **The smoke run:** smoke.sh (locked) does not run audit-7ap.mjs; the preflight through the launcher (preflight-7ap.sh: all six units at 4 points and 20 paths, read by preflight-parse-7ap.mjs through the reducer's own parse, gate and reading, with three planted faults) stands in.

## Changes after seeing results

None.
