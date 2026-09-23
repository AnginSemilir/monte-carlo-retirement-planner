#!/usr/bin/env bash
#
# 6e STAGE 1, FOLLOW-UP: the lump-flag arm where it should actually bite.
#
# Stage 1's twelve households were chosen as worst on the GAIN axis, so only two of the eight the audit
# found sitting in lump-sum bucket 0 were in the sample. The flag arm's +0.00% is therefore honest as
# "no effect on two households chosen for something else", not as "no effect".
#
# These are the other six, with the allowance each actually ends up having used:
#   S374 7.1%   S194 8.8%   S206 10.2%   S230 11.6%   S218 16.8%   S112 19.1%
#
# Every one of them is read by the shipped grid as having taken NO lump sum at all, so this is where
# the correctness fault is largest. Twelve cells: six households, current against flag-fixed.
set -u
J=""
add() { J="$J$1:$2:$3
"; }
for A in cur pcls; do
  add 70 2                     $A   # S374   7.1% of the allowance used
  add 34 2                     $A   # S194   8.8%
  add 38 0.10000000000000002   $A   # S206  10.2%
  add 44 0.10000000000000002   $A   # S230  11.6%
  add 40 1.3753120438672641    $A   # S218  16.8%
  add 16 0.0223606797749979    $A   # S112  19.1%
done
echo "=== 6e follow-up: $(printf '%s' "$J" | grep -c .) cells, 2 arms x 6 bucket-0 households ==="
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  IDX=$1; LAM=$2; ARM=$3
  case "$ARM" in
    cur)  EXTRA="" ;;
    pcls) EXTRA="PCLSSTRICT=1" ;;
  esac
  env $EXTRA SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=3 TIERS=1 ONLY=$IDX FLOOR=0.8 CONF=0.9 \
    LEVELS=1.2,1.1,1,0.9,0.8 MARGIN=0.005 RAISE=0.003 \
    timeout 5400 node research/solver/experiment.mjs flex p6-$ARM 30 3000 7001 7002 2>&1 | tail -1
'
echo "=== 6e follow-up done ==="
