#!/bin/bash
# AO (predictions/diag-ao.md): four jobs on four cores, seed 7002, 4,000 paths a world, into results/diagao: audit-ao.mjs's
# three S364 jobs (AO, ARS, CO; parts 0-2 of 3; P on ten times the paths on AO and ARS) and audit-an.mjs's A6 (AN_JOB=A6:
# NODE-AX's BO with the adaptive reference), read by reduce-ao.mjs in the real tree into results-ao.txt against NODE-AX's
# saved BO. Ten hours' timeout a job.
set -u
OUT=research/solver/results/diagao
rm -rf "$OUT"; mkdir -p "$OUT"
NJ=$(node research/solver/audit-ao.mjs --units | tail -1)
[ "$NJ" = 3 ] || { echo "AO: audit-ao.mjs names $NJ jobs, not 3"; exit 1; }
NA=$(AN_JOB=A6 node research/solver/audit-an.mjs --units | tail -1)
[ "$NA" = 1 ] || { echo "AO: audit-an.mjs names $NA jobs under AN_JOB=A6, not 1"; exit 1; }
printf '%s\n' 0 1 2 3 | xargs -P 4 -I{} sh -c '
  O=research/solver/results/diagao
  if [ {} = 3 ]; then AN_JOB=A6 DIAGAN_OUT=$O timeout 36000 node research/solver/audit-an.mjs 1 4000 part 0/1 7002 > $O/case3.txt 2>&1; echo "case3 exit $?" > $O/exit3
  else timeout 36000 node research/solver/audit-ao.mjs 1 4000 part {}/3 7002 > $O/case{}.txt 2>&1; echo "case{} exit $?" > $O/exit{}; fi'
cat "$OUT"/exit0 "$OUT"/exit1 "$OUT"/exit2 "$OUT"/exit3
grep -h "Error\|audit-ao:\|audit-an:" "$OUT"/case*.txt | head -5
grep -hE "solve CAND|adaptive |checks |refTail|runs " "$OUT"/case*.txt | cut -c1-220
echo "AO done $(TZ=Europe/London date +%H:%M) UK"
