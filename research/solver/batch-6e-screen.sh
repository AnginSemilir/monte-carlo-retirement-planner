#!/usr/bin/env bash
#
# PHASE 6e STAGE 1: THE GRID-FIDELITY SCREEN (PLAN.md Phase 6e).
#
# Twelve households, the worst affected on the unrealised-gain axis, each at the lambda it LANDED at in
# flex-tiers rather than re-searched, so every cell is one solve. Four arms:
#
#   cur    the build as it stands, the paired baseline
#   resp   gain buckets re-spaced 0.05/0.25/0.55 -> 0.10/0.45/0.80: moves the CEILING, free in cells
#   gint   the gain axis interpolated instead of snapped: removes the SNAP, 16 read corners, no cells
#   pcls   bucket 0 of the lump-sum axis reachable only by a state that has taken nothing
#
# SOLVERONLY=1 skips the five rival arms, which are identical in every arm here and were most of the
# run: measured at 906 s a cell before, 182 s after, on the same 12-point probe. SEARCH=400 because
# with lambda held the search floor rate is diagnostic only - the comparison statistics come from the
# 3,000 held-out paths.
#
# WHAT THIS DECIDES: if every arm's median pot is within 2% of cur on all twelve, the ceilings are
# second-order, 6e stage 2 never runs, and E3/E4 are sized against a grid that will not move. If any
# arm differs materially, stage 2 follows and must land before both 6d stages.
#
# WHAT IT CANNOT DECIDE: with lambda held the floor rate is not pinned, so the arms are not compared at
# equal downside and no number here is a headline.
set -u
J=""
add() { J="$J$1:$2:$3
"; }
#   ONLY  lambda (landed in flex-tiers)   id
for A in cur resp gint pcls; do
  add 60 2                    $A   # S300  peak gain 89.0%
  add 48 2                    $A   # S240  84.8%
  add 50 2                    $A   # S252  84.8%
  add 56 2                    $A   # S276  84.8%
  add 64 0.9457416090031758   $A   # S330  83.7%
  add 54 0.9457416090031758   $A   # S268  82.4%
  add 74 0.005                $A   # S390  80.3%  (6c's failed control)
  add 78 2                    $A   # S410  79.0%
  add 58 1.140477893362459    $A   # S292  78.9%
  add 80 2                    $A   # S414  78.9%
  add 32 2                    $A   # S184  77.4%
  add 28 0.6503449126242364   $A   # S172  76.5%
done
echo "=== 6e stage 1: $(printf '%s' "$J" | grep -c .) cells, 4 arms x 12 households ==="
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  IDX=$1; LAM=$2; ARM=$3
  case "$ARM" in
    cur)  EXTRA="" ;;
    resp) EXTRA="GAINB=0.10,0.45,0.80" ;;
    gint) EXTRA="GAININT=1" ;;
    pcls) EXTRA="PCLSSTRICT=1" ;;
  esac
  env $EXTRA SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=3 TIERS=1 ONLY=$IDX FLOOR=0.8 CONF=0.9 \
    LEVELS=1.2,1.1,1,0.9,0.8 MARGIN=0.005 RAISE=0.003 \
    timeout 5400 node research/solver/experiment.mjs flex gf-$ARM 30 3000 7001 7002 2>&1 | tail -1
'
echo "=== 6e stage 1 done ==="
