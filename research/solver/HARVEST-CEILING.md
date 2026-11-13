# The harvest ceiling on the year's whole taxable income: the solved plans before and after (EXPLORATORY)

The review of 11 Nov, `ANSWERS.md` section 5 (review/external-2026-10-21 at b0d01444), answering D72's question: a
pension draw's ceiling should stop where the year's whole taxable income reaches the band's edge, not where the
non-savings part of it does. D79 held it for the end of the beta; D91 and D93 take it in. Its steps 1 to 3 (the cases
first, the prediction, the sizing on the plan's own rules) are in `results-harvest-ceiling.txt`. This page is step 4, and
it is committed before step 4 is run.

## The question

With the ceiling on the whole taxable income, does a solved plan do no worse than before it, on the review's eight?

## The design

- **Code:** two trees. BEFORE: a worktree at the commit before the ceiling's (its hash recorded in every unit). AFTER:
  the tree the launcher freezes. Each arm is solved by its own tree's solver and run by its own tree's engine.
- **Households:** the review's eight (`audit-curve.mjs` `HOUSEHOLDS`) as Phase 4 landed them. None is new: they are the
  tuning households.
- **Settings:** the app's solve, `solveForApp` at 45 points (the candidate's settings), in both arms.
- **Paths:** the same 16,000 paths of seed 7002 in both arms (paired), EXPLORATORY.
- **Stored for each path and arm:** survival, spending delivered and its target, the pot left, lifetime tax.
- **Held to the engine:** each arm's first 200 paths against `E.runTrial` on its own engine, outcome for outcome.

## The rule (SPEED-A.md's four parts, as the review asks, the pot one-sided), AFTER against BEFORE

1. the pooled survival's 95% interval has its lower end above `-0.1` points;
2. no household's interval lies wholly below `-0.3` (`stats.mjs` `survivalChangeU`);
3. the pooled spending delivered is within `0.05` points of target of BEFORE's;
4. the pooled mean pot left is not lower than BEFORE's by more than `0.5%`.

Beside the rule, deciding nothing: lifetime tax, each household's line, the solves' seconds.

## What each outcome decides

- **All four hold:** the ceiling stands as built and goes to `main` with its batch (D92), the read to the maintainer in
  the batch's report.
- **Any part fails:** STOP. A ceiling that only ever draws less should not cost a solved plan survival, spending or its
  pot beyond these bars; the read goes to the maintainer whole, and nothing of the ceiling is merged before a ruling
  (D81 (F): a rule that fails).

## The files

`audit-ceiling.mjs` (one unit a household, both arms in it), `batch-ceiling.sh`, `reduce-ceiling.mjs` (the stamps, the
gate, the rule; `--planted`), the read in `results-harvest-ceiling-solved.txt`.
