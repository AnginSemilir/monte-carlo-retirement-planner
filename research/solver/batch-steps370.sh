#!/bin/bash
# STEP-S370 (predictions/diag-steps370.md): three jobs on three cores, seed 7002, 4,000 paths a world, into results/diagsteps370:
# audit-steps370.mjs's C and SN (S370 at 30 points) and W60 (S370 at 60), parts 0-2 of 3; read by reduce-steps370.mjs in the real
# tree into results-steps370.txt. Ten hours' timeout a job.
set -u
OUT=research/solver/results/diagsteps370
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-steps370.mjs --units | tail -1)
[ "$NJ" = 3 ] || { echo "STEP-S370: audit-steps370.mjs names $NJ jobs, not 3"; exit 1; }
printf '%s\n' 0 1 2 | xargs -P 3 -I{} sh -c '
  O=research/solver/results/diagsteps370
  timeout 36000 node research/solver/audit-steps370.mjs 1 4000 part {}/3 7002 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}'
cat "$OUT"/exit0 "$OUT"/exit1 "$OUT"/exit2
grep -h "Error\|audit-steps370:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|reader |nodes |whole |checks " "$OUT"/case*.txt | cut -c1-200
echo "STEP-S370 done $(TZ=Europe/London date +%H:%M) UK"
