#!/bin/bash
# THE SOLVER CHOOSING A COUPLE'S SHARE, STAGE A (SHARE-CHOOSE.md; D102, the maintainer's option 2; EXPLORATORY, the tuning
# seed): audit-share-choose.mjs's 14 units (one a couple of stage C's panel: APP, the couples' candidate at every share of the
# grid with the solver's own forecast at the start, two light solves' forecasts at each share, and the share by each person's
# means; each full solve at 45 points and run on the same 4,000 paths of seed 7002); one unit a process, JOBS at a time (4
# unless set), each at low priority and pausing for the gate (run-unit.sh); read by reduce-share-choose.mjs. Launched on
# frozen code as
#   PREDICTION="none:EXPLORATORY: the solver choosing a couple's share, stage A (SHARE-CHOOSE.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-share-choose.sh
set -u
SEED=7002
OUT=${SCHO_OUT:-research/solver/results/share-choose-$SEED}; export SCHO_OUT="$OUT"
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code and
# these files and the log holds the unit's done line. TODO_ONLY=1 prints the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^case[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-share-choose.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-share-choose.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "SHARE CHOOSE (EXPLORATORY): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-share-choose.mjs part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "SHARE CHOOSE (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
