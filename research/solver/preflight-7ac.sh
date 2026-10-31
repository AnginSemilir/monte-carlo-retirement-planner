#!/bin/bash
# 7ac's preflight (a measurement, launched with PREDICTION="none:..."): the diag7ac mode on the final code, all four units at
# 4 points and 20 paths (1000 a world, so each world line takes the 20, as 7aa's preflight did), one after another, into
# results/diag7ac-preflight; preflight-parse-7ac.mjs then runs reduce-7ac.mjs's own parse() and gate() over them against 7aa's
# preflight units (results/diag7aa-preflight, the same sizes, 7aa's code): every unit parses, the gate refuses only the sizes
# (and the openings, which 4 points may move), the mixture's price equals the gap on every unit, every trace is named as the
# reducer reads it, and every TS+J trace equals 7aa's preflight trace byte for byte. No figure is read.
set -u
OUT=research/solver/results/diag7ac-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in 0 1 2 3; do
  DIAG7AC_OUT="$OUT" node research/solver/audit-s126.mjs diag7ac 4 20 part $k/4 7002 1000 > "$OUT/case$k.txt" 2>&1 || echo "unit $k failed"
done
node research/solver/preflight-parse-7ac.mjs "$OUT" research/solver/results/diag7aa-preflight
