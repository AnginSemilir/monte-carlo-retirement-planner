#!/usr/bin/env bash
# Phase E1 step 2: gate 6b's run again with the candidate-set search on (PLAN.md, Part E). Identical to
# batch-flex-tiers.sh plus SOLVER_SEARCH=candidates SOLVER_ANCHOR=5, so it pairs with flex-tiers household
# by household on the same ask and the same paths. Run from a snapshot; nothing else on the box; only
# after gate 6b has been judged and step 0's reads have passed.
#
#   research/solver/run-from-snapshot.sh bash research/solver/batch-flex-tiers-cand.sh
#
set -u
echo "=== phase E1 (tag flex-tiers-cand): flex-tiers's configuration with the candidate-set search, anchors every 5 years; single-stage landing on 5,400 search paths; three worlds; 30 x 6 x 6; 3,000 held-out ==="
seq 0 2 81 | xargs -P 4 -I{} sh -c 'SOLVER_SEARCH=candidates SOLVER_ANCHOR=5 MIX=3 TIERS=1 ONLY={} FLOOR=0.8 CONF=gkFloor LEVELS=1.2,1.1,1,0.9,0.8 MARGIN=0.005 RAISE=0.003 timeout 14400 node research/solver/experiment.mjs flex flex-tiers-cand 30 3000 7001 7002 2>&1 | tail -1'
echo "=== done ==="
node research/solver/experiment.mjs reduceFlex flex-tiers-cand
