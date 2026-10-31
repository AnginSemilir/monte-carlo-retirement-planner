#!/bin/bash
# ADOPT-PI's preflight (PREDICTION="none:...": the preflight; the test itself runs under predictions/adopt-pi.md):
# audit-adoptpi.mjs on all 56 units at 4 wealth points and 20 paths, PAR at a time (default 1, the light lane), into
# results/diagadoptpi-preflight; preflight-parse-adoptpi.mjs then runs the reducer's parse, gate (at the preflight's size),
# per-path file checks and reading over them, with four planted faults. No figure is read.
set -u
OUT=research/solver/results/diagadoptpi-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 55 | xargs -P "${PAR:-1}" -I{} sh -c \
  'DIAGADOPTPI_OUT=research/solver/results/diagadoptpi-preflight node research/solver/audit-adoptpi.mjs 4 20 part {}/56 7005 > research/solver/results/diagadoptpi-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "solve \|done \|Error" "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}' | sort | uniq -c | sort -rn | head -5
node research/solver/preflight-parse-adoptpi.mjs "$OUT"
