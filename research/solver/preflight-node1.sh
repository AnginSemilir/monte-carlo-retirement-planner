#!/bin/bash
# NODE-1's preflight (predictions/diag-node1.md): on the tuning seed 7002, the jobs' wealth points divided by 15 (4 points),
# nothing read as a figure.
#   A. the reducer's planted checks (reduce-node1.mjs --planted);
#   B. the audit's two jobs at 40 paths a world, both at once, through the reducer's gate in --preflight mode (REF-2's
#      records are not read at these settings), with THE ARM'S REACH (O153: BN's own-opening tables must differ from BO's
#      in some world) and each job's solve seconds;
#   C. the audit's two plants, each of which must make it refuse (exit 3): arm (BN without its nodes, so armTook fails) and
#      force (BN forcing another opening, so forceIdentity fails).
set -u
OUT=${TMPDIR:-/tmp}/node1-preflight.$$
mkdir -p "$OUT"
echo "A. $(node research/solver/reduce-node1.mjs --planted | grep -E '^planted|^EDGES' | tr '\n' ' ')"
printf '%s\n' 0 1 | xargs -P 2 -I{} sh -c "DIAGNODE1_OUT=$OUT node research/solver/audit-node1.mjs 15 40 part {}/2 7002 > $OUT/case{}.txt 2>&1 || echo 'B. job {} exited'"
echo "B. $(node research/solver/reduce-node1.mjs "$OUT" 40 15 --preflight | grep -E "^GATE|^ARM'S REACH|^REFUSED|^PREFLIGHT|^  " | tr '\n' ' ')"
echo "B. solve seconds by job: $(grep -h 'solve CAND' $OUT/case*.txt | sed -E 's/.*solve CAND ([^:]+): .* secs ([0-9]+)/\1 \2/' | tr '\n' ';')"
echo "B. job seconds (forceIdentity lines): $(grep -h 'forceIdentity' $OUT/case*.txt | sed -E 's/.*checks ([^:]+): .* secs ([0-9]+)/\1 \2/' | tr '\n' ';')"
for pj in arm:0 force:0; do
  p=${pj%%:*}
  DIAGNODE1_OUT="$OUT/plant-$p" NODE1_PLANT=$p node research/solver/audit-node1.mjs 15 40 part ${pj##*:}/2 7002 > "$OUT/plant-$p.txt" 2>&1
  code=$?
  if [ "$code" = 3 ]; then echo "C. the plant $p: refused (exit 3; $(grep -E 'audit-node1:' "$OUT/plant-$p.txt" | head -1))"
  else echo "C. the plant $p: NOT refused (exit $code)"; exit 1; fi
done
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
