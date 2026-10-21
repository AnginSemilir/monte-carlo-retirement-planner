# External review of the solver research, 21 Oct 2026

For the maintainer and for the agent that runs the research. Part A is the analysis, Part B the instructions, Part C the
sources. Every figure is cited to a file in this repository or printed by a script in `research/reviews/2026-10-21/`,
run on commit 3771bb2 (`claude/project-access-i58m0x`; the review's own files are on `review/external-2026-10-21`). The
review's own runs are exploratory in this project's terms: seeds 99001 to 99005, 424242 and 515151, outside the
registry, and the tuning seeds 7001 and 7002 for the random-number check; no held-out seed touched; nothing registered.
Like the project's runs, they simulate in the solver's own model (`runPolicy`), except section 7 of the results, which
compares that model with the engine. Their output is `research/reviews/2026-10-21/results-exploratory.txt`.

## Summary

**Your sense that the project is overwrought with rules is right about the cost, and the value is real but
concentrated.** The record shows the safeguards caught real errors: a solver bug whose figures had already reached you,
a statistical rule that read "no material harm" for a true loss half the time, a random-number generator that cycled,
households chosen on the very seed the result would be reported from (`record/saves-and-misses.md`). Most of those
catches came from the two reviewer agents checking claims against the code and the data, and from your own questions;
the scripts and preflights stopped tests that could not have measured what they claimed before they ran, and make whole
classes of error hard to commit. The cost sits elsewhere. One session's plan audits from 24 to 30 Sep, 201 runs, took
35.6 hours of reviewer time and 761 million input tokens; 282 of 589 audits failed; about half the minor findings and a
quarter of the blocking ones are about the plan's own text, and 10 to 16 of the 47 blocking overclaims are disputes over
the regime's own evidence-grade labels. By the project's own count, 635 commits touched PLAN.md against 61 that touched
the solver code (`LLM-LIMITATIONS.md`).

**The errors that got through are a class no rule targets: numbers that cannot be right, and checks that did not cover
what they claimed.** Three defects sit on the product path. The exact final year's NaN (O200, logged 20 Oct with its
reach "to be counted") leaves table cells with no move chosen, and the damage spreads backwards. On the product baseline
with withdrawal moves only it affects 11 of 12 households tested, wipes three tables outright and costs up to 3.7 points
of survival; through the product's own entry point it wipes S224's table for a user who blocks raises and risk changes
(-2.9 points). The fix is one line. Second, the solver's model never taxes the gain made when the cash buffer is topped
up from the taxable account, which the engine does: the same policy survives 1.55 points more often in the solver's
model than in the engine on S330, and 3.3 to 3.7 points more on a household with a large untaxed gain. The test that was
to keep the two models together ran only under the app's rules, which never top up the buffer, and 7u, like nearly every
result, was scored in the solver's model. Third, when the solver asks for one tier more risk, the engine carries out two
tiers less; nothing has exercised it, because every library household's pension already holds the top tier and no test
executes such a table in the engine. Separately, four 2026/27 tax rules are out of date or wrong, and no fund or
platform charges are modelled, which on a marginal plan is worth 6 points of survival at 0.5% a year.

**7u already answered most of the product question.** On 55 held-out households the candidate did no material harm on 52
and gained between 1.8 and 21 points on ten, the largest where the shipped settings misread the bridge years (share 0.95
+20.7, S360 +12.5, S370 +6.3). 7u-F was proposed on 10 Oct to settle three small losses (0.16 to 0.39 points). Since 11
Oct it has waited for the final candidate, and since 18 Oct for every open gap over a point to be fixed or shown out of
scope, a condition that counts gaps between the table's own forecast and simulation. Those gaps are an unreliable guide
to decisions. In the review's runs, interpolating in probit space closed 3 points of S380's table gap and left its
simulated survival unchanged; interpolating in probability closed 8 of its 9.6 points and made the policy worse; on
S070, interpolating the allowance axis closed most of the table's gap and made the policy 3.7 points better. A table gap
is a lead to follow, not a verdict: 7u-F should be released on measured decision gaps.

**The project's own stopping rule has never been able to fire.** `RULES.md` section 8: "Grid and cliff work stops when
the optimality-ceiling gap is below its target." The ceiling (schedule step 8h, proposed by the outside review of 25
Sep) was made the last step before Phase 4 on 26 Sep and has never been sized or built. So no one can tell when the grid
and cliff work is done, and every table gap has had to be chased on its own terms. The purpose test of 23 Sep
(`audit-bestof.mjs`), which asks whether any of the table's top six moves beats the policy's own, last ran on 24 Sep,
before the candidate existed. The review adds a cheaper and more sensitive measure: solve the same household several
ways and compare the policies on the same paths. On S070 it finds the shipped settings' withdrawal policy 3.7 points
short of the same solver with the allowance axis interpolated, seven times the project's 0.5-point target (the project's
ADOPT-PI read of 5 Oct pointed the same way, and the candidate carries the fix). With that axis interpolated, as the
candidate has it, the two variants tried on top gain 0.05 points (the gain axis interpolated too) and lose 0.72
(interpolation in probability).

**The recommended course.** Fix the three defects now, with tests that fail loudly, among them invariant checks on every
solve and cases with known answers, and bring the tax rules up to date. Reset the governance: a short state file, an
eight-line checklist, the mechanical safeguards kept, the reviewers pointed at designs and claims instead of the plan's
prose, the per-item forecasting retired. Release 7u-F on decision gaps and run it once, with a rule that decides. Then
build the rest of the checks the project lacks: a convergence table and the optimality measures. Let those checks, not
registered predictions, judge method changes, starting with the bridge coordinate designed on 24 Sep and never built.

## Part A. The analysis

### 1. What a good analysis of this project looks like

A planner earns trust by answering six questions, each by a method someone other than its builder can check. The order
matters: a later question is only worth asking once the earlier ones hold.

| # | The question a user would ask | The method that answers it | What good looks like |
|---|---|---|---|
| 1 | Are the figures I see right? | Engine fidelity checked against outside references and independent recomputation; the Monte Carlo precision of each figure; sensitivity to the return assumptions | Every simplification listed with its measured effect; each survival figure carries its interval; the table's own number never reaches the user |
| 2 | Does the solver compute what it claims? (verification) | Invariants checked on every solve; cases with an independently known answer; convergence as resolution rises | No invariant violation ever; known cases matched to tolerance; the policy's simulated result stops moving as the grid is refined |
| 3 | How close to the best possible are its decisions? (optimality) | Lower bounds (fixed rules, the shipped settings); a distance-to-best measure that does not trust the table: policies compared on common paths, the purpose test, optionally an upper bound | The policy within the project's own targets of an upper bound on the best (the ceiling): 0.2 points on the panel mean, 0.5 on any household (`RULES.md` section 8); until a ceiling exists, no alternative found beats it by more than that |
| 4 | Is the evidence for each claim sound? (inference) | Paired comparisons, held-out seeds, decision rules fixed before confirmatory runs, enough paths that "inconclusive" is rare | Confirmatory tests are few, registered, powered and decisive; exploratory work is labelled and cannot change a default |
| 5 | Will the code stay right as it changes? | The size of the configuration space, research code in the product path, tests on the product path | A small product path, fully tested, free of research switches |
| 6 | Does the process produce reliable results at a sane cost, given an LLM runs it? | Where errors are actually caught; cost per settled result; whether each safeguard treats a failure mode's cause or its symptom | Checks are executable and aimed at the solver; the documents the agent must read are short enough to read whole |

### 2. What the review found

#### Question 1: the figures

The review read the engine independently of the project's own tests: the return model, the random numbers, how survival
is counted, the 2026/27 tax figures, and the interface between the solver's model and the engine.

**What holds.** Every survival figure is simulated, never read from a table (`RULES.md` section 3, variable 32), so a
table that reads several points high (Question 3) never reaches a user. The random numbers are sound: path i of a seed
starts at seed + 7919i on mulberry32's single cycle of 2^32, and mapping every stream of seeds 7001 to 7014 and three
others onto that cycle puts the closest two 462 draws apart, against the 124 to 244 draws a path of 60 to 120 years
uses; correlations between neighbouring paths, between seeds and between successive years of a path are all within about
two standard errors of zero, and the draws' mean, variance and kurtosis are those of a standard normal. The engine and
the solver grow money by the same formula (App.jsx l.2509, solve.js l.160-163); the Gauss-Hermite nodes and the
three-world rule are correct; both count a failure the same way (a year more than £1 short, insolvency before pension
access, or a final pot under the minimum). Most 2026/27 figures are right, from the personal allowance and its taper
through National Insurance, the capital gains exemption and rates, the ISA, lump-sum, money-purchase and annual
allowances, to the State Pension and the inheritance tax bands.

**F0. The research's figures come from the solver's own model, and that model never taxes the gain made when the cash
buffer is topped up.** Every solver move keeps the cash buffer topped up from the taxable account (the sweep, solve.js
l.135). The engine books the gain on that sale and taxes it the next year (App.jsx l.2447-2451 and l.1970). The solver's
forward model books it after the year's capital gains tax has been worked out and has nowhere to carry it (fast.js l.361
and l.569-573); `model.js` has a carry (`state.cgtCarry`), which it uses for gains made paying the bill, but its sweep
(l.503-518) leaves the carry out. In both, the gain is never taxed. On a test household holding a £400k taxable account
with £240k of gain, the engine charged £66.6k of capital gains tax over the plan and the solver's model £2.2k, and the
solver's model read survival 3.3 to 3.7 points higher on the same 3,000 paths. The library households start with no
gain, so there the effect is smaller, but it runs one way. The same solved policy, executed by the engine and by the
solver's model on 2,000 common paths (results-exploratory.txt section 7):

