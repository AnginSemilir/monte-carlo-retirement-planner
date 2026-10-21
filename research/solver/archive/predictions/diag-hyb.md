# Prediction: diag-hyb

- **Run:** `research/solver/batch-hyb.sh` - results/diaghyb/case0-2.txt and the per-path files (audit-hyb.mjs, one process a household: S130, S370 and S128, each SNAP, PCLSI and HYB), read by reduce-hyb.mjs into results-hyb.txt
- **Kind:** test
- **Written:** 5 Oct, before the run (its time is its registering commit's, git log). The design: O89's decomposing run, the forward-only hybrid named in PLAN.md's ADOPT-PI row and in the maintainer's go-ahead (the 5 Oct 06:29 row). It is what is left of the tail test the maintainer approved: the death-tax group was dropped (the 5 Oct 08:00 row), and the tie-margin items after the margin probe on the tuning seed showed that any tie margin from 1e-10 rewrites every path (results-probe-tailm.txt; the maintainer's 'Yes', the 5 Oct 08:58 row)
- **Seeds:** 7005 selection: HYB selects how ADOPT-PI's survival gain is put to the maintainer with the axis decision, on ADOPT-PI's own seed and 6,000 paths, so the SNAP and PCLSI arms repeat ADOPT-PI's runs and the reducer's gate holds them to ADOPT-PI's per-path files path for path (the identity: the code since ADOPT-PI is inert on its unit). S130 and S370 were named as the gain pair from DPC's seed-7002 records before ADOPT-PI, and S128 as O89's third; no reading here re-estimates ADOPT-PI's gain, it splits it on the same paths. Not 7004 (Phase 4's second seed) and not 7002 (tuning). The product's 'auto' risk-above rule reads its own seed 7101 in the shared code, as in every solver run.
- **Unmasking:** HYB removes no error; it reads PCLSI's tables through SNAP's snapped read, to split ADOPT-PI's gain between the two things PCLSI changed at once: the tables (solved with the interpolated axis; O66's after-access optimism moves with them) and the chooser's read (the false cliff at 0.75 of the allowance and the hold below it, O83). The pair that splits the gain on each of S130, S370 and S128 is HYB against SNAP (the tables' part, the read held snapped) and PCLSI against HYB (the read's part, the tables held); item 1 reads them against each other. A harm under HYB is not a harm of anything proposed (HYB is no candidate) and is not read.
- **Mechanism:** grid.js:257 "nearest(g.pcls, pf)" (SNAP's read: the nearest of the three allowance buckets, so crossing 0.75 drops a bucket) against grid.js:256 "g.pclsInterp ? bracket(g.pcls, pf)" (PCLSI's blend); HYB sets g.pclsInterp off on every grid the forward run reads after PCLSI's solve (audit-hyb.mjs gridsOf). How often the hold applies per household is reduce-adoptpi.mjs's hold line (results-adoptpi.txt: paths reaching 0.6 of the allowance, crossing 0.75, the years between) and derive-hyb.mjs's discordant cells (results-derive-hyb.txt)
- **Plan section:** PLAN.md "HYB", "O89", "O83", "O66" and the 5 Oct 06:29, 08:00 and 08:58 rows

## Question

On S130 (with S370 and S128 reported), does the read of the allowance axis - PCLSI over HYB, the same tables - carry more than half of ADOPT-PI's survival gain, and the tables - HYB over SNAP, the same snapped read - less (O89)?

## Derivation

- **The two changes in PCLSI.** Under SNAP the chooser reads next year's value at the nearest allowance bucket, so the value drops when the used share crosses 0.75 and the chooser holds just below it, deferring taxable pension draws while the ISA is spent (O83; DPC: S130's dwell 9.86 years under SNAP, 2.16 under PCLSI). PCLSI also solves the tables with the blended read, so the values stored at the buckets change (the continuation no longer sees the cliff). HYB keeps PCLSI's tables and restores the snapped read, so the cliff is back in the chooser on tables solved without it.
- **ADOPT-PI's cells** (results-derive-hyb.txt, from ADOPT-PI's per-path files): S130 25 lost and 168 saved of 6,000 (PCLSI against SNAP), S370 43 and 91, S128 49 and 73.
- **What each outcome would say.** If the gain is the chooser's hold (O83), HYB brings the hold back and sits near SNAP: the read carries the gain (READ). If it is the tables' after-access optimism (O66) that PCLSI corrects, HYB sits near PCLSI (TABLES). Both at once read SPLIT.
- **The checks, each failed on a planted fault first:** reduce-hyb.mjs's 23 planted checks (every outcome reached; EDGES named) and 22 of 22 mutations caught (results-reduce-hyb-mutations.txt); the preflight (preflight-hyb.sh, preflight-parse-hyb.mjs): the 3 jobs at 4 points and 20 paths through the reducer's gate and THE IDENTITY against ADOPT-PI's own preflight files, with 6 planted faults refused - passed through the launcher (results/hyb-preflight.log: PREFLIGHT PARSE PASSED, the SNAP and PCLSI arms equal to ADOPT-PI's preflight path for path on 6 units).

