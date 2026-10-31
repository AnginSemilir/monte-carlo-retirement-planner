#!/bin/bash
# STEP-O182's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-o182.md), seed 7002, 40 paths a
# world, PAR jobs at a time (default 4):
# (A) the three jobs at a fifteenth of the points, read by reduce-o182.mjs --preflight (its gate and files; no figure read for an
#     item: a preview at a fraction of the points, PREVIEW): SNR's split shown to solve with SN's nodes and the candidate's other
#     settings, the copied nodes recounted, every bridge-year read given back by its split;
# (B) the option itself: research/tests/reader-ru.test.mjs on this code, every verdict PASS (every read gives back the arm's own
#     formula under 'ru' and with the option off; the check failing on the scaling left off and turned the other way);
# (C) the plants, each refusing its job (exit 3) on its own check: nodes on SN and snr on SNR (armTook), own and layer on C
#     (identity), quad on C (qfTook), held on C (layerTook), score on C (scoreTook's scorePaths leg), trace on C (scoreTook's
#     counters leg), split on SN (splitTook), class on SN (copyTook).
set -u
OUT=research/solver/results/o182-preflight
rm -rf "$OUT"; mkdir -p "$OUT/main"
PL="nodes snr own layer quad held score trace split class"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
NJ=$(node research/solver/audit-o182.mjs --units | tail -1)
[ "$NJ" = 3 ] || { echo "STEP-O182 preflight: audit-o182.mjs names $NJ jobs, not 3"; exit 1; }
printf '%s\n' m0 m1 m2 rut $PL | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/o182-preflight; A="15 40"
  case {} in
    m0|m1|m2) k=$(echo {} | cut -c2); DIAGO182_OUT=$O/main node research/solver/audit-o182.mjs $A part $k/3 7002 > $O/main/case$k.txt 2>&1; echo "{} exit $?" > $O/main/exit$k ;;
    rut) node research/tests/reader-ru.test.mjs > $O/reader-ru.txt 2>&1; echo "reader-ru exit $?" > $O/reader-ru-exit.txt ;;
    nodes|split|class) O182_PLANT={} DIAGO182_OUT=$O/plant-{} node research/solver/audit-o182.mjs $A part 1/3 7002 > $O/plant-{}/case1.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
    snr) O182_PLANT=snr DIAGO182_OUT=$O/plant-snr node research/solver/audit-o182.mjs $A part 2/3 7002 > $O/plant-snr/case2.txt 2>&1; echo "plant snr exit $?" > $O/plant-snr/exit.txt ;;
    *) O182_PLANT={} DIAGO182_OUT=$O/plant-{} node research/solver/audit-o182.mjs $A part 0/3 7002 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0; R=research/solver/reduce-o182.mjs
for f in "$OUT"/main/exit*; do echo "$(cat $f)"; grep -q " exit 0" "$f" || { echo "A JOB DID NOT FINISH ($f) - the preflight fails"; bad=1; }; done
grep -hE "solve CAND|ran CAND|reader |recount |nodes |whole |checks |clamped |score legs " "$OUT"/main/case*.txt | cut -c1-220 | sed 's/^ */A: /'
echo "A. $(node $R "$OUT/main" 40 15 --preflight | tail -5 | tr '\n' ' ' | cut -c1-900)"
node $R "$OUT/main" 40 15 --preflight > /dev/null || { echo "THE GATE REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
echo "B. $(cat "$OUT/reader-ru-exit.txt"): $(grep -c '^PASS' "$OUT/reader-ru.txt") PASS, $(grep -c '^FAIL\|AssertionError' "$OUT/reader-ru.txt") FAIL"
grep -q "reader-ru exit 0" "$OUT/reader-ru-exit.txt" && ! grep -q "^FAIL\|AssertionError" "$OUT/reader-ru.txt" || { echo "THE READER-RU TEST DID NOT PASS ON THIS CODE - the preflight fails"; bad=1; }
want() { case $1 in nodes|snr) echo "the job's settings did not take";; own|layer) echo "the ledger does not close on every path";; quad) echo "the fine rule's machinery does not reproduce";; held) echo "a bridge visit's G is filed under a layer other than the tiers held";; score) echo "the whole score does not reproduce reduce-7t.mjs's over the trace";; trace) echo "the trace disagrees with runPolicy's own counters";; split) echo "a bridge-year read is not given back by its split";; class) echo "the copied nodes recounted at line 0.6 are not the solve's";; esac; }
for p in $PL; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-o182:' "$OUT/plant-$p"/case*.txt | head -1); echo "C. $e: $(echo "$m" | cut -c1-200)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
[ $bad -eq 0 ] && echo "the gate passed the three jobs on S370; SNR's split solves with SN's nodes and the candidate's settings; the reader-ru test passed on this code; the ten plants refused, each on its own check"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
