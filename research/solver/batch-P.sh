#!/bin/bash
# P: the switch charged in both passes (PLAN.md P; predictions/diag-p.md; the deep review after 7ae, deep-review-log.md
# 28 Sep 22:52 UK, and of 29 Sep 08:56 UK; the maintainer's go-ahead, 29 Sep 07:49 UK). Launched only through the
# launcher with PREDICTION=research/solver/predictions/diag-p.md.
#   audit-s126.mjs's diagP mode at the product's settings but the estate weight ('auto' risk above, lambda held), 40 jobs:
#   nine core jobs - 7ae's three units (bridge 4 reader W0, S194 off W0.02, S126 reader W0) at 30x5, each at P (switchCharge
#   0.001, switchMargin 0), at 0 and at 1e-3 (7ae's two solves again) - each one solve; at world 0's node on 16,000 paths of
#   the tuning seed 7002 TS+J, OPEN0, OPEN2 and the world-aware chooser forward with 7ae's decision log; and TS+J across all
#   worlds on the seed's first 16,000 paths (the first 8,000 7aa's); traces kept. Six grid jobs (bridge 4, S194 and share 0.95 at 30x15 and 60x5, P)
#   and 25 openings (the households 7af and 7ag read, the bundle's unit at P), solves only. One process a job, the longest
#   first, four at a time; each may run 5 hours.
set -u
OUT=research/solver/results/diagP
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 39 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-s126.mjs diagP 30 16000 part {}/40 7002 16000 16000 > research/solver/results/diagP/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "P runs done $(TZ=Europe/London date +%H:%M) UK"
# inside the launcher's snapshot reduce-P.mjs refuses 7ae's records: 7ae's declared correction cannot be verified without git
# there (O58); the registered read is reduce-P.mjs run in the real tree after the batch
node research/solver/reduce-P.mjs "$OUT" || echo "=== reduce-P.mjs did not run to its outcome inside the snapshot (O58): reduce in the real tree"
