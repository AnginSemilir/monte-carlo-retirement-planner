#!/bin/bash
# 7av's preflight (a measurement, PREDICTION="none:..."): audit-7av.mjs on the final code, all 7 units at 4 wealth points and
# 20 paths a world (the units at 12 share points at 12), PAR at a time (default 1, the launcher's light lane beside a running
# batch), into results/diag7av-preflight; preflight-parse-7av.mjs then runs reduce-7av.mjs's own parse, gate (told the
# preflight's size) and reading over them, when it exists. No figure is read.
set -u
OUT=research/solver/results/diag7av-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 6 | xargs -P "${PAR:-1}" -I{} sh -c \
  'node research/solver/audit-7av.mjs 4 20 part {}/7 7002 > research/solver/results/diag7av-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "solve \|done \|qcount \|Error" "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $3, $NF}'
[ -f research/solver/preflight-parse-7av.mjs ] && node research/solver/preflight-parse-7av.mjs "$OUT"
