#!/usr/bin/env bash
# 7i: is the bridge misread averaging or representation? audit-s126.mjs quad: F1 off, 5 against 15 return points, on the
# six bridge cases, paired (predictions/bridge-quad.md). Launch:
#   PREDICTION=research/solver/predictions/bridge-quad.md bash research/solver/run-from-snapshot.sh bash research/solver/batch-bridgequad.sh
set -u
OUT=research/solver/results/bridgequad
mkdir -p "$OUT"
printf '0\n1\n2\n3\n' | xargs -P 4 -I{} sh -c 'timeout 10800 node research/solver/audit-s126.mjs quad 16 1000 part {}/4 > research/solver/results/bridgequad/part-{}.txt 2>&1; echo "part {} exit $?"'
cat "$OUT"/part-0.txt "$OUT"/part-1.txt "$OUT"/part-2.txt "$OUT"/part-3.txt > "$OUT"/log.txt
node research/solver/read-bridgequad.mjs "$OUT"/log.txt
