#!/bin/bash
# 7ar (predictions/diag-7ar.md; PLAN.md 7ar; O76's decomposition, the deep review after 7ap's decisive test): five S130 units
# (audit-7ar.mjs UNITS: READER under the allowance axis snapped, interpolated and interpolated without the flag blend; OFF
# snapped and interpolated) at 30 points, 2,000 paths a world at each of the three worlds' nodes (seed 7002), one process a
# unit, four at once, into results/diag7ar; each process stopped at 5 hours. The registered read is reduce-7ar.mjs run in
# the real tree after the batch (it holds READER DEFAULT and PCLSI to 7ap's records in results/diag7ap, which the
# launcher's snapshot does not carry).
set -u
OUT=research/solver/results/diag7ar
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 4 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-7ar.mjs 30 2000 part {}/5 7002 > research/solver/results/diag7ar/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7ar runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7ar.mjs "$OUT" || echo "=== reduce-7ar.mjs did not run to its outcome inside the snapshot: reduce in the real tree"
