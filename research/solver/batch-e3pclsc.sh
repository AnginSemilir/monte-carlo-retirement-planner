#!/bin/bash
# E3-PCLS-C, the panel identity check for E3's lump-sum half (PLAN.md E3-PCLS; a MEASUREMENT, launched under
# predictions/measure-e3pclsc.md): audit-e3pclsc.mjs's 10 units (9 households at 30 points under the candidate with e3,
# e3pcls off and on, plants at 8 points; and S180's split 4 and 2 ways), four at once (no timing is read), into
# results/diage3pclsc; each stopped at 4 hours. Read by reduce-e3pclsc.mjs into results-e3pclsc.txt.
set -u
OUT=research/solver/results/diage3pclsc
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 9 | xargs -P 4 -I{} sh -c \
  'timeout 14400 node research/solver/audit-e3pclsc.mjs 30 part {}/10 > research/solver/results/diage3pclsc/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "E3-PCLS-C runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-e3pclsc.mjs "$OUT" || echo "=== reduce-e3pclsc.mjs did not run to its reading inside the snapshot: reduce in the real tree"
