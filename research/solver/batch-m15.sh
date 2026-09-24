#!/usr/bin/env bash
# PLAN.md finding M15: the taxable account (GIA) takes the joint tier step, capital gains tax charged on a switch,
# with the decision also scoring "keep the GIA where it is". Households: S206 S330 S390 (45% of wealth in the GIA)
# and S054 S112 S184 as controls (2-5%). The no-gain baseline is s2-fnewex (same flags, on file); the GIA-heavy
# three run again with a 40% unrealised gain, both with the option off and on, since the gain changes the baseline
# too. Prediction: the M15 row of the findings table, written before this ran.
set -u
ALL="38:0.1 64:0.9457416090031758 74:0.005 6:0.1 16:0.0223606797749979 32:2"
HEAVY="38:0.1 64:0.9457416090031758 74:0.005"
J=""
for h in $ALL; do J="$J$h:m15-gia:GIATIERS=1
"; done
for h in $HEAVY; do J="$J$h:m15-off-gain40:GIAGAIN=0.4
$h:m15-gia-gain40:GIATIERS=1,GIAGAIN=0.4
"; done
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; LAM=$2; TAG=$3; EXTRA=$(echo "${4:-}" | tr "," " ")
  env RECORD=1 SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=0 TIERS=1 ONLY=$K FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 FINALEXACT=1 $EXTRA \
    timeout 7200 node research/solver/experiment.mjs flex $TAG 30 3000 7001 7002 2>&1 | tail -1'
