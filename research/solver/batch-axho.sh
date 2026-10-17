#!/bin/bash
# AX-HO (predictions/diag-axho.md): five jobs on four cores, seed 7004, 4,000 paths a world, into results/diagaxho:
# audit-axho.mjs's J1, J1X and J2 (S380) and J3 and J4 (S360), parts 0-4 of 5, the longest first (J1, J1X, J3, J2; J4 when
# the first ends); read by reduce-axho.mjs in the real tree into results-axho.txt. Ten hours' timeout a job.
set -u
OUT=research/solver/results/diagaxho
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-axho.mjs --units | tail -1)
[ "$NJ" = 5 ] || { echo "AX-HO: audit-axho.mjs names $NJ jobs, not 5"; exit 1; }
printf '%s\n' 0 1 3 2 4 | xargs -P 4 -I{} sh -c '
  O=research/solver/results/diagaxho
  timeout 36000 node research/solver/audit-axho.mjs 1 4000 part {}/5 7004 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}'
cat "$OUT"/exit0 "$OUT"/exit1 "$OUT"/exit2 "$OUT"/exit3 "$OUT"/exit4
grep -h "Error\|audit-axho:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|adaptive |checks |refTail|runs " "$OUT"/case*.txt | cut -c1-220
echo "AX-HO done $(TZ=Europe/London date +%H:%M) UK"
