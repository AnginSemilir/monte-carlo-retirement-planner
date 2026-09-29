#!/bin/bash
# 7ah's preflight (a measurement, launched with PREDICTION="none:..." in the light lane: one process beside P's batch): the
# diag7ah mode on the final code, all 24 units at 4 wealth points and 20 paths (the sizes of 7af's and 7ag's preflights),
# one at a time, into results/diag7ah-preflight; preflight-parse-7ah.mjs then runs reduce-7ah.mjs's own parse(), gate()
# (told the preflight's sizes), loadTraces() and reading() over them against 7af's and 7ag's preflights: every unit parses,
# the gate refuses nothing, READER/W0.02 reproduces their preflight CAND lines, tables and traces, and the reading runs to
# its outcome line. Each unit's seconds are printed. No figure is read.
set -u
OUT=research/solver/results/diag7ah-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in $(seq 0 23); do
  DIAG7AH_OUT="$OUT" node research/solver/audit-s126.mjs diag7ah 4 20 part $k/24 7002 > "$OUT/case$k.txt" 2>&1 || echo "unit $k failed"
done
grep -h "solve \|run " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}'
node research/solver/preflight-parse-7ah.mjs "$OUT"
