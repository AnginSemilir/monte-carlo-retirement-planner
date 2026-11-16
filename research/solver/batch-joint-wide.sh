#!/bin/bash
# A WIDER JOINT MOVE FOR COUPLES (JOINT-WIDE.md; D111 (2); EXPLORATORY, the tuning seed): audit-joint-wide.mjs's 28 units (one
# a couple: TIE-C2's twelve and the share rules' 90/10 and feature units, each solved once on the couples' default and run with
# each person's top two, four and six moves on the same 4,000 paths of seed 7002, and the replays); one unit a process, JOBS at
# a time (4 unless set), the longest horizons first, each at low priority and pausing for the gate (run-unit.sh); read by
# reduce-joint-wide.mjs. Launched on frozen code as
#   PREDICTION="none:EXPLORATORY: a wider joint move for couples (JOINT-WIDE.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-joint-wide.sh
set -u
SEED=7002
OUT=${JW_OUT:-research/solver/results/joint-wide-$SEED}; export JW_OUT="$OUT"
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code and
# these files and the log holds the unit's done line. TODO_ONLY=1 prints the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^case[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-joint-wide.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-joint-wide.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "JOINT-WIDE (EXPLORATORY): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-joint-wide.mjs part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "JOINT-WIDE (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
