#!/bin/bash
# 7ad: the refinement check - is the bad world's price of the opening wrong for numerical reasons? (PLAN.md 7ad;
# predictions/diag-7ad.md; the deep review after 7ac, deep-review-log.md 28 Sep 14:47 UK; the maintainer, 28 Sep 15:01 UK.)
# Launched only through run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-7ad.md.
#   audit-s126.mjs's diag7ad mode at the product's settings but the estate weight ('auto' risk above, lambda held, margin
#   0.001), seven jobs, longest first: bridge 4 (reader, W0) and S194 (off, W0.02) at 30x15 and at 60x5 (wealth points x
#   return points), the same two at 30x5, and S126 (reader, W0) at 30x5, the control. Each job solves TS+J (7aa's TS+J unit)
#   and, but for the control, the product (7aa's PRODUCT unit) at its grid, prints the year-0 gap, the mixture's two year-0
#   moves and each world's like-for-like price of them (whole and survival), and runs TS+J and OPEN0 forward on 4,000 paths
#   of the tuning seed 7002 at world nodes (every world at 30x5, world 0 at the finer grids); traces kept. One process a job,
#   four at a time; each may run 5 hours.
set -u
OUT=research/solver/results/diag7ad
rm -rf "$OUT"; mkdir -p "$OUT"
printf '%s\n' 0 1 2 3 4 5 6 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-s126.mjs diag7ad 30 8000 part {}/7 7002 4000 > research/solver/results/diag7ad/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "7ad runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7ad.mjs "$OUT"
