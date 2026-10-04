---
name: plan-update
description: The procedure for the solver research - use when planning or launching a run in research/solver, analysing a run's results, or updating research/solver/PLAN.md in any way (a result, a re-look, a decision, the schedule).
---

# Updating the solver research plan

The rules in full are `research/solver/RULES.md`; the short form is `research/solver/CHECKLIST.md`. The hooks, the
launcher, the reducers and CI enforce them. This is the order to work in.

## Planning a run
1. Derive first: can the mathematics state the answer? Do the existing records already contain it (fair-test those
   files before reading them)? Only then run.
   An attribution test that snaps or swaps one piece to blame it checks that the snap moves only that piece; a snap
   that moves two (an input and its blend, say) is paired with one that holds the other fixed, or its attribution is
   a combination, grade C (lessons.md, the 7ak close: the a-axis snap moved the reader's input and its blend together).
2. `node research/solver/new-prediction.mjs <name> <batch-script>`; fill the question, derivation, prediction,
   falsifier and the fair-test table's rows (arm A, arm B, SAME / TESTED / ONE ARM ONLY / N/A / ACCEPTED; rows that are SAME
   may be left out behind the line "- **All other rows: SAME**"), and the
   regimen's fields (RULES.md section 8): decision rule (exact test, margin, Holm, three outcomes, looks), decision fed
   (held, falsified, inconclusive), provenance, derivation script (a committed script, its output's hash on a
   `derive:` line), point and interval, credence, power (from the nearest records, by script), budget line, pre-mortem.
3. `node research/solver/check-prediction.mjs research/solver/predictions/<name>.md`, commit, and PUSH.
4. Name the prediction in the plan's schedule row, then launch:
   `PREDICTION=research/solver/predictions/<name>.md research/solver/run-from-snapshot.sh bash research/solver/<batch>.sh`
   as a tracked background task. A measurement with no test: `PREDICTION="none:<why>"`.
5. Estimate the time from a measured cell under the same load, and revise it when the first cells land.
6. Build order: the reducer's parser and gate before the audit's print lines, then the audit to match; `node --check`
   each script before a run (7al's build checks 3-5 were relaunched when the lines changed under the parser).

7. A new test's reducer prints, in its `--planted` output, `EDGES: <case>, <case>, ...` naming at least two planted
   boundary cases it reads correctly (a missing or zero value, an empty class, a value at or past a threshold); the
   launcher's outcome check refuses a test registered from 3 Oct 19:00 UK without it (the deep review's retirement pass).
8. MECHANISM FIRST (the process review, 4 Oct 13:52 UK): before an attribution or decomposition test, anchor the cause
   in the code (`- **Mechanism:** <path>:<line> "<snippet>"`, checked against the file) and derive, per unit, how often it
   applies - a derive line printing the incidence (PMAP is the pattern). check-prediction refuses a test registered from
   4 Oct 14:30 UK without it, and "none:" when the question attributes. A diagnostic that answers it replaces the test.
9. DECISION TABLE FIRST (REPLACE of the 7as close): write `## Decision table` before the items - one row per outcome of
   every item and every pair that can disagree: `| outcomes | action | credence |`, credences summing to 1. If the chance
   the action changes is under a quarter, run a cheaper diagnostic or write `- **Waiver:** <why>`. Then derive each
   item's power from the records, then the rule.
10. A control arm's prediction prints that arm's own per-path residual and sd from the nearest records (a derive line)
   beside the bands it is read against, and says why a control far larger than the effect still answers the item, or
   drops it (REPLACE of the 7ar close: OFF on S130 carried a 60-point read error against a 2-point effect).
11. An item split over households states its thresholds over the households it can be computed on, prints that count,
   and plants a case where a gap reaches 0 (REPLACE of the 7am close). A reducer's per-year label names the year it
   counts from (REPLACE of the 7al close).
12. Builds that need no cores (an option behind a flag, its unit tests, a reducer) go ahead while the cores run; only
   the launch waits (the process review: F2 was designed 24 Sep to be "built in the run gaps" and was not).

