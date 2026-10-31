#!/bin/bash
# 7ac: the fourth cell - does TS+J price the opening right? (PLAN.md 7ac; predictions/diag-7ac.md; the deep review after 7aa,
# deep-review-log.md 28 Sep 11:44 UK; the maintainer, 28 Sep 11:59 UK.) Launched only through run-from-snapshot.sh with
# PREDICTION=research/solver/predictions/diag-7ac.md.
#   audit-s126.mjs's diag7ac mode at the product's settings but the estate weight (30 points, 'auto' risk above, lambda held,
#   5 return points, margin 0.001), with the tier state and one move for every world (7aa's TS+J): four units - S126 (reader)
#   at W0 and W0.02, bridge 4 (reader) at W0, S194 (off) at W0.02 - each one solve, three world lines on 1,000 paths (both
#   arms in each world) and two runs forward on 8,000 paths of the tuning seed 7002: TS+J (reduce-7ac.mjs requires its trace
#   to be 7aa's) and OPEN0 (the year-0 move held in the plan's tier); traces kept. One process a unit, four at a time; each
#   may run 4 hours.
set -u
OUT=research/solver/results/diag7ac
rm -rf "$OUT"; mkdir -p "$OUT"
printf '%s\n' 0 1 2 3 | xargs -P 4 -I{} sh -c \
  'timeout 14400 node research/solver/audit-s126.mjs diag7ac 30 8000 part {}/4 7002 1000 > research/solver/results/diag7ac/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7ac runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7ac.mjs "$OUT"
