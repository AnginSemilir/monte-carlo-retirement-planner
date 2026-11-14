# Open decisions and where the plan stands (1 Nov)

An index for finalising the plan. Each item names the file that holds its detail. Where the work stands in full is
`STATE.md`; the rules are `CHECKLIST.md`. The plan from 1 Nov is the launch plan
(`research/reviews/2026-11-01/LAUNCH-PLAN.md` on review/external-2026-10-21 at 0e24e1b), adopted by the maintainer as
D51 to D54, and at 90fcb10 since D58 (step U, Phases 11 and 12 and Part D's D5 recast).

## The order from 12 Nov (D91)

The maintainer, 12 Nov: the app is for the maintainer alone for now and has not been launched properly; the link and the
repository are public, knowingly. So no beta with users is under way and nothing waits on a beta's end. Where a line
below this section says "the beta", read it as history. The order from here:

**RULED (D101, 14 Nov, afternoon): the new planner's first-load ceiling to 240KB.** B1's gate on the third batch found the
new planner's first load on an empty plan at 239KB against its ceiling of 237KB, a saved plan at 235KB. The growth since
batch 3's first gate is about 1.2KB compressed: the speed mode's and the couples' screens' code, not the engine's, so by
D94 (2) it stopped for the maintainer. The maintainer: "Go with your recco": the measured figure plus one, 240KB, with a
dated note in `load-perf-ui.cjs`; the classic mode run again on it.

**RULED (D100, 14 Nov, afternoon): couples in the other order get their own test.** The maintainer: "Ensure a follow up test
is placed in the plan so we can open up couples in the other order." Since D99 the solver plans for an uneven couple only
when the older partner is entered first, as every couple stage C tested was. The test, in full in `PART-D.md` D7:
- stage A, EXPLORATORY: the joint estate weight made the same whichever partner is entered first (couples entered elder
  first unchanged bit for bit), then stage C's couples entered both ways and compared on the same paths;
- stage B, registered on a new held-out seed: the couples entered the other way against the app's rules by stage C's rule.
  Its PASS opens the guard for them, the reviewer on the change of default.

It comes after the share ensemble, ahead of (c) to (e) below. Stage B's registration comes to the maintainer before its
launch, as stage C's did, unless the maintainer says to launch it once its design review passes.

**RULED (D98, 14 Nov, morning): "Agreed with all"**, on the agent's reply to D97: (2) as read, a couple's tie rule
passing its rule joins the couples' candidate with no further word (the reviewer on the change of default); (3) the speed
mode's warnings as drafted, for a single: "Speed mode works out your figures about twice as fast by looking at fewer
options in each simulated year. In our tests it very slightly lowered the chance your money lasts: about 2 in 10,000 on
average, and at most about 2 in 1,000. This year's recommended actions still use every option." and for a couple: "For
couples, speed mode is less tested. It ranged from slightly slower to nearly twice as fast, and it spent a little less and
held slightly less in shares than the full calculation. Use the full calculation for decisions."; (4) the harvest
ceiling's allowance step offered at both places, where it stood before and where it stands now, the solver choosing:
built off in code with its test, read EXPLORATORY by its rule committed first, its passing the ruling naming the run (in
the candidate, the reviewer on the change of default), failing closed and reported.

**RULED (D97, 14 Nov, morning): the four items of the morning report.** The maintainer: "1 - go with your
recommendation 2 - add the test to the plan after couples, but don't wait for me to ok it. 3 - run a wider test on it.
For now add as an optional 'beta - speed mode' toggle with a warning to singles and couples. 4 - wouldn't the point of
backward induction be that we don't add a hardcoded rule and let the solver choose? But please let me know if this has
been disproven or is less likely to work in this scenario from tests seen so far". As the agent reads them: (1) couples
run the candidate under the opt-in once item 6's stage C has read, by its outcome (PASS: couples whose elder holds more
than 60% and at most 90% too; THE GUARD STAYS: couples outside 40% to 60% keep the app's rules; STOP: back to the
maintainer first, as the registration says), the reviewer on the change of default, merged on B1's gate; (2) a tie rule
for a couple's joint move, measured after couples are on, as item 13 was (its rule committed first, EXPLORATORY, off in
code): passing its rule is the ruling naming the run, built and in the couples' candidate with the reviewer on the change
of default and no further word; failing, closed and reported; (3) `chooserShortlist: 'order'` read again, wider, on singles
and couples (EXPLORATORY, its rule committed first, when stage C frees the cores), and meanwhile offered in the app as an
opt-in "Beta - speed mode", off by default, with a warning for singles and one for couples; (4) a question, answered in the
reply of 14 Nov: nothing so far disproves letting the solver choose; the agent's recommendation was that (the allowance's
step offered at both places, the solver choosing); building it waits on the maintainer's word. The four entries below are
kept as they were put.

