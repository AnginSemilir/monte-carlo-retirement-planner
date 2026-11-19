#!/bin/bash
# WHAT KEYS THE GUARD (GUARD-KEY.md; D129 (4); EXPLORATORY, the tuning seed): audit-guard.mjs's units (guard-panel.json:
# step 5's four couples 8 or 12 years apart without a DB pension, each with S147-db's DB pension or with rent), each run on
# the same 4,000 paths of seed 7002 under APP (the app's rules) and K2 (today's couples' default); one unit a process, JOBS
# at a time (4 unless set), each at low priority and pausing for the gate (run-unit.sh); read by reduce-guard.mjs. Launched
# on frozen code as
#   PREDICTION="none:EXPLORATORY: what keys the guard (GUARD-KEY.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-guard.sh
set -u
SEED=7002
OUT=${GD_OUT:-research/solver/results/guard-$SEED}; export GD_OUT="$OUT"
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code and
# these files and the log holds the unit's done line (a unit not done resumes from its saved parts). TODO_ONLY=1 prints the
# stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^case[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-guard.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-guard.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "GUARD (EXPLORATORY): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-guard.mjs part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "GUARD (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
