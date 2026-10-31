#!/usr/bin/env bash
# A MEASUREMENT, not a test (the forty-eighth review's BLOCKING 1, 25 Sep 22:30 UK): what 7e's look 2 costs per 1,000
# paths, so the path count can be put to the maintainer with its time. S126, off only, 16 points, seed 7002 (tuning; the
# time does not depend on the seed, and 7011 is 7e's), 1,000 against 3,000 paths side by side on two cores: the
# difference is 2,000 paths of forward simulation under the same load.
#   PREDICTION="none:<why>" research/solver/run-from-snapshot.sh bash research/solver/batch-look2time.sh
set -u
OUT=research/solver/results/look2time
mkdir -p "$OUT"
timeout 3600 node research/solver/audit-s126.mjs bridge7e 16 1000 part 0/1 off S126 7002 > "$OUT/p1000.txt" 2>&1 &
timeout 3600 node research/solver/audit-s126.mjs bridge7e 16 3000 part 0/1 off S126 7002 > "$OUT/p3000.txt" 2>&1 &
wait
uptime
