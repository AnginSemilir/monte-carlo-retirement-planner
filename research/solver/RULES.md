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
   under way (started within 30 minutes, not yet reported; maintainer, 24 Sep 12:05 UK), and refuses to end one while a
   deep review is due (section 9; 26 Sep). **An unlock covers only the change the
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

**Loosened on 26 Sep** (the maintainer, 18:02 UK: "Do all", on five proposals weighed against the reviews' record - 77
reviews, 131 BLOCKING and 337 MINOR findings, about a third of them on prose times or the enforcement's own wording; the
count is a rough keyword split, grade C): (1) times come from the records (commits, runs.log, receipts); prose gives one
only where the order of events matters, and the plan-auditor no longer reports a prose time elsewhere; (3) the pre-tool hook
refuses a command only where an enforcement file is a write TARGET (a redirect, a writing command's file, git checkout or
restore, an inline program's write call), not wherever one is named beside a write-looking word - it had refused six
read-only or unrelated commands on 26 Sep (hooks.test.mjs: those pass, fifteen kinds of write are still refused); (4) a
prediction's fair-test table may leave out the rows that are SAME behind the line "All other rows: SAME" - every other status
is still written with its reason, and the reducers' gates still check the settings the runs print; (5) one copy of the
checklist: PLAN.md points to CHECKLIST.md (a copy that stays must still match word for word). Not done: (2), a plan review
only at gates (a registration, a settled result, a default change) with the launcher requiring a PASS receipt - the Stop
hook's change was refused by the session's auto-mode permission classifier as self-modification of an oversight hook, and
is left to the maintainer (the launcher half made sense only with it). The maintainer approved it at 18:41 UK ("I approve
the stock hook change. Unlock enforcement"); the classifier then refused the launcher half and a correction to the hook's
own header, so the hook was restored to its committed version and the Stop hook's half of the diff was sent to the maintainer as a
file (outside the repository); the maintainer, 19:15 UK: "leave it for now". What stays: predictions before runs, the fair-test
gates, planted faults, exact tests and Holm, the unmasking rule, the deep review, and the plan review after every plan
change. Found while re-anchoring the checker's planted tests after the move: check-plan.mjs's bug-sweep check read only
headings "Bugs found and fixed on", so the section "Bugs found on 26 Sep" had never been checked; it now reads both (the
section's entries all carry their "Same pattern searched:" line - check-plan passes on it).

**What none of this can do.** A deliberate workaround cannot be stopped by a script; the receipts, the prediction
files and the run log sit in git where the maintainer can see them. The Stop hook lets a turn end after three blocks for
the same reason, with a warning (so a check only the maintainer can clear does not burn the session), which is why CI and
the pre-commit hook stand behind it. The judgement rules (a mechanism
that is only half right, a comparison point about to change) rest on the reviewer, which is a second model, not proof.

**Known limits of the enforcement** - one list, kept current (maintainer, 24 Sep 12:05 UK). Each review checks a change
against it; a gap here is MINOR unless a research claim relies on it. The fixes proposed are in PLAN.md, bugs of 24 Sep.
1. The hook sees an enforcement file by the path written out in the command text: an absolute path exactly, and a
   relative one by its file name alone - a relative write target whose name is a locked file's name (or the name of a
   file in a locked folder today) is refused, wherever the command has cd'd to, since any relative path to a locked file
   ends in that file's name (since 27 Sep, the hundred-and-fourth review: following cd, pushd, git -C and the like first
   missed a relative path after any cd, then missed "$(...)", loops and wrappers; the name reading needs no directory at
   all and runs in one pass). A writing command's relative target that is a folder the command could be standing in or
   beside - `.`, `..`, a path ending in /, or the name of a folder on a locked path (.claude, hooks, agents, .githooks,
   .github, workflows, research, solver, tests) - is refused too (the hundred-and-fifth review: `cp x .` inside
   research/solver and `rm -rf hooks` inside .claude got through the name rule). ~ and $HOME are read as absolute. Its
   cost while locked: a relative write to any file that merely shares a locked name (settings.json, pre-commit, smoke.sh,
   CLAUDE.md, ...), any cp, mv or rm whose relative target is `.`, `..`, ends in / or is one of those folder names
   (`rm -rf results/diag7v/`), and an inline python or node program that writes anything while quoting a locked name it
   only reads, are refused; name the path absolutely. Here-documents are read line by line (heredocs()): a body is data,
   the rest of its opening line is code (less a comment), the delimiter is taken as bash takes it, and only the delimiter
   line alone ends a << here-document (tabs stripped only for <<-). Not handled, as before: a `<<` inside quotes or a
   comment read as an opening, and a delimiter partly quoted (`<<E"OF"`); symlinks, `>|` and `>&` targets. A whole
   folder named by its path (`rm -rf .claude`, `git checkout <rev> -- research/solver`, `mv` or `cp -r` on it) is refused
   by every version of the hook since 2945f68, 26 Sep (the hundred-and-sixth and hundred-and-seventh reviews). Gets through (the hundred-and-sixth review, 27 Sep; the
   lock changes stopped there at the maintainer's word, "stop after this round"):
   - a glob (`rm -rf research/sol*`), a variable or expansion (`$PWD`, `~+`, `$(pwd)`), a path split by quotes or
     backslashes, a symlink;
   - a target given by an option: `cp -t .`, `--target-directory=.`, `install -t`, `ln -st`;
   - here-documents at the edges: an arithmetic `<<` (`$((1<<3))`) or two openings on one line (`<<A <<B`), an escaped
     `\'` outside quotes, `$'it\'s'` and `<<E\OF`, each able to hide a later redirect; and two made possible by the
     27 Sep change (9156ab8): a quoted ` #` after an opening (refused only by 9729d3c, whose own fix 9156ab8 undid), which the comment strip
     reads as a comment and drops the rest of the line, and a here-document piped to a shell more than 400 characters
     after its opening (or `bash<450 spaces><<EOF`; refused by every version from 8823783 to 9729d3c);
   - a launch, `--no-verify` or force push padded with more than 1,000 characters of path (`node` then 501 `./`), also
     new in 9156ab8 (all eleven earlier versions refused it); no real script word is near that (the longest in runs.log is 35 characters);
   - a command of about 128 KB built to be slow: the harness passes a command as one `bash -c` argument, which fails at
     131,072 bytes, and the worst known input under that (128,000 `(` then a python here-document) takes 17.7 s against
     the hook's 10 s timeout (27 s before 9156ab8).
   Refused though harmless, beyond the costs above: `git checkout -- .`, `git restore .`, `git rm -r --cached .`, `chmod
   -R u+w .`, `touch src/`, `rsync -a /tmp/build/ ./`, and a `$VAR/`-prefixed absolute path (read as relative). Also refused while locked (found 27 Sep at 7v's read): `sed -i 's/a/b/' file` anywhere, since the
   substitution itself ends in / and is read as a folder target; use an inline program instead. The
   hooks test's timing checks have a 2 s bound; the `{` one ran in 1.69 s beside 7v and may fail spuriously on a busy
   box.
2. A git restore of the whole tree that names no file (`git reset --hard`, `git stash`); `git checkout <rev> -- .` is
   refused since 9156ab8 (a target of `.`).
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
11. fair-gate.test.mjs checks that a reducer calls the fair-test gate (requireFairLogs) only for files named
   reduce-*.mjs (its l.74-76), so a script that reads result files under another name escapes it: read-o17.mjs, which prints
   figures from 7e's logs and relies on reduce-7e.mjs's gate over the same files, as its header says (the sixty-fifth review,
   MINOR 6, 26 Sep 11:48 UK). A test that looks for any script reading results/ is proposed with the next unlock.
12. The pre-tool hook refuses a named audit or experiment script run outside the launcher, but not a script that imports
   one: `node -e "import('.../audit-s126.mjs')"` ran audit-s126.mjs's default mode outside the launcher on 26 Sep (PLAN.md,
   bugs of 26 Sep). A hook rule that also refuses node -e, node --eval and node -p naming those scripts is proposed with the
   next unlock.
13. smoke.sh's diag7r line runs S126 at 4 points, where the reader changes no move, so 7r's swap arms swap nothing there:
   the swap itself is checked only by research/tests/solver-choose-hook.test.mjs (8 points), which neither the launcher,
   the pre-commit hook nor CI runs, and the smoke line does not grep the swap lines or the swap traces' stamps (the
   sixty-seventh review, MINOR 1, 26 Sep 12:45 UK). Proposed for the next unlock: those greps, and the hook test in CI.
14. A deep review's start and receipt (`record-deep-review.mjs --start`, `--findings`) can be written without a review
   running, as a plan review's can (limit 6). A start lapses after 30 minutes; every line sits in deep-review-log.md, and a
   receipt shorter than 200 characters is refused, but its content is the reviewer's, not checked (26 Sep).
15. The prediction checker's Unmasking field takes new-prediction.mjs's own placeholder ("? (RULES.md section 9: ...)", over
   80 characters) as filled in (the seventy-seventh review, MINOR 2). Proposed with the next unlock: refuse a field that
   starts with "?", as the checker could for every field the template leaves as "?".
16. diag-7t.md stays exempt from the Unmasking field by name (BEFORE_UNMASKING) after its re-registration of 26 Sep 17:50 UK;
   it carries the field all the same, so nothing rests on the exemption. Proposed with the next unlock: remove it from the
   list.
17. The Stop hook's deep-review gate fails open: if uncertainty.mjs errors, or its planted checks fail, the hook reads "not
   due" and the turn may end. Proposed with the next unlock: treat an error as due, with the error as the reason. Also
   stale, locked: stop-check.mjs's header says "Two conditions"; there are three (the seventy-seventh review, MINOR 6).
18. A measurement (PREDICTION=none) can run a test's own mode, settings and paths before that test is registered: the
   launcher checks neither the mode nor the paths against registered or planned tests. 7v's timing measurement did (27 Sep,
   runs.log 07:09 UK: S126 on 7v's own first 1,000 paths), and its lines were printed before registration (disclosed in
   predictions/diag-7v.md; the ninety-third review, BLOCKING 3, and the ninety-fourth, MINOR 8). Until a check exists, a
   timing measurement runs on a seed or paths the test will not read, or its lines are not read beyond the seconds.
