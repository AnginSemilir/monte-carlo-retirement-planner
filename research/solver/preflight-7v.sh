#!/bin/bash
# 7v's preflight (a measurement, launched with PREDICTION="none:..."): the diag7v mode on the final code, all nine cases at
# 4 points, 20 paths and 10 a world, one after another, into results/diag7v-preflight; preflight-parse-7v.mjs then runs
# reduce-7v.mjs's own parse() and gate() over the folder: every case parses and the gate refuses only the sizes.
# (reduce-7v.mjs itself would stop at its stamp gate, which refuses a log launched under "none".) No figure from it is read.
set -u
OUT=research/solver/results/diag7v-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in 0 1 2 3 4 5 6 7 8; do
  DIAG7V_OUT="$OUT" node research/solver/audit-s126.mjs diag7v 4 20 part $k/9 7002 10 > "$OUT/case$k.txt" 2>&1 || echo "case $k failed"
done
node research/solver/preflight-parse-7v.mjs "$OUT"
