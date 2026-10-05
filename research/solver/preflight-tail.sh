#!/bin/bash
# TAIL's preflight (PREDICTION="none:...": the preflight; the test itself runs under predictions/diag-tail.md): audit-tail.mjs's
# 8 jobs at 4 wealth points and 20 paths (seed 7005, the tie margin 1e-6), PAR at a time (default 1, the light lane), into
# results/diagtail-preflight; preflight-parse-tail.mjs then runs the reducer's parse, gate (at the preflight's size), per-path
# file checks, THE IDENTITY against ADOPT-PI's own preflight files (results/diagadoptpi-preflight: the same unit, 4 points,
# 20 paths, seed 7005) and the reading, with planted faults. No figure is read.
set -u
OUT=research/solver/results/diagtail-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 7 | xargs -P "${PAR:-1}" -I{} sh -c \
  'DIAGTAIL_OUT=research/solver/results/diagtail-preflight node research/solver/audit-tail.mjs 4 20 part {}/8 7005 1e-6 > research/solver/results/diagtail-preflight/case{}.txt 2>&1 || echo "job {} failed"'
grep -h "Error" "$OUT"/case*.txt | head -5
node research/solver/preflight-parse-tail.mjs "$OUT"
