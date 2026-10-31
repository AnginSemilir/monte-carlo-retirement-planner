#!/bin/bash
# PHASE 4'S PILOT (STATE.md D34 (2): "a short pilot", every household having no record): the 40 households of
# phase4-panel.json in every arm at both weights, 2,000 paths of the tuning seed 7002, no replication, worlds or history
# (P4_PILOT=1). It gives size-phase4.mjs each household's discordances (its paths and thresholds) and the units' times the
# budget is measured from (D21), on this machine, four at a time as the run will be. EXPLORATORY: it reads no seed of
# Phase 4's and decides nothing.
#   bash research/solver/batch-p4-pilot.sh, then node research/solver/size-phase4.mjs > research/solver/results-phase4-sizing.txt
set -u
OUT=research/solver/results/p4-pilot
mkdir -p "$OUT"
NU=$(node research/solver/audit-phase4.mjs --units | tail -1)
echo "Phase 4's pilot: $NU units, 2,000 paths of seed 7002, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"; [ -f "$f" ] && grep -qE '^ +done ' "$f" || echo "$k"; done | xargs -P 4 -I{} sh -c \
  "P4_PILOT=1 P4_OUT=$OUT node research/solver/audit-phase4.mjs 2000 part {}/$NU 7002 > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "Phase 4's pilot done $(TZ=Europe/London date '+%d %b %H:%M') UK"
