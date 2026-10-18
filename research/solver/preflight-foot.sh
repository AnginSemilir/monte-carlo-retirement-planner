#!/bin/bash
# FOOT-S366's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-foot.md), seed 7004, 40 paths a
# world, PAR jobs at a time (default 4), the 30-point jobs first:
# (A) the four jobs at a fifteenth of the points, read by reduce-foot.mjs --preflight (its gate and files; no figure read);
# (B) the fix inert where no inflow pays its year: FOOT_INERT=1's I0 against I1 (S360) and I2 against I3 (S364), each pair
#     equal to the bit (reduce-foot.mjs --same), and I1 with the reference's plant 'foot' not equal to I0;
# (C) the code with the fix off reproduces AX-HO's S366 step: audit-axho.mjs's J1 and J2 at 30 points on this code, each
#     equal to the bit to results/axho-preflight-s366's (so AX-HO's saved J1 and J2 pair with this code's jobs);
# (D) the plants, each refusing its job (exit 3) on its own check: arm on J1F (footTook), split on J1D (armTook), own and
#     layer on K1 (identity), quad on K1 (qfTook), held on K1 (layerTook);
# (E) J1F at 30 points: the fix's effect where AX-HO's S366 step read J1's world 0 at 99.846 and J2's at 96.146 (reported;
#     seen after derive-foot.mjs's JUDGED block was committed).
set -u
OUT=research/solver/results/foot-preflight
rm -rf "$OUT"; mkdir -p "$OUT/main" "$OUT/inert" "$OUT/inert-plant" "$OUT/off" "$OUT/p30"
PL="arm split own layer quad held"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
printf '%s\n' off0 off2 p30 m0 m1 m2 m3 i0 i1 i2 i3 ip $PL | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/foot-preflight; A="15 40"
  case {} in
    off0|off2) k=$(echo {} | cut -c4); DIAGAXHO_OUT=$O/off node research/solver/audit-axho.mjs 2 40 part $k/5 7004 > $O/off/case$k.txt 2>&1; echo "{} exit $?" > $O/off/exit$k ;;
    p30) DIAGFOOT_OUT=$O/p30 node research/solver/audit-foot.mjs 2 40 part 0/4 7004 > $O/p30/case0.txt 2>&1; echo "p30 exit $?" > $O/p30/exit.txt ;;
    m0|m1|m2|m3) k=$(echo {} | cut -c2); DIAGFOOT_OUT=$O/main node research/solver/audit-foot.mjs $A part $k/4 7004 > $O/main/case$k.txt 2>&1; echo "{} exit $?" > $O/main/exit$k ;;
    i0|i1|i2|i3) k=$(echo {} | cut -c2); FOOT_INERT=1 DIAGFOOT_OUT=$O/inert node research/solver/audit-foot.mjs $A part $k/4 7004 > $O/inert/case$k.txt 2>&1; echo "{} exit $?" > $O/inert/exit$k ;;
    ip) FOOT_INERT=1 FOOT_PLANT=foot DIAGFOOT_OUT=$O/inert-plant node research/solver/audit-foot.mjs $A part 1/4 7004 > $O/inert-plant/case1.txt 2>&1; echo "ip exit $?" > $O/inert-plant/exit.txt ;;
    arm) FOOT_PLANT=arm DIAGFOOT_OUT=$O/plant-arm node research/solver/audit-foot.mjs $A part 0/4 7004 > $O/plant-arm/case0.txt 2>&1; echo "plant arm exit $?" > $O/plant-arm/exit.txt ;;
    split) FOOT_PLANT=split DIAGFOOT_OUT=$O/plant-split node research/solver/audit-foot.mjs $A part 1/4 7004 > $O/plant-split/case1.txt 2>&1; echo "plant split exit $?" > $O/plant-split/exit.txt ;;
    own|layer|quad|held) FOOT_PLANT={} DIAGFOOT_OUT=$O/plant-{} node research/solver/audit-foot.mjs $A part 2/4 7004 > $O/plant-{}/case2.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0; R=research/solver/reduce-foot.mjs
for f in "$OUT"/main/exit* "$OUT"/inert/exit* "$OUT"/inert-plant/exit.txt "$OUT"/off/exit* "$OUT"/p30/exit.txt; do echo "$(cat $f)"; grep -q " exit 0" "$f" || { echo "A JOB DID NOT FINISH ($f) - the preflight fails"; bad=1; }; done
grep -hE "solve CAND|adaptive |foot |checks " "$OUT"/main/case*.txt | cut -c1-200 | sed 's/^ */A: /'
echo "A. $(node $R "$OUT/main" 40 15 --preflight | tail -6 | tr '\n' ' ' | cut -c1-700)"
node $R "$OUT/main" 40 15 --preflight > /dev/null || { echo "THE GATE REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
grep -hE "foot " "$OUT"/inert/case*.txt "$OUT"/inert-plant/case1.txt | cut -c1-120 | sed 's/^ */B: /'
for pr in "S360-I0-P60S6Q5 S360-I1-P60S6Q5" "S364-I2-P60S6Q5 S364-I3-P60S6Q5"; do set -- $pr; r=$(node $R --same "$OUT/inert/$1.json.gz" "$OUT/inert/$2.json.gz"); echo "B. $1 against $2: $r"; echo "$r" | grep -q "SAME: identical" || { echo "THE FIX IS NOT INERT WHERE NO INFLOW PAYS ITS YEAR - the preflight fails"; bad=1; }; done
r=$(node $R --same "$OUT/inert/S360-I0-P60S6Q5.json.gz" "$OUT/inert-plant/S360-I1-P60S6Q5.json.gz"); echo "B. I0 against I1 with the plant 'foot' (must differ): $r"
echo "$r" | grep -q "SAME: DIFFERS" || { echo "THE INERT CHECK PASSED THE PLANT - the preflight fails"; bad=1; }
for k in J1:0:j1 J2:2:j2; do IFS=: read L p d <<< "$k"; r=$(node $R --same "research/solver/results/axho-preflight-s366/$d/S366-$L-P60S6Q5.json.gz" "$OUT/off/S366-$L-P60S6Q5.json.gz"); echo "C. AX-HO's $L at 30 points against this code's: $r"; echo "$r" | grep -q "SAME: identical" || { echo "THIS CODE WITH THE FIX OFF DOES NOT REPRODUCE AX-HO'S $L - the preflight fails"; bad=1; }; done
want() { case $1 in arm) echo "the fix is not as asked";; split) echo "the job's settings did not take";; own|layer) echo "the ledger does not close on every path";; quad) echo "the fine rule's machinery does not reproduce";; held) echo "a bridge visit's G is filed under a layer other than the tiers held";; esac; }
for p in $PL; do
  e=$(cat "$OUT/plant-$p/exit.txt"); m=$(grep -h 'audit-foot:' "$OUT/plant-$p"/case*.txt | head -1); echo "D. $e: $(echo "$m" | cut -c1-170)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
grep -hE "solve CAND|adaptive |foot |tables |ledger " "$OUT/p30/case0.txt" | cut -c1-200 | sed 's/^ */E30: /'
[ $bad -eq 0 ] && echo "the fix inert on S360 and S364 to the bit and the plant seen; AX-HO's S366 step reproduced with the fix off; the six plants refused, each on its own check"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
