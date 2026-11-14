#!/bin/bash
# ITEM 6'S STAGE C (registrations/couples-share.md; the review of 9 Nov, item 6 stage C): audit-couples-share.mjs's units, one
# a process, JOBS at a time (4 unless set), each at low priority and pausing for the gate (run-unit.sh). MODE registered (the
# default: seed 7022, couples-share-paths.json's paths, only under the registration through the launcher) or pilot (seed
# 7002, 1,000 paths, the pilot's units; EXPLORATORY). Read by reduce-couples-share.mjs.
#   PREDICTION=research/solver/registrations/couples-share.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples-share.sh
#   MODE=pilot PREDICTION="none:EXPLORATORY: item 6 stage C's pilot, sizing the registered run" research/solver/run-from-snapshot.sh bash research/solver/batch-couples-share.sh
set -u
MODE=${MODE:-registered}
# the registered run's seed, on a line the launcher's seed check reads (run-from-snapshot.sh; the design review of 13 Nov,
# MINOR 6): so a launch of this batch runs only under the registration that owns 7022 (check-prediction.mjs: couples-share*.md),
# and the pilot, done on 7002, is not launched through the launcher again
HELD_SEED=7022
case "$MODE" in registered) OUT=research/solver/results/share-c-run; LIST="" ;; pilot) OUT=research/solver/results/share-c-pilot; LIST=pilot ;; *) echo "$0: MODE registered or pilot"; exit 2 ;; esac
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code, these
# files, this prediction and its hash, its second line this Node, and the log holds the unit's done line. TODO_ONLY=1 prints
# the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^case[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-couples-share.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-couples-share.mjs --units $LIST | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && [ "$(head -1 "$f")" = "stamp: code $CODE audit $AUDIT prediction ${PREDICTION_FILE:-NOT-LAUNCHED} sha ${PREDICTION_SHA:--}" ] && sed -n 2p "$f" | grep -q "node $(node -v)$" && grep -qE "^ +done (CANDS|CANDH|APP) secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "ITEM 6 STAGE C ($MODE, the registered seed $HELD_SEED): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-couples-share.mjs $MODE part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "ITEM 6 STAGE C ($MODE): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
