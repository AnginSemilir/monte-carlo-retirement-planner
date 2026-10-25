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
- The solver code the e3pcls pin last passed on: 3a61076914b615b6 (25 Oct, 10:33 UK); the code now: 3a61076914b615b6.
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

- D28. 25 Oct, maintainer (THIRD-STEP.md, review/external-2026-10-21 at ed20ac9): the third joint tier step down
  (`tiersBelow: 3`) joins the candidate, beside HR if HR joins (D27 as settled), once the factorial confirms it; if it does
  not, it comes back to the maintainer. Where a wrapper cannot take the third step, the household keeps today's ladder.
- D27. 25 Oct, maintainer, after N4: HR's gain on S370 and S248 split into its draw-first and re-wrap halves before the
  call on HR (`batch-n4hr.sh`); settled after the read: HR whole is the factorial's HR, and the candidate's if it joins.
- D26. 24 Oct, maintainer: the candidate is measured at 45 wealth points for gate 5 and registered at 45 for Phase 4 (a
  run setting, as 7u-F's 30 was; `candidate.json` and its hash unchanged); the product's 30 stays until after Phase 4 (D12).
- D25. 24 Oct, maintainer, after V3's ladder: N4 at 45 wealth points (the coarsest V3 accepts); the speed review's instruction
  6 done whatever gate 5 shows; gate 5 measured after both. On the unlock of 24 Oct, `n4-menu.test.mjs` joins the fast suite.
- D24. 23 Oct, maintainer: the speed review (`research/reviews/2026-10-23/SPEED-REVIEW.md`, review/external-2026-10-21 at
  cff3d86, not merged) is carried out in its order, by its "How to port" rules: (1) S1 and S2 on by default in the
  product's path and the research runs, S3 in the candidate's, the defaults in the solver's code (not `PRODUCT_BASELINE` or
  `candidate.json`: they change no number, so D12's decided defaults stand); one differing bit in an identity test stops
  the port; (2) V3 and V4 run once, on the ported code; (3) gate 5 compares the candidate against the ported product. Its
  identity tests join the fast suite on the unlock of 23 Oct; its time boxes hold.
- D23. 23 Oct, maintainer: an external speed review is starting; V3 and V4 are not launched until it reports, and then
  run once, on the code it leaves; no change to `src/solver` meant to speed it up until it reports.
- D22. 23 Oct, maintainer: within Step 6, N4 (the richer move menu through V4's ensemble) runs before N1 (the coverage
  coordinate); Phase 4 is not registered until N4 has read, so Phase 4 tests the final move menu.
- D21. 22 Oct, maintainer: 7u-F, past its budget, ran its CAND and SHIP units before DECOMP's and was read once when they
  were in; on a clean PASS DECOMP stopped (it did). Phase 4's budget is measured on this machine, with nothing else running,
  before it is registered.
- D20. 22 Oct, maintainer: the follow-up review (`research/reviews/2026-10-22/FOLLOW-UP.md`, on the branch
  review/external-2026-10-21, not merged) is adopted, its ten answers to PROGRESS.md's questions and its Next section.
  The answers: (1) the one-pot oracle's table gap is a diagnostic, kept REPORTED; V3 accepts a resolution by the
  policy's convergence, prints the one-pot error at each resolution beside it, and fails if that error stops shrinking
  as points are added; (2) D3 stands for 7u-F; Phase 4's harm rule is registered by its error rates at the margin (the
  maintainer's call); (3) the reach count is dropped, its 19 households recorded in one line; (4) V2 gains a state
  check after 7u-F: the engine and a forward run in step, the engine's state mapped into the solver's vector compared
  slot by slot to a pound, and an inventory test of every engine state field as carried, derived or inert under a
  table; (5) the pre-tool hook's interpreter-script check is reverted under the maintainer's unlock, CI printing the
  protected files each push changed and the session start the same for the last day; (6) the argmax loops in
  `adaptive.js` and `couple.js` are guarded right after 7u-F, each with a planted NaN; (7) the decomposing arm stays as
  built; (8) V3 adds S330 (seven households, or in place of S002); V4 drops probit and counts V3's finest setting as a
  variant; (9) V5's interval after 7u-F, the maintainer's call; the sensitivity to the returns with Phase 4; (10) N7 is
  a standalone page built from `src/solver` that the maintainer runs on a laptop and a phone.
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
| U-S224 | 7u: CAND against SHIP on S224 at estate weight 0.02, inconclusive | 7u -0.362 points (exact -0.717 to 0.002; 89 saved, 118 lost of 8000) (`results-7u.txt` item 1); 7u-F W0.02 -0.181 (-0.359 to -0.004; 90 saved, 119 lost), W0.01 -0.281 (-0.534 to -0.029; 190 saved, 235 lost) (`results-7uf.txt`) | 7u-F | closed by 7u-F: no harm by D3 |
| U-S380 | the same on S380, inconclusive | 7u -0.163 points (exact -0.605 to 0.283; 150 saved, 163 lost of 8000) (`results-7u.txt` item 1); 7u-F W0.02 +0.081 (-0.210 to 0.373; 289 saved, 276 lost), W0.01 +0.206 (-0.085 to 0.497; 298 saved, 265 lost) (`results-7uf.txt`) | 7u-F | closed by 7u-F: no harm by D3 |
| U-S364 / O132 | the same on S364, a plan that survives under half a percent under either arm | 7u -0.388 points (exact -0.388 to -0.301; 0 saved, 31 lost of 8000) (`results-7u.txt` item 1); 7u-F W0.02 +0.056 (0.016 to 0.103; 9 saved, 0 lost), W0.01 +0.156 (0.097 to 0.228; 25 saved, 0 lost) (`results-7uf.txt`) | reported in 7u-F, not gated (SHIP below 5%) | closed by 7u-F: reported |
| O191 | the adaptive reference against the plan reference, S362's bad world | -0.3250 points (exact -0.5782 to 0.0089) (`results-refb.txt`) | 7u-F's decomposing arm stopped unread on the PASS (D21); V4's ensemble carries the candidate on the plan reference (D20 (8)) | open, not a gate |
| O179 | the fixed reference against the unfixed on S362's bad world | -0.5750 points (-0.7187 to -0.3126; 4 saved, 27 lost of 4000) (`results-foot-s362.txt`) | as O191 | open, not a gate |
| O195 | S366 unread at the frozen candidate | 7u-F W0.02 +0.106 (0.055 to 0.167; 17 saved, 0 lost), W0.01 +0.125 (0.068 to 0.192; 21 saved, 1 lost) (`results-7uf.txt`) | 7u-F's panel reads it | closed by 7u-F |
| O194 | the bridge reader's reference, undecided | none: a choice | the assembly carries it (D5: the adaptive package in candidate.json) | closed by the assembly |
| PR35 | the twelve-point rule on each side of a bridge split, under the package | its worst miss against the 4,000-return reference, in score units (survival as a fraction): 9.120e-4 (year 2 gain 2 x 0.225, world 0, taxable before ISA, spend 90%) (`results-pr31-split.txt`) | below a tenth of a point of survival whatever its sign: not a bug (Step 4's rule) | closed, reported |
| PR24, PR29, PR31 | premises naming 7u-F: the order reference standing in for the candidate's, the adaptive reference's exact steps, the chooser's split at the reference's own step | carried by D5: the adaptive package, with PR31's split, is the reference the assembled candidate takes | 7u-F | closed by 7u-F's PASS on the candidate as assembled, not by a measurement: the decomposing arm's read was waived by D21, and PR29's and PR31's premises stay untested (no decision rests on them) |
| T-GAPS | gaps between a table and simulation (sizes in the next block) | none measured on simulated outcomes | known limitations; 7u-F's by-world item reports them, and V3 and V4 measure what matters | not gates (D2) |
<!-- end printed:items -->

Known limitations (Step 4's triage): gaps between a table's own forecast and simulation, with no measured effect on
simulated outcomes. A table gap is a lead, not a verdict; none gates 7u-F (D2).

<!-- printed:limitations -->
- O133, year-0 tables above simulation on the broad households below 95: SHIP broad households below 95 17; table above the simulation on 16 (from 0.29 on S394 to 10.61 on S248); not above: S364 -0.39; CAND broad households below 95 17; table above the simulation on 15 (from 0.9 on S214 to 4.82 on S364); not above: S380 -0.1, S394 -2.55 (`results-o133-scan.txt`).
- O139, S380's world 0 under the candidate: table 35.0977 against 30.8500 simulated (`results-neroot.txt`).
- O180, S370's bad world: table 51.3448 against 38.0000 run (152 of 400), 13.3448 points over (`results-hodep-s370.txt`).
- O189, S128's bridge part: world 0 GB 2.6233, world 1 GB 2.1200 points (`results-copyb.txt`).
- O198, the top-cell fix's year-1 residual under the plan reference, world 0: -0.5125 points (`results-copyx.txt`).
- TOP-CELL, AA-UR and FD-X: diagnostics of table reads, not run; dropped as gates (D2).
<!-- end printed:limitations -->

### Step 1 (21 Oct): the product-path defects, fixed

O200 (the final year's NaN), O199 (the same in the adaptive reference), F0 (the sweep's gain untaxed in the solver's
models), F2a (the engine's tier above), F0a (the 2026/27 rules, guardrails and the lookahead under a table). Checking F0
against the engine found one more: the solver's forward runs clamped the taxable account's gain share at zero and so
forgot an unrealised loss the engine keeps in its basis; they now carry it (`solver-carry.test.mjs`, check 4). After
7u-F (D20 (6)) the same silent-NaN choice in `adaptive.js` (its two argmax loops) and `couple.js` (the joint move) throws
too, and `fast.js`'s guardrail "lost money last year" flag compares the pots after growth with those before it, as the
engine does (it grew the pension and ISA a second time; inert under a table, which runs with guardrails off). V2's
state check (D20 (4)) then found one more of F0's kind: the engine never realises a loss, so a taxable account sold out
below its cost keeps that basis and money paid in later joins it, where a forward run's gain share (of a value of
nothing) dropped it; a forward run now carries it in slot 13 (S370 the household that refills; no table reads the slot).

<!-- printed:step1 -->
- O199, O200 and the guards (items 1 to 3): `solver-invariants.test.mjs` ALL PASS: 14 checks on the fixed code, FAILED: 11 of 14 checks before it (`results-solver-invariants.txt`).
- F2a (item 5): `tier-above.test.mjs` ALL PASS: 7 checks on the fixed code, FAILED: 5 of 7 checks before it (`results-tier-above.txt`).
- F0 (item 6): `solver-carry.test.mjs` ALL PASS: 6 checks on the fixed code, FAILED: 4 of 6 checks before it (`results-solver-carry.txt`).
- F0a (item 7): `tax-2026.test.mjs` ALL PASS: 9 checks on the fixed code, FAILED: 8 of 9 checks before it (`results-tax-2026.txt`).
- F0a under a table (item 8): `table-guards.test.mjs` ALL PASS: 4 checks on the fixed code, FAILED: 4 of 4 checks before it (`results-table-guards.txt`).
- F2a's cost, each household held at Medium Risk, the engine before and after (`results-tier-above-cost.txt`): S070 55.23% to 66.45%, +11.22 points (se 0.53; 451 saved, 2 lost); S224 9.13% to 42.05%, +32.92 points (se 0.91; 1317 saved, 0 lost); S380 6.72% to 43.05%, +36.33 points (se 0.95; 1453 saved, 0 lost).
- F0, the solver's model less the engine in survival points (paths surviving only in the model / only in the engine), 2,000 paths: S330 before +1.55 (31 / 0), after 0 (0 / 0); S224 before +0.35 (7 / 0), after 0 (0 / 0); S070 before +0.30 (6 / 0), after 0 (0 / 0); S008 before -0.05 (0 / 1), after 0 (0 / 0); S172 before +0.00 (0 / 0), after 0 (0 / 0); S194 before +0.00 (0 / 0), after 0 (0 / 0) (`results-engine-vs-fast.txt`).
- O200's reach (item 4), counted and then dropped: on the code before the fix, 19 of 7u's 55 households counted, cells with no move chosen 0, non-finite 0; the count then dropped (the follow-up review of 22 Oct, answer 3: 7u-F re-solves every household on the fixed code, whose guards throw on a cell with no move) (`results-reach-census.txt`).
- After 7u-F, the argmax loops left (`adaptive.js`, `couple.js`) and `fast.js`'s lost-year flag: `solver-guards.test.mjs` ALL PASS: 9 checks on the fixed code, FAILED: 4 of 9 checks with the guards out and the old flag line back (`results-solver-guards.txt`).
- V2's state check (D20 (4)), the engine and a forward run in step on the light candidate: `state-check.test.mjs --full` ALL PASS: 14 checks on the fixed code, FAILED: 2 of 14 checks on the code before it (`results-state-check.txt`). Before, over 6948 household-years, the gaps above a pound: pension £20215.3898 (S370 path 33 year 45); ISA £1437.3052 (S370 path 33 year 19); taxable and cash £1158.9166 (S370 path 33 year 13); tax-free cash taken £640.1828 (S370 path 33 year 21); cash ISA £1158.9166 (S370 path 33 year 13); gains carried £1005.4959 (S370 path 20 year 7); cash £1158.9166 (S370 path 33 year 13); gain held £6231.3869 (S370 path 20 year 5); wealth at the end £17242.3713 (S370 path 33); after, over 6948 household-years, every gap within a pound (the largest 1.1e-8 pounds, pension). The engine's taxable account empty with a basis left on it, in some year: 90 of 200 paths (the largest £68218, S370 path 15). On the fixed code the engine's own pick differs from the forward run's in 5 of 6948 years, the largest score gap 6.9e-18 against the chooser's tie tolerance 1.0e-12: ties.
<!-- end printed:step1 -->

### Step 2: what the fixes could have changed (EXPLORATORY, the tuning seed)

<!-- printed:step2 -->
- S150 seed 7002, code 4635d91b2285: CAND 99.90% SHIP 99.79%; 9 saved/0 lost of 8000: change +0.113 (exact 0.037 to 0.113; unconditional 0.041 to 0.213) | 7u: +0.087 (exact 0.004 to 0.112); OUTSIDE 7u's interval || S212 seed 7002, code 4635d91b2285: CAND 75.28% SHIP 75.39%; 32 saved/41 lost of 8000: change -0.113 (exact -0.324 to 0.109; unconditional -0.323 to 0.098) | 7u: +0.037 (exact -0.201 to 0.274); inside 7u's interval || S214 seed 7002, code 4635d91b2285: CAND 86.94% SHIP 86.97%; 25 saved/28 lost of 8000: change -0.037 (exact -0.221 to 0.151; unconditional -0.219 to 0.144) | 7u: +0.025 (exact -0.154 to 0.201); inside 7u's interval || S224 seed 7002, code 4635d91b2285: CAND 69.36% SHIP 69.56%; 91 saved/107 lost of 8000: change -0.200 (exact -0.551 to 0.157; unconditional -0.545 to 0.145) | 7u: -0.362 (exact -0.717 to 0.002); inside 7u's interval || S364 seed 7002, code 4635d91b2285: CAND 0.07% SHIP 0.39%; 1 saved/26 lost of 8000: change -0.313 (exact -0.337 to -0.209; unconditional -0.464 to -0.196) | 7u: -0.388 (exact -0.388 to -0.301); inside 7u's interval || S380 seed 7002, code 4635d91b2285: CAND 72.80% SHIP 72.55%; 155 saved/135 lost of 8000: change +0.250 (exact -0.179 to 0.674; unconditional -0.168 to 0.668) | 7u: -0.163 (exact -0.605 to 0.283); inside 7u's interval || S394 seed 7002, code 4635d91b2285: CAND 85.64% SHIP 85.63%; 32 saved/31 lost of 8000: change +0.013 (exact -0.191 to 0.215; unconditional -0.185 to 0.210) | 7u: +0.037 (exact -0.179 to 0.251); inside 7u's interval (`results-recheck-7u.txt`).
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
- V1 on the assembled candidate: ALL PASS (7 of 7 households) (`results-v-candidate.txt`). V2 on the assembled candidate: the controls' bar 1; S330 0 / 0, S224 0 / 0, S070 0 / 0, S370 0 / 0, S380 0 / 0: ALL PASS (`results-v-candidate.txt`). 7u-F's budget: 97.8 core-hours, about 24.4 hours on 4 cores (`results-budget-7uf.txt`).
- 7u's item 4 (the pooled floor at W0.02, 47 households) re-read by path: 0.2880 points, by path 0.259 to 0.317 (7u's pooled cells 0.261 to 0.316; 1.07 times as wide): HELD (`results-reread-7u-item4.txt`). 7u's item 8 (the pooled floor at W0.01, 47 households) re-read by path: 0.3199 points, by path 0.289 to 0.350 (7u's pooled cells 0.292 to 0.348; 1.10 times as wide): HELD (`results-reread-7u-item4.txt`).
- 7u-F's power under P1 at W0.02 (7u's records on 14 of the 18 floor households; S382, S406, S418, S362 have none): its se by path at 16000 paths about 0.0184 (those four unchanged) to 0.0317 (each with S370's spread, 9.04% discordant, independent; the recorded households correlate pairwise within -0.06 to 0.05); HELD with chance 1.000 to 0.883 at no true change, and 80% of the time at a true pooled change of -0.048 to -0.011 points or more. 7u-F's power under P1 at W0.01 (7u's records on 14 of the 18 floor households; S382, S406, S418, S362 have none): its se by path at 16000 paths about 0.0185 (those four unchanged) to 0.0317 (each with S370's spread, 9.01% discordant, independent; the recorded households correlate pairwise within -0.03 to 0.10); HELD with chance 1.000 to 0.883 at no true change, and 80% of the time at a true pooled change of -0.048 to -0.011 points or more.
- 7u-F's power under P2 (D3: harm needs the Holm-adjusted p AND an observed loss of at least 1 point): a true loss of exactly 1 point reads as harm with chance 0.500 on every household; on the in-band households 7u ran, 80% of the time from a true loss of 1.07 to 1.20 points and 90% from 1.11 to 1.30 (the widest S370 at W0.02, 9.04% discordant); the four without a record (S382, S406, S418, S362), at 5% to 15% discordant, 80% from 1.15 to 1.26 and 90% from 1.23 to 1.39. Near the band's top, in the band on 16,000 paths only by chance: S366 at W0.02 (SHIP 99.47%) with chance 0.67, S366 at W0.01 (SHIP 99.44%) with chance 0.85; outside it the change is reported, not gated. P2's approximation checked by simulation (the reducer's perHousehold, 400 replicates, Holm over 28): discordance 9.00%, a true loss of 1.00 points: harm read 0.515; the approximation 0.500 | discordance 9.00%, a true loss of 1.20 points: harm read 0.805; the approximation 0.801 | discordance 2.60%, a true loss of 1.00 points: harm read 0.540; the approximation 0.500 | discordance 2.60%, a true loss of 1.10 points: harm read 0.782; the approximation 0.784 | discordance 1.07%, a true loss of 1.07 points: harm read 0.795; the approximation 0.805 | discordance 1.10%, a true loss of 1.10 points: harm read 0.902; the approximation 0.887.
<!-- end printed:step4 -->
### 7u-F's read (23 Oct, once, by D3 as registered)

