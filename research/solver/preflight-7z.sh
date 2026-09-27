#!/bin/bash
# 7z's preflight (a measurement, launched with PREDICTION="none:..."): the diag7z mode on the final code, all eight units at
# 4 points and 20 paths, one after another, into results/diag7z-preflight; preflight-parse-7z.mjs then runs reduce-7z.mjs's
# own parse() and gate() over the folder: every unit parses and the gate refuses only the sizes.
# (reduce-7z.mjs itself would stop at its stamp gate, which refuses a log launched under "none".) No figure from it is read.
set -u
OUT=research/solver/results/diag7z-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in $(seq 0 7); do
  DIAG7Z_OUT="$OUT" node research/solver/audit-s126.mjs diag7z 4 20 part $k/8 7002 > "$OUT/case$k.txt" 2>&1 || echo "unit $k failed"
done
node research/solver/preflight-parse-7z.mjs "$OUT"
