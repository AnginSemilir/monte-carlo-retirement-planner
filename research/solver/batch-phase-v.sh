#!/usr/bin/env bash
# PHASE V, extended to the share axes (PLAN.md "Phase V as run, 23 Sep"). Three households in parallel:
# S184 (band 32), S330 (band 64), S126 (band 20). One core each; the fourth stays free.
set -u
echo "=== phase V: $(date -u +%H:%M) ==="
printf '32\n64\n20\n' | xargs -P 3 -I{} sh -c 'timeout 14400 node research/solver/audit-converge-numerics.mjs {} 1000 > /tmp/phase-v-{}.txt 2>&1; echo "band {} exit $?"'
for k in 32 64 20; do echo; echo "################ band $k"; cat /tmp/phase-v-$k.txt; done
echo "=== phase V done $(date -u +%H:%M) ==="
