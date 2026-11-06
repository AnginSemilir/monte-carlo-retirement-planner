# A guide to this repository

Review the branch `claude/project-access-i58m0x`. `main` last moved on 31 Oct, when Part C's Phase 7 merged (#2, 899e5f0):
the solver's plumbing, behind a switch that stays off.

The repository holds two things:

- **The app.** A UK retirement planner that runs in the browser: pensions, ISAs, a taxable account and cash, projected
  through thousands of simulated markets, with UK tax applied every year.
- **The solver research.** An optimising solver (backward induction on a grid), tested against the app's current rules.
  Its candidate passed the final head-to-head, Phase 4, on 28 Oct, and is going into the app behind a switch (Part C),
  singles first; the app's defaults move only by the maintainer's decisions.

## Start here

1. `research/solver/STATE.md`: where the research stands, the candidate, the decisions in force, the open items with
   their measured effects, and the next actions. Short, and every figure in it is printed from a results file.
2. `research/solver/CHECKLIST.md`: the eight rules.
3. `research/solver/PART-C-PLAN.md`: the plan, with the launch plan of 1 Nov
   (`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at 0e24e1b, D51) holding where they
   differ. Part B of the external review of 21 Oct (`research/reviews/2026-10-21/EXTERNAL-REVIEW.md`) is done; what was
   done against it is in `research/reviews/2026-10-21/PROGRESS.md`.
4. `research/solver/DECISIONS-PENDING.md`: what still comes to the maintainer.
5. `src/solver/`: the solver. Its research settings, the candidate, are `research/solver/candidate.json`, read by
   `research/solver/candidate.mjs` (`CANDIDATE_OPTS`).

## Map

| Path | What it is |
| --- | --- |
| `src/App.jsx` | The app: its engine (top half) and its interface |
| `src/solver/` | The solver: `solve.js` (the backward induction and the policy), `grid.js`, `reader.js` and `adaptive.js` (the bridge years), `fast.js` (one year's flow and tax), `model.js`, `bridge.js` (a solved table as the engine's policy) |
| `research/engine.mjs` | The app's engine as a module, generated from `src/App.jsx` by `research/build-engine.py` (not in git) |
| `research/tests/` | The tests; `run-all.mjs fast` is the verification suite CI runs on every push (the pre-commit hook runs it through `fast-skip.mjs`, skipping a test whose inputs are unchanged); the rest is the full tier |
| `research/solver/results-*.txt` | Read-outs of runs (the raw per-path files are not in git) |
| `research/solver/registrations/` | One-page registrations of confirmatory runs |
| `research/solver/reviews/` | The reviewer agents' verdicts |
| `research/solver/archive/` | Everything before 21 Oct, unchanged: the plan and its history, the review logs, the lessons, the predictions, the rules of the old regimen and its retired tools |
| `research/policy-study/scenarios.mjs` | The household library the tests use |
| `research/ui-harnesses/` | The app's browser harnesses; `run-all.sh 4173` (the classic planner) and `run-all.sh 4173 --new` (the new planner, opted in) must both print ALL REQUIRED GREEN before a merge to `main` (`--both` runs the two) |
| `.claude/`, `.githooks/`, `.github/workflows/` | The agent's reviewers and procedure, and the hooks and CI: `verify.yml` the fast tier on every push, `full.yml` the full tier on every push (two shards, one run at a time per branch) and weekly on `main` |

## Running things

```sh
npm install
python3 research/build-engine.py           # generates research/engine.mjs
node research/tests/run-all.mjs fast -j 2  # the verification suite (about half an hour: 31 minutes on CI, 1 Nov)
node research/tests/run-all.mjs all -j 2   # every test (hours: the full tier runs in two shards on CI)
bash research/ui-harnesses/run-all.sh 4173            # the app's harnesses, the classic planner (every visitor's)
bash research/ui-harnesses/run-all.sh 4173 --new      # and the new planner, opted in (Phase 12)
node research/solver/launch-ready.mjs      # the readiness checklist (Phase 12), from the results files
node research/solver/check-state.mjs       # STATE.md's own check
```
