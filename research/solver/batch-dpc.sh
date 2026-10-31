#!/bin/bash
# The three-arm draw-pause contrast (PLAN.md DPC; O71, O83; a MEASUREMENT, launched under predictions/measure-dpc.md, Kind:
# measurement): the shipping default on 7e's panel (25 households) in three arms of the used-allowance axis (SNAP, PCLSI,
# SHIFT; audit-dpc.mjs UNITS, 75) at 30 points, 2,000 paths (seed 7002), one process a unit, four at once, into
# results/diagdpc (logs, and SNAP's per-path traces); each process stopped at 3 hours. Read by reduce-dpc.mjs (SNAP held to DP's results/diagdp) into results-dpc.txt.
set -u
OUT=research/solver/results/diagdpc
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 74 | xargs -P 4 -I{} sh -c \
  'DIAGDPC_OUT=research/solver/results/diagdpc timeout 10800 node research/solver/audit-dpc.mjs 30 2000 part {}/75 7002 > research/solver/results/diagdpc/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "draw-pause contrast runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-dpc.mjs "$OUT" || echo "=== reduce-dpc.mjs did not run to its reading inside the snapshot: reduce in the real tree"
