# When the cuts come: the dial at ten times against the guardrails (EXPLORATORY), 30 Oct

The maintainer's question (30 Oct 11:28): at ten times the dislike of cuts, do the cuts still come early in the plan, or
do they follow the guardrails' pattern, a cut after a bad year?

Behind it (11:28 and 10:45): the guardrails keep spending near the target and move it only on the markets' results. The
user chose the target expecting to spend it most years. The solver at today's setting sits at the floor for years at a
time on a risky plan, which breaks the point of a target.

## The test, declared before its run

**Three arms,** the eight households of the review (S090, S030, S328F, S188, S304F, S368, S050, S340F), seed 7002, the
levers units' 1,000 paths, on the agent's code at 1b39400 (code hash 88a2c9eee295):
- APP: the app's rules with its guardrails (Phase 4's arm A), the levers unit;
- CAND: the candidate with the failure-year fix (D43), the dial at one, the levers unit;
- DIAL10: the candidate at ten times the dislike of cuts, nothing else changed. It is the agent's DIAL10
  (`research/solver/audit-curve.mjs`), built as the levers harness builds CAND with lambda times ten
  (`dial/dial-timing.mjs`).

**The checks:**
- the harness at one reproduces the levers CAND unit bit for bit (survival, levels and failure years), on S050;
- runPath matches E.runTrial on the first 100 paths of every DIAL10 unit;
- the read refuses a household whose arms differ in seed, path count, code or inputs.

**The read** (`dial/dial-timing.mjs --read`), in each household's retired years before any failure:
- the level of spending in years 1-5, 6-10, 11-20 and 21 on, and the share of years below the target and at the floor;
- the first retired year's level;
- the cuts after the first retired year (a year below target lower than the year before), against the market of the
  year before the decision (its shock, in thirds over the household's retired decision years): the share that follow the
  worst third, the chance of a cut after the worst third and after the best, and the depth.

**The prediction:**
- DIAL10's years below target are still front-loaded: the share in years 1-5 at least twice that in years 11-20;
- its cuts after the first year follow bad years: more than half after the worst third of market years, as with the
  guardrails;
- the guardrails start at the target on every path and are not front-loaded.

**Acceptance:** the checks pass. **Time box:** 60 minutes.

## The results

Every figure is printed by `dial/dial-timing.mjs --read` (`dial/results-dial-timing.txt`).

**The checks pass:**
- at one, the harness is the levers CAND unit bit for bit on S050;
- runPath matches E.runTrial on the first 100 paths of every DIAL10 unit;
- the read is fair: every household's three arms are on one seed, path count, code and inputs.

**Pooled, each household once:**

| | APP (the guardrails) | CAND (the dial at one) | DIAL10 |
|---|---|---|---|
| The first retired year | 100.0% of target (below it on 0% of paths) | 85.3% (83%) | 94.2% (84%) |
| The level, retired years 1-5 / 6-10 / 11-20 / 21 on | 98.6 / 97.2 / 96.7 / 97.8% | 86.5 / 97.2 / 103.6 / 107.5% | 94.5 / 101.0 / 104.6 / 107.0% |
| Years below target, the same bands | 45 / 56 / 52 / 48% | 80 / 45 / 23 / 9% | 80 / 45 / 25 / 13% |
| Years at the floor, the same bands | 3 / 12 / 17 / 18% | 76 / 38 / 18 / 7% | 8 / 7 / 7 / 5% |
| Cuts after the first year, per hundred years | 16.4 | 2.7 | 4.2 |
| Of them after the worst third of market years | 84% | 91% | 88% |
| The chance of a cut after the worst third / the best | 42% / 1% | 7% / 0% | 11% / 0% |
| The mean cut after the worst third, points of target | 3.1 | 19.4 | 8.4 |

**What it shows:**
- **At ten times, the early cut is still there, but shallow.** The first retired year is at 94.2% on average. For the
  four households retired at the start it is 90% to 95%, against the candidate's 80%. Years 1-5 are below target as often
  as under the candidate (80%), but at 94.5% on average against 86.5%. At the floor they are 8% of those years, against 76%.
- **After the first year, its cuts follow bad years, as the guardrails' do.** 88% of them come after the worst third of
  market years (the guardrails 84%), and almost none after the best.
- **The difference is the size and how often.** The guardrails trim often and little: 16.4 cuts a hundred years, 3.1 points
  each. The dial at ten cuts less often but deeper: 4.2, 8.4 points each. The candidate cuts rarely and to the floor: 2.7,
  19.4 points.
- **The guardrails do not hold the target either.** They spend below it in about half of all years, by a few points on
  average (96.7% to 98.6% by band). Their years at the floor come late: 12% to 18% of years from the 6th on, against the
  dial's 5% to 7%.

**Against the prediction:** all three held. DIAL10's years below target are front-loaded (80% in years 1-5, 25% in years
11-20). Its cuts follow bad years (88% after the worst third). The guardrails start at the target on every path and are not
front-loaded.

