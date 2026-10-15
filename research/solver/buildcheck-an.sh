#!/bin/bash
# AN's build check (no figure read): (1) BN-off - NODE-AX's BN preflight job (audit-nodeax.mjs at 4 wealth points, 40 paths
# a world, seed 7002) rerun on this code and compared with the saved one (results/nodeax-preflight, code d297b820d217),
# file and log, the stamp and the seconds aside: the adaptive reference's code must leave BN bit for bit as it was; (2) AN
# at the same scale, the reference at its registered lattice, for its self-checks and its time.
set -u
OUT=${TMPDIR:-/tmp}/an-buildcheck.$$
mkdir -p "$OUT/bn" "$OUT/an"
( DIAGNODEAX_OUT=$OUT/bn node research/solver/audit-nodeax.mjs 15 40 part 0/2 7002 > "$OUT/bn/case0.txt" 2>&1; echo "bn exit $?" > "$OUT/bn/exit.txt" ) &
( DIAGAN_OUT=$OUT/an node research/solver/audit-an.mjs 15 40 part 0/1 7002 > "$OUT/an/case0.txt" 2>&1; echo "an exit $?" > "$OUT/an/exit.txt" ) &
wait
cat "$OUT/bn/exit.txt" "$OUT/an/exit.txt"
node research/solver/compare-preflight.mjs research/solver/results/nodeax-preflight "$OUT/bn" S360-BN-P60S15Q5.json.gz case0.txt
grep -hE "checks|adaptive |solve CAND|audit-an:|Error|^ +at " "$OUT/an/case0.txt" | cut -c1-240 | head -30
echo "build check done $(TZ=Europe/London date +%H:%M) UK ($OUT)"
