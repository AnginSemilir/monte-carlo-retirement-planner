#!/usr/bin/env bash
# Phase 6d (PLAN.md): is the bequest weight a lever a household can be given? Eight households across
# the horizons and both sides of the cap, five weights each, shoulder on, everything else at the gate 6b
# configuration so each weight pairs with the others on the same ask and the same paths.
#
#   S004 idx 0 (28y)   S070 idx 10 (36y)  S178 idx 30 (40y)  S184 idx 32 (41y)
#   S206 idx 38 (41y)  S258 idx 52 (52y)  S318 idx 62 (61y)  S342 idx 66 (61y)
#
# 40 landings, 51.9 core-hours, about 13 hours on four cores. Run from a snapshot, nothing else on the box.
set -u
for W in 0 0.02 0.05 0.1 0.2; do
  TAG="beq-lever-$(echo $W | tr -d '.')"
  echo "=== bequest weight $W (tag $TAG) ==="
  for K in 0 10 30 32 38 52 62 66; do echo $K; done | xargs -P 4 -I{} sh -c "WB=$W BEQSHAPE=soft MIX=3 TIERS=1 ONLY={} FLOOR=0.8 CONF=gkFloor LEVELS=1.2,1.1,1,0.9,0.8 MARGIN=0.005 RAISE=0.003 timeout 14400 node research/solver/experiment.mjs flex $TAG 30 3000 7001 7002 2>&1 | tail -1"
done
echo "=== 6d sweep done ==="
