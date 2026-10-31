#!/bin/bash
# XAS-R (PLAN.md XAS-R; a TEST, launched under predictions/diag-xasr.md): audit-xasr.mjs on S370, bridge 4 and S126 - BASE's
# and COV's tables solved at XAS's unit; along BASE's paths every read in the year before a step taken three ways (the
# reader's own, held to XAS's; the plain log-odds read; (v-a) a supported node at each corner row's own edge; (v-b) a node
# at the cell's midpoint under the reader's rule); S126's opening scores by term - at 30 points, 2,000 paths a world (seed
# 7002), one process a household, three at once, into results/diagxasr (logs and per-read files); each process stopped at
# 6 hours. Read by reduce-xasr.mjs into results-xasr.txt, its gate holding the reads to XAS's saved files read for read.
set -u
OUT=research/solver/results/diagxasr
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 2 | xargs -P 3 -I{} sh -c \
  'DIAGXASR_OUT=research/solver/results/diagxasr timeout 21600 node research/solver/audit-xasr.mjs 30 2000 part {}/3 7002 > research/solver/results/diagxasr/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "XAS-R runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-xasr.mjs "$OUT" || echo "=== reduce-xasr.mjs did not run to its reading inside the snapshot: reduce in the real tree"
