# Review at the read: the couples' registered re-run (`couples-d4b.md`, seed 7021, amendment 1)

Subject: the read of 13 Nov (`results-couples-d4b.txt`, committed at 09985399; `reduce-couples.mjs` run once on
`/home/user/d4b-launch/research/solver/results/d4b-run`) and the claims made from it, against the registration, the
chunks and the code. STATE.md has not yet taken the read; the write-up reviewed is the results file, the commit message
and the five claims put to this review.

Verdict: PASS

No finding is BLOCKING. Seven MINORs; 1 to 4 are things the report to the maintainer must say beside "PASS" and the
results file does not print.

## What was read and run

- Main tree at 09985399, clean. Blobs: `registrations/couples-d4b.md` 3b9d5fc8c91a (the launch tree's blob and the sha
  every chunk's stamp carries), `registrations/couples-d4b-amendment-1.md` 8e728cb0d357, `results-couples-d4b.txt`
  4b87e1a399cf, `reduce-phase4.mjs` ac319aad1f44, `audit-couples.mjs` 1bc8fa2e72a3, `audit-phase4.mjs` 5ace83959b96,
  `couples-panel-d4b.json` 1d2a56c83b7d, `couples-paths-d4b.json` 40a096da74b6.
- **The three blobs asked for first** (the amendment review's finding 3), at HEAD, in the working tree, at cb9f28b6 and
  at 09985399 alike: `couples-d4b-amendment.mjs` 172cf67f9524, `stage-couples.mjs` 0242929ca413, `reduce-couples.mjs`
  cae05c5a8e75. As required. `git diff 4e4174b1 HEAD` on the stamped files: only those two differ, and the reducer's
  diff is the plan check, the stamp and the amendment line (no item, bar or interval touched).
  `node research/solver/couples-d4b-amendment.mjs`: 29a4a6a71f76, THE SAME as the launch's.
- The run's folder: 200 chunks, 200 logs, `stage2.json` (`continue: []`, amendment S293, built 13 Nov 07:50); the three
  launch logs and the launch tree's `runs.log`. Not opened: `d4-backup`, `d4b-backup`, anything of D4. No path of seed
  7021 was run; everything below is from the stored arrays.
- `node research/solver/reduce-couples.mjs <run folder>` again, to a scratch file: exit 0, **byte for byte the committed
  results file** (118 lines). `--planted` on the reducer (69) and the amendment (12): all pass.
- An independent recompute from the chunks, sharing no code with the reducer (scratch scripts, not in the repository):
  A1, A2, S1 with their intervals, the stage decision, the flags, the cost years, the rollout beside, and the figures in
  findings 1 to 5.

## The claims

1. **The gate fair, amendment 1 for S293 only: holds.** 200 chunks, 40 couples x 5 units, one stamp (code 1d5d2421c9ab,
   audit 29a4a6a71f76, registration 3b9d5fc8c91a, one Node, one host), all 200 logs on it, each with one done line; seed
   7021, N 19000; CANDC and APP on paths 0 to 5000, SHIPC 0 to 1000. Every CANDC head `config af001697ce1b ... flat true
   fast true shortlist none item12 none tieBreak off:tieMargin`, every SHIPC head 07c069b6e330 the same; one person
   record per arm and weight across all 80 people but for the minimum pot, the reader's years and the lattice (`unbuilt`
   or `80x21x64+foot+stepAll`). Inputs: 39 couples on one hash; S293 APP 59b230b4798b, its four solver units
   6080f4d27c15, exactly `KNOWN`. The panel's code is the run's. The second and third launches' "1 uncommitted file" is
   the launcher's own `runs.log`.
2. **PASS by the registered rule: holds.** Recomputed: W0.02 A1 +10.008 (9.540 to 10.477, se 0.2390), A2 +6.485 (6.395
   to 6.575); W0.01 A1 +9.927 (9.458 to 10.395), A2 +7.618 (7.525 to 7.711). The intervals are the registration's:
   each path's change averaged over the 40 couples, 1.96 standard errors of that mean across the 5,000 paths
   (`reduce-phase4.mjs` `byPath`, lines 116 to 126), A2 as a share of each couple's mean under APP. The stage decision
   recomputed: the smallest first-stage change is +7.30 points (S311F at W0.01), so none of 80 goes on and the deciding
   items are on the first 5,000 paths, as the registration says for that case.
3. **S1: holds.** +0.875 (0.721 to 1.029) and +1.000 (0.822 to 1.178) on SHIPC's 1,000 paths.
4. **Flags none, eight comparisons named below 0.90: holds.** Every couple-weight stopped, so by the rule none can be
   flagged for harm; the lowest spending change of a couple is S097 at W0.02, -0.89% (the flag is at -5%).
5. **Beside the outcome: holds, with finding 1 on the cost years.** The rollout beside: 160 units x 500 paths, 0 and 0;
   it compares survival only.

## Findings

1. **MINOR (must be said; the claim as put understates it).** The cost years' spending is -9.697% at W0.02 (-9.841 to
   -9.553) and -5.136% at W0.01. W0.02 is the app's 'standard' estate aim, so -9.7% is the figure to lead with; by
   couple at W0.02 twelve of the thirteen are lower, to -15.9% (S403). It is not the cost: it is the candidate's early
   cut. On those 13 couples the mean spending level by plan year 0 to 7 (percent of the scheduled target, from the
   chunks' `level`): APP 100.0, 98.9, 97.4, 94.7, 94.8, 94.8, 94.5, 95.2; CANDC at W0.02 97.7, 92.6, 85.2, 85.3, 87.5,
   88.1, 89.2, 91.5. Year 3, the cost year, is no different from years 2 and 4. Over all 40 couples, retired years 0 to
   4 / 5 to 9 / 10 to 19 / 20 on, paths not yet failed: APP 98.2 / 95.5 / 96.1 / 98.1, 5.07 years at the floor; CANDC
   W0.02 92.5 / 95.3 / 100.9 / 106.3, 9.77 at the floor; W0.01 95.0 / 97.3 / 102.3 / 106.6, 8.51. A2's plus sign is
   earned late (and by surviving); a couple spends less than under the app's rules in its first five retired years.
   The same shape as the singles' (the tier test's block), and D44 (2)'s wording applies; the report must not put it as
   a cost-year effect.
