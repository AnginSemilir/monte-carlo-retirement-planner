#!/bin/bash
# 7ar's preflight (a measurement, PREDICTION="none:..."): audit-7ar.mjs on the final code, all 5 units at 4 wealth points and
# 20 paths a world, all at once, into results/diag7ar-preflight; preflight-parse-7ar.mjs then runs reduce-7ar.mjs's own
# parse, gate (told the preflight's size) and reading over them. No figure is read.
set -u
OUT=research/solver/results/diag7ar-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 4 | xargs -P 5 -I{} sh -c \
  'node research/solver/audit-7ar.mjs 4 20 part {}/5 7002 > research/solver/results/diag7ar-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "solve \|done " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}'
[ -f research/solver/preflight-parse-7ar.mjs ] && node research/solver/preflight-parse-7ar.mjs "$OUT"
