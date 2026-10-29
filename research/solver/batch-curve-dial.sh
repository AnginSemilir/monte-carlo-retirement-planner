#!/bin/bash
# THE DISLIKE OF CUTS ON THE CANDIDATE (STATE.md D44; EXPLORATORY, the tuning seed): CANDD, DIAL3 and DIAL10 (lambda at one, three
# and ten times) on the review's eight households at the estate weight 0.02, 4,000 paths a unit, scored by the engine
# (audit-curve.mjs), one unit a process, four at a time, read by reduce-curve.mjs --dial. Launched on frozen code as
#   PREDICTION="none:EXPLORATORY, the dislike of cuts on the candidate (D44)" research/solver/run-from-snapshot.sh bash research/solver/batch-curve-dial.sh
set -u
SEED=7002; ARMS=CANDD,DIAL3,DIAL10
OUT=research/solver/results/curve-$SEED
# A launch needs an empty folder; RESUME=1 (after a container restart) keeps a unit only when its log's stamp names this code
# and these files and the log holds the unit's done line, re-running every other unit.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(cd research/solver && cat audit-curve.mjs reduce-curve.mjs audit-phase4.mjs phase4-panel.mjs select-phase4.mjs candidate.mjs candidate.json phase4-panel.json | sha256sum | cut -c1-12)   # audit-curve.mjs's STAMP_FILES, in order
NU=$(CURVE_ARMS=$ARMS node research/solver/audit-curve.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"; { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE '^ +done ' "$f"; } || echo "$k"; done)
echo "The spending curve, the dial (EXPLORATORY): $NU units of $ARMS on seed $SEED (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P 4 -I{} sh -c \
  "CURVE_ARMS=$ARMS CURVE_OUT=$OUT node research/solver/audit-curve.mjs 4000 part {}/$NU $SEED > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "The spending curve, the dial (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