2. **MINOR (must be said; the read prints no estate figure, and the product question names the estate).** The pot left
   is far smaller under CANDC. Mean estate, CANDC over APP, W0.02: pooled over the 40 couples 0.18, the mean of the
   couples' ratios 0.40 (W0.01: 0.17 and 0.34); lower on 36 of 40; the younger cohort 0.10 to 0.22 on every couple; the
   couples' median estates average 0.73 of APP's at W0.02 and 0.58 at W0.01. Lifetime tax, CANDC over APP: pooled 1.17
   at W0.02 and 1.07 at W0.01, and many times APP's where APP pays almost none (S293 £11,008 to £167,797, S277 £4,800
   to £56,370, S317F £1,981 to £195,952, S341F £8,807 to £250,799). This is the known behaviour above the estate cap
   (ITEM7-POT, item 13), and no registered arm carries the tie-break (D80), so the couples' figures are without the
   remedy D90 (1) ports next. None of it is in the rule; the outcome stands. But "PASS" read as "better outcomes" is a
   claim beyond the read for the estate.
3. **MINOR (scope the report must carry).** (a) The gain is at the landing: APP survives 84.86% on seed 7021 (by couple
   82.7 to 86.6, so the landing on seed 7005 did not flatter or handicap it), which leaves 15.1 points to gain; CANDC
   removes two-thirds of APP's failures (30,273 to 10,256 of 200,000 at W0.02). It is not the gain a couple sees on
   the plan as entered. (b) Most of A1 is solving at all: on the first 1,000 paths APP 84.48%, SHIPC 93.62%, CANDC
   94.49% at W0.02. (c) Beside the singles' Phase 4 (A1 +10.710 and +10.787, A2 +6.549 and +7.464, S1 +0.830 and
   +0.973) the couples read the same. (d) No decomposition was run: nothing here says how much is the tier changes
   (47% for singles, the tier test), the sweep (the design review's MINOR 5) or the joint move. (e) Every couple of the
   panel holds 60/40: the read says nothing for a couple outside 40% to 60% (M4, D66). (f) The read rests on 5,000
   paths a unit, as registered for this case; the per-couple harm rule at 19,000 was never exercised. (g) The interval
   is over paths for these 40 couples; across couples the change has a standard deviation of 1.24 points (7.3 to 14.2).
4. **MINOR (a lead for the deep review, not harm by the rule).** Paths lost under CANDC that APP keeps: 75 at W0.02 on
   16 couples and 164 at W0.01 on 23 (against 20,092 and 20,017 saved). They are of two kinds. Three adjacent couples
   of the younger cohort lose them in one year, their ninth retired year (plan year 23, both readers on six bridge
   years): S311F 20 of its 23 at W0.02 and 33 of 43 at W0.01, S309F 14 of 14 at W0.01, S307F 5 of 5 and 9 of 9. The
   rest fail in the last year or two (the minimum pot): S403 13 of 13, S331F 12 of 12, S011 9 of 10. S311F is also the
   smallest gain (+7.60, +7.30).
5. **MINOR. S293: nothing odd in what the rule reads.** APP 84.94%, CANDC 96.08% and 95.76% (+11.14, +10.82, inside
   the library cohort's 8.5 to 14.2), spending +7.82% and +9.07%. Without S293: W0.02 A1 +9.979 (9.506 to 10.453), A2
   +6.451 (6.360 to 6.542); W0.01 A1 +9.904 (9.430 to 10.377), A2 +7.581 (7.487 to 7.674). Its lifetime tax is 15
   times APP's, but S277, with no amendment and the same arm A policy, shows the same at 11.7 times (finding 2), and
   the engine's year does not read the MPAA label (`src/App.jsx` 3416, 3536, 3577, 3618: contribution room only).
6. **MINOR.** "The model agrees with the engine on all 80,000 paths" is agreement on survival, on the first 500 paths
   of each solver unit (`beside.engineOnly`, `modelOnly`); say so.
7. **MINOR.** Each unit's log prints its survival (`run ...: engine 96.2600 on 5000`). The statement made at the read
   (the registration, "What became of D4" and "Where it runs") should say whether any `case*.txt` was opened between the
   first stage's end and the read; the three launch logs hold none of those lines, and the registered gate's refusal
   printed no outcome. This review cannot check a negative.
