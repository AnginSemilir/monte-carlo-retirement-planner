#!/bin/bash
# NE-EDGE (PLAN.md NE-EDGE; predictions/diag-needge.md). The candidate's own unit (audit-needge.mjs: CAND solveCandidate
# under BASE, RZ or RS, e3pcls on), seven jobs at 60 wealth points, 6 shares and 5 return nodes, 4,000 paths a world of the
# tuning seed 7002: S364 under BASE, RZ and RS; bridge 4 and S380 under RZ and RS. One process a job, four at once; each may run
# 10 hours. Launched only through run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-needge.md.
#   RESUMABLE (B1's batch): a relaunch keeps a job only when its log is complete - the stamp line names this code and the
#   last line is its done line - and re-runs every other job from the start (its file overwritten).
set -u
OUT=research/solver/results/diagneedge
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
NJ=$(node research/solver/audit-needge.mjs --units | tail -1)
[ "$NJ" = 7 ] || { echo "NE-EDGE: audit-needge.mjs names $NJ jobs, not 7"; exit 1; }
TODO=""; KEPT=0
for i in $(seq 0 6); do
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done (BASE|RZ|RS)/P[0-9]+S[0-9]+Q[0-9]+$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "NE-EDGE: $KEPT jobs kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 4 -I{} sh -c \
  'timeout 36000 node research/solver/audit-needge.mjs 1 4000 part {}/7 7002 > research/solver/results/diagneedge/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "NE-EDGE runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-needge.mjs "$OUT" || echo "=== reduce-needge.mjs did not run to its reading inside the snapshot: reduce in the real tree"
