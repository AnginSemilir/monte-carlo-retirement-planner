#!/bin/bash
# AO's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-ao.md), at a fifteenth of the points and
# 40 paths a world (P on 400 on AO and AOL), seed 7002: (A) BO-off - NODE-AX's BO preflight job rerun on this code against
# the saved one, bit for bit (compare-preflight.mjs; AN's BN-off does not cover BO); (B) AO, AOL, CO and A6, read by
# reduce-ao.mjs --preflight (its gate and files; no figure read); (C) the plants, each of which must make its job refuse
# (exit 3) on its own check: arm on AO (armTook), pair and force on CO (pairTook, forceIdentity), and on A6 arm (armTook),
# drift, choice and step (refTook); (D) the drift plant on AO, a fault in p the reported tail check must flag in at least
# one cell (the run itself goes on: the tail check refuses nothing). PAR jobs at a time (default 4).
set -u
OUT=research/solver/results/ao-preflight
rm -rf "$OUT"; mkdir -p "$OUT/bo" "$OUT/ao"
PL="arm pair force drift a6-arm a6-drift a6-choice a6-step"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
printf '%s\n' bo ao0 ao1 ao2 a6 $PL | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/ao-preflight; A="15 40"
  case {} in
    bo) DIAGNODEAX_OUT=$O/bo node research/solver/audit-nodeax.mjs $A part 1/2 7002 > $O/bo/case1.txt 2>&1; echo "bo exit $?" > $O/bo/exit.txt ;;
    ao0|ao1|ao2) k=$(echo {} | cut -c3); DIAGAO_OUT=$O/ao node research/solver/audit-ao.mjs $A part $k/3 7002 > $O/ao/case$k.txt 2>&1; echo "{} exit $?" > $O/ao/exit$k ;;
    a6) AN_JOB=A6 DIAGAN_OUT=$O/ao node research/solver/audit-an.mjs $A part 0/1 7002 > $O/ao/case3.txt 2>&1; echo "a6 exit $?" > $O/ao/exit3 ;;
    arm|drift) AO_PLANT={} DIAGAO_OUT=$O/plant-{} node research/solver/audit-ao.mjs $A part 0/3 7002 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
    pair|force) AO_PLANT={} DIAGAO_OUT=$O/plant-{} node research/solver/audit-ao.mjs $A part 2/3 7002 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
    a6-*) p=$(echo {} | cut -c4-); AN_JOB=A6 AN_PLANT=$p DIAGAN_OUT=$O/plant-{} node research/solver/audit-an.mjs $A part 0/1 7002 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0
cat "$OUT/bo/exit.txt" "$OUT"/ao/exit0 "$OUT"/ao/exit1 "$OUT"/ao/exit2 "$OUT"/ao/exit3
echo "A. $(node research/solver/compare-preflight.mjs research/solver/results/nodeax-preflight "$OUT/bo" S360-BO-P60S6Q5.json.gz case1.txt | tail -1)"
node research/solver/compare-preflight.mjs research/solver/results/nodeax-preflight "$OUT/bo" S360-BO-P60S6Q5.json.gz case1.txt > /dev/null || { echo "BO-OFF FAILED - the preflight fails"; bad=1; }
grep -hE "adaptive |checks |refTail|runs |solve CAND" "$OUT"/ao/case*.txt | cut -c1-220
echo "B. $(node research/solver/reduce-ao.mjs "$OUT/ao" 40 15 --preflight | tail -2 | tr '\n' ' ' | cut -c1-400)"
for k in 0 1 2 3; do grep -q " exit 0" "$OUT/ao/exit$k" || { echo "JOB $k DID NOT FINISH - the preflight fails"; bad=1; }; done
node research/solver/reduce-ao.mjs "$OUT/ao" 40 15 --preflight > /dev/null || { echo "THE GATE REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
# each plant must refuse on its own check, not an earlier one (AN's first preflight: every plant stopped at armTook)
want() { case $1 in arm|a6-arm) echo "the job's settings did not take";; pair) echo "the forced pair is not the registered tiers";;
  force) echo "forcing CAND's own opening did not reproduce its run";; a6-drift|a6-choice|a6-step) echo "does not match its own rule run forward";; esac; }
for p in arm pair force a6-arm a6-drift a6-choice a6-step; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-ao:\|audit-an:' "$OUT/plant-$p/case0.txt" | head -1); echo "C. $e: $(echo "$m" | cut -c1-170)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
d=$(grep -h "refTail" "$OUT/plant-drift/case0.txt"); u=$(grep -h "refTail AO" "$OUT/ao/case0.txt")
echo "D. drift: $(cat "$OUT/plant-drift/exit.txt"): $d"; echo "   unplanted: $u"
off=$(echo "$d" | sed -n 's/.*cells [0-9]* off \([0-9]*\);.*/\1/p')
if [ -z "$off" ] || [ "$off" -lt 1 ]; then echo "THE DRIFT PLANT WAS NOT FLAGGED BY THE TAIL CHECK - the preflight fails"; bad=1; fi
[ $bad -eq 0 ] && echo "the seven plants refused, each on its own check (exit 3), and the tail check flagged the drift plant"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
