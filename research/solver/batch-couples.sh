#!/bin/bash
# PART D, D4 (registrations/couples-d4.md; PART-D.md D4): the candidate for couples against the app's rules and the couples'
# solver at the product's settings, once, on seed 7021, scored by the engine. Every unit of audit-couples.mjs
# (couples-panel.json's 40 couples: CANDC and SHIPC at both estate weights, APP), each couple on its registered paths
# (couples-paths.json), each in its chunks of those paths (CHUNKS_OF: CANDC four, SHIPC two, APP whole; 520 in all, the
# longest under three hours here), one chunk a process, four at a time in the audit's order (CANDC first). Launched only as
#   PREDICTION=research/solver/registrations/couples-d4.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples.sh
# and read once by research/solver/reduce-couples.mjs.
set -u
OUT=research/solver/results/d4-run
# A launch needs an empty folder. The harness stops a tracked task at 12 hours and the run needs longer: RESUME=1 relaunches
# it under the same registration (Phase 4's rule, batch-phase4.sh) and keeps a chunk only when its log's stamp names this code
# and this audit and the log holds the chunk's done line, re-running every other chunk from the start. The read refuses any
# chunk whose stamp is not the logs' one version.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "batch-couples: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(cd research/solver && cat audit-couples.mjs couple-panel.mjs select-phase4.mjs audit-phase4.mjs phase4-panel.mjs ../../src/solverApp.js ../../src/solverSettings.js candidate.mjs research-opts.mjs couples-orders.json couples-panel.json couples-paths.json reduce-couples.mjs reduce-phase4.mjs size-phase4.mjs size-couples.mjs stats.mjs fair-gate.mjs audit-7uf-checks.mjs | sha256sum | cut -c1-12)   # audit-couples.mjs's own stamp (its STAMP_FILES, in order)
NU=$(node research/solver/audit-couples.mjs --units | tail -1)
# a chunk is kept only on the whole stamp the read requires: this code and audit, this registration and its blob, this Node
# (the design review of 7 Nov, its second's MINOR 1: the read refuses more than one stamp across the units)
STAMPLINE="stamp: code $CODE audit $AUDIT prediction ${PREDICTION_FILE:-NOT-LAUNCHED} sha ${PREDICTION_SHA:--}"
NODEV=$(node --version)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"; { [ -f "$f" ] && [ "$(head -1 "$f")" = "$STAMPLINE" ] && sed -n 2p "$f" | grep -q "; node $NODEV\$" && grep -qE '^ +done ' "$f"; } || echo "$k"; done)
echo "D4: $NU units on seed 7021 (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P 4 -I{} sh -c \
  "D4_OUT=$OUT node research/solver/audit-couples.mjs registered part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "D4 runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
