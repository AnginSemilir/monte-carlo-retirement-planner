# What the literature did, and what it teaches this solver

Written after phase 2's experiment was designed and while it ran, so that none of it could bend the
experiment. Direct access to most papers was blocked from this container; the summaries below come
from search-engine abstracts, secondary write-ups and prior knowledge of the papers, and each claim
is marked with how firmly it is held. Read this before deciding Phase 3.

## The closest analogues

### Forsyth and co-authors, Waterloo, 2020-2026 (decumulation as stochastic control)
The nearest thing to what we are building. Backward induction (an HJB equation solved numerically on
a grid) for a DC pension in drawdown. Controls: the withdrawal each year, between a floor and a cap,
and the equity share. One risky asset and one riskless, with a parametric jump-diffusion fitted to
long-run US data. **Objective: a frontier, not a scalar** - expected total withdrawals against
expected shortfall (ES) at the horizon; each point on the frontier is one solve with one trade-off
parameter. Results: against the constant 4 percent rule, materially higher expected withdrawals for a
small increase in shortfall risk (firm). **Robustness: the policy is computed under the parametric
model and then tested on block-bootstrap resamples of the historical data it was fitted to**, and
the advantage survives (firm). A 2023 companion paper trains a neural network on the same problem
with no dynamic programming at all and reaches the HJB frontier to high accuracy (firm). A 2025/26
paper compares three tail-risk measures as the objective's risk term - expected shortfall, linear
shortfall and probability of shortfall - and treats ES as the well-behaved one, with the set of
ES-optimal controls covering the Pareto frontier (moderately firm; the abstract, not the tables).

What they do not model: taxes, more than one wrapper, a tax-free lump sum, a cash buffer. Their
state is one number (wealth) and their whole edge comes from two controls we do not yet have:
spending and allocation.

### Irlam (AACalc) and Tomlinson, 2014-2017 (SDP with a utility objective)
Stochastic dynamic programming over wealth and age with a CRRA utility of consumption, reported as
certainty-equivalent income. State-dependent allocation and spending against age-in-bonds plus the
4 percent rule: **a 38 percent higher certainty-equivalent income in the headline example, and a
28 percent gap between the best rules of thumb and SDP** (firm, from Kitces' and Pfau's accounts).
Most of the gain comes from spending that responds to wealth and from annuitisation, not from
withdrawal order. Irlam then derived simple rules from the SDP tables and reports they capture most
of the value (moderately firm). Taxes are not modelled.

### Sun and Webb, 2012, Center for Retirement Research (rules against the optimum)
Numerical optimum with a utility objective and mortality, against four rules: interest-and-dividends,
4 percent of initial wealth, decumulate over life expectancy, and the IRS required-minimum-
distribution percentage of remaining wealth. The RMD rule wins among rules once returns are risky,
"but all fall well short of the theoretical optimum" (firm). The gap is in spending flexibility.

### Blanchett, Kowara and Chen, 2012, Morningstar (the perfect-information yardstick)
Introduces the withdrawal efficiency rate: each strategy scored against what could have been withdrawn
with perfect foresight of returns and date of death. Constant-dollar withdrawals score around 55
percent; the best dynamic rules 65-75 percent; the winner is a mortality-updating rule (firm). A 2013
follow-up fits regression formulas to the complex strategy and reports they capture 99.9 percent of
its efficiency (firm) - the strongest published case that a distilled rule loses almost nothing.

### DiLellio and Ostrov, 2017-2020 (tax-efficient withdrawal order - our fixed-spend test's twin)
The US analogue of our phase 2 question: which of tax-deferred, Roth and taxable to draw from each
year, with the spend fixed. They reject backward dynamic programming for this problem on the curse of
dimensionality and build a forward, geometric algorithm from the structure of the tax code. Result:
**the optimal order beats Fidelity's and Vanguard's published rules by about 10 percent of the
bequest, or 18 months of portfolio longevity**; naive orders are 10-26 percent suboptimal (firm). The
optimum reduces to one principle - fill the low tax brackets from the tax-deferred account every
year - which is what our "pension to the basic-rate band" move already does.

### Boyd and co-authors, Stanford, 2025 (model predictive control for retirement funding)
Each year, solve a convex plan for all remaining years under a simplified tax model with many
accounts, required distributions and Roth conversions; act on the first year; repeat. Evaluated by
Monte Carlo. Not optimal under uncertainty, but fast, exact on the rules, and unbothered by the
number of accounts (firm). Our one-off-cost lookahead is a one-decision version of this.

