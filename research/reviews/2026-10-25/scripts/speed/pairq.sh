#!/bin/bash
# the product with and without E10, side by side on the two cores (started together), one household at a time, into pair/
D=/tmp/claude-0/-home-claude/66e527d8-211d-52e1-8ddb-d8152af1cc96/scratchpad/speed
cd /home/claude/speed3
for h in "$@"; do
  node $D/prod-time.mjs $h PRODUCT > $D/pair/$h-PRODUCT.json 2>&1 & p1=$!
  node $D/prod-time.mjs $h PRODUCTGFN > $D/pair/$h-PRODUCTGFN.json 2>&1 & p2=$!
  wait $p1 $p2
  echo "== $h: $(tail -1 $D/pair/$h-PRODUCT.json | cut -c1-140) | $(tail -1 $D/pair/$h-PRODUCTGFN.json | cut -c1-140)"
done
echo "PAIRS DONE $(TZ=Europe/London date +%H:%M)"
