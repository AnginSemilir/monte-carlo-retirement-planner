#!/bin/bash
# COPY-X (predictions/diag-copyx.md): four jobs on four cores, seed 7002, 4,000 paths a world, into results/diagcopyx:
# audit-copyx.mjs's C, SNR, CX and SNRX (S370 at 30 points), parts 0-3 of 4; read by reduce-copyx.mjs in the real tree into
# results-copyx.txt, against STEP-O182's saved C and SNR in results/diago182 (inert off). Ten hours' timeout a job.
set -u
OUT=research/solver/results/diagcopyx
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-copyx.mjs --units | tail -1)
[ "$NJ" = 4 ] || { echo "COPY-X: audit-copyx.mjs names $NJ jobs, not 4"; exit 1; }
printf '%s\n' 0 1 2 3 | xargs -P 4 -I{} sh -c '
  O=research/solver/results/diagcopyx
  timeout 36000 node research/solver/audit-copyx.mjs 1 4000 part {}/4 7002 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}'
cat "$OUT"/exit0 "$OUT"/exit1 "$OUT"/exit2 "$OUT"/exit3
grep -h "Error\|audit-copyx:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|reader |recount |nodes |whole |checks |clamped " "$OUT"/case*.txt | cut -c1-200
echo "COPY-X done $(TZ=Europe/London date +%H:%M) UK"
