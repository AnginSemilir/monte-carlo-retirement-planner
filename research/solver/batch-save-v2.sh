#!/bin/bash
# THE SAVINGS SPLIT'S v2 (SAVE-V2.md; registrations/save-v2.md, DRAFT; D130 (7), D133): audit-save-v2.mjs's households, one a
# process, all four arms in it, JOBS at a time (4 unless set), each at low priority and pausing for the gate (run-unit.sh).
# MODE registered (the default: seed 7025, save-v2-paths.json's paths, only under the registration through the launcher),
# pilot (seed 7002, 1,000 paths, the pilot's households; EXPLORATORY) or preflight (the households the pilot does not run,
# each through every check before any path at 45 points and two paths of the pilot's seed; EXPLORATORY, no outcome). Read by
# reduce-save-v2.mjs.
#   PREDICTION=research/solver/registrations/save-v2.md research/solver/run-from-snapshot.sh bash research/solver/batch-save-v2.sh
#   MODE=pilot bash research/solver/batch-save-v2.sh       (the pilot, run directly: the launcher refuses this batch under a
#                                                          measurement, its seed line naming the reserved 7025)
#   MODE=preflight bash research/solver/batch-save-v2.sh
set -u
MODE=${MODE:-registered}
# the registered run's seed, on a line the launcher's seed check reads (run-from-snapshot.sh): so a launch of this batch runs
# only under the registration that owns 7025 (check-prediction.mjs, once the maintainer's unlock has reserved it)
HELD_SEED=7025
case "$MODE" in registered) OUT=research/solver/results/save-v2-run; LIST="" ;; pilot) OUT=research/solver/results/save-v2-pilot; LIST=pilot ;; preflight) OUT=research/solver/results/save-v2-preflight; LIST=preflight ;; *) echo "$0: MODE registered, pilot or preflight"; exit 2 ;; esac
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a household only when its log's stamp names this code,
# these files, this prediction and its hash, and the log holds its done line (one not done resumes from its saved parts).
# TODO_ONLY=1 prints the stamp and the households to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^case[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-save-v2.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-save-v2.mjs --units $LIST | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && [ "$(head -1 "$f")" = "stamp: code $CODE audit $AUDIT prediction ${PREDICTION_FILE:-NOT-LAUNCHED} sha ${PREDICTION_SHA:--}" ] && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
case "$MODE" in pilot|preflight) ON="the pilot's seed, EXPLORATORY; the registered run's is $HELD_SEED" ;; *) ON="the registered seed $HELD_SEED" ;; esac
echo "THE SAVINGS SPLIT'S v2 ($MODE, $ON): $NU households (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-save-v2.mjs $MODE part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "THE SAVINGS SPLIT'S v2 ($MODE): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
