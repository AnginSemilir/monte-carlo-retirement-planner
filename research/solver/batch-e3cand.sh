#!/bin/bash
# E3-CAND, e3's exactness under the full research candidate (the deep review after E2X, 6 Oct 22:01 UK; a MEASUREMENT,
# launched under predictions/measure-e3cand.md): audit-e3cand.mjs on share 0.95 and S130 at 30 points, one process each, both
# at once (no timing is read), into results/diage3cand; each stopped at 3 hours. Read by reduce-e3cand.mjs into
# results-e3cand.txt.
set -u
OUT=research/solver/results/diage3cand
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 1 | xargs -P 2 -I{} sh -c \
  'timeout 10800 node research/solver/audit-e3cand.mjs 30 part {}/2 > research/solver/results/diage3cand/case{}.txt 2>&1 || echo "household {} exited $?"'
echo "E3-CAND runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-e3cand.mjs "$OUT" || echo "=== reduce-e3cand.mjs did not run to its reading inside the snapshot: reduce in the real tree"
