#!/usr/bin/env bash
# O22's trace: why do 15 return points raise S360's survival while its table read barely moves? audit-s126.mjs trace:
# F1 off, the tier above allowed, 5 or 15 return points, each with the final year averaged or exact, on the same paths,
# the per-year trace kept (predictions/o22-trace.md). One process (~45 min). Launch:
#   PREDICTION=research/solver/predictions/o22-trace.md bash research/solver/run-from-snapshot.sh bash research/solver/batch-o22.sh
set -u
OUT=research/solver/results/o22-trace
mkdir -p "$OUT"
timeout 10800 node research/solver/audit-s126.mjs trace 16 1000 S360 > "$OUT"/log.txt 2>&1; echo "trace exit $?"
cat "$OUT"/log.txt
node research/solver/reduce-o22.mjs S360
