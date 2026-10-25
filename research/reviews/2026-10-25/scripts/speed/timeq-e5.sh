#!/bin/bash
# items "<household> <points> <arm>": the speed checkout's solves, one after another on one core, each timed and hashed
D=/tmp/claude-0/-home-claude/66e527d8-211d-52e1-8ddb-d8152af1cc96/scratchpad/speed
cd /home/claude/speed3
for item in "$@"; do
  set -- $item; tag=$1-$2-$3${REALAT_NOCACHE:+-nocache}
  node $D/time-e5.mjs $1 $2 $3 > $D/time/$tag.json 2>&1 || { echo "FAILED $tag"; tail -3 $D/time/$tag.json; exit 1; }
  echo "== $tag: $(cut -c1-260 $D/time/$tag.json)"
done
echo "QUEUE DONE"
