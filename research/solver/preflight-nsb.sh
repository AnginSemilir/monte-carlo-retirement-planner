#!/bin/bash
# NSB's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-nsb.md): audit-nsb.mjs's 5
# households at 4 wealth points and 3 paths a world (seed 7002), PAR at a time (default 1, the light lane), into
# results/diagnsb-preflight, read by reduce-nsb.mjs --preflight (its gate and the files; the identity and the items are the
# full run's); then the three plants on S370 alone, each of which one of the audit's own checks must refuse: deadshift
# (wd's weight on the cell's other corner: wdRead), norestore (the swapped tables left in place: restore) and rebuild (the
# solve's own reader table rebuilt on the order reference: rebuild). No figure is read.
set -u
OUT=research/solver/results/diagnsb-preflight
rm -rf "$OUT" "$OUT"-plant-*; mkdir -p "$OUT"
seq 0 4 | xargs -P "${PAR:-1}" -I{} sh -c \
  'DIAGNSB_OUT=research/solver/results/diagnsb-preflight node research/solver/audit-nsb.mjs 4 3 part {}/5 7002 > research/solver/results/diagnsb-preflight/case{}.txt 2>&1 || echo "job {} failed"'
grep -h "Error\|audit-nsb:" "$OUT"/case*.txt | head -5
grep -h "checks \|ran \|item[123] \|dead " "$OUT"/case*.txt | cut -c1-220
node research/solver/reduce-nsb.mjs "$OUT" 3 4 --preflight; echo "reduce-nsb (the preflight) exit $?"
fail=0
for p in deadshift:wdReadBad norestore:restoreBad rebuild:rebuildBad; do
  name=${p%%:*}; key=${p##*:}; dir="$OUT-plant-$name"; mkdir -p "$dir"
  NSB_PLANT=$name DIAGNSB_OUT="$dir" node research/solver/audit-nsb.mjs 4 3 part 0/5 7002 > "$dir/case0.txt" 2>&1
  code=$?
  if [ "$code" -eq 0 ] || ! grep -q "self-check failed or ran on nothing" "$dir/case0.txt" || ! grep -qE "\"$key\":[1-9]" "$dir/case0.txt"; then echo "PLANT $name NOT REFUSED BY ITS CHECK ($key) - the preflight fails"; fail=1; else echo "the $name plant refused by its check $key (exit $code)"; fi
done
exit $fail
