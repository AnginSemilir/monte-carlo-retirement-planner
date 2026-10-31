#!/bin/bash
# 7s: does sampling each year's return at 5 points, not 15, make the solver with the bridge reader overrate the riskier
# tier? (PLAN.md 7s; predictions/diag-7s.md). Launched only through run-from-snapshot.sh with
# PREDICTION=research/solver/predictions/diag-7s.md.
#   audit-s126.mjs's bridge7e mode (7e's own, run by smoke.sh): S126 and bridge 4, one case a process, arms off, reader,
#   off@15 and reader@15, paired against off and against each other; 16 points, 3,000 paths of the tuning seed 7002 (7r's
#   paths, so the 5-point arms must reproduce 7r's).
set -u
OUT=research/solver/results/diag7s
rm -rf "$OUT"; mkdir -p "$OUT"
timeout 10800 node research/solver/audit-s126.mjs bridge7e 16 3000 part 0/1 off,reader,off@15,reader@15 "S126" 7002 > "$OUT/part0.txt" 2>&1 &
timeout 10800 node research/solver/audit-s126.mjs bridge7e 16 3000 part 0/1 off,reader,off@15,reader@15 "bridge 4" 7002 > "$OUT/part1.txt" 2>&1 &
wait
echo "7s runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7s.mjs "$OUT"
