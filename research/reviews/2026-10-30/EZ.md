# Epstein-Zin spending in the solver: the design (EXPLORATORY), 30 Oct

The maintainer (30 Oct 13:24): "Do the EZ build when ready, CC is busy now for the next few days." Its aim (13:15) is a
way of handling cuts and raises that is disconnected from the tiers' risk-taking, and that takes utility into account,
disliking cuts more when younger. The build is a research option, off by default, in a local worktree on the agent's
code at 1b39400, never pushed to the agent's branch. Every stage is committed before it is used.

## 1. The objective

Each year t, at each position, the value of a move is

    V_t = [ c_t^(1 - rho) + beta p_t CE_t^(1 - rho) ]^(1 / (1 - rho)),   CE_t = ( E[ V_(t+1)^(1 - gamma) ] )^(1 / (1 - gamma))

- **c_t:** the year's spending level against that year's target (the menu's 80% to 110%). In a year with no spending
  (still working) the term is left out.
- **rho:** one over the willingness to shift spending between years, so it sets how much uneven spending is disliked.
- **gamma:** the aversion to risk, across market outcomes and the three return worlds alike. It alone sets the appetite
  for investment risk. This is requirement 1.
- **p_t:** the chance of living from t to t+1, from the Gompertz curve of the review of 29 Oct (mode 90, dispersion 9,
  from the plan's age). Later years count less, so a cut costs more when younger. This is requirement 2.
- **beta:** a further time preference, 1 (none) unless set.
- **The expectation:** over the year's market nodes, as the solver's own, and over the three worlds by their weights,
  in the backward pass's joint choice and in the chooser alike.

**V** is in units of target spending (a plan spending the target every year, for certain, has V equal to the target's
value), so moves compare on one scale.

## 2. Ruin, the minimum pot and the end

- **A move that cannot pay** (the money runs out, or the bridge fails before pension access) is valued as that year at
  the level it can pay (D43's failure year), then every remaining year lived on the guaranteed income, at its level. Both
  are at least `ruinMin`, 10% of target, as in the utility prototype. They run on the same recursion, so running out is
  priced by its depth and its length.
- **The final year:** V_T = c_T if the plan ends at or above the minimum pot. Below it, the year counts as ruin, at the
  guaranteed income's level. So the end is judged by the rule every arm's survival uses.
- **No estate term.** The candidate's estate weight (0.02) moves little (the review of 29 Oct). Leaving it out is a
  known difference, and the read reports the estate.

## 3. What carries over from the candidate

- The menu, the tiers and the tier state, the three worlds and their joint policy, the reader, the draws and the engine
  are the candidate's. Each executes as now.
- **A switch of tiers:** the candidate's switch charge (0.001) as a fraction of value, V x (1 - 0.001).
- **The tables:** the value is stored as V^(1 - gamma) in the resilience table's slot. That slot is read linearly and
  carried by every speed path (the expectation memo, the shared year, the copied cells). Its weight is 0 in every shipped
  and research setting, so no choice reads it today. Survival, the estate and the cut costs are still stored for the
  chosen move, so every read-out stays as it is.
- **Where it runs:** on the tier state with joint worlds (the candidate's path) without E5's speed path. It is refused
  elsewhere (one tier pair, E5, E2's split, Richardson's second table, coverage), so a setting it does not support throws
  rather than runs.

## 4. Known limits

- The bridge reader refines survival only. EZ's value is read linearly near the bridge's cliff, as the utility
  prototype's shortfall table was.
- V^(1 - gamma) is steep in wealth. Read linearly between grid points it errs on the cautious side.

## 5. The tests, before any run

1. **Off:** every table the same bit for bit as the original code's, at light settings on S090 and S328F (every layer,
   world and year).
2. **The formulas:** the chance of living each year, the ruin levels, the ruin path's value, the aggregator, the final
   year and the failure year, each against an independent computation. A plant in each must be caught.
3. **The recursion in the tables:** at the final year and at a middle year, on sampled cells of the plan's own layer,
   each world's stored value is what the chooser computes for the stored move at that position. Planted: the check with
   rho perturbed must fail.
4. **The e3pcls pin** refreshed on the EZ code, in its worktree.

## 6. Calibration, then the run

- **Calibration** (light settings, S090, S050 and S328F, EXPLORATORY, seed 7002): rho 2, gamma over a short ladder. The
  gamma kept is the one whose retirees' pension and ISA equity share in year 1 is nearest the candidate's (24.7% in the
  agent's dial read).
- **The run:** the eight households, at 45 points, seed 7002, the levers units' 1,000 paths, against CAND, DIAL10 and
  DIAL10M. It reads as `dial/ageweight.mjs` reads them, with the estate beside.
- **Its prediction is committed before it.**
