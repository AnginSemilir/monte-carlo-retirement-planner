#!/usr/bin/env bash
# K1 HONOURING CHECKS (PLAN.md Phase K). Exact, not tuned: a breach is a bug. check-k1.mjs reads every
# path-year of every record and fails on any breach of the rules that arm was given.
#   k1-rules  all rules at their extreme, 12 households, no tiers:
#             block trimming + block raises -> every spending year at 100; minimum pot 3 years; plan tier every year
#   k1-cap    raise cap 1.1, trimming allowed, tiers ON, minimum pot 3 years, 6 households:
#             no spending year above 110; no survivor below the minimum pot
#   k1-block  block trimming, raises allowed, tiers ON, minimum pot 3 years, 6 households:
#             no spending year below 100; no survivor below the minimum pot
# The two extra arms were added 23 Sep (method audit): with trimming AND raises blocked the menu has one
# level, so k1-rules alone never exercises a cap between levels or block-trim alongside raises and tiers.
set -u
: "${SHAREDEAD:=drop}"
H12="20:0.0223606797749979 6:0.1 50:2 74:0.005 38:0.1 16:0.0223606797749979 32:2 64:0.9457416090031758 26:0.1 10:1.140477893362459 14:2 68:1.140477893362459"
H6="20:0.0223606797749979 6:0.1 50:2 74:0.005 38:0.1 16:0.0223606797749979"
BASE="RECORD=1 SOLVERONLY=1 SEARCH=400 MIX=0 FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 FINALEXACT=1 TERNARY=${TERNARY:-1} SHAREDEAD=$SHAREDEAD MINPOTYEARS=3"
run() {  # $1 tag, $2 extra env, $3 household list
  printf '%s\n' $3 | xargs -P 4 -I{} sh -c '
    set -- $(echo "{}" | tr ":" " ")
    env '"$BASE $2"' LAMBDA=$2 ONLY=$1 timeout 7200 node research/solver/experiment.mjs flex '"$1"' 30 3000 7001 7002 2>&1 | tail -1'
}
run k1-rules "BLOCKTRIM=1 RAISECAP=1" "$H12"
run k1-cap "RAISECAP=1.1 TIERS=1" "$H6"
run k1-block "BLOCKTRIM=1 TIERS=1" "$H6"
node research/solver/check-k1.mjs
