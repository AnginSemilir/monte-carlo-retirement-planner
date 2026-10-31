#!/bin/bash
# PAUSE's preflight (PREDICTION="none:..."; the measurement itself runs under predictions/measure-pause.md): audit-pause.mjs's
# 4 parts at the real grid (30 points) and 20 paths (seed 7005), four at once, into results/diagpause-preflight, read by
# reduce-pause.mjs --preflight - its gate, the files and THE IDENTITY against EDGE-SPLIT's and HYB's files on the first 20 paths
# (so the main run's identity is known to hold before it starts); then the plant (PAUSE_PLANT=scale, 4 points, 20 paths, one
# part), which the audit's own self-check must catch on both arms and the reducer must refuse. No figure is read.
set -u
OUT=research/solver/results/diagpause-preflight
rm -rf "$OUT" "$OUT-plant"; mkdir -p "$OUT" "$OUT-plant"
seq 0 3 | xargs -P 4 -I{} sh -c \
  'DIAGPAUSE_OUT=research/solver/results/diagpause-preflight timeout 3600 node research/solver/audit-pause.mjs 30 20 part {}/4 7005 > research/solver/results/diagpause-preflight/case{}.txt 2>&1 || echo "part {} failed"'
grep -h "Error\|audit-pause:" "$OUT"/case*.txt | head -5
node research/solver/reduce-pause.mjs "$OUT" 20 30 --preflight | head -8; echo "reduce-pause (the preflight) exit ${PIPESTATUS[0]}"
PAUSE_PLANT=scale DIAGPAUSE_OUT=research/solver/results/diagpause-preflight-plant node research/solver/audit-pause.mjs 4 20 part 0/4 7005 > "$OUT-plant/case0.txt" 2>&1 || echo "the plant run failed"
grep -h "sweep" "$OUT-plant/case0.txt"
# the self-check itself must catch the plant (the plan-auditor's MINOR 3 of 6 Oct on 1fde232): every sweep line's repro k/n
# with n above 0 and k below n - the gate's refusal of the plant line alone would pass whatever the self-check did
node -e '
const t = require("fs").readFileSync(process.argv[1], "utf8"), L = [...t.matchAll(/sweep \S+: flat \d+ points \d+ repro (\d+)\/(\d+)/g)];
if (L.length !== 2 || L.some(m => !(+m[2] > 0) || !(+m[1] < +m[2]))) { console.log(`PLANT NOT CAUGHT BY THE SELF-CHECK: ${L.map(m => m[1] + "/" + m[2]).join(", ") || "no sweep line"} - the preflight fails`); process.exit(1); }
console.log(`the plant caught by the self-check on both arms: repro ${L.map(m => m[1] + "/" + m[2]).join(", ")}`);' "$OUT-plant/case0.txt" || exit 1
if node research/solver/reduce-pause.mjs "$OUT-plant" 20 4 --preflight > "$OUT-plant/reduce.txt"; then echo "PLANT NOT REFUSED BY THE GATE - the preflight fails"; exit 1; fi
grep -c "self-check failed" "$OUT-plant/reduce.txt" | sed 's/^/the gate refused the plant; lines naming the failed self-check: /'
