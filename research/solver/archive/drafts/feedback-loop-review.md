# Deep review of drafts/feedback-loop-plan.md (30 Sep)

Independent; read-only commands only (`record-review.mjs --check-only` writes nothing). Rows 1-2 were committed
(f27c04c) before this review returned, so amendments 3, 4 and 8 apply to committed code.

## Verdict: adopt with amendments

The design is right, and aimed at the right cost. One audit run averages about
3.8M cumulative input tokens (761M over 201 runs, evidence table). One FAIL cycle that is avoided therefore saves more
than 6,000 sessions' worth of the 2.2 KB checklist cut.

As written, it degrades into ritual in four places, each cheap to fix: the retrospective passes with boilerplate; the
success measure is not printed; retirement rests on self-reported catches; the auditor's re-look step runs on an empty
diff.

## Amendments, ranked by value

**1. Anchor the retrospective to the record, not to wording (row 6).**

Evidence:
- The detector "`<test> READ` in a new ledger row's bold headline" misses real closes. Headlines in the PLAN.md ledger
  include "7s FALSIFIED:", "7r HELD:", "7w read (", "7t read (", "O22's trace (7j) read against its prediction", and
  "7m: the capital-market source..." (7m is the close the auditor FAILed on 29 Sep 20:46 for having no ledger row).
- Any 1-5 lines with a code and a disposition pass. For example, "- [T:other] nothing sub-optimal -> DROP: seen once"
  would pass.

Change:
- **What counts as a close:** every test in `results-scorecard.txt` (one line per scored test, written at every read)
  that comes after a seed line must have a `## <test> (closed <ledger row time, e.g. 30 Sep 17:52>)` entry in lessons.md.
  This is a whole-file check.
- **Anti-boilerplate cross-check:** the entry's codes must include every code on a BLOCKING finding in review-log.md
  receipts between the previous close and this one. triggers.mjs already parses these. A line may carry several codes,
  so five lines are always enough.
- `other` must be written `other:<word>`, so that repeats can be counted. At present "a code seen 3 times as `other`"
  cannot be detected, because an `other` tag has no content.
- Planted tests: a scorecard test with no entry; an entry that omits a window BLOCKING code; a bare `other`.

**2. The auditor's relook step runs on nothing (row 3).**

Evidence:
- `relook.mjs` diffs against `@{u}` by default. Run just now, it printed "PLAN.md has no change against @{u}: nothing to
  re-look" and exited 0.
- When the auditor runs, the change is normally already committed and pushed (in the log, the plan commit is followed
  by "Review log: the plan-auditor's start"). The diff is therefore empty, and the step reports a pass on nothing. That
  breaks checklist item 6.
- `--base` also cannot take the receipt's blob hash, because `git diff <blob> -- <path>` is not valid.

Change:
- Add `relook.mjs --since-review`. It diffs the last receipt's blob against `hash-object -w` of the working tree, the
  same way `record-review.mjs --diff` does.
- Empty diff while `--status` reads NOT REVIEWED: exit 2.
- The auditor's step 1 should read: "`node research/solver/relook.mjs --since-review`; each open row it lists that the
  change should have moved is a re-look finding."
- This must land before row 3.

**3. Make triggers.mjs print the success measure it is judged by (row 1, committed).**

Evidence:
- Plan line 14 says triggers.mjs "prints all four". But `report()` (triggers.mjs l.79-86) prints only tag counts and
  "catches never recorded".
- Its windows are measured by day (`dayKey`, l.73). At about 3 closes a day (7ah, 7ai and P fell within 30 hours),
  "the last 5 closes" takes in whole days on either side.

Add, per window of closes, with each close bounded by its minute-precision time (amendment 1):
- receipts, FAILs, and primary BLOCKINGs by code, excluding carried findings;
- BACKLOG findings, as the leniency guard. A BACKLOG finding is an error in text an earlier PASS let through, so if the
  loop lowers FAILs by making the auditor lax, this number rises;
- launches per close, from runs.log's `PREDICTION=` field (7ah needed five);
- bytes of PLAN.md, RULES.md, CLAUDE.md and CHECKLIST.md.

