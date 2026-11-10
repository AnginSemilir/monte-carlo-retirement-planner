#!/bin/bash
# COUPLES WHO HOLD THEIR MONEY UNEVENLY, STAGE A (the review of 9 Nov, item 6; D66; SHARE-A.md; EXPLORATORY, the tuning seed):
# audit-share.mjs's units, the review's own run reproduced first (unit 0: S091 at 90/10, 300 paths of seed 4242), then six
# couples at five holdings under both share rules, 500 paths of seed 7002 a unit, 45 points; one unit a process, JOBS at a
# time (4 unless set), each at low priority and pausing for the gate (run-unit.sh); read by reduce-share.mjs. Launched on
# frozen code as
#   PREDICTION="none:EXPLORATORY (D66): the review of 9 Nov, item 6, stage A" research/solver/run-from-snapshot.sh bash research/solver/batch-share.sh
set -u
SEED=7002
OUT=${SHARE_OUT:-research/solver/results/share-$SEED}; export SHARE_OUT="$OUT"
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code and these
# files and the log holds the unit's done line. TODO_ONLY=1 prints the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-share.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-share.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "SHARE-A (EXPLORATORY): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-share.mjs part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "SHARE-A (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
