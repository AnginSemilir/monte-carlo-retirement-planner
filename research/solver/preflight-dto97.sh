#!/bin/bash
# DT-O97's preflight (PREDICTION="none:..."): audit-dto97.mjs's 14 units at 4 points and 20 paths (seed 7005), four at once,
# into results/diagdto97-preflight, read by reduce-dto97.mjs --preflight 20 4 - its gate, the files, ADOPT-PI's files through
# their own gate and the access-line pairing; no figure is read. Then a planted copy of the logs with one unit's death tax
# set to 0, which the gate must refuse.
set -u
OUT=research/solver/results/diagdto97-preflight
rm -rf "$OUT" "$OUT-plant"; mkdir -p "$OUT"
seq 0 13 | xargs -P 4 -I{} sh -c \
  'DIAGDTO97_OUT=research/solver/results/diagdto97-preflight timeout 3600 node research/solver/audit-dto97.mjs 4 20 part {}/14 7005 > research/solver/results/diagdto97-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "Error\|audit-dto97:" "$OUT"/case*.txt | head -5
grep -h " solve \| done " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $1}' | sort | uniq -c
node research/solver/reduce-dto97.mjs "$OUT" 20 4 --preflight | head -8; echo "reduce-dto97 (the preflight) exit ${PIPESTATUS[0]}"
cp -r "$OUT" "$OUT-plant"
sed -i '0,/deathTax 0.4/s//deathTax 0/' "$OUT-plant/case0.txt"
if node research/solver/reduce-dto97.mjs "$OUT-plant" 20 4 --preflight > "$OUT-plant/reduce.txt"; then echo "PLANT NOT REFUSED BY THE GATE - the preflight fails"; exit 1; fi
grep -c "ran deathTax 0, not 0.4" "$OUT-plant/reduce.txt" | sed 's/^/the gate refused the plant; lines naming the planted death tax: /'
