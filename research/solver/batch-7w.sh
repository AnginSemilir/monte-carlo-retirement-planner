#!/bin/bash
# 7w: is T the five-point return average hiding the bridge's last year (Q)? (PLAN.md 7w; predictions/diag-7w.md; the sixth
# deep review, 27 Sep 18:19 UK; the maintainer, 27 Sep: "agree - do option A, waive the registered second seed"). Launched
# only through run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-7w.md.
#   audit-s126.mjs's diag7w mode at the product's settings (30 points, 'auto' risk above, lambda held at 7t's and 7v's):
#   nine units, each one solve with the year's return averaged over 5 points (the product's) or 15, run forward at switch
#   margins 0.001 and 0 and at 0.001 with the year-0 move freed, on 3,000 paths of the tuning seed 7002 (7v's first 3,000);
#   traces kept. One process a unit, four at a time, the four 15-point units first (a 15-point solve took about twice a
#   5-point one in 7s: 899 and 911 s against 430 and 432 on S126, results-7s.txt); each process may run 5 hours before it is stopped.
set -u
OUT=research/solver/results/diag7w
rm -rf "$OUT"; mkdir -p "$OUT"
# the unit order in audit-s126.mjs's diag7w: 0-3 the 15-point units (share 0.95 READER, READER+J, OFF; S126 READER), 4-8 the
# 5-point units (the same four, then S194 OFF)
printf '%s\n' 0 1 2 3 4 5 6 7 8 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-s126.mjs diag7w 30 3000 part {}/9 7002 > research/solver/results/diag7w/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7w runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7w.mjs "$OUT"
