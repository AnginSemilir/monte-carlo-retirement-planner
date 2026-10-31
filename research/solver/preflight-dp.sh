#!/bin/bash
# The draw-pause measurement's preflight (PREDICTION="none:...": the preflight; the measurement itself runs under predictions/measure-dp.md): audit-dp.mjs on all 25 households at 4 wealth points and 20
# paths, PAR at a time (default 1, the light lane), into results/diagdp-preflight; reduce-dp.mjs then runs its stamps, gate
# (told the preflight's size) and reading over them. No figure is read.
set -u
OUT=research/solver/results/diagdp-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 24 | xargs -P "${PAR:-1}" -I{} sh -c \
  'node research/solver/audit-dp.mjs 4 20 part {}/25 7002 > research/solver/results/diagdp-preflight/case{}.txt 2>&1 || echo "household {} failed"'
grep -h "solve \|done \|Error" "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}' | sort | uniq -c | sort -rn | head -5
node research/solver/preflight-parse-dp.mjs "$OUT"
