#!/bin/bash
# 7aj's preflight (PREDICTION="none:..."): audit-7aj.mjs's 50 units at 4 points and 20 paths (seed 7002), four at once, into
# results/diag7aj-preflight, read by reduce-7aj.mjs --preflight 20 4 - its gate and traces, and its reading exercised; no
# figure is read. Then a planted copy of the logs with one SHIP unit's interpolated allowance axis switched on, which the
# gate must refuse.
set -u
OUT=research/solver/results/diag7aj-preflight
rm -rf "$OUT" "$OUT-plant"; mkdir -p "$OUT"
seq 0 49 | xargs -P 4 -I{} sh -c \
  'DIAG7AJ_OUT=research/solver/results/diag7aj-preflight timeout 3600 node research/solver/audit-7aj.mjs 4 20 part {}/50 7002 > research/solver/results/diag7aj-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "Error\|audit-7aj:" "$OUT"/case*.txt | head -5
grep -h " done " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $2}' | sed 's/\/.*//' | sort | uniq -c
node research/solver/reduce-7aj.mjs "$OUT" 20 4 --preflight > "$OUT/reduce.txt"; echo "reduce-7aj (the preflight) exit $?"; grep -E "PREFLIGHT|GATE|OUTCOME|INCOMPLETE" "$OUT/reduce.txt"
cp -r "$OUT" "$OUT-plant"
f=$(grep -l "unit SHIP/" "$OUT-plant"/case*.txt | head -1)
sed -i '0,/pclsInterp false/s//pclsInterp true/' "$f"
if node research/solver/reduce-7aj.mjs "$OUT-plant" 20 4 --preflight > "$OUT-plant/reduce.txt"; then echo "PLANT NOT REFUSED BY THE GATE - the preflight fails"; exit 1; fi
grep -c "pclsInterp is true, the prediction names false" "$OUT-plant/reduce.txt" | sed 's/^/the gate refused the plant; lines naming the planted axis: /'
