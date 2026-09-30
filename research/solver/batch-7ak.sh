#!/bin/bash
# 7ak (predictions/diag-7ak.md; PLAN.md 7ak; the deep review after P): the attribution test - bridge 4 and S194 under P at
# 30x5, world 0's node on the first 8,000 of P's node paths (audit-7ak.mjs), one process a unit, both at once, into
# results/diag7ak; each process stopped at 5 hours.
# inside the launcher's snapshot reduce-7ak.mjs cannot read P's records' declared corrections (O58); the registered read is
# reduce-7ak.mjs run in the real tree after the batch
set -u
OUT=research/solver/results/diag7ak
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 1 | xargs -P 2 -I{} sh -c \
  'timeout 18000 node research/solver/audit-7ak.mjs 30 8000 part {}/2 7002 > research/solver/results/diag7ak/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7ak runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7ak.mjs "$OUT" || echo "=== reduce-7ak.mjs did not run to its outcome inside the snapshot (O58): reduce in the real tree"
