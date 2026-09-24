#!/usr/bin/env bash
# K5 STAGE 1 (PLAN.md Phase K): match the solver's cutting to the guardrails-with-floor, on the step-2 twelve, with
# the defaults the maintainer chose on 24 Sep: the M17 floor fix on (RAISESURV, FAILSHORT), raises capped at 1.1,
# a minimum end pot of 1 year, estate weight as today. Single table (MIX=0), exact final year, 3,000 held paths
# (seed 7002, the same paths the guardrail figures in results/flex-tiers were measured on).
#
# THE GRID: c = the cost of one year at the floor (0.8), in survival units, so that the dislike of cuts means the
# same thing at every curve shape: lambda = c / 0.2^exponent. c from 0.0001 to 0.03 (today's landed lambdas at
# exponent 2 are c = 0.0002 to 0.08, median 0.004), exponents 1.5, 2, 3, 4. 24 points x 12 households.
set -u
H="20 6 50 74 38 16 32 64 26 10 14 68"
J=""
for h in $H; do for x in 1.5 2 3 4; do for c in 0.0001 0.0003 0.001 0.003 0.01 0.03; do
  lam=$(node -e "console.log($c / Math.pow(0.2, $x))")
  J="$J$h:$lam:k5-c$c-x$x:EXP=$x
"; done; done; done
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; LAM=$2; TAG=$3; EXTRA=$(echo "${4:-}" | tr "," " ")
  env RECORD=1 SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=0 TIERS=1 ONLY=$K FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 FINALEXACT=1 RAISESURV=1 FAILSHORT=1 RAISECAP=1.1 MINPOTYEARS=1 $EXTRA \
    timeout 7200 node research/solver/experiment.mjs flex $TAG 30 3000 7001 7002 2>&1 | tail -1'
