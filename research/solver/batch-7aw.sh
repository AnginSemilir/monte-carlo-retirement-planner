#!/bin/bash
# 7aw: 7aj's design at the estate weight 0.02 - the research candidate (candidate.mjs solveCandidate) against the shipping
# default (solvePlan, the product's settings), both on the candidate's plan (O60's blend-median tiers), on 7e's 25
# households (PLAN.md 7aw; predictions/diag-7aw.md; the maintainer, 7 Oct 13:22 UK). Launched only through
# run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-7aw.md.
#   audit-7aw.mjs: 50 units - CAND and SHIP on every household - each one solve and one run on the same 8,000 paths of the
#   tuning seed 7002, traces kept. One process a unit, the candidates first (the longest), four at a time; each may run 5 hours.
#   RESUMABLE (7aj's batch, after container restarts killed 7aj twice): a relaunch keeps a unit
#   only when its log is complete - the stamp line names this code (the code hash) and the last line is its done line -
#   and re-runs every other unit from the start (its trace overwritten). A unit is one process on fixed paths, so where
#   it ran does not move a figure; the reducer's gate still checks every unit's stamp and trace against the others.
set -u
OUT=research/solver/results/diag7aw
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
TODO=""; KEPT=0
for i in $(seq 0 49); do
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done [A-Z]+/[A-Z]+/W0\.02$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "7aw: $KEPT units kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-7aw.mjs 30 8000 part {}/50 7002 > research/solver/results/diag7aw/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7aw runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7aw.mjs "$OUT" || echo "=== reduce-7aw.mjs did not run to its reading inside the snapshot: reduce in the real tree"
