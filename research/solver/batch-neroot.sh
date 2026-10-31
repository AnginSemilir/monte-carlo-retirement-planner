#!/bin/bash
# NE-ROOT: why the candidate's S364 survival read is a plateau (PLAN.md NE-ROOT; predictions/diag-neroot.md). The candidate's
# own unit (audit-neroot.mjs: CAND solveCandidate under four arms, e3pcls on; SHIP solvePlan for the openings), 30 points,
# 4,000 paths a world of the tuning seed 7002. Eleven jobs (audit-neroot.mjs JOBS), one process each, four at once; each
# may run 6 hours. Launched only through run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-neroot.md.
#   RESUMABLE (NE-SPLIT's batch): a relaunch keeps a job only when its log is complete - the stamp line names this code and
#   the last line is its done line - and re-runs every other job from the start (its file overwritten).
set -u
OUT=research/solver/results/diagneroot
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
NJ=$(node research/solver/audit-neroot.mjs --units | tail -1)
[ "$NJ" = 11 ] || { echo "NE-ROOT: audit-neroot.mjs names $NJ jobs, not 11"; exit 1; }
TODO=""; KEPT=0
for i in 4 5 6 7 9 10 0 1 2 3 8; do   # the long jobs first (bridge 4, S224, S380: their paths live long)
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done (BASE|R0|SIMP|READEROFF)/W0\.0[12]$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "NE-ROOT: $KEPT jobs kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 4 -I{} sh -c \
  'timeout 21600 node research/solver/audit-neroot.mjs 30 4000 part {}/11 7002 > research/solver/results/diagneroot/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "NE-ROOT runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-neroot.mjs "$OUT" || echo "=== reduce-neroot.mjs did not run to its reading inside the snapshot: reduce in the real tree"