## Prediction

- **Item 1 HELD:** on S130 the read carries more than half of the gain (point: the read's share about 0.8).

## Falsified if

- **Item 1 FALSIFIED:** S130 reads TABLES (mean(y) below 0, shown after Holm: the tables' part above the read's). INCONCLUSIVE: S130 reads SPLIT.

## Fair-test table

Arms: SNAP, HYB and PCLSI on each household, paired by path; every unit at the library's death tax 0 and tie margin 0.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S130 and S370 (ADOPT-PI's gain pair, named from DPC's seed-7002 records), S128 (O89's third) | the same | SAME (all of DP's tuning panel; declared in Seeds) |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | seed 7005, 6,000 paths | the same paths | SAME (paired; the gate holds one pathsum across a household's units, and ADOPT-PI's paths path for path through the identity) |
| 17 | The grid: points, shares, gain buckets | 30 points; the allowance axis 0, 0.5, 1; tables solved snapped (SNAP) or interpolated (PCLSI, HYB) | the forward read snapped (SNAP, HYB) or interpolated (PCLSI) | TESTED (the tables' solve and the forward read, crossed: SNAP snapped/snapped, HYB interpolated/snapped, PCLSI interpolated/interpolated) |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:** per household and arm, each path's survival (0 or 1), lifetime tax and terminal net, from the per-path files.
- **Item 1 (primary; single look):** on S130, S370 and S128, per path y = (PCLSI - HYB) - (HYB - SNAP) in survival; Fisher's paired randomization test (reduce-7ar.mjs flipP, B 20,000 sign flips from fixed seeds, one-sided) of mean(y) above 0 (READ) and below 0 (TABLES), Holm over the 6; SPLIT otherwise. HELD when S130 reads READ; FALSIFIED when S130 reads TABLES; else INCONCLUSIVE. S370 and S128 reported.
- **Secondary (declared, decides nothing):** every pair's survival change, mean tax and net change with its se.
- **Reported, not items:** the hold per arm (reduce-adoptpi.mjs hold); for each pair of arms, the year each discordant path first differs in its tier or spend level, and each arm's year-0 move (the deep review after COV-B-STEP: where one opening decision flips, path counts are not mechanism evidence, so the read says how many decisions differ and when). O88's split by exact entry year over HYB's used-share traces on S130 and S370 (PLAN.md O88's gate) is a derive after the read, not a registered reading.
- **NOT SETTLED**, if any gate fails: the stamps; a unit missing, repeated or not done; a ran line off ADOPT-PI's settings or the arm's tables or read, or at a tie margin or death tax other than 0; a household's units on different paths or access lines; a per-path file missing, unstamped or off its sum line; the SNAP or PCLSI arm off ADOPT-PI's per-path file on any path, or ADOPT-PI's files failing their own gate.
- **Declared choices, not derived:** more than half as the line between 'the read's gain' and 'the tables''; S130 as the deciding household (the largest, best-powered gain).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD | put PCLSI to the maintainer with its survival gain attributed to the chooser's read (the hold at the false cliff, O83), so the gain needs no change to the tables; O89 split | 0.40 |
| item 1 INCONCLUSIVE | put PCLSI to the maintainer with the gain unsplit between the read and the tables (O89 open), on ADOPT-PI's survival readings alone | 0.45 |
| item 1 FALSIFIED | the gain is the tables' (O66's after-access optimism corrected): before PCLSI goes to the maintainer, read the tables' after-access calibration under PCLSI on S130 (7al's stage reading), since a gain from the tables may be optimism moved rather than removed | 0.15 |

## Decision fed