`registrations/fresh-7uf.md`, read by `reduce-7uf.mjs` when every CAND and SHIP unit was in (D21), its output whole in
`results-7uf.txt`. By D3 the PASS sends the candidate to Phase 4; by D21 DECOMP stopped on it, none of its units
finished.

<!-- printed:sevenuf -->
- the gate: fair; 19 households, seed 7014, 16000 paths a unit, scored by the engine (`results-7uf.txt`).
- P1 at W0.02: the pooled change over the 18 floor households +0.660 points (by path 0.616 to 0.705, se 0.0226): HELD. P1 at W0.01: the pooled change over the 18 floor households +0.702 points (by path 0.656 to 0.747, se 0.0232): HELD.
- P2: 28 household-weight pairs in the band [5, 99.5], Holm over them; harmed: none. OUTCOME: PASS: the candidate goes to Phase 4.
- In the band with a loss at an unadjusted one-sided p below 0.05, none harm by D3: S224 W0.02 -0.181 (-0.359 to -0.004; 90 saved, 119 lost; p 2.63e-2, Holm 7.09e-1; the 0.25 margin not clear, the 0.5 margin clear; whole score -0.264 (se 0.1841) on the first 4000 paths only); S224 W0.01 -0.281 (-0.534 to -0.029; 190 saved, 235 lost; p 1.63e-2, Holm 4.58e-1; the 0.25 margin not clear, the 0.5 margin not clear; whole score -0.840 (se 0.2588) on the first 4000 paths only); S394 W0.02 -0.125 (-0.265 to 0.014; 54 saved, 74 lost; p 4.63e-2, Holm 1.00e+0; the 0.25 margin not clear, the 0.5 margin clear; whole score +0.107 (se 0.1317) on the first 4000 paths only).
- DECOMP not read for 30 household-weights (D21: stopped on the PASS); fidelity gaps between the engine and runPolicy: 0.
<!-- end printed:sevenuf -->

