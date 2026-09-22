#!/usr/bin/env bash
# Phase 2d under the three-world mixture, clean: the single-stage landing at 5,400 search paths on the
# pre-registered 41. Replaces the flex-mix pilot, which straddled three solver versions. Run it through
# research/solver/run-from-snapshot.sh so the tree it executes is frozen; do not cd out of the snapshot.
#
#   research/solver/run-from-snapshot.sh bash research/solver/batch-flex-landed.sh
#
set -u
echo "=== 2d under the mixture, clean (tag flex-landed): raises 0.003, levels 1.2/1.1/1/0.9/0.8, CONF=gkFloor, margin 0.5pt, single-stage landing on 5,400 search paths; every arm in the engine's world; 30 x 6 x 6; 3,000 held-out ==="
seq 0 2 81 | xargs -P 4 -I{} sh -c 'MIX=3 ONLY={} FLOOR=0.8 CONF=gkFloor LEVELS=1.2,1.1,1,0.9,0.8 MARGIN=0.005 RAISE=0.003 timeout 10800 node research/solver/experiment.mjs flex flex-landed 30 3000 7001 7002 2>&1 | tail -1'
echo "=== done ==="
node research/solver/experiment.mjs reduceFlex flex-landed
