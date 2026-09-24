#!/usr/bin/env bash
# PLAN.md M14b: risk above the user's tier, RE-CHECKED under the step-6 defaults (the M17 floor fix on, raises capped
# at 1.1, a one-year minimum pot) before it becomes the default for thin plans. Plan held at Medium (PLANTIER),
# down-only against one tier above (TIERSABOVE=1), paired on the same 3,000 paths. Households: the four thin ones of
# M14 (S070 S184 S330 S354), two comfortable (S162, the one M14 loss; S252), and six whose solver survival sat at
# 85-96% (S082 S020 S194 S414 S234 S172), which is where "thin" is decided. Lambda: each household's landed value.
# Run in the three-world mixture (MIX=3, 24 Sep ~09:00): it decides a product default and its threshold is a level.
# Prediction: the M14b row in PLAN.md, written before this ran.
set -u
H="10:1.140477893362459 32:2 64:0.9457416090031758 68:1.140477893362459 26:0.1 50:2 12:1.140477893362459 2:1.3753120438672641 34:2 80:2 46:2 28:0.6503449126242364"
J=""; for h in $H; do J="$J$h:m14b-down:
$h:m14b-up:TIERSABOVE=1
"; done
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; LAM=$2; TAG=$3; EXTRA=$(echo "${4:-}" | tr "," " ")
  env RECORD=1 SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=3 TIERS=1 ONLY=$K FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 FINALEXACT=1 RAISESURV=1 FAILSHORT=1 RAISECAP=1.1 MINPOTYEARS=1 PLANTIER="Medium Risk" $EXTRA \
    timeout 7200 node research/solver/experiment.mjs flex $TAG 30 3000 7001 7002 2>&1 | tail -1'
