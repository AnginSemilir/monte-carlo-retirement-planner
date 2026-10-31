#!/bin/bash
# 7al (predictions/diag-7al.md; PLAN.md 7al; the deep review after 7ah's decisive test, amended by the deep review after
# 7ai): the stage-by-stage calibration - eight units (audit-7al.mjs UNITS) at 30 points, 2,000 paths a world at each of the
# three worlds' nodes (seed 7002), one process a unit, four at once, into results/diag7al; each process stopped at 5 hours.
# inside the launcher's snapshot reduce-7al.mjs cannot read 7af's declared correction (O58); the registered read is
# reduce-7al.mjs run in the real tree after the batch
set -u
OUT=research/solver/results/diag7al
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 7 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-7al.mjs 30 2000 part {}/8 7002 > research/solver/results/diag7al/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7al runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7al.mjs "$OUT" || echo "=== reduce-7al.mjs did not run to its outcome inside the snapshot (O58): reduce in the real tree"
