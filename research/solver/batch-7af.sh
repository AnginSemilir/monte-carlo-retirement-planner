#!/bin/bash
# 7af: the candidate bundle (the bridge reader with the joint tier state) against the shipping default (no bridge read, the
# product's tables), on 16 households of 7e's panel (PLAN.md 7af; predictions/diag-7af.md; the deep review after 7ae,
# deep-review-log.md 28 Sep 22:52 UK; the maintainer's steer, 22:10 UK). Launched only through run-from-snapshot.sh with
# PREDICTION=research/solver/predictions/diag-7af.md.
#   audit-s126.mjs's diag7af mode at the product's settings with the estate weight 0.02: 46 units - CAND (READER/TS+J) and
#   SHIP (OFF/PRODUCT) on every household, PRODR (READER/PRODUCT) on the 14 with a bridge - each one solve and one run on the
#   same 8,000 paths of the tuning seed 7002, traces kept. One process a unit, the candidates first (the longest), four at a
#   time; each may run 5 hours.
set -u
OUT=research/solver/results/diag7af
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 45 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-s126.mjs diag7af 30 8000 part {}/46 7002 > research/solver/results/diag7af/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7af runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7af.mjs "$OUT"
