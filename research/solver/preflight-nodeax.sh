#!/bin/bash
# NODE-AX's preflight (predictions/diag-nodeax.md): on the tuning seed 7002, the jobs' wealth points divided by 15 (4 points),
# 40 paths a world, nothing read as a figure.
#   A. the reducer's planted checks (reduce-nodeax.mjs --planted);
#   B. the audit's two jobs, both at once, through the reducer's gate in --preflight mode (NODE-1's records are not read
#      at these settings), with THE ARM'S REACH (O153) and each job's solve and ledger seconds; the two jobs' logs and files
#      kept in research/solver/results/nodeax-preflight/ (the derivation's record of the per-path spread);
#   C. the audit's three plants, each of which must make it refuse (exit 3): arm (BN without its nodes: armTook fails),
#      cash (the backups at a sheltered cash of 0: nodeTook fails), read (the projection read without the reader's p at
#      the query: readTook fails).
set -u
OUT=${TMPDIR:-/tmp}/nodeax-preflight.$$
KEEP=research/solver/results/nodeax-preflight
mkdir -p "$OUT" "$KEEP"
echo "A. $(node research/solver/reduce-nodeax.mjs --planted | grep -E '^planted|^EDGES' | tr '\n' ' ')"
printf '%s\n' 0 1 | xargs -P 2 -I{} sh -c "DIAGNODEAX_OUT=$OUT node research/solver/audit-nodeax.mjs 15 40 part {}/2 7002 > $OUT/case{}.txt 2>&1 || echo 'B. job {} exited'"
echo "B. $(node research/solver/reduce-nodeax.mjs "$OUT" 40 15 --preflight | grep -E "^GATE|^ARM'S REACH|^REFUSED|^PREFLIGHT|^  " | tr '\n' ' ')"
echo "B. solve seconds by job: $(grep -h 'solve CAND' $OUT/case*.txt | sed -E 's/.*solve CAND ([^:]+): .* secs ([0-9]+)/\1 \2/' | tr '\n' ';')"
echo "B. ledger seconds by job: $(grep -h 'ownTook' $OUT/case*.txt | sed -E 's/.*checks ([^:]+): .* secs ([0-9]+)/\1 \2/' | tr '\n' ';')"
for f in $OUT/case0.txt $OUT/case1.txt $OUT/*.json.gz; do cp "$f" "$KEEP/"; done
printf '%s\n' arm:0 cash:1 read:1 | xargs -P 3 -I{} sh -c 'pj={}; p=${pj%%:*}; DIAGNODEAX_OUT='"$OUT"'/plant-$p NODEAX_PLANT=$p node research/solver/audit-nodeax.mjs 15 40 part ${pj##*:}/2 7002 > '"$OUT"'/plant-$p.txt 2>&1; echo "$p $?" > '"$OUT"'/plant-$p.code'
fail=0
for p in arm cash read; do
  code=$(cut -d' ' -f2 "$OUT/plant-$p.code")
  if [ "$code" = 3 ]; then echo "C. the plant $p: refused (exit 3; $(grep -E 'audit-nodeax:' "$OUT/plant-$p.txt" | head -1))"
  else echo "C. the plant $p: NOT refused (exit $code)"; fail=1; fi
done
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
exit $fail
