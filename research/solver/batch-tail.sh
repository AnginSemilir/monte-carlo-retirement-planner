#!/bin/bash
# TAIL (PLAN.md O97, O89, PR7; a TEST, launched under predictions/diag-tail.md): audit-tail.mjs's 8 jobs - TAIL on the five
# losers and S130, S370 (SNAP's and PCLSI's tables; SNAP, PCLSI and PCLSI-TIE run forward, HYB beside them on S130 and S370)
# and HYB on S128 (with SNAP and PCLSI); the death-tax group dropped (the 5 Oct 08:00 row) - at 30 points,
# 6,000 paired paths (seed 7005), the tie margin 1e-6, one process a job, four at once, longest first (results-derive-tail.txt),
# into results/diagtail (logs and per-path files); each process stopped at 5 hours. Read by reduce-tail.mjs into
# results-tail.txt, its gate holding the SNAP and PCLSI arms to ADOPT-PI's per-path files.
set -u
OUT=research/solver/results/diagtail
rm -rf "$OUT"; mkdir -p "$OUT"
printf '2\n0\n5\n6\n1\n4\n3\n7\n' | xargs -P 4 -I{} sh -c \
  'DIAGTAIL_OUT=research/solver/results/diagtail timeout 18000 node research/solver/audit-tail.mjs 30 6000 part {}/8 7005 1e-6 > research/solver/results/diagtail/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "TAIL runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-tail.mjs "$OUT" || echo "=== reduce-tail.mjs did not run to its reading inside the snapshot: reduce in the real tree"
