#!/bin/bash
# 7aq's preflight (a measurement, PREDICTION="none:..."): audit-7aq.mjs on the final code, all 20 units at 4 wealth points (a
# solve only), four at once, into results/diag7aq-preflight; preflight-parse-7aq.mjs then runs reduce-7aq.mjs's own parse,
# gate (told the preflight's size) and reading over them. No figure is read.
set -u
OUT=research/solver/results/diag7aq-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 19 | xargs -P ${PF_P:-4} -I{} sh -c \
  'node research/solver/audit-7aq.mjs 4 20 part {}/20 7002 > research/solver/results/diag7aq-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "solve \|signed \|done " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $3, $NF}'
node research/solver/preflight-parse-7aq.mjs "$OUT"
