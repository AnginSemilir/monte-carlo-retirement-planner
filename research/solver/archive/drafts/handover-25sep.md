# Handover, 25 Sep ~11:40 UK (paused at the maintainer's request: out of tokens for a day)

Nothing is running and everything is committed and pushed. Pick up in this order.

## Stopped on purpose (re-run them; nothing was lost)

1. **The reader's run time, check 6** (drafts/reader-design.md). It was launched 11:35 UK and stopped at 11:40 UK during its
   first solve, before any timing was printed. The launch is logged in runs.log. Re-run it on a quiet box:
   `PREDICTION="none:a measurement - the bridge reader's added solve time (drafts/reader-design.md check 6), judged later against 7e's 20% bar; not a test" bash research/solver/run-from-snapshot.sh node research/solver/audit-s126.mjs readertime 16 2`
   Save its output as `results-readertime.txt`. It takes about an hour after the launcher's smoke run.
2. **The forty-sixth plan review** was started at 11:27 UK on plan blob 0689ddcf29 and stopped before any verdict. The
   review log holds only its STARTED line. Re-run the plan-auditor on PLAN.md as it stands. It covers:
   - the 11:13 and 11:14 ledger rows: the reader built, and 7e's smoke line added under the maintainer's unlock;
   - 7e's dependency cell.

## Ready but NOT registered

- **7e's prediction:** `predictions/bridge-reader.md`. check-prediction says it is valid. Its derivation leaves one
  placeholder for check 6's figure. Fill it, name the prediction in PLAN.md's 7e row, commit and PUSH, then launch:
  `PREDICTION=research/solver/predictions/bridge-reader.md bash research/solver/run-from-snapshot.sh bash research/solver/batch-7e.sh`
  That is about 4-5 h in total: wave 1 is 23 cases x 4 arms at 16 points, four at a time, then wave 2 and the 30-point
  time bar.
- **Its reducer:** `reduce-7e.mjs`. Its planted checks pass (`node research/solver/reduce-7e.mjs --planted`).
- **Seed 7011:** 7e runs on 1,000 held-out paths of seed 7011. The reader was built after misreads seen on seed 7002's
  paths. Every audit ran line now records its seed, and the gate checks it.
- **Code:** the audit's seed change is committed (fadea51). The launcher's smoke run re-runs on it
  automatically.

## Waiting on the maintainer

- **O15, the dislike-of-cuts reference:** drafts/o15-reference.md. The recommendation is c = 0.001 (lambda 0.025 at
  exponent 2), kept as a research reference until K6 confirms it on held-out paths. Two questions: the value, and
  whether solvePlan takes it now (recommended: after K6).

## Done today (for context)

- **The exact final year is the product default** (09:36 UK).
- **The bridge reader is built into the solver** (`bridgeRead: 'reader'`). Its checks 2 to 4 passed
  (results-reader-checks.txt).
- **7e's batch mode and its smoke line.** The line was added under the maintainer's 11:14 UK unlock. The smoke run
  passed with it (results-smoke-7e.txt).
