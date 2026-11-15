#!/bin/bash
# A BETTER TIE RULE FOR COUPLES ABOVE THEIR ESTATE CAPS (TIE-C2.md; D105; EXPLORATORY, the search seed): audit-tie-c2.mjs's 12
# units (one a couple of the couples' re-run panel: the couples' candidate solved once, then run as it stands, with the hold,
# with the forward look and the hold, and with the first rule beside, each on the same 8,000 paths of seed 7001, and the
# replays); one unit a process, JOBS at a time (4 unless set), each at low priority and pausing for the gate (run-unit.sh);
# read by reduce-tie-c2.mjs. Launched on frozen code as
#   PREDICTION="none:EXPLORATORY: an improved tie rule for couples (TIE-C2.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-tie-c2.sh
set -u
SEED=7001
OUT=${TIEC2_OUT:-research/solver/results/tie-c2-$SEED}; export TIEC2_OUT="$OUT"
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code and
# these files and the log holds the unit's done line. TODO_ONLY=1 prints the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^case[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-tie-c2.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-tie-c2.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "TIE-C2 (EXPLORATORY): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-tie-c2.mjs part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "TIE-C2 (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
