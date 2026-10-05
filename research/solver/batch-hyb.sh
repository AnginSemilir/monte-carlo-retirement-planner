#!/bin/bash
# HYB (PLAN.md O89; a TEST, launched under predictions/diag-hyb.md): audit-hyb.mjs on S130, S370 and S128 - SNAP's and PCLSI's
# tables solved; SNAP, PCLSI and HYB (PCLSI's tables read through the snap) run forward - at 30 points, 6,000 paired paths
# (seed 7005), death tax 0, one process a household, three at once, into results/diaghyb (logs and per-path files); each
# process stopped at 3 hours. Read by reduce-hyb.mjs into results-hyb.txt, its gate holding the SNAP and PCLSI arms to
# ADOPT-PI's per-path files.
set -u
OUT=research/solver/results/diaghyb
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 2 | xargs -P 3 -I{} sh -c \
  'DIAGHYB_OUT=research/solver/results/diaghyb timeout 10800 node research/solver/audit-hyb.mjs 30 6000 part {}/3 7005 > research/solver/results/diaghyb/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "HYB runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-hyb.mjs "$OUT" || echo "=== reduce-hyb.mjs did not run to its reading inside the snapshot: reduce in the real tree"
