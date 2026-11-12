# Registration: Part D's D4, run once more on the code that ships (couples-d4.md's re-run; the review of 9 Nov, items 1 and 9; D66, D67; revised 11 Nov: D73, D78, D80)

Read once, by `research/solver/reduce-couples.mjs`, after its gate. It is `couples-d4.md` in its 40 couples, its seed and its
primary metric. It differs in the five things the review of 9 Nov names (item 1, part 2), each stated where it falls below:
the code, the targets landed again, the paths in two stages, where the units may run, and what became of D4. And it differs
in what the external review's answer of 11 Nov (`research/reviews/2026-11-09/ANSWERS-2026-11-11.md` on
review/external-2026-10-21, sections 3 and 4) and the maintainer's rulings on it (D78, D80) change: the comparison against the
couples' solver at the product's settings is reported and decides nothing; that arm runs the first 1,000 paths of each of its
units; the candidate is the one D73's port left; item 11 is named; and no arm takes a shortlist, an option of item 12 or item
13's tie-break. The gate refuses a chunk whose stamp is not the logs' one version: the code (code-id.mjs) and the audit hash
over every file the run and the read take beyond it (audit-couples.mjs STAMP_FILES: the audit, the panel's and arm A's code,
src/solverApp.js and src/solverSettings.js, candidate.mjs, the frozen orders, the re-landed panel, the paths, the stage gate,
the reducer, the Phase 4 code it borrows and the provenance check, fair-gate.mjs); a solver unit whose configuration hash or
settings are not those below; a couple's chunks that do not follow the first stage's decision (it recomputes that decision
and holds the run's own `stage2.json` to it); and a SHIPC unit that is anything but its one chunk of 1,000 paths. Launched
only as
`PREDICTION=research/solver/registrations/couples-d4b.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples.sh`,
from a git worktree at the launch commit, where every relaunch under `RESUME=1` and the read also run, and only when the
maintainer says so (D78: "Do not launch until I say so"). When it launches, `couples-d4.md` is marked superseded.

- **Question:** Does the candidate for couples (each person's table at the candidate's settings, the two run by the couples'
  rollout of Part D's D1 to D3), executed by the app's own engine, keep more held-out couples solvent than the app's own
  rules, without delivering less spending? Reported beside it, deciding nothing (D78): how the candidate compares with the
  couples' solver at the product's settings (PART-C-PLAN.md: "against the app's rules and against the product's settings";
  `couples-d4.md` asked for no harm against it). The review's reason: no couple has had the couples' solver at the product's
  settings (couples run the app's rules, D42), so as a gate it could only withhold the candidate. Couples keep the app's rules
  under Part C's switch until this reads (D42).
- **Arms:** CANDC, the candidate `af001697ce1b` for each person (`d71f65ae871e` in `couples-d4.md`, before D73's port):
  src/solverApp.js solveForApp over APP_CANDIDATE, as the app solves a single's plan, at the app's 45 wealth points, the dial
  at 1, the estate aim 'standard' (weight 0.02) or 'lower' (0.01), the floor, and the couples' rollout (src/solver/couple.js:
  its path ranked from each person's chooser's shared scores since the review's item 2, `COUPLE.fast`; its joint move valued
  on flat arrays since item 11, `COUPLE.flat`; both exact, both on). SHIPC, each person's table at the product's settings
  `07c069b6e330` (PRODUCT_BASELINE, solvePlan, 30 points, lambda as 7u-F's, the estate weight 0.02 or 0.01), the same
  rollout, on the first 1,000 paths of each unit (Paths, below). APP, the app's rules: its withdrawal-policy search on the
  couple's own plan (select-phase4.mjs armA, `tournament: false`, searched on seed 7001; D36), guardrails on, the floor at 80%
  of target, the cost lookahead at 5 years, raises capped at 110%. Each solver unit records its configuration hash (checked
  against these two by the audit and the gate) and each person's run record, as `couples-d4.md` lists it, the reader's
  lattice now 80 x 21 x 64 with its foot and every step, and two settings more (fair-variables rows 35 and 36): where the
  year's sweep sends cash ISA money (`sweepCashIsaTo`: 'isa' on CANDC, unset on SHIPC), and whether the solve took the solve
  on anchors and shortlists (`coarse`: on CANDC its setting `w2a3b3g2c2-NT-LRVOH-h3` wherever the person's solve has the joint
  tier state, and off with its reason where it has none; none on SHIPC). Each solver unit also records each person's share
  of the spending and its rule (row 34: the read refuses any but 0.5 by half), `COUPLE.flat` and `COUPLE.fast` as run (the
  audit runs no unit, and the read refuses one, with either off), and what D80 rules out, each read as 'none' or 'off'
  (below). Every arm runs on the same plan (couple-panel.mjs planOf at the couple's re-landed target); the gate holds a
  couple's units to one inputs hash. **The code (the review's difference 1):** the working branch after the review's items 2
  to 5 (the couples' path by the shared scoring; the engine's year in HMRC's order; relief on money the plan pays into a
  pension, none from 75; the pages naming the sweep), after D73's port (committed at 4e6c6a09: the candidate sweeps cash ISA
  money to the stocks and shares ISA, item 5's default; each person's table is solved on anchors and shortlists, item 10,
  handed only to a solve that can take it, D74; the bridge reference is the thinner lattice) and after item 11 (the joint
  move on flat arrays, `COUPLE.flat`, exact, on by default, `research/tests/couple-flat.test.mjs`, committed at 55d45143);
  the household's joint move carrying the sweep each person's table was solved with (`couple.js` `sweepOf`,
  `research/tests/couple-sweep.test.mjs`, committed at 0b047efd: before it a couple's cash ISA money was swept to the taxable
  account under tables solved for the ISA; the other reading, a couple's person-solves leaving the key out, is the
  maintainer's to choose before launch, and choosing it means landing, the pilot and this review again);
  with item 6's stage B in and off (`shareRule` unset: each person's table on half the spending, as D4's couples, who hold
  60/40, ran). Nothing of the review's items 7, 12 or 13 is in any arm (D80: "No registered couples' arm takes a shortlist,
  item 12's options or item 13's tie-break"): items 13 and 7 are built since 21b58645 as options, off in code and out of
  the candidate (`tieAboveCap`, `chooserShortlist`; D85, D86), item 12 is not built, and the audit reads each by its name
  wherever the code has it (solve.js's `SHORT`, the chooser's shortlist of item 7, which is not item 10's solve on anchors;
  couple.js's `COUPLE_APPROX`, item 12's approximate cuts to the joint move; on a solved plan `tieAboveCap`, item 13, the
  chooser's `tieMargin`, in the code today and off, with `tieSame` and `tieAbove`, and `chooserShortlist`), refuses to run
  with one on, and records the three for the gate, which refuses a unit recording one on or none at all. Each arm's
  configuration hash is as that code gives it: CANDC's `af001697ce1b`, SHIPC's the same as D4's. The run is tied to the code
  the couples were landed on (`couples-panel-d4b.json`'s code, 1d5d2421c9ab): the
  registered audit and the read each refuse any other, so a change of code before launch means landing again, a new pilot
  and a new design review.
- **Households:** D4's 40 couples, landed again on the code above (`couples-panel-d4b.json`, its code 1d5d2421c9ab; arm A from 84.0% to 85.9%, every couple landed, none passed over, each target and arm A's survival the same as on the landing before it, `results-couples-panel-d4b.txt`).
  They are `couples-panel.json`'s, named before seed 7021 was read: 20 library couples whose first person is older than 44,
  S011, S031, S047, S063, S083, S097, S115, S133, S149, S167, S189, S205, S223, S239, S259, S277, S293, S371, S387, S403; 20
  whose first person is 44 or under, each person retiring at 52, S301F, S305F, S307F, S309F, S311F, S317F, S319F, S321F,
  S323F, S325F, S327F, S329F, S331F, S333F, S335F, S337F, S341F, S343F, S345F, S347F; in the same order, the couples
  unchanged. **The targets landed again (difference 2):** item 3 moves a couple's survival under the rules, and the run is
  tied to the code its couples are landed on, so each is landed again on that code by the same procedure (couple-panel.mjs
  `reland`: from the library's target, arm A searched anew at each step, 85 +/- 1% on 1,000 paths of seed 7005, the selection
  seed), before seed 7021 is read (`results-couples-panel-d4b.txt`). This is the second landing: the first, on the code after
  items 2 to 5 (0b45e5f9f059; arm A from 84.0% to 85.9%), went with that code when D73's port and item 11 came in (D71, D78:
  "land the 40 couples again, run the pilot again", once). Used before, as `couples-d4.md` records; and D4's own run
  (below), stopped unread.
- **Seed:** 7021, reserved in check-prediction.mjs for `couples-d4*.md` (D61). D4 ran on it and was stopped with no result
  read (difference 5, below), so no path of 7021 has informed any choice; this run reads it, once. The landings read 7001 and
  7005, the pilots 7002; none shares a path with 7021 (path i of a seed draws from seed + 7919 i, and no two of these seeds
  differ by a multiple of 7919).
- **Paths:** (the review's difference 3) item 9's two stages for CANDC and APP, at D61's 19,000 a unit (`couples-paths-d4b.json`); SHIPC's 1,000.
  Two stages. After 5,000 paths a unit whose observed change against APP is +0.5 points or more stops and is read as not
  harmed. Every other unit runs to N paths and is read by D34's rule at N. Both rates are the exact two-stage rates of
  `size-phase4.mjs`, printed in the sizing file (`results-couples-sizing-d4b.txt`, made again from the new pilot). Here a unit
  is a couple and estate weight: its CANDC survival on the first 5,000 paths of 7021 less APP's, in points, paired; at +0.5
  or more CANDC at that weight stops at 5,000, and APP stops where both weights do. The decision is the registered stage
  gate's (`stage-couples.mjs`, once every first-stage chunk is in; it writes the run's `stage2.json` and prints only how many
  couple-weights go on); the read recomputes it from the first stage's chunks and refuses a run whose chunks or `stage2.json`
  disagree. SHIPC has no part in it (D78): each SHIPC unit runs the first 1,000 paths of 7021, in one chunk, in the first
  stage, and has no second-stage chunk whatever the stage gate decides (the audit lays none out, the batch refuses a list
  naming one, the stage gate and the read refuse a SHIPC unit on any other paths). Its paths are fixed before any is read and
  do not turn on the comparison against APP, so what is read against SHIPC is not conditioned on a couple's stopping (the
  first form's two cautions on that, the design review's MINOR 4, fall away with its per-couple flags). The deciding items
  are read on the paths every couple ran in CANDC and APP, the first 5,000 (all 19,000 only if every couple-weight went on);
  everything against SHIPC on its own 1,000, CANDC's same paths. A chunk is its own process, path i the seed's path i
  whichever chunk runs it: the first stage one chunk of 5,000 a unit for CANDC and APP and one of 1,000 for SHIPC, the second
  CANDC in three chunks of the remaining 14,000 and APP in one; 480 chunks at most over the 40 couples (560 in the first
  form: SHIPC's 80 second-stage chunks are gone; the first stage's 200 keep their numbers). The check against `E.runTrial`
  and the rollout beside run on the first stage's chunk, for SHIPC inside its 1,000 paths.
- **Primary metric:** as `couples-d4.md`: survival scored by the engine (audit-phase4.mjs runPath: the engine's own year, path
  by path, held to E.runTrial on the first 200 paths of every unit): a path survives when every year's own spending is met to
  within a pound and the minimum pot is held at the end. Paired on the same paths of 7021 across the arms. Spending delivered
  over every year beside it. On the solver arms the couples' rollout in the exact model (runCouplePolicy) runs beside the
  engine on the first 500 paths; a path the two score differently is a fidelity gap, reported.
- **Decision rule:** at each estate weight, on the paths every couple ran in CANDC and APP (above), each path's change
  averaged over the 40 couples and its 95% interval taken from the spread across paths (Phase 4's rule): A1, survival CANDC
  less APP, passes when the lower end is above 0; A2, spending delivered over every year, CANDC less APP as a share of the
  couple's mean under APP, passes when the lower end is above -1%. PASS is A1 and A2 at both weights. S1, survival CANDC less
  SHIPC, is no part of the rule (`couples-d4.md` passed it when its lower end was above -0.1 points): it is reported, below,
  and whatever it reads the outcome is A1's and A2's. D34's flags, per couple and weight: harm against APP when, having gone
  on, the observed loss over its 19,000 paths is above its threshold at 19,000 (a couple and weight that stopped is read as
  not harmed; no correction across couples); spending when a couple delivers more than 5% less than under APP (reported, not
  blocking). There is no harm flag against SHIPC: 1,000 paths a unit cannot carry D34's rates. Every comparison against APP
  (80) is printed with its paths, discordance, bound, threshold and both rates, and whether it stopped at the first stage;
  one whose 1-point rate is below 0.90 is named and reported as below D34's rate, with its rate, and gets no more paths (D61).
- **Outcomes:** PASS (A1 and A2 at both weights): the candidate for couples goes to the maintainer, who decides whether
  couples run it under Part C's switch (D42 holds until then; a couple holding less than 40% or more than 60% of the pots
  keeps the app's rules until item 6's stage C reads, M4 in D66). NOT PASSED: couples keep the app's rules under the switch,
  the write-up names each failed item and by how much, and nothing is tuned until it passes. A harm flag against APP or a
  spending flag sends that couple to investigation whatever the outcome; on its own it does not block (D34 (3)). Reported,
  not deciding: S1 at each weight, the pooled change in survival, CANDC less SHIPC, over the 40 couples on SHIPC's own paths
  (the first 1,000 of each unit, CANDC's same paths), its 95% interval taken as A1's is; where that interval lies wholly
  below -0.25 points the read says so in a line and it is logged in the register of open items (STATE.md section 4) with an
  owner, the maintainer: a finding to investigate (whether the candidate's settings suit couples as well as the product's),
  not a reason to withhold. And as `couples-d4.md` lists them, each against APP on the paths every couple ran in CANDC and
  APP and each against SHIPC on SHIPC's 1,000: spending delivered CANDC less SHIPC; the cost years; A1 and A2 apart where arm
  A takes the full lump sum; S1 over each cohort; A1 and S1 over the couples either of whose candidate tables reads a bridge
  year and over the rest; the fidelity gaps; the solve times, the longest chunk and the hosts; and the count of couple-weights
  that went on.
- **Where it runs (difference 4):** in one session (the review's answer of 11 Nov, section 2; D78): the batch as it is, four
  chunks at a time, `D4_SHARD` unset, in the harness's 12-hour windows under `RESUME=1`, its finished chunks backed up to one
  orphan branch (`backup-chunks.sh`). The first form's permission stays, unused: the batch carries `D4_SHARD` (the review's
  `prototype/d4-shard.diff`, in batch-couples.sh from the launch commit), and the units may run in up to four cloud sessions,
  each from a worktree at the launch commit, each backing its finished chunks up to its own orphan branch, the read in one
  worktree (the review's item 1, part 3: two sessions agreeing on a preflight first, the first worker alone, its heartbeat);
  each stage's chunks gathered into one folder before the next, the stage gate run there once every first-stage chunk is in,
  its `stage2.json` going to every session before the second stage with every first-stage chunk and its log (a worker without
  them stops at the gate, safely, and waits). Registered so, more sessions would be no departure. The shard filter's own test
  (the design review's MINOR 5) is built, `research/tests/d4b-shard.test.mjs`, its off-by-one plant failing, and unused: no
  worker session starts. Which couples and weights went on is a partial result of seed 7021: it is in `stage2.json` and can
  be traced from the second stage's chunk numbers in the heartbeats, both on the backup branch; nobody reads either beyond
  the batch's own use until the read, and the statement made at the read covers them.
- **What became of D4 (difference 5):** D4, as registered (`couples-d4.md`), stopped on 10 Nov 08:44 UTC, unread, on the
  maintainer's ruling (D66, M1), with 76 of its 520 chunks finished; those 76 stay on the branch `d4-backup`, unread, until this
  run's read, and the branch then goes (D63). The statement made on that stop (STATE.md section 5, D67): no arrays file of D4
  has been opened; beyond its stamp line, its second line and whether it holds a done line, the backup script read each
  finished log's third line (the couple, the unit, its cohort, its landed target and its paths: registered inputs), and on 9
  Nov five commands and one EXPLORATORY script printed that third line and timings only; no survival, estate, spending or other
  outcome of any unit has been printed or read by anyone. On that statement the maintainer kept the panel and the seed (D67).
  On 11 Nov the design reviewer of this registration's first form, checking that statement, opened one commit of `d4-backup`,
  the one holding D4's copy script and its README: no chunk, no arrays file and no log of D4, and nothing of seed 7021 (STATE.md
  section 5; the external review's answer of 11 Nov, section 6: accepted as recorded, D67's statement stands). The statement
  made at the read says so too; `d4-backup` is otherwise unopened and stays so (D78).
- **Budget:** Measured (D21) from the pilot on the landing's
  code (S011 and S301F, seed 7002, 1,000 paths a unit, through the launcher from dfc871d5, the machine running nothing else;
  `results-couples-sizing-d4b.txt`, printed by `size-couples.mjs`), each couple scaled from its cohort's pilot couple by its
  horizon: the first stage 47.8 core-hours (200 chunks: the solves 11.0, the engine 31.8, the rollout beside 4.9; by arm
  CANDC 28.7, SHIPC 19.0 at one solve and 1,000 paths a unit, APP 0.1), about 12 hours on four cores in one session, one
  12-hour window; the second stage from none (the floor) to 76.1 core-hours if every couple and weight went on (the
  ceiling, 280 chunks, about 19 hours on four cores); at the pilot couples' own changes against APP (+9.0 to +10.0 points)
  every couple and weight stops at the first stage (the exact rule: certain at those changes), so the expected run is the
  first stage's 47.8 core-hours. The longest chunk 0.47 hours (0.57 at a fifth slower), against the 12-hour limit. On the
  pilot's discordances every comparison against APP keeps D34's rates at 19,000 (the lowest a 1-point loss read 0.902, S011 at
  W0.02, its discordance 10.20%, upper bound 12.24%, against the 12.45% up to which the rate holds).
  S1's pooled standard error over the 40 couples at 1,000 paths: from 0.065 to 0.289 points at W0.02 and from 0.068 to 0.302
  at W0.01 (the pilot's two couples' spread scaled, the sizing file's last lines). Against the first form's
  first stage of 187.9 core-hours (its pilot on 0b45e5f9f059): item 11's faster path for a couple, SHIPC on 1,000 paths a
  unit, and item 10's faster solve.
- **Design review:** <TO FILL after the design review of this revised text: its file under research/solver/reviews/ and its verdict>.
  The first form's review, research/solver/reviews/2026-11-11-couples-d4b-design.md (PASS, six MINORs), read the text
  before this revision and does not cover it: its MINORs 1 to 3 stay fixed, each with its planted case (the run tied to the
  landing's code, the share recorded and checked, the spending flag paired); 4 falls away with SHIPC's per-couple flags
  (Paths, above); 5 is built and unused (Where it runs, above); 6 is stated above.
