#!/bin/bash
# FORCE-X (PLAN.md FORCE-X; a TEST, launched under predictions/diag-forcex.md): audit-forcex.mjs's six parts (a household and
# a set of tables each, one solve each) at 30 points and EDGE-SPLIT's 6,000 paths a household (seed 7005), four at once, into
# results/diagforcex; each stopped at 6 hours. Read by reduce-forcex.mjs into results-forcex.txt (in the real tree:
# EDGE-SPLIT's declared correction needs git).
set -u
OUT=research/solver/results/diagforcex
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 5 | xargs -P 4 -I{} sh -c \
  'DIAGFORCEX_OUT=research/solver/results/diagforcex timeout 21600 node research/solver/audit-forcex.mjs 30 6000 part {}/6 7005 > research/solver/results/diagforcex/case{}.txt 2>&1 || echo "part {} exited $?"'
echo "FORCE-X runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-forcex.mjs "$OUT" || echo "=== reduce-forcex.mjs did not run to its reading inside the snapshot (EDGE-SPLIT's declared correction needs git): reduce in the real tree"
