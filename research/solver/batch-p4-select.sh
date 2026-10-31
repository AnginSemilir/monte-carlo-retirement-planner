#!/usr/bin/env bash
# PHASE 4 PANEL SELECTION (PLAN.md step 5b). Arm A (the app's own pipeline, guardrails on with the floor) on
# every FIRE candidate and the first library candidates, four at a time; then combine walks each list in its
# fixed order and takes the first 20 of each cohort in the 75-95% band. If the panel is not complete, run
# `LIB_FROM=<n> LIB_TO=<m>` for more library candidates and combine again.
set -u
: "${LIB_FROM:=0}"; : "${LIB_TO:=59}"
{ for k in $(seq 0 29); do echo "fire $k"; done; for k in $(seq "$LIB_FROM" "$LIB_TO"); do echo "lib $k"; done; } |
  xargs -P 4 -L 1 sh -c 'timeout 3600 node research/solver/select-phase4.mjs one "$0" "$1" 2>&1 | tail -1'
node research/solver/select-phase4.mjs combine
