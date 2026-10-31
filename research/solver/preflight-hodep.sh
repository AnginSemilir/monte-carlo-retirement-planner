#!/bin/bash
# HO-DEP's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-hodep.md), seed 7004, 40 paths a
# world, PAR jobs at a time (default 4):
# (A) the four jobs at a fifteenth of the points, read by reduce-hodep.mjs --preflight (its gate and files; no figure read);
# (B) K1F reproduces FOOT-S366's K1F: this code's K1F at a fifteenth of the points equal on every array both files carry to
#     FOOT-S366's preflight K1F (results/foot-preflight/main, the same points, paths and seed), so FOOT's saved K1F pairs
#     with this code's jobs as the reducer's gate requires;
# (C) the plants, each refusing its job (exit 3) on its own check: arm on K1F (footTook), guard on A (armTook: R1's guard),
#     own and layer on K1F (identity, as FOOT-S366's on K1), quad on K1F (qfTook), held on K1F (layerTook), score on K1F
#     (scoreTook's scorePaths leg), trace on K1F (scoreTook's counters leg, which a trace a year short fails first).
set -u
H2=$(sed -n "s/^export const HOUSE2 = '\(.*\)';$/\1/p" research/solver/audit-hodep.mjs)
[ -n "$H2" ] || { echo "HO-DEP preflight: HOUSE2 is not set in audit-hodep.mjs (the reach step names it)"; exit 1; }
OUT=research/solver/results/hodep-preflight
rm -rf "$OUT"; mkdir -p "$OUT/main"
PL="arm guard own layer quad held score trace"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
NJ=$(node research/solver/audit-hodep.mjs --units | tail -1)
[ "$NJ" = 4 ] || { echo "HO-DEP preflight: audit-hodep.mjs names $NJ jobs, not 4"; exit 1; }
printf '%s\n' m0 m1 m2 m3 $PL | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/hodep-preflight; A="15 40"
  case {} in
    m0|m1|m2|m3) k=$(echo {} | cut -c2); DIAGHODEP_OUT=$O/main node research/solver/audit-hodep.mjs $A part $k/4 7004 > $O/main/case$k.txt 2>&1; echo "{} exit $?" > $O/main/exit$k ;;
    arm) HODEP_PLANT=arm DIAGHODEP_OUT=$O/plant-arm node research/solver/audit-hodep.mjs $A part 0/4 7004 > $O/plant-arm/case0.txt 2>&1; echo "plant arm exit $?" > $O/plant-arm/exit.txt ;;
    guard) HODEP_PLANT=guard DIAGHODEP_OUT=$O/plant-guard node research/solver/audit-hodep.mjs $A part 2/4 7004 > $O/plant-guard/case2.txt 2>&1; echo "plant guard exit $?" > $O/plant-guard/exit.txt ;;
    *) HODEP_PLANT={} DIAGHODEP_OUT=$O/plant-{} node research/solver/audit-hodep.mjs $A part 0/4 7004 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0; R=research/solver/reduce-hodep.mjs
for f in "$OUT"/main/exit*; do echo "$(cat $f)"; grep -q " exit 0" "$f" || { echo "A JOB DID NOT FINISH ($f) - the preflight fails"; bad=1; }; done
grep -hE "solve CAND|adaptive |foot |guard |whole |checks |score legs " "$OUT"/main/case*.txt | cut -c1-200 | sed 's/^ */A: /'
echo "A. $(node $R "$OUT/main" 40 15 --preflight | tail -6 | tr '\n' ' ' | cut -c1-700)"
node $R "$OUT/main" 40 15 --preflight > /dev/null || { echo "THE GATE REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
r=$(node $R --same research/solver/results/foot-preflight/main/S362-K1F-P30S6Q5.json.gz "$OUT/main/S362-K1F-P30S6Q5.json.gz"); echo "B. FOOT-S366's preflight K1F against this code's: $r"
echo "$r" | grep -q "SAME: identical" || { echo "THIS CODE'S K1F DOES NOT REPRODUCE FOOT-S366'S - the preflight fails"; bad=1; }
want() { case $1 in arm) echo "the fix is not as asked";; guard) echo "the job's settings did not take";; own|layer) echo "the ledger does not close on every path";; quad) echo "the fine rule's machinery does not reproduce";; held) echo "a bridge visit's G is filed under a layer other than the tiers held";; score) echo "the whole score does not reproduce reduce-7t.mjs's over the trace";; trace) echo "the trace disagrees with runPolicy's own counters";; esac; }
for p in $PL; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-hodep:' "$OUT/plant-$p"/case*.txt | head -1); echo "C. $e: $(echo "$m" | cut -c1-200)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
[ $bad -eq 0 ] && echo "the gate passed the four jobs on $H2 and S362; FOOT-S366's K1F reproduced; the eight plants refused, each on its own check"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
