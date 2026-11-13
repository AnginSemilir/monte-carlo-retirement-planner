# Registration: item 6's stage C, couples who hold their money unevenly (the review of 9 Nov, item 6 stage C and item 8 part 1; D66, D91, D93)

Read once, by `research/solver/reduce-couples-share.mjs`, after its gate. The review's design (`research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md`
on review/external-2026-10-21, item 6 stage C, item 8 part 1) with the departures named where they fall: the panel taken
evenly over the library order, the features by place in the panel, the couples' candidate without D95's tie-break, one
estate weight, one stage of paths, and a PASS limited to the holdings the panel tests. Launched only as
`PREDICTION=research/solver/registrations/couples-share.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples-share.sh`,
from a git worktree at the launch commit, where every relaunch under `RESUME=1` and the read also run, and only when the
maintainer says so (the review: "Its registration comes to me before its run"). The gate refuses a unit whose stamp is not
the logs' one version: the code (code-id.mjs) and the audit hash over every file the run and the read take beyond it
(audit-couples-share.mjs stampFiles: every module the audit, the read, the sizing, the panel's script and the batch import,
followed to the end as code-id.mjs follows a smoke's, reduce-phase4.mjs, fair-gate.mjs, size-phase4.mjs and stats.mjs among
them, src/solverApp.js and src/solverSettings.js, and the panel, its frozen order and the paths: 34 files at this writing),
with planted cases for a new import, static or dynamic. The first design review failed the registration on two counts and
five lesser ones (`reviews/2026-11-13-couples-share-design.md`); each is answered below where it falls.

- **Question:** Does the couples' solver with `shareRule: 'pots'` (each person's table solved on the first person's share of
  the pots where that share lies outside 40% to 60%, held to 5% to 95%; on half the household's spending inside the band)
  keep more couples solvent than the app's rules, with no harm, when the couple holds its money unevenly? And, read apart,
  does the couples' solver harm a kind of household the library never holds (item 8: a DB pension, a gain already in the
  taxable account, a state pension age of 67)? Until this reads, a couple whose first person holds less than 40% or more
  than 60% of the pots keeps the app's rules when couples run the solver (M4 in D66).
