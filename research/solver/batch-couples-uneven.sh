#!/bin/bash
# THE HOUSEHOLD ROUTE AT UNEVEN HOLDINGS (COUPLES-UNEVEN.md; EXPLORATORY, seed 7002): audit-couples-uneven.mjs's 28 units (S041's
# of the registered panel), one a process, every arm in it, JOBS at a time (4 unless set), each at low priority and pausing for
# the gate (run-unit.sh), through the launcher:
#   PREDICTION="none:the household route at uneven holdings, the deep review's one test (COUPLES-UNEVEN.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-couples-uneven.sh
# Read by reduce-couples-uneven.mjs.
set -u
export REG=1
OUT=${CU_OUT:-research/solver/results/couples-uneven-7002}
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code, these files,
# this prediction and its hash, and the log holds the unit's done line. TODO_ONLY=1 prints the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^case[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-couples-uneven.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-couples-uneven.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && [ "$(head -1 "$f")" = "stamp: code $CODE audit $AUDIT prediction ${PREDICTION_FILE:-NOT-LAUNCHED} sha ${PREDICTION_SHA:--}" ] && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "THE HOUSEHOLD ROUTE AT UNEVEN HOLDINGS (seed 7002, EXPLORATORY): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-couples-uneven.mjs run part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "THE HOUSEHOLD ROUTE AT UNEVEN HOLDINGS: runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
