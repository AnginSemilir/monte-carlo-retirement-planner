#!/bin/bash
# THE TIE-BREAK ABOVE THE ESTATE CAP AND ITEM 7'S SECOND READ, STAGE A (the review of 11 Nov, item 13; D76, D81; TIE-A.md;
# EXPLORATORY, the tuning seed): audit-tie.mjs's 12 units (one a household: the candidate solved once at 45 points, then its
# eight arms on 16,000 paired paths of seed 7002 and the replay); one unit a process, JOBS at a time (4 unless set), each at low
# priority and pausing for the gate (run-unit.sh); read by reduce-tie.mjs. Only on the scratch tree carrying the review's
# three prototypes on the ported code, launched on frozen code as
#   PREDICTION="none:EXPLORATORY (D76, D81): the review of 11 Nov, item 13, stage A (TIE-A.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-tie.sh
# MODE=remedy (with TIE_REMEDY_MARGIN=1e-4 or 1e-5; only where TIE-A.md's rule sends the run there): the remedy's units,
# beside the main ones in the same folder.
set -u
SEED=7002
MODE=${MODE:-main}
OUT=${TIE_OUT:-research/solver/results/tie-$SEED}; export TIE_OUT="$OUT"
case "$MODE" in main) PRE=case; ARG="";; remedy) PRE=remedy; ARG=" remedy";; *) echo "$0: MODE is main or remedy"; exit 2;; esac
# A launch needs an empty folder (the remedy: no remedy unit yet); RESUME=1 (after a restart) keeps a unit only when its
# log's stamp names this code and these files and the log holds the unit's done line. TODO_ONLY=1 prints the stamp and
# the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^$PRE[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds $MODE units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-tie.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-tie.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/$PRE$k.txt"
  { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "TIE-A (EXPLORATORY) $MODE: $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-tie.mjs part {}/$NU$ARG > $OUT/$PRE{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "TIE-A (EXPLORATORY) $MODE: runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
