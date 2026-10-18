#!/bin/bash
# HO-DEP's screen (items/HO-DEP.md; PREDICTION="none:..."): the 13 deposit-mid candidates (not S362 or S366) under the order
# reference at 15 points, 400 paths a world, seed 7004, four at a time; select-hodep.mjs --screen names the
# four whose world-0 survival lies in [20, 80], nearest 50, for the reach step.
set -u
OUT=research/solver/results/hodep-screen
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(HODEP_SCREEN=1 node research/solver/audit-hodep.mjs --units | tail -1)
[ "$NJ" = 13 ] || { echo "HO-DEP screen: audit-hodep.mjs names $NJ jobs, not 13"; exit 1; }
seq 0 12 | xargs -P 4 -I{} sh -c '
  O=research/solver/results/hodep-screen
  HODEP_SCREEN=1 DIAGHODEP_OUT=$O node research/solver/audit-hodep.mjs 1 400 part {}/13 7004 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}'
bad=0; for f in "$OUT"/exit*; do grep -q " exit 0" "$f" || { echo "A SCREEN JOB DID NOT FINISH: $(cat $f)"; bad=1; }; done
grep -h "audit-hodep:" "$OUT"/case*.txt | head -3
node research/solver/select-hodep.mjs --screen "$OUT" || bad=1
echo "HO-DEP screen done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
