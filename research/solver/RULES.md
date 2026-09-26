# The rules of the solver research, in full

*The short form is `CHECKLIST.md` (twelve lines, loaded into every Claude Code session and again after every context
compaction, and copied word for word into the headline of `PLAN.md`). This file holds each rule in full, the times it
was broken, and how it is now enforced. It moved here from PLAN.md's headline on 24 Sep (maintainer: "implement the best
changes now throughout"): a long rule list is followed less than a short one (Jaroslawicz et al. 2025; Anthropic's
Claude Code guidance), so the always-loaded text is the checklist and the rules are enforced by code, not by memory.*

**The principle behind the enforcement.** Written rules are advisory; the checks below run whether or not anyone
remembers them, and every one looks at files, not at what was said about them. In order of strength:

1. **The research scripts themselves** (work in any tool): `run-from-snapshot.sh` refuses a run without a registered,
   pushed prediction and refuses code that fails `smoke.sh` (re-run whenever the solver, engine, library,
   experiment.mjs, any script a batch runs, a module those import, or smoke.sh itself changes: the stamp is `code-id.mjs --smoke`,
   and fair-gate.test.mjs fails if a stamped script imports a module the stamp leaves out; maintainer's unlock, 24 Sep
   13:44 UK); the reducers refuse to print a figure unless `fair-gate.mjs` passes; every result file
   experiment.mjs writes records the code (`code.hash`) and the prediction it ran under; audit-s126.mjs stamps every log
   with the code, its own hash and the prediction since f6a152d (25 Sep), read by fair-gate.mjs's requireFairLogs (the
   other audit scripts' outputs do not yet).
2. **`check-plan.mjs`**, run by GitHub CI on every push (outside any session: a red cross the maintainer sees), by the
   git pre-commit hook (`.githooks/pre-commit`), and by Claude Code's Stop hook.
3. **Claude Code hooks** (`.claude/settings.json`): the Stop hook refuses to end a turn while the plan check fails or the
   plan has changed without a review; before a tool runs, an edit to the enforcement files is REFUSED unless the
   maintainer's own latest message says "unlock enforcement" (a subagent's report, a tool result or a compaction summary
   never counts; the lock returns as soon as they type anything else, even while it waits in the queue) - an "ask"
   would be approved unseen in auto mode; and killing by pattern, `--no-verify`, moving `core.hooksPath`, removing the
   run lock, force pushes and runs of experiment.mjs, batch-*.sh, audit-*.mjs, select-phase4.mjs and the gate scripts
   outside the launcher are refused, each part of a command judged on its own, each rule finding its command past
   variables and wrappers in front of it and inside `bash -c`/`eval` and a here-document fed to a shell (maintainer's
   unlocks, 24 Sep 11:00 and 11:42 UK). It is a guardrail, not a sandbox: what it does not see is
   in **Known limits** below. The Stop hook also lets a turn end while a review of this exact version of the plan is
   under way (started within 30 minutes, not yet reported; maintainer, 24 Sep 12:05 UK). **An unlock covers only the change the
   maintainer agreed to:** anything else - above all a loosening, however sound - is proposed first; it ends as soon as
   their next message is seen, even queued; and the diff is shown before the commit (the seventh review, 24 Sep 11:24
   UK, found all three broken). After every compaction the checklist is restated.
4. **The plan-auditor agent** (`.claude/agents/plan-auditor.md`): a reviewer with no stake in the work reads each change
   to the plan against the judgement rules below and writes a receipt to `review-log.md`; the Stop hook requires a
   PASS receipt for the plan as it stands. It judges the change, not the whole plan: the change since the last
   reviewed version and what it rests on or contradicts, with a full read only at milestones (a settled result,
   before Phase 4, before a value becomes a product default). It grades each finding BLOCKING (it could change a
   result, a status, a prediction, a gate, a default or the order of events, or it claims more than is true about the
   research), MINOR (nothing rests on it; an overclaim about the enforcement is MINOR unless a research claim relies on
   it) or BACKLOG (older text the change did not touch, affecting no result, gate or default: it goes to the plan's
   review backlog with an owner and a gate). A PASS may carry MINOR and BACKLOG findings; the next review requires the
   MINOR ones fixed and the BACKLOG ones logged (maintainer, 24 Sep 11:01 and 12:05 UK). It also checks what the change
   says the code does against the code, following the path through its callers, and blocks on a deviation only when it
   is serious - when a result, figure, prediction, gate, default or diagnosis the plan acts on rests on the claim;
   otherwise it is MINOR (maintainer, 24 Sep 13:44 UK).
