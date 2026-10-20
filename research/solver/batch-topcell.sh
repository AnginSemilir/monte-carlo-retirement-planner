#!/bin/bash
# TOP-CELL (predictions/diag-topcell.md): eleven jobs four at a time, the longest first (PSNX60 the critical path), seed 7002,
# 4,000 paths a world, into results/diagtopcell: audit-topcell.mjs's PSNX60, PX60, PSNX, PSNXU and PX on S370, SNRXW and SNRX
# on S130 and CX, SNRX, CXW and SNRXW on S128, parts 0-10 of 11; read by reduce-topcell.mjs in the real tree into
# results-topcell.txt, with COPY-B's S130 CX and CXW (results/diagcopyb) reused behind COPY-B's gate and the preflight's
# reproduction (results/topcell-preflight/repro) accepting the code. Ten hours' timeout a job.
set -u
OUT=research/solver/results/diagtopcell
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-topcell.mjs --units | tail -1)
[ "$NJ" = 11 ] || { echo "TOP-CELL: audit-topcell.mjs names $NJ jobs, not 11"; exit 1; }
seq 0 10 | xargs -P 4 -I{} sh -c '
  O=research/solver/results/diagtopcell
  timeout 36000 node research/solver/audit-topcell.mjs 1 4000 part {}/11 7002 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}; echo "job {} done $(TZ=Europe/London date +%H:%M) UK"'
cat "$OUT"/exit*
grep -h "Error\|audit-topcell:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|adaptive |checks |clamped " "$OUT"/case*.txt | cut -c1-200
echo "TOP-CELL done $(TZ=Europe/London date +%H:%M) UK"