| Household (taxable account) | Solver's model | Engine | Difference (se) | Paths surviving only in the solver's model / only in the engine |
|---|---|---|---|---|
| S330 (£427,500) | 70.95% | 69.40% | +1.55 (0.28) | 31 / 0 |
| S092 (£427,500) | 53.15% | 52.45% | +0.70 (0.19) | 14 / 0 |
| S224 (£95,000) | 44.20% | 43.85% | +0.35 (0.13) | 7 / 0 |
| S070 (£48,000) | 64.00% | 63.70% | +0.30 (0.12) | 6 / 0 |
| S032 (£427,500) | 67.85% | 67.55% | +0.30 (0.12) | 6 / 0 |
| S008 (£19,000) | 63.35% | 63.40% | -0.05 (0.05) | 0 / 1 |
| S172 (£22,500), S194 (£9,000), S028 (£202,500; 99.55% either way) | | | 0.00 | 0 / 0 |

Over the nine, 64 paths survive only in the solver's model and one only in the engine. 7u's panel holds seven of the
library's taxable-account-heavy households (S028, S088, S144, S150, S212, S214, S394) and six more with £95,000.

It matters for two reasons. The tables are solved in the same model, so they under-price spending the taxable account
early whenever it holds gains. And the research's survival figures are this model's, not the engine's: 7u's audit
(`audit-7u.mjs`) is one of 69 scripts in `research/solver` that score by calling `runPolicy` or `runSolvedPath`; only
`bridge-gate.mjs` executes a solved table in the engine (`select-phase4.mjs` runs the engine for the app's own rules).
"The table only chooses; the real engine executes" (`HOW-IT-WORKS.md` section 7) describes the product as designed, not
how the research measures. The test that section promises, `solver-model.test.mjs`, compares the reduced model with the
engine only without the sweep, and `solver-fast.test.mjs` compares the fast flow with `model.js` one year at a time, so
the two models' shared omission passes both. The app does not call the solver yet, so no user has seen a solver figure.

**F0a. Four tax rules are out of date or wrong, and charges are missing.**

| Item | The engine | 2026/27 | Effect |
|---|---|---|---|
| Dividend rates (App.jsx l.514-515) | 8.75% and 33.75% | 10.75% and 35.75% from 6 April 2026; 39.35% unchanged (LITRG; Deloitte's tables) | Under-taxes the taxable account's 2% dividend yield |
| Scottish starter and basic limits (l.456-458) | £15,397 and £27,491 (2025/26) | £16,537 and £29,526 (gov.scot) | About £32 a year, Scottish taxpayers only |
| Savings interest for a Scottish taxpayer (`savingsTax`, l.1283-1289) | taxed on the Scottish ladder | UK rates and bands (LITRG) | Interest charged at 42% instead of 20% between £43,662 and £50,270 of income |
| Thresholds | constant in real terms | frozen in cash terms to April 2031 (LITRG), so about 12% lower in real terms by then at 2.5% inflation, and staying lower once indexation resumes; savings rates rise 2 points from April 2027 | Under-taxes every year after the first; the config comment still says "frozen to 2028" |
| Charges | no fund or platform charge (only a trading charge on tier switches, App.jsx l.2475-2477) | the default return preset, BlackRock's capital market assumptions (App.jsx l.218-236), describes index returns before any fund or platform charge | S080 survival under the plan's own rules 55.9% with no charge, 49.8% at 0.5% a year, 44.3% at 1% (taken off every tier's return, cash included; 3,000 paths) |

One error runs the other way: reinvested dividends are never added to the taxable account's cost, in the engine or
either solver model (no call of `giaAddBasis` or `addBasis` for them), which overstates later gains. Smaller points: the
year fraction reads the valuation date in UTC and the year's bounds in local time (App.jsx l.994-1001), so a machine
west of Greenwich gives a 1 January plan a 1% first year; `HOW-IT-WORKS.md` section 3 says the state tracks the MPAA,
which it does not, and the figures are unaffected only because the engine never levies the annual allowance charge, it
warns (App.jsx l.1643-1646); the default private pension age is 58, a year above the legislated 57 from April 2028. Two
things would bite only when the app calls the solver: with guardrails on, the engine overwrites the table's spend level
(App.jsx l.2198 and l.2258), and the engine's cost lookahead is not switched off under a table (l.2331).

What the figures depend on most is still the return model, an assumption rather than a computation; the planned
perturbed-world and historical checks (`LITERATURE.md`, "Are we doing the same thing") are the right test of it and have
not been run for the candidate.

#### Question 2: does the solver compute what it claims?

**F1. The final-year NaN (O200) silently wipes out tables.** `finalYearExact` (src/solver/solve.js:205-229), on in the
product through `PRODUCT_BASELINE.finalIntegral`, integrates the estate over the surviving shocks in u = Φ(z) on [u0, 1]
and calls `PhiInv(u)` unclamped at line 222. When the floor is cleared only by shocks beyond about z = 7.7, the top
quadrature nodes' u rounds to exactly 1 (beyond 8.3, u0 itself does), `PhiInv` returns Infinity, the estate becomes
Infinity minus Infinity, and the move's score is NaN. A NaN score never wins (`score > bestScore + eps` is false), so a
cell where every move is NaN keeps the loop's starting values: survival -1, estate -Infinity, move 0 (solve.js:1196).
One year earlier every move whose quadrature reads touch that cell scores `wB x -Infinity`, so the -Infinity estate
spreads backwards and up the wealth axis. In the forward chooser the same scores make `chooseAction` return move 0.

| What was run (results-exploratory.txt section 1) | Cells with no move chosen | Table's opening forecast, as is / clamped | Policy's simulated survival, as is -> clamped |
|---|---|---|---|
| Product baseline, withdrawal moves only, 30 points: 12 households | on 11 of 12; tables wiped on S194, S224, S330 (and S364, hopeless either way) | S224 0.00% / 42.76% | gains on 9 of 12, six of them over 1.7 points: S172 +3.65, S224 +2.85, S330 +2.40, S008 +2.23, S126 +2.08, S194 +1.75; 1 path lost in 48,000 |
| The same at 60 points | S070 629,784; S224 every world; S380 the poor world | S070 at the clamp in all three worlds | (policy falls to move 0 wherever its reads are poisoned) |
| Through `solvePlan`, S224, default levers, 30 points | 3,330 | unchanged | unchanged on 2,000 paths |
| Through `solvePlan`, S224, raises blocked and no consent to change risk | 468,900 | 0.00% / 42.76% | 41.30% -> 44.20% (+2.90, se 0.38; 58 saved, none lost) |
| Through `solvePlan`, default levers, 60 points, S224 and S380 | 0 | | |

Under the default levers the raise and tier moves mask the fault: a move that fails this year scores a finite penalty
and is chosen where every other move is NaN. That masking is luck. A user who turns off raises and risk changes, both
offered as levers, gets the wiped table. The project found the mechanism on 20 Oct with a planted call
(`results-finalyear-nan.txt`) and registered it as O200, its reach to be "counted on product-scale solves ... before
7u-F's assembly"; it is the same pattern as O199 in the adaptive reference.

**F2. Nothing checks the solver's output for impossible values.** The test suite is large (97 test files in
`research/tests/`) and checks specific claims well, but no check asserts finite values, survival in [0, 1] and a move
chosen on every cell of a product-baseline solve. The nearest, `solver.test.mjs`'s B1, checks on every cell that the
score never falls as a pot grows, on one household at 10 points without the exact final year, and its comparison lets
NaN through. A chosen move on every cell would have caught O200 in the first solve that hit it, at any time since the
exact final year became the default on 25 Sep; under the default levers S224 alone has 3,330 such cells. The NaN in the
exact-step code passed REF-STEP's unit test with a plant, its preflights, mutation runs and audits (`LLM-LIMITATIONS.md`
section 4).

**F2a. The engine carries out the solver's "one tier more risk" as "two tiers less".** The solver lists a wrapper's
tiers as the plan's, then up to two below, then, with `tiersAbove`, the tier above (src/solver/fast.js l.106-122), so
"one above" is index 3 when two below exist. The engine's list for executing a solved table holds the plan's tier and up
to two below, "never above" (App.jsx l.1849-1861), and reads the solver's index with `profs[Math.min(index, profs.length
- 1)]` (l.2482-2483), so index 3 becomes the lowest-risk tier. `solvePlan`'s default 'auto' rule switches `tiersAbove`
on for a consenting household below the top tier whose plan is thin (under 85% simulated), and its keep-or-drop check
simulates in the solver's own model, which cannot see the mismatch. Nothing has exercised it: every library household's
pension holds the top tier (the suite's own note, `solver-plan.test.mjs` l.54), none of 7u's units used a tier above (it
prints "no tier above the plan" for all 55), and the one test that solves a household with a tier above (l.55-58) never
executes its table in the engine. The cost to an affected household has not been measured. (Found by the review's
independent solver reader and confirmed against the code.)

**F2b. The move menu is smaller than the design describes.** `buildActions` (solve.js l.112-145) offers four pension
ceilings (none, the allowance, the basic-rate limit, whatever the year needs), two orders of the ISA and the taxable
account, and three re-wrap options: 24 moves before spend levels and tiers. `HOW-IT-WORKS.md` section 4 describes a
higher-rate ceiling, a midpoint in every band, a choice to sell the taxable account up to the capital gains exemption,
and four contribution levels in working years; none is in the solver's menu (`buildActions` sets `contrib` to null). The
corner argument that justifies a small menu holds for the tax schedule but not for the continuation value, which is
curved, so an optimum can sit inside a band. "Close to the best possible" therefore means best within this menu until a
richer menu is tested.

**F2c. Two structural approximations in the shipped settings that the candidate already corrects.** In
`PRODUCT_BASELINE` each world's table assumes the household knows its world from next year on (the three-world average
of action values is the QMDP heuristic), and the tables are solved as if changing tier were free, while the chooser
charges the switch and applies a margin. The candidate's `jointWorlds`, `tierState` and `switchCharge` remove both
inconsistencies. `jointWorlds` left S070's withdrawal-only policy unchanged in the review's runs, and the tier-switch
correction has nothing to act on without tier moves, so neither is measured here; both are still reasons to prefer the
candidate's construction.

**F2d. Smaller points.** A NaN pot is read as an empty one (grid.js l.310: `!(v > 0)` sends it to the zero node) and an
infinite one as the richest cell (l.312), rather than raising an error. The O199 pattern is still in `adaptive.js`
l.274. The estate is interpolated linearly in log wealth, which reads high by about 0.6% at the middle of a cell at 30
points and accumulates over the backward pass; with small estate weights its effect on decisions is likely small, and it
is unmeasured. The tabulated Gauss-Hermite weights (solve.js l.60) sum to 1 - 1e-6, so no stored survival before the
final year reaches 1; harmless.

#### Question 3: how close to the best possible?

**F3. The table's error is an unreliable guide to the quality of decisions.** Much of the research since 26 Sep chases
gaps between the table's forecast and the simulated outcome ("over-read", "under-read", "the table reads x against y
run"). The review compared policies directly, on the same 4,000 paths (results-exploratory.txt sections 2 and 3):
- Interpolating survival in probit space instead of log-odds moved the tables' forecasts by up to 3.3 points (S380:
  33.50% to 36.82%, closer to the simulated 43.10%) and left every policy's simulated survival within 0.05 points, on
  five households at 30 wealth points and three of them also at 60.
- Interpolating in probability (the solver's own `SOLVER_INTERP=linear`) made one policy better (S070 +0.65) and four
  worse (S172 -0.57, S194 -0.42, S380 -0.28, S224 -0.17). The table's gap to simulation moved with the policy on three
  (S070's gap shrank; S172's and S194's grew) and against it on two: S380's gap closed by 8.3 of its 9.6 points and
  S224's by most of its 1.9, while their policies got worse.
- Interpolating the lump-sum-allowance axis instead of snapping it (`pclsInterp`, already in the candidate through
  `RESEARCH_OPTS`) cut S070's table gap from +6.2 to -2.8 points and made its policy 3.70 points better (148 paths
  saved, none lost); S224 +0.60, S008 +0.45, S172 and S194 unchanged. Here the table gap was the symptom of a real
  decision problem. With the axis interpolated, probability interpolation turns from 0.65 points better to 0.72 worse
  (se 0.14), which suggests its gain had been a partial workaround for the snapped axis.
- On S070 the snapped table's 6-point optimism sits inside each world (+5.9, +7.1 and +2.0 points), not in the
  three-world weighting (the simulated worlds at the mixture's weights give 64.42% against 64.22% with the shift drawn
  from its prior), and it is not a matter of resolution: more wealth points, more quadrature nodes, five worlds, joint
  worlds and ten share points each leave the policy within 0.05 points. Most of it is the snapped allowance axis.

The project's held-out data fits. In 7u, SHIP's opening table misread bridge 6 by -90.8 points, S366 by -96.1 and share
0.90 by -97.5, yet the candidate, whose tables read those households far better, beat SHIP there by only +0.04, +0.13
and +0.30 points (`results-7u.txt`, the REPORTED line on SHIP's year-0 table errors and items 1). SHIP survives 99.45%
to 99.56% on those households, so there was little to gain: a 90-point table error cost at most half a point.

So a table gap is sometimes the symptom of a decision problem and sometimes not, and its size says little about which.
It is a lead, not a verdict. The measure of the solver is its policy's outcome against the best available alternative,
simulated in the engine. (The review's comparisons ran in the solver's own model, as the project's do. F0 biases each
policy's level; its effect on the difference between two policies is not measured, one more reason the decisive
comparison runs in the engine.)

**F4. Distance to the best policy is not measured, so the rule that should end the grid and cliff work cannot fire.**
Beating fixed rules (32 of 41 in Phase 2, `QUESTION.md`) and the shipped settings (7u) are lower bounds only. `RULES.md`
section 8 sets the right target, "policy optimality within 0.2 points of the ceiling on the panel mean and 0.5 on any
household", and the right stopping rule, "grid and cliff work stops when the optimality-ceiling gap is below its
target". But the ceiling (step 8h: the hindsight bound on failing paths, then the penalised bound, from the outside
review of 25 Sep) was made "a gate before Phase 4 ... read once" on 26 Sep, runs "last, after every other step", and is
"not yet sized" (`PLAN.md`, the 8h row). The purpose test of 23 Sep (`audit-bestof.mjs`, `results-bestof.txt`) asked the
right local question: at visited states, does any of the table's top six moves, followed by the policy, beat the
policy's own move? It found the pick best within noise at 159 of 160 positions; its criterion on the whole objective
failed as written (13 of 160 positions beyond two standard errors against an allowance of 5%, ten of them ties worth
under 0.06 points). It last ran on 24 Sep, on code that predates the candidate. The review's runs show its limit too: on
S070, at the states where the log-odds and probability policies disagree (24% of those visited), swapping in the other
policy's move one state at a time gains -0.03 points (se 0.06, 60 states), yet the two whole policies differ by 0.65
points (results-exploratory.txt section 6). Spread over about eight such states a path, 0.65 points is about 0.08 a
state, which a one-state check needs several hundred sampled states to see. Comparing whole policies built different
ways, on common paths, sees it directly: one more solve and one more simulation per variant. The best variant on a
household bounds from below what is achievable there, so the gap to it bounds from below the policy's distance from the
best. On S070 that bound is 3.75 points for the shipped settings' withdrawal policy (the allowance and gain axes
interpolated), and none was found for the candidate's interpolation among the two variants tried on top of it; on S172,
S194, S224 and S380 the log-odds policy beats the probability one.

**F5. The opening move passes.** The policy-improvement check at the opening (every move, then the policy, on 3,000
common paths; run on the code as is, where S070's tables have 71,733 cells with no move chosen and clamping moves its
policy by 0.13 points) finds no move better than the policy's own by more than noise on S070: the best alternative is
+0.13 points (z 2.0 against a one-sided Bonferroni line of 2.85), and the 24 moves span only 0.44 points of survival.
Withdrawal order at the opening matters little there, as the literature leads one to expect (`LITERATURE.md`: DiLellio
and Ostrov).

#### Question 4: is the evidence sound?

**F6. The statistics are careful; the decision rule cannot finish.** The comparisons are paired on common paths, held
out, registered and read by exact tests with Holm adjustment, with error rates calibrated by simulation (`RULES.md`
section 8). In that paired, pre-gated design it is better practice than most of the published work the project compared
itself with, though `LITERATURE.md` rates the published work better on evaluation, since held-out seeds of the same
model are not out-of-model data. 7u itself read well for the candidate: no household read harm, the mean survival change
was +1.11 points at estate weight 0.02 and +1.16 at 0.01, 37 households moved up and 10 down at 0.02, and the pooled
floor over the 47 households with no expected gain was +0.29 (+0.26 to +0.32) (`results-7u.txt`). But 7u's rule required
every one of 55 households to clear a margin of 0.25 or 0.5 points against SHIP, at 8,000 paths, where the interval's
half-width reaches 0.36 to 0.49 points on the households with the most differing paths (S224 0.36, S380 0.44;
`record/u7count.py`). A small true loss of 0.2 points there is then likely to read INCONCLUSIVE (the power table of
`predictions/confirm-7u.md` reads a drift story INCONCLUSIVE 77% of the time), and an INCONCLUSIVE branch opened a chain
of follow-ups (its "Decision fed"). 7u-F, proposed on 10 Oct for S224 and S380 at 16,000 paths, has since waited for the
final candidate (the maintainer's hold of 11 Oct 11:03), been widened to the deposit households and a by-world item (18
Oct 07:50), made to wait for every open gap over a point (18 Oct 17:19), and tied to the reference choice and its
assembly (20 Oct 14:30). The three unsettled households are a 0.36-point loss on S224 (interval -0.72 to 0.00), a
0.16-point loss on S380 (-0.61 to +0.28) that comes with a whole score 0.27 higher (interval -0.25 to +0.80) and £181k
more estate, and a 0.39-point loss on S364, a plan that survives 0.42% of the time under SHIP and 0.04% under the
candidate (`results-7u.txt`, estate weight 0.02).

**F7. The gaps holding 7u-F are mostly table gaps.** The 18 Oct 17:19 ruling releases 7u-F when every open gap over a
point is fixed or shown to lie outside the candidate's scope. Sorted by kind, the open items on its path include:
- gaps between the table and simulation: O133 (both arms' year-0 tables above simulation on the broad households), O139
  (S380's world 0, +4.25 at 30 points, gone at 120), O145 (S224, -1.90 at 120 points), O180 (S370's world 0, 9 to 13
  points), O189 and O198, and O194, whose gate, the reference choice, is made, so it closes when 7u-F's assembly carries
  it;
- measured differences in simulated outcomes: O191 and O179 (the reference change costs 0.25 to 0.58 points in the bad
  world and gains 0.11 to 0.21 by the mixture; its root-cause step FD-X is recorded as gating nothing in 7u-F) and O132
  (S364, reported only);
- code and numerics: O199, O200, PR35 (an unsigned quadrature miss under the package) and PR34;
- premises whose rows name 7u-F: PR24, PR29 and PR31, on how the references read the bridge's step and order;
- a missing read: O195 (S366 unread at the frozen candidate).
F3 shows why the first group is the wrong release condition: a table gap is a lead, not a verdict, and should hold
nothing until it shows a measured effect on outcomes. Since 7u read on 10 Oct, the record shows 23 more test reads, 30
registered launches (and 70 more measurement and preflight runs), 41 deep-review entries, 143 plan audits (60 FAILs), 68
new register rows of which 47 are still open, and 23 new premises; the deep reviews of 19 and 20 Oct put the distance to
7u-F at seven, then six, plus or minus two tests while preconditions were added (`record/since7u.py` over `PLAN.md`,
`PLAN-HISTORY.md`, `review-log.md`, `deep-review-log.md` and `runs.log`).

**F7a. Two smaller integrity points.** Seed 7004, registered as held out for 7o and as Phase 4's second seed
(`RULES.md`), has since served as the replication seed of three development tests (AX-HO, FOOT-S366, HO-DEP:
`predictions/diag-axho.md` and others). The launcher does not reserve it, so no enforced rule was broken, but Phase 4
needs a fresh replication seed. And the candidate has never been compared with a fixed rule: 7q is "after 7u" and
unsized; the 32-of-41 and +6.16-point headlines date from 21 to 23 Sep, before the regimen and the reader.

#### Question 5: will the code stay right?

**F8. The product path carries the research.** The solver reads 93 distinct options. `grid.js`'s hot read alone carries
F1 v1 and v2, #106's dead-corner options, COV-B, NODE-1, EDGE-SPLIT, the reader with five split modes and a log-odds
blend, and a probe hook; `solve.js` has 28 lines marking research-only or test-only code. Each is off by default, and
each is a branch every product read evaluates and every reviewer has to reason past. Of the plan's 35 "premises at risk"
(PR1 to PR35), 23 concern the bridge reader and its references, most with its own test to run. The structural fix
designed for the same problem on 24 Sep (`f2-design.md`) offered two ways: A, a coverage coordinate in the bridge years
(accessible money over the bridge's remaining need, with the cliff at a fixed node), and B, an extra share node at the
cliff. The maintainer approved building and testing F2 that day, the design leaning to A; on 4 Oct agreed to build A
behind a research option; and the same day accepted the deep review's recommendation of B instead (`items/COV.md` l.3
and l.62-64; `PLAN-HISTORY.md` l.2976). B was built as COV-B and read on 5 Oct with two of its three items inconclusive:
its step-year node overshoots on bridge 4 and S126, and S126 loses survival (`PLAN-HISTORY.md` l.3013). A, the change of
coordinate, has never been built: the grid supports only the total-wealth and pot coordinates (`grid.js` l.116).

**F8a. The product solve is far slower than its target.** `HOW-IT-WORKS.md` section 6 sets "a solve in under four
seconds on a laptop and under ten on a phone". Through `solvePlan` with the default levers (144 moves), S224's solve
took 104 seconds at 30 wealth points on this review's two-core machine with little else running (results-exploratory.txt
section 9); the withdrawal moves alone took 25 seconds for S092. On a laptop a few times faster that is still many times
the target, and the candidate's package adds 34 to 47%. The plan gates solve time only against today's product solve
(Phase 4's fifth criterion: at most 25% slower, `PLAN.md` l.1506-1508), never against the target.

#### Question 6: the process

**F9. What the safeguards caught, what they missed, and what they cost.** The record (`review-log.md`,
`deep-review-log.md`, `lessons.md`, `PLAN-HISTORY.md`; tallied for this review in `record/saves-and-misses.md`) shows 28
documented catches of a false result, a wrong figure or a test that could not measure what it claimed. The weightiest:
- the plan-auditor found that `runPolicy` dropped a failed path's spending totals, after options resting on "S070
  delivers 3.5% to 9.2% less" had gone to the maintainer; corrected, -0.1% to +3.8% (`review-log.md`, 24 Sep 15:06);
- the auditor found that the exact survival interval read "no material harm" for a true loss at the margin about half
  the time; 20 of 7e's 25 such reads became inconclusive (`PLAN.md` l.847), and every test since reads the exact rule
  and a guarded unconditional interval together (`RULES.md` section 8);
- the auditor found that the simulation of the pooled floor used a generator that cycled every 10,466 draws, so its
  "4,000 runs" were a few dozen repeated, after its figures had been cited to the maintainer (`PLAN-HISTORY.md`);
- the auditor caught M14b's households being chosen on the seed the result would be reported from;
- the maintainer's own question exposed K5's target run under three settings different from its cells; the maintainer's
  "diagnose first" stopped a third bridge fix being blamed for harm another error caused;
- the deep reviewer and two outside reviews caught misread verdicts, a test that could only read INCONCLUSIVE, and the
  median-for-mean slip in the reader's reference.
The scripts and preflights caught a different kind of error before it could become a result. In October alone they
stopped a test whose household could not exercise the reference (AX-HO, found only by the preflight's differing-moves
count), a mistyped floor (FOOT-S366), a fixture fault no planted check could fail (O149), and a screen that chose
households where the reference could not act (HO-DEP) (`lessons.md`). With the launcher and the fair-test gate, they
make whole classes of error (mixed code, mismatched settings) hard to commit at all.

What got through is a different class: numbers that cannot be right, and checks that silently did not run or did not
cover what they claimed. O199 and O200's NaN; the fidelity test against the engine run only without the sweep every
solver move uses (F0); a policy index stored in a byte while the menu had 360 moves (found by chance); an exact binomial
tail that underflowed to 1 above 1,075 tosses; the full test suite stopping at file 41 of 82 for 11 days; CI red for 32
hours unseen; a guard test failing since 9 Oct in neither the pre-commit hook nor CI; the household band file outside
git and lost in a container restart. None of these needs judgement to catch; each needs an assertion that runs every
time.

The cost is high and mostly not where the catches are. One session's plan audits from 24 to 30 Sep, 201 runs
(`review-log.md` holds 251 receipts for those days, so this is a floor), took 761 million input tokens and 35.6 hours of
reviewer time (`drafts/framework-feedback-review.md`). Each works from the diff (`.claude/agents/plan-auditor.md`), so
the cost is in how many audits run and fail: over the whole period 282 of 589 failed. By kind, 31% of the blocking
findings concern the research's substance (figures, code, test design), 30% how strongly something is claimed or
decided, 27% the documents themselves (stale text, rows not moved, format, times) and 10% the register and ordering; of
the minor findings, 47% concern the documents, stale text alone 157. Between 10 and 16 of the 47 blocking overclaims are
disputes over the regime's own evidence-grade labels (`record/overclaim-labels.txt`). The deep reviews have stated 509
causes and seen 40 settled, though their leading cause has held 21 of 23 times since 5 Oct. The registered forecasts
show modest skill overall (Brier 0.217 against 0.238 for always forecasting the base rate), real skill on sizes and
controls, and almost none on attribution (0.255 against 0.261) or no-harm items (0.202 against 0.205); the derived
credences score worse than the judged ones by Brier (0.267 against 0.228) while ranking items slightly better
(`results-scorecard.txt`). The checkers, hooks, agent definitions and the procedure skill now total about 360 KB against
313 KB of solver code. Throughput has been flat at about 15 test closes a week since 30 Sep, and the plan sits at
648,869 bytes against its 650,000-byte cap.

### 3. Are the rules worth it?

Some are, clearly; many are not; and the most valuable one is in the wrong place.

| Group | Examples | Evidence it catches real errors | Cost | Verdict |
|---|---|---|---|---|
| Fair comparisons, enforced by code | the snapshot launcher and code hash; the fair-test gate over recorded settings; paired paths; the held-out seed registry; the smoke run and the preflights | Prevents known classes (K5's mismatched settings, mixed code versions); in October the preflights stopped four tests that could not measure what they claimed before they ran (`lessons.md`) | Low, paid once | Keep unchanged |
| Review of designs and claims against code and data | the plan-auditor's checks of a claim against the code, of a test's statistics, of a design before launch; the deep reviewer's step-back reads | Strong: most of the 28 documented catches (the runPolicy bug, the interval rule, the cycling generator, selection leakage, unmeasurable designs caught before launch) | High, because it runs after every plan edit (201 runs in one session's week, about half failing and re-run), each working from the diff and searches of a 650 KB plan | Keep, but change its trigger and its diet: review each test's design before launch, each result's claims against the code and the files at its read, and every change of default; give it the code, the results and a short state file, not the plan |
| Accuracy of the written record | evidence grades and claim linting; "no effect" needs grade A or B; one clock; stale-phrase and relook checks; row budgets; archive moves; lessons and trigger codes | Some (wrong figures, rows left unmoved), but the errors arise from hand-writing a 650 KB narrative, and a large share of the findings are about the regime's own labels | High | Replace by removing the cause: a short state file and figures printed by scripts |
| The agent as forecaster | credences and Brier scores; derived credences; decision tables with credences; mechanism anchors; the CARRY rule; ranked cause credences | Modest: overall Brier 0.217 against 0.238 for the base rate, real on sizes and controls, almost none on attribution and no-harm; derived credences worse by Brier; the deep reviews' leading cause held 21 of 23 times since 5 Oct | High | Retire the per-item credences, derived credences, scorecard and decision tables; keep the deep reviewer's leading cause and the test that decides it; measure outcomes instead (F3, F4) |
| Defending the enforcement itself | the pre-tool hook's command parser (`RULES.md`'s known limits 1 to 5); locks, unlocks and receipts | None found on research results; 144 refusals in the main session from 24 to 30 Sep, and in a sample of 29 "writes an enforcement file" refusals the command only named a locked file | Medium, growing with every limit patched | Replace with CI outside the session and the maintainer's review of changes to protected files |
| Numerical hygiene, fidelity to the engine and convergence | none today; the fidelity test of `HOW-IT-WORKS.md` section 7 never ran with the sweep on | The class that got through (F0, F1, F2, the misses above) | Low | Add (Part B, Steps 1 and 5) |

The verdict in one line: keep the rules that make comparisons fair, keep the reviewer but point it at designs and claims
instead of prose, stop the per-item forecasting and the prose machinery, and spend what that saves on checks that make
the numbers correct.


## Part B. Instructions for the agent running the research

These are instructions, not hypotheses. Each step says what to do, when it is done, and its time box. Where a step needs
the maintainer (an unlock, a ruling, a decision rule), it says so; propose the change, show the diff, and wait. The
standing constraints still hold: the maintainer's own household is never a fixture; no model identifier in any commit,
comment or pushed file; merges to `main` only after `bash research/ui-harnesses/run-all.sh 4173` prints ALL REQUIRED
GREEN.

### The principles behind them

1. **Review against evidence; assert what needs no judgement.** The reviewer agents caught most of this project's real
   errors when they checked a claim against the code and the data, which is review with an external signal. They missed
   what nothing they read could show: O200's pattern passed the plan-auditor, the deep reviewer and REF-STEP's whole
   regimen. An invariant over every table cell, a case with a known answer, a convergence table or a paired simulation
   catches that class every time it runs.
2. **Keep what must be read short enough to read whole.** An agent that works from partial reads and searches of a 650
   KB plan cannot see a ruling it did not search for, and items dropped when condensing are likely to grow with the
   plan's size (`LLM-LIMITATIONS.md` calls it a likely contributor). A state file of a few hundred lines, read whole,
   removes the cause; auditing every edit to the 650 KB treats the symptom.
3. **Print numbers; never type them.** Every figure in a document comes from a script over a results file.
4. **Separate exploring from confirming.** Exploration is cheap, unregistered and cannot change a default. Confirmation
   is rare, registered, frozen, held out and decided by a rule written first. That is the scope pre-registration was
   designed for (Nosek et al. 2018).
5. **Judge decisions, not tables.** The measure of a change is the simulated outcome of the policy it produces, against
   the alternatives, on common paths. A table's gap to simulation is a diagnostic, never a release condition (Part A,
   F3).
6. **Bound every task.** Each task has an acceptance test and a time box. When the box runs out, stop and report what
   was learned; do not open a new diagnostic family without the maintainer.

### Step 1. Fix the three product-path defects and make their class impossible to miss (about a day of work and four hours of runs)

1. Make `PhiInv` (src/solver/solve.js:194) clamp its own argument to [1e-15, 1 - 1e-15]. That fixes line 222 and the
   adaptive reference's call at adaptive.js:274 (O199's pattern) and any future caller; keep the explicit clamp at line
   255.
2. Fail loudly. In each argmax loop of `solve()`, after the loop over moves: if no move won, or the winner's score is
   not finite, throw an Error naming the year, the cell and the first non-finite component. "No move won" is `bestS < 0`
   in the ternary, tier-state and PASS 2 branches; the two joint-worlds loops (solve.js l.1126 and l.1176) track
   `bestV`, which stays -Infinity, and otherwise store move 0's values. In the backward pass a move that cannot pay
   still scores a finite penalty, so a cell that chose nothing is always a bug. In `scoreMoves`, a move that can pay
   this year but scores NaN or -Infinity is a bug too: throw. (A move that cannot pay keeps its -Infinity; that is how
   the forward chooser marks it infeasible, and a path where every move is infeasible is a legitimate failure.)
3. Add `research/tests/solver-invariants.test.mjs`, and under the maintainer's unlock (the hooks and CI are enforcement
   files) run it from the pre-commit hook and CI whenever src/solver changes:
   - S070 and S224 under the product baseline with withdrawal moves only
     (`research/reviews/2026-10-21/scripts/table-census.mjs` shows the settings), at 30 and 60 wealth points: every cell
     of every table in every world finite, survival in [0, 1], a move chosen in every cell;
   - S224 at 30 points: the central world's opening survival above 30% (41.3% with the fix, 0.0% before it);
   - `PhiInv(0)`, `PhiInv(1)` and the final-year integral at floors clearing at z of 6, 7.8, 8.5 and 8.9 all finite (the
     NaN band starts near 7.7; `finalYearExact` searches only up to 9);
   - a planted fault that makes one move's estate NaN in the final year: the guard of item 2 must throw.
4. Count the reach on the frozen candidate as it stands: the census of item 3 through `candidate.mjs`, every 7u
   household, before and after the fix. One table: household, cells with no move chosen before and after.
5. Fix the tier-above mismatch (Part A, F2a). Make the engine execute a solved table's tier by name, or give
   `ctx.tierProfiles` the solver's own list in the solver's order (the plan's tier, two below, then the tiers above), so
   index 3 is "one above" on both sides. Add a test: a household at Medium Risk with consent and `tiersAbove: 1`, whose
   table chooses the tier above, is grown by the engine at Medium/High. Then measure, on two or three thin sub-top-tier
   households from outside the library, what the mismatch cost: the policy executed by the engine before and after the
   fix, paired, on the tuning seed.
6. Make the solver's model tax the gain from topping up the cash buffer as the engine does (Part A, F0): into the next
   year's capital gains (App.jsx l.2447-2451). In `fast.js`, give forward runs a slot for the carry, as the seventh slot
   carries the sheltered cash, and add it to the next year's `realised`; grid cells have no slot, so either use a
   typical carry for the year from a forward pass, as `cashIsaTypical` does, or tax the gain in the year it arises,
   whichever matches the engine more closely in the check below. In `model.js` (l.503-518), move the sweep's gain into
   `state.cgtCarry`, as the engine does and as `model.js` already does for gains from paying the bill. Done when
   `research/reviews/2026-10-21/scripts/engine-checks/carry.mjs` prints the same capital gains tax each year in all
   three (today £66,559 over the plan in the engine against £2,182 and £2,298), and `engine-vs-fast.mjs` on S330, S224
   and S070 finds no more paths that survive in one and fail in the other than it finds on households with small taxable
   accounts (today 31, 7 and 6, all in the solver model's favour, against 0 or 1 on S008, S172 and S194, which hold
   £9,000 to £22,500).
7. Correct the engine's 2026/27 rules (Part A, F0a), each with a test pinned to the published figure: dividend rates
   10.75% and 35.75% (App.jsx l.514-515); the Scottish starter and basic limits £16,537 and £29,526 (l.456-458); savings
   interest taxed on the UK bands and rates whatever the region (`savingsTax`, l.1283-1289, as the dividend code beside
   it already does); reinvested dividends added to the taxable account's cost in the engine and both solver models; the
   valuation date read as a local date, tested under `TZ=America/New_York` (`engine-checks/tax.mjs` prints a first-year
   fraction of 0.01 there today). These move every figure, in both arms of a comparison alike.
8. Before the app calls the solver: switch off guardrails and the cost lookahead when a table is executed (in
   `withTable`, or by the engine refusing the combination), with a test each (Part A, F0a).

Done when every test passes and each plant fails, and the reach table exists. These are bug fixes with deterministic
tests: they need no registration and no deep review. Until Step 3 is in place, record them as briefly as the current
rules allow; afterwards each is one line in STATE.md.

### Step 2. Re-check what the fixes could have changed (exploratory, tuning seed; half a day)

Every product-baseline arm since 25 Sep ran with the exact final year, and every arm scored with `runPolicy` carried F0.
The review's census under the product's default levers found no change in outcomes from O200 (S224 at 30 points
identical on 2,000 paths; S224 and S380 clean at 60 points). F0 biases both arms of a comparison, but they draw
differently, so its effect on the difference between them is NOT CHECKED. 7u-F re-runs everything on the fixed code, so
a wholesale re-run now is not justified. Re-run only what the next decisions rest on, with all of Step 1, on the tuning
seed:
1. 7u's three unsettled households (S224, S380, S364), CAND against SHIP, 8,000 paths, paired. Report the change from
   7u's own figures.
2. Any household in Step 1's reach table whose candidate tables lost cells, and the 7u households with the largest
   taxable accounts: their 7u comparison, the same way.
If nothing moves by more than its 7u interval, record that in one line and move on.

### Step 3. Reset the governance (needs the maintainer's "unlock enforcement"; one day)

Propose this as one diff, show it, and make it on the unlock.

**Archive.** Move PLAN.md, PLAN-HISTORY.md, review-log.md, deep-review-log.md, lessons.md, the prediction files and the
`items/` and `escalations/` folders to `research/solver/archive/`, unchanged. They remain the record. Nothing edits them
again and no check reads them.

**Write `research/solver/STATE.md`, at most 300 lines, read in full at every session start** (CLAUDE.md imports it in
place of CHECKLIST.md). Sections, in order:
1. The product question the research must answer, in three sentences.
2. The candidate: one committed configuration file (`research/solver/candidate.json`: the options `candidate.mjs`
   passes, and the plan changes it applies) with its hash, and the product baseline's.
3. Decisions in force: one dated line each (`D12, 19 Oct, maintainer: each fix is tested against the frozen candidate`).
   Carry the rulings that still bind (the ledgers record 88); the rest lapse.
4. Open items: id, one line, measured effect on simulated outcomes with its results file, what closes it, status. An
   item with no measured effect on any outcome and no decision resting on it is dropped, not carried.
5. Running now: task id, log path, expected finish.
6. The next three actions.
Every figure in STATE.md is printed into it by a script from results files.

**Replace CHECKLIST.md with eight lines:**
1. Exploratory runs need no registration. Label them EXPLORATORY. They cannot change a default, a gate or the candidate.
2. A confirmatory run (7u-F, Phase 4, any change of default) has a one-page registration committed before launch:
   question, arms (configuration hashes), households, held-out seed, paths, primary metric, decision rule, what each
   outcome decides. It is launched through `run-from-snapshot.sh` and read once, by that rule.
3. Every comparison is paired on the same paths and passes the fair-test diff of the settings each run recorded.
4. After any edit to src/solver, the fast verification suite (Step 5: V1, V2 and the unit tests) passes before any
   batch.
5. A new check is shown failing on a planted fault once, in its own test.
6. Figures in documents are printed by scripts from results files.
7. A bug is fixed together with a test that catches its class; running that test over the code is the pattern search.
8. Every task has an acceptance test and a time box. When the box runs out, stop and report to the maintainer.

**Keep unchanged:** `run-from-snapshot.sh` (snapshot, code hash, smoke run); `fair-gate.mjs` and `fair-test.mjs`,
applied automatically; the seed registry and the launcher's check of it; `stats.mjs` and its tests; the decided-defaults
test, until the defaults live in the configuration file and the code reads them from there.

**Re-point the reviewers.** The plan-auditor's value in the record is in checking a claim against the code and the
files, and a design before launch; its cost is in running after every plan edit (201 runs in one session's week, about
half failing and re-run). So trigger it by events, not edits: before any launch (could the test pass with the fault
present? does it measure what it claims? is it fair?), at each read (does every claim in the write-up match the results
file and the code?), and before any change of default. Give it the code, the results files, the registration and
STATE.md. Keep the deep reviewer for milestones: after each confirmatory read, and when two results on the same question
conflict. Keep its leading cause and the one test that would decide it (its leading cause has held 21 of 23 times since
5 Oct); drop the ranked list of causes with credences.

**Retire:** the receipt required after every plan change and the Stop hook that demands it; the deep review after every
settled result, `uncertainty.mjs` and the escalation trigger; credences, derived credences, the scorecard, decision
tables with credences, mechanism anchors and the CARRY rule in predictions; per-reducer mutation scripts for exploratory
reducers; `relook.mjs` and the commit-msg hook; check-plan's prose rules (the clock, no-effect wording, evidence grades,
stale phrases, row budgets, the retro); lessons.md's per-close lessons and trigger codes.

**Add the hygiene the misses call for:** the test runner fails unless every test file ran (the suite stopped at file 41
of 82 for 11 days); every guard test runs in the pre-commit hook and CI (e3pcls-guard has failed unseen since 9 Oct);
CI's status is printed at session start (it was red for 32 hours unseen); fixtures such as the household band live in
git (the band was lost in a container restart); no research script imports the live tree by absolute path.

**Slim the hooks.** Pre-tool: refuse `--no-verify`, force pushes, killing by pattern, and writes to the verification
suite, CI and hook files by exact path; stop extending the command parser (`RULES.md`'s known limits 1 to 5): each
patched limit is another case to defend. Pre-commit and CI: the fast verification suite and the fair-gate tests. Stop
hook: none. The guard against an agent editing its own checks is outside the session: CI on every push, and the
maintainer's review of any diff to the protected paths.

### Step 4. Get to 7u-F and run it once (the short-term goal; triage two days, then the run)

**1. Triage every open item on 7u-F's path by one question: can it change the candidate's simulated outcome on a 7u-F
household by more than the product gate's 1 point?** One table in STATE.md (in the plan, if Step 3 is not yet in place):
item, class, measured effect, disposition.
- A bug in what the candidate computes (O199, O200, F0's untaxed sweep): fixed before 7u-F, with its test (Step 1).
  Mandatory. PR35's signed miss is a one-command numerical check; print it, and treat it as a bug only if it moves a
  read by a tenth of a point.
- A table-versus-simulation gap, or a family of odd results, with no measured effect on simulated outcomes (O133, O139,
  O145, O180, O189, O198, and the TOP-CELL, AA-UR and FD-X diagnostics as far as they rest on table reads; O194 closes
  when the assembly carries the reference choice): not a gate for 7u-F. Record each in STATE.md as a known limitation
  with its size; 7u-F's by-world item reports them, and Step 5 picks them up.
- A measured difference in simulated outcomes below the product gate (O191 and O179: the reference change's bad-world
  cost, 0.25 to 0.58 points, with a net gain by the mixture; O132, S364, a plan that survives under half a percent of
  the time under either arm): not a gate; reported in 7u-F.
- A premise whose row names 7u-F (PR24, PR29, PR31): the same question. If it could change the candidate's outcome by
  more than a point, one exploratory paired run (below); otherwise record it.
- A missing read (O195, S366 at the frozen candidate): 7u-F's panel reads it (add it if the deposit households leave it
  out); not a precondition.
- A fix whose effect on outcomes is unmeasured: one exploratory paired run on the tuning seed, the frozen candidate with
  and without it, on the households it targets (one to three hours each). Under 1 point everywhere: not a gate. More
  than 1 point better somewhere and no worse elsewhere: it joins the candidate at assembly. Worse: dropped.
- A choice the maintainer has made (the adaptive package, 20 Oct 14:30): implement it.
Put the triage to the maintainer as a proposed amendment of the 18 Oct 17:19 ruling: "a gap" means a measured difference
in simulated outcome, not a gap between the table and simulation.

**2. Assemble and freeze the candidate.** CANDIDATE_OPTS gets the package and the O199 and O200 fixes, and nothing the
triage did not pass. Run V1 and V2 (Step 5) on it. Commit `candidate.json` and its hash. From here until 7u-F reads, the
candidate does not change.

**3. Register 7u-F on one page, with a decision rule that decides.** The rule is the maintainer's; recommend this:
- Panel, arms and seed as agreed (`PLAN.md` l.848, l.63 and l.51): S224 and S380, S364 reported, the deposit households
  whose bridge is at risk and a broad slice; SHIP, the frozen candidate, and the decomposing arm the maintainer asked
  for on 20 Oct (the final candidate on the plan reference), its reference part read by the mixture; seed 7014, used
  once; both estate weights, as 7u. Recommended on top: SHIP with Step 1's fixes too, so that the comparison is of
  decisions and not of a bug.
- Scoring: by the engine, the figure a user will see. The audit already solves each household; executing the solved
  table in the engine on the same paths (`withTable`, then `runTrial` path by path, as `engine-vs-fast.mjs` does) costs
  about what `runPolicy` does (11.6 s against 10.4 s for 2,000 paths on S092). Report `runPolicy`'s outcome beside it; a
  household where the two differ by more than noise is a fidelity gap to log, not a result.
- Primary, pooled: 7u's item 4 kept as it was: the paired survival change summed over the households outside the gain
  set (named from the records before the seed is read), passing when the lower end of its interval is above -0.1 points.
  In 7u it read +0.29 (+0.26 to +0.32). Compute the interval by path: path i carries the same draws for every household
  with the same horizon, so take each path's change summed over the households and the spread across paths, not
  `stats.mjs` pooledSummed, which pools the cells as if the 47 x 8,000 pairs were independent. Re-read 7u's item 4 that
  way now: even if every household's discordant paths coincided, its interval would widen about sevenfold, to about
  +0.08 to +0.50, still above -0.1.
- Primary, per household, safety: harm is a Holm-adjusted one-sided exact McNemar p below 0.05 together with a loss of
  at least 1 point, the product gate's size, counted where SHIP's survival is between 5% and 99.5%. Outside that range
  the change is reported, not gated: a 0.4-point change in a plan that survives under half a percent of the time is not
  a decision a household faces, and above 99.5% the margin is noise.
- Paths: 16,000, as agreed.
- Reported, not gating: the whole score, spending, estate, the by-world table-against-runs item, and each household's
  interval at the 0.25 and 0.5 margins.
- What each outcome decides: pass on both, the candidate goes to Phase 4. Harm on a household: that household goes to
  Step 5's optimality measures, which either find the better policy (and so the fix) or show the loss is the candidate's
  deliberate trade; no new reader or reference variant is opened on it.
- Cost: 7u took about 0.6 core-hours a unit (127.1 budgeted for 220 units, two arms at 8,000 paths,
  `predictions/confirm-7u.md`). With the package's 34 to 47% longer solves and 16,000 paths, budget about 0.8: three
  arms at two weights on 20 households is about 100 core-hours, a day on four cores. Size the broad slice from that; if
  it runs long, the decomposing arm can run only where the reference changes the move.
- Register a fresh replication seed for Phase 4 at the same time: 7004 has served as three development tests'
  replication seed (AX-HO, FOOT-S366, HO-DEP), so it is no longer unseen.

**4. Run it, read it once by that rule, and put the result to the maintainer.** Then Step 5.

### Step 5. Build the checks the project lacks (V1 and V2 before 7u-F's registration; V3 to V5 after)

None needs a registration: each is deterministic or a measurement against a known answer. Each ships with one planted
fault that turns it red.

**V1. Invariants on every solve** (fast tier: every commit to src/solver). Every cell finite; survival in [0, 1]; a move
chosen in every cell (Step 1); no move that can pay scores NaN or -Infinity in the chooser. Report, without failing at
first, the share of cells where survival falls as wealth rises at fixed shares and buckets beyond 1e-6: a tax kink can
make that legitimate, and the count is information.

**V2. Cases with an independently known answer** (fast tier).
- One pot, no tax, constant real spending, one tier, one world. A separate one-dimensional reference in
  `research/oracle/` that imports nothing from src/solver: survival on 2,000 or more log-wealth points with the year's
  lognormal integrated exactly against the piecewise-linear interpolant, checked against a million paths. The solver
  configured to the same household matches it at the opening within 0.5 points at its shipped resolution, and the
  policy's simulated survival matches within Monte Carlo error (every move is equivalent here, so any gap is a bug).
- Split invariance: in a test configuration with capital gains, dividend and savings tax set to zero, no cash buffer and
  one tier, the ISA and the taxable account are the same asset, so the value must not depend on how a total is split
  between them and every withdrawal order between them must tie.
- The final year in its tails: floors that clear only at z of 6, 7.8, 8.5 and 8.9 give finite values (O200's case).
- The solver's model against the engine with the sweep on (F0's case): the household of `engine-checks/carry.mjs`, one
  move every year, gives the same capital gains tax and wealth each year in the engine, `fast.js` and `model.js`; and
  the solved policy executed by the engine and by `runPolicy` on 2,000 common paths (`engine-vs-fast.mjs`) gives no more
  discordant paths on the V3 households than on households with small taxable accounts.
- The tax functions against published worked examples: one case for each band in each region, including a Scottish
  taxpayer's savings interest and dividends.
- Metamorphic checks (Kanewala and Bieman 2014; Segura et al. 2016): a guaranteed income at least the spending gives
  survival 1; higher spending never raises survival; more opening wealth never lowers it beyond V1's tolerance.

**V3. A convergence table, settings in every direction** (slow tier: about a day on this machine for six households). On
six households spanning the problem (two with bridge years, two mid-survival, one thin, one comfortable; never the
maintainer's own), the frozen candidate, solve at 20, 30, 45, 60 and 90 wealth points; 6 and 10 share points; 5 and 9
quadrature nodes; the gain and allowance axes snapped and interpolated; three and five worlds. For each: each world's
opening table value; the policy's simulated survival and whole score on 8,000 tuning-seed paths, paired against the
finest setting; cells with no move chosen (must be 0). Accept the shipped settings where the next finer one moves the
policy by under 0.2 points on the panel mean and 0.5 on every household (`RULES.md` section 8's targets). This replaces
the open argument about which reference is truth: truth is what the policy converges to.

**V4. Distance to the best policy, measured now, not last.** Two measures, both in simulation, neither trusting the
table:
- *The policy ensemble* (cheap; run with V3): solve each household several ways (log-odds, probit and probability
  interpolation; the reader's variants still in contention; the candidate and SHIP), simulate every policy on the same
  8,000 paths, and report the best variant per household and each policy's gap to it. The gap is a lower bound on that
  policy's distance from the best. The review found 3.75 points on S070 for the shipped settings' withdrawal policy (the
  allowance and gain axes interpolated), none for the candidate's interpolation among the two variants tried on top of
  it, and the log-odds policy ahead of the probability one on S172, S194, S224 and S380 (results-exploratory.txt
  sections 2 and 3).
- *The purpose test* (`audit-bestof.mjs`, unchanged in method): re-run it on the frozen candidate, on the same eight
  households and on 7u-F's harmed or unsettled ones. It answers where a policy is improvable one decision at a time.
Accept the policy when the ensemble's gap is under 0.2 points on the panel mean and 0.5 on every household, and the
purpose test finds no position beyond noise at more than 5% of positions, at both estate weights 7u used, so "other
weights" are covered too. These are lower bounds: they can show that a policy is improvable, never that it is near the
best, so they are weaker than `RULES.md` section 8's target, a gap to an upper bound (the ceiling). Put it to the
maintainer that they serve as the stopping rule for the grid and cliff work until a ceiling exists. Step 8h's penalised
bound (the information-relaxation dual of Brown, Smith and Sun 2010) remains the certificate; its inner problem (24 to
360 moves a year over 36 to 60 years) makes it a project of its own, worth starting when the maintainer wants the
certificate or when V4's two measures disagree.

**V5. Report precision with every figure.** Each survival figure in a document or on screen carries its 95% interval. At
8,000 paths the interval is about ±1.1 points at 50% survival and ±0.5 at 95%. Show beside the headline how survival
moves when the return assumptions move (the perturbed worlds `LITERATURE.md` adopted), because that, not sampling, is
the largest uncertainty in the figure.

### Step 6. Method changes, judged by V3 and V4 only (after 7u-F)

**N1. Build the coverage coordinate (F2's option A) for the bridge years.** In a year before pension access, replace the
pension-share axis with coverage, accessible money over the bridge's remaining need, with a fixed node at 1, as
`f2-design.md` sets out. `readValues` already takes the year; the design lists what else changes: locating a state on
next year's grid, mapping the state between the two coordinates at pension access, a new interpolation in the read, and
the grid's size in the bridge years. Judge it on the bridge households by V3 and V4 against the reader package. If it
matches or beats the package, delete the reader and every variant that loses; if not, record why in STATE.md and stop.

**N2. Leave the interpolation transform alone outside the bridge years.** Measured: probit is indistinguishable from
log-odds for the policy on five households at 30 points and three at 60; probability interpolation is better on one and
worse on four, and its one gain (S070) turns into a 0.72-point loss once the allowance axis is interpolated, as in the
candidate. Re-open it only if V4's ensemble shows a variant ahead by more than the targets.

**N3. Quadrature.** Five to nine nodes moved S070's policy by 0.00 points. Leave it unless V3 says otherwise.

**N4. Test a richer menu before claiming the best possible.** Add, as research options, the moves the design describes
and the code lacks (Part A, F2b): a ceiling at the higher-rate limit, a midpoint in each band, selling the taxable
account up to the capital gains exemption. Run each through V4's ensemble on the six V3 households. Adopt a move only
where it beats the current menu by more than the targets; either way, correct `HOW-IT-WORKS.md` section 4 to the menu
the code offers, today, since the product's explanation of itself is wrong.

**N5. Clear the product path.** Delete every option whose test lost or whose question is closed (git keeps them); move
research-only arms into one research wrapper module; leave `PRODUCT_BASELINE` and the candidate's configuration as the
only settings src/solver must support.

**N6. Dated tax rules and charges (the engine; two days).** Thresholds frozen in cash terms to April 2031, so falling in
real terms at the plan's inflation until then and indexed after; the savings rates' 2-point rise from April 2027; the
config comment's "frozen to 2028" corrected. And an annual charge on invested tiers, with a default the maintainer sets,
shown next to every survival figure (Part A, F0a: 6 points of survival at 0.5% a year on S080, with the charge on every
tier). Test each against a hand calculation and report the change in survival on the six V3 households.

**N7. Solve time (Part A, F8a).** Time the frozen candidate's product solve on a laptop and a phone for the six V3
households. If it misses `HOW-IT-WORKS.md`'s target, V3 says how few wealth points are safe and V4 which moves earn
their cost; cut to those, and report the time beside each V3 row from then on.

### What not to do

- Do not open a new reader or reference variant, a new diagnostic family or a new rule before 7u-F reads.
- Do not treat a gap between the table and simulation as a defect without a measured effect on simulated outcomes.
- Do not touch seed 7014 before its one-page registration is committed and pushed.
- Do not edit the archives.

### Proposed tests and their rough cost (core-hours scale from 7u's budget; wall time on four cores)

| Test | When | Cost |
|---|---|---|
| V1 invariants and V2 known-answer cases | every commit to src/solver | under 5 minutes |
| V2's engine-against-solver check on six households | every commit to src/solver or the engine's flow | about 5 minutes (40 to 50 s a household) |
| Step 1's reach count on the candidate | once, today | about 15 core-hours: two solves a household, tables only |
| Step 2's re-check of 7u's unsettled households | once | 1 to 3 hours |
| Step 4's paired runs for unmeasured fixes | per fix | 1 to 3 hours each |
| 7u-F | once | about 100 core-hours for 20 households in three arms (Step 4) |
| V3 convergence and the V4 ensemble | after 7u-F | about a day for six households |
| V4 purpose test on the candidate | after 7u-F | about 2 hours for eight households |


## Part C. Sources

The project's literature note (`LITERATURE.md`) already covers the retirement-planning work it compared itself with.
These add what it lacks: verifying a numerical solver, bounding how far a policy is from optimal, testing without a
known answer, and running research with an LLM. Each was found and checked at the link given; the point taken from each
is the review's reading of it.

**UK rules for 2026/27 (Part A, F0a)**
- Low Incomes Tax Reform Group (2025). Budget 2025 summary: main personal tax announcements.
  [litrg.org.uk](https://www.litrg.org.uk/news/budget-2025-summary-main-personal-tax-announcements-and-what-they-mean-you).
  Thresholds frozen to April 2031; dividend rates 10.75% and 35.75% from April 2026; savings and property rates up 2
  points from April 2027.
- Deloitte. UK tax rates 2026/27.
  [deloitte.com](https://taxscape.deloitte.com/taxtables/deloitte-uk-tax-rates-2026-27.pdf). The dividend rates against
  2025/26's, the savings allowances and the £5,000 starting rate band.
- Scottish Government. Scottish income tax rates and bands, 2026 to 2027.
  [gov.scot](https://www.gov.scot/publications/scottish-income-tax-rates-and-bands/pages/2026-to-2027/). Starter to
  £16,537, basic to £29,526, intermediate to £43,662.
- Low Incomes Tax Reform Group. Scottish income tax.
  [litrg.org.uk](https://www.litrg.org.uk/tax-nic/income-tax/scottish-income-tax). A Scottish taxpayer's savings and
  dividend income is taxed at the UK rates and bands.
- Finance Act 2022, section 10. [legislation.gov.uk](https://www.legislation.gov.uk/ukpga/2022/3/section/10). The normal
  minimum pension age rises from 55 to 57 on 6 April 2028.

**Verifying a numerical solution**
- Celik, I. B., Ghia, U., Roache, P. J. et al. (2008). Procedure for estimation and reporting of uncertainty due to
  discretization in CFD applications. *Journal of Fluids Engineering* 130(7). [doi](https://doi.org/10.1115/1.2960953).
  The standard recipe for a grid-refinement study: three grids, the observed order of convergence, an extrapolated value
  and a reported uncertainty. V3 should report in this form.
- Pooley, D. M., Vetzal, K. R. and Forsyth, P. A. (2003). Convergence remedies for non-smooth payoffs in option pricing.
  *Journal of Computational Finance* 6(4).
  [risk.net](https://www.risk.net/journal-of-computational-finance/2160518/convergence-remedies-for-non-smooth-payoffs-in-option-pricing).
  A survival indicator is a digital payoff; such payoffs make convergence slow and erratic unless the terminal step is
  smoothed or placed between nodes. It explains why table reads near the cliff jump about with the grid.
- Das, S. R., Ostrov, D., Radhakrishnan, A. and Srivastav, D. (2020). Dynamic portfolio allocation in goals-based wealth
  management. *Computational Management Science* 17(4). [doi](https://doi.org/10.1007/s10287-019-00351-7). The closest
  published analogue: backward induction on a wealth grid with an indicator terminal value, whose probabilities move
  with grid density.
- Santos, M. S. (2000). Accuracy of numerical solutions using the Euler equation residuals. *Econometrica* 68(6).
  [doi](https://doi.org/10.1111/1468-0262.00165); Judd, K. L. (1998). *Numerical Methods in Economics*. MIT Press.
  [RePEc](https://ideas.repec.org/b/mtp/titles/0262100711.html). Accuracy is measured by residuals and refinement, not
  by the solver's own estimate of itself.
- Oberkampf, W. L. and Roy, C. J. (2010). *Verification and Validation in Scientific Computing*. Cambridge University
  Press. [doi](https://doi.org/10.1017/CBO9780511760396). Code verification (does it solve the equations right?) comes
  before validation (are they the right equations?), with order-of-accuracy tests and manufactured solutions.
- Wilson, G. et al. (2014). Best practices for scientific computing. *PLOS Biology* 12(1).
  [doi](https://doi.org/10.1371/journal.pbio.1001745). Assertions as executable documentation; a simple implementation
  as the reference to test against; a test for every bug found.

**Testing without a known answer**
- Kanewala, U. and Bieman, J. M. (2014). Testing scientific software: a systematic literature review. *Information and
  Software Technology* 56(10). [doi](https://doi.org/10.1016/j.infsof.2014.05.006). Not knowing the right output is the
  central difficulty; metamorphic relations, independent implementations and assertions work around it.
- Segura, S., Fraser, G., Sánchez, A. B. and Ruiz-Cortés, A. (2016). A survey on metamorphic testing. *IEEE Transactions
  on Software Engineering* 42(9). [doi](https://doi.org/10.1109/TSE.2016.2532875). Check relations between runs (more
  money never lowers survival; a guaranteed income covering spending gives survival 1) when the exact output is unknown.
- Cook, K. A., Meyer, W. and Reichenstein, W. (2015). Tax-efficient withdrawal strategies. *Financial Analysts Journal*
  71(2). [doi](https://doi.org/10.2469/faj.v71.n2.2). Under a flat tax the order between tax-deferred and tax-free
  accounts does not matter: a second invariance for V2 (pension against ISA, without the tax-free lump sum).
- Young, V. R. (2004). Optimal investment strategy to minimize the probability of lifetime ruin. *North American
  Actuarial Journal* 8(4). [doi](https://doi.org/10.1080/10920277.2004.10596174); Milevsky, M. A. and Robinson, C.
  (2000). Self-annuitization and ruin in retirement. *North American Actuarial Journal* 4(4).
  [doi](https://doi.org/10.1080/10920277.2000.10595940). Closed-form ruin probabilities under simplified assumptions:
  cross-checks for the one-pot oracle of V2.

**Optimality and its measurement**
- Brown, D. B., Smith, J. E. and Sun, P. (2010). Information relaxations and duality in stochastic dynamic programs.
  *Operations Research* 58(4). [doi](https://doi.org/10.1287/opre.1090.0796). The penalised upper bound of step 8h: a
  penalty built from an approximate value function makes the perfect-foresight bound tight, and the policy's value and
  the bound can be estimated on the same simulated paths. Brown and Smith (2011, *Management Science* 57(10),
  [doi](https://doi.org/10.1287/mnsc.1110.1377)) apply it to dynamic portfolio choice; no decumulation application was
  found.
- Bertsekas, D. P. (2020). *Rollout, Policy Iteration, and Distributed Reinforcement Learning*. Athena Scientific.
  [mit.edu](https://web.mit.edu/dimitrib/www/dp_rollout_book.html). Rollout is one step of policy improvement; the basis
  of the purpose test and of a decision-time fix.
- Kakade, S. and Langford, J. (2002). Approximately optimal approximate reinforcement learning. *ICML*.
  [mlanthology](https://mlanthology.org/icml/2002/kakade2002icml-approximately/). The performance-difference identity:
  the gap between two policies is one's advantage under the other's values, accumulated along its own paths. It is why
  many small per-decision gains, each invisible alone, add up to the 0.65 points between two of the ensemble's policies
  on S070 (Part A, F4).
- Smith, J. E. and Winkler, R. L. (2006). The optimizer's curse. *Management Science* 52(3).
  [doi](https://doi.org/10.1287/mnsc.1050.0451). The best of several noisy estimates is biased upward: pick the best
  ensemble variant on one seed, report it on another.
- Forsyth, P. A. and Li, Y. (2025). Risk measures for DC pension plan decumulation. arXiv:2502.16364.
  [arXiv](https://arxiv.org/abs/2502.16364). A probability-of-shortfall objective does not tell bad outcomes apart and
  breeds fat left tails; expected shortfall behaves better. The project already moved its risk term this way.

**Pre-registration's scope**
- Nosek, B. A., Ebersole, C. R., DeHaven, A. C. and Mellor, D. T. (2018). The preregistration revolution. *PNAS*
  115(11). [doi](https://doi.org/10.1073/pnas.1708274114). Its purpose is to make clear which results were predicted and
  which were found afterwards; exploration stays free, and a held-out set turns its findings into tests.
- Gelman, A. and Loken, E. (2013). The garden of forking paths.
  [columbia.edu](https://sites.stat.columbia.edu/gelman/research/unpublished/p_hacking.pdf). Data-dependent choices bias
  results without any fishing; where registering in advance is impractical, label the work exploratory and replicate.

**Running research with an LLM**
- Anthropic. Best practices for Claude Code. [code.claude.com](https://code.claude.com/docs/en/best-practices). Give the
  agent a check it can run; hooks are deterministic where instruction files are advisory; an overlong instruction file
  gets ignored; and a reviewer asked to find gaps usually reports some even when the work is sound.
- Rajasekaran, P., Dixon, E., Ryan, C. and Hadfield, J. (2025). Effective context engineering for AI agents. Anthropic.
  [anthropic.com](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents). Recall degrades as
  context grows; keep the smallest set of high-signal tokens, and keep notes outside the context.
- Young, J. (2025). Effective harnesses for long-running agents. Anthropic.
  [anthropic.com](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents). A machine-readable
  list of features with pass or fail status and a short progress file carry a long task across sessions: the model for
  STATE.md.
- Schluntz, E. and Zhang, B. (2024). Building effective agents. Anthropic.
  [anthropic.com](https://www.anthropic.com/engineering/building-effective-agents). Keep agent workflows simple, ground
  each step in feedback from the environment, and set stopping conditions.
- Jaroslawicz, D. et al. (2025). How many instructions can LLMs follow at once?
  [arXiv](https://arxiv.org/abs/2507.11538). Accuracy falls as simultaneous instructions grow, and earlier ones are
  favoured. The project cites it for moving its rules out of the plan; it argues equally for fewer rules.
- Liu, N. F. et al. (2024). Lost in the middle: how language models use long contexts. *TACL* 12.
  [doi](https://doi.org/10.1162/tacl_a_00638). Recall is worst for material in the middle of a long context.
- Huang, J. et al. (2024). Large language models cannot self-correct reasoning yet. *ICLR*.
  [openreview](https://openreview.net/forum?id=IkmD3fKBPQ); Kamoi, R. et al. (2024). When can LLMs actually correct
  their own mistakes? *TACL* 12. [doi](https://doi.org/10.1162/tacl_a_00713); Stechly, K., Valmeekam, K. and
  Kambhampati, S. (2025). On the self-verification limitations of large language models on reasoning and planning tasks.
  *ICLR*. [mlanthology](https://mlanthology.org/iclr/2025/stechly2025iclr-selfverification/). Self-review without an
  external signal does not improve, and can degrade, results; a sound external checker does help.
- Panickssery, A., Bowman, S. R. and Feng, S. (2024). LLM evaluators recognize and favor their own generations.
  *NeurIPS*.
  [neurips.cc](https://papers.nips.cc/paper_files/paper/2024/hash/7f1f0218e45f5414c79c0679633e47bc-Abstract-Conference.html).
  A second model of the same family is not an independent reviewer.
- Von Arx, S., Chan, L. and Barnes, B. (2025). Recent frontier models are reward hacking. METR.
  [metr.org](https://metr.org/blog/2025-06-05-recent-reward-hacking). Agents sometimes alter the checks they are judged
  by: keep the decisive checks where the agent cannot write, which is CI and the maintainer's review, not a hook parser.

