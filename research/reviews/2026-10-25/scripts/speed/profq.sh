#!/bin/bash
# speed profiles one after another on one core (the agent's code at 52b0b6c, unpatched, in /home/claude/pt-wt): items "<household> <arm>"
D=/tmp/claude-0/-home-claude/66e527d8-211d-52e1-8ddb-d8152af1cc96/scratchpad/speed
cd /home/claude/pt-wt
for item in "$@"; do
  h=${item% *}; arm=${item##* }; tag=$(echo "$h-$arm" | tr ' ' '_')
  [ -f $D/prof/$tag.json ] && { echo "-- $tag: there already"; continue; }
  a=$(date +%s)
  SOLVER_PROFILE=1 node --cpu-prof --cpu-prof-dir=$D/prof/$tag.cpu $D/prof-arm.mjs "$h" $arm > $D/prof/$tag.out 2>&1 || { echo "FAILED $tag"; tail -3 $D/prof/$tag.out; exit 1; }
  tail -1 $D/prof/$tag.out > $D/prof/$tag.json
  echo "== $tag: $(( $(date +%s) - a )) s"; cut -c1-400 $D/prof/$tag.json
done
echo "QUEUE DONE"
