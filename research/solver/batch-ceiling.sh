#!/bin/bash
# THE HARVEST CEILING ON THE YEAR'S WHOLE TAXABLE INCOME, STEP 4 (ANSWERS.md section 5; D91, D93; HARVEST-CEILING.md;
# EXPLORATORY, the tuning seed): audit-ceiling.mjs's 8 units (one a household: solved at 45 points by the tree before the ceiling and by this one, each
# solved plan run on the same 16,000 paths of seed 7002 by its own engine); one unit a process, JOBS at a time (4
# unless set), each at low priority and pausing for the gate (run-unit.sh); read by reduce-ceiling.mjs. On the working
# branch's own code, launched on frozen code as
#   CEILING_BEFORE=<a worktree at the commit before the ceiling> PREDICTION="none:EXPLORATORY (D91, D93): the harvest ceiling on the whole taxable income, the review's eight solved before and after (HARVEST-CEILING.md)" research/solver/run-from-snapshot.sh bash research/solver/batch-ceiling.sh
set -u
[ -n "${CEILING_BEFORE:-}" ] && [ -f "$CEILING_BEFORE/research/engine.mjs" ] || { echo "$0: CEILING_BEFORE=<a worktree at the commit before the ceiling, its engine built>"; exit 2; }; export CEILING_BEFORE
SEED=7002
OUT=${CEILING_OUT:-research/solver/results/ceiling-$SEED}; export CEILING_OUT="$OUT"
# A launch needs an empty folder; RESUME=1 (after a restart) keeps a unit only when its log's stamp names this code and
# these files and the log holds the unit's done line. TODO_ONLY=1 prints the stamp and the units to run, and stops.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" | grep "^case[0-9]")" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-ceiling.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-ceiling.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"
  { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE "^ +done unit $k secs " "$f"; } || echo "$k"; done)
if [ "${TODO_ONLY:-0}" = 1 ]; then echo "stamp: code $CODE audit $AUDIT"; echo "todo: $(echo $TODO)"; exit 0; fi
echo "HARVEST-CEILING (EXPLORATORY): $NU units (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/audit-ceiling.mjs part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "HARVEST-CEILING (EXPLORATORY): runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
