# Making the framework improve itself without growing: a review (30 Sep)

A draft; nothing here is adopted. Tokens are bytes/4 unless marked **measured**, which means the API's own usage counts
in this session's transcripts (`~/.claude/projects/.../subagents/*.jsonl`, 249 runs). The classes in section 2 are a
first-match keyword split of review-log.md, with the examples read by hand (grade C).

## 1. The cost, measured

**Always loaded:** CLAUDE.md 1,204 B, CHECKLIST 2,241 B, the session-start hook's output 2,679 B (it prints CHECKLIST
again, so the checklist loads **twice**), the descriptions 1,161 B. Total 7.3 KB, about 1.8k tokens. The auditor's measured
first-turn context was 8.9k (24 Sep) and is 10.0k (30 Sep). **The cost is not here.**

**Per review (measured).**

| agent | runs | median peak context | max | median turns / minutes | cumulative input, all runs |
|---|---|---|---|---|---|
| plan-auditor | 201 (24-30 Sep, about 29 a day) | 118k | 459k | 37 / 8.4 | 761M (35.6 h of reviewer time) |
| deep-reviewer | 23 | 219k | 294k | 46 / 13.7 | 126M |
| main session | - | about 783k every day | - | - | 62 compactions; about 5 a day since 24 Sep, against about 2 before (grade C) |

The auditor's median peak **fell** from 160k (24 Sep) to 72k (30 Sep) while PLAN.md doubled, because the "judge the
change" scope works. The cost is **how many** reviews run and FAIL, not their size.

