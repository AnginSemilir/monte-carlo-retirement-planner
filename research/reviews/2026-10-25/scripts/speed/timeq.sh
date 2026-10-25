#!/bin/bash
# plain solve timings one after another on one core (no profiler): items "<household> <arm>"; the agent's code at 52b0b6c in /home/claude/pt-wt
D=/tmp/claude-0/-home-claude/66e527d8-211d-52e1-8ddb-d8152af1cc96/scratchpad/speed
cd /home/claude/pt-wt
for item in "$@"; do
  h=${item% *}; arm=${item##* }; tag=$(echo "$h-$arm" | tr ' ' '_')
  [ -f $D/time/$tag.json ] && { echo "-- $tag: there already"; continue; }
  node $D/prof-arm.mjs "$h" $arm > $D/time/$tag.out 2>&1 || { echo "FAILED $tag"; tail -3 $D/time/$tag.out; exit 1; }
  tail -1 $D/time/$tag.out > $D/time/$tag.json
  echo "== $tag: $(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1]));console.log(j.secs+" s, "+j.moves+" moves")' $D/time/$tag.json)"
done
echo "QUEUE DONE"
