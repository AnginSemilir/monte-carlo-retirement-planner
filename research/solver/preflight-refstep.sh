#!/bin/bash
# REF-STEP's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-refstep.md), seed 7002, 40 paths a world,
# PAR jobs at a time (default 4):
# (A) the ten jobs at a fifteenth of the points, read by reduce-refstep.mjs --preflight (its gate and files; no figure read for
#     an item: a preview at a fraction of the points, PREVIEW): the adaptive reference with its fix on every adaptive job and its
#     own record printed, stepAll on AN3 and AR3 alone with stepTook in full and each earlier bridge year's steps printed, the RS
#     split on AR3 alone, PR31's chooser's split beside A*_t; THE REPRODUCTION at the preview: AN's and C's files equal, byte for
#     byte, REF-B's, COPY-B's and COPY-X's preflights' (results/refb-preflight/main, copyb-preflight/main, copyx-preflight/main,
#     each behind its own reducer's preflight gate); the reach (bridge years, bridge failures by world, the reads at the clamp);
# (B) the rules themselves on this code: research/tests/adaptive-corner.test.mjs (the reference without stepAll at S362's
#     corners against its own rule run forward: the off path), research/tests/adaptive-step.test.mjs (stepAll's steps against
#     the rule run forward, its plant 'stepramp' caught) and research/tests/reader-copy.test.mjs, every verdict PASS;
# (C) the plants, each refusing its job (exit 3) on its own check, on S362's AN3 (seven bridge years, a step at year 3: PLANTS):
#     foot (armTook: the reference's fix held to the arm's), stepoff (armTook: stepAll held to the arm's), stepramp (stepTook:
#     adaptive.js's plant reads the lattice's ramp just under the year-3 step), own and layer (identity), quad (qfTook), held
#     (layerTook), score (scoreTook's scorePaths leg), trace (scoreTook's counters leg), split (RU's scaling: splitTook), class
#     (copyTook).
set -u
OUT=research/solver/results/refstep-preflight
rm -rf "$OUT"; mkdir -p "$OUT/main"
PL="foot stepoff stepramp own layer quad held score trace split class"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
NJ=$(node research/solver/audit-refstep.mjs --units | tail -1)
[ "$NJ" = 10 ] || { echo "REF-STEP preflight: audit-refstep.mjs names $NJ jobs, not 10"; exit 1; }
{ echo act; echo ast; seq 0 9 | sed 's/^/m/'; echo rct; printf '%s\n' $PL; } | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/refstep-preflight; A="15 40"
  case {} in
    m*) k=$(echo {} | cut -c2-); DIAGREFSTEP_OUT=$O/main node research/solver/audit-refstep.mjs $A part $k/10 7002 > $O/main/case$k.txt 2>&1; echo "{} exit $?" > $O/main/exit$k ;;
    act) node research/tests/adaptive-corner.test.mjs > $O/adaptive-corner.txt 2>&1; echo "adaptive-corner exit $?" > $O/adaptive-corner-exit.txt ;;
    ast) node research/tests/adaptive-step.test.mjs > $O/adaptive-step.txt 2>&1; echo "adaptive-step exit $?" > $O/adaptive-step-exit.txt ;;
    rct) node research/tests/reader-copy.test.mjs > $O/reader-copy.txt 2>&1; echo "reader-copy exit $?" > $O/reader-copy-exit.txt ;;
    *) REFSTEP_PLANT={} DIAGREFSTEP_OUT=$O/plant-{} node research/solver/audit-refstep.mjs $A part 3/10 7002 > $O/plant-{}/case3.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0; R=research/solver/reduce-refstep.mjs; S=research/solver/results
for f in "$OUT"/main/exit*; do grep -q " exit 0" "$f" || { echo "$(cat $f): A JOB DID NOT FINISH ($f) - the preflight fails"; grep -h "audit-refstep:" "$OUT"/main/case*.txt | head -3; bad=1; }; done
echo "A. $(ls "$OUT"/main/exit* | wc -l) jobs, $(grep -l ' exit 0' "$OUT"/main/exit* | wc -l) finished"
node $R "$OUT/main" 40 15 $S/refb-preflight/main $S/copyb-preflight/main $S/copyx-preflight/main --preflight > "$OUT/reduce.txt" 2>&1 || { echo "THE GATE OR THE REPRODUCTION REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
grep -v "^ok  " "$OUT/reduce.txt" | cut -c1-300
grep -h "adaptive \|clamped \|bridge .*: reader years" "$OUT"/main/case*.txt | sed 's/^ *//' | cut -c1-200
for t in adaptive-corner adaptive-step; do
  echo "B. $(cat "$OUT/$t-exit.txt"): $(grep -c 'all passed' "$OUT/$t.txt") all-passed line; $(grep -E '^(PASS|FAIL)' "$OUT/$t.txt" | tail -3 | cut -c1-200 | tr '\n' ' ')"
  grep -q "$t exit 0" "$OUT/$t-exit.txt" && grep -q "^$t: all passed" "$OUT/$t.txt" || { echo "THE $t TEST DID NOT PASS ON THIS CODE - the preflight fails"; bad=1; }
done
echo "B. $(cat "$OUT/reader-copy-exit.txt"): $(grep -c '^PASS' "$OUT/reader-copy.txt") PASS, $(grep -c '^FAIL\|AssertionError' "$OUT/reader-copy.txt") FAIL"
grep -q "reader-copy exit 0" "$OUT/reader-copy-exit.txt" && ! grep -q "^FAIL\|AssertionError" "$OUT/reader-copy.txt" || { echo "THE READER-COPY TEST DID NOT PASS ON THIS CODE - the preflight fails"; bad=1; }
want() { case $1 in foot|stepoff) echo "the job's settings did not take";; stepramp) echo "a read just under an earlier bridge year's own step is not 0";; own|layer) echo "the ledger does not close on every path";; quad) echo "the fine rule's machinery does not reproduce";; held) echo "a bridge visit's G is filed under a layer other than the tiers held";; score) echo "the whole score does not reproduce reduce-7t.mjs's over the trace";; trace) echo "the trace disagrees with runPolicy's own counters";; split) echo "a bridge-year read is not given back by its split";; class) echo "the copied nodes recounted at line 0.6 are not the solve's";; esac; }
for p in $PL; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-refstep:' "$OUT/plant-$p"/case*.txt | head -1); echo "C. $e: $(echo "$m" | cut -c1-200)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
[ $bad -eq 0 ] && echo "the gate passed the ten jobs on S370, S362, S364 and S360 and AN's and C's files reproduce the sources' preflights byte for byte; the adaptive reference with its fix on every adaptive job, stepAll on AN3 and AR3 alone, the RS split on AR3 alone; the adaptive corner, adaptive step and reader-copy tests passed on this code; the eleven plants refused, each on its own check"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
