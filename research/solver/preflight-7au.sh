#!/bin/bash
# 7au's preflight (a measurement, PREDICTION="none:..."): audit-7au.mjs on the final code, all 4 jobs at 4 wealth points
# (DIAG7AU_GRID) and 100 paths (100 at the node and across all worlds, 50 for the identity runs), PAR at a time (default 1,
# the launcher's light lane; PAR=4 when no batch runs), into results/diag7au-preflight; preflight-parse-7au.mjs then runs
# reduce-7au.mjs's own parse, gate (told the preflight's size), traces and reading over them. No figure is read.
set -u
OUT=research/solver/results/diag7au-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 3 | xargs -P "${PAR:-1}" -I{} sh -c \
  'DIAG7AU_OUT=research/solver/results/diag7au-preflight DIAG7AU_GRID=4x5 node research/solver/audit-7au.mjs 4 100 part {}/4 7002 100 100 50 > research/solver/results/diag7au-preflight/case{}.txt 2>&1 || echo "job {} failed"'
grep -h "solve \|done \|Error" "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $3, $NF}'
node research/solver/preflight-parse-7au.mjs "$OUT"
