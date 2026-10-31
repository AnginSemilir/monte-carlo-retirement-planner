#!/bin/bash
# 7as (predictions/diag-7as.md; PLAN.md 7as; the maintainer's decision for the charge, 3 Oct): audit-7as.mjs's 9 jobs - P's
# three units at switchCharge 0.0005 and 0.002 (margin 0; across all worlds on 8,000 paths, S194 also at world 0's node on
# 16,000) and P's 0.001 solved again for identity - at 30 points, seed 7002, one process a job, four at once, S194's two
# charged jobs first (the longest), into results/diag7as; each process stopped at 5 hours. The registered read is
# reduce-7as.mjs run in the real tree after the batch (it reads P's records and their chain, which the snapshot does not carry).
set -u
OUT=research/solver/results/diag7as
rm -rf "$OUT"; mkdir -p "$OUT"
printf '%s\n' 1 4 0 2 3 5 6 7 8 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-7as.mjs 30 16000 part {}/9 7002 16000 8000 > research/solver/results/diag7as/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "7as runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7as.mjs "$OUT" || echo "=== reduce-7as.mjs did not run to its outcome inside the snapshot: reduce in the real tree"
