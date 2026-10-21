#!/bin/bash
# 7U-F (registrations/fresh-7uf.md): the assembled candidate against the shipping default, once, on the held-out seed 7014,
# scored by the engine. Every unit of audit-7uf.mjs (panel-7uf.mjs: 19 households, CAND, DECOMP where there are bridge
# years, SHIP, both estate weights), 16,000 paths, one unit a process, four at a time in the audit's order (the candidate
# arms, the longest, first). Launched only as
#   PREDICTION=research/solver/registrations/fresh-7uf.md research/solver/run-from-snapshot.sh bash research/solver/batch-7uf.sh
# and read once by research/solver/reduce-7uf.mjs.
set -u
OUT=research/solver/results/diag7uf
mkdir -p "$OUT"
NU=$(node research/solver/audit-7uf.mjs --units | tail -1)
echo "7u-F: $NU units on seed 7014, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
seq 0 $((NU - 1)) | xargs -P 4 -I{} sh -c \
  "DIAG7UF_OUT=$OUT node research/solver/audit-7uf.mjs 16000 part {}/$NU 7014 > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "7u-F runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