**The files agents grep and re-read** (`wc -c`; `git show <rev>:path | wc -c` at each day's last commit):

| file | now | growth | the largest parts |
|---|---|---|---|
| PLAN.md | 678 KB, about 170k tokens | 81 KB (20 Sep), 305 KB (25 Sep), 678 KB (30 Sep): **+75 KB, about 19k tokens, a day** | ledger 248 KB (98 rows, mean 2.5 KB, max 6.7 KB); register 135 KB (67 rows, mean 2.0 KB, max 8.2 KB); schedule 110 KB (46 rows, the 7u row 15 KB); "Where things stand" 79 KB. 108 lines over 2,000 characters hold 393 KB (58%) |
| RULES.md | 68 KB, about 17k tokens | 27 KB (24 Sep) to 68 KB | known limits of the enforcement 15.8 KB (24 items); section 8 12.5 KB; section 9 10.4 KB |
| review-log.md | 976 KB | 231 verdicts, mean 4.1 KB | - |
| predictions/ | 597 KB (30 files) | mean 20 KB, max 44 KB (diag-7v.md) | - |
| deep-review-log.md | 107 KB | 23 receipts, mean 2.3 KB | - |

Auditor tool calls that named PLAN.md: 1,961 (measured). The auditor's instruction to "read the whole plan at a milestone"
now means 170k tokens, which no reviewer can hold beside its work, so it is not done.

## 2. The recurring failures

117 of 231 audit verdicts FAILed (review-log.md), with 188 graded BLOCKING items. Streaks of consecutive FAILs: 35 of
1, 14 of 2, 6 of 3, 3 of 4, and 5, 6 and 13 once each. Of 539 MINORs, 104 name a clock time (49 of 311 since the 26 Sep
loosening) and 99 are about the enforcement itself.

| class (first-match) | BLOCKING | typical instance | caught mechanically today? |
|---|---|---|---|
| **Prediction design**: an unreachable outcome, a missing branch, power "by construction", Unmasking, prior tests | 52 (28%) | 7af's "neither alone" had no branch (28 Sep 23:23); P's items 3-4 at "1.000 by construction" (29 Sep 11:30); 7al item 1's FALSIFIED unreachable (6af031c) | **auditor only**: check-prediction checks that fields are present |
| **Previous finding not fixed** (a MINOR raised to BLOCKING) | 32 (17%) | a time in fair-gate.test.mjs l.64, 2 FAILs running (24 Sep 21:12, 21:14) | the grading rule **produces** these |
| **Re-look missed**: a downstream row or gate left stale | 31 primary, 43 in all | 7u's conditions (30 Sep 14:32, 14:46, 14:49, 17:58) and O60 (18:10): **5 of today's 11 FAILs** | **auditor only**, after the fact |
| **Reducer or derivation code wrong** | 27 | a sentinel or empty input read as data (reduce-7r's -1 year, 7t, 7ak's NaN on an empty class, 7e on zero cases, 7af, O52's record.mjs); derive-7e's sqrt(3); an LCG overflow | partly by plants and mutations; the rest by the auditor |
| **Overclaim** beyond the evidence's grade | 14 primary, 84 mentions | O9's rank-1 hypothesis stated as settled (30 Sep 14:46) | **auditor only** |
| **Register row missing** | 7 | 7x outside 7 of 10 intervals (27 Sep 22:22) | nothing: check-plan checks only the rows present |
| **Order of events** | 4 (+104 time MINORs) | 29 Sep 08:00 | the format only (clock check) |
| **Enforcement claims** | 5 primary, 32 mentions | 24 Sep 11:24 | - |

**Other slips** (git, PLAN.md's bug lists, the transcripts):

- **A parse check by import runs the script**, 3 times: the audit run outside the launcher (26 and 28 Sep) and
  experiment.mjs rewriting the band (27 Sep).
- **A build check launched before the code that reads its output.** 7al builds 3-5 were stopped in the smoke run as
  audit-7al's lines changed under reduce-7al.mjs (`results/7al-build3..5.log`; eb1ea7e, c975690, d221b8d). The launcher
  logs such a stop as "REFUSED: the smoke run failed", which is wrong.
- **The ran line's format did not match the reference records**, twice: smoke.sh's anchored grep (25 Sep 10:28 BLOCKING) and
  d221b8d today.
- **Plants that trip two checks.** 7al's first reducer let 9 of 28 mutations through (supplied by the session). The
  committed `results-reduce-7al-mutations.txt` keeps only the final "every one caught", so the lesson is lost. There was
  also an equivalent mutation (6af031c).
- **A typed figure.** check-plan refused 2.52; `look-7ai-split.mjs` was written afterwards (4ef58bd). The check covers only
  the ledger's settled-result cell, and it matches substrings.
- **144 hook refusals** in the main session (45 on 24 Sep, 9-13 a day since). In a sample of the 29 "writes an enforcement
  file" refusals from 27-30 Sep, the targets were PLAN.md, a prediction, a reducer or a scratchpad copy, and the command
  only named a locked file (grade C). This review had 3 refusals: two read-only commands and one edit of this draft. Stop-hook blocks: 65 for an audit due,
  5 for a deep review due.

## 3. The triggers: what produced catches, and what produced slips

A trigger is the situation in which a pattern arises; it is the unit the loop acts on.

| # | trigger | outcome | seen | action |
|---|---|---|---|---|
| S1 | New reducer or derivation code, read against the prediction before launch | caught: the sentinel bugs, sqrt(3), the LCG cycle, 7ak's NaN (27 BLOCKING) | about daily | **keep**, run it only at registration (tier 1) |
| S2 | A new reducer, then plants and a mutation run | exposed 9 of 28 escapes in the 7al draft; 21 reducers carry a mutation receipt | every test | **strengthen**: keep the first-run escapes; each plant asserts **which** check refused |
| S3 | A tiny build check or preflight before a batch | caught 7al's locateState crash (3951645) and 7ak's parse crash (731bc8e) | 44 of 90 launches (runs.log) | **keep**; consumer first (M4) |
| S4 | A figure typed into the ledger | check-plan refused 2.52 | 1 today, more earlier | **extend** to register and schedule rows; exact token match |
| S5 | A settled result, then a deep review | found the unmasking (26 Sep), 3 reducer or scorecard bugs (PLAN bug lists), 7al's three amendments (0c762a9) | 23 | **keep**; see P8 on its trigger |
| S6 | A prediction edited after launch | fair-gate's PREDICTION EDITED (7v, 27 Sep) | 1 | **keep** (zero context) |
| S7 | An identity gate to earlier runs | forced 7al's ran-line match (d221b8d) | recurring | **template** it (A3) |
| S8 | Scored credences | Brier 0.232 over 114 (target 0.20); under 60% credence, 61% held against a mean of 44% | every test | **automate**: print the calibration at registration |
| M1 | A result that moves a register item or gate | re-look missed | 31-43; 5 of 11 today | **automate** (A1) |
| M2 | A prediction with several items or branches | an unreachable or missing branch | 52 | **automate** (A2) |
| M3 | A reducer field undefined on failed paths or empty classes | a wrong read | 6 or more | **scaffold** (A3) |
| M4 | An output format changed while its consumer is written | relaunches | 7al x3, 25 Sep | **skill line**: consumer first (A4) |
| M5 | A plant that trips two checks | a disabled check unseen | 9 of 28 | **scaffold** (A3) |
| M6 | A figure from scratch arithmetic | refused or FAILed | recurring | **extend** (A5) |
| M7 | A MINOR left unfixed | another FAIL cycle | 32 | **replace** (P7) |
| M8 | A clock time in prose | a MINOR | 104 | **drop** (P11) |
| M9 | A parse check by import | runs the experiment | 3 | **skill line** (A4) |
| M10 | A command that names a locked file | a false refusal | about 10 a day | **narrow** (P10) |
| M11 | Writing up the enforcement's own gaps | 24 limits, 99 MINORs | continuous | **drop** (P10) |

## 4. The loop: each closed test improves the framework, at net non-increasing cost

1. **Tag every finding with its trigger.** record-review.mjs requires each finding to start with a code from a fixed list
   (`[T:relook]`, `[T:branch]`, `[T:sentinel]`, `[T:figure]`, `[T:overclaim]`, `[T:time]`, `[T:new]`...). Catches by
   checks, plants, mutations and deep reviews are tagged the same way. It costs about 5 tokens a finding and makes the
   record countable by script (section 2 took a whole review to reconstruct).
2. **`triggers.mjs`** (40 lines of output at most) prints, per code, the counts over the last 5 and 20 tests and when it
   last fired, and, per rule or check, its last catch.
3. **A retrospective at close**, in the commit that records the read: 5 lines at most in `research/solver/lessons.md`
   (never loaded), on what was sub-optimal in prepare, run, analyse and close. Each line carries a trigger code and one
   disposition:
   **AUTOMATE** names the script, check or template that makes the slip impossible, with a plant that goes red once;
   **REPLACE** gives one line that replaces a named line of CHECKLIST, SKILL or the agent prompt;
   **DROP** is for a slip seen once that is not structural.
   check-plan checks that the retrospective is there and has its dispositions (zero review tokens).
4. **Budgets, checked by check-plan** (a `budget` check with a planted over-budget case):

   | item | budget | now |
   |---|---|---|
   | always loaded (CLAUDE, CHECKLIST, hook output, descriptions) | 8 KB | 7.3 KB |
   | CHECKLIST | 12 items | 12 |
   | auditor prompt | 6 KB | 8.4 KB |
   | RULES.md | 45 KB | 68 KB |
   | live PLAN.md | 300 KB | 678 KB |
   | ledger settled-result cell | 600 B | mean 1.3 KB |
   | register row | 1.2 KB | mean 2.0 KB |

   A new rule names the rule it replaces or the headroom it spends.
5. **Retirement.** Every fifth closed test, the deep reviewer reads **only** `triggers.mjs`'s output and lessons.md's
   open lines (under 5k tokens) and proposes: automate each code that fired 3 or more times in 5 tests; retire each rule or
   check with no catch in 20 tests, or whose failure mode a scaffold now makes impossible. The maintainer approves the
   locked ones in one unlock.
6. **Archiving by script.** At close, `archive-plan.mjs` moves resolved and closed register rows, schedule rows
   finished two tests ago, deep-review ledger rows and ledger rows beyond the newest 15 verbatim to PLAN-HISTORY.md. It
   leaves a one-line stub (`O3 resolved: PLAN-HISTORY.md`).

**Who does what:** at close, the main agent writes the retrospective and runs the archive. The auditor tags its findings.
Every fifth test, the deep reviewer does the retirement pass. The maintainer unlocks. **The loop's own cost:** 5 unloaded
lines a test, 40 lines of output every fifth test, and a budget check against net growth.

## 5. Pruning candidates

| # | what | evidence | saving |
|---|---|---|---|
| P1 | 25 resolved or closed register rows still in PLAN.md | status column: 18 resolved, 7 closed | 38.6 KB (about 9.6k tokens) |
| P2 | 16 ledger rows that restate deep-review receipts | rows beginning "The ... deep review" | 69 KB (about 17k), 28% of the ledger |
| P3 | "Where things stand (23 Sep, updated 21:30)", with the bug lists | 79 KB | most of 79 KB (not checked line by line) |
| P4 | PLAN's method preamble, "DERIVE FIRST" (5.4 KB) and "Working conventions" (3.5 KB) | they restate RULES s1 and the SKILL | about 9 KB |
| P5 | RULES known limits (15.8 KB, 24 items, mostly gaps in the hook's parser), s7 (0 citations in receipts), s6 (1) | a grep over review-log.md | about 17 KB, 4k tokens a read |
| P6 | CHECKLIST printed twice at startup | the hook prints it on every source | 2.2 KB a session; keep the hook's copy for `compact` only |
| P7 | "A previous MINOR not fixed is BLOCKING" | 32 BLOCKING (17%) | a queue of open MINORs that check-plan checks; no FAIL cycle |
| P8 | The uncertainty index as the deep review's trigger | 23 of 23 deep reviews at level HIGH | it never discriminates: make it "after every settled test" and drop the gating code |
| P9 | An audit after **every** PLAN.md change, tier 0 included | 201 runs, about 29 a day | check-plan alone at tier 0 (the 26 Sep proposal 2, never done); saving NOT CHECKED |
| P10 | The hook's command parser (pre-tool.mjs 16 to 27.6 KB, 12 commits) | about 10 false refusals a day; 24 known limits | refuse only Edit and Write and redirects to locked paths; a CI job (or CODEOWNERS) fails a protected-path diff the maintainer has not signed |
| P11 | Prose clock times | 104 MINORs | drop the auditor's time checks except where the order matters |

## 6. Additions that pay for themselves

- **A1 `relook.mjs`.** It takes the item ids in the diff (O\d+, 7[a-z]+, P, gate names) and prints every untouched PLAN.md
  line that names them. The author runs it before committing and the auditor at step 1. It targets 31-43 BLOCKING.
- **A2 An outcome-reachability check.** Decision fed becomes a table keyed by each item's outcome. `check-outcomes.mjs`
  runs the reducer's `decide()` over one planted fixture per outcome and over the derivation's power simulation. It refuses
  an unreachable outcome, a combination with no branch, or P(FALSIFIED | the alternative) under 0.5. It targets 52
  BLOCKING.
- **A3 A `new-reducer.mjs` scaffold.** Strict readers (throw on NaN, undefined or -1; a case count per file); the gate
  boilerplate for the fair test and the identity checks; plants that each name the **one** check they must trip; a
  mutation receipt that keeps the first-run escapes.
- **A4 Two SKILL lines, replacing two.** "Write the reducer and a fixture of the audit's lines before the build check."
  "Parse-check with `node --check`, never by importing."
- **A5** Extend check-plan's figure check to register and schedule rows, as whole numeric tokens.

## 7. Ranked shortlist

| rank | change | locked? | context effect |
|---|---|---|---|
| 1 | **A1 relook.mjs** in the auditor's step 1 and before commit | the prompt line only | about 0 added; fewer FAIL cycles (each about 118k peak, measured) |
| 2 | **The archive script + PLAN budget** (P1-P4) | the budget check | PLAN 678 KB to about 300 KB (-95k tokens a whole read; the sum of P1-P4, older ledger rows and finished schedule rows) |
| 3 | **Trigger tags + triggers.mjs + the 5-line retrospective** (the loop) | record-review, the auditor prompt | about +300 B of prompt; the retirement pass under 5k tokens every fifth test |
| 4 | **A3 reducer scaffold** with isolating plants and strict readers | no | 0 context; targets 27 BLOCKING and mutation escapes |
| 5 | **A2 outcome reachability** | check-prediction | 0 context; targets 52 BLOCKING |
| 6 | **P7 + P9**: a MINOR queue and no audit at tier 0 | check-plan, the Stop hook, the auditor prompt | removes 32 BLOCKING of escalation; fewer audits (size NOT CHECKED) |
| 7 | **P5 + P6 + P10**: the known limits and s6/s7 to history, the checklist once, a narrower hook with a CI path guard | yes | RULES -17 KB (-4k a read), -2.2 KB a session, about 10 fewer refusals a day |
| 8 | **A4** (two SKILL lines, replacing two) | no | net 0 |

Items 1, 2 (without the budget check), 4 and 8 need no unlock and could land first. The rest need the maintainer's
"unlock enforcement" and could go together in one unlock.
