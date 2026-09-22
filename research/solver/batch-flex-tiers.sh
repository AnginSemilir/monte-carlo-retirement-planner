#!/usr/bin/env bash
# Gate 6b: flexible spending AND the tier as a move, on the pre-registered 41. Identical to
# batch-flex-landed.sh plus TIERS=1, so the two runs compare household by household on the same ask
# and the same paths. Run from a snapshot; nothing else on the box; after flex-landed has finished.
#
#   research/solver/run-from-snapshot.sh bash research/solver/batch-flex-tiers.sh
#
set -u
echo "=== gate 6b (tag flex-tiers): flex-landed's configuration plus the tier as a move (joint steps, switching cost, worth-it margin); single-stage landing on 5,400 search paths; three worlds; 30 x 6 x 6; 3,000 held-out ==="
seq 0 2 81 | xargs -P 4 -I{} sh -c 'MIX=3 TIERS=1 ONLY={} FLOOR=0.8 CONF=gkFloor LEVELS=1.2,1.1,1,0.9,0.8 MARGIN=0.005 RAISE=0.003 timeout 14400 node research/solver/experiment.mjs flex flex-tiers 30 3000 7001 7002 2>&1 | tail -1'
echo "=== done ==="
node research/solver/experiment.mjs reduceFlex flex-tiers
