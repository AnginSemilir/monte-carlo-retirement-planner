#!/bin/bash
# 7ae: the bad node at margin 0 - does the per-year switch margin make the tables price the bad world's de-risk below what it
# realises? (PLAN.md 7ae; predictions/diag-7ae.md; the deep review after 7ad, deep-review-log.md 28 Sep 19:09 UK; the
# maintainer's go-ahead.) Launched only through run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-7ae.md.
#   audit-s126.mjs's diag7ae mode at the product's settings but the estate weight ('auto' risk above, lambda held), 30x5,
#   three jobs: bridge 4 (reader, W0), S194 (off, W0.02), S126 (reader, W0). Each job solves TS+J (7aa's TS+J unit) at the
#   product's margin 0.001 and at switchMargin 0 (the switch cost kept), prints the year-0 gap, the mixture's two year-0
#   moves and each world's like-for-like price of them, and at each margin runs TS+J and OPEN0 forward on 8,000 paths of the
#   tuning seed 7002 at world 0's node (the first 4,000 7ad's), with the forward-against-cell decision log; traces kept. One
#   process a job, three at a time; each may run 5 hours.
set -u
OUT=research/solver/results/diag7ae
rm -rf "$OUT"; mkdir -p "$OUT"
printf '%s\n' 0 1 2 | xargs -P 3 -I{} sh -c \
  'timeout 18000 node research/solver/audit-s126.mjs diag7ae 30 8000 part {}/3 7002 8000 > research/solver/results/diag7ae/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "7ae runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7ae.mjs "$OUT"
