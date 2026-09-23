#!/usr/bin/env bash
#
# TASK #106: THE DEAD CORNER IN LOGIT SPACE. Hypothesis written into PLAN.md BEFORE this runs.
#
# Survival is interpolated in log-odds with probabilities clamped at 1e-6, so a corner whose true
# survival is zero enters at ln(1e-6) = -13.8 rather than at 0. A household whose pension share sits
# above the 0.8 share node while it is still short of pension access draws a quarter of its read from
# the a = 1.0 node, which cannot fund the bridge. Predicted pull: 0.25 x -13.8 = -3.45 in log-odds.
#
# THE CLASS (from the inputs, no run): S126 alone - retired at 55, access at 58, share 0.85.
# CONTROLS: S184, S240, S300 (share 0.85 but still WORKING, retiring after access - node alive),
# S004 (share 0.85, past access) and S162 (in the bridge, share 0.5 - no weight on that node).
#
# TWO ARMS. The clamp is the mechanism's own dial: at 1e-3 the dead corner enters at -6.9, half the pull.
#   default clamp 1e-6   PREDICTED: S126 reads far below its simulation; controls within ~3 points
#   clamp 1e-3           PREDICTED: S126's read rises sharply (S126 from ~7.5% toward ~30%: odds x ~5.6);
#                        the controls do not move by more than a point
# FALSIFIED IF: a control reads badly, or S126's read does not respond to the clamp.
#
# bias.mjs prints table@0 against the simulated survival of the solver's own policy (1,500 held-out paths).
set -u
J=""
for CL in default 1e-3; do
  for K in 20 32 48 60 0 26; do J="$J$K:$CL
"; done
done
echo "=== task 106: $(printf '%s' "$J" | grep -c .) cells, 6 households x 2 clamps ==="
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; CL=$2
  if [ "$CL" = default ]; then
    echo "clamp 1e-6  $(timeout 3600 node research/solver/bias.mjs $K 30 2>&1 | tail -1)"
  else
    echo "clamp $CL  $(SOLVER_CLAMP=$CL timeout 3600 node research/solver/bias.mjs $K 30 2>&1 | tail -1)"
  fi
'
echo "=== task 106 done ==="
