#!/bin/bash
# 7at's preflight (a measurement, PREDICTION="none:..."): audit-7at.mjs on the final code, all 6 units at 4 wealth points and
# 20 paths a world, PAR at a time (default 1, the launcher's light lane beside a running batch), into
# results/diag7at-preflight; preflight-parse-7at.mjs then runs reduce-7at.mjs's own parse, gate (told the preflight's size)
# and reading over them, when it exists. No figure is read.
set -u
OUT=research/solver/results/diag7at-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 5 | xargs -P "${PAR:-1}" -I{} sh -c \
  'node research/solver/audit-7at.mjs 4 20 part {}/6 7002 > research/solver/results/diag7at-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "solve \|done \|xcount \|Error" "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $3, $NF}'
[ -f research/solver/preflight-parse-7at.mjs ] && node research/solver/preflight-parse-7at.mjs "$OUT"
