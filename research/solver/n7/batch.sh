#!/bin/bash
# N7's data (build.mjs): Node's reference solves of the page's check and gate 5's four households, the four at once (one
# process a core; only their digests matter, their times are under that load), then data.json. EXPLORATORY.
#   bash research/solver/n7/batch.sh      as a tracked background task
set -u
LOG=research/solver/results/n7; mkdir -p "$LOG"
node research/solver/n7/build.mjs check || exit 1
for i in 0 1 2 3; do node research/solver/n7/build.mjs case $i > "$LOG/case$i.txt" 2>&1 & done; wait
cat "$LOG"/case?.txt
node research/solver/n7/build.mjs data
