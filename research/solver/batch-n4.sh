#!/bin/bash
# N4 THROUGH V4'S ENSEMBLE AT 45 WEALTH POINTS (EXPLORATORY, the tuning seed 7002; STATE.md D22, D25; n4-design.md). Every unit of
# n4-menu.mjs, four at a time: first a canary of each kind on S002 (the cheapest household), so a fault in any kind shows
# within minutes; then the costliest first (the largest menu first), so the tail is short. A unit whose output exists from
# this code is kept, so after a stop the same command relaunches with RESUME=1 and runs only what is left. Through the
# launcher, on frozen code:
#   PREDICTION="none:N4, exploratory, the tuning seed" research/solver/run-from-snapshot.sh bash research/solver/batch-n4.sh
# DRY=1 prints the units in order and runs nothing. Logs: research/solver/results/n4-logs/<unit>.log; the units in
# results/n4. Read with: node research/solver/n4-menu.mjs --read
set -u
cd "$(dirname "$0")/../.."
CODE=$(node research/solver/code-id.mjs)
LOG=research/solver/results/n4-logs
mkdir -p "$LOG"
if [ "${RESUME:-0}" != 1 ] && ls research/solver/results/n4/*.gz >/dev/null 2>&1; then
  echo "batch-n4: units already in results/n4; relaunch with RESUME=1 to keep those from this code" >&2; exit 1
fi
echo "batch-n4: code $CODE, started $(TZ=Europe/London date '+%d %b %H:%M %Z'), $(nproc) cores"
TODO=$(CODE="$CODE" node --input-type=module -e "
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { UNITS, unitFile } from './research/solver/n4-menu.mjs';
const done = f => existsSync(f) && JSON.parse(gunzipSync(readFileSync(f)).toString()).code === process.env.CODE;
// the cost by the menu's size (24, 40, 60 and 48 moves) and the household (the bridge households build a reference)
const cost = u => ({ CAND: 24, 'CAND+HR': 40, 'CAND+MID': 60, 'CAND+CGT': 48 })[u.split(' ')[1]] * (/^S3(62|70)/.test(u) ? 2 : 1);
const todo = UNITS.filter(u => !done(unitFile(u)));
const canary = ['S002 CAND+HR 0.02', 'S002 CAND+MID 0.02', 'S002 CAND+CGT 0.02', 'S002 CAND 0.02'].filter(u => todo.includes(u));
const rest = todo.filter(u => !canary.includes(u)).sort((a, b) => cost(b) - cost(a));
for (const u of [...canary, ...rest]) console.log(u);
") || { echo "batch-n4: could not list the units" >&2; exit 1; }
N=$(printf '%s\n' "$TODO" | grep -c . || true)
echo "batch-n4: $N units to run"
[ "${DRY:-0}" = 1 ] && { printf '%s\n' "$TODO"; exit 0; }
[ "$N" -gt 0 ] || exit 0
printf '%s\n' "$TODO" | xargs -d '\n' -P 4 -I{} bash -c '
  line="$1"; name=$(printf "%s" "$line" | sed "s/ /_/g")
  s=$(date +%s)
  node research/solver/n4-menu.mjs $line > "'"$LOG"'/$name.log" 2>&1
  rc=$?; [ $rc = 0 ] && st=done || st="FAILED (exit $rc)"
  echo "$(TZ=Europe/London date +%H:%M) $st $name $(( $(date +%s) - s )) s"
' _ {}
echo "batch-n4: finished $(TZ=Europe/London date '+%d %b %H:%M %Z')"
