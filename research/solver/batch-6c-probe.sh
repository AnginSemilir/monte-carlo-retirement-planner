#!/usr/bin/env bash
# Phase 6c field check (PLAN.md): the soft shoulder on the 9 households whose grid reaches above the
# bequest cap, plus 3 controls whose grid never does. Paired against their flex-tiers records: same ask,
# same seeds, same paths, BEQSHAPE=soft the only difference.
#
#   cap-binding: S240 S252 S258 S276 S300 S318 S330 S342 S354   (band idx 48 50 52 56 60 62 64 66 68)
#   controls:    S004 S206 S390                                  (band idx 0 38 74)
#
# Gate 6c condition 3: median pot up on all 9, no floor rate down by more than 0.5 points, the 3
# controls unchanged to the pound.
set -u
echo "=== phase 6c (tag beq-soft): bequestShape=soft, flex-tiers configuration otherwise ==="
for K in 48 50 52 56 60 62 64 66 68 0 38 74; do echo $K; done | xargs -P 4 -I{} sh -c 'BEQSHAPE=soft MIX=3 TIERS=1 ONLY={} FLOOR=0.8 CONF=gkFloor LEVELS=1.2,1.1,1,0.9,0.8 MARGIN=0.005 RAISE=0.003 timeout 14400 node research/solver/experiment.mjs flex beq-soft 30 3000 7001 7002 2>&1 | tail -1'
echo "=== 6c probe done ==="
