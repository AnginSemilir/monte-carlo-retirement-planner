#!/bin/bash
# NODE-AX's build check (no figure read): the audit's BO job at a fifteenth of the points (4 wealth points) on 10 paths a
# world, so its self-checks (armTook, ownTook, identity) are seen to pass before the reducer is built.
set -u
OUT=${TMPDIR:-/tmp}/nodeax-buildcheck.$$
mkdir -p "$OUT"
DIAGNODEAX_OUT=$OUT node research/solver/audit-nodeax.mjs 15 10 part 1/2 7002 > $OUT/case1.txt 2>&1; echo "exit $?"
grep -E "checks|bridge|audit-nodeax:|Error|at " $OUT/case1.txt | head -20
grep -E "ledger|cliff" $OUT/case1.txt | head -12
echo "build check done $(TZ=Europe/London date +%H:%M) UK ($OUT)"
