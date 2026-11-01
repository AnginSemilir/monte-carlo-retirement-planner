#!/bin/bash
# L5, ONE-OFF COSTS ON SINGLES (the launch plan's step L5, F3, M12's probe; EXPLORATORY, the tuning seed): the review's eight
# households, each with a cost of 10% or 30% of its opening wealth in its third or tenth retired year (32 cells), the
# candidate at position 1 against the app's rules on the same 3,000 paths, scored by the engine (audit-costs.mjs), one cell a
# process, JOBS at a time (4 unless set), each at low priority and pausing for the gate (run-unit.sh), read by
# reduce-costs.mjs under D52's R3. Launched on frozen code as
#   PREDICTION="none:EXPLORATORY, L5: one-off costs on singles (D51, D52 R3)" research/solver/run-from-snapshot.sh bash research/solver/batch-costs.sh
set -u
SEED=7002
OUT=research/solver/results/costs-$SEED
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(cd research/solver && cat audit-costs.mjs reduce-costs.mjs audit-curve.mjs audit-phase4.mjs phase4-panel.mjs select-phase4.mjs candidate.mjs candidate.json phase4-panel.json | sha256sum | cut -c1-12)   # audit-costs.mjs's STAMP_FILES, in order
NU=$(node research/solver/audit-costs.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"; { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE '^ +done ' "$f"; } || echo "$k"; done)
echo "L5, one-off costs (EXPLORATORY): $NU cells on seed $SEED (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-costs.mjs 3000 part {}/$NU $SEED > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "L5, one-off costs (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
