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

## 9. The run, declared before it (30 Oct, evening)

The maintainer chose the first option at 16:48 UK: a price for failing.

**The build:**
- `failPrice` F in `ezSetup`, in the plan's opening units. Running out, or ending below the minimum pot, adds F once to
  V^(1 - rho), as F / D(t) in year t's units. D(t) is the product of the weights from the opening.
- Absent, every value is the one without it, to the bit (`results-ez-test.txt`, 2h).
- The tests on this code pass: 45 checks. The pin is refreshed (`results-ez-pin.txt`). solve() is unchanged at 60,841
  bytes.

**The settings:**
- **The price, set on S090** at 45 points on 200 paths of seed 99001, not the run's seed (`results-ez-calib-price.txt`):
  survival 89.5% at 3, 92.0% at 10, 94.0% at 30, against the candidate's 94.0% on the same paths. **F = 30**, the
  ladder's first price to meet it.
- **gamma 4 kept.** At F = 30 the opening move's equity share is the candidate's on both retirees checked: S090 23.3%
  against the candidate's first year 22.6%, and S050 24.0% against 24.0% (`results-ez-calib-gamma.txt`). No ladder was
  needed. rho 2.

**The arms** (`ez/ez-run.mjs --gamma 4 --rho 2 --failPrice 30`): the eight households, seed 7002, the levers units'
1,000 paths, 45 points.
- CANDEQ: EZ off. It must be the CAND unit on every path, as the patch's identity at full scale across the agent's four
  commits.
- EZ: on the layer loop.
- The read (`--read`) sets EZ against APP, CAND, DIAL10 and DIAL10M, with the estate beside.

**Acceptance:** CANDEQ is the CAND unit on every household; runPath equals E.runTrial on the first 100 paths of every
unit; the read prints FAIR. **Time box:** 4 hours from launch.

**The prediction:**
1. Survival, EZ less CAND pooled: between -1.0 and +0.5 points.
2. Retired years 1-5: EZ above CAND's 86.5% by 3 to 10 points.
3. Retired years 1-5 at the floor: EZ below CAND's 76%, between 25% and 65%.
4. The retirees' first retired year: within 5 points of CAND's 80.0%.
5. From the 21st retired year: within 2 points of CAND's 107.5%.
6. The retirees' equity in retired year 1: within 5 points of CAND's 24.6%.
7. Against DIAL10M: EZ's survival 0.3 to 2.0 points above DIAL10M's 95.6%, and its years 1-5 below DIAL10M's 95.6%.

**What the outcomes would mean:**
- **1 to 3 hold:** at the candidate's survival, EZ with the price spends more early and sits at the floor less.
  (1) is shown by 6 and (2) by the age profile, so it is a spending method for the maintainer to weigh against DIAL10M.
- **1 misses low:** a price set on one household does not carry to the others, and the price would have to be set per
  household. That is a design question for the maintainer.
- **2 and 3 miss:** EZ adds nothing over the candidate's own penalty at the same survival.

## 10. The result (30 Oct, evening)

Read once by `ez/ez-run.mjs --read` (its output whole in `ez/results-ez-run.txt`), and scored by `ez/ez-score.mjs`
(`ez/results-ez-score.txt`). The scorer refuses a read that is not FAIR or does not add up. Eight planted faults were
each caught (`ez/results-ez-score-plants.txt`). The workers' logs are in `ez/results-ez-run-workers.txt`.

**The checks passed.**
- **CANDEQ** (the candidate on the patched code, EZ off) was the CAND unit on every path, year and failure, on all eight
  households. So the patch is inert when off at full scale, and across the agent's four commits since 1b39400.
- **runPath** matched E.runTrial on the first 100 paths of every unit. The worker stops otherwise.
- **The read** printed FAIR: one seed, path count, years and inputs.

**One worker was stopped.** The second worker reached the session's two-hour limit for a background job during S340F's
EZ arm (its log begun 17:52:05, last written 19:52:05). S340F's identity was already written. Its EZ arm was rerun
alone on the same code (code bb63cda25821 on every unit; the read requires it). The read came inside the time box.

Pooled, each household once (the retirees, retired at the start, are S090, S030, S368 and S050):

| | survival | retired years 1-5 | at the floor, years 1-5 | the retirees' first year | 21 on | equity, retired years 1 / 5 / 10 / 20 |
|---|---|---|---|---|---|---|
| CAND | 97.0% | 86.5% | 76% | 80.0% | 107.5% | 30.4 / 31.3 / 40.4 / 50.4% |
| DIAL10 | 95.7% | 94.5% | 8% | 91.3% | 107.0% | 33.6 / 32.9 / 34.3 / 43.5% |
| DIAL10M | 95.6% | 95.6% | 5% | 93.8% | 106.1% | 31.5 / 31.0 / 34.3 / 45.7% |
| EZ | 96.1% | 91.1% | 52% | 82.5% | 106.7% | 25.2 / 25.3 / 24.6 / 23.8% |

