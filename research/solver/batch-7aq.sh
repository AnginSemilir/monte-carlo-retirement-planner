#!/bin/bash
# 7aq (predictions/diag-7aq.md; PLAN.md 7aq; the deep review after 7am's decisive next step for O67): P (READER/TS+J/MP/30x5,
# switchCharge 0.001, switchMargin 0) at half 7ai's tier shift each way on 7am's seven households, and at the full shift each
# way re-solved on the three 7am left unsplit (share 0.50, share 0.90, bridge 0), every unit printing its signed year-0 gap:
# 20 solves at 30 points, no forward run (audit-7aq.mjs), four at a time, into results/diag7aq; each process stopped at 5 hours.
# The registered read is reduce-7aq.mjs run in the real tree after the batch (7am's, P's and 7ai's records through their stamps).
set -u
OUT=research/solver/results/diag7aq
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 19 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-7aq.mjs 30 8000 part {}/20 7002 > research/solver/results/diag7aq/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7aq runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7aq.mjs "$OUT" || echo "=== reduce-7aq.mjs did not run to its outcome inside the snapshot: reduce in the real tree"
