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
2. The re-look: list every later step, prediction, gate and default the result touches; re-derive each; change them in
   place; update the mathematician's page and any affected artifact.
3. Anything unexplained goes in the odd results register with an owner and a gate, or as "noted, below materiality"
   with its size estimate and evidence (under 0.1 points on the panel mean, no default resting on it). A bug entry says
   "Same pattern searched:" and what was found. A claim of no effect carries `evidence:` or NOT CHECKED.
4. A decision that changes a default changes the code and the decided-defaults block in the same commit.
5. Finished work moves to `PLAN-HISTORY.md` verbatim.
6. Before committing, `node research/solver/relook.mjs`: every open row it lists that the change should move, move.
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
