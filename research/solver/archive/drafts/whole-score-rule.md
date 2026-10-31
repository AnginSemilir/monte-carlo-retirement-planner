# The whole-score rule: a proposal for the maintainer (26 Sep; corrected after the eighty-fourth review)

**Why this exists.** The maintainer answered 7r's question on 26 Sep at 20:30 UK: "we keep the default settings, which is
mostly survival but some other weights". So a change is judged by the solver's default objective, realised on simulated
futures (the "whole score"), not by survival alone. The regimen (RULES.md section 8) has no rule for that reading. Its
test, margins and power rule are built for survival counts, and choosing a test and margin inside each prediction is what
fixing the margins once was adopted to stop. So the rule is decided once, before 7u registers, and then used by 7u, 7q
and 7o alike.

**What changed since the maintainer's "agreed" (20:46 UK).** The eighty-fourth and eighty-fifth reviews found three faults.
1. **Row 1's premise was false.** The earlier version said a household's 1,000 or more futures make the mean close to
   normal. They do not: the per-future whole-score difference is dominated by the +/-100-point survival flips. On S126
   the 15 lost paths carry about 50 of the 53.9 points^2 of per-future variance behind results-7r-failures.txt's se of
   0.134. So the effective sample is the number of futures that differ in survival, not the number of futures, and with
   none the interval comes from the small terms alone. By the review's simulation, the normal interval read a loss at the
   margin as "no material harm" several times more often than its stated rate. The build was reverted (b9a989e).
