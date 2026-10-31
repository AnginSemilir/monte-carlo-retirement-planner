#!/bin/bash
# NE-SPLIT's preflight (predictions/diag-nesplit.md): on the tuning seed 7002 at 4 points, nothing read as a figure.
#   A. the reducer's planted checks (reduce-nesplit.mjs --planted);
#   B. the audit's three units at 4 points, 40 paths and 10 a world, through the reducer's gate in --preflight mode;
#   C. the audit's two plants on S364 at 0.02, each of which must make it refuse (exit 3): partsum (one part moved by
#      1e-6, so partsSum fails) and force (the wrong opening forced as CAND's own, so forceIdentity fails).
set -u
OUT=${TMPDIR:-/tmp}/nesplit-preflight.$$
mkdir -p "$OUT"
echo "A. $(node research/solver/reduce-nesplit.mjs --planted | grep -E '^planted|^EDGES' | tr '\n' ' ')"
DIAGNESPLIT_OUT="$OUT" node research/solver/audit-nesplit.mjs 4 40 10 part 0/1 7002 > "$OUT/case0.txt" 2>&1 || { echo "B. the audit exited $?"; tail -5 "$OUT/case0.txt"; exit 1; }
echo "B. $(node research/solver/reduce-nesplit.mjs "$OUT" 40 4 10 --preflight | grep -E '^GATE|^PREFLIGHT' | tr '\n' ' ')"
for p in partsum force; do
  DIAGNESPLIT_OUT="$OUT/plant-$p" NESPLIT_PLANT=$p node research/solver/audit-nesplit.mjs 4 40 10 part 0/3 7002 > "$OUT/plant-$p.txt" 2>&1
  code=$?
  if [ "$code" = 3 ]; then echo "C. the plant $p: refused (exit 3; $(grep -E 'audit-nesplit:' "$OUT/plant-$p.txt" | head -1))"
  else echo "C. the plant $p: NOT refused (exit $code)"; exit 1; fi
done
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
