#!/bin/bash
# XAS-R2's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-xasr2.md): audit-xasr2.mjs's 3
# households at 4 wealth points and 3 paths a world (seed 7002), PAR at a time (default 1, the light lane), into
# results/diagxasr2-preflight, read by reduce-xasr2.mjs --preflight (its gate and the files; the identity, S126's openings and
# the guard are the full run's); then the crossarm plant (XASR2_PLANT=crossarm, S370 alone: the arm dropped from the node
# cache's key, O109's fault), which the audit's own cross check must refuse. No figure is read.
set -u
OUT=research/solver/results/diagxasr2-preflight
rm -rf "$OUT" "$OUT-plant"; mkdir -p "$OUT" "$OUT-plant"
seq 0 2 | xargs -P "${PAR:-1}" -I{} sh -c \
  'DIAGXASR2_OUT=research/solver/results/diagxasr2-preflight node research/solver/audit-xasr2.mjs 4 3 part {}/3 7002 > research/solver/results/diagxasr2-preflight/case{}.txt 2>&1 || echo "job {} failed"'
grep -h "Error\|audit-xasr2:" "$OUT"/case*.txt | head -5
grep -h "checks\|ran \|xasr \|blend \|open " "$OUT"/case*.txt
node research/solver/reduce-xasr2.mjs "$OUT" 3 4 --preflight; echo "reduce-xasr2 (the preflight) exit $?"
XASR2_PLANT=crossarm DIAGXASR2_OUT=research/solver/results/diagxasr2-preflight-plant node research/solver/audit-xasr2.mjs 4 3 part 0/3 7002 > "$OUT-plant/case0.txt" 2>&1
code=$?
grep -h "checks\|audit-xasr2:" "$OUT-plant/case0.txt" | cut -c1-300
if [ "$code" -eq 0 ] || ! grep -q "self-check failed or ran on nothing" "$OUT-plant/case0.txt" || ! grep -qE '"crossBad":[1-9]' "$OUT-plant/case0.txt"; then echo "PLANT NOT REFUSED BY THE CROSS CHECK - the preflight fails"; exit 1; fi
echo "the crossarm plant refused by the audit's cross check (exit $code)"
