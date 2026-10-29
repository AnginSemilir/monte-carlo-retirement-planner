# The spending curve: a whole review, and a curve native to backward induction (EXPLORATORY), 29 Oct

The agent's brief of 29 Oct (D40 (3)): the solver's spending curve, before Part C fixes its defaults. Its four questions are:
- is the front-loaded cut sound or an artefact;
- is the raise before ruin only presentation, or should ruin be priced differently;
- which changes give a smoother, more defensible curve, tested;
- and what Part C's defaults should be.

The maintainer, the same morning: "the most important thing is to do a wholistic review of the curve and see if it's the
best option. This was a replacement to Guyton-Klinger Guardrails - but it's not working in this format to replace that.
I'd like something that fits with Backward Induction more naturally."

The work runs on `AnginSemilir/monte-carlo-retirement-planner` at the agent's ae20199 (29 Oct 08:03, D40), the maintainer's
choice. The D41 commit the brief names is not on it. All runs are EXPLORATORY, on seed 7002 only. No default, no
candidate.json and no file on the agent's branch is changed; the prototype is a patch in this folder. This plan is written,
committed and pushed before the experiment is launched. One run was made before writing (the option's tests), declared
below.

## The answers in brief

The figures are section 9's, each printed by a script over the units: the read (`curve/results-spending-curve.txt`, and
for the four households retired at the start `curve/results-spending-curve-retired.txt`) unless another is named. The
reasoning is section 10's. EXPLORATORY: eight households, one seed. Years are counted from 1, the first retired year.
An independent check of every figure against these files (29 Oct) found no figure wrong, and found claims that went
further than the files. They are corrected here.

