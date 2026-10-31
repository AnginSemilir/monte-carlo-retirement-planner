#!/bin/bash
# GATE 5 AFTER N4 AND INSTRUCTION 6 (a MEASUREMENT; STATE.md D11, D24 (3), D25, D26): audit-e2x.mjs on SIZE's four households,
# ONE AT A TIME (the timing is a quiet machine's wall-clock and the split uses all four cores), the candidate at 45 points
# and the product at its own 30, into results/diaggate5; each household stopped at 3 hours. Read by reduce-gate5.mjs into
# results-gate5.txt. Through the launcher, with nothing else running:
#   PREDICTION="none:gate 5, a measurement (D11, D25, D26)" research/solver/run-from-snapshot.sh bash research/solver/batch-gate5.sh
set -u
OUT=research/solver/results/diaggate5
rm -rf "$OUT"; mkdir -p "$OUT"
for k in 0 1 2 3; do
  PRODUCT_POINTS=30 timeout 10800 node research/solver/audit-e2x.mjs 45 part $k/4 > "$OUT/case$k.txt" 2>&1 || echo "household $k exited $?"
done
echo "gate 5 runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-gate5.mjs "$OUT" || echo "=== reduce-gate5.mjs did not read inside the snapshot: reduce in the real tree"
