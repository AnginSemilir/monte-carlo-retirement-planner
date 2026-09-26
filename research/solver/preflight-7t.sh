#!/bin/bash
# 7t's preflight (a measurement, launched with PREDICTION="none:..."): the diag7t mode on the final code, all five cases at
# 4 points, 20 paths and 10 a world, one after another, into results/diag7t-preflight; reduce-7t.mjs is then run over the
# folder to show it parses every line (its gate must refuse only the sizes). No figure from it is read.
set -u
OUT=research/solver/results/diag7t-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in 0 1 2 3 4; do
  DIAG7T_OUT="$OUT" node research/solver/audit-s126.mjs diag7t 4 20 part $k/5 7002 10 > "$OUT/part$k.txt" 2>&1 || echo "part $k failed"
done
node research/solver/reduce-7t.mjs "$OUT"
