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
| Phase 10, isolation and the projection | to 11 Nov | 4 | merged (pull request 6) | 4 |
| Step P, cutting the cost | to 6 Nov | 2 | merged (pull request 7) | 2 |
| Step U, the new planner (D58) | to 10 Nov | 4 | merged (pull request 8) | 4 |
| Phase 11, the phone on the new planner | to 11 Nov | 1 | merged (pull request 9) | 1 |
| Phase 12, the beta's switch between the two planners | to 13 Nov | 2 | merged (pull request 10): the beta started | 2 |
| Couples D1 to D3 | 13 to 19 Nov | 6 | built (`PART-D.md`), on the working branch | 6 |
| Couples D4, pilot, registration and run | from 20 Nov, about a week | 7 | built, registered and ruled (D61), run from 7 Nov; stopped unread on 10 Nov with 76 of 520 chunks finished (D66), to run once more on the code after the review's items 2 to 5: the panel, the pilot and the sizing kept; the registration again (`couples-d4b.md`), the run and the read to come: 3 of its 6 items | 3.5 |
| The review of 9 Nov, items 2 to 9 (D66) | its own times | 8 | item 2 done (three hours of its own times); item 9 done (half a day); item 8's caption in (two hours); item 3 in (two and a half days), item 4 in (four hours) and item 5 in with its experiment read and to the maintainer (a day), all on the working branch, to `main` after the beta; item 6's stage A read and stage B in (of its day and seven-eighths, all but stage C, which waits on the re-run); item 7 read (a day): neither width passes, so the item stops | 7.525 |
| The review's item 10, the solve on anchors and shortlists (D68) | its own times | 1.5 | its check against the review done on a scratch tree; stage A (a day) run and read with gate 5 (`results-speed-a.txt`, `results-gate5-speed.txt`), to the maintainer; stage B (half a day) after a ruling naming the run | 1 |
| Couples D5, the couples' screens in the new planner | estimate | 5 | not begun | 0 |
| **Total** | | **46.5** | | **37.025 (80%)** |

The singles' launch alone, Phase 12 ready, is the first 19 days: all 19 of them, 100%.

## The figure after each job

| when | the job finished | the whole plan | the singles' launch |
|---|---|---|---|
| 2 Nov 22:05 UTC | Phase 9 built; its budgets measured, not met | 18% | 39% |
| 3 Nov 04:16 UTC | Phase 9 merged (pull request 5); Phase 10's seven items built | 21% | 45% |
| 3 Nov 13:30 UTC | Phase 10 through its harnesses, each plant caught | 28% | 59% |
| 3 Nov 21:00 UTC | D58 recorded: step U added and Phase 11 cut, the plan 37 days (no work undone) | 26% | 50% |
| 4 Nov 05:02 UTC | Phase 10 merged (pull request 6) | 27% | 53% |
| 5 Nov 03:08 UTC | Step P merged (pull request 7); step U built, its plants caught | 35% | 67% |
| 5 Nov 17:26 UTC | Step U merged (pull request 8) | 43% | 84% |
| 6 Nov 07:52 UTC | Phase 11 merged (pull request 9) | 46% | 89% |
| 6 Nov 19:35 UTC | Phase 12 merged (pull request 10): the readiness checklist all PASS, the beta started | 51% | 100% |
| 6 Nov 20:40 UTC | Part D's D1 built: the couples' rollout's three gaps, and its year at the move's level | 54% | 100% |
| 7 Nov 12:19 UTC | Part D's D2 built: a couple's tables at the candidate's settings, tiers per person, the engine running a solved couple, the bridge with the household's money (O11) | 62% | 100% |
| 7 Nov 14:22 UTC | Part D's D3 built: the levers for couples, the lever matrix on two couples | 68% | 100% |
| 7 Nov 18:20 UTC | Part D's D4 built and registered, the design re-review's PASS: to the maintainer before its run | 80% | 100% |
| 8 Nov 18:40 UTC | D62's site change merged (pull request 11): the quick start's contributions, the phone's four-way split, phone-perf's ceiling, the browser check page gone; outside the calendar's steps, so no weight | 80% | 100% |
| 10 Nov 08:44 UTC | D4 stopped unread (D66, the review of 9 Nov): its registration to be made again, and the review's items 2 to 9 added, eight days by its own times; the plan 45 days, no work lost but D4's units | 63% | 100% |
| 10 Nov UTC | The review's item 2 ported (`COUPLE.fast`): a couple's path ranked from the shared scores, exact, `couple-rank.test.mjs` | 64% | 100% |
| 10 Nov 16:30 UTC | Item 9 in (the two-stage rule's exact rates) and item 8's caption; item 10 added (D68), a day and a half; items 3 and 4 to the external review (item 4's STOP, item 3's pins) | 64% | 100% |
| 11 Nov 01:05 UTC | Items 3, 4 and 5 committed (the engine's year in HMRC's order, relief on money the plan pays into a pension, the pages naming the sweep), item 6's stage B, item 5's experiment read (EXPLORATORY: passes, to the maintainer); items 7 and 10's stage A registered as exploratory and built | 76% | 100% |
| 11 Nov 08:45 UTC | Items 7 and 10's stage A read with gate 5 (EXPLORATORY): item 7 stops (neither width passes); item 10's ON passes 1 to 4, the reducer's part 5 FAILS on gate 5's half (no gate 5 household without a bridge year), REF passes; to the maintainer | 80% | 100% |
