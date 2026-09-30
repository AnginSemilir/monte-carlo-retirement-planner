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
