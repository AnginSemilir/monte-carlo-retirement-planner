#!/bin/bash
# SIZE (the sizing pass before Phase 4; a MEASUREMENT, launched with PREDICTION="none:..."): size-probe.mjs's 8 units (the
# research candidate and today's product solve on bridge 4, S126, S370 and share 0.50) at 30 points and 3,000 paths
# (seed 7002, the tuning seed), four at once, as the batches it sizes run; each stopped at 2 hours. Read by
# derive-sizing.mjs into results-sizing.txt.
set -u
OUT=research/solver/results/size
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 7 | xargs -P 4 -I{} sh -c \
  'timeout 7200 node research/solver/size-probe.mjs 30 3000 part {}/8 7002 > research/solver/results/size/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "SIZE runs done $(TZ=Europe/London date +%H:%M) UK"
