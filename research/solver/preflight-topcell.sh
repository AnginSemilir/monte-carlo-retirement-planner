#!/bin/bash
# TOP-CELL's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-topcell.md), seed 7002, 40 paths a
# world, PAR jobs at a time (default 4):
# (A) the eleven jobs at a fifteenth of the points, read by reduce-topcell.mjs --preflight (its gate and files; no figure read
#     for an item: a preview at a fraction of the points, PREVIEW): the package's record on PX, PSNX, PSNXU, PX60 and PSNX60
#     with stepTook in full, SN's nodes with the package (the 17:04 review's P3: shareNodes with foot, stepAll and PR31's split,
#     unread before), the splits as registered, R on RS's side (RH) under PSNX printed (the review's (1)(d)), PR31's lines;
# (R) THE REPRODUCTION: S370's CX and SNRX, CXW and S130's CX and CXW (audit-topcell.mjs `repro`) on this code at the preview,
#     equal byte for byte to COPY-X's, COPY-W's and COPY-B's preflights (results/copyx-preflight/main, copyw-preflight/main,
#     copyb-preflight/main, each behind its reducer's preflight gate): the reuse's fair-test (the code accepted, not SAME);
# (I) identity-topcell.mjs: S130's and S128's one bridge year, A*_1 against the plan's split and the package's tables against
#     the plan's (PX against CX, PSNX against SNRX) at 4 points (the review's one-bridge identity; S128's package cells run only
#     if they differ);
# (B) the rules themselves on this code: research/tests/adaptive-step.test.mjs (stepAll), reader-copy.test.mjs (the copy rule),
#     reader-ru.test.mjs ('ru' and 'rsu', the else-if plant), share-nodes.test.mjs (SN's nodes) and pr31-split.test.mjs (PR31's
#     split, its gate's test), every verdict PASS;
# (C) the plants, each refusing its job (exit 3) on its own check, on S370's PSNX (part 2 of 11: the package, SN's nodes and
#     'rsu'): foot, stepoff, nodes and rsu (armTook), stepramp (stepTook), own and layer (identity), quad (qfTook), held
#     (layerTook), score (scoreTook's scorePaths leg), trace (scoreTook's counters leg), split (the probe without RU's factor:
#     splitTook), class (copyTook).
set -u
OUT=research/solver/results/topcell-preflight
rm -rf "$OUT"; mkdir -p "$OUT/main" "$OUT/repro"
PL="foot stepoff stepramp nodes rsu own layer quad held score trace split class"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
NJ=$(node research/solver/audit-topcell.mjs --units | tail -1); NR=$(node research/solver/audit-topcell.mjs --repro-units | tail -1)
[ "$NJ" = 11 ] && [ "$NR" = 5 ] || { echo "TOP-CELL preflight: audit-topcell.mjs names $NJ jobs and $NR reproduction jobs, not 11 and 5"; exit 1; }
TESTS="adaptive-step reader-copy reader-ru share-nodes pr31-split"
{ printf 't%s\n' $TESTS; echo idt; seq 0 10 | sed 's/^/m/'; seq 0 4 | sed 's/^/r/'; printf '%s\n' $PL; } | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/topcell-preflight; A="15 40"
  case {} in
    m*) k=$(echo {} | cut -c2-); DIAGTOPCELL_OUT=$O/main node research/solver/audit-topcell.mjs $A part $k/11 7002 > $O/main/case$k.txt 2>&1; echo "{} exit $?" > $O/main/exit$k ;;
    r*) k=$(echo {} | cut -c2-); DIAGTOPCELL_OUT=$O/repro node research/solver/audit-topcell.mjs $A repro $k/5 7002 > $O/repro/case$k.txt 2>&1; echo "{} exit $?" > $O/repro/exit$k ;;
    t*) t=$(echo {} | cut -c2-); node research/tests/$t.test.mjs > $O/test-$t.txt 2>&1; echo "$t exit $?" > $O/test-$t-exit.txt ;;
    idt) node research/solver/identity-topcell.mjs > $O/identity.txt 2>&1; echo "identity exit $?" > $O/identity-exit.txt ;;
    *) TOPCELL_PLANT={} DIAGTOPCELL_OUT=$O/plant-{} node research/solver/audit-topcell.mjs $A part 2/11 7002 > $O/plant-{}/case2.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0; R=research/solver/reduce-topcell.mjs; S=research/solver/results
