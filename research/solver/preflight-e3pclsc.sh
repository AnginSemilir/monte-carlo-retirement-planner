#!/bin/bash
# E3-PCLS-C's preflight (PREDICTION="none:..."): audit-e3pclsc.mjs's 10 units at 4 points (plants at 8), four at once, into
# results/diage3pclsc-preflight, read by reduce-e3pclsc.mjs --preflight at 4 points - its parse, gate (every household
# testing its clause) and reading; no figure is read. Then a planted copy of the logs with one household's clause changed,
# which the gate must refuse.
set -u
OUT=research/solver/results/diage3pclsc-preflight
rm -rf "$OUT" "$OUT-plant"; mkdir -p "$OUT"
seq 0 9 | xargs -P 4 -I{} sh -c \
  'timeout 3600 node research/solver/audit-e3pclsc.mjs 4 part {}/10 > research/solver/results/diage3pclsc-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "Error\|audit-e3pclsc:" "$OUT"/case*.txt | head -5
node research/solver/reduce-e3pclsc.mjs "$OUT" 4 --preflight > "$OUT/reduce.txt"; echo "reduce-e3pclsc (the preflight) exit $?"; grep -E "GATE|VERDICT|median|PREFLIGHT|INCOMPLETE" "$OUT/reduce.txt"
cp -r "$OUT" "$OUT-plant"
f=$(grep -l "^S124 " "$OUT-plant"/case*.txt | head -1)
sed -i '0,/setBy none expected none/s//setBy work expected none/' "$f"
if node research/solver/reduce-e3pclsc.mjs "$OUT-plant" 4 --preflight > "$OUT-plant/reduce.txt"; then echo "PLANT NOT REFUSED BY THE GATE - the preflight fails"; exit 1; fi
grep -c "chosen for none" "$OUT-plant/reduce.txt" | sed 's/^/the gate refused the plant; lines naming the planted clause: /'
