#!/bin/bash
# 7aj: the research candidate (candidate.mjs solveCandidate) against the shipping default (solvePlan, the product's
# settings), both on the candidate's plan (O60's blend-median tiers), at the estate weight 0.01, on 7e's 25 households
# (PLAN.md 7aj; predictions/diag-7aj.md). Launched only through run-from-snapshot.sh with
# PREDICTION=research/solver/predictions/diag-7aj.md.
#   audit-7aj.mjs: 50 units - CAND and SHIP on every household - each one solve and one run on the same 8,000 paths of the
#   tuning seed 7002, traces kept. One process a unit, the candidates first (the longest), four at a time; each may run 5 hours.
set -u
OUT=research/solver/results/diag7aj
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 49 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-7aj.mjs 30 8000 part {}/50 7002 > research/solver/results/diag7aj/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7aj runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7aj.mjs "$OUT" || echo "=== reduce-7aj.mjs did not run to its reading inside the snapshot: reduce in the real tree"
