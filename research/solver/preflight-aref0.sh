#!/bin/bash
# AREF Step 0's preflight (PREDICTION="none:..."; the measurement itself runs under predictions/diag-aref0.md): the audit at
# a quarter of its DP grid and 200 simulations a checked state into results/diagaref0-preflight, read by reduce-aref0.mjs
# --preflight (its gate and the file; no figure read); then the audit's plants, each of which must make the job refuse
# (exit 3): drift (dpTook), choice (dpTook), grid (gridTook); notax is run and its exit printed, not required to refuse.
# PAR jobs at a time (default 4).
set -u
OUT=research/solver/results/diagaref0-preflight
rm -rf "$OUT" "$OUT"-plant-*; mkdir -p "$OUT"
for p in drift choice grid notax; do mkdir -p "$OUT-plant-$p"; done
printf '%s\n' none drift choice grid notax | xargs -P "${PAR:-4}" -I{} sh -c '
  if [ {} = none ]; then AREF0_OUT=research/solver/results/diagaref0-preflight node research/solver/audit-aref0.mjs 4 200 > research/solver/results/diagaref0-preflight/case0.txt 2>&1; echo "preflight job exit $?";
  else AREF0_PLANT={} AREF0_OUT=research/solver/results/diagaref0-preflight-plant-{} node research/solver/audit-aref0.mjs 4 200 > research/solver/results/diagaref0-preflight-plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > research/solver/results/diagaref0-preflight-plant-{}/exit.txt; fi'
grep -h "Error\|audit-aref0:" "$OUT/case0.txt" | head -5
grep -h "checks " "$OUT/case0.txt" | cut -c1-200
node research/solver/reduce-aref0.mjs "$OUT" 4 200 --preflight; echo "reduce-aref0 (the preflight) exit $?"
bad=0
for p in drift choice grid; do
  e=$(cat "$OUT-plant-$p/exit.txt"); echo "$e: $(grep -h 'audit-aref0:' "$OUT-plant-$p/case0.txt" | head -1 | cut -c1-160)"
  [ "$e" = "plant $p exit 3" ] || { echo "PLANT $p NOT REFUSED - the preflight fails"; bad=1; }
done
echo "$(cat "$OUT-plant-notax/exit.txt") (printed only): $(grep -h 'dpcheck\|audit-aref0:' "$OUT-plant-notax/case0.txt" | head -2 | cut -c1-120 | tr '\n' ' ')"
[ $bad -eq 0 ] && echo "the three plants refused (exit 3)"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
