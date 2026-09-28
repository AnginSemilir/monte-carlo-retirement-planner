#!/bin/bash
# 7aa: does the joint tier state (tierState with jointWorlds) gain where the per-world tier state did not, with the pot's
# weight off (0) and on (0.02)? (PLAN.md 7aa; predictions/diag-7aa.md; the maintainer's go-ahead, 28 Sep; the deep review on
# both reads, 02:38 UK.) Launched only through run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-7aa.md.
#   audit-s126.mjs's diag7aa mode at the product's settings but the estate weight (30 points, 'auto' risk above, lambda held,
#   5 return points, margin 0.001): thirty units - PRODUCT, TS and TS+J at the estate weight 0 and 0.02 on S126 (reader),
#   S194 (off), bridge 4 (reader), S360 (reader) and S360 (off) - each one solve, three world lines on 1,000 paths and one run
#   forward on 8,000 paths of the tuning seed 7002; traces kept. One process a unit, four at a time, the longest first (the
#   tier-state units, then the joint ones, then the product's); each may run 4 hours.
set -u
OUT=research/solver/results/diag7aa
rm -rf "$OUT"; mkdir -p "$OUT"
# the unit order in audit-s126.mjs's diag7aa: weight (0, 0.02) x case (S126-R, S194-O, bridge 4-R, S360-R, S360-O) x arm
# (PRODUCT, TS, TS+J); index = 15 x weight + 3 x case + arm
printf '%s\n' 1 4 7 10 13 16 19 22 25 28 2 5 8 11 14 17 20 23 26 29 0 3 6 9 12 15 18 21 24 27 | xargs -P 4 -I{} sh -c \
  'timeout 14400 node research/solver/audit-s126.mjs diag7aa 30 8000 part {}/30 7002 1000 > research/solver/results/diag7aa/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7aa runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7aa.mjs "$OUT"
