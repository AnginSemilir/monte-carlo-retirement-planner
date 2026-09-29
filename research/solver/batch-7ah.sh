#!/bin/bash
# 7ah (predictions/diag-7ah.md; PLAN.md 7ah): O36's fix - the bundle (READER/TS+J) against the bundle with the reader's
# reference drawn pot by pot in the menu's better order (ORDER/TS+J, readerRef 'order') on the six panel households whose
# bridge is three years or more, at the estate weights 0.02 and 0.01: 24 units, 30 points, 8,000 paths of seed 7002, four
# at a time (audit-s126.mjs diag7ah), into results/diag7ah; each process stopped at 5 hours.
# inside the launcher's snapshot reduce-7ah.mjs refuses 7af's records (7af's declared correction cannot be verified
# without git there, O58); the registered read is reduce-7ah.mjs run in the real tree after the batch
set -u
OUT=research/solver/results/diag7ah
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 23 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-s126.mjs diag7ah 30 8000 part {}/24 7002 > research/solver/results/diag7ah/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7ah runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7ah.mjs "$OUT" || echo "=== reduce-7ah.mjs did not run to its outcome inside the snapshot (O58): reduce in the real tree"
