#!/bin/bash
# The draw-pause measurement (PLAN.md O71, O77; a MEASUREMENT, launched under predictions/measure-dp.md, Kind: measurement): the shipping default on
# 7e's panel (audit-dp.mjs PANEL, 25 households) at 30 points, 2,000 paths (seed 7002), one process a household, four at
# once, into results/diagdp; each process stopped at 3 hours. Read by reduce-dp.mjs into results-dp.txt.
set -u
OUT=research/solver/results/diagdp
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 24 | xargs -P 4 -I{} sh -c \
  'timeout 10800 node research/solver/audit-dp.mjs 30 2000 part {}/25 7002 > research/solver/results/diagdp/case{}.txt 2>&1 || echo "household {} exited $?"'
echo "draw-pause runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-dp.mjs "$OUT" || echo "=== reduce-dp.mjs did not run to its reading inside the snapshot: reduce in the real tree"