Keep the 40-line cap, but put the UNKNOWN line first so the cap cannot drop it (l.86 slices it off last). With these
additions, "fewer cycles, no loss of catches" becomes a number, not a claim.

**4. Close the tag rule's holes (row 2, committed).** I ran these with `--check-only`, which writes nothing.

Evidence:
- `"none. CHECKED AND SOUND ... MINOR 1. PLAN.md l.3: stale"`, with no tag, prints "findings tagged: ok". The cause is
  `/^none\b/` returning early (record-review.mjs l.37). Up to 22 past PASS receipts start "none" and carry a MINOR.
- `"MINOR 1: ... [T:other]; MINOR 2: x"` is also accepted. The split needs `\d+\.`, so colon-numbered findings merge
  into one part and one tag covers them all.
- `carried` is listed as a trigger code. That hides the finding's real trigger.

Change:
- Remove the early return for "none". Split on `(BLOCKING|MINOR|BACKLOG)( \(carried \d\))? \d+[.:]`.
- Drop `carried` from CODES. Make it a modifier: `MINOR (carried 2) 1. [T:stale] ...`.
- record-review refuses a PASS that contains `(carried 3)` or more. The escalation is then mechanical, and does not
  depend on the auditor counting correctly.

With that, "MINOR carried, BLOCKING after 3" is appropriate. A MINOR by definition touches no result, gate or default.
The old rule produced 32 BLOCKINGs (17%). At about 29 receipts a day, three receipts is still only hours.

**5. Retire only on mechanical evidence, and record the pass in a locked log (rows 4, 5).**

Evidence:
- The catch codes (`c-gate`, `c-plant`, `c-check`, ...) are recorded only when an author spends one of five lesson lines
  on them. Today triggers.mjs prints "catches never recorded: c-gate, c-plant, ... c-falsify".
- The rule "no catch in 20 closes → retire" will therefore propose retiring checks that are firing.
- deep-reviewer.md l.13 says "Never edit any file", yet row 4 has it append to lessons.md.
- The `--due` count depends on "## Retirement pass" headings in lessons.md, which is unlocked. Anyone can reset it.

Change:
- A retirement proposal must cite a zero from a mechanical source: review-log tags, fair-gate or launcher refusals in
  results logs, the mutation history, or check-plan failures in CI. Self-reported absence can argue for automating
  something, never for retiring it.
- `record-deep-review.mjs --retirement "<proposals>"` writes a `retirement |` line into deep-review-log.md, and
  triggers.mjs counts closes since that line.
- The deep reviewer does the pass at step 0, before it loads the research, so the housekeeping does not dilute the
  research review.
- The pass also lists **follow-through debt**: each AUTOMATE line whose named file does not exist, and each REPLACE line
  whose quoted old text is still in the file. The pass must build each one or turn it into a DROP with a reason.
  Without this, lessons pile up unimplemented.

**6. A PLAN.md budget that forces archiving, not terser records (row 6; archive-plan.mjs).**

