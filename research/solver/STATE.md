# The solver research: where it stands

Read whole at every session start (CLAUDE.md imports it). The rules are `CHECKLIST.md` (eight lines). The plan is Part B
of the external review of 21 Oct (`research/reviews/2026-10-21/EXTERNAL-REVIEW.md`), adopted by the maintainer that day
and worked in order. Everything before it (the plan, its history, the review and deep-review logs, the lessons, the
predictions, the items and the escalations) is in `research/solver/archive/`, unchanged: nothing edits it and no check
reads it. Every figure below sits in a printed block, written by `node research/solver/state.mjs --write` from the
results files and checked by `check-state.mjs` in the pre-commit hook and CI.

## 1. The product question

Does the optimising solver, its tables executed by the app's own engine, give a UK household better outcomes than the
app's current rules (survival first, then spending and the estate), with no material harm to any household? The
research candidate is confirmed against the shipped settings once, on a held-out seed (7u-F), and then meets the app's
rules head to head (Phase 4) before anything changes in the app. Until then the app's defaults do not move.

## 2. The candidate and the product baseline

<!-- printed:candidate -->
- The candidate (`research/solver/candidate.json`, read by candidate.mjs: assembled for 7u-F with the adaptive package, D5, and frozen until 7u-F reads): bridgeRead "reader", tierState true, jointWorlds true, bequestWeight 0.02, bridgeStep "exact", switchCharge 0.001, switchMargin 0, e3 true, pclsInterp true, e3pcls true, readerRef "adaptive", adaptiveLattice {"na":160,"nb":41,"nz":128,"foot":true,"stepAll":true}, readerSplit "rs"; tiers o60-blend (O60's blend medians: High Risk 4.97%, Medium/High Risk 4.65%, Medium Risk 4.18%, Medium/Low Risk 3.55%, Low Risk 2.76%). Hash e65e5e99ba49; before the assembly, the package's keys removed (`FROZEN_OPTS`, 7u's CAND): a61dba4ee1f5.
- 7u-F's decomposing arm (DECOMP, D5): the candidate on the plan reference, readerRef and its lattice removed (`audit-7uf.mjs`). Hash be76284e736c.
- The product baseline (`PRODUCT_BASELINE`, src/solver/solve.js): resilienceWeight 0, raiseWeight 0.003, finalExact true, mix 3, points 30, raiseSurvival true, failureShortfall true, finalIntegral true, bridgeRead false, e3 false. Hash 07c069b6e330.
- The solver code the e3pcls pin last passed on: f53619ccd673e7b0 (21 Oct, 22:08 UK); the code now: f53619ccd673e7b0.
<!-- end printed:candidate -->

The decided defaults (the app's, and the candidate's), pinned to the code by `research/tests/plan-defaults.test.mjs`,
`candidate.test.mjs`, `e3-default.test.mjs`, `e3pcls-guard.test.mjs` and `f1-default.test.mjs`:

<!-- decided-defaults
{"raiseCap": 1.1, "minPotYears": 1, "estateWeightMin": 0.01, "thinSurvival": 0.85, "thinPaths": 1000, "thinSeed": 7101,
 "raiseSurvival": true, "failureShortfall": true, "finalIntegral": true, "riskAboveDefault": "auto", "giaTiers": "refused", "bridgeRead": false, "e3": false, "e3Research": true, "pclsInterp": false, "pclsInterpResearch": true, "e3pcls": false, "e3pclsResearch": true,
 "candidate": {"bridgeRead": "reader", "tierState": true, "jointWorlds": true, "bequestWeight": 0.02, "bridgeStep": "exact", "switchCharge": 0.001, "switchMargin": 0, "e3": true, "pclsInterp": true, "e3pcls": true,
   "readerRef": "adaptive", "adaptiveLattice": {"na": 160, "nb": 41, "nz": 128, "foot": true, "stepAll": true}, "readerSplit": "rs", "tiers": "o60-blend"},
 "margins": {"high": 0.25, "low": 0.5, "pooled": 0.1, "highAt": 95, "rel": 0.1}, "marginRelFloor": "report-only"}
-->

## 3. Decisions in force

One line each, newest first: the date, who, the decision. The rulings recorded before 21 Oct that are not here have
lapsed; they stay in the archive.

- D1. 21 Oct, maintainer: the external review is adopted; Part B is the plan, worked in order, Step 1 first; enforcement
  is unlocked for the rework as needed; follow-up questions go to the maintainer at its end.
- D2. 21 Oct, maintainer: the 18 Oct 17:19 ruling is amended: 7u-F is released on measured differences in simulated
  outcomes, not on gaps between a table and simulation.
- D3. 21 Oct, maintainer (kept as written 22 Oct 05:16 UK, after the design review showed a true loss of exactly `1`
  point reads as harm half the time): 7u-F's decision rule is Part B Step 4's recommendation. Scored by the engine (`runPolicy`'s
  outcome beside it; a household where the two differ beyond noise is a fidelity gap, not a result). Primary, pooled:
  7u's item 4 as it was, the paired survival change summed over the households outside the gain set, its interval taken
  by path, passing when its lower end is above minus `0.1` points. Primary, per household: harm is a Holm-adjusted
  one-sided exact McNemar p below `0.05` together with a loss of at least `1` point, counted where SHIP survives between
  `5%` and `99.5%`; outside that band the change is reported, not gated. `16,000` paths, seed 7014 used once, both
  estate weights. Pass on both: the candidate goes to Phase 4. Harm on a household: it goes to V4's measures, and no new
  reader or reference variant is opened on it.
- D4. 21 Oct, maintainer: until a ceiling exists, V4's two measures are the stopping rule for the grid and cliff work:
  the policy ensemble's gap under `0.2` points on the panel mean and `0.5` on every household, and the purpose test
  beyond noise at no more than `5%` of positions, at both estate weights. Step 8h's ceiling stays the certificate, built
  when the maintainer wants it or when the two measures disagree.
- D5. 20 Oct 14:30, maintainer: the adaptive package (readerRef 'adaptive', its lattice with foot and stepAll, the 'rs'
  split) is the reference the assembled candidate takes, entering CANDIDATE_OPTS only at 7u-F's assembly; 7u-F carries
  a decomposing arm (the final candidate on the plan reference) that splits the reference's part out.
- D6. 19 Oct 09:26, maintainer: each fix is tested against the frozen candidate, not one updated with recent fixes;
  fixes that interact are tested as a factorial.
- D7. 18 Oct 07:50 and 17:19 (as amended by D2), maintainer: 7u-F runs once, widened to the deposit households whose
  bridge is at risk, a broad slice and a by-world item; gate 5 (solve time) waits for an estimate of its impact.
- D8. 11 Oct, maintainer (PR13): where SHIP survives below the margin, a relative no-harm margin of a tenth; a household
  too near-dead to certify is reported, never certified.
- D9. 7 Oct 22:50, maintainer: e3pcls is a research default, guarded by the pin (`solver-e3pcls.test.mjs 4 --pin` after
  every solver change; `solveCandidate` refuses a stale pin).
- D10. 6 Oct 11:08 and 12:08, maintainer: the research candidate is one settings object (`candidate.mjs`); the
  interpolated allowance axis is its default, not the app's.
- D11. 29 Sep 08:45 and 6 Oct 12:51, maintainer: gate 5, at most a quarter more solve time than today's product, E2
  counted.
- D12. 1 Oct 06:45, maintainer: the app's defaults (`PRODUCT_BASELINE`, the decided defaults) do not change until after
  Phase 4.
- D13. 30 Sep 18:50, maintainer: O60 (each tier's return at the median of its blend) and Q's year-1 fix join the
  candidate before 7u.
- D14. 29 Sep 07:49, maintainer: the bundle: the bridge reader with the tier state and joint worlds at estate weight
  `0.02`.
- D15. 26 Sep 10:23, maintainer: 7q, the winning bridge fix against a fixed policy through the bridge, runs before Phase 4.
- D16. 25 Sep 09:36 and 06:31, maintainer: the exact final year is the product default; risk above the user's tier
  defaults to 'auto' at `85%` simulated survival.
- D17. 24 Sep 18:30, maintainer: raw results stay outside git (`research/solver/results/`); the read-outs are committed.
- D18. Standing design choices (the archived plan's list): Part C's baseline is the plan as entered with the plain draw
  order; the bridge safety margin stays as a lock; the retirement-age dial pre-solves three years either way; old
  exports import as the baseline; habit is left out; the cash buffer is sized on the planned target; a couples reserve
  is model-predictive control; E3 follows Phase 4 for the product.
- D19. Standing (CLAUDE.md): the maintainer's own household is never a fixture; no model identifier in a commit, a code
  comment or a pushed file; merge to `main` only after `bash research/ui-harnesses/run-all.sh 4173` prints ALL REQUIRED
  GREEN; background runs are harness-tracked tasks.
- Lapsed with Step 3 (21 Oct): the receipt after every plan edit and the Stop hook; the deep review after every result,
  `uncertainty.mjs` and the escalation trigger; credences, derived credences, the scorecard, decision tables, mechanism
  anchors and the CARRY rule; per-reducer mutation scripts for exploratory reducers; `relook.mjs` and the commit-msg
  hook; `check-plan.mjs`'s prose rules; the per-close lessons and trigger codes.

## 4. Open items

Each with its measured effect on simulated outcomes. An item with no measured effect and no decision resting on it is
dropped, not carried; Step 4's triage settles each below.

<!-- printed:items -->
| id | the item | measured effect on simulated outcomes (results file) | what closes it | status |
|---|---|---|---|---|
| U-S224 | 7u: CAND against SHIP on S224 at estate weight 0.02, inconclusive | -0.362 points (exact -0.717 to 0.002; 89 saved, 118 lost of 8000) (`results-7u.txt` item 1) | 7u-F | open |
| U-S380 | the same on S380, inconclusive | -0.163 points (exact -0.605 to 0.283; 150 saved, 163 lost of 8000) (`results-7u.txt` item 1) | 7u-F | open |
| U-S364 / O132 | the same on S364, a plan that survives under half a percent under either arm | -0.388 points (exact -0.388 to -0.301; 0 saved, 31 lost of 8000) (`results-7u.txt` item 1) | reported in 7u-F, not gated (SHIP below 5%) | open |
| O191 | the adaptive reference against the plan reference, S362's bad world | -0.3250 points (exact -0.5782 to 0.0089) (`results-refb.txt`) | reported in 7u-F's by-world item; below the 1-point gate | open, not a gate |
| O179 | the fixed reference against the unfixed on S362's bad world | -0.5750 points (-0.7187 to -0.3126; 4 saved, 27 lost of 4000) (`results-foot-s362.txt`) | as O191 | open, not a gate |
| O195 | S366 unread at the frozen candidate | none yet: a missing read | 7u-F's panel reads it | open |
| O194 | the bridge reader's reference, undecided | none: a choice | the assembly carries it (D5: the adaptive package in candidate.json) | closed by the assembly |
| PR35 | the twelve-point rule on each side of a bridge split, under the package | its worst miss against the 4,000-return reference, in score units (survival as a fraction): 9.120e-4 (year 2 gain 2 x 0.225, world 0, taxable before ISA, spend 90%) (`results-pr31-split.txt`) | below a tenth of a point of survival whatever its sign: not a bug (Step 4's rule) | closed, reported |
| PR24, PR29, PR31 | premises naming 7u-F: the order reference standing in for the candidate's, the adaptive reference's exact steps, the chooser's split at the reference's own step | carried by D5: the adaptive package, with PR31's split, is the reference the assembled candidate takes, and 7u-F's decomposing arm reads the reference's part | 7u-F | not gates |
| T-GAPS | gaps between a table and simulation (sizes in the next block) | none measured on simulated outcomes | known limitations; 7u-F's by-world item reports them, and V3 and V4 measure what matters | not gates (D2) |
<!-- end printed:items -->

Known limitations (Step 4's triage): gaps between a table's own forecast and simulation, with no measured effect on
simulated outcomes. A table gap is a lead, not a verdict; none gates 7u-F (D2).

<!-- printed:limitations -->
- O133, year-0 tables above simulation on the broad households below 95: SHIP broad households below 95 17; table above the simulation on 16 (from 0.29 on S394 to 10.61 on S248); not above: S364 -0.39; CAND broad households below 95 17; table above the simulation on 15 (from 0.9 on S214 to 4.82 on S364); not above: S380 -0.1, S394 -2.55 (`results-o133-scan.txt`).
- O139, S380's world 0 under the candidate: table 35.0977 against 30.8500 simulated (`results-neroot.txt`).
- O145, the under-read left when the wealth axis is refined (S224, S380): a deep review's extrapolation, in no results file (archive/deep-review-log.md, 11 Oct).
- O180, S370's bad world: table 51.3448 against 38.0000 run (152 of 400), 13.3448 points over (`results-hodep-s370.txt`).
- O189, S128's bridge part: world 0 GB 2.6233, world 1 GB 2.1200 points (`results-copyb.txt`).
- O198, the top-cell fix's year-1 residual under the plan reference, world 0: -0.5125 points (`results-copyx.txt`).
- TOP-CELL, AA-UR and FD-X: diagnostics of table reads, not run; dropped as gates (D2).
<!-- end printed:limitations -->

### Step 1 (21 Oct): the product-path defects, fixed

O200 (the final year's NaN), O199 (the same in the adaptive reference), F0 (the sweep's gain untaxed in the solver's
models), F2a (the engine's tier above), F0a (the 2026/27 rules, guardrails and the lookahead under a table). Checking F0
against the engine found one more: the solver's forward runs clamped the taxable account's gain share at zero and so
forgot an unrealised loss the engine keeps in its basis; they now carry it (`solver-carry.test.mjs`, check 4). The same
silent-NaN choice remains in `adaptive.js` (its two argmax loops) and `couple.js` (research only); their known source is
fixed, and V1 runs on the assembled candidate (Step 4).

<!-- printed:step1 -->
- O199, O200 and the guards (items 1 to 3): `solver-invariants.test.mjs` ALL PASS: 14 checks on the fixed code, FAILED: 11 of 14 checks before it (`results-solver-invariants.txt`).
- F2a (item 5): `tier-above.test.mjs` ALL PASS: 7 checks on the fixed code, FAILED: 5 of 7 checks before it (`results-tier-above.txt`).
- F0 (item 6): `solver-carry.test.mjs` ALL PASS: 6 checks on the fixed code, FAILED: 4 of 6 checks before it (`results-solver-carry.txt`).
- F0a (item 7): `tax-2026.test.mjs` ALL PASS: 9 checks on the fixed code, FAILED: 8 of 9 checks before it (`results-tax-2026.txt`).
- F0a under a table (item 8): `table-guards.test.mjs` ALL PASS: 4 checks on the fixed code, FAILED: 4 of 4 checks before it (`results-table-guards.txt`).
- F2a's cost, S070 held at Medium Risk, the engine before and after (`results-tier-above-cost.txt`): 55.23% to 66.45%, +11.22 points (se 0.53; 451 saved, 2 lost).
- F2a's cost, S224 held at Medium Risk, the engine before and after (`results-tier-above-cost.txt`): 9.13% to 42.05%, +32.92 points (se 0.91; 1317 saved, 0 lost).
- F2a's cost, S380 held at Medium Risk, the engine before and after (`results-tier-above-cost.txt`): 6.72% to 43.05%, +36.33 points (se 0.95; 1453 saved, 0 lost).
- F0, S330, the solver's model less the engine in survival points (paths surviving only in the model / only in the engine), 2,000 paths: before +1.55 (31 / 0), after 0 (0 / 0) (`results-engine-vs-fast.txt`).
- F0, S224, the solver's model less the engine in survival points (paths surviving only in the model / only in the engine), 2,000 paths: before +0.35 (7 / 0), after 0 (0 / 0) (`results-engine-vs-fast.txt`).
- F0, S070, the solver's model less the engine in survival points (paths surviving only in the model / only in the engine), 2,000 paths: before +0.30 (6 / 0), after 0 (0 / 0) (`results-engine-vs-fast.txt`).
- F0, S008, the solver's model less the engine in survival points (paths surviving only in the model / only in the engine), 2,000 paths: before -0.05 (0 / 1), after 0 (0 / 0) (`results-engine-vs-fast.txt`).
- F0, S172, the solver's model less the engine in survival points (paths surviving only in the model / only in the engine), 2,000 paths: before +0.00 (0 / 0), after 0 (0 / 0) (`results-engine-vs-fast.txt`).
- F0, S194, the solver's model less the engine in survival points (paths surviving only in the model / only in the engine), 2,000 paths: before +0.00 (0 / 0), after 0 (0 / 0) (`results-engine-vs-fast.txt`).
- O200's reach on the frozen candidate, 7u's 55 households: pending: research/solver/results-reach-census.txt (`results-reach-census.txt`).
<!-- end printed:step1 -->

### Step 2: what the fixes could have changed (EXPLORATORY, the tuning seed)

<!-- printed:step2 -->
- S150           seed 7002, code 4635d91b2285: CAND 99.90% SHIP 99.79%; 9 saved/0 lost of 8000: change +0.113 (exact 0.037 to 0.113; unconditional 0.041 to 0.213) | 7u: +0.087 (exact 0.004 to 0.112); OUTSIDE 7u's interval
- S212           seed 7002, code 4635d91b2285: CAND 75.28% SHIP 75.39%; 32 saved/41 lost of 8000: change -0.113 (exact -0.324 to 0.109; unconditional -0.323 to 0.098) | 7u: +0.037 (exact -0.201 to 0.274); inside 7u's interval
- S214           seed 7002, code 4635d91b2285: CAND 86.94% SHIP 86.97%; 25 saved/28 lost of 8000: change -0.037 (exact -0.221 to 0.151; unconditional -0.219 to 0.144) | 7u: +0.025 (exact -0.154 to 0.201); inside 7u's interval
- S224           seed 7002, code 4635d91b2285: CAND 69.36% SHIP 69.56%; 91 saved/107 lost of 8000: change -0.200 (exact -0.551 to 0.157; unconditional -0.545 to 0.145) | 7u: -0.362 (exact -0.717 to 0.002); inside 7u's interval
- S364           seed 7002, code 4635d91b2285: CAND 0.07% SHIP 0.39%; 1 saved/26 lost of 8000: change -0.313 (exact -0.337 to -0.209; unconditional -0.464 to -0.196) | 7u: -0.388 (exact -0.388 to -0.301); inside 7u's interval
- S380           seed 7002, code 4635d91b2285: CAND 72.80% SHIP 72.55%; 155 saved/135 lost of 8000: change +0.250 (exact -0.179 to 0.674; unconditional -0.168 to 0.668) | 7u: -0.163 (exact -0.605 to 0.283); inside 7u's interval
- S394           seed 7002, code 4635d91b2285: CAND 85.64% SHIP 85.63%; 32 saved/31 lost of 8000: change +0.013 (exact -0.191 to 0.215; unconditional -0.185 to 0.210) | 7u: +0.037 (exact -0.179 to 0.251); inside 7u's interval
- VERDICT: 7 households read; 1 moved outside 7u's interval
<!-- end printed:step2 -->

### Step 4: 7u-F (the triage above, the assembly, the registration)

The triage is section 4's tables: only Step 1's bugs were fixed before 7u-F; the rest are reported in it or closed. The
assembled candidate is section 2's (`candidate.json`; `FROZEN_OPTS` is the candidate before it, 7u's CAND, and keeps its
recorded hash). V1 and V2 on the assembled candidate (`v-candidate.mjs`): V2 found the solver's forward run and the
engine apart on a few of S224's paths. The cause: a forward run rebuilt its cash each year from the buffer rule at the
cash tier's own rate (and the buffer, not the opening cash, in year 0), where the engine grows its cash at the path's
rate, so the year's sales and the gains carried into next year's CGT differed. A forward run now carries its cash in
slot 12 (`solver-cash.test.mjs`, its plant the old split); V1 and V2 run again on that code. 7u's pooled item read by
path, as Step 4 asks, and the power of 7u-F's rule from 7u's own records:

<!-- printed:step4 -->
- V1 on the assembled candidate: ALL PASS (7 of 7 households) (`results-v-candidate.txt`).
- V2 on the assembled candidate: the controls' bar 1; S330 0 / 0, S224 0 / 0, S070 0 / 0, S370 0 / 0, S380 0 / 0: ALL PASS (`results-v-candidate.txt`).
- 7u-F's budget: 97.8 core-hours, about 24.4 hours on 4 cores (`results-budget-7uf.txt`).
- 7u's item 4 (the pooled floor at W0.02, 47 households) re-read by path: 0.2880 points, by path 0.259 to 0.317 (7u's pooled cells 0.261 to 0.316; 1.07 times as wide): HELD (`results-reread-7u-item4.txt`).
- 7u's item 8 (the pooled floor at W0.01, 47 households) re-read by path: 0.3199 points, by path 0.289 to 0.350 (7u's pooled cells 0.292 to 0.348; 1.10 times as wide): HELD (`results-reread-7u-item4.txt`).
- 7u-F's power under P1 at W0.02 (7u's records on 14 of the 18 floor households; S382, S406, S418, S362 have none): its se by path at 16000 paths about 0.0184 (those four unchanged) to 0.0317 (each with S370's spread, 9.04% discordant, independent; the recorded households correlate pairwise within -0.06 to 0.05); HELD with chance 1.000 to 0.883 at no true change, and 80% of the time at a true pooled change of -0.048 to -0.011 points or more.
- 7u-F's power under P1 at W0.01 (7u's records on 14 of the 18 floor households; S382, S406, S418, S362 have none): its se by path at 16000 paths about 0.0185 (those four unchanged) to 0.0317 (each with S370's spread, 9.01% discordant, independent; the recorded households correlate pairwise within -0.03 to 0.10); HELD with chance 1.000 to 0.883 at no true change, and 80% of the time at a true pooled change of -0.048 to -0.011 points or more.
- 7u-F's power under P2 (D3: harm needs the Holm-adjusted p AND an observed loss of at least 1 point): a true loss of exactly 1 point reads as harm with chance 0.500 on every household; on the in-band households 7u ran, 80% of the time from a true loss of 1.07 to 1.20 points and 90% from 1.11 to 1.30 (the widest S370 at W0.02, 9.04% discordant); the four without a record (S382, S406, S418, S362), at 5% to 15% discordant, 80% from 1.15 to 1.26 and 90% from 1.23 to 1.39. Near the band's top, in the band on 16,000 paths only by chance: S366 at W0.02 (SHIP 99.47%) with chance 0.67, S366 at W0.01 (SHIP 99.44%) with chance 0.85; outside it the change is reported, not gated.
- check by simulation (the reducer's perHousehold, 400 replicates, Holm over 28): discordance 9.00%, a true loss of 1.00 points: harm read 0.515; the approximation 0.500.
- check by simulation (the reducer's perHousehold, 400 replicates, Holm over 28): discordance 9.00%, a true loss of 1.20 points: harm read 0.805; the approximation 0.801.
- check by simulation (the reducer's perHousehold, 400 replicates, Holm over 28): discordance 2.60%, a true loss of 1.00 points: harm read 0.540; the approximation 0.500.
- check by simulation (the reducer's perHousehold, 400 replicates, Holm over 28): discordance 2.60%, a true loss of 1.10 points: harm read 0.782; the approximation 0.784.
- check by simulation (the reducer's perHousehold, 400 replicates, Holm over 28): discordance 1.07%, a true loss of 1.07 points: harm read 0.795; the approximation 0.805.
- check by simulation (the reducer's perHousehold, 400 replicates, Holm over 28): discordance 1.10%, a true loss of 1.10 points: harm read 0.902; the approximation 0.887.
<!-- end printed:step4 -->

## 5. Running now

- Nothing. Step 1's reach count waits for 7u-F to read (it gates nothing before it): the code before the fix stopped at
  19 of the 55 households (none with a cell lost); it resumes from a worktree of the commit before Step 1 (its own pin)
  with `REACH_SKIP=<its output>`, and the count after the fix runs on 7u's candidate (`FROZEN_OPTS`).

## 6. The next three actions

1. The reviewer's design review of `registrations/fresh-7uf.md` and the code it runs (`panel-7uf.mjs`, `audit-7uf.mjs`,
   `reduce-7uf.mjs`, `batch-7uf.sh`), its verdict in `research/solver/reviews/`; a FAIL's findings fixed first.
2. On a PASS: the review named in the registration, committed and pushed, then the launch:
   `PREDICTION=research/solver/registrations/fresh-7uf.md research/solver/run-from-snapshot.sh bash research/solver/batch-7uf.sh`
   (its time box in the registration), read once by `reduce-7uf.mjs`.
3. While it runs: Step 5's V3, V4 and the purpose test are built (`v3-convergence.mjs`, `v4-ensemble.mjs`,
   `audit-bestof-cand.mjs`) and run after 7u-F reads; then the full suite (`run-all.mjs all`) and the reach count.
