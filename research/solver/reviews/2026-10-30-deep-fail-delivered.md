# Deep review after a confirmatory read: the failure year at what it can pay (`failDelivered`), read 30 Oct

Subject: what the held-out read (registrations/fail-delivered.md; results-fail-delivered.txt, MISSED by its rule; the
review at the read, reviews/2026-10-30-read-fail-delivered.md, PASS with two MINORs) says with the records about the
curve near ruin under D43's default. HEAD cecc4a8, the read's files staged.

Read: STATE.md whole, CHECKLIST.md, the registration, results-fail-delivered.txt, the review at the read and its probes
(scratchpad rev/), the design review and re-review of 29 Oct, results-curve-dial.txt, SPENDING-CURVE.md at 37fdbf7
(sections 2, 7, 9, 10), results-phase4.txt and reviews/2026-10-28-deep-phase4.md, results-tiers.txt, PART-C-WORDING.md,
PART-C-PLAN.md; src/solver/solve.js (the objective l.636-649, raiseSurvival l.944-952, the failure price l.963-989, the
ternary site l.1147-1219, the four other failure sites l.1328, l.1413, l.1481, l.1543, chooseAction l.1663-1761,
scoreMoves l.1794-1860, productLevels l.2375-2378), grid.js (the log-odds clamp l.36-41, the wealth axis l.47-53,
l.123), audit-curve.mjs, audit-phase4.mjs runPath (l.89-105).

