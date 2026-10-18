#!/bin/bash
# HO-DEP (predictions/diag-hodep.md): four jobs on four cores, seed 7004, 4,000 paths a world, into results/diaghodep:
# audit-hodep.mjs's K1F and K2 (S362) and A and O (HOUSE2), all at 30 points, parts 0-3 of 4; read by reduce-hodep.mjs in the
# real tree into results-hodep.txt, its gate holding K1F to FOOT-S366's saved K1F (results/diagfoot). Ten hours' timeout a job.
set -u
OUT=research/solver/results/diaghodep
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-hodep.mjs --units | tail -1)
[ "$NJ" = 4 ] || { echo "HO-DEP: audit-hodep.mjs names $NJ jobs, not 4"; exit 1; }
printf '%s\n' 0 1 2 3 | xargs -P 4 -I{} sh -c '
  O=research/solver/results/diaghodep
  timeout 36000 node research/solver/audit-hodep.mjs 1 4000 part {}/4 7004 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}'
cat "$OUT"/exit0 "$OUT"/exit1 "$OUT"/exit2 "$OUT"/exit3
grep -h "Error\|audit-hodep:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|adaptive |foot |guard |whole |checks " "$OUT"/case*.txt | cut -c1-200
echo "HO-DEP done $(TZ=Europe/London date +%H:%M) UK"
