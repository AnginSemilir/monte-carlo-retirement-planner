#!/bin/bash
# 7au (PLAN.md 7au; predictions/diag-7au.md): audit-7au.mjs's 4 jobs (node:L on S194; all:L on bridge 4, S194 and S126) at
# P's settings, 30 points, 16,000 paths of seed 7002 (16,000 at the node and across all worlds, 2,000 for the identity runs),
# one process a job, four at once, into results/diag7au; each process stopped at 4 hours. Read by reduce-7au.mjs (in the
# real tree, beside P's records) into results-7au.txt.
set -u
OUT=research/solver/results/diag7au
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 3 | xargs -P 4 -I{} sh -c \
  'DIAG7AU_OUT=research/solver/results/diag7au timeout 14400 node research/solver/audit-7au.mjs 30 16000 part {}/4 7002 16000 16000 2000 > research/solver/results/diag7au/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "7au runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7au.mjs "$OUT" || echo "=== reduce-7au.mjs did not run to its reading inside the snapshot: reduce in the real tree"
