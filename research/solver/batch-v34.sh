#!/bin/bash
# V3 AND V4 ON THE PORTED CODE (EXPLORATORY, the tuning seed 7002; STATE.md D20, D23, D24; section 6's next action). Every
# unit of v3-convergence.mjs and v4-ensemble.mjs, four at a time: first a canary of each kind (a V4 unit in probability, a
# V4 unit without the RS split, the one-pot ladder, one of S224's rungs), so a fault in any kind shows within minutes; then
# the costliest first, so the tail is short. A unit whose output exists from this code is kept, so after a stop the same
# command relaunches with RESUME=1 and runs only what is left. Through the launcher, on frozen code:
#   PREDICTION="none:V3 and V4, exploratory, the tuning seed" research/solver/run-from-snapshot.sh bash research/solver/batch-v34.sh
# DRY=1 prints the units in order and runs nothing. Logs: research/solver/results/v34-logs/<unit>.log; the units in results/v3 and results/v4. Read with
#   node research/solver/v3-convergence.mjs --read; node research/solver/v4-ensemble.mjs --read
set -u
cd "$(dirname "$0")/../.."
CODE=$(node research/solver/code-id.mjs)
LOG=research/solver/results/v34-logs
mkdir -p "$LOG"
if [ "${RESUME:-0}" != 1 ] && ls research/solver/results/v3/*.gz research/solver/results/v4/*.gz >/dev/null 2>&1; then
  echo "batch-v34: units already in results/v3 or results/v4; relaunch with RESUME=1 to keep those from this code" >&2; exit 1
fi
echo "batch-v34: code $CODE, started $(TZ=Europe/London date '+%d %b %H:%M %Z'), $(nproc) cores"
# the units still to run, in order: each line "<script> <args>" (V4's in-probability units carry SOLVER_INTERP)
TODO=$(CODE="$CODE" node --input-type=module -e "
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { UNITS as U3, unitFile as f3 } from './research/solver/v3-convergence.mjs';
import { UNITS as U4, unitFile as f4 } from './research/solver/v4-ensemble.mjs';
const done = f => { if (!existsSync(f)) return false; const t = f.endsWith('.gz') ? gunzipSync(readFileSync(f)).toString() : readFileSync(f, 'utf8'); return JSON.parse(t).code === process.env.CODE; };
const cost = u => { const p = /\bp(\d+)\b/.exec(u), l = /^ladder \S+ (\d+)/.exec(u); if (l) return Number(l[1]) / 9 + (u.includes('CAND') ? 3 : 1); if (u === 'onepot') return 0.5; if (p) return Number(p[1]) / 10; if (/ (w5|s10|q9) /.test(u)) return 4; if (u.includes('SHIP')) return 1.5; return 3; };
const v3 = U3.filter(u => !done(f3(u))).map(u => ({ cmd: 'v3-convergence.mjs ' + u, c: cost(u), u }));
const v4 = U4.filter(u => !done(f4(u))).map(u => ({ cmd: (u.startsWith('SOLVER_INTERP') ? u.split(' ')[0] + ' ' : '') + 'v4-ensemble.mjs ' + u.split(' ').filter(x => !x.includes('=')).join(' '), c: 2.5 * (u.includes('SHIP') ? 0.5 : 1), u }));
const canary = ['SOLVER_INTERP=linear S002 CAND-lin 0.02', 'S002 CAND-noRS 0.02', 'onepot', 'ladder SHIP 30 0.02'];
const all = [...v3, ...v4], first = canary.map(c => all.find(x => x.u === c)).filter(Boolean);
const rest = all.filter(x => !first.includes(x)).sort((a, b) => b.c - a.c);
for (const x of [...first, ...rest]) console.log(x.cmd);
") || { echo "batch-v34: could not list the units" >&2; exit 1; }
N=$(printf '%s\n' "$TODO" | grep -c . || true)
echo "batch-v34: $N units to run"
[ "${DRY:-0}" = 1 ] && { printf '%s\n' "$TODO"; exit 0; }
[ "$N" -gt 0 ] || exit 0
printf '%s\n' "$TODO" | xargs -d '\n' -P 4 -I{} bash -c '
  line="$1"; name=$(printf "%s" "$line" | sed "s/SOLVER_INTERP=[a-z]* //; s/\.mjs//; s/ /_/g")
  s=$(date +%s)
  env $(printf "%s" "$line" | grep -o "^SOLVER_INTERP=[a-z]*") node research/solver/${line#SOLVER_INTERP=* } > "'"$LOG"'/$name.log" 2>&1
  rc=$?; [ $rc = 0 ] && st=done || st="FAILED (exit $rc)"
  echo "$(TZ=Europe/London date +%H:%M) $st $name $(( $(date +%s) - s )) s"
' _ {}
echo "batch-v34: finished $(TZ=Europe/London date '+%d %b %H:%M %Z')"
