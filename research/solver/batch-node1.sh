#!/bin/bash
# NODE-1 (PLAN.md NODE-1; predictions/diag-node1.md). The candidate's own unit (audit-node1.mjs: CAND solveCandidate, e3pcls
# on), two jobs on the tuning seed 7002: S360 under ORDER at 60 wealth points with the review's fifteen pension-share nodes
# (BN) and at six shares (BO), 5 return nodes, 4,000 paths a world; REF-2's BO read behind REF-2's gate. One process a job,
# both at once; each may run 10 hours. Launched only through run-from-snapshot.sh with
# PREDICTION=research/solver/predictions/diag-node1.md.
#   RESUMABLE (B1's batch): a relaunch keeps a job only when its log is complete - the stamp line names this code and the
#   last line is its done line - and re-runs every other job from the start (its file overwritten).
set -u
OUT=research/solver/results/diagnode1
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
NJ=$(node research/solver/audit-node1.mjs --units | tail -1)
[ "$NJ" = 2 ] || { echo "NODE-1: audit-node1.mjs names $NJ jobs, not 2"; exit 1; }
TODO=""; KEPT=0
for i in 0 1; do
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done (BN|BO)/P60S[0-9]+Q5$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "NODE-1: $KEPT jobs kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 2 -I{} sh -c \
  'timeout 36000 node research/solver/audit-node1.mjs 1 4000 part {}/2 7002 > research/solver/results/diagnode1/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "NODE-1 runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-node1.mjs "$OUT" || echo "=== reduce-node1.mjs did not run to its reading inside the snapshot: reduce in the real tree"
