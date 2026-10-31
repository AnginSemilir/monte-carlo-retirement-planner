#!/bin/bash
# PMAP, the position map (PLAN.md PMAP; a MEASUREMENT, launched under predictions/measure-pmap.md, Kind: measurement):
# audit-pmap.mjs on S130, S370, bridge 4, S126 and bridge 0 at 30 wealth points and 6 share points, 2,000 paths a world (seed
# 7002), one process a household, four at once, into results/diagpmap; each stopped at 3 hours. Read by reduce-pmap.mjs into
# results-pmap.txt.
set -u
OUT=research/solver/results/diagpmap
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 4 | xargs -P 4 -I{} sh -c \
  'timeout 10800 node research/solver/audit-pmap.mjs 30 2000 part {}/5 7002 > research/solver/results/diagpmap/case{}.txt 2>&1 || echo "household {} exited $?"'
echo "PMAP runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-pmap.mjs "$OUT" || echo "=== reduce-pmap.mjs did not run to its reading inside the snapshot: reduce in the real tree"
