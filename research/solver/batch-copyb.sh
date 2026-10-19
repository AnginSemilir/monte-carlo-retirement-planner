#!/bin/bash
# COPY-B, COPY-W's stage B (predictions/diag-copyb.md): fifteen jobs four at a time, the longest first, seed 7002, 4,000 paths a
# world, into results/diagcopyb: audit-copyb.mjs's factorial (C and CX at 30 points, CW and CXW at 60) on S130, S126 and S362, C
# and CW on S128, CW at 120 points on S370, parts 0-14 of 15; read by reduce-copyb.mjs in the real tree into results-copyb.txt,
# with COPY-W's CW reused from results/diagcopyw behind COPY-W's own gate (and through it COPY-X's). Ten hours' timeout a job.
set -u
OUT=research/solver/results/diagcopyb
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-copyb.mjs --units | tail -1)
[ "$NJ" = 15 ] || { echo "COPY-B: audit-copyb.mjs names $NJ jobs, not 15"; exit 1; }
seq 0 14 | xargs -P 4 -I{} sh -c '
  O=research/solver/results/diagcopyb
  timeout 36000 node research/solver/audit-copyb.mjs 1 4000 part {}/15 7002 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}; echo "job {} done $(TZ=Europe/London date +%H:%M) UK"'
cat "$OUT"/exit*
grep -h "Error\|audit-copyb:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|checks |clamped " "$OUT"/case*.txt | cut -c1-200
echo "COPY-B done $(TZ=Europe/London date +%H:%M) UK"
