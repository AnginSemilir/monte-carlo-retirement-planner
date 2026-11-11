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
  - Phase 12, the opt-in between the two planners (`PHASE-12.md`), is merged to `main` (pull request 10, 0ee3a3b) on
    B1's gate, its readiness checklist all PASS (eight lines, D60): the beta started (R6). Then couples as Part D during
    the singles' beta (B9), D5 the couples' screens in the new planner.
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
- **Closed on 8 Nov (D62), the seven items left open on 7 Nov**, the maintainer: "1,2 ho with your recommendations, 3b, 4b,
  5,6,7 your recommendations". (1) GAIN-BUCKET's v2 test declined as immaterial (B7): survival unchanged, spending beyond
  noise on three households, two up and one down, each under a fiftieth of a percent of lifetime spending (`results-gainbucket.txt`);
  `gainInterp` stays a research option, off. (2) phone-perf's long-task ceiling moved from 2,200ms to 2,700ms, above main's
  own worst in twelve alternated runs (`results-phone-perf-step-u.txt`). (3) The quick start asks each pot's annual
  contribution and the contribution's yearly increase, beside its balance (beyond LAYOUT.md section 5, which pointed to You,
  Your money). (4) The phone's budget lifted: a solve with a base splits four ways on a touch device, as on any other
  (faster, at more memory; set in the harness's browser, not on a phone: `results-phone-memory.txt`). (5) A restored solve's
  paths stay on one worker for the beta (speed only, never a figure). (6) The browser check page
  (`public/browser-check.html`) removed, with its Chromium harness and its reader. (7) load-perf's switch-on ceiling at D58
  (2)'s limit, noted: the next kilobyte on a switch-on build's classic first load comes to the maintainer. Items 2, 3, 4 and
  6 are one change of the site's code, from a release branch cut from `main` (Part D's code stays off it), merged on B1's
  gate.

## Open from the review of 9 Nov (D66; `research/reviews/2026-11-09/EXPERIMENTS-AND-PORTS.md` at f77ca16c)

- **Item 1's statement (a STOP, 10 Nov; closed by D67: "Keep panel, seed 7021").** D4 stopped unread with 76 of 520 chunks finished, all on `d4-backup`. The
  statement item 1 asks for ("no arrays file of D4 has been opened, and nothing of a unit's log has been read or printed
  by anyone beyond its stamp line, its second line and whether it holds a done line") cannot be made as worded: each
  log's third line (registered inputs: the couple, the unit, its cohort, its landed target, its paths) and its timings
  (the solve's seconds, the engine's seconds and milliseconds a path, the done line's seconds) were read and printed on
  9 Nov, to time the run. No outcome of any unit was printed or read, and no arrays file was decompressed (STATE.md
  section 5 has the statement in full). By item 1, the re-run then needs a new seed and couples the scan does not list,
  and the maintainer rules on the panel. The agent's recommendation: keep the panel and seed 7021, since nothing read
  carries an outcome, and record the statement as made in the re-run's registration for the design review to check.
- **M3. A one-off pension deposit: what the household pays, or what arrives?** The review's advice: ask in the input's
  label; until then typed deposits stay as they are, and item 4 fixes only the plan's own routing (the windfall split's
  pension-first variant, the staged transfers, an Auto deposit).
- **M6. The dated rules** (savings rates of 22, 42 and 47% from April 2027; NIC relief on salary sacrifice capped at
  the first £2,000 from April 2029; the thresholds frozen in cash to April 2031, held constant in real terms by the
  engine): carry them by tax year, or state the assumption? The review's advice: state it now (one line on the page,
  beside item 8's caption), and carry the 2027 savings rates when the 2027/28 figures are next updated.
- **Item 5's experiment (EXPLORATORY, `ISA-SWEEP.md`, read 11 Nov: `results-isasweep.txt`).** All three parts of its rule hold,
  so by its outcomes it comes here: a ruling naming the run would make `sweepCashIsaTo: 'isa'` the default (the sweep's cash
  ISA money to the stocks and shares ISA, using no allowance, where today it goes to the taxable account), and the pages'
  sweep line would name the ISA. Beside it, deciding nothing (D69): the pooled figures without S116. Until a ruling the
  option stays off, and the couples' re-run registers on the code's default (`couples-d4b.md`, revised first if the ruling
  comes before its launch).
- **The couples' re-run, before its run (the launch plan's stop; `registrations/couples-d4b.md`, its design review's PASS).**
  On the same 40 couples (landed again) and seed 7021, on the code after items 2 to 5, in item 9's two stages, its budget
  about 188 core-hours if every couple and weight stops at the first stage as the pilot suggests (about 51 hours on one
  four-core session, about 13 over four), 673 at most. To decide: launch it; and whether to run it in up to four cloud
  sessions (item 1, part 3). Item 5's ruling first, if it is to be the default for couples: a change of code means landing
  again and a new pilot.
