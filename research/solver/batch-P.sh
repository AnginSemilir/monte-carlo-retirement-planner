#!/bin/bash
# P: the switch charged in both passes (PLAN.md P; predictions/diag-P.md; the deep review after 7ae, deep-review-log.md
# 28 Sep 22:52 UK, and of 29 Sep 08:56 UK; the maintainer's go-ahead, 29 Sep 07:49 UK). Launched only through the
# launcher with PREDICTION=research/solver/predictions/diag-P.md.
#   audit-s126.mjs's diagP mode at the product's settings but the estate weight ('auto' risk above, lambda held), 29 jobs:
#   nine core jobs - 7ae's three units (bridge 4 reader W0, S194 off W0.02, S126 reader W0) at 30x5, each at P (switchCharge
#   0.001, switchMargin 0), at 0 and at 1e-3 (7ae's two solves again) - each one solve and, at world 0's node on 16,000
#   paths of the tuning seed 7002, TS+J, OPEN0 and (at P and 0) the world-aware chooser forward, traces kept; four grid jobs
#   (bridge 4 and S194 at 30x15 and 60x5, P) and sixteen openings (7af's panel, the bundle's unit at P), solves only. One
#   process a job, the longest first, four at a time; each may run 5 hours.
set -u
OUT=research/solver/results/diagP
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 28 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-s126.mjs diagP 30 16000 part {}/29 7002 16000 > research/solver/results/diagP/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "P runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-P.mjs "$OUT"
