#!/usr/bin/env bash
# THE F1 V2 TEST (PLAN.md 7c; predictions/f1v2-test.md): off against v2, paired, on the step-6 defaults in the mixture
# (`audit-s126.mjs f1v2`, which solves through solvePlan, the product's entry). Twenty-one cases - the twelve S126
# variants, S120 S122 S124 S128 S130 S360 S366 S370, and bridge 4 with a 30k one-off cost in its year 2 (added before any
# run, maintainer 14:05 UK) - split four ways (every fourth case from the k-th), 16 points, 1,000 held
# paths (seed 7002, the F1 test's). Each part's log goes to results/f1v2/part-k.txt (results/ is the real tree's, through
# the launcher's link); log.txt is the four joined. It is copied verbatim to research/solver/results-f1v2.txt to be
# committed, and read by read-f1v2.mjs (which finds each case by its name, so the order does not matter).
set -u
OUT=research/solver/results/f1v2
mkdir -p "$OUT"
printf '0\n1\n2\n3\n' | xargs -P 4 -I{} sh -c 'timeout 10800 node research/solver/audit-s126.mjs f1v2 16 1000 part {}/4 > research/solver/results/f1v2/part-{}.txt 2>&1; echo "part {} exit $?"'
cat "$OUT"/part-0.txt "$OUT"/part-1.txt "$OUT"/part-2.txt "$OUT"/part-3.txt > "$OUT"/log.txt
node research/solver/read-f1v2.mjs "$OUT"/log.txt
