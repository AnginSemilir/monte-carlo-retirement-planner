# A question for a mathematician: interpolation bias in a backward-induction table with a cliff

## The problem

We solve a finite-horizon stochastic control problem by backward induction on a grid. A household
holds three pots (pension, ISA, taxable) and each year chooses one of 24 withdrawal rules; the market
then applies a random multiplicative return. The objective is

    V_t(x) = max_a  E[ V_{t+1}( G · f(x, a) ) ]

where f is the deterministic within-year cash flow (spending, tax, withdrawals), G the random growth,
and the terminal value is an indicator: 1 if the household never ran out of money, 0 otherwise
(plus small smooth terms for downside and bequest). Horizon 36 to 60 years.

The state is three pot sizes (plus two bucketed variables we can ignore here). Each pot is on a
log-spaced axis of n points; V_{t+1} is stored at the n³ grid points and read at the post-decision
point by trilinear interpolation. Because V is essentially a step function of wealth (a cliff between
"enough" and "not enough"), we interpolate the log-odds of V rather than V itself, with V clamped
to [1e-6, 1 - 1e-6] so the log-odds are finite. The expectation over G uses five Gauss-Hermite nodes
on one market factor.

## What we measure

The table's value at the opening state overstates the true survival probability (estimated by
simulating the solved policy on 3,000 paths):

    n = 12: +21 points    n = 16: +16    n = 20: +13    n = 28: +9

A fit of a + b/n gives a ≈ 0.6, so the error is the discretisation's, not the return model's.
Doubling the points on any ONE axis takes +21 to about +18; doubling all three, to +9. Interpolating
V linearly instead of its log-odds halves the bias (+9 at n = 12, plateauing at +7) but smears the
cliff itself, so a state well above the threshold reads 0.77 and one well below reads 0.12.

The bias by itself is harmless (every state is inflated). What hurts is that at some states two
actions whose true values differ by six points (69.3 vs 63.1, as fixed policies) are ranked the wrong
way by the table, by 0.3 points, and the solver acts on it every year with full confidence. Across
41 households the solver beats the best fixed rule on 32 and loses on 5; three of the five losses
are this mechanism.

## Our current guesses

1. The upward bias is the log-odds interpolation: a clamped "certain" cell has log-odds +13.8 and
   dominates any blend it is part of, so plateaus next to the cliff are pulled up; this compounds over
   36 backward steps.
2. Part of it is the optimiser's curse: max over 24 noisy estimates, compounded.
3. The cliff is one-dimensional in total (after-tax) wealth and smooth in the split between pots, so
   a coordinate change to (total wealth, pension share, ISA share of the rest) with 40 points on the
   first axis and 6 on each share should resolve the cliff at a fifth of the cell count. A first
   run supports this (bias +13 to +1, solve time 120s to 17s) but it is one household.

## The questions

1. Is there a standard treatment for interpolating a value function with a moving discontinuity in a
   backward pass, so that the plateaus are not biased and the cliff stays sharp? (Shape-preserving
   or monotone schemes? Storing the cliff location parametrically? Something from front-tracking?)
2. Is the 1/n law we measure what theory predicts for trilinear interpolation of a step compounded
   over T steps, and does Richardson extrapolation (2·V_{2n} − V_n) legitimately cancel it when the
   per-step error is itself a function of the state?
3. For the coordinate change: is there a principled way to choose the coordinate the cliff lives in
   (a sufficient statistic for survival) rather than guessing "total wealth"? The tax code makes
   pension pounds worth less than ISA pounds, and the exchange rate varies with the withdrawal path.
4. Would you replace the grid with regression on simulated paths (Longstaff-Schwartz style) for a
   problem of this shape, and if so what basis handles a step?
5. Is there a cheaper way to de-bias the DECISION than the value - e.g. comparing actions by the
   difference of two interpolations that share most of their error - rather than fixing the value?

What we can offer: the whole thing is reproducible in a few hundred lines of JavaScript, a solve is
seconds to minutes, and every claim above has a script behind it.
