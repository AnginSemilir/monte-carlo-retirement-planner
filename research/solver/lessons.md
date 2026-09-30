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
- [T:c-falsify] [T:design] the reviews' first-ranked cause (the reader) read FALSIFIED by the reader snap, but the a snap moved the reader's input and its blend together, so the attribution is a combination (the deep review after 7ak) -> AUTOMATE a line in the plan-update skill's planning steps: an attribution snap that moves two pieces is paired with one that holds the other (not yet written: the skill is locked since the maintainer's last message; follow-through debt for the retirement pass); 4 of 4 items missed after item 4's correction (Brier 0.299, results-scorecard-7ak.txt)
- [T:order] PLAN.md was edited (the 7ak record) while the auditor reviewed the 19:28 row, so its PASS bound to a blob carrying an unreviewed row (review-log 19:36) -> AUTOMATE record-review.mjs names the blob the review started on (startedBlob, triggers.test.mjs)
- [T:design] 7ak's item 4 set boundary against interior cells, but every path starts in one state, so each unit-and-rule line fell wholly in one class and the item compared households (the auditor's BLOCKING, 19:49) -> AUTOMATE reduce-7ak.mjs pools only lines with both classes (planted, mutated); fair-gate.mjs takes a declaration naming its reducer

## 7al (closed 30 Sep 22:39)
- [T:relook] [T:stale] a correction to 7ak's reading left 7ak's own schedule row reading item 4 INCONCLUSIVE, and 7an's recast left its old text in the rows naming it (the 20:14 and 20:27 FAILs): relook.mjs skipped a DONE or READ row even when the change named its own item -> AUTOMATE relook.mjs lists an item's own row whatever its status (replayed on 7ak: the row is listed)
- [T:overclaim] the a-axis attribution stayed grade B after the deep review showed a combination; only the reader clause was qualified (the 20:27 FAIL) -> DROP: RULES.md section 9 rule 1 already sets grade C for a combination; the auditor applied it; nothing to add
- [T:order] [T:design] the plan edited during a review, and 7ak's item 4 confound (the 19:36 and 19:49 FAILs) -> DROP: both automated at 7ak's close (startedBlob; reduce-7ak's both-class pooling)
- [T:figure] [T:overclaim] 7al's per-year residual was read as years after access where the output counts plan years, and its band and position splits were read as evidence against interpolation when the 50-90% band is the cliff band and the share axis leans mid-cell (the auditor's BLOCKINGs of 30 Sep 22:5x) -> REPLACE the reducer's per-year line label with one naming the access year it is counted from (reduce-7al.mjs prints '|' only; debt: a label with the year number, before 7ao's reducer copies the line)
