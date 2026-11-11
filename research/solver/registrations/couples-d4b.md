# Registration: Part D's D4, run once more on the code that ships (couples-d4.md's re-run; the review of 9 Nov, items 1 and 9; D66, D67)

Read once, by `research/solver/reduce-couples.mjs`, after its gate. It is `couples-d4.md` in its question, its arms, its 40
couples, its seed, its primary metric, its decision rule and its outcomes; it differs in the five things the review of 9 Nov
names (item 1, part 2), each stated where it falls below: the code, the targets landed again, the paths in two stages, where
the units may run, and what became of D4. The gate refuses a chunk whose stamp is not the logs' one version: the code
(code-id.mjs) and the audit hash over every file the run and the read take beyond it (audit-couples.mjs STAMP_FILES: the
audit, the panel's and arm A's code, src/solverApp.js and src/solverSettings.js, candidate.mjs, the frozen orders, the
re-landed panel, the paths, the stage gate, the reducer, the Phase 4 code it borrows and the provenance check,
fair-gate.mjs); a solver unit whose configuration hash or settings are not those below; and a couple's chunks that do not
follow the first stage's decision (it recomputes that decision and holds the run's own `stage2.json` to it). Launched only as
`PREDICTION=research/solver/registrations/couples-d4b.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples.sh`,
from a git worktree at the launch commit, where every relaunch under `RESUME=1` and the read also run. When it launches,
`couples-d4.md` is marked superseded.

- **Question:** Does the candidate for couples (each person's table at the candidate's settings, the two run by the couples'
  rollout of Part D's D1 to D3), executed by the app's own engine, keep more held-out couples solvent than the app's own
  rules, without delivering less spending, and with no harm against the couples' solver at the product's settings
  (PART-C-PLAN.md: "against the app's rules and against the product's settings")? Couples keep the app's rules under Part C's
  switch until this reads (D42).
- **Arms:** as `couples-d4.md`: CANDC, the candidate `d71f65ae871e` for each person (src/solverApp.js solveForApp over
  APP_CANDIDATE, as the app solves a single's plan), at the app's 45 wealth points, the dial at 1, the estate aim 'standard'
  (weight 0.02) or 'lower' (0.01), the floor, and the couples' rollout (src/solver/couple.js, its path ranked from each
  person's chooser's shared scores since the review's item 2, `COUPLE.fast`, exact); SHIPC, each person's table at the
  product's settings `07c069b6e330` (PRODUCT_BASELINE, solvePlan, 30 points, lambda as 7u-F's, the estate weight 0.02 or
  0.01), the same rollout; APP, the app's rules: its withdrawal-policy search on the couple's own plan (select-phase4.mjs
  armA, `tournament: false`, searched on seed 7001; D36), guardrails on, the floor at 80% of target, the cost lookahead at 5
  years, raises capped at 110%. Each solver unit records its configuration hash (checked against these two by the audit and
  the gate) and each person's run record, as `couples-d4.md` lists it. Every arm runs on the same plan (couple-panel.mjs
  planOf at the couple's re-landed target); the gate holds a couple's units to one inputs hash. **The code (the review's
  difference 1):** the working branch after the review's items 2 to 5 (the couples' path by the shared scoring; the engine's
  year in HMRC's order; relief on money the plan pays into a pension, none from 75; the pages naming the sweep), with item 6's
  stage B in and off (`shareRule` unset: each person's table on half the spending, as D4's couples, who hold 60/40, ran), and
  item 5's `sweepCashIsaTo` unset (the sweep to the taxable account, the code's default: the maintainer has not ruled on item
  5's read; a ruling before launch is applied here first and this registration revised); each arm's configuration hash as
  that code gives it, the same two as D4's.
- **Households:** D4's 40 couples (`couples-panel.json`, named before seed 7021 was read: 20 library couples whose first person
  is older than 44, S011, S031, S047, S063, S083, S097, S115, S133, S149, S167, S189, S205, S223, S239, S259, S277, S293, S371,
  S387, S403; 20 whose first person is 44 or under, each person retiring at 52, S301F, S305F, S307F, S309F, S311F, S317F,
  S319F, S321F, S323F, S325F, S327F, S329F, S331F, S333F, S335F, S337F, S341F, S343F, S345F, S347F), in the same order, the
  couples unchanged. **The targets landed again (difference 2):** item 3 moves a couple's survival under the rules, so each was
  landed again on the code after items 2 to 5 by the same procedure (couple-panel.mjs `reland`: from the library's target, arm
  A searched anew at each step, 85 +/- 1% on 1,000 paths of seed 7005, the selection seed), before seed 7021 is read; every
  couple landed, none passed over (arm A from 84.0% to 85.9%; `couples-panel-d4b.json`, `results-couples-panel-d4b.txt`).
  Used before, as `couples-d4.md` records; and D4's own run (below), stopped unread.
- **Seed:** 7021, reserved in check-prediction.mjs for `couples-d4*.md` (D61). D4 ran on it and was stopped with no result
  read (difference 5, below), so no path of 7021 has informed any choice; this run reads it, once. The landing read 7001 and
  7005, the pilot 7002; none shares a path with 7021 (path i of a seed draws from seed + 7919 i, and no two of these seeds
  differ by a multiple of 7919).
