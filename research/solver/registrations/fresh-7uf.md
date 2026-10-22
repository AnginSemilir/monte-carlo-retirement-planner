# Registration: fresh-7uf (7u-F, the assembled candidate confirmed once; CHECKLIST.md item 2)

Built from Part B Step 4.3 of the external review (`research/reviews/2026-10-21/EXTERNAL-REVIEW.md`) and the decisions
in STATE.md (D3 the rule, D5 the package and the decomposing arm, D7 the panel's widening). The audit is
`research/solver/audit-7uf.mjs`, the panel `panel-7uf.mjs`, the read `reduce-7uf.mjs` (its rule planted in
`research/tests/reduce-7uf.test.mjs`); the batch `batch-7uf.sh`, launched through `run-from-snapshot.sh` with this file.

- **Question:** Does the assembled research candidate, its tables executed by the app's own engine, do material harm
  against the shipping default on any household of 7u-F's panel at either estate weight, and is its paired survival
  change pooled over the panel's floor households above minus `0.1` points, on a seed nothing has read?
- **Arms:** SHIP `07c069b6e330` (solvePlan with the product's settings, `PRODUCT_BASELINE`, on the candidate's plan:
  O60's blend-median tiers, as 7u ran it); CAND `e65e5e99ba49` (the assembled candidate, `candidate.json`: the frozen
  candidate `a61dba4ee1f5` with the adaptive package, readerRef 'adaptive', its lattice na 160, nb 41, nz 128 with foot
  and stepAll, and readerSplit 'rs'); DECOMP `be76284e736c` (CAND with readerRef and its lattice removed: the plan
  reference; everything else, the RS split included, as CAND), run only on households with bridge years. All three on
  the code with Step 1's fixes, which therefore apply to SHIP too.
- **Households:** 19, named before seed 7014 is read, each by a rule that reads no result on it (`panel-7uf.mjs`):
  7u's unsettled S224 and S380, and S364 (reported: SHIP survives under half a percent there); the deposit households
  whose bridge is at risk, HO-DEP's screen's band (world-0 survival 20% to 80% under the order reference, seed 7004,
  `results-hodep-screen.txt`): S370, S382, S394, S406, S418, and the adaptive reference's own S362 (O179, O191) and S366
  (O195); a broad slice, every third household of 7u's broad 30 in its order: S002, S018, S044, S078, S144, S176, S214,
  S248, S284 (and S380). DECOMP runs on the 15 with bridge years. The pooled floor at each weight: the panel less 7u's
  gain set at that weight (`panel-7u.mjs` gainOf: S370 at both), 18 households. 106 units: CAND 38, DECOMP 30, SHIP 38.
- **Seed:** 7014 (held out for 7u-F; owned by `fresh-7uf*.md`), used once. The preflight runs the tuning seed 7002.
  Phase 4's replication seed, registered at the same time in its place of 7004 (spent by AX-HO, FOOT-S366 and HO-DEP):
  7018, owned by `phase-4*.md`, never read by any file.
- **Paths:** 16,000 a household and arm (agreed), executed by the engine; runPolicy beside it on the first 4,000; on
  CAND and DECOMP each world's runs on 2,000 paths (the by-world item and the reference's part). Power, from 7u's own
  per-path records on the code before Step 1 (`reread-7u-item4.mjs`, `results-reread-7u-item4.txt`, printed in STATE.md's
  Step 4 block; the design reviews of 21 and 22 Oct corrected its first statements): P1 averages all 18 floor
  households, and 7u has no record of four (S382, S406, S418, S362), so its se is a range: about `0.0184` with those four
  unchanged to `0.0317` with each as spread as S370 and independent (the recorded households' changes correlate pairwise
  within `-0.06` to `0.10`); HELD with chance `1.000` to `0.883` at no true change, and 80% of the time at a true pooled
  change of `-0.048` to `-0.011` points or better. P2, as D3 words it, needs the Holm-adjusted p and an observed loss of
  at least `1` point together, so a true loss of exactly `1` point reads as harm half the time on every household; on
  the in-band households 7u ran it reads harm 80% of the time from a true loss of `1.07` to `1.20` points and 90% from
  `1.11` to `1.30` (the widest S370, `9.04%` of its paths discordant), and on the four without a record, at `5%` to
  `15%` discordant, 90% from `1.23` to `1.39`; a simulation through the reducer's own rule agrees with the approximation
  (`0.515` against `0.500`, `0.805` against `0.801`, `0.902` against `0.887`). More paths do not change the half at
  exactly `1` point; the maintainer kept D3 as written knowing this (22 Oct, 05:16 UK). S366 sits at the band's top
  (SHIP `99.47%` and `99.44%` in 7u): on 16,000 paths it lands in the band with chance about `0.67` at W0.02 and `0.85`
  at W0.01, and outside it its change is reported, not gated.
