#!/bin/bash
# 7y's preflight (a measurement, launched with PREDICTION="none:..."): the diag7y mode on the final code, all fourteen units at
# 4 points and 20 paths, one after another, into results/diag7y-preflight; preflight-parse-7y.mjs then runs reduce-7y.mjs's
# own parse() and gate() over the folder: every unit parses and the gate refuses only the sizes. No figure from it is read.
set -u
OUT=research/solver/results/diag7y-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in $(seq 0 13); do
  DIAG7Y_OUT="$OUT" node research/solver/audit-s126.mjs diag7y 4 20 part $k/14 7002 > "$OUT/case$k.txt" 2>&1 || echo "unit $k failed"
done
node research/solver/preflight-parse-7y.mjs "$OUT"
