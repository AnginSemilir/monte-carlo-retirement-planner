#!/usr/bin/env bash
#
# PHASE 6f: THE KINK NOBODY CHOSE.  Asked by the maintainer, 23 Sep: "why do we even need resilience
# if we have bequest?"
#
# Working it through: they are not two concepts. Both are functions of the SAME quantity - terminal net
# wealth - and both are gated by the same `alive` test. Added together they form ONE piecewise-linear
# concave function of terminal wealth, with resilience as its steep first segment and bequest as its
# shallow second one. At K = opening wealth = 500,000:
#
#     terminal net        combined score      marginal value of the next 1,000
#     0 -> K              rising to 0.52          10.4e-4
#     K -> 4K             0.52 -> 0.58             0.4e-4      <- a 26x drop, at K
#     above 4K            0.58, flat               0           <- the cap, studied in 6c and 6e
#
# **The kink at K is 26 times larger than the cliff at 4K that 6c and 6e spent about fifteen hours of
# compute on.** Nobody chose it. It is what falls out of wR = 0.5 and wB = 0.02 having been picked
# independently, and it sits inside the distribution rather than off in its tail: across the 41, the
# unlucky tenth lands at 0.64 to 0.84 of opening wealth - always on the steep side - while medians run
# 2.2x to 3.9x - on the shallow side.
#
# THE CONSTANTS AUDIT MISSED THIS, structurally. It examined each constant for flat regions one at a
# time; the shape exists only in the SUM, which is the function the solver actually maximises and which
# appears nowhere in the plan. Looking term by term could not have found it.
#
# FOUR ARMS. wR in {0, 0.25, 0.5, 1.0}, which makes the slope ratio 1x, 13x, 26x (today) and 52x.
# **wR = 0 is the maintainer's question asked directly**: if deleting resilience changes nothing, the
# term is doing no work and should go.
#
# THE METRIC THAT DECIDES IT is p10 terminal net - the unlucky tenth. That is what resilience exists to
# protect, per its own comment ("a decomposable stand-in for the unlucky tenth"). If varying its weight
# does not move the unlucky tenth, it is not doing the job it was added for, whatever else it moves.
#
# Six households spanning opening wealth 180k to 950k and p10/K from 0.64 to 0.84. Lambda held at each
# household's landed flex-tiers value, so this is a screen: the floor rate is not pinned, the arms are
# not at equal downside, and no figure here is a headline.
set -u
J=""
add() { J="$J$1:$2:$3
"; }
for A in 0 0.25 0.5 1.0; do
  add 20 0.0223606797749979  $A   # S126  K 950k, p10/K 0.839, median/K 2.39
  add  6 0.1                 $A   # S054  K 950k, p10/K 0.801, median/K 2.24
  add 50 2                   $A   # S252  K 180k, p10/K 0.711, median/K 3.92
  add 74 0.005               $A   # S390  K 950k, p10/K 0.657, median/K 3.73
  add 38 0.1                 $A   # S206  K 180k, p10/K 0.642, median/K 3.22
  add 16 0.0223606797749979  $A   # S112  K 450k, p10/K 0.637, median/K 2.20
done
echo "=== phase 6f: $(printf '%s' "$J" | grep -c .) cells, 4 resilience weights x 6 households ==="
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  IDX=$1; LAM=$2; WRW=$3
  WR=$WRW SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=3 TIERS=1 ONLY=$IDX FLOOR=0.8 CONF=0.9 \
    LEVELS=1.2,1.1,1,0.9,0.8 MARGIN=0.005 RAISE=0.003 \
    timeout 7200 node research/solver/experiment.mjs flex wr-$WRW 30 3000 7001 7002 2>&1 | tail -1
'
echo "=== phase 6f done ==="