- **Primary metric:** survival scored by the engine (bridge.js `withTable` on the plan the solver solved, then
  `runTrial` path by path), paired path by path across the arms; runPolicy's figure beside it, and a household where
  the two differ beyond noise (two-sided exact p below `0.05` on the paths one survives and the other does not) is a
  fidelity gap, logged, not a result.
- **Decision rule:** D3, read once by `reduce-7uf.mjs` after its fair-test gate (every unit present; each household's
  arms on the same seed, paths, code, audit, candidate and registration stamps; the recorded settings differing only in
  the arm's own keys). P1, pooled, at each weight: the paired change CAND less SHIP averaged over the floor households,
  its 95% interval by path (each path's change averaged over the households, the spread across the independent paths;
  not pooled cells), HELD when its lower end is above minus `0.1`, FALSIFIED when its upper end is below it, else
  INCONCLUSIVE. P2, per household: where SHIP survives between `5%` and `99.5%`, the one-sided exact McNemar p of the
  loss, Holm-adjusted over every in-band household and weight; harm is an adjusted p below `0.05` with a loss of at
  least `1` point. Outside the band the change is reported, not gated. A household whose engine and runPolicy figures
  differ (two-sided exact p below `0.05` on the paths one survives and the other does not; every path apart, on any
  household, is listed by its index) is
  logged as a fidelity gap and stays in P1 and P2, which the engine scores. DECOMP only reports: a DECOMP unit missing or
  differing in its settings is reported for its household and never stops the read of P1 and P2.
- **Outcomes:** PASS (P1 HELD at both weights, no harm): the candidate goes to Phase 4. HARM (any household): the harmed
  households go to V4's measures (D4), which find the better policy or show the loss is the candidate's trade; no new
  reader or reference variant opened on them; no Phase 4 until they read. P1 FALSIFIED at a weight, no harm: not to
  Phase 4; V4's measures on the floor households that lose most. P1 INCONCLUSIVE at a weight, no harm, no FALSIFIED:
  not a pass; the figures go to the maintainer; seed 7014 is not run again. "The floor households that lose most": those
  with a loss whose unadjusted one-sided McNemar p is below `0.05`, the five largest first (`reduce-7uf.mjs` decide). Reported, never gating: each household's
  interval at the `0.25` and `0.5` margins; estate, unmet spending, realised spend and years cut (the engine); the
  whole score (runPolicy's trace); the fidelity check; the reference's part (CAND less DECOMP, by the mixture over the
  worlds' runs and on the seed's paths); the by-world item (each world's table at its opening less the engine's runs).
- **Preflight:** `preflight-7uf.sh` through the launcher on the tuning seed (S224, S002 and S362, estate weight 0.02,
  400 paths, every arm, DECOMP on each), read by `reduce-7uf.mjs --preflight` (`results-preflight-7uf.txt`): the gate
  fair, every figure printed, the engine and runPolicy apart on no path of any unit, DECOMP equal to CAND path for path on
  S002 (no bridge years); S224 reads no bridge year, so the reference is not consulted there and the read says so; S362's
  reader reads 8 bridge years, the adaptive reference built and consulted, and the reference's part is printed.
- **Budget:** `97.8` core-hours, about `24.4` hours on four cores (`budget-7uf.mjs`, `results-budget-7uf.txt`: 7u's
  measured solves, the candidate's times `1.25` for the package, and the preflight's seconds a path-year, both taken under
  load). The time box: `36` hours from the launch; past it, stop and report to the maintainer. The seed is spent at the
  launch: a stop keeps the units finished, and the maintainer decides whether the rest run on the same code
  (`RESUME=1` through the launcher runs only the units whose log has no done line; a launch without it refuses a folder
  that is not empty; the read refuses any unit file whose code or audit stamp is not the logs' one version). The read is
  made once, when every unit is in.
- **Design review:** PASS, research/solver/reviews/2026-10-22-fresh-7uf.md (its four MINORs fixed in ac5723d and confirmed
  PASS in research/solver/reviews/2026-10-22-fresh-7uf-minors.md; the first review, 2026-10-21-fresh-7uf.md, FAIL).
