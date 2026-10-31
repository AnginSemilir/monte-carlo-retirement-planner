#!/bin/bash
# NE-BLEND stage A's preflight (predictions/diag-neblend-a.md): on the tuning seed 7002 at 4 points, nothing read as a figure.
#   A. the reducer's planted checks (reduce-neblend-a.mjs --planted);
#   B. the audit's four jobs at 4 points and 40 paths a world, all at once, through the reducer's gate in --preflight mode;
#   C. the audit's two plants on bridge 4's LOR job, each of which must make it refuse (exit 3): arm (run without its arm,
#      so armTook fails) and force (another opening forced as CAND's own, so forceIdentity fails).
set -u
OUT=${TMPDIR:-/tmp}/neblend-preflight.$$
mkdir -p "$OUT"
echo "A. $(node research/solver/reduce-neblend-a.mjs --planted | grep -E '^planted|^EDGES' | tr '\n' ' ')"
seq 0 3 | xargs -P 4 -I{} sh -c "DIAGNEBLEND_OUT=$OUT node research/solver/audit-neblend.mjs 4 40 part {}/4 7002 > $OUT/case{}.txt 2>&1 || echo 'B. job {} exited'"
echo "B. $(node research/solver/reduce-neblend-a.mjs "$OUT" 40 4 --preflight | grep -E '^GATE|^PREFLIGHT|^  ' | tr '\n' ' ')"
for p in arm force; do
  DIAGNEBLEND_OUT="$OUT/plant-$p" NEBLEND_PLANT=$p node research/solver/audit-neblend.mjs 4 40 part 1/4 7002 > "$OUT/plant-$p.txt" 2>&1
  code=$?
  if [ "$code" = 3 ]; then echo "C. the plant $p: refused (exit 3; $(grep -E 'audit-neblend:' "$OUT/plant-$p.txt" | head -1))"
  else echo "C. the plant $p: NOT refused (exit $code)"; exit 1; fi
done
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
