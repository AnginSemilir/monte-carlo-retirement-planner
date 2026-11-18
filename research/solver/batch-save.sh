#!/bin/bash
# THE SAVINGS SPLIT ON THE CANDIDATE (STATE.md D38 (4); research/solver/SAVINGS-SPLIT.md; EXPLORATORY, the tuning seed): CANDD and
# CANDS (the savings split on) on Phase 4's 27 households saving into a pension or ISA, at the estate weight 0.02 and 45 points,
# PATHS paths a unit (8,000 unless set), scored by the engine (audit-save.mjs), one unit a process, four at a time, read by
#   node research/solver/reduce-save.mjs research/solver/results/save-7002
# Launched on frozen code, after the maintainer has seen its budget, as
#   PREDICTION="none:EXPLORATORY, the savings split on the candidate (D38 (4))" research/solver/run-from-snapshot.sh bash research/solver/batch-save.sh
set -u
SEED=7002; PATHS=${PATHS:-4000}   # B7-FACTORIALS.md amendment 2: 4,000 paths (B7's queue size)
OUT=research/solver/results/save-$SEED
# A launch needs an empty folder; RESUME=1 (after a container restart) keeps a unit only when its log's stamp names this code
# and these files and the log holds the unit's done line, re-running every other unit.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-save.mjs'; console.log(stampFilesHash());")   # audit-save.mjs's STAMP_FILES (B7-FACTORIALS.md adds its rule and b7-verdict.mjs)
NU=$(node research/solver/audit-save.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"; { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE '^ +done ' "$f"; } || echo "$k"; done)
echo "The savings split on the candidate (EXPLORATORY): $NU units on seed $SEED, $PATHS paths (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "SAVE_OUT=$OUT research/solver/run-unit.sh node research/solver/audit-save.mjs $PATHS part {}/$NU $SEED > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "The savings split on the candidate (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
