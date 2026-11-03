#!/bin/bash
# GAIN-BUCKET (the research queue's first, B7 in D51; D49; HARVEST-SIZING.md; EXPLORATORY, the tuning seed): CANDD and CANDGI
# (the gain axis interpolated) on Phase 4's households whose taxable account is 10% of wealth or more, at the estate weight
# 0.02, 4,000 paths a unit, 45 points, scored by the engine (audit-gainbucket.mjs), one unit (a household, both arms) a
# process, JOBS at a time (4 unless set), each at low priority and pausing for the gate (run-unit.sh), read by
# reduce-gainbucket.mjs. Launched on frozen code as
#   PREDICTION="none:EXPLORATORY measurement (D49, B7): GAIN-BUCKET" research/solver/run-from-snapshot.sh bash research/solver/batch-gainbucket.sh
set -u
SEED=7002
OUT=${GB_OUT:-research/solver/results/gainbucket-$SEED}; export GB_OUT="$OUT"
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code and these
# files and the log holds a done line for both arms (L4's lesson: every arm of a unit, levers-resume.test.mjs). TODO_ONLY=1
# prints the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-gainbucket.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-gainbucket.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"; keep=0
  [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && keep=1
  for a in CANDD CANDGI; do [ $keep = 1 ] && grep -qE "^ +done $a secs " "$f" || keep=0; done
  [ $keep = 1 ] || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "GAIN-BUCKET (EXPLORATORY): $NU units on seed $SEED (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-gainbucket.mjs 4000 part {}/$NU $SEED > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "GAIN-BUCKET (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
