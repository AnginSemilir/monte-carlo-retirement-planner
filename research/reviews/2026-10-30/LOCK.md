# The candidate's tiers, with the spending chosen by another rule (EXPLORATORY), 30 Oct

The maintainer (30 Oct 20:41 UK), on the options in `EZ.md` section 10: "I'll go with your recommendation". That was
option 2: lock the tiers to the candidate's choice, and let another rule choose only the spending. The rule is tested
two ways, so the two rules compare on identical tiers:
- **D10MLK:** the dial at ten with age weights (DIAL10M's settings, `AGE-WEIGHT.md`), its tiers locked;
- **EZLK:** Epstein-Zin spending (`EZ.md`), its tiers locked.

Both are built and run in a local worktree on the agent's code at a0e6400 with EZ's patch, never pushed to the agent's
branch. Nothing here changes a default.

## 1. The build (`lock/solve-lock.patch`, on a0e6400 with `ez/solve-ez.patch`)

**The lock (`lockTiers`).** It takes the candidate's own solved result for the same plan, grid and menu. At every
position the pair of tiers is the candidate's:
- **In the backward pass:** at each cell, year and pair held, only the moves on the pair the candidate's table chose
  there are scored and chosen among.
- **In the chooser:** only the moves on the pair the candidate's own chooser picks at that position. Where every one of
  them fails, the candidate's own move is taken. The engine reaches the chooser through the bridge, and the solver's
  forward run calls it directly, so both keep to the lock.
- **The arm's own objective** (EZ, or the dial's penalty with age weights) then chooses the level and the order of
  drawing among those moves.
- **The menu:** a locked solve takes the candidate's own decision on the tier above (solvePlanAuto's, D16), so the two
  menus are one. The lock refuses a candidate solved on another grid, plan, menu or set of tier pairs.

The rule for the tiers is the candidate's. The tiers held on a path can still differ from the candidate's on the same
path, because spending differently leaves different wealth, and the candidate's rule depends on wealth.

**The age weights (`ageWeight`)**, ported from `dial/solve-ageweight.patch` (on 1b39400) as a helper, the same
arithmetic.

