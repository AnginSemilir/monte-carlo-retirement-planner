#!/bin/bash
# 7ap (predictions/diag-7ap.md; PLAN.md 7ap; the deep review after 7al's decisive test, O71): the allowance test - six units
# (audit-7ap.mjs UNITS: S370 and S130 READER, S194 OFF, each with the allowance axis snapped and interpolated) at 30 points,
# 2,000 paths a world at each of the three worlds' nodes (seed 7002), one process a unit, four at once, into results/diag7ap;
# each process stopped at 5 hours. The registered read is reduce-7ap.mjs run in the real tree after the batch (it holds the
# DEFAULT units to 7al's records in results/diag7al, which the launcher's snapshot does not carry).
set -u
OUT=research/solver/results/diag7ap
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 5 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-7ap.mjs 30 2000 part {}/6 7002 > research/solver/results/diag7ap/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7ap runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7ap.mjs "$OUT" || echo "=== reduce-7ap.mjs did not run to its outcome inside the snapshot: reduce in the real tree"
