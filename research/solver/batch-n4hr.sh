#!/bin/bash
# N4'S HR DECOMPOSED (EXPLORATORY, the tuning seed 7002; STATE.md D27): the 16 units of n4-menu.mjs --units-hr (S370 and S248,
# both weights; CAND, CAND+HR, CAND+HRDRAW, CAND+HRWRAP at 45 points), four at a time, S370's first (the costlier). A unit
# whose output exists from this code is kept, so after a stop the same command relaunches with RESUME=1. Through the
# launcher, on frozen code:
#   PREDICTION="none:HR decomposed, exploratory (D27)" research/solver/run-from-snapshot.sh bash research/solver/batch-n4hr.sh
# Logs: research/solver/results/n4hr-logs/<unit>.log; the units in results/n4hr. Read: node research/solver/n4-menu.mjs --read-hr
set -u
cd "$(dirname "$0")/../.."
CODE=$(node research/solver/code-id.mjs)
LOG=research/solver/results/n4hr-logs
mkdir -p "$LOG"
if [ "${RESUME:-0}" != 1 ] && ls research/solver/results/n4hr/*.gz >/dev/null 2>&1; then
  echo "batch-n4hr: units already in results/n4hr; relaunch with RESUME=1 to keep those from this code" >&2; exit 1
fi
echo "batch-n4hr: code $CODE, started $(TZ=Europe/London date '+%d %b %H:%M %Z'), $(nproc) cores"
TODO=$(CODE="$CODE" node --input-type=module -e "
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { HR_UNITS, hrUnitFile } from './research/solver/n4-menu.mjs';
const done = f => existsSync(f) && JSON.parse(gunzipSync(readFileSync(f)).toString()).code === process.env.CODE;
const todo = HR_UNITS.filter(u => !done(hrUnitFile(u))).sort((a, b) => (b.startsWith('S370') ? 1 : 0) - (a.startsWith('S370') ? 1 : 0));
for (const u of todo) console.log(u);
") || { echo "batch-n4hr: could not list the units" >&2; exit 1; }
N=$(printf '%s\n' "$TODO" | grep -c . || true)
echo "batch-n4hr: $N units to run"
[ "${DRY:-0}" = 1 ] && { printf '%s\n' "$TODO"; exit 0; }
[ "$N" -gt 0 ] || exit 0
printf '%s\n' "$TODO" | xargs -d '\n' -P 4 -I{} bash -c '
  line="$1"; name=$(printf "%s" "$line" | sed "s/ /_/g")
  s=$(date +%s)
  node research/solver/n4-menu.mjs --hr $line > "'"$LOG"'/$name.log" 2>&1
  rc=$?; [ $rc = 0 ] && st=done || st="FAILED (exit $rc)"
  echo "$(TZ=Europe/London date +%H:%M) $st $name $(( $(date +%s) - s )) s"
' _ {}
echo "batch-n4hr: finished $(TZ=Europe/London date '+%d %b %H:%M %Z')"
