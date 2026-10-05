#!/bin/bash
# PAUSE's preflight (PREDICTION="none:..."; the measurement itself runs under predictions/measure-pause.md): audit-pause.mjs's
# 4 parts at the real grid (30 points) and 20 paths (seed 7005), four at once, into results/diagpause-preflight, read by
# reduce-pause.mjs --preflight - its gate, the files and THE IDENTITY against EDGE-SPLIT's and HYB's files on the first 20 paths
# (so the main run's identity is known to hold before it starts); then the plant (PAUSE_PLANT=scale, 4 points, 5 paths, one
# part), which the reducer must refuse. No figure is read.
set -u
OUT=research/solver/results/diagpause-preflight
rm -rf "$OUT" "$OUT-plant"; mkdir -p "$OUT" "$OUT-plant"
seq 0 3 | xargs -P 4 -I{} sh -c \
  'DIAGPAUSE_OUT=research/solver/results/diagpause-preflight timeout 3600 node research/solver/audit-pause.mjs 30 20 part {}/4 7005 > research/solver/results/diagpause-preflight/case{}.txt 2>&1 || echo "part {} failed"'
grep -h "Error\|audit-pause:" "$OUT"/case*.txt | head -5
node research/solver/reduce-pause.mjs "$OUT" 20 30 --preflight | head -8; echo "reduce-pause (the preflight) exit ${PIPESTATUS[0]}"
PAUSE_PLANT=scale DIAGPAUSE_OUT=research/solver/results/diagpause-preflight-plant node research/solver/audit-pause.mjs 4 5 part 0/4 7005 > "$OUT-plant/case0.txt" 2>&1 || echo "the plant run failed"
grep -h "sweep" "$OUT-plant/case0.txt"
if node research/solver/reduce-pause.mjs "$OUT-plant" 5 4 --preflight > "$OUT-plant/reduce.txt"; then echo "PLANT NOT REFUSED - the preflight fails"; exit 1; fi
grep -c "planted fault\|self-check failed" "$OUT-plant/reduce.txt" | sed 's/^/the plant refused, lines naming it: /'
