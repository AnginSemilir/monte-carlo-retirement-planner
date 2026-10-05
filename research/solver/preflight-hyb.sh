#!/bin/bash
# HYB's preflight (PREDICTION="none:...": the preflight; the test itself runs under predictions/diag-hyb.md): audit-hyb.mjs's
# 3 jobs at 4 wealth points and 20 paths (seed 7005), PAR at a time (default 1, the light lane), into results/diaghyb-preflight;
# preflight-parse-hyb.mjs then runs the reducer's parse, gate (at the preflight's size), per-path file checks, THE IDENTITY
# against ADOPT-PI's own preflight files (results/diagadoptpi-preflight: the same unit, 4 points, 20 paths, seed 7005) and the
# reading, with planted faults. No figure is read.
set -u
OUT=research/solver/results/diaghyb-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 2 | xargs -P "${PAR:-1}" -I{} sh -c \
  'DIAGHYB_OUT=research/solver/results/diaghyb-preflight node research/solver/audit-hyb.mjs 4 20 part {}/3 7005 > research/solver/results/diaghyb-preflight/case{}.txt 2>&1 || echo "job {} failed"'
grep -h "Error" "$OUT"/case*.txt | head -5
node research/solver/preflight-parse-hyb.mjs "$OUT"
