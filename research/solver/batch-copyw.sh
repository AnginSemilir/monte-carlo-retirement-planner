#!/bin/bash
# COPY-W, stage A (predictions/diag-copyw.md): two jobs on two cores, seed 7002, 4,000 paths a world, into results/diagcopyw:
# audit-copyw.mjs's CW and CXW (S370 at 60 points), parts 0-1 of 2; read by reduce-copyw.mjs in the real tree into
# results-copyw.txt, against STEP-S370's saved W60 in results/diagsteps370 (CW bit for bit) and with COPY-X's C and CX reused
# from results/diagcopyx behind COPY-X's own gate. Ten hours' timeout a job.
set -u
OUT=research/solver/results/diagcopyw
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-copyw.mjs --units | tail -1)
[ "$NJ" = 2 ] || { echo "COPY-W: audit-copyw.mjs names $NJ jobs, not 2"; exit 1; }
printf '%s\n' 0 1 | xargs -P 2 -I{} sh -c '
  O=research/solver/results/diagcopyw
  timeout 36000 node research/solver/audit-copyw.mjs 1 4000 part {}/2 7002 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}'
cat "$OUT"/exit0 "$OUT"/exit1
grep -h "Error\|audit-copyw:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|reader |recount |nodes |whole |checks |clamped " "$OUT"/case*.txt | cut -c1-200
echo "COPY-W done $(TZ=Europe/London date +%H:%M) UK"