**Where they run.** Both run on the tier state with joint worlds, on the layer loop (`tsOnce: false`), with no switch
margin and no taxable-account tiers. Anything else throws. The layer loop is E5's arithmetic without its speed-up: the
same tables bit for bit (the agent's speed-port test, and 2 below for the age weights).

**The solver function's size.** Both live in helpers at the file's end, so solve() stays under V8's limit for an
optimised function: 61,196 bytes against 61,440 (EZ's code alone: 60,841; `lock/results-solve-size-lock.txt`).

## 2. The tests, before any run (`lock/lock-test.mjs`)

At light settings (4 wealth points, a small reference lattice), on S090 and S328F:
1. **Off:** with neither option, every table of every layer, world and year is EZ's code's to the bit, and 40 forward
   runs and the run record are the same. This holds at the candidate's settings, on the layer loop, and with EZ on.
   The candidate is also the same against the age weights' code (1b39400), so that 2 reads the port alone.
2. **The age weights' port:** DIAL10M is the age weights' code's to the bit, in its tables and 40 runs. On the layer
   loop it is the same as on E5. Planted: mode 91 parts the tables.
3. **The lock:**
   - the candidate locked to itself is the candidate on the layer loop, to the bit;
   - EZ and DIAL10M locked: the table's move is on the candidate's pair at every year, layer and cell, and the chooser's
     at every decision of 40 forward runs; each differs from itself unlocked;
   - planted: the lock reading the first layer's choice for every layer held, and the chooser left unlocked, each caught.
4. **The refusals:** the lock on E5's path, with a switch margin, without joint worlds, or with a candidate solved on
   another grid or plan; the age weights with no dispersion. Each throws its own refusal.

**The result: ALL PASS, 27 checks** (`lock/results-lock-test.txt`, with e3pcls on; the pin refreshed in the worktree,
27 passed, `lock/results-lock-pin.txt`):
- **Off:** 3,919,104 table entries on S090 and 6,640,704 on S328F the same to the bit, at the candidate's settings and on
  the layer loop, and with EZ on; the candidate the same against the age weights' code too, its run record the same.
- **The port:** DIAL10M the age weights' code's to the bit on both households; on the layer loop the same as on E5.
- **The lock:** the candidate locked to itself the candidate, to the bit, on both. EZ and DIAL10M locked on S090: the
  table on the candidate's pair at all 186,624 year-layer-cells, and the chooser at all 1,389 and 1,436 decisions; each
  differs from itself unlocked on all 40 runs. The plants: 85,029 of 186,624 cells off the pair, and 446 of 1,373
  decisions, each caught.
- **A smoke run of the run's worker** at 4 points on S090 (`lock/results-lock-smoke-4pts.txt`): the pipeline end to end,
  the lock held at every decision checked (7,059, 6,737 and 6,747), runPath with E.runTrial, the engine with runPolicy.

## 3. The run, declared before it

**The arms** (`lock/lock-run.mjs --prices 10,30`), on the eight households, seed 7002, the levers units' 1,000 paths, at
45 points, with the candidate's settings and the estate weight 0.02:
- **CANDLK:** the candidate, both options off. It is the lock's tiers. It must be the CAND unit on every path, which is
  the identity of both patches at full scale across the agent's four commits.
- **D10MLK:** DIAL10M's settings (lambda times ten, ageWeight { mode 90, disp 9 }), its tiers locked to CANDLK's.
- **EZLK30 and EZLK10:** EZ (gamma 4, rho 2) at the price of failing of 30 and of 10, their tiers locked to CANDLK's.
  The two prices put EZ at two survivals, so that it can be read at D10MLK's survival.
- **Beside, from their units:** APP, CAND, DIAL10M (unlocked) and EZ at the price of 30 (unlocked, `EZ.md` section 10).

**The checks:**
- CANDLK is the CAND unit on every household;
- runPath equals E.runTrial on the first 100 paths of every unit;
- on the first 200 paths of every locked unit, every decision's move is on the pair the candidate's chooser picks at that
  position (the worker stops otherwise);
- the read prints FAIR: one seed, path count, years and inputs; every locked unit on the lock's code and shown locked.

**The read** (`--read`), in the retired years before any failure, as `ez/ez-run.mjs` reads them:
- survival, paired by path: each locked arm less CAND; D10MLK less DIAL10M; EZLK30 less EZ; each EZ arm less D10MLK;
- the first retired year (and the retirees'), the level by band of years, the years at the floor and at 110%, the cuts,
  the equity share at retired years 1, 5, 10 and 20, and the estate;
- **at equal survival:** EZ read at D10MLK's pooled survival, on the straight line between EZLK10 and EZLK30. EZ's
  years 1-5 level, and its share of them at the floor, are set against D10MLK's. The 95% interval comes from 2,000
  bootstrap replicates of the paths within each household, every arm on the same paths. Each reads as one of three:
  EZ HIGHER (or LESS AT THE FLOOR), EZ LOWER (or MORE), or NOT SEPARATED. If D10MLK's survival is outside the two EZ arms',
  the read says NOT BRACKETED and the figure is an extrapolation.

**Acceptance:**
- the lock's tests pass on this code (`lock/results-lock-test.txt`), with e3pcls on and its pin refreshed in the
  worktree;
- the agent's fast suite passes on this code but for the two failures explained on EZ's code (`check-state`: STATE.md's
  printed pin line; `e3pcls-guard`: the shallow clone), and only those two: 44 of 46 files, the same two
  (`lock/results-fast-lock.txt`; EZ's code's, `ez/results-fast-ezf.txt`);
- CANDLK is the CAND unit on every household; the lock held at every decision checked; the read prints FAIR.

**Time box:** 4 hours from the launch. The run is projected at about 3 hours on the two cores: one household a task, two
at a time, so no task nears the two-hour limit for a background job that stopped the EZ run's second worker.

**The prediction** (against the units' pooled figures, `ez/results-ez-run.txt`):
1. **The lock's cost to the dial:** D10MLK less DIAL10M, survival, between -1.0 and +0.5 points.
2. **The lock's cost to EZ:** EZLK30 less EZ, survival, between -0.5 and +0.5 points.
3. **The price:** EZLK10 below EZLK30 by 0.5 to 3.0 points of survival, and above it by 2 to 8 points in years 1-5.
4. **The bracket:** D10MLK's pooled survival between EZLK10's and EZLK30's.
5. **At equal survival:** EZ LOWER in years 1-5, and EZ MORE AT THE FLOOR. The unlocked arms are the reason (`EZ.md`
   section 10, `ez/results-ez-score.txt`): against the candidate, EZ gave up 0.84 points of survival for +4.6 points in
   years 1-5, and DIAL10M 1.34 for +9.1.
6. **The tiers:** each locked arm's equity share in the first retired year within 1 point of CAND's on every household.
   At retired year 20, pooled, between EZ's 23.8% and CAND's 50.4%: the candidate's rule at the lower wealth that
   spending more leaves.

**What the outcomes would mean:**
- **5 holds on both measures:** on the candidate's tiers, the dial at ten with age weights buys more early spending, and
  fewer years at the floor, at the same survival as EZ. It meets requirement (1) by the lock and (2) by the age weights.
  What would go to the agent is the lock and the age weights, two small options on the candidate's code. EZ is not
  needed.
- **EZ HIGHER and LESS AT THE FLOOR:** EZ is the better rule on the same tiers, and goes to the agent with the lock.
- **Mixed, or NOT SEPARATED:** the two rules are not told apart at equal survival on these measures. The dial is the
  simpler of the two. The maintainer's call.
- **NOT BRACKETED:** the comparison is an extrapolation, and a third price would be needed to read it.
- **1 misses low:** fixing the dial's tiers to the candidate's costs it survival, for the maintainer to weigh against
  requirement (1).

## 4. The result (31 Oct, read once)

Read by `lock/lock-run.mjs --read` (its output whole in `lock/results-lock-run.txt`) and scored by `lock/lock-score.mjs`
(`lock/results-lock-score.txt`). The scorer refuses a read that is not FAIR or does not add up; its eight planted faults
were each caught (`lock/results-lock-score-plants.txt`). The workers' logs are in `lock/results-lock-run-workers.txt`.

**The checks passed.**
- **CANDLK** was the CAND unit on every path of all eight households.
- **The lock held** at every decision checked, on the first 200 paths of all 24 locked units.
- **runPath** matched E.runTrial on the first 100 paths of every unit, and the engine matched runPolicy on the first 200.
- **The read** printed FAIR, inside the time box: launched at 22:01, read at 00:41.
- **Two incidents, neither touching a result.** The read first stopped on DIAL10M's units, which record no estate. It
  was fixed to print a dash there (fb9a29d) before it had printed anything. One worker, S030 with S050, was stopped in its
  first minute so the two could run on separate cores; it had written no unit.

Pooled, each household once (the retirees are S090, S030, S368 and S050):

| | survival | retired years 1-5 | at the floor, years 1-5 | the retirees' first year | 21 on | equity, retired years 1 / 5 / 10 / 20 | estate against CAND's |
|---|---|---|---|---|---|---|---|
| CAND | 97.0% | 86.5% | 76% | 80.0% | 107.5% | 30.4 / 31.3 / 40.4 / 50.4% | |
| DIAL10M | 95.6% | 95.6% | 5% | 93.8% | 106.1% | 31.5 / 31.0 / 34.3 / 45.7% | not recorded |
| **D10MLK** | 95.5% | 95.5% | 5% | 93.8% | 105.8% | 30.6 / 31.2 / 38.5 / 48.5% | -3% |
| EZ | 96.1% | 91.1% | 52% | 82.5% | 106.7% | 25.2 / 25.3 / 24.6 / 23.8% | -36% |
| EZLK30 | 96.4% | 91.4% | 51% | 82.5% | 106.6% | 30.5 / 30.8 / 37.4 / 45.5% | -13% |
| EZLK10 | 95.2% | 96.7% | 33% | 93.8% | 105.7% | 30.7 / 31.2 / 36.6 / 43.5% | -14% |

- **D10MLK less DIAL10M, survival:** -0.10 points (se 0.09; -0.27 to +0.07).
- **EZLK30 less EZ:** +0.25 (se 0.10; +0.06 to +0.44).
- **D10MLK less CAND:** -1.44 (se 0.14).
- **At equal survival** (D10MLK's 95.5%, bracketed by EZLK10's 95.2% and EZLK30's 96.4%):
  - years 1-5, EZ less D10MLK: -0.4 points of the target (-1.3 to +0.5), NOT SEPARATED;
  - years 1-5 at the floor, EZ less D10MLK: +33.5 points (+30.4 to +36.5) against D10MLK's 5.1%, EZ MORE AT THE FLOOR.

**The prediction, scored: four of six held.**
1. The lock's cost to the dial, -1.0 to +0.5: HELD at -0.10.
2. The lock's cost to EZ, -0.5 to +0.5: HELD at +0.25.
3. The price, 0.5 to 3.0 points of survival and +2 to +8 in years 1-5: HELD, 1.24 points and +5.3.
4. The bracket: HELD.
5. At equal survival, EZ LOWER and EZ MORE AT THE FLOOR: MISSED. Years 1-5 were NOT SEPARATED; the floor part held.
6. The first retired year's equity within 1 point of CAND's on every household: MISSED, by EZLK10 on S050 (25.7% against
   24.0%). The lock held at all of that unit's 5,589 decisions checked. The first is at the plan's opening, the
   candidate's own first position, so the pair there is the candidate's. The share is weighted by the pension's and
   ISA's values after the first year's drawing, which differ. The year-20 part held.

**What it means.** By the reading declared in section 3 this is the mixed case, and the maintainer's call:
- **Requirement (1) costs nothing measurable.** Locked to the candidate's tiers, the dial gives up 0.10 points of
  survival (-0.27 to +0.07) and EZ gains 0.25. The locked dial's equity follows the candidate's glide: the retirees from
  24.6% at year 1 to 54.8% at year 20 (the candidate's 24.6% to 58.3%), where the unlocked dial opened them at 29.6%.
- **At equal survival the two rules spend the same on average in years 1-5, but EZ gets there by swinging.** EZ's share of
  those years at the floor is 33.5 points above the dial's 5.1%. EZLK10 also spends 42% of them at 110%, against
  D10MLK's 18%. At the same level and the same survival, the dial's spending is the steadier, which is what disliking
  cuts asks for.
- **The locked dial against the candidate** gives up 1.44 points of survival for +9.0 points in years 1-5: the retirees'
  first year at 93.8% against 80.0%, 5% of the early years at the floor against 76%, and an estate 3% below the
  candidate's.

**The review's recommendation:** the dial at ten with age weights, on the candidate's tiers. It is no worse than EZ on
the level of early spending and far better on the floor, and it is two small options on the candidate's code. EZ is not
needed.

**For the maintainer (no default changes):**
- **The lock and the age weights to the agent**, as two research options on the candidate's code, without EZ. Their patch
  without EZ needs its own build and tests: the ones here, less EZ's.
- **The dial's position stays the lever.** At ten, the locked dial gives up 1.44 points of survival against the
  candidate. The lock and the age weights work at any position (D46: 1, 3, 6 and 10).
- **EZ is set aside.** Its patch and tests stay on the review branch.

**Odd results, each with what follows:**
- **EZ survives better on the candidate's tiers than on its own** (+0.25, the interval above zero). Its risk aversion
  (gamma 4) was set on the opening equity alone, and its own glide stayed near 24%. No decision rests on EZ now: noted,
  NOT CHECKED further.
- **Item 6's miss** is the pension and ISA's weights after the first year, not the tiers, as above.
