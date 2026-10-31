#!/bin/bash
# COPY-X's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-copyx.md), seed 7002, 40 paths a world,
# PAR jobs at a time (default 4):
# (A) the four jobs at a fifteenth of the points, read by reduce-copyx.mjs --preflight (its gate and files; no figure read for
#     an item: a preview at a fraction of the points, PREVIEW): the copy rule shown to solve with the candidate's other
#     settings and with SNR's nodes and split, the copied nodes recounted, every bridge-year read given back by its four parts;
# (B) the rule itself: research/tests/reader-copy.test.mjs on this code, every verdict PASS (each copied node's c the rule's
#     under 'extrap' and the flat copy's with the option off; the check failing on the flat copy kept, the extrapolation taken
#     from above and the clip left off);
# (C) the plants, each refusing its job (exit 3) on its own check: nodes and snr on SNR and cx on CX (armTook), own and layer
#     on C (identity), quad on C (qfTook), held on C (layerTook), score on C (scoreTook's scorePaths leg), trace on C
#     (scoreTook's counters leg), split on C (splitTook), class on C (copyTook).
set -u
OUT=research/solver/results/copyx-preflight
rm -rf "$OUT"; mkdir -p "$OUT/main"
PL="nodes snr cx own layer quad held score trace split class"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
NJ=$(node research/solver/audit-copyx.mjs --units | tail -1)
[ "$NJ" = 4 ] || { echo "COPY-X preflight: audit-copyx.mjs names $NJ jobs, not 4"; exit 1; }
printf '%s\n' m0 m1 m2 m3 rct $PL | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/copyx-preflight; A="15 40"
  case {} in
    m0|m1|m2|m3) k=$(echo {} | cut -c2); DIAGCOPYX_OUT=$O/main node research/solver/audit-copyx.mjs $A part $k/4 7002 > $O/main/case$k.txt 2>&1; echo "{} exit $?" > $O/main/exit$k ;;
    rct) node research/tests/reader-copy.test.mjs > $O/reader-copy.txt 2>&1; echo "reader-copy exit $?" > $O/reader-copy-exit.txt ;;
    nodes|snr) COPYX_PLANT={} DIAGCOPYX_OUT=$O/plant-{} node research/solver/audit-copyx.mjs $A part 1/4 7002 > $O/plant-{}/case1.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
    cx) COPYX_PLANT=cx DIAGCOPYX_OUT=$O/plant-cx node research/solver/audit-copyx.mjs $A part 2/4 7002 > $O/plant-cx/case2.txt 2>&1; echo "plant cx exit $?" > $O/plant-cx/exit.txt ;;
    *) COPYX_PLANT={} DIAGCOPYX_OUT=$O/plant-{} node research/solver/audit-copyx.mjs $A part 0/4 7002 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0; R=research/solver/reduce-copyx.mjs
for f in "$OUT"/main/exit*; do echo "$(cat $f)"; grep -q " exit 0" "$f" || { echo "A JOB DID NOT FINISH ($f) - the preflight fails"; bad=1; }; done
grep -hE "solve CAND|ran CAND|reader |recount |nodes |whole |checks |clamped |score legs " "$OUT"/main/case*.txt | cut -c1-220 | sed 's/^ */A: /'
echo "A. $(node $R "$OUT/main" 40 15 --preflight | tail -6 | tr '\n' ' ' | cut -c1-1100)"
node $R "$OUT/main" 40 15 --preflight > /dev/null || { echo "THE GATE REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
echo "B. $(cat "$OUT/reader-copy-exit.txt"): $(grep -c '^PASS' "$OUT/reader-copy.txt") PASS, $(grep -c '^FAIL\|AssertionError' "$OUT/reader-copy.txt") FAIL"
grep -q "reader-copy exit 0" "$OUT/reader-copy-exit.txt" && ! grep -q "^FAIL\|AssertionError" "$OUT/reader-copy.txt" || { echo "THE READER-COPY TEST DID NOT PASS ON THIS CODE - the preflight fails"; bad=1; }
want() { case $1 in nodes|snr|cx) echo "the job's settings did not take";; own|layer) echo "the ledger does not close on every path";; quad) echo "the fine rule's machinery does not reproduce";; held) echo "a bridge visit's G is filed under a layer other than the tiers held";; score) echo "the whole score does not reproduce reduce-7t.mjs's over the trace";; trace) echo "the trace disagrees with runPolicy's own counters";; split) echo "a bridge-year read is not given back by its split";; class) echo "the copied nodes recounted at line 0.6 are not the solve's";; esac; }
for p in $PL; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-copyx:' "$OUT/plant-$p"/case*.txt | head -1); echo "C. $e: $(echo "$m" | cut -c1-200)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
[ $bad -eq 0 ] && echo "the gate passed the four jobs on S370; the copy rule solves with the candidate's settings and with SNR's nodes and split; the reader-copy test passed on this code; the eleven plants refused, each on its own check"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
