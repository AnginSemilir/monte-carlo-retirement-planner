#!/usr/bin/env bash
# PLAN.md finding M17: the two cures for "spend more and hold maximum risk when a future is failing", on the four
# thin households (S070 S184 S330 S354) and two controls (S126, S112). The baseline is s2-fnewex (same flags,
# already on file); only the two option arms run. Prediction: the M17 row of the findings table.
set -u
H="10:1.140477893362459 32:2 64:0.9457416090031758 68:1.140477893362459 20:0.0223606797749979 16:0.0223606797749979"
J=""; for h in $H; do J="$J$h:m17-floor:RAISESURV=1,FAILSHORT=1
$h:m17-zero:RAISESURV=1,FAILSHORT=zero
"; done
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; LAM=$2; TAG=$3; EXTRA=$(echo "$4" | tr "," " ")
  env RECORD=1 SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=0 TIERS=1 ONLY=$K FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 FINALEXACT=1 $EXTRA \
    timeout 7200 node research/solver/experiment.mjs flex $TAG 30 3000 7001 7002 2>&1 | tail -1'
