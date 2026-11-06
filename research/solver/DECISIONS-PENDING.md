# Open decisions and where the plan stands (1 Nov)

An index for finalising the plan. Each item names the file that holds its detail. Where the work stands in full is
`STATE.md`; the rules are `CHECKLIST.md`. The plan from 1 Nov is the launch plan
(`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at 0e24e1b), adopted by the maintainer as
D51 to D54, and at 90fcb10 since D58 (step U, Phases 11 and 12 and Part D's D5 recast).

## Where it stands

- **The candidate.** It passed Phase 4 against the app's rules and the product's settings (`results-phase4.txt`). It
  ships behind Part C's switch (D40), with the failure year charged at what it can pay (D43). The launch candidate is
  d71f65ae871e with the floor at 80% of target (B2) and the dial's positions on its locked tiers (B3, D54).
- **Part C** (`PART-C-PLAN.md`, single households only, D42), in the launch plan's order:
  - Phase 7, the plumbing (`PHASE-7.md`), is merged to `main` (pull request 2).
  - Step 0 (CI and the hooks, B14) is accepted.
  - Phase 8, the Config tab (`PHASE-8.md`), is merged to `main` (pull request 3, 8b54321) on B1's gate (D55: the
    browser harnesses in both modes, the engine suites in CI).
  - Step L (the levers; L4 and L5 read) is merged to `main` (pull request 4, 3370960) on B1's gate.
  - Phase 9, the Strategy tab (`PHASE-9.md`), is merged to `main` (pull request 5, 725c661) on B1's gate, its budgets
    recorded as not met (D56), step P taking the chooser's cost per path first.
  - Phase 10, isolation and the projection (`PHASE-10.md`), is merged to `main` (pull request 6, 08dcff6) on B1's
    gate.
  - Step P, the cost (the cuts exact, Phase 9's budgets met again, gate 5 MET; the 30-point preview not shipped by R5 (a)),
    is merged to `main` (pull request 7, 6e3e4e0) on B1's gate.
  - Step U, the new planner (D58: `research/reviews/2026-11-03/LAYOUT.md`, the launch plan at 90fcb10), is merged to
    `main` (pull request 8, d3e9fe8) on B1's gate, behind the beta.
  - Phase 11, the phone on the new planner (`PHASE-11.md`), is merged to `main` (pull request 9, 9407889) on B1's gate.
  - Then Phase 12 as recast (under way, `PHASE-12.md`); couples as Part D during the singles' beta (B9), D5 the couples'
    screens in the new planner.
- **The research queue** (B7, EXPLORATORY): GAIN-BUCKET read (`results-gainbucket.txt`, STATE.md's open items): survival
  unchanged; spending beyond noise on three households, two up and one down, each under a fiftieth of a percent of lifetime
  spending. By B7 a gain is a v2 proposal: to the maintainer, below. The windfall factorial is next, whenever cores are free.
- **Research options built, off by default, not run** (EXPLORATORY): the windfall split (`WINDFALL-SPLIT.md`), the
  savings split (`SAVINGS-SPLIT.md`), the age weights and the candidate's tiers (D48, wired by L2 under B3).

## The twelve decisions of 31 Oct, closed on 1 Nov

| # | decision | closed by |
|---|---|---|
| 1 | Merge Phase 8 to `main` | B1 (D51): the agent merges each step's pull request, from a release branch cut at the gate's commit, once `run-all.sh` prints ALL REQUIRED GREEN in both modes, both CI tiers are green on its head and each new test has failed on its plant. |
| 2 | The spending curve's wording: three questions | B4 (D51): the length of the dip; three years; no second rate in the headline; the agent's proposal for a household still working; built as a table of strings. |
| 3 | A higher estate priority than the default | B12 (D51): not now. |
| 4 | The lump sum's route | B12 (D51): the lock alone. |
| 5 | The windfall split's factorial | B7 (D51): in the research queue, second, whenever cores are free, EXPLORATORY, deciding nothing. |
| 6 | The savings split's factorial | B7 (D51): in the research queue, third, at 4,000 paths. |
| 7 | The gain bucket on the candidate's harvest moves (GAIN-BUCKET) | B7 (D51): in the research queue, first, at the 20 households whose taxable account is 10% of wealth or more (about 8 core-hours). |
| 8 | `pay-where.test.mjs` out of the fast suite | B8 (D51, D53): out; it stays in the full tier. |
| 9 | Couples in the solver | B9 (D51): Part D, built during the singles' beta; D4's registration to the maintainer before its run. |
| 10 | Cross-origin isolation in production | B5 (D51): a service worker on GitHub Pages, in Phase 10; the one-worker fallback kept. |
| 11 | Held unless asked (D44 (3)) | B12 (D51): set aside. |
| 12 | The nightly run has never fired | B14 (D51): no nightly run; the full tier on every push in its own workflow (two shards, one run at a time per branch), weekly on `main`, and a watchdog at the session start. Since: it fired once, after this was written (Verify 138 on `main` at 899e5f0, created 1 Nov 09:18 UTC, seven hours after its 02:17 cron; green; the suite 1 h 58 min of the 300-minute cap, on a `main` without the tests added since, the gaps sweep among them); none on 2 Nov by 07:37 UTC. The schedule leaves `main` with Phase 8's merge. |

Also decided on 1 Nov: B2 (the floor at 80%), B3 with B3a (the dial's positions, the age weights: D54), B6 (a per-browser
opt-in for the beta), B10 (the phone at 45 points), B11 (the age dial on request), B13 (the bridge safety margin hidden
for singles under the switch), and the rules R1 to R6 that decide on their measurements (D52).

## What still comes to the maintainer (the launch plan, section 5's stops)

- An unlock the plan needs that D53 did not give (a later edit to a protected test asks again).
- The couples' registration (D4) before its run, and its read.
- The beta's switch to on by default, and the switch's removal.
- Any change of default not settled in section 3.
- Any result showing the launch candidate harming a household beyond D34's threshold, or a defect that changes a figure:
  at once.
- A time box running out; a red CI not fixed within a session.
- The reads of L4 and L5 (as reports; R1 to R3 decide them), and what R2 leaves off the dial.
- **Open now: GAIN-BUCKET's v2 proposal (B7).** The gain axis interpolated (`gainInterp`) against the candidate's nearest
  bucket: survival no effect beyond noise; spending up on two households and down on one, each tiny (`results-gainbucket.txt`;
  the read's review, `reviews/2026-11-03-read-gainbucket.md`). The choice: a registered v2 test after the launch, or
  declined as immaterial. Beside it (the re-review's MINOR): the count depends on the test, chosen after seeing the data. The
  sign-flip test of the mean, the figure reported, flags three households; an exact sign test, which reads the typical path,
  flags seven, four up and three down, one of them down although its mean is up. The verdict is a gain under either. Also
  reported: the run took about twice its pilot's core-hours.
- **Open now: phone-perf's long-task ceiling** (2,200ms, set 30 Oct on the maintainer's call). Step U's gate read one
  pass over it on bytes that had passed hours before. Twelve alternated runs on a quiet machine put step U's site build at or
  below main's, and main's own build over the ceiling on three of its six (`results-phone-perf-step-u.txt`): the ceiling sits
  inside main's spread on this machine, so a gate can fail it by chance. The choice: move it, as on 30 Oct, or keep it and
  re-measure when it fails. Kept until then.
- **Open now: the Safari and Firefox solve** (the readiness checklist's line 6; Phase 12). WebKit and Firefox cannot be installed
  here, so it is your devices, as the launch plan allows: open `browser-check.html` on Phase 12's preview link in Safari and in
  Firefox, press Start, and send back the block it shows (a sample household, not yours; your plan is not touched). By R6 the
  opt-in goes on `main` only when this line passes with the rest.
- **Reported from Phase 11: the phone's budget** (two parts for a solve with a base on a touch device, set in the harness's
  browser, not on a phone: `results-phone-memory.txt`), yours to move; and **a restored solve's paths run on one worker**
  (back at the dial's default the figures take longer than after a fresh split solve), not changed.
- **Open now: the contribution fields in the quick start** (your report on step U's preview): they are in You, Your money, and
  the quick start now points there; asking for them in the quick start itself goes beyond LAYOUT.md, so it is your call.
- **Noted: load-perf's switch-on ceiling** is at D58 (2)'s limit (`results-load-perf-step-u.txt`): the next kilobyte on a
  switch-on build's classic first load comes to the maintainer.
