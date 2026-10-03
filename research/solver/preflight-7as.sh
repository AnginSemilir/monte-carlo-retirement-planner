#!/bin/bash
# 7as's preflight (a measurement, PREDICTION="none:..."): audit-7as.mjs on the final code, all 9 jobs at 4 wealth points and
# 100 paths (100 at the node, 100 across all worlds), one at a time (the launcher's light lane: one process beside a running
# batch), into results/diag7as-preflight; preflight-parse-7as.mjs then runs reduce-7as.mjs's own parse, gate (told the
# preflight's size) and reading over them, when it exists. No figure is read.
set -u
OUT=research/solver/results/diag7as-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 8 | xargs -P 1 -I{} sh -c \
  'DIAG7AS_OUT=research/solver/results/diag7as-preflight node research/solver/audit-7as.mjs 4 100 part {}/9 7002 100 100 > research/solver/results/diag7as-preflight/case{}.txt 2>&1 || echo "job {} failed"'
grep -h "solve \|done \|Error" "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $3, $NF}'
[ -f research/solver/preflight-parse-7as.mjs ] && node research/solver/preflight-parse-7as.mjs "$OUT"
