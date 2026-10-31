#!/bin/bash
# 7al's preflight (a measurement, PREDICTION="none:..."): audit-7al.mjs on the final code, all eight units at 4 wealth
# points and 20 paths a world, four at once, into results/diag7al-preflight; preflight-parse-7al.mjs then runs
# reduce-7al.mjs's own parse, gate (told the preflight's size) and reading over them. No figure is read.
set -u
OUT=research/solver/results/diag7al-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 7 | xargs -P 4 -I{} sh -c \
  'node research/solver/audit-7al.mjs 4 20 part {}/8 7002 > research/solver/results/diag7al-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "solve \|done " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}'
node research/solver/preflight-parse-7al.mjs "$OUT"
