#!/bin/bash
# THE TIER TEST (STATE.md D39; EXPLORATORY, seed 7002): APP, SHIP and SHIPNC, CAND and CANDNC on Phase 4's 40 households at
# the estate weight 0.02, 8,000 paths each, scored by the engine (audit-tiers.mjs), one unit a process, four at a time, the
# longest first. Launched on frozen code as
#   PREDICTION="none:EXPLORATORY, the tier test (D39)" research/solver/run-from-snapshot.sh bash research/solver/batch-tiers.sh
# and read by research/solver/reduce-tiers.mjs.
set -u
OUT=research/solver/results/tiers
# A launch needs an empty folder; RESUME=1 (after a container restart or the harness's 12-hour stop) keeps a unit only when
# its log's stamp names this code and these files and the log holds the unit's done line, re-running every other unit.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "batch-tiers: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(cd research/solver && cat audit-tiers.mjs reduce-tiers.mjs audit-phase4.mjs phase4-panel.mjs select-phase4.mjs candidate.mjs phase4-panel.json | sha256sum | cut -c1-12)   # audit-tiers.mjs's STAMP_FILES, in order
NU=$(node research/solver/audit-tiers.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"; { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE '^ +done ' "$f"; } || echo "$k"; done)
echo "The tier test: $NU units on seed 7002 (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P 4 -I{} sh -c \
  "TT_OUT=$OUT node research/solver/audit-tiers.mjs 8000 part {}/$NU 7002 > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "The tier test runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
