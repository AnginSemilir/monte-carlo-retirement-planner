#!/bin/bash
# 7u: the research candidate (candidate.mjs solveCandidate, e3pcls on) against the shipping default (solvePlan, the
# product's settings), both on the candidate's plan (O60's blend-median tiers), on panel-7u.mjs's 55 households (7e's 25
# and the broad 30) at the estate weights 0.02 and 0.01, 8,000 paths of the held-out seed 7013, 30 points (PLAN.md 7u;
# items/7u.md; predictions/confirm-7u.md). Launched only through run-from-snapshot.sh with
# PREDICTION=research/solver/predictions/confirm-7u.md.
#   audit-7u.mjs: 220 units, one process a unit, the candidates first (the longest), four at a time; each may run 6 hours.
#   RESUMABLE (7aj's batch, after container restarts killed 7aj twice): a relaunch keeps a unit only when its log is
#   complete - the stamp line names this code (the code hash) and the last line is its done line - and re-runs every other
#   unit from the start (its trace overwritten). A unit is one process on fixed paths, so where it ran does not move a
#   figure; the reducer's gate still checks every unit's stamp and trace against the others.
set -u
OUT=research/solver/results/diag7u
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
NU=$(node research/solver/audit-7u.mjs --units | tail -1)
[ "$NU" = 220 ] || { echo "7u: audit-7u.mjs names $NU units, not 220"; exit 1; }
TODO=""; KEPT=0
for i in $(seq 0 219); do
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done [A-Z]+/[A-Z]+/W0\.0[12]$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "7u: $KEPT units kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 4 -I{} sh -c \
  'timeout 21600 node research/solver/audit-7u.mjs 30 8000 part {}/220 7013 > research/solver/results/diag7u/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7u runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7u.mjs "$OUT" || echo "=== reduce-7u.mjs did not run to its reading inside the snapshot: reduce in the real tree"
