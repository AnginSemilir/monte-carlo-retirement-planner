#!/bin/bash
# SPEED REVIEW (EXPLORATORY): the runs behind SPEED-REVIEW.md, printed with their commands. BASE is a copy of the code at
# 2d7cce3 or later with the engine built (research/engine.mjs); PROTO is the same copy with ../speed-prototype.diff
# applied (and no .git, so nothing run in it can touch a checkout). Each "before" runs beside its "after", one per core.
# LONG=1 adds S362 at 8 points and the 30-point solves (about an hour on two cores); without it, about 25 minutes.
# usage: BASE=/path/to/base PROTO=/path/to/proto [LONG=1] bash run-speed.sh > results-speed.txt
set -u
S=$(cd "$(dirname "$0")" && pwd)
T=$(mktemp -d)
pair() {  # pair "<env assignments>" <household> <arm>: BASE and PROTO side by side
  local e=$1; shift
  ( cd "$BASE" && env $e node "$S/speed-timing.mjs" "$@" 2>&1 | tail -1 > "$T/base" ) &
  ( cd "$PROTO" && env $e node "$S/speed-timing.mjs" "$@" 2>&1 | tail -1 > "$T/proto" ) &
  wait
  echo "\$ env $e node speed-timing.mjs $*    # BASE, then PROTO, side by side"
  cat "$T/base" "$T/proto"; echo
}
alone() { # alone "<env assignments>" <household> <arm>: PROTO alone; prints the result line, or the error a plant raises
  local e=$1; shift
  echo "\$ env $e node speed-timing.mjs $*    # PROTO"
  ( cd "$PROTO" && env $e node "$S/speed-timing.mjs" "$@" 2>&1 | grep -m1 '^Error\|^{' ); echo
}
echo "SPEED REVIEW, $(date '+%d %b %H:%M %Z'); node $(node --version); $(nproc) cores"; echo
echo "== 1. Identity and speed on small grids: the product's settings, the candidate's, joint worlds without the tier state"
pair "PTS=10 PATHS=200 CHECKPATHS=20" S224 SHIP
pair "PTS=8 PATHS=200 CHECKPATHS=20" S224 CAND
pair "PTS=6 PATHS=50" S224 JOINT
pair "PTS=6 PATHS=50 CHECKPATHS=10" S362 CAND
echo "== 2. Planted faults: each must change a hash (tableHash, layerHash or arefHash) or make the score check throw"
alone "MEMO=0 PTS=6 PATHS=0" S224 SHIP
alone "PTS=6 PATHS=0" S224 SHIP
alone "MEMOPLANT=nocls PTS=6 PATHS=0" S224 SHIP
alone "MEMO=0 PTS=6 PATHS=0" S224 CAND
alone "PTS=6 PATHS=0" S224 CAND
alone "MEMOPLANT=noworld PTS=6 PATHS=0" S224 CAND
alone "MEMOPLANT=arefnocls PTS=6 PATHS=0" S362 CAND
alone "CHOOSERPLANT=nocharge PTS=6 PATHS=20 CHECKPATHS=5" S224 SHIP
alone "CHOOSERPLANT=nocls PTS=6 PATHS=20 CHECKPATHS=5" S224 SHIP
echo "== 3. Finding 1, a used table's scratch: BASE, then PROTO (the check primes the scratch itself; it fails on both until"
echo "scoreMoves sizes its scratch to the state)"
echo "\$ node stale-check.mjs S224 6    # BASE"
( cd "$BASE" && node "$S/stale-check.mjs" S224 6 2>&1 | tail -1 ); echo
echo "\$ node stale-check.mjs S224 6    # PROTO"
( cd "$PROTO" && node "$S/stale-check.mjs" S224 6 2>&1 | tail -1 ); echo
if [ "${LONG:-0}" = 1 ]; then
  echo "== 4. The adaptive reference: S362 at 8 points, and its arrays with the memos off"
  pair "PTS=8 PATHS=0" S362 CAND
  alone "MEMO=0 PTS=8 PATHS=0" S362 CAND
  echo "== 5. 30 points"
  pair "PATHS=200" S224 SHIP
  pair "PATHS=100" S362 CAND
  pair "PATHS=100" S362 SHIP
fi
rm -rf "$T"
