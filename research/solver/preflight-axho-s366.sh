#!/bin/bash
# AX-HO's preflight, the S366 step (PREDICTION="none:..."): S366 in S380's place (the maintainer's choice, 17 Oct, after S380's
# two arms moved alike on every path-year at 4 and 30 points). J1 and J2 on S366 at half the points (30), 40 paths a world,
# seed 7004: each must finish (exit 0) with its checks in full, and the moves differing between them are printed - an arm
# equal to its control on every path-year would be a design fault here too (the PREFLIGHT line).
set -u
OUT=research/solver/results/axho-preflight-s366
rm -rf "$OUT"; mkdir -p "$OUT/j1" "$OUT/j2"
printf '%s\n' 0 2 | xargs -P 2 -I{} sh -c '
  O=research/solver/results/axho-preflight-s366; d=j1; [ {} = 2 ] && d=j2
  DIAGAXHO_OUT=$O/$d node research/solver/audit-axho.mjs 2 40 part {}/5 7004 > $O/$d/case{}.txt 2>&1; echo "$d exit $?" > $O/$d/exit.txt'
bad=0; R=research/solver/reduce-axho.mjs
cat "$OUT/j1/exit.txt" "$OUT/j2/exit.txt"
for d in j1 j2; do grep -q " exit 0" "$OUT/$d/exit.txt" || { echo "S366 $d AT 30 POINTS DID NOT FINISH - the step fails"; bad=1; }; grep -h 'audit-axho:' "$OUT"/$d/case*.txt | head -1; done
grep -hE "solve CAND|adaptive |reader |pair |openings |tables |checks |sim .* OWN|simx |runs |refTail" "$OUT"/j1/case*.txt "$OUT"/j2/case*.txt | cut -c1-200 | sed 's/^ */S366: /'
dm=$(node $R --differ "$OUT/j1/S366-J1-P60S6Q5.json.gz" "$OUT/j2/S366-J2-P60S6Q5.json.gz" 2>&1); echo "$dm" | sed 's/^/S366 moves differing, J1 against J2: /'
n=$(echo "$dm" | sed -n 's/^DIFFER world [012]: paths \([0-9]*\) .*/\1/p' | paste -sd+ | bc)
[ "${n:-0}" -gt 0 ] || { echo "S366'S ARMS MOVE ALIKE ON EVERY PATH-YEAR AT 30 POINTS - a design fault, the step fails"; bad=1; }
echo "preflight step done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
