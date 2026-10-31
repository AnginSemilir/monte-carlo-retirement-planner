#!/bin/bash
# NE-GRID C's preflight (predictions/diag-negrid-c.md): on the tuning seed 7002, every job's wealth points divided by 30
# (4 points at the least), its shares and return nodes as registered, nothing read as a figure.
#   A. the reducer's planted checks (reduce-negrid-c.mjs --planted);
#   B. the audit's twelve jobs at 40 paths a world (P at 160 where registered), four at once, through the reducer's gate in
#      --preflight mode (B1's records are not read at these grids), with each job's solve seconds;
#   C. the audit's three plants on S364's ORDER job, each of which must make it refuse (exit 3): arm (run without its
#      reference, so armTook fails), pair (D a tier step off, so pairTook fails) and force (another opening forced as CAND's
#      own, so forceIdentity fails); and two on the amendment's jobs: floor (S224's floor-free job run with its floor) and
#      line (S364's line job run at the default line), each of which armTook must refuse.
set -u
OUT=${TMPDIR:-/tmp}/negridc-preflight.$$
mkdir -p "$OUT"
echo "A. $(node research/solver/reduce-negrid-c.mjs --planted | grep -E '^planted|^EDGES' | tr '\n' ' ')"
seq 0 11 | xargs -P 4 -I{} sh -c "DIAGNEGRIDC_OUT=$OUT node research/solver/audit-negridc.mjs 30 40 part {}/12 7002 > $OUT/case{}.txt 2>&1 || echo 'B. job {} exited'"
echo "B. $(node research/solver/reduce-negrid-c.mjs "$OUT" 40 30 --preflight | grep -E '^GATE|^PREFLIGHT|^  ' | tr '\n' ' ')"
echo "B. solve seconds by job: $(grep -h 'solve CAND' $OUT/case*.txt | sed -E 's/.*solve CAND ([^:]+): .* secs ([0-9]+)/\1 \2/' | tr '\n' ';')"
for pj in arm:11 pair:11 force:11 floor:2 line:10; do
  p=${pj%%:*}
  DIAGNEGRIDC_OUT="$OUT/plant-$p" NEGRIDC_PLANT=$p node research/solver/audit-negridc.mjs 30 40 part ${pj##*:}/12 7002 > "$OUT/plant-$p.txt" 2>&1
  code=$?
  if [ "$code" = 3 ]; then echo "C. the plant $p: refused (exit 3; $(grep -E 'audit-negridc:' "$OUT/plant-$p.txt" | head -1))"
  else echo "C. the plant $p: NOT refused (exit $code)"; exit 1; fi
done
echo "preflight done $(TZ=Europe/London date +%H:%M) UK"
