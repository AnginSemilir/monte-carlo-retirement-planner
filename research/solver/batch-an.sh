#!/bin/bash
# AN (predictions/diag-an.md): audit-an.mjs's one job at its registered settings (S360 at 60 points with NODE-AX's fifteen
# share nodes under the adaptive reference, the candidate's own unit, 4,000 paths a world, seed 7002), into results/diagan,
# read by reduce-an.mjs in the real tree into results-an.txt against NODE-AX's BN. One core; ten hours' timeout.
set -u
OUT=research/solver/results/diagan
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-an.mjs --units | tail -1)
[ "$NJ" = 1 ] || { echo "AN: audit-an.mjs names $NJ jobs, not 1"; exit 1; }
timeout 36000 node research/solver/audit-an.mjs 1 4000 part 0/1 7002 > "$OUT/case0.txt" 2>&1; code=$?
grep -h "Error\|audit-an:" "$OUT/case0.txt" | head -5
grep -hE "solve CAND|adaptive |checks " "$OUT/case0.txt" | cut -c1-220
echo "AN job exit $code; done $(TZ=Europe/London date +%H:%M) UK"
