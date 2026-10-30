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

## 7. What the build found before any run (30 Oct, afternoon)

Each item below is printed by a script into a results file in `ez/`, beside the script.

1. **The port.** The patch moved from the agent's 1b39400 onto its a0e6400. It adds and removes the same lines, with EZ's
   joint choice after `payWhereOnePays`' skip. EZ off, every table is a0e6400's and 1b39400's to the bit, on S090 and
   S328F, on both loops (`results-ez-test.txt`, test 1).
2. **The grid at 4 points.**
   - The first look (`results-ez-smoke-4pts.txt`) had EZ at 66% survival against the candidate's 91%, with the
     dislike of risk and the mortality weights making no difference.
   - The diagnostic (`results-ez-diag-4pts.txt`) shows why. The 4-point wealth axis is 0, 5,350, 174,628 and
     5,700,000. The stored value V^(1 - gamma), read straight across that one gap, made S090's 950,000 look half ruined,
     so every move scored within 0.3% of every other.
   - The fix: the value V itself is stored, and each read is powered (grid.js readValues, `g.ezPow`).
   - Light settings are kept for the tests of the mechanics; EZ's behaviour is read at 45 points only.
3. **The optimiser's limit.**
   - With EZ's code inline, solve()'s bytecode was 63,369 bytes, over V8's 61,440 limit. Every solve, EZ on or off,
     then ran about three times slower: one light solve took 117 s against 40 s.
   - EZ's setup, arithmetic and refusal now sit in helpers at the file's end. solve() is 60,841 bytes, and a solve is as
     fast as the original's (`results-solve-size.txt`; the light solve 30.7 s against 30.0 s).
   - a0e6400's own solve() is 60,024 bytes, 1,416 under the limit: the agent's next additions may cross it.
4. **The tests.** On the final code, at the candidate's settings: ALL PASS, 39 checks (`results-ez-test.txt`). The pin
   was refreshed in the worktree (`results-ez-pin.txt`).
5. **EZ at 45 points on S090** (200 paths of seed 99001; `results-ez-smoke-45.txt`):

   | arm | survival | ran out (at 91-96) | below the minimum pot | level at 61-70 / 71-80 / 81-90 / 91-96 | at 110% / at the floor |
   |---|---|---|---|---|---|
   | CAND | 94.0% | 8 (5) | 4 | 85.5 / 98.6 / 105.0 / 107.9% | 59% / 36% |
   | EZ gamma 4, rho 2 | 58.5% | 64 (57) | 19 | 107.0 / 104.9 / 103.5 / 103.3% | 76% / 11% |
   | the same, no mortality weights | 71.5% | 19 (17) | 38 | 97.2 / 102.9 / 105.2 / 106.1% | 66% / 15% |
   | EZ gamma 10, rho 2 | 56.5% | 68 (65) | 19 | 102.0 / 104.3 / 103.3 / 102.2% | 65% / 12% |

   - **The mortality weights** add 26 failures. Without them 57 paths fail instead of 83: 19 run out (64 with them) and
     38 end below the minimum pot (19 with them). With them, running out late is cheap: from 61, a ruined year at 93
     counts a quarter of one at 70 (alive 0.258 against 0.934).
   - **More aversion to risk does not help.** At gamma 10 EZ spends less in its 60s (102%) and still runs out late, on
     65 paths. Failure that far off, and that unlikely to be lived to, barely moves its certainty equivalent.
   - **The rest is the end rule and the raises.** Without the weights EZ still ends below the minimum pot on 38 paths,
     because ending below it costs one year at the guaranteed income's level. It also spends at 110% in most years: EZ
     values a raise almost as much as it dislikes a cut, where the candidate's raise credit is small (0.003).
   - **EZ as designed is not a candidate for the product.** It trades about 35 points of survival for spending. Any
     comparison needs a price for failing that does not shrink with age (running out, and ending below the minimum
     pot), set so its survival meets the candidate's. That is the maintainer's call (section 8).

## 8. The options (to the maintainer, 30 Oct)

1. **EZ with a price for failing.** Running out, or ending below the minimum pot, costs a fixed amount at any age,
   added once (in the units of the plan's opening value, so the mortality weights do not shrink it). The price is set
   on S090 so EZ's survival meets the candidate's, then gamma by the opening's equity, then the eight households. It
   keeps (1), separate risk and smoothing parameters, and (2), cuts weighted by the chance of being alive. It adds one
   parameter, the exchange rate between failing and spending, which survival-first sets high.
2. **The same, with raises worth less.** Spending above the target counts at the candidate's small raise credit
   rather than in full, so EZ stops spending at 110% for most years. It is closer to "the target is what the user wants".
3. **Stop EZ.** Take the age-weighted dial (AGE-WEIGHT.md: survival 1.3 points under the candidate, a steadier start),
   which meets (2) but not (1): the tiers still move with the dial.