1. **The front-loaded cut is sound. It is the price of the success rate, not a fault in the curve.** For the four households
   retired at the start, every arm that starts them higher than the candidate survives less than it. In order of the start
   (the first year's level, then survival):
   - the candidate: 80% and 97.4%;
   - ten times the dislike of cuts (on the hybrid): 82.5% and 94.7%;
   - the utility objective at gamma 5: 83.8% and 92.2%;
   - without its mortality weights, at gamma 2: 83.8% and 88.0%;
   - at gamma 3: 87.5% and 88.8%;
   - at gamma 2: 93.8% and 88.2%;
   - the app's guardrails: 100% and 86.1%.

   Among the utility arms the line is not strict, but none that starts higher than the candidate survives as well. Neither
   the ruin price, nor the curve's shape, nor the failure-year fix moves the start: each starts them at 80%. The candidate
   also holds the investments much safer, which likely buys part of its survival. On S090 it holds about a quarter in
   equity where the utility arms hold 83% (a quick look, not a result).
2. **The raise before ruin is a fault in how ruin is priced, and the fix is free.** The year the money runs out is charged a
   fixed price, however much is left, so money kept for it earns nothing. Charging that year by what it can pay
   (`failDelivered`) takes the raise before ruin to none: from 30.2% of the paths that run out for the candidate, and 19.1%
   for the hybrid. On the candidate, survival is the same on every path and spending 0.007% lower. It was tested with and
   without on those two objectives, and every arm that carries it has no raise before ruin. It is recommended for whichever
   objective is chosen.
3. **No tested change gives a gentler curve for free.** The best trade found is ten times the dislike of cuts, tested on the
   hybrid (HYB10D):
   - the retirees start at 82.5%, and their average level is back at target in the 9th year instead of the 13th;
   - from the 21st year the average level is 101.9% of target, instead of 107.5%;
   - against the candidate, over the eight households, it costs 2.1 points of survival and 1.5% of lifetime spending, and
     spends 0.4% more while alive;
   - the gentler shape is the average's: year to year, a path's level changes more often, in 18.0% of years against 8.4%.

   Against its own base, the hybrid at today's dislike of cuts, the same dial costs 2.1 points of survival and raises
   lifetime spending by 1.5%. The dial on the candidate's own penalty was not tested.

   The textbook backward-induction objective (spending utility weighted by the chance of being alive) costs more survival
   at every gamma tried, which a survival-first product cannot take:
   - at gamma 5, 4.7 points, for 0.2% less spending while alive and a start no better on average (83.6% against 85.4%);
   - at gamma 2 and 3, 7.4 to 7.8 points, for 1.5% to 2.4% more spending while alive and a higher start for the retirees.

   Taking the raises away (FLAT) costs 8.5% of lifetime spending for no gain in survival, and its average never gets back to
   the target.
4. **Part C's defaults:**
   - the candidate with the failure-year fix;
   - raises to 110%, as now;
   - the estate weight and the minimum pot as they are;
   - the dislike of cuts as the user's dial, with today's setting the default.

   A gentler setting should be built on the candidate's own penalty and tested before it ships (section 10). On S090 the
   tested point, the hybrid at ten times, kept 83% in equity in the first year where the candidate holds a quarter, easing
   only to 38% by the 20th year.

   The app presents the early cut as a safe starting spend, with its path back to target. It says plainly that a plan whose
   target is high for its savings will tend to spend below the target, because the solver puts not running out first, and
   that turning up the dislike of cuts trades some of that safety for steadier spending. The late raise is presented as what
   good markets would allow.

## 1. What the curve is, in the code

The candidate scores each move at a position by
`survival + estate weight x estate / opening wealth - h` (solve.js l.573-584). `h` is the expected sum, over the years
left, of a cost per year:
- **A cut** to level l costs `lambda (1 - l)^2`, with lambda 0.0224 (costOf, l.649).
- **A raise** earns `raiseWeight x sqrt(min(0.2, l - 1))`, with raiseWeight 0.003, times the survival it leads to
  (raiseSurvival, l.944-952).
- **A year the money has run out** is charged what a year at the floor costs, in every year left (failureShortfall,
  l.955-970).
- **No year is weighted** by when it falls or by the chance of being alive in it.
- **The menu** is 80% (the floor), 90%, 95%, 100% and 110% of target (productLevels, the 110% cap).

The estate counts at weight 0.02, capped at four times the opening wealth.

## 2. Why it front-loads cuts and raises before ruin (the diagnosis)

`curve/kink-check.mjs` prints each objective's own prices (S090). Five things combine:

1. **Spending is nearly free next to survival.** A year at the floor costs 0.089 points of survival, so any cut that buys
   more is taken, and the first years carry the most sequence risk.
2. **The curve has a convex kink at the target.** A year at 110% earns about as much as a year at 80% costs, while a year
   at 90% costs a quarter of that. The raise credit's square root is steepest just above the target, and the cut's square
   is flattest just below it. So for the same total spending the score prefers swinging to flat:
   - 90% then 110% scores 0.073 points better than 100% then 100%;
   - 80%, 110%, 110% scores 0.100 points better than three years at 100%.

   Cut early, raise late is what it asks for, even before survival enters. A concave curve reverses both: at gamma 2, 90%
   then 110% costs 0.0202 more than flat.
3. **Ruin is priced as a floor year.** A year with no money costs the candidate 0.089 points, exactly a floor year, so on
   a path the table reads as lost cutting buys nothing and the raise wins (the deep review's finding). ZERO's price is
   2.236 points a year. The utility curve's is 9.0 a year living on 10% of target before the State Pension, and 3.31 from
   it at 22% (S090): 13 to 36 times a floor year.
4. **No time or mortality weight.** A cut at 61 costs the same as a cut at 91, and a raise at 91 earns the same as one at
   61, though the chance of being alive to spend it is a fraction.
5. **The menu jumps from 90% to the floor**, so a cut below 90% is a cut to 80%.

Guyton-Klinger's guardrails are a rule laid on top of a plan. A backward induction does something different: it
maximises an objective year by year. What it maximises therefore decides the curve, and the curve above is an objective
that prefers volatile spending.

## 3. What fits backward induction naturally

The textbook problem a backward induction solves for retirement spending is expected lifetime utility (Yaari 1965;
Merton 1969):
- a concave curve u on each year's spending, so a cut hurts more than a raise of the same size pleases, which is the
  dislike of cuts made consistent;
- each year weighted by the chance of being alive to spend it, and optionally a time preference;
- running out lived through on the guaranteed income and priced on the same curve, so its depth and its length count;
- the estate valued by its own term.

Smooth spending is then what the optimum does, with no rule added. Spending follows the markets in small steps,
which is what guardrails were reaching for, and it never pays to swing around the target or to raise before ruin. Each
of Part C's levers maps onto one parameter:
- the dislike of cuts is the curve's curvature (gamma);
- the estate's priority is the estate's weight against spending (phi);
- the minimum pot stays a reserve at the end;
- raises are the menu's top.

**The prototype** (`curve/solve-spendutility.patch`, the option `spendUtility`, off by default) replaces the per-year
cost with `kappa w(t) (u(1) - u(l))`:
- u the CRRA curve, `(l^(1 - gamma) - 1) / (1 - gamma)`, at gamma 2;
- `w(t)` a Gompertz chance of being alive at mode 90 and dispersion 9. That gives a life expectancy at 65 of 21.7 years,
  against the ONS's 2024-based cohort figures of 20.0 for men and 22.7 for women. There is no further time preference;
- a year of ruin lived on the guaranteed income, at its level, at least 10% of target, in every year left;
- the estate a quarter of a pound spent at target (the estate weight 0.25 x the opening wealth / the target). That is
  the candidate's own exchange rate: at W0.02 a year of target left in the estate scores about what a year at the floor
  costs;
- the survival term kept at weight one, now a small extra price on running out and on missing the minimum pot.

Everything else (the menu, the tiers, the reader, the draws) is the candidate's.

The prototype has two known limits:
- the estate is valued only at the end of the plan, not at each age the person might die, so it is favoured against
  late spending;
- the bridge reader refines the survival read only, while the shortfall table it now leans on is read linearly near the
  bridge's cliff. The arms report failures before pension access to show what that costs.

## 4. The experiment

**Arms**, each executed by the engine on the same paths (`curve/curve-audit.mjs`, built from the tier test's
`audit-tiers.mjs`):

| Arm | What it is |
|---|---|
| APP | arm A, the app's rules with guardrails, as Phase 4 ran it |
| CAND | the candidate (fcd8096217b7), 45 points, estate weight 0.02 |
| ZERO | CAND with a year of ruin priced as a cut to nothing (`failureShortfall: 'zero'`, the option the code keeps) |
| FLAT | CAND with no raises (`raiseWeight: 0`: the credit and the 110% level gone) |
| HYB | UTIL's curve, ruin price and mortality, with survival still the currency: kappa set so a year at the floor costs what it costs CAND (lambda x 0.2^2), the estate by the same exchange, CAND's switch charge |
| UTIL | the spending-utility objective above, spending the currency (kappa 1); its switch charge CAND's 0.001 in its units (x 0.25 / (lambda x 0.04)), so a tier change costs what it costs CAND against a year at the floor |
| UTILNM | UTIL without the mortality weights |

The arms take the diagnosis apart:
- ZERO changes the ruin price alone (point 3);
- FLAT removes the kink alone (point 2);
- HYB changes the curve, the ruin price and the time weight (points 2 to 4) with survival still the currency;
- UTIL makes spending the currency as well (point 1);
- UTILNM is UTIL without the mortality weights.

**Households**, 8 of Phase 4's 40, chosen before any run:
- retired at the start: S030 and S050 (68), S090 (61, the deep review's), S368 (50, a long bridge);
- working: S188 (55, retiring at 60);
- FIRE, retiring at 52: S304F (pension-heavy), S328F (the deep review's) and S340F.

**Settings:** seed 7002, 1,000 paths a unit (two cores), the landed targets and minimum pots, and arm A's pick searched as Phase 4
searched it. runPath is held to E.runTrial on the first 100 paths of each unit, and runPolicy beside the engine on the first
200.

**The read** (`curve/curve-reduce.mjs`), each household counted once. Per arm:
- survival, and the spending delivered, paired against CAND and APP;
- the curve: the mean level by retired year (0-4, 5-9, 10-19, 20 on), over paths not yet failed;
- the first retired year's level;
- years at the floor and at 110%;
- the mean year-to-year change and the share of years that change;
- the share of failures whose year before is a raise, and failures before pension access;
- the estate, and the median and unlucky tenth's end wealth;
- unmet spending.

**Prediction:**
- **UTIL:** the first retired year at 95% of target or more; the curve flat or gently falling; at most half CAND's years
  at the floor; a raise before under 5% of failures. Survival 1 to 4 points below CAND, since the mortality weights
  discount a late shortfall, but well above APP. Lifetime spending within 2% of CAND's.
- **UTILNM:** survival within a point of CAND, a flat curve, fewer years at the floor than CAND.
- **HYB:** survival within 0.5 of CAND and a raise before under 5% of failures, with fewer years at 110%. The first
  year's cut largely stays, since a year at the floor costs what it costs CAND and buys the same survival: within 5 points
  of CAND's first-year level, and its years at the floor within a fifth of CAND's.
- **ZERO:** a raise before under 10% of failures, survival +0.1 to +0.5 against CAND, spending 0.5 to 1.5% lower, and the
  early cut stays.
- **FLAT:** the early cut stays, since it buys survival; no year at 110%; spending 2 to 4% lower; survival within 0.3.

**The rule for the recommendation**, fixed now:
- **A utility arm is recommended** as the curve's replacement if, on these households, it:
  - keeps at least half of CAND's survival gain over APP;
  - delivers at least CAND's lifetime spending less 1%;
  - starts retirement at 95% of target or more;
  - spends fewer years at the floor than CAND.
- **If both utility arms qualify,** UTIL is recommended, mortality being the natural weight. UTILNM is offered as the
  setting for a user who wants every year to count alike.
- **If neither qualifies, but HYB keeps survival within 0.25 of CAND's and cuts the raise before ruin below 5% of
  failures,** HYB is recommended as the smallest change consistent with backward induction.
- **Failing that,** the best of ZERO and FLAT by the same measures is recommended as the minimal fix, with the utility
  arms' trade-off set out for the maintainer.

## 5. Declared: the runs made before launch

The prediction above was committed before any of these, at 6a1687d.
- **The e3pcls pin** (`research/tests/solver-e3pcls.test.mjs 4 --pin`) on the patched code: 27 passed, pinned
  e4ac8985d7be21b0, in this worktree only.
- **The option's tests** (`curve/curve-test.mjs`; `curve/results-curve-test.txt`): ALL PASS, 8 checks.
  - With the option off, every table is the original code's bit for bit: on S090 and S328F at the light settings, and on
    S090 on the candidate's own lattice. A perturbation of 1e-9 in lambda is seen.
  - The weights, costs and ruin prices match their formulas to 5.3e-15, and the same checks against gamma 3 fail.
  - The mortality weights reach the tables.
- **The prices** (`curve/kink-check.mjs`; `curve/results-kink-check.txt`) are section 2's figures.
- **A smoke run** of every arm on S090 at 6 points and 60 paths, to test the harness and the read. Its figures are not used.
  It found the read counting an end below the minimum pot as running out, now separated, and the floor year's exchange
  rate's sign wrong in the harness, now fixed.

## 6. The results

The results of all three declarations are read together in section 9, after the two amendments (sections 7 and 8) that
added arms before the read.

## 7. The amendment, declared after UTIL's read and HYB's first unit, before its own units

**What was seen** (EXPLORATORY; the registered rule reads UTIL as failing):
- **UTIL fails the rule on survival.** It keeps 3.0 of CAND's 10.8 points over APP on the eight households (-7.8, se 0.30,
  against CAND), under half.
- **The tiers it holds explain it.** On S090 (a light solve, 300 paths; a quick look, not a result), CAND holds the pension
  and ISA at 23 to 25% equity for 20 years, UTIL at 70 to 83%. At gamma 2 the utility objective is far less averse to risk
  than the candidate's survival-first objective, and one parameter sets both.
- **HYB on S090 keeps CAND's survival** (95.0% against 95.1%). But its raise before ruin stays, on 14 of 42 paths that ran
  out, and so does its first year at the floor.
- **Why the raise stays.** Every objective here charges the year a move cannot pay at a fixed price, whatever money is
  left that year. Where cutting cannot postpone the failure, money kept for the failure year earns nothing in the score, so
  a raise wins by default.
- **The fix:** charge that year at what it can pay, its spending less its unmet, on the objective's own curve, and the years
  after as before. This is the option `failDelivered` (`curve/solve-faildelivered.patch`, on top of the spending-utility
  patch). Unset, every table is the same bit for bit as before (`curve/curve-test2.mjs`; `curve/results-curve-test2.txt`,
  to pass before launch).

**The amendment's arms** (`curve/curve-audit2.mjs`, the registered harness with three arms added, on the failure-year
code; the same eight households, seed 7002, 1,000 paths):

| Arm | What it is |
|---|---|
| CANDD | CAND with failDelivered |
| HYBD | HYB with failDelivered |
| HYB10D | HYBD with ten times the dislike of cuts (a year at the floor costs 0.89 points of survival), its switch charge and the estate by the same exchange |

**The fair test.** The amendment's code is the registered code with the option added, unset everywhere but these arms.
S090's CAND unit re-run on it must be the registered unit bit for bit (`curve/results-cross-code.txt`, before the read).
The read then declares the two code hashes one.

**Prediction:**
- CANDD and HYBD: a raise before under 5% of paths that run out, survival within 0.3 of their bases, spending within 1%.
- HYB10D: on the households retired at the start, the first year at 90% or more, a third fewer years at the floor than
  HYB, and survival 0.5 to 2 points below HYB.

**The rule:**
- failDelivered is recommended for whichever objective is chosen if it brings the raise before ruin below 5% of paths that
  run out, with survival within 0.25 of its base.
- HYB10D is reported as one point on the trade-off between the dislike of cuts and survival, for the lever's default. A
  further point runs only if the maintainer asks.

**Before the read** (`curve/results-curve-test2.txt`, `curve/results-cross-code.txt`): the option's tests, ALL PASS, 14
checks, against bf333f9, the registered code's solve.js. The test now names that base, as HEAD holds the option once it is
committed, and checks the two differ. S090's CAND unit re-run on the failure-year code (6ef708fc14ca) is the registered unit
byte for byte, and a planted flip of one path is seen.

## 8. The second amendment: UTIL at gamma 3 and 5, declared after HYB's read and before its units

**What was seen** (EXPLORATORY; HYB's eight units, the read's interim tables):
- **HYB keeps CAND's survival** (+0.04 points, se 0.065) **but not its spending**: 2.9% less over a lifetime (se 0.03). It
  starts lower (84.0% against 85.4%), spends more years at the floor (10.2 against 8.7), and still raises before ruin on
  19.1% of the 194 paths that run out. It fails the section 4 rule on the raise.
- **UTIL**, the objective a backward induction solves in the textbook, failed on survival, and at gamma 2 it holds far more
  equity than the candidate (section 7). In it, one parameter sets both the dislike of uneven spending and the aversion to
  risk: gamma. A higher gamma makes it more cautious with both, and prices ruin far more heavily against a cut
  (`curve/gamma-prices.mjs`; `curve/results-gamma-prices.txt`). A year of ruin at 22% of target costs 14 years at the floor
  at gamma 2, 35 at gamma 3 and 295 at gamma 5.
- **The maintainer chose** to test gamma 3 and 5, with the failure year at what it can pay, on the same eight households.

**The arms** (`curve/curve-audit3.mjs`, curve-audit2.mjs with two arms added, on the failure-year code; seed 7002, 1,000
paths; queue `curve/curveq3.sh`):

| Arm | What it is |
|---|---|
| UTIL3D | UTIL at gamma 3, with failDelivered |
| UTIL5D | UTIL at gamma 5, with failDelivered |

Each keeps UTIL's mortality weights, its least level for ruin (10% of target) and its estate at a quarter of a pound spent at
target. Its switch charge is the candidate's 0.001 in its own units, taken at its own gamma (0.314 and 0.403).

**The tests before the units** (`curve/curve-test3.mjs`; `curve/results-curve-test3.txt`):
- at gamma 3 and 5, every weight, cost and ruin price as the formula gives, every table finite, and the same checks at the
  wrong gamma failing;
- curve-audit3.mjs running curve-audit2.mjs's arms as it does;
- a smoke run of each new arm on S090 at 6 points and 60 paths. Its figures are not used.

**Prediction:**
- **UTIL3D:** survival 92 to 95.5%; the first retired year at 88 to 95%; fewer years at the floor than CAND; a raise before
  ruin under 5% of the paths that run out; lifetime spending within 2% of CAND's.
- **UTIL5D:** survival 95 to 97.5%; the first retired year at 85 to 93%; fewer years at the floor than CAND; a raise before
  ruin under 5%; lifetime spending 1 to 4% below CAND's, as it holds less equity.

**The rule:** section 4's rule for a utility arm. If one arm qualifies, it is recommended as the curve's replacement; if both,
the one with the higher survival. If neither, both are reported as points on the trade-off beside HYB10D.

**The order of the runs:** the first amendment's arms and these first, the registered UTILNM and FLAT after. Every declared
arm runs before the read.

## 9. The results

Every figure here is printed by a script over the 96 units: the read (`curve/curve-reduce.mjs`) unless another is named.
The eight households' figures are in `curve/results-spending-curve.txt`; those of the four retired at the start are in
`curve/results-spending-curve-retired.txt`. Each household counts once.

**The checks** (the read's first lines, and the units' own records):
- **Fair:** one candidate (fcd8096217b7), seed 7002, 1,000 paths a unit, and each household's arms on one inputs hash. The
  code is the registered 5495d1b168c7 and the failure-year code 6ef708fc14ca, declared one by
  `curve/results-curve-test2.txt` and `curve/results-cross-code.txt`.
- **The engine and the policy agree.**
  - runPath was held to E.runTrial on the first 100 paths of every unit: the harness's CHECK is 100, and it exits on a
    difference. Every unit was written.
  - runPolicy beside the engine differs on 0 of 17,600 paths (88 solver units).
- **Each arm ran what was declared,** printed from its units.
- **The spending measures rest on one identity:** delivered is the levels times the target, less the unmet. It holds to 6
  pence on every solver unit, and a planted error in the target is seen (`curve/delivered-check.mjs`;
  `curve/results-delivered-check.txt`). The app's levels are stored rounded (within £5,034 on a path), so the read
  rescales them to their totals.
- **The order of the runs changed twice,** to bring the deciding arms forward. A unit's result depends only on its code,
  household, arm, seed and paths (evidence: `curve/results-cross-code.txt`, a unit re-run byte for byte). Units cut off by the
  harness's two-hour limit, or stopped to reorder, ran again from the start; a unit is written only when it completes.

**The arms** (the households' means; against CAND paired by path, its se at most 0.35 points of survival and 0.07% of
spending):

| Arm | Survival | Against CAND: survival | Spending against CAND, lifetime / while alive | Retirees: first year / years 1-5 | From the 21st year | Years at the floor | Raise before ruin | Running out while alive |
|---|---|---|---|---|---|---|---|---|
| APP | 86.15% | -10.83 | -5.47% / -3.25% | 100 / 98.3 | 97.8 | 5.19 | 2.6% of 922 | 7.11 |
| CAND | 96.97% | | | 80.0 / 80.7 | 107.5 | 8.66 | 30.2% of 202 | 1.24 |
| ZERO | 96.97% | +0.00 | -0.22% / -0.31% | 80.0 / 80.6 | 107.4 | 9.11 | 9.8% of 193 | 1.12 |
| FLAT | 97.05% | +0.08 | -8.52% / -7.85% | 80.0 / 81.4 | 96.4 | 7.33 | 0% of 198 | 1.20 |
| HYB | 97.01% | +0.04 | -2.95% / -1.73% | 80.0 / 81.2 | 101.4 | 10.18 | 19.1% of 194 | 1.13 |
| UTIL | 89.15% | -7.83 | -0.37% / +2.36% | 93.8 / 94.6 | 102.2 | 6.06 | 18.1% of 723 | 3.99 |
| UTILNM | 89.41% | -7.56 | +1.02% / +1.95% | 83.8 / 87.6 | 107.4 | 5.92 | 13.6% of 513 | 2.87 |
| CANDD | 96.97% | +0.00 | -0.01% / -0.01% | 80.0 / 80.7 | 107.5 | 8.69 | 0% of 197 | 1.22 |
| HYBD | 97.01% | +0.04 | -2.94% / -1.73% | 80.0 / 81.2 | 101.3 | 10.19 | 0% of 195 | 1.14 |
| HYB10D | 94.88% | -2.10 | -1.48% / +0.36% | 82.5 / 86.3 | 101.9 | 8.19 | 0% of 321 | 2.04 |
| UTIL3D | 89.63% | -7.35 | -0.75% / +1.50% | 87.5 / 90.7 | 102.5 | 6.12 | 0% of 686 | 3.53 |
| UTIL5D | 92.28% | -4.70 | -1.61% / -0.22% | 83.8 / 85.4 | 102.7 | 6.69 | 0% of 453 | 2.26 |

The columns:
- **Retirees** are the four households retired at the start; their years 1-5 are the read's retired years 0-4.
- **From the 21st year** is the mean level, % of target, from the 21st retired year on (the read's "20+", counted from 0),
  over all eight households.
- **Raise before ruin** counts the paths that ran out whose year before was at 110%.
- **Running out while alive** counts each path that runs out by the chance of being alive that year, in points. It leaves
  out the paths that meet every year but end below the minimum pot.
- **Back at target**, used below, is the first year the retirees' average level, over the paths not yet failed, reaches
  100% (the retirees' year-by-year table). It is not a typical path's year.

**The rules, read.** Each criterion's estimate is the verdict, as registered. Its 95% interval by path settles every verdict
below.
- **Section 4, a utility arm: none qualifies.**
  - UTIL, UTILNM and UTIL3D keep too little of CAND's survival gain over APP: 2.41, 2.15 and 1.94 points short of half.
  - None starts at 95% (UTIL, the closest, at 93.9%).
  - UTIL5D keeps enough survival (0.71 points over half the gain), but spends 1.61% less than CAND over a lifetime and starts
    at 83.6%.
- **Section 4, HYB: fails** on the raise before ruin, 19.1% of the paths that run out.
- **Section 4's fallback, the better of ZERO and FLAT on the same two measures:** ZERO fails (9.8%); FLAT passes both.
  - By the rule's letter, FLAT is the minimal fix.
  - But the two measures leave out spending, and FLAT gives up 8.5% of it, a gap in how the rule was drafted.
  - The failure-year fix meets the same two measures at no cost (section 7). So FLAT is not recommended.
- **Section 7: failDelivered passes on both its bases.**
  - Survival is within 0.25: +0.000 path by path for CAND, and +0.00 for HYB.
  - No raise before ruin: 0 of 197 and 0 of 195 paths that run out.
  - It is recommended.
- **Section 8:** neither UTIL3D nor UTIL5D qualifies (above).

**The predictions, read.** 25 of the 40 checks held; one of those, ZERO's raise before ruin under 10% (9.8%, its interval
6.4% to 14.9%), is unsettled. The 15 misses, in plain words:
- **The utility arms' survival** was predicted too high every time:
  - UTIL -7.8 points against CAND, predicted -1 to -4;
  - UTILNM -7.6, predicted within a point;
  - UTIL3D 89.6%, predicted 92 to 95.5%;
  - UTIL5D 92.3%, predicted 95 to 97.5%.

  The mortality weights were expected to be a lever and are not: UTILNM survives 89.41%, against UTIL's 89.15%. Gamma is a
  lever, in part: gamma 5 wins back 3.1 of UTIL's 7.8 points. The gamma arms also carry the failure-year fix, which changed
  no survival on CAND or HYB.
- **The early cut** held more firmly than predicted:
  - UTIL's first year was 93.9% (predicted 95% or more);
  - UTIL5D's 83.6% (predicted 85% to 93%);
  - HYB10D's retirees' 82.5% (predicted 90% or more).
- **UTIL's other misses:** it did not halve CAND's years at the floor (1.73 years over half), and it raised before ruin on
  18.1% of the paths that run out (predicted under 5%). HYB missed in the same way, at 19.1%. The failure-year fix was
  declared after these two reads, to remove this.
- **ZERO changed less than predicted** (survival +0.00, spending -0.2%), and **FLAT cost far more spending** (-8.5%, predicted
  -2 to -4%).
- **HYB10D cost more survival on the retirees** (-2.7 points against HYB, predicted -0.5 to -2), and cut their years at the
  floor by less than a third.
- **The failure-year fix did what was predicted,** on every check.

**What the households show** (the read's per-household rows, and `curve/household-facts.mjs`;
`curve/results-household-facts.txt` for each household's age, target and guaranteed income):
- S050 is 68, and its guaranteed income covers 46% of its £18,000 target. Every utility arm survives 82.4% to 86.1% there,
  against CAND's 98.9%. Running out of savings there still leaves 46% of the target, a far smaller loss to the utility
  objective than to the success rate. On S090, whose guaranteed income is 10% of the target until it rises to 22% from 68,
  the same arms survive 85.0% to 91.4%, against 95.1%.
- The tenfold setting costs 3.3 to 3.6 points of survival against CAND on S090, S030, S050 and S340F, and 0.3 to 1.1 on the
  other four. Against HYB, its base, those figures are 3.4 to 3.5 and 0.4 to 1.2.
- S304F and S368 survive 93.1% to 99.8% under every solver arm.

**A quick look at the investments** (`curve/tier-read.mjs`; `curve/results-tier-read.txt`: S090 at the light settings,
300 paths; not a result):
- The solver may hold each wrapper at the plan's own tier or up to two tiers safer (src/solver/fast.js, `tiersFor`).
- CAND and HYB hold 20% to 25% in equity for 20 years.
- HYB10D, UTIL, UTIL3D and UTIL5D hold 83% in the first year. By the 10th year the utility arms hold 56% to 69% and HYB10D
  67%; by the 20th, HYB10D holds 38%. UTILNM was not read.

## 10. The answers, the recommendation and what is left

### The four questions

**1. Is the front-loaded cut sound, or an artefact?** Sound. It is what a survival-first objective is asked for.
- For the households retired at the start, the first year is one decision, taken on the same state on every path. CAND,
  ZERO, FLAT, HYB, CANDD and HYBD take it at the floor (80%) on all four. The tenfold arm takes it there on three, and at 90%
  on S050.
- A higher start is bought with survival (the brief's list). No arm moves along that line for free.
- The curve's shape changes the later years, not the start. CAND's raise credit is steepest just above the target and
  ignores the chance of being alive, so from the 21st year CAND averages 107.5% of target. The arms with the mortality
  weights average 101% to 103% (99.7% to 101.0% for the retirees).
- The cut likely works with a second lever: CAND holds the investments much safer than the utility arms (the quick look).

So the cut is not an artefact to remove. Its size is a choice: the exchange rate between a year's cut and the chance of
running out, which is Part C's dislike of cuts.

**2. Is the raise before ruin only presentation, or should ruin be priced differently?** Priced differently, and the fix
costs nothing.
- CAND raises in the year before the money runs out on 30.2% of the paths that run out.
- The year of ruin is charged a fixed price, whatever is left. On a path where cutting cannot postpone the failure, money
  kept for that year earns nothing, so the raise wins.
- Pricing each year of ruin as a cut to nothing (ZERO) only brings it down to 9.8%.
- Charging the failure year by what it can pay (failDelivered) removes it: 0 of 197 paths that run out for CAND, and 0 of
  195 for HYB.
- With the fix, survival is the same on every path, spending 0.007% lower over a lifetime, and the curve the same to a
  tenth of a point.

**3. Which changes give a gentler, more defensible curve, and at what cost?**
- **The failure-year fix** is free, and it makes the curve defensible where it was not.
- **Ten times the dislike of cuts** (tested on the hybrid, HYB10D) gives the gentlest shape found that keeps survival
  within a few points.
  - The retirees start at 82.5% and average 86.3% of target in their first five years, against 80.7%.
  - Their average level is back at target in the 9th year, instead of the 13th.
  - From the 21st year the average level is 101.9%, against 107.5% (the eight households).
  - Against CAND it costs 2.1 points of survival and 1.5% of lifetime spending, and spends 0.4% more while alive. Against
    HYB, its base, it costs the same 2.1 points and raises lifetime spending by 1.5%: most of the spending it gives up
    against CAND is HYB's own.
  - The shape is the average's. Year to year, a path's level changes more often (18.0% of years, against 8.4%) and by
    more (2.02 points a year, against 1.64).
  - On S090 it keeps more equity early, which likely accounts for much of the survival it gives up.
- **The utility curve with survival first** (HYB) keeps CAND's survival and flattens the late rise. But it spends 2.9% less
  over a lifetime (1.7% while alive) and spends more years at the floor (10.2 against 8.7). It is principled, but no better.
- **The textbook objective** (UTIL at gamma 2, 3 and 5, and UTILNM without the mortality weights) costs 4.7 to 7.8 points of
  survival. At gamma 2 and 3, and without the weights, it spends 1.5% to 2.4% more while alive; at gamma 5, 0.2% less. For a
  product that puts survival first, that is worse.
- **Pricing ruin as a cut to nothing** (ZERO) changes almost nothing: the same survival, 0.2% less spending, and the raise
  before ruin only partly gone.
- **Taking the raises away** (FLAT) gives the smallest steps (0.85 points a year against 1.64) and fewer years at the floor
  (7.33 against 8.66). But it costs 8.5% of lifetime spending, for 0.08 points of survival, and its average never gets back
  to the target. The raise credit is what lifts the curve after the early cut, not only above the target.

**4. What should Part C's defaults be, and how should the app present the cut and the raise?**
- **The objective:** the candidate's, with the failure-year fix.
- **The dislike of cuts:** the user's dial, with today's setting the default. A gentler setting should be built on the
  candidate's own penalty, lambda, and tested before it ships. The tested point, on the hybrid, suggests about 2 points of
  survival for a start 2.5 points higher and a return to target four years sooner, but it also changed the investments.
- **Raises:** to 110% of target, as now. Without them, lifetime spending is 8.5% lower.
- **The estate weight (0.02) and the minimum pot:** as they are. Nothing here argues for a change.
- **The early cut,** presented as a safe starting spend: "start at £X a year, 80% of your target; on the typical path you
  are back at your target in about N years". The app computes N for the plan; this review printed only the average
  level's return. Beside it, what the cut buys: for the four households retired at the start, 97.4% survival, where the
  app's guardrails, starting at the target, reach 86.1%.
- **For a plan whose target is high for its savings,** the app says plainly that the plan will tend to spend below the
  target, perhaps for years, because the solver puts not running out first. Turning up the dislike of cuts keeps spending
  closer to the target, and the plan's chance of running out rises.
- **The late raise,** presented as what good markets would allow: "if markets do well, you can spend above your target
  later on". It belongs in the fan of outcomes, not the headline.

### The recommended settings, with their costs

Against today's candidate, on the eight households:

| Setting | Recommended | Survival | Lifetime spending | Spending while alive | Retirees: first year; average back at target |
|---|---|---|---|---|---|
| The failure year at what it can pay | on | +0.000 | -0.007% | -0.010% | 80%; the 13th year (unchanged) |
| The dislike of cuts | today's, the default | | | | 80%; the 13th year |
| A gentler setting | to be built on the candidate's lambda and tested; the tested point is the hybrid at ten times (HYB10D) | -2.10 | -1.48% | +0.36% | 82.5%; the 9th year |
| Raises | to 110%, as now | without them +0.08 | without them -8.52% | without them -7.85% | |
| The estate weight and the minimum pot | as now | | | | |

### Why the textbook objective does not win here

Expected lifetime utility is what a backward induction solves in the textbook. It is coherent, and it smooths spending by
itself. It loses here for three reasons, all in the read:
- **It charges running out by the cut it brings.** S050's guaranteed income covers 46% of its target, so running out of
  savings is a smaller loss to it than to the success rate, and it accepts more of it: 86.1% survival at gamma 5, against
  CAND's 98.9%. The success rate counts the same path as a failure.
- **It discounts late years by the chance of being alive.** At gamma 5 its paths run out at a mean age of 88.1, against
  CAND's 85.3. Counted by the chance of being alive when it happens, its risk of running out is 2.26 points against 1.24.
  That is closer in points than the success rates (1.02 against 4.70), though still 1.8 times CAND's, and it leaves out the
  paths that end below the minimum pot (165 against 40). The weights do not cause the lost survival: without them (UTILNM)
  survival is 89.4%, against 89.2% with them.
- **It keeps more equity.** At gamma 2 to 5 it holds 83% in the first year on S090, where CAND holds about a quarter (the
  quick look). One parameter sets both its dislike of uneven spending and its aversion to risk.

So it answers a different question from the app's headline. If the app ever led with the chance of running out while
alive, rather than the success rate to the plan's end, it would be worth a second look.

### What this does not show
- The panel is eight households and one seed, all single, so the mortality weight is one person's. A couple's should be the
  chance that either is alive.
- The utility arms value the estate only at the plan's end, not at each age of death.
- The investment figures are a quick look, on one household at the light settings.
- The dislike of cuts was tested at one point, ten times, on the hybrid. The candidate's own lambda was not scaled.
- "Back at target" is the average level's, not a typical path's.
- Not tested:
  - a first year held at the target, which would price a guardrail-like start directly;
  - a dial that leaves the investments to the survival-first objective;
  - Epstein-Zin preferences, which give risk and the smoothing of spending a dial each and are built for backward
    induction.

### What would come next
The maintainer agreed the recommendations on 29 Oct and asked for the explanation above for plans whose target is high for
their savings.
1. **The dial:** the candidate's lambda at three and ten times, and HYB at three times, on these households, with the tiers
   each holds reported.
2. **The start at target:** the first year held at the target and the rest solved, to price a guardrail-like start.
3. **The fix into the solver:** `failDelivered` on by default. That is CC's work. It needs the e3pcls pin refreshed and the
   deep review's tests.
