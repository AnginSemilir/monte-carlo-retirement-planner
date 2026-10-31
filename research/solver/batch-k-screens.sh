#!/usr/bin/env bash
# K2-K4 SCREENS (PLAN.md Phase K), overnight, single table, lambda at each household's flex-tiers value,
# new baseline + the step-2 #106 option, 3,000 paths, full records. Predictions: the predictions register.
#   K2  minimum pot 0 / 1 / 3 / 5 years of target spending
#   K3  raise cap 1.0 / 1.1 / 1.2
#   K4  estate curve above the minimum pot: weight 0 / 0.01 / 0.03 / 0.1 / 0.3 at scale 1 and 4
set -u
: "${SHAREDEAD:=none}"   # step-2 re-check: neither #106 option passed
H="20:0.0223606797749979 6:0.1 50:2 74:0.005 38:0.1 16:0.0223606797749979 32:2 64:0.9457416090031758 26:0.1 10:1.140477893362459 14:2 68:1.140477893362459"
# CELLS ALREADY ON FILE (checked 23 Sep 21:40, before launch - PLAN.md "is the answer already in data we have?").
# s2-fnewex is exactly this baseline: the same flags (STOREPOL only adds the stored moves to the record;
# SHAREDEAD=none reads as no option), the same seeds and paths, and the solver changed since only in comments
# and the product entry point. So these cells are copied from it, not re-run:
#   k3-cap1.2  every household - a cap at 1.2 leaves the menu unchanged
#   k2-pot0    the six whose plan carries no floor of its own (S126 S390 S206 S330 S070 S100) - MINPOTYEARS=0
#              sets the floor to what it already is; the other six carry their own floor, so their pot0 cell runs
#   k2-pot5    S112 only - five years of its 18,000 target is its own floor of 90,000
REUSE="k3-cap1.2:20 k3-cap1.2:6 k3-cap1.2:50 k3-cap1.2:74 k3-cap1.2:38 k3-cap1.2:16 k3-cap1.2:32 k3-cap1.2:64 k3-cap1.2:26 k3-cap1.2:10 k3-cap1.2:14 k3-cap1.2:68 k2-pot0:20 k2-pot0:74 k2-pot0:38 k2-pot0:64 k2-pot0:10 k2-pot0:14 k2-pot5:16"
ID_OF() { case $1 in 20) echo S126;; 6) echo S054;; 50) echo S252;; 74) echo S390;; 38) echo S206;; 16) echo S112;; 32) echo S184;; 64) echo S330;; 26) echo S162;; 10) echo S070;; 14) echo S100;; 68) echo S354;; esac; }
R=research/solver/results
for c in $REUSE; do
  tag=${c%%:*}; k=${c#*:}; id=$(ID_OF $k)
  mkdir -p $R/$tag
  cp $R/s2-fnewex/$id.json $R/$tag/$id.json
  cp $R/s2-fnewex/$id.solver.record.json.gz $R/$tag/$id.solver.record.json.gz
  echo "$id copied from s2-fnewex (identical configuration; see batch-k-screens.sh)" >> $R/$tag/PROVENANCE.txt
done
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
# drop the reused cells from the queue
for c in $REUSE; do tag=${c%%:*}; k=${c#*:}; J=$(printf '%s' "$J" | grep -v "^$k:[^:]*:$tag:"); J="$J
"; done
echo "=== K screens: $(printf '%s' "$J" | grep -c .) cells to run, $(echo $REUSE | wc -w) reused from s2-fnewex ==="
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; LAM=$2; TAG=$3; EXTRA=$(echo "$4" | tr "," " ")
  env RECORD=1 SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=0 TIERS=1 ONLY=$K FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 FINALEXACT=1 TERNARY=${TERNARY:-0} SHAREDEAD='"$SHAREDEAD"' $EXTRA \
    timeout 7200 node research/solver/experiment.mjs flex $TAG 30 3000 7001 7002 2>&1 | tail -1'
echo "=== K screens done ==="
