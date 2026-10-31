#!/bin/bash
# REF-2 (PLAN.md REF-2; predictions/diag-ref2.md). The candidate's own unit (audit-ref2.mjs: CAND solveCandidate, e3pcls on),
# five jobs on the tuning seed 7002: the ledger at S360's year-1 states (4 wealth points, 1,000,000 draws a simulated chance,
# the cash sweep beside the own pots, 40,000 flow paths a world), S360 under BO and RSO, the 95% share household under BASE
# and BO (60 wealth points, 6 shares, 5 return nodes, 4,000 paths a world); REF-2's S360 BASE and RS read behind REF-2's
# gate. One process a job, four at once; each may run 10 hours. Launched only through run-from-snapshot.sh with
# PREDICTION=research/solver/predictions/diag-ref2.md.
#   RESUMABLE (B1's batch): a relaunch keeps a job only when its log is complete - the stamp line names this code and the
#   last line is its done line - and re-runs every other job from the start (its file overwritten).
set -u
OUT=research/solver/results/diagref2
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
NJ=$(node research/solver/audit-ref2.mjs --units | tail -1)
[ "$NJ" = 5 ] || { echo "REF-2: audit-ref2.mjs names $NJ jobs, not 5"; exit 1; }
TODO=""; KEPT=0
for i in $(seq 0 4); do
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done (L|BO|RSO|BASE)/P[0-9]+S6Q5$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "REF-2: $KEPT jobs kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 4 -I{} sh -c \
  'timeout 36000 node research/solver/audit-ref2.mjs 1 4000 part {}/5 7002 1000000 40000 > research/solver/results/diagref2/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "REF-2 runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-ref2.mjs "$OUT" || echo "=== reduce-ref2.mjs did not run to its reading inside the snapshot: reduce in the real tree"
