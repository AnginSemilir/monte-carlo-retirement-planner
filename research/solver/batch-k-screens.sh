#!/usr/bin/env bash
# K2-K4 SCREENS (PLAN.md Phase K), overnight, single table, lambda at each household's flex-tiers value,
# new baseline + the step-2 #106 option, 3,000 paths, full records. Predictions: the predictions register.
#   K2  minimum pot 0 / 1 / 3 / 5 years of target spending
#   K3  raise cap 1.0 / 1.1 / 1.2
#   K4  estate curve above the minimum pot: weight 0 / 0.01 / 0.03 / 0.1 / 0.3 at scale 1 and 4
set -u
: "${SHAREDEAD:=drop}"
H="20:0.0223606797749979 6:0.1 50:2 74:0.005 38:0.1 16:0.0223606797749979 32:2 64:0.9457416090031758 26:0.1 10:1.140477893362459 14:2 68:1.140477893362459"
J=""
for h in $H; do
  for y in 0 1 3 5; do J="$J$h:k2-pot$y:MINPOTYEARS=$y
"; done
  for c in 1 1.1 1.2; do J="$J$h:k3-cap$c:RAISECAP=$c
"; done
  for w in 0.01 0.03 0.1 0.3; do for sc in 1 4; do J="$J$h:k4-w$w-s$sc:BEQSHAPE=logfloor,WB=$w,ESTATESCALE=$sc
"; done; done
  J="$J$h:k4-w0:BEQSHAPE=logfloor,WB=0
"
done
echo "=== K screens: $(printf '%s' "$J" | grep -c .) cells ==="
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; LAM=$2; TAG=$3; EXTRA=$(echo "$4" | tr "," " ")
  env RECORD=1 SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=0 TIERS=1 ONLY=$K FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 FINALEXACT=1 TERNARY=${TERNARY:-1} SHAREDEAD='"$SHAREDEAD"' $EXTRA \
    timeout 7200 node research/solver/experiment.mjs flex $TAG 30 3000 7001 7002 2>&1 | tail -1'
echo "=== K screens done ==="
