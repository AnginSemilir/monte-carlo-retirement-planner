#!/bin/bash
# 7U-F (registrations/fresh-7uf.md): the assembled candidate against the shipping default, once, on the held-out seed 7014,
# scored by the engine. Every unit of audit-7uf.mjs (panel-7uf.mjs: 19 households, CAND, DECOMP where there are bridge
# years, SHIP, both estate weights), 16,000 paths, one unit a process, four at a time in the audit's order (the candidate
# arms, the longest, first). Launched only as
#   PREDICTION=research/solver/registrations/fresh-7uf.md research/solver/run-from-snapshot.sh bash research/solver/batch-7uf.sh
# and read once by research/solver/reduce-7uf.mjs.
set -u
OUT=research/solver/results/diag7uf
# A launch needs an empty folder. RESUME=1 is the registration's stop at the time box, run only on the maintainer's word:
# it runs the units whose log has no "done" line (the audit writes a unit's file just before it), and the read refuses any
# unit file whose code or audit stamp is not the logs' one version (the re-review of 22 Oct, finding 3).
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "batch-7uf: $OUT is not empty; a launch needs an empty folder (RESUME=1 runs the units not done)"; exit 2; fi
NU=$(node research/solver/audit-7uf.mjs --units | tail -1)
echo "7u-F: $NU units on seed 7014, from $(TZ=Europe/London date '+%d %b %H:%M') UK${RESUME:+ (resume: the units with no done line)}"
seq 0 $((NU - 1)) | while read -r k; do grep -qE '^ +done ' "$OUT/case$k.txt" 2>/dev/null || echo "$k"; done | xargs -P 4 -I{} sh -c \
  "DIAG7UF_OUT=$OUT node research/solver/audit-7uf.mjs 16000 part {}/$NU 7014 > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "7u-F runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
