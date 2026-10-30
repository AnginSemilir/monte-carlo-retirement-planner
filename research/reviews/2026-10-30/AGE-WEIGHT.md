# Cuts that cost more when younger, apart from the tiers' risk-taking (EXPLORATORY), 30 Oct

The maintainer (30 Oct 13:12 and 13:15) asked for a test toward a way of handling spending cuts and raises that:
1. is disconnected from the risk aversion in the tiers;
2. takes utility into account, disliking cuts more when younger.

## Why not the utility objective, and why not full Epstein-Zin yet

- **The utility objective** (UTIL, `../2026-10-29/SPENDING-CURVE.md` section 3) has (2): each year is weighted by the chance
  of being alive to spend it. It fails (1): one parameter, gamma, sets both the dislike of uneven spending and the
  aversion to investment risk. At gamma 2 it held far more equity than the candidate, and its survival fell 7.8 points.
- **Epstein-Zin preferences** give (1) and (2) together: a separate parameter for each. But the solver's score is a sum,
  `survival + wR x resilience + wB x bequest - h` (`src/solver/solve.js`, the backward pass in three forms and the chooser in
  two). Its tables, the expectation memo, the shared year, the bridge reader and its adaptive reference all hold or read
  those parts linearly. EZ's certainty equivalent is not linear. It needs a new value table, its power transform at every
  expectation, the worlds' mixture taken the same way, and the reader and reference rebuilt to read it. That is a
  multi-day build, with its own identity and state checks. It is scoped at the end, for the agent, if this test leaves a
  reason for it.

## The test, declared before its run

**The build** (`dial/solve-ageweight.patch`; the agent's code at 1b39400, in a local worktree only):
- an option, `ageWeight` { mode, disp }, weights each year's cost of a cut, and its credit for a raise, by a Gompertz
  chance of being alive from the plan's age (UTIL's curve: mode 90, dispersion 9, a life expectancy at 65 of 21.7 years);
- the price of running out (`failureShortfall`, and the failure year at what it can pay, D43) is weighted alike;
- survival stays the currency, so the tiers keep the candidate's own risk attitude (1), and nothing else moves;
- off, the cost is the function it was, and every table the one solved before.

For a 65-year-old, a cut at 65 then costs about 1.7 times the same cut at 85.

**The arms** (`dial/ageweight.mjs`), the eight households of the review, seed 7002, the levers units' 1,000 paths:
- DIAL10M: the candidate at ten times the dislike of cuts, with `ageWeight` { mode 90, disp 9 };
- DIAL10: the same without it, on the patched code; it must be the DIAL10 unit (`dial/dial-timing.mjs`, the original
  code) on every path, year and failure, which is the patch's identity at full scale;
- CAND and APP: the levers units, beside.

**The checks:**
- the option's own test (`dial/ageweight-test.mjs`): the weights, each level's cost, the price of running out, the
  option off unchanged, and the weights reaching the table; two plants, each caught;
- the e3pcls pin refreshed on the patched code (`research/tests/solver-e3pcls.test.mjs 4 --pin`, in the worktree only);
- runPath matches E.runTrial on the first 100 paths of every unit;
- the read refuses a household whose arms differ in seed, path count, years or inputs, or whose DIAL10 is not the unit.

**The read** (`dial/ageweight.mjs --read`), in the retired years before any failure:
- survival, paired by path against DIAL10 and CAND;
- the first retired year (and the retirees': the four retired at the start), the level by band of years, the years at
  the floor;
- the cuts after the first year, and the share after the worst third of market years;
- **for (1):** the pension and ISA's equity share at retired years 1, 5, 10 and 20, beside CAND's and DIAL10's.

**The prediction:**
- the retirees' first year at 93% to 97% of the target (DIAL10 91.25%), and years 1-5 higher than DIAL10's;
- from the 21st retired year, lower than DIAL10's, with fewer late raises;
- survival 0.2 to 1.5 points below DIAL10's;
- the equity share within 5 points of DIAL10's at each of the four years.

**Acceptance:** the checks pass. **Time box:** 90 minutes from the pin's start.

## Full Epstein-Zin, scoped (not built)

If the age weighting on the candidate's own penalty gives the shape the maintainer wants, EZ adds little and need not be
built. If it does not, the build for the agent:
- **The value:** V_t = [(1 - beta) u_t^(1 - rho) + beta CE_t^(1 - rho)]^(1 / (1 - rho)), with CE_t =
  (E[p V_(t+1)^(1 - gamma) + (1 - p) B^(1 - gamma)])^(1 / (1 - gamma)). Here rho is one over the willingness to shift
  spending over time, gamma the risk aversion, p the chance of living to t+1 and B the estate's value.
- **The tables:** a value table beside survival and the estate. The powered value is tabulated once a year, so each
  expectation stays a linear read of a table; the memo, the shared year and E5 carry it.
- **The worlds' mixture:** taken as a certainty equivalent too.
- **The reader and its reference:** read the powered value near the bridge, or are shown not to be needed for it.
- **Ruin:** lived on the guaranteed income, as in UTIL.
- **The tests:** the identity with the option off; a hand-computed two-year case; the state check (V2) under it; a planted
  error in each transform.
- **The run:** the same eight households against CAND, DIAL10 and DIAL10M, with gamma set so the equity share matches
  CAND's.
