# The external reviews: which document is current (3 Nov)

This branch (`review/external-2026-10-21`) holds the external reviewer's work. It is not for merging. Each review is a
dated record, and the agent cites them by commit.

## Current

**The plan from Phase 8 on: `2026-11-01/LAUNCH-PLAN.md`.**
- The maintainer sent its section 7 prompt to the agent on 1 Nov, adopting its decisions (B1 to B14) and rules (R1 to
  R6). The agent records them as D51 onward.
- Where it differs from the agent's `research/solver/PART-C-PLAN.md`, LAUNCH-PLAN.md holds.
- Its figures: `2026-11-01/launch/`.
- **Updated 3 Nov:** step U between step P and Phase 11; Phases 11 and 12 recast; the calendar redone.

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
