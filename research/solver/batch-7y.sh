#!/bin/bash
# 7y: does the tier state (solve.js tierState) recover what free switching loses, and is it the tier that carries it? (PLAN.md
# 7y; predictions/diag-7y.md; the deep review after 7x, the ledger 27 Sep 22:32). Launched only through run-from-snapshot.sh
# with PREDICTION=research/solver/predictions/diag-7y.md.
#   audit-s126.mjs's diag7y mode at the product's settings (30 points, 'auto' risk above, lambda held, 5 return points,
#   margin 0.001): fourteen units - on S126 (reader) and S194 (off) PRODUCT with H0, TS, and the TS-TIER and TS-REST swaps;
#   on share 0.95, bridge 4 and S360 with the reader and S360 under off, PRODUCT and TS - each run forward on 8,000 paths of
#   the tuning seed 7002; traces kept. One process a unit, four at a time, the longest first; each may run 4 hours.
set -u
OUT=research/solver/results/diag7y
rm -rf "$OUT"; mkdir -p "$OUT"
# the unit order in audit-s126.mjs's diag7y: 0-2 S126 P/T/S, 3-5 S194 P/T/S, 6-7 share 0.95 P/T, 8-9 bridge 4, 10-11 S360
# reader, 12-13 S360 off
printf '%s\n' 2 5 1 4 0 3 7 9 11 13 6 8 10 12 | xargs -P 4 -I{} sh -c \
  'timeout 14400 node research/solver/audit-s126.mjs diag7y 30 8000 part {}/14 7002 > research/solver/results/diag7y/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7y runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7y.mjs "$OUT"
