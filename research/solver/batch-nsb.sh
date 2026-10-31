#!/bin/bash
# NSB (PLAN.md NSB; a TEST, launched under predictions/diag-nsb.md): audit-nsb.mjs on S370, bridge 4 and S126 (deciding)
# and S130 and S128 (incidence) - BASE's and COV's tables solved at XAS's unit; along BASE's paths, in every bridge year,
# the bequest and shortfall reads against their one-step values with the share-axis dead weight (item 1), the moves the
# dead nodes' swap changes (item 2), and BASE's year-before reads with the menu-order reference and the 41-point nodes
# (item 3) - at 30 points, 2,000 paths a world (seed 7002), one process a household, four at once, into results/diagnsb;
# each process stopped at 8 hours. Read by reduce-nsb.mjs into results-nsb.txt (in the real tree: the identity reads
# XAS-R2's files and its logs' fair-test gate needs git).
set -u
OUT=research/solver/results/diagnsb
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 4 | xargs -P 4 -I{} sh -c \
  'DIAGNSB_OUT=research/solver/results/diagnsb timeout 28800 node research/solver/audit-nsb.mjs 30 2000 part {}/5 7002 > research/solver/results/diagnsb/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "NSB runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-nsb.mjs "$OUT" || echo "=== reduce-nsb.mjs did not run to its reading inside the snapshot: reduce in the real tree"
