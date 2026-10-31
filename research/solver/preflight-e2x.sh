#!/bin/bash
# E2X's preflight (no figure is read): audit-e2x.mjs on the four households at 4 points, one at a time, into
# results/diage2x-preflight, read by reduce-e2x.mjs --preflight (parse, gate, reading), so the batch's lines are known to
# parse before the 30-point run. Launched with PREDICTION="none: ...".
set -u
OUT=research/solver/results/diage2x-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in 0 1 2 3; do
  timeout 3600 node research/solver/audit-e2x.mjs 4 part $k/4 > "$OUT/case$k.txt" 2>&1 || echo "household $k exited $?"
done
node research/solver/reduce-e2x.mjs "$OUT" 4 --preflight
