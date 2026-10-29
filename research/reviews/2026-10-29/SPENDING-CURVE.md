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

(to follow)

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
