#!/bin/bash
# ITEM 12 ON THE PORT, STAGE A: APPROXIMATE CUTS ON A COUPLE'S PATH (the review of 9 Nov, item 12; D84; ITEM12-A.md;
# EXPLORATORY, the tuning seed): audit-item12.mjs's 8 units (one a couple: each person solved once at 45 points, then the
# flat path on the whole menu and its two arms on 16,000 paired paths of seed 7002); one unit a process, JOBS at a time (4
# unless set), each at low priority and pausing for the gate (run-unit.sh); read by reduce-item12.mjs. Only on the scratch
# tree carrying the review's prototype of the joint options on the ported code, launched on frozen code as
#   PREDICTION="none:EXPLORATORY (D84): the review of 9 Nov, item 12, stage A on the port (ITEM12-A.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-item12.sh
set -u
SEED=7002
OUT=${ITEM12_OUT:-research/solver/results/item12-$SEED}; export ITEM12_OUT="$OUT"
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code and
# these files and the log holds the unit's done line. TODO_ONLY=1 prints the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^case[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-item12.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-item12.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "ITEM12-A (EXPLORATORY): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-item12.mjs part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "ITEM12-A (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
