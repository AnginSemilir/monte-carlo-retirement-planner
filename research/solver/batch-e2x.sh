#!/bin/bash
# E2X, E2 shown exact on the research candidate and gate 5 timed (PLAN.md E2X; a MEASUREMENT, launched under
# predictions/measure-e2x.md, Kind: measurement): audit-e2x.mjs on SIZE's four households, ONE AT A TIME (the timing is a
# quiet-machine wall-clock and the split uses all four cores), at 30 points, into results/diage2x; each household stopped at
# 3 hours. Read by reduce-e2x.mjs into results-e2x.txt.
set -u
OUT=research/solver/results/diage2x
rm -rf "$OUT"; mkdir -p "$OUT"
for k in 0 1 2 3; do
  timeout 10800 node research/solver/audit-e2x.mjs 30 part $k/4 > "$OUT/case$k.txt" 2>&1 || echo "household $k exited $?"
done
echo "E2X runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-e2x.mjs "$OUT" || echo "=== reduce-e2x.mjs did not run to its reading inside the snapshot: reduce in the real tree"
