#!/bin/bash
# REF-STEP (predictions/diag-refstep.md): ten jobs four at a time, the longest first, seed 7002, 4,000 paths a world, into
# results/diagrefstep: audit-refstep.mjs's AN3, AN and C at 30 points on S370 and S362 and AR3 and C on S364 and S360, parts
# 0-9 of 10; read by reduce-refstep.mjs in the real tree into results-refstep.txt, with REF-B's AN files (results/diagrefb),
# COPY-B's C files (results/diagcopyb, S362) and COPY-X's (results/diagcopyx, S370) as the reproduction's references behind
# their own gates. Ten hours' timeout a job.
set -u
OUT=research/solver/results/diagrefstep
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-refstep.mjs --units | tail -1)
[ "$NJ" = 10 ] || { echo "REF-STEP: audit-refstep.mjs names $NJ jobs, not 10"; exit 1; }
seq 0 9 | xargs -P 4 -I{} sh -c '
  O=research/solver/results/diagrefstep
  timeout 36000 node research/solver/audit-refstep.mjs 1 4000 part {}/10 7002 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}; echo "job {} done $(TZ=Europe/London date +%H:%M) UK"'
cat "$OUT"/exit*
grep -h "Error\|audit-refstep:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|adaptive |checks |clamped " "$OUT"/case*.txt | cut -c1-200
echo "REF-STEP done $(TZ=Europe/London date +%H:%M) UK"
