#!/usr/bin/env bash
# PLAN.md step 2b: the ranking check on the 12 step-2 households, 40 positions x 500 paths each.
set -u
H="20:0.0223606797749979 6:0.1 50:2 74:0.005 38:0.1 16:0.0223606797749979 32:2 64:0.9457416090031758 26:0.1 10:1.140477893362459 14:2 68:1.140477893362459"
printf '%s\n' $H | xargs -P 4 -I{} sh -c 'set -- $(echo "{}" | tr ":" " "); timeout 7200 node research/solver/audit-ranking.mjs $1 $2 40 500 2>&1'
