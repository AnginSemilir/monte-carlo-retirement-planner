#!/bin/bash
# THE GUARD'S OWN UNITS, THE DRESS REHEARSAL (COUPLES-OPEN.md step 1; EXPLORATORY, the tuning seed 7002): audit-couples-open.mjs's
# units, one a process, both arms in it, JOBS at a time (4 unless set), each at low priority and pausing for the gate
# (run-unit.sh). Read by reduce-couples-open.mjs.
#   PREDICTION="none:the guard's own units, a dress rehearsal (COUPLES-OPEN.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-couples-open.sh
#   CO_N the paths a unit (4,000 unless set)
set -u
OUT=research/solver/results/couples-open-7002
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code, these
# files, this prediction and its hash, and the log holds the unit's done line (a unit not done resumes from its saved parts).
# TODO_ONLY=1 prints the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^case[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-couples-open.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-couples-open.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && [ "$(head -1 "$f")" = "stamp: code $CODE audit $AUDIT prediction ${PREDICTION_FILE:-NOT-LAUNCHED} sha ${PREDICTION_SHA:--}" ] && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "THE GUARD'S OWN UNITS (the dress rehearsal, seed 7002, EXPLORATORY): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-couples-open.mjs rehearsal part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "THE GUARD'S OWN UNITS: runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
