#!/bin/bash
# THE SHARE REPLAY (D110; research/solver/SHARE-REPLAY.md, its rule committed before the run): share-replay.mjs's nine
# units, one a process, JOBS at a time (4 unless set), longest first, each at low priority and pausing for the gate
# (run-unit.sh), on the read's own code: the launch worktree TREE (/home/user/sr-launch unless set), which must be at the
# launch commit e1239959. Run directly as a tracked task: the launcher refuses a reserved seed outside its registration
# (D110). Read by reduce-share-replay.mjs.
#   bash research/solver/batch-share-replay.sh            (RESUME=1 keeps a unit whose log holds its done line)
set -u
TREE=${TREE:-/home/user/sr-launch}
OUT=research/solver/results/share-replay
[ "$(git -C "$TREE" rev-parse --short HEAD 2>/dev/null)" = e1239959 ] || { echo "$0: $TREE is not at the launch commit e1239959"; exit 2; }
[ -z "$(git -C "$TREE" status --porcelain -- src 'research/solver/*.mjs')" ] || { echo "$0: $TREE has edits in its code"; exit 2; }
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT" 2>/dev/null | grep -E '\.(json\.gz|log)$')" ] && [ "${RESUME:-0}" != 1 ]; then echo "$0: $OUT already holds units; a launch needs none (RESUME=1 keeps the done ones)"; exit 2; fi
ORDER="S061-dbpart S191-45 S023-90 S147-db S147-90 S147-45 S227-90 S377-dbpart S023-45"
[ "$(echo $ORDER | tr ' ' '\n' | sort | tr '\n' ' ')" = "$(node research/solver/share-replay.mjs --units | sort | tr '\n' ' ')" ] || { echo "$0: the order is not share-replay.mjs's units"; exit 2; }
TODO=$(for u in $ORDER; do grep -qE "^  done $u secs" "$OUT/$u.log" 2>/dev/null || echo "$u"; done)
echo "THE SHARE REPLAY (EXPLORATORY): $(echo $TODO | wc -w) of 9 units to run, ${JOBS:-4} at a time, from $(TZ=Europe/London date '+%d %b %H:%M') UK; the tree $TREE at $(git -C "$TREE" rev-parse --short HEAD)"
printf '%s\n' $TODO | grep . | xargs -P "${JOBS:-4}" -I{} sh -c \
  "research/solver/run-unit.sh node research/solver/share-replay.mjs $TREE {} > $OUT/{}.log 2>&1 || echo \"unit {} exited \$?\""
echo "THE SHARE REPLAY: runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