- **Item 1 HELD:** ADOPT-PI's gain is the read: O89 split, O83 confirmed as the cause on S130; PCLSI goes to the maintainer with that attribution.
- **Item 1 FALSIFIED:** the gain is the tables': O66's calibration under PCLSI is read on S130 before the axis goes to the maintainer.
- **Item 1 INCONCLUSIVE:** O89 stays unsplit and is put as such.
- **In every branch:** pclsInterp stays off in the code until the maintainer decides; no product change; the axis decision's put carries PR5's caveat (a nonzero death tax unchecked beyond S130, S370 and S128).

## Provenance

- **The design:** O89's decomposing run (PLAN.md's ADOPT-PI and O89 rows); the maintainer's go-ahead (the 5 Oct 06:29 row) and the two cuts before registration (the 5 Oct 08:00 and 08:58 rows).
- **The build:** audit-hyb.mjs; reduce-hyb.mjs (planted checks, mutations: results-reduce-hyb-mutations.txt); preflight-hyb.sh with preflight-parse-hyb.mjs; derive-hyb.mjs. Renamed from the TAIL build (audit-tail.mjs and its kin), the tie-margin and death-tax parts removed.
- **Changed before registration:** the item first read the two parts by separate McNemar tests, BOTH meaning inconclusive; the power over ADOPT-PI's cells showed S130 reads BOTH once the tables carry a tenth of the gain, so the item reads the parts against each other (y) instead.

## Derivation script

- `derive: research/solver/derive-hyb.mjs > research/solver/results-derive-hyb.txt sha256 892b97282892cd2a`
  (item 1 at modelled table shares over ADOPT-PI's cells; the cost)

## Point and interval

- **Item 1:** the read's share on S130 about 0.8 (0.5 to 1.0).

## Credence

- **Item 1:** HELD 0.40, INCONCLUSIVE 0.45, FALSIFIED 0.15 (restated for the flip floor before registration: the point, a tables' share about 0.2, sits near the HELD/SPLIT line once HYB's own flips are counted).

## Power

From results-derive-hyb.txt, HYB built from ADOPT-PI's paths with a share s of the discordant paths given to the tables: S130 reads READ (HELD) at s 0, 0.10 and 0.25, SPLIT (INCONCLUSIVE) at 0.40 to 0.60, TABLES (FALSIFIED) at 0.75 and 1. S370 reads READ only to s 0.10 and TABLES only at 1; S128 (49 lost, 73 saved) reads SPLIT at every s - its gain is too small to split at 6,000 paths, so it is reported, not read. With a flip floor (the deep review after COV-B-STEP, 5 Oct 09:27 UK: a null perturbation flips paths too - S130 lost 25 under PCLSI in ADOPT-PI, and 14 of 500 moved under a 1e-10 tie margin), HYB also flipping f paths each way where SNAP and PCLSI agree (results-derive-hyb.txt section 1b): the flips symmetric, the same count lost and saved, spread evenly over the paths both arms survive and both lose (the plan-auditor's BLOCKING 1 of 5 Oct: the first pattern flipped more paths lost than saved at f 150 on S130, a shift toward READ): at f 25 S130 still reads READ to s 0.25; at f 75 and at f 150 only to s 0.10, SPLIT from 0.25 - so the HELD region narrows to a tables' share of about 0.1 to 0.25 depending on how much HYB flips by itself.

## Budget line

3 jobs, 1.4 core-hours from ADOPT-PI's seconds (results-derive-hyb.txt), about 0.49 hours on three cores, one process a household. Launched when the cores are free.

## Pre-mortem

- **First:** the identity fails - the code since ADOPT-PI is not inert on its unit; the preflight's identity at 4 points against ADOPT-PI's own preflight is the check before launch, and a failure there stops the launch.
- **Second:** HYB is not a clean split: the snapped read on PCLSI's tables may hold at a different place from SNAP's (the bucket values differ), so 'the read's part' includes how the tables and the snap interact; the item reads which arm HYB sits nearer, not a pure decomposition, and says so if SPLIT.
- **Third:** S130's gain is large and concentrated (168 saved), but if HYB moves paths both ways the discordance grows and SPLIT becomes likelier at a true share near a half (the flip floor, results-derive-hyb.txt 1b).
- **Fourth:** if the arms differ by a single opening move (every path starts from one state, so one flipped year-0 move changes all 6,000), the split is a statement about that one decision, not about a mechanism along the paths; the reported year-0 move per arm says which.

## Changes after seeing results

None.