- **Paths:** (the review's difference 3) item 9's two stages, at D61's 19,000 a unit (`couples-paths-d4b.json`). Two stages. After 5,000
  paths a unit whose observed change against APP is +0.5 points or more stops and is read as not harmed. Every other unit runs
  to N paths and is read by D34's rule at N. Both rates are the exact two-stage rates of `size-phase4.mjs`, printed in the
  sizing file (`results-couples-sizing-d4b.txt`). Here a unit is a couple and estate weight: its CANDC survival on the first
  5,000 paths of 7021 less APP's, in points, paired; at +0.5 or more CANDC and SHIPC at that weight stop at 5,000, and APP stops
  where both weights do. The decision is the registered stage gate's (`stage-couples.mjs`, once every first-stage chunk is in;
  it writes the run's `stage2.json` and prints only how many couple-weights go on); the read recomputes it from the first
  stage's chunks and refuses a run whose chunks or `stage2.json` disagree. The comparison against SHIPC is read at the paths
  its couple and weight ran (5,000 or 19,000), by D34's one-stage threshold and rates at that count from its realised
  discordance (its stopping turns on the comparison against APP, not on it); the pooled items are read on the paths every
  couple ran in every arm, the first 5,000 (all 19,000 only if every couple-weight went on). A chunk runs as `couples-d4.md`'s
  did: the first stage one chunk of 5,000 a unit, the second CANDC in three chunks of the remaining 14,000, SHIPC and APP in
  one, each its own process, path i the seed's path i whichever chunk runs it; the check against `E.runTrial` and the rollout
  beside run on the first stage's chunk.
- **Primary metric:** as `couples-d4.md`: survival scored by the engine (audit-phase4.mjs runPath: the engine's own year, path
  by path, held to E.runTrial on the first 200 paths of every unit): a path survives when every year's own spending is met to
  within a pound and the minimum pot is held at the end. Paired on the same paths of 7021 across the arms. Spending delivered
  over every year beside it. On the solver arms the couples' rollout in the exact model (runCouplePolicy) runs beside the
  engine on the first 500 paths; a path the two score differently is a fidelity gap, reported.
- **Decision rule:** as `couples-d4.md`, on the paths every couple ran (above): at each estate weight, each path's change
  averaged over the 40 couples and its 95% interval taken from the spread across paths (Phase 4's rule): A1, survival CANDC
  less APP, passes when the lower end is above 0; A2, spending delivered over every year, CANDC less APP as a share of the
  couple's mean under APP, passes when the lower end is above -1%; S1, survival CANDC less SHIPC, passes when the lower end is
  above -0.1 points. D34's flags, per couple and weight: harm against APP when, having gone on, the observed loss over its
  19,000 paths is above its threshold at 19,000 (a couple and weight that stopped is read as not harmed); harm against SHIPC
  when the observed loss over the paths it ran is above its threshold at that count (no correction across couples); spending
  when a couple delivers more than 5% less than under APP (reported, not blocking). Every comparison is printed with its paths,
  discordance, bound, threshold and both rates, and whether it stopped at the first stage; one whose 1-point rate is below 0.90
  is named and reported as below D34's rate, with its rate, and gets no more paths (D61).
- **Outcomes:** as `couples-d4.md`. PASS (A1, A2 and S1 at both weights): the candidate for couples goes to the maintainer, who
  decides whether couples run it under Part C's switch (D42 holds until then; a couple holding less than 40% or more than 60%
  of the pots keeps the app's rules until item 6's stage C reads, M4 in D66). NOT PASSED: couples keep the app's rules under
  the switch, the write-up names each failed item and by how much, and nothing is tuned until it passes. A harm or spending
  flag sends that couple to investigation whatever the outcome; on its own it does not block (D34 (3)). Reported, not
  deciding: as `couples-d4.md`, each on the paths every couple ran; and the count of couple-weights that went on.
- **Where it runs (difference 4):** its batch carries `D4_SHARD` (the review's `prototype/d4-shard.diff`, in batch-couples.sh
  from the launch commit), and the units may run in up to four cloud sessions, each from a worktree at the launch commit, each
  backing its finished chunks up to its own orphan branch, the read in one worktree (the review's item 1, part 3: two
  sessions agreeing on a preflight first, the first worker alone, its heartbeat). Each stage's chunks are gathered into one
  folder before the next: the stage gate runs there once every first-stage chunk is in, and its `stage2.json` goes to every
  session before the second stage. Registered so, more sessions are no departure.
- **What became of D4 (difference 5):** D4, as registered (`couples-d4.md`), stopped on 10 Nov 08:44 UTC, unread, on the
  maintainer's ruling (D66, M1), with 76 of its 520 chunks finished; those 76 stay on the branch `d4-backup`, unread, until this
  run's read, and the branch then goes (D63). The statement made on that stop (STATE.md section 5, D67): no arrays file of D4
  has been opened; beyond its stamp line, its second line and whether it holds a done line, the backup script read each
  finished log's third line (the couple, the unit, its cohort, its landed target and its paths: registered inputs), and on 9
  Nov five commands and one EXPLORATORY script printed that third line and timings only; no survival, estate, spending or other
  outcome of any unit has been printed or read by anyone. On that statement the maintainer kept the panel and the seed (D67).
- **Budget:** to be measured (D21) from the pilot on this code, on this machine with nothing else running
  (`results-couples-sizing-d4b.txt`).
- **Design review:** to come (research/solver/reviews/).
