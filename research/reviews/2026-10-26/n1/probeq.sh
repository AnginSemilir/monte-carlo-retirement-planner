#!/bin/bash
# items "<household> <CAND|NOREADER>": N1's assessment units one after another on one core, deadline-aware (DEADLINE, GUESS)
N=/tmp/claude-0/-home-claude/66e527d8-211d-52e1-8ddb-d8152af1cc96/scratchpad/n1
cd /home/claude/latest
for item in "$@"; do
  set -- $item; tag=$1-$2
  [ -f $N/probe/$tag.json ] && { echo "-- $tag: there already"; continue; }
  if [ -n "${DEADLINE:-}" ] && [ $(( $(date +%s) + ${GUESS:-1500} )) -gt $DEADLINE ]; then echo "STOPPED before $tag (the deadline)"; exit 0; fi
  node $N/reader-probe.mjs $1 $2 $N/probe/$tag.json 8000 > $N/probe/$tag.log 2>&1 || { echo "FAILED $tag"; tail -4 $N/probe/$tag.log; continue; }
  echo "== $(TZ=Europe/London date +%H:%M) $(tail -1 $N/probe/$tag.log | cut -c1-330)"
done
echo "QUEUE DONE $(TZ=Europe/London date +%H:%M)"
