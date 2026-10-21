# A guide to this repository

Review the branch `claude/project-access-i58m0x`. `main` has not moved since 22 Sep.

The repository holds two things:

- **The app.** A UK retirement planner that runs in the browser: pensions, ISAs, a taxable account and cash, projected
  through thousands of simulated markets, with UK tax applied every year.
- **The solver research.** An optimising solver (backward induction on a grid), tested against the app's current rules.
  It goes to a final head-to-head, Phase 4, before anything changes in the app.

## Start here

1. `research/solver/STATE.md`: where the research stands, the candidate, the decisions in force, the open items with
   their measured effects, and the next actions. Short, and every figure in it is printed from a results file.
2. `research/solver/CHECKLIST.md`: the eight rules.
3. `research/reviews/2026-10-21/EXTERNAL-REVIEW.md`: the external review of 21 Oct; its Part B is the plan.
4. `src/solver/`: the solver. Its research settings, the candidate, are `CANDIDATE_OPTS` in `research/solver/candidate.mjs`.

## Map

| Path | What it is |
| --- | --- |
| `src/App.jsx` | The app: its engine (top half) and its interface |
| `src/solver/` | The solver: `solve.js` (the backward induction and the policy), `grid.js`, `reader.js` and `adaptive.js` (the bridge years), `fast.js` (one year's flow and tax), `model.js`, `bridge.js` (a solved table as the engine's policy) |
| `research/engine.mjs` | The app's engine as a module, generated from `src/App.jsx` by `research/build-engine.py` (not in git) |
| `research/tests/` | The tests; `run-all.mjs fast` is the verification suite the pre-commit hook and CI run |
| `research/solver/results-*.txt` | Read-outs of runs (the raw per-path files are not in git) |
| `research/solver/registrations/` | One-page registrations of confirmatory runs |
| `research/solver/reviews/` | The reviewer agents' verdicts |
| `research/solver/archive/` | Everything before 21 Oct, unchanged: the plan and its history, the review logs, the lessons, the predictions, the rules of the old regimen and its retired tools |
| `research/policy-study/scenarios.mjs` | The household library the tests use |
| `.claude/`, `.githooks/`, `.github/workflows/verify.yml` | The agent's reviewers and procedure, and the hooks and CI that run the verification suite |

## Running things

```sh
npm install
python3 research/build-engine.py           # generates research/engine.mjs
node research/tests/run-all.mjs fast -j 2  # the verification suite (about four minutes)
node research/tests/run-all.mjs all -j 2   # every test (slow: some take half an hour)
node research/solver/check-state.mjs       # STATE.md's own check
```
