#!/bin/bash
# 7ab: is the freed opening as good as the joint tier state (TS+J) without its solve time? (PLAN.md 7ab;
# predictions/diag-7ab.md; the maintainer, 28 Sep 07:54 UK: "keep 7aa as is and queue that follow-up run".) Launched only
# through run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-7ab.md, after 7aa's batch has ended.
#   audit-s126.mjs's diag7ab mode: ten units - 7aa's PRODUCT unit again at the estate weight 0 and 0.02 on S126 (reader), S194
#   (off), bridge 4 (reader), S360 (reader) and S360 (off) - each one solve at the product's settings but the estate weight
#   and two runs forward on 8,000 paths of the tuning seed 7002: PRODUCT and FREED (the year-0 move at margin 0); traces
#   kept. One process a unit, four at a time; each may run 4 hours. The reducer reads 7aa's results beside them.
set -u
OUT=research/solver/results/diag7ab
rm -rf "$OUT"; mkdir -p "$OUT"
# the unit order in audit-s126.mjs's diag7ab: weight (0, 0.02) x case (S126-R, S194-O, bridge 4-R, S360-R, S360-O);
# index = 5 x weight + case
printf '%s\n' 0 1 2 3 4 5 6 7 8 9 | xargs -P 4 -I{} sh -c \
  'timeout 14400 node research/solver/audit-s126.mjs diag7ab 30 8000 part {}/10 7002 > research/solver/results/diag7ab/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7ab runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7ab.mjs "$OUT" research/solver/results/diag7aa
