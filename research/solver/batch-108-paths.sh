#!/usr/bin/env bash
#
# TASK #108: SWEEP THE LANDING AGAINST SEARCH-PATH COUNT.  Promoted ahead of E3 by the split
# measurement (results-part-e-measured.txt): solving is 45.7% of a landing and running paths forward
# is 54.3%, so every phase of Part E speeds up the minority half. Each solve is followed by 5,400
# forward runs costing 373 s against the solve's own 314 s, and that 5,400 was chosen once and has
# never been swept.
#
# THE QUESTION, sharpened by what the 41 actually did. All 22 genuine landings in flex-tiers came in
# ABOVE their ask, by +0.37 to +2.73 - no undershoot anywhere - because MARGIN=0.005 was added to
# absorb exactly the winner's curse this sweep is probing. So the question is not "does the curse
# exist" but: **with that half-point margin in place, how few search paths can we use before
# households start MISSING their ask?**
#
# Eight genuine landings spanning the range of asks (70.9 to 97.9) and of overshoot (+0.37 to +2.73),
# at four path counts. Each cell LANDS - lambda is bisected, not held - so SOLVERONLY is used with
# CONF given explicitly as each household's own flex-tiers ask, which keeps every cell comparable to
# the 6b record and owes the rival arms nothing.
#
# Reported on 3,000 HELD-OUT paths, seed 7002, exactly as flex-tiers reported.
set -u
J=""
add() { J="$J$1:$2:$3
"; }
for A in 600 1200 2400 5400; do
  add  8 0.9790  $A   # S058  ask 97.9, flex-tiers got 98.3 (+0.37), 3 solves
  add 10 0.7650  $A   # S070  ask 76.5, got 77.3 (+0.77), 7 solves
  add  2 0.8840  $A   # S020  ask 88.4, got 89.3 (+0.87), 7 solves
  add 24 0.7090  $A   # S154  ask 70.9, got 71.9 (+1.03), 6 solves
  add 30 0.8610  $A   # S178  ask 86.1, got 87.2 (+1.07), 7 solves
  add 62 0.7790  $A   # S318  ask 77.9, got 79.1 (+1.17), 6 solves
  add 66 0.7200  $A   # S342  ask 72.0, got 73.9 (+1.87), 7 solves
  add 54 0.7510  $A   # S268  ask 75.1, got 77.8 (+2.73), 7 solves
done
echo "=== task 108: $(printf '%s' "$J" | grep -c .) cells, 8 households x 4 path counts ==="
printf '%s' "$J" | grep . | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  IDX=$1; ASK=$2; NP=$3
  SOLVERONLY=1 SEARCH=$NP MIX=3 TIERS=1 ONLY=$IDX FLOOR=0.8 CONF=$ASK \
    LEVELS=1.2,1.1,1,0.9,0.8 MARGIN=0.005 RAISE=0.003 \
    timeout 21600 node research/solver/experiment.mjs flex sp-$NP 30 3000 7001 7002 2>&1 | tail -1
'
echo "=== task 108 done ==="
