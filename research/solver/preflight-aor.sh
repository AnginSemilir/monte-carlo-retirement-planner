#!/bin/bash
# AOR's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-aor.md), at a fifteenth of the points and
# 40 paths a world, seed 7002: (A) A6-off - A6's preflight job (AO's second preflight) rerun on this code against the saved
# one, bit for bit (compare-preflight.mjs); (B) AOP, ARS and A6RS, read by reduce-aor.mjs --preflight (its stamp split by
# audit on these logs, its gate and files; no figure read: AO's STAMPS line); (C) the plants, each of which must make its
# job refuse (exit 3) on its own check: arm on AOP (armTook), weights on AOP and rs on ARS (decompTook), force on ARS
# (forceIdentity), arm on A6RS (armTook). PAR jobs at a time (default 4).
set -u
OUT=research/solver/results/aor-preflight
rm -rf "$OUT"; mkdir -p "$OUT/a6" "$OUT/aor"
PL="arm weights rs force a6rs-arm"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
printf '%s\n' a6 aor0 aor1 a6rs $PL | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/aor-preflight; A="15 40"
  case {} in
    a6) AN_JOB=A6 DIAGAN_OUT=$O/a6 node research/solver/audit-an.mjs $A part 0/1 7002 > $O/a6/case3.txt 2>&1; echo "a6 exit $?" > $O/a6/exit.txt ;;
    aor0|aor1) k=$(echo {} | cut -c4); DIAGAOR_OUT=$O/aor node research/solver/audit-aor.mjs $A part $k/2 7002 > $O/aor/case$k.txt 2>&1; echo "{} exit $?" > $O/aor/exit$k ;;
    a6rs) AN_JOB=A6RS DIAGAN_OUT=$O/aor node research/solver/audit-an.mjs $A part 0/1 7002 > $O/aor/case2.txt 2>&1; echo "a6rs exit $?" > $O/aor/exit2 ;;
    arm|weights) AOR_PLANT={} DIAGAOR_OUT=$O/plant-{} node research/solver/audit-aor.mjs $A part 0/2 7002 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
    rs|force) AOR_PLANT={} DIAGAOR_OUT=$O/plant-{} node research/solver/audit-aor.mjs $A part 1/2 7002 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
    a6rs-arm) AN_JOB=A6RS AN_PLANT=arm DIAGAN_OUT=$O/plant-{} node research/solver/audit-an.mjs $A part 0/1 7002 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0
cat "$OUT/a6/exit.txt" "$OUT"/aor/exit0 "$OUT"/aor/exit1 "$OUT"/aor/exit2
echo "A. $(node research/solver/compare-preflight.mjs research/solver/results/ao-preflight/ao "$OUT/a6" S360-A6-P60S6Q5.json.gz case3.txt | tail -1)"
node research/solver/compare-preflight.mjs research/solver/results/ao-preflight/ao "$OUT/a6" S360-A6-P60S6Q5.json.gz case3.txt > /dev/null || { echo "A6-OFF FAILED - the preflight fails"; bad=1; }
grep -hE "adaptive |checks |decomp |refTail|runs |solve CAND" "$OUT"/aor/case*.txt | cut -c1-220
echo "B. $(node research/solver/reduce-aor.mjs "$OUT/aor" 40 15 --preflight | tail -2 | tr '\n' ' ' | cut -c1-400)"
for k in 0 1 2; do grep -q " exit 0" "$OUT/aor/exit$k" || { echo "JOB $k DID NOT FINISH - the preflight fails"; bad=1; }; done
node research/solver/reduce-aor.mjs "$OUT/aor" 40 15 --preflight > /dev/null || { echo "THE GATE REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
want() { case $1 in arm|a6rs-arm) echo "the job's settings did not take";; weights|rs) echo "the read's decomposition does not sum";; force) echo "forcing CAND's own opening did not reproduce its run";; esac; }
for p in $PL; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-aor:\|audit-an:' "$OUT/plant-$p/case0.txt" | head -1); echo "C. $e: $(echo "$m" | cut -c1-170)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
[ $bad -eq 0 ] && echo "the five plants refused, each on its own check (exit 3)"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
