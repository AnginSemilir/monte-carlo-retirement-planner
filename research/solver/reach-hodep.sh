#!/bin/bash
# HO-DEP's reach step (items/HO-DEP.md; PREDICTION="none:..."): A (the adaptive reference, the RS split, the fix) and O (the
# order reference) on each of the four candidates the screen named (REACH=<ids>), at 30 points, 400 paths a world, seed 7004,
# four at a time; select-hodep.mjs --reach names the household where the two move differently on the most path-years.
set -u
: "${REACH:?REACH=<four ids from the screen>}"
OUT=research/solver/results/hodep-reach
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(HODEP_REACH="$REACH" node research/solver/audit-hodep.mjs --units | tail -1)
[ "$NJ" = 8 ] || { echo "HO-DEP reach: audit-hodep.mjs names $NJ jobs, not 8"; exit 1; }
export REACH
seq 0 7 | xargs -P 4 -I{} sh -c '
  O=research/solver/results/hodep-reach
  HODEP_REACH="$REACH" DIAGHODEP_OUT=$O node research/solver/audit-hodep.mjs 1 400 part {}/8 7004 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}'
bad=0; for f in "$OUT"/exit*; do grep -q " exit 0" "$f" || { echo "A REACH JOB DID NOT FINISH: $(cat $f)"; bad=1; }; done
grep -h "audit-hodep:" "$OUT"/case*.txt | head -3
grep -hE "solve CAND|foot |checks " "$OUT"/case*.txt | cut -c1-160
node research/solver/select-hodep.mjs --reach "$OUT" || bad=1
echo "HO-DEP reach done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
