# The external reviews: which document is current (11 Nov)

This branch (`review/external-2026-10-21`) holds the external reviewer's work. It is not for merging. Each review is a
dated record, and the agent cites them by commit.

## Current

**The plan from Phase 8 on: `2026-11-01/LAUNCH-PLAN.md`.**
- The maintainer sent its section 7 prompt to the agent on 1 Nov, adopting its decisions (B1 to B14) and rules (R1 to
  R6). The agent records them as D51 onward.
- Where it differs from the agent's `research/solver/PART-C-PLAN.md`, LAUNCH-PLAN.md holds.
- Its figures: `2026-11-01/launch/`.
- **Updated 3 Nov:** step U between step P and Phase 11; Phases 11 and 12 recast; the calendar redone.

**The review of 9 Nov, and what to do about it: `2026-11-09/EXPERIMENTS-AND-PORTS.md`.**
- The maintainer's brief of 9 Nov: the engine's money rules against 2026/27 rules, the speed work, D4's cost, and large
  gaps not yet investigated. The findings and their evidence are `2026-11-09/REVIEW.md`.
- `EXPERIMENTS-AND-PORTS.md` is the instructions: nine items in the order to do them, each with its experiment, its
  decision rule, the port if it passes and its time box, and the prompt for the agent. Nothing in it is done until
  the maintainer sends that prompt.
- **Added later on 10 Nov: item 10, the solve on anchors and shortlists** (about 7 times faster on one core,
  approximately; `REVIEW.md` 2.3, `prototype/solve-coarse.diff`). It is not in the first prompt. Its own follow-up
  prompt is the file's last section.
- `ANSWERS-2026-11-10.md`: the review's answers to the agent's questions of 10 Nov on items 3, 4 and 5
  (`research/solver/QUESTIONS-2026-11-10.md` on the working branch). Two of them correct the review: item 4's case 6
  and item 5's households.
- **Added on 11 Nov: item 11, a couple's joint move on flat arrays** (a couple's path 2 to 6 times faster, bit for
  bit; `REVIEW.md` 2.4, `prototype/couple-flat.diff`, `tests/couple-flat.test.mjs`), **and item 12**, what
  approximate cuts add to it (measured on 15,000 paths; an experiment before any is ported). Neither is in an
  earlier prompt. Their follow-up prompt is the file's last section.
- `ANSWERS-2026-11-11.md`: the review's answer to the agent's question of 11 Nov on how the couples' re-run should
  run (`research/solver/QUESTIONS-2026-11-11.md`): held until items 5 and 10 are ruled and item 11 is in; then on
  one session; S1 reported, not deciding. It also says why item 10's part 5 failed: the review's wording.
- Its item 3 is a defect that changes a figure: the engine does not stack a year's incomes as HMRC does.
- It adds to the launch plan and replaces none of it. Its stops are the launch plan's section 5 stops.
- Its patches, scripts, test and outputs: `2026-11-09/prototype/`, `scripts/`, `tests/`, `results/`.
- The held-out scan reads this folder and now adds S021, S085, S091 and S261 to `touched()` (`REVIEW.md`'s note).

**The new planner, step U's spec: `2026-11-03/LAYOUT.md`.**
- The solver-first layout: four places (Your plan, You, What if, Details), and the classic planner kept for couples.
- Where it and the launch plan's step U differ, LAYOUT.md holds.
- Its figures: `2026-11-03/layout/`. The design's canvas is the maintainer's to share.

## The evidence the plan rests on

| document | what it is | status |
|---|---|---|
| `2026-10-30/LOCK.md` | the candidate's tiers under another spending rule | Section 4's recommendation (the dial with the age weights, on the candidate's tiers) became D48's port, then B3 |
| `2026-10-30/AGE-WEIGHT.md` | the age-weighted dial | ported (D48); B3a |
| `2026-10-30/LEVERS.md`, `DIAL-TIMING.md` | answers to the maintainer's questions of 30 Oct | EXPLORATORY; informational |
| `2026-10-30/EZ.md` | Epstein-Zin preferences | set aside (LOCK.md section 4; B12) |
| `2026-10-29/SPENDING-CURVE.md` | the spending curve | adopted (D43, D44) |

## Historical: done or superseded

| document | what became of it |
|---|---|
| `2026-10-21/EXTERNAL-REVIEW.md` | Part B was the plan to Phase 4 (D1). It is done. |
| `2026-10-22/FOLLOW-UP.md` | adopted (D20) |
| `2026-10-23/SPEED-REVIEW.md` | ported (D24) |
| `2026-10-24/MISSING-MOVES.md` | answered; led to THIRD-STEP.md |
| `2026-10-24/THIRD-STEP.md` | joined the candidate (D28) |
| `2026-10-25/SPEED-GROUNDWORK.md` | its sweep led to SPEED-PORT-2.md |
| `2026-10-25/SPEED-PORT.md` | ported (D30) |
| `2026-10-25/SPEED-PORT-2.md` | ported (D31) |
| `2026-10-25/PURPOSE-TEST.md` | answered the maintainer's question of 25 Oct |
| `2026-10-26/GIA-LADDER.md` | answered; the taxable account's tiers stay research, off (D47) |
| `2026-10-26/N1-ASSESSMENT.md` | N1 not run (D33) |
| `2026-10-27/GAPS-SWEEP.md` | ported to the agent's full tier (D38 (6)) |

## Not this branch's rules

This branch was cut before the agent's reset of 21 Oct. It still carries that regime's files: its `CLAUDE.md`, the
twelve-line checklist, `research/solver/PLAN.md`, the plan checker and `.github/workflows/plan-check.yml`. They govern
nothing.
- The agent works by its own branch's `CLAUDE.md` and `research/solver/CHECKLIST.md` (eight lines).
- The plan-check workflow triggers only on pushes under `research/solver/`, `src/solver/` and the like, so this branch's
  reviews never run it. GitHub lists no run of it.
