#!/bin/bash
# AREF Step 0's build check (no figure read): audit-aref0.mjs at a quarter of its DP grid and 200 simulations a checked
# state, so its self-checks (gridTook with the menu, recTook, dpTook) and its timing are seen before the reducer is built.
set -u
OUT=${TMPDIR:-/tmp}/aref0-buildcheck.$$
mkdir -p "$OUT"
AREF0_OUT=$OUT node research/solver/audit-aref0.mjs 4 200 > $OUT/case0.txt 2>&1; echo "exit $?"
grep -E "checks|menu|dp |dpcheck|flat|cal |audit-aref0:|Error|at |solve CAND|nodeax" $OUT/case0.txt | head -60
echo "build check done $(TZ=Europe/London date +%H:%M) UK ($OUT)"
