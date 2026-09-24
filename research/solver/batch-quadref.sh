#!/usr/bin/env bash
# 7h: the quadrature reference - 5 against 15 return points every year, the final year exact, with and without one tier
# above the plan (plan at Medium, M14b's settings), on S194 S162 S252 S330; plus five worlds on S194 and S330
# (predictions/quad-ref.md). The 15-point jobs first (the longest). Launch:
#   PREDICTION=research/solver/predictions/quad-ref.md bash research/solver/run-from-snapshot.sh bash research/solver/batch-quadref.sh
set -u
H="34:2 26:0.1 50:2 64:0.9457416090031758"
J=""
for h in $H; do J="$J$h:qr-u15:TIERSABOVE=1,QUAD=15
$h:qr-d15:QUAD=15
"; done
for h in $H; do J="$J$h:qr-u5:TIERSABOVE=1
$h:qr-d5:
"; done
for h in 34:2 64:0.9457416090031758; do J="$J$h:qr-u5m5:TIERSABOVE=1,MIX5=1
"; done
printf '%s' "$J" | grep . | xargs -P "${P:-4}" -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; LAM=$2; TAG=$3; EXTRA=$(echo "${4:-}" | tr "," " ")
  MIXV=3; case "$EXTRA" in *MIX5=1*) MIXV=5; EXTRA=$(echo "$EXTRA" | sed "s/MIX5=1//");; esac
  env RECORD=1 SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=$MIXV TIERS=1 ONLY=$K FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 FINALEXACT=1 FINALINT=1 RAISESURV=1 FAILSHORT=1 RAISECAP=1.1 MINPOTYEARS=1 PLANTIER="Medium Risk" $EXTRA \
    timeout 10800 node research/solver/experiment.mjs flex $TAG 30 3000 7001 7011 2>&1 | tail -1'
