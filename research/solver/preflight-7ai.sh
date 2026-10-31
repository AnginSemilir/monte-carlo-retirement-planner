#!/bin/bash
# 7ai's preflight (a measurement, launched with PREDICTION="none:..." in the light lane: one process beside a batch):
# audit-7ai.mjs on the final code, all 42 units at 4 wealth points (the size of 7af's and 7ag's preflights), one at a time,
# into results/diag7ai-preflight; preflight-parse-7ai.mjs then runs reduce-7ai.mjs's own parse, gate (told the preflight's
# size) and reading over them against 7af's and 7ag's preflights: every unit parses, the gate refuses nothing (every linear
# solve their preflight's own), and the reading runs to its outcome line. Each unit's seconds are printed. No figure is read.
set -u
OUT=research/solver/results/diag7ai-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in $(seq 0 41); do
  node research/solver/audit-7ai.mjs 4 20 part $k/42 7002 > "$OUT/case$k.txt" 2>&1 || echo "unit $k failed"
done
grep -h "solve " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}'
node research/solver/preflight-parse-7ai.mjs "$OUT"
