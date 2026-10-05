# The deep reviews' ranked causes, as results settle them

Each deep review's receipt (deep-review-log.md) gives its ranked causes probabilities, "CAUSE CREDENCES: <id>=<p>; ..."
(record-deep-review.mjs refuses a receipt without them, from the maintainer's 'unlock enforcement' of 5 Oct). When a
result settles whether a cause was the cause, add a line here, citing that result:

    - <the receipt's time, as the log gives it> | <id> | held|not | <results file>

scorecard.mjs scores the stated credences against these lines (the DEEP-REVIEW CAUSES line); a line naming no stated
cause, a cause settled twice, or a results file that does not exist stops the scorecard.

## Settled