- **EZ less CAND, survival:** -0.84 points (se 0.12; -1.07 to -0.61). It is below CAND on all eight households (-0.50
  to -1.50). EZ alone fails on 78 paths and CAND alone on 11, of 8,000.
- **EZ less DIAL10M:** +0.50 (se 0.13; +0.24 to +0.76). **Less DIAL10:** +0.46 (se 0.13).

**The prediction, scored: all seven held.**
1. Survival less CAND, -1.0 to +0.5: HELD at -0.84. Its interval reaches -1.07, past the range.
2. Years 1-5, 3 to 10 points above CAND: HELD, +4.6.
3. Years 1-5 at the floor, 25% to 65%: HELD, 52%.
4. The retirees' first year within 5 points of CAND's 80.0%: HELD, 82.5%.
5. From the 21st year, within 2 points of CAND's 107.5%: HELD, 106.7%.
6. The retirees' first-year equity within 5 points of CAND's 24.6%: HELD, 24.6%.
7. Survival 0.3 to 2.0 points above DIAL10M, and years 1-5 below it: HELD, +0.50, and 91.1% against 95.6%.

By the reading declared in section 9 (1 to 3 hold), EZ with the price spends more early than the candidate and sits at
the floor less, near the candidate's survival. It is a spending method to weigh against DIAL10M. Four results beside
the prediction bear on how it weighs:

1. **It still opens at the floor.** EZ's first retired year is 80% on every path for three of the four retirees (S090,
   S030, S368), as the candidate's is for all four. Its gain is from raising sooner, not from starting higher: retired
   years 6-10 at 101.1% against the candidate's 97.2%, and at 110% in 64% of those years against 55%.
2. **On these figures it does not trade better than the dial.** Against the candidate:
   - EZ gives up 0.84 points of survival for +4.6 points in years 1-5;
   - DIAL10 gives up 1.30 for +8.0;
   - DIAL10M gives up 1.34 for +9.1, with 5% of its early years at the floor against EZ's 52%.

   The three are at different survival, so this run cannot settle which trades better.
3. **Its risk-taking is its own, not the candidate's.** gamma was set to the candidate's opening equity, and there it
   matches (the retirees 24.6% each). After that, the two diverge:
   - EZ's share stays between 17.7% and 29.9% on every household at the four years read;
   - the candidate's rises, to 50.4% pooled at year 20 (the retirees 58.3%);
   - where retirement comes later, EZ starts at 23.9% against the candidate's 45.0% (S328F) and 44.0% (S340F);
   - the price moved the tiers in the calibration: S090's opening equity was 43.3% at a price of 3, and 23.3% at 10 and
     at 30 (`ez/results-ez-calib-price.txt`).

   So EZ separates the dislike of uneven spending from risk aversion in its formula, but it does not keep the
   candidate's tiers.
4. **Its estate is 36% lower** where each survives: 1,959,745 against 3,061,630 (the households' mean), and lower on all
   eight. EZ gives the estate no value (section 2). The candidate's estate weight is 0.02.

**Odd results, each with what follows:**
- **The survival deficit on every household.** The price was set on S090's 200 paths of seed 99001, at 94.0% each. On
  the run's 1,000 paths of seed 7002, S090 itself is 1.10 points below. A price set on 200 paths is too noisy to hold
  survival within a point. The deficit is inside the prediction, so no rerun follows. Any further EZ arm should set its
  price on more paths.
- **The flat equity.** The candidate's rise is likely where its survival is assured and its estate weight decides. NOT
  CHECKED.

**For the maintainer (no default changes):**
- **Settle the trade against the dial at equal survival:** EZ with its price set to DIAL10M's survival, or the dial
  set to EZ's, on the eight households. The calibration's ladder brackets that price: on S090's 200 paths, survival was
  2.0 points below the candidate's at a price of 10 (opening at 95%), and level with it at 30 (opening at 80%).
- **Keep the candidate's tiers, literally:** EZ chooses only the spending, and the tiers are the candidate's choice at
  each position. That is the strictest reading of requirement (1). It is a build, with its own tests, before a run.
- **Give EZ an estate term:** a value on the estate, as scoped in `AGE-WEIGHT.md`. It would likely raise the later
  equity and the estate (NOT CHECKED). A build and a new calibration.
- **Stop at DIAL10M:** it has (2), at no survival cost against DIAL10, and more early spending than EZ, but not (1).
  It is 1.34 points below the candidate's survival.
