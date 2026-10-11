#!/bin/bash
# NE-GRID B1's preflight (predictions/diag-negrid-b1.md): on the tuning seed 7002 at 4 and 6 points, nothing read as a figure.
#   A. the reducer's planted checks (reduce-negrid-b1.mjs --planted);
#   B. the audit's twelve jobs at 4 and 6 points and 40 paths a world, four at once, through the reducer's gate in
#      --preflight mode (the records' reproduction is not read at these grids);
#   C. the audit's three plants on bridge 4's fine LOR job, each of which must make it refuse (exit 3): arm (run without its
#      arm, so armTook fails), pair (D taken a tier step off, so pairTook fails) and force (another opening forced as CAND's
#      own, so forceIdentity fails).
set -u
OUT=${TMPDIR:-/tmp}/negrid-preflight.$$
mkdir -p "$OUT"
echo "A. $(node research/solver/reduce-negrid-b1.mjs --planted | grep -E '^planted|^EDGES' | tr '\n' ' ')"
seq 0 11 | xargs -P 4 -I{} sh -c "DIAGNEGRID_OUT=$OUT node research/solver/audit-negrid.mjs 4 6 40 part {}/12 7002 > $OUT/case{}.txt 2>&1 || echo 'B. job {} exited'"
echo "B. $(node research/solver/reduce-negrid-b1.mjs "$OUT" 40 4 6 --preflight | grep -E '^GATE|^PREFLIGHT|^  ' | tr '\n' ' ')"
echo "B. solve seconds by job: $(grep -h 'solve CAND' $OUT/case*.txt | sed -E 's/.*solve CAND ([^:]+): .* secs ([0-9]+)/\1 \2/' | tr '\n' ';')"
for p in arm pair force; do
  DIAGNEGRID_OUT="$OUT/plant-$p" NEGRID_PLANT=$p node research/solver/audit-negrid.mjs 4 6 40 part 3/12 7002 > "$OUT/plant-$p.txt" 2>&1
  code=$?
  if [ "$code" = 3 ]; then echo "C. the plant $p: refused (exit 3; $(grep -E 'audit-negrid:' "$OUT/plant-$p.txt" | head -1))"
  else echo "C. the plant $p: NOT refused (exit $code)"; exit 1; fi
done
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
