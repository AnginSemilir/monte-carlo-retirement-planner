#!/bin/bash
# NS-COND (PLAN.md NS-COND; a TEST, launched under predictions/diag-nscond.md): audit-nscond.mjs on S370, bridge 4 and
# S126 (deciding) and S130 and S128 (incidence) - BASE's and COV's tables solved at XAS's unit; the table checks (DEADSTEP
# and the census) before any read; along BASE's paths, in every bridge year, the bequest read decomposed over its corners
# (item 1), the moves the copy rule changes (item 2), and BASE's year-before reads with the menu-order reference and the
# 41-point nodes (item 3) - at 30 points, 2,000 paths a world (seed 7002), one process a household, four at once, into
# results/diagnscond; each process stopped at 8 hours. Read by reduce-nscond.mjs into results-nscond.txt (in the real tree:
# the identity reads XAS-R2's files and its logs' fair-test gate needs git).
set -u
OUT=research/solver/results/diagnscond
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 4 | xargs -P 4 -I{} sh -c \
  'DIAGNSCOND_OUT=research/solver/results/diagnscond timeout 28800 node research/solver/audit-nscond.mjs 30 2000 part {}/5 7002 > research/solver/results/diagnscond/case{}.txt 2>&1 || echo "job {} exited $?"'
echo "NS-COND runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-nscond.mjs "$OUT" || echo "=== reduce-nscond.mjs did not run to its reading inside the snapshot: reduce in the real tree"
