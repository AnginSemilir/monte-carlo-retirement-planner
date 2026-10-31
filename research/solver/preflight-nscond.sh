#!/bin/bash
# NS-COND's preflight (PREDICTION="none:..."; the test itself runs under predictions/diag-nscond.md). It prints no item
# line (the deep review after NSB: NSB's preflight printed its item lines into its output):
#   A. the table checks at the REGISTERED 30 points on all five households (NSCOND_TABLES: DEADSTEP and the census, no
#      read), four at once, into results/diagnscond-tables, read by reduce-nscond.mjs --tables (the deep review's
#      structural answer: a check of the solved tables runs at the registered grid before registration);
#   B. the full read path, blind (NSCOND_BLIND: every read and check, no item line, no file), at 4 points and 3 paths a
#      world on all five households, into results/diagnscond-blind: every audit must exit 0 and print no item line;
#   C. the five plants on S370 at 4 points, each refused by its own check: deadshift (wdRead), norestore (restore) and
#      rebuild (rebuild) blind; deadh (DEADSTEP FAIL) and deadnext (DEADSTEP NEXT) on the tables alone.
set -u
A=research/solver/results/diagnscond-tables; Bd=research/solver/results/diagnscond-blind; C=research/solver/results/diagnscond-plant
rm -rf "$A" "$Bd" "$C"-*; mkdir -p "$A" "$Bd"
fail=0
seq 0 4 | xargs -P "${PAR:-4}" -I{} sh -c \
  'NSCOND_TABLES=1 DIAGNSCOND_OUT=research/solver/results/diagnscond-tables node research/solver/audit-nscond.mjs 30 2000 part {}/5 7002 > research/solver/results/diagnscond-tables/case{}.txt 2>&1 || echo "tables job {} failed"'
node research/solver/reduce-nscond.mjs "$A" 2000 30 --tables || fail=1
seq 0 4 | xargs -P "${PAR:-4}" -I{} sh -c \
  'NSCOND_BLIND=1 DIAGNSCOND_OUT=research/solver/results/diagnscond-blind node research/solver/audit-nscond.mjs 4 3 part {}/5 7002 > research/solver/results/diagnscond-blind/case{}.txt 2>&1 || echo "blind job {} failed"'
if grep -qE "^\s+item[123] " "$Bd"/case*.txt; then echo "AN ITEM LINE WAS PRINTED IN A BLIND RUN - the preflight fails"; fail=1; fi
nb=$(grep -l "blind: reads" "$Bd"/case*.txt | wc -l)
if [ "$nb" -ne 5 ]; then echo "THE BLIND RUN FINISHED ON $nb OF 5 HOUSEHOLDS - the preflight fails"; grep -h "audit-nscond:\|Error" "$Bd"/case*.txt | head -5; fail=1; fi
grep -h "checks \|deadstep \|blind: " "$Bd"/case*.txt | cut -c1-240
for p in deadshift:wdReadBad:blind norestore:restoreBad:blind rebuild:rebuildBad:blind deadh:deadstepFailBad:tables deadnext:deadstepNextBad:tables; do
  name=${p%%:*}; rest=${p#*:}; key=${rest%%:*}; mode=${rest##*:}; dir="$C-$name"; mkdir -p "$dir"
  if [ "$mode" = blind ]; then NSCOND_BLIND=1 NSCOND_PLANT=$name DIAGNSCOND_OUT="$dir" node research/solver/audit-nscond.mjs 4 3 part 0/5 7002 > "$dir/case0.txt" 2>&1
  else NSCOND_TABLES=1 NSCOND_PLANT=$name DIAGNSCOND_OUT="$dir" node research/solver/audit-nscond.mjs 4 3 part 0/5 7002 > "$dir/case0.txt" 2>&1; fi
  code=$?
  if [ "$code" -eq 0 ] || ! grep -qE "(self-check|table check) failed or ran on nothing" "$dir/case0.txt" || ! grep -qE "\"$key\":[1-9]" "$dir/case0.txt"; then echo "PLANT $name NOT REFUSED BY ITS CHECK ($key) - the preflight fails"; fail=1; else echo "the $name plant refused by its check $key (exit $code)"; fi
  grep -h "deadstep " "$dir/case0.txt" | cut -c1-240
done
exit $fail