for f in "$OUT"/main/exit* "$OUT"/repro/exit*; do grep -q " exit 0" "$f" || { echo "$(cat $f): A JOB DID NOT FINISH ($f) - the preflight fails"; grep -h "audit-topcell:" "$OUT"/main/case*.txt "$OUT"/repro/case*.txt | head -3; bad=1; }; done
echo "A. $(ls "$OUT"/main/exit* | wc -l) jobs, $(grep -l ' exit 0' "$OUT"/main/exit* | wc -l) finished; R. $(ls "$OUT"/repro/exit* | wc -l) reproduction jobs, $(grep -l ' exit 0' "$OUT"/repro/exit* | wc -l) finished"
node $R "$OUT/main" 40 15 $S/copyb-preflight/main "$OUT/repro" --preflight > "$OUT/reduce.txt" 2>&1 || { echo "THE GATE OR THE REPRODUCTION REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
grep -v "^ok  " "$OUT/reduce.txt" | cut -c1-300
grep -h "adaptive \|clamped \|bridge .*: reader years" "$OUT"/main/case*.txt | sed 's/^ *//' | cut -c1-200
echo "I. $(cat "$OUT/identity-exit.txt"): $(grep -v '^TOP-CELL' "$OUT/identity.txt" | tr '\n' ' ' | cut -c1-900)"
grep -q "identity exit 0" "$OUT/identity-exit.txt" && grep -q "^VERDICT:" "$OUT/identity.txt" || { echo "THE ONE-BRIDGE IDENTITY DID NOT READ - the preflight fails"; bad=1; }
for t in $TESTS; do
  echo "B. $(cat "$OUT/test-$t-exit.txt"): $(grep -c '^PASS' "$OUT/test-$t.txt") PASS, $(grep -c '^FAIL\|AssertionError' "$OUT/test-$t.txt") FAIL; $(tail -1 "$OUT/test-$t.txt" | cut -c1-160)"
  grep -q "$t exit 0" "$OUT/test-$t-exit.txt" && ! grep -q "^FAIL\|AssertionError" "$OUT/test-$t.txt" || { echo "THE $t TEST DID NOT PASS ON THIS CODE - the preflight fails"; bad=1; }
done
want() { case $1 in foot|stepoff|nodes|rsu) echo "the job's settings did not take";; stepramp) echo "a read just under an earlier bridge year's own step is not 0";; own|layer) echo "the ledger does not close on every path";; quad) echo "the fine rule's machinery does not reproduce";; held) echo "a bridge visit's G is filed under a layer other than the tiers held";; score) echo "the whole score does not reproduce reduce-7t.mjs's over the trace";; trace) echo "the trace disagrees with runPolicy's own counters";; split) echo "a bridge-year read is not given back by its split";; class) echo "the copied nodes recounted at line 0.6 are not the solve's";; esac; }
for p in $PL; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-topcell:' "$OUT/plant-$p"/case*.txt | head -1); echo "C. $e: $(echo "$m" | cut -c1-200)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
[ $bad -eq 0 ] && echo "the gate passed the eleven jobs on S370, S130 and S128; the reproduction equals COPY-X's, COPY-W's and COPY-B's preflights byte for byte on this code; the one-bridge identity read; the adaptive step, reader copy, reader RU, share nodes and PR31 split tests passed on this code; the thirteen plants refused, each on its own check"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
