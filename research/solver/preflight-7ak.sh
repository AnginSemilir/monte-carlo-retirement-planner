#!/bin/bash
# 7ak's preflight (a measurement, PREDICTION="none:..."; the light lane): audit-7ak.mjs on the final code, both units at 4
# wealth points and 20 paths (P's preflight's size), one at a time, into results/diag7ak-preflight; preflight-parse-7ak.mjs
# then runs reduce-7ak.mjs's own parse, gate (told the preflight's size) and reading over them against P's preflight
# (results/diagP-preflight): each solve P's preflight solve, each run its first 20 node paths. No figure is read.
set -u
OUT=research/solver/results/diag7ak-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in 0 1; do
  DIAG7AK_OUT="$OUT" node research/solver/audit-7ak.mjs 4 20 part $k/2 7002 > "$OUT/case$k.txt" 2>&1 || echo "unit $k failed"
done
grep -h "solve \|node " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}'
node research/solver/preflight-parse-7ak.mjs "$OUT"
