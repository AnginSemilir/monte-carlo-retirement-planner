#!/bin/bash
# 7z: does integrating across the reader's step in the chooser (Q's fix, solve.js bridgeStep 'exact') gain on share 0.95
# without harm elsewhere? (PLAN.md 7z; predictions/diag-7z.md; the ledger 27 Sep 21:29 and 22:32). Launched only through
# run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-7z.md.
#   audit-s126.mjs's diag7z mode at the product's settings (30 points, 'auto' risk above, lambda held at 7t's to 7x's, 5
#   return points, the reader on): eight units, each one solve with Q's fix off (READER) or on (READER+STEP), on share
#   0.95, S126, bridge 4 and S194, each run forward at the product's margin on 8,000 paths of the tuning seed 7002 (7v's);
#   traces kept. One process a unit, four at a time, the fixed units first; each process may run 3 hours.
set -u
OUT=research/solver/results/diag7z
rm -rf "$OUT"; mkdir -p "$OUT"
# the unit order in audit-s126.mjs's diag7z: 0-3 READER, 4-7 READER+STEP, each in the order share 0.95, S126, bridge 4, S194
printf '%s\n' 4 5 6 7 0 1 2 3 | xargs -P 4 -I{} sh -c \
  'timeout 10800 node research/solver/audit-s126.mjs diag7z 30 8000 part {}/8 7002 > research/solver/results/diag7z/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7z runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7z.mjs "$OUT"
