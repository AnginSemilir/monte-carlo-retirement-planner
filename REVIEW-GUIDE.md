# A guide to this repository, for the external review

As of 21 Oct 2026. Review the branch `claude/project-access-i58m0x`. `main` has not moved since 22 Sep and is nearly 2,000
commits behind.

The repository holds two things:

- **The app.** A UK retirement planner that runs in the browser: pensions, ISAs, a taxable account and cash, projected
  through thousands of simulated markets, with UK tax applied every year. It is unchanged by the research below.
- **The solver research.** A new optimising solver (backward induction on a grid), being tested against the app's current
  rules. It goes to a final head-to-head, Phase 4, before anything changes in the app.

## Start here

1. `research/solver/PLAN.md`, three parts of it:
   - the top section ("THE METHOD"), for how the research is run;
   - the ledger of results that follows it, newest first, for what each test found;
   - the schedule (search "## The schedule"), for what is next: TOP-CELL, then 7u-F, the final confirmation.
2. `research/solver/LLM-LIMITATIONS.md`: where running this with an LLM agent has fallen short, with the evidence.
3. `research/solver/RULES.md` and `research/solver/CHECKLIST.md`: the rules every test follows, and the short form.
4. `src/solver/`: the solver itself. Its research settings, the "candidate", are `CANDIDATE_OPTS` in
   `research/solver/candidate.mjs`.

A plain-language status page, "The road to Phase 4", is kept outside the repository; the maintainer can share it.

## Map

| Path | What it is |
| --- | --- |
| `src/App.jsx` | The app: its engine (top half) and its interface |
| `src/solver/` | The solver: `solve.js` (the backward induction and the policy), `grid.js` (the state grid and its reads), `reader.js` and `adaptive.js` (the bridge-years reader and its reference), `fast.js` (one year's growth and tax), `model.js` |
| `research/engine.mjs` | The app's engine as a module, generated from `src/App.jsx` by `research/build-engine.py` (not in git) |
| `research/tests/` | Unit tests for the engine and the solver |
| `research/policy-study/` | Earlier studies of withdrawal rules; `scenarios.mjs` is the household library the tests use |
| `research/solver/PLAN.md` | The plan: the ledger of results, the premises at risk, the odd-results register, the schedule, the phases |
| `research/solver/PLAN-HISTORY.md`, `items/` | Finished work and long histories, moved out of the plan verbatim |
| `research/solver/predictions/` | Each test's prediction, written and committed before it runs |
| `research/solver/results-*.txt` | Each test's read-out, from its reducer |
| `research/solver/review-log.md` | Every plan-auditor receipt, PASS or FAIL |
| `research/solver/deep-review-log.md`, `review-causes.md` | The deep reviews (causes ranked, the next test designed), and the causes results have since settled |
| `research/solver/lessons.md`, `results-scorecard.txt` | What each test taught; how well the predictions scored |
| `research/solver/escalations/`, `outside-review-*.md`, `QUESTION.md` | Outside reviews already sought, and the question put to a mathematician |
| `.claude/`, `.githooks/` | The agent's own reviewers (plan-auditor, deep-reviewer), and the hooks that enforce the rules |

## How one test moves through the files (REF-STEP as the example)

1. **Prediction.** `predictions/diag-refstep.md`, committed before the run, with its derivation
   `derive-refstep.mjs` and that script's output, `results-derive-refstep.txt`.
2. **Run.** `batch-refstep.sh` runs `audit-refstep.mjs`, launched only through `run-from-snapshot.sh`. Its raw output went to
   `results/diagrefstep/`, which is not in git.
3. **Read-out.** `reduce-refstep.mjs` gates the run as a fair test, then reads each item by its registered rule, into
   `results-refstep.txt`.
4. **Record.** The ledger row "20 Oct 10:23" in `PLAN.md`, its entry in `lessons.md`, and its score in
   `results-scorecard.txt`.

Most tests follow the same naming: `audit-<name>`, `reduce-<name>`, `derive-<name>`, `batch-<name>`, `preflight-<name>`,
`mutate-reduce-<name>`.

## Running things

```sh
npm install
python3 research/build-engine.py     # generates research/engine.mjs
npm run test:engine                  # builds the engine, then runs every test in research/tests/ (slow: some solver tests take 25 minutes)
node research/tests/<name>.test.mjs  # a single solver test, from the repository root
node research/solver/check-plan.mjs  # the plan's own checks
```

- **Raw results are not in git.** The per-path files the reducers read (`research/solver/results/`) are not in the
  repository, so a test's read-out can be re-derived only by re-running it, which takes hours. The committed read-outs
  (`results-*.txt`) are the record.
- **The hooks stop experiments run directly.** In a Claude Code session, the hooks in `.claude/hooks/` refuse an
  experiment script run outside the launcher.

## Known caveats

- `research/solver/HOW-IT-WORKS.md` describes the solver as it stood before 23 Sep. `PLAN.md` is the current description.
- `PLAN.md` is about 650 KB, at its size cap; search it rather than reading it whole.
- Two numerical bugs found on 20 Oct are open, and gate the next test (O199 in the research code, O200 in the app's
  final-year read). REF-STEP's results on two households are marked provisional until they are fixed.
