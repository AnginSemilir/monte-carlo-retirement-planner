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
2. `node research/solver/new-prediction.mjs <name> <batch-script>`; fill the question, derivation, prediction,
   falsifier and every row of the fair-test table (arm A, arm B, SAME / TESTED / ONE ARM ONLY / N/A / ACCEPTED).
3. `node research/solver/check-prediction.mjs research/solver/predictions/<name>.md`, commit, and PUSH.
4. Name the prediction in the plan's schedule row, then launch:
   `PREDICTION=research/solver/predictions/<name>.md research/solver/run-from-snapshot.sh bash research/solver/<batch>.sh`
   as a tracked background task. A measurement with no test: `PREDICTION="none:<why>"`.
5. Estimate the time from a measured cell under the same load, and revise it when the first cells land.

## Analysing a result
1. Run the reducer. Its fair-test gate runs first; if it refuses, fix the runs or accept a named variable with a real
   reason (`FAIR_ACCEPT="28=<why>"`) - the reason is printed with the figures.
2. Save the reducer's output as `research/solver/results-<name>.txt`. Every figure you write anywhere comes from it.
3. Judge it against the prediction as written: held, missed, or falsified. A miss is recorded, never re-read to fit.

## Updating the plan
1. A ledger row, newest first: the settled result, what it changed, and the evidence cell
   (`results: results-x.txt; fair-test: pass|fail|n/a (why)|accepted (why); prediction: predictions/x.md`).
2. The re-look: list every later step, prediction, gate and default the result touches; re-derive each; change them in
   place; update the mathematician's page and any affected artifact.
3. Anything unexplained goes in the odd results register with an owner and a gate. A bug entry says
   "Same pattern searched:" and what was found. A claim of no effect carries `evidence:` or NOT CHECKED.
4. A decision that changes a default changes the code and the decided-defaults block in the same commit.
5. Finished work moves to `PLAN-HISTORY.md` verbatim.
6. `node research/solver/check-plan.mjs`, then run the **plan-auditor** agent on the change and fix what it finds: a BLOCKING finding before the turn ends, a MINOR one by the next review.
7. Commit and push (the pre-commit hook and CI run the checks again). Report evidence - the command and its output.