5. **`CLAUDE.md` and the checklist**, which say what to do; 1-4 make sure it is done.

**What none of this can do.** A deliberate workaround cannot be stopped by a script; the receipts, the prediction
files and the run log sit in git where the maintainer can see them. The Stop hook lets a turn end after three blocks for
the same reason, with a warning (so a check only the maintainer can clear does not burn the session), which is why CI and
the pre-commit hook stand behind it. The judgement rules (a mechanism
that is only half right, a comparison point about to change) rest on the reviewer, which is a second model, not proof.

**Known limits of the enforcement** - one list, kept current (maintainer, 24 Sep 12:05 UK). Each review checks a change
against it; a gap here is MINOR unless a research claim relies on it. The fixes proposed are in PLAN.md, bugs of 24 Sep.
1. The hook sees an enforcement file only by its full path from the repository root, written out in the command text.
   Anything else gets through: a relative path after a `cd`, a whole folder that holds enforcement files (`rm -rf
   .claude`, `git checkout <rev> -- research/solver`, `mv` or `cp -r` on the folder), a glob, a path split by quotes.
2. A git restore of the whole tree that names no file (`git checkout <rev> -- .`, `git reset --hard`, `git stash`).
3. Ways of feeding a shell its commands other than `bash -c`, `eval` and a here-document fed to a shell: `bash - <<EOF`,
   `bash /dev/stdin <<EOF`, `bash -c "$(cat <<EOF ...)"`, a string piped or here-string'd into a shell.
4. An answer to one of Claude's questions does not relock (it is a tool result, not a message).
5. A script written to a file and then run; bias.mjs and check-k1.mjs run directly; a program that runs a command
   itself.
6. A review start (`record-review.mjs --start`) can be written without a review running. It lapses after 30 minutes,
   and every start sits in review-log.md beside its receipt, so a start with no receipt is visible.
7. The smoke run exercises only its own modes; the audit scripts' outputs record no code, except audit-s126.mjs's
   (stamped since f6a152d, 25 Sep).
   Also (25 Sep 22:45 UK): local runs - the pre-commit hook, the Stop hook, a review - see gitignored build outputs
   (research/engine.mjs, built from src/App.jsx) that CI's checkout lacks, so a test can pass locally and fail in CI; it
   did, from 24 Sep 14:00 UK to 25 Sep 22:07 UK. CI builds the engine since fb9ca50; a CI question is settled in a fresh
   clone.