Evidence:
- `archive-plan.mjs`'s cut-off defaults to a hard-coded `'28 Sep'` (l.14). So the SKILL's "run `archive-plan.mjs
  --apply` at close" never moves another deep-review row.
- The dry run now moves 0 bytes, with PLAN.md at 609,914 bytes against a 650,000 budget and growth of about 75 KB a day.
- Faced with a byte refusal and nothing left to move, the cheapest way through is to write shorter rows. That is the
  quality loss the maintainer fears.

Change:
- Default the cut-off to the date of the newest-but-two close.
- Also archive ledger rows older than the newest 15, and schedule rows READ, DONE or DROPPED for two closes.
- The budget check refuses only when PLAN.md is over budget **and** the dry run has something to move ("run
  archive-plan.mjs --apply"). If it is over budget with nothing to move, the check warns the maintainer instead.
- Give record-review a `--moved` path. It records a PASS by "archive-plan (verified)" when every removed PLAN.md line is
  added verbatim to PLAN-HISTORY.md and every added line is a pointer line. This saves one full audit (about 118k peak)
  at every close, and cannot hide an edit.

**7. The largest omission: outcome coverage by plants (A2-lite), now.**

Evidence:
- Prediction design is the largest BLOCKING class: 52 (28%), including unreachable outcomes and missing branches.
- The plan defers A2 to the first retirement pass, to rediscover by tags what the evidence table already shows. That is
  ritual.
- The reducers already have plants ("planted (25): all read as they should" in 7ak).

Cheapest form:
- Each reducer's `--planted` prints `OUTCOMES REACHED: item <n>: HELD FALSIFIED INCONCLUSIVE` together with its Decision
  fed branches.
- The launcher's smoke step refuses when a registered outcome or branch is reached by no plant.
- Zero context; aims at the largest class.

**8. Fix the code list (row 1).**

I mapped the last 40 receipts to the codes. Several BLOCKINGs have no code:
- a claim about code that the code contradicts: E3 built only in half (30 Sep 06:42); E3's default route through
  PRODUCT_BASELINE (09:56); O36's fix unable to reach a choice (29 Sep 19:50). This is the auditor's own "code against
  claim" category (plan-auditor.md l.39).
- a misread figure: +2.563 is survival points, not whole score (30 Sep 19:05). `figure` covers only typed figures.

Change:
- Add `code`, and extend `figure` to "a figure not what its cited output says".
- `relook` and `stale` overlap; the evidence could only say "31 primary, 43 in all". Define `stale` as "within the rows
  the change touched" and `relook` as "rows it did not touch".
- Drop `c-review`: every auditor BLOCKING is already a catch.

**9. Do not delete the prose-time sentence (row 3).**

That sentence (plan-auditor.md l.25-28) is what makes prose times a non-finding. Time MINORs still ran at 49 of 311
MINORs after the loosening, even with the sentence in place. Replace it with: "A time is checked only where the order of
events matters (prediction before run, decision before code, review before fix); elsewhere it is not a finding." That
is about 150 bytes, not 0.

**10. Make the auditor cheaper per run (not in the plan).**

Step 1 tells the auditor to "Read research/solver/CHECKLIST.md and sections 2-5 of RULES.md". But:
- The checklist is already in every subagent's context through CLAUDE.md's @-include; it is in this reviewer's context.
- Sections 2-5 are 18.1 KB, about 4.5k tokens, re-read about 29 times a day.

Replace with: "The checklist is in your context; open RULES.md at the section a finding turns on." Measure it (amendment 3).

**11. Row 7: correct and small.** CLAUDE.md l.5 and session-start.sh l.55 both load the checklist; the saving is about
560 tokens a session. CLAUDE.md reloads after compaction, so nothing is lost. Invert hooks.test.mjs l.305-306 in the
same commit.

**12. Lock the SKILL; correct the stated reason (row 9).** A probe of `decide()`: Edit on SKILL.md is allowed, `sed -i`
denied. It is not locked today. Locking it matches CHECKLIST and the agent prompts.

**13. The hook narrowing: agree to defer it.** A probe shows the pattern, for example: `sed -i ... research/solver/PLAN.md &&
node research/solver/check-plan.mjs` is refused because writes are judged on the whole command, not per segment. At
about 10 a day and a few hundred tokens each, false refusals cost little. The parser has 12 fix commits and a fuzz
history. The smallest safe narrowing is to judge `writesProtected` per segment while keeping the name rule for relative
targets. That belongs in its own reviewed change with the fuzz corpus re-run. Until then, count the refusals as
`[T:lock]` in lessons.

## Order of work (revised)

1. Amendments 4, 3 and 8 on the committed rows 1-2.
2. Amendment 2 (`relook --since-review`).
3. Rows 3 and 4, with amendments 5 and 9.
4. Row 6 with amendments 1 and 6, including the archive-plan extension, before its budget turns on.
5. Rows 7-11, then amendment 10.
6. Amendment 7 as the first build after the loop is in place.
7. Seed lessons.md from 7ai's close, with its window codes. Today's receipts supply `relook`, `sentinel`, `figure` and
   `stale`.

## What to cut

- The always-loaded budget of 4 KB. It leaves 555 bytes of headroom over 3,445 bytes and guards a place where the cost
  is not. Keep only a CHECKLIST item count (already checked) and bytes printed in triggers.mjs.
- `c-review` (amendment 8).
- RULES.md section 10 at 1.2 KB. The loop's rules fit in 400 bytes plus pointers to triggers.mjs's header, which is
  already the specification.
