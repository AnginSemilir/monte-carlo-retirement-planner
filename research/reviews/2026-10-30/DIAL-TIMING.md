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
