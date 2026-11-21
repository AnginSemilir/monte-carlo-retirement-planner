#!/bin/bash
# TEST K (SAVE-K.md, its rule committed before any unit runs; D137 (4); EXPLORATORY): save-k.mjs's households, one a process,
# JOBS at a time (4 unless set), each at low priority and pausing for the gate (run-unit.sh), on the read's own code: the
# launch worktree TREE (/home/user/sv2-launch unless set), which must be at the launch commit a83cd90b with no edit in its
# code. Run directly as a tracked task: the launcher refuses a reserved seed outside its registration (D110's form,
# D137 (4)). Read by reduce-save-k.mjs.
#   bash research/solver/batch-save-k.sh                          (RESUME=1 keeps a unit done on these files)
#   SK_SMOKE=1 SK_N=20 bash research/solver/batch-save-k.sh       the smoke: light settings, seed 7002, results/save-k-smoke
set -u
TREE=${TREE:-/home/user/sv2-launch}
if [ "${SK_SMOKE:-0}" = 1 ]; then OUT=research/solver/results/save-k-smoke; else OUT=research/solver/results/save-k-7025; fi
[ "$(git -C "$TREE" rev-parse --short=8 HEAD 2>/dev/null)" = a83cd90b ] || { echo "$0: $TREE is not at the launch commit a83cd90b"; exit 2; }
[ -z "$(git -C "$TREE" status --porcelain -- src research/engine.mjs 'research/solver/*.mjs' 'research/solver/*.json')" ] || { echo "$0: $TREE has edits in its code"; exit 2; }
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" 2>/dev/null | grep -E '\.(json\.gz|log)$')" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the done ones)"; exit 2; fi
K=$(node --input-type=module -e "import { kStamp } from './research/solver/save-k.mjs'; console.log(kStamp());")
ALL=$(node research/solver/save-k.mjs --units)
TODO=$(for u in $ALL; do f="$OUT/$u.log"; { [ -f "$f" ] && head -1 "$f" | grep -q " k $K " && grep -qE "^ +done unit $u secs " "$f" && [ -f "$OUT/$u.json.gz" ]; } || echo "$u"; done)
echo "TEST K (EXPLORATORY${SK_SMOKE:+, THE SMOKE}): $(echo $TODO | wc -w) of $(echo $ALL | wc -w) units to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK; the tree $TREE at $(git -C "$TREE" rev-parse --short HEAD); k $K"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/save-k.mjs $TREE {} > $OUT/{}.log 2>&1 || echo \"unit {} exited \$?\""
echo "TEST K: runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
