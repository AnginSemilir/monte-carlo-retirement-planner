#!/bin/bash
# COPY-B's preflight (COPY-W's stage B; PREDICTION="none:..."; the test itself runs under predictions/diag-copyb.md), seed 7002,
# 40 paths a world, PAR jobs at a time (default 4):
# (A) the fifteen jobs at a fifteenth of the points, read by reduce-copyb.mjs --preflight (its gate and files; no figure read
#     for an item: a preview at a fraction of the points, PREVIEW): every household solved with the candidate's other
#     settings and its bridge years printed, the copy rule on CX and CXW alone, the copied nodes recounted, every bridge-year
#     read given back by its four parts; the reach screen (each household's bridge years, bridge failures by world, the copied
#     nodes) printed for the registration;
# (B) the rule itself: research/tests/reader-copy.test.mjs on this code, every verdict PASS;
# (C) the plants, each refusing its job (exit 3) on its own check: cxw on S362's CXW (armTook), own and layer on S362's CW
#     (identity), quad (qfTook), held (layerTook), score (scoreTook's scorePaths leg), trace (scoreTook's counters leg), split
#     (splitTook), class (copyTook), each on S362's CW: S362 has seven bridge years, where a move taken can differ from the
#     tiers held (the first run put them on S130's CW, one bridge year, where the held plant is inert by construction: PLANTS).
set -u
OUT=research/solver/results/copyb-preflight
rm -rf "$OUT"; mkdir -p "$OUT/main"
PL="cxw own layer quad held score trace split class"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
NJ=$(node research/solver/audit-copyb.mjs --units | tail -1)
[ "$NJ" = 15 ] || { echo "COPY-B preflight: audit-copyb.mjs names $NJ jobs, not 15"; exit 1; }
{ seq 0 14 | sed 's/^/m/'; echo rct; printf '%s\n' $PL; } | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/copyb-preflight; A="15 40"
  case {} in
    m*) k=$(echo {} | cut -c2-); DIAGCOPYB_OUT=$O/main node research/solver/audit-copyb.mjs $A part $k/15 7002 > $O/main/case$k.txt 2>&1; echo "{} exit $?" > $O/main/exit$k ;;
    rct) node research/tests/reader-copy.test.mjs > $O/reader-copy.txt 2>&1; echo "reader-copy exit $?" > $O/reader-copy-exit.txt ;;
    cxw) COPYB_PLANT=cxw DIAGCOPYB_OUT=$O/plant-cxw node research/solver/audit-copyb.mjs $A part 1/15 7002 > $O/plant-cxw/case1.txt 2>&1; echo "plant cxw exit $?" > $O/plant-cxw/exit.txt ;;
    *) COPYB_PLANT={} DIAGCOPYB_OUT=$O/plant-{} node research/solver/audit-copyb.mjs $A part 0/15 7002 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0; R=research/solver/reduce-copyb.mjs
for f in "$OUT"/main/exit*; do grep -q " exit 0" "$f" || { echo "$(cat $f): A JOB DID NOT FINISH ($f) - the preflight fails"; grep -h "audit-copyb:" "$OUT"/main/case*.txt | head -3; bad=1; }; done
echo "A. $(ls "$OUT"/main/exit* | wc -l) jobs, $(grep -l ' exit 0' "$OUT"/main/exit* | wc -l) finished"
node $R "$OUT/main" 40 15 --preflight | tail -18 | cut -c1-260
node $R "$OUT/main" 40 15 --preflight > /dev/null || { echo "THE GATE REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
echo "B. $(cat "$OUT/reader-copy-exit.txt"): $(grep -c '^PASS' "$OUT/reader-copy.txt") PASS, $(grep -c '^FAIL\|AssertionError' "$OUT/reader-copy.txt") FAIL"
grep -q "reader-copy exit 0" "$OUT/reader-copy-exit.txt" && ! grep -q "^FAIL\|AssertionError" "$OUT/reader-copy.txt" || { echo "THE READER-COPY TEST DID NOT PASS ON THIS CODE - the preflight fails"; bad=1; }
want() { case $1 in cxw) echo "the job's settings did not take";; own|layer) echo "the ledger does not close on every path";; quad) echo "the fine rule's machinery does not reproduce";; held) echo "a bridge visit's G is filed under a layer other than the tiers held";; score) echo "the whole score does not reproduce reduce-7t.mjs's over the trace";; trace) echo "the trace disagrees with runPolicy's own counters";; split) echo "a bridge-year read is not given back by its split";; class) echo "the copied nodes recounted at line 0.6 are not the solve's";; esac; }
for p in $PL; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-copyb:' "$OUT/plant-$p"/case*.txt | head -1); echo "C. $e: $(echo "$m" | cut -c1-200)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
[ $bad -eq 0 ] && echo "the gate passed the fifteen jobs on S362, S370, S130, S126 and S128; the copy rule solves on CX and CXW alone with the candidate's settings; the reader-copy test passed on this code; the nine plants refused, each on its own check"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