### The probability-of-ruin literature (Browne 1995-1999; Young 2004; Milevsky and Robinson)
Minimising the probability of lifetime ruin has closed-form solutions in simple settings. The known
pathology: the ruin-minimising investor takes MORE risk as wealth falls, because a gamble is the only
route back over the line (firm for the classic results; the same mechanism applies to any indicator
objective). Milevsky and Huang's "Planet Vulcan" paper argues for spending in proportion to survival
probability under a utility objective and against fixed rules; it deliberately assumes away market
risk (firm).

### Guardrails, and how variable strategies are compared (Guyton-Klinger 2006; Kitces; Pfau 2015)
Guyton-Klinger's rules were derived from historical simulation, not from an optimum, and Kitces'
critique is that they over-correct and can demand cuts a retiree cannot make (firm). Pfau's
comparison framework calibrates every variable strategy to the same downside outcome first and then
compares the spending they deliver, so that a strategy is never rewarded for simply taking more
risk (firm). That is the fair-comparison device our fully-funded-rate / floor-rate reporting rule
in Part D restates.

### The UK
Vanguard UK's withdrawal-order paper and the adviser literature are rule-based: taxable first, then
ISA alongside pension within the bands, tax-free cash to fill gaps. No UK study found solves the
four-wrapper problem by dynamic programming; the closest is DiLellio and Ostrov's US work.

## Are we doing the same thing, and is theirs better

Same family as Forsyth: backward induction on a grid, one market factor with a small quadrature, a
post-decision state, a fixed set of moves. We carry more state (four pots, unrealised gain, lump sum
used) and exact UK tax; they carry the two controls that matter most. Four places their practice is
better, in the order they should be adopted:

1. **Test the policy on data the model did not generate.** Every serious paper solves under a
   parametric model and evaluates on bootstrap resamples of history, and reports whether the edge
   survives. We evaluate on held-out seeds of the same model. Adopt: evaluate both arms on the
   engine with perturbed parameters (mean return down, volatility up, fatter left tail) and, if the
   engine can be driven from a return series, on block-bootstrapped historical years.
2. **A shortfall measure, not an indicator.** Forsyth's risk term is expected shortfall; the ruin
   literature explains why a probability is the gameable choice. Our resilience term is an indicator
   at opening wealth. Adopt: replace it with expected shortfall below a threshold,
   E[max(0, K - W_T)], which is additive over paths and so stays exactly decomposable for the
   backward pass, then re-run the same 41 households.
3. **A frontier for the user, weights for nobody.** Forsyth presents the trade-off as a curve and lets
   the plan holder pick a point; the weights we hand-chose (0.5, 0.02) become the point on that curve
   the household chooses. This is what Part D's target/floor already is.
4. **Spending as the control.** Every source that finds a large gain finds it in spending that
   responds to wealth (Forsyth, Irlam, Sun and Webb, Blanchett). Every source that looks at
   withdrawal order alone finds a modest gain (DiLellio and Ostrov: ten percent of a bequest). Our
   phase 2 experiment is a withdrawal-order test, and a mean of half a point is what the literature
   would predict for it. The prize the literature describes is Part D.

Two places ours is the stronger practice and should be kept: the paired common-random-number design
with a gate fixed before the run and households selected blind to the result (no paper found does
this; most compare on one or a few illustrative households), and the app's own judge as the
arbiter so the solver's objective cannot flatter itself.

One idea to hold in reserve: if couples or more wrappers blow up the grid, Boyd's model-predictive
control is the published escape hatch - re-plan each year with a convex model of the rules and act
on the first year - and DiLellio and Ostrov show the tax-order problem has structure a forward
algorithm can exploit. Neither is optimal under uncertainty; both are exact on the rules and fast.

## What this changes in the plan
- Phase 2's gate stands, but the reading of a small positive result is now "as the literature
  predicts for withdrawal order alone", not "the method is weak".
- Before Phase 3: the perturbed-model evaluation (item 1) and the expected-shortfall objective
  (item 2), both re-run on the same 41 households under the same seeds.
- Part D is promoted from "next" to "the experiment that decides whether the solver ships".
- Distillation is a deliverable, not a fallback: Blanchett's 99.9 percent and Irlam's simple rules say
  the solver's findings can be shipped as rules even where the solver is not.
