#!/bin/bash
# TIE-C2'S SPEED EXCEPTION, TIMED CLEANLY (TIE-C2-TIMING.md; D108; EXPLORATORY, the search seed): audit-tie-c2-timing.mjs's 12
# units (one a couple of TIE-C2's: its tables solved once and stored, then four fresh timing processes alternating the
# candidate and LOOKHOLD on the same 500 paths of seed 7001); one unit a process, JOBS at a time (1 unless set: a quiet
# machine), each at low priority and pausing for the gate (run-unit.sh); read by reduce-tie-c2-timing.mjs. Launched on frozen
# code, after the share rules' registered run, as
#   JOBS=1 PREDICTION="none:EXPLORATORY: TIE-C2's speed exception timed cleanly (TIE-C2-TIMING.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-tie-c2-timing.sh
set -u
SEED=7001
OUT=${TIEC2T_OUT:-research/solver/results/tie-c2-timing-$SEED}; export TIEC2T_OUT="$OUT"
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code and
# these files and the log holds the unit's done line. TODO_ONLY=1 prints the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^case[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-tie-c2-timing.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-tie-c2-timing.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "TIE-C2'S TIMING (EXPLORATORY): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-1} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-1}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-tie-c2-timing.mjs part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "TIE-C2'S TIMING (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
