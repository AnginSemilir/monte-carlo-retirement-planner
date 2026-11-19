#!/bin/bash
# THE WINDFALL SPLIT ON THE CANDIDATE (STATE.md D37; research/solver/WINDFALL-SPLIT.md; EXPLORATORY, the tuning seed): CANDD and
# CANDW (the windfall split on) on Phase 4's 17 households with a dated Auto deposit, at the estate weight 0.02 and 45 points,
# PATHS paths a unit (8,000 unless set), scored by the engine (audit-windfall.mjs), one unit a process, four at a time, read by
#   node research/solver/reduce-windfall.mjs research/solver/results/windfall-7002
# Launched on frozen code, after the maintainer has seen its budget, as
#   PREDICTION="none:EXPLORATORY, the windfall split on the candidate (D37)" research/solver/run-from-snapshot.sh bash research/solver/batch-windfall.sh
set -u
SEED=7002; PATHS=${PATHS:-4000}   # B7-FACTORIALS.md amendment 2: 4,000 paths (B7's queue size)
OUT=research/solver/results/windfall-$SEED
# A launch needs an empty folder; RESUME=1 (after a container restart) keeps a unit only when its log's stamp names this code
# and these files and the log holds the unit's done line, re-running every other unit.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-windfall.mjs'; console.log(stampFilesHash());")   # audit-windfall.mjs's STAMP_FILES (B7-FACTORIALS.md adds its rule and b7-verdict.mjs)
NU=$(node research/solver/audit-windfall.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"; { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE '^ +done ' "$f"; } || echo "$k"; done)
echo "The windfall split on the candidate (EXPLORATORY): $NU units on seed $SEED, $PATHS paths (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "WINDFALL_OUT=$OUT research/solver/run-unit.sh node research/solver/audit-windfall.mjs $PATHS part {}/$NU $SEED > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "The windfall split on the candidate (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
