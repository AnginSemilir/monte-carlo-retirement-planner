# Prediction: measure-pause-s128

- **Run:** `research/solver/batch-pause128.sh` - results/diagpause128/case0-2.txt (audit-pause.mjs with PAUSE_HH=S128, three parts of one arm), read by `reduce-pause128.mjs` into results-pause128.txt
- **Kind:** measurement
- **Written:** 6 Oct, before the run (its time is its registering commit's, git log). The design is the deep review after PAUSE's out-of-sample step (deep-review-log.md 6 Oct 01:52 UK: "Out of sample before it: a PAUSE sweep of SNAP, HYB and P-LO on S128's first 1000 paths with the cell-inclusive first-fall figure registered unseen"), before FORCE-X (PLAN.md's schedule), under the maintainer's standing go-ahead of 4 Oct ("I go ahead with your recommendations ... until I say stop").
- **Seeds:** 7005 (EDGE-SPLIT's), the first 1,000 of its 6,000 paths on S128 (research/engine.mjs pathsForSeed builds each path from the seed and its own index alone). No held-out seed is touched.
- **Unmasking:** none: a measurement. It changes no arm and reads no outcome; it reads the shape of each arm's own read over the used allowance where the arm pauses, on a household PAUSE did not sweep.
- **Plan section:** PLAN.md O111 (the re-read this tests out of sample), the schedule's PAUSE-S128 row; FORCE-X follows it

## Question

PAUSE's re-read (results-derive-pause-review.txt; O111, HOLD-PRICE, grade C because the deep review saw PAUSE's figures before writing it) says each arm pauses just below the first point where its own read prices the allowance: on S130 SNAP and P-LO in [0.70, 0.75) on 1.000 of their main band's flat years, HYB in [0.20, 0.25) on 1.000, and the first fall past the switch margin, counted from u's own grid cell, lies within 0.1 of u on 0.980 (SNAP), 0.866 (P-LO) and 0.968 (HYB). Written after the figures were seen, that reading has not been tested. Does it hold on S128, whose sweep nobody has seen?

## Derivation

**From the code (grade A):** as PAUSE's (predictions/measure-pause.md): the allowance axis has three buckets (u = 0, 0.5, 1); the snapped read steps at 0.25 and 0.75; SNAP's tables price the first half at exactly 0 (results-derive-pause-review.txt section 5), so SNAP's read first prices at 0.75; P-LO interpolates at or below 0.5 and snaps above (a step at 0.75); HYB reads PCLSI's tables snapped, so both its edges (0.25, 0.75) can price. The measure is the fixed move (the score of the move the run took, read over u), PAUSE's primary measure.

**What is already seen of S128 (declared):** EDGE-SPLIT's flat years by band (results-edge.txt REPORTED, a path's mean in [0.15, 0.25) / [0.25, 0.6) / [0.6, 0.75)): SNAP 0.00 / 0.20 / 5.42, P-LO 0.00 / 0.17 / 6.60, HYB 1.18 / 0.12 / 2.21. Where inside a band the pauses sit, and the read's shape over u, are not seen: no sweep has run on S128.

**What the run checks before any figure:** each arm's u, pension pot and other pots, every year of the first 1,000 paths, equal EDGE-SPLIT's S128 file for the arm (HYB: HYB's own S128 HYB arm), those files first through their own gates; the sweep's self-check on every flat year, run on more than nothing; a case line for any other household refused; the scale plant caught by the audit's self-check and refused by the gate (the preflight).

**The registered figures** (reduce-pause128.mjs section 2), per arm over its POST-ACCESS FLAT YEARS (pension live, u in [0.15, 0.99); no band is chosen, so no band choice can fit the result):
- **LOC:** the share with u in the cell just below one of the arm's price points, [p - 0.05, p): SNAP and P-LO p = 0.75; HYB p = 0.25 or 0.75.
- **FIRST:** the share whose first fall past the switch margin (1e-3), counted from u's own grid cell up, lies within 0.1 of u (derive-pause-review.mjs fallsFrom, copied into the reducer with its planted case).

An arm with under 100 post-access flat years is not read (EDGE-SPLIT's band means put each arm well above it on 1,000 paths). The reducer's planted set (21 cases, an EDGES line) and its mutations (22 of 22 caught, results-reduce-pause128-mutations.txt) check the figures, the bounds and the reading line.

No derivation script: no figure is computed before the run.

## Prediction

HOLD-PRICE out of sample, the deep review's credence 0.75 for the cause, the author's 0.65 that this run reads HELD (HYB's upper band on S128, 2.21 a path, is the least sure part: on S130 HYB barely paused there, 0.04):
- **SNAP and P-LO** pause in [0.70, 0.75): LOC 0.75 or more, FIRST 0.75 or more.
- **HYB** pauses in [0.20, 0.25) or [0.70, 0.75): LOC 0.75 or more, FIRST 0.75 or more.

## Falsified if

A measurement settles no default; it is read against this description and logged in the register (reduce-pause128.mjs prints the reading):
- **HELD:** LOC and FIRST 0.75 or more on all three arms;
- **FALSIFIED:** LOC or FIRST under 0.5 on any arm read - the pauses do not sit at the read's first price point on S128, and FORCE-X's design (which forces the draw past that point) is rewritten before it registers;
- **INCONCLUSIVE** otherwise;
- the identity failing refuses the run at the gate (the arms re-run would not be EDGE-SPLIT's).

## Fair-test table

One set of arms (EDGE-SPLIT's SNAP and P-LO, HYB's HYB arm), measured on their own states; no comparison is tested.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - lambda held, no landing |
| 12 | The paths | EDGE-SPLIT's first 1,000 on S128 (seed 7005) | the same | SAME - and held to EDGE-SPLIT's S128 files year for year by the identity |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 31 | Paired or not, and the standard error used | shares | the same | N/A - no comparison carries a standard error |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read (XAS-R2 runs beside it) |

- **All other rows: SAME**

## Decision fed

FORCE-X's registration (PLAN.md's schedule; the deep review after PAUSE): HELD or INCONCLUSIVE, FORCE-X registers as proposed, its force placed at each arm's own price point; FALSIFIED, FORCE-X's mechanism line and its force point are rewritten from this run's sweep before it registers. No default, no product change.

## Provenance

- **The design:** the deep review after PAUSE (deep-review-log.md 6 Oct 01:52 UK), FORCE-X's out-of-sample step.
- **The build (f86c80c):** audit-pause.mjs gains PAUSE_HH=S128 (three parts of one arm; unset, PAUSE's S130 run unchanged); reduce-pause128.mjs (gate, files through reduce-pause.mjs's checkFile, the identity against EDGE-SPLIT's and HYB's S128 files, the registered figures and reading; 21 planted cases); mutate-reduce-pause128.py; batch-pause128.sh and preflight-pause128.sh.

## Point and interval

80% intervals, the author's:
- **LOC:** SNAP 0.95 (0.7 to 1.0); P-LO 0.95 (0.7 to 1.0); HYB 0.85 (0.4 to 1.0).
- **FIRST:** SNAP 0.95 (0.7 to 1.0); P-LO 0.85 (0.6 to 0.95); HYB 0.9 (0.5 to 1.0).
- **Flat years a path (all bands, u under 0.99):** within 2 of EDGE-SPLIT's S128 band totals plus the pre-access years.

## Budget line

From PAUSE (results/diagpause case logs, 30 points, 1,000 paths): a part's solve about 5 minutes, its forward run about 2 and its sweep 2 to 8 minutes for its flat years. Three parts one at a time beside XAS-R2: under an hour, under 1 core-hour.

## Seen before launch

The preflight's reducer (results/diagpause128-preflight; reduce-pause128.mjs --preflight) prints the gate and the identity only, no figure; nothing in the measure, the price points, the thresholds or the intervals is changed after it.

## Changes after seeing results

None: no result has been seen.
