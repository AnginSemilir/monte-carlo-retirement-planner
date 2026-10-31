#!/bin/bash
# PAUSE-S128's preflight (PREDICTION="none:..."; the measurement runs under predictions/measure-pause-s128.md): audit-pause.mjs
# with PAUSE_HH=S128, its 3 parts at the real grid (30 points) and 20 paths (seed 7005), one at a time, into
# results/diagpause128-preflight, read by reduce-pause128.mjs --preflight - its gate, the files and THE IDENTITY against
# EDGE-SPLIT's S128 files and HYB's on the first 20 paths; it prints no figure. Then the plant (PAUSE_PLANT=scale, 4 points,
# 20 paths, SNAP's part), which the audit's own self-check must catch and the reducer must refuse.
set -u
OUT=research/solver/results/diagpause128-preflight
rm -rf "$OUT" "$OUT-plant"; mkdir -p "$OUT" "$OUT-plant"
seq 0 2 | xargs -P 1 -I{} sh -c \
  'PAUSE_HH=S128 DIAGPAUSE_OUT=research/solver/results/diagpause128-preflight timeout 3600 node research/solver/audit-pause.mjs 30 20 part {}/3 7005 > research/solver/results/diagpause128-preflight/case{}.txt 2>&1 || echo "part {} failed"'
grep -h "Error\|audit-pause:" "$OUT"/case*.txt | head -5
node research/solver/reduce-pause128.mjs "$OUT" 20 30 --preflight | head -8; echo "reduce-pause128 (the preflight) exit ${PIPESTATUS[0]}"
PAUSE_HH=S128 PAUSE_PLANT=scale DIAGPAUSE_OUT=research/solver/results/diagpause128-preflight-plant node research/solver/audit-pause.mjs 4 20 part 0/3 7005 > "$OUT-plant/case0.txt" 2>&1 || echo "the plant run failed"
grep -h "sweep" "$OUT-plant/case0.txt"
node -e '
const t = require("fs").readFileSync(process.argv[1], "utf8"), L = [...t.matchAll(/sweep \S+: flat \d+ points \d+ repro (\d+)\/(\d+)/g)];
if (L.length !== 1 || L.some(m => !(+m[2] > 0) || !(+m[1] < +m[2]))) { console.log(`PLANT NOT CAUGHT BY THE SELF-CHECK: ${L.map(m => m[1] + "/" + m[2]).join(", ") || "no sweep line"} - the preflight fails`); process.exit(1); }
console.log(`the plant caught by the self-check: repro ${L.map(m => m[1] + "/" + m[2]).join(", ")}`);' "$OUT-plant/case0.txt" || exit 1
if node research/solver/reduce-pause128.mjs "$OUT-plant" 20 4 --preflight > "$OUT-plant/reduce.txt"; then echo "PLANT NOT REFUSED BY THE GATE - the preflight fails"; exit 1; fi
grep -c "planted fault\|self-check failed" "$OUT-plant/reduce.txt" | sed 's/^/the gate refused the plant; lines naming it: /'
