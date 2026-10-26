#!/bin/bash
# items "<household> <CAND|LADDER> [gain]": M15 v3's probe units one after another on one core, deadline-aware (DEADLINE, GUESS)
G=/tmp/claude-0/-home-claude/66e527d8-211d-52e1-8ddb-d8152af1cc96/scratchpad/gia
cd /home/claude/gia-wt
for item in "$@"; do
  set -- $item; tag=$1${3:+-g$(echo "$3*100" | bc | cut -d. -f1)}-$2
  [ -f $G/probe/$tag.json ] && { echo "-- $tag: there already"; continue; }
  if [ -n "${DEADLINE:-}" ] && [ $(( $(date +%s) + ${GUESS:-2400} )) -gt $DEADLINE ]; then echo "STOPPED before $tag (the deadline)"; exit 0; fi
  GAIN=${3:-0} node $G/gia-probe.mjs $1 $2 $G/probe/$tag.json 8000 > $G/probe/$tag.log 2>&1 || { echo "FAILED $tag"; tail -4 $G/probe/$tag.log; continue; }
  echo "== $(TZ=Europe/London date +%H:%M) $(tail -1 $G/probe/$tag.log | cut -c1-330)"
done
echo "QUEUE DONE $(TZ=Europe/London date +%H:%M)"
