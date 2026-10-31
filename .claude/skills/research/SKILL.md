---
name: research
description: The procedure for the solver research (research/solver) - use when running anything there (exploratory or confirmatory), reading a result, changing the candidate or a default, or updating research/solver/STATE.md.
---

# The solver research: how to run, read and record

The rules are `research/solver/CHECKLIST.md` (eight lines); where things stand is `research/solver/STATE.md`; the plan is
Part B of `research/reviews/2026-10-21/EXTERNAL-REVIEW.md`. Everything before 21 Oct is in `research/solver/archive/`.

## Exploratory (most work)
1. Write the script, run it (directly, or through the launcher with `PREDICTION="none:<why>"` when it is a batch that
   should run on frozen code), on a seed that is not held out (7001 search, 7002 tuning, or the review's 99001 to 99005).
2. Label it EXPLORATORY wherever it is reported. It cannot change a default, a gate or the candidate.
3. Its read-out goes in a committed `results-<name>.txt`; a figure it gives reaches STATE.md only through a printed block
   (`research/solver/state.mjs`, then `node research/solver/state.mjs --write`).

## Confirmatory (7u-F, Phase 4, any change of default)
1. One page in `research/solver/registrations/<name>.md` with every field `check-prediction.mjs` asks for: Question,
   Arms (each configuration's hash, as `state.mjs` prints it), Households, Seed (held out; a reserved seed's owner names
   the file, e.g. `fresh-7uf*.md` for 7014), Paths, Primary metric, Decision rule, Outcomes (what each one decides),
   Design review (the `reviewer` agent's PASS file in `research/solver/reviews/`).
2. `node research/solver/check-prediction.mjs research/solver/registrations/<name>.md`; commit and push it.
3. Launch: `PREDICTION=research/solver/registrations/<name>.md research/solver/run-from-snapshot.sh bash <batch>` as a
   tracked background task. The launcher snapshots the code, checks the seeds and runs the smoke run.
4. Read it once, by its rule, with the reducer's fair-test gate passing first. Then the `reviewer` agent at the read,
   and the `deep-reviewer` after it.

## Code
- After any edit to src/solver: `node research/tests/run-all.mjs fast` passes before any batch (the pre-commit hook runs
  it on a code commit). A solver edit also makes the e3pcls pin stale: `node research/tests/solver-e3pcls.test.mjs 4
  --pin` before `solveCandidate` will run.
- A bug is fixed with a test that catches its class, shown failing on the code before the fix; running it is the
  pattern search. A new check is shown failing on a planted fault once, in its own test; add a verification test to
  run-all.mjs's FAST list (that also protects it).

## Recording
- STATE.md: one line per finished step or settled result in its sections, figures only in printed blocks; open items
  carry their measured effect on simulated outcomes, or are dropped; `node research/solver/check-state.mjs` passes.
- A decision of the maintainer's: a dated line in STATE.md's decisions; a change of default changes the code and the
  decided-defaults block in one commit, with the test that pins them.
- Every task has an acceptance test and a time box; when the box runs out, stop and report to the maintainer.
