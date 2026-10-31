#!/bin/bash
# NE-BLEND stage A (PLAN.md NE-BLEND; predictions/diag-neblend-a.md). The candidate's own unit (audit-neblend.mjs: CAND
# solveCandidate under RZ, LOR or BASE, e3pcls on), 30 points, 4,000 paths a world of the tuning seed 7002. Four jobs
# (audit-neblend.mjs JOBS), one process each, all at once; each may run 6 hours. Launched only through
# run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-neblend-a.md.
#   RESUMABLE (NE-ROOT's batch): a relaunch keeps a job only when its log is complete - the stamp line names this code and
#   the last line is its done line - and re-runs every other job from the start (its file overwritten).
set -u
OUT=research/solver/results/diagneblend
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
NJ=$(node research/solver/audit-neblend.mjs --units | tail -1)
[ "$NJ" = 4 ] || { echo "NE-BLEND A: audit-neblend.mjs names $NJ jobs, not 4"; exit 1; }
TODO=""; KEPT=0
for i in 0 1 2 3; do
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done (BASE|RZ|LOR)/W0\.02$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "NE-BLEND A: $KEPT jobs kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 4 -I{} sh -c \
  'timeout 21600 node research/solver/audit-neblend.mjs 30 4000 part {}/4 7002 > research/solver/results/diagneblend/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "NE-BLEND A runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-neblend-a.mjs "$OUT" || echo "=== reduce-neblend-a.mjs did not run to its reading inside the snapshot: reduce in the real tree"
