#!/usr/bin/env bash
# PHASE 4'S PANEL LANDING (STATE.md D35; phase4-panel.mjs): the 20 library and 20 FIRE candidates of the two orders,
# four at a time, each landed so arm A survives 85 +/- 1% on 1,000 paths of seed 7005 (searched on 7001). Then
# `node research/solver/phase4-panel.mjs combine`; a household not landed is passed over for a reserve (land its k).
set -u
cd "$(dirname "$0")/../.."
LOG=research/solver/results/p4-land-log.txt
mkdir -p research/solver/results
[ -f research/solver/phase4-orders.json ] || node research/solver/phase4-panel.mjs freeze >> "$LOG" 2>&1   # the scan and the orders, once
jobs=()
for k in $(seq 0 19); do jobs+=("lib $k" "fire $k"); done
printf '%s\n' "${jobs[@]}" | xargs -P 4 -L 1 sh -c 'node research/solver/phase4-panel.mjs land $0 $1' >> "$LOG" 2>&1
node research/solver/phase4-panel.mjs combine >> "$LOG" 2>&1
echo "landing done" >> "$LOG"
