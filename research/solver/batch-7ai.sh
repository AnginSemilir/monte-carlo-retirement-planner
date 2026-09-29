#!/bin/bash
# 7ai (predictions/diag-7ai.md; PLAN.md 7ai; O60): O60's openings check - the bundle (READER/TS+J/W0.02) and the shipping
# default (OFF/PRODUCT/W0.02) on seven households, each solved with the import's linear tier returns and with the medians
# of their blends (results-o60.txt): 28 solves at 30 points, no forward run (audit-7ai.mjs), four at a time, the CAND
# solves first (the longest), into results/diag7ai; each process stopped at 5 hours.
# inside the launcher's snapshot reduce-7ai.mjs refuses 7af's records (7af's declared correction cannot be verified
# without git there, O58); the registered read is reduce-7ai.mjs run in the real tree after the batch
set -u
OUT=research/solver/results/diag7ai
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 27 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-7ai.mjs 30 8000 part {}/28 7002 > research/solver/results/diag7ai/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7ai runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7ai.mjs "$OUT" || echo "=== reduce-7ai.mjs did not run to its outcome inside the snapshot (O58): reduce in the real tree"
