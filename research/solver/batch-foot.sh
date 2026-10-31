#!/bin/bash
# FOOT-S366 (predictions/diag-foot.md): four jobs on four cores, seed 7004, 4,000 paths a world, into results/diagfoot:
# audit-foot.mjs's J1F and J1D (S366 at 60 points) and K1 and K1F (S362 at 30), parts 0-3 of 4; read by reduce-foot.mjs in the
# real tree into results-foot.txt against AX-HO's saved J1 and J2 (results/diagaxho). Ten hours' timeout a job.
set -u
OUT=research/solver/results/diagfoot
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-foot.mjs --units | tail -1)
[ "$NJ" = 4 ] || { echo "FOOT-S366: audit-foot.mjs names $NJ jobs, not 4"; exit 1; }
printf '%s\n' 0 1 2 3 | xargs -P 4 -I{} sh -c '
  O=research/solver/results/diagfoot
  timeout 36000 node research/solver/audit-foot.mjs 1 4000 part {}/4 7004 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}'
cat "$OUT"/exit0 "$OUT"/exit1 "$OUT"/exit2 "$OUT"/exit3
grep -h "Error\|audit-foot:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|adaptive |foot |checks " "$OUT"/case*.txt | cut -c1-200
echo "FOOT-S366 done $(TZ=Europe/London date +%H:%M) UK"
