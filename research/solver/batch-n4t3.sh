#!/bin/bash
# THE THIRD TIER STEP'S FACTORIAL (EXPLORATORY, the tuning seed 7002; STATE.md D28, THIRD-STEP.md step 3; its decision rule in
# n4-menu.mjs's header, committed before launch): the 56 units of n4-menu.mjs --units-t3 (V3's seven households, both
# weights; CAND, CAND+HR, CAND+T3, CAND+HR+T3 at 45 points), four at a time: first a canary of each arm on S002 (the cheapest
# household), so a fault in an arm shows within minutes; then the costliest first (HR+T3 about 3 times CAND's solve, HR and
# T3 about 1.6 times, the bridge households S362 and S370 about twice the others), so the tail is short. A unit whose output
# exists from this code is kept, so after a stop the same command relaunches with RESUME=1. Through the launcher, on
# frozen code:
#   PREDICTION="none:the third tier step's factorial, exploratory (D28)" research/solver/run-from-snapshot.sh bash research/solver/batch-n4t3.sh
# DRY=1 prints the units in order and runs nothing. Logs: research/solver/results/n4t3-logs/<unit>.log; the units in
# results/n4t3. Read: node research/solver/n4-menu.mjs --read-t3 > research/solver/results-n4t3.txt
set -u
cd "$(dirname "$0")/../.."
CODE=$(node research/solver/code-id.mjs)
LOG=research/solver/results/n4t3-logs
mkdir -p "$LOG"
if [ "${RESUME:-0}" != 1 ] && ls research/solver/results/n4t3/*.gz >/dev/null 2>&1; then
  echo "batch-n4t3: units already in results/n4t3; relaunch with RESUME=1 to keep those from this code" >&2; exit 1
fi
echo "batch-n4t3: code $CODE, started $(TZ=Europe/London date '+%d %b %H:%M %Z'), $(nproc) cores"
TODO=$(CODE="$CODE" node --input-type=module -e "
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { T3_UNITS, t3UnitFile } from './research/solver/n4-menu.mjs';
const done = f => existsSync(f) && JSON.parse(gunzipSync(readFileSync(f)).toString()).code === process.env.CODE;
const cost = u => ({ CAND: 1, 'CAND+HR': 1.6, 'CAND+T3': 1.6, 'CAND+HR+T3': 3 })[u.split(' ')[1]] * (/^S3(62|70)/.test(u) ? 2 : 1);
const todo = T3_UNITS.filter(u => !done(t3UnitFile(u)));
const canary = ['S002 CAND+HR+T3 0.02', 'S002 CAND+T3 0.02', 'S002 CAND+HR 0.02', 'S002 CAND 0.02'].filter(u => todo.includes(u));
const rest = todo.filter(u => !canary.includes(u)).sort((a, b) => cost(b) - cost(a));
for (const u of [...canary, ...rest]) console.log(u);
") || { echo "batch-n4t3: could not list the units" >&2; exit 1; }
N=$(printf '%s\n' "$TODO" | grep -c . || true)
echo "batch-n4t3: $N units to run"
[ "${DRY:-0}" = 1 ] && { printf '%s\n' "$TODO"; exit 0; }
[ "$N" -gt 0 ] || exit 0
printf '%s\n' "$TODO" | xargs -d '\n' -P 4 -I{} bash -c '
  line="$1"; name=$(printf "%s" "$line" | sed "s/ /_/g")
  s=$(date +%s)
  node research/solver/n4-menu.mjs --t3 $line > "'"$LOG"'/$name.log" 2>&1
  rc=$?; [ $rc = 0 ] && st=done || st="FAILED (exit $rc)"
  echo "$(TZ=Europe/London date +%H:%M) $st $name $(( $(date +%s) - s )) s"
' _ {}
echo "batch-n4t3: finished $(TZ=Europe/London date '+%d %b %H:%M %Z')"
