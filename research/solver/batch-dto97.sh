#!/bin/bash
# DT-O97 (PLAN.md DT-O97; a TEST, launched under predictions/diag-dto97.md): audit-dto97.mjs's 14 units (O97's seven loss
# households x SNAP and PCLSI, at a pension death tax of 40%) at 30 points and ADOPT-PI's 6,000 paths a household (seed 7005),
# four at once, into results/diagdto97; each stopped at 3 hours. Read by reduce-dto97.mjs into results-dto97.txt (in the real
# tree: ADOPT-PI's and EDGE-SPLIT-style declared corrections need git).
set -u
OUT=research/solver/results/diagdto97
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 13 | xargs -P 4 -I{} sh -c \
  'DIAGDTO97_OUT=research/solver/results/diagdto97 timeout 10800 node research/solver/audit-dto97.mjs 30 6000 part {}/14 7005 > research/solver/results/diagdto97/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "DT-O97 runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-dto97.mjs "$OUT" || echo "=== reduce-dto97.mjs did not run to its reading inside the snapshot: reduce in the real tree"
