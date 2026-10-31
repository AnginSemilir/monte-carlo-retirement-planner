#!/bin/bash
# NE-GRID C (PLAN.md NE-GRID-C; predictions/diag-negrid-c.md). The candidate's own unit (audit-negridc.mjs: CAND
# solveCandidate under BASE, LOR or ORDER, e3pcls on), twelve jobs at their registered wealth points, shares and return nodes,
# 4,000 paths a world of the tuning seed 7002 (P at 16,000 where registered), S224 once without its minimum end pot and
# S364 once at the support line 0.25 (the maintainer's amendment of 12 Oct). One process a job, four at once; each may run
# 10 hours. Launched only through run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-negrid-c.md.
#   RESUMABLE (B1's batch): a relaunch keeps a job only when its log is complete - the stamp line names this code and the
#   last line is its done line - and re-runs every other job from the start (its file overwritten).
set -u
OUT=research/solver/results/diagnegridc
mkdir -p "$OUT"
CODE=$(node research/solver/code-id.mjs)
NJ=$(node research/solver/audit-negridc.mjs --units | tail -1)
[ "$NJ" = 12 ] || { echo "NE-GRID C: audit-negridc.mjs names $NJ jobs, not 12"; exit 1; }
TODO=""; KEPT=0
for i in $(seq 0 11); do
  f="$OUT/case$i.txt"
  if [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE " && tail -1 "$f" | grep -Eq '^ +done (BASE|LOR|ORDER)/P[0-9]+S[0-9]+Q[0-9]+(F0)?(L[0-9]+)?$'; then
    KEPT=$((KEPT + 1))
  else TODO="$TODO $i"; fi
done
echo "NE-GRID C: $KEPT jobs kept from an earlier launch on code $CODE; running:$TODO"
printf '%s\n' $TODO | xargs -P 4 -I{} sh -c \
  'timeout 36000 node research/solver/audit-negridc.mjs 1 4000 part {}/12 7002 > research/solver/results/diagnegridc/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "NE-GRID C runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-negrid-c.mjs "$OUT" || echo "=== reduce-negrid-c.mjs did not run to its reading inside the snapshot: reduce in the real tree"
