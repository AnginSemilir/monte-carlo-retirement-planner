#!/bin/bash
# REF-B's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-refb.md), seed 7002, 40 paths a world, PAR
# jobs at a time (default 4):
# (A) the seven jobs at a fifteenth of the points, read by reduce-refb.mjs --preflight (its gate and files; no figure read for an
#     item: a preview at a fraction of the points, PREVIEW): the adaptive reference with its fix on every job and its own record
#     printed (moves made, no non-monotone node), the RS split on AR and ARX alone, the copy rule on ARX alone, the copied nodes
#     recounted, every bridge-year read given back by its four parts with RS's scaling; the reach (each household's bridge
#     years, bridge failures by world, the copied nodes, the reads at the clamp) printed for the registration;
# (B) the rules themselves on this code: research/tests/adaptive-corner.test.mjs (the reference at S362's corners against its
#     own rule run forward, HO-DEP's design-reviewed gate test, last run on 18 Oct before COPY-X's and STEP-O182's builds) and
#     research/tests/reader-copy.test.mjs, every verdict PASS;
# (C) the plants, each refusing its job (exit 3) on its own check, on S362 (seven bridge years, where a move taken can differ
#     from the tiers held: PLANTS): foot on S362's AR (armTook: the reference's fix held to the arm's), cxw on S362's ARX
#     (armTook), own and layer (identity), quad (qfTook), held (layerTook), score (scoreTook's scorePaths leg), trace
#     (scoreTook's counters leg), split (RS's scaling replaced by RU's: splitTook), class (copyTook), each on S362's AR.
set -u
OUT=research/solver/results/refb-preflight
rm -rf "$OUT"; mkdir -p "$OUT/main"
PL="foot cxw own layer quad held score trace split class"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
NJ=$(node research/solver/audit-refb.mjs --units | tail -1)
[ "$NJ" = 7 ] || { echo "REF-B preflight: audit-refb.mjs names $NJ jobs, not 7"; exit 1; }
{ echo act; seq 0 6 | sed 's/^/m/'; echo rct; printf '%s\n' $PL; } | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/refb-preflight; A="15 40"
  case {} in
    m*) k=$(echo {} | cut -c2-); DIAGREFB_OUT=$O/main node research/solver/audit-refb.mjs $A part $k/7 7002 > $O/main/case$k.txt 2>&1; echo "{} exit $?" > $O/main/exit$k ;;
    act) node research/tests/adaptive-corner.test.mjs > $O/adaptive-corner.txt 2>&1; echo "adaptive-corner exit $?" > $O/adaptive-corner-exit.txt ;;
    rct) node research/tests/reader-copy.test.mjs > $O/reader-copy.txt 2>&1; echo "reader-copy exit $?" > $O/reader-copy-exit.txt ;;
    cxw) REFB_PLANT=cxw DIAGREFB_OUT=$O/plant-cxw node research/solver/audit-refb.mjs $A part 4/7 7002 > $O/plant-cxw/case4.txt 2>&1; echo "plant cxw exit $?" > $O/plant-cxw/exit.txt ;;
    *) REFB_PLANT={} DIAGREFB_OUT=$O/plant-{} node research/solver/audit-refb.mjs $A part 3/7 7002 > $O/plant-{}/case3.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0; R=research/solver/reduce-refb.mjs
for f in "$OUT"/main/exit*; do grep -q " exit 0" "$f" || { echo "$(cat $f): A JOB DID NOT FINISH ($f) - the preflight fails"; grep -h "audit-refb:" "$OUT"/main/case*.txt | head -3; bad=1; }; done
echo "A. $(ls "$OUT"/main/exit* | wc -l) jobs, $(grep -l ' exit 0' "$OUT"/main/exit* | wc -l) finished"
node $R "$OUT/main" 40 15 --preflight | tail -10 | cut -c1-300
node $R "$OUT/main" 40 15 --preflight > /dev/null || { echo "THE GATE REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
grep -h "adaptive \|clamped \|bridge .*: reader years" "$OUT"/main/case*.txt | sed 's/^ *//' | cut -c1-200
echo "B. $(cat "$OUT/adaptive-corner-exit.txt"): $(grep -c 'all passed' "$OUT/adaptive-corner.txt") all-passed line; $(tail -4 "$OUT/adaptive-corner.txt" | head -2 | cut -c1-240)"
grep -q "adaptive-corner exit 0" "$OUT/adaptive-corner-exit.txt" && grep -q "^adaptive-corner: all passed" "$OUT/adaptive-corner.txt" || { echo "THE ADAPTIVE CORNER TEST DID NOT PASS ON THIS CODE - the preflight fails"; bad=1; }
echo "B. $(cat "$OUT/reader-copy-exit.txt"): $(grep -c '^PASS' "$OUT/reader-copy.txt") PASS, $(grep -c '^FAIL\|AssertionError' "$OUT/reader-copy.txt") FAIL"
grep -q "reader-copy exit 0" "$OUT/reader-copy-exit.txt" && ! grep -q "^FAIL\|AssertionError" "$OUT/reader-copy.txt" || { echo "THE READER-COPY TEST DID NOT PASS ON THIS CODE - the preflight fails"; bad=1; }
want() { case $1 in foot|cxw) echo "the job's settings did not take";; own|layer) echo "the ledger does not close on every path";; quad) echo "the fine rule's machinery does not reproduce";; held) echo "a bridge visit's G is filed under a layer other than the tiers held";; score) echo "the whole score does not reproduce reduce-7t.mjs's over the trace";; trace) echo "the trace disagrees with runPolicy's own counters";; split) echo "a bridge-year read is not given back by its split";; class) echo "the copied nodes recounted at line 0.6 are not the solve's";; esac; }
for p in $PL; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-refb:' "$OUT/plant-$p"/case*.txt | head -1); echo "C. $e: $(echo "$m" | cut -c1-200)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
[ $bad -eq 0 ] && echo "the gate passed the seven jobs on S370, S362 and S130; the adaptive reference with its fix on every job, the RS split on AR and ARX alone, the copy rule on ARX alone, with the candidate's settings; the adaptive corner and reader-copy tests passed on this code; the ten plants refused, each on its own check"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
