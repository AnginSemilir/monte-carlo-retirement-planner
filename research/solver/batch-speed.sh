#!/bin/bash
# THE CHOOSER'S SHORTLIST AND THE SOLVE ON ANCHORS, STAGE A (the review of 9 Nov, items 7 and 10; D66, D68; SPEED-A.md;
# EXPLORATORY, the tuning seed): audit-speed.mjs's 36 units (three a household: A, R, B), each at 45 points, 16,000 paired paths
# of seed 7002; one unit a process, JOBS at a time (4 unless set), each at low priority and pausing for the gate (run-unit.sh);
# read by reduce-speed.mjs. Only on the scratch tree carrying the review's two prototypes, launched on frozen code as
#   PREDICTION="none:EXPLORATORY (D66, D68): the review of 9 Nov, items 7 and 10, stage A (SPEED-A.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-speed.sh
set -u
SEED=7002
OUT=${SPEED_OUT:-research/solver/results/speed-$SEED}; export SPEED_OUT="$OUT"
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code and these
# files and the log holds the unit's done line. TODO_ONLY=1 prints the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-speed.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-speed.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "SPEED-A (EXPLORATORY): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-speed.mjs part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "SPEED-A (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
