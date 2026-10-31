#!/bin/bash
# THE SPEED REVIEW'S INSTRUCTION 5, THE RE-TIME (EXPLORATORY; STATE.md D24): BASE (a copy of the code before the port) beside
# PORT (a copy of the ported code), on S224 and S362 at 30 points under SHIP and the candidate, with nothing else running.
# Each pair runs side by side, one process a core, and the pairs one after another; the paths as the review ran them (200
# on S224, 100 on S362). Compare the ratios with the review's table, not the absolute times. Each copy needs the engine
# built (research/engine.mjs) and its own e3pcls pin current. retime-port.mjs reads the output against the pass mark.
# usage: BASE=/path/to/base PORT=/path/to/port bash research/solver/retime-port.sh > research/solver/results-retime-port.txt
set -u
S=$(cd "$(dirname "$0")" && pwd)/speed-timing.mjs
T=$(mktemp -d)
echo "RE-TIME, $(TZ=Europe/London date '+%d %b %H:%M %Z'); node $(node --version); $(nproc) cores; BASE $(git -C "$BASE" rev-parse --short HEAD), PORT $(git -C "$PORT" rev-parse --short HEAD)"
echo
pair() {  # pair "<env assignments>" <household> <arm>: BASE and PORT side by side
  local e=$1; shift
  ( cd "$BASE" && env $e node "$S" "$@" 2>&1 | tail -1 > "$T/base" ) &
  ( cd "$PORT" && env $e node "$S" "$@" 2>&1 | tail -1 > "$T/port" ) &
  wait
  echo "\$ env $e node speed-timing.mjs $*    # BASE, then PORT, side by side"
  cat "$T/base" "$T/port"; echo
}
pair "PATHS=200" S224 SHIP
pair "PATHS=200" S224 CAND
pair "PATHS=100" S362 SHIP
pair "PATHS=100" S362 CAND
rm -rf "$T"
