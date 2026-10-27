#!/bin/bash
# PHASE 4 (registrations/phase-4.md; STATE.md D33 to D35): the candidate against the app's rules and the shipping solver,
# once, on seed 7003, scored by the engine. Every unit of audit-phase4.mjs (phase4-panel.json's 40 households: CAND and SHIP
# at both estate weights, APP), each household on its registered paths (phase4-paths.json), one unit a process, four at a
# time in the audit's order (CAND, the longest, first). Launched only as
#   PREDICTION=research/solver/registrations/phase-4.md research/solver/run-from-snapshot.sh bash research/solver/batch-phase4.sh
# and read once by research/solver/reduce-phase4.mjs.
set -u
OUT=research/solver/results/diagp4
# A launch needs an empty folder. The harness stops a tracked task at 12 hours and Phase 4 needs longer: RESUME=1 relaunches
# it under the same registration (7u-F's rule, batch-7uf.sh) and keeps a unit only when its log's stamp names this code and
# this audit and the log holds the unit's done line (the audit writes the unit's file just before it), re-running every other
# unit from the start. The read refuses any unit whose stamp is not the logs' one version.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "batch-phase4: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(cd research/solver && cat audit-phase4.mjs phase4-panel.mjs select-phase4.mjs candidate.mjs audit-7uf-checks.mjs size-phase4.mjs phase4-orders.json phase4-panel.json phase4-paths.json reduce-phase4.mjs | sha256sum | cut -c1-12)   # audit-phase4.mjs's own stamp (its STAMP_FILES, in order)
NU=$(node research/solver/audit-phase4.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"; { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE '^ +done ' "$f"; } || echo "$k"; done)
echo "Phase 4: $NU units on seed 7003 (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P 4 -I{} sh -c \
  "P4_OUT=$OUT node research/solver/audit-phase4.mjs registered part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "Phase 4 runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
