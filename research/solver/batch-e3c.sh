#!/bin/bash
# E3c, E3's panel-wide exactness check (PLAN.md E3c; a MEASUREMENT, launched under predictions/measure-e3c.md, Kind:
# measurement): audit-e3c.mjs on 7e's panel (25 households) at 8 points, e3 off against on in SHIP, PRODUCT and TSJ, one
# process a household, four at once, into results/diage3c; each process stopped at 2 hours. Read by reduce-e3c.mjs into
# results-e3c.txt.
set -u
OUT=research/solver/results/diage3c
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 24 | xargs -P 4 -I{} sh -c \
  'timeout 7200 node research/solver/audit-e3c.mjs 8 part {}/25 > research/solver/results/diage3c/case{}.txt 2>&1 || echo "household {} exited $?"'
echo "E3c runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-e3c.mjs "$OUT" || echo "=== reduce-e3c.mjs did not run to its reading inside the snapshot: reduce in the real tree"
