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
- 5 Oct 23:18 UK | YB-TOPCELL | held | results-xasr2.txt | OUTCOME: 1 HELD; 2 HELD; 3 HELD
- 5 Oct 23:18 UK | YB-REF | not | results-xasr2.txt | OUTCOME: 1 HELD; 2 HELD; 3 HELD
- 5 Oct 23:18 UK | YB-NODEQ | not | results-xasr2.txt | OUTCOME: 1 HELD; 2 HELD; 3 HELD
- 5 Oct 23:18 UK | VA-QUANT | held | results-xasr2.txt | OUTCOME: 1 HELD; 2 HELD; 3 HELD
- 5 Oct 23:18 UK | S126-BLEND | held | results-xasr2.txt | OUTCOME: 1 HELD; 2 HELD; 3 HELD
- 5 Oct 23:18 UK | S126-NSOTHER | not | results-xasr2.txt | OUTCOME: 1 HELD; 2 HELD; 3 HELD
- 10 Oct 04:17 UK | NE-SURV | held | results-nesplit.txt | OUTCOME: 1 HELD, 2 HELD, 3 FALSIFIED, 4 INCONCLUSIVE, 5 HELD
- 10 Oct 04:17 UK | NE-TS | not | results-nesplit.txt | OUTCOME: 1 HELD, 2 HELD, 3 FALSIFIED, 4 INCONCLUSIVE, 5 HELD
- 10 Oct 04:17 UK | NE-NS | not | results-nesplit.txt | OUTCOME: 1 HELD, 2 HELD, 3 FALSIFIED, 4 INCONCLUSIVE, 5 HELD
- 10 Oct 04:17 UK | NE-OTHER | not | results-nesplit.txt | OUTCOME: 1 HELD, 2 HELD, 3 FALSIFIED, 4 INCONCLUSIVE, 5 HELD
- 11 Oct 02:37 UK | OW-PREF | not | results-neroot.txt | OUTCOME: 1 INCONCLUSIVE, 2 FALSIFIED, 3 INCONCLUSIVE, 4 INCONCLUSIVE, 5 HELD
- 11 Oct 10:33 UK | B4-COPY | held | results-neblend-a.txt | OUTCOME: 1 HELD, 2 INCONCLUSIVE, 3 INCONCLUSIVE, 4 HELD; item 3 not over-corrected, item 4 direction down
- 11 Oct 10:33 UK | B4-R | not | results-neblend-a.txt | OUTCOME: 1 HELD, 2 INCONCLUSIVE, 3 INCONCLUSIVE, 4 HELD; item 3 not over-corrected, item 4 direction down
- 11 Oct 10:33 UK | B4-OTHER | not | results-neblend-a.txt | OUTCOME: 1 HELD, 2 INCONCLUSIVE, 3 INCONCLUSIVE, 4 HELD; item 3 not over-corrected, item 4 direction down
- 11 Oct 23:09 UK | RG-PATHS | not | results-negrid-c.txt | => RG-PATHS not
- 11 Oct 23:09 UK | S364-W | not | results-negrid-c.txt | => S364-W not
- 13 Oct 02:17 UK | S364-RUNSCALED | held | results-needge.txt | => S364-RUNSCALED held
- 13 Oct 11:00 UK | O150-REFMIX | held | results-neref.txt | => O150-REFMIX held
- 13 Oct 11:00 UK | O150-REFFLOW | not | results-neref.txt | => O150-REFFLOW not
- 13 Oct 11:00 UK | O150-FORM | not | results-neref.txt | => O150-FORM not
- 15 Oct 10:13 UK | N2-REF | held | results-an.txt | OUTCOME: 1 HELD, 2 HELD, 3 HELD
- 15 Oct 01:48 UK | N2-REF | held | results-an.txt | OUTCOME: 1 HELD, 2 HELD, 3 HELD
- 15 Oct 21:05 UK | AO-REF | held | results-ao.txt | OUTCOME: 1 HELD, 2 HELD, 3 HELD
- 16 Oct 05:36 UK | O169-COPY | held | results-aor.txt | OUTCOME: 1 HELD, 2 HELD, 3 HELD, 4 HELD
- 18 Oct 01:41 UK | O177-FOOT | held | results-foot.txt | OUTCOME: 1 HELD, 2 HELD, 3 HELD, 4 HELD
- 18 Oct 09:43 UK | O179-FIXOWN | not | results-hodep.txt | OUTCOME: 1 HELD, 2 HELD, 3 INCONCLUSIVE
- 18 Oct 22:45 UK | O182-RESID | held | results-o182.txt | OUTCOME: 1 HELD, 2 HELD, 3 INCONCLUSIVE, 4 INCONCLUSIVE
- 19 Oct 03:55 UK | O186-CFLAT | held | results-copyx.txt | OUTCOME: 1 HELD, 2 HELD, 3 HELD, 4 HELD
- 18 Oct 15:09 UK | S370-COPY | held | results-copyx.txt | OUTCOME: 1 HELD, 2 HELD, 3 HELD, 4 HELD
- 18 Oct 18:40 UK | S370-COPY | held | results-copyx.txt | OUTCOME: 1 HELD, 2 HELD, 3 HELD, 4 HELD
- 18 Oct 22:45 UK | S370-COPY | held | results-copyx.txt | OUTCOME: 1 HELD, 2 HELD, 3 HELD, 4 HELD
- 19 Oct 03:55 UK | S370-COPY | held | results-copyx.txt | OUTCOME: 1 HELD, 2 HELD, 3 HELD, 4 HELD
