#!/usr/bin/env bash
# PLAN.md findings M18 + M17: the purpose test again, with the floor fix on (raiseSurvival + failureShortfall), same households, positions and paths.
# thin ones and four in the middle), 20 positions each (half on the cliff), the top 6 distinct moves, 800 paths
# split 400 to pick and 400 to measure. Baseline as the ranking check: full scan, exact final year, single table.
set -u
H="10:1.140477893362459 32:2 64:0.9457416090031758 68:1.140477893362459 50:2 6:0.1 16:0.0223606797749979 26:0.1"
printf '%s\n' $H | xargs -P 4 -I{} sh -c 'set -- $(echo "{}" | tr ":" " "); FINALEXACT=1 RAISESURV=1 FAILSHORT=1 TAG=floor timeout 7200 node research/solver/audit-bestof.mjs $1 $2 20 800 6 2>&1'
