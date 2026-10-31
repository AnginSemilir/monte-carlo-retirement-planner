#!/bin/bash
# 7ap's preflight (a measurement, PREDICTION="none:..."): audit-7ap.mjs on the final code, all 6 units at 4 wealth points and
# 20 paths a world, one at a time (the launcher's light lane: one single-process job beside 7am's batch), into results/diag7ap-preflight; preflight-parse-7ap.mjs then runs reduce-7ap.mjs's own
# parse, gate (told the preflight's size) and reading over them. No figure is read.
set -u
OUT=research/solver/results/diag7ap-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 5 | xargs -P 1 -I{} sh -c \
  'node research/solver/audit-7ap.mjs 4 20 part {}/6 7002 > research/solver/results/diag7ap-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "solve \|done " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}'
node research/solver/preflight-parse-7ap.mjs "$OUT"