## Analysing a result
1. Run the reducer. Its fair-test gate runs first; if it refuses, fix the runs or accept a named variable with a real
   reason (`FAIR_ACCEPT="28=<why>"`) - the reason is printed with the figures.
2. Save the reducer's output as `research/solver/results-<name>.txt`. Every figure you write anywhere comes from it.
3. Judge it against the prediction as written, by its registered decision rule (for a test registered from 25 Sep
   20:47 UK: exact tests against the margin, Holm, no material harm / harm / inconclusive - never "beyond two se"):
   held, missed, or falsified. A miss is recorded, never re-read to fit.

## Updating the plan
1. A ledger row, newest first: the settled result, what it changed, and the evidence cell
   (`results: results-x.txt; fair-test: pass|fail|n/a (why)|accepted (why); prediction: predictions/x.md; grade A-D`).
   A deep review gets no ledger row of its own (the maintainer, 4 Oct): its receipt is in deep-review-log.md; its findings
   go straight into the rows they move - the register (a new O-row or an open row's note), the schedule rows and the
   predictions - each citing "the deep review of <time>". A decision the maintainer takes on it does get a row.
   Every decision fed that names a fix, a default, a candidacy or a part the maintainer has kept reads 'put to the
   maintainer with Claude's recommendation' (REPLACE of the 7as close). Restating a gate quotes the gate row's own
   conditions, and a list of remaining conditions is written 'among them' (REPLACE of the 7at close). Before a record
   says 'clean control', 'ruled out' or 'can't happen', the evidence line rule applies: grade A or B, or NOT CHECKED
   (REPLACE of the 7ap close).
2. The re-look: list every later step, prediction, gate and default the result touches; re-derive each; change them in
   place; update the mathematician's page and any affected artifact.
3. Anything unexplained goes in the odd results register with an owner and a gate, or as "noted, below materiality"
   with its size estimate and evidence (under 0.1 points on the panel mean, no default resting on it). A bug entry says
   "Same pattern searched:" and what was found. A claim of no effect carries `evidence:` or NOT CHECKED.
4. A decision that changes a default changes the code and the decided-defaults block in the same commit.
5. Finished work moves to `PLAN-HISTORY.md` verbatim.
6. Before committing, `node research/solver/relook.mjs`: every open row it lists that the change should move, move; answer
   the rest in the commit message, `relook: <id>[, <id> ...] unchanged: <reason>` - the commit-msg hook refuses a plan
   commit that leaves a listed row unanswered (REPLACE of the 7ar close; the maintainer's unlock of 4 Oct). Before editing
   a locked file under an unlock, quote the agreed item beside the diff in the commit message (REPLACE of the 7ap close).
7. **The close** (RULES.md section 10), in the commit that scores the test in results-scorecard.txt: its lessons in
   lessons.md (`## <test> (closed <the ledger row's time>)`, 1-5 coded lines, each AUTOMATE, REPLACE or DROP, naming
   every BLOCKING code since the last close). Save the scorecard twice, `results-scorecard.txt` and
   `results-scorecard-<test>.txt`, and cite the copy (a later scorecard changes the cumulative figures). When `node research/solver/triggers.mjs --due` says the retirement pass is
   due, the next deep review does it first.
8. `node research/solver/check-plan.mjs`, then run the **plan-auditor** agent on the change at its tier (0 labels and history moves, 1 a result or
   prediction, 2 a default or a gate: two sources and an outside review) and fix what it finds: a BLOCKING finding before the turn ends, a MINOR one by the next review.
   A PASS that carries only MINORs is a PASS: fold the MINOR fixes into the next plan change rather than a PLAN.md edit of
   their own, since every edit of the plan needs a fresh receipt (the maintainer's unlock of 1 Oct 10:37 UK; a MINOR in a
   prediction or another file outside the plan may be fixed at once).
9. At a close, after the auditor's PASS: `node research/solver/archive-plan.mjs --apply`, then
   `node research/solver/record-review.mjs --moved` (it verifies the move against that PASS and receipts it).
10. Commit and push (the pre-commit hook and CI run the checks again). Report evidence - the command and its output.
