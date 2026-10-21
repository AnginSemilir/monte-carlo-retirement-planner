# Monte Carlo retirement planner

## The solver research (research/solver/)

@research/solver/STATE.md

The rules, eight lines:

@research/solver/CHECKLIST.md

- STATE.md (above, read whole) is where the work stands: the candidate, the decisions in force, the open items, what is
  running and the next actions. The plan is Part B of `research/reviews/2026-10-21/EXTERNAL-REVIEW.md`. Everything
  before 21 Oct is in `research/solver/archive/`, unchanged; never edit it. Use the `research` skill for any run, read
  or change of the candidate.
- Enforced by: the launcher (`run-from-snapshot.sh`) for confirmatory runs, the reducers' fair-test gate, the fast
  verification suite and `check-state.mjs` (the pre-commit hook and CI), and the pre-tool hook. Never bypass one
  (`--no-verify`, editing a protected file) without the maintainer's explicit say-so ("unlock enforcement"). If a check
  is wrong, say so and propose the fix.
- The `reviewer` agent reviews a confirmatory run's design before launch, each read's claims against the code and the
  results files, and any change of default; the `deep-reviewer` comes in after a confirmatory read, or when two results
  on the same question conflict.

## Always
- Never put a model identifier in a commit, a code comment or any pushed file.
- The maintainer's own household is never a test fixture.
- Merge to `main` only after `bash research/ui-harnesses/run-all.sh 4173` prints ALL REQUIRED GREEN.
- Background runs are harness-tracked tasks, never detached.

## When compacting
Always keep: STATE.md's next actions, the current task and its next step, every running background job with its task
ID and log path, and any uncommitted files.
