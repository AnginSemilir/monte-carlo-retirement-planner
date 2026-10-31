#!/usr/bin/env bash
# PLAN.md finding M14: risk ABOVE the user's tier. Every library household holds its pension at the top tier, so
# the probe holds pension and ISA at Medium in the plan (PLANTIER, research only) and compares down-only with one
# step above allowed, on the 12 step-2 households. Prediction: the M14 row of the findings table.
set -u
H="20:0.0223606797749979 6:0.1 50:2 74:0.005 38:0.1 16:0.0223606797749979 32:2 64:0.9457416090031758 26:0.1 10:1.140477893362459 14:2 68:1.140477893362459"
J=""; for h in $H; do J="$J$h:m14-down:
$h:m14-up:TIERSABOVE=1
"; done
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; LAM=$2; TAG=$3; EXTRA=$(echo "${4:-}" | tr "," " ")
  env RECORD=1 SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=0 TIERS=1 ONLY=$K FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 FINALEXACT=1 PLANTIER="Medium Risk" $EXTRA \
    timeout 7200 node research/solver/experiment.mjs flex $TAG 30 3000 7001 7002 2>&1 | tail -1'
