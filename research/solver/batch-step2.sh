#!/usr/bin/env bash
#
# STEP 2 FIELD CHECK (PLAN.md "Step 2"). Single table (MIX=0), lambda held at each household's
# flex-tiers landing, 3,000 held-out paths, judged on the SIMULATED outcome (maintainer's decision A).
#
#   today    resilience 0.5, five levels, exhaustive scan            - what every result so far used
#   newex    resilience OFF, six levels, exhaustive                  - the new objective, old search
#   new      resilience OFF, six levels, TERNARY                     - the new baseline
#   newq15   new at 15 quadrature nodes                              - decision A's sub-point check
#   newp56   new at 56 wealth points                                 - decision A's sub-point check
#   drop / linear   new with shareDead, on S126 and controls S184, S162   - the #106 fix
#
# Gates, written before the run: ternary against exhaustive within 0.5 of survival and 1% of spending, at
# least 15% faster; 15 nodes and 56 points within 0.5 of survival and 1% of spending of the new baseline on
# every household; 'drop' bit-identical on the controls and not lower on S126's survival.
set -u
J=""
add() { J="$J$1:$2:$3:$4
"; }
H="20:0.0223606797749979 6:0.1 50:2 74:0.005 38:0.1 16:0.0223606797749979 32:2 64:0.9457416090031758 26:0.1 10:1.140477893362459 14:2 68:1.140477893362459"
for h in $H; do
  K=${h%%:*}; L=${h#*:}
  for arm in today newex new newq15 newp56; do add $K $L $arm 30; done
done
for h in 20:0.0223606797749979 32:2 26:0.1; do K=${h%%:*}; L=${h#*:}; for arm in drop linear; do add $K $L $arm 30; done; done
echo "=== step 2: $(printf '%s' "$J" | grep -c .) cells ==="
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; LAM=$2; ARM=$3; PTS=$4
  COMMON="RECORD=1 STOREPOL=1 SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=0 TIERS=1 ONLY=$K FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003"
  case $ARM in
    today)  ENVS="LEVELS=1.2,1.1,1,0.9,0.8" ;;
    newex)  ENVS="WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8" ;;
    new)    ENVS="WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 TERNARY=1" ;;
    newq15) ENVS="WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 TERNARY=1 QUAD=15" ;;
    newp56) ENVS="WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 TERNARY=1"; PTS=56 ;;
    drop)   ENVS="WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 TERNARY=1 SHAREDEAD=drop" ;;
    linear) ENVS="WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 TERNARY=1 SHAREDEAD=linear" ;;
  esac
  env $COMMON $ENVS timeout 10800 node research/solver/experiment.mjs flex s2-$ARM $PTS 3000 7001 7002 2>&1 | tail -1
'
echo "=== step 2 done ==="
