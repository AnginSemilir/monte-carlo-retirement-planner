#!/usr/bin/env bash
#
# IS THE LANDING OVER-TRIMMING BECAUSE ITS SEARCH STOPS TOO EARLY?
#
# Found by algebra rather than by a run, 23 Sep. The lambda search brackets [0.005, 2] - a factor of
# 400 - and takes `bisectSteps: 5`. Five halvings narrow 400x to 12.5x, so THE LANDED LAMBDA IS ONLY
# KNOWN TO WITHIN A FACTOR OF TWELVE. And `best` is the last lambda that MET the ask, so the search
# always stops on the low side, which is the over-trimming side.
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
