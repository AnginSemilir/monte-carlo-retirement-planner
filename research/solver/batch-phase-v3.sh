#!/usr/bin/env bash
# Phase V3 alone, after the zero-point sampling fix: three solves per household, no simulation.
set -u
printf '32\n64\n20\n' | xargs -P 3 -I{} sh -c 'ONLY=v3 timeout 7200 node research/solver/audit-converge-numerics.mjs {} > /tmp/phase-v3-{}.txt 2>&1; echo "band {} exit $?"'
for k in 32 64 20; do echo; echo "################ band $k"; cat /tmp/phase-v3-$k.txt; done
