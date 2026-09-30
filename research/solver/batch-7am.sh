#!/bin/bash
# 7am (predictions/diag-7am.md; PLAN.md 7am; O67): the stored margin - P (READER/TS+J/MP/30x5, switchCharge 0.001,
# switchMargin 0) with the tier returns at the medians of their blends and moved the other way, and the bundle
# (READER/TS+J/W0.02) at half that shift each way, on 7ai's seven households, and P's linear anchor on share 0.50: 29
# solves at 30 points, no forward run (audit-7am.mjs), four at a time, into results/diag7am; each process stopped at 5 hours.
# the registered read is reduce-7am.mjs run in the real tree after the batch (P's and 7ai's records through their stamps)
set -u
OUT=research/solver/results/diag7am
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 28 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-7am.mjs 30 8000 part {}/29 7002 > research/solver/results/diag7am/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7am runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7am.mjs "$OUT" || echo "=== reduce-7am.mjs did not run to its outcome inside the snapshot: reduce in the real tree"
