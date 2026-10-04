#!/bin/bash
# PMAP's preflight (PREDICTION="none:..."): audit-pmap.mjs on the 5 households at 4 wealth points and 20 paths a world, PAR at a
# time (default 1, the light lane), into results/diagpmap-preflight; then reduce-pmap.mjs's parse, gate (the arithmetic held
# to the measured weight read by read, the node check, the self-checks (acc* and the coverage weight, each run on more than
# nothing), the histograms, the control) and reading. No figure is read.
set -u
OUT=research/solver/results/diagpmap-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 4 | xargs -P "${PAR:-1}" -I{} sh -c \
  'node research/solver/audit-pmap.mjs 4 20 part {}/5 7002 > research/solver/results/diagpmap-preflight/case{}.txt 2>&1 || echo "household {} failed"'
grep -h "Error" "$OUT"/case*.txt | head -3
# faults planted in the audit itself (checklist item 6): household 0 with acc* moved above the half point, and with the coverage
# weight lifted over the 6-point weight; each must be refused by its own self-check, not only by the plant line
for P in acc cov; do PMAP_PLANT=$P node research/solver/audit-pmap.mjs 4 20 part 0/5 7002 > "$OUT/plant-$P.txt" 2>&1 || echo "plant $P failed"; done
node research/solver/preflight-parse-pmap.mjs "$OUT"
