#!/usr/bin/env bash
#
# IS THE LANDING OVER-TRIMMING BECAUSE ITS SEARCH STOPS TOO EARLY?
#
# Found by algebra rather than by a run, 23 Sep. The lambda search brackets [0.005, 2] - a factor of
# 400 - and takes `bisectSteps: 5`. Bisection here takes the GEOMETRIC midpoint, so each step takes the
# SQUARE ROOT of the ratio, not half of it: 400 -> 20 -> 4.5 -> 2.1 -> 1.45 -> 1.21. So five steps leave
# the lambda known to about 21%. (The first version of this header said 12.5x, dividing by 2^5 instead
# of taking the 32nd root - wrong by a factor of ten, corrected here rather than quietly.)
#
# 21% still costs something. Measured from the #108 landings, which happen to sit exactly 1.206 apart:
# S070 moved 1.13, 1.27 and 0.57 points across one such step, S020 moved 1.10 and 1.13, while the flat
# S058 moved 0.07 across a step twice that wide. So on sensitive households the bracket is worth ABOUT
# ONE POINT of floor rate - and `best` is the last lambda that MET the ask, so the miss is always on the
# over-trimming side.
#
# The evidence was already on disk and unread: all 22 genuine landings overshoot their ask, +0.37 to
# +2.73, mean +1.15. Households where the 0.5-point tolerance fires land tight (S058 +0.37, 3 solves);
# those where it never fires land loose (S268 +2.73, 7 solves = the full budget, unconverged).
#
# WHY THIS IS NOT A SPEED ITEM. The product requirement is that trimming of retirement spending is
# minimised and the user can trust that. Over-trimming cuts spending nobody asked us to cut. It is a
# correctness fault on the one thing that was called out as needing trust.
#
# AND IT MAKES PHASE 4 UNFAIR. The app's own optimizeSpend takes FOURTEEN iterations and stops when the
# bracket is under 250 pounds - fully converged. The solver takes five and stops twelve times wide. In
# a head-to-head the bias is ONE-SIDED, against the solver, on spending delivered, which is a headline
# metric. Phase 4 cannot run honestly until this is settled.
#
# THE PREDICTION, derived before the run. Overshoot decomposes into three parts: +0.5 is the deliberate
# margin and will not move; up to ~1.1 is the bracket and should vanish; the remainder is granularity,
# where no achievable plan sits nearer, and no amount of searching fixes it. So:
#   S058  no change - it already stopped early on the tolerance at five steps
#   S268  +2.73 -> around +1.6      S292  +2.37 -> around +1.3      S342  +1.87 -> around +0.8
# and spending delivered rises a little on those three. FALSIFIED if the drop exceeds ~1.3 points
# (something other than the bracket is at work) or falls short of ~0.3 (granularity dominates).
#
# TWELVE STEPS IS DELIBERATELY MORE THAN THE FIX WOULD USE. It takes the bracket to 1.0015, essentially
# exact, so the measurement isolates the bracket's whole contribution. The FIX wants eight: that leaves
# a residual of 0.14 points for 10 solves against today's 7, a 43% cost increase, where twelve would
# double it. Better still, a bracketed superlinear search (Brent) should reach the same tolerance in
# fewer evaluations than plain bisection - which is the real case for it, not speed.
#
# THE TEST DISCRIMINATES TWO EXPLANATIONS, which is why it is worth running rather than assuming:
#   - if 12 steps brings the overshoot down toward the 0.5-point tolerance, it is CONVERGENCE, and the
#     fix is to search properly (Brent, or simply more steps);
#   - if the overshoot stays put, it is STRUCTURAL - the achievable set has no policy at that rate, the
#     search is landing on the nearest one above, and nothing about the search can fix it.
#
# Twelve steps narrows 400x to about 1.1x. Three worst overshoots plus one control that should barely
# move; if the control moves a lot, the explanation is wrong.
set -u
J=""
add() { J="$J$1:$2:$3
"; }
#    idx : ask : id
add 54 0.7510 S268   # worst overshoot, +2.73, 7 solves
add 58 0.7720 S292   # +2.37, 7 solves
add 66 0.7200 S342   # +1.87, 7 solves
add  8 0.9790 S058   # CONTROL: +0.37, 3 solves, the tolerance fired - should barely move
echo "=== convergence: $(printf '%s' "$J" | grep -c .) landings at bisectSteps=12, against their 5-step records ==="
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  IDX=$1; ASK=$2
  BISECT=12 SOLVERONLY=1 SEARCH=5400 MIX=3 TIERS=1 ONLY=$IDX FLOOR=0.8 CONF=$ASK \
    LEVELS=1.2,1.1,1,0.9,0.8 MARGIN=0.005 RAISE=0.003 \
    timeout 28800 node research/solver/experiment.mjs flex cv-12 30 3000 7001 7002 2>&1 | tail -1
'
echo "=== convergence done ==="