8. The judgement rules rest on the reviewer, a second model, not proof.
   Also: fair-gate.mjs's row 8 line 'final-year integration' reads a file without the exact final year as "5 nodes", which is
   wrong when QUAD is not 5 (the final year then uses the arm's own points); fairness is unaffected, since the gate compares
   finalIntegral and quadNodes on separate lines (the thirtieth review, 25 Sep; fair-gate.mjs is locked).
9. A receipt is stamped with the plan as it stands when the receipt is written, not the version the reviewer read:
   the plan must not change while a review runs (Claude holds plan edits until the receipt; seen 24 Sep 12:16 UK, when
   a review's receipt covered text committed during it).
10. A script that imports code by an absolute path reads the live working tree, not the launcher's snapshot, and the
   stamp's import test maps such a path to its stamped file, so it cannot see this. None is left in research/solver or
   src/solver (git grep, 24 Sep 14:17 UK; PLAN.md O12); research/audit/timing.mjs and research/tests/safety.test.mjs
   still do, and no batch runs them. A test against it is proposed to the maintainer.

---

## 1. The loop: maths it, test it, then re-maths the rest (maintainer, 24 Sep)

The work runs as a loop: **derive -> predict -> run -> settle -> re-derive everything downstream -> predict again.**
The first half (derive, and write the prediction before the run) is the rule in "Derive first, run to falsify"
below. **The second half is this: after every run that proves or disproves something, that result becomes the
basis for looking again at every later step in the plan, at the maths behind it, and at its prediction. They are
adjusted before the next run starts, not after.** A plan that runs its schedule unchanged after a result that
should have changed it is running on assumptions that have already been disproved.

## 2. When a result counts as settled

**What counts as proved or disproved.** A result is settled only when all of these hold:
1. **Beyond noise.** For a test registered from 25 Sep 20:47 UK: the exact rule of section 8 - exact tests against a
   registered margin, with three outcomes (no material harm, harm, inconclusive). For a result settled before then: a
   difference beyond two paired standard errors on the held-out paths; 8e re-reads, with the exact rule, the ones a
   default rests on. Or a deterministic check that could have failed and did not: bit-identity, a rule held on every
   path-year, an in-model bound. A result within noise settles nothing, except that the effect, if there is one, is
   smaller than the noise.
2. **Produced by a script from the files, not read by eye.** Every figure that changes the plan comes from a
   reducer or a one-off script over saved results, and that script is kept.
3. **Checked against my own error range.** I am a language model, and my errors are of known kinds. This
   session alone made each of these:
   - an arithmetic slip in a derivation (the M15 v2 rung table's first figures);
   - a wrong assumption about the data (that S162 had no minimum pot of its own; that a tier above High exists);
   - a mechanism that was right in part and missing a piece (the first M15 write-up missed the switch margin);
   - text left stale after the facts moved (the mathematician's page).

   So before a result changes the plan: recompute the derivation with a script, check every quoted figure
   against the file it came from, and test the mechanism with a check that could have failed (the M15
   diagnostic is the model). A result that has not been through this is marked "provisional" and changes
   nothing downstream.
4. **The prediction and its falsifier were written before the run.** A result read without one is a finding
   to be predicted and tested next, not a settled fact.
5. **It was a fair test, checked twice: before it was planned and after it ran** (below). A result that fails
   the check settles nothing, however large the difference.

## 3. Every test is a fair test - checked before it is planned, again after it runs, and when old data is reused (maintainer, 24 Sep)

A test is fair when its arms differ ONLY in the thing being tested, or in a setting that one arm has and the other
cannot (a rival rule has no trim penalty). Everything else - the households, the paths, the market, the user's
rules, the code - is the same on both sides. Three unfair tests were caught in this project only by luck or late:
K5's target (three settings different, found 24 Sep), M14's evidence (gathered before the M17 fix changed the
objective, hence M14b), and Phase 2's first draft (a bequest weight given to one arm only, and households chosen
because the solver had already won on them).

**The check, run the same way three times:**
1. **Before a test is planned.** The prediction gets a fair-test table: every variable in the list below, for every
   arm, marked SAME, TESTED (the one thing that differs, named), ONE ARM ONLY (with why that is fair), N/A (with why it
   does not apply) or ACCEPTED. Anything else that differs is fixed before the run or the test is redesigned; ACCEPTED is
   only for a difference shown not to bias the comparison, with that reason written down (the reason is printed with
   every figure the reducer shows). The
   values come from the batch script. The table lives in the prediction file (`predictions/<name>.md`), which is
   committed and pushed before the launcher will start the run.
2. **After it runs, before any figure is read.** The same list, from what ACTUALLY ran: `fair-test.mjs` reads the
   settings each result file recorded, not the batch script's intent, and prints them side by side, household by
   household, what differs first (`node research/solver/fair-test.mjs <tagA>[:arm] <tagB>[:arm] --tested=<n,n>`; every
   new reducer calls the same gate through `requireFair()` and refuses to print a figure when it fails). A difference that is
   not the thing tested, or a variable not recorded and not established from the batch script and git history,
   means the result is not settled - unless it is ACCEPTED with a reason that shows it cannot bias the comparison. An
   unrecorded code version is not accepted by default: until the retro audit establishes it, those results are
   PROVISIONAL (the plan-auditor's first review, 24 Sep). Variables no file records (the engine's return assumptions, pairing, the
   reducer's definitions, machine load) are checked by hand and named in the ledger row.
3. **When existing data is used for a new test** (a reducer over old files, "is the answer already sitting in data
   we have?"), step 2 is run on those files against the new comparison BEFORE any figure is read, and the files'
   code is checked against every change since that touches the quantity. K5's target failed exactly here: files
   made for one purpose, reused for another, under settings nobody re-read.

The ledger row of every settled result names the check's outcome. From 24 Sep every result file experiment.mjs writes records the code
that made it (`code.hash`, a hash of the solver, engine, library and experiment script, plus the git commit); files
made earlier record no code identity, so for them it is established by hand from git history. Run on the comparisons
the current plan rests on: `results-fair-test-audit.txt` (K5's first target fails on 7, 10 and 11; the corrected
target, M17, M14 and M15 pass on every recorded variable except the unrecorded code). The retro audit (schedule 8e)
settles the code identity of the older files.

**Enforced by:** `new-prediction.mjs` writes the table blank; `check-prediction.mjs` refuses a "?" or a missing row, and
the launcher refuses a prediction that fails it; `fair-gate.mjs` (called by every new reducer, `fair-test.mjs` by hand)
compares what actually ran, diff first, and refuses a difference that is not the thing tested; the prediction's git
blob is stamped into every result file, so an edit after the run shows as PREDICTION EDITED.

**The full list of variables.** "Where" is the knob or the field in a result file (`knobs.*` unless said).

<!-- variables:start -->
| # | Variable | Where | A time it went wrong |
|---|---|---|---|
| **A** | **Who and what is tested** | | |
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | band file, `ONLY` | Phase 2's first draft picked households where the solver had already won |
| 2 | Changes the test makes to a household's inputs | `PLANTIER`, `GIAGAIN`, `audit-s126.mjs` variants, added costs | - |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | `target`, `FLOOR`, `floorSpend`; `gk` against `gkFloor` | K5's first draft used the guardrails WITHOUT the floor |
| 4 | The survival asked for, when a run lands | `CONF` (a number, `+n` or `gkFloor`) | `CONF=gkFloor` takes the ask from a rival arm; SOLVERONLY refuses it |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | `seedHeld`, `held` | - |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | `seedSearch`, `SEARCH`, `VERIFY` | the floor landing searched on 7001 and promised on 7002, as the app's spend finder had before it |
| **B** | **The market** | | |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | `mixture` | K5's target (mixture) against the cells (fold), 24 Sep |
| 8 | How each year's return is averaged (quadrature points) | `QUAD`, `quadNodes` (5); the final year: `FINALINT`, `finalIntegral` (off: 5 nodes) | - |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | `research/engine.mjs` (rebuilt from `App.jsx`); `code.hash` | - |
| **C** | **The user's rules - equal on every arm, always** | | |
| 10 | The minimum pot | `MINPOTYEARS` (absent: the plan's own) | K5's target: the one-year pot moved the guardrails' cutting on 4 of 12 |
| 11 | The raise cap | `RAISECAP` (solver), `GUARDCAP` (guardrails) | K5's target predated M23 |
| 12 | The estate preference | `WB`, `BEQSHAPE`, the estate cap, `ESTATESCALE` | Phase 2: a bequest weight given to one arm only |
| 13 | The risk tier chosen, consent to change it, risk above | `PLANTIER`, `TIERS`, `TIERSABOVE` | M14 on the library tests only the top tier (M21) |
| 14 | The one-off cost lookahead | `lookaheadYears` (0 on every rival arm) | - |
| 15 | The tax-free lump sum rule | `lump`, `PCLSSTRICT` | - |
| 16 | The taxable account's tier | `GIATIERS` | - |
| **D** | **The solver's own settings - equal between solver arms unless tested** | | |
| 17 | The grid: points, shares, gain buckets | `POINTS`, `coords`, `SHARES`, `GAINB`, `GAININT` | - |
| 18 | The spending menu and the tier menu | `LEVELS`, `TIERS` | research runs overrode the code's own menu (which has 0.95) |
| 19 | The switch margin and switching cost | `MARGIN`, `SWITCH` | R1: the margin decided M15 v1's result |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | `LAMBDA`, `EXP`; `solver.lambda`, `solver.landed` | - |
| 21 | The raise credit, and whether it is weighted by survival | `RAISE` (mu), `RAISESURV` | mu was calibrated in 2d.4 with resilience on and the old objective |
| 22 | The price of a year with no money | `FAILSHORT` | M14's evidence predates it (M14b) |
| 23 | Resilience and drift | `WR`, `RESIL`, `DRIFT` | - |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | `FINALEXACT`, `SHAREDEAD`, `BRIDGEREAD`, `BLOCKTRIM` | - |
| 25 | How it lands: bisection steps, level search | `BISECT`, `TERNARY` | M6: five steps where eight were derived |
| **E** | **The rival arms** | | |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | `ARMS`; engine config | - |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | `pickFixed`; `label` | - |
| **F** | **The code** | | |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | `code.hash`, `code.commit`; `solverVersion` is hand-set and was not bumped through the M17 fix or F1 | the flex-mix pilot split across solver versions (21 Sep), hence `run-from-snapshot.sh` |
| **G** | **The measurement** | | |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | the reducer | `audit-s126.mjs` subtracted the years above target twice; the V2 prediction read a simulated match as a table match |
| 30 | The reducer and its version | script name, commit | - |
| 31 | Paired or not, and the standard error used | the reducer | - |
| 32 | The table's number is never the result: survival is simulated | the reducer | M16: the table reads 3-5 points optimistic |
| 33 | For timings: what else the machine was running | `uptime` in the log | K5's 385 s median inflated by contention; the `solver-fast` speed check flaky under load |
<!-- variables:end -->

## 4. The mistakes that were made more than once, and the rule each one now carries

Found by reading PLAN.md and PLAN-HISTORY.md for repeats (24 Sep). Each rule names the times it went wrong and how it
is enforced now.

| # | Rule | The times it went wrong | Enforced by |
|---|---|---|---|
| 1 | **"It doesn't affect X" is a claim**, and needs a measurement or a proof beside it, or the words NOT CHECKED | "K5 is unaffected by the raise cap" and "the minimum pot does not change the guardrails' cutting" (both wrong, 24 Sep); S162 "has no minimum pot of its own"; "a tier above High exists"; the certain-success bound (gate 2); re-weighting without a re-solve implied possible (plan review) | `check-plan.mjs` (no-effect) on every new plan line; the plan-auditor |
| 2 | **A check must be shown able to fail** before it is trusted: plant a known fault once and see it go red. A check that ran on zero cases is an error, not a pass | the single-peak probe printed "safe" on zero tests; E1 ran on the wrong menu; the unit suite passed both the broken landing and its repair; 6c's control clause could not be met by any correct code | every new check ships with a planted-fault test (`plan-checker.test.mjs`, `fair-gate.test.mjs`, `hooks.test.mjs`; the smoke run was shown to catch the planted runFixedPath bug); the plan-auditor |
| 3 | **After any code edit, re-test every caller** before launching; no blind find-and-replace | the sed edit that commented out live code and killed a run; the M15 edit that broke the rival arms unnoticed for a day; old scripts that kept a 6-slot state after it grew to 7; solve.js edited three times during one run | `smoke.sh`, run by the launcher whenever the code or any script a batch runs changes (stamp keyed by `code-id.mjs --smoke`); it exercises only its own modes |
| 4 | **A decision changes the code's default in the same commit**, pinned by a test | bare `solve()` still meant the old objective (M1); the code ran five bisection steps where eight were derived (M6); research runs overrode the code's own 0.95 level; `opts.headroom \|\| 6` read 0 as absent; the solver version tag never bumped; the PRODUCT_DEFAULTS comment still said "risk above only as an opt-in" after the default changed | the decided-defaults block in PLAN.md and `plan-defaults.test.mjs` |
| 5 | **After any bug, sweep for the same pattern** and write "Same pattern searched:" with what was found | done by habit after the landing-sample bug and the byte-wide bug; needed the maintainer's instruction after S126 | `check-plan.mjs` (bugs) on every bug entry from 24 Sep |
| 6 | **Chase odd results.** Every one goes in the register with an owner and a gate; none is "noted, not chased" | S126 read 7.5% against 96.8% simulated, logged 21-22 Sep and not chased: it was #106, steering decisions for 40 years; #106 confirmed, then deferred | the odd results register in PLAN.md; `check-plan.mjs` (register) |
| 7 | **Anything chosen on one sample is reported from another**, and anything promised is verified on the sample it is judged on | the app's spend finder (12 of 12 fixtures below target); then the solver's floor landing, the same mistake | fair-test variable 6; the plan-auditor |
| 8 | **Do not measure against a comparison point a queued change is about to replace**; reorder instead | E1 and E3 were nearly measured on a grid about to change size; M14's evidence predated the M17 fix | the re-look (section 5); the plan-auditor |
| 9 | **Time estimates come from a measured cell under the same load**, revised when the first cells land | K5 4.5 h, then 8, then about 12; 6e 40 min, measured 2.3 h; M14b 40 min, then 2 h | the launcher writes the load beside every run in `runs.log`; the plan-auditor |
| 10 | **Start and stop runs safely**: never kill by pattern; check what is running before and after | a launch that started two batches at once; a cleanup `rm -rf` that destroyed the lock; a detached run lost when the container was reclaimed; `pkill -f` that matched its own command, twice | the PreToolUse hook (kill by pattern, removing the lock, the listed experiment scripts outside the launcher) |
| 11 | **A test changed after any result is in is declared** ("Changes after seeing results" in its prediction file) or re-run from scratch | 6c's control clause changed with 8 of 12 results in; Phase 2's first draft chose households where the solver had already won | the prediction's git blob in every result file (fair-gate: PREDICTION EDITED) |
| 12 | **One clock, and no out-of-date text** | the ledger mixed UTC and UK time (24 Sep); the 21:30 audit's stale statements; HOW-IT-WORKS.md; the mathematician's page | `check-plan.mjs` (clock); the plan-auditor for staleness |

## 5. The re-look, after every settled result

**What the re-look does, every time.** For each settled result:
- (a) List every later step, prediction, gate and default whose premise it touches, including ones in other
  sections.
- (b) Re-derive the maths for each, from the files where possible, with no new run.
- (c) Change the plan in place: a prediction re-derived, a stage made conditional or cancelled, a design
  corrected, a question sent to the mathematician, or a decision put to the maintainer.
- (d) Log it in the re-look ledger below (one row per result: what settled it, what it changed, where).
- (e) Update the mathematician's page and any affected artifact the same day.

**Enforced by:** `check-plan.mjs` (ledger: every row carries its evidence - results files that exist, the fair-test
outcome, the prediction - and every figure in the settled-result cell must appear in a cited results file) and the
plan-auditor (did the re-look reach everything downstream?).

## 6. Keeping the plan current (maintainer, 23 Sep)

PLAN.md holds only what is current and what is still to do. **The moment a step, phase, gate or measurement is
COMPLETED, its full text moves to `PLAN-HISTORY.md`** - verbatim, with its outcome and the results file named - and in
PLAN.md it is replaced by one line in "Where things stand" pointing there. A design that is superseded before it runs is
deleted, not archived (git history keeps it). A decision changes the plan in place, with the date and who decided.
Nothing completed is ever deleted outright, and nothing superseded is left to be mistaken for the current plan.
**Enforced by:** `check-plan.mjs` (finished: no COMPLETED section left in PLAN.md) and the plan-auditor.

## 8. The regimen: exact tests, stated uncertainty, review by stakes (the outside review of 25 Sep; adopted by the maintainer 25 Sep 20:47 UK)

The outside review ("Solver research: review, new findings and the updated regimen", 25 Sep) found the two-se reading
miscalibrated (its Finding 1: O19's "at the line" was 4 lost and 0 saved of 3,000, no material harm exactly) and review
effort spent on labels rather than decisions (46 reviews in about 27 hours). The maintainer adopted its recommendations
(25 Sep 20:47 UK). Nothing settled restarts; the regimen changes how new work is registered and read. Each rule names its
enforcement: most of it was applied under the maintainer's unlock at 25 Sep 21:54 UK; what is NOT BUILT or NOT YET is
checked by the plan-auditor by hand.

**Testing** (the review's section 16):
1. **The per-household test** is the exact conditional McNemar on the discordant paths, one-sided for harm; mid-p only
   where the prediction declares it. **The interval** for the survival change is Clopper-Pearson on the lost share,
   mapped to points.
2. **Margins, set once:** 0.25 points where the comparison arm survives 95% or more, 0.5 points below, 0.1 points for a
   pooled mean. Gate 4's 1-point condition stays at the product level. They go into the decided-defaults block with a
   test pinning them (plan-defaults.test.mjs, since 25 Sep 21:54 UK).
3. **Three outcomes per household:** no material harm (the interval's lower end above minus the margin); harm (the
   Holm-adjusted p below the error rate and a point loss of at least the margin); inconclusive (neither: extend at the
   next look, or report the bound). A real loss smaller than the margin is reported and does not block.
4. **Multiplicity:** Holm across the households of one comparison, unadjusted p reported beside it. Panel-level: a
   random-effects (DerSimonian-Laird) pooled mean with its 95% interval, beside the sign test. A floor over a registered
   set of cases expected unchanged, where some are expected to gain, is read by a fixed-effect mean instead, random
   effects reported beside it: a random-effects interval widens with any spread, gains included, and fired on one
   case's gain alone (7e; the maintainer, 25 Sep 22:45 UK, confirmed 26 Sep 06:40 UK on the corrected simulation,
   results-pooled-floor.txt). Its price: a small loss spread over three to six cases is caught 8 to 10 points less
   often; the per-case tests catch a loss on one or two cases well only at about twice the margin
   (at about the margin: 43 to 46%, the whole falsifier 48 to 60%), and only 28 to 53% of a small spread one.
   Each test's prediction names which.
5. **One primary outcome per test;** everything else is descriptive.
6. **Power before the run:** the paths needed so the interval fits the margin, N > 1.96^2 d / delta^2 (d the discordance
   rate), from the nearest earlier records, by a committed script.
7. **Sequential looks:** 1,000 paths, then 3,000 for the households still open, at error rates 0.005 then 0.045 (valid
   because pathsForSeed builds path i from seed + i x 7919, so the first 1,000 of 3,000 are the same paths).
8. **Replication before a default changes:** a second held-out seed or panel, unless overwhelming (Holm-adjusted p below
   0.001 and an effect above twice the margin).
9. **A seed registry:** 7001 search, 7002 tuning, 7003 Phase 4 only, 7004 second seed, 7005 selection, 7011 held out
   for M14b, M14c, O19, quad-ref and 7e (M14c, O19 and quad-ref were missing from this list until 25 Sep 22:20 UK; their
   batches ran on it), 7012 K6 (added 25 Sep 22:01 UK), 7101 the 'auto' rule. Built 25 Sep 22:20 UK under the
   maintainer's unlock of 22:14 UK (their decision 3): the registry is check-prediction.mjs's SEED_REGISTRY, pinned to
   this list by plan-checker.test.mjs; a prediction written after it carries "- **Seeds:**" (each seed registered, each
   reserved one - 7003, 7011, 7012 - its own); the launcher reads the seeds in the command and the scripts it names and
   refuses a reserved seed under any other prediction or under a measurement, and a seed the Seeds field does not
   declare (planted: 15 checks; the launcher shown refusing 7011 under a measurement and 7003 under m14b.md). Its limit: a
   seed a script takes by default (audit-s126.mjs and experiment.mjs default to 7002) is in no text the launcher reads.

Enforced by: `stats.mjs` (the arithmetic; `research/tests/stats.test.mjs` reproduces the review's worked figures and
its planted outcomes); each reducer on the rule carries planted checks and a mutation script showing them able to fail
(`reduce-7e.mjs`, `mutate-reduce-7e.sh`); the plan-auditor.

**Predictions** (the review's section 15) gain these fields: Decision fed (what each outcome changes: held, falsified or
inconclusive), Provenance (every input number with its source), Derivation script (the arithmetic in a committed
script, its output hash recorded), Point and interval (a point and an 80% interval per primary quantity), Credence (the
author's probability for each item), Power, Decision rule (primary outcome, test, margin, multiplicity, three outcomes,
looks), Budget line (the error-budget line it reduces) and Pre-mortem (the most likely way each item fails, and what that
would mean). A change to the decision rule after launch demotes that item to descriptive. Enforced by:
`check-prediction.mjs` for every prediction but the nine registered before (since 25 Sep 21:54 UK), and the launcher's re-run of each derive line.
**The scorecard** (not built yet): each item's credence against its outcome, the Brier score per test and cumulatively,
target below 0.20; it starts with 7e. Every recommendation to the maintainer quotes the current score.

**Evidence and review** (the review's section 17):
1. **Evidence grades** on every ledger row and every claim a decision cites: A (registered, exact test with margin,
   fair-test pass, reproduced by a second seed or an independent script) can support a product default; B (registered,
   one run, fair-test pass) a plan reorder, or a default with the maintainer's explicit acceptance of the risk; C
   (exploratory or "not registered") a hypothesis; D (derivation or argument only) a hypothesis, never a no-effect
   claim. No-effect claims need grade A or B (extends section 4's rule 1). Enforced by: `check-plan.mjs` claim linting
   - "settled", "shows", "causes", "no effect", "unaffected" and "costs nothing" need a grade A or B citation on the same
   line - on added lines (since 25 Sep 21:54 UK); run once in 8e over the PLAN-HISTORY claims decisions still rest on.
2. **Review depth by stakes.** Tier 0 (wording, time labels, history moves, typos): mechanical checks and a short
   auditor pass on the labels only. Tier 1 (a new result row, a registered prediction, a register row): the auditor on
   the diff, checklist-driven. Tier 2 (a product default, a gate decision, Phase 4's prediction or verdict): full audit,
   the two-source rule, an outside review by a differently configured model, and red-team questions. The Stop hook's
   receipt stays required for every change to the plan; the tier sets the review's depth, not whether one runs.
   Enforced by: NOT YET - the reviewer's instructions (.claude/agents/plan-auditor.md) are the assistant's own
   configuration, and the session's permission classifier refused the change (25 Sep 21:56 UK); the draft waits for the
   maintainer. Until then each review is asked for its tier in its brief.
3. **The two-source rule:** any figure a tier-2 decision rests on is produced twice by independent routes, and the
   ledger row names both.
4. **A materiality gate for the register:** before opening a row, estimate the largest plausible effect on the headline
   (survival points times the share of households affected), with its evidence. Below 0.1 points on the panel mean,
   with no default depending on it, the row reads "noted, below materiality" and needs no owner or gate (a relaxation
   of section 4's rule 6 the maintainer adopted). Enforced by: `check-plan.mjs` register rule (since 25 Sep 21:54 UK).
5. **Decision records:** every recommendation carries the options, the recommendation, its evidence grade, the author's
   confidence in plain words, the most likely way it is wrong, the cost if it is, and a revisit trigger.
6. **Stop rules:** grid and cliff work stops when the optimality-ceiling gap is below its target; an odd result closes
   when its exact interval sits inside the margin; nothing is re-run to "resolve" noise without a new registered
   prediction and a power statement.
7. **A value-of-information screen before Phase 4:** an item runs before Phase 4 only if a plausible outcome would change
   Phase 4's arms, panel, decision rule or verdict.

**Accuracy targets and the error budget** (the review's section 14): code fidelity stays exact; table fidelity is split
into grid, quadrature and information parts; policy optimality within 0.2 points of the ceiling on the panel mean and
0.5 on any household; the edge's sign holds on every engine; external calibration reported. Before an accuracy task
starts, its prediction names the budget line it reduces and by roughly how much, and the largest line goes first.

## 7. Where the approach came from (24 Sep)

- Anthropic, "Best practices for Claude Code": CLAUDE.md is advisory, hooks are deterministic; keep CLAUDE.md short;
  give the agent a check it can run; a verification subagent so "the agent doing the work isn't the one grading it";
  the Stop hook gives up after 8 consecutive blocks. https://code.claude.com/docs/en/best-practices
- Rule compliance falls as the number of instructions grows (Jaroslawicz et al. 2025, "How many instructions can LLMs
  follow at once?"). https://arxiv.org/abs/2507.11538
- Rules present after a compaction but no longer followed, while an imperative session-start hook was (claude-code
  issue 95745). https://github.com/anthropics/claude-code/issues/95745
- A research agent that edited its own time limit instead of speeding up (Sakana's AI Scientist): protect the checks.
  https://sakana.ai/ai-scientist/
- Pre-registration by a pushed git commit: "local history can be rewritten; a public push cannot be quietly
  backdated". https://github.com/levi909-create/open-subject-prereg
- The regimen of section 8: the outside review of 25 Sep, "Solver research: review, new findings and the updated
  regimen" (the claude.ai document the maintainer shared, 25 Sep 20:42 UK), with its sources (Appendix B there).
- Compare runs by what differs; the commonest cause of unreproducible results is a silent default.
  https://launchdarkly.com/blog/ml-experiment-tracking/