- **Arms:** CANDS `27d2a7c7ee9d`: the couples' candidate `af001697ce1b` for each person, as the couples' registered run's
  CANDC (src/solverApp.js solveForApp over the app's candidate at 45 points, the dial at 1, the estate aim 'standard', weight
  0.02, each person's plan as audit-couples.mjs solverPlan builds it, the couples' rollout of src/solver/couple.js with
  COUPLE.flat and COUPLE.fast on), with `shareRule: 'pots'` in solveCouple. The couples' candidate is the app's candidate
  less D95's tie-break (`tieAboveCap`), solved with that key dropped: D80 keeps the tie-break out of every registered
  couples' arm, and a couple's joint move takes no tie rule (the deep review of the couples' read), so it is what a couple
  runs. APP: the app's rules, arm A's pick on the unit's plan (select-phase4.mjs armA without the tournament, D36: guardrails,
  the 5-year lookahead, the raise cap 110%), as the couples' registered run's APP. CANDH `af001697ce1b`, reported and not
  deciding: the couples' candidate at a share of 0.5, as the registered run's CANDC, on each unit's first 1,000 paths. On a
  unit with a feature (held 60/40, inside the band) CANDS and CANDH both solve the share 0.5, so there they must agree path for
  path: the gate's identity check. The solver arms take arm A's MPAA ages, as the report D94 adopted said they would from
  this test on (`reports/2026-11-13-d4b-stage-gate.md`: "the audit's solver arms will take arm A's MPAA ages from item 6's
  stage C on"): each person's age follows the arm's own drawing (E.resolveMpaa: the first year with taxable pension income on
  the plan's own expected run), and the engine reads it only for a pension's room for dated deposits and staging. Each
  solver arm's own ages are recorded beside, and the read names the units where they differed from arm A's (seven of the 36
  on the plans alone, none with a deposit schedule they could move: the design review's finding 4).
- **Households:** 12 couples, 36 units (`couples-share-panel.json`, landed on code 7002a1fec94c; `results-couples-share-panel.txt`).
  The held-out scan (held-out.mjs touchedAll, with the tests' couples by place) run on 13 Nov: 295 ids, hash af1a9e309651,
  frozen with the order in `couples-share-orders.json` before any landing. The couples: the library order of
  `couples-orders.json` (D4's: first person older than 44), the touched left out (114 couples), twelve taken evenly in it
  (D4's own method, select-7u-broad.mjs pick). The review asked for "the next 12" in that order; read literally they are
  twelve couples of one age pattern, all aged 68 and 65, retired and past pension access. The even pick spreads them over
  the library's six age patterns (68/65, 61/58, 56/53, 55/52, 45/42, 50/47); the reason is coverage, the years before pension
  access the younger patterns have (stage A found the fault at 90/10 at every age, its oldest couple too: S007, 68 and 65,
  14.4 points down under the half share). Each couple three times: re-held 75/25 and 90/10 (audit-share.mjs reheld: every
  wrapper's total kept, the first person holding that share of each), and as the library holds it (60/40) with one feature
  set by its place in the panel, not in the frozen order (place i takes db, gain, spa67 in turn; harmless, every
  candidate's three features were landed before the walk): a £15,000 a year taxable DB pension of the first person's from
  the state pension age, half of each taxable account already a gain, or a state pension age of 67. Each unit landed so arm
  A survives 85 +/- 1% on 1,000 paths of seed 7005 (D4's procedure: arm A searched anew at each target; arm A from 84.1% to
  85.9%). S073 (61/58) was passed over, its 90/10 unit not landing (86.1% after ten steps), and S019 (68/65), the first
  reserve, takes place 11. Five of the twelve (S043, S103, S183, S211, S019) are named in the app's
  `policy-study/confirmed-results.json`, and S265 in `policy-study/coupling.mjs`, neither of which the scan reads (D4's panel
  was reported the same way); those are the app's rules alone, and no solver run or review has used any of them. In every
  couple of the library the first person is the elder, by three years, so the panel's uneven holdings are all the elder
  holding more; the Outcomes are limited to that (the design review's BLOCKING 2).
- **Seed:** 7022, reserved in check-prediction.mjs for `couples-share*.md` (D93's unlock, fc3a777a), named nowhere before it
  (this branch, the archive, the review branch); the batch names it on a line the launcher's seed check reads. The pilot ran
  on 7002.
- **Paths:** one stage, 19,000 paths a unit for CANDS and APP (`couples-share-paths.json`), CANDH the first 1,000. From the
  pilot (`results-couples-share-sizing.txt`: three couples, all nine of their units, 1,000 paths of 7002): D34's size for
  each comparison, CANDS against APP, at its discordance's upper 95% bound, from 16,000 to 23,000; the run at the largest,
  at most D61's 19,000, at which a true 1-point loss reads as harm at least 90% of the time up to a discordance of 12.45%. A
  comparison whose 1-point rate at its realised discordance falls below 0.90 is read at 19,000 and named at the read with
  its rate (D34 (4), as D61 ruled for D4); in the pilot, the re-held units of the oldest couple (upper bounds 13% to 14.5%,
  rates 0.855 to 0.883), each discordant because the candidate saves about 12 points of paths there. The shortfall can also
  fall where it matters: stage A's S267 at 90/10 was near neutral (d -0.8) at 18.4% discordance, where at 19,000 a true
  1-point loss reads as harm about 78% of the time (73% at 21%). D61 set the 19,000 for D4 alone, so applying it here is the
  maintainer's call at launch. The alternatives the design review costed: every unit at 30,000 paths (about 95 core-hours),
  which holds D34's rate on near-neutral units too; or item 9's two stages with the second at 30,000. Item 9's two stages at
  19,000 would give one stage's rates for about a quarter of the time, but add a stage gate, the step that stopped the
  couples' re-run; one stage is recommended.
- **Primary metric:** survival scored by the engine (audit-phase4.mjs runPath: the engine's own year, path by path, held to
  E.runTrial on the first 200 paths of every arm): a path survives when every year's own spending is met to within a pound
  and the minimum pot is held at the end. Paired on the same paths of 7022 across the arms. Spending delivered over every
  year beside it. On CANDS the couples' rollout in the exact model (runCouplePolicy) runs beside the engine on the first 500
  paths; a path the two score differently is a fidelity gap, reported.
- **Decision rule:** against APP, by D34's harm rule (reduce-couples.mjs harmOf): on each unit, the loss in survival over its
  19,000 paths (paths APP keeps and CANDS loses, less those CANDS saves) is flagged as harm when it is above the threshold
  that the unit's realised discordance (its Clopper-Pearson upper 95% bound) sets at 19,000, the threshold at which a true
  quarter-point loss reads as harm at most 5% of the time; no correction across units. (1) Each of the 24 re-held units is
  read by it. (2) The pooled gain over the 24 re-held units: each path's change, CANDS less APP, averaged over the units, its
  95% interval taken from the spread across paths (reduce-phase4.mjs survivalItem, as the couples' registered read's A1); it
  holds when the lower end is above 0. (3) Each of the 12 units with a feature is read by the same harm rule, apart. Every
  comparison is printed with its paths, discordance, its upper bound, threshold and both rates.
- **Outcomes:** STOP, if any unit with a feature is flagged: the couples' solver harms a kind of household the library does
  not hold, and the maintainer rules before couples go on (whatever else reads). THE GUARD STAYS, if no unit with a feature
  is flagged but a re-held unit is: couples outside 40% to 60% keep the app's rules (M4), and the maintainer rules on a new
  design (one table for the couple, or a search over the share). PASS, if no unit is flagged and the pooled gain's interval
  lies above 0: `shareRule: 'pots'` becomes the couples' default and the guard comes off for what the panel tested, couples
  whose elder holds more than 60% and at most 90% of the pots, in the same commit as the D-line naming this run, with the
  reviewer on the change of default; a couple whose younger partner holds more, or where either holds over 90% (the share
  held at 95%), keeps the app's rules until a test of those reads (the same units mirrored, about 40 more core-hours, which
  the maintainer may add to this run before launch instead). NOT SHOWN, if no unit is flagged but the pooled gain's interval
  reaches 0: the guard stays; to the maintainer. A flagged unit goes to investigation whatever the outcome (D34 (3)).
  Reported, deciding nothing: the rule's own effect, CANDS less CANDH on the re-held units' first 1,000 paths, pooled and by
  unit; spending delivered over the re-held units, CANDS less APP; the mean pot left and lifetime tax by kind of unit; the
  units where a solver arm's own MPAA ages differed from arm A's; the fidelity gaps; the solve times and hosts.
- **The gate (reduce-couples-share.mjs gate):** every unit in every arm; one code, audit, seed (7022), prediction (this
  file), estate weight and Node version; every unit at its registered paths (CANDH its first 1,000), every array one a path;
  each unit's arms on one plan (audit-phase4.mjs inputsHash, the solver arms having taken arm A's MPAA ages) and at the
  panel's target, arm A's pick the landing's; CANDS at `27d2a7c7ee9d` and the rule's share (the pots' share outside 40% to
  60%, else 0.5), CANDH at `af001697ce1b` and 0.5; each person's settings the couples' registered run's (audit-couples.mjs
  wantProblems: the lattice, the solve on anchors, the sweep, HR, the third tier step, the failure year at what it can pay);
  the couples' path flat and fast; D80's three (a shortlist, item 12's options, a tie-break) none; on a unit with a feature,
  CANDS and CANDH the same on every one of CANDH's paths. Each refusal has a planted case (`reduce-couples-share.mjs
  --planted`, 16 checks; the stamp's own in `audit-couples-share.mjs --planted`).
- **Budget:** measured from the pilot's units on this machine (D21), over the 36 units: 61.3 core-hours (CANDS 56.9, CANDH
  4.3, APP 0.2), about 15.3 hours on four cores longest first; the longest unit 2.5 hours, inside the 12-hour limit. The
  pilot shared the machine with a fast-tier run for most of its 39 minutes, so these are on the high side. The units run four
  at a time at low priority, each pausing for the merge gate's harnesses (run-unit.sh).
- **Where it runs:** in one session, relaunched under `RESUME=1` after a restart (a unit is kept only when its log's stamp
  names this code, these files, this registration and its hash, its second line this Node, and it holds its done line). The
  results stay outside git (D17). A container wiped before the read means running again from the first unit; nothing will
  have been read.
- **What it reads first:** no outcome of seed 7022 is read, printed or estimated before the registered read: under the
  registration a unit's log carries its stamp, its record of the settings, its timings and its done line, and no survival
  (the rollout beside the engine logs its paths and seconds only); the batch and the agent read only those until then.
- **One estate weight:** 0.02, the 'standard' estate aim a couple's plan takes unless the household lowers it; the couples'
  re-run read both weights with the same outcome, and the share rule acts on the spending each table is solved on.
- **Design review:** research/solver/reviews/2026-11-13-couples-share-design-2.md (the reviewer's, on this revision, before launch).
