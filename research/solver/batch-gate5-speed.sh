#!/bin/bash
# GATE 5 FOR SPEED-A (the review of 9 Nov, item 10, stage A; SPEED-A.md; a MEASUREMENT): batch-gate5.sh's run three times on the
# scratch tree carrying the review's prototypes, the machine running nothing else: the candidate as it is (OFF), then with ON
# (coarse at w2a3b3g2c2-NT-LRVOH-h3), then with ON+REF (and the thinner bridge reference) in the candidate's place
# (GATE5_RESEARCH), each into results/diaggate5-speed-<arm>/ and read by reduce-gate5.mjs into results/gate5-speed-<arm>.txt (the launcher links results/ back);
# then each household's bridge probe into results/gate5-bridge.txt. reduce-speed.mjs --gate5 reads them. Launched as
#   PREDICTION="none:gate 5 for SPEED-A, a measurement (D11, D68)" research/solver/run-from-snapshot.sh bash research/solver/batch-gate5-speed.sh
set -u
ON='{"w":2,"a":3,"b":3,"g":2,"c":2,"src":"NT","expand":"LRVOH","plant":"","climb":3}'
THIN='{"na":80,"nb":21,"nz":64,"foot":true,"stepAll":true}'
for arm in off on onref; do
  case $arm in off) RX='';; on) RX="{\"coarse\":$ON}";; onref) RX="{\"coarse\":$ON,\"adaptiveLattice\":$THIN}";; esac
  OUT=research/solver/results/diaggate5-speed-$arm
  rm -rf "$OUT"; mkdir -p "$OUT"
  for k in 0 1 2 3; do
    GATE5_RESEARCH="$RX" PRODUCT_POINTS=30 timeout 10800 node research/solver/audit-e2x.mjs 45 part $k/4 > "$OUT/case$k.txt" 2>&1 || echo "$arm household $k exited $?"
  done
  { echo "the candidate's research setting: ${RX:-none (the candidate as it is)}"; node research/solver/reduce-gate5.mjs "$OUT"; } > research/solver/results/gate5-speed-$arm.txt 2>&1 || echo "=== reduce-gate5.mjs did not read $arm inside the snapshot: reduce in the real tree"
  echo "gate 5 ($arm) done $(TZ=Europe/London date +%H:%M) UK"
done
node research/solver/audit-e2x.mjs 45 --bridge 2>&1 | grep "^gate5-bridge:" > research/solver/results/gate5-bridge.txt
echo "gate 5 for SPEED-A done $(TZ=Europe/London date +%H:%M) UK"
