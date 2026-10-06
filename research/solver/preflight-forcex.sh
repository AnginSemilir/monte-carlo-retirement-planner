#!/bin/bash
# FORCE-X's preflight (PREDICTION="none:..."): audit-forcex.mjs's 6 parts at the real grid (30 points) and 20 paths (seed 7005),
# four at once, into results/diagforcex-preflight, read by reduce-forcex.mjs --preflight 20 - its gate (the acting share
# included), the files and THE IDENTITY against EDGE-SPLIT's and HYB's files on the first 20 paths; no figure is printed. Then
# the leak plant (FORCEX_PLANT=leak, 4 points, 20 paths, S130's PCLSI-table part), which the identity must refuse.
set -u
OUT=research/solver/results/diagforcex-preflight
rm -rf "$OUT" "$OUT-plant"; mkdir -p "$OUT" "$OUT-plant"
seq 0 5 | xargs -P 4 -I{} sh -c \
  'DIAGFORCEX_OUT=research/solver/results/diagforcex-preflight timeout 3600 node research/solver/audit-forcex.mjs 30 20 part {}/6 7005 > research/solver/results/diagforcex-preflight/case{}.txt 2>&1 || echo "part {} failed"'
grep -h "Error\|audit-forcex:" "$OUT"/case*.txt | head -5
grep -h " force " "$OUT"/case*.txt
node research/solver/reduce-forcex.mjs "$OUT" 20 30 --preflight | head -8; echo "reduce-forcex (the preflight) exit ${PIPESTATUS[0]}"
FORCEX_PLANT=leak DIAGFORCEX_OUT=research/solver/results/diagforcex-preflight-plant node research/solver/audit-forcex.mjs 30 20 part 1/6 7005 > "$OUT-plant/case0.txt" 2>&1 || echo "the plant run failed"
# the identity itself must catch the leak: the planted S130 P-LO+X file against the clean preflight's (both at 30 points, the
# first 20 paths), every year up to each path's first force - and the gate must refuse the plant's logs
node --input-type=module -e '
import { identity, decodeX } from "./research/solver/reduce-forcex.mjs";
import { readFileSync } from "node:fs"; import { gunzipSync } from "node:zlib";
const rd = f => decodeX(JSON.parse(gunzipSync(readFileSync(f)).toString()));
const p = rd(process.argv[1] + "-plant/S130-p-lox.json.gz"), c = rd(process.argv[1] + "/S130-p-lox.json.gz");
const bad = identity(p, c, "plant against clean");
if (!bad.length) { console.log("PLANT NOT CAUGHT BY THE IDENTITY - the preflight fails"); process.exit(1); }
console.log(`the identity caught the leak: ${bad.join("; ")}`);' "$OUT" || exit 1
if node research/solver/reduce-forcex.mjs "$OUT-plant" 20 30 --preflight > "$OUT-plant/reduce.txt"; then echo "PLANT NOT REFUSED BY THE GATE - the preflight fails"; exit 1; fi
grep -c "planted fault" "$OUT-plant/reduce.txt" | sed 's/^/the gate refused the plant; lines naming the planted fault: /'
