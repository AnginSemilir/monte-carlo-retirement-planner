#!/bin/bash
# STEP-O182 (predictions/diag-o182.md): three jobs on three cores, seed 7002, 4,000 paths a world, into results/diago182:
# audit-o182.mjs's C, SN and SNR (S370 at 30 points), parts 0-2 of 3; read by reduce-o182.mjs in the real tree into
# results-o182.txt, against STEP-S370's saved C and SN in results/diagsteps370 (inert off). Ten hours' timeout a job.
set -u
OUT=research/solver/results/diago182
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-o182.mjs --units | tail -1)
[ "$NJ" = 3 ] || { echo "STEP-O182: audit-o182.mjs names $NJ jobs, not 3"; exit 1; }
printf '%s\n' 0 1 2 | xargs -P 3 -I{} sh -c '
  O=research/solver/results/diago182
  timeout 36000 node research/solver/audit-o182.mjs 1 4000 part {}/3 7002 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}'
cat "$OUT"/exit0 "$OUT"/exit1 "$OUT"/exit2
grep -h "Error\|audit-o182:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|reader |recount |nodes |whole |checks |clamped " "$OUT"/case*.txt | cut -c1-200
echo "STEP-O182 done $(TZ=Europe/London date +%H:%M) UK"
