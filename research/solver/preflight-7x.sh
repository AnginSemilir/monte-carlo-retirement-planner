#!/bin/bash
# 7x's preflight (a measurement, launched with PREDICTION="none:..."): the diag7x mode on the final code, all twenty units at
# 4 points, 20 paths and 10 a world, one after another, into results/diag7x-preflight; preflight-parse-7x.mjs then runs
# reduce-7x.mjs's own parse() and gate() over the folder: every unit parses and the gate refuses only the sizes.
# (reduce-7x.mjs itself would stop at its stamp gate, which refuses a log launched under "none".) No figure from it is read.
set -u
OUT=research/solver/results/diag7x-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in $(seq 0 19); do
  DIAG7X_OUT="$OUT" node research/solver/audit-s126.mjs diag7x 4 20 part $k/20 7002 10 > "$OUT/case$k.txt" 2>&1 || echo "unit $k failed"
done
node research/solver/preflight-parse-7x.mjs "$OUT"