Ran (post hoc reads of the 40 units in results/curve-7019 and results/curve-7002; leads, not results; nothing written to
the repository but this file): the review at the read's rev/same.mjs, rev/levels.mjs and rev/pattern.mjs again, and three
of mine in the session scratchpad, deep/: split.mjs (where P2's change falls), perh.mjs (the patterns before ruin per
household and arm), earlier.mjs (the failure year's shift against the raise). No solve.

## Summary

- The read is sound and says what the registration asked: survival unchanged, lifetime spending unchanged, and no raise in
  the year before ruin. It also shows the raise moved a year earlier on a fifth of the paths that run out, followed by a
  year at the floor.
- The leading cause: the backward pass's failing cells. With the option on, a cell a year before a near-certain failure,
  where the floor can be paid but 110% cannot, is stored as "fail now at 110%": survival 0, and about one to two points
  of survival cheaper than paying.
  The chooser can never take that move. Two years before ruin it reads that cell's value, which is flat or falling in
  wealth, so the raise is free. A year later it must pay, and the failure year's new price makes it pay the floor. This is
  the second of the two candidates the brief names.
- For the product, it changes no survival, no spending and no band of the fan. It changes the advice a user would see on
  a path a year or two from ruin: 110%, then the floor, then nothing. And on 20 paths it brings ruin a year earlier.
- The one test: V4's policy ensemble with one variant, CANDD with the backward pass kept to paying moves wherever one pays
  (as the chooser is). Run on the review's eight households, seed 7002, about an hour on four cores after the option and
  its test are built.

## 1. What the result says, and what it does not

It says:
- **Survival is unchanged.** +0.003 points (-0.007 to +0.014), 3 of 32,000 paths discordant
  (results-fail-delivered.txt l.27-28). All three fail in the plan's last year with every year met and the end wealth
  below the minimum pot (the review at the read, l.87-90): the "few paths" the design review expected (finding 4,
  l.80-84). P1 is MISSED on its letter, not on substance.
- **Lifetime spending is unchanged.** -0.0072% (-0.0089 to -0.0056) (results-fail-delivered.txt l.29). The band's edges
  lie about 120 se from zero, so P2 tests materiality, not the predicted -0.007% (the design review, finding 5,
  l.91-94); the estimate matches anyway. Pooled over paths in years of target (not P2's per-household mean), 81.5 of the
  102.3 years lost fall on paths that survive under both arms and 14.4 on the 159 below (deep/split.mjs).
- **The year before ruin is saved for the failure year.** The raise there falls from 260 of 847 run-out paths to 4 of 832
  (results-fail-delivered.txt l.30). The year before ruin is at the floor on 774 of 832, against 144 of 847
  (rev/levels.mjs; the review at the read, l.53). Of the 831 paths that run out under both arms, ruin comes a year or
  more later under CANDD on 108 and a year earlier on 27 (deep/earlier.mjs).
- **The raise moved rather than vanished on a fifth of those paths.** 164 of 832 run-out paths have a 110% year in the
  three before ruin (results-fail-delivered.txt l.31). On 159 of them it is two years before, followed by the floor (the
  review at the read, l.44-47). On the same paths CAND never paid 110% in that year (100% on 120, 95% on 36, 80% on 3)
  and raised a year later on 72 (the same, l.48-52). On the tuning seed the figures are 197 of 875, 190 of them two years
  before (the same, l.54-56; deep/perh.mjs). The dial shows the same shift at three and ten times lambda
  (results-curve-dial.txt l.33-34: 207 and 223 within three years; 198 and 220 two years before, deep/perh.mjs).
- **The investments are unchanged.** Equity at years 1, 5, 10 and 20 is within 0.1 point (results-fail-delivered.txt
  l.31). So the tier test's finding, the tiers carrying 47.5% of the candidate's gain over the app's rules
  (results-tiers.txt l.23), stands for the new default.

It does not say:
- why the raise moved: no unit records the wealth or the table's stored move in the years before ruin (audit-curve.mjs
  l.110: levels, end wealth and failure year only);
- anything beyond eight single households.

D43's "to none" (STATE.md l.43) holds for the year before ruin only. SPENDING-CURVE.md counted that year alone (l.379), so
its "0 of 197" (l.369, l.467) could not see the shift.

## 2. The leading cause: next year's value read from cells where the backward pass stores a failing move

**The mechanism, from the code.** This is arithmetic on the code's prices, tax and income aside; it is not a measurement.
- **A cut costs** lambda (1 - l)^2 (l.639, l.649), with lambda 0.02236 (registration l.15). A year at the floor costs
  8.94e-4.
- **A failing move keeps survival and estate at 0** (l.1173-1174). It is charged lambda (1 - min(1, l - unmet/target))^2
  plus every later spending year at the floor, F(t+1) below (failDeliveredCost, l.984-989; F is failCostAt,
  l.969-970).
- **The menu is 80, 90, 95, 100 and 110%** (productLevels, l.2375-2378).
- **A year before a certain failure,** take available money A, in years of target, with 0.8 <= A < 1.1. Then 110% fails,
  delivering min(1, A). Paying the floor leaves (A - 0.8)g, and next year fails delivering that. So:
  - failing now costs lambda (1 - min(1, A))^2 + F(t+1);
  - paying the floor and failing next year costs lambda (1 - (A - 0.8)g)^2 + F(t+1).
- **At g = 1.03, failing now is cheaper by** 0.0215 at A = 0.8, 0.0141 at A = 1.0 and 0.0110 at A = 1.09. That is one
  to two points of survival, less where guaranteed income pays part of the failure year. So the backward pass stores the
  failing move unless paying survives by more than that. The design review measured these cells: 88,488 and 65,472
  layer-cells on S050 and S340F at 12 points, against 3,024 and 0 without the option (finding 3, l.64-72).
- **The value such a cell stores** is -F(t+1) once A >= 1.0, and slopes by at most 0.009 a year of target below that. Its
  survival is 0, read in log-odds clamped at 1e-6 (grid.js l.36-41), which pulls a neighbour's read toward it.
- **Where 110% becomes affordable (A >= 1.1), no move fails.** The cell must pay and fail deeper next year, at about
  -F(t+1) - 0.0107. So the table's value one year before ruin drops by about a point of survival as wealth crosses
  1.1 years of target. At 45 points the wealth axis steps 16% or more a node near one year of target (grid.js l.47-53,
  l.123), so the band is about two cells wide.
- **Two years before ruin,** the chooser reads that value at each landing node (l.1843-1855). 110% lands 0.1g years of
  target lower than 100%, into the band or deeper in it. A flat or falling next-year value makes the raise free or
  rewarded. This is SPENDING-CURVE.md's "money kept for the failure year earns nothing" (l.255-258), produced one year
  earlier by the option's own failing cells.
- **A year before ruin, in the engine,** the chooser gives the failing move -Infinity (l.1811), so it pays. It reads the
  failure year's new price, under which a pound carried into a year delivering 20 to 30% of target is worth about
  2 lambda (1 - l), or 0.03 a year of target. So it pays the floor.
- **Under CAND** the flat value sat in the failure year itself: ruin was priced at the floor whatever was left. So the
  raise came a year before ruin (reviews/2026-10-28-deep-phase4.md l.123-131). There the pick beat the floor by exactly
  the floor's charge, at wealth of 1.0 to 1.2 years of target, overlapping the band.

**For:**
- **The timing.** The raise falls two years before ruin on 159 of 164 paths (190 of 197 on 7002), with the floor between.
  That is the one year in which the table stores a move the engine cannot take.
- **The population.** The moved raise sits on the households where CAND raised before ruin: S030 11, S090 42, S188 17,
  S328F 49 and S340F 40, against CAND's three-year counts of 45, 48, 31, 75 and 55. It is absent where CAND's was rare: S050
  3, S304F 3 and S368 0 under CAND, none under CANDD (deep/perh.mjs).
- **Not markets.** On the same paths CAND never raised in that year, and no CAND run-out path has a 110% year followed by
  a lower one before ruin (the review at the read, l.46-50). A raise bought by good markets would show in both arms.
- **The cost lands where predicted.** Of the 27 paths whose ruin comes earlier under CANDD, 20 carry the raise. Of the 108
  whose ruin comes later, 1 does (deep/earlier.mjs).

**Against:**
- **Not decomposed.** The chain is inferred from the code and the pattern. No unit records the stored move or the wealth
  at the engine's state.
- **S050.** It has the most failing cells measured, yet no moved raise (0 of its 20 run-out paths). Its population is
  thin: CAND raised before ruin on 3 there, and its other failures end below the minimum pot (23).
- **The dial.** Lambda at three and ten times scales the fail-now margin while survival's weight stays. That predicts a
  larger share of moved raises. The share falls instead: 21.7%, 20.6% and 18.3% of run-out paths on 7002 (190 of 875,
  198 of 963, 220 of 1,199). The dial also changes which paths run out, so this is weak either way.
- **The arms part early.** Levels are identical before the year before ruin on only 4 of the 164 (rev/pattern.mjs). Part
  of the pattern could come from where the earlier choices left the path.

**The brief's two candidates.** The first, the failure year priced at what it can pay while the year before is priced by
the table's next-year value, explains the floor a year before ruin. It does not explain the raise before it. A next-year
value built from paying cells rises with wealth, because each pound carried softens the failure year. That asks for a
cut two years before ruin, not a raise. A raise needs a flat or falling next-year value, and with the option on, the only
such values a year before ruin are the failing cells'. So it is the second candidate.

## 3. Does it matter for the product

- **Survival and spending: no.** See section 1.
- **The fan's bands: no.** The 159 paths are 0.5% of 32,000, and their raises are 159 of CANDD's 911,739 retired years at
  110% (rev/levels.mjs), spread over ages. Part C's late-raise line reads the fan's upper quartile, and its headline reads
  the median path (PART-C-WORDING.md l.14-21, l.66-71). Paths that survive set both.
- **Where it shows: a single path's years.** Phase 9 shows this year's and the next ten years' actions, and Phase 10
  gives the audit table an action column (PART-C-PLAN.md l.47-55). A user about a year and a half of target from the end
  of their money, on a path heading for ruin, is told to spend 110% this year and the floor next year, and then runs out.
  That raise is not "what good markets would allow" (SPENDING-CURVE.md l.510; PART-C-WORDING.md l.64). The table expects
  to fail at full spending next year, which the plan will never do.
- **The cost in outcomes is small.** Ruin comes a year earlier on 20 paths, against a year or more later on 108 that the
  option's saving buys.
- **Verdict.** It matters for the per-year advice near ruin and for the record of D43's prediction, not for any figure
  Part C headlines. It is not a Part C blocker. Either the remedy lands, if the test below confirms the cause, or Part C
  carries the presentation rule the Phase 4 deep review proposed: when survival from here is nil, say so instead of
  showing a raise (l.144-147).

## 4. The one test

**What it runs.** V4's policy ensemble with one variant, a measurement of simulated outcomes:
- **CANDDP:** CANDD with the backward pass kept to paying moves where one pays. At a cell where some base move pays, a
  failing move is skipped in the argmax, as the chooser never takes it (scoreMoves gives it -Infinity, l.1811). It is
  skipped rather than given -Infinity because the backward pass's guard throws on a non-finite score (l.1201). Cells
  where every move fails stay as now. This is the design review's second remedy (finding 3, l.75-77). It removes the
  mismatch and leaves the failure year's price as D43 set it.
- **The option** goes at the five failure sites (l.1197, l.1328, l.1413, l.1481, l.1543). Whether a move pays is the
  same in every world, so the flag is computed once a cell after pass 1 (l.1231-1248). The ternary route needs every base
  flow first.
- **Its test** (CHECKLIST 4, 5): unset, the tables are the same bit for bit on three solves. Set, no layer-cell stores a
  failing move where a paying one exists (the design review's failpick count: 88,488 and 65,472 under the option as it
  stands). A plant, one site without the exclusion, is caught. FAST passes.

**Households, seed and paths.** The review's eight; the moved raise sits on five of them. Seed 7002, 4,000 paths, 45
points, W0.02, Phase 4's lambda, through audit-curve.mjs with the arm added. EXPLORATORY. CANDD is re-run on the new
code for one stamp. It must equal results/curve-7002's CANDD units byte for byte: the option-unset identity, on outcomes.

**How it is read** (reduce-curve's dial mode with CANDDP in place of the dial arms):
- the run-out paths with a 110% year in the three years before ruin, against CANDD's 197 of 875, and where the latest
  one falls;
- beside it:
  - the year before ruin at the floor (CANDD 806 of 875);
  - the paired survival change and its discordant paths;
  - lifetime spending, and spending while alive;
  - running out while alive;
  - the failure year's shift.

**What each outcome changes:**
- **The three-year count falls to near none** (under 2% of run-out paths), with survival not below -0.1 points pooled and
  spending within 0.1%: the cause is the failing cells. CANDDP goes to the maintainer as D43's completion. It joins the
  candidate only by a ruling naming the run or a registered held-out read (CHECKLIST 1, 2). The Part C wording then holds
  on run-out paths too. Expect more floor years before ruin, not fewer: the remedy makes money carried toward a failure
  worth something every year before it.
- **The count stays at three-quarters of CANDD's or more** (148 or more): the cause is not the failing cells. The next
  lead is whatever else keeps next year's value flat there; the one the code shows is the raise credit at near-nil
  survival (l.1105, l.1199). No new rule opens. Part C carries the presentation rule, and D43's record says
  "moved a year on a fifth of the paths that run out".
- **In between:** both, reported to the maintainer.
- **Survival or spending moves past those margins:** that is the remedy's price, reported beside the count.

**Cost.** The option and its test, about half a day. The run is 16 units at about 14 minutes each (registration
l.53-54), about an hour on four cores, about four core-hours. Time box: one working day. When it runs out, stop and
report.

## 5. STATE.md's open items that the result moves

- **The table's rows:** none moves. U-S224, U-S380, U-S364, O195, O194, PR35 and PR24/29/31 are closed. O191 and O179
  are untouched: no arm here separates the adaptive reference.
- **T-GAPS** gains a gap with a measured effect on simulated outcomes: the backward pass's failing cells (the design
  review's finding 3). They move the raise before ruin to two years before on 159 of 32,000 paths and bring ruin a year
  earlier on 20, with survival and spending unmoved. A decision rests on it: D43's prediction and Part C's wording. By
  section 4's rule (STATE.md l.144) it is carried as its own row, closed by the test above.
- **D43's record:** the raise before ruin fell from 30.7% to 0.5% of run-out paths in the year before ruin, and from
  30.7% to 19.7% within three years (results-fail-delivered.txt l.30-31).
- **D44's dial** inherits the same cause (results-curve-dial.txt l.33-34). The test's answer applies to any non-default
  setting.
- **Section 6 item 1** (l.294-295): the report to the maintainer carries these counts and this cause.
  PART-C-WORDING.md section 4 should not show a raise on a path whose survival from there is nil until the test reads.
