#!/bin/bash
# 7U-F (registrations/fresh-7uf.md): the assembled candidate against the shipping default, once, on the held-out seed 7014,
# scored by the engine. Every unit of audit-7uf.mjs (panel-7uf.mjs: 19 households, CAND, DECOMP where there are bridge
# years, SHIP, both estate weights), 16,000 paths, one unit a process, four at a time in the audit's order (the candidate
# arms, the longest, first). Launched only as
#   PREDICTION=research/solver/registrations/fresh-7uf.md research/solver/run-from-snapshot.sh bash research/solver/batch-7uf.sh
# and read once by research/solver/reduce-7uf.mjs.
set -u
OUT=research/solver/results/diag7uf
# A launch needs an empty folder. The harness stops a tracked task at 12 hours (BASH_MAX_TIMEOUT_MS) and a container
# restart stops it too, and 7u-F needs about 24: RESUME=1 relaunches it under the same registration (7u's rule, batch-7u.sh)
# and keeps a unit only when its log's stamp names this code and this audit and the log holds the unit's done line (the
# audit writes the unit's file just before it), re-running every other unit from the start. Past the registration's time
# box, only on the maintainer's word. The read refuses any unit file whose code or audit stamp is not the logs' one version
# (the re-review of 22 Oct, finding 3).
mkdir -p "$OUT"
if [ -n "$(ls -A "$OUT")" ] && [ "${RESUME:-0}" != 1 ]; then echo "batch-7uf: $OUT is not empty; a launch needs an empty folder (RESUME=1 keeps the units done on this code)"; exit 2; fi
CODE=$(node research/solver/code-id.mjs)
AUDIT=$(cat research/solver/audit-7uf.mjs research/solver/panel-7uf.mjs | sha256sum | cut -c1-12)   # audit-7uf.mjs's own stamp
NU=$(node research/solver/audit-7uf.mjs --units | tail -1)
TODO=$(seq 0 $((NU - 1)) | while read -r k; do f="$OUT/case$k.txt"; { [ -f "$f" ] && head -1 "$f" | grep -q "^stamp: code $CODE audit $AUDIT " && grep -qE '^ +done ' "$f"; } || echo "$k"; done)
# The order (the maintainer, 22 Oct, STATE.md D21): the units the decision reads, CAND and SHIP, before DECOMP, which only
# reports. unitsOf groups the units by arm in panel-7uf.mjs's ARMS order (CAND, DECOMP, SHIP), each over both weights, so
# DECOMP's are the block after CAND's 2 x 19; every started unit's log is held to it. The order moves no figure: a unit is
# one process, picked by its index, on the same paths of seed 7014, and writes only its own file.
read -r NPANEL ARMS_ <<< "$(node --input-type=module -e "import { PANEL, ARMS } from './research/solver/panel-7uf.mjs'; console.log(PANEL.length, ARMS.join(','))")"
[ "$ARMS_" = "CAND,DECOMP,SHIP" ] || { echo "batch-7uf: panel-7uf.mjs's arms are $ARMS_, not CAND,DECOMP,SHIP"; exit 2; }
D0=$((2 * NPANEL)); D1=$((NU - 2 * NPANEL))   # DECOMP's indices, D0 to D1 - 1
armOf() { if [ "$1" -lt "$D0" ]; then echo CAND; elif [ "$1" -lt "$D1" ]; then echo DECOMP; else echo SHIP; fi; }
for f in "$OUT"/case*.txt; do
  [ -f "$f" ] || continue; k=${f##*case}; k=${k%.txt}; a=$(grep -m1 -oE 'case \| unit [A-Z]+' "$f" | awk '{print $4}')
  [ -z "$a" ] || [ "$a" = "$(armOf "$k")" ] || { echo "batch-7uf: unit $k's log names $a, not $(armOf "$k")"; exit 2; }
done
TODO=$(for pass in first last; do for k in $TODO; do a=$(armOf "$k"); { [ $pass = first ] && [ "$a" != DECOMP ]; } || { [ $pass = last ] && [ "$a" = DECOMP ]; } && echo "$k"; done; done)
echo "7u-F: $NU units on seed 7014 (code $CODE, audit $AUDIT), $(printf '%s\n' $TODO | grep -c .) to run, CAND and SHIP before DECOMP, from $(TZ=Europe/London date '+%d %b %H:%M') UK"
printf '%s\n' $TODO | grep . | xargs -P 4 -I{} sh -c \
  "DIAG7UF_OUT=$OUT node research/solver/audit-7uf.mjs 16000 part {}/$NU 7014 > $OUT/case{}.txt 2>&1 || echo \"unit {} exited \$?\""
echo "7u-F runs done $(TZ=Europe/London date '+%d %b %H:%M') UK"
