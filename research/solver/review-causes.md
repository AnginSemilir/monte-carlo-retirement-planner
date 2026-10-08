# The deep reviews' ranked causes, as results settle them

Each deep review's receipt (deep-review-log.md) gives its ranked causes probabilities, "CAUSE CREDENCES: <id>=<p>; ..."
(record-deep-review.mjs refuses a receipt without them, from the maintainer's 'unlock enforcement' of 5 Oct). A cause is
settled by a registered result, not by the author (the second unlock, 5 Oct): only

    node research/solver/record-deep-review.mjs --settle "<receipt time> | <id> | held|not | <results file> | <its line>"

writes here, one line per settled cause, quoting whole the results file's deciding line (OUTCOME:, SHARES:, LEGS: or
"=> "). This file is append-only (pre-tool.mjs PROTECTED; its committed text must stay its start). scorecard.mjs scores
the stated credences against these lines (the DEEP-REVIEW CAUSES line); a line naming no stated cause, a cause settled
twice, a results file that does not exist, or a quote that is not a deciding line of that file stops the scorecard.

## Settled
- 7 Oct 22:06 UK | CARRY-OMIT | not | results-carry.txt | => CARRY-OMIT not
- 7 Oct 22:06 UK | CARRY-OTHER | not | results-carry.txt | => CARRY-OTHER not
- 8 Oct 05:58 UK | O123-REOPT | held | results-carry.txt | => O123-REOPT held
- 8 Oct 05:58 UK | O123-SCALE | not | results-carry.txt | => O123-SCALE not
- 8 Oct 05:58 UK | O123-OTHER | not | results-carry.txt | => O123-OTHER not
- 7 Oct 11:42 UK | O121-WEIGHT | not | results-carry.txt | => O121-WEIGHT not (SHIP 0.01 -> 0.02: S130 0.287, S370 0.112)
