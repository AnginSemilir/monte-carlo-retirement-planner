#!/bin/bash
# AREF Step 0 (predictions/diag-aref0.md, a measurement): audit-aref0.mjs at its registered settings (DP grid scale 1,
# 1,000 simulations a checked state, seed 7002) on NODE-AX's BN records and saved tables, one job, into results/diagaref0,
# read by reduce-aref0.mjs in the real tree into results-aref0.txt.
set -u
OUT=research/solver/results/diagaref0
rm -rf "$OUT"; mkdir -p "$OUT"
AREF0_OUT=$OUT node research/solver/audit-aref0.mjs 1 1000 > "$OUT/case0.txt" 2>&1; code=$?
grep -h "Error\|audit-aref0:" "$OUT/case0.txt" | head -5
grep -h "checks \|solve CAND\|dp " "$OUT/case0.txt" | cut -c1-200
echo "aref0 job exit $code; done $(TZ=Europe/London date +%H:%M) UK"