**RULED (D96, 13 Nov, night): item 6's stage C, launched on the agent's three recommendations.** The maintainer:
"Proceed with your recommendation": launched as registered, at 19,000 paths a unit, no mirror. It runs once batch 2's
gate ends, from a worktree at the commit recording D96; its read comes back with the outcome as registered. In full:
`reports/2026-11-13-stage-c-registration.md`; the registration `registrations/couples-share.md`, its design review's PASS
after one fix. Twelve held-out couples, 36 units (each re-held 75/25 and 90/10, and once with a DB pension, an existing gain or
a state pension age of 67), seed 7022, about 61 core-hours. Three choices: (1) launch: the agent recommends yes; (2) the
paths: 19,000 a unit (D34's rate held only below about 12% discordance; D61's choice for D4, yours here) or 30,000 (about 95
core-hours); the agent recommends 19,000; (3) the mirror, the younger partner holding more (about 40 core-hours more): the agent
recommends not now, so a PASS lifts the guard only where the elder holds 60% to 90%.

**For the maintainer and the external review (13 Nov, night): the harvest ceiling's allowance step trades tax for pot
below the cap.** `results-ceiling-lead.txt` (EXPLORATORY, seed 7002; `CEILING-LEAD.md`); the reviewer at the read: PASS,
three MINORs (`reviews/2026-11-13-read-ceiling-lead.md`). The ceiling (on `main` since the first batch) moved the
allowance's ceiling down to where the year's bill would first rise. On the three households with most in the taxable
account, that one step is 95% of the extra tax they pay on paths that end below the estate cap (S090: about £11,000 over
a lifetime). On the same paths it also leaves a larger pot (S090: about £29,000 more on average; the pot capped at the
estate cap, over all paths, about £26,500 or 2% more). With the allowance's step as before, survival is a shade higher
(pooled +0.02 points, at the edge of noise) and spending a hair higher, for less tax and a smaller pot. How the step
does it is not shown: the runs store no moves. With the tie-break in, the tax saving above the cap that the ceiling's
first read showed is gone; the ceiling still passes its own rule. By this test's rule nothing changes in the code: the
question goes to the external review with the trade as it stands, whether the allowance's step should also be offered
at its old place so the solver chooses between the two. The agent's view: worth asking, as a trade rather than a loss;
a small change with its own test if the review agrees.

**For the maintainer (13 Nov, evening): the couples' tier test reads "both"; a tie rule for a couple's joint move?**
`results-couple-tiers.txt`; in full in `reports/2026-11-13-couples-read.md`. With consent to change risk withdrawn the
younger couples' median pot recovers from 0.37 of the app's rules' to 0.79: the lower-risk funds are most of the pot's
fall, not all. What is left is not shown by the read (corrected after the reviewer, PASS with nine MINORs,
`reviews/2026-11-13-read-couple-tiers.md`): its trace of one couple, a lead, puts it mostly in tax once the tiers are
taken away, and with consent given the tiers are nearly all of the fall and tax a few percent. No tie rule reaches a
couple's joint move, and what one would save is unmeasured (pooled tax above the cap: the candidate £303,000, the
app's rules £133,000, a ceiling). The lost paths were the capital gains bill, now fixed and replayed. The agent's
recommendation, revised: a tie rule for couples is a tax matter and need not hold couples back; measure it in the
research queue as item 13 was (its rule first, EXPLORATORY, off in code until ruled), and have the couples' screens
say the smaller pot is the price of the lower-risk funds. By the test's own rule nothing is built until the maintainer
says.

