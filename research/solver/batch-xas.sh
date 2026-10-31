#!/bin/bash
# XAS (PLAN.md XAS; a TEST, launched under predictions/diag-xas.md): audit-xas.mjs on S370, S130, bridge 4 and S126 - BASE's
# and COV's tables solved at COV-B-STEP's unit; along BASE's paths every reader read split into representation, quadrature
# and the year's draw; S126's opening and swap - at 30 points, 2,000 paths a world (seed 7002), one process a household,
# four at once, into results/diagxas (logs and per-read files); each process stopped at 5 hours. Read by reduce-xas.mjs
# into results-xas.txt, its gate holding the reads to COV-B-STEP's saved files read for read.
set -u
OUT=research/solver/results/diagxas
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 3 | xargs -P 4 -I{} sh -c \
  'DIAGXAS_OUT=research/solver/results/diagxas timeout 18000 node research/solver/audit-xas.mjs 30 2000 part {}/4 7002 > research/solver/results/diagxas/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "XAS runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-xas.mjs "$OUT" || echo "=== reduce-xas.mjs did not run to its reading inside the snapshot: reduce in the real tree"
