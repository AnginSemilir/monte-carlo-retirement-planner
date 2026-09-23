#!/usr/bin/env bash
# PLAN.md finding M16: the calibration check on the 12 step-2 households, 3,000 held-out paths each (seed 7002).
# Same baseline as the ranking check (full scan, exact final year, single table). About 8 min a household.
set -u
H="20:0.0223606797749979 6:0.1 50:2 74:0.005 38:0.1 16:0.0223606797749979 32:2 64:0.9457416090031758 26:0.1 10:1.140477893362459 14:2 68:1.140477893362459"
printf '%s\n' $H | xargs -P 4 -I{} sh -c 'set -- $(echo "{}" | tr ":" " "); FINALEXACT=1 timeout 7200 node research/solver/audit-calibration.mjs $1 $2 3000 7002 2>&1'
