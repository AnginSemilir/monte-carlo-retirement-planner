#!/bin/bash
# AOR's preflight, its second step (PREDICTION="none:..."): the rs plant at a scale whose copied corners are alive. At a
# fifteenth of the points every copied corner at S364's year-1 reads is dead (R about 0.00007 points of a read: the first
# step, runs.log 16 Oct, and AO's preflights), so ARS's RS scaling changes nothing there and the rs plant passed (the CORNERS
# line, O171). Here ARS runs at half the points (30), 40 paths a world, seed 7002: unplanted, its decomposition must sum to
# the table in every world with R alive (a residual over 0.01 points in world 0), and with AOR_PLANT=rs it must refuse on
# decompTook (exit 3).
set -u
OUT=research/solver/results/aor-preflight-rs
rm -rf "$OUT"; mkdir -p "$OUT/ars" "$OUT/plant-rs"
printf '%s\n' ars rs | xargs -P 2 -I{} sh -c '
  O=research/solver/results/aor-preflight-rs
  case {} in
    ars) DIAGAOR_OUT=$O/ars node research/solver/audit-aor.mjs 2 40 part 1/2 7002 > $O/ars/case1.txt 2>&1; echo "ars exit $?" > $O/ars/exit.txt ;;
    rs) AOR_PLANT=rs DIAGAOR_OUT=$O/plant-rs node research/solver/audit-aor.mjs 2 40 part 1/2 7002 > $O/plant-rs/case0.txt 2>&1; echo "plant rs exit $?" > $O/plant-rs/exit.txt ;;
  esac'
bad=0
cat "$OUT/ars/exit.txt" "$OUT/plant-rs/exit.txt"
grep -hE "solve CAND|decomp |checks " "$OUT/ars/case1.txt" | cut -c1-200
grep -h "decomp " "$OUT/plant-rs/case0.txt" | cut -c1-200
[ "$(cat "$OUT/ars/exit.txt")" = "ars exit 0" ] || { echo "ARS AT 30 POINTS DID NOT FINISH - the preflight fails"; bad=1; }
r0=$(grep -h "decomp ARS/P60S6Q5 0:" "$OUT/ars/case1.txt" | sed -n 's/.* residual \([0-9.]*\) .*/\1/p')
awk -v r="$r0" 'BEGIN { exit !(r > 0.01) }' || { echo "WORLD 0'S RESIDUAL ($r0 points) IS NOT ALIVE AT 30 POINTS - the rs plant cannot show; the preflight fails"; bad=1; }
m=$(grep -h 'audit-aor:' "$OUT/plant-rs/case0.txt" | head -1); echo "C. $(cat "$OUT/plant-rs/exit.txt"): $(echo "$m" | cut -c1-170)"
if [ "$(cat "$OUT/plant-rs/exit.txt")" != "plant rs exit 3" ] || ! echo "$m" | grep -qF "the read's decomposition does not sum"; then echo "PLANT rs NOT REFUSED ON ITS OWN CHECK - the preflight fails"; bad=1; fi
[ $bad -eq 0 ] && echo "R alive in world 0 at 30 points (residual $r0 points), the decomposition summing unplanted, the rs plant refused on decompTook"
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $bad
