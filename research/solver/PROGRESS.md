# Progress through the launch plan

The maintainer asked on 2 Nov: from the external reviewer's rework of the plan (the launch plan of 1 Nov,
`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at 0e24e1b, adopted as D51) at 0%, to the end
of the plan at 100%, the figure after each finished job. Since D58 (3 Nov) the plan is the launch plan at 90fcb10: step U,
the new planner, added after step P (four days), and Phase 11 cut to one day, so the plan grew from 34 days to 37 and the
singles' launch from 16 to 19; the figures fell with no work undone.

## How it is counted

- **The steps and their weights:** each step of the launch plan's calendar (its section on the calendar), weighted by the
  working days the calendar gives it. The two betas are waiting time, not work, so they carry no weight. The couples'
  pilot, registration and run (D4) take the calendar's own range, and D5 is an estimate, since the calendar gives it no
  dates.
- **A step counts in full** when it is merged to `main` on B1's gate, or for a run, when its read is done.
- **A step under way counts in part:** its acceptance items done, as a share of all of them.

| step | the calendar | weight (days) | state | done (days) |
|---|---|---|---|---|
| Step 0, CI and hooks | to 2 Nov | 1 | merged with Phase 8 | 1 |
| Phase 8, the Config tab | to 3 Nov | 1 | merged (pull request 3) | 1 |
| Step L, the levers | to 4 Nov | 1 | merged (pull request 4); L4 and L5 read | 1 |
| Phase 9, the Strategy tab | to 7 Nov | 3 | merged (pull request 5), its budgets recorded as not met (D56) | 3 |
| Phase 10, isolation and the projection | to 11 Nov | 4 | all seven items built and through their harnesses, each plant caught; the merge to come (7 of 8) | 3.5 |
| Step P, cutting the cost | to 6 Nov | 2 | not begun | 0 |
| Step U, the new planner (D58) | to 10 Nov | 4 | not begun | 0 |
| Phase 11, the phone on the new planner | to 11 Nov | 1 | not begun | 0 |
| Phase 12, the beta's switch between the two planners | to 13 Nov | 2 | not begun | 0 |
| Couples D1 to D3 | 13 to 19 Nov | 6 | not begun | 0 |
| Couples D4, pilot, registration and run | from 20 Nov, about a week | 7 | not begun | 0 |
| Couples D5, the couples' screens in the new planner | estimate | 5 | not begun | 0 |
| **Total** | | **37** | | **9.5 (26%)** |

The singles' launch alone, Phase 12 ready, is the first 19 days: 9.5 of them, 50%.

## The figure after each job

| when | the job finished | the whole plan | the singles' launch |
|---|---|---|---|
| 2 Nov 22:05 UTC | Phase 9 built; its budgets measured, not met | 18% | 39% |
| 3 Nov 04:16 UTC | Phase 9 merged (pull request 5); Phase 10's seven items built | 21% | 45% |
| 3 Nov 13:30 UTC | Phase 10 through its harnesses, each plant caught | 28% | 59% |
| 3 Nov 21:00 UTC | D58 recorded: step U added and Phase 11 cut, the plan 37 days (no work undone) | 26% | 50% |
