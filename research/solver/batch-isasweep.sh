#!/bin/bash
# WHERE THE SWEEP PUTS CASH ISA MONEY (the review of 9 Nov, item 5, part 2, step 2; D66; ISA-SWEEP.md; EXPLORATORY, the tuning
# seed): audit-isasweep.mjs's thirteen households, each solved at 45 points with the sweep as now (GIA) and with the cash ISA
# money to the ISA (ISA), 4,000 paired paths of seed 7002; one household a process, JOBS at a time (4 unless set), each at low
# priority and pausing for the gate (run-unit.sh); read by reduce-isasweep.mjs. Launched on frozen code as
#   PREDICTION="none:EXPLORATORY (D66): the review of 9 Nov, item 5, the sweep's cash ISA money (ISA-SWEEP.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-isasweep.sh
set -u
SEED=7002
OUT=${ISASWEEP_OUT:-research/solver/results/isasweep-$SEED}; export ISASWEEP_OUT="$OUT"
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code and these
# files and the log holds the unit's done line. TODO_ONLY=1 prints the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-isasweep.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-isasweep.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "ISA-SWEEP (EXPLORATORY): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-isasweep.mjs part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "ISA-SWEEP (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