19. Rule 11's route for a change after launch (the prediction's "Changes after seeing results") was closed to a stamp-gated
   test until 29 Sep: requireFairLogs (fair-gate.mjs checkLogStamps) had no accept path, so any edit to the prediction after
   launch made the gate refuse the whole batch (7v, 27 Sep; 7af, 29 Sep). **Closed by the maintainer's unlock, 29 Sep:** the
   gate now takes a declared correction (fair-gate.mjs declaredCorrection) - the file may differ from its launch blob, which
   git gives back by its hash, only in UK time tokens ("HH:MM UK") and by an addition to its "Changes after seeing results"
   that declares the change; the declaration is printed with the figures. Anything else - a prediction, falsifier, rule,
   fair-test row, figure or date - is still PREDICTION EDITED (research/tests/fair-gate.test.mjs, eight planted cases; each
   of the gate's six new conditions shown to fail a test when broken; a declaration with no time changed is refused, the
   plan-auditor's MINOR 3 of 29 Sep). Its limit: the declaration's words are not checked, and any "HH:MM UK" token may
   move, the Written line's included - the review reads the declaration against the records. A substantive change after launch still goes to
   PLAN.md's ledger and the prediction stays at its launch blob.
20. uncertainty.mjs counts a settled result as a ledger row that names its prediction; since 27 Sep a maintainer's decision
   row ("(maintainer)" in the result cell) is not counted even when it names one (the maintainer: two deep reviews were
   triggered on 27 Sep by decision rows with no new result; a planted check fails on the old rule). The label is not
   checked either way: a decision row not marked "(maintainer)" still counts, and a row whose result cell starts
   "(maintainer)" drops out even if it records a result read (fair-test: pass). The three rows it dropped on 27 Sep (26 Sep
   09:39, 27 Sep 07:06 and 10:12) all carry fair-test: n/a (the hundred-and-first review, MINOR 3).
21. uncertainty.mjs l.69 counts a "FALSIFIED or harm verdict" by a pattern that matches "FALSIFIED" or "harm" anywhere in a
   ledger row's bold span, so a title that says "no material harm" counts as a harm verdict (7aa's row, 28 Sep: "1
   FALSIFIED or harm verdicts" before the deep review after it, a false positive; the deep review after 7aa and the
   plan-auditor's review of 3ba2744, MINOR 7). Same pattern searched: a pattern alternating FALSIFIED and harm over
   research/solver, research/tests and .claude/hooks is found only there. uncertainty.mjs is a locked file: its fix
   (exclude "no material harm") waits on the maintainer's unlock; until then a reviewer reading the index checks the row it
   counts.
22. The launcher (run-from-snapshot.sh) re-runs a prediction's derivation script before it takes the lock and copies the
   tree, so a file edited while the derivation runs is baked into the snapshot uncommitted (the launcher warns "uncommitted
   changes are baked into this snapshot"). 7ab's relaunch, 28 Sep: derive-7ab.mjs ran about 12:01 to 12:06 UK and
   audit-s126.mjs gained its diag7ac branch at 12:05 UK, so 7ab's snapshot (/tmp/solver-snap-bYVs0g) carries it; its
   diag7ab branch is identical to the committed one, and the file was committed unchanged afterwards (a7dc0d9) so 7ab's
   audit stamp matches a commit (the plan-auditor's review of 57238f0, MINOR 2). Until the launcher snapshots first: no
   edit to a file the snapshot copies while a launch is in its derivation step, and a warned snapshot is recorded with the
   file's commit.
23. uncertainty.mjs l.51 counts a register family by a pattern that misses any register item whose family note is followed
   by " (" - O37, O46 and O47 as written - so family 1 ("a sub-margin opening gap decides the tier held for life") reads 10
   where 13 open register lines name it (the deep review after 7ac, deep-review-log.md 28 Sep 14:47 UK; the plan-auditor's
   count, review-log.md 28 Sep 15:02 UK). Nothing rested on it: the index read HIGH and the family past three either way.
   The same review adds to the family "checks run where the fault cannot show" the unchecked seed of read-7ac-beside.mjs
   (the plan's bug list, fixed in fc12bea). Until the unlock fixes the pattern: a family count the index prints is checked
   against the register by hand at each deep review.

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
| 13 | **A fix that removes a known error and makes a result worse has unmasked another error until shown otherwise**: judge the pair (the fix and the rest of the system), not the fix; before a fix is closed as harmful, show whether the baseline's better result depends on the error the fix removes (section 9) | F1 v2 read the bridge accurately and lost survival on bridge 4 and S126 (O17, 24 Sep: "not explained", yet v2 was withdrawn for it); the bridge reader did the same in 7e and was not carried forward, with F2 - another accurate read - pre-set as the next step (26 Sep 10:55 UK); the maintainer's "diagnose first" (11:16 UK) stopped the third repeat, and 7r found off's safer tier was a side effect of its own misread | section 9; built under the maintainer's unlock of 26 Sep 16:47 UK: the prediction's Unmasking field, checklist items 1, 2 and 11, the plan-auditor's section 9 checks and the deep review (section 9, "Enforced by") |

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
   mapped to points. That interval conditions on the number of paths that differ, so with one-sided changes its
   no-material-harm and no-material-gain ends read too kindly (a true loss at the margin reads "no material harm" about
   half the time: the eighty-fourth review, 26 Sep; the plan's bugs list and O27). The harm test is sound. **Decided
   (the maintainer, 29 Sep 22:12 UK, regimen item 1): every new test reads survival by both** - the exact rule above AND
   the guarded unconditional interval (stats.mjs survivalChangeU, Newcombe 1998 method 10, held at least as far out as the
   exact bound on a one-sided count: reduce-7aa.mjs guarded): a household passes only when the exact rule reads no
   material harm and the guarded interval's lower end is above minus the margin; harm as item 3 below. Calibrated at a
   true loss at the margin: at most 1.5% false passes against 2.5% stated (results-sim-whole-harm.txt).
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
   Each test's prediction names which. **Superseded for new tests (the maintainer, 29 Sep 22:12 UK, O28):** a pooled floor
   is read by the households' paired cells summed into one table and read by the unconditional interval (stats.mjs
   pooledSummed): each household weighs by its paths, not its own counts, so one that lost fewer by chance does not weigh
   more. At a true loss of 0.1 on every one of 7e's 16 pool cases it holds 2.0% to 3.2% of the time against 2.5%
   (results-pooled-fixed.txt), where the fixed-effect pool held 6.1% to 65.9% - the pooled gate of 7u and 8f.
5. **One primary outcome per test;** everything else is descriptive.
6. **Power before the run:** the paths needed so the interval fits the margin, N > 1.96^2 d / delta^2 (d the discordance
   rate), from the nearest earlier records, by a committed script.
7. **Sequential looks:** 1,000 paths, then 3,000 for the households still open, at error rates 0.005 then 0.045 (valid
   because pathsForSeed builds path i from seed + i x 7919, so the first 1,000 of 3,000 are the same paths).
8. **Replication before a default changes:** a second held-out seed or panel, unless overwhelming (Holm-adjusted p below
   0.001 and an effect above twice the margin).
9. **A seed registry:** 7001 search, 7002 tuning, 7003 Phase 4 only, 7004 second seed, 7005 selection, 7011 held out
   for M14b, M14c, O19, quad-ref and 7e (M14c, O19 and quad-ref were missing from this list until 25 Sep 22:20 UK; their
   batches ran on it), 7012 K6 (added 25 Sep 22:01 UK), 7013 held out for 7u (added 26 Sep under the maintainer's unlock
   of 20:33 UK: 7u's own held-out futures, 7004 being held for 7o and Phase 4), 7101 the 'auto' rule. Built 25 Sep 22:20 UK under the
   maintainer's unlock of 22:14 UK (their decision 3): the registry is check-prediction.mjs's SEED_REGISTRY, pinned to
   this list by plan-checker.test.mjs; a prediction written after it carries "- **Seeds:**" (each seed registered, each
   reserved one - 7003, 7011, 7012, 7013 - its own); the launcher reads the seeds in the command and the scripts it names and
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
**The scorecard** (built 26 Sep, research/solver/scorecard.mjs; 8j): each item's credence against its outcome, the Brier score per test and cumulatively,
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

**Timing checks** (the maintainer, 26 Sep 08:22 UK; 7e keeps its registered alone-on-the-machine time bar): a
prediction that times a change reads it as a ratio against its bar, from the two arms of each case alternating in one
process while the cases run in parallel, so both arms of a case share the same background load; the machine's load is
logged (fair-test row 33). Absolute times are never scaled by the number of busy cores: contention is not linear (K5's
median was inflated by it). A ratio measured side by side may still differ from one measured alone, since contention can
slow two arms with different memory use unequally, so the first prediction to time side by side also times the same arms, cases, points and code alone on the machine; if the two ratios differ by more than 0.05 on any case (a quarter of a 20% bar; Claude's choice, open to the maintainer), the method goes back to the maintainer before it is relied on (the fifty-eighth review, MINOR 1: a comparison with check 6's quiet-box ratios tests the method only when it times that same pair on the same code). Enforced by: NOT YET - the plan-auditor,
on each prediction that times a change.

## 9. Fixes that unmask other errors: assigning responsibility in a coupled system (the maintainer, 26 Sep)

The solver is a coupled system: its tables, its chooser, its bridge read, its tier menu and its objective each carry
approximations, and a result is what they produce together. Fixing one part can expose an error another part was
cancelling. The maintainer, 26 Sep: "you may fix one thing and it highlights another issue that wasn't otherwise known
about. We need to take this into account when assigning responsibility." How it was missed (written 16:44 UK):

- **The baseline was treated as right because it was the product.** Off misread S126's bridge by 44 points and, because
  of that misread, held the pension two tiers down for all 40 years (7r's traces: 0.03 switches a path). Every fix that
  read the bridge accurately (F1 v2, the reader, F2 by design) stopped that accidental de-risking and lost survival on the
  same households. The fair-test table checked that the arms differed only in the bridge read - they did - but nothing
  asked whether the baseline's better outcome came from the very error being fixed. Equal settings are not equal errors.
- **The decision rule turned harm straight into blame.** 7e's registered consequence of harm on any case was "not carried
  forward, F2 is built": responsibility went to the fix, and the next step was another fix of the same kind, which the
  records suggest would have hit the same wall.
- **Related anomalies were chased one at a time.** O9 (the tables turn optimistic with F1), O17 (F1 v2 loses where it
  reads accurately, "not explained"), O18/O20 (M14b's tier-above bets lose on comfortable plans), O19 and 7h (the final
  year's staircase priced a riskier tier at nothing; the rest of the cost stayed), C5 (the switch margin decides
  near-ties) and O24 (the reader's tier scores below off by the solver's own objective) all point one way - the tables
  value extra risk too highly - but each was diagnosed in its own frame and no step asked what they had in common.
- **A design premise was never tested.** The mixture's comment says leaving out learning is harmless because twenty
  years of returns barely reveal the world; the backward pass nevertheless lets each world plan as if it knew its world.
  The premise argues the wrong way (slow learning makes the gap larger) and was never registered as a claim (7t tests it).
- **The table was checked in aggregate.** The reader's table read its own survival within 0.3 points (99.6 against 99.3
  on S126), so "the table is accurate" passed; a large error in the bad world and a small one elsewhere can net to that.
- **A prior test was missed.** 7s's derivation did not cite 7h, which had already found finer return sampling leaves the
  tier-above cost in place.

The rules this adds:

1. **Responsibility is assigned to a combination until a decomposition splits it.** A paired result reads "the system
   with X" against "the system without X". It becomes a finding about X alone only after a decomposition (a swap, an
   ablation or a component-by-component arm, as 7r's RTIER and RREST did) shows which part carries it. Until then the
   grade for attributing it to X is C, whatever the test's grade for the combination.
2. **The unmasking check, before a fix of a known error is closed as harmful.** Its prediction states (a) the known
   error the fix removes, (b) which behaviours of the baseline that error drives (from the records or the traces: e.g.
   off's tier held for life), and (c) the arm or item that tells "the fix is harmful" from "the fix unmasks another
   error": a decomposition, or a second reference free of the error (a fixed policy, a consistent solver). A harm result
   without (c) is not settled as the fix's fault; its registered consequence is a diagnosis, never the next fix of the
   same kind.
3. **Right for the right reason.** A baseline used as the reference is examined for known errors in the dimension being
   compared (its register items, its table-against-simulation gap, what its traces show it doing). Where it has them,
   the prediction names them and says how the comparison survives them.
4. **The consistency invariant.** The tables must value the policy the forward chooser actually follows. A standing test
   checks it on the chooser's own rule (research/tests/solver-joint.test.mjs, check D - its known limit, 28 Sep: it runs with
   no tier held, so it cannot see a hold decided by the margin (O30), nor a switch rule applied per world (O41); the tier
   state's test checks the chooser on the three-world mixture, research/tests/solver-tierstate.test.mjs G), and every candidate default is
   calibrated table against simulation by slice - each world, each stage of the plan, each tier held - not only in
   aggregate, since compensating errors cancel in the aggregate.
5. **Families of odd results.** Register items that point the same way are linked as a family (the register's "family"
   note). When a family reaches three members, a root-cause diagnosis is scheduled before any further fix in that area.
   The first family, "the tables value extra risk too highly": O9, O16, O17, O18/O20, O19 with 7h, C5, O24, O26 (PLAN.md; O16 and O26
   added by the first deep review, 26 Sep 17:12 UK), renamed at 7v's read (the fifth deep review, 27 Sep 18:02 UK) into
   "a sub-margin opening gap decides the tier held for life" (O17, O24, O26, O30, O33) and a second family, "the chooser
   keeps too much risk in the bad world" (O9, O20, O31, O32, O34; O35 added at 7w's read, O36 by the deep review after it), each over three members. The fifth deep review also
   put C in the second family "in calibration only": one policy for every world removes the bad world's overrating but
   moves few paths (7v item 5 FALSIFIED, results-7v.txt), so it is a member without an open register item (no fix rests on
   it). The second family's root-cause step for its T/Q member was 7w's items 1-3 (PLAN.md); the first's diagnosis step was
   7w's item 4 (the year-0 move freed at the product's margin, against margin 0). Both have run (7w read, 27 Sep 20:07 UK).
   The deep review after 7w (27 Sep 20:17 UK) proposes merging the two families on one signature (the tables' year-0 gap
   5 to 100 times below what the de-risk realises); their shared root-cause step is 7x, held-for-life tables (FS against W). 7x read (27 Sep 22:17 UK): FS held on S126 and S194, W falsified. The deep review after 7x (27 Sep 22:32 UK) moved O32, O35 and O36 into a family of their own, "the reader at the bridge" (explained: Q in the chooser, the reader's reference p0 in the table), leaving O9, O20, O31 and O34 in the second family with no root-cause step scheduled, and O38 in the first. The deep review after 7z (28 Sep 00:38 UK) named a new family, "checks run where the fault cannot show" (O40 in the register; beside it the tier state's one-world check D, solver-joint's check D with no tier held, the parked patch's check C, 7x's item 3), with its root-cause step: every reducer prints the paths whose actions differ between arms, and every consistency check runs on the mixture (owner Claude; gate: before the next reducer is written and before any check is cited as no-harm evidence); and linked O41 to the first family and to the bad-world family (each world planning as if it knew its world).
6. **Design premises are claims.** An approximation justified by argument (the mixture's no-learning premise, the switch
   margin at today's settings, the fold's horizon factor) is listed with its grade (D until tested) and the failure it
   would cause if wrong, and is tested before a decision rests on it.
7. **Sweep the records for prior tests of the same mechanism before writing a prediction**, and cite each with its
   verdict in the Derivation (7s missed 7h).

**Enforced by** (built under the maintainer's unlock of 26 Sep 16:47 UK, from drafts/unmasking-proposal.md, with two departures
from the draft named below, kept by the maintainer with the other extras, 26 Sep 18:02 UK: "Do all"):
checklist items 1, 2 and 11; check-prediction.mjs's "Unmasking:" field, required of every test written after it (planted
tests in research/tests/plan-checker.test.mjs); the plan-auditor's section 9 checks (a harm or FALSIFIED verdict on a fix
of a known error with no decomposition, a "next fix of the same kind" consequence, a family at three with no scheduled
root-cause step); and the deep review below.

**The deep review, paced by uncertainty** (the maintainer, 26 Sep: "automated deep thought review on a periodic basis
based on the level of uncertainty of the model"). `research/solver/uncertainty.mjs` reads an index from the records
(calibration over the last 10 scored items, surprises and settled results since the last deep review, register
families, decisions on grade C or D evidence, FALSIFIED or harm verdicts) and says a deep review is due after 6 settled
results when LOW, 3 when MEDIUM and every one when HIGH. The Stop hook refuses to end a turn while one is due, except for
30 minutes after `record-deep-review.mjs --start` (a review under way).
**The two departures from the draft** (the seventy-seventh review, MINOR 1): (d) the 30-minute pass after a start, copied from
the plan review's; the draft blocked while a review was due and no receipt followed the trigger, so this loosens it; (e) a
review is due by settled results only - the draft also made 2 surprises, a family of 3 or a Brier score over 0.25 due at
once; here they raise the level to HIGH, which makes every settled result due, because a level alone never resets at a
receipt and would have kept the Stop hook blocked for ever (uncertainty.mjs's planted check fails on the old rule). Also
beyond the four things named at the unlock: the smoke run's diag7t line, fair-gate.mjs's comment, and locking the deep
review's index, recorder, log and agent - each only adds a refusal or a comment. The `deep-reviewer` agent steps back across the
record - families, unmasking, premises, calibration by slice, the ranked root causes and the one decisive test - and
records its receipt with `record-deep-review.mjs`, which takes the time from the clock and the level and the test covered
from the records. The index, the recorder, the log and the agent are locked (planted tests in hooks.test.mjs, which also
runs both scripts' own planted checks).

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
