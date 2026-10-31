#!/bin/bash
# 7aa's preflight (a measurement, launched with PREDICTION="none:..."): the diag7aa mode on the final code, all thirty units at
# 4 points and 20 paths (each world on those 20), one after another, into results/diag7aa-preflight; preflight-parse-7aa.mjs
# then runs reduce-7aa.mjs's own parse() and gate() over the folder: every unit parses and the gate refuses only the sizes.
# No figure from it is read.
set -u
OUT=research/solver/results/diag7aa-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in $(seq 0 29); do
  DIAG7AA_OUT="$OUT" node research/solver/audit-s126.mjs diag7aa 4 20 part $k/30 7002 1000 > "$OUT/case$k.txt" 2>&1 || echo "unit $k failed"
done
node research/solver/preflight-parse-7aa.mjs "$OUT"
