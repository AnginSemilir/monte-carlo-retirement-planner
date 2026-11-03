# Progress through the launch plan

The maintainer asked on 2 Nov: from the external reviewer's rework of the plan (the launch plan of 1 Nov,
`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at 0e24e1b, adopted as D51) at 0%, to the end
of the plan at 100%, the figure after each finished job.

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
| Phase 9, the Strategy tab | to 7 Nov | 3 | built and pushed; budgets measured and not met, the maintainer's call; no pull request yet (3 of 4 items) | 2.25 |
| Phase 10, isolation and the projection | to 11 Nov | 4 | begun on the branch (1 of 4 items) | 1 |
| Step P, cutting the cost | to 13 Nov | 2 | not begun | 0 |
| Phase 11, the phone | to 15 Nov | 2 | not begun | 0 |
| Phase 12, the beta's switch | to 17 Nov | 2 | not begun | 0 |
| Couples D1 to D3 | 17 to 23 Nov | 6 | not begun | 0 |
| Couples D4, pilot, registration and run | from 24 Nov, about a week | 7 | not begun | 0 |
| Couples D5, before the couples' beta | estimate | 5 | not begun | 0 |
| **Total** | | **34** | | **6.25 (18%)** |

The singles' launch alone, Phase 12 ready, is the first 16 days: 6.25 of them, 39%.

## The figure after each job

| when | the job finished | the whole plan | the singles' launch |
|---|---|---|---|
| 2 Nov 22:05 UTC | Phase 9 built; its budgets measured, not met | 18% | 39% |
