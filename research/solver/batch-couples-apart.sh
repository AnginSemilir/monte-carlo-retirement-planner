#!/bin/bash
# COUPLES FOUR AND FIVE RISK LEVELS APART (COUPLES-APART.md, D154 (5); EXPLORATORY, seed 7002): the dress rehearsal's audit
# (audit-couples-any.mjs, its rehearsal mode) on its own panel (APART=1, couples-apart-panel.json), one unit a process, both
# arms in it, JOBS at a time (4 unless set), each at low priority and pausing for the gate (run-unit.sh), into
# results/couples-apart-7002, through the launcher:
#   PREDICTION="none:couples four and five risk levels apart (COUPLES-APART.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-couples-apart.sh
# Read once by reduce-couples-any.mjs with APART=1. Its own script, as batch-couples-any.sh was before its registered mode:
# that script names the registered test's held-out seed, which the launcher's seed registry refuses under a measurement.
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code, these
# files, this prediction and its hash, and the log holds the unit's done line. TODO_ONLY=1 prints the stamp and the units.
set -u
export APART=1
OUT=research/solver/results/couples-apart-7002
export CA_OUT="$PWD/$OUT"
unset REG
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^case[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-couples-any.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-couples-any.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && [ "$(head -1 "$f")" = "stamp: code $CODE audit $AUDIT prediction ${PREDICTION_FILE:-NOT-LAUNCHED} sha ${PREDICTION_SHA:--}" ] && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "COUPLES FOUR AND FIVE RISK LEVELS APART (EXPLORATORY, seed 7002): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-couples-any.mjs rehearsal part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "COUPLES FOUR AND FIVE RISK LEVELS APART: runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
