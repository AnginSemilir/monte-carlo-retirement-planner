#!/bin/bash
# THE GUARD'S OWN UNITS (COUPLES-OPEN.md): audit-couples-open.mjs's units, one a process, both arms in it, JOBS at a time (4 unless
# set), each at low priority and pausing for the gate (run-unit.sh). MODE:
#   rehearsal   the dress rehearsal (EXPLORATORY, seed 7002, CO_N paths a unit, 4,000 unless set; step 1), its own panel:
#               PREDICTION="none:the guard's own units, a dress rehearsal (COUPLES-OPEN.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-couples-open.sh
#   pilot       the registered test's pilot (EXPLORATORY, seed 7002, 1,000 paths, every unit of the registered panel; run
#               directly, as step 8's was, its sizing by size-couples-open.mjs): MODE=pilot bash research/solver/batch-couples-open.sh
#   registered  the registered test (registrations/couples-open.md; step 2): seed HELD, couples-open-paths.json's paths, only under
#               the registration through the launcher:
#               MODE=registered PREDICTION=research/solver/registrations/couples-open.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples-open.sh
# Read by reduce-couples-open.mjs (the pilot and the registered read with REG=1).
set -u
MODE=${MODE:-rehearsal}
# the registered run's seed, on a line the launcher's seed check reads (run-from-snapshot.sh): so a launch of this batch runs
# only under the registration that owns 7026 (check-prediction.mjs, once the maintainer's unlock has reserved it)
HELD_SEED=7026
case "$MODE" in
  rehearsal) OUT=research/solver/results/couples-open-7002; unset REG ;;
  pilot) OUT=research/solver/results/couples-open-pilot; export REG=1 ;;
  registered) OUT=research/solver/results/couples-open-run; export REG=1 ;;
  *) echo "$0: MODE rehearsal, pilot or registered"; exit 2 ;;
esac
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
case "$MODE" in registered) ON="the registered seed $HELD_SEED" ;; *) ON="seed 7002, EXPLORATORY; the registered run's is $HELD_SEED" ;; esac
echo "THE GUARD'S OWN UNITS ($MODE, $ON): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-couples-open.mjs $MODE part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "THE GUARD'S OWN UNITS ($MODE): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
