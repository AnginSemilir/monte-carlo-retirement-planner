#!/bin/bash
# PAUSE-S128, the deep review after PAUSE's out-of-sample step before FORCE-X (a MEASUREMENT, launched under
# predictions/measure-pause-s128.md, Kind: measurement): audit-pause.mjs with PAUSE_HH=S128, its three parts (SNAP, P-LO, HYB,
# one solve each) at 30 points and EDGE-SPLIT's first 1,000 paths (seed 7005), one at a time (XAS-R2 holds three cores), into
# results/diagpause128; each stopped at 3 hours. Read by reduce-pause128.mjs into results-pause128.txt (in the real tree:
# EDGE-SPLIT's declared correction needs git).
set -u
OUT=research/solver/results/diagpause128
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 2 | xargs -P 1 -I{} sh -c \
  'PAUSE_HH=S128 DIAGPAUSE_OUT=research/solver/results/diagpause128 timeout 10800 node research/solver/audit-pause.mjs 30 1000 part {}/3 7005 > research/solver/results/diagpause128/case{}.txt 2>&1 || echo "part {} exited $?"'
echo "PAUSE-S128 runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-pause128.mjs "$OUT" || echo "=== reduce-pause128.mjs did not run to its reading inside the snapshot (EDGE-SPLIT's declared correction needs git): reduce in the real tree"
