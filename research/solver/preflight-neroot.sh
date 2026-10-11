#!/bin/bash
# NE-ROOT's preflight (predictions/diag-neroot.md): on the tuning seed 7002 at 4 points, nothing read as a figure.
#   A. the reducer's planted checks (reduce-neroot.mjs --planted);
#   B. the audit's eleven jobs at 4 points and 40 paths a world, four at once, through the reducer's gate in --preflight mode;
#   C. the audit's two plants, each of which must make it refuse (exit 3): split on S364's BASE job (r moved by 1e-3, so
#      splitIdentity fails) and arm on S364's R0 job (run without its arm, so armTook fails).
set -u
OUT=${TMPDIR:-/tmp}/neroot-preflight.$$
mkdir -p "$OUT"
echo "A. $(node research/solver/reduce-neroot.mjs --planted | grep -E '^planted|^EDGES' | tr '\n' ' ')"
seq 0 10 | xargs -P 4 -I{} sh -c "DIAGNEROOT_OUT=$OUT node research/solver/audit-neroot.mjs 4 40 part {}/11 7002 > $OUT/case{}.txt 2>&1 || echo 'B. job {} exited'"
echo "B. $(node research/solver/reduce-neroot.mjs "$OUT" 40 4 --preflight | grep -E '^GATE|^PREFLIGHT|^  ' | tr '\n' ' ')"
for p in split:0 arm:1; do
  name=${p%:*}; job=${p#*:}
  DIAGNEROOT_OUT="$OUT/plant-$name" NEROOT_PLANT=$name node research/solver/audit-neroot.mjs 4 40 part $job/11 7002 > "$OUT/plant-$name.txt" 2>&1
  code=$?
  if [ "$code" = 3 ]; then echo "C. the plant $name: refused (exit 3; $(grep -E 'audit-neroot:' "$OUT/plant-$name.txt" | head -1))"
  else echo "C. the plant $name: NOT refused (exit $code)"; exit 1; fi
done
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
