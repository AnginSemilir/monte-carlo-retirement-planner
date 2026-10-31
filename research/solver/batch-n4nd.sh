#!/bin/bash
# THE TABLE WITHOUT THE DEALING COST, CHECKED (EXPLORATORY, the tuning seed 7002; STATE.md D30, SPEED-PORT.md step 3; its
# decision rule in n4-menu.mjs's header, committed before launch): first step 2.1's two identity units (n4-menu.mjs --nd-id:
# CAND+HR+T3 on this code, to results/n4nd-id, read against the factorial's), so they share the ND units' code; then the 14
# units of n4-menu.mjs --units-nd (CAND+HR+T3 with tableDealing false, E5 on, on V3's seven households at both weights, 45
# points), four at a time, the bridge households (S362, S370) first. The first arm is the factorial's CAND+HR+T3 units
# (results/n4t3), which stand when the identity units reproduce them bit for bit. A unit whose output exists
# from this code is kept, so after a stop the same command relaunches with RESUME=1. Through the launcher, on frozen code:
#   PREDICTION="none:the table without the dealing cost, checked, exploratory (D30)" research/solver/run-from-snapshot.sh bash research/solver/batch-n4nd.sh
# DRY=1 prints the units in order and runs nothing. Logs: research/solver/results/n4nd-logs/<unit>.log; the units in
# results/n4nd. Read: node research/solver/n4-menu.mjs --read-nd > research/solver/results-n4nd.txt
set -u
cd "$(dirname "$0")/../.."
CODE=$(node research/solver/code-id.mjs)
LOG=research/solver/results/n4nd-logs
mkdir -p "$LOG"
if [ "${RESUME:-0}" != 1 ] && ls research/solver/results/n4nd/*.gz >/dev/null 2>&1; then
  echo "batch-n4nd: units already in results/n4nd; relaunch with RESUME=1 to keep those from this code" >&2; exit 1
fi
echo "batch-n4nd: code $CODE, started $(TZ=Europe/London date '+%d %b %H:%M %Z'), $(nproc) cores"
TODO=$(CODE="$CODE" node --input-type=module -e "
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { ND_UNITS, ndUnitFile } from './research/solver/n4-menu.mjs';
const done = f => existsSync(f) && JSON.parse(gunzipSync(readFileSync(f)).toString()).code === process.env.CODE;
const ids = [['S370', '0.02'], ['S224', '0.01']].filter(([id, w]) => !done(\`research/solver/results/n4nd-id/\${id}-CAND+HR+T3-w\${w}.json.gz\`)).map(([id, w]) => \`--nd-id \${id} \${w}\`);
const todo = ND_UNITS.filter(u => !done(ndUnitFile(u))).sort((a, b) => (/^S3(62|70)/.test(b) ? 1 : 0) - (/^S3(62|70)/.test(a) ? 1 : 0)).map(u => \`--nd \${u}\`);
for (const u of [...ids, ...todo]) console.log(u);
") || { echo "batch-n4nd: could not list the units" >&2; exit 1; }
N=$(printf '%s\n' "$TODO" | grep -c . || true)
echo "batch-n4nd: $N units to run (the identity units first)"
[ "${DRY:-0}" = 1 ] && { printf '%s\n' "$TODO"; exit 0; }
[ "$N" -gt 0 ] || exit 0
printf '%s\n' "$TODO" | xargs -d '\n' -P 4 -I{} bash -c '
  line="$1"; name=$(printf "%s" "$line" | sed "s/^--//; s/ /_/g")
  s=$(date +%s)
  node research/solver/n4-menu.mjs $line > "'"$LOG"'/$name.log" 2>&1
  rc=$?; [ $rc = 0 ] && st=done || st="FAILED (exit $rc)"
  echo "$(TZ=Europe/London date +%H:%M) $st $name $(( $(date +%s) - s )) s"
' _ {}
echo "batch-n4nd: finished $(TZ=Europe/London date '+%d %b %H:%M %Z')"
