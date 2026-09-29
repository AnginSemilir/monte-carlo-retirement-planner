#!/bin/bash
# 7ag's preflight (a measurement, launched with PREDICTION="none:..."): the diag7ag mode on the final code, all 28 units at 4
# wealth points and 20 paths, four at a time as the batch runs them, into results/diag7ag-preflight; preflight-parse-7ag.mjs
# then runs reduce-7ag.mjs's own parse(), gate() (at the preflight's sizes, TSOFF against 7af's preflight S126 units),
# loadTraces() and reading() (item 3 paired with 7af's preflight traces) over them: every unit parses, the gate refuses
# nothing at these sizes, and the reading runs to its outcome line. Each unit's seconds are printed for the time estimate.
# No figure is read.
set -u
OUT=research/solver/results/diag7ag-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 27 | xargs -P 4 -I{} sh -c \
  'DIAG7AG_OUT=research/solver/results/diag7ag-preflight node research/solver/audit-s126.mjs diag7ag 4 20 part {}/28 7002 > research/solver/results/diag7ag-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "solve \|run " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}'
node research/solver/preflight-parse-7ag.mjs "$OUT" research/solver/results/diag7af-preflight research/solver/results/diag7aa-preflight