2. **The survival rule has the same kind of fault** (the plan's bugs list, 26 Sep). Its exact interval treats the
   number of differing futures as fixed, so with one-sided losses a true loss at the margin reads "no material harm"
   52.5% of the time at 3,000 futures (nominal 2.5%). An interval that counts that chance too is built and checked
   (stats.mjs survivalChangeU, Newcombe 1998 method 10). results-sim-unconditional.txt (sim-unconditional.mjs, 20,000
   draws a row) shows it at or below the stated rate from 95% to 99.8% survival and 1,000 to 8,000 futures, except 4.1%
   at 95% survival and 8,000 futures (nominal 2.5%), where the old interval reads about half on every row. Below 95%
   survival, at the regimen's 0.5-point margin, it runs a little high: 3.0% to 4.3% at 3,000 and 8,000 futures (0% to
   1.1% at the first look's 1,000), against the old interval's 44% to 48%. So it is far better, but not exact.
   It is reported beside 7t's registered reading tonight; changing the regimen's item 1 is the maintainer's decision.
   Re-reading the earlier results by it (O27; results-o27-unconditional.txt, with an exact bound from the one-sided count
   beside it, since the interval itself runs kind where few futures differ well below 100% survival) moves no verdict,
   but 20 of the 25 "no material harm" reads 7e took at 1,000 futures become inconclusive; and 7t's registered rule reads a partial cure as a cure far more often than the unconditional interval (results-o27-power.txt: a three-quarter cure HELD 0.976 against 0.532), while a full cure or none reads close by both (0.900 against 0.849 with more paths moving both ways).
3. **The pooled floor has the same kind of fault** (the eighty-fifth review). Each household's weight comes from its
   own counts, so households that lost fewer futures by chance weigh more. Through 7e's two looks with Holm across 24
   cases, a true pooled loss of 0.1 points holds the floor 6.1% (random effects) and 7.1% (fixed effect) of the time,
   against 2.5% (results-pooled-floor.txt). At one fixed path count it is several times worse: 13% to 66% for fixed
   effect and 7% to 51% for random effects (results-pooled-fixed.txt, sim-pooled-fixed.mjs: 3,000 or 8,000 paths, with
   7e's backgrounds or none). The households' cells summed into one unconditional interval holds 2.0% to 3.2% there.

## The corrected proposal

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | The test | Split each household's whole-score change into its **survival part** (the futures that differ in survival, worth 100 points each, read by the unconditional interval, survivalChangeU) and **the rest** (the estate, cut and raise terms over every future, read by a normal interval, which suits them). Combine the two by a split error rate (each part at half the level), so the combined interval is conservative. Its calibration is shown by simulation before adoption, as a planted check: at a true loss exactly at the margin it must read "no material harm" no more often than the stated rate | It carries the uncertainty in how many futures differ, which the first version did not |
| 2 | The margins | The regimen's own: 0.25 points a household where the comparison arm survives 95% or more, 0.5 below; 0.1 pooled | No new number; the whole score is in points of survival |
| 3 | The outcomes | The regimen's three, in the same form | One way of reading every test |
| 4 | Holm, looks and the pool | Holm across the households; the regimen's two looks, the first at 3,000 futures or more where no gain is expected: at 1,000, unless the change gains clearly, no count of differing futures closes a household at the 0.25 margin by the unconditional interval (with none saved, 0 of 1,000 lost leaves a loss of 0.60 points open at 0.005; results-o27-unconditional.txt), so for a change not expected to gain a 1,000-future look could only find harm. The pooled floor read on the households' cells summed into one unconditional interval, not weighted by each household's own counts: at a one-sided loss of 0.1 it holds 2.0% to 3.2% of the time (results-pooled-fixed.txt), where the current forms hold 7% to 66% | The floor has the same fault as the survival interval (3 above) |
| 5 | Survival's role | Reported beside it by the unconditional interval. Not a veto, but a survival loss beyond twice the margin goes to the maintainer before any default | As agreed |
| 6 | Scope | Every household | As agreed |
| 7 | The score | The solver's own objective as it solved, realised per future. No function computes it today: runPolicy returns the parts (survival, end wealth, shortfall, spending), and the only figures so far come from read-7r-failures.mjs, a re-implementation. So a scorer is built first, beside the solver's objective code, with a planted check that it reproduces results-7r-failures.txt's -0.347 and -0.380 | The eighty-fourth review's MINOR 4 |
| 8 | Which weights | The research reference (lambda 0.025). If K6 moves the reference before a default is decided, the test is **re-run** at the new weights: re-scoring futures of a policy solved at the old weights is not the solver at the new ones | The review's MINOR 5 |
| 9 | Power | By a committed script at registration, for 80% power at a true zero change, not a half-width equal to the margin. For the split form of row 1 (each part at half the level), the eighty-fifth review's arithmetic from 7r's measured spread gives about 11,300 and 8,700 futures a household on S126-like cases; a single normal interval would have needed about 6,800 and 5,300 | The eighty-fourth review's MINOR 6 and the eighty-fifth's MINOR 3; RULES.md item 6 has the same gap (the review backlog) |

**What it touches.**
- 7u, 7q and 7o read by it.
- **8f is not protected by it yet.** 8f is one combined arm (every new default together against the previous baseline),
  read on survival. A trade 7u accepts inside that arm would be read on survival alone. Which rule reads 8f's combined arm,
  or whether 8f gains an arm with every new default but the bridge handling (read by this rule), goes to the maintainer
  with this proposal. Five worlds, one of 8f's changes, alter the market model, not the objective.
- 7t is read as registered, with the unconditional interval reported beside its cure legs.
- Phase 4's gate 4 is left as it is (it compares the solver with the app; its survival headline is the maintainer's
  decision), unless the maintainer chooses otherwise.

**The calibration shown before asking** spans the comparison arm's survival (70% to 99.8%, at each band's margin) and
the futures (1,000 to 8,000), as results-sim-unconditional.txt now does for the survival part; the combined whole-score
form is shown the same way. Where the unconditional interval runs above its stated rate (below 95% survival, and 95% at
8,000 futures), the maintainer may prefer a slightly wider interval there; the choice is put with the rest.

**What the maintainer is asked, once the combined form's calibration is shown:**
1. Agree to rows 1-9, or change them.
2. Choose 8f's reading.
3. Whether the regimen's item 1 moves to the unconditional survival interval for every new test.
4. "Unlock enforcement" for plan-defaults.test.mjs alone, to pin the rule's constants.
