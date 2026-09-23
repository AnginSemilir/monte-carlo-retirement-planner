#!/usr/bin/env bash
#
# WHAT SHAPE IS THE FLOOR RATE AS A FUNCTION OF LAMBDA?
#
# Asked by the maintainer, 23 Sep, against my own loose claim that it is "smooth and monotone" - which
# was a quote from the stage-2 comment in solve.js, not a description of the function. The objection:
# we are working with hard edges. Trimming to a particular level can drop the gross withdrawal under a
# tax band and unlock a disproportionate gain, so why would the curve be well behaved?
#
# The objection is right, and there are two reasons the function cannot be smooth:
#
#   1. The policy is an ARGMAX over a finite action set - spend levels 1.2/1.1/1/0.9/0.8, tiers, draw
#      orders. It is constant in lambda until two actions tie, then jumps. So the floor rate is a
#      STAIRCASE, not a curve. The tax kinks make the objective non-concave in spending level, which
#      makes those jumps larger and more irregular, exactly as the objection says.
#
#   2. The solver maximises survival + wR*resilience + wB*bequest - lambda*trim + mu*raise. SURVIVAL IS
#      ONE TERM AMONG SEVERAL. Nothing forces the survival component of an argmax to move monotonically
#      when a different term's weight changes. Gate 6b found seven of 41 households clearing their ask
#      at lambda = 2 with no trimming at all, because the de-risking channel lifted the floor on its
#      own. If lambda shifts a tier decision, the floor rate can move the wrong way.
#
# WHY IT MATTERS: a bracketed superlinear root-finder (Brent) would replace stage 1's blind halving.
# Brent never leaves its bracket and falls back to bisection when interpolation misbehaves, so a nasty
# staircase costs it nothing - it degrades to what we already do. The shape therefore bounds the UPSIDE,
# not the downside, and this run prices that upside before any code is written.
#
# PREDICTION, recorded before the run: globally decreasing; visibly piecewise constant with flats
# spanning a factor of 1.5 to 2 in lambda; a few large steps where the spend menu switches; at least
# one local reversal in at least one household, most likely via the tier channel rather than tax; and
# reversals under a point, because they have to fight the first-order trend.
#
# Ten lambda values per household, geometric from a quarter to four times its landed value, so the grid
# is finest where a root-finder actually operates. Three households spanning a 74x range of landed
# lambda. Common random numbers throughout - one seed, one draw - so the DIFFERENCE between adjacent
# lambdas is far less noisy than the standard error of either level suggests, which is what makes
# sub-point reversals detectable at all.
set -u
J=""
# idx : landed lambda : id
for H in "66:1.6585:S342" "30:0.53929:S178" "16:0.0223606797749979:S112"; do
  IDX=${H%%:*}; REST=${H#*:}; L=${REST%%:*}; ID=${REST#*:}
  for K in 0 1 2 3 4 5 6 7 8 9; do
    LAM=$(node -e "console.log(($L * Math.pow(16, $K/9 - 0.5)).toPrecision(6))")
    J="$J$IDX:$LAM:$ID
"
  done
done
echo "=== lambda curve: $(printf '%s' "$J" | grep -c .) cells, 3 households x 10 lambdas ==="
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  IDX=$1; LAM=$2; ID=$3
  SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=3 TIERS=1 ONLY=$IDX FLOOR=0.8 CONF=0.9 \
    LEVELS=1.2,1.1,1,0.9,0.8 MARGIN=0.005 RAISE=0.003 \
    timeout 7200 node research/solver/experiment.mjs flex lc-$LAM 30 6000 7001 7002 2>&1 | tail -1
'
echo "=== lambda curve done ==="
