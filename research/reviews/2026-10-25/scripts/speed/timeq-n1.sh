#!/bin/bash
D=/tmp/claude-0/-home-claude/66e527d8-211d-52e1-8ddb-d8152af1cc96/scratchpad/speed
cd /home/claude/speed3
for h in "$@"; do node $D/time-n1.mjs $h > $D/time/$h-HRT3-N1.json 2>&1 || { echo "FAILED $h"; tail -3 $D/time/$h-HRT3-N1.json; exit 1; }; echo "== $h HRT3-N1: $(cut -c1-200 $D/time/$h-HRT3-N1.json)"; done
echo "QUEUE DONE"
