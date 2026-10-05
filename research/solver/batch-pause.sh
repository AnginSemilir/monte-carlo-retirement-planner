#!/bin/bash
# PAUSE, where each arm pauses against its own read's steepest fall (PLAN.md O103's gate; a MEASUREMENT, launched under
# predictions/measure-pause.md, Kind: measurement): audit-pause.mjs's four parts (two arms and one solve each) on S130 at 30
# points and EDGE-SPLIT's first 1,000 paths (seed 7005), four at once, into results/diagpause; each stopped at 3 hours. Read by
# reduce-pause.mjs into results-pause.txt.
set -u
OUT=research/solver/results/diagpause
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 3 | xargs -P 4 -I{} sh -c \
  'timeout 10800 node research/solver/audit-pause.mjs 30 1000 part {}/4 7005 > research/solver/results/diagpause/case{}.txt 2>&1 || echo "part {} exited $?"'
echo "PAUSE runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-pause.mjs "$OUT" || echo "=== reduce-pause.mjs did not run to its reading inside the snapshot: reduce in the real tree"
