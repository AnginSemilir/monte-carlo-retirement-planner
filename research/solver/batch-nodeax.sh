#!/bin/bash
# NODE-AX (PLAN.md NODE-AX; predictions/diag-nodeax.md; re-cut on the escalation review's design,
# escalations/14-Oct-bridge-under-read-report.md section 4.2). The candidate's own unit (audit-nodeax.mjs: CAND
# solveCandidate, e3pcls on), two jobs on the tuning seed 7002, NODE-1's: S360 under ORDER at 60 wealth points with the
# fifteen pension-share nodes (BN) and at six shares (BO), 5 return nodes, 4,000 paths a world (NODE-1's paths); the
# per-path ledger X, B0, T, GB, GA, GL and one sum a bridge year, the bridge years' tables saved; NODE-1's tables and
# runs read behind NODE-1's gate. One process a job, both at once; each may run 10 hours. Launched only through
# run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-nodeax.md.
#   RESUMABLE (B1's batch): a relaunch keeps a job only when its log is complete - the stamp line names this code and the
#   last line is its done line - and re-runs every other job from the start (its file overwritten).
set -u
OUT=research/solver/results/diagnodeax
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
NJ=$(node research/solver/audit-nodeax.mjs --units | tail -1)
[ "$NJ" = 2 ] || { echo "NODE-AX: audit-nodeax.mjs names $NJ jobs, not 2"; exit 1; }
TODO=""; KEPT=0
for i in 0 1; do
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done (BN|BO)/P60S[0-9]+Q5$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "NODE-AX: $KEPT jobs kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 2 -I{} sh -c \
  'timeout 36000 node research/solver/audit-nodeax.mjs 1 4000 part {}/2 7002 > research/solver/results/diagnodeax/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "NODE-AX runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-nodeax.mjs "$OUT" || echo "=== reduce-nodeax.mjs did not run to its reading inside the snapshot: reduce in the real tree"
