#!/usr/bin/env bash
# 7e: the bridge fixes side by side (PLAN.md 7e; registered prediction predictions/bridge-reader.md). audit-s126.mjs's
# bridge7e mode: each case solved with each arm - off, F1 v1, F1 v2 and the bridge reader - on the same 1,000 held-out
# paths (seed 7011: the reader was built after misreads seen on seed 7002's, so it is reported from paths that chose nothing), paired; the tier above and the final year exact in every arm, three worlds, lambda held at S126's, 16 points.
#   wave 1 (four at a time): the 23 bridge-panel cases, every arm
#   wave 2 (three at a time): the no-bridge controls, off against the reader; S360 with the reader at 5 and 15 return
#     points (7l's first evidence); S126, bridge 6 and S366 at the product's 30 points, off against the reader
#   last, alone on the machine: the time bar at 30 points (readertime), then the reducer
# Launch:
#   PREDICTION=research/solver/predictions/bridge-reader.md bash research/solver/run-from-snapshot.sh bash research/solver/batch-7e.sh
set -u
OUT=research/solver/results/bridge7e
mkdir -p "$OUT"
IDS="S126,share 0.50,share 0.70,share 0.78,share 0.90,share 0.95,bridge 0,bridge 1,bridge 4,bridge 6,wealth x0.5,wealth x2,S120,S122,S124,S128,S130,S360,S366,S370,bridge 4+cost,S162,S172"
for k in 0 1 2 3; do
  timeout 28800 node research/solver/audit-s126.mjs bridge7e 16 1000 part $k/4 off,v1,v2,reader "$IDS" 7011 > "$OUT/part$k.txt" 2>&1 &
done
wait
echo "wave 1 done $(TZ=Europe/London date +%H:%M) UK"
timeout 14400 node research/solver/audit-s126.mjs bridge7e 16 1000 part 0/1 off,reader S194,S252,S330 7011 > "$OUT/controls.txt" 2>&1 &
timeout 14400 node research/solver/audit-s126.mjs bridge7e 16 1000 part 0/1 reader,reader@15 S360 7011 > "$OUT/s360-quad.txt" 2>&1 &
timeout 21600 node research/solver/audit-s126.mjs bridge7e 30 1000 part 0/1 off,reader "S126,bridge 6,S366" 7011 > "$OUT/p30.txt" 2>&1 &
wait
echo "wave 2 done $(TZ=Europe/London date +%H:%M) UK"
timeout 21600 node research/solver/audit-s126.mjs readertime 30 2 > "$OUT/time30.txt" 2>&1
echo "timing done $(TZ=Europe/London date +%H:%M) UK"
for f in "$OUT"/part0.txt "$OUT"/part1.txt "$OUT"/part2.txt "$OUT"/part3.txt "$OUT"/controls.txt "$OUT"/s360-quad.txt "$OUT"/p30.txt "$OUT"/time30.txt; do echo "=== $f"; cat "$f"; done
node research/solver/reduce-7e.mjs
