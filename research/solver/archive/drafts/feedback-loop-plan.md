# The feedback loop: the exact changes (draft for the deep review, 30 Sep)

The maintainer, 30 Sep: "go ahead. unlock enforcement. plan the exact changes, run a deep review, amend the plan, then
implement. the goal is to evolve towards the perfectly tuned project architecture to achieve our goal of the solver."
Source: drafts/framework-feedback-review.md (the measured costs, the trigger table, the ranked shortlist). Already built
without the unlock: relook.mjs, archive-plan.mjs, results-mutation-history.txt.

**The loop in one line:** every finding and every catch carries a trigger code; every closed test ends in at most five
lessons, each automated, replacing a rule, or dropped; budgets stop the always-read text growing; every fifth close, one
pass reads only the counts and retires or automates. Its own cost is capped (section 3).

**What "tuned" means here (the success measure):** fewer review cycles per test (117 of 231 audits FAILed), fewer
BLOCKING findings of a repeat trigger, no growth of the always-read text, and no loss of catches (the S-codes keep firing).
`triggers.mjs` prints all four, so the loop is judged by its own counts.

## 1. The changes, file by file

| # | File (L = locked) | Change | Catches / saves | Planted test |
|---|---|---|---|---|
| 1 | **research/solver/triggers.mjs** (new, L) | The code list (below) as `CODES`; `parseTags(text)`; reads review-log.md, deep-review-log.md, lessons.md, results-mutation-history.txt; prints at most 40 lines: per code, the count over the last 5 and 20 closed tests (a close = a lessons.md entry) and when it last fired; per S-code, its last catch; `RETIREMENT PASS DUE` when 5 closes have passed since lessons.md's last "## Retirement pass" | makes the record countable (the review took a whole agent run to reconstruct it) | research/tests/triggers.test.mjs: a built log parses to known counts; an unknown code is refused; the 40-line cap holds; DUE fires at the 5th close and not the 4th |
| 2 | **research/solver/record-review.mjs** (L) | `--verdict`: every graded finding (`BLOCKING n.`, `MINOR n.`, `BACKLOG n.`) must carry one `[T:<code>]` from CODES; "none" needs none | the tags exist from the next receipt on | triggers.test.mjs: a finding without a tag, with an unknown code, refused; tagged, accepted |
| 3 | **.claude/agents/plan-auditor.md** (L) | Step 1: run `node research/solver/relook.mjs` and treat each open row it lists that the change should have moved as a re-look finding. Step 3: tag each finding. **Replace** "a previous receipt's MINOR finding still not fixed" (BLOCKING) with: an unfixed MINOR is re-listed as `MINOR (carried)`; BLOCKING only when carried by 3 receipts in a row. Delete the sentence on prose times (already a non-finding) | 31-43 re-look BLOCKINGs; the 32 escalation BLOCKINGs | hooks.test.mjs is not the place (prompt text); the receipt format is tested through record-review (row 2) |
| 4 | **.claude/agents/deep-reviewer.md** (L) | Tag its findings with codes; a new step 0: `node research/solver/triggers.mjs`; when it prints RETIREMENT PASS DUE, the review includes the pass (section 2) and appends "## Retirement pass <date>" with its proposals to lessons.md | the pass happens without a new agent or trigger | triggers.test.mjs covers DUE |
| 5 | **research/solver/lessons.md** (new, NOT locked: written at every close) | One entry per closed test: `## <test> (closed <date>)` then 1 to 5 lines `- [T:<code>] <what was sub-optimal or what caught it> -> AUTOMATE: <script or check, with its planted test> / REPLACE: <file>: "<the line it replaces>" / DROP: <why>` | the retrospective; never loaded into context | - |
| 6 | **research/solver/check-plan.mjs** (L) | NEW-LINE check **retro**: a new ledger row whose bold headline reads `<test> READ` needs lessons.md to hold `## <test>` with 1-5 lines each carrying a code and one disposition. WHOLE-FILE check **budget**: PLAN.md at most 650,000 bytes; RULES.md 72,000; the always-loaded text (CLAUDE.md + CHECKLIST.md) 4,000; each budget a constant here, lowering it free, raising it an unlock | the retrospective cannot be skipped; growth is stopped | plan-checker.test.mjs: a READ row with no lessons entry, an entry with 6 lines, a line with no disposition, each refused; a READ row with a good entry passes; PLAN.md over its budget refused |
| 7 | **.claude/hooks/session-start.sh** (L) | Print the checklist only on `compact` (CLAUDE.md's @-include already loads it at start, resume and clear) | 2.2 KB a session | hooks.test.mjs: the startup output lacks the checklist; the compact output has it |
| 8 | **.claude/skills/plan-update/SKILL.md** (L by the hook's folder rule) | Planning: add the build-order and `node --check` step; fold the time-estimate step into the launch step. Updating: before committing a plan change run `relook.mjs`; at a test's close write its lessons.md entry and run `archive-plan.mjs --apply`; the retirement pass when triggers.mjs says it is due. Net length about unchanged | M4, M9; the close routine | - |
| 9 | **.claude/hooks/pre-tool.mjs** (L) | PROTECTED gains triggers.mjs, research/tests/triggers.test.mjs and .claude/skills/ (made explicit: today the folder rule locks it by accident). The narrowing (the review's P10) is NOT in this pass: the hook's parser is 27.6 KB with 12 commits of fixes and a fuzz history; a change there needs its own design and review | stops the accidental lock being an accident | hooks.test.mjs: a write to triggers.mjs and to the skill refused without the unlock |
| 10 | **research/solver/RULES.md** | A short section "10. The feedback loop" (about 1.2 KB): the codes, the close routine, the budgets, the retirement pass, who does what; its enforcement row | the rules state the loop | - |
| 11 | **CHECKLIST.md** (L) | Item 11 gains four words: "...and write the test's lessons (lessons.md)". Still 12 items | the close step is in the always-read list | plan-checker.test.mjs's 12-item check still passes |

**The trigger codes** (the review's trigger table; 16 slips, 9 catches; `other` for none that fits, and a code seen 3
times as `other` is named at the next retirement pass):

- Slips: `relook` (a moved item's rows not updated), `branch` (an outcome unreachable, a combination with no branch),
  `sentinel` (a missing value or empty class read as data), `plant` (a planted fault that trips two checks, a mutation
  escape), `figure` (a figure typed, not from a script), `overclaim` (stronger than its grade), `format` (an output or
  ran-line format a consumer does not match), `order` (a step done before what it depends on: a build check before its
  consumer, a launch before its check), `import` (a check that runs what it checks), `lock` (a hook refusal of a
  legitimate command), `time` (a clock slip where the order matters), `stale` (text the change contradicts), `register`
  (an odd result not registered), `enforce` (a claim about the enforcement), `design` (a prediction's rule or power
  unsound in another way), `carried` (a finding carried from a previous receipt), `other`.
- Catches: `c-gate` (a fair-test or identity gate refused a run), `c-plant` (a planted check caught a fault), `c-mutation`
  (a mutation run exposed a gap), `c-preflight` (a build check or preflight crashed early), `c-check` (check-plan or
  check-prediction refused), `c-review` (the auditor found a real error), `c-deep` (a deep review found a root cause),
  `c-relook` (relook.mjs listed a row that had to move), `c-falsify` (a prediction usefully falsified).

## 2. The retirement pass (every fifth close; inside a deep review)

Input: `triggers.mjs` output and lessons.md's lines since the last pass, nothing else (under 5k tokens). Output, appended
to lessons.md: for each slip code seen 3 or more times in the last 5 closes, the automation that makes it impossible
(named script or check); for each rule, check or checklist line with no catch in 20 closes, or whose failure mode a new
check now makes impossible, a retirement (moved verbatim to PLAN-HISTORY.md or RULES.md's history); the budget each
proposal changes. Locked proposals go to the maintainer in one list for one unlock.

## 3. The loop's own cost, capped

- Always loaded: -2.2 KB (row 7) + 20 bytes (row 11) = about -2.2 KB a session.
- The auditor's prompt: about +400 bytes (relook step, tags, the carried rule) - about -200 bytes (the time sentence and
  the escalation paragraph), about +200 bytes net.
- Per close: 5 unloaded lines; the retirement pass under 5k tokens every fifth close.
- Budgets: PLAN.md 650 KB now (608 KB after today's archive), stepping down by the retirement passes toward 300 KB;
  RULES.md 72 KB (68 KB now + 1.2 KB), toward 45 KB; the always-loaded files 4 KB (3.4 KB now).

## 4. What is left out, and why

- The hook narrowing (P10): its own design, below.
- The outcome-reachability check (A2) and the reducer scaffold (A3): larger builds; the first retirement pass decides
  (their codes, `branch` and `plant`, are the most frequent).
- The uncertainty index as the deep review's trigger (P8): it reads HIGH every time, but it costs nothing to leave, and
  changing the deep review's cadence is a research decision, not a framework one.
- Moving RULES.md's known limits to history (P5): the first retirement pass, by the rule it sets.

## 5. Order of work

Build rows 1-2 with triggers.test.mjs first (the consumer before the producers: M4); then 3, 4, 6 with their planted
tests; then 5, 7, 8, 9, 10, 11; run every suite; the plan-auditor on the plan's ledger row recording the change; then
seed lessons.md with today's lessons (7ai's close and the framework day).

---

## 6. AMENDED after the deep review (drafts/feedback-loop-review.md, 30 Sep): all 13 amendments adopted

This section supersedes sections 1-5 where they differ. In the review's order:

1. **Rows 1-2 (committed f27c04c), fixed:** the tag rule splits on `(BLOCKING|MINOR|BACKLOG)( \(carried \d+\))? \d+[.:]`
   with no early return for "none"; `carried` becomes a modifier (`MINOR (carried 2) 1. [T:stale] ...`), and
   record-review refuses a PASS with `(carried 3)` or more; `other` must be written `other:<word>`. The codes gain
   `code` (a claim about the code the code contradicts); `figure` becomes "a figure not what its cited output says";
   `stale` is within the rows the change touched and `relook` the rows it did not; `c-review` is dropped.
   triggers.mjs prints the success measure per window of closes (bounded by the close's minute): receipts, FAILs,
   primary BLOCKINGs by code (carried excluded), BACKLOGs (the leniency guard), launches per close (runs.log), and the
   bytes of PLAN.md, RULES.md, CLAUDE.md and CHECKLIST.md; the UNKNOWN line first.
2. **`relook.mjs --since-review`:** the last receipt's blob against the working tree; an empty diff while the plan is
   NOT REVIEWED exits 2. The auditor's step 1 runs it.
3. **The prompts:** the auditor gets relook, tags, the carried rule, and a replacement sentence for prose times. It stops
   re-reading the checklist, which is already in its context, and RULES.md sections 2-5 (about 4.5k tokens a run).
   Instead it opens RULES.md at the section a finding turns on. The deep reviewer does the retirement pass at step 0,
   when triggers.mjs says it is due, and records it with `record-deep-review.mjs --retirement`: a locked `retirement |`
   line that triggers.mjs counts closes from.
   - A retirement must cite a zero from a mechanical source: tags, gate or launcher refusals in the logs, the mutation
     history, or check-plan in CI. The absence of a self-reported catch never retires anything.
   - The pass also lists the follow-through debt: AUTOMATE lines whose named file does not exist, and REPLACE lines whose
     quoted text is still present. Each is built or turned into a DROP with its reason.
4. **Row 6, with amendments 1 and 6:**
   - A close is each test in results-scorecard.txt after a seed line. Each needs a lessons.md entry
     `## <test> (closed <ledger row time>)` whose codes include every code on a BLOCKING in review-log.md between the
     previous close and this one.
   - archive-plan.mjs's cut-off defaults to the newest-but-two close. It also archives ledger rows beyond the newest 15,
     and schedule rows read, done or dropped two closes ago.
   - The PLAN.md budget refuses only when PLAN.md is over budget and the dry run has something to move; over budget with
     nothing to move only warns.
   - `record-review.mjs --moved` records a PASS by "archive-plan (verified)" when every removed line reappears verbatim
     in PLAN-HISTORY.md and every added line is a pointer line.
   - The always-loaded 4 KB budget is cut: bytes are printed by triggers.mjs instead.
5. **Rows 7-11:**
   - session-start.sh prints the checklist on compact only; hooks.test.mjs's startup case is inverted in the same commit.
   - The SKILL is locked explicitly. The stated reason was wrong: the Edit tool could change it; only the shell was
     refused.
   - RULES.md section 10 is about 400 bytes, pointing to triggers.mjs's header.
6. **Amendment 7, outcome coverage:** a reducer registered from now on prints `OUTCOMES REACHED: item <n>: <outcomes>`
   under `--planted`. The launcher refuses a prediction registered after this change if the reducer named on its Run line
   leaves a registered outcome unreached by a plant. reduce-7al.mjs is the first.
7. **Hook narrowing:** deferred, agreed; its false refusals are counted as `[T:lock]`.
8. **Seed lessons.md** from the closes in the scorecard's window, today's receipts giving `relook`, `sentinel`, `figure`
   and `stale`.
