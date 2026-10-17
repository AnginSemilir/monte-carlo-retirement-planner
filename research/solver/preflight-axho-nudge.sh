#!/bin/bash
# AX-HO's preflight, its third step (PREDICTION="none:..."): the planted change for the differing-moves count on the nudge
# plant as fixed (another move holding the same tiers; the second launch's sibling did not exist in this menu, so it changed
# no move and the count read 0, results-axho-preflight.txt). J4 clean and nudged at a fifteenth of the points, 40 paths a
# world, seed 7004: the nudged against the clean must read moves differing in world 0 and none in worlds 1 and 2, the clean
# against itself none.
set -u
OUT=research/solver/results/axho-preflight-nudge
rm -rf "$OUT"; mkdir -p "$OUT/clean" "$OUT/nudge"
printf '%s\n' clean nudge | xargs -P 2 -I{} sh -c '
  O=research/solver/results/axho-preflight-nudge
  case {} in
    clean) DIAGAXHO_OUT=$O/clean node research/solver/audit-axho.mjs 15 40 part 4/5 7004 > $O/clean/case4.txt 2>&1; echo "clean exit $?" > $O/clean/exit.txt ;;
    nudge) AXHO_PLANT=nudge DIAGAXHO_OUT=$O/nudge node research/solver/audit-axho.mjs 15 40 part 4/5 7004 > $O/nudge/case4.txt 2>&1; echo "nudge exit $?" > $O/nudge/exit.txt ;;
  esac'
bad=0; R=research/solver/reduce-axho.mjs; F4=S360-J4-P60S6Q5.json.gz
cat "$OUT/clean/exit.txt" "$OUT/nudge/exit.txt"
for d in clean nudge; do grep -q " exit 0" "$OUT/$d/exit.txt" || { echo "J4 $d DID NOT FINISH - the step fails"; bad=1; }; done
dn=$(node $R --differ "$OUT/clean/$F4" "$OUT/nudge/$F4"); ds=$(node $R --differ "$OUT/clean/$F4" "$OUT/clean/$F4")
echo "C. nudged against clean: $(echo "$dn" | tr '\n' ';')"; echo "C. clean against itself: $(echo "$ds" | tr '\n' ';')"
p0=$(echo "$dn" | sed -n 's/^DIFFER world 0: paths \([0-9]*\) .*/\1/p'); p12=$(echo "$dn" | sed -n 's/^DIFFER world [12]: paths \([0-9]*\) .*/\1/p' | paste -sd+ | bc)
s0=$(echo "$ds" | sed -n 's/^DIFFER world [012]: paths \([0-9]*\) .*/\1/p' | paste -sd+ | bc)
{ [ "${p0:-0}" -gt 0 ] && [ "${p12:-1}" = 0 ] && [ "${s0:-1}" = 0 ]; } || { echo "THE DIFFERING-MOVES COUNT DID NOT READ THE PLANTED CHANGE (world 0 $p0, worlds 1-2 $p12, clean $s0) - the step fails"; bad=1; }
[ $bad -eq 0 ] && echo "the differing-moves count read the planted change in world 0 alone, and none on the clean job against itself"
echo "preflight step done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
