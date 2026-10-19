#!/bin/bash
# REF-B (predictions/diag-refb.md): seven jobs four at a time, the longest first, seed 7002, 4,000 paths a world, into
# results/diagrefb: audit-refb.mjs's AR, ARX and AN at 30 points on S370 and S362 and AR on S130, parts 0-6 of 7; read by
# reduce-refb.mjs in the real tree into results-refb.txt, with the plan reference's C and CX reused from results/diagcopyb
# (S362, S130) and results/diagcopyx (S370) behind COPY-B's and COPY-X's own gates. Ten hours' timeout a job.
set -u
OUT=research/solver/results/diagrefb
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-refb.mjs --units | tail -1)
[ "$NJ" = 7 ] || { echo "REF-B: audit-refb.mjs names $NJ jobs, not 7"; exit 1; }
seq 0 6 | xargs -P 4 -I{} sh -c '
  O=research/solver/results/diagrefb
  timeout 36000 node research/solver/audit-refb.mjs 1 4000 part {}/7 7002 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}; echo "job {} done $(TZ=Europe/London date +%H:%M) UK"'
cat "$OUT"/exit*
grep -h "Error\|audit-refb:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|adaptive |checks |clamped " "$OUT"/case*.txt | cut -c1-200
echo "REF-B done $(TZ=Europe/London date +%H:%M) UK"
