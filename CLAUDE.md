# Monte Carlo retirement planner

## The solver research (research/solver/) - these rules are enforced, not optional

@research/solver/CHECKLIST.md

- The plan is `research/solver/PLAN.md`; the rules in full, the evidence for each and how each is enforced are
  `research/solver/RULES.md`. Use the `plan-update` skill for any run, result analysis or plan update.
- Enforced by: the launcher (`run-from-snapshot.sh`), the reducers' fair-test gate, `check-plan.mjs` (pre-commit hook,
  GitHub CI, the Stop hook) and the `plan-auditor` agent. Never bypass one (`--no-verify`, editing a checker, launching
  outside the launcher) without the maintainer's explicit say-so. If a check is wrong, say so and propose the fix.

## Always
- Never put a model identifier in a commit, a code comment or any pushed file.
- The maintainer's own household is never a test fixture.
- Merge to `main` only after `bash research/ui-harnesses/run-all.sh 4173` prints ALL REQUIRED GREEN.
- Background runs are harness-tracked tasks, never detached.

## When compacting
Always keep: the checklist above, the current task and its next step, every running background job with its task ID
and log path, and any uncommitted files.
