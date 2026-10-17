#!/bin/bash
# AX-HO's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-axho.md). PAR jobs at a time
# (default 4), the 30-point jobs first:
# (A) the five jobs at a fifteenth of the points and 40 paths a world, seed 7004, read by reduce-axho.mjs --preflight (its
#     gate and files, the moves differing between each pair's arms printed; no figure read);
# (B) the plants, each of which must make its job refuse (exit 3) on its own check: arm and rs on J1 (armTook), draws on J1
#     (engTook), own and layer on J4 (identity), quad on J4 (qfTook), held on J4 (layerTook);
# (C) the planted change for the differing-moves count: J4 with the nudge plant (its own move's sibling at the first bridge
#     year on every tenth path of world 0) against the clean J4, which must read moves differing in world 0 and none in
#     worlds 1 and 2; the clean J4 against itself none;
# (D) the ledger's copy: J3 at seed 7002 against AOR's preflight A6RS (audit-an.mjs, the same settings, scale and seed:
#     results/aor-preflight/aor), every per-path array, bit set and table equal to the bit; and the same comparison against
#     J3 at seed 7004 (A), which must differ (the check shown to fail on a planted fault);
# (E) at 30 points (half; O171's lesson, the CORNERS line: the copied corners alive), J1 clean and with the arm and rs plants:
#     the clean job's solve, build and runs timed for the projection of S380 at 60 points (the budget, trigger 3), its
#     table beside the rs plant's (the RS split acting at S380's opening read, reported) and both plants refusing on armTook.
set -u
OUT=research/solver/results/axho-preflight
rm -rf "$OUT"; mkdir -p "$OUT/main" "$OUT/nudge" "$OUT/copy" "$OUT/p30"
PL="arm rs draws own layer quad held"
for p in $PL; do mkdir -p "$OUT/plant-$p"; done
printf '%s\n' p30 p30-arm p30-rs m0 m1 m2 m3 m4 nudge copy $PL | xargs -P "${PAR:-4}" -I{} sh -c '
  O=research/solver/results/axho-preflight; A="15 40"
  case {} in
    p30) DIAGAXHO_OUT=$O/p30 node research/solver/audit-axho.mjs 2 40 part 0/5 7004 > $O/p30/case0.txt 2>&1; echo "p30 exit $?" > $O/p30/exit.txt ;;
    p30-arm|p30-rs) p=$(echo {} | cut -c5-); mkdir -p $O/{}; AXHO_PLANT=$p DIAGAXHO_OUT=$O/{} node research/solver/audit-axho.mjs 2 40 part 0/5 7004 > $O/{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/{}/exit.txt ;;
    m0|m1|m2|m3|m4) k=$(echo {} | cut -c2); DIAGAXHO_OUT=$O/main node research/solver/audit-axho.mjs $A part $k/5 7004 > $O/main/case$k.txt 2>&1; echo "{} exit $?" > $O/main/exit$k ;;
    nudge) AXHO_PLANT=nudge DIAGAXHO_OUT=$O/nudge node research/solver/audit-axho.mjs $A part 4/5 7004 > $O/nudge/case4.txt 2>&1; echo "nudge exit $?" > $O/nudge/exit.txt ;;
    copy) DIAGAXHO_OUT=$O/copy node research/solver/audit-axho.mjs $A part 3/5 7002 > $O/copy/case3.txt 2>&1; echo "copy exit $?" > $O/copy/exit.txt ;;
    arm|rs|draws) AXHO_PLANT={} DIAGAXHO_OUT=$O/plant-{} node research/solver/audit-axho.mjs $A part 0/5 7004 > $O/plant-{}/case0.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
    own|layer|quad|held) AXHO_PLANT={} DIAGAXHO_OUT=$O/plant-{} node research/solver/audit-axho.mjs $A part 4/5 7004 > $O/plant-{}/case4.txt 2>&1; echo "plant {} exit $?" > $O/plant-{}/exit.txt ;;
  esac'
