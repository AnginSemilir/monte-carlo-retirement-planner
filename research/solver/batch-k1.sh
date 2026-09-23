#!/usr/bin/env bash
# K1 HONOURING CHECKS (PLAN.md Phase K). Every rule at once, on the 12 step-2 households, with records;
# check-k1.mjs then reads every path-year and fails on any breach. Exact, not tuned: a breach is a bug.
#   block trimming + block raises -> every spending year at exactly 100
#   minimum pot 3 years           -> no surviving path ends below it
#   risk permission off (no TIERS) -> every year at the plan's tier
set -u
: "${SHAREDEAD:=drop}"
H="20:0.0223606797749979 6:0.1 50:2 74:0.005 38:0.1 16:0.0223606797749979 32:2 64:0.9457416090031758 26:0.1 10:1.140477893362459 14:2 68:1.140477893362459"
printf '%s\n' $H | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  env RECORD=1 SOLVERONLY=1 LAMBDA=$2 SEARCH=400 MIX=0 ONLY=$1 FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 TERNARY=1 SHAREDEAD='"$SHAREDEAD"' \
    BLOCKTRIM=1 RAISECAP=1 MINPOTYEARS=3 timeout 7200 node research/solver/experiment.mjs flex k1-rules 30 3000 7001 7002 2>&1 | tail -1'
node research/solver/check-k1.mjs
