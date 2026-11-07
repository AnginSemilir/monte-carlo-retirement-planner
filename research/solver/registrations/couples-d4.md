# Registration: Part D's D4, the candidate for couples against the app's rules (CHECKLIST.md item 2; the launch plan's section 6, D4; PART-D.md)

Read once, by `research/solver/reduce-couples.mjs`, after its gate (which refuses a unit stamped on any other version of the
files it reads: the audit's, the panel, the paths and the reducer itself). Launched only as
`PREDICTION=research/solver/registrations/couples-d4.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples.sh`,
and only after the maintainer has seen this registration and its budget (the launch plan's D4) and has reserved its seed.

- **Question:** Does the candidate for couples (each person's table at the candidate's settings, the two run by the couples'
  rollout of Part D's D1 to D3), executed by the app's own engine, keep more held-out couples solvent than the app's own
  rules, without delivering less spending, and with no harm against the couples' solver at the product's settings
  (PART-C-PLAN.md: "against the app's rules and against the product's settings")? Couples keep the app's rules under Part C's
  switch until this reads (D42).
- **Arms:** CANDC, the candidate `d71f65ae871e` (candidate.json, as the app solves a single's plan: src/solverApp.js
  solveForApp, its APP_CANDIDATE) for each person, at the app's 45 wealth points, the dial at 1, the estate aim 'standard'
  (weight 0.02) or 'lower' (0.01), the floor, and the couples' rollout (src/solver/couple.js: each person's moves ranked with
  the tiers they hold and their base's lock, the household's level and cut counted once, the tables' quadrature, each person
  read at their tier layer, the bridge with the household's money); SHIPC, each person's table at the product's settings
  `07c069b6e330` (PRODUCT_BASELINE, solvePlan, 30 points, lambda as 7u-F's, the estate weight 0.02 or 0.01) run by the same
  rollout; APP, the app's rules: its withdrawal-policy search on the couple's own plan (select-phase4.mjs armA with
  `tournament: false`, searched on seed 7001; D36), guardrails on with the floor at 80% of target, the cost lookahead at 5
  years, raises capped at 110%. Every arm runs on the same plan (couple-panel.mjs planOf: the couple's inputs at its landed
  target, the candidate's return assumptions, the same minimum pot, the one-off costs as the library has them, a windfall
  routed as arm A's policy routes it); the gate holds a couple's five units to one inputs hash (each engine context but the
  policy's own fields). Arm A's search picks the full lump sum on 28 of 40 (A1 and A2 reported apart for them).
- **Households:** the 40 couples of `couples-panel.json`, named before seed 7021 is read: couples no earlier run, document,
  test or review had touched (couple-panel.mjs: held-out.mjs touchedAll over this branch's results, the archive, the old
  manifest, the tests and the review branch's reviews, and the couples the tests take by their place in the library;
  frozen once in `couples-orders.json`, 238 ids, hash d639ac997267), 20 library couples whose first person is older than 44
  (taken evenly in library order: S011, S031, S047, S063, S083, S097, S115, S133, S149, S167, S189, S205, S223, S239, S259,
  S277, S293, S371, S387, S403) and 20 whose first person is 44 or under, each person retiring at 52 (S301F, S305F, S307F,
  S309F, S311F, S317F, S319F, S321F, S323F, S325F, S327F, S329F, S331F, S333F, S335F, S337F, S341F, S343F, S345F, S347F);
  each landed so arm A survives 85 +/- 1% on 1,000 paths of seed 7005 (7 Nov: from 84.1% to 86.0%; every candidate tried
  landed, none passed over). S011 and S301F were the pilot's (seed 7002, 1,000 paths; `results-couples-pilot.txt`).
- **Seed:** 7021, never read by any run (no file in the tree or the review branch names it as a seed), used once; to be
  reserved in check-prediction.mjs's registry for `couples-d4*.md` (a protected edit, asked of the maintainer with this
  registration). The landing read 7001 and 7005, the pilot 7002; none shares a path with 7021 (path i of a seed draws from
  seed + 7919 i, and no two of these seeds differ by a multiple of 7919).
- **Paths:** 19,000 a unit for every couple (`couples-paths.json`; `results-couples-sizing.txt`): by D34 from the pilot's
  discordances (CANDC against APP 9.0% to 10.1%, against SHIPC 1.0% to 2.0%; their Clopper-Pearson upper 95% bounds), the
  smallest multiple of 1,000 from 16,000 at which each pilot couple's comparisons read a true 1-point loss as harm at least
  90% of the time and a true quarter-point loss at most 5% (size-phase4.mjs's exact rates), the larger of the two couples';
  two couples cannot size forty one by one, so each couple's thresholds are set at the read from its own realised discordance
  at 19,000 paths by the same rates (the rule fixed in couples-paths.json before the run).
- **Primary metric:** survival scored by the engine (audit-phase4.mjs runPath: the engine's own year, path by path, held to
  E.runTrial on the first 200 paths of every unit): a path survives when every year's spending at the floor is met and the
  minimum pot is held at the end. Paired on the same paths of 7021 across the arms. Spending delivered over every year beside
  it: no survival figure is reported without it. On the solver arms the couples' rollout in the exact model
  (runCouplePolicy) runs beside the engine on the first 500 paths; a path the two score differently is a fidelity gap,
  reported.
- **Decision rule:** at each estate weight, on every couple's 19,000 paths, each path's change averaged over the 40 couples
  and its 95% interval taken from the spread across paths (Phase 4's rule): A1, survival CANDC less APP, passes when the lower
  end is above 0; A2, spending delivered over every year, CANDC less APP as a share of the couple's mean under APP, passes
  when the lower end is above -1%; S1, survival CANDC less SHIPC, passes when the lower end is above -0.1 points. D34's flags,
  per couple and weight, on all its paths: harm against APP and against SHIPC when the observed loss is above the couple's
  threshold (no correction across couples); spending when a couple delivers more than 5% less than under APP (reported,
  not blocking).
- **Outcomes:** PASS (A1, A2 and S1 at both weights): the candidate for couples goes to the maintainer, who decides whether
  couples run it under Part C's switch (D42 holds until then). NOT PASSED: couples keep the app's rules under the switch, the
  write-up names each failed item and by how much, and nothing is tuned until it passes. A harm or spending flag sends that
  couple to investigation whatever the outcome; on its own it does not block (D34 (3)). Reported, not deciding: spending
  delivered CANDC less SHIPC; the cost years' spending delivered (each one-off cost's year) CANDC less APP and less SHIPC;
  A1 and A2 apart where arm A takes the full lump sum; S1 over each cohort; the fidelity gaps; the solve times and the hosts.
- **Budget:** 701.8 core-hours at 19,000 paths, about 175 hours on four cores (the solves 18.0, the engine 669.5, the rollout
  beside it 14.3), measured (D21) from the pilot's own units on this machine (Intel(R) Xeon(R) Processor @ 2.10GHz), four at a
  time, nothing else running but a few seconds of planted checks; the younger cohort's paths cost about three times the
  library's (S301F's candidate 1.8 s a path against S011's 0.54 s: a longer horizon, and the bridge years' shared money).
  This is past the launch plan's assumption (2 to 4 days on four cores); at 8,000 paths a unit it is 314.2 core-hours, about
  79 hours on four cores, where a true 1-point loss against SHIPC still reads as harm 98% to 100% of the time on the pilot's
  discordances but against APP only 61% to 64% (`results-couples-sizing.txt`): the maintainer's call; this registration is
  written at D34's size. With the harness's 12-hour limit on a task, relaunches under `RESUME=1`.
- **Design review:** research/solver/reviews/2026-11-07-couples-d4-design.md
