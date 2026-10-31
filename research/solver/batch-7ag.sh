#!/bin/bash
# 7ag: the candidate bundle (the bridge reader with the joint tier state) against the shipping default (no bridge read, the
# product's tables) on the nine households of 7e's panel 7af did not run (PLAN.md 7ag; predictions/diag-7ag.md; the deep
# review after 7af, deep-review-log.md 29 Sep 03:07 UK). Launched only through run-from-snapshot.sh with
# PREDICTION=research/solver/predictions/diag-7ag.md.
#   audit-s126.mjs's diag7ag mode at the product's settings with the estate weight 0.02: 27 units - CAND (READER/TS+J), SHIP
#   (OFF/PRODUCT) and PRODR (READER/PRODUCT) on each of the nine - each one solve and one run on the same 16,000 paths of
#   the tuning seed 7002, traces kept; and unit 27, TS+J under off on S126 (OFF/TS+J), on 7af's 8,000 paths so it pairs
#   with 7af's S126 units (item 3). One process a unit, the candidates first (the longest), four at a time; each may run
#   5 hours.
set -u
OUT=research/solver/results/diag7ag
rm -rf "$OUT"; mkdir -p "$OUT"
{ seq 0 26 | sed 's/$/ 16000/'; echo "27 8000"; } | xargs -P 4 -L 1 sh -c \
  'timeout 18000 node research/solver/audit-s126.mjs diag7ag 30 $1 part $0/28 7002 > research/solver/results/diag7ag/case$0.txt 2>&1 || echo "unit $0 exited $?"'
echo "7ag runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7ag.mjs "$OUT"
