#!/bin/bash
# NE-GRID B1 (PLAN.md NE-GRID; predictions/diag-negrid-b1.md). The candidate's own unit (audit-negrid.mjs: CAND
# solveCandidate under BASE or LOR, e3pcls on) at the coarse grid (30 wealth points) and the fine (60), 4,000 paths a world
# of the tuning seed 7002 on the fine grid. Twelve jobs (audit-negrid.mjs JOBS, the fine grid's first), one process each,
# four at once; each may run 8 hours. Launched only through run-from-snapshot.sh with
# PREDICTION=research/solver/predictions/diag-negrid-b1.md.
#   RESUMABLE (stage A's batch): a relaunch keeps a job only when its log is complete - the stamp line names this code and
#   the last line is its done line - and re-runs every other job from the start (its file overwritten).
set -u
OUT=research/solver/results/diagnegrid
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
NJ=$(node research/solver/audit-negrid.mjs --units | tail -1)
[ "$NJ" = 12 ] || { echo "NE-GRID B1: audit-negrid.mjs names $NJ jobs, not 12"; exit 1; }
TODO=""; KEPT=0
for i in $(seq 0 11); do
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done (BASE|LOR)/P(30|60)$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "NE-GRID B1: $KEPT jobs kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 4 -I{} sh -c \
  'timeout 28800 node research/solver/audit-negrid.mjs 30 60 4000 part {}/12 7002 > research/solver/results/diagnegrid/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "NE-GRID B1 runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-negrid-b1.mjs "$OUT" || echo "=== reduce-negrid-b1.mjs did not run to its reading inside the snapshot: reduce in the real tree"
