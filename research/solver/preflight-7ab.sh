#!/bin/bash
# 7ab's preflight (a measurement, launched with PREDICTION="none:..."): the diag7ab mode on the final code, all ten units at
# 4 points and 20 paths, one after another, into results/diag7ab-preflight; preflight-parse-7ab.mjs then runs reduce-7ab.mjs's
# own parse() and gate() over them against 7aa's preflight units (results/diag7aa-preflight, the same sizes, 7aa's code):
# every unit parses, the gate refuses only the sizes, and every PRODUCT trace equals 7aa's preflight trace byte for byte.
# Then the band guard (PLAN.md bugs, 28 Sep): experiment.mjs select refuses a band file that exists and leaves it as it was;
# a planted copy without the guard does not refuse. No figure is read.
set -u
OUT=research/solver/results/diag7ab-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
for k in $(seq 0 9); do
  DIAG7AB_OUT="$OUT" node research/solver/audit-s126.mjs diag7ab 4 20 part $k/10 7002 > "$OUT/case$k.txt" 2>&1 || echo "unit $k failed"
done
node research/solver/preflight-parse-7ab.mjs "$OUT" research/solver/results/diag7aa-preflight
# the band guard, on a dummy band no run reads (band-1-2-3.json), never the real one
B=research/solver/results/band-1-2-3.json
if [ -e "$B" ]; then echo "BAND GUARD CHECK FAILED: $B exists already; not touched"; exit 1; fi
echo '[{"i":0,"id":"DUMMY","name":"a dummy band for the guard check","s":1}]' > "$B"
M0=$(md5sum "$B" | cut -c1-32)
node research/solver/experiment.mjs select 1 2 3 > "$OUT/guard.txt" 2>&1; RC=$?
M1=$(md5sum "$B" | cut -c1-32)
sed '/^  if (existsSync(bandOut))/d' research/solver/experiment.mjs > research/solver/zz-exp-noguard.mjs
timeout 20 node research/solver/zz-exp-noguard.mjs select 1 2 3 > "$OUT/guard-planted.txt" 2>&1; RP=$?
rm -f research/solver/zz-exp-noguard.mjs "$B"
if [ "$RC" -eq 2 ] && grep -q "select: refused" "$OUT/guard.txt" && [ "$M0" = "$M1" ] && ! grep -q "select: refused" "$OUT/guard-planted.txt"; then
  echo "BAND GUARD PASSED: select refused the existing band (exit $RC) and left it unchanged; the planted copy without the guard did not refuse (exit $RP)"
else
  echo "BAND GUARD CHECK FAILED: exit $RC, band unchanged $([ "$M0" = "$M1" ] && echo yes || echo NO), planted exit $RP"; exit 1
fi
