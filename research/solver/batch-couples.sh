#!/bin/bash
# PART D, D4'S RE-RUN (registrations/couples-d4b.md; the review of 9 Nov, items 1 and 9; D66, D67): the candidate for couples
# against the app's rules and the couples' solver at the product's settings, once, on seed 7021, scored by the engine, in item
# 9's two stages. Every unit of audit-couples.mjs (couples-panel-d4b.json's 40 couples: CANDC and SHIPC at both estate weights,
# APP), each couple at its registered N (couples-paths-d4b.json): first every unit's first STAGE1 paths (its chunk 0); then,
# once all of those are in, the registered stage gate (stage-couples.mjs) writes the run's stage2.json, the couples and weights
# going on; then their second stage's chunks (CANDC three, SHIPC one, APP one, of the rest of the paths). One chunk a process,
# four at a time, in the audit's order. Launched only as
#   PREDICTION=research/solver/registrations/couples-d4b.md research/solver/run-from-snapshot.sh bash research/solver/batch-couples.sh
# and read once by research/solver/reduce-couples.mjs.
set -u
OUT=research/solver/results/d4b-run
# A launch needs an empty folder. The harness stops a tracked task at 12 hours and the run needs longer: RESUME=1 relaunches
# it under the same registration and keeps a chunk only when its log's stamp names this code and this audit and the log holds
# the chunk's done line, re-running every other chunk from the start. The read refuses any chunk whose stamp is not the logs'
# one version.
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "batch-couples: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(node --input-type=module -e "import { stampFilesHash } from './research/solver/audit-couples.mjs'; console.log(stampFilesHash());")
NU=$(node research/solver/audit-couples.mjs --units | tail -1)
# a chunk is kept only on the whole stamp the read requires: this code and audit, this registration and its blob, this Node
STAMPLINE="stamp: code $CODE audit $AUDIT prediction ${PREDICTION_FILE:-NOT-LAUNCHED} sha ${PREDICTION_SHA:--}"
NODEV=$(node --version)
done_k() { local f="$OUT/case$1.txt"; [ -f "$f" ] && [ "$(head -1 "$f")" = "$STAMPLINE" ] && sed -n 2p "$f" | grep -q "; node $NODEV\$" && grep -qE '^ +done ' "$f"; }
# D4_SHARD=i/n: this launch runs only the chunks still to do whose number leaves i when divided by n, so n sessions, one for
# each i from 0 to n-1, run every chunk once between them (the external review of 9 Nov, item 1, part 3; prototype/d4-shard.diff).
# Unset, all of them. A chunk's paths and stamp do not depend on which launch runs it.
SHARD="${D4_SHARD:-0/1}"
case "$SHARD" in *[!0-9/]*|*/*/*|/*|*/|*/0) echo "batch-couples: D4_SHARD must be i/n with 0 <= i < n, not '$SHARD'"; exit 2;; esac
[ "${SHARD%/*}" -lt "${SHARD#*/}" ] 2>/dev/null || { echo "batch-couples: D4_SHARD must be i/n with 0 <= i < n, not '$SHARD'"; exit 2; }
shard() { awk -v i="${SHARD%/*}" -v n="${SHARD#*/}" 'NF && $1 % n == i'; }
run() { printf '%s\n' "$@" | grep . | xargs -P 4 -I{} sh -c "D4_OUT=$OUT node research/solver/audit-couples.mjs registered part {}/$NU > $OUT/case{}.txt 2>&1 || echo \"chunk {} exited \$?\""; }
# the first stage: every unit's chunk 0
S1=$(node research/solver/audit-couples.mjs --stage-units 1)
TODO1=$(for k in $S1; do done_k "$k" || echo "$k"; done | shard)
echo "D4B: $NU chunks on seed 7021 (code $CODE, audit $AUDIT); the first stage $(echo $S1 | wc -w), $(printf '%s\n' $TODO1 | grep -c .) to run here (shard $SHARD), from $(TZ=Europe/London date '+%d %b %H:%M') UK"
run $TODO1
LEFT1=$(for k in $S1; do done_k "$k" || echo "$k"; done | grep -c .)
if [ "$LEFT1" -gt 0 ]; then echo "D4B: the first stage has $LEFT1 chunks not done here; the stage gate waits for all of them (gather every shard's, then relaunch under RESUME=1)"; exit 0; fi
# the stage gate, once, when every first-stage chunk is in; a relaunch keeps its decision
[ -f "$OUT/stage2.json" ] || node research/solver/stage-couples.mjs "$OUT" || { echo "D4B: the stage gate refused"; exit 3; }
S2=$(node research/solver/audit-couples.mjs --stage-units 2 "$OUT/stage2.json")
TODO2=$(for k in $S2; do done_k "$k" || echo "$k"; done | shard)
echo "D4B: the second stage $(echo $S2 | wc -w) chunks, $(printf '%s\n' $TODO2 | grep -c .) to run here (shard $SHARD), from $(TZ=Europe/London date '+%d %b %H:%M') UK"
run $TODO2
echo "D4B runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
