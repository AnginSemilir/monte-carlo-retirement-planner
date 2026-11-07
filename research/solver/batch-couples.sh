#!/bin/bash
# PART D, D4 (registrations/couples-d4.md; PART-D.md D4): the candidate for couples against the app's rules and the couples'
# solver at the product's settings, once, on seed 7021, scored by the engine. Every unit of audit-couples.mjs
# (couples-panel.json's 40 couples: CANDC and SHIPC at both estate weights, APP), each couple on its registered paths
# (couples-paths.json), one unit a process, four at a time in the audit's order (CANDC, the longest, first). Launched only as
#   PREDICTION=research/solver/registrations/couples-d4.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples.sh
# and read once by research/solver/reduce-couples.mjs.
set -u
OUT=research/solver/results/d4-run
# A launch needs an empty folder. The harness stops a tracked task at 12 hours and the run needs longer: RESUME=1 relaunches
# it under the same registration (Phase 4's rule, batch-phase4.sh) and keeps a unit only when its log's stamp names this code
# and this audit and the log holds the unit's done line, re-running every other unit from the start. The read refuses any
# unit whose stamp is not the logs' one version.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "batch-couples: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(cd research/solver && cat audit-couples.mjs couple-panel.mjs select-phase4.mjs audit-phase4.mjs couples-orders.json couples-panel.json couples-paths.json reduce-couples.mjs | sha256sum | cut -c1-12)   # audit-couples.mjs's own stamp (its STAMP_FILES, in order)
NU=$(node research/solver/audit-couples.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"; { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE '^ +done ' "$f"; } || echo "$k"; done)
echo "D4: $NU units on seed 7021 (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P 4 -I{} sh -c \
  "D4_OUT=$OUT node research/solver/audit-couples.mjs registered part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "D4 runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
