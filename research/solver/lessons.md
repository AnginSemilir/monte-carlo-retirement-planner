# Lessons: what each test's preparation, run, reading and close taught (RULES.md section 10)

The feedback loop's record. Each test scored in results-scorecard.txt after the seed gets one entry when it closes,
written in the commit that scores it (check-plan.mjs's retro check refuses the commit otherwise):

    ## <test> (closed <D Mon HH:MM>, the ledger row's time)
    - [T:<code>] <what happened, in one line> -> AUTOMATE <the script or check that makes it impossible> | REPLACE "<the
      rule text it replaces>" | DROP: <why it needs nothing>

1 to 5 lines; the codes are triggers.mjs's CODES, slips and catches (`c-...`) alike, and must include every code on a
BLOCKING finding receipted since the close before. A catch is worth a line too: the loop keeps what works. Every 5 closes
the deep reviewer's retirement pass reads these entries (`node research/solver/triggers.mjs --due`).

Seed: after 7ai (30 Sep 17:53)

## Before the seed (30 Sep, from the day's receipts; not a close)
- [T:sentinel] 7ak's reducer read an empty pooled class as a gap of 0 (the 16:21 and 16:29 FAILs) -> AUTOMATE the reducers' planted empty-class case (reduce-7ak.mjs, reduce-7al.mjs), and OUTCOMES REACHED under --planted
- [T:relook] the 7u row and O60 were not moved by the reads that changed them (the 17:58 and 18:10 FAILs); O67 was listed and still missed -> AUTOMATE relook.mjs, the plan-auditor's step 1
- [T:figure] Q's gain quoted in the wrong measure, survival read as the whole score (the 19:05 FAIL) -> DROP: check-plan's figure check already binds a figure to its file; the measure is the auditor's code-against-claim step
- [T:order] 7al's build checks 3 to 5 relaunched because the audit's printed lines changed under the parser -> REPLACE "build the audit, then the reducer" with the plan-update skill's build-order line (the reducer's parser first)
- [T:c-mutation] the mutation runs found the planted checks let 9 of 28, then 2 of 30, mutations live -> AUTOMATE results-mutation-history.txt, every mutation run's escapes kept

## 7ak (closed 30 Sep 19:35)
- [T:other:live-script] the launcher was edited (720a914) while 7ak's launcher ran from the real tree; bash read the new bytes and its last line failed -> AUTOMATE run-from-snapshot.sh parses its whole body (a function) before running, with a hooks test
- [T:stale] [T:c-check] regenerating results-scorecard.txt broke the 17:52 row's cumulative figure; check-plan refused it at once -> DROP: the check caught it; the per-test snapshot (results-scorecard-<test>.txt) is the convention, now in the skill's close
- [T:c-falsify] the reviews' first-ranked cause (the reader) was falsified by one-piece-at-a-time snaps; the a axis carries 98.4% -> DROP: the snap design worked as intended; 3 of 4 items missed (Brier 0.324) is the scorecard's record, not a process fault
- [T:order] PLAN.md was edited (the 7ak record) while the auditor reviewed the 19:28 row, so its PASS bound to a blob carrying an unreviewed row (review-log 19:36) -> AUTOMATE record-review.mjs names the blob the review started on (startedBlob, triggers.test.mjs)