### The speed review's port (D24)

<!-- printed:speed -->
- Finding 1, the chooser's scratch sized to the state it scores: `solver-scratch.test.mjs` ALL PASS: 6 checks on the fixed code, FAILED: 4 of 6 checks on the code before it, where 26 of 125 SHIP positions and 22 of 75 CAND positions scored differently once the table had run forward paths (`results-solver-scratch.txt`).
- S1, the cell's expectation memo: `solver-memo.test.mjs --full` ALL PASS: 17 checks: 15 household-arms (S224, S362, S370 under SHIP, CAND, FROZEN, DECOMP, JOINT) the same bit for bit, their tables and every layer, with the memo off and on; the memo answered 77.8% of the expectations (1035593532 of 1331197632); their solves at 6 points took 1917 s off and 685 s on; each plant (the growth class, the world left out of the key) changes a hash (`results-solver-memo.txt`).
- S3, the adaptive reference's duplicate moves: `adaptive-dup.test.mjs --full` ALL PASS: 5 checks: S362, S366, S370 at the candidate's lattice (na 160 x nb 41 x nz 128), the reference's arrays the same bit for bit with the duplicates off and on, S362 75.6% of its moves duplicates, built in 303.1 s off and 74.6 s on; S366 75.6% of its moves duplicates, built in 326.7 s off and 82.7 s on; S370 75.6% of its moves duplicates, built in 332.4 s off and 81.4 s on; the plant (the growth class left out of the match) changes the reference, and S362's solve gives the same tables with S3 off and on (`results-adaptive-dup.txt`).
- S2, the chooser's shared year: `chooser-share.test.mjs --full` ALL PASS: 14 checks: on 6 household-arms (S224 SHIP, S224 CAND, S362 SHIP, S362 CAND, S370 SHIP, S370 CAND) every move's score, tax and estate at every decision of 20 paths the same bit for bit as scoreMoves's (5745600 scores), and the engine's outcomes on 200 paths the same with the sharing off and on, its path 3.4, 3.2, 3.8, 5.2, 4.3, 5.3 times as fast; both plants (a tier variant's charge skipped, the growth class left out of the key) throw under the check (`results-chooser-share.txt`).
- The re-time (instruction 5), BASE (the code before the port) beside PORT, one process a core, nothing else running: S224 SHIP at 30 points, the solve 299 s to 120 s (2.49 times), the engine 77.3 to 25.1 ms a path (3.08 times), every hash the same; S224 CAND at 30 points, the solve 740 s to 297 s (2.49 times), the engine 86.3 to 31.1 ms a path (2.77 times), every hash the same; S362 SHIP at 30 points, the solve 393 s to 129 s (3.04 times), the engine 106.0 to 33.4 ms a path (3.17 times), every hash the same; S362 CAND at 30 points, the solve 1491 s to 372 s (4.01 times), the engine 172.7 to 36.1 ms a path (4.78 times), every hash the same. Against the review's pass mark (every hash identical, the solve and the engine each at least twice as fast): PASS (`results-retime-port.txt`, read by `retime-port.mjs`).
- Instruction 6 (D25), the adaptive reference's build split across E2's parts: `e2.test.mjs` ALL PASS: 15 checks: the reference's arrays bit for bit the same split and unsplit on S126 (at its own lattice, 79458 values, its 20049 cells each written once, part 0 writing 5877), S362 (lattice 48 x 9 x 32, 37260 values, its 9477 cells each written once, part 0 writing 4236), S370 (lattice 48 x 9 x 32, 37260 values, its 9477 cells each written once, part 0 writing 4061); every table the same as before; the plant (a part that claims the reference's cells and drops them) caught: 21145 values differ; 2166 of 9477 cells written (`results-e2-test.txt`).
<!-- end printed:speed -->
### V3 and V4 on the ported code (24 Oct, EXPLORATORY, the tuning seed)

