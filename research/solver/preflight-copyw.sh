#!/bin/bash
# COPY-W's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-copyw.md), seed 7002, 40 paths a world,
# PAR jobs at a time (default 4):
# (A) the two jobs at a fifteenth of the points, read by reduce-copyw.mjs --preflight (its gate and files; no figure read for
#     an item: a preview at a fraction of the points, PREVIEW): the copy rule shown to solve at 60 points' grid with the
#     candidate's other settings, the copied nodes recounted, every bridge-year read given back by its four parts;
# (B) the rule itself: research/tests/reader-copy.test.mjs on this code, every verdict PASS (each copied node's c the rule's
#     under 'extrap' and the flat copy's with the option off; the check failing on the flat copy kept, the extrapolation taken
#     from above and the clip left off);
# (C) the plants, each refusing its job (exit 3) on its own check: cxw on CXW (armTook), own and layer on CW (identity), quad
#     on CW (qfTook), held on CW (layerTook), score on CW (scoreTook's scorePaths leg), trace on CW (scoreTook's counters
#     leg), split on CW (splitTook), class on CW (copyTook).
set -u
OUT=research/solver/results/copyw-preflight
rm -rf "$OUT"; mkdir -p "$OUT/main"
PL="cxw own layer quad held score trace split class"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
NJ=$(node research/solver/audit-copyw.mjs --units | tail -1)
[ "$NJ" = 2 ] || { echo "COPY-W preflight: audit-copyw.mjs names $NJ jobs, not 2"; exit 1; }
printf '%s\n' m0 m1 rct $PL | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/copyw-preflight; A="15 40"
  case {} in
    m0|m1) k=$(echo {} | cut -c2); DIAGCOPYW_OUT=$O/main node research/solver/audit-copyw.mjs $A part $k/2 7002 > $O/main/case$k.txt 2>&1; echo "{} exit $?" > $O/main/exit$k ;;
    rct) node research/tests/reader-copy.test.mjs > $O/reader-copy.txt 2>&1; echo "reader-copy exit $?" > $O/reader-copy-exit.txt ;;
    cxw) COPYW_PLANT=cxw DIAGCOPYW_OUT=$O/plant-cxw node research/solver/audit-copyw.mjs $A part 1/2 7002 > $O/plant-cxw/case1.txt 2>&1; echo "plant cxw exit $?" > $O/plant-cxw/exit.txt ;;
    *) COPYW_PLANT={} DIAGCOPYW_OUT=$O/plant-{} node research/solver/audit-copyw.mjs $A part 0/2 7002 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0; R=research/solver/reduce-copyw.mjs
for f in "$OUT"/main/exit*; do echo "$(cat $f)"; grep -q " exit 0" "$f" || { echo "A JOB DID NOT FINISH ($f) - the preflight fails"; bad=1; }; done
grep -hE "solve CAND|ran CAND|reader |recount |nodes |whole |checks |clamped |score legs " "$OUT"/main/case*.txt | cut -c1-220 | sed 's/^ */A: /'
echo "A. $(node $R "$OUT/main" 40 15 --preflight | tail -6 | tr '\n' ' ' | cut -c1-1100)"
node $R "$OUT/main" 40 15 --preflight > /dev/null || { echo "THE GATE REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
echo "B. $(cat "$OUT/reader-copy-exit.txt"): $(grep -c '^PASS' "$OUT/reader-copy.txt") PASS, $(grep -c '^FAIL\|AssertionError' "$OUT/reader-copy.txt") FAIL"
grep -q "reader-copy exit 0" "$OUT/reader-copy-exit.txt" && ! grep -q "^FAIL\|AssertionError" "$OUT/reader-copy.txt" || { echo "THE READER-COPY TEST DID NOT PASS ON THIS CODE - the preflight fails"; bad=1; }
want() { case $1 in cxw) echo "the job's settings did not take";; own|layer) echo "the ledger does not close on every path";; quad) echo "the fine rule's machinery does not reproduce";; held) echo "a bridge visit's G is filed under a layer other than the tiers held";; score) echo "the whole score does not reproduce reduce-7t.mjs's over the trace";; trace) echo "the trace disagrees with runPolicy's own counters";; split) echo "a bridge-year read is not given back by its split";; class) echo "the copied nodes recounted at line 0.6 are not the solve's";; esac; }
for p in $PL; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-copyw:' "$OUT/plant-$p"/case*.txt | head -1); echo "C. $e: $(echo "$m" | cut -c1-200)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
[ $bad -eq 0 ] && echo "the gate passed the two jobs on S370; the copy rule solves at 60 points' grid with the candidate's settings; the reader-copy test passed on this code; the nine plants refused, each on its own check"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
