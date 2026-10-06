#!/bin/bash
# XAS-R2 (PLAN.md XAS-R2; a TEST, launched under predictions/diag-xasr2.md): audit-xasr2.mjs on S370, bridge 4 and S126 -
# BASE's and COV's tables solved at XAS's unit; along BASE's paths every read in the year before a step taken as the reader's
# own (held to XAS's), (v-a), (v-a) on the fine points and (v-b), each built on its own arm's nodes (O109's fix); S126's
# step-year bequest and shortfall reads against their one-step values - at 30 points, 2,000 paths a world (seed 7002), one
# process a household, three at once, into results/diagxasr2; each process stopped at 6 hours. Read by reduce-xasr2.mjs into
# results-xasr2.txt (in the real tree: XAS's files' declared corrections need git).
set -u
OUT=research/solver/results/diagxasr2
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 2 | xargs -P 3 -I{} sh -c \
  'DIAGXASR2_OUT=research/solver/results/diagxasr2 timeout 21600 node research/solver/audit-xasr2.mjs 30 2000 part {}/3 7002 > research/solver/results/diagxasr2/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "XAS-R2 runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-xasr2.mjs "$OUT" || echo "=== reduce-xasr2.mjs did not run to its reading inside the snapshot: reduce in the real tree"