Every unit of `batch-v34.sh` in, one code and seed, V4's CAND the same as V3's shipped setting bit for bit. The wealth
axis at the candidate's 30 points is not converged by V3's targets and 45 is; V4's best is the candidate at 90 on every
household, so its gap is the same resolution effect. The allowance-axis line moves towards the candidate's own setting
(D10) and faults nothing. S224's loss is inside its noise at 60 and 90 points, as the deep review's cause predicts.

<!-- printed:v34 -->
- V3's gate: one code (210f058370ce), the candidate e65e5e99ba49, seed 7002; V1 on every unit: no cell without a move, none non-finite.
- V3 at estate weight 0.02, the next finer setting against the shipped one on the panel (survival points / whole score): wealth points +0.212 / +0.267 (BEYOND the targets); share points -0.016 / -0.033; quadrature nodes -0.070 / -0.078; the gain axis -0.011 / -0.009; the allowance axis (snapped against the candidate's interpolated) +0.593 / +0.631 (BEYOND the targets); worlds -0.045 / -0.049: NOT in every direction. The wealth ladder, each rung against the next finer (panel mean survival / whole score, then the largest household): 20 -> 30 points: panel mean +0.364 / +0.398, the largest on a household S224 +0.78 / +0.98 (BEYOND); 30 -> 45 points: panel mean +0.212 / +0.267, the largest on a household S224 +0.31 / +0.44 (BEYOND); 45 -> 60 points: panel mean +0.054 / +0.077, the largest on a household S370 +0.19 / +0.21 (within); 60 -> 90 points: panel mean -0.027 / -0.015, the largest on a household S380 -0.09 / -0.08 (within); the coarsest rung within the targets of every finer step: 45 points.
- V3 at estate weight 0.01, the next finer setting against the shipped one on the panel (survival points / whole score): wealth points +0.271 / +0.324 (BEYOND the targets); share points -0.014 / -0.012; quadrature nodes -0.052 / -0.042; the gain axis +0.007 / +0.008; the allowance axis (snapped against the candidate's interpolated) +0.589 / +0.605 (BEYOND the targets); worlds +0.027 / +0.041: NOT in every direction. The wealth ladder, each rung against the next finer (panel mean survival / whole score, then the largest household): 20 -> 30 points: panel mean +0.336 / +0.335, the largest on a household S224 +1.01 / +1.10 (BEYOND); 30 -> 45 points: panel mean +0.271 / +0.324, the largest on a household S380 +0.47 / +0.53 (BEYOND); 45 -> 60 points: panel mean +0.039 / +0.046, the largest on a household S370 +0.25 / +0.26 (within); 60 -> 90 points: panel mean -0.011 / +0.008, the largest on a household S224 +0.06 / +0.08 (within); the coarsest rung within the targets of every finer step: 45 points.
- The one-pot oracle (58.562%), the table's opening error at 20, 30, 45, 60 and 90 wealth points: 20 points -6.756, 30 points -3.298, 45 points -0.955, 60 points -0.819, 90 points -0.061: the error shrinks at every step.
- S224's rungs, the candidate against SHIP on 32000 paths (the deep review's one test): W0.02 30 points -0.106 (se 0.067), whole score -0.088 (se 0.068); W0.02 60 points -0.034 (se 0.068), whole score +0.015 (se 0.069); W0.02 90 points -0.063 (se 0.064), whole score +0.007 (se 0.065); W0.01 30 points -0.181 (se 0.088), whole score -0.260 (se 0.088); W0.01 60 points -0.031 (se 0.068), whole score -0.040 (se 0.069); W0.01 90 points -0.056 (se 0.065), whole score -0.051 (se 0.065).
- V4: at estate weight 0.02 the candidate's gap to the best variant, panel mean 0.329 score and 0.239 survival points; largest 0.533 and 0.487: BEYOND D4's targets, the best variant CAND-fine on 7 of 7 households; at estate weight 0.01 the candidate's gap to the best variant, panel mean 0.377 score and 0.300 survival points; largest 0.679 and 0.662: BEYOND D4's targets, the best variant CAND-fine on 7 of 7 households. Its verdict: NOT within the targets (or units missing) (a lower bound: it can show the policy improvable, never that it is near the best) (`results-v3.txt`, `results-v4.txt`).
<!-- end printed:v34 -->
### N4 (Step 6, EXPLORATORY): the build and the read (`n4-design.md`; at 45 wealth points, D25)

HR (the ceiling at the taper threshold) passes N4's bar on the two pension-heavy households; MID and CGT do not.

<!-- printed:n4read -->
- N4's gate: one code (44b967169a3c), seed and paths 7002/8000, candidate e65e5e99ba49, 45 points; the product's menu at full scale: CAND on this code the same as V3's 45-point unit bit for bit on 14 of 14 household-weights (`results-n4.txt`).
- CAND+HR: PASSES N4's bar (beyond the targets on S370, S248, panel mean); a household loss beyond 0.5 nowhere; at W0.02 the panel mean +0.364 survival (se 0.030) / +0.395 score, a household from +0.000 to +1.712 survival; at W0.01 the panel mean +0.373 survival (se 0.030) / +0.400 score, a household from +0.000 to +1.688 survival.
- CAND+MID: does not pass N4's bar; a household loss beyond 0.5 nowhere; at W0.02 the panel mean +0.007 survival (se 0.016) / +0.011 score, a household from -0.063 to +0.037 survival; at W0.01 the panel mean -0.009 survival (se 0.017) / -0.006 score, a household from -0.037 to +0.013 survival.
- CAND+CGT: does not pass N4's bar; a household loss beyond 0.5 nowhere; at W0.02 the panel mean +0.084 survival (se 0.023) / +0.091 score, a household from +0.000 to +0.300 survival; at W0.01 the panel mean +0.089 survival (se 0.023) / +0.094 score, a household from -0.075 to +0.350 survival.
<!-- end printed:n4read -->
<!-- printed:n4hr -->
- HR decomposed (D27), survival points against the candidate: S370 W0.02: HR +1.712 (se 0.163), the draw-first ceiling alone +0.850 (se 0.127), the re-wrap alone +1.637 (se 0.161), the interaction -0.775 (se 0.140); S248 W0.02: HR +0.800 (se 0.126), the draw-first ceiling alone +0.700 (se 0.114), the re-wrap alone +0.637 (se 0.114), the interaction -0.537 (se 0.129); S370 W0.01: HR +1.688 (se 0.160), the draw-first ceiling alone +0.762 (se 0.112), the re-wrap alone +1.563 (se 0.157), the interaction -0.637 (se 0.132); S248 W0.01: HR +0.912 (se 0.129), the draw-first ceiling alone +0.700 (se 0.112), the re-wrap alone +0.637 (se 0.114), the interaction -0.425 (se 0.122). N4's units reproduced on this code: CAND and CAND+HR the same bit for bit on 8 of 8 household-weight-arms (`results-n4hr.txt`).
<!-- end printed:n4hr -->

<!-- printed:n4build -->
- N4's build: `n4-menu.test.mjs --full` ALL PASS: 27 checks (`results-n4-menu.txt`): the product's menu unchanged move for move; each new move against a hand calculation in the engine and the forward run; the two in step on each new menu (hr 3153 household-years, the largest gap £1.12e-8; mid 3171 household-years, the largest gap £7.45e-9; cgt 3311 household-years, the largest gap £1.49e-8; hr+mid+cgt 3128 household-years, the largest gap £1.30e-8); each plant parts them ('hrtop' £783357.46, 'midband' £695833.40, 'nobasis' £2579102.56); S2's shared scores the same as scoreMoves' under the new menus (12807180 checked).
- N4's identity on the product's path: every hash the same on S224 and S370 under SHIP (the candidate's identity is read at full scale by n4-menu.mjs: CAND on the N4 code against V4's CAND unit) (`results-n4-identity.txt`).
<!-- end printed:n4build -->
### The third tier step (D28; THIRD-STEP.md at ed20ac9): the build (steps 1 and 2)

`tiersBelow` (2 when unset) through `fast.js` `tiersFor`, `solve.js` (refuses all but 2 or 3; in `meta`), `bridge.js` and
`App.jsx` `buildContext`. A step beyond the second never enters Cash Equivalents.
<!-- printed:tiersteps -->
- The third step's build: `tier-steps.test.mjs --full` ALL PASS: 13 checks (`results-tier-steps.txt`): the option unset, the tier lists of 210 single households the same as before; with it, the ladder as THIRD-STEP.md gives it, a wrapper that cannot take the step keeping today's (D28); the engine and a forward run in step (S370 191 years of 20 paths, the largest gap £1.16e-10, 53 years at the new rung; S248 720 years of 20 paths, the largest gap £6.40e-10, 181 years at the new rung); the plants: the engine's list two below while the table has three (it throws), the new rung at the second's rates (the state parts by £656703.09), the cash stop removed (fails the ladder check).
- Its identity, the option unset: every hash the same on S224 and S370 under SHIP and CAND (tables, layers, S370's adaptive reference, the engine's paths), and N4's CAND+HR unit the same bit for bit (`results-tier-steps-identity.txt`).
<!-- end printed:tiersteps -->
### The third tier step's factorial (D28, THIRD-STEP.md step 3; EXPLORATORY, the tuning seed, 45 points; its rule in 42e26f0)
<!-- printed:n4t3 -->
- The factorial's gate: one code (ae49ee6bcedd), seed and paths 7002/8000, candidate e65e5e99ba49, 45 points; tiersBelow 3 on the T3 arms and 2 on the others, as each unit recorded; N4's units reproduced: CAND and CAND+HR the same bit for bit on 28 of 28 household-weight-arms; the solve against CAND's (four units at a time: a guide for gate 5), the median over the 14 household-weights and the range: HR x1.53 (x1.32 to x1.74), T3 x1.69 (x1.52 to x1.78), HR+T3 x2.63 (x1.92 to x2.86) (`results-n4t3.txt`).
- The panel, survival points (se) / whole score, against the arm named second: T3 - CAND W0.02 +0.554 (se 0.050) / +0.267, a household -0.025 to +2.225, W0.01 +0.563 (se 0.049) / +0.346, a household +0.000 to +2.038; HR+T3 - HR W0.02 +0.525 (se 0.050) / +0.232, a household -0.025 to +1.900, W0.01 +0.518 (se 0.049) / +0.290, a household +0.000 to +1.775; HR - CAND W0.02 +0.364 (se 0.030) / +0.395, a household +0.000 to +1.712, W0.01 +0.373 (se 0.030) / +0.400, a household +0.000 to +1.688; HR+T3 - CAND W0.02 +0.889 (se 0.052) / +0.626, a household -0.025 to +3.612, W0.01 +0.891 (se 0.052) / +0.690, a household +0.000 to +3.462; interaction W0.02 -0.029 (se 0.041) / -0.035, a household -0.325 to +0.163, W0.01 -0.045 (se 0.041) / -0.056, a household -0.263 to +0.000.
- T3 - CAND: PASSES N4's bar: beyond the targets S370 W0.02 score +1.015; S370 W0.02 survival +2.225; S224 W0.02 survival +0.650; S248 W0.02 survival +0.600; panel mean W0.02 score +0.267; panel mean W0.02 survival +0.554; S370 W0.01 score +1.237; S370 W0.01 survival +2.038; S224 W0.01 score +0.556; S224 W0.01 survival +0.787; panel mean W0.01 score +0.346; panel mean W0.01 survival +0.563; a household loss beyond 0.5 nowhere; HR+T3 - HR: PASSES N4's bar: beyond the targets S370 W0.02 score +0.705; S370 W0.02 survival +1.900; S224 W0.02 score +0.503; S224 W0.02 survival +0.662; S248 W0.02 survival +0.762; panel mean W0.02 score +0.232; panel mean W0.02 survival +0.525; S370 W0.01 score +0.944; S370 W0.01 survival +1.775; S224 W0.01 score +0.556; S224 W0.01 survival +0.787; panel mean W0.01 score +0.290; panel mean W0.01 survival +0.518; a household loss beyond 0.5 nowhere; HR - CAND: PASSES N4's bar: beyond the targets S370 W0.02 score +1.837; S370 W0.02 survival +1.712; S248 W0.02 score +0.893; S248 W0.02 survival +0.800; panel mean W0.02 score +0.395; panel mean W0.02 survival +0.364; S370 W0.01 score +1.815; S370 W0.01 survival +1.688; S248 W0.01 score +0.978; S248 W0.01 survival +0.912; panel mean W0.01 score +0.400; panel mean W0.01 survival +0.373; a household loss beyond 0.5 nowhere; HR+T3 - CAND: PASSES N4's bar: beyond the targets S370 W0.02 score +2.542; S370 W0.02 survival +3.612; S224 W0.02 score +0.503; S224 W0.02 survival +0.662; S248 W0.02 score +1.204; S248 W0.02 survival +1.563; panel mean W0.02 score +0.626; panel mean W0.02 survival +0.889; S370 W0.01 score +2.758; S370 W0.01 survival +3.462; S224 W0.01 score +0.556; S224 W0.01 survival +0.787; S248 W0.01 score +1.104; S248 W0.01 survival +1.387; panel mean W0.01 score +0.690; panel mean W0.01 survival +0.891; a household loss beyond 0.5 nowhere. DECISION (D28, the rule committed before launch): with HR in the candidate, CAND+HR+T3 against CAND+HR PASSES: the third step joins; without HR, CAND+T3 against CAND PASSES: the third step joins. Which reading decides is the maintainer's call on HR (D27).
<!-- end printed:n4t3 -->
## 5. Running now

- Nothing. The factorial ran 25 Oct 11:13 to 16:09 UK (`results/n4t3-launch1.log`, 56 units, none failed).

## 6. The next three actions

Each step has its test and a time box (D20's order). 7u-F's reviews: `reviews/2026-10-23-read-7uf.md`, `-deep-7uf.md`.

1. For the maintainer: whether HR joins the candidate (the factorial confirms the third step under either reading, D28).
   Then THIRD-STEP.md step 4 once, on the candidate so settled: `candidate.json`, `CANDIDATE_HASH`, the reviewer, HOW-IT-WORKS.
2. Gate 5 (D11, D25, D26) on the candidate as settled, at 45 points (`batch-gate5.sh`), after the maintainer's review on
   time saving. Then Phase 4 registers (harm rule, D20 (2); budget, D21; a fresh seed), with a no-harm item against SHIP
   if the candidate changes, a spending item over all years, the whole score on every path and the Node version stamped.
