#!/usr/bin/env bash
# O19: the final year integrated exactly (FINALINT=1) against the 5-node rule, each with and without one tier above the
# plan (TIERSABOVE=1), plan held at Medium, M14b's settings otherwise - four arms, paired on the same 3,000 paths.
# predictions/o19-final.md. Launch: PREDICTION=research/solver/predictions/o19-final.md bash research/solver/run-from-snapshot.sh bash research/solver/batch-o19.sh
# CELLS re-runs a subset; P sets how many run at once (default 3; launched with P=4 once M14c has exited).
set -u
H="${CELLS:-34:2 26:0.1 50:2 28:0.6503449126242364 64:0.9457416090031758 68:1.140477893362459}"
J=""; for h in $H; do J="$J$h:o19-d5:
$h:o19-u5:TIERSABOVE=1
$h:o19-dx:FINALINT=1
$h:o19-ux:TIERSABOVE=1,FINALINT=1
"; done
printf '%s' "$J" | grep . | xargs -P "${P:-3}" -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; LAM=$2; TAG=$3; EXTRA=$(echo "${4:-}" | tr "," " ")
  env RECORD=1 SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=3 TIERS=1 ONLY=$K FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 FINALEXACT=1 RAISESURV=1 FAILSHORT=1 RAISECAP=1.1 MINPOTYEARS=1 PLANTIER="Medium Risk" $EXTRA \
    timeout 9000 node research/solver/experiment.mjs flex $TAG 30 3000 7001 7011 2>&1 | tail -1'
