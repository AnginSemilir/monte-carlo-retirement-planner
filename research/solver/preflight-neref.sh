#!/bin/bash
# NE-REF's preflight (predictions/diag-neref.md): on the tuning seed 7002, the 60-point jobs' wealth points divided by 30
# (4 points), the ledger at 10,000 draws and 400 flow paths a world, nothing read as a figure.
#   A. the reducer's planted checks (reduce-neref.mjs --planted);
#   B. the audit's five jobs at 40 paths a world, four at once, through the reducer's gate in --preflight mode (NE-EDGE's
#      records are not read at these settings), with each job's solve seconds;
#   C. the audit's three plants, each of which must make it refuse (exit 3): arm (the ledger without its split, so armTook
#      fails), mirror (the ledger's simulators on another seed, so mirrorTook fails) and force (RSO forcing another
#      opening, so forceIdentity fails).
set -u
OUT=${TMPDIR:-/tmp}/neref-preflight.$$
mkdir -p "$OUT"
echo "A. $(node research/solver/reduce-neref.mjs --planted | grep -E '^planted|^EDGES' | tr '\n' ' ')"
seq 0 4 | xargs -P 4 -I{} sh -c "DIAGNEREF_OUT=$OUT node research/solver/audit-neref.mjs 30 40 part {}/5 7002 10000 400 > $OUT/case{}.txt 2>&1 || echo 'B. job {} exited'"
echo "B. $(node research/solver/reduce-neref.mjs "$OUT" 40 30 10000 400 --preflight | grep -E '^GATE|^PREFLIGHT|^  ' | tr '\n' ' ')"
echo "B. solve seconds by job: $(grep -h 'solve CAND' $OUT/case*.txt | sed -E 's/.*solve CAND ([^:]+): .* secs ([0-9]+)/\1 \2/' | tr '\n' ';')"
echo "B. job seconds (forceIdentity lines): $(grep -h 'forceIdentity' $OUT/case*.txt | sed -E 's/.*checks ([^:]+): .* secs ([0-9]+)/\1 \2/' | tr '\n' ';')"
for pj in arm:0 mirror:0 force:2; do
  p=${pj%%:*}
  DIAGNEREF_OUT="$OUT/plant-$p" NEREF_PLANT=$p node research/solver/audit-neref.mjs 30 40 part ${pj##*:}/5 7002 10000 400 > "$OUT/plant-$p.txt" 2>&1
  code=$?
  if [ "$code" = 3 ]; then echo "C. the plant $p: refused (exit 3; $(grep -E 'audit-neref:' "$OUT/plant-$p.txt" | head -1))"
  else echo "C. the plant $p: NOT refused (exit $code)"; exit 1; fi
done
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
