#!/bin/bash
# NE-EDGE's preflight (predictions/diag-needge.md): on the tuning seed 7002, every job's wealth points divided by 30
# (4 points at the least), nothing read as a figure.
#   A. the reducer's planted checks (reduce-needge.mjs --planted);
#   B. the audit's seven jobs at 40 paths a world, four at once, through the reducer's gate in --preflight mode (NE-GRID C's
#      and B1's records are not read at these grids), with each job's solve seconds;
#   C. the audit's three plants on S364's RS job, each of which must make it refuse (exit 3): arm (run without its split,
#      so armTook fails), pair (D a tier step off, so pairTook fails) and force (another opening forced as CAND's own, so
#      forceIdentity fails).
set -u
OUT=${TMPDIR:-/tmp}/needge-preflight.$$
mkdir -p "$OUT"
echo "A. $(node research/solver/reduce-needge.mjs --planted | grep -E '^planted|^EDGES' | tr '\n' ' ')"
seq 0 6 | xargs -P 4 -I{} sh -c "DIAGNEEDGE_OUT=$OUT node research/solver/audit-needge.mjs 30 40 part {}/7 7002 > $OUT/case{}.txt 2>&1 || echo 'B. job {} exited'"
echo "B. $(node research/solver/reduce-needge.mjs "$OUT" 40 30 --preflight | grep -E '^GATE|^PREFLIGHT|^  ' | tr '\n' ' ')"
echo "B. solve seconds by job: $(grep -h 'solve CAND' $OUT/case*.txt | sed -E 's/.*solve CAND ([^:]+): .* secs ([0-9]+)/\1 \2/' | tr '\n' ';')"
for pj in arm:2 pair:2 force:2; do
  p=${pj%%:*}
  DIAGNEEDGE_OUT="$OUT/plant-$p" NEEDGE_PLANT=$p node research/solver/audit-needge.mjs 30 40 part ${pj##*:}/7 7002 > "$OUT/plant-$p.txt" 2>&1
  code=$?
  if [ "$code" = 3 ]; then echo "C. the plant $p: refused (exit 3; $(grep -E 'audit-needge:' "$OUT/plant-$p.txt" | head -1))"
  else echo "C. the plant $p: NOT refused (exit $code)"; exit 1; fi
done
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