**For the maintainer (13 Nov): item 12 is closed; the shortlist's trade (D90 (2)).** Item 12's stage A read
(`results-item12-a.txt`, EXPLORATORY): neither arm passes, so by D84 item 12 is closed and nothing is built. Both fail
the same two parts, narrowly: spending delivered 0.11 and 0.12 points of target lower (the bar 0.1), and two couples'
equity weight just over a point from the whole menu's. Survival, the pot and tax hold. The first arm is the built
shortlist (`chooserShortlist: 'order'`) on a couple's path, so the trade D90 (2) left open now reads: for a single, a
path about 1.9 times as fast for a pooled 0.019 points of survival, beyond noise (`results-tie-a.txt`); for a couple,
a path 0.9 to 1.8 times as fast and a fail of its own rule on spending and on the risk held. The agent's
recommendation: leave the shortlist off. Its guard stays in, so it costs nothing where it is. Switching it on is the
maintainer's.
The reviewer at the read (`reviews/2026-11-13-read-item12-a.md`: PASS) adds, beside "closed": the spending fail is
real on these paths but depends on which couples were drawn (without any one of three couples the first arm would hold
that part; the review's own eight held it); the risk drifts towards less equity, by just over a point on two couples;
the first arm would pass only with both of those couples left out, the second not even then; one couple (S253) loses
survival beyond noise in both arms while the pooled figure is level; and the run was on the code before the harvest
ceiling and the capital gains bill's fix. The rule was the maintainer's and is not run again by the agent; if the
maintainer wants item 12 read again on other couples or on the current engine, that is a new ruling.

**For the maintainer (13 Nov): the couples' re-run has read, PASS; do couples run the candidate under the switch?**
In full: `reports/2026-11-13-couples-read.md`. On 40 held-out couples the candidate against the app's rules: survival
about +10 points and spending delivered +6.5% (the standard estate weight), no harm flag. Beside it, from the reviewer
at the read: a couple spends less in its first retired years; the pot left is much smaller (the giveaway above the
estate cap, which the tie-break as built does not reach in a couple's joint move); the gain is the gain at an 85%
landing; a few paths are lost that the app's rules keep. The deep review (`reviews/2026-11-13-deep-couples-d4b.md`): the PASS is
sound for survival and spending; the smaller pot is probably the lower-risk funds the solver holds, not the giveaway
(capped, the pot is level with the app's rules'); the paths lost in one year are an engine defect (one person's capital
gains bill cannot be paid from the other's ISA or pension), in every arm. The agent's recommendation: yes, under the
opt-in, after (1) that defect's fix with its test, (2) the deep review's one test, the couples' tier test (EXPLORATORY,
about five core-hours), which says whether anything in the solver must change first, (3) the tie-break for singles
(D90 (1)), (4) item 6's stage C, (5) Part D's D5, the couples' screens showing the early cut and the pot plainly; a
couple outside 40% to 60% keeps the app's rules until item 6 reads (M4). The agent carries on with (1) to (5) in that
order meanwhile; switching couples on waits for the maintainer's word.

**RULED (D94, 13 Nov): "Proceed with your recommendations"**: the stage gate and the read amended for S293's one
difference, reviewed before use, the chunks kept (the fallback: fix the audit and run the first stage again); the first
load's ceilings at the measured figures plus one, 235 and 237, engine code moving them the same way at a later batch.
The two entries below are kept as they were put.

**For the maintainer (13 Nov): the first load's size, and the gate's reference.** B1's gate on the first batch came
back red in both modes, so nothing is merged (`results-reference.txt`; STATE.md section 5).
- *The ruling needed: the first load's ceilings.* On the working branch's head the classic planner's first load is
  234KB against its ceiling of 232, which is D58 (2)'s limit, and the new planner's is 234KB (a saved plan) and 236KB
  (an empty one) against 234. `main` reads 232 and 232 / 233. The growth is the engine's own code: the year in HMRC's
  order, relief on pension contributions, the pages naming the sweep, the harvest ceiling. Options: (1) the ceilings
  move to the measured figures plus one, 235 and 237, as D57 and D58 (2) did, and a later batch whose growth is engine
  code moves them the same way, reported at its merge (the agent's recommendation: it saves a stop at every batch that
  corrects the tax engine); (2) the same, this once; (3) hold 232 and 234: the agent looks for about 3KB to move out of
  the first load before anything merges, box half a day, with no promise it is there.
- *Done, for the maintainer's eye: where the harnesses' reference is worked out.* The container's restart brought a
  newer Chromium, and its exp and log no longer agree with Node's to the last place; `main`'s own code fails the
  bit-for-bit checks here. The reference is now the same source, unbundled, run in the harness's own browser
  (`research/ui-harnesses/lib/reference.cjs`), so the checks are bit for bit again and now cover the money too; what
  they no longer hold is that a browser computes exactly what Node does, which stopped being true. Say if this should
  be done another way.
- *Read, for the maintainer's eye: the harvest ceiling's step 4 passes its rule* (`results-harvest-ceiling-solved.txt`;
  the reviewer's PASS, `reviews/2026-11-13-read-harvest-ceiling.md`), so by the rule it goes to `main` with the first
  batch. What the pooled figures hide: the lower tax and larger pot are two households' (S328F, S340F), on paths that
  end above the estate cap; on paths at or below the cap lifetime tax is higher on S090 (about a fifth), S328F and
  S030, the three with most money in the taxable account. Survival is a shade lower, beyond noise and well inside the
  rule. A lead, not shown: under the review's rule the allowance's ceiling now stops where the year's bill would first
  rise, which removes a slice these households drew cheaply. The agent runs the one test that would tell (EXPLORATORY)
  after item 12's stage A and brings it back; if it shows the allowance's step is the cost, that is a question for the
  external review, not a change the agent makes.
- *Done: the skip costs' fixture* is S064 where it was S116, whose re-wrap costs nothing to skip on the new code.

**STOP (13 Nov): the couples' re-run's stage gate refused.** The first stage's 200 chunks are in and backed up; the
registered stage gate decided nothing, because S293's solver arms and APP were run on plans that hash differently. The
cause, from the plans alone: the second person's MPAA age (58 against 60), a derived field that moves no money on this
couple (`results-d4b-plan-check.txt`). No outcome of seed 7021 has been read. Every route forward changes a stamped
file, so it is the maintainer's: (1) amend the gate and the read for this one known difference, reviewed before use,
and keep the chunks (the agent's recommendation); (2) fix the cause in the audit and run the first stage again, about
twelve hours of four cores; (3) drop S293, not recommended. In full: `reports/2026-11-13-d4b-stage-gate.md`.

1. **The improvements laid out**, in this order; the first not done is the next.
   - **On `main`:** batches 1 and 2 (pull requests 12 and 13): the newest candidate (D73; D95's tie-break for singles),
     the engine's year in HMRC's order (item 3), relief on money paid into a pension (item 4), the pages naming the sweep
     (item 5), item 8's caption, a couple's path faster (items 2 and 11), Part D's D1 to D3, the harvest ceiling, the
     capital gains bill's fix; built and off: `shareRule: 'pots'` (item 6), `chooserShortlist: 'order'` with its guard
     (item 7).
   - **Batch 3, at its gate (14 Nov):** Part D's D5 behind `COUPLES` (off), the store in chunks, a restored solve shared
     across its parts, the limits per person.
   - **Read (14 Nov): item 6's stage C, PASS** (`results-couples-share.txt`; in plain words and in full,
     `reports/2026-11-14-stage-c-read.md`): every one of the 36 units gains on the app's rules, none flagged; the pooled
     gain over the 24 re-held units +10.7 points (+10.4 to +10.9). By the registration and D97 (1) it decides the couples'
     default (`shareRule: 'pots'`) and lifts the guard for couples whose elder holds more than 60% and at most 90%. The
     reviewer at the read: PASS, six MINORs, the write-up corrected (by unit the gain is survival's: the median pot lower
     on 20 of 24 uneven units, tax higher on 10 of 36, spending lower on 5 of 36, the oldest couples). The deep review: the
     PASS sound; **the guard opens only where the older partner is entered first**, as every tested couple was: the joint
     move weighs both estates at the first person's own weight, which for an elder entered second would be three to nine
     times any tested (D99 holds them back, "for what the panel tested"). Two leads for the maintainer, neither blocking:
     the share is read from today's pots alone, not from each person's incomes (its one test, a share ensemble,
     EXPLORATORY, about 6 core-hours, queued after the gate); and the joint estate weight itself (a household-level weight
     would need its own test). For the maintainer's UI work: the couples' screens should say the pot is smaller on most
     uneven couples, tax higher on the long-horizon ones, and the oldest couples gain survival, not spending.
   - **Next, in this order (D97):** (a) the speed mode: `chooserShortlist: 'order'` offered as an opt-in "Beta - speed
     mode", off by default, a warning for singles and one for couples, with its tests, to `main` with the next batch
     (built, 11293476; its browser checks to run); (b) couples on under the opt-in by stage C's PASS (D99, built 14 Nov): the
     share rule, the guard on the elder's share and the switch, in one commit with the D-line naming the run
     (`couple-default.test.mjs`; `PART-D.md` D6), the reviewer on the change of default, then one gate for batch 3, the
     speed mode and couples on; then the share ensemble (`SHARE-ENSEMBLE.md`, its rule committed, EXPLORATORY) and
     couples in the other order (D100: `PART-D.md` D7, stage A EXPLORATORY, then stage B registered, its PASS opening the
     guard for the elder entered second); the guard's age cap (a partner who would pass 120 before the plan ends kept on the
     app's rules, with its check: the reviewer on D99, second round, MINOR 1), with the next batch; a couple's solve
     measured on the phone's budget (each part holds both tables;
     Phase 11 measured a single's), before sharing publicly; (c) the
     shortlist's wider read (EXPLORATORY, its rule committed first) when stage C frees the cores, to the maintainer;
     (d) after couples are on, a tie rule for a couple's joint move (EXPLORATORY, its rule committed first): passing, it
     joins the couples' candidate without another word, the reviewer on the change of default; failing, closed and
     reported; (e) the harvest ceiling's allowance step offered at both places, the solver choosing (D98): built off
     with its test, read EXPLORATORY by its rule committed first; passing, it joins the candidate without another word,
     the reviewer on the change of default; failing, closed and reported.
   - **Whenever cores are free:** the research queue (B7), the windfall factorial then the savings factorial,
     EXPLORATORY; a gain comes to the maintainer as a proposal with its registered test.
   - **Open with the maintainer** (below): M3, M6, the cash buffer's size as a lever, `survivalChangeU`'s interval.
2. **The maintainer's work on the UI.** Its scope is the maintainer's; nothing is planned for it here yet.
3. **Sharing it publicly.** Before it: the readiness checklist taken again on that commit, and the maintainer's word on
   the solver on by default and the switch's removal.

**RULED (D92, 12 Nov): when `main` takes the work.** "Merge each batch as it passes the gate." `main`, which the public
link serves, runs the launch candidate; everything under "Built" is ahead of it and is the first batch, gated when the
re-run's cores are free (the gate's browser harnesses time themselves, so they are not run beside it). Each batch after
it merges the same way, on B1's gate, from a release branch cut at the gate's commit.

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
- The solver on by default, and the switch's removal: before sharing it publicly (D91).
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
- **Items 5 and 10 ruled (D73, 11 Nov) and ported (4e6c6a09; D74, D82, D83): the candidate is af001697ce1b.** The reviewer on the change of
  default: FAIL, then PASS after one fix (`reviews/2026-11-11-default-d73.md`, `2026-11-12-default-d73-2.md`). Item 7 answered by the
  external review and read again in item 13's stage A (D85, D86).
- **Noted for the maintainer (D88, 12 Nov): the sweep as the solver's own choice is not built.** The destination is not a
  real choice (the ISA is never worse than the taxable account in tax, access or allowance). What would be one is how much
  is kept in cash: the cash buffer's size, a standing rule (D18), the same for singles and couples and in every arm so far.
  Making it a lever is new solver work with its own experiment (the windfall split, D37, is the nearest thing built). Say if
  it should join the research queue.
- **Read, passing (D89): what D73's sweep to the ISA means for a couple, measured before the re-run (`COUPLE-SWEEP.md`, `results-couple-sweep.txt`, EXPLORATORY).** All three parts of the rule hold. For the maintainer to know: the pot's part
  holds on one couple (S059, whose cash ISA money is the largest); six of the twelve leave a smaller mean pot under the sweep to
  the ISA, with survival the same or higher on ten of the twelve and no loss beyond noise. As D87 put it:
  The maintainer, after "go with your recommendations" and before the launch: "but is a fixed rule here really the best way to do
  this? are we sure of that?" The agent's reply: not sure. Measured: the sweep to the ISA against the sweep to the taxable
  account on singles alone (item 5, `results-isasweep.txt`, EXPLORATORY). Not measured: either on a couple; the sweep as the
  solver's own choice (never built; the windfall split, D37, is the nearest, off, its factorial not run). Options: (1) launch
  as it stands, the sweep to the ISA for couples; (2) first the two fixed sweeps side by side on touched couples outside the
  panel, EXPLORATORY, about half a day, then launch on what holds; (3) build the sweep as a solver choice first: days, and the
  couples landed and reviewed again. The agent would take (1), with (2) run afterwards as a check. As it was first put: The reviewer found that a couple's joint
  move left the sweep out, so under tables solved for the ISA the engine swept a couple's cash ISAs to the taxable account
  (S059: all of it). The agent chose: a couple's move carries the sweep its tables were solved with (0b047efd,
  `couple-sweep.test.mjs`), so couples get item 5 as singles do. The other reading: a couple's person-solves leave the key
  out, and couples keep the sweep to the taxable account until measured (item 5's experiment was on singles). The couples
  are landed and piloted on the first reading; choosing the second means a small code change, landing again (ten minutes),
  the pilot and the design review again, before any launch.
  The design review of the revised registration (`reviews/2026-11-12-couples-d4b-design-2.md`, MINOR 5): most of the
  panel's couples hold cash ISA money, so the choice touches most of the panel; launching `couples-d4b.md` as it stands is
  choosing the first reading, and the read has no split by cash ISA holding. A word from the maintainer before the launch
  settles it, recorded as its own D-line.
- **LAUNCHED by D88 and D89, the couples' sweep check having passed: the couples' re-run** (`registrations/couples-d4b.md`, complete; its
  design review PASS, eight MINORs, none blocking). It was launched 12 Nov 12:27 UK from a worktree at 4e4174b1, the commit recording the sweep check's read: the
  registration's blob, `src/`, the engine and the audit's stamp files the same there as at the registration's own commit
  (e6f0179a; the reviewer checked it, `reviews/2026-11-12-read-couple-sweep.md`).
- **RULED (D90, 12 Nov): switching on `tieAboveCap` (D85) and `chooserShortlist: 'order'` (D86).** "I agree with your
  recommendations" (`reports/2026-11-12-stage-b-switch-on.md`; the figures in `results-stage-b-figures.txt`, EXPLORATORY).
  (1) The tie-break joins the candidate after the couples' re-run's read, never between (D78, D80); its wait for the
  beta's end lapsed with the beta (D91). (2) The shortlist is not switched on as built. Its guard is in: a decision the pages
  show is made on the whole menu whatever the solve was handed (`wholeMenu`, `shownPolicy`; `shortlist-shown.test.mjs`,
  `results-shortlist-shown.txt`; `reports/2026-11-12-shortlist-guard.md`). **Still to come back to the maintainer, after
  item 12's stage A has read its effect on a couple's path (D84):** the trade itself, about half a path's time against
  the survival its read lost (pooled, and on S030 and S370), and with it one point the guard leaves open: the first
  year's move the counted paths take is the shortlist's, the page's the whole menu's; where they differ the survival
  shown is of a first year the page does not show (the same move on the one household the test compares, S328F).
- **The couples' re-run: held (D71, 11 Nov) until items 5 and 10 are ported (D73) and item 7 is settled, then landed again; the registration revised after the external review's SHIPC write-up.** As it stood (`registrations/couples-d4b.md`, its design review's PASS):
  On the same 40 couples (landed again) and seed 7021, on the code after items 2 to 5, in item 9's two stages, its budget
  about 188 core-hours if every couple and weight stops at the first stage as the pilot suggests (about 51 hours on one
  four-core session, about 13 over four), 673 at most. To decide: launch it; and whether to run it in up to four cloud
  sessions (item 1, part 3). Item 5's ruling first, if it is to be the default for couples: a change of code means landing
  again and a new pilot.
