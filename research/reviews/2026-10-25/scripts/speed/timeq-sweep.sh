#!/bin/bash
# items "<household> <points> <arm> [a tag for a repeat]": the speed checkout's solves, one after another on one core, each timed and hashed, into
# time7/. Arms PRODUCT and PRODUCTGFN go to prod-time.mjs (the product at 30 points), the rest to time-e5.mjs. Each item is
# started only if it can finish before the deadline (DEADLINE, seconds since the epoch; each item's guess GUESS seconds).
D=/tmp/claude-0/-home-claude/66e527d8-211d-52e1-8ddb-d8152af1cc96/scratchpad/speed
cd /home/claude/speed3
for item in "$@"; do
  set -- $item; tag=$1-$2-$3${4:+-$4}
  [ -f $D/time7/$tag.json ] && grep -q '^{' $D/time7/$tag.json && { echo "-- $tag: there already"; continue; }
  if [ -n "${DEADLINE:-}" ] && [ $(( $(date +%s) + ${GUESS:-700} )) -gt $DEADLINE ]; then echo "STOPPED before $tag (the deadline)"; exit 0; fi
  if [ "$3" = PRODUCT ] || [ "$3" = PRODUCTGFN ]; then node $D/prod-time.mjs $1 $3 > $D/time7/$tag.json 2>&1
  else node $D/time-e5.mjs $1 $2 $3 > $D/time7/$tag.json 2>&1; fi || { echo "FAILED $tag"; tail -3 $D/time7/$tag.json; exit 1; }
  echo "== $tag: $(cut -c1-260 $D/time7/$tag.json)"
done
echo "QUEUE DONE"
