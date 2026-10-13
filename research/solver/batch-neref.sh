#!/bin/bash
# NE-REF (PLAN.md NE-REF; predictions/diag-neref.md). The candidate's own unit (audit-neref.mjs: CAND solveCandidate, e3pcls
# on), four jobs on the tuning seed 7002: the ledger (S364 under RS at 4 wealth points, 1,000,000 draws a simulated chance,
# 40,000 flow paths a world), S364 under RS with readerRef 'order', S360 under BASE and RS (60 wealth points, 6 shares, 5
# return nodes, 4,000 paths a world). One process a job, four at once; each may run 10 hours. Launched only through
# run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-neref.md.
#   RESUMABLE (B1's batch): a relaunch keeps a job only when its log is complete - the stamp line names this code and the
#   last line is its done line - and re-runs every other job from the start (its file overwritten).
set -u
OUT=research/solver/results/diagneref
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
NJ=$(node research/solver/audit-neref.mjs --units | tail -1)
[ "$NJ" = 4 ] || { echo "NE-REF: audit-neref.mjs names $NJ jobs, not 4"; exit 1; }
TODO=""; KEPT=0
for i in $(seq 0 3); do
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done (L|RSO|BASE|RS)/P[0-9]+S6Q5$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "NE-REF: $KEPT jobs kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 4 -I{} sh -c \
  'timeout 36000 node research/solver/audit-neref.mjs 1 4000 part {}/4 7002 1000000 40000 > research/solver/results/diagneref/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "NE-REF runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-neref.mjs "$OUT" || echo "=== reduce-neref.mjs did not run to its reading inside the snapshot: reduce in the real tree"
