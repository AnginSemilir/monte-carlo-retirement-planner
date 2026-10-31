#!/bin/bash
# 7aj: the research candidate (candidate.mjs solveCandidate) against the shipping default (solvePlan, the product's
# settings), both on the candidate's plan (O60's blend-median tiers), at the estate weight 0.01, on 7e's 25 households
# (PLAN.md 7aj; predictions/diag-7aj.md). Launched only through run-from-snapshot.sh with
# PREDICTION=research/solver/predictions/diag-7aj.md.
#   audit-7aj.mjs: 50 units - CAND and SHIP on every household - each one solve and one run on the same 8,000 paths of the
#   tuning seed 7002, traces kept. One process a unit, the candidates first (the longest), four at a time; each may run 5 hours.
#   RESUMABLE (7 Oct): container restarts killed the run twice (about 02:00 and 03:00 UK), so a relaunch keeps a unit
#   only when its log is complete - the stamp line names this code (the code hash) and the last line is its done line -
#   and re-runs every other unit from the start (its trace overwritten). A unit is one process on fixed paths, so where
#   it ran does not move a figure; the reducer's gate still checks every unit's stamp and trace against the others.
set -u
OUT=research/solver/results/diag7aj
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
TODO=""; KEPT=0
for i in $(seq 0 49); do
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done [A-Z]+/[A-Z]+/W0\.01$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "7aj: $KEPT units kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-7aj.mjs 30 8000 part {}/50 7002 > research/solver/results/diag7aj/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7aj runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7aj.mjs "$OUT" || echo "=== reduce-7aj.mjs did not run to its reading inside the snapshot: reduce in the real tree"
