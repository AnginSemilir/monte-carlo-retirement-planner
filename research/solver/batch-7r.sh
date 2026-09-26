#!/bin/bash
# 7r: why the reader harms S126 and bridge 4 (PLAN.md 7r; predictions/diag-7r.md). Launched only through
# run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-7r.md.
#   the panel (fixed in audit-s126.mjs diag7r): S126, bridge 4, S120 and wealth x2 (off, reader), S366 (off, v1);
#   16 points, 3,000 paths of the tuning seed 7002, the per-year trace kept for every arm; one case a process.
set -u
OUT=research/solver/results/diag7r
rm -rf "$OUT"; mkdir -p "$OUT"
for k in 0 1 2 3 4; do
  timeout 7200 node research/solver/audit-s126.mjs diag7r 16 3000 part $k/5 7002 > "$OUT/part$k.txt" 2>&1 &
done
wait
echo "7r runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7r.mjs "$OUT"
