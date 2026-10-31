#!/bin/bash
# CARRY, the carry family's held-out read (PLAN.md CARRY; predictions/diag-carry.md, Kind: test): reduce-carry.mjs reads
# the saved records of 7aj (results/diag7aj) and 7aw (results/diag7aw) - its gate first - and scores CARRY's forecast for
# 7aw (drafts/carry-forecast-7aw.md, 770cfb2) and the fixed-policy re-score for O123. No solve and no new path: zero cores,
# a few minutes. Its output is saved as results-carry.txt.
set -u
OUT=research/solver/results/carry
rm -rf "$OUT"; mkdir -p "$OUT"
timeout 3600 node research/solver/reduce-carry.mjs > "$OUT/read.txt" 2>&1 || echo "reduce-carry.mjs exited $?"
echo "CARRY read done $(TZ=Europe/London date +%H:%M) UK"
