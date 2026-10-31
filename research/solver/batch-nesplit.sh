#!/bin/bash
# NE-SPLIT: why the candidate's tables choose S364's opening (PLAN.md NE-SPLIT; predictions/diag-nesplit.md). The candidate's
# own unit (audit-nesplit.mjs: CAND solveCandidate, e3pcls on; SHIP solvePlan on the candidate's plan, the product's
# settings), 30 points, 8,000 paths and 2,000 a world of the tuning seed 7002; S364 at the estate weights 0.02 and 0.01,
# bridge 4 at 0.02 the control. Launched only through run-from-snapshot.sh with
# PREDICTION=research/solver/predictions/diag-nesplit.md.
#   Three units, one process a unit, all at once; each may run 6 hours. RESUMABLE (7u's batch): a relaunch keeps a unit
#   only when its log is complete - the stamp line names this code and the last line is its done line - and re-runs every
#   other unit from the start (its file overwritten).
set -u
OUT=research/solver/results/diagnesplit
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
NU=$(node research/solver/audit-nesplit.mjs --units | tail -1)
[ "$NU" = 3 ] || { echo "NE-SPLIT: audit-nesplit.mjs names $NU units, not 3"; exit 1; }
TODO=""; KEPT=0
for i in 0 1 2; do
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done NE/W0\.0[12]$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "NE-SPLIT: $KEPT units kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 3 -I{} sh -c \
  'timeout 21600 node research/solver/audit-nesplit.mjs 30 8000 2000 part {}/3 7002 > research/solver/results/diagnesplit/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "NE-SPLIT runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-nesplit.mjs "$OUT" || echo "=== reduce-nesplit.mjs did not run to its reading inside the snapshot: reduce in the real tree"
