#!/bin/bash
# 7am's preflight (a measurement, PREDICTION="none:..."): audit-7am.mjs on the final code, all 29 units at 4 wealth points
# (a solve only: the path count sets no forward run), four at once, into results/diag7am-preflight; preflight-parse-7am.mjs
# then runs reduce-7am.mjs's own parse, gate (told the preflight's size) and reading over them. No figure is read.
set -u
OUT=research/solver/results/diag7am-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 28 | xargs -P 4 -I{} sh -c \
  'node research/solver/audit-7am.mjs 4 20 part {}/29 7002 > research/solver/results/diag7am-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "solve \|done " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}'
node research/solver/preflight-parse-7am.mjs "$OUT"
