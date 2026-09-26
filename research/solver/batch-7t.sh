#!/bin/bash
# 7t: do the mixture's tables overrate the riskier tier because each world plans as if it knew its world? (PLAN.md 7t;
# predictions/diag-7t.md). Launched only through run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-7t.md.
#   audit-s126.mjs's diag7t mode: S126, bridge 4, S360 and share 0.95 (off and the reader) and S194 (off), each arm solved
#   with the mixture as the product solves it and with jointWorlds (one policy for every world); every arm run as solved and
#   at switch margin 0 on 8,000 paths of the tuning seed 7002 (the first 3,000 are 7r's), and on 2,000 paths in each world;
#   16 points; one case a process; traces kept.
set -u
OUT=research/solver/results/diag7t
rm -rf "$OUT"; mkdir -p "$OUT"
for k in 0 1 2 3 4; do
  timeout 25200 node research/solver/audit-s126.mjs diag7t 16 8000 part $k/5 7002 2000 > "$OUT/part$k.txt" 2>&1 &
done
wait
echo "7t runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7t.mjs "$OUT"
