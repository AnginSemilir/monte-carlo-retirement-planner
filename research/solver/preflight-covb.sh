#!/bin/bash
# COV-B-STEP's preflight (PREDICTION="none:...": the preflight; the test itself runs under predictions/diag-covb.md):
# audit-covb.mjs on all six households at 4 wealth points and 20 paths a world, PAR at a time (default 1, the light lane),
# into results/diagcovb-preflight; preflight-parse-covb.mjs then runs the reducer's parse, gate (at the preflight's size),
# per-path file checks and reading over them, with planted faults. No figure is read; the solve seconds are the cost check.
set -u
OUT=research/solver/results/diagcovb-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 5 | xargs -P "${PAR:-1}" -I{} sh -c \
  'DIAGCOVB_OUT=research/solver/results/diagcovb-preflight node research/solver/audit-covb.mjs 4 20 part {}/6 7002 > research/solver/results/diagcovb-preflight/case{}.txt 2>&1 || echo "household {} failed"'
grep -h "solve \|done \|Error" "$OUT"/case*.txt | sed 's/^ *//' | head -30
node research/solver/preflight-parse-covb.mjs "$OUT"
