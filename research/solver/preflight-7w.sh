#!/bin/bash
# 7w's preflight (a measurement, launched with PREDICTION="none:..."): the diag7w mode on the final code, all nine units at
# 4 points and 20 paths, one after another, into results/diag7w-preflight; preflight-parse-7w.mjs then runs reduce-7w.mjs's
# own parse() and gate() over the folder: every unit parses and the gate refuses only the sizes.
# (reduce-7w.mjs itself would stop at its stamp gate, which refuses a log launched under "none".) No figure from it is read.
set -u
OUT=research/solver/results/diag7w-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in 0 1 2 3 4 5 6 7 8; do
  DIAG7W_OUT="$OUT" node research/solver/audit-s126.mjs diag7w 4 20 part $k/9 7002 > "$OUT/case$k.txt" 2>&1 || echo "unit $k failed"
done
node research/solver/preflight-parse-7w.mjs "$OUT"
