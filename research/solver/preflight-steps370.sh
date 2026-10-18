#!/bin/bash
# STEP-S370's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-steps370.md), seed 7002, 40 paths a
# world, PAR jobs at a time (default 4):
# (A) the three jobs at a fifteenth of the points, read by reduce-steps370.mjs --preflight (its gate and files; no figure read):
#     SN's explicit nodes shown to solve with the candidate's other settings (the receipt: its compatibility NOT CHECKED);
# (B) the option inert as a list: research/tests/share-nodes.test.mjs on this code, every verdict PASS (the uniform six nodes
#     give every table of a solve the linear axis's to 1e-9; a dense list locates exactly);
# (C) the plants, each refusing its job (exit 3) on its own check: nodes on SN (armTook), own and layer on C (identity), quad on
#     C (qfTook), held on C (layerTook), score on C (scoreTook's scorePaths leg), trace on C (scoreTook's counters leg).
set -u
OUT=research/solver/results/steps370-preflight
rm -rf "$OUT"; mkdir -p "$OUT/main"
PL="nodes own layer quad held score trace"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
NJ=$(node research/solver/audit-steps370.mjs --units | tail -1)
[ "$NJ" = 3 ] || { echo "STEP-S370 preflight: audit-steps370.mjs names $NJ jobs, not 3"; exit 1; }
printf '%s\n' m0 m1 m2 snt $PL | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/steps370-preflight; A="15 40"
  case {} in
    m0|m1|m2) k=$(echo {} | cut -c2); DIAGSTEPS370_OUT=$O/main node research/solver/audit-steps370.mjs $A part $k/3 7002 > $O/main/case$k.txt 2>&1; echo "{} exit $?" > $O/main/exit$k ;;
    snt) node research/tests/share-nodes.test.mjs > $O/share-nodes.txt 2>&1; echo "share-nodes exit $?" > $O/share-nodes-exit.txt ;;
    nodes) STEPS370_PLANT=nodes DIAGSTEPS370_OUT=$O/plant-nodes node research/solver/audit-steps370.mjs $A part 1/3 7002 > $O/plant-nodes/case1.txt 2>&1; echo "plant nodes exit $?" > $O/plant-nodes/exit.txt ;;
    *) STEPS370_PLANT={} DIAGSTEPS370_OUT=$O/plant-{} node research/solver/audit-steps370.mjs $A part 0/3 7002 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0; R=research/solver/reduce-steps370.mjs
for f in "$OUT"/main/exit*; do echo "$(cat $f)"; grep -q " exit 0" "$f" || { echo "A JOB DID NOT FINISH ($f) - the preflight fails"; bad=1; }; done
grep -hE "solve CAND|ran CAND|reader |nodes |whole |checks |score legs " "$OUT"/main/case*.txt | cut -c1-220 | sed 's/^ */A: /'
echo "A. $(node $R "$OUT/main" 40 15 --preflight | tail -5 | tr '\n' ' ' | cut -c1-700)"
node $R "$OUT/main" 40 15 --preflight > /dev/null || { echo "THE GATE REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
echo "B. $(cat "$OUT/share-nodes-exit.txt"): $(grep -c '^PASS' "$OUT/share-nodes.txt") PASS, $(grep -c '^FAIL\|AssertionError' "$OUT/share-nodes.txt") FAIL"
grep -q "share-nodes exit 0" "$OUT/share-nodes-exit.txt" && ! grep -q "^FAIL\|AssertionError" "$OUT/share-nodes.txt" || { echo "THE SHARE-NODES TEST DID NOT PASS ON THIS CODE - the preflight fails"; bad=1; }
want() { case $1 in nodes) echo "the job's settings did not take";; own|layer) echo "the ledger does not close on every path";; quad) echo "the fine rule's machinery does not reproduce";; held) echo "a bridge visit's G is filed under a layer other than the tiers held";; score) echo "the whole score does not reproduce reduce-7t.mjs's over the trace";; trace) echo "the trace disagrees with runPolicy's own counters";; esac; }
for p in $PL; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-steps370:' "$OUT/plant-$p"/case*.txt | head -1); echo "C. $e: $(echo "$m" | cut -c1-200)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
[ $bad -eq 0 ] && echo "the gate passed the three jobs on S370; SN's nodes solve with the candidate's settings; the share-nodes test passed on this code; the seven plants refused, each on its own check"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
