#!/bin/bash
# EDGE-SPLIT (PLAN.md O101; a TEST, launched under predictions/diag-edge.md): audit-edge.mjs on S130, S128 and S370 - SNAP's and
# PCLSI's tables solved; SNAP, S-LO, S-HI, S-INT, PCLSI, P-LO and P-HI run forward - at 30 points, 6,000 paired paths (seed
# 7005), death tax 0, one process a household, three at once, into results/diagedge (logs and per-path files); each process
# stopped at 4 hours. Read by reduce-edge.mjs into results-edge.txt, its gate holding the SNAP and PCLSI arms to HYB's per-path
# files.
set -u
OUT=research/solver/results/diagedge
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 2 | xargs -P 3 -I{} sh -c \
  'DIAGEDGE_OUT=research/solver/results/diagedge timeout 14400 node research/solver/audit-edge.mjs 30 6000 part {}/3 7005 > research/solver/results/diagedge/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "EDGE-SPLIT runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-edge.mjs "$OUT" || echo "=== reduce-edge.mjs did not run to its reading inside the snapshot: reduce in the real tree"
