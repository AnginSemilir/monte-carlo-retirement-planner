#!/bin/bash
# 7ak's preflight (predictions/diag-7ak.md): both units at a tiny grid (6 points, 60 paths), one after the other, into
# results/diag7ak-pre, so reduce-7ak.mjs's parse and gate can be checked on real output before registration. A
# measurement, not the test: at this grid the solves are not P's, and the gate's identity checks refuse them by design.
set -u
OUT=research/solver/results/diag7ak-pre
rm -rf "$OUT"; mkdir -p "$OUT"
for k in 0 1; do
  DIAG7AK_OUT="$OUT" timeout 3600 node research/solver/audit-7ak.mjs 6 60 part $k/2 7002 > "$OUT/case$k.txt" 2>&1 || echo "unit $k exited $?"
done
echo "7ak preflight done $(TZ=Europe/London date +%H:%M) UK"
