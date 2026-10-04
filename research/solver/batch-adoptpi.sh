#!/bin/bash
# ADOPT-PI (PLAN.md ADOPT-PI; a TEST, launched under predictions/adopt-pi.md): the interpolated allowance axis against today's
# snap in the shipping default on DP's panel (25 households x 2 arms) and PR5's death-tax arm (S130, S370, S128 x 2 arms at a
# pension death tax of 40%); audit-adoptpi.mjs UNITS, 56, at 30 points, 6,000 paired paths (seed 7005), one process a unit,
# four at once, into results/diagadoptpi (logs and per-path files); each process stopped at 3 hours. Read by
# reduce-adoptpi.mjs into results-adoptpi.txt.
set -u
OUT=research/solver/results/diagadoptpi
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 55 | xargs -P 4 -I{} sh -c \
  'DIAGADOPTPI_OUT=research/solver/results/diagadoptpi timeout 10800 node research/solver/audit-adoptpi.mjs 30 6000 part {}/56 7005 > research/solver/results/diagadoptpi/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "ADOPT-PI runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-adoptpi.mjs "$OUT" || echo "=== reduce-adoptpi.mjs did not run to its reading inside the snapshot: reduce in the real tree"
