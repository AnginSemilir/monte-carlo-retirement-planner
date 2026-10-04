#!/bin/bash
# The three-arm draw-pause contrast's preflight (PREDICTION="none:...": the preflight; the measurement itself runs under
# predictions/measure-dpc.md): audit-dpc.mjs on all 75 units at 4 wealth points and 20 paths, PAR at a time (default 1, the
# light lane), into results/diagdpc-preflight, and DP's own audit at the same size into results/diagdp-preflight-dpc (the
# SNAP identity's reference at the preflight's size); preflight-parse-dpc.mjs then runs the reducer's parse, gate (told the
# preflight's size, SNAP held to that reference) and reading over them. No figure is read.
set -u
OUT=research/solver/results/diagdpc-preflight REF=research/solver/results/diagdp-preflight-dpc
rm -rf "$OUT" "$REF"; mkdir -p "$OUT" "$REF"
seq 0 74 | xargs -P "${PAR:-1}" -I{} sh -c \
  'DIAGDPC_OUT=research/solver/results/diagdpc-preflight node research/solver/audit-dpc.mjs 4 20 part {}/75 7002 > research/solver/results/diagdpc-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
seq 0 24 | xargs -P "${PAR:-1}" -I{} sh -c \
  'node research/solver/audit-dp.mjs 4 20 part {}/25 7002 > research/solver/results/diagdp-preflight-dpc/case{}.txt 2>&1 || echo "DP household {} failed"'
grep -h "solve \|done \|Error" "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1, $2, $NF}' | sort | uniq -c | sort -rn | head -5
node research/solver/preflight-parse-dpc.mjs "$OUT" "$REF"
