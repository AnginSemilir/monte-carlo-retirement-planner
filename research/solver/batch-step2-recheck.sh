#!/usr/bin/env bash
#
# STEP 2 RE-CHECK WITH THE EXACT FINAL YEAR (PLAN.md step 2, finding M10). The step-2 records showed most of
# the two gate failures sat in the final year, which read the nearest cell's stored move: all 53 paths S206
# lost at 56 points and 27 of 28 S390 lost under the ternary search. `finalExact` scores that year at the
# true position. This re-runs the two failed comparisons with it on, and with the chosen #106 option:
#   fnew     the new baseline + finalExact + SHAREDEAD           - the baseline everything downstream uses
#   fnewex   fnew with the exhaustive level scan                  - the ternary gate, again
#   fnewp56  fnew at 56 wealth points                             - the resolution gate, again
# Gates UNCHANGED from step 2 (0.5 of survival, 1% of spending, every household). Predictions, written before
# the run: the S206 and S390 gaps close to within noise; S112's ternary loss (no final-year paths) remains;
# survival rises on the thin households, never falls beyond noise, against `new`.
set -u
: "${SHAREDEAD:?set SHAREDEAD to the chosen #106 option: drop, linear or none}"
SD=""; [ "$SHAREDEAD" != "none" ] && SD="SHAREDEAD=$SHAREDEAD"
J=""
H="20:0.0223606797749979 6:0.1 50:2 74:0.005 38:0.1 16:0.0223606797749979 32:2 64:0.9457416090031758 26:0.1 10:1.140477893362459 14:2 68:1.140477893362459"
for h in $H; do K=${h%%:*}; L=${h#*:}; for arm in fnew fnewex fnewp56; do J="$J$K:$L:$arm
"; done; done
echo "=== step 2 re-check: $(printf '%s' "$J" | grep -c .) cells, $SD ==="
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; LAM=$2; ARM=$3; PTS=30
  COMMON="RECORD=1 STOREPOL=1 SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=0 TIERS=1 ONLY=$K FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 FINALEXACT=1 '"$SD"'"
  case $ARM in
    fnew)    ENVS="TERNARY=1" ;;
    fnewex)  ENVS="" ;;
    fnewp56) ENVS="TERNARY=1"; PTS=56 ;;
  esac
  env $COMMON $ENVS timeout 10800 node research/solver/experiment.mjs flex s2-$ARM $PTS 3000 7001 7002 2>&1 | tail -1
'
echo "=== step 2 re-check done ==="
