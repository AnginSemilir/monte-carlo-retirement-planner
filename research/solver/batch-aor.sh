#!/bin/bash
# AOR (predictions/diag-aor.md): three jobs on three cores, seed 7002, 4,000 paths a world, into results/diagaor:
# audit-aor.mjs's AOP and ARS on S364 (parts 0-1 of 2) and audit-an.mjs's A6RS (AN_JOB=A6RS: A6 under the RS split), read by
# reduce-aor.mjs in the real tree into results-aor.txt against AO's and A6's saved files. Ten hours' timeout a job.
set -u
OUT=research/solver/results/diagaor
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-aor.mjs --units | tail -1)
[ "$NJ" = 2 ] || { echo "AOR: audit-aor.mjs names $NJ jobs, not 2"; exit 1; }
NA=$(AN_JOB=A6RS node research/solver/audit-an.mjs --units | tail -1)
[ "$NA" = 1 ] || { echo "AOR: audit-an.mjs names $NA jobs under AN_JOB=A6RS, not 1"; exit 1; }
printf '%s\n' 0 1 2 | xargs -P 3 -I{} sh -c '
  O=research/solver/results/diagaor
  if [ {} = 2 ]; then AN_JOB=A6RS DIAGAN_OUT=$O timeout 36000 node research/solver/audit-an.mjs 1 4000 part 0/1 7002 > $O/case2.txt 2>&1; echo "case2 exit $?" > $O/exit2
  else timeout 36000 node research/solver/audit-aor.mjs 1 4000 part {}/2 7002 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}; fi'
cat "$OUT"/exit0 "$OUT"/exit1 "$OUT"/exit2
grep -h "Error\|audit-aor:\|audit-an:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|adaptive |checks |refTail|runs " "$OUT"/case*.txt | cut -c1-220
echo "AOR done $(TZ=Europe/London date +%H:%M) UK"