## A staggered target, declared before its run

The maintainer's next question (30 Oct 12:37): could we allow a staggered spend, higher at the start, without impacting
performance?

**What a stagger can and cannot do.** Spending more early is not free on a flat target. The review found that every arm
starting the retirees higher than the candidate survives less (`../2026-10-29/SPENDING-CURVE.md`, the answers, point 1).
But the plan can say its needs fall with age. Its spending bands (a target by age) already do this, and the solver plans
each year against that year's band (`src/solver/fast.js`, `yr.scheduled`). A lower target later is less to fund, which can
pay for the early years.

**The arm** (`dial/stagger.mjs`): STAG10 is DIAL10 with one band: the household's own target to age 75, 85% of it from 76
(the go-go and slow-go years), nothing else changed. Against DIAL10 and CAND (flat targets, their units), on the same
1,000 paths of seed 7002.

**The read:**
- survival, paired by path against DIAL10 and CAND;
- the spending in each retired year before any failure, in pounds as a share of the household's own target: by band of
  years, in the first retired year and from 76;
- the years below 80% of that target.

**The checks:**
- the band is applied as asked (the target at 75, 85% at 76);
- with the band set aside, the plan's inputs are DIAL10's;
- runPath matches E.runTrial on the first 100 paths;
- the read refuses a household whose arms differ in seed, paths, years or code.

**The prediction:**
- STAG10's first retired year averages at least 97% of the target (DIAL10 94.2%), and so do years 1-5;
- its survival is 0.3 to 1.5 points above DIAL10's, and between 1.5 below and 0.5 above CAND's;
- from 76 it spends 10 to 20 points of the target less than DIAL10.

**Acceptance:** the checks pass. **Time box:** 60 minutes.

### The staggered target's results

Every figure is printed by `dial/stagger.mjs --read` (`dial/results-stagger.txt`).

**The checks pass:**
- the band is applied as asked on every household;
- with the band set aside, the inputs are DIAL10's;
- runPath matches E.runTrial on the first 100 paths of every unit;
- the read is fair.

**Pooled, each household once** (spending in pounds as a share of the household's own target):

| | Survival | First retired year | Years 1-5 | 6-10 | 11-20 | 21 on | From age 76 |
|---|---|---|---|---|---|---|---|
| CAND (flat, the dial at one) | 97.0% | 85.3% | 86.5% | 97.2% | 103.6% | 107.5% | 106.3% |
| DIAL10 (flat) | 95.7% | 94.2% | 94.5% | 101.0% | 104.6% | 107.0% | 106.2% |
| STAG10 (85% from 76) | 97.4% | 96.0% | 96.5% | 102.1% | 100.9% | 93.4% | 91.7% |

- **Survival:** STAG10 less DIAL10 is +1.74 points (+1.45 to +2.03); STAG10 less CAND is +0.44 (+0.24 to +0.63).
- **So the stagger buys a higher start and beats today's default on survival.** The price is the later years: from 76,
  91.7% of the target against DIAL10's 106.2%.
- **It helps where the step is near.** For the households retired in their sixties, the first year is at 95.0% (S090,
  S030, S050). Where the step is far off, the early years are as DIAL10's: S368, retired at 50, at 90.0%; S304F, retiring
  at 52, at 89.2%.

**Against the prediction:** two of four held.
- The first year at 96.0% and years 1-5 at 96.5% fell just short of the predicted 97%: missed.
- Survival above DIAL10 by +1.74 was more than the predicted 0.3 to 1.5: missed.
- Against CAND, +0.44 is inside the predicted range: held.
- From 76, 14.5 points of the target below DIAL10 is inside 10 to 20: held.
