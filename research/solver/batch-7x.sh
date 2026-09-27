#!/bin/bash
# 7x: is the de-risk's undervaluing free switching (FS) or the three worlds (W)? (PLAN.md 7x; predictions/diag-7x.md; the
# deep review after 7w, 27 Sep 20:17 UK; the maintainer, 27 Sep: "agree - do option A, run 7x"). Launched only through
# run-from-snapshot.sh with PREDICTION=research/solver/predictions/diag-7x.md.
#   audit-s126.mjs's diag7x mode at the product's settings (30 points, 'auto' risk above, lambda held at 7t's, 7v's and 7w's,
#   5 return points): twenty units, each one solve with one tier pair held for the whole plan (solve.js holdTier: the plan's
#   0/0 or the freed opening's 2/2), in three worlds or five, on S126 and bridge 4 (reader), share 0.95 (reader), S194 and
#   S360 (off); each run forward on 8,000 paths of the tuning seed 7002 (7v's), and in each world on the first 1,000 with the
#   path's shift set to the world's node; traces kept. One process a unit, four at a time, the five-world units first;
#   each process may run 5 hours before it is stopped.
set -u
OUT=research/solver/results/diag7x
rm -rf "$OUT"; mkdir -p "$OUT"
# the unit order in audit-s126.mjs's diag7x: 0-9 three worlds (0-4 held 0/0, 5-9 held 2/2), 10-19 five worlds; each five
# in the order S126, S194, share 0.95, bridge 4, S360
printf '%s\n' 10 11 12 13 14 15 16 17 18 19 0 1 2 3 4 5 6 7 8 9 | xargs -P 4 -I{} sh -c \
  'timeout 18000 node research/solver/audit-s126.mjs diag7x 30 8000 part {}/20 7002 1000 > research/solver/results/diag7x/case{}.txt 2>&1 || echo "unit {} exited $?"'
echo "7x runs done $(TZ=Europe/London date +%H:%M) UK"
node research/solver/reduce-7x.mjs "$OUT"
