#!/bin/bash
# 7av (predictions/diag-7av.md; PLAN.md 7av; the step-read test proposed by the deep review after 7at, run on the
# maintainer's 'Run 1'): seven units (audit-7av.mjs UNITS: S130 and S370 READER under the allowance axis snapped and
# interpolated at 6 share points - 7at's units - and interpolated at 12; S370 interpolated at 6 with the reference drawn in
# the menu's order) at 30 points, 2,000 paths a world at each of the three worlds' nodes (seed 7002), every bridge read split
# into step and spread and read four ways, one process a unit, four at once, the 12-point units first (the longest), into
# results/diag7av; each process stopped at 8 hours. The registered read is reduce-7av.mjs run in the real tree after the
# batch (it holds the 6-point READER units to 7at's records, which the launcher's snapshot does not carry).
set -u
OUT=research/solver/results/diag7av
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 6 | xargs -P 4 -I{} sh -c \
  'timeout 28800 node research/solver/audit-7av.mjs 30 2000 part {}/7 7002 > research/solver/results/diag7av/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7av runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7av.mjs "$OUT" || echo "=== reduce-7av.mjs did not run to its outcome inside the snapshot: reduce in the real tree"
