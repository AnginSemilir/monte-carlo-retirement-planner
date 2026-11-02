#!/bin/bash
# L4, THE DIAL'S POSITIONS IN BOTH VARIANTS (the launch plan's step L4, B3, D54; EXPLORATORY, the tuning seed): CANDD and the
# positions 3, 6 and 10 under B3a (A3, A6, A10) and B3b (B3, B6, B10) on the review's eight households at the estate weight
# 0.02, 4,000 paths a unit, 45 points, scored by the engine (audit-levers.mjs), one unit (a household and a variant) a
# process, JOBS at a time (4 unless set), each at low priority and pausing for the gate (run-unit.sh), read by
# reduce-levers.mjs under D52's R1 and R2. Launched on frozen code as
#   PREDICTION="none:EXPLORATORY, L4: the dial's positions in both variants (D51 B3, D52 R1 R2)" research/solver/run-from-snapshot.sh bash research/solver/batch-levers.sh
set -u
SEED=7002
OUT=research/solver/results/levers-$SEED
# A launch needs an empty folder; RESUME=1 (after a container restart) keeps a unit only when its log's stamp names this code
# and these files and the log holds the unit's last done line, re-running every other unit.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(cd research/solver && cat audit-levers.mjs reduce-levers.mjs audit-curve.mjs reduce-curve.mjs audit-phase4.mjs phase4-panel.mjs select-phase4.mjs candidate.mjs candidate.json phase4-panel.json | sha256sum | cut -c1-12)   # audit-levers.mjs's STAMP_FILES, in order
NU=$(node research/solver/audit-levers.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"; { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && [ "$(grep -cE '^ +done ' "$f")" -ge 3 ]; } || echo "$k"; done)
echo "L4, the dial's positions (EXPLORATORY): $NU units on seed $SEED (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-levers.mjs 4000 part {}/$NU $SEED > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "L4, the dial's positions (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
