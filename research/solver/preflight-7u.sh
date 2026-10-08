#!/bin/bash
# 7u's preflight (PREDICTION="none:..."), on the tuning seed 7002 so nothing before the run touches 7013:
#   A. the e3pcls pin at the snapshot (items/7u.md, 8 Oct item 2: the pin MATCHES before 7u runs e3pcls on);
#   B. audit-7u.mjs's 220 units at 4 points and 20 paths, PAR at once (default 4), into results/diag7u-preflight, read by
#      reduce-7u.mjs --preflight 20 4: its gate (the stage lines among it) and traces, and its reading exercised; no figure
#      is read;
#   C. the stage logging changes no move: S370's CAND and SHIP units at 0.02 (units 20 and 130) run again with
#      AUDIT7U_NOSTAGE=1, and each trace (survival, level, tier, wealth, tax, failure year) must be the logged run's bit for
#      bit;
#   D. three plants in copies of B's logs, each to be refused by the gate naming its fault: SHIP with e3pcls on, CAND with
#      e3pcls off, and a stage unit with its access line removed.
set -u
PAR=${PAR:-4}
OUT=research/solver/results/diag7u-preflight
rm -rf "$OUT" "$OUT-nostage" "$OUT-plant1" "$OUT-plant2" "$OUT-plant3"; mkdir -p "$OUT" "$OUT-nostage"
echo "A. the e3pcls pin: $(node research/solver/e3pcls-pin.mjs | tail -1)"
seq 0 219 | xargs -P "$PAR" -I{} sh -c \
  'DIAG7U_OUT=research/solver/results/diag7u-preflight timeout 3600 node research/solver/audit-7u.mjs 4 20 part {}/220 7002 > research/solver/results/diag7u-preflight/case{}.txt 2>&1 || echo "unit {} failed"'
grep -h "Error\|audit-7u:" "$OUT"/case*.txt | head -5
echo "B. units done by arm:"; grep -h " done " "$OUT"/case*.txt | sed 's/^ *//' | awk '{print $2}' | sed 's/\/.*//' | sort | uniq -c
node research/solver/reduce-7u.mjs "$OUT" 20 4 --preflight > "$OUT/reduce.txt"; echo "reduce-7u (the preflight) exit $?"; grep -E "PREFLIGHT|GATE|OUTCOME|INCOMPLETE" "$OUT/reduce.txt"
for i in 20 130; do AUDIT7U_NOSTAGE=1 DIAG7U_OUT=$OUT-nostage timeout 3600 node research/solver/audit-7u.mjs 4 20 part $i/220 7002 > "$OUT-nostage/case$i.txt" 2>&1 || echo "unit $i (unlogged) failed"; done
node -e '
const fs = require("fs"), zlib = require("zlib"), A = process.argv[1], B = process.argv[2];
const files = fs.readdirSync(B).filter(f => f.endsWith(".json.gz"));
if (files.length !== 2) { console.log(`C. FAILED: ${files.length} unlogged traces, not 2`); process.exit(1); }
for (const f of files) { const a = JSON.parse(zlib.gunzipSync(fs.readFileSync(A + "/" + f))), b = JSON.parse(zlib.gunzipSync(fs.readFileSync(B + "/" + f)));
  const keys = ["survived", "level", "tier", "wealth", "taxPaid", "failYear"], diff = keys.filter(k => a[k] !== b[k]);
  console.log(`C. ${f}: ${diff.length ? "DIFFERS in " + diff.join(", ") : "IDENTICAL"} logged and unlogged (sim ${a.sim} and ${b.sim})`); if (diff.length) process.exit(1); }' "$OUT" "$OUT-nostage" || { echo "C. the stage logging changed a move - the preflight fails"; exit 1; }
plant() { # $1 the copy, $2 the sed program, $3 the file pattern, $4 the reason the gate must name
  cp -r "$OUT" "$1"; f=$(grep -l "$3" "$1"/case*.txt | head -1); sed -i "$2" "$f"
  if node research/solver/reduce-7u.mjs "$1" 20 4 --preflight > "$1/reduce.txt"; then echo "D. PLANT NOT REFUSED ($4) - the preflight fails"; exit 1; fi
  echo "D. the gate refused the plant ($4): $(grep -c "$4" "$1/reduce.txt") lines naming it"; }
plant "$OUT-plant1" '0,/e3pcls false/s//e3pcls true/' 'unit SHIP/' 'e3pcls is true, the prediction names false'
plant "$OUT-plant2" '0,/e3pcls true/s//e3pcls false/' 'unit CAND/' 'e3pcls is false, the prediction names true'
plant "$OUT-plant3" '/ access CAND\//d' ' access CAND/' 'access lines, not 1'
echo "preflight done"