bad=0
R=research/solver/reduce-axho.mjs
cat "$OUT"/main/exit0 "$OUT"/main/exit1 "$OUT"/main/exit2 "$OUT"/main/exit3 "$OUT"/main/exit4 "$OUT/nudge/exit.txt" "$OUT/copy/exit.txt" "$OUT/p30/exit.txt"
for k in 0 1 2 3 4; do grep -q " exit 0" "$OUT/main/exit$k" || { echo "JOB $k DID NOT FINISH - the preflight fails"; bad=1; }; done
grep -hE "solve CAND|adaptive |checks |refTail|runs " "$OUT"/main/case*.txt | cut -c1-200
echo "A. $(node $R "$OUT/main" 40 15 --preflight | tail -4 | tr '\n' ' ' | cut -c1-700)"
node $R "$OUT/main" 40 15 --preflight > /dev/null || { echo "THE GATE REFUSED THE PREFLIGHT'S JOBS - the preflight fails"; bad=1; }
want() { case $1 in arm|rs|p30-arm|p30-rs) echo "the job's settings did not take";; draws) echo "the engine leg's draws are not each state's own";; own|layer) echo "the ledger does not close on every path";; quad) echo "the fine rule's machinery does not reproduce";; held) echo "a bridge visit's G is filed under a layer other than the tiers held";; esac; }
for p in $PL p30-arm p30-rs; do
  d="$OUT/plant-$p"; [ -d "$d" ] || d="$OUT/$p"
  e=$(cat "$d/exit.txt"); m=$(grep -h 'audit-axho:' "$d"/case*.txt | head -1); echo "B. $e: $(echo "$m" | cut -c1-170)"
  if [ "$e" != "plant $p exit 3" ] || ! echo "$m" | grep -qF "$(want $p)"; then echo "PLANT $p NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
done
F4=S360-J4-P60S6Q5.json.gz
grep -q " exit 0" "$OUT/nudge/exit.txt" || { echo "THE NUDGED J4 DID NOT FINISH - the preflight fails"; bad=1; }
dn=$(node $R --differ "$OUT/main/$F4" "$OUT/nudge/$F4"); ds=$(node $R --differ "$OUT/main/$F4" "$OUT/main/$F4")
echo "C. nudged against clean: $(echo "$dn" | tr '\n' ';')"; echo "C. clean against itself: $(echo "$ds" | tr '\n' ';')"
p0=$(echo "$dn" | sed -n 's/^DIFFER world 0: paths \([0-9]*\) .*/\1/p'); p12=$(echo "$dn" | sed -n 's/^DIFFER world [12]: paths \([0-9]*\) .*/\1/p' | paste -sd+ | bc)
s0=$(echo "$ds" | sed -n 's/^DIFFER world [012]: paths \([0-9]*\) .*/\1/p' | paste -sd+ | bc)
{ [ "${p0:-0}" -gt 0 ] && [ "${p12:-1}" = 0 ] && [ "${s0:-1}" = 0 ]; } || { echo "THE DIFFERING-MOVES COUNT DID NOT READ THE PLANTED CHANGE (world 0 $p0, worlds 1-2 $p12, clean $s0) - the preflight fails"; bad=1; }
F3=S360-J3-P60S6Q5.json.gz; AN3=research/solver/results/aor-preflight/aor/S360-A6RS-P60S6Q5.json.gz
grep -q " exit 0" "$OUT/copy/exit.txt" || { echo "J3 AT SEED 7002 DID NOT FINISH - the preflight fails"; bad=1; }
echo "D. $(node $R --copy "$AN3" "$OUT/copy/$F3")"; node $R --copy "$AN3" "$OUT/copy/$F3" > /dev/null || { echo "THE LEDGER IS NOT AN'S COPY - the preflight fails"; bad=1; }
echo "D. against seed 7004's J3 (must differ): $(node $R --copy "$AN3" "$OUT/main/$F3")"; node $R --copy "$AN3" "$OUT/main/$F3" > /dev/null && { echo "THE COPY CHECK PASSED ANOTHER SEED - the preflight fails"; bad=1; }
grep -q " exit 0" "$OUT/p30/exit.txt" || { echo "J1 AT 30 POINTS DID NOT FINISH - the preflight fails"; bad=1; }
grep -hE "solve CAND|adaptive |reader |checks |runs |refTail" "$OUT/p30/case0.txt" | cut -c1-200
echo "E. tables at 30 points: clean $(grep -h 'solve CAND' "$OUT/p30/case0.txt" | sed 's/.*table \([0-9.]*\).*/\1/'), rs plant $(grep -h 'solve CAND' "$OUT/p30-rs/case0.txt" | sed 's/.*table \([0-9.]*\).*/\1/'), arm plant $(grep -h 'solve CAND' "$OUT/p30-arm/case0.txt" | sed 's/.*table \([0-9.]*\).*/\1/')"
[ $bad -eq 0 ] && echo "the nine plants refused, each on its own check (exit 3); the differing-moves count read the planted change; the ledger AN's to the bit"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
