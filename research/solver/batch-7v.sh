#!/bin/bash
# 7v: is the reader's harm the switch margin holding a near-tie? The margin's dose-response (PLAN.md 7v;
# predictions/diag-7v.md; the maintainer, 27 Sep: "Run 7v first"). Launched only through run-from-snapshot.sh with
# PREDICTION=research/solver/predictions/diag-7v.md.
#   audit-s126.mjs's diag7v mode at the product's settings (30 points, 'auto' risk above, lambda the research reference
#   0.025; the family pairs at their own setups): each case's arms solved once and run forward at switch margins 0.001,
#   3e-4, 1e-4 and 0 on 8,000 paths of the tuning seed 7002 (the first 3,000 are 7r's), one policy at margin 0 also with
#   the learner, the harmed cases' world lines on 1,000 paths; traces kept. Nine cases, one process each, four at a time,
#   the longest first (the timing measurement of 27 Sep: a 30-point solve about 4 minutes, a traced forward run about 63 s
#   a thousand paths, on a quiet box); each process may run 10 hours before it is stopped.
set -u
OUT=research/solver/results/diag7v
rm -rf "$OUT"; mkdir -p "$OUT"
# the case order in audit-s126.mjs's panel: 0 S126, 1 bridge 4, 2 S360, 3 share 0.95, 4 S194, 5 S172 down, 6 S172 up,
# 7 S330 mix3, 8 S330 mix5; launched longest first
printf '%s\n' 0 1 2 3 8 4 5 6 7 | xargs -P 4 -I{} sh -c \
  'timeout 36000 node research/solver/audit-s126.mjs diag7v 30 8000 part {}/9 7002 1000 > research/solver/results/diag7v/case{}.txt 2>&1 || echo "case {} exited $?"'
echo "7v runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7v.mjs "$OUT"
