#!/bin/bash
# 7at (predictions/diag-7at.md; PLAN.md 7at; the allowance part, redesigned by the deep review after 7ar): six READER units
# (audit-7at.mjs UNITS: S370 and S130 under the used-allowance axis snapped, interpolated, and interpolated with a bucket at
# the wall) at 30 points, 2,000 paths a world at each of the three worlds' nodes (seed 7002), read (b) beside every read, one
# process a unit, four at once, the WALL units first (the longest), into results/diag7at; each process stopped at 5 hours.
# The registered read is reduce-7at.mjs run in the real tree after the batch (it holds S130 DEFAULT and PCLSI to 7ar's
# records and S370's to 7ap's, which the launcher's snapshot does not carry).
set -u
OUT=research/solver/results/diag7at
rm -rf "$OUT"; mkdir -p "$OUT"
printf '%s\n' 2 5 4 1 3 0 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-7at.mjs 30 2000 part {}/6 7002 > research/solver/results/diag7at/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7at runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7at.mjs "$OUT" || echo "=== reduce-7at.mjs did not run to its outcome inside the snapshot: reduce in the real tree"
